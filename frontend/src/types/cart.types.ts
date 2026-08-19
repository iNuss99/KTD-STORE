import { ProductVariant } from './product.types';

export interface CartItem {
  id: string;
  cart_id: string;
  variant_id: string;
  variant: ProductVariant;
  quantity: number;
  added_at: string;
  is_available?: boolean;
  effective_price?: number;
  current_stock?: number;
}

export interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
}
