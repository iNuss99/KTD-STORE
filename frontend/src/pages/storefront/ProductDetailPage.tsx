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
import { ProductVariant } from '../../types';
import { ArrowLeft, ShoppingBag, Truck, ShieldCheck, RefreshCw, Loader2, Heart, Zap, Ruler, Flame } from 'lucide-react';
import { useProductDetail } from '../../hooks/useProducts';
import { useAddToCartMutation } from '../../hooks/useCart';
import { useWishlist, useToggleWishlistMutation } from '../../hooks/useWishlist';
import { getAuthToken } from '../../lib/auth-storage';
import { wishlistService } from '../../services/wishlist.service';
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

  const handleToggleWishlist = async () => {
    if (!product) return;
    const token = getAuthToken();
    if (!token) {
      showWarning('Vui lòng đăng nhập', 'Bạn cần đăng nhập để lưu sản phẩm vào danh sách yêu thích.', () => {
        navigate(`/login?redirect=/products/${id}`, { state: { from: `/products/${id}` } });
      });
      return;
    }
    try {
      const res = await wishlistService.toggleWishlist(product.id);
      if (res.is_wished) {
        showSuccess('Đã yêu thích', `Đã thêm "${product.name}" vào danh sách yêu thích.`);
      } else {
        showSuccess('Đã xóa yêu thích', `Đã bỏ "${product.name}" khỏi danh sách yêu thích.`);
      }
    } catch (err: any) {
      showError('Không thể thực hiện', err.message || 'Có lỗi xảy ra khi cập nhật yêu thích');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center flex-col gap-3 py-20">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <span className="font-mono text-xs text-ink-soft">Đang tải thông tin sản phẩm...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-bg flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center flex-col gap-4 py-20">
          <h2 className="font-display text-2xl font-bold text-ink">Không tìm thấy sản phẩm</h2>
          <Link to="/products" className="font-mono text-xs text-accent hover:underline flex items-center gap-1">
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
    <div className="min-h-screen bg-bg flex flex-col font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-12">
        {/* Breadcrumb Navigation */}
        <Link to="/products" className="inline-flex items-center gap-2 font-mono text-xs text-ink-soft hover:text-accent transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> DANH MỤC / {product.category?.name?.toUpperCase() || 'SẢN PHẨM'}
        </Link>

        {/* Details Card */}
        <div className="bg-card border border-line rounded-3xl p-6 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12 shadow-xs">
          {/* Gallery Section */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[4/5] bg-bg-alt border border-line rounded-2xl relative overflow-hidden">
              <img
                src={selectedImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                {product.brand && (
                  <span className="bg-ink text-white font-mono text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-md shadow-xs">
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
                    className={`w-20 aspect-[4/5] bg-bg-alt rounded-xl border transition-all overflow-hidden ${
                      selectedImage === img.url ? 'border-accent ring-2 ring-accent/30' : 'border-line opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="Thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Meta & Actions */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div>
                {product.brand && (
                  <span className="font-mono text-xs font-semibold text-accent uppercase tracking-widest block mb-1">
                    {product.brand.name}
                  </span>
                )}
                <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink tracking-tight">
                  {product.name}
                </h1>
                <span className="font-mono text-[11px] text-ink-soft block mt-1">
                  MÃ SP: {product.code || 'MWH-2026'}
                </span>
              </div>

              {/* Price & SKU */}
              <div className="pt-4 border-t border-line flex items-baseline justify-between">
                <span className="font-mono text-2xl lg:text-3xl font-bold text-accent tracking-tight">
                  {formattedPrice}
                </span>
                {selectedVariant?.sku && (
                  <span className="font-mono text-xs text-ink-soft bg-bg-alt border border-line px-2.5 py-1 rounded-md">
                    SKU: {selectedVariant.sku}
                  </span>
                )}
              </div>

              {/* Stock Scarcity Alert Badge */}
              {isLowStock && (
                <div className="flex items-center gap-2 p-3 bg-coral/10 border border-coral/30 rounded-2xl text-coral text-xs font-semibold animate-pulse">
                  <Flame className="w-4 h-4 shrink-0" />
                  <span>Nhanh tay! Chỉ còn {selectedVariant?.stock_quantity} sản phẩm trong kho.</span>
                </div>
              )}

              {/* Variant Selector Header with Size Guide Trigger */}
              <div className="flex items-center justify-between">
                <span className="font-display font-medium text-sm text-ink">Lựa chọn Phân loại</span>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                >
                  <Ruler className="w-3.5 h-3.5" /> Bảng hướng dẫn chọn size
                </button>
              </div>

              {/* Variant Selector */}
              {product.variants && product.variants.length > 0 ? (
                <VariantSelector
                  variants={product.variants}
                  onVariantSelect={(v) => setSelectedVariant(v)}
                />
              ) : (
                <p className="font-mono text-xs text-ink-soft bg-bg-alt p-3 border border-line rounded-lg">
                  Sản phẩm chưa có biến thể khả dụng.
                </p>
              )}

              {/* Quantity Stepper */}
              <div className="space-y-2">
                <label className="font-display font-medium text-sm text-ink block">Số lượng</label>
                <QtyStepper
                  value={quantity}
                  onChange={(val) => setQuantity(val)}
                  min={1}
                  max={selectedVariant?.stock_quantity || 10}
                  disabled={!selectedVariant || isOutOfStock}
                />
              </div>

              {/* Accordions */}
              <div className="pt-4 space-y-1 border-t border-line">
                <Accordion title="Mô tả sản phẩm & Chất liệu" defaultOpen={true}>
                  <p>
                    {product.description ||
                      'Sản phẩm được thiết kế theo phong cách hiện đại, sử dụng chất liệu vải tuyển chọn tạo cảm giác thoáng mát, bền đẹp và giữ dáng hoàn hảo.'}
                  </p>
                </Accordion>
                <Accordion title="Hướng dẫn bảo quản & Giặt">
                  <p>
                    - Giặt ở nhiệt độ thường với sản phẩm cùng màu.<br />
                    - Không sử dụng chất tẩy mạnh.<br />
                    - Phơi ở nơi thoáng mát, tránh ánh nắng trực tiếp.<br />
                    - Ủi ở nhiệt độ trung bình.
                  </p>
                </Accordion>
                <Accordion title="Chính sách giao hàng & Đổi trả">
                  <p>
                    - Giao hàng toàn quốc từ 24h - 48h.<br />
                    - Cho phép kiểm tra hàng trước khi thanh toán.<br />
                    - Hỗ trợ đổi size/mẫu trong vòng 7 ngày kể từ khi nhận hàng.
                  </p>
                </Accordion>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-6 border-t border-line">
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={!selectedVariant || isOutOfStock || addToCartMutation.isPending}
                  onClick={() => handleAddToCart(false)}
                  className={`flex-1 py-3.5 rounded-full font-sans text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-all shadow-xs ${
                    selectedVariant && !isOutOfStock
                      ? 'bg-accent hover:bg-accent-dark text-white'
                      : 'bg-bg-alt text-ink-soft border border-line cursor-not-allowed'
                  }`}
                >
                  {addToCartMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      {selectedVariant
                        ? isOutOfStock
                          ? 'Biến thể hết hàng'
                          : 'Thêm vào giỏ hàng'
                        : 'Vui lòng chọn size/màu'}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={!selectedVariant || isOutOfStock || addToCartMutation.isPending}
                  onClick={() => handleAddToCart(true)}
                  className={`px-6 py-3.5 rounded-full font-sans text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                    selectedVariant && !isOutOfStock
                      ? 'bg-ink hover:bg-ink/80 text-white'
                      : 'bg-bg-alt text-ink-soft border border-line cursor-not-allowed opacity-50'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Mua ngay</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className={`p-3.5 border rounded-full transition-colors flex items-center justify-center ${
                    isWished
                      ? 'border-coral bg-coral/10 text-coral'
                      : 'border-line text-ink-soft hover:text-coral hover:bg-bg-alt'
                  }`}
                  aria-label="Yêu thích"
                >
                  <Heart className={`w-4 h-4 ${isWished ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Value Props */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-line text-center">
                <div className="p-2 bg-bg-alt rounded-xl border border-line/50 space-y-1">
                  <Truck className="w-4 h-4 text-accent mx-auto" />
                  <span className="font-mono text-[10px] text-ink block font-semibold">Giao hàng 24-48h</span>
                </div>
                <div className="p-2 bg-bg-alt rounded-xl border border-line/50 space-y-1">
                  <RefreshCw className="w-4 h-4 text-accent mx-auto" />
                  <span className="font-mono text-[10px] text-ink block font-semibold">Đổi trả 7 ngày</span>
                </div>
                <div className="p-2 bg-bg-alt rounded-xl border border-line/50 space-y-1">
                  <ShieldCheck className="w-4 h-4 text-accent mx-auto" />
                  <span className="font-mono text-[10px] text-ink block font-semibold">Chính hãng 100%</span>
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
