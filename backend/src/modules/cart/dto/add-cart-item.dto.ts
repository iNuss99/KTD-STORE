import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class AddCartItemDto {
  @IsString()
  @IsNotEmpty()
  variant_id: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
