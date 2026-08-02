import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { SystemConfigsService } from './system-configs.service';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('system-configs')
export class SystemConfigsController {
  constructor(private readonly configsService: SystemConfigsService) {}

  @Get()
  async findAll() {
    return this.configsService.findAll();
  }

  @Patch(':key')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('MANAGER_UPDATE')
  async update(
    @Param('key') key: string,
    @Body() dto: UpdateSystemConfigDto,
    @GetUser('id') performedByUserId: string,
  ) {
    return this.configsService.update(key, dto, performedByUserId);
  }
}
