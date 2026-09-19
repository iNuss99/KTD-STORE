import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/role.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const MAX_LOGIN_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email này đã được sử dụng');
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(dto.password, saltRounds);

    const user = this.userRepo.create({
      email,
      password_hash,
      full_name: dto.full_name,
      phone: dto.phone?.trim(),
      role: UserRole.CUSTOMER,
    });

    await this.userRepo.save(user);
    const tokens = await this.generateTokens(user);
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    // Kích hoạt tự động gửi email chào mừng cho thành viên mới
    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://ktd-store.vercel.app';
      this.eventEmitter.emit('user.registered', {
        customerName: user.full_name || 'Quý khách',
        customerEmail: user.email,
        welcomeVoucherCode: 'KTDSTORE10',
        shopUrl: `${frontendUrl}/products`,
      });
    } catch {
      // Đảm bảo lỗi gửi email không làm gián đoạn việc đăng ký tài khoản
    }

    return {
      message: 'Đăng ký tài khoản thành công',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone,
        avatar_url: user.avatar_url || null,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      // Generic message to prevent user enumeration
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // Check permanent lock by admin
    if (user.is_locked) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.');
    }

    // Check temporary auto-lockout from brute-force
    if (user.locked_until && user.locked_until > new Date()) {
      const minutesLeft = Math.ceil((user.locked_until.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${minutesLeft} phút.`,
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      // Increment login attempts and auto-lock if over threshold
      const newAttempts = (user.login_attempts || 0) + 1;
      const updates: Partial<User> = { login_attempts: newAttempts };
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        updates.locked_until = new Date(Date.now() + LOCKOUT_DURATION_MS);
        updates.login_attempts = 0;
      }
      await this.userRepo.update(user.id, updates);
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    if (dto.portal === 'admin' && user.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('Tài khoản khách hàng không có quyền truy cập hệ thống quản trị CRM');
    }

    // Reset login attempts on successful login
    if (user.login_attempts > 0 || user.locked_until) {
      await this.userRepo.update(user.id, { login_attempts: 0, locked_until: null });
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    return {
      message: 'Đăng nhập thành công',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone,
        avatar_url: user.avatar_url || null,
      },
      ...tokens,
    };
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.refresh_token_hash || user.is_locked) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc tài khoản bị khóa');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refresh_token_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    return tokens;
  }

  async logout(userId: string) {
    await this.userRepo.update(userId, { refresh_token_hash: null });
    return { message: 'Đăng xuất thành công' };
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    // [CRIT-1] Throw if secrets are not configured — no hard-coded fallback
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) throw new InternalServerErrorException('JWT_SECRET is not configured');

    const jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!jwtRefreshSecret) throw new InternalServerErrorException('JWT_REFRESH_SECRET is not configured');

    const access_token = await this.jwtService.signAsync(payload, {
      secret: jwtSecret,
      expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '8h',
    });

    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: jwtRefreshSecret,
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
    });

    return { access_token, refresh_token };
  }

  private async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.update(userId, { refresh_token_hash: hash });
  }
}


