import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyPoint, LoyaltyTier } from './entities/loyalty-point.entity';
import { Discount } from '../discounts/entities/discount.entity';

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let loyaltyRepoMock: any;
  let discountRepoMock: any;

  const mockProfile: LoyaltyPoint = {
    id: 'lp-1',
    user_id: 'user-123',
    user: {} as any,
    points: 150,
    lifetime_points: 350,
    tier: LoyaltyTier.SILVER,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const profile = {
      id: 'lp-1',
      user_id: 'user-123',
      user: {} as any,
      points: 150,
      lifetime_points: 350,
      tier: LoyaltyTier.SILVER,
      created_at: new Date(),
      updated_at: new Date(),
    };

    loyaltyRepoMock = {
      findOne: jest.fn().mockResolvedValue(profile),
      save: jest.fn().mockImplementation((p) => Promise.resolve(p)),
      create: jest.fn().mockImplementation((p) => p),
    };

    discountRepoMock = {
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        { provide: getRepositoryToken(LoyaltyPoint), useValue: loyaltyRepoMock },
        { provide: getRepositoryToken(Discount), useValue: discountRepoMock },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
  });

  describe('calculateTier & getTierPerks', () => {
    it('should correctly determine tiers based on lifetime points', () => {
      expect(service.calculateTier(50)).toBe(LoyaltyTier.BRONZE);
      expect(service.calculateTier(250)).toBe(LoyaltyTier.SILVER);
      expect(service.calculateTier(600)).toBe(LoyaltyTier.GOLD);
      expect(service.calculateTier(1200)).toBe(LoyaltyTier.PLATINUM);
    });

    it('should provide free shipping for Platinum and Gold members', () => {
      expect(service.getTierPerks(LoyaltyTier.PLATINUM).freeShipping).toBe(true);
      expect(service.getTierPerks(LoyaltyTier.GOLD).freeShipping).toBe(true);
      expect(service.getTierPerks(LoyaltyTier.BRONZE).freeShipping).toBe(false);
    });
  });

  describe('awardPointsForOrder', () => {
    it('should award 1 point for every 10.000 VND spent', async () => {
      const result = await service.awardPointsForOrder('user-123', 500000); // 50 points

      expect(loyaltyRepoMock.save).toHaveBeenCalled();
      expect(result.points).toBe(200); // 150 + 50
      expect(result.lifetime_points).toBe(400); // 350 + 50
    });
  });

  describe('redeemPoints', () => {
    it('should throw error when redeeming less than 50 points', async () => {
      await expect(service.redeemPoints('user-123', 30)).rejects.toThrow(BadRequestException);
    });

    it('should generate single-use voucher and deduct points', async () => {
      const result = await service.redeemPoints('user-123', 100);

      expect(result.voucherCode).toContain('VIP100K-');
      expect(result.discountAmount).toBe(100000);
      expect(result.remainingPoints).toBe(50); // 150 - 100
      expect(discountRepoMock.save).toHaveBeenCalled();
    });
  });
});
