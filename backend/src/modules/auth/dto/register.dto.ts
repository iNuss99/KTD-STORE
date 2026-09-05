import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  full_name: string;

  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^0[0-9]{9}$/, { message: 'Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng số 0' })
  phone: string;
}
