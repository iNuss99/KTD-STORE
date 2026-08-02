import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, IsBoolean, Min, IsArray } from 'class-validator';
import { DiscountType } from '../../../common/enums/discount.enum';
import { CreateDiscountScopeDto } from './create-discount.dto';

export class UpdateDiscountDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(DiscountType)
  discount_type?: DiscountType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_uses?: number;

  @IsOptional()
  @IsDateString()
  valid_from?: string;

  @IsOptional()
  @IsDateString()
  valid_to?: string;

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
