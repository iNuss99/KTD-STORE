import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, IsBoolean, Min, IsArray } from 'class-validator';
import { DiscountType } from '../../../common/enums/discount.enum';

export class CreateDiscountScopeDto {
  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsString()
  brand_id?: string;
}

export class CreateDiscountDto {
  @IsString()
  code: string;

  @IsEnum(DiscountType)
  discount_type: DiscountType;

  @IsNumber()
  @Min(0)
  value: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_uses?: number;

  @IsDateString()
  valid_from: string;

  @IsDateString()
  valid_to: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  min_order_amount?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsArray()
  scopes?: CreateDiscountScopeDto[];
}
