import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from './email.service';
import {
  OrderConfirmationData,
  RefundConfirmationData,
  AbandonedCartData,
  WelcomeEmailData,
  PasswordResetEmailData,
} from './email.types';

@Injectable()
export class EmailConsumer {
  private readonly logger = new Logger('EmailConsumer');

  constructor(private readonly emailService: EmailService) {}

  @OnEvent('order.created')
  async handleOrderCreated(payload: OrderConfirmationData | any) {
    try {
      if (!payload.customerEmail && payload.order) {
        // Adapt from internal order event payload if needed
        const order = payload.order;
        const snapshot = order.shipping_snapshot || {};
        const email = order.user?.email || snapshot.email;
        if (!email) return;

        await this.emailService.sendOrderConfirmation({
          orderId: order.id,
          orderNumber: order.order_number || order.id.substring(0, 8),
          customerName: snapshot.receiver_name || order.user?.full_name || 'Quý khách',
          customerEmail: email,
          items: (order.items || []).map((i: any) => ({
            name: i.product_name,
            size: i.size_name,
            color: i.color_name,
            sku: i.sku,
            quantity: i.quantity,
            price: Number(i.unit_price || i.price),
          })),
          subtotal: Number(order.subtotal),
          discountAmount: Number(order.discount_amount || 0),
          shippingFee: Number(order.shipping_fee || 0),
          total: Number(order.total_amount || order.total),
          shippingAddress: {
            receiverName: snapshot.receiver_name || 'Khách hàng',
            phoneNumber: snapshot.phone_number || '',
            addressLine: snapshot.address_line || '',
            ward: snapshot.ward,
            district: snapshot.district,
            city: snapshot.city,
          },
          paymentMethod: order.payments?.[0]?.payment_method || 'COD',
          orderDate: new Date(order.created_at || Date.now()).toLocaleDateString('vi-VN'),
        });
        return;
      }

      if (payload.customerEmail) {
        await this.emailService.sendOrderConfirmation(payload);
      }
    } catch (err: any) {
      this.logger.error(`Failed to process order.created email: ${err.message}`, err.stack);
    }
  }

  @OnEvent('return.refunded')
  async handleReturnRefunded(payload: RefundConfirmationData) {
    try {
      if (payload.customerEmail) {
        await this.emailService.sendRefundConfirmation(payload);
      }
    } catch (err: any) {
      this.logger.error(`Failed to process return.refunded email: ${err.message}`);
    }
  }

  @OnEvent('user.registered')
  async handleUserRegistered(payload: WelcomeEmailData) {
    try {
      if (payload.customerEmail) {
        await this.emailService.sendWelcomeEmail(payload);
      }
    } catch (err: any) {
      this.logger.error(`Failed to process user.registered email: ${err.message}`);
    }
  }

  @OnEvent('auth.password_reset')
  async handlePasswordReset(payload: PasswordResetEmailData) {
    try {
      if (payload.customerEmail) {
        await this.emailService.sendPasswordReset(payload);
      }
    } catch (err: any) {
      this.logger.error(`Failed to process auth.password_reset email: ${err.message}`);
    }
  }

  @OnEvent('cart.abandoned')
  async handleCartAbandoned(payload: AbandonedCartData) {
    try {
      if (payload.customerEmail) {
        await this.emailService.sendAbandonedCartReminder(payload);
      }
    } catch (err: any) {
      this.logger.error(`Failed to process cart.abandoned email: ${err.message}`);
    }
  }
}
