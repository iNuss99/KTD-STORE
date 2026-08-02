import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('MANAGER_VIEW')
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Permissions('MANAGER_VIEW')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Permissions('MANAGER_CREATE')
  async createUser(
    @Body() dto: CreateUserDto,
    @GetUser('id') performedByUserId: string,
  ) {
    return this.usersService.createUser(dto, performedByUserId);
  }

  @Patch(':id')
  @Permissions('MANAGER_UPDATE')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @GetUser('id') performedByUserId: string,
  ) {
    // Dynamic check inside controller depending on what is being updated:
    // If deleting role or locking -> permissions guard logic can also be checked via specific permissions
    return this.usersService.updateUser(id, dto, performedByUserId);
  }

  @Delete(':id')
  @Permissions('MANAGER_DELETE')
  async deleteUser(
    @Param('id') id: string,
    @GetUser('id') performedByUserId: string,
  ) {
    return this.usersService.deleteUser(id, performedByUserId);
  }
}
