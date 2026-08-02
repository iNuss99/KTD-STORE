import { useQuery } from '@tanstack/react-query';
import { Product, Size, Color } from '../types';

export interface ProductFilter {
  category_id?: string;
  brand_id?: string;
  size_id?: string;
  color_id?: string;
  min_price?: number;
  max_price?: number;
  search?: string;
  limit?: number;
  page?: number;
}

interface ProductListResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function useProducts(filters: ProductFilter) {
  return useQuery<ProductListResponse>({
    queryKey: ['products', filters],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (filters.category_id) query.append('category_id', filters.category_id);
      if (filters.brand_id) query.append('brand_id', filters.brand_id);
      if (filters.size_id) query.append('size_id', filters.size_id);
      if (filters.color_id) query.append('color_id', filters.color_id);
      if (filters.search) query.append('search', filters.search);
      if (filters.min_price) query.append('min_price', filters.min_price.toString());
      if (filters.max_price) query.append('max_price', filters.max_price.toString());
      if (filters.limit) query.append('limit', filters.limit.toString());
      if (filters.page) query.append('page', filters.page.toString());

      const res = await fetch(`/api/products?${query.toString()}`);
      if (!res.ok) {
        throw new Error('Không thể lấy danh sách sản phẩm');
      }
      return res.json();
    },
  });
}

export function useProductDetail(id?: string) {
  return useQuery<Product>({
    queryKey: ['products', 'detail', id],
    queryFn: async () => {
      if (!id) throw new Error('ID sản phẩm không hợp lệ');
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) {
        throw new Error('Không tìm thấy sản phẩm');
      }
      return res.json();
    },
    enabled: !!id,
  });
}

export function useProductMetadata() {
  return useQuery<{ sizes: Size[]; colors: Color[] }>({
    queryKey: ['products', 'metadata'],
    queryFn: async () => {
      const [sizesRes, colorsRes] = await Promise.all([
        fetch('/api/products/sizes'),
        fetch('/api/products/colors'),
      ]);
      const sizes = sizesRes.ok ? await sizesRes.json() : [];
      const colors = colorsRes.ok ? await colorsRes.json() : [];
      return { sizes, colors };
    },
  });
}
