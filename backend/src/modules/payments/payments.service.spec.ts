import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentsService } from './payments.service';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../orders/entities/payment.entity';
import { OrderStatus, PaymentStatus } from '../../common/enums/order.enum';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let orderRepoMock: any;
  let paymentRepoMock: any;

  const mockOrder = {
    id: 'order-12345678-uuid',
    total: 500000,
    status: OrderStatus.PENDING,
    payments: [],
  };

  beforeEach(async () => {
    orderRepoMock = {
      findOne: jest.fn().mockResolvedValue(mockOrder),
      save: jest.fn().mockImplementation((o) => Promise.resolve(o)),
    };

    paymentRepoMock = {
      create: jest.fn().mockImplementation((p) => p),
      save: jest.fn().mockImplementation((p) => Promise.resolve(p)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Order), useValue: orderRepoMock },
        { provide: getRepositoryToken(Payment), useValue: paymentRepoMock },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def: string) => def),
          },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('createVnpayPaymentUrl', () => {
    it('should generate valid signed URL containing vnp_SecureHash and amount', () => {
      const result = service.createVnpayPaymentUrl('order-12345678-uuid', 500000);

      expect(result.paymentUrl).toBeDefined();
      expect(result.paymentUrl).toContain('vnp_SecureHash=');
      expect(result.paymentUrl).toContain('vnp_Amount=50000000');
      expect(result.paymentUrl).toContain('vnp_TmnCode=2QXUI4J4');
    });
  });

  describe('verifyVnpayCallback', () => {
    it('should correctly verify checksum signature on callback query params', () => {
      const { paymentUrl } = service.createVnpayPaymentUrl('order-12345678-uuid', 500000);
      const queryString = paymentUrl.split('?')[1];
      const params: Record<string, string> = {};
      new URLSearchParams(queryString).forEach((val, key) => {
        params[key] = val;
      });

      params['vnp_ResponseCode'] = '00';
      params['vnp_TransactionStatus'] = '00';

      // Re-sign with added response code
      const cleanKeys = Object.keys(params).filter((k) => k !== 'vnp_SecureHash').sort();
      const crypto = require('crypto');
      const signData = cleanKeys.map((k) => `${k}=${encodeURIComponent(params[k])}`).join('&');
      const hmac = crypto.createHmac('sha512', 'RAASTAVKVOEJRAENYVRGDCHJLTG0ANOM');
      params['vnp_SecureHash'] = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      const verification = service.verifyVnpayCallback(params);
      expect(verification.isValid).toBe(true);
      expect(verification.isSuccess).toBe(true);
      expect(verification.orderId).toBe('order-12345678-uuid');
    });
  });

  describe('handlePaymentSuccess', () => {
    it('should transition order to PROCESSING and payment to COMPLETED', async () => {
      const order = await service.handlePaymentSuccess('order-12345678-uuid', 'TXN_999', 'VNPAY');

      expect(orderRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 'order-12345678-uuid' },
        relations: ['payments'],
      });
      expect(paymentRepoMock.save).toHaveBeenCalled();
      expect(order.status).toBe(OrderStatus.PROCESSING);
    });
  });
});
