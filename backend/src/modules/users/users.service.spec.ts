import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserRole } from '../../common/enums/role.enum';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: any;
  let auditLogsService: any;

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((dto) => ({ id: 'new-uuid', ...dto })),
      save: jest.fn((user) => Promise.resolve(user)),
      remove: jest.fn(),
    };

    auditLogsService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: AuditLogsService, useValue: auditLogsService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('nên được khởi tạo thành công', () => {
    expect(service).toBeDefined();
  });

  describe('Ràng buộc Super Admin cuối cùng', () => {
    it('từ chối khóa Super Admin nếu chỉ còn 1 Super Admin active', async () => {
      const superAdminUser = {
        id: 'sa-1',
        email: 'sa1@menwear.com',
        role: UserRole.SUPER_ADMIN,
        is_locked: false,
      };

      userRepo.findOne.mockResolvedValue(superAdminUser);
      userRepo.find.mockResolvedValue([superAdminUser]); // Only sa-1 active

      await expect(
        service.updateUser('sa-1', { is_locked: true }, 'performer-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('từ chối xóa Super Admin nếu chỉ còn 1 Super Admin active', async () => {
      const superAdminUser = {
        id: 'sa-1',
        email: 'sa1@menwear.com',
        role: UserRole.SUPER_ADMIN,
        is_locked: false,
      };

      userRepo.findOne.mockResolvedValue(superAdminUser);
      userRepo.find.mockResolvedValue([superAdminUser]);

      await expect(
        service.deleteUser('sa-1', 'performer-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('cho phép khóa Super Admin nếu vẫn còn Super Admin active khác', async () => {
      const sa1 = { id: 'sa-1', email: 'sa1@menwear.com', role: UserRole.SUPER_ADMIN, is_locked: false };
      const sa2 = { id: 'sa-2', email: 'sa2@menwear.com', role: UserRole.SUPER_ADMIN, is_locked: false };

      userRepo.findOne.mockResolvedValue(sa1);
      userRepo.find.mockResolvedValue([sa1, sa2]); // 2 active Super Admins

      const result = await service.updateUser('sa-1', { is_locked: true }, 'performer-id');

      expect(result.is_locked).toBe(true);
      expect(auditLogsService.log).toHaveBeenCalledWith(
        'performer-id',
        'UPDATE_USER',
        'User',
        'sa-1',
        { is_locked: true },
      );
    });
  });
});
