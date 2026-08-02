import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { OrderStatus } from '../../common/enums/order.enum';
import { PERMISSION_CODES } from '../permissions/permissions.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.id, dto);
  }

  @Get('my')
  findMyOrders(@Request() req: any) {
    return this.ordersService.findAllMyOrders(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    const isStaff = ['SUPER_ADMIN', 'CEO', 'MANAGER', 'STAFF'].includes(req.user.role);
    return this.ordersService.findOne(id, isStaff ? undefined : req.user.id);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSION_CODES.ORDER_VIEW, PERMISSION_CODES.ORDER_MANAGE, PERMISSION_CODES.ORDER_UPDATE)
  findAllAdmin(@Query('status') status?: OrderStatus) {
    return this.ordersService.findAllAdmin(status);
  }

  @Patch(':id/status')
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSION_CODES.ORDER_UPDATE, PERMISSION_CODES.ORDER_MANAGE)
  updateStatus(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto, req.user);
  }

  @Post(':id/confirm-payment')
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSION_CODES.ORDER_UPDATE, PERMISSION_CODES.ORDER_MANAGE)
  confirmPayment(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.confirmPayment(id, req.user.id);
  }

  @Post(':id/sandbox-payment')
  processSandboxPayment(@Request() req: any, @Param('id') id: string, @Body() body: { action: 'SUCCESS' | 'CANCEL' }) {
    return this.ordersService.processSandboxPayment(id, body.action || 'SUCCESS', req.user.id);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSION_CODES.ORDER_MANAGE, PERMISSION_CODES.ORDER_UPDATE)
  removeOrder(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.removeOrder(id, req.user.id);
  }
}
