import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Discount } from './entities/discount.entity';
import { DiscountScope } from './entities/discount-scope.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Cart } from '../cart/entities/cart.entity';
import { DiscountsService } from './discounts.service';
import { DiscountsController } from './discounts.controller';

import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Discount, DiscountScope, ProductVariant, Cart]),
    AuditLogsModule,
  ],
  controllers: [DiscountsController],
  providers: [DiscountsService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
