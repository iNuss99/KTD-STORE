import { Injectable, BadRequestException, NotFoundException, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import { PayOS } from '@payos/node';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../orders/entities/payment.entity';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../../common/enums/order.enum';

@Injectable()
export class PaymentsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PaymentsService.name);
  private vnpTmnCode: string;
  private vnpHashSecret: string;
  private vnpUrl: string;
  private vnpReturnUrl: string;
  private payOS: PayOS | null = null;

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

    const clientId = this.configService.get<string>('PAYOS_CLIENT_ID');
    const apiKey = this.configService.get<string>('PAYOS_API_KEY');
    const checksumKey = this.configService.get<string>('PAYOS_CHECKSUM_KEY');
    if (clientId && apiKey && checksumKey) {
      this.payOS = new PayOS({ clientId, apiKey, checksumKey });
    }
  }

  async onApplicationBootstrap() {
    if (this.payOS) {
      try {
        const backendUrl = (
          this.configService.get<string>('BACKEND_URL') ||
          'https://ktd-store-backend.onrender.com'
        ).replace(/\/+$/, '');
        const webhookUrl = `${backendUrl}/api/webhooks/payos`;
        await this.payOS.webhooks.confirm(webhookUrl);
        this.logger.log(`[PayOS] Webhook registered & confirmed with PayOS at: ${webhookUrl}`);
      } catch (err: any) {
        this.logger.warn(`[PayOS] Webhook auto-confirmation notice: ${err?.message || err}`);
      }
    } else {
      this.logger.warn('[PayOS] Cổng thanh toán PayOS chưa được kích hoạt do thiếu biến môi trường PAYOS_CLIENT_ID / PAYOS_API_KEY / PAYOS_CHECKSUM_KEY.');
    }
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

  async createPayosPaymentLink(orderId: string): Promise<any> {
    if (!this.payOS) {
      throw new BadRequestException('Cổng thanh toán PayOS chưa được cấu hình.');
    }

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${orderId}`);
    }

    const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(100 + Math.random() * 900));
    const description = `KTD ${orderId.slice(0, 8).toUpperCase()}`;

    const frontendUrl = (
      this.configService.get<string>('FRONTEND_URL') ||
      'https://ktd-store.vercel.app'
    ).replace(/\/+$/, '');

    const paymentLink = await this.payOS.paymentRequests.create({
      orderCode,
      amount: Math.round(Number(order.total)),
      description,
      cancelUrl: `${frontendUrl}/orders/${orderId}`,
      returnUrl: `${frontendUrl}/orders/${orderId}?payment_success=1`,
      items: order.items?.map((it) => ({
        name: it.product_name,
        quantity: it.quantity,
        price: Math.round(Number(it.price)),
      })) || [{ name: `Đơn hàng #${orderId.slice(0, 8)}`, quantity: 1, price: Math.round(Number(order.total)) }],
    });

    // Save orderCode to order shipping_snapshot so webhook and status-check can match even if bank description alters
    if (order.shipping_snapshot) {
      order.shipping_snapshot.payos_order_code = orderCode;
    } else {
      order.shipping_snapshot = {
        receiver_name: '',
        phone: '',
        address_line: '',
        payos_order_code: orderCode,
      };
    }
    await this.orderRepo.save(order);

    return {
      orderId,
      orderCode,
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode,
      accountNumber: paymentLink.accountNumber,
      accountName: paymentLink.accountName,
      bin: paymentLink.bin,
      amount: paymentLink.amount,
      description: paymentLink.description,
    };
  }

  async checkPayosPaymentStatus(orderId: string, orderCode?: number): Promise<{ isPaid: boolean; status: string; orderId: string }> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['payments'],
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${orderId}`);
    }

    const isAlreadyPaid =
      order.status === OrderStatus.PROCESSING ||
      order.status === OrderStatus.CONFIRMED ||
      order.status === OrderStatus.SHIPPING ||
      order.status === OrderStatus.DELIVERED ||
      order.payments?.some((p) => p.status === PaymentStatus.COMPLETED);

    if (isAlreadyPaid) {
      return { isPaid: true, status: 'PAID', orderId };
    }

    const targetOrderCode = orderCode || (order.shipping_snapshot as any)?.payos_order_code;

    if (this.payOS && targetOrderCode) {
      try {
        const info = await this.payOS.paymentRequests.get(Number(targetOrderCode));
        if (info && info.status === 'PAID') {
          await this.handlePaymentSuccess(orderId, String(targetOrderCode), 'PAYOS');
          return { isPaid: true, status: 'PAID', orderId };
        }
        return { isPaid: false, status: info?.status || 'PENDING', orderId };
      } catch (err) {
        console.error('[checkPayosPaymentStatus error]:', err);
      }
    }

    return { isPaid: false, status: 'PENDING', orderId };
  }
}
