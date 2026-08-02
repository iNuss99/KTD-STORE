import { IsString, IsNotEmpty } from 'class-validator';

export class CreateReturnRequestDto {
  @IsString()
  @IsNotEmpty()
  order_id: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
