import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { Address } from '../addresses/entities/address.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Discount } from '../discounts/entities/discount.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../../common/enums/order.enum';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UserRole } from '../../common/enums/role.enum';
import { DiscountsService } from '../discounts/discounts.service';

import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(Address)
    private addressRepo: Repository<Address>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    private dataSource: DataSource,
    private auditLogsService: AuditLogsService,
    private discountsService: DiscountsService,
    @Optional() private eventEmitter?: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    // 1. Resolve Shipping Address Snapshot
    let shippingSnapshot: {
      receiver_name: string;
      phone: string;
      address_line: string;
      ward?: string;
      district?: string;
      province?: string;
    };

    if (dto.address_id) {
      const address = await this.addressRepo.findOne({
        where: { id: dto.address_id, user_id: userId },
      });
      if (!address) {
        throw new NotFoundException('Địa chỉ giao hàng không hợp lệ');
      }
      shippingSnapshot = {
        receiver_name: address.receiver_name,
        phone: address.phone,
        address_line: address.address_line,
        ward: address.ward,
        district: address.district,
        province: address.province,
      };
    } else if (dto.shipping_address) {
      shippingSnapshot = dto.shipping_address;
    } else {
      throw new BadRequestException('Vui lòng chọn hoặc nhập địa chỉ giao hàng');
    }

    // 2. Execute order placement in a single Transaction with Pessimistic Locking FOR UPDATE
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let itemsToOrder: { variant_id: string; quantity: number }[] = [];

      if (dto.items && dto.items.length > 0) {
        itemsToOrder = dto.items;
      } else {
        const cart = await queryRunner.manager.findOne(Cart, {
          where: { user_id: userId },
          relations: ['items'],
        });
        if (!cart || !cart.items || cart.items.length === 0) {
          throw new BadRequestException('Giỏ hàng của bạn đang trống');
        }
        itemsToOrder = cart.items.map((i) => ({
          variant_id: i.variant_id,
          quantity: i.quantity,
        }));
      }

      let subtotal = 0;
      const orderItems: OrderItem[] = [];

      for (const itemDto of itemsToOrder) {
        // Lock variant row with pessimistic_write without outer join relations (Postgres FOR UPDATE restriction on outer joins)
        const lockedVariant = await queryRunner.manager.findOne(ProductVariant, {
          where: { id: itemDto.variant_id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!lockedVariant || !lockedVariant.is_active) {
          throw new BadRequestException(`Sản phẩm (ID: ${itemDto.variant_id}) không khả dụng hoặc đã bị ẩn`);
        }

        const variant = await queryRunner.manager.findOne(ProductVariant, {
          where: { id: itemDto.variant_id },
          relations: ['product', 'size', 'color'],
        });

        if (!variant || !variant.product || !variant.product.is_active) {
          throw new BadRequestException(`Sản phẩm (ID: ${itemDto.variant_id}) không khả dụng hoặc đã bị ẩn`);
        }

        if (variant.stock_quantity < itemDto.quantity) {
          throw new BadRequestException(
            `Sản phẩm "${variant.product.name}" (${variant.size?.name || ''} - ${variant.color?.name || ''}) vừa hết hàng hoặc chỉ còn ${variant.stock_quantity} sản phẩm.`,
          );
        }

        // Deduct stock quantity inside transaction
        variant.stock_quantity -= itemDto.quantity;
        await queryRunner.manager.save(variant);

        const effectivePrice =
          variant.price_override != null
            ? Number(variant.price_override)
            : Number(variant.product.base_price);

        const itemSubtotal = effectivePrice * itemDto.quantity;
        subtotal += itemSubtotal;

        const orderItem = queryRunner.manager.create(OrderItem, {
          variant_id: variant.id,
          product_name: variant.product.name,
          sku: variant.sku,
          size_name: variant.size?.name || 'N/A',
          color_name: variant.color?.name || 'N/A',
          price: effectivePrice,
          quantity: itemDto.quantity,
        });

        orderItems.push(orderItem);
      }

      let discountAmount = 0;
      if (dto.discount_code) {
        const discountRes = await this.discountsService.validateAndCalculate(
          dto.discount_code,
          userId,
          itemsToOrder,
          queryRunner.manager,
        );
        discountAmount = discountRes.discount_amount;
        
        const updateDiscountResult = await queryRunner.manager
          .createQueryBuilder()
          .update(Discount)
          .set({ used_count: () => 'used_count + 1' })
          .where('id = :id AND (max_uses IS NULL OR used_count < max_uses)', {
            id: discountRes.discount.id,
          })
          .execute();

        if (updateDiscountResult.affected === 0) {
          throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
        }
      }

      const shippingFee = 0;
      const total = Math.max(0, subtotal + shippingFee - discountAmount);

      const order = queryRunner.manager.create(Order, {
        user_id: userId,
        status: OrderStatus.PENDING,
        subtotal,
        discount_amount: discountAmount,
        shipping_fee: shippingFee,
        total,
        shipping_snapshot: shippingSnapshot,
        note: dto.note,
        items: orderItems,
      });

      const savedOrder = await queryRunner.manager.save(order);

      const payment = queryRunner.manager.create(Payment, {
        order_id: savedOrder.id,
        method: dto.payment_method,
        status: PaymentStatus.PENDING,
      });
      await queryRunner.manager.save(payment);

      // Clear cart items
      const cart = await queryRunner.manager.findOne(Cart, { where: { user_id: userId } });
      if (cart) {
        await queryRunner.manager.delete(CartItem, { cart_id: cart.id });
      }

      await queryRunner.commitTransaction();

      if (this.eventEmitter) {
        this.eventEmitter.emit('order.created', {
          orderId: savedOrder.id,
          total: savedOrder.total,
        });
        this.eventEmitter.emit('audit.log', {
          performedByUserId: userId,
          action: 'CREATE_ORDER',
          entity: 'Order',
          entityId: savedOrder.id,
          details: { total: savedOrder.total, paymentMethod: dto.payment_method },
        });
      }

      return this.findOne(savedOrder.id);
    } catch (err: any) {
      console.error('[OrdersService.create error]:', err);
      if (queryRunner?.rollbackTransaction) {
        await queryRunner.rollbackTransaction();
      }
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllMyOrders(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { user_id: userId },
      relations: ['items', 'payments'],
      order: { created_at: 'DESC' },
    });
  }

  async findAllAdmin(status?: OrderStatus): Promise<Order[]> {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    return this.orderRepo.find({
      where,
      relations: ['items', 'payments', 'user'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, userId?: string): Promise<Order> {
    const where: any = { id };
    if (userId) {
      where.user_id = userId;
    }
    const order = await this.orderRepo.findOne({
      where,
      relations: ['items', 'items.variant', 'payments', 'payments.confirmed_user', 'user'],
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, performedUser?: any): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id },
        relations: ['items', 'payments'],
      });

      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }

      const currentStatus = order.status;
      const targetStatus = dto.status;

      const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
        [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
        [OrderStatus.PROCESSING]: [OrderStatus.SHIPPING],
        [OrderStatus.SHIPPING]: [OrderStatus.DELIVERED],
        [OrderStatus.DELIVERED]: [OrderStatus.RETURN_REQUESTED],
        [OrderStatus.RETURN_REQUESTED]: [OrderStatus.RETURNED, OrderStatus.DELIVERED],
        [OrderStatus.RETURNED]: [],
        [OrderStatus.CANCELLED]: [],
      };

      const isSequential = allowedTransitions[currentStatus]?.includes(targetStatus);
      const isSuperAdmin = performedUser?.role === UserRole.SUPER_ADMIN;

      if (!isSequential) {
        if (isSuperAdmin && dto.reason) {
          // Super Admin override allowed with reason
        } else {
          throw new BadRequestException(
            `Không thể chuyển trạng thái từ "${currentStatus}" sang "${targetStatus}".${isSuperAdmin ? ' Super Admin cần cung cấp lý do (reason) để can thiệp thủ công.' : ''}`,
          );
        }
      }

      order.status = targetStatus;

      if (targetStatus === OrderStatus.DELIVERED) {
        order.delivered_at = new Date();
      }

      await queryRunner.manager.save(order);

      // Restore stock on cancel
      if (targetStatus === OrderStatus.CANCELLED && order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.variant_id) {
            const variant = await queryRunner.manager.findOne(ProductVariant, {
              where: { id: item.variant_id },
            });
            if (variant) {
              variant.stock_quantity += item.quantity;
              await queryRunner.manager.save(variant);
            }
          }
        }
      }

      await queryRunner.commitTransaction();

      // Audit Log recording (best-effort, non-blocking)
      if (performedUser?.id) {
        try {
          if (!isSequential && isSuperAdmin) {
            await this.auditLogsService.log(
              performedUser.id,
              'OVERRIDE_ORDER_STATUS',
              'Order',
              id,
              { from_status: currentStatus, to_status: targetStatus, reason: dto.reason },
            );
          } else {
            await this.auditLogsService.log(
              performedUser.id,
              'UPDATE_ORDER_STATUS',
              'Order',
              id,
              { from_status: currentStatus, to_status: targetStatus },
            );
          }
        } catch (logErr) {
          console.warn('Failed to record audit log:', logErr);
        }
      }

      return this.findOne(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async confirmPayment(orderId: string, performedByUserId: string): Promise<Order> {
    const order = await this.findOne(orderId);
    let payment = order.payments && order.payments.length > 0 ? order.payments[0] : null;

    if (!payment) {
      payment = this.paymentRepo.create({
        order_id: orderId,
        method: PaymentMethod.COD,
        status: PaymentStatus.PENDING,
      });
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Đơn hàng đã được xác nhận thanh toán trước đó');
    }

    payment.status = PaymentStatus.COMPLETED;
    payment.confirmed_by = performedByUserId;
    payment.paid_at = new Date();

    const savedPayment = await this.paymentRepo.save(payment);

    await this.auditLogsService.log(
      performedByUserId,
      'CONFIRM_COD_PAYMENT',
      'Payment',
      savedPayment.id,
      { order_id: orderId, paid_at: savedPayment.paid_at },
    );

    return this.findOne(orderId);
  }

  async processSandboxPayment(orderId: string, action: 'SUCCESS' | 'CANCEL', userId?: string): Promise<Order> {
    const order = await this.findOne(orderId);
    let payment = order.payments && order.payments.length > 0 ? order.payments[0] : null;

    if (!payment) {
      payment = this.paymentRepo.create({
        order_id: orderId,
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING,
      });
    }

    if (action === 'SUCCESS') {
      payment.status = PaymentStatus.COMPLETED;
      payment.paid_at = new Date();
      if (userId) {
        payment.confirmed_by = userId;
      }
      await this.paymentRepo.save(payment);

      if (order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED) {
        order.status = OrderStatus.PROCESSING;
        await this.orderRepo.save(order);
      }

      if (userId) {
        await this.auditLogsService.log(
          userId,
          'SANDBOX_PAYMENT_SUCCESS',
          'Payment',
          payment.id,
          { order_id: orderId, method: payment.method },
        );
      }
    } else {
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepo.save(payment);
      if (userId) {
        await this.auditLogsService.log(
          userId,
          'SANDBOX_PAYMENT_CANCELLED',
          'Payment',
          payment.id,
          { order_id: orderId, method: payment.method },
        );
      }
    }

    return this.findOne(orderId);
  }

  async removeOrder(id: string, performedByUserId: string) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    await this.orderRepo.remove(order);

    if (performedByUserId) {
      try {
        await this.auditLogsService.log(
          performedByUserId,
          'DELETE_ORDER',
          'Order',
          id,
          { total: order.total, status: order.status },
        );
      } catch (logErr) {
        console.warn('Failed to record delete order audit log:', logErr);
      }
    }

    return { message: 'Xóa đơn hàng thành công' };
  }

  async processSepayWebhook(payload: any) {
    const content = payload?.content || payload?.description || '';
    const transferAmount = Number(payload?.transferAmount || payload?.amount || 0);

    const shortIdMatch = content.match(/KTD\s*([a-f0-9]{8})/i);
    const phoneMatch = content.match(/KTD\s+.*?\s*(\d{9,11})/i);

    let order: Order | null = null;

    if (shortIdMatch) {
      const shortId = shortIdMatch[1].toLowerCase();
      order = await this.orderRepo
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.payments', 'payments')
        .where('order.id::text LIKE :shortId', { shortId: `${shortId}%` })
        .getOne();
    }

    if (!order && phoneMatch) {
      const phone = phoneMatch[1];
      order = await this.orderRepo
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.payments', 'payments')
        .leftJoinAndSelect('order.address', 'address')
        .where('address.phone = :phone', { phone })
        .orderBy('order.created_at', 'DESC')
        .getOne();
    }

    if (!order) {
      return { success: false, message: 'No matching order found for payment content' };
    }

    let payment = order.payments && order.payments.length > 0 ? order.payments[0] : null;

    if (!payment) {
      payment = this.paymentRepo.create({
        order_id: order.id,
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING,
      });
    }

    payment.status = PaymentStatus.COMPLETED;
    payment.paid_at = new Date();
    await this.paymentRepo.save(payment);

    if (order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED) {
      order.status = OrderStatus.PROCESSING;
      await this.orderRepo.save(order);
    }

    try {
      await this.auditLogsService.log(
        order.user_id || 'SYSTEM',
        'SEPAY_WEBHOOK_PAYMENT_SUCCESS',
        'Payment',
        payment.id,
        { order_id: order.id, transferAmount, referenceCode: payload.referenceCode },
      );
    } catch (e) {}

    return { success: true, order_id: order.id, status: order.status };
  }
}
