import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoyaltyPoint, LoyaltyTier } from './entities/loyalty-point.entity';
import { Discount } from '../discounts/entities/discount.entity';
import { DiscountType } from '../../common/enums/discount.enum';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(LoyaltyPoint)
    private loyaltyRepo: Repository<LoyaltyPoint>,
    @InjectRepository(Discount)
    private discountRepo: Repository<Discount>,
    private eventEmitter: EventEmitter2,
  ) {}

  calculateTier(lifetimePoints: number): LoyaltyTier {
    if (lifetimePoints >= 1000) return LoyaltyTier.PLATINUM;
    if (lifetimePoints >= 500) return LoyaltyTier.GOLD;
    if (lifetimePoints >= 200) return LoyaltyTier.SILVER;
    return LoyaltyTier.BRONZE;
  }

  getTierPerks(tier: LoyaltyTier): { freeShipping: boolean; discountPercent: number; birthdayGift: boolean; label: string } {
    switch (tier) {
      case LoyaltyTier.PLATINUM:
        return { freeShipping: true, discountPercent: 15, birthdayGift: true, label: 'Thành viên Bạch Kim' };
      case LoyaltyTier.GOLD:
        return { freeShipping: true, discountPercent: 10, birthdayGift: true, label: 'Thành viên Vàng' };
      case LoyaltyTier.SILVER:
        return { freeShipping: false, discountPercent: 5, birthdayGift: true, label: 'Thành viên Bạc' };
      default:
        return { freeShipping: false, discountPercent: 0, birthdayGift: false, label: 'Thành viên Đồng' };
    }
  }

  async getProfile(userId: string) {
    let profile = await this.loyaltyRepo.findOne({ where: { user_id: userId } });
    if (!profile) {
      profile = await this.loyaltyRepo.save(
        this.loyaltyRepo.create({
          user_id: userId,
          points: 0,
          lifetime_points: 0,
          tier: LoyaltyTier.BRONZE,
        }),
      );
    }

    const perks = this.getTierPerks(profile.tier);
    let nextTierPoints = 200;
    let nextTierName = 'Bạc';

    if (profile.tier === LoyaltyTier.SILVER) {
      nextTierPoints = 500;
      nextTierName = 'Vàng';
    } else if (profile.tier === LoyaltyTier.GOLD) {
      nextTierPoints = 1000;
      nextTierName = 'Bạch Kim';
    } else if (profile.tier === LoyaltyTier.PLATINUM) {
      nextTierPoints = 1000;
      nextTierName = 'Tối đa';
    }

    const progress = Math.min(100, Math.round((profile.lifetime_points / nextTierPoints) * 100));

    return {
      points: profile.points,
      lifetime_points: profile.lifetime_points,
      tier: profile.tier,
      tierLabel: perks.label,
      perks,
      nextTierPoints,
      nextTierName,
      progress,
    };
  }

  async awardPointsForOrder(userId: string, orderTotal: number): Promise<LoyaltyPoint> {
    if (!userId || orderTotal <= 0) return null as any;

    // 10.000 VND = 1 Point
    const earnedPoints = Math.floor(orderTotal / 10000);
    if (earnedPoints <= 0) return null as any;

    let profile = await this.loyaltyRepo.findOne({ where: { user_id: userId } });
    if (!profile) {
      profile = this.loyaltyRepo.create({
        user_id: userId,
        points: 0,
        lifetime_points: 0,
        tier: LoyaltyTier.BRONZE,
      });
    }

    profile.points += earnedPoints;
    profile.lifetime_points += earnedPoints;
    profile.tier = this.calculateTier(profile.lifetime_points);

    const saved = await this.loyaltyRepo.save(profile);

    this.eventEmitter.emit('loyalty.points_awarded', {
      userId,
      earnedPoints,
      newBalance: saved.points,
      tier: saved.tier,
    });

    return saved;
  }

  async redeemPoints(userId: string, pointsToRedeem: number): Promise<{ voucherCode: string; discountAmount: number; remainingPoints: number }> {
    if (pointsToRedeem < 50) {
      throw new BadRequestException('Mức đổi tối thiểu là 50 điểm (tương đương 50.000đ).');
    }

    const profile = await this.loyaltyRepo.findOne({ where: { user_id: userId } });
    if (!profile || profile.points < pointsToRedeem) {
      throw new BadRequestException(`Bạn không đủ điểm thưởng. Số dư hiện tại: ${profile?.points || 0} điểm.`);
    }

    // 1 point = 1.000 VND voucher
    const discountAmount = pointsToRedeem * 1000;
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const voucherCode = `VIP${pointsToRedeem}K-${randomSuffix}`;

    // Deduct points
    profile.points -= pointsToRedeem;
    await this.loyaltyRepo.save(profile);

    // Create unique single-use voucher in discounts table
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days validity

    const discount = this.discountRepo.create({
      code: voucherCode,
      discount_type: DiscountType.FIXED_AMOUNT,
      value: discountAmount,
      min_order_amount: discountAmount * 2,
      valid_from: new Date(),
      valid_to: expiresAt,
      max_uses: 1,
      used_count: 0,
      is_active: true,
    });
    await this.discountRepo.save(discount);

    return {
      voucherCode,
      discountAmount,
      remainingPoints: profile.points,
    };
  }
}
