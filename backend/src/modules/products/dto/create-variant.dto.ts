import { IsNotEmpty, IsUUID, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateVariantDto {
  @IsNotEmpty({ message: 'ID Kích thước (size) không được để trống' })
  @IsUUID('4')
  size_id: string;

  @IsNotEmpty({ message: 'ID Màu sắc (color) không được để trống' })
  @IsUUID('4')
  color_id: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price_override?: number;

  @IsNotEmpty({ message: 'Số lượng tồn kho không được để trống' })
  @IsNumber()
  @Min(0)
  stock_quantity: number;
}
