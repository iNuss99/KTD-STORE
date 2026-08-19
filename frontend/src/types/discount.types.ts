import { Category, Brand } from './product.types';

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface DiscountScope {
  id: string;
  discount_id: string;
  category_id?: string;
  category?: Category;
  brand_id?: string;
  brand?: Brand;
}

export interface Discount {
  id: string;
  code: string;
  discount_type: DiscountType;
  value: number;
  max_uses: number;
  used_count: number;
  valid_from: string;
  valid_to: string;
  min_order_amount: number;
  is_active: boolean;
  scopes?: DiscountScope[];
  created_at: string;
}

export interface DiscountAppliedResult {
  code: string;
  discount_type: DiscountType;
  value: number;
  discount_amount: number;
  applicable_subtotal: number;
}
