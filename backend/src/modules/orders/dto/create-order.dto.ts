import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../../common/enums/order.enum';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  variant_id: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class DirectShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  receiver_name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  address_line: string;

  @IsString()
  @IsOptional()
  ward?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  province?: string;
}

export class CreateOrderDto {
  @IsString()
  @IsOptional()
  address_id?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DirectShippingAddressDto)
  shipping_address?: DirectShippingAddressDto;

  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  discount_code?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];
}
