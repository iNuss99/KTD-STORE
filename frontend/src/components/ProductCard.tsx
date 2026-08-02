import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { Heart, ArrowUpRight } from 'lucide-react';
import { wishlistService } from '../services/wishlist.service';
import { getAuthToken } from '../lib/auth-storage';
import { PromoBadge } from './PromoBadge';

import { useToast } from '../context/ToastContext';

export interface ProductCardProps {
  product?: Product;
  name?: string;
  price?: number;
  oldPrice?: number;
  badge?: 'sale' | 'out';
  thumbColorClass?: string;
  category?: string;
  slug?: string;
  images?: string[];
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  name: propName,
  price: propPrice,
  oldPrice: propOldPrice,
  badge: propBadge,
  thumbColorClass = 'bg-bg-alt',
  category: propCategory,
  slug: propSlug,
  images: propImages,
}) => {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useToast();
  const [isWished, setIsWished] = useState(false);

  const productId = product?.id || propSlug || '';
  const name = product?.name || propName || 'Sản phẩm';
  const price = product?.base_price ?? propPrice ?? 0;
  const oldPrice = propOldPrice;
  const category = product?.category?.name || propCategory || 'Thời trang nam';
  const targetLink = product ? `/products/${product.slug || product.id}` : `/products/${propSlug || ''}`;

  // Calculate stock status
  const isOutOfStock =
    propBadge === 'out' ||
    (product?.variants && product.variants.length > 0 && product.variants.every((v) => v.stock_quantity === 0));
  
  const badgeType = isOutOfStock ? 'out' : propBadge === 'sale' || oldPrice ? 'sale' : undefined;

  const mainImage =
    product?.images?.[0]?.url ||
    propImages?.[0] ||
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80';

  useEffect(() => {
    if (productId && product?.id) {
      wishlistService
        .checkStatus(product.id)
        .then((res) => setIsWished(res.is_wished))
        .catch(() => {});
    }
  }, [productId, product?.id]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product?.id) return;
    const token = getAuthToken();
    if (!token) {
      showWarning('Vui lòng đăng nhập', 'Bạn cần đăng nhập để lưu sản phẩm vào danh sách yêu thích.', () => {
        navigate('/login');
      });
      return;
    }
    try {
      const res = await wishlistService.toggleWishlist(product.id);
      setIsWished(res.is_wished);
      if (res.is_wished) {
        showSuccess('Đã yêu thích', `Đã thêm "${name}" vào danh sách yêu thích.`);
      } else {
        showSuccess('Đã xóa yêu thích', `Đã bỏ "${name}" khỏi danh sách yêu thích.`);
      }
    } catch (err: any) {
      showError('Không thể thực hiện', err.message || 'Có lỗi xảy ra khi cập nhật yêu thích');
    }
  };

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);

  const formattedOldPrice = oldPrice
    ? new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(oldPrice)
    : null;

  return (
    <div className="group relative bg-card border border-line rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-ink transition-all duration-300 flex flex-col">
      {/* Thumbnail Container */}
      <div className={`relative aspect-[4/5] ${thumbColorClass} overflow-hidden`}>
        <img
          src={mainImage}
          alt={name}
          loading="lazy"
          className={`w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03] ${
            isOutOfStock ? 'grayscale opacity-75' : ''
          }`}
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {badgeType === 'out' ? (
            <PromoBadge type="out">Hết hàng</PromoBadge>
          ) : badgeType === 'sale' ? (
            <PromoBadge type="sale">Giảm giá</PromoBadge>
          ) : null}
          {product?.brand && (
            <span className="bg-ink text-white font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md shadow-xs">
              {product.brand.name}
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        {product?.id && (
          <button
            onClick={toggleWishlist}
            aria-label={isWished ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
            className="absolute top-3 right-3 p-2 bg-card/90 backdrop-blur-xs border border-line rounded-full text-ink-soft hover:text-accent transition-all duration-200 shadow-xs z-10"
          >
            <Heart className={`w-4 h-4 ${isWished ? 'fill-accent text-accent' : ''}`} />
          </button>
        )}

        {/* Hover Strip */}
        <div className="absolute bottom-0 inset-x-0 bg-ink text-white p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out flex items-center justify-between z-10">
          <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-card">
            Xem sản phẩm
          </span>
          <ArrowUpRight className="w-4 h-4 text-accent" />
        </div>
      </div>

      {/* Info Container */}
      <div className="p-4 flex flex-col flex-1 justify-between bg-card space-y-3">
        <div>
          <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-ink-soft block mb-1">
            {category}
          </span>
          <h3 className="font-display font-medium text-base text-ink line-clamp-1 group-hover:text-accent transition-colors">
            <Link to={targetLink} className="after:absolute after:inset-0">
              {name}
            </Link>
          </h3>
        </div>

        <div className="pt-2 border-t border-line flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-base font-semibold text-ink tracking-tight">
              {formattedPrice}
            </span>
            {formattedOldPrice && (
              <span className="font-mono text-xs text-ink-soft line-through">
                {formattedOldPrice}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
