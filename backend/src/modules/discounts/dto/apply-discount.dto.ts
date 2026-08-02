import { IsString, IsNumber, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ApplyDiscountItemDto {
  @IsString()
  variant_id: string;

  @IsNumber()
  quantity: number;
}

export class ApplyDiscountDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplyDiscountItemDto)
  items?: ApplyDiscountItemDto[];
}
