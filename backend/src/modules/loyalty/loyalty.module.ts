import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyConsumer } from './loyalty.consumer';
import { LoyaltyPoint } from './entities/loyalty-point.entity';
import { Discount } from '../discounts/entities/discount.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LoyaltyPoint, Discount])],
  controllers: [LoyaltyController],
  providers: [LoyaltyService, LoyaltyConsumer],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
