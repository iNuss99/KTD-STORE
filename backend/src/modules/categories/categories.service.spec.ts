import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepo: any;
  let productRepo: any;
  let auditLogsService: any;

  beforeEach(async () => {
    categoryRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: 'cat-1', ...entity })),
      remove: jest.fn().mockResolvedValue(true),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn().mockResolvedValue(true),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        loadRelationCountAndMap: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
        getMany: jest.fn().mockResolvedValue([]),
      }),
    };

    productRepo = {
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn().mockResolvedValue(true),
    };

    auditLogsService = {
      log: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: categoryRepo,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: productRepo,
        },
        {
          provide: AuditLogsService,
          useValue: auditLogsService,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('nên được khởi tạo thành công', () => {
    expect(service).toBeDefined();
  });

  describe('Tạo Slug tự động (generateSlugFromName)', () => {
    it('chuyển đổi tiếng Việt có dấu sang slug chuẩn SEO không dấu', () => {
      expect(service.generateSlugFromName('Áo Sơ Mi Nam')).toBe('ao-so-mi-nam');
      expect(service.generateSlugFromName('Đầm & Váy Dự Tiệc')).toBe('dam-vay-du-tiec');
      expect(service.generateSlugFromName('Quần Đùi / Shorts')).toBe('quan-dui-shorts');
    });
  });

  describe('Thêm danh mục (create)', () => {
    it('tự động sinh slug nếu người dùng không truyền slug', async () => {
      const res = await service.create({
        name: 'Áo Len Cổ Lọ',
      });

      expect(res.name).toBe('Áo Len Cổ Lọ');
      expect(res.slug).toBe('ao-len-co-lo');
      expect(categoryRepo.save).toHaveBeenCalled();
    });

    it('từ chối tạo nếu tên danh mục đã tồn tại', async () => {
      categoryRepo.createQueryBuilder = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'c-old', name: 'Áo Thun' }),
      });

      await expect(service.create({ name: 'Áo Thun' })).rejects.toThrow(
        'Tên danh mục "Áo Thun" đã tồn tại.',
      );
    });

    it('từ chối tạo nếu slug URL đã được sử dụng', async () => {
      categoryRepo.findOne = jest.fn().mockResolvedValue({ id: 'c-old', slug: 'ao-polo' });

      await expect(
        service.create({ name: 'Áo Polo Thể Thao', slug: 'ao-polo' }),
      ).rejects.toThrow('Slug URL "ao-polo" đã được sử dụng.');
    });
  });

  describe('Cập nhật danh mục (update)', () => {
    it('cập nhật thành công tên và slug', async () => {
      categoryRepo.findOne = jest.fn().mockResolvedValue({
        id: 'cat-1',
        name: 'Áo Khoác',
        slug: 'ao-khoac',
      });

      const res = await service.update('cat-1', {
        name: 'Áo Khoác Nam',
        slug: 'ao-khoac-nam',
      });

      expect(res.name).toBe('Áo Khoác Nam');
      expect(res.slug).toBe('ao-khoac-nam');
    });

    it('từ chối nếu danh mục tự làm cha của chính nó', async () => {
      categoryRepo.findOne = jest.fn().mockResolvedValue({
        id: 'cat-1',
        name: 'Áo Khoác',
        slug: 'ao-khoac',
      });

      await expect(
        service.update('cat-1', {
          parent_id: 'cat-1',
        }),
      ).rejects.toThrow('Danh mục không thể làm cha của chính nó');
    });
  });

  describe('Xóa danh mục (remove)', () => {
    it('tự động gỡ liên kết sản phẩm (set category_id null) và xóa danh mục an toàn', async () => {
      categoryRepo.findOne = jest.fn().mockResolvedValue({
        id: 'cat-1',
        name: 'Áo Sơ Mi',
        slug: 'ao-so-mi',
      });

      const res = await service.remove('cat-1', 'admin-id');

      expect(productRepo.update).toHaveBeenCalledWith(
        { category_id: 'cat-1' },
        { category_id: null },
      );
      expect(categoryRepo.update).toHaveBeenCalledWith(
        { parent_id: 'cat-1' },
        { parent_id: null },
      );
      expect(categoryRepo.remove).toHaveBeenCalled();
      expect(auditLogsService.log).toHaveBeenCalledWith(
        'admin-id',
        'DELETE_CATEGORY',
        'Category',
        'cat-1',
        expect.any(Object),
      );
      expect(res.success).toBe(true);
    });
  });
});
