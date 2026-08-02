import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { ApplyDiscountDto } from './dto/apply-discount.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSION_CODES } from '../permissions/permissions.service';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('apply')
  async applyDiscount(@Request() req: any, @Body() dto: ApplyDiscountDto) {
    const result = await this.discountsService.validateAndCalculate(dto.code, req.user.id, dto.items);
    return {
      code: result.discount.code,
      discount_type: result.discount.discount_type,
      value: result.discount.value,
      discount_amount: result.discount_amount,
      applicable_subtotal: result.applicable_subtotal,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSION_CODES.DISCOUNT_MANAGE)
  create(@Body() dto: CreateDiscountDto, @GetUser('id') performedByUserId: string) {
    return this.discountsService.create(dto, performedByUserId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSION_CODES.DISCOUNT_MANAGE)
  findAll() {
    return this.discountsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSION_CODES.DISCOUNT_MANAGE)
  findOne(@Param('id') id: string) {
    return this.discountsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSION_CODES.DISCOUNT_MANAGE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDiscountDto,
    @GetUser('id') performedByUserId: string,
  ) {
    return this.discountsService.update(id, dto, performedByUserId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSION_CODES.DISCOUNT_MANAGE)
  remove(@Param('id') id: string, @GetUser('id') performedByUserId: string) {
    return this.discountsService.remove(id, performedByUserId);
  }
}
