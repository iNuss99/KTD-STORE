import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() filter: FilterProductDto) {
    return this.productsService.findAll(filter);
  }

  @Get('autocomplete')
  autocomplete(@Query('q') queryText: string, @Query('limit') limit?: number) {
    return this.productsService.autocomplete(queryText, limit ? Number(limit) : 6);
  }

  @Get('sizes')
  getSizes() {
    return this.productsService.getSizes();
  }

  @Get('colors')
  getColors() {
    return this.productsService.getColors();
  }

  @Post('seed-mock')
  async seedMock() {
    try {
      await this.productsService.seedMockProducts();
      return { message: 'Đã tạo và đồng bộ 10 sản phẩm ảo thành công với Neon Postgres Cloud DB!' };
    } catch (err: any) {
      return { error: true, message: err.message, stack: err.stack };
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT_MANAGE')
  create(@Body() dto: CreateProductDto, @GetUser('id') performedByUserId: string) {
    return this.productsService.create(dto, performedByUserId);
  }

  @Post(':id/variants')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT_MANAGE')
  addVariant(
    @Param('id') id: string,
    @Body() dto: CreateVariantDto,
    @GetUser('id') performedByUserId: string,
  ) {
    return this.productsService.addVariant(id, dto, undefined, undefined, performedByUserId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT_MANAGE')
  remove(@Param('id') id: string, @GetUser('id') performedByUserId: string) {
    return this.productsService.remove(id, performedByUserId);
  }
}
