import { Controller, Get, Patch, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { SystemConfigsService } from './system-configs.service';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('system-configs')
export class SystemConfigsController {
  constructor(private readonly configsService: SystemConfigsService) {}

  @Get()
  async findAll() {
    return this.configsService.findAll();
  }

  @Patch('batch')
  @UseGuards(JwtAuthGuard)
  async updateBatch(
    @Body() body: { configs: { key: string; value: string; description?: string }[] },
    @GetUser() user: any,
  ) {
    if (!['SUPER_ADMIN', 'CEO', 'MANAGER'].includes(user.role)) {
      throw new ForbiddenException('Bạn không có quyền thay đổi cấu hình hệ thống');
    }
    return this.configsService.updateBatch(body.configs || [], user.id);
  }

  @Patch(':key')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('key') key: string,
    @Body() dto: UpdateSystemConfigDto,
    @GetUser() user: any,
  ) {
    if (!['SUPER_ADMIN', 'CEO', 'MANAGER'].includes(user.role)) {
      throw new ForbiddenException('Bạn không có quyền thay đổi cấu hình hệ thống');
    }
    return this.configsService.update(key, dto, user.id);
  }
}
