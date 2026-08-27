import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { VariantSelector } from '../../components/storefront/VariantSelector';
import { ReviewSection } from '../../components/storefront/ReviewSection';
import { Accordion } from '../../components/common/Accordion';
import { QtyStepper } from '../../components/common/QtyStepper';
import { PromoBadge } from '../../components/common/PromoBadge';
import { SizeGuideModal } from '../../components/storefront/SizeGuideModal';
import { RelatedProducts } from '../../components/storefront/RelatedProducts';
import { RecentlyViewed } from '../../components/storefront/RecentlyViewed';
import { ProductImage } from '../../components/common/ProductImage';
import { ProductVariant } from '../../types';
import { ArrowLeft, ShoppingBag, Truck, ShieldCheck, RefreshCw, Loader2, Heart, Zap, Ruler, Flame } from 'lucide-react';
import { useProductDetail } from '../../hooks/useProducts';
import { useAddToCartMutation } from '../../hooks/useCart';
import { useWishlist, useToggleWishlistMutation } from '../../hooks/useWishlist';
import { getAuthToken } from '../../lib/auth-storage';
import { useToast } from '../../context/ToastContext';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useToast();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [showSizeGuide, setShowSizeGuide] = useState<boolean>(false);

  const { data: product, isLoading: loading } = useProductDetail(id);
  const addToCartMutation = useAddToCartMutation();
  const toggleWishlistMutation = useToggleWishlistMutation();
  const { data: wishlist = [] } = useWishlist();

  const isWished = product ? wishlist.some((item) => item.product?.id === product.id) : false;

  useEffect(() => {
    if (product?.images && product.images.length > 0) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F2EE] flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center flex-col gap-3 py-20">
          <Loader2 className="w-8 h-8 text-[#C8A96E] animate-spin" />
          <span className="font-mono text-xs text-[#6E6E6E]">Đang tải thông tin sản phẩm...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F5F2EE] flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center flex-col gap-4 py-20">
          <h2 className="font-editorial text-3xl text-[#1A1A1A]">Không tìm thấy sản phẩm</h2>
          <Link to="/products" className="font-mono text-xs text-[#C8A96E] hover:underline flex items-center gap-1">
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

  const isOutOfStock = selectedVariant ? selectedVariant.stock_quantity === 0 : false;
  const isLowStock = selectedVariant && selectedVariant.stock_quantity > 0 && selectedVariant.stock_quantity <= 5;

  return (
    <div className="min-h-screen bg-[#F5F2EE] flex flex-col font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-12">
        {/* Breadcrumb Navigation */}
        <Link to="/products" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[#6E6E6E] hover:text-[#C8A96E] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> BỘ SƯU TẬP / {product.category?.name?.toUpperCase() || 'SẢN PHẨM'}
        </Link>

        {/* 60/40 Immersive Showroom Grid */}
        <div className="bg-white border border-[#1A1A1A]/10 p-6 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Gallery Section (60%) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[3/4] bg-[#EFECE6] border border-[#1A1A1A]/10 relative overflow-hidden">
              <ProductImage
                src={selectedImage}
                alt={product.name}
                category={product.category?.name}
                aspectRatio="portrait"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                {product.brand && (
                  <span className="bg-[#1A1A1A] text-white font-mono text-[9px] uppercase font-bold tracking-widest px-3 py-1 shadow-xs">
                    {product.brand.name}
                  </span>
                )}
                {isOutOfStock && <PromoBadge type="out">Hết hàng</PromoBadge>}
              </div>
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedImage(img.url)}
                    className={`w-20 aspect-[3/4] bg-[#EFECE6] border transition-all overflow-hidden ${
                      selectedImage === img.url ? 'border-[#C8A96E] ring-1 ring-[#C8A96E]' : 'border-[#1A1A1A]/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="Thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Meta & Actions (40%) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div>
                {product.brand && (
                  <span className="font-mono text-xs font-semibold text-[#C8A96E] uppercase tracking-[0.25em] block mb-1">
                    {product.brand.name}
                  </span>
                )}
                <h1 className="font-editorial text-3xl lg:text-4xl font-normal text-[#1A1A1A] tracking-tight">
                  {product.name}
                </h1>
                <span className="font-mono text-[10px] text-[#6E6E6E] block mt-1 uppercase tracking-widest">
                  MÃ SP: {product.code || 'ATELIER-2026'}
                </span>
              </div>

              {/* Price & SKU */}
              <div className="pt-4 border-t border-[#1A1A1A]/10 flex items-baseline justify-between">
                <span className="font-mono text-2xl lg:text-3xl font-bold text-[#1A1A1A] tracking-tight">
                  {formattedPrice}
                </span>
                {selectedVariant?.sku && (
                  <span className="font-mono text-xs text-[#6E6E6E] bg-[#F5F2EE] border border-[#1A1A1A]/10 px-2.5 py-1">
                    SKU: {selectedVariant.sku}
                  </span>
                )}
              </div>

              {/* Stock Scarcity Alert Badge */}
              {isLowStock && (
                <div className="flex items-center gap-2 p-3 bg-[#D4432A]/10 border border-[#D4432A]/30 text-[#D4432A] font-mono text-xs font-semibold">
                  <Flame className="w-4 h-4 shrink-0" />
                  <span>Cảnh báo kho: Chỉ còn {selectedVariant?.stock_quantity} sản phẩm khả dụng.</span>
                </div>
              )}

              {/* Variant Selector Header with Size Guide Trigger */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-[#1A1A1A]">CHỌN PHÂN LOẠI</span>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(true)}
                  className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#C8A96E] hover:underline"
                >
                  <Ruler className="w-3.5 h-3.5" /> BẢNG SIZE ATELIER
                </button>
              </div>

              {/* Variant Selector */}
              {product.variants && product.variants.length > 0 ? (
                <VariantSelector
                  variants={product.variants}
                  onVariantSelect={(v) => setSelectedVariant(v)}
                />
              ) : (
                <p className="font-mono text-xs text-[#6E6E6E] bg-[#F5F2EE] p-3 border border-[#1A1A1A]/10">
                  Sản phẩm chưa có biến thể khả dụng.
                </p>
              )}

              {/* Quantity Stepper */}
              <div className="space-y-2">
                <label className="font-mono text-xs uppercase tracking-wider text-[#1A1A1A] block">SỐ LƯỢNG</label>
                <QtyStepper
                  value={quantity}
                  onChange={(val) => setQuantity(val)}
                  min={1}
                  max={selectedVariant?.stock_quantity || 10}
                  disabled={!selectedVariant || isOutOfStock}
                />
              </div>

              {/* Accordions */}
              <div className="pt-4 space-y-1 border-t border-[#1A1A1A]/10">
                <Accordion title="Chi Tiết Thiết Kế & Chất Liệu" defaultOpen={true}>
                  <p>
                    {product.description ||
                      'Sản phẩm được cắt may tỉ mỉ tại xưởng KTD Atelier với phom dáng chuẩn người Châu Á, chất liệu vải nhập khẩu thoáng mát và sang trọng.'}
                  </p>
                </Accordion>
                <Accordion title="Hướng Dẫn Giặt & Bảo Quản">
                  <p>
                    - Giặt ở nhiệt độ thường với sản phẩm cùng màu.<br />
                    - Không sử dụng chất tẩy rửa nồng độ cao.<br />
                    - Phơi trong bóng râm, tránh ánh nắng gắt trực tiếp.<br />
                    - Là/ủi ở nhiệt độ thích hợp cho từng loại vải.
                  </p>
                </Accordion>
                <Accordion title="Giao Hàng & Chính Sách Đổi Trả">
                  <p>
                    - Giao hàng hỏa tốc toàn quốc 24-48h.<br />
                    - Đồng kiểm trước khi nhận và thanh toán.<br />
                    - Hỗ trợ đổi size/mẫu trong vòng 30 ngày tại nhà.
                  </p>
                </Accordion>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-6 border-t border-[#1A1A1A]/10">
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={!selectedVariant || isOutOfStock || addToCartMutation.isPending}
                  onClick={() => handleAddToCart(false)}
                  className={`flex-1 py-4 font-mono text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2 transition-all ${
                    selectedVariant && !isOutOfStock
                      ? 'bg-[#1A1A1A] hover:bg-[#C8A96E] text-white'
                      : 'bg-[#EFECE6] text-[#6E6E6E] border border-[#1A1A1A]/10 cursor-not-allowed'
                  }`}
                >
                  {addToCartMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-[#C8A96E]" />
                      {selectedVariant
                        ? isOutOfStock
                          ? 'BIẾN THỂ HẾT HÀNG'
                          : 'THÊM VÀO GIỎ HÀNG'
                        : 'VUI LÒNG CHỌN SIZE'}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={!selectedVariant || isOutOfStock || addToCartMutation.isPending}
                  onClick={() => handleAddToCart(true)}
                  className={`px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    selectedVariant && !isOutOfStock
                      ? 'bg-[#C8A96E] hover:bg-[#A38345] text-white'
                      : 'bg-[#EFECE6] text-[#6E6E6E] border border-[#1A1A1A]/10 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>MUA NGAY</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className={`p-4 border transition-colors flex items-center justify-center ${
                    isWished
                      ? 'border-[#D4432A] bg-[#D4432A]/10 text-[#D4432A]'
                      : 'border-[#1A1A1A]/10 text-[#6E6E6E] hover:text-[#D4432A] hover:bg-[#F5F2EE]'
                  }`}
                  aria-label="Yêu thích"
                >
                  <Heart className={`w-4 h-4 ${isWished ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Value Props */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#1A1A1A]/10 text-center">
                <div className="p-3 bg-[#F5F2EE] border border-[#1A1A1A]/10 space-y-1">
                  <Truck className="w-4 h-4 text-[#C8A96E] mx-auto" />
                  <span className="font-mono text-[10px] text-[#1A1A1A] block font-semibold">Giao 24-48h</span>
                </div>
                <div className="p-3 bg-[#F5F2EE] border border-[#1A1A1A]/10 space-y-1">
                  <RefreshCw className="w-4 h-4 text-[#C8A96E] mx-auto" />
                  <span className="font-mono text-[10px] text-[#1A1A1A] block font-semibold">Đổi trả 30 ngày</span>
                </div>
                <div className="p-3 bg-[#F5F2EE] border border-[#1A1A1A]/10 space-y-1">
                  <ShieldCheck className="w-4 h-4 text-[#C8A96E] mx-auto" />
                  <span className="font-mono text-[10px] text-[#1A1A1A] block font-semibold">100% Atelier</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {product && <ReviewSection productId={product.id} />}

        {/* Related Products Recommendation */}
        {product && (
          <RelatedProducts
            categoryId={product.category_id || product.category?.id}
            brandId={product.brand_id || product.brand?.id}
            currentProductId={product.id}
          />
        )}

        {/* Recently Viewed Products */}
        {product && <RecentlyViewed currentProductId={product.id} />}
      </main>

      {/* Size Guide Modal */}
      <SizeGuideModal isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} />
    </div>
  );
};

