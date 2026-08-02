import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private brandRepo: Repository<Brand>,
  ) {}

  async findAll() {
    return this.brandRepo.find({ order: { name: 'ASC' } });
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
    return this.brandRepo.save(brand);
  }

  async update(id: string, dto: UpdateBrandDto) {
    const brand = await this.findOne(id);
    Object.assign(brand, dto);
    return this.brandRepo.save(brand);
  }

  async remove(id: string) {
    const brand = await this.findOne(id);
    await this.brandRepo.remove(brand);
    return { message: 'Đã xóa thương hiệu thành công' };
  }
}
