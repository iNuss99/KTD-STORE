import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { MemoryCache } from '../../common/utils/cache.util';

@Injectable()
export class BrandsService {
  private cache = new MemoryCache<Brand[]>(5 * 60 * 1000);

  constructor(
    @InjectRepository(Brand)
    private brandRepo: Repository<Brand>,
  ) {}

  clearCache() {
    this.cache.clear();
  }

  async findAll() {
    const cached = this.cache.get();
    if (cached) return cached;

    const data = await this.brandRepo.find({ order: { name: 'ASC' } });
    this.cache.set('__default__', data);
    return data;
  }

  async findOne(id: string) {
    const brand = await this.brandRepo.findOne({ where: { id } });
    if (!brand) {
      throw new NotFoundException('Thương hiệu không tồn tại');
    }
    return brand;
  }

  async create(dto: CreateBrandDto) {
    const existingSlug = await this.brandRepo.findOne({ where: { slug: dto.slug } });
    if (existingSlug) {
      throw new BadRequestException('Slug thương hiệu đã tồn tại');
    }

    const existingCode = await this.brandRepo.findOne({ where: { code: dto.code } });
    if (existingCode) {
      throw new BadRequestException('Mã thương hiệu (code) đã tồn tại');
    }

    const brand = this.brandRepo.create(dto);
    const saved = await this.brandRepo.save(brand);
    this.clearCache();
    return saved;
  }

  async update(id: string, dto: UpdateBrandDto) {
    const brand = await this.findOne(id);
    Object.assign(brand, dto);
    const saved = await this.brandRepo.save(brand);
    this.clearCache();
    return saved;
  }

  async remove(id: string) {
    const brand = await this.findOne(id);
    await this.brandRepo.remove(brand);
    this.clearCache();
    return { message: 'Đã xóa thương hiệu thành công' };
  }
}

