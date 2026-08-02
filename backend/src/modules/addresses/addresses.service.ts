import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private addressRepo: Repository<Address>,
  ) {}

  async create(userId: string, dto: CreateAddressDto): Promise<Address> {
    const existingCount = await this.addressRepo.count({ where: { user_id: userId } });
    const isDefault = dto.is_default || existingCount === 0;

    if (isDefault) {
      await this.addressRepo.update({ user_id: userId }, { is_default: false });
    }

    const address = this.addressRepo.create({
      ...dto,
      user_id: userId,
      is_default: isDefault,
    });

    return this.addressRepo.save(address);
  }

  async findAllByUser(userId: string): Promise<Address[]> {
    return this.addressRepo.find({
      where: { user_id: userId },
      order: { is_default: 'DESC', id: 'ASC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Address> {
    const address = await this.addressRepo.findOne({ where: { id, user_id: userId } });
    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ giao hàng');
    }
    return address;
  }

  async setDefault(id: string, userId: string): Promise<Address> {
    const address = await this.findOne(id, userId);
    await this.addressRepo.update({ user_id: userId }, { is_default: false });
    address.is_default = true;
    return this.addressRepo.save(address);
  }

  async remove(id: string, userId: string): Promise<void> {
    const address = await this.findOne(id, userId);
    await this.addressRepo.remove(address);
  }
}
