import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { VariantSelector } from '../../components/storefront/VariantSelector';
import { ReviewSection } from '../../components/storefront/ReviewSection';
import { Accordion } from '../../components/common/Accordion';
import { SizeGuideModal } from '../../components/storefront/SizeGuideModal';
import { ProductImage } from '../../components/common/ProductImage';

import { ProductVariant } from '../../types';
import {
  ArrowLeft,
  ShoppingBag,
  Truck,
  RotateCcw,
  Loader2,
  Heart,
  Zap,
  Flame,
  Star,
  Share2,
  Ticket,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
  MapPin,
  Minus,
  Plus,
  Copy,
  ChevronDown,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useProductDetail, useProducts } from '../../hooks/useProducts';
import { useAddToCartMutation } from '../../hooks/useCart';
import { useWishlist, useToggleWishlistMutation } from '../../hooks/useWishlist';
import { getAuthToken } from '../../lib/auth-storage';
import { useToast } from '../../context/ToastContext';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useToast();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [showSizeGuide, setShowSizeGuide] = useState<boolean>(false);

  const { data: product, isLoading: loading } = useProductDetail(id);
  const addToCartMutation = useAddToCartMutation();
  const toggleWishlistMutation = useToggleWishlistMutation();
  const { data: wishlist = [] } = useWishlist();

  // Related products for "GỢI Ý XEM THÊM"
  const { data: relatedData } = useProducts({
    category_id: product?.category_id,
    limit: 6,
  });

  const relatedProducts = useMemo(() => {
    if (!relatedData?.data || !product) return [];
    return relatedData.data.filter((p) => p.id !== product.id).slice(0, 2);
  }, [relatedData, product]);

  const isWished = product ? wishlist.some((item) => item.product?.id === product.id) : false;

  // Filter images based on selected color
  const displayImages = useMemo(() => {
    if (!product?.images || product.images.length === 0) return [];
    if (!selectedColorId) return product.images;

    const colorSpecific = product.images.filter((img) => img.color_id === selectedColorId);
    const shared = product.images.filter((img) => !img.color_id);

    if (colorSpecific.length > 0) {
      return [...colorSpecific, ...shared];
    }

    return product.images;
  }, [product?.images, selectedColorId]);

  useEffect(() => {
    if (displayImages.length > 0) {
      const existsInDisplay = displayImages.some((img) => img.url === selectedImage);
      if (!existsInDisplay) {
        setSelectedImage(displayImages[0].url);
      }
    }
  }, [displayImages]);

  const handleColorChange = (colorId: string | null) => {
    setSelectedColorId(colorId);
    if (!product?.images || product.images.length === 0) return;
    if (colorId) {
      const matched = product.images.find((img) => img.color_id === colorId);
      if (matched) {
        setSelectedImage(matched.url);
        return;
      }
    }
    setSelectedImage(product.images[0].url);
  };

  useEffect(() => {
    if (product?.images && product.images.length > 0 && !selectedImage) {
      setSelectedImage(product.images[0].url);
    }
    if (product) {
      try {
        const stored = localStorage.getItem('ktd_recent_products');
        const list: any[] = stored ? JSON.parse(stored) : [];
        const filtered = list.filter((p) => p.id !== product.id);
        const updated = [product, ...filtered].slice(0, 10);
        localStorage.setItem('ktd_recent_products', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  }, [product]);

  // Gallery previous/next navigation
  const currentImageIndex = displayImages.findIndex((img) => img.url === selectedImage);
  const handlePrevImage = () => {
    if (displayImages.length <= 1) return;
    const prevIndex = (currentImageIndex - 1 + displayImages.length) % displayImages.length;
    setSelectedImage(displayImages[prevIndex].url);
  };
  const handleNextImage = () => {
    if (displayImages.length <= 1) return;
    const nextIndex = (currentImageIndex + 1) % displayImages.length;
    setSelectedImage(displayImages[nextIndex].url);
  };

  const handleAddToCart = (directBuy = false) => {
    if (!selectedVariant) return;
    const token = getAuthToken();
    if (!token) {
      navigate(`/login?redirect=${directBuy ? '/checkout' : `/products/${id}`}`, {
        state: { from: `/products/${id}` },
      });
      return;
    }
    addToCartMutation.mutate(
      { variant_id: selectedVariant.id, quantity },
      {
        onSuccess: () => {
          if (directBuy) {
            navigate('/checkout');
          } else {
            showSuccess('Đã thêm vào giỏ', `Đã thêm ${quantity} x ${product?.name} vào giỏ hàng`);
            navigate('/cart');
          }
        },
        onError: (err: any) => {
          showError('Không thể thêm sản phẩm', err.message || 'Không thể thêm sản phẩm vào giỏ hàng');
        },
      },
    );
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    const token = getAuthToken();
    if (!token) {
      showWarning('Vui lòng đăng nhập', 'Bạn cần đăng nhập để lưu sản phẩm vào danh sách yêu thích.', () => {
        navigate(`/login?redirect=/products/${id}`, { state: { from: `/products/${id}` } });
      });
      return;
    }
    toggleWishlistMutation.mutate(product.id, {
      onSuccess: (res) => {
        if (res.is_wished) {
          showSuccess('Đã yêu thích', `Đã thêm "${product.name}" vào danh sách yêu thích.`);
        } else {
          showSuccess('Đã xóa yêu thích', `Đã bỏ "${product.name}" khỏi danh sách yêu thích.`);
        }
      },
      onError: (err: any) => {
        showError('Không thể thực hiện', err.message || 'Có lỗi xảy ra khi cập nhật yêu thích');
      },
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showSuccess('Đã lưu mã giảm giá', `Mã "${code}" đã được sao chép! Hãy dán vào ô Mã giảm giá tại Giỏ hàng hoặc Thanh toán.`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showSuccess('Đã sao chép liên kết', 'Đường dẫn sản phẩm đã được sao chép vào bộ nhớ tạm!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center flex-col gap-3 py-20">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Đang tải thông tin sản phẩm...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center flex-col gap-4 py-20">
          <h2 className="text-2xl font-bold text-slate-900">Không tìm thấy sản phẩm</h2>
          <Link to="/products" className="text-xs font-semibold text-accent hover:underline flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  const displayPrice = selectedVariant
    ? selectedVariant.effective_price ?? selectedVariant.price_override ?? product.base_price
    : product.base_price;

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(displayPrice || 0);

  const cashbackAmount = new Intl.NumberFormat('vi-VN').format(Math.round(displayPrice * 0.08));

  const isOutOfStock = selectedVariant ? selectedVariant.stock_quantity === 0 : false;
  const isLowStock = selectedVariant && selectedVariant.stock_quantity > 0 && selectedVariant.stock_quantity <= 5;

  const { data: publicDiscounts = [] } = useQuery<{ code: string; label: string }[]>({
    queryKey: ['discounts', 'public'],
    queryFn: async () => {
      const res = await fetch('/api/discounts/public');
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60_000,
  });

  const promoCodes = publicDiscounts.length > 0
    ? publicDiscounts
    : [
        { code: 'GIAM20K', label: 'Giảm 20K' },
        { code: 'GIAM10', label: 'Giảm 10%' },
        { code: 'GIAM12', label: 'Giảm 12%' },
      ];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-slate-900 transition">Trang chủ</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-slate-900 transition">Sản phẩm</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link to={`/products?category_id=${product.category_id}`} className="hover:text-slate-900 transition">
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-xs">
            {product.name}
          </span>
        </div>

        {/* 2-Column Product Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* LEFT: GALLERY SECTION (6 cols on lg, with vertical thumbs on desktop) */}
          <div className="lg:col-span-6 flex flex-col sm:flex-row gap-4">
            {/* Vertical Thumbnails Column */}
            {displayImages && displayImages.length > 1 && (
              <div className="order-2 sm:order-1 flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto sm:max-h-[580px] scrollbar-thin scrollbar-thumb-slate-200 shrink-0 pb-2 sm:pb-0">
                {displayImages.map((img, idx) => {
                  const isActive = selectedImage === img.url;
                  return (
                    <button
                      key={img.id || idx}
                      type="button"
                      onClick={() => setSelectedImage(img.url)}
                      className={`w-16 sm:w-20 aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden border-2 transition-all shrink-0 relative ${
                        isActive
                          ? 'border-slate-900 shadow-sm ring-1 ring-slate-900'
                          : 'border-transparent opacity-75 hover:opacity-100 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt="Thumbnail"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80';
                        }}
                        className="w-full h-full object-cover"
                      />
                      {img.color && (
                        <span className="absolute bottom-1 inset-x-1 text-[8px] font-bold py-0.5 px-1 bg-black/75 text-white rounded text-center truncate">
                          {img.color.name}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Main Big Image Container */}
            <div className="order-1 sm:order-2 flex-1 relative aspect-[3/4] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs">
              <ProductImage
                src={selectedImage}
                alt={product.name}
                category={product.category?.name}
                aspectRatio="portrait"
              />

              {/* Badges Overlay */}
              {isOutOfStock && (
                <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                  <span className="bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs">
                    Hết hàng
                  </span>
                </div>
              )}

              {/* Circular Carousel Navigation Arrows (Bottom-Right) */}
              {displayImages && displayImages.length > 1 && (
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="w-9 h-9 rounded-full bg-white/95 text-slate-800 shadow-md backdrop-blur-xs flex items-center justify-center hover:bg-white hover:scale-105 active:scale-95 transition-all border border-slate-200/60"
                    title="Ảnh trước"
                  >
                    <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="w-9 h-9 rounded-full bg-white/95 text-slate-800 shadow-md backdrop-blur-xs flex items-center justify-center hover:bg-white hover:scale-105 active:scale-95 transition-all border border-slate-200/60"
                    title="Ảnh tiếp theo"
                  >
                    <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: PRODUCT INFO & BUY BOX (6 cols on lg) */}
          <div className="lg:col-span-6 flex flex-col space-y-5">
            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Rating & Share Row */}
              <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="font-semibold text-slate-700">(5)</span>
                </div>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-semibold transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Chia sẻ</span>
                </button>
              </div>
            </div>

            {/* Price & Freeship Tag */}
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {formattedPrice}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-600 border border-sky-200">
                <Truck className="w-3.5 h-3.5" /> Freeship
              </span>
            </div>

            {/* Voucher Coupons Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mr-1">
                <Ticket className="w-3.5 h-3.5 text-accent" /> Mã giảm giá:
              </span>
              {promoCodes.map((promo) => (
                <button
                  key={promo.code}
                  type="button"
                  onClick={() => handleCopyCode(promo.code)}
                  className="group px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-800 bg-amber-50 border border-dashed border-amber-300 hover:bg-amber-100/80 transition flex items-center gap-1"
                  title={`Bấm để sao chép mã ${promo.code}`}
                >
                  <span>{promo.label}</span>
                  <Copy className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                </button>
              ))}
            </div>

            {/* Loyalty Cashback Banner */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-indigo-950 shadow-2xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-medium">
                  Được hoàn lên đến <strong className="font-bold text-indigo-700">{cashbackAmount}đ</strong> KTD Cash.
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-indigo-400" />
            </div>

            {/* Stock Scarcity Alert Badge */}
            {isLowStock && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl">
                <Flame className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Cảnh báo kho: Chỉ còn {selectedVariant?.stock_quantity} sản phẩm khả dụng.</span>
              </div>
            )}

            {/* Variant Selector (Colors & Sizes) */}
            {product.variants && product.variants.length > 0 ? (
              <div className="py-2 border-t border-slate-100">
                <VariantSelector
                  variants={product.variants}
                  onVariantSelect={(v) => {
                    setSelectedVariant(v);
                    if (v?.color_id && v.color_id !== selectedColorId) {
                      handleColorChange(v.color_id);
                    }
                  }}
                  onColorChange={(cId) => handleColorChange(cId)}
                  onOpenSizeGuide={() => setShowSizeGuide(true)}
                />
              </div>
            ) : (
              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                Sản phẩm chưa có biến thể khả dụng.
              </p>
            )}

            {/* Main Purchase Action Bar: Quantity [- 1 +] + [Thêm vào giỏ] */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                {/* Quantity Stepper */}
                <div className="h-12 bg-slate-100 rounded-xl px-3 flex items-center justify-between gap-3 text-slate-800 font-bold text-sm shrink-0 border border-slate-200/60">
                  <button
                    type="button"
                    disabled={quantity <= 1 || !selectedVariant || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-bold text-slate-900 select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={!selectedVariant || isOutOfStock || quantity >= (selectedVariant?.stock_quantity || 10)}
                    onClick={() => setQuantity((q) => Math.min(selectedVariant?.stock_quantity || 10, q + 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Big Black Add To Cart Button */}
                <button
                  type="button"
                  disabled={!selectedVariant || isOutOfStock || addToCartMutation.isPending}
                  onClick={() => handleAddToCart(false)}
                  className={`flex-1 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                    selectedVariant && !isOutOfStock
                      ? 'bg-slate-950 hover:bg-slate-800 text-white active:scale-[0.99]'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  }`}
                >
                  {addToCartMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      {selectedVariant
                        ? isOutOfStock
                          ? 'BIẾN THỂ HẾT HÀNG'
                          : 'Thêm vào giỏ'
                        : 'Vui lòng chọn size'}
                    </>
                  )}
                </button>
              </div>

              {/* Secondary Actions: Mua ngay & Yêu thích */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={!selectedVariant || isOutOfStock || addToCartMutation.isPending}
                  onClick={() => handleAddToCart(true)}
                  className={`flex-1 h-11 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                    selectedVariant && !isOutOfStock
                      ? 'bg-accent hover:bg-accent-dark text-white'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 opacity-60'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Mua ngay</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className={`w-11 h-11 rounded-xl border flex items-center justify-center transition ${
                    isWished
                      ? 'border-rose-300 bg-rose-50 text-rose-600'
                      : 'border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50/50 hover:text-rose-600'
                  }`}
                  aria-label="Yêu thích"
                  title={isWished ? 'Đã lưu yêu thích' : 'Lưu vào yêu thích'}
                >
                  <Heart className={`w-4 h-4 ${isWished ? 'fill-current text-rose-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Anchor to Product Description */}
            <div className="text-center pt-1">
              <a
                href="#product-description"
                className="text-xs font-bold text-slate-900 hover:text-accent underline underline-offset-4 decoration-slate-300 transition"
              >
                Mô tả sản phẩm
              </a>
            </div>

            {/* 4-Grid Service Commitments Box */}
            <div className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <Truck className="w-4 h-4 text-slate-800" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Freeship từ 200k</p>
                  <p className="text-slate-500 text-[11px]">Giao hỏa tốc 24-48h toàn quốc</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <RotateCcw className="w-4 h-4 text-slate-800" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-900">60 ngày đổi trả</p>
                  <p className="text-slate-500 text-[11px]">Đổi trả vì bất kỳ lý do gì</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <PhoneCall className="w-4 h-4 text-slate-800" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Hotline 1900.272737</p>
                  <p className="text-slate-500 text-[11px]">Hỗ trợ từ 8h30 - 22h mỗi ngày</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <MapPin className="w-4 h-4 text-slate-800" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Thu hồi tận nơi</p>
                  <p className="text-slate-500 text-[11px]">Hoàn tiền nhanh trong 2-3 ngày</p>
                </div>
              </div>
            </div>

            {/* GỢI Ý XEM THÊM (Cross-sell in right sidebar) */}
            {relatedProducts && relatedProducts.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  GỢI Ý XEM THÊM
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {relatedProducts.map((rel) => {
                    const relPrice = new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(rel.base_price || 0);

                    const relThumb =
                      rel.images && rel.images.length > 0
                        ? rel.images[0].url
                        : 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80';

                    return (
                      <Link
                        key={rel.id}
                        to={`/products/${rel.id}`}
                        className="group bg-white rounded-xl border border-slate-200/80 overflow-hidden hover:shadow-md transition flex flex-col"
                      >
                        <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                          <img
                            src={relThumb}
                            alt={rel.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute bottom-2 right-2 w-7 h-7 bg-white/90 rounded-full shadow-sm flex items-center justify-center text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition">
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-bold text-slate-800 truncate group-hover:text-accent transition">
                            {rel.name}
                          </p>
                          <p className="text-xs font-black text-slate-900 mt-1">
                            {relPrice}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM SECTION: DETAILED DESCRIPTION & REVIEWS */}
        <div id="product-description" className="pt-12 border-t border-slate-200 space-y-12">
          {/* Detailed Info Cards / Accordions */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Thông tin chi tiết sản phẩm
            </h2>

            <div className="space-y-3">
              <Accordion title="Chi Tiết Thiết Kế & Chất Liệu" defaultOpen={true}>
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {product.description ||
                    'Sản phẩm được nghiên cứu và thiết kế tỉ mỉ bởi KTD-Store, sử dụng chất liệu vải co giãn cao cấp, thoáng khí và thấm hút mồ hôi vượt trội, phù hợp cho cả tập luyện thể thao lẫn sinh hoạt hàng ngày.'}
                </div>
              </Accordion>

              <Accordion title="Hướng Dẫn Giặt & Bảo Quản">
                <div className="text-sm text-slate-700 leading-relaxed space-y-1">
                  <p>• Giặt máy ở chế độ nhẹ nhàng với nước lạnh hoặc nhiệt độ thường.</p>
                  <p>• Tránh sử dụng chất tẩy có chứa clo để bảo vệ màu sắc và sợi vải.</p>
                  <p>• Phơi trong bóng mát, tránh ánh nắng gắt chiếu trực tiếp.</p>
                  <p>• Là/ủi ở nhiệt độ thấp nếu cần thiết.</p>
                </div>
              </Accordion>

              <Accordion title="Chính Sách Vận Chuyển & Đổi Trả">
                <div className="text-sm text-slate-700 leading-relaxed space-y-1">
                  <p>• Miễn phí giao hàng cho tất cả các đơn hàng từ 200.000đ trở lên.</p>
                  <p>• Hỗ trợ đổi size hoặc đổi mẫu trong vòng 60 ngày nếu chưa vừa ý.</p>
                  <p>• Shipper đến tận nơi đổi trả hàng, bạn không cần phải mang ra bưu cục.</p>
                </div>
              </Accordion>
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="pt-4">
            {product && <ReviewSection productId={product.id} />}
          </div>
        </div>
      </main>

      {/* Size Guide Modal */}
      <SizeGuideModal isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} />
    </div>
  );
};


