import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepo: Repository<CartItem>,
    @InjectRepository(ProductVariant)
    private variantRepo: Repository<ProductVariant>,
  ) {}

  async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepo.findOne({
      where: { user_id: userId },
      relations: [
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.product.images',
        'items.variant.size',
        'items.variant.color',
      ],
    });

    if (!cart) {
      cart = this.cartRepo.create({ user_id: userId, items: [] });
      cart = await this.cartRepo.save(cart);
    }

    // Real-time stock validation for each item
    if (cart.items && cart.items.length > 0) {
      cart.items = cart.items.map((item) => {
        const variant = item.variant;
        const product = variant?.product;
        const isAvailable =
          Boolean(variant) &&
          Boolean(product) &&
          variant.is_active &&
          product.is_active &&
          variant.stock_quantity >= item.quantity;

        const effectivePrice = variant?.price_override != null
          ? Number(variant.price_override)
          : Number(product?.base_price || 0);

        return {
          ...item,
          is_available: isAvailable,
          effective_price: effectivePrice,
          current_stock: variant?.stock_quantity ?? 0,
        } as any;
      });
    }

    return cart;
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<Cart> {
    const variant = await this.variantRepo.findOne({
      where: { id: dto.variant_id },
      relations: ['product'],
    });

    if (!variant || !variant.is_active || !variant.product.is_active) {
      throw new NotFoundException('Sản phẩm hoặc biến thể không tồn tại hoặc đã bị ẩn');
    }

    if (variant.stock_quantity < dto.quantity) {
      throw new BadRequestException(`Sản phẩm chỉ còn ${variant.stock_quantity} sản phẩm trong kho`);
    }

    const cart = await this.getOrCreateCart(userId);
    let item = await this.cartItemRepo.findOne({
      where: { cart_id: cart.id, variant_id: dto.variant_id },
    });

    if (item) {
      const newQuantity = item.quantity + dto.quantity;
      if (variant.stock_quantity < newQuantity) {
        throw new BadRequestException(`Số lượng trong giỏ (${newQuantity}) vượt quá tồn kho (${variant.stock_quantity})`);
      }
      item.quantity = newQuantity;
      await this.cartItemRepo.save(item);
    } else {
      item = this.cartItemRepo.create({
        cart_id: cart.id,
        variant_id: dto.variant_id,
        quantity: dto.quantity,
      });
      await this.cartItemRepo.save(item);
    }

    return this.getOrCreateCart(userId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException('Sản phẩm không có trong giỏ hàng');
    }

    if (item.variant && item.variant.stock_quantity < dto.quantity) {
      throw new BadRequestException(`Số lượng vượt quá tồn kho (${item.variant.stock_quantity})`);
    }

    item.quantity = dto.quantity;
    await this.cartItemRepo.save(item);
    return this.getOrCreateCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((i) => i.id === itemId);

    if (item) {
      await this.cartItemRepo.remove(item);
    }

    return this.getOrCreateCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    if (cart.items && cart.items.length > 0) {
      await this.cartItemRepo.remove(cart.items);
    }
  }
}
