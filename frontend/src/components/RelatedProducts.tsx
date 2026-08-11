import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProductCard } from './ProductCard';
import { Sparkles } from 'lucide-react';
import { Product } from '../types';

interface RelatedProductsProps {
  categoryId?: string;
  brandId?: string;
  currentProductId: string;
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({
  categoryId,
  brandId,
  currentProductId,
}) => {
  const { data } = useQuery<{ data: Product[] }>({
    queryKey: ['related-products', categoryId, brandId],
    queryFn: async () => {
      const url = categoryId
        ? `/api/products?category_id=${categoryId}&limit=8`
        : `/api/products?limit=8`;
      const res = await fetch(url);
      return res.ok ? res.json() : { data: [] };
    },
    enabled: Boolean(categoryId || brandId),
  });

  const products = (data?.data || [])
    .filter((p) => p.id !== currentProductId)
    .slice(0, 4);

  if (products.length === 0) return null;

  return (
    <section className="pt-12 border-t border-line space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-accent" />
        <h3 className="font-display text-xl font-bold text-ink">Gợi Ý Phối Đồ & Sản Phẩm Tương Tự</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
};
