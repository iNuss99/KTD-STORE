import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';

import { User } from './modules/users/entities/user.entity';
import { Permission } from './modules/permissions/entities/permission.entity';
import { RolePermission } from './modules/permissions/entities/role-permission.entity';
import { AuditLog } from './modules/audit-logs/entities/audit-log.entity';
import { Category } from './modules/categories/entities/category.entity';
import { Brand } from './modules/brands/entities/brand.entity';
import { Product } from './modules/products/entities/product.entity';
import { ProductImage } from './modules/products/entities/product-image.entity';
import { Size } from './modules/products/entities/size.entity';
import { Color } from './modules/products/entities/color.entity';
import { ProductVariant } from './modules/products/entities/product-variant.entity';
import { Address } from './modules/addresses/entities/address.entity';
import { Cart } from './modules/cart/entities/cart.entity';
import { CartItem } from './modules/cart/entities/cart-item.entity';
import { Order } from './modules/orders/entities/order.entity';
import { OrderItem } from './modules/orders/entities/order-item.entity';
import { Payment } from './modules/orders/entities/payment.entity';
import { Discount } from './modules/discounts/entities/discount.entity';
import { DiscountScope } from './modules/discounts/entities/discount-scope.entity';
import { ReturnRequest } from './modules/returns/entities/return-request.entity';
import { Review } from './modules/reviews/entities/review.entity';
import { Notification } from './modules/notifications/entities/notification.entity';
import { WishlistItem } from './modules/wishlists/entities/wishlist-item.entity';
import { SystemConfig } from './modules/system-configs/entities/system-config.entity';
import { LoyaltyPoint } from './modules/loyalty/entities/loyalty-point.entity';
import { InitialSchema1700000000000 } from './migrations/1700000000000-InitialSchema';
import { CacheModule } from '@nestjs/cache-manager';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BrandsModule } from './modules/brands/brands.module';
import { ProductsModule } from './modules/products/products.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { DiscountsModule } from './modules/discounts/discounts.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { WishlistsModule } from './modules/wishlists/wishlists.module';
import { AiAssistantModule } from './modules/ai-assistant/ai-assistant.module';
import { SystemConfigsModule } from './modules/system-configs/system-configs.module';
import { HealthModule } from './modules/health/health.module';
import { EmailModule } from './modules/email/email.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot(),
    CacheModule.register({
      isGlobal: true,
      ttl: 300000,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbUrl = config.get<string>('DATABASE_URL');
        const isSsl = config.get<string>('DB_SSL', 'false') === 'true' || !!dbUrl;
        return {
          type: 'postgres',
          ...(dbUrl
            ? { url: dbUrl }
            : {
                host: config.get<string>('DB_HOST', 'localhost'),
                port: config.get<number>('DB_PORT', 5432),
                username: config.get<string>('DB_USERNAME', 'postgres'),
                password: config.get<string>('DB_PASSWORD', 'postgrespassword'),
                database: config.get<string>('DB_NAME', 'menwear_db'),
              }),
          entities: [
            User,
            Permission,
            RolePermission,
            AuditLog,
            Category,
            Brand,
            Product,
            ProductImage,
            Size,
            Color,
            ProductVariant,
            Address,
            Cart,
            CartItem,
            Order,
            OrderItem,
            Payment,
            Discount,
            DiscountScope,
            ReturnRequest,
            Review,
            Notification,
            WishlistItem,
            SystemConfig,
            LoyaltyPoint,
          ],
          // Task T1.1: Disabled synchronize for production safety. Migrations are used instead.
          synchronize: false,
          migrations: [InitialSchema1700000000000],
          ssl: isSsl ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    AuditLogsModule,
    PermissionsModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    BrandsModule,
    ProductsModule,
    AddressesModule,
    CartModule,
    OrdersModule,
    DiscountsModule,
    ReturnsModule,
    ReviewsModule,
    NotificationsModule,
    ReportsModule,
    WishlistsModule,
    AiAssistantModule,
    SystemConfigsModule,
    HealthModule,
    EmailModule,
    PaymentsModule,
    LoyaltyModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
