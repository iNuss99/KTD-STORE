import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { Address } from '../addresses/entities/address.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { WebhooksController } from './webhooks.controller';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { DiscountsModule } from '../discounts/discounts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Payment, Address, ProductVariant, Cart, CartItem]),
    PermissionsModule,
    AuditLogsModule,
    DiscountsModule,
  ],
  providers: [OrdersService],
  controllers: [OrdersController, WebhooksController],
  exports: [OrdersService],
})
export class OrdersModule {}
