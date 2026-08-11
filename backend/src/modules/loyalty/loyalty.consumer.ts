import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LoyaltyService } from './loyalty.service';

@Injectable()
export class LoyaltyConsumer {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @OnEvent('order.delivered')
  async handleOrderDelivered(payload: { userId: string; orderId: string; total: number }) {
    if (payload.userId && payload.total) {
      await this.loyaltyService.awardPointsForOrder(payload.userId, Number(payload.total));
    }
  }

  @OnEvent('payment.completed')
  async handlePaymentCompleted(payload: { orderId: string; amount: number; userId?: string }) {
    if (payload.userId && payload.amount) {
      await this.loyaltyService.awardPointsForOrder(payload.userId, Number(payload.amount));
    }
  }
}
