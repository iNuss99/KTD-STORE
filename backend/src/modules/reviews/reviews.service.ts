import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Review } from './entities/review.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { OrderStatus } from '../../common/enums/order.enum';
import { CreateReviewDto } from './dto/create-review.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private eventEmitter: EventEmitter2,
  ) {}

  async createOrUpdateReview(userId: string, dto: CreateReviewDto): Promise<Review> {
    const { productId, orderItemId, rating, comment } = dto;

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Điểm đánh giá phải từ 1 đến 5 sao');
    }

    // Check product existence
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    // Verify user has delivered order containing this order_item
    const orderItem = await this.orderItemRepository.findOne({
      where: { id: orderItemId },
      relations: ['order', 'variant'],
    });

    if (!orderItem) {
      throw new NotFoundException('Sản phẩm trong đơn hàng không tồn tại');
    }

    if (
      orderItem.order.user_id !== userId ||
      orderItem.order.status !== OrderStatus.DELIVERED
    ) {
      throw new ForbiddenException('Chỉ có thể đánh giá sản phẩm từ đơn hàng đã hoàn tất giao hàng (DELIVERED)');
    }

    // Verify variant belongs to productId
    if (orderItem.variant && orderItem.variant.product_id !== productId) {
      throw new BadRequestException('Sản phẩm đánh giá không khớp với đơn hàng');
    }

    let review = await this.reviewRepository.findOne({
      where: { product_id: productId, user_id: userId },
    });

    if (review) {
      review.rating = rating;
      review.comment = comment ?? review.comment;
      review.order_item_id = orderItemId;
    } else {
      review = this.reviewRepository.create({
        product_id: productId,
        user_id: userId,
        order_item_id: orderItemId,
        rating,
        comment,
      });
    }

    const saved = await this.reviewRepository.save(review);

    this.eventEmitter.emit('audit.log', {
      performedByUserId: userId,
      action: review ? 'UPDATE_REVIEW' : 'CREATE_REVIEW',
      entity: 'Review',
      entityId: saved.id,
      details: { productId, rating, comment },
    });

    return saved;
  }

  async getProductReviews(productId: string) {
    const reviews = await this.reviewRepository.find({
      where: { product_id: productId },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });

    const totalReviews = reviews.length;
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRatingSum = 0;

    reviews.forEach((r) => {
      totalRatingSum += r.rating;
      if (ratingCounts[r.rating] !== undefined) {
        ratingCounts[r.rating]++;
      }
    });

    const avgRating = totalReviews > 0 ? parseFloat((totalRatingSum / totalReviews).toFixed(1)) : 0;

    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
      user: {
        id: r.user?.id,
        fullName: r.user?.full_name || 'Khách hàng',
      },
    }));

    return {
      productId,
      avgRating,
      totalReviews,
      ratingCounts,
      reviews: formattedReviews,
    };
  }

  async getUserReviews(userId: string) {
    return this.reviewRepository.find({
      where: { user_id: userId },
      relations: ['product'],
      order: { created_at: 'DESC' },
    });
  }

  async deleteReview(reviewId: string, currentUser: User) {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && review.user_id !== currentUser.id) {
      throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');
    }

    await this.reviewRepository.remove(review);

    this.eventEmitter.emit('audit.log', {
      performedByUserId: currentUser.id,
      action: 'DELETE_REVIEW',
      entity: 'Review',
      entityId: reviewId,
    });

    return { message: 'Đã xóa đánh giá thành công' };
  }
}
