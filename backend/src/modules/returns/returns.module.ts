import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnRequest } from './entities/return-request.entity';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../orders/entities/payment.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { ReturnsService } from './returns.service';
import { ReturnsController } from './returns.controller';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { SystemConfigsModule } from '../system-configs/system-configs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReturnRequest, Order, Payment, ProductVariant]),
    PermissionsModule,
    AuditLogsModule,
    SystemConfigsModule,
  ],
  controllers: [ReturnsController],
  providers: [ReturnsService],
  exports: [ReturnsService],
})
export class ReturnsModule {}
