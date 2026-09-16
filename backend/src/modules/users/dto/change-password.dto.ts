import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu hiện tại' })
  @IsString({ message: 'Mật khẩu hiện tại phải là chuỗi' })
  currentPassword: string;

  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu mới' })
  @IsString({ message: 'Mật khẩu mới phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;

  @IsNotEmpty({ message: 'Vui lòng xác nhận mật khẩu mới' })
  @IsString({ message: 'Xác nhận mật khẩu mới phải là chuỗi' })
  @MinLength(6, { message: 'Xác nhận mật khẩu phải có ít nhất 6 ký tự' })
  confirmPassword: string;
}
