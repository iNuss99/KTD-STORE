import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'userId phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'userId không được để trống' })
  userId: string;

  @IsString({ message: 'refreshToken phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'refreshToken không được để trống' })
  refreshToken: string;
}
