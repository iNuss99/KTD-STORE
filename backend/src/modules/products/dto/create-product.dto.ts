import { IsNotEmpty, IsString, IsUUID, IsNumber, IsOptional, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateVariantDto } from './create-variant.dto';

export class CreateProductImageDto {
  @IsNotEmpty({ message: 'URL ảnh không được để trống' })
  @IsString()
  url: string;

  @IsOptional()
  @IsUUID('4', { message: 'color_id phải là UUID hợp lệ' })
  color_id?: string | null;

  @IsOptional()
  @IsNumber()
  sort_order?: number;

  @IsOptional()
  @IsString()
  alt_text?: string;
}

export class CreateProductDto {
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Mã sản phẩm (code) không được để trống' })
  @IsString()
  code: string;

  @IsNotEmpty({ message: 'Slug sản phẩm không được để trống' })
  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  brand_id?: string;

  @IsNotEmpty({ message: 'ID danh mục không được để trống' })
  @IsUUID('4')
  category_id: string;

  @IsNotEmpty({ message: 'Giá cơ bản không được để trống' })
  @IsNumber()
  @Min(0)
  base_price: number;

  @IsOptional()
  is_active?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  image_urls?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  images?: CreateProductImageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}
