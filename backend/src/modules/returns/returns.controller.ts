import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { UpdateReturnStatusDto } from './dto/update-return-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ReturnStatus } from '../../common/enums/return.enum';
import { PERMISSION_CODES } from '../permissions/permissions.service';

@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateReturnRequestDto) {
    return this.returnsService.create(req.user.id, dto);
  }

  @Get('my')
  findMy(@Request() req: any) {
    return this.returnsService.findAllMy(req.user.id);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSION_CODES.ORDER_VIEW, PERMISSION_CODES.ORDER_MANAGE)
  findAllAdmin(@Query('status') status?: ReturnStatus) {
    return this.returnsService.findAllAdmin(status);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    const isStaff = ['SUPER_ADMIN', 'CEO', 'MANAGER', 'STAFF'].includes(req.user.role);
    return this.returnsService.findOne(id, isStaff ? undefined : req.user.id);
  }

  @Patch(':id/status')
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSION_CODES.ORDER_MANAGE, PERMISSION_CODES.ORDER_UPDATE)
  updateStatus(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateReturnStatusDto) {
    return this.returnsService.updateStatus(id, dto, req.user);
  }
}
