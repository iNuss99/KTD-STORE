import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Review } from './entities/review.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { OrderStatus } from '../../common/enums/order.enum';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewRepo: any;
  let orderRepo: any;
  let orderItemRepo: any;
  let productRepo: any;
  let eventEmitter: any;

  beforeEach(async () => {
    reviewRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((item) => Promise.resolve({ id: 'review-123', ...item })),
      remove: jest.fn(),
    };
    orderRepo = { findOne: jest.fn() };
    orderItemRepo = { findOne: jest.fn() };
    productRepo = { findOne: jest.fn() };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(Review), useValue: reviewRepo },
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: orderItemRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  it('should throw BadRequestException if rating is invalid (< 1 or > 5)', async () => {
    await expect(
      service.createOrUpdateReview('user-1', {
        productId: 'prod-1',
        orderItemId: 'item-1',
        rating: 6,
        comment: 'Nice',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw ForbiddenException if order status is NOT DELIVERED', async () => {
    productRepo.findOne.mockResolvedValue({ id: 'prod-1' });
    orderItemRepo.findOne.mockResolvedValue({
      id: 'item-1',
      order: { user_id: 'user-1', status: OrderStatus.SHIPPING },
      variant: { product_id: 'prod-1' },
    });

    await expect(
      service.createOrUpdateReview('user-1', {
        productId: 'prod-1',
        orderItemId: 'item-1',
        rating: 5,
        comment: 'Great product',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should create new review for DELIVERED order item', async () => {
    productRepo.findOne.mockResolvedValue({ id: 'prod-1' });
    orderItemRepo.findOne.mockResolvedValue({
      id: 'item-1',
      order: { user_id: 'user-1', status: OrderStatus.DELIVERED },
      variant: { product_id: 'prod-1' },
    });
    reviewRepo.findOne.mockResolvedValue(null);

    const res = await service.createOrUpdateReview('user-1', {
      productId: 'prod-1',
      orderItemId: 'item-1',
      rating: 5,
      comment: 'Excellent tshirt!',
    });

    expect(res.rating).toBe(5);
    expect(reviewRepo.save).toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalledWith('audit.log', expect.any(Object));
  });

  it('should update existing review if user already reviewed the product', async () => {
    productRepo.findOne.mockResolvedValue({ id: 'prod-1' });
    orderItemRepo.findOne.mockResolvedValue({
      id: 'item-1',
      order: { user_id: 'user-1', status: OrderStatus.DELIVERED },
      variant: { product_id: 'prod-1' },
    });
    const existingReview = {
      id: 'rev-1',
      product_id: 'prod-1',
      user_id: 'user-1',
      rating: 3,
      comment: 'Okay',
    };
    reviewRepo.findOne.mockResolvedValue(existingReview);

    const res = await service.createOrUpdateReview('user-1', {
      productId: 'prod-1',
      orderItemId: 'item-1',
      rating: 5,
      comment: 'Updated to 5 stars',
    });

    expect(res.rating).toBe(5);
    expect(existingReview.comment).toBe('Updated to 5 stars');
  });

  it('should compute product reviews stats accurately', async () => {
    reviewRepo.find.mockResolvedValue([
      { id: '1', rating: 5, comment: 'Awesome', created_at: new Date(), user: { id: 'u1', full_name: 'Alice' } },
      { id: '2', rating: 4, comment: 'Good', created_at: new Date(), user: { id: 'u2', full_name: 'Bob' } },
    ]);

    const stats = await service.getProductReviews('prod-1');

    expect(stats.avgRating).toBe(4.5);
    expect(stats.totalReviews).toBe(2);
    expect(stats.ratingCounts[5]).toBe(1);
    expect(stats.ratingCounts[4]).toBe(1);
  });
});
