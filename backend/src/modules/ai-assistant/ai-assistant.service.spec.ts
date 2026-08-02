import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiAssistantService } from './ai-assistant.service';
import { Product } from '../products/entities/product.entity';

describe('AiAssistantService', () => {
  let service: AiAssistantService;
  let productRepo: any;

  beforeEach(async () => {
    productRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'p1', name: 'Áo sơ mi nam Oxford', base_price: 350000 },
        ]),
      }),
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAssistantService,
        {
          provide: getRepositoryToken(Product),
          useValue: productRepo,
        },
      ],
    }).compile();

    service = module.get<AiAssistantService>(AiAssistantService);
  });

  it('nên trả về phản hồi gợi ý áo sơ mi khi câu hỏi chứa từ khóa sơ mi', async () => {
    const res = await service.chat({ message: 'Tư vấn áo sơ mi đẹp' });

    expect(res.reply).toContain('Áo Sơ Mi Nam');
    expect(res.suggested_products.length).toBeGreaterThan(0);
    expect(res.suggested_products[0].name).toBe('Áo sơ mi nam Oxford');
  });
});
