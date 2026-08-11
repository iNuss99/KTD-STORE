import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../orders/entities/payment.entity';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../../common/enums/order.enum';

@Injectable()
export class PaymentsService {
  private vnpTmnCode: string;
  private vnpHashSecret: string;
  private vnpUrl: string;
  private vnpReturnUrl: string;

  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.vnpTmnCode = this.configService.get<string>('VNP_TMN_CODE', '2QXUI4J4');
    this.vnpHashSecret = this.configService.get<string>('VNP_HASH_SECRET', 'RAASTAVKVOEJRAENYVRGDCHJLTG0ANOM');
    this.vnpUrl = this.configService.get<string>('VNP_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
    this.vnpReturnUrl = this.configService.get<string>('VNP_RETURN_URL', 'http://localhost:5173/orders');
  }

  createVnpayPaymentUrl(orderId: string, amount: number, ipAddr = '127.0.0.1', bankCode?: string): { paymentUrl: string } {
    const date = new Date();
    const createDate = date.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);

    let vnpParams: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnpTmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: `${orderId}_${Date.now()}`,
      vnp_OrderInfo: `Thanh toan don hang #${orderId.slice(0, 8)} tai MenWear Hub`,
      vnp_OrderType: 'other',
      vnp_Amount: String(Math.round(amount * 100)),
      vnp_ReturnUrl: `${this.vnpReturnUrl}/${orderId}?payment_success=1`,
      vnp_IpAddr: ipAddr || '127.0.0.1',
      vnp_CreateDate: createDate,
    };

    if (bankCode) {
      vnpParams['vnp_BankCode'] = bankCode;
    }

    // Sort params alphabetically by key
    const sortedKeys = Object.keys(vnpParams).sort();
    const signData = sortedKeys.map((k) => `${k}=${encodeURIComponent(vnpParams[k])}`).join('&');

    const hmac = crypto.createHmac('sha512', this.vnpHashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const paymentUrl = `${this.vnpUrl}?${signData}&vnp_SecureHash=${signed}`;
    return { paymentUrl };
  }

  verifyVnpayCallback(params: Record<string, any>): { isValid: boolean; orderId?: string; isSuccess: boolean; code?: string } {
    const secureHash = params['vnp_SecureHash'];
    const cleanParams = { ...params };
    delete cleanParams['vnp_SecureHash'];
    delete cleanParams['vnp_SecureHashType'];

    const sortedKeys = Object.keys(cleanParams).sort();
    const signData = sortedKeys
      .filter((k) => cleanParams[k] !== undefined && cleanParams[k] !== '')
      .map((k) => `${k}=${encodeURIComponent(cleanParams[k])}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', this.vnpHashSecret);
    const checkHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const isValid = checkHash.toLowerCase() === (secureHash || '').toLowerCase();
    const isSuccess = params['vnp_ResponseCode'] === '00' && params['vnp_TransactionStatus'] === '00';
    const txnRef = params['vnp_TxnRef'] || '';
    const orderId = txnRef.split('_')[0];

    return { isValid, orderId, isSuccess, code: params['vnp_ResponseCode'] };
  }

  async handlePaymentSuccess(orderId: string, transactionId: string, provider = 'VNPAY'): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['payments'],
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${orderId}`);
    }

    // Update or create payment
    let payment = order.payments?.[0];
    if (!payment) {
      payment = this.paymentRepo.create({
        order_id: order.id,
        method: provider === 'VNPAY' ? PaymentMethod.VNPAY : PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.COMPLETED,
        paid_at: new Date(),
      });
    } else {
      payment.status = PaymentStatus.COMPLETED;
      payment.paid_at = new Date();
    }
    await this.paymentRepo.save(payment);

    // If order was PENDING, advance to PROCESSING
    if (order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.PROCESSING;
      await this.orderRepo.save(order);
    }

    // Emit event for email and real-time updates
    this.eventEmitter.emit('payment.completed', {
      orderId: order.id,
      amount: order.total,
      transactionId,
      provider,
    });

    return order;
  }
}
