import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Slug danh mục không được để trống' })
  @IsString()
  slug: string;

  @IsOptional()
  @IsUUID('4', { message: 'ID danh mục cha không hợp lệ' })
  parent_id?: string;

  @IsOptional()
  @IsString()
  image_url?: string;
}
