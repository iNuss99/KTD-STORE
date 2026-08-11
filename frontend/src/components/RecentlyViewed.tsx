import React, { useEffect, useState } from 'react';
import { ProductCard } from './ProductCard';
import { Clock } from 'lucide-react';
import { Product } from '../types';

interface RecentlyViewedProps {
  currentProductId?: string;
}

export const RecentlyViewed: React.FC<RecentlyViewedProps> = ({ currentProductId }) => {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ktd_recent_products');
      if (stored) {
        const parsed: Product[] = JSON.parse(stored);
        const filtered = parsed.filter((p) => p.id !== currentProductId).slice(0, 4);
        setRecentProducts(filtered);
      }
    } catch {
      setRecentProducts([]);
    }
  }, [currentProductId]);

  if (recentProducts.length === 0) return null;

  return (
    <section className="pt-12 border-t border-line space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent" />
          <h3 className="font-display text-xl font-bold text-ink">Sản Phẩm Vừa Xem Gần Đây</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {recentProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
};
