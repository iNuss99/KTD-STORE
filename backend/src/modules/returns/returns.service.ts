import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReturnRequest } from './entities/return-request.entity';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../orders/entities/payment.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { UpdateReturnStatusDto } from './dto/update-return-status.dto';
import { ReturnStatus } from '../../common/enums/return.enum';
import { OrderStatus, PaymentStatus } from '../../common/enums/order.enum';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { SystemConfigsService, SYSTEM_CONFIG_KEYS } from '../system-configs/system-configs.service';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(ReturnRequest)
    private returnRepo: Repository<ReturnRequest>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    private dataSource: DataSource,
    private auditLogsService: AuditLogsService,
    private systemConfigsService: SystemConfigsService,
    @Optional() private eventEmitter?: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateReturnRequestDto): Promise<ReturnRequest> {
    const order = await this.orderRepo.findOne({
      where: { id: dto.order_id, user_id: userId },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Chỉ có thể yêu cầu đổi trả cho đơn hàng đã giao thành công (DELIVERED)');
    }

    // Check dynamic return days limit from system config
    const returnDaysLimit = await this.systemConfigsService.getNumber(
      SYSTEM_CONFIG_KEYS.RETURN_DAYS_LIMIT,
      7,
    );
    const deliveredAt = order.delivered_at || order.created_at;
    const expiryDate = new Date(deliveredAt.getTime() + returnDaysLimit * 24 * 60 * 60 * 1000);

    if (new Date() > expiryDate) {
      throw new BadRequestException(`Đã hết thời hạn đổi trả (${returnDaysLimit} ngày kể từ ngày nhận hàng)`);
    }

    // Check for existing active return request
    const existing = await this.returnRepo.findOne({
      where: {
        order_id: dto.order_id,
        status: Not(ReturnStatus.REJECTED),
      },
    });

    if (existing) {
      throw new BadRequestException('Đơn hàng này đã có yêu cầu đổi trả đang được xử lý');
    }

    const returnReq = this.returnRepo.create({
      order_id: dto.order_id,
      user_id: userId,
      reason: dto.reason,
      status: ReturnStatus.REQUESTED,
    });

    const saved = await this.returnRepo.save(returnReq);

    // Synchronize order status to RETURN_REQUESTED
    order.status = OrderStatus.RETURN_REQUESTED;
    await this.orderRepo.save(order);

    this.eventEmitter?.emit('return.requested', {
      returnId: saved.id,
      orderId: saved.order_id,
      userId,
    });

    this.eventEmitter?.emit('audit.log', {
      performedByUserId: userId,
      action: 'CREATE_RETURN_REQUEST',
      entity: 'ReturnRequest',
      entityId: saved.id,
      details: { orderId: saved.order_id, reason: saved.reason },
    });

    return saved;
  }

  async findAllMy(userId: string): Promise<ReturnRequest[]> {
    return this.returnRepo.find({
      where: { user_id: userId },
      relations: ['order', 'order.items', 'approved_by_user'],
      order: { created_at: 'DESC' },
    });
  }

  async findAllAdmin(status?: ReturnStatus): Promise<ReturnRequest[]> {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    return this.returnRepo.find({
      where,
      relations: ['order', 'order.items', 'user', 'approved_by_user'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, userId?: string): Promise<ReturnRequest> {
    const where: any = { id };
    if (userId) {
      where.user_id = userId;
    }

    const returnReq = await this.returnRepo.findOne({
      where,
      relations: ['order', 'order.items', 'user', 'approved_by_user'],
    });

    if (!returnReq) {
      throw new NotFoundException('Không tìm thấy yêu cầu đổi trả');
    }

    return returnReq;
  }

  async updateStatus(
    id: string,
    dto: UpdateReturnStatusDto,
    currentUser: any,
  ): Promise<ReturnRequest> {
    const adminUserId = currentUser?.id || currentUser;
    const returnReq = await this.findOne(id);
    const oldStatus = returnReq.status;
    const newStatus = dto.status;

    // Validate state machine: REQUESTED -> APPROVED/REJECTED -> RECEIVED -> REFUNDED
    const validTransitions: Record<ReturnStatus, ReturnStatus[]> = {
      [ReturnStatus.REQUESTED]: [ReturnStatus.APPROVED, ReturnStatus.REJECTED],
      [ReturnStatus.APPROVED]: [ReturnStatus.RECEIVED],
      [ReturnStatus.RECEIVED]: [ReturnStatus.REFUNDED],
      [ReturnStatus.REFUNDED]: [],
      [ReturnStatus.REJECTED]: [],
    };

    if (!validTransitions[oldStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái đổi trả từ ${oldStatus} sang ${newStatus}`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      returnReq.status = newStatus;
      returnReq.approved_by = adminUserId;
      if ([ReturnStatus.REFUNDED, ReturnStatus.REJECTED].includes(newStatus)) {
        returnReq.resolved_at = new Date();
      }

      await queryRunner.manager.save(returnReq);

      // If status transitions to RECEIVED -> restock inventory
      if (newStatus === ReturnStatus.RECEIVED) {
        const order = await queryRunner.manager.findOne(Order, {
          where: { id: returnReq.order_id },
          relations: ['items'],
        });

        if (order && order.items) {
          for (const item of order.items) {
            const variant = await queryRunner.manager.findOne(ProductVariant, {
              where: { id: item.variant_id },
              lock: { mode: 'pessimistic_write' },
            });
            if (variant) {
              variant.stock_quantity += item.quantity;
              await queryRunner.manager.save(variant);
            }
          }
        }
      }

      // If status transitions to REFUNDED -> update Payment status to REFUNDED
      if (newStatus === ReturnStatus.REFUNDED) {
        const payment = await queryRunner.manager.findOne(Payment, {
          where: { order_id: returnReq.order_id },
        });

        if (payment && payment.status === PaymentStatus.COMPLETED) {
          const order = await queryRunner.manager.findOne(Order, {
            where: { id: returnReq.order_id },
          });

          payment.status = PaymentStatus.REFUNDED;
          payment.refund_amount = order ? Number(order.total) : 0;
          payment.refunded_at = new Date();
          await queryRunner.manager.save(payment);

          if (order) {
            order.status = OrderStatus.RETURNED;
            await queryRunner.manager.save(order);
          }
        }
      }

      await queryRunner.commitTransaction();

      await this.auditLogsService.log(
        adminUserId,
        `UPDATE_RETURN_STATUS_${newStatus}`,
        'ReturnRequest',
        returnReq.id,
        { oldStatus, newStatus },
      );

      this.eventEmitter?.emit('return.updated', {
        returnId: returnReq.id,
        userId: returnReq.user_id,
        status: newStatus,
      });

      return this.findOne(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
