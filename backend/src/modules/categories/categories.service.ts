import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  async getCategoryTree() {
    // Get top-level categories (parent_id IS NULL) with 3 levels of children
    const rootCategories = await this.categoryRepo.find({
      where: { parent_id: IsNull(), is_active: true },
      relations: ['children', 'children.children'],
    });
    return rootCategories;
  }

  async findAll() {
    return this.categoryRepo.find({
      relations: ['parent'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.categoryRepo.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new BadRequestException('Slug danh mục này đã tồn tại');
    }

    const category = this.categoryRepo.create(dto);
    return this.categoryRepo.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    // Rule spec 2.1: Do not hard delete category with related data - soft delete (is_active = false)
    category.is_active = false;
    await this.categoryRepo.save(category);
    return { message: 'Đã ẩn danh mục thành công (Soft delete)' };
  }
}
