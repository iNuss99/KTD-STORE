import { Injectable, NotFoundException, BadRequestException, Optional, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { Address } from '../addresses/entities/address.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Product } from '../products/entities/product.entity';
import { Size } from '../products/entities/size.entity';
import { Color } from '../products/entities/color.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Discount } from '../discounts/entities/discount.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../../common/enums/order.enum';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UserRole } from '../../common/enums/role.enum';
import { DiscountsService } from '../discounts/discounts.service';
import { SystemConfigsService } from '../system-configs/system-configs.service';
import { PaymentsService } from '../payments/payments.service';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

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
    private systemConfigsService: SystemConfigsService,
    @Optional() private paymentsService?: PaymentsService,
    @Optional() private eventEmitter?: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    // 0. Check System Maintenance Mode
    const isMaintenance = await this.systemConfigsService.getValue('MAINTENANCE_MODE', 'false');
    if (isMaintenance === 'true') {
      throw new BadRequestException(
        'Hệ thống đang trong chế độ bảo trì và tạm ngưng nhận đơn hàng mới. Quý khách vui lòng quay lại sau ít phút.',
      );
    }

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
        // Lock variant row with pessimistic_write directly (single query on ProductVariant)
        const variant = await queryRunner.manager.findOne(ProductVariant, {
          where: { id: itemDto.variant_id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!variant || !variant.is_active) {
          throw new BadRequestException(`Sản phẩm (ID: ${itemDto.variant_id}) không khả dụng hoặc đã bị ẩn`);
        }

        // Populate related entities without outer-join locking conflict
        if (!variant.product) {
          const [product, size, color] = await Promise.all([
            queryRunner.manager.findOne(Product, { where: { id: variant.product_id } }),
            variant.size_id ? queryRunner.manager.findOne(Size, { where: { id: variant.size_id } }) : Promise.resolve(null),
            variant.color_id ? queryRunner.manager.findOne(Color, { where: { id: variant.color_id } }) : Promise.resolve(null),
          ]);
          variant.product = product as any;
          if (size) variant.size = size as any;
          if (color) variant.color = color as any;
        }

        if (!variant.product || !variant.product.is_active) {
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

      const createdOrder = await this.findOne(savedOrder.id);

      if (this.eventEmitter) {
        this.eventEmitter.emit('order.created', {
          orderId: savedOrder.id,
          total: savedOrder.total,
          order: createdOrder,
        });
        this.eventEmitter.emit('audit.log', {
          performedByUserId: userId,
          action: 'CREATE_ORDER',
          entity: 'Order',
          entityId: savedOrder.id,
          details: { total: savedOrder.total, paymentMethod: dto.payment_method },
        });
      }

      return createdOrder;
    } catch (err: any) {
      this.logger.error(`[OrdersService.create error]: ${err?.message || err}`, err?.stack);
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
        } catch (logErr: any) {
          this.logger.warn(`Failed to record audit log: ${logErr?.message || logErr}`);
        }
      }

      this.eventEmitter?.emit('order.updated', {
        orderId: id,
        userId: order.user_id,
        status: targetStatus,
      });

      return this.findOne(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelOrderByCustomer(
    orderId: string,
    userId: string,
    reason?: string,
    restoreToCart = false,
  ): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }

      order.items = await queryRunner.manager.find(OrderItem, {
        where: { order_id: orderId },
      });

      if (order.user_id !== userId) {
        throw new BadRequestException('Bạn không có quyền hủy đơn hàng này');
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('Đơn hàng này đã được hủy trước đó');
      }

      // Chỉ cho phép khách tự hủy khi đơn chưa đóng gói / chưa giao
      if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
        throw new BadRequestException(
          'Đơn hàng đã được kho đóng gói hoặc đang vận chuyển, không thể tự hủy. Quý khách vui lòng liên hệ hotline để được hỗ trợ.',
        );
      }

      const previousStatus = order.status;
      order.status = OrderStatus.CANCELLED;

      // Lưu lý do hủy vào snapshot đơn hàng
      const cancelReasonText = reason || 'Khách hàng tự hủy đơn';
      if (!order.shipping_snapshot) {
        order.shipping_snapshot = {
          receiver_name: '',
          phone: '',
          address_line: '',
          cancel_reason: cancelReasonText,
        };
      } else {
        order.shipping_snapshot.cancel_reason = cancelReasonText;
      }

      await queryRunner.manager.save(order);

      // Hoàn lại tồn kho các biến thể sản phẩm trong transaction
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.variant_id) {
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

      // Khôi phục lại sản phẩm vào Giỏ hàng nếu được yêu cầu
      if (restoreToCart && order.items && Array.isArray(order.items)) {
        let cart = await queryRunner.manager.findOne(Cart, { where: { user_id: userId } });
        if (!cart) {
          cart = queryRunner.manager.create(Cart, { user_id: userId });
          cart = await queryRunner.manager.save(cart);
        }

        for (const item of order.items) {
          if (item.variant_id) {
            let cartItem = await queryRunner.manager.findOne(CartItem, {
              where: { cart_id: cart.id, variant_id: item.variant_id },
            });
            if (cartItem) {
              cartItem.quantity += item.quantity;
              await queryRunner.manager.save(cartItem);
            } else {
              cartItem = queryRunner.manager.create(CartItem, {
                cart_id: cart.id,
                variant_id: item.variant_id,
                quantity: item.quantity,
              });
              await queryRunner.manager.save(cartItem);
            }
          }
        }
      }

      await queryRunner.commitTransaction();

      // Ghi nhận Audit Log
      try {
        await this.auditLogsService.log(
          userId,
          'CUSTOMER_CANCEL_ORDER',
          'Order',
          orderId,
          { from_status: previousStatus, to_status: OrderStatus.CANCELLED, reason: cancelReasonText, restoreToCart },
        );
      } catch (logErr: any) {
        this.logger.warn(`Failed to record audit log for cancelOrderByCustomer: ${logErr?.message || logErr}`);
      }

      // Đồng bộ hủy link thanh toán PayOS nếu có
      const payosOrderCode = (order.shipping_snapshot as any)?.payos_order_code;
      if (payosOrderCode && this.paymentsService) {
        try {
          await this.paymentsService.cancelPayosPaymentLink(payosOrderCode, cancelReasonText);
        } catch (payosErr: any) {
          this.logger.warn(`Failed to cancel PayOS link for order ${orderId}: ${payosErr?.message || payosErr}`);
        }
      }

      // Phát sự kiện cập nhật đơn hàng
      this.eventEmitter?.emit('order.updated', {
        orderId,
        userId: order.user_id,
        status: OrderStatus.CANCELLED,
      });

      return this.findOne(orderId);
    } catch (err: any) {
      if (queryRunner?.rollbackTransaction) {
        await queryRunner.rollbackTransaction();
      }
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async switchPaymentMethodToCod(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['payments', 'items'],
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (order.user_id !== userId) {
      throw new BadRequestException('Bạn không có quyền thay đổi đơn hàng này');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể đổi phương thức thanh toán khi đơn hàng đang chờ thanh toán');
    }

    let payment = order.payments && order.payments.length > 0 ? order.payments[0] : null;
    const oldMethod = payment?.method;
    if (!payment) {
      payment = this.paymentRepo.create({
        order_id: orderId,
        method: PaymentMethod.COD,
        status: PaymentStatus.PENDING,
      });
    } else {
      payment.method = PaymentMethod.COD;
    }
    await this.paymentRepo.save(payment);

    // Hủy link PayOS nếu có
    const payosOrderCode = (order.shipping_snapshot as any)?.payos_order_code;
    if (payosOrderCode && this.paymentsService) {
      try {
        await this.paymentsService.cancelPayosPaymentLink(
          payosOrderCode,
          'Khách hàng chuyển sang thanh toán khi nhận hàng (COD)',
        );
      } catch (payosErr: any) {
        this.logger.warn(`Failed to cancel PayOS link on switch to COD for order ${orderId}: ${payosErr?.message || payosErr}`);
      }
    }

    // Ghi nhận Audit Log
    try {
      await this.auditLogsService.log(
        userId,
        'SWITCH_PAYMENT_METHOD_TO_COD',
        'Order',
        orderId,
        { previousMethod: oldMethod, newMethod: PaymentMethod.COD },
      );
    } catch (logErr: any) {
      this.logger.warn(`Failed to record audit log for switchPaymentMethodToCod: ${logErr?.message || logErr}`);
    }

    // Phát sự kiện
    this.eventEmitter?.emit('order.updated', {
      orderId,
      userId: order.user_id,
      status: order.status,
    });

    return this.findOne(orderId);
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

    if (order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.CONFIRMED;
      await this.orderRepo.save(order);
    }

    this.eventEmitter?.emit('payment.completed', {
      orderId: order.id,
      amount: order.total,
      transactionId: `MANUAL_${savedPayment.id}`,
    });

    await this.auditLogsService.log(
      performedByUserId,
      payment.method === PaymentMethod.COD ? 'CONFIRM_COD_PAYMENT' : 'CONFIRM_PAYMENT',
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

      if (order.status === OrderStatus.PENDING) {
        order.status = OrderStatus.CONFIRMED;
        await this.orderRepo.save(order);
      }

      this.eventEmitter?.emit('payment.completed', {
        orderId: order.id,
        amount: order.total,
        transactionId: `PAYMENT_${Date.now()}`,
        provider: payment.method || 'BANK_TRANSFER',
      });

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
        .where("order.shipping_snapshot->>'phone' = :phone", { phone })
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

    if (order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.CONFIRMED;
      await this.orderRepo.save(order);
    }

    // Emit event for loyalty points, email confirmation, and realtime websocket
    this.eventEmitter?.emit('payment.completed', {
      orderId: order.id,
      amount: order.total,
      transactionId: payload?.referenceCode || payload?.id || 'SEPAY_WEBHOOK',
      provider: 'SEPAY',
    });

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

  async processCassoWebhook(payload: any) {
    const transactions = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
      ? payload
      : [payload];

    const results: any[] = [];

    for (const txn of transactions) {
      if (!txn) continue;
      const content = txn.description || txn.content || '';
      const transferAmount = Number(txn.amount || txn.transferAmount || 0);

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
          .where("order.shipping_snapshot->>'phone' = :phone", { phone })
          .orderBy('order.created_at', 'DESC')
          .getOne();
      }

      if (!order) {
        results.push({ success: false, txnId: txn.id || txn.tid, message: 'Không tìm thấy đơn hàng phù hợp' });
        continue;
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

      if (order.status === OrderStatus.PENDING) {
        order.status = OrderStatus.CONFIRMED;
        await this.orderRepo.save(order);
      }

      // Emit event for loyalty points, email confirmation, and realtime websocket
      this.eventEmitter?.emit('payment.completed', {
        orderId: order.id,
        amount: order.total,
        transactionId: txn.tid || txn.id || 'CASSO_WEBHOOK',
        provider: 'CASSO',
      });

      try {
        await this.auditLogsService.log(
          order.user_id || 'SYSTEM',
          'CASSO_WEBHOOK_PAYMENT_SUCCESS',
          'Payment',
          payment.id,
          { order_id: order.id, transferAmount, referenceCode: txn.tid || txn.id },
        );
      } catch (e) {}

      results.push({ success: true, order_id: order.id, status: order.status });
    }

    return { error: 0, message: 'Xử lý webhook Casso thành công', results };
  }

  async processPayosWebhook(payload: any) {
    const data = payload?.data || payload;
    const content = data?.description || data?.content || '';
    const transferAmount = Number(data?.amount || data?.transferAmount || 0);
    const orderCode = data?.orderCode;

    let order: Order | null = null;

    // 1. Match by PayOS unique orderCode stored in order shipping_snapshot
    if (orderCode) {
      order = await this.orderRepo
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.payments', 'payments')
        .where("order.shipping_snapshot->>'payos_order_code' = :orderCodeStr", {
          orderCodeStr: String(orderCode),
        })
        .getOne();
    }

    // 2. Fallback: match by KTD shortId in description
    if (!order) {
      const shortIdMatch = content.match(/KTD\s*([a-f0-9]{8})/i);
      if (shortIdMatch) {
        const shortId = shortIdMatch[1].toLowerCase();
        order = await this.orderRepo
          .createQueryBuilder('order')
          .leftJoinAndSelect('order.payments', 'payments')
          .where('order.id::text LIKE :shortId', { shortId: `${shortId}%` })
          .getOne();
      }
    }

    // 3. Fallback: match by phone number in description
    if (!order) {
      const phoneMatch = content.match(/KTD\s+.*?\s*(\d{9,11})/i);
      if (phoneMatch) {
        const phone = phoneMatch[1];
        order = await this.orderRepo
          .createQueryBuilder('order')
          .leftJoinAndSelect('order.payments', 'payments')
          .where("order.shipping_snapshot->>'phone' = :phone", { phone })
          .orderBy('order.created_at', 'DESC')
          .getOne();
      }
    }

    if (!order) {
      return { success: true, message: 'PayOS webhook endpoint active (Test ping verified)' };
    }

    // Security Check: Verify transferred amount meets order total
    if (transferAmount > 0 && transferAmount < Math.round(Number(order.total))) {
      return { success: false, message: `Số tiền chuyển khoản (${transferAmount}) nhỏ hơn tổng tiền đơn hàng (${order.total})` };
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

    if (order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.CONFIRMED;
      await this.orderRepo.save(order);
    }

    // Emit event for loyalty points, email confirmation, and realtime websocket
    this.eventEmitter?.emit('payment.completed', {
      orderId: order.id,
      amount: order.total,
      transactionId: String(orderCode || data?.reference || 'PAYOS_WEBHOOK'),
      provider: 'PAYOS',
    });

    try {
      await this.auditLogsService.log(
        order.user_id || 'SYSTEM',
        'PAYOS_WEBHOOK_PAYMENT_SUCCESS',
        'Payment',
        payment.id,
        { order_id: order.id, transferAmount, referenceCode: data?.reference || data?.orderCode },
      );
    } catch (e) {}

    return { error: 0, message: 'Success', data: { order_id: order.id, status: order.status } };
  }

  /**
   * Cron Job chạy mỗi 10 phút để tự động hủy các đơn hàng trực tuyến
   * (BANK_TRANSFER / PayOS, VNPAY, MOMO) ở trạng thái PENDING quá 30 phút mà chưa thanh toán.
   */
  @Cron('*/10 * * * *')
  async handleAutoCancelExpiredOrders(): Promise<number> {
    return this.autoCancelExpiredOnlineOrders(30);
  }

  async autoCancelExpiredOnlineOrders(expirationMinutes = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - expirationMinutes * 60 * 1000);

    // Tìm các đơn hàng PENDING tạo trước cutoffDate và có payment trực tuyến PENDING
    const expiredOrders = await this.orderRepo
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.payments', 'payment')
      .leftJoinAndSelect('order.items', 'item')
      .where('order.status = :status', { status: OrderStatus.PENDING })
      .andWhere('order.created_at <= :cutoffDate', { cutoffDate })
      .andWhere('payment.status = :paymentStatus', { paymentStatus: PaymentStatus.PENDING })
      .andWhere('payment.method IN (:...onlineMethods)', {
        onlineMethods: [PaymentMethod.BANK_TRANSFER, PaymentMethod.VNPAY, PaymentMethod.MOMO],
      })
      .getMany();

    if (!expiredOrders || expiredOrders.length === 0) {
      return 0;
    }

    this.logger.log(
      `[AutoCancel] Tìm thấy ${expiredOrders.length} đơn hàng trực tuyến quá hạn ${expirationMinutes} phút cần hủy.`,
    );

    let cancelledCount = 0;

    for (const expOrder of expiredOrders) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const order = await queryRunner.manager.findOne(Order, {
          where: { id: expOrder.id },
          lock: { mode: 'pessimistic_write' },
        });

        // Double check trạng thái và thanh toán trước khi hủy
        if (!order || order.status !== OrderStatus.PENDING) {
          await queryRunner.rollbackTransaction();
          continue;
        }

        order.items = await queryRunner.manager.find(OrderItem, {
          where: { order_id: expOrder.id },
        });
        order.payments = await queryRunner.manager.find(Payment, {
          where: { order_id: expOrder.id },
        });

        const isPaid = order.payments?.some((p) => p.status === PaymentStatus.COMPLETED);
        if (isPaid) {
          order.status = OrderStatus.CONFIRMED;
          await queryRunner.manager.save(order);
          await queryRunner.commitTransaction();
          continue;
        }

        const previousStatus = order.status;
        order.status = OrderStatus.CANCELLED;

        const cancelReason = `Hệ thống tự động hủy do quá hạn thanh toán (${expirationMinutes} phút)`;
        if (!order.shipping_snapshot) {
          order.shipping_snapshot = {
            receiver_name: '',
            phone: '',
            address_line: '',
            cancel_reason: cancelReason,
          };
        } else {
          order.shipping_snapshot.cancel_reason = cancelReason;
        }

        await queryRunner.manager.save(order);

        // Hoàn lại tồn kho cho các items trong đơn
        if (order.items && Array.isArray(order.items)) {
          for (const item of order.items) {
            if (item.variant_id) {
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

        // Cập nhật trạng thái payment sang FAILED
        if (order.payments && Array.isArray(order.payments)) {
          for (const p of order.payments) {
            if (p.status === PaymentStatus.PENDING) {
              p.status = PaymentStatus.FAILED;
              await queryRunner.manager.save(p);
            }
          }
        }

        await queryRunner.commitTransaction();
        cancelledCount++;

        // Ghi nhận Audit Log
        try {
          await this.auditLogsService.log(
            'SYSTEM',
            'SYSTEM_AUTO_CANCEL_EXPIRED_ORDER',
            'Order',
            order.id,
            { from_status: previousStatus, to_status: OrderStatus.CANCELLED, reason: cancelReason },
          );
        } catch (logErr: any) {
          this.logger.warn(
            `Failed to record audit log for autoCancelExpiredOnlineOrders: ${logErr?.message || logErr}`,
          );
        }

        // Bắn event qua WebSocket tới client
        this.eventEmitter?.emit('order.updated', {
          orderId: order.id,
          userId: order.user_id,
          status: OrderStatus.CANCELLED,
        });

        // Đồng bộ hủy link thanh toán PayOS nếu có orderCode
        const payosOrderCode = (order.shipping_snapshot as any)?.payos_order_code;
        if (payosOrderCode && this.paymentsService) {
          try {
            await this.paymentsService.cancelPayosPaymentLink(payosOrderCode, cancelReason);
          } catch (payosErr: any) {
            this.logger.warn(
              `[AutoCancel] Không thể hủy link PayOS cho đơn ${order.id}: ${payosErr?.message || payosErr}`,
            );
          }
        }

        this.logger.log(`[AutoCancel] Đã tự động hủy đơn hàng quá hạn: #${order.id.slice(0, 8)}`);
      } catch (err: any) {
        if (queryRunner?.rollbackTransaction) {
          await queryRunner.rollbackTransaction();
        }
        this.logger.error(`[AutoCancel] Lỗi khi xử lý hủy đơn #${expOrder.id}: ${err?.message || err}`, err?.stack);
      } finally {
        await queryRunner.release();
      }
    }

    return cancelledCount;
  }
}
