import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import { Heart, ArrowUpRight } from 'lucide-react';
import { getAuthToken } from '../../lib/auth-storage';
import { PromoBadge } from '../common/PromoBadge';
import { useToast } from '../../context/ToastContext';
import { useWishlist, useToggleWishlistMutation } from '../../hooks/useWishlist';
import { ProductImage } from '../common/ProductImage';

// Module-level formatter — tạo 1 lần, dùng lại mỗi render
const vndFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const formatVND = (amount: number) => vndFormatter.format(amount);

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
  thumbColorClass = 'bg-[#EFECE6]',
  category: propCategory,
  slug: propSlug,
  images: propImages,
}) => {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useToast();

  const { data: wishlist = [] } = useWishlist();
  const toggleWishlistMutation = useToggleWishlistMutation();

  const productId = product?.id || propSlug || '';
  const name = product?.name || propName || 'Sản phẩm KTD';
  const price = product?.base_price ?? propPrice ?? 0;
  const oldPrice = propOldPrice;
  const category = product?.category?.name || propCategory || 'Bộ sưu tập Nam';
  const targetLink = product ? `/products/${product.slug || product.id}` : `/products/${propSlug || ''}`;

  const isWished = product?.id
    ? wishlist.some((item) => item.product?.id === product.id)
    : false;

  const isOutOfStock =
    propBadge === 'out' ||
    (product?.variants && product.variants.length > 0 && product.variants.every((v) => v.stock_quantity === 0));

  const badgeType = isOutOfStock ? 'out' : propBadge === 'sale' || oldPrice ? 'sale' : undefined;

  const mainImage = product?.images?.[0]?.url || propImages?.[0] || null;

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
    toggleWishlistMutation.mutate(product.id, {
      onSuccess: (res) => {
        if (res.is_wished) {
          showSuccess('Đã yêu thích', `Đã thêm "${name}" vào danh sách yêu thích.`);
        } else {
          showSuccess('Đã xóa yêu thích', `Đã bỏ "${name}" khỏi danh sách yêu thích.`);
        }
      },
      onError: (err: any) => {
        showError('Không thể thực hiện', err.message || 'Có lỗi xảy ra khi cập nhật yêu thích');
      },
    });
  };

  const formattedPrice = formatVND(price);
  const formattedOldPrice = oldPrice ? formatVND(oldPrice) : null;

  return (
    <div className="group relative bg-white border border-[#1A1A1A]/10 rounded-none overflow-hidden hover:border-[#C8A96E] transition-all duration-500 flex flex-col">
      {/* Thumbnail Container */}
      <div className={`relative aspect-[3/4] ${thumbColorClass} overflow-hidden`}>
        <ProductImage
          src={mainImage}
          alt={name}
          category={category}
          aspectRatio="portrait"
          className={isOutOfStock ? 'grayscale opacity-70' : ''}
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {badgeType === 'out' ? (
            <PromoBadge type="out">Hết hàng</PromoBadge>
          ) : badgeType === 'sale' ? (
            <PromoBadge type="sale">Giảm giá</PromoBadge>
          ) : null}
        </div>

        {/* Wishlist Button */}
        {product?.id && (
          <button
            onClick={toggleWishlist}
            aria-label={isWished ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
            className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm border border-[#1A1A1A]/10 rounded-full text-[#1A1A1A] hover:text-[#C8A96E] transition-all duration-300 shadow-xs z-10"
          >
            <Heart className={`w-4 h-4 ${isWished ? 'fill-[#C8A96E] text-[#C8A96E]' : ''}`} />
          </button>
        )}

        {/* Hover Strip */}
        <div className="absolute bottom-0 inset-x-0 bg-[#1A1A1A] text-white p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out flex items-center justify-between z-10">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#F5F2EE]">
            XEM CHI TIẾT
          </span>
          <ArrowUpRight className="w-4 h-4 text-[#C8A96E]" />
        </div>
      </div>

      {/* Info Container */}
      <div className="p-4 flex flex-col flex-1 justify-between bg-white space-y-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6E6E6E] block mb-1">
            {category}
          </span>
          <h3 className="font-editorial font-medium text-lg text-[#1A1A1A] line-clamp-1 group-hover:text-[#C8A96E] transition-colors">
            <Link to={targetLink} className="after:absolute after:inset-0">
              {name}
            </Link>
          </h3>
        </div>

        <div className="pt-2 border-t border-[#1A1A1A]/10 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-semibold text-[#1A1A1A]">
              {formattedPrice}
            </span>
            {formattedOldPrice && (
              <span className="font-mono text-xs text-[#6E6E6E] line-through">
                {formattedOldPrice}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 font-mono text-[10px] font-semibold text-[#C8A96E]">
            <span>★ 4.9</span>
          </div>
        </div>
      </div>
    </div>
  );
};

