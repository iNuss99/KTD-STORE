import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateBrandDto {
  @IsNotEmpty({ message: 'Tên thương hiệu không được để trống' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Slug thương hiệu không được để trống' })
  @IsString()
  slug: string;

  @IsNotEmpty({ message: 'Mã thương hiệu (code) không được để trống' })
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  logo_url?: string;
}
