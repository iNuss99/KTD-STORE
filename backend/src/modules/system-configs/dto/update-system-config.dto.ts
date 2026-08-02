import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateSystemConfigDto {
  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  @IsOptional()
  description?: string;
}
