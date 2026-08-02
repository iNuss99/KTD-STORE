import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { Discount } from './entities/discount.entity';
import { DiscountScope } from './entities/discount-scope.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Cart } from '../cart/entities/cart.entity';
import { DiscountType } from '../../common/enums/discount.enum';

import { AuditLogsService } from '../audit-logs/audit-logs.service';

describe('DiscountsService', () => {
  let service: DiscountsService;
  let discountRepo: any;
  let discountScopeRepo: any;
  let variantRepo: any;
  let cartRepo: any;
  let auditLogsService: any;

  beforeEach(async () => {
    auditLogsService = { log: jest.fn() };
    discountRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ ...dto, id: 'disc-1' })),
      save: jest.fn((e) => Promise.resolve(e)),
      remove: jest.fn((e) => Promise.resolve(e)),
      manager: {
        findOne: jest.fn(),
      },
    };

    discountScopeRepo = {
      create: jest.fn((dto) => ({ ...dto, id: 'scope-1' })),
      delete: jest.fn(),
    };

    variantRepo = {};
    cartRepo = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountsService,
        { provide: getRepositoryToken(Discount), useValue: discountRepo },
        { provide: getRepositoryToken(DiscountScope), useValue: discountScopeRepo },
        { provide: getRepositoryToken(ProductVariant), useValue: variantRepo },
        { provide: getRepositoryToken(Cart), useValue: cartRepo },
        { provide: AuditLogsService, useValue: auditLogsService },
      ],
    }).compile();

    service = module.get<DiscountsService>(DiscountsService);
  });

  it('nên được khởi tạo thành công', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('tạo mã giảm giá mới thành công', async () => {
      discountRepo.findOne.mockResolvedValue(null);

      const dto = {
        code: 'summer10',
        discount_type: DiscountType.PERCENTAGE,
        value: 10,
        valid_from: '2026-01-01T00:00:00.000Z',
        valid_to: '2026-12-31T23:59:59.000Z',
      };

      const result = await service.create(dto as any);

      expect(discountRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'SUMMER10',
          discount_type: DiscountType.PERCENTAGE,
          value: 10,
        }),
      );
      expect(result.code).toBe('SUMMER10');
    });

    it('báo lỗi nếu mã trùng lặp', async () => {
      discountRepo.findOne.mockResolvedValue({ id: 'existing-id', code: 'SUMMER10' });

      const dto = {
        code: 'SUMMER10',
        discount_type: DiscountType.PERCENTAGE,
        value: 10,
        valid_from: '2026-01-01T00:00:00.000Z',
        valid_to: '2026-12-31T23:59:59.000Z',
      };

      await expect(service.create(dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateAndCalculate', () => {
    it('tính toán số tiền giảm % thành công cho toàn hệ thống', async () => {
      const mockDiscount = {
        id: 'disc-1',
        code: 'SUMMER10',
        discount_type: DiscountType.PERCENTAGE,
        value: 10,
        max_uses: 100,
        used_count: 0,
        valid_from: new Date('2026-01-01'),
        valid_to: new Date('2026-12-31'),
        min_order_amount: 100000,
        is_active: true,
        scopes: [],
      };

      const mockVariant = {
        id: 'var-1',
        is_active: true,
        price_override: null,
        product: { base_price: 200000, is_active: true },
      };

      discountRepo.manager.findOne.mockImplementation((cls: any, opts: any) => {
        if (cls === Discount) return Promise.resolve(mockDiscount);
        if (cls === ProductVariant) return Promise.resolve(mockVariant);
        return Promise.resolve(null);
      });

      const items = [{ variant_id: 'var-1', quantity: 2 }];
      const res = await service.validateAndCalculate('SUMMER10', 'user-1', items);

      expect(res.discount_amount).toBe(40000); // 10% of 400,000 VND
      expect(res.applicable_subtotal).toBe(400000);
    });

    it('báo lỗi nếu mã giảm giá đã hết hạn', async () => {
      const mockDiscount = {
        id: 'disc-1',
        code: 'EXPIRED',
        discount_type: DiscountType.FIXED_AMOUNT,
        value: 50000,
        max_uses: 100,
        used_count: 0,
        valid_from: new Date('2025-01-01'),
        valid_to: new Date('2025-12-31'), // Expired
        min_order_amount: 0,
        is_active: true,
        scopes: [],
      };

      discountRepo.manager.findOne.mockResolvedValue(mockDiscount);

      await expect(
        service.validateAndCalculate('EXPIRED', 'user-1', [{ variant_id: 'var-1', quantity: 1 }]),
      ).rejects.toThrow(BadRequestException);
    });

    it('báo lỗi nếu đơn hàng không đạt giá trị tối thiểu (min_order_amount)', async () => {
      const mockDiscount = {
        id: 'disc-1',
        code: 'BIGDISCOUNT',
        discount_type: DiscountType.FIXED_AMOUNT,
        value: 100000,
        max_uses: 100,
        used_count: 0,
        valid_from: new Date('2026-01-01'),
        valid_to: new Date('2026-12-31'),
        min_order_amount: 1000000, // Requires 1,000,000 VND
        is_active: true,
        scopes: [],
      };

      const mockVariant = {
        id: 'var-1',
        is_active: true,
        product: { base_price: 200000, is_active: true },
      };

      discountRepo.manager.findOne.mockImplementation((cls: any) => {
        if (cls === Discount) return Promise.resolve(mockDiscount);
        if (cls === ProductVariant) return Promise.resolve(mockVariant);
        return Promise.resolve(null);
      });

      await expect(
        service.validateAndCalculate('BIGDISCOUNT', 'user-1', [{ variant_id: 'var-1', quantity: 1 }]),
      ).rejects.toThrow(BadRequestException);
    });

    it('áp dụng thành công cho danh mục nằm trong DiscountScope', async () => {
      const mockDiscount = {
        id: 'disc-1',
        code: 'SHIRT20',
        discount_type: DiscountType.PERCENTAGE,
        value: 20,
        max_uses: 100,
        used_count: 0,
        valid_from: new Date('2026-01-01'),
        valid_to: new Date('2026-12-31'),
        min_order_amount: 0,
        is_active: true,
        scopes: [{ category_id: 'cat-shirts' }],
      };

      const mockVariant = {
        id: 'var-shirt',
        is_active: true,
        product: { category_id: 'cat-shirts', base_price: 300000, is_active: true },
      };

      discountRepo.manager.findOne.mockImplementation((cls: any) => {
        if (cls === Discount) return Promise.resolve(mockDiscount);
        if (cls === ProductVariant) return Promise.resolve(mockVariant);
        return Promise.resolve(null);
      });

      const res = await service.validateAndCalculate('SHIRT20', 'user-1', [{ variant_id: 'var-shirt', quantity: 1 }]);

      expect(res.discount_amount).toBe(60000); // 20% of 300,000 VND
    });
  });
});
