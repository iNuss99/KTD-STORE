import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('tree')
  getCategoryTree() {
    return this.categoriesService.getCategoryTree();
  }

  @Get()
  findAll(@Query('all') all?: string) {
    return this.categoriesService.findAll(all === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('CATEGORY_MANAGE')
  create(@Body() dto: CreateCategoryDto, @GetUser('id') performedByUserId?: string) {
    return this.categoriesService.create(dto, performedByUserId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('CATEGORY_MANAGE')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @GetUser('id') performedByUserId?: string,
  ) {
    return this.categoriesService.update(id, dto, performedByUserId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('CATEGORY_MANAGE')
  remove(@Param('id') id: string, @GetUser('id') performedByUserId?: string) {
    return this.categoriesService.remove(id, performedByUserId);
  }
}
