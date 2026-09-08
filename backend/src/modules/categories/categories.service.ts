import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from './entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @Optional()
    private auditLogsService?: AuditLogsService,
  ) {}

  generateSlugFromName(name: string): string {
    const clean = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    return clean || 'danh-muc';
  }

  async getCategoryTree() {
    // Get top-level categories (parent_id IS NULL) with 3 levels of children
    const rootCategories = await this.categoryRepo.find({
      where: { parent_id: IsNull(), is_active: true },
      relations: ['children', 'children.children'],
      order: { name: 'ASC' },
    });
    return rootCategories;
  }

  async findAll(all: boolean = false) {
    const qb = this.categoryRepo
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent')
      .orderBy('category.name', 'ASC');

    if (!all) {
      qb.where('category.is_active = :isActive', { isActive: true });
    }

    if (typeof qb.loadRelationCountAndMap === 'function') {
      qb.loadRelationCountAndMap('category.products_count', 'category.products');
    }

    return qb.getMany();
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

  async create(dto: CreateCategoryDto, performedByUserId?: string) {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Tên danh mục không được để trống');
    }

    const existingName = await this.categoryRepo
      .createQueryBuilder('category')
      .where('LOWER(category.name) = LOWER(:name)', { name })
      .getOne();

    if (existingName) {
      throw new BadRequestException(`Tên danh mục "${name}" đã tồn tại.`);
    }

    let slug = (dto.slug || '').trim().toLowerCase();
    if (!slug) {
      const baseSlug = this.generateSlugFromName(name);
      slug = baseSlug;
      let counter = 2;
      while (await this.categoryRepo.findOne({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    } else {
      const existingSlug = await this.categoryRepo.findOne({ where: { slug } });
      if (existingSlug) {
        throw new BadRequestException(`Slug URL "${slug}" đã được sử dụng.`);
      }
    }

    const category = this.categoryRepo.create({
      name,
      slug,
      parent_id: dto.parent_id || null,
      image_url: dto.image_url || null,
      is_active: true,
    });

    const saved = await this.categoryRepo.save(category);

    if (this.auditLogsService && performedByUserId) {
      await this.auditLogsService.log(
        performedByUserId,
        'CREATE_CATEGORY',
        'Category',
        saved.id,
        { name: saved.name, slug: saved.slug },
      );
    }

    return saved;
  }

  async update(id: string, dto: UpdateCategoryDto, performedByUserId?: string) {
    const category = await this.findOne(id);

    if (dto.name) {
      const name = dto.name.trim();
      const duplicateName = await this.categoryRepo
        .createQueryBuilder('c')
        .where('LOWER(c.name) = LOWER(:name) AND c.id != :id', { name, id })
        .getOne();
      if (duplicateName) {
        throw new BadRequestException(`Tên danh mục "${name}" đã tồn tại.`);
      }
      category.name = name;
    }

    if (dto.slug) {
      const slug = dto.slug.trim().toLowerCase();
      const duplicateSlug = await this.categoryRepo
        .createQueryBuilder('c')
        .where('LOWER(c.slug) = LOWER(:slug) AND c.id != :id', { slug, id })
        .getOne();
      if (duplicateSlug) {
        throw new BadRequestException(`Slug URL "${slug}" đã tồn tại.`);
      }
      category.slug = slug;
    }

    if (dto.parent_id !== undefined) {
      if (dto.parent_id === id) {
        throw new BadRequestException('Danh mục không thể làm cha của chính nó');
      }
      category.parent_id = dto.parent_id || null;
    }

    if (dto.image_url !== undefined) {
      category.image_url = dto.image_url || null;
    }

    if (dto.is_active !== undefined) {
      category.is_active = dto.is_active;
    }

    const updated = await this.categoryRepo.save(category);

    if (this.auditLogsService && performedByUserId) {
      await this.auditLogsService.log(
        performedByUserId,
        'UPDATE_CATEGORY',
        'Category',
        id,
        { name: updated.name, slug: updated.slug },
      );
    }

    return updated;
  }

  async remove(id: string, performedByUserId?: string) {
    const category = await this.findOne(id);

    // Unlink any products in this category so products are preserved as uncategorized
    await this.productRepo.update({ category_id: id }, { category_id: null as any });

    // Unlink child categories (promote to top-level)
    await this.categoryRepo.update({ parent_id: id }, { parent_id: null as any });

    await this.categoryRepo.remove(category);

    if (this.auditLogsService && performedByUserId) {
      await this.auditLogsService.log(
        performedByUserId,
        'DELETE_CATEGORY',
        'Category',
        id,
        { name: category.name, slug: category.slug },
      );
    }

    return { success: true, message: `Đã xóa danh mục "${category.name}" thành công.` };
  }
}
