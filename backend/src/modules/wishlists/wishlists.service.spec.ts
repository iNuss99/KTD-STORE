import { Test, TestingModule } from '@nestjs/testing';
import { WishlistsService } from './wishlists.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WishlistItem } from './entities/wishlist-item.entity';

describe('WishlistsService', () => {
  let service: WishlistsService;

  const mockRepository = {
    findOne: jest.fn(),
    remove: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistsService,
        {
          provide: getRepositoryToken(WishlistItem),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<WishlistsService>(WishlistsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('toggleWishlist', () => {
    it('should remove item if already exists', async () => {
      mockRepository.findOne.mockResolvedValue({ id: '1' });
      const result = await service.toggleWishlist('user1', 'product1');
      expect(mockRepository.remove).toHaveBeenCalledWith({ id: '1' });
      expect(result).toEqual({ is_wished: false });
    });

    it('should add item if it does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ user_id: 'user1', product_id: 'product1' });
      const result = await service.toggleWishlist('user1', 'product1');
      expect(mockRepository.save).toHaveBeenCalledWith({ user_id: 'user1', product_id: 'product1' });
      expect(result).toEqual({ is_wished: true });
    });
  });
});
