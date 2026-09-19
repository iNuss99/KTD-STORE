import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { Address } from '../addresses/entities/address.entity';
import { Payment } from './entities/payment.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { DiscountsService } from '../discounts/discounts.service';
import { SystemConfigsService } from '../system-configs/system-configs.service';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../common/enums/order.enum';
import { UserRole } from '../../common/enums/role.enum';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepo: any;
  let addressRepo: any;
  let paymentRepo: any;
  let auditLogsService: any;
  let discountsService: any;
  let systemConfigsService: any;
  let mockQueryRunner: any;

  beforeEach(async () => {
    orderRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn((e) => Promise.resolve(e)),
    };

    addressRepo = {
      findOne: jest.fn(),
    };

    paymentRepo = {
      save: jest.fn((e) => Promise.resolve(e)),
    };

    auditLogsService = {
      log: jest.fn().mockResolvedValue({}),
    };

    discountsService = {
      validateAndCalculate: jest.fn().mockResolvedValue({
        discount: { used_count: 0 },
        discount_amount: 50000,
        applicable_subtotal: 400000,
      }),
    };

    systemConfigsService = {
      getValue: jest.fn().mockResolvedValue('false'),
    };

    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        find: jest.fn().mockResolvedValue([]),
        create: jest.fn((cls, dto) => ({ ...dto, id: 'generated-id' })),
        save: jest.fn((e) => Promise.resolve(e)),
        delete: jest.fn(),
      },
    };

    const dataSourceMock = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(Address), useValue: addressRepo },
        { provide: getRepositoryToken(Payment), useValue: paymentRepo },
        { provide: DataSource, useValue: dataSourceMock },
        { provide: AuditLogsService, useValue: auditLogsService },
        { provide: DiscountsService, useValue: discountsService },
        { provide: SystemConfigsService, useValue: systemConfigsService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('nên được khởi tạo thành công', () => {
    expect(service).toBeDefined();
  });

  describe('Tạo Đơn hàng & Trừ tồn kho Concurrency (FOR UPDATE)', () => {
    it('chặn đặt hàng mới khi hệ thống đang bật chế độ bảo trì (MAINTENANCE_MODE)', async () => {
      systemConfigsService.getValue.mockResolvedValueOnce('true');

      await expect(
        service.create('user-1', {
          address_id: 'addr-1',
          payment_method: PaymentMethod.COD,
          items: [{ variant_id: 'var-1', quantity: 1 }],
        }),
      ).rejects.toThrow('Hệ thống đang trong chế độ bảo trì và tạm ngưng nhận đơn hàng mới');
    });

    it('tạo đơn hàng thành công và trừ tồn kho biến thể', async () => {
      addressRepo.findOne.mockResolvedValue({
        id: 'addr-1',
        receiver_name: 'Nguyen Van A',
        phone: '0901234567',
        address_line: '123 Le Loi',
      });

      const mockVariant = {
        id: 'var-1',
        sku: 'NK-TEE-L-BLK',
        stock_quantity: 10,
        is_active: true,
        price_override: null,
        product: { name: 'Ao Thun Nam', base_price: 200000, is_active: true },
        size: { name: 'L' },
        color: { name: 'Den' },
      };

      mockQueryRunner.manager.findOne.mockImplementation((entity: any, opts: any) => {
        if (entity?.name === 'ProductVariant' || opts?.lock?.mode === 'pessimistic_write') {
          return Promise.resolve(mockVariant);
        }
        return Promise.resolve(null);
      });

      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'ord-1',
        status: OrderStatus.PENDING,
        total: 400000,
      } as any);

      const dto = {
        address_id: 'addr-1',
        payment_method: PaymentMethod.COD,
        items: [{ variant_id: 'var-1', quantity: 2 }],
      };

      const result = await service.create('user-1', dto);

      expect(mockVariant.stock_quantity).toBe(8);
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result.id).toBe('ord-1');
    });

    it('báo lỗi BadRequestException khi tồn kho không đủ (chống oversell)', async () => {
      addressRepo.findOne.mockResolvedValue({
        receiver_name: 'Nguyen Van A',
        phone: '0901234567',
        address_line: '123 Le Loi',
      });

      const mockVariant = {
        id: 'var-1',
        stock_quantity: 1,
        is_active: true,
        product: { name: 'Ao Thun Nam', base_price: 200000, is_active: true },
      };

      mockQueryRunner.manager.findOne.mockResolvedValue(mockVariant);

      const dto = {
        address_id: 'addr-1',
        payment_method: PaymentMethod.COD,
        items: [{ variant_id: 'var-1', quantity: 5 }],
      };

      await expect(service.create('user-1', dto)).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('State Machine & Super Admin Override', () => {
    it('cho phép chuyển từ PENDING sang CONFIRMED', async () => {
      const mockOrder = {
        id: 'ord-1',
        status: OrderStatus.PENDING,
        items: [],
      };

      mockQueryRunner.manager.findOne.mockResolvedValue(mockOrder);
      jest.spyOn(service, 'findOne').mockResolvedValue({ ...mockOrder, status: OrderStatus.CONFIRMED } as any);

      const result = await service.updateStatus('ord-1', { status: OrderStatus.CONFIRMED }, { id: 'admin-1', role: UserRole.MANAGER });

      expect(mockOrder.status).toBe(OrderStatus.CONFIRMED);
      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(auditLogsService.log).toHaveBeenCalledWith('admin-1', 'UPDATE_ORDER_STATUS', 'Order', 'ord-1', expect.anything());
    });

    it('cho phép Super Admin can thiệp thủ công chuyển cóc trạng thái kèm lý do (reason)', async () => {
      const mockOrder = {
        id: 'ord-1',
        status: OrderStatus.PENDING,
        items: [],
      };

      mockQueryRunner.manager.findOne.mockResolvedValue(mockOrder);
      jest.spyOn(service, 'findOne').mockResolvedValue({ ...mockOrder, status: OrderStatus.DELIVERED } as any);

      const superAdminUser = { id: 'sa-1', role: UserRole.SUPER_ADMIN };
      const dto = { status: OrderStatus.DELIVERED, reason: 'Khách nhận trực tiếp tại kho' };

      const result = await service.updateStatus('ord-1', dto, superAdminUser);

      expect(result.status).toBe(OrderStatus.DELIVERED);
      expect(auditLogsService.log).toHaveBeenCalledWith('sa-1', 'OVERRIDE_ORDER_STATUS', 'Order', 'ord-1', expect.objectContaining({ reason: 'Khách nhận trực tiếp tại kho' }));
    });

    it('báo lỗi BadRequestException khi chuyển trạng thái nhảy cóc bất hợp lệ (ví dụ: PENDING -> SHIPPING) từ Staff/Manager', async () => {
      const mockOrder = {
        id: 'ord-1',
        status: OrderStatus.PENDING,
        items: [],
      };

      mockQueryRunner.manager.findOne.mockResolvedValue(mockOrder);

      const managerUser = { id: 'm-1', role: UserRole.MANAGER };
      const dto = { status: OrderStatus.SHIPPING };

      await expect(service.updateStatus('ord-1', dto, managerUser)).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('báo lỗi BadRequestException khi Super Admin chuyển cóc trạng thái mà không cung cấp lý do (reason)', async () => {
      const mockOrder = {
        id: 'ord-1',
        status: OrderStatus.PENDING,
        items: [],
      };

      mockQueryRunner.manager.findOne.mockResolvedValue(mockOrder);

      const superAdminUser = { id: 'sa-1', role: UserRole.SUPER_ADMIN };
      const dto = { status: OrderStatus.DELIVERED };

      await expect(service.updateStatus('ord-1', dto, superAdminUser)).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('Xác nhận Thanh toán COD (confirmPayment)', () => {
    it('xác nhận thanh toán COD thành công, ghi nhận confirmed_by, paid_at và AuditLog', async () => {
      const mockPayment: any = {
        id: 'pay-1',
        order_id: 'ord-1',
        method: PaymentMethod.COD,
        status: PaymentStatus.PENDING,
      };

      const mockOrder = {
        id: 'ord-1',
        payments: [mockPayment],
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder as any);

      await service.confirmPayment('ord-1', 'staff-1');

      expect(mockPayment.status).toBe(PaymentStatus.COMPLETED);
      expect(mockPayment.confirmed_by).toBe('staff-1');
      expect(mockPayment.paid_at).toBeInstanceOf(Date);
      expect(paymentRepo.save).toHaveBeenCalledWith(mockPayment);
      expect(auditLogsService.log).toHaveBeenCalledWith('staff-1', 'CONFIRM_COD_PAYMENT', 'Payment', 'pay-1', expect.anything());
    });

    it('báo lỗi BadRequestException nếu đơn hàng đã được xác nhận thanh toán trước đó', async () => {
      const mockPayment = {
        id: 'pay-1',
        order_id: 'ord-1',
        status: PaymentStatus.COMPLETED,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'ord-1', payments: [mockPayment] } as any);

      await expect(service.confirmPayment('ord-1', 'staff-1')).rejects.toThrow(BadRequestException);
    });

    it('xử lý thanh toán sandbox thành công, chuyển Payment status sang COMPLETED và Order sang PROCESSING', async () => {
      const mockPayment: any = {
        id: 'pay-vnpay',
        order_id: 'ord-vnpay',
        method: PaymentMethod.VNPAY,
        status: PaymentStatus.PENDING,
      };

      const mockOrder: any = {
        id: 'ord-vnpay',
        status: OrderStatus.PENDING,
        payments: [mockPayment],
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);

      await service.processSandboxPayment('ord-vnpay', 'SUCCESS', 'user-1');

      expect(mockPayment.status).toBe(PaymentStatus.COMPLETED);
      expect(mockOrder.status).toBe(OrderStatus.CONFIRMED);
      expect(paymentRepo.save).toHaveBeenCalledWith(mockPayment);
      expect(orderRepo.save).toHaveBeenCalledWith(mockOrder);
    });

    it('xử lý webhook Casso thành công khi tìm thấy mã đơn hàng ngắn trong nội dung', async () => {
      const mockOrder: any = {
        id: 'a1b2c3d4-1234-5678-90ab-cdef12345678',
        status: OrderStatus.PENDING,
        payments: [],
      };

      const qbMock: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockOrder),
      };

      orderRepo.createQueryBuilder = jest.fn().mockReturnValue(qbMock);
      paymentRepo.create = jest.fn((dto) => ({ ...dto, id: 'casso-pay-id' }));

      const payload = {
        error: 0,
        data: [
          {
            id: 999,
            tid: 'FT999',
            description: 'KTD a1b2c3d4 chuyen tien mua hang',
            amount: 350000,
          },
        ],
      };

      const result = await service.processCassoWebhook(payload);

      expect(result.error).toBe(0);
      expect(result.results[0].success).toBe(true);
      expect(result.results[0].order_id).toBe(mockOrder.id);
      expect(mockOrder.status).toBe(OrderStatus.CONFIRMED);
    });
  });

  describe('Khách hàng tự hủy đơn (cancelOrderByCustomer)', () => {
    it('cho phép khách hàng tự hủy đơn PENDING/CONFIRMED và hoàn tồn kho sản phẩm', async () => {
      const mockVariant = {
        id: 'var-1',
        stock_quantity: 5,
      };

      const mockOrder: any = {
        id: 'ord-cancel-1',
        user_id: 'user-owner',
        status: OrderStatus.PENDING,
        items: [{ variant_id: 'var-1', quantity: 3 }],
        shipping_snapshot: null,
      };

      mockQueryRunner.manager.findOne.mockImplementation((entity: any, opts: any) => {
        if (entity?.name === 'Order' || opts?.where?.id === 'ord-cancel-1') {
          return Promise.resolve(mockOrder);
        }
        if (entity?.name === 'ProductVariant' || opts?.where?.id === 'var-1') {
          return Promise.resolve(mockVariant);
        }
        return Promise.resolve(null);
      });

      mockQueryRunner.manager.find.mockResolvedValue(mockOrder.items);

      jest.spyOn(service, 'findOne').mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      } as any);

      const result = await service.cancelOrderByCustomer('ord-cancel-1', 'user-owner', 'Đổi ý không mua nữa');

      expect(mockOrder.status).toBe(OrderStatus.CANCELLED);
      expect(mockOrder.shipping_snapshot.cancel_reason).toBe('Đổi ý không mua nữa');
      expect(mockVariant.stock_quantity).toBe(8);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('báo lỗi BadRequestException nếu người dùng không phải là chủ sở hữu đơn hàng', async () => {
      const mockOrder: any = {
        id: 'ord-cancel-1',
        user_id: 'user-owner',
        status: OrderStatus.PENDING,
      };

      mockQueryRunner.manager.findOne.mockResolvedValue(mockOrder);

      await expect(
        service.cancelOrderByCustomer('ord-cancel-1', 'wrong-user', 'Lý do'),
      ).rejects.toThrow('Bạn không có quyền hủy đơn hàng này');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('báo lỗi BadRequestException nếu đơn hàng đã được đóng gói hoặc đang vận chuyển', async () => {
      const mockOrder: any = {
        id: 'ord-cancel-1',
        user_id: 'user-owner',
        status: OrderStatus.SHIPPING,
      };

      mockQueryRunner.manager.findOne.mockResolvedValue(mockOrder);

      await expect(
        service.cancelOrderByCustomer('ord-cancel-1', 'user-owner', 'Lý do'),
      ).rejects.toThrow('không thể tự hủy');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('Tự động hủy đơn quá hạn thanh toán 30 phút (autoCancelExpiredOnlineOrders)', () => {
    it('tự động hủy đơn hàng thanh toán trực tuyến quá 30 phút và hoàn tồn kho sản phẩm', async () => {
      const mockVariant = {
        id: 'var-10',
        stock_quantity: 4,
      };

      const mockOrder: any = {
        id: 'ord-expired-1',
        user_id: 'user-expired',
        status: OrderStatus.PENDING,
        created_at: new Date(Date.now() - 35 * 60 * 1000), // Tạo 35 phút trước
        items: [{ variant_id: 'var-10', quantity: 2 }],
        payments: [{ id: 'pay-1', method: PaymentMethod.BANK_TRANSFER, status: PaymentStatus.PENDING }],
        shipping_snapshot: { payos_order_code: 123456 },
      };

      const qbMock: any = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockOrder]),
      };

      orderRepo.createQueryBuilder = jest.fn().mockReturnValue(qbMock);

      mockQueryRunner.manager.findOne.mockImplementation((entity: any, opts: any) => {
        if (entity?.name === 'Order' || opts?.where?.id === 'ord-expired-1') {
          return Promise.resolve(mockOrder);
        }
        if (entity?.name === 'ProductVariant' || opts?.where?.id === 'var-10') {
          return Promise.resolve(mockVariant);
        }
        return Promise.resolve(null);
      });

      mockQueryRunner.manager.find.mockImplementation((entity: any) => {
        if (entity?.name === 'Payment' || entity === Payment) {
          return Promise.resolve(mockOrder.payments);
        }
        return Promise.resolve(mockOrder.items);
      });

      const count = await service.autoCancelExpiredOnlineOrders(30);

      expect(count).toBe(1);
      expect(mockOrder.status).toBe(OrderStatus.CANCELLED);
      expect(mockOrder.shipping_snapshot.cancel_reason).toContain('30 phút');
      expect(mockVariant.stock_quantity).toBe(6);
      expect(mockOrder.payments[0].status).toBe(PaymentStatus.FAILED);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('trả về 0 nếu không có đơn hàng nào quá hạn thanh toán', async () => {
      const qbMock: any = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      orderRepo.createQueryBuilder = jest.fn().mockReturnValue(qbMock);

      const count = await service.autoCancelExpiredOnlineOrders(30);
      expect(count).toBe(0);
    });
  });

  describe('Đổi phương thức thanh toán sang COD (switchPaymentMethodToCod)', () => {
    it('chuyển đổi phương thức thanh toán sang COD thành công cho đơn PENDING', async () => {
      const mockPayment: any = {
        id: 'pay-online-1',
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING,
      };

      const mockOrder: any = {
        id: 'ord-switch-1',
        user_id: 'user-owner',
        status: OrderStatus.PENDING,
        payments: [mockPayment],
        shipping_snapshot: { payos_order_code: 999888 },
      };

      orderRepo.findOne = jest.fn().mockResolvedValue(mockOrder);
      paymentRepo.save = jest.fn().mockResolvedValue(mockPayment);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder as any);

      const result = await service.switchPaymentMethodToCod('ord-switch-1', 'user-owner');

      expect(mockPayment.method).toBe(PaymentMethod.COD);
      expect(paymentRepo.save).toHaveBeenCalledWith(mockPayment);
      expect(result.id).toBe('ord-switch-1');
    });

    it('báo lỗi BadRequestException nếu không phải chủ đơn hàng', async () => {
      const mockOrder: any = {
        id: 'ord-switch-1',
        user_id: 'user-owner',
        status: OrderStatus.PENDING,
        payments: [],
      };

      orderRepo.findOne = jest.fn().mockResolvedValue(mockOrder);

      await expect(
        service.switchPaymentMethodToCod('ord-switch-1', 'other-user'),
      ).rejects.toThrow('Bạn không có quyền thay đổi đơn hàng này');
    });

    it('báo lỗi BadRequestException nếu đơn hàng không ở trạng thái PENDING', async () => {
      const mockOrder: any = {
        id: 'ord-switch-1',
        user_id: 'user-owner',
        status: OrderStatus.CONFIRMED,
        payments: [],
      };

      orderRepo.findOne = jest.fn().mockResolvedValue(mockOrder);

      await expect(
        service.switchPaymentMethodToCod('ord-switch-1', 'user-owner'),
      ).rejects.toThrow('Chỉ có thể đổi phương thức thanh toán khi đơn hàng đang chờ thanh toán');
    });
  });
});
