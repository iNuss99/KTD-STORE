import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Package, MapPin, ArrowRight, ShoppingBag, Loader2, Clock, Truck } from 'lucide-react';
import { Order } from '../../types';
import { formatDateTime } from '../../lib/date-utils';
import { apiClient } from '../../lib/apiClient';

export const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      navigate('/products');
      return;
    }

    const fetchOrder = async () => {
      try {
        const data = await apiClient<Order>(`/api/orders/${orderId}`);
        setOrder(data);
      } catch (err: any) {
        setError(err.message || 'Không thể tải thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-white flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <Loader2 className="w-8 h-8 text-stitch animate-spin" />
          <span className="font-mono text-xs text-smoke">Đang tạo xác nhận đơn hàng...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-warm-white flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-canvas border border-chalk p-8 max-w-md w-full text-center space-y-4">
            <h2 className="font-serif text-xl text-ink">Đã Xác Nhận Đặt Hàng</h2>
            <p className="font-mono text-xs text-smoke">
              Mã đơn hàng: <strong className="text-ink">#{orderId?.slice(0, 8).toUpperCase()}</strong>
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <Link
                to="/my-orders"
                className="px-6 py-3 bg-ink hover:bg-accent text-white font-mono text-xs uppercase tracking-wider transition-colors"
              >
                Xem đơn hàng của tôi
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formattedTotal = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(order.total || 0);

  const formattedDate = formatDateTime(order.created_at);

  const payment = order.payments?.[0];

  return (
    <div className="min-h-screen bg-warm-white flex flex-col font-sans">

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-8">
        <div className="bg-canvas border border-chalk p-6 sm:p-12 text-center space-y-6">
          {/* Header Icon */}
          <div className="w-16 h-16 bg-warm-white border border-stitch text-stitch rounded-full flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="font-serif italic text-stitch text-sm block">Đã xác nhận thanh toán & giao dịch</span>
            <h1 className="font-serif text-3xl sm:text-4xl text-ink font-normal tracking-tight">Cảm Ơn Bạn Đã Đặt Hàng</h1>
            <p className="font-mono text-xs text-smoke max-w-md mx-auto">
              Đơn hàng <strong className="text-ink font-bold">#{order.id.slice(0, 8).toUpperCase()}</strong> của bạn đã được ghi nhận và đưa vào quy trình đóng gói.
            </p>
          </div>

          <div className="border-t border-chalk pt-6 text-left space-y-6">
            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div className="bg-warm-white p-4 border border-chalk space-y-1">
                <div className="text-smoke flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-stitch" /> Khởi tạo đơn hàng
                </div>
                <div className="font-semibold text-ink text-xs">{formattedDate}</div>
              </div>

              <div className="bg-warm-white p-4 border border-chalk space-y-1">
                <div className="text-smoke flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <Truck className="w-3.5 h-3.5 text-stitch" /> Thanh toán & Vận chuyển
                </div>
                <div className="font-semibold text-ink text-xs">
                  {payment?.method === 'COD' ? 'Thanh toán COD' : payment?.method || 'Chuyển khoản'} (Miễn phí VC)
                </div>
              </div>
            </div>

            {/* Shipping Receiver Snapshot */}
            <div className="bg-warm-white p-5 border border-chalk space-y-1.5 text-xs">
              <div className="font-serif text-sm text-ink flex items-center gap-2 mb-2 pb-2 border-b border-chalk">
                <MapPin className="w-4 h-4 text-stitch" /> Địa Chỉ Nhận Hàng
              </div>
              <div className="font-mono text-steel">Người nhận: <strong className="text-ink">{order.shipping_snapshot?.receiver_name}</strong></div>
              <div className="font-mono text-steel">Điện thoại: <span className="font-bold">{order.shipping_snapshot?.phone}</span></div>
              <div className="font-sans text-steel leading-relaxed">
                {order.shipping_snapshot?.address_line}, {order.shipping_snapshot?.ward ? `${order.shipping_snapshot.ward}, ` : ''}{order.shipping_snapshot?.district ? `${order.shipping_snapshot.district}, ` : ''}{order.shipping_snapshot?.province}
              </div>
            </div>

            {/* Ordered Items List */}
            <div className="space-y-3">
              <h3 className="font-serif text-sm text-ink flex items-center gap-2">
                <Package className="w-4 h-4 text-stitch" /> Danh Sách Sản Phẩm trong Đơn ({order.items?.length || 0})
              </h3>
              <div className="divide-y divide-chalk border border-chalk bg-warm-white max-h-52 overflow-y-auto px-4">
                {order.items?.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between font-mono text-xs">
                    <div>
                      <div className="font-serif text-xs text-ink">{item.product_name}</div>
                      <div className="text-smoke text-[10px] mt-0.5">
                        {item.size_name} / {item.color_name} × {item.quantity}
                      </div>
                    </div>
                    <div className="font-semibold text-ink">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-chalk flex items-baseline justify-between font-mono">
              <span className="font-serif text-base text-ink">Tổng thanh toán:</span>
              <span className="text-2xl font-bold text-ink stitch-underline">{formattedTotal}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3 justify-center">
            <Link
              to={`/orders/${order.id}`}
              className="w-full sm:w-auto px-6 py-3.5 bg-ink hover:bg-accent text-white font-mono text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              Xem Chi Tiết Đơn Hàng <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/products"
              className="w-full sm:w-auto px-6 py-3.5 bg-warm-white hover:bg-canvas border border-chalk text-steel font-mono text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-smoke" /> Tiếp Tục Mua Sắm
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
