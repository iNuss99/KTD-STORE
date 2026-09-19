import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, UnauthorizedException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/role.enum';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: any;
  let jwtService: any;
  let configService: any;
  let eventEmitter: any;

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ ...dto, id: 'user-id-123' })),
      save: jest.fn((u) => Promise.resolve(u)),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    jwtService = {
      signAsync: jest.fn().mockImplementation((payload, opts) => {
        if (opts?.expiresIn === '7d' || opts?.secret === 'mock-refresh-secret') {
          return Promise.resolve('mock-refresh-token');
        }
        return Promise.resolve('mock-access-token');
      }),
    };

    configService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const configMap: Record<string, any> = {
          JWT_SECRET: 'mock-jwt-secret-with-high-entropy-32-chars',
          JWT_EXPIRATION: '8h',
          JWT_REFRESH_SECRET: 'mock-refresh-secret-with-high-entropy-32-chars',
          JWT_REFRESH_EXPIRATION: '7d',
          FRONTEND_URL: 'https://ktd-store.vercel.app',
        };
        return configMap[key] !== undefined ? configMap[key] : defaultValue;
      }),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password-123');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('nên được khởi tạo thành công', () => {
    expect(service).toBeDefined();
  });

  describe('Đăng ký tài khoản (register)', () => {
    it('báo lỗi BadRequestException nếu email đã tồn tại trong hệ thống', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'existing-id', email: 'user@example.com' });

      await expect(
        service.register({
          email: 'user@example.com',
          password: 'Password123!',
          full_name: 'Nguyen Van A',
          phone: '0901234567',
        }),
      ).rejects.toThrow(new BadRequestException('Email này đã được sử dụng'));
    });

    it('đăng ký thành công, hash mật khẩu, lưu CUSTOMER và emit sự kiện user.registered', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.register({
        email: 'NEW_USER@example.com',
        password: 'Password123!',
        full_name: 'Tran Thi B',
        phone: '0912345678',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new_user@example.com',
          role: UserRole.CUSTOMER,
          full_name: 'Tran Thi B',
          phone: '0912345678',
        }),
      );
      expect(userRepo.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'user.registered',
        expect.objectContaining({
          customerEmail: 'new_user@example.com',
          welcomeVoucherCode: 'KTDSTORE10',
        }),
      );
      expect(result.access_token).toBe('mock-access-token');
      expect(result.refresh_token).toBe('mock-refresh-token');
      expect(result.user.email).toBe('new_user@example.com');
    });
  });

  describe('Đăng nhập (login) & Cơ chế Phòng thủ Brute-force', () => {
    it('báo lỗi UnauthorizedException với thông báo chung khi email không tồn tại (chống dò email)', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'any' }),
      ).rejects.toThrow(new UnauthorizedException('Email hoặc mật khẩu không chính xác'));
    });

    it('báo lỗi UnauthorizedException khi tài khoản bị admin khóa vĩnh viễn (is_locked = true)', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'locked-user',
        email: 'locked@example.com',
        is_locked: true,
      });

      await expect(
        service.login({ email: 'locked@example.com', password: 'any' }),
      ).rejects.toThrow(new UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.'));
    });

    it('báo lỗi UnauthorizedException khi tài khoản đang trong thời gian tự động khóa tạm thời do brute-force', async () => {
      const futureDate = new Date(Date.now() + 10 * 60 * 1000); // Còn 10 phút
      userRepo.findOne.mockResolvedValue({
        id: 'temp-locked-user',
        email: 'brute@example.com',
        locked_until: futureDate,
      });

      await expect(
        service.login({ email: 'brute@example.com', password: 'any' }),
      ).rejects.toThrow(/Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần/);
    });

    it('tăng login_attempts khi nhập sai mật khẩu và tự động khóa 15 phút khi đạt 10 lần sai', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      userRepo.findOne.mockResolvedValue({
        id: 'attempt-user',
        email: 'attempt@example.com',
        password_hash: 'hash',
        login_attempts: 9, // Lần sai thứ 10
      });

      await expect(
        service.login({ email: 'attempt@example.com', password: 'wrong' }),
      ).rejects.toThrow(new UnauthorizedException('Email hoặc mật khẩu không chính xác'));

      expect(userRepo.update).toHaveBeenCalledWith(
        'attempt-user',
        expect.objectContaining({
          login_attempts: 0,
          locked_until: expect.any(Date),
        }),
      );
    });

    it('chặn khách hàng CUSTOMER đăng nhập vào cổng quản trị CRM (portal: admin)', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'cust-1',
        email: 'cust@example.com',
        password_hash: 'hash',
        role: UserRole.CUSTOMER,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({ email: 'cust@example.com', password: 'correct', portal: 'admin' }),
      ).rejects.toThrow(new ForbiddenException('Tài khoản khách hàng không có quyền truy cập hệ thống quản trị CRM'));
    });

    it('đăng nhập thành công, reset login_attempts, cấp access_token và refresh_token', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        password_hash: 'hash',
        role: UserRole.SUPER_ADMIN,
        login_attempts: 3,
      };
      userRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'admin@example.com', password: 'correct', portal: 'admin' });

      expect(userRepo.update).toHaveBeenCalledWith('admin-1', {
        login_attempts: 0,
        locked_until: null,
      });
      expect(result.access_token).toBe('mock-access-token');
      expect(result.refresh_token).toBe('mock-refresh-token');
      expect(result.user.role).toBe(UserRole.SUPER_ADMIN);
    });

    it('báo lỗi InternalServerErrorException nếu JWT_SECRET không được cấu hình', async () => {
      configService.get.mockReturnValue(null);
      userRepo.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        password_hash: 'hash',
        role: UserRole.CUSTOMER,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({ email: 'user@example.com', password: 'correct' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('Làm mới Token (refreshToken)', () => {
    it('báo lỗi UnauthorizedException nếu không tìm thấy user hoặc không có refresh_token_hash', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.refreshToken('non-existent', 'some-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('báo lỗi UnauthorizedException nếu refresh token không khớp với hash lưu trong DB', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'user-1',
        refresh_token_hash: 'stored-hash',
        is_locked: false,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.refreshToken('user-1', 'invalid-token'),
      ).rejects.toThrow(new UnauthorizedException('Refresh token không hợp lệ'));
    });

    it('cấp tokens mới và cập nhật hash mới khi refresh token hợp lệ', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        role: UserRole.CUSTOMER,
        refresh_token_hash: 'stored-hash',
        is_locked: false,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.refreshToken('user-1', 'valid-refresh-token');

      expect(result.access_token).toBe('mock-access-token');
      expect(result.refresh_token).toBe('mock-refresh-token');
      expect(userRepo.update).toHaveBeenCalledWith('user-1', {
        refresh_token_hash: 'hashed-password-123',
      });
    });
  });

  describe('Đăng xuất (logout)', () => {
    it('xóa refresh_token_hash trong cơ sở dữ liệu khi đăng xuất', async () => {
      const result = await service.logout('user-1');

      expect(userRepo.update).toHaveBeenCalledWith('user-1', { refresh_token_hash: null });
      expect(result.message).toBe('Đăng xuất thành công');
    });
  });
});
