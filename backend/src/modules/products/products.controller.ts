import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';
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

  @Post('colors')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT_MANAGE')
  createColor(@Body() dto: CreateColorDto) {
    return this.productsService.createColor(dto);
  }

  @Patch('colors/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT_MANAGE')
  updateColor(@Param('id') id: string, @Body() dto: UpdateColorDto) {
    return this.productsService.updateColor(id, dto);
  }

  @Delete('colors/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT_MANAGE')
  deleteColor(@Param('id') id: string) {
    return this.productsService.deleteColor(id);
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT_MANAGE')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @GetUser('id') performedByUserId: string,
  ) {
    return this.productsService.update(id, dto, performedByUserId);
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

  @Delete(':id/variants/:variantId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT_MANAGE')
  removeVariant(
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
    @GetUser('id') performedByUserId: string,
  ) {
    return this.productsService.removeVariant(productId, variantId, performedByUserId);
  }

  @Post('batch-delete')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT_MANAGE')
  removeBatch(
    @Body('ids') ids: string[],
    @GetUser('id') performedByUserId: string,
  ) {
    return this.productsService.removeBatch(ids, performedByUserId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT_MANAGE')
  remove(@Param('id') id: string, @GetUser('id') performedByUserId: string) {
    return this.productsService.remove(id, performedByUserId);
  }
}
