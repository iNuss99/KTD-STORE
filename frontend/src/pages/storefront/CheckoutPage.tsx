import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SandboxPaymentModal } from '../../components/storefront/SandboxPaymentModal';
import { useLanguage } from '../../context/LanguageContext';
import { Address } from '../../types';
import { MapPin, Plus, Check, CreditCard, Truck, ArrowLeft, Loader2, QrCode, Wallet, CheckCircle2, ChevronRight, ShieldCheck, Tag, Building, Home } from 'lucide-react';
import { AddressSelector } from '../../components/storefront/AddressSelector';
import { useCart } from '../../hooks/useCart';
import { useCreateOrderMutation } from '../../hooks/useOrders';
import { apiClient } from '../../lib/apiClient';
import { getAuthHeader, getAuthToken } from '../../lib/auth-storage';
import { CartItem } from '../../types';
import { useToast } from '../../context/ToastContext';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const queryClient = useQueryClient();
  const { formatPrice, t } = useLanguage();
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'VNPAY'>('COD');
  const [note, setNote] = useState<string>('');

  // TanStack Query Hooks
  const { data: cart, isLoading: loadingCart } = useCart();
  const createOrderMutation = useCreateOrderMutation();

  const { data: addresses = [], isLoading: loadingAddresses } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await fetch('/api/addresses', { headers: getAuthHeader() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const loading = loadingCart || loadingAddresses;

  // Sandbox Payment Modal State
  const [activeSandboxOrder, setActiveSandboxOrder] = useState<{ id: string; total: number; method: 'VNPAY' } | null>(null);

  // Discount State
  const [discountCode, setDiscountCode] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; discount_amount: number } | null>(null);
  const [discountLoading, setDiscountLoading] = useState<boolean>(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  // New Address Form Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newReceiverName, setNewReceiverName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newAddressLine, setNewAddressLine] = useState<string>('');
  const [newWard, setNewWard] = useState<string>('');
  const [newDistrict, setNewDistrict] = useState<string>('');
  const [newProvince, setNewProvince] = useState<string>('');

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login?redirect=/checkout', { replace: true, state: { from: '/checkout' } });
    }
  }, [navigate]);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else {
        setSelectedAddressId(addresses[0].id);
      }
    }
  }, [addresses, selectedAddressId]);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setDiscountLoading(true);
    setDiscountError(null);
    try {
      const items = cart?.items || [];
      const res = await fetch('/api/discounts/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: discountCode.trim(),
          items: items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAppliedDiscount(data);
      } else {
        const err = await res.json();
        setDiscountError(err.message || 'Mã giảm giá không hợp lệ');
        setAppliedDiscount(null);
      }
    } catch (err) {
      setDiscountError('Không thể kết nối đến máy chủ');
      setAppliedDiscount(null);
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          receiver_name: newReceiverName,
          phone: newPhone,
          address_line: newAddressLine,
          ward: newWard,
          district: newDistrict,
          province: newProvince,
          is_default: addresses.length === 0,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        queryClient.invalidateQueries({ queryKey: ['addresses'] });
        setSelectedAddressId(created.id);
        setShowAddModal(false);
        setNewReceiverName('');
        setNewPhone('');
        setNewAddressLine('');
        setNewWard('');
        setNewDistrict('');
        setNewProvince('');
      }
    } catch (err) {
      console.error('Error adding address:', err);
    }
  };

  const handlePlaceOrder = () => {
    if (!selectedAddressId) {
      showWarning('Vui lòng chọn địa chỉ', 'Bạn chưa chọn địa chỉ nhận hàng.');
      return;
    }

    createOrderMutation.mutate(
      {
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        note,
        discount_code: appliedDiscount?.code,
      },
      {
        onSuccess: (order: any) => {
          if (paymentMethod === 'VNPAY') {
            setActiveSandboxOrder({
              id: order.id,
              total: Number(order.total),
              method: paymentMethod,
            });
          } else {
            showSuccess('Đặt hàng thành công!', 'Cảm ơn bạn đã mua sắm tại Knot To Detail.');
            navigate(`/order-success/${order.id}`);
          }
        },
        onError: (err: any) => {
          showError('Không thể đặt hàng', err.message || 'Có lỗi xảy ra khi tạo đơn hàng');
        },
      },
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-white flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <Loader2 className="w-8 h-8 text-stitch animate-spin" />
          <span className="font-mono text-xs text-smoke">Đang tải thông tin thanh toán...</span>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, i) => sum + (i.effective_price || 0) * i.quantity, 0);

  return (
    <div className="min-h-screen bg-warm-white flex flex-col font-sans">

      {activeSandboxOrder && (
        <SandboxPaymentModal
          orderId={activeSandboxOrder.id}
          totalAmount={activeSandboxOrder.total}
          paymentMethod={activeSandboxOrder.method}
          onSuccess={() => {
            showSuccess('Thanh toán thành công!', 'Đơn hàng của bạn đã chuyển sang trạng thái Đang xử lý (PROCESSING).');
            navigate(`/orders/${activeSandboxOrder.id}`);
          }}
          onCancel={() => {
            showInfo('Đã hủy thanh toán', 'Bạn đã chọn hủy thanh toán đơn hàng này.');
            navigate(`/orders/${activeSandboxOrder.id}`);
          }}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        <Link to="/cart" className="inline-flex items-center gap-2 font-mono text-xs text-smoke hover:text-ink transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> QUAY LẠI GIỎ HÀNG
        </Link>

        <h1 className="font-serif text-2xl sm:text-3xl text-ink font-normal">{t('checkout.title')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Form Area */}
          <div className="lg:col-span-8 space-y-6">
            {/* Address Selection */}
            <div className="bg-canvas border border-chalk p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-chalk">
                <h3 className="font-serif text-lg text-ink flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-stitch" /> Địa Chỉ Giao Hàng
                </h3>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="font-mono text-xs text-stitch hover:underline flex items-center gap-1 bg-warm-white border border-chalk px-3 py-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm địa chỉ mới
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-6 text-smoke font-mono text-xs">
                  Bạn chưa có địa chỉ giao hàng nào. Vui lòng thêm địa chỉ mới để tiếp tục.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 border cursor-pointer transition-all relative ${
                        selectedAddressId === addr.id
                          ? 'border-stitch bg-warm-white shadow-xs'
                          : 'border-chalk hover:border-steel bg-warm-white/50'
                      }`}
                    >
                      {selectedAddressId === addr.id && (
                        <div className="absolute top-3 right-3 w-4 h-4 bg-stitch text-warm-white rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      <div className="font-serif text-sm text-ink font-medium">{addr.receiver_name}</div>
                      <div className="font-mono text-xs text-smoke mt-0.5">{addr.phone}</div>
                      <div className="font-sans text-xs text-steel mt-2 line-clamp-2 leading-relaxed">
                        {addr.address_line}, {addr.ward ? `${addr.ward}, ` : ''}{addr.district ? `${addr.district}, ` : ''}{addr.province}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-canvas border border-chalk p-6 space-y-4">
              <h3 className="font-serif text-lg text-ink pb-3 border-b border-chalk flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-stitch" /> {t('checkout.payment_method')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-4 border cursor-pointer transition-all flex items-center gap-3 ${
                    paymentMethod === 'COD' ? 'border-stitch bg-warm-white' : 'border-chalk bg-warm-white/50'
                  }`}
                >
                  <div className="w-9 h-9 bg-ink text-warm-white flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-serif text-sm text-ink">{t('payment.cod')}</div>
                    <div className="font-mono text-[11px] text-smoke">Thanh toán tiền mặt khi nhận hàng</div>
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod('VNPAY')}
                  className={`p-4 border cursor-pointer transition-all flex items-center gap-3 ${
                    paymentMethod === 'VNPAY' ? 'border-stitch bg-warm-white' : 'border-chalk bg-warm-white/50'
                  }`}
                >
                  <div className="w-9 h-9 bg-ink text-warm-white flex items-center justify-center shrink-0">
                    <QrCode className="w-4 h-4 text-stitch" />
                  </div>
                  <div>
                    <div className="font-serif text-sm text-ink">{t('payment.vnpay')}</div>
                    <div className="font-mono text-[11px] text-smoke">Thanh toán VNPAY QR Sandbox</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="bg-canvas border border-chalk p-6 space-y-2">
              <label className="font-serif text-sm text-ink block">Ghi chú đơn hàng (tùy chọn)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
                className="w-full p-3 bg-warm-white border border-chalk font-mono text-xs text-ink placeholder-smoke focus:outline-none focus:border-stitch"
                rows={3}
              />
            </div>
          </div>

          {/* Right Summary */}
          <div className="lg:col-span-4">
            <div className="bg-canvas border border-chalk p-6 sticky top-24 space-y-5">
              <h3 className="font-serif text-lg text-ink pb-3 border-b border-chalk">
                Sản Phẩm Đặt Mua ({items.length})
              </h3>

              <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-xs">
                    <div className="w-10 h-12 bg-warm-white border border-chalk shrink-0 overflow-hidden">
                      <img
                        src={item.variant?.product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'}
                        alt={item.variant?.product?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-serif text-xs text-ink truncate">{item.variant?.product?.name}</div>
                      <div className="font-mono text-[10px] text-smoke">{item.variant?.size?.code || item.variant?.size?.name} / {item.variant?.color?.name} × {item.quantity}</div>
                    </div>
                    <div className="font-mono text-xs font-semibold text-ink">
                      {formatPrice((item.effective_price || 0) * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-chalk space-y-2 font-mono text-xs">
                <div className="flex justify-between text-smoke">
                  <span>Tạm tính:</span>
                  <span className="font-semibold text-ink">{formatPrice(subtotal)}</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between text-stitch font-medium">
                    <span>Giảm giá ({appliedDiscount.code}):</span>
                    <span>-{formatPrice(appliedDiscount.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-smoke">
                  <span>Vận chuyển:</span>
                  <span className="text-stitch font-medium">Miễn phí</span>
                </div>
              </div>

              {/* Coupon Box */}
              <div className="pt-3 border-t border-chalk space-y-2">
                <label className="font-mono text-xs text-smoke uppercase tracking-wider block">Mã khuyến mãi</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập mã..."
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 bg-warm-white border border-chalk font-mono text-xs uppercase text-ink focus:outline-none focus:border-stitch"
                  />
                  <button
                    disabled={discountLoading || !discountCode.trim()}
                    onClick={handleApplyDiscount}
                    className="px-4 py-2 bg-ink hover:bg-stitch text-warm-white font-mono text-xs uppercase tracking-wider transition-colors disabled:opacity-40"
                  >
                    {discountLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Áp dụng'}
                  </button>
                </div>
                {discountError && <p className="font-mono text-[11px] text-rose-600">{discountError}</p>}
                {appliedDiscount && (
                  <p className="font-mono text-[11px] text-stitch">
                    ✓ Đã áp dụng mã thành công! (-{formatPrice(appliedDiscount.discount_amount)})
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-chalk flex justify-between items-baseline font-mono">
                <span className="font-serif text-sm text-ink">Tổng thanh toán:</span>
                <span className="text-xl font-bold text-ink tracking-tight">
                  {formatPrice(Math.max(0, subtotal - (appliedDiscount?.discount_amount || 0)))}
                </span>
              </div>

              <button
                disabled={!cart?.items || cart.items.length === 0 || !selectedAddressId || createOrderMutation.isPending}
                onClick={handlePlaceOrder}
                className={`w-full py-4 font-mono text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-colors ${
                  cart?.items && cart.items.length > 0 && selectedAddressId
                    ? 'bg-ink hover:bg-stitch text-warm-white shadow-xs'
                    : 'bg-chalk text-smoke/50 cursor-not-allowed'
                }`}
              >
                {createOrderMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Xác nhận Đặt hàng ({formatPrice(Math.max(0, subtotal - (appliedDiscount?.discount_amount || 0)))})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Add Address Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-line rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 font-sans animate-fade-in">
              <h3 className="font-display font-bold text-lg text-ink">Thêm địa chỉ giao hàng mới</h3>
              <form onSubmit={handleAddAddress} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1.5">Tên người nhận <span className="text-coral">*</span></label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Nguyễn Văn A"
                      required
                      value={newReceiverName}
                      onChange={(e) => setNewReceiverName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-card border border-line rounded-xl text-xs text-ink placeholder-ink-soft focus:outline-none focus:border-accent shadow-2xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1.5">Số điện thoại <span className="text-coral">*</span></label>
                    <input
                      type="tel"
                      placeholder="Ví dụ: 0912345678"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3 py-2.5 bg-card border border-line rounded-xl text-xs text-ink placeholder-ink-soft focus:outline-none focus:border-accent shadow-2xs font-medium"
                    />
                  </div>
                </div>

                <AddressSelector
                  province={newProvince}
                  district={newDistrict}
                  ward={newWard}
                  addressLine={newAddressLine}
                  onChange={(addr) => {
                    setNewProvince(addr.province);
                    setNewDistrict(addr.district);
                    setNewWard(addr.ward);
                    setNewAddressLine(addr.addressLine);
                  }}
                />

                <div className="flex justify-end gap-2 pt-2 border-t border-line">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-line text-ink-soft hover:text-ink rounded-xl text-xs font-semibold transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-ink hover:bg-accent text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
                  >
                    Lưu địa chỉ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
