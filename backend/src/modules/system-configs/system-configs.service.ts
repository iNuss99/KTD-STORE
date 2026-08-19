import { Injectable, OnApplicationBootstrap, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './entities/system-config.entity';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

export const SYSTEM_CONFIG_KEYS = {
  RETURN_DAYS_LIMIT: 'RETURN_DAYS_LIMIT',
  SHIPPING_FEE_DEFAULT: 'SHIPPING_FEE_DEFAULT',
  AUTO_CANCEL_MINUTES: 'AUTO_CANCEL_MINUTES',
  BANK_CODE: 'BANK_CODE',
  BANK_NAME: 'BANK_NAME',
  BANK_ACCOUNT_NO: 'BANK_ACCOUNT_NO',
  BANK_ACCOUNT_NAME: 'BANK_ACCOUNT_NAME',
};

@Injectable()
export class SystemConfigsService implements OnApplicationBootstrap {
  private cacheMap = new Map<string, string>();

  constructor(
    @InjectRepository(SystemConfig)
    private configRepo: Repository<SystemConfig>,
    private auditLogsService: AuditLogsService,
  ) {}

  async onApplicationBootstrap() {
    await this.seedDefaultConfigs();
    await this.reloadCache();
  }

  async seedDefaultConfigs() {
    const configCount = await this.configRepo.count();
    if (configCount >= 7) {
      return; // Cấu hình hệ thống đã tồn tại đầy đủ
    }

    const defaults = [
      {
        key: SYSTEM_CONFIG_KEYS.RETURN_DAYS_LIMIT,
        value: '7',
        description: 'Số ngày tối đa cho phép yêu cầu đổi trả kể từ khi nhận hàng',
      },
      {
        key: SYSTEM_CONFIG_KEYS.SHIPPING_FEE_DEFAULT,
        value: '0',
        description: 'Phí giao hàng mặc định áp dụng cho đơn hàng (VNĐ)',
      },
      {
        key: SYSTEM_CONFIG_KEYS.AUTO_CANCEL_MINUTES,
        value: '30',
        description: 'Thời gian tối đa chờ thanh toán trước khi tự động hủy đơn (phút)',
      },
      {
        key: SYSTEM_CONFIG_KEYS.BANK_CODE,
        value: 'MB',
        description: 'Mã ngân hàng nhận thanh toán VietQR (VD: MB, VCB, TCB, ACB, VPB)',
      },
      {
        key: SYSTEM_CONFIG_KEYS.BANK_NAME,
        value: 'MBBank (Ngân hàng Quân Đội)',
        description: 'Tên hiển thị ngân hàng nhận thanh toán VietQR',
      },
      {
        key: SYSTEM_CONFIG_KEYS.BANK_ACCOUNT_NO,
        value: '0931143830',
        description: 'Số tài khoản ngân hàng nhận thanh toán VietQR',
      },
      {
        key: SYSTEM_CONFIG_KEYS.BANK_ACCOUNT_NAME,
        value: 'DO MINH KHOA',
        description: 'Tên chủ tài khoản nhận thanh toán VietQR',
      },
    ];

    for (const item of defaults) {
      const exists = await this.configRepo.findOne({ where: { key: item.key } });
      if (!exists) {
        const config = this.configRepo.create(item);
        await this.configRepo.save(config);
      } else if (exists.value === '999988888' || exists.value === 'KNOT TO DETAIL') {
        exists.value = item.value;
        await this.configRepo.save(exists);
      }
    }
  }

  async reloadCache() {
    const configs = await this.configRepo.find();
    this.cacheMap.clear();
    for (const c of configs) {
      this.cacheMap.set(c.key, c.value);
    }
  }

  async getValue(key: string, defaultValue: string = ''): Promise<string> {
    if (this.cacheMap.has(key)) {
      return this.cacheMap.get(key)!;
    }
    const config = await this.configRepo.findOne({ where: { key } });
    if (config) {
      this.cacheMap.set(key, config.value);
      return config.value;
    }
    return defaultValue;
  }

  async getNumber(key: string, defaultValue: number): Promise<number> {
    const val = await this.getValue(key, String(defaultValue));
    const num = Number(val);
    return isNaN(num) ? defaultValue : num;
  }

  async findAll(): Promise<SystemConfig[]> {
    return this.configRepo.find();
  }

  async update(
    key: string,
    dto: UpdateSystemConfigDto,
    performedByUserId: string,
  ): Promise<SystemConfig> {
    let config = await this.configRepo.findOne({ where: { key } });
    if (!config) {
      config = this.configRepo.create({ key, value: dto.value, description: dto.description });
    } else {
      config.value = dto.value;
      if (dto.description !== undefined) {
        config.description = dto.description;
      }
    }

    const saved = await this.configRepo.save(config);
    this.cacheMap.set(key, saved.value);

    await this.auditLogsService.log(
      performedByUserId,
      'UPDATE_SYSTEM_CONFIG',
      'SystemConfig',
      key,
      { value: dto.value, description: dto.description },
    );

    return saved;
  }
}
