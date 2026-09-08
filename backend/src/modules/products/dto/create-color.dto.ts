import { IsNotEmpty, IsString, Matches, IsOptional, Length } from 'class-validator';

export class CreateColorDto {
  @IsNotEmpty({ message: 'Tên màu sắc không được để trống' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 20, { message: 'Mã viết tắt từ 1 đến 20 ký tự' })
  code?: string;

  @IsNotEmpty({ message: 'Mã màu Hex không được để trống' })
  @Matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, {
    message: 'Mã hex phải có định dạng #RGB hoặc #RRGGBB (ví dụ: #FF0000)',
  })
  hex_code: string;
}
