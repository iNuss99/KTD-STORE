import { IsEmail, IsNotEmpty, MinLength, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../../common/enums/role.enum';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsOptional()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password?: string;

  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  full_name: string;

  @IsEnum(UserRole, { message: 'Role không hợp lệ' })
  @IsNotEmpty({ message: 'Role không được để trống' })
  role: UserRole;

  @IsOptional()
  @IsString()
  phone?: string;
}
