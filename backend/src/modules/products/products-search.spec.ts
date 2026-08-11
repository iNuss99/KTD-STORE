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

describe('ProductsService Search & Discovery', () => {
  let service: ProductsService;
  let queryBuilderMock: any;

  const mockProductList = [
    {
      id: 'prod-1',
      name: 'Áo Polo Nam Pique Cotton Basic',
      code: 'POLOBASIC',
      slug: 'ao-polo-nam-pique-cotton-basic',
      base_price: 299000,
      is_active: true,
      brand: { id: 'brand-1', name: 'MenWear' },
      category: { id: 'cat-1', name: 'Áo Polo' },
      images: [{ id: 'img-1', url: 'https://example.com/polo.jpg' }],
      variants: [],
    },
    {
      id: 'prod-2',
      name: 'Áo Sơ Mi Nam Oxford Premium',
      code: 'SOMIXFORD',
      slug: 'ao-so-mi-nam-oxford-premium',
      base_price: 350000,
      is_active: true,
      brand: { id: 'brand-1', name: 'MenWear' },
      category: { id: 'cat-2', name: 'Áo Sơ Mi' },
      images: [{ id: 'img-2', url: 'https://example.com/somi.jpg' }],
      variants: [],
    },
  ];

  beforeEach(async () => {
    queryBuilderMock = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([mockProductList, 2]),
      getMany: jest.fn().mockResolvedValue(mockProductList),
    };

    const mockRepo = {
      createQueryBuilder: jest.fn(() => queryBuilderMock),
      count: jest.fn().mockResolvedValue(10),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
      create: jest.fn().mockImplementation((e) => e),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: mockRepo },
        { provide: getRepositoryToken(ProductImage), useValue: mockRepo },
        { provide: getRepositoryToken(ProductVariant), useValue: mockRepo },
        { provide: getRepositoryToken(Size), useValue: mockRepo },
        { provide: getRepositoryToken(Color), useValue: mockRepo },
        { provide: getRepositoryToken(Brand), useValue: mockRepo },
        { provide: getRepositoryToken(Category), useValue: mockRepo },
        {
          provide: AuditLogsService,
          useValue: { log: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('findAll with search queries', () => {
    it('should query products using unaccent search condition', async () => {
      const result = await service.findAll({ search: 'ao polo' });

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('unaccent(product.name::text) ILIKE unaccent(:search)'),
        { search: '%ao polo%' },
      );
      expect(result.data.length).toBe(2);
      expect(result.meta.total).toBe(2);
    });

    it('should support combining category and search filters', async () => {
      await service.findAll({ search: 'sơ mi', category_id: 'cat-2' });

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'product.category_id = :categoryId',
        { categoryId: 'cat-2' },
      );
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('unaccent'),
        { search: '%sơ mi%' },
      );
    });
  });

  describe('autocomplete', () => {
    it('should return empty array when query is empty or whitespace', async () => {
      const res1 = await service.autocomplete('');
      const res2 = await service.autocomplete('   ');

      expect(res1).toEqual([]);
      expect(res2).toEqual([]);
      expect(queryBuilderMock.getMany).not.toHaveBeenCalled();
    });

    it('should return formatted suggestions with thumbnail, brand, and category', async () => {
      const suggestions = await service.autocomplete('polo', 5);

      expect(queryBuilderMock.take).toHaveBeenCalledWith(5);
      expect(suggestions.length).toBe(2);
      expect(suggestions[0]).toEqual({
        id: 'prod-1',
        name: 'Áo Polo Nam Pique Cotton Basic',
        slug: 'ao-polo-nam-pique-cotton-basic',
        code: 'POLOBASIC',
        base_price: 299000,
        brand_name: 'MenWear',
        category_name: 'Áo Polo',
        image_url: 'https://example.com/polo.jpg',
      });
    });
  });
});
