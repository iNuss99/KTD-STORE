import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, Loader2, AlertTriangle, Tag, CheckCircle2 } from 'lucide-react';
import { useCart, useUpdateCartItemMutation, useRemoveCartItemMutation } from '../../hooks/useCart';
import { QtyStepper } from '../../components/common/QtyStepper';
import { EmptyState } from '../../components/common/EmptyState';
import { PromoBadge } from '../../components/common/PromoBadge';
import { getAuthToken } from '../../lib/auth-storage';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: cart, isLoading: loading } = useCart();
  const updateQuantityMutation = useUpdateCartItemMutation();
  const removeItemMutation = useRemoveCartItemMutation();

  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate({ itemId, quantity: newQuantity });
  };

  const handleRemoveItem = (itemId: string) => {
    removeItemMutation.mutate(itemId);
  };

  const handleApplyPromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    setPromoLoading(true);
    setPromoError(null);

    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          code: promoCode.trim(),
          cart_items: cart?.items || [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
      }

      setDiscountAmount(data.discount_amount || 0);
      setAppliedCode(promoCode.trim().toUpperCase());
      setPromoError(null);
    } catch (err: any) {
      setDiscountAmount(0);
      setAppliedCode(null);
      setPromoError(err.message || 'Không thể áp dụng mã giảm giá');
    } finally {
      setPromoLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center flex-col gap-3 py-20">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <span className="font-mono text-xs text-ink-soft">Đang tải giỏ hàng...</span>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  
  // Real-time stock validation check
  const itemsWithStockError = items.map((item) => {
    const variant = item.variant;
    const stock = item.current_stock ?? variant?.stock_quantity ?? 0;
    const isAvailable =
      item.is_available !== false &&
      variant?.is_active !== false &&
      stock > 0 &&
      item.quantity <= stock;

    return {
      ...item,
      isAvailable,
      stock,
      errorReason:
        stock === 0
          ? 'Sản phẩm đã hết hàng'
          : item.quantity > stock
          ? `Số lượng khả dụng chỉ còn ${stock}`
          : variant?.is_active === false
          ? 'Ngừng kinh doanh'
          : null,
    };
  });

  const hasUnavailableItems = itemsWithStockError.some((i) => !i.isAvailable);

  const subtotal = items.reduce((sum, item) => {
    const price = item.effective_price || item.variant?.effective_price || item.variant?.product?.base_price || 0;
    return sum + price * item.quantity;
  }, 0);

  const finalTotal = Math.max(0, subtotal - discountAmount);

  const formattedSubtotal = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(subtotal);

  const formattedDiscount = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(discountAmount);

  const formattedTotal = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(finalTotal);

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-line gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink flex items-center gap-3">
              <ShoppingBag className="w-7 h-7 text-accent" /> Giỏ Hàng Của Bạn
            </h1>
            <p className="text-ink-soft text-xs font-mono mt-1">
              {items.length} sản phẩm trong giỏ hàng
            </p>
          </div>
          <Link to="/products" className="font-mono text-xs text-accent hover:underline flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Tiếp tục chọn thêm sản phẩm
          </Link>
        </div>

        {!getAuthToken() ? (
          <EmptyState
            title="Yêu cầu đăng nhập"
            description="Vui lòng đăng nhập tài khoản để xem và quản lý danh sách sản phẩm trong giỏ hàng của bạn."
            actionLabel="Đăng nhập ngay"
            onAction={() => navigate('/login', { state: { from: '/cart' } })}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Giỏ hàng của bạn đang trống"
            description="Chưa có sản phẩm nào trong giỏ. Hãy khám phá bộ sưu tập mới nhất từ MenWear Hub."
            actionLabel="Khám phá bộ sưu tập"
            onAction={() => navigate('/products')}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cart Items Column */}
            <div className="lg:col-span-8 space-y-4">
              {/* Warning Banner if inventory issue exists */}
              {hasUnavailableItems && (
                <div className="bg-coral/10 border border-coral/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-ink font-sans">
                  <AlertTriangle className="w-5 h-5 text-coral shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold text-coral block mb-0.5">Phát hiện sản phẩm không đủ tồn kho!</strong>
                    Có sản phẩm trong giỏ hàng đã hết hàng hoặc không khả dụng. Vui lòng điều chỉnh hoặc xóa trước khi tiến hành thanh toán.
                  </div>
                </div>
              )}

              {itemsWithStockError.map((item) => {
                const variant = item.variant;
                const product = variant?.product;
                const image =
                  product?.images && product.images.length > 0
                    ? product.images[0].url
                    : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80';

                const price = item.effective_price || variant?.effective_price || product?.base_price || 0;
                const formattedItemPrice = new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(price);

                return (
                  <div
                    key={item.id}
                    className={`bg-card border rounded-2xl p-4 sm:p-5 transition flex flex-col sm:flex-row items-center gap-5 ${
                      !item.isAvailable ? 'border-coral/50 bg-coral/5' : 'border-line shadow-xs'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-24 bg-bg-alt border border-line rounded-xl overflow-hidden shrink-0 relative">
                      <img src={image} alt={product?.name} className="w-full h-full object-cover" />
                      {!item.isAvailable && (
                        <div className="absolute inset-0 bg-ink/30 backdrop-blur-xs flex items-center justify-center">
                          <PromoBadge type="out">Hết</PromoBadge>
                        </div>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
                      <Link
                        to={`/products/${product?.id || product?.slug}`}
                        className="font-display font-medium text-base text-ink hover:text-accent transition-colors truncate block"
                      >
                        {product?.name || 'Sản phẩm'}
                      </Link>
                      <div className="text-xs font-mono text-ink-soft flex flex-wrap gap-3 justify-center sm:justify-start">
                        <span>Size: <strong className="text-ink">{variant?.size?.code || variant?.size?.name || '-'}</strong></span>
                        <span>Màu: <strong className="text-ink">{variant?.color?.name || '-'}</strong></span>
                      </div>

                      {/* Inventory Error Badge */}
                      {!item.isAvailable && (
                        <span className="inline-block mt-1 font-mono text-[11px] font-medium text-coral bg-coral/10 border border-coral/30 px-2.5 py-0.5 rounded-full">
                          ⚠️ {item.errorReason}
                        </span>
                      )}
                    </div>

                    {/* Price & Quantity Controls */}
                    <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end w-full sm:w-auto mt-2 sm:mt-0">
                      <div className="font-mono text-base font-bold text-accent">{formattedItemPrice}</div>

                      {/* QtyStepper */}
                      <QtyStepper
                        value={item.quantity}
                        onChange={(val) => handleUpdateQuantity(item.id, val)}
                        min={1}
                        max={item.stock > 0 ? item.stock : 1}
                        disabled={updateQuantityMutation.isPending}
                      />

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-ink-soft hover:text-coral transition-colors rounded-lg hover:bg-coral/10"
                        title="Xóa khỏi giỏ hàng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Card (Sticky) */}
            <div className="lg:col-span-4">
              <div className="bg-bg-alt border border-line rounded-3xl p-6 sticky top-24 space-y-6 shadow-xs">
                <h3 className="font-display text-lg font-bold text-ink pb-3 border-b border-line">
                  Tóm Tắt Đơn Hàng
                </h3>

                {/* Subtotal & Details */}
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between text-ink-soft">
                    <span>Tạm tính:</span>
                    <span className="font-semibold text-ink">{formattedSubtotal}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-coral font-medium">
                      <span>Giảm giá ({appliedCode}):</span>
                      <span>-{formattedDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-ink-soft">
                    <span>Phí vận chuyển:</span>
                    <span className="text-ok font-medium">Miễn phí</span>
                  </div>
                </div>

                {/* Promo Code Form */}
                <div className="pt-3 border-t border-line space-y-2">
                  <label className="font-display font-medium text-xs text-ink block">Mã giảm giá / Voucher</label>
                  <form onSubmit={handleApplyPromoCode} className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Nhập mã giảm giá..."
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        className="w-full bg-card border border-line rounded-xl px-3.5 py-2 text-xs font-mono text-ink uppercase focus:outline-none focus:border-accent"
                      />
                      <Tag className="w-3.5 h-3.5 text-ink-soft absolute right-3 top-3" />
                    </div>
                    <button
                      type="submit"
                      disabled={promoLoading || !promoCode.trim()}
                      className="px-4 py-2 bg-ink text-white rounded-xl font-sans text-xs font-semibold hover:bg-accent disabled:opacity-50 transition-colors"
                    >
                      {promoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Áp dụng'}
                    </button>
                  </form>

                  {/* Errors / Success feedback */}
                  {promoError && (
                    <p className="text-[11px] font-mono text-coral mt-1.5 flex items-center gap-1">
                      ⚠️ {promoError}
                    </p>
                  )}
                  {appliedCode && !promoError && (
                    <p className="text-[11px] font-mono text-ok mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã áp dụng mã {appliedCode} thành công!
                    </p>
                  )}
                </div>

                {/* Total */}
                <div className="pt-4 border-t border-line flex justify-between items-baseline font-mono">
                  <span className="font-display font-bold text-base text-ink">Tổng tiền:</span>
                  <span className="text-2xl font-bold text-accent tracking-tight">{formattedTotal}</span>
                </div>

                {/* Checkout Button */}
                <button
                  type="button"
                  disabled={hasUnavailableItems || items.length === 0}
                  onClick={() => {
                    const token = getAuthToken();
                    if (!token) {
                      navigate('/login?redirect=/checkout', { state: { from: '/checkout' } });
                    } else {
                      navigate('/checkout');
                    }
                  }}
                  className={`w-full py-4 rounded-full font-sans text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
                    !hasUnavailableItems && items.length > 0
                      ? 'bg-accent hover:bg-accent-dark text-white'
                      : 'bg-card text-ink-soft/40 border border-line cursor-not-allowed'
                  }`}
                >
                  Tiến hành thanh toán <ArrowRight className="w-4 h-4" />
                </button>

                {hasUnavailableItems && (
                  <p className="text-[11px] font-mono text-coral text-center">
                    Vui lòng sửa/xóa các sản phẩm bị lỗi tồn kho để tiếp tục đặt hàng.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
