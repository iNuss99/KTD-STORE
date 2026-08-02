import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistItem } from './entities/wishlist-item.entity';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(WishlistItem)
    private wishlistItemRepository: Repository<WishlistItem>,
  ) {}

  async toggleWishlist(userId: string, productId: string): Promise<{ is_wished: boolean }> {
    const existing = await this.wishlistItemRepository.findOne({
      where: { user_id: userId, product_id: productId },
    });

    if (existing) {
      await this.wishlistItemRepository.remove(existing);
      return { is_wished: false };
    }

    const newItem = this.wishlistItemRepository.create({
      user_id: userId,
      product_id: productId,
    });
    await this.wishlistItemRepository.save(newItem);
    return { is_wished: true };
  }

  async getUserWishlist(userId: string): Promise<any[]> {
    const items = await this.wishlistItemRepository.find({
      where: { user_id: userId },
      relations: ['product', 'product.images'],
      order: { created_at: 'DESC' },
    });

    // Transform response to match frontend product cards easily
    return items.map((item) => {
      const product = item.product;
      const sortedImages = product.images?.sort((a, b) => a.sort_order - b.sort_order) || [];
      const primaryImage = sortedImages.length > 0 ? sortedImages[0].url : null;

      return {
        id: item.id,
        added_at: item.created_at,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          base_price: product.base_price,
          image_url: primaryImage,
          is_active: product.is_active,
        },
      };
    });
  }

  async checkWishlistStatus(userId: string, productId: string): Promise<{ is_wished: boolean }> {
    const existing = await this.wishlistItemRepository.findOne({
      where: { user_id: userId, product_id: productId },
    });
    return { is_wished: !!existing };
  }
}
