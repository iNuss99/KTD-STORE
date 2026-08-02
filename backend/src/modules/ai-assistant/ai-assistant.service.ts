import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { ChatAiDto } from './dto/chat-ai.dto';

@Injectable()
export class AiAssistantService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async chat(dto: ChatAiDto): Promise<{ reply: string; suggested_products: Product[] }> {
    const text = dto.message.toLowerCase().trim();

    let queryBuilder = this.productRepo.createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .where('product.is_active = :isActive', { isActive: true });

    let reply = '';
    let keywordFound = false;

    if (text.includes('sơ mi') || text.includes('dài tay') || text.includes('công sở')) {
      queryBuilder = queryBuilder.andWhere('(LOWER(product.name) LIKE :kw OR LOWER(category.name) LIKE :kw)', { kw: '%sơ mi%' });
      reply = 'Dạ chào anh! Với phong cách lịch lãm công sở hoặc đi sự kiện, em gợi ý các mẫu **Áo Sơ Mi Nam** cao cấp chuẩn phom dưới đây ạ:';
      keywordFound = true;
    } else if (text.includes('quần') || text.includes('tây') || text.includes('jeans') || text.includes('kaki')) {
      queryBuilder = queryBuilder.andWhere('(LOWER(product.name) LIKE :kw OR LOWER(category.name) LIKE :kw)', { kw: '%quần%' });
      reply = 'Dạ! Dưới đây là các mẫu **Quần Nam** chuẩn dáng (Quần tây, Kaki, Jeans) đang bán chạy nhất tại MenWear Hub:';
      keywordFound = true;
    } else if (text.includes('polo') || text.includes('thun') || text.includes('ngắn tay') || text.includes('năng động')) {
      queryBuilder = queryBuilder.andWhere('(LOWER(product.name) LIKE :kw OR LOWER(category.name) LIKE :kw)', { kw: '%polo%' });
      reply = 'Dạ! Tùy chọn áo Polo / Áo thun năng động và trẻ trung cho anh vừa đi làm vừa đi chơi nè:';
      keywordFound = true;
    } else {
      reply = 'Chào mừng anh đến với MenWear Hub! Em là Trợ lý AI Stylist. Dưới đây là những sản phẩm nổi bật nhất sẵn có tại shop ạ:';
    }

    const products = await queryBuilder.take(4).getMany();

    if (products.length === 0 && keywordFound) {
      const fallbackProducts = await this.productRepo.find({
        where: { is_active: true },
        relations: ['images', 'category', 'brand'],
        take: 3,
      });
      return {
        reply: `Dạ hiện mẫu anh tìm đang tạm hết hàng, em gửi anh tham khảo một số mẫu thời trang nam nổi bật khác nhé:`,
        suggested_products: fallbackProducts,
      };
    }

    return {
      reply,
      suggested_products: products,
    };
  }
}
