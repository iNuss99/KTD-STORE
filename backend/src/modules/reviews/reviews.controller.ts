import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('reviews')
  async createOrUpdateReview(@Request() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createOrUpdateReview(req.user.id, dto);
  }

  @Get('products/:productId/reviews')
  async getProductReviews(@Param('productId') productId: string) {
    return this.reviewsService.getProductReviews(productId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('reviews/my')
  async getUserReviews(@Request() req: any) {
    return this.reviewsService.getUserReviews(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('reviews/:id')
  async deleteReview(@Request() req: any, @Param('id') id: string) {
    return this.reviewsService.deleteReview(id, req.user);
  }
}
