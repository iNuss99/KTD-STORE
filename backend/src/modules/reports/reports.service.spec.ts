import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Payment } from '../orders/entities/payment.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { User } from '../users/entities/user.entity';
import { ReturnRequest } from '../returns/entities/return-request.entity';
import { OrderStatus } from '../../common/enums/order.enum';

describe('ReportsService', () => {
  let service: ReportsService;
  let orderRepo: any;
  let orderItemRepo: any;
  let variantRepo: any;
  let paymentRepo: any;
  let userRepo: any;
  let returnRepo: any;

  beforeEach(async () => {
    orderRepo = {
      find: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    orderItemRepo = {
      createQueryBuilder: jest.fn(),
    };
    variantRepo = {
      count: jest.fn(),
      find: jest.fn(),
    };
    paymentRepo = {
      find: jest.fn(),
    };
    userRepo = {
      find: jest.fn(),
    };
    returnRepo = {
      find: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: orderItemRepo },
        { provide: getRepositoryToken(ProductVariant), useValue: variantRepo },
        { provide: getRepositoryToken(Payment), useValue: paymentRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(ReturnRequest), useValue: returnRepo },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should compute overview KPI metrics accurately', async () => {
    orderRepo.find.mockResolvedValue([
      { id: 'o1', total: 500000, status: OrderStatus.DELIVERED },
      { id: 'o2', total: 300000, status: OrderStatus.DELIVERED },
    ]);
    orderRepo.count.mockResolvedValue(3);
    variantRepo.count.mockResolvedValue(2);

    const overview = await service.getOverview();

    expect(overview.totalRevenue).toBe(800000);
    expect(overview.totalCompletedOrders).toBe(2);
    expect(overview.pendingOrdersCount).toBe(3);
    expect(overview.lowStockCount).toBe(2);
  });

  it('should return revenue grouped by period', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        { id: 'o1', total: 200000, created_at: new Date('2026-07-28T10:00:00Z') },
        { id: 'o2', total: 150000, created_at: new Date('2026-07-28T14:00:00Z') },
        { id: 'o3', total: 300000, created_at: new Date('2026-07-29T09:00:00Z') },
      ]),
    };
    orderRepo.createQueryBuilder.mockReturnValue(qb);

    const report = await service.getRevenueReport({ startDate: '2026-07-01', endDate: '2026-07-31' });

    expect(report.length).toBe(2);
    expect(report[0].period).toBe('2026-07-28');
    expect(report[0].revenue).toBe(350000);
    expect(report[0].orderCount).toBe(2);
    expect(report[1].period).toBe('2026-07-29');
    expect(report[1].revenue).toBe(300000);
  });

  it('should return top selling products', async () => {
    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        { product_name: 'Áo Sơ Mi Nam', sku: 'SM-01', quantity: 2, price: 250000 },
        { product_name: 'Áo Sơ Mi Nam', sku: 'SM-01', quantity: 3, price: 250000 },
        { product_name: 'Quần Tay Nam', sku: 'QT-01', quantity: 1, price: 400000 },
      ]),
    };
    orderItemRepo.createQueryBuilder.mockReturnValue(qb);

    const top = await service.getTopProducts(5);

    expect(top.length).toBe(2);
    expect(top[0].productName).toBe('Áo Sơ Mi Nam');
    expect(top[0].totalQuantity).toBe(5);
    expect(top[0].totalRevenue).toBe(1250000);
  });

  it('should list low stock variants', async () => {
    variantRepo.find.mockResolvedValue([
      {
        id: 'v1',
        sku: 'TSHIRT-L-BLK',
        stock_quantity: 2,
        price_override: 199000,
        product: { name: 'Áo Thun Basic' },
        size: { name: 'L' },
        color: { name: 'Black' },
      },
    ]);

    const lowStock = await service.getLowStockVariants(5);

    expect(lowStock.length).toBe(1);
    expect(lowStock[0].sku).toBe('TSHIRT-L-BLK');
    expect(lowStock[0].stockQuantity).toBe(2);
  });

  it('should compute staff order processing performance', async () => {
    paymentRepo.find.mockResolvedValue([
      {
        confirmed_by: 'staff-1',
        confirmed_user: { full_name: 'Staff One', email: 'staff1@menwear.com' },
        order: { total: 500000 },
      },
      {
        confirmed_by: 'staff-1',
        confirmed_user: { full_name: 'Staff One', email: 'staff1@menwear.com' },
        order: { total: 300000 },
      },
    ]);

    const perf = await service.getStaffPerformance();

    expect(perf.length).toBe(1);
    expect(perf[0].staffName).toBe('Staff One');
    expect(perf[0].confirmedOrdersCount).toBe(2);
    expect(perf[0].totalAmount).toBe(800000);
  });
});
