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
      manager: {
        createQueryBuilder: jest.fn(),
        transaction: jest.fn(),
      },
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

  describe('Xóa sản phẩm (Delete Product)', () => {
    it('xóa vĩnh viễn khỏi DB và unbind variant trong order_items an toàn', async () => {
      const mockProduct = { id: 'p1', name: 'Áo thun Nam', is_active: true, variants: [{ id: 'v1' }] };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockProduct as any);
      productRepo.manager.transaction = jest.fn().mockImplementation(async (cb) =>
        cb({
          createQueryBuilder: jest.fn().mockReturnValue({
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({}),
          }),
          delete: jest.fn().mockResolvedValue({}),
        }),
      );

      const result = await service.remove('p1');

      expect(result.deleted).toBe(true);
      expect(result.message).toContain('Đã xóa vĩnh viễn');
    });

    it('hỗ trợ xóa hàng loạt (removeBatch) an toàn trong một transaction', async () => {
      const mockProducts = [
        { id: 'p1', name: 'SP 1', variants: [{ id: 'v1' }] },
        { id: 'p2', name: 'SP 2', variants: [{ id: 'v2' }] },
      ];
      jest.spyOn(productRepo, 'find').mockResolvedValue(mockProducts as any);
      productRepo.manager.transaction = jest.fn().mockImplementation(async (cb) =>
        cb({
          createQueryBuilder: jest.fn().mockReturnValue({
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({}),
          }),
        }),
      );

      const result = await service.removeBatch(['p1', 'p2']);

      expect(result.deleted).toBe(true);
      expect(result.count).toBe(2);
    });
  });

  describe('Tạo sản phẩm kèm biến thể (Create with Variants)', () => {
    it('tạo sản phẩm và các biến thể an toàn khi không có brand_id (không bị null brand.code)', async () => {
      const dto = {
        name: 'Áo thun DirtyCoins Soccer Jersey',
        code: 'TEE-DIRTY-01',
        slug: 'ao-thun-dirty-coins',
        description: 'Mô tả',
        category_id: 'cat-1',
        base_price: 250000,
        is_active: true,
        variants: [{ size_id: 's1', color_id: 'c1', stock_quantity: 50 }],
      };

      jest.spyOn(service as any, 'findOne').mockResolvedValue({ id: 'p1', name: dto.name, code: dto.code } as any);
      jest.spyOn(service, 'addVariant').mockResolvedValue({ id: 'v1' } as any);

      (service as any).categoryRepo.findOne = jest.fn().mockResolvedValue({ id: 'cat-1', name: 'Áo thun' });
      (productRepo.findOne as jest.Mock).mockResolvedValue(null);
      (productRepo.create as jest.Mock).mockImplementation((val) => ({ id: 'p1', ...val }));
      (productRepo.save as jest.Mock).mockImplementation((val) => Promise.resolve({ id: 'p1', ...val }));

      const res = await service.create(dto as any);
      expect(res).toBeDefined();
      expect(service.addVariant).toHaveBeenCalledWith('p1', dto.variants[0], 'GEN', dto.code);
    });
  });

  describe('Quản lý Màu sắc (Color Management)', () => {
    it('tạo màu sắc mới thành công và chuẩn hóa chữ in hoa cho mã SKU', async () => {
      const colorRepo = (service as any).colorRepo;
      colorRepo.createQueryBuilder = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });
      colorRepo.create = jest.fn((dto) => dto);
      colorRepo.save = jest.fn((entity) => Promise.resolve({ id: 'c-1', ...entity }));

      const res = await service.createColor({
        name: ' Xanh Rêu ',
        code: ' xre ',
        hex_code: '#2e4f4f',
      });

      expect(res.name).toBe('Xanh Rêu');
      expect(res.code).toBe('XRE');
      expect(res.hex_code).toBe('#2E4F4F');
    });

    it('tự động sinh mã SKU từ tên màu khi người dùng không nhập code', async () => {
      const colorRepo = (service as any).colorRepo;
      colorRepo.createQueryBuilder = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });
      colorRepo.findOne = jest.fn().mockResolvedValue(null);
      colorRepo.create = jest.fn((dto) => dto);
      colorRepo.save = jest.fn((entity) => Promise.resolve({ id: 'c-2', ...entity }));

      const res = await service.createColor({
        name: 'Hồng Pastel',
        hex_code: '#F8C8DC',
      });

      expect(res.name).toBe('Hồng Pastel');
      expect(res.code).toBe('HPA');
      expect(res.hex_code).toBe('#F8C8DC');
    });

    it('từ chối xóa màu sắc nếu đang được sử dụng bởi biến thể sản phẩm', async () => {
      const colorRepo = (service as any).colorRepo;
      const variantRepo = (service as any).variantRepo;

      colorRepo.findOne = jest.fn().mockResolvedValue({ id: 'c-1', name: 'Đen' });
      variantRepo.count = jest.fn().mockResolvedValue(3);

      await expect(service.deleteColor('c-1')).rejects.toThrow(
        'Không thể xóa màu "Đen" vì đang được sử dụng bởi 3 biến thể sản phẩm',
      );
    });

    it('xóa màu sắc thành công nếu không có biến thể nào sử dụng', async () => {
      const colorRepo = (service as any).colorRepo;
      const variantRepo = (service as any).variantRepo;
      const imageRepo = (service as any).imageRepo;

      colorRepo.findOne = jest.fn().mockResolvedValue({ id: 'c-2', name: 'Màu Tạm' });
      variantRepo.count = jest.fn().mockResolvedValue(0);
      imageRepo.update = jest.fn().mockResolvedValue({ affected: 0 });
      colorRepo.remove = jest.fn().mockResolvedValue(true);

      const res = await service.deleteColor('c-2');
      expect(res.success).toBe(true);
      expect(colorRepo.remove).toHaveBeenCalled();
    });
  });

  describe('Xóa biến thể sản phẩm (Variant Deletion)', () => {
    it('ném lỗi NotFoundException nếu biến thể không tồn tại trong sản phẩm', async () => {
      const variantRepo = (service as any).variantRepo;
      variantRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.removeVariant('prod-1', 'non-existent')).rejects.toThrow(
        'Biến thể không tồn tại trong sản phẩm này',
      );
    });

    it('xóa biến thể thành công và ghi nhận audit log', async () => {
      const variantRepo = (service as any).variantRepo;
      const auditLogsService = (service as any).auditLogsService;

      const mockVariant = {
        id: 'var-1',
        product_id: 'prod-1',
        sku: 'GEN-SP-0268-9MQ0-M-WHT',
        size: { name: 'M' },
        color: { name: 'Trắng' },
      };

      variantRepo.findOne = jest.fn().mockResolvedValue(mockVariant);
      variantRepo.remove = jest.fn().mockResolvedValue(mockVariant);
      auditLogsService.log = jest.fn().mockResolvedValue(true);

      const res = await service.removeVariant('prod-1', 'var-1', 'admin-user-1');

      expect(res.id).toBe('var-1');
      expect(res.message).toContain('GEN-SP-0268-9MQ0-M-WHT');
      expect(variantRepo.remove).toHaveBeenCalledWith(mockVariant);
      expect(auditLogsService.log).toHaveBeenCalledWith(
        'admin-user-1',
        'DELETE_PRODUCT_VARIANT',
        'ProductVariant',
        'var-1',
        expect.objectContaining({
          sku: 'GEN-SP-0268-9MQ0-M-WHT',
          size: 'M',
          color: 'Trắng',
        }),
      );
    });
  });
});
