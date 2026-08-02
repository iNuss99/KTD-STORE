import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { ReturnRequest } from './entities/return-request.entity';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../orders/entities/payment.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ReturnStatus } from '../../common/enums/return.enum';
import { OrderStatus, PaymentStatus } from '../../common/enums/order.enum';
import { SystemConfigsService } from '../system-configs/system-configs.service';

describe('ReturnsService', () => {
  let service: ReturnsService;
  let returnRepo: any;
  let orderRepo: any;
  let paymentRepo: any;
  let auditLogsService: any;
  let systemConfigsService: any;
  let mockQueryRunner: any;

  beforeEach(async () => {
    systemConfigsService = {
      getNumber: jest.fn().mockResolvedValue(7),
      getValue: jest.fn().mockResolvedValue('7'),
    };

    returnRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ ...dto, id: 'ret-1' })),
      save: jest.fn((e) => Promise.resolve(e)),
    };

    orderRepo = {
      findOne: jest.fn(),
      save: jest.fn((e) => Promise.resolve(e)),
    };

    paymentRepo = {
      save: jest.fn((e) => Promise.resolve(e)),
    };

    auditLogsService = {
      log: jest.fn().mockResolvedValue({}),
    };

    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        save: jest.fn((e) => Promise.resolve(e)),
      },
    };

    const dataSourceMock = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReturnsService,
        { provide: getRepositoryToken(ReturnRequest), useValue: returnRepo },
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(Payment), useValue: paymentRepo },
        { provide: DataSource, useValue: dataSourceMock },
        { provide: AuditLogsService, useValue: auditLogsService },
        { provide: SystemConfigsService, useValue: systemConfigsService },
      ],
    }).compile();

    service = module.get<ReturnsService>(ReturnsService);
  });

  it('nên được khởi tạo thành công', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('tạo yêu cầu đổi trả thành công cho đơn hàng DELIVERED trong vòng 7 ngày', async () => {
      const mockOrder = {
        id: 'ord-1',
        user_id: 'user-1',
        status: OrderStatus.DELIVERED,
        delivered_at: new Date(), // Delivered today
      };

      orderRepo.findOne.mockResolvedValue(mockOrder);
      returnRepo.findOne.mockResolvedValue(null);

      const dto = { order_id: 'ord-1', reason: 'Áo quá chật' };
      const result = await service.create('user-1', dto);

      expect(returnRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          order_id: 'ord-1',
          user_id: 'user-1',
          reason: 'Áo quá chật',
          status: ReturnStatus.REQUESTED,
        }),
      );
      expect(result.id).toBe('ret-1');
    });

    it('báo lỗi nếu đơn hàng chưa ở trạng thái DELIVERED', async () => {
      const mockOrder = {
        id: 'ord-1',
        user_id: 'user-1',
        status: OrderStatus.SHIPPING,
      };

      orderRepo.findOne.mockResolvedValue(mockOrder);

      const dto = { order_id: 'ord-1', reason: 'Muốn đổi mẫu' };
      await expect(service.create('user-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('báo lỗi nếu đơn hàng đã quá 7 ngày kể từ khi nhận', async () => {

      const mockOrder = {
        id: 'ord-1',
        user_id: 'user-1',
        status: OrderStatus.DELIVERED,
        delivered_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      };

      orderRepo.findOne.mockResolvedValue(mockOrder);

      const dto = { order_id: 'ord-1', reason: 'Đã dùng 10 ngày' };
      await expect(service.create('user-1', dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus & Stock restoration / Refund', () => {
    it('cho phép Manager duyệt yêu cầu đổi trả (APPROVED)', async () => {
      const mockReturn = {
        id: 'ret-1',
        status: ReturnStatus.REQUESTED,
        order: { items: [], payments: [] },
      };

      mockQueryRunner.manager.findOne.mockResolvedValue(mockReturn);
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockReturn as any)
        .mockResolvedValueOnce({ ...mockReturn, status: ReturnStatus.APPROVED } as any);

      const result = await service.updateStatus(
        'ret-1',
        { status: ReturnStatus.APPROVED },
        { id: 'mgr-1' },
      );

      expect(mockReturn.status).toBe(ReturnStatus.APPROVED);
      expect(result.status).toBe(ReturnStatus.APPROVED);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('tự động cộng lại tồn kho khi Staff nhận hàng hoàn về kho (RECEIVED)', async () => {
      const mockVariant = {
        id: 'var-1',
        stock_quantity: 5,
      };

      const mockReturn = {
        id: 'ret-1',
        status: ReturnStatus.APPROVED,
        order: {
          items: [{ variant_id: 'var-1', quantity: 2 }],
          payments: [],
        },
      };

      mockQueryRunner.manager.findOne.mockImplementation((cls: any, opts: any) => {
        if (cls === ReturnRequest) return Promise.resolve(mockReturn);
        if (cls === ProductVariant) return Promise.resolve(mockVariant);
        if (cls === Order) return Promise.resolve(mockReturn.order);
        return Promise.resolve(null);
      });

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockReturn as any)
        .mockResolvedValueOnce({ ...mockReturn, status: ReturnStatus.RECEIVED } as any);

      await service.updateStatus('ret-1', { status: ReturnStatus.RECEIVED }, { id: 'staff-1' });

      expect(mockVariant.stock_quantity).toBe(7); // Restored +2
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(mockVariant);
    });

    it('cập nhật Payment status = REFUNDED khi Manager hoàn tiền (REFUNDED)', async () => {
      const mockPayment = {
        id: 'pay-1',
        status: PaymentStatus.COMPLETED,
        refund_amount: null,
      };

      const mockReturn = {
        id: 'ret-1',
        status: ReturnStatus.RECEIVED,
        order: {
          total: 500000,
          items: [],
          payments: [mockPayment],
        },
      };

      mockQueryRunner.manager.findOne.mockImplementation((cls: any) => {
        if (cls === ReturnRequest) return Promise.resolve(mockReturn);
        if (cls === Payment) return Promise.resolve(mockPayment);
        if (cls === Order) return Promise.resolve(mockReturn.order);
        return Promise.resolve(null);
      });

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockReturn as any)
        .mockResolvedValueOnce({ ...mockReturn, status: ReturnStatus.REFUNDED } as any);

      await service.updateStatus(
        'ret-1',
        { status: ReturnStatus.REFUNDED, refund_amount: 500000 },
        { id: 'mgr-1' },
      );

      expect(mockPayment.status).toBe(PaymentStatus.REFUNDED);
      expect(mockPayment.refund_amount).toBe(500000);
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(mockPayment);
    });
  });
});
