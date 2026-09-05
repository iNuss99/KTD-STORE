import { IsString, IsUUID, IsNumber, IsOptional, Min, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductImageDto } from './create-product.dto';

export class UpdateVariantItemDto {
  @IsOptional()
  @IsUUID('4')
  id?: string;

  @IsOptional()
  @IsUUID('4')
  size_id?: string;

  @IsOptional()
  @IsUUID('4')
  color_id?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock_quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price_override?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  brand_id?: string;

  @IsOptional()
  @IsUUID('4')
  category_id?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  base_price?: number;

  @IsOptional()
  @IsBoolean()
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
  @Type(() => UpdateVariantItemDto)
  variants?: UpdateVariantItemDto[];
}
