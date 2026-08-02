export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
  children?: Category[];
  is_active: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  code: string;
  logo_url?: string;
}

export interface Size {
  id: string;
  name: string;
  code: string;
}

export interface Color {
  id: string;
  name: string;
  code: string;
  hex_code?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size_id: string;
  size?: Size;
  color_id: string;
  color?: Color;
  sku: string;
  price_override?: number;
  effective_price?: number;
  stock_quantity: number;
  is_active: boolean;
  product?: Product;
}

export interface ProductImage {
  id: string;
  url: string;
  alt_text?: string;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  slug: string;
  description?: string;
  brand_id: string;
  brand?: Brand;
  category_id: string;
  category?: Category;
  base_price: number;
  is_active: boolean;
  images?: ProductImage[];
  variants?: ProductVariant[];
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  receiver_name: string;
  phone: string;
  address_line: string;
  ward?: string;
  district?: string;
  province?: string;
  is_default: boolean;
}

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

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'RETURN_REQUESTED' | 'RETURNED' | 'CANCELLED';
export type PaymentMethod = 'COD' | 'BANK_TRANSFER';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  product_name: string;
  sku: string;
  size_name: string;
  color_name: string;
  price: number;
  quantity: number;
}

export interface Payment {
  id: string;
  order_id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  confirmed_by?: string;
  paid_at?: string;
  refund_amount?: number;
  refunded_at?: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  total: number;
  shipping_snapshot: {
    receiver_name: string;
    phone: string;
    address_line: string;
    ward?: string;
    district?: string;
    province?: string;
  };
  note?: string;
  delivered_at?: string;
  created_at: string;
  items: OrderItem[];
  payments: Payment[];
}

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

export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED';

export interface ReturnRequest {
  id: string;
  order_id: string;
  order?: Order;
  user_id: string;
  user?: { full_name: string; email: string; phone: string };
  reason: string;
  status: ReturnStatus;
  approved_by?: string;
  approved_by_user?: { full_name: string };
  rejection_reason?: string;
  refund_amount?: number;
  created_at: string;
  resolved_at?: string;
}
