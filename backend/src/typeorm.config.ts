import { DataSource } from 'typeorm';
import { config } from 'dotenv';

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

config();

const dbUrl = process.env.DATABASE_URL;
const isSsl = process.env.DB_SSL === 'true' || !!dbUrl;

export default new DataSource({
  type: 'postgres',
  ...(dbUrl
    ? { url: dbUrl }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgrespassword',
        database: process.env.DB_NAME || 'menwear_db',
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
  migrations: [InitialSchema1700000000000],
  synchronize: false,
  ssl: isSsl ? { rejectUnauthorized: false } : false,
});
