import { Controller, Get, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('profile')
  getProfile(@GetUser('id') userId: string) {
    return this.loyaltyService.getProfile(userId);
  }

  @Post('redeem')
  redeemPoints(@GetUser('id') userId: string, @Body('points') points: number) {
    if (!points || Number(points) <= 0) {
      throw new BadRequestException('Số điểm đổi phải lớn hơn 0.');
    }
    return this.loyaltyService.redeemPoints(userId, Number(points));
  }
}
