import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Size } from './entities/size.entity';
import { Color } from './entities/color.entity';
import { Brand } from '../brands/entities/brand.entity';
import { Category } from '../categories/entities/category.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepo: any;

  beforeEach(async () => {
    productRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(ProductImage), useValue: {} },
        { provide: getRepositoryToken(ProductVariant), useValue: {} },
        { provide: getRepositoryToken(Size), useValue: { find: jest.fn().mockResolvedValue([]), findOne: jest.fn() } },
        { provide: getRepositoryToken(Color), useValue: { find: jest.fn().mockResolvedValue([]), findOne: jest.fn() } },
        { provide: getRepositoryToken(Brand), useValue: {} },
        { provide: getRepositoryToken(Category), useValue: {} },
        { provide: AuditLogsService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('nên được khởi tạo thành công', () => {
    expect(service).toBeDefined();
  });

  describe('Tự động sinh mã SKU', () => {
    it('sinh mã SKU chính xác theo định dạng {brand}-{product}-{size}-{color}', () => {
      const sku = service.generateSku('NK', 'TEE01', 'L', 'BLK');
      expect(sku).toBe('NK-TEE01-L-BLK');
    });

    it('chuyển mã SKU về dạng in hoa toàn bộ', () => {
      const sku = service.generateSku('nk', 'tee01', 'l', 'blk');
      expect(sku).toBe('NK-TEE01-L-BLK');
    });
  });

  describe('Tính toán Giá hiệu lực (Effective Price Fallback)', () => {
    it('trả về price_override nếu biến thể có ghi đè giá', () => {
      const price = service.calculateEffectivePrice(250000, 200000);
      expect(price).toBe(200000);
    });

    it('fallback về base_price của sản phẩm nếu price_override bằng null hoặc 0', () => {
      const priceNull = service.calculateEffectivePrice(250000, null as any);
      expect(priceNull).toBe(250000);

      const priceZero = service.calculateEffectivePrice(250000, 0);
      expect(priceZero).toBe(250000);
    });
  });

  describe('Soft Delete sản phẩm', () => {
    it('chuyển is_active thành false thay vì xóa cứng khỏi DB', async () => {
      const mockProduct = { id: 'p1', name: 'Áo thun Nam', is_active: true };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockProduct as any);

      const result = await service.remove('p1');

      expect(mockProduct.is_active).toBe(false);
      expect(productRepo.save).toHaveBeenCalledWith(mockProduct);
      expect(result.message).toContain('Soft delete');
    });
  });
});
