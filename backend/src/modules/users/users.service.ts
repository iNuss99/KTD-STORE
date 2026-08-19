import { Injectable, OnApplicationBootstrap, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserRole } from '../../common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private auditLogsService: AuditLogsService,
  ) {}

  async onApplicationBootstrap() {
    await this.seedSuperAdmin();
  }

  async seedSuperAdmin() {
    const defaultAdmins = [
      { email: 'admin@store.com', full_name: 'Super Admin' },
      { email: 'admin@gmail.com', full_name: 'Super Admin Default' },
    ];

    for (const item of defaultAdmins) {
      const admin = await this.userRepo.findOne({ where: { email: item.email } });
      if (!admin) {
        const password_hash = await bcrypt.hash('123', 10);
        const newAdmin = this.userRepo.create({
          email: item.email,
          password_hash,
          full_name: item.full_name,
          role: UserRole.SUPER_ADMIN,
          is_locked: false,
        });
        await this.userRepo.save(newAdmin);
      } else if (admin.is_locked || admin.role !== UserRole.SUPER_ADMIN) {
        admin.password_hash = await bcrypt.hash('123', 10);
        admin.is_locked = false;
        admin.role = UserRole.SUPER_ADMIN;
        await this.userRepo.save(admin);
      }
    }
  }

  async findAll() {
    return this.userRepo.find({
      select: ['id', 'email', 'full_name', 'role', 'phone', 'is_locked', 'created_at'],
    });
  }

  async findOne(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['id', 'email', 'full_name', 'role', 'phone', 'is_locked', 'created_at'],
    });
    if (!user) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }
    return user;
  }

  async createUser(dto: CreateUserDto, performedByUserId: string) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('Email đã tồn tại trong hệ thống');
    }

    const password_hash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      ...dto,
      password_hash,
    });

    const savedUser = await this.userRepo.save(user);

    await this.auditLogsService.log(
      performedByUserId,
      'CREATE_USER',
      'User',
      savedUser.id,
      { email: savedUser.email, role: savedUser.role },
    );

    const { password_hash: _, refresh_token_hash: __, ...result } = savedUser;
    return result;
  }

  async updateUser(id: string, dto: UpdateUserDto, performedByUserId: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }

    // Checking Super Admin Protection when locking or changing role of Super Admin
    if (user.role === UserRole.SUPER_ADMIN) {
      if (dto.is_locked === true) {
        await this.ensureNotLastSuperAdmin(id);
      }
      if (dto.role && dto.role !== UserRole.SUPER_ADMIN) {
        await this.ensureNotLastSuperAdmin(id);
      }
    }

    if (dto.password) {
      user.password_hash = await bcrypt.hash(dto.password, 10);
    }
    if (dto.email) user.email = dto.email;
    if (dto.full_name) user.full_name = dto.full_name;
    if (dto.role) user.role = dto.role;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.is_locked !== undefined) user.is_locked = dto.is_locked;

    const updatedUser = await this.userRepo.save(user);

    await this.auditLogsService.log(
      performedByUserId,
      'UPDATE_USER',
      'User',
      id,
      dto,
    );

    const { password_hash: _, refresh_token_hash: __, ...result } = updatedUser;
    return result;
  }

  async deleteUser(id: string, performedByUserId: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      await this.ensureNotLastSuperAdmin(id);
    }

    await this.userRepo.remove(user);

    await this.auditLogsService.log(
      performedByUserId,
      'DELETE_USER',
      'User',
      id,
      { email: user.email, role: user.role },
    );

    return { message: 'Xóa tài khoản thành công' };
  }

  private async ensureNotLastSuperAdmin(targetUserId: string) {
    const superAdmins = await this.userRepo.find({
      where: { role: UserRole.SUPER_ADMIN, is_locked: false },
    });

    const remainingCount = superAdmins.filter((sa) => sa.id !== targetUserId).length;
    if (remainingCount === 0) {
      throw new BadRequestException('Không thể xóa hoặc khóa Super Admin cuối cùng trong hệ thống');
    }
  }
}
