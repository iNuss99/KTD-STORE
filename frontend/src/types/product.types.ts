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
