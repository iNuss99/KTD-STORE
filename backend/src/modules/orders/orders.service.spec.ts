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
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../common/enums/order.enum';
import { UserRole } from '../../common/enums/role.enum';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepo: any;
  let addressRepo: any;
  let paymentRepo: any;
  let auditLogsService: any;
  let discountsService: any;
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

    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
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
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('nên được khởi tạo thành công', () => {
    expect(service).toBeDefined();
  });

  describe('Tạo Đơn hàng & Trừ tồn kho Concurrency (FOR UPDATE)', () => {
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
        if (opts?.lock?.mode === 'pessimistic_write') {
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
      expect(mockOrder.status).toBe(OrderStatus.PROCESSING);
      expect(paymentRepo.save).toHaveBeenCalledWith(mockPayment);
      expect(orderRepo.save).toHaveBeenCalledWith(mockOrder);
    });
  });
});
