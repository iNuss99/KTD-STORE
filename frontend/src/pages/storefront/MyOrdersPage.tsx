import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, Clock, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useMyOrders } from '../../hooks/useOrders';
import { formatDateTime } from '../../lib/date-utils';
import { OrderStatusBadge } from '../../components/admin/OrderStatusBadge';
import { CancelOrderModal } from '../../components/storefront/CancelOrderModal';
import { getAuthHeader, getAuthToken } from '../../lib/auth-storage';
import { getSocket } from '../../lib/socketClient';
import { Order } from '../../types';

export const MyOrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading: loading } = useMyOrders();
  const [selectedCancelOrder, setSelectedCancelOrder] = useState<Order | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    const socket = getSocket(token);

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'my'] });
    };

    socket.on('order_updated', handleUpdate);
    socket.on('notification', handleUpdate);

    return () => {
      socket.off('order_updated', handleUpdate);
      socket.off('notification', handleUpdate);
    };
  }, [queryClient]);

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-white flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <Loader2 className="w-8 h-8 text-stitch animate-spin" />
          <span className="font-mono text-xs text-smoke">Đang tải danh sách đơn hàng...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-white flex flex-col font-sans">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-chalk">
          <h1 className="font-serif text-2xl sm:text-3xl text-ink font-normal flex items-center gap-3">
            <Package className="w-6 h-6 text-stitch" /> Đơn Hàng Của Tôi
            <span className="font-mono text-xs text-smoke">({orders.length} đơn)</span>
          </h1>
        </div>

        {orders.length === 0 ? (
          <div className="bg-canvas border border-chalk p-12 text-center max-w-lg mx-auto my-12 space-y-4">
            <div className="w-12 h-12 bg-warm-white border border-chalk text-stitch rounded-full flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl text-ink">Chưa có lịch sử mua hàng</h3>
            <p className="font-mono text-xs text-smoke">
              Hãy khám phá bộ sưu tập và chọn cho mình những sản phẩm yêu thích ngay hôm nay.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-ink hover:bg-accent text-white font-mono text-xs uppercase tracking-widest transition-colors shadow-xs"
            >
              Khám phá bộ sưu tập sản phẩm
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const formattedDate = formatDateTime(order.created_at);

              const formattedTotal = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(order.total || 0);

              const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED';

              const handleReorder = async () => {
                if (!order.items || order.items.length === 0) return;
                for (const item of order.items) {
                  if (item.variant_id) {
                    await fetch('/api/cart/items', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeader(),
                      },
                      body: JSON.stringify({
                        variant_id: item.variant_id,
                        quantity: item.quantity || 1,
                      }),
                    });
                  }
                }
                window.location.href = '/cart';
              };

              return (
                <div
                  key={order.id}
                  className="bg-white border border-chalk rounded-2xl shadow-xs overflow-hidden transition-all hover:border-accent/40 hover:shadow-sm"
                >
                  {/* MOBILE & TABLET PORTRAIT CARD VIEW (< md) */}
                  <div className="md:hidden p-4 space-y-3.5">
                    {/* Card Header: Order ID + Status */}
                    <div className="flex items-center justify-between gap-2 border-b border-chalk pb-2.5">
                      <span className="font-mono font-bold text-ink text-xs tracking-wider">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    {/* Card Body: Info */}
                    <div className="space-y-1.5 font-sans text-xs">
                      <div className="text-smoke flex items-center gap-1.5 text-[11px] font-mono">
                        <Clock className="w-3.5 h-3.5 text-stitch shrink-0" />
                        <span>{formattedDate}</span>
                      </div>
                      <div className="text-steel">
                        Người nhận:{' '}
                        <strong className="text-ink font-semibold">
                          {order.shipping_snapshot?.receiver_name || 'Khách hàng'}
                        </strong>
                        {order.shipping_snapshot?.phone && (
                          <span className="text-smoke font-mono"> ({order.shipping_snapshot.phone})</span>
                        )}
                      </div>
                    </div>

                    {/* Card Footer: Total Amount + Actions */}
                    <div className="pt-2.5 border-t border-chalk flex flex-col gap-3">
                      <div className="flex items-baseline justify-between font-mono">
                        <span className="text-[11px] text-smoke uppercase tracking-wider">
                          Tổng ({order.items?.length || 0} món):
                        </span>
                        <span className="font-bold text-ink text-base">
                          {formattedTotal}
                        </span>
                      </div>

                      <div className={`grid ${canCancel ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => setSelectedCancelOrder(order)}
                            className="min-h-[44px] px-2 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition flex items-center justify-center cursor-pointer"
                          >
                            Hủy đơn
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleReorder}
                          className="min-h-[44px] px-2 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition flex items-center justify-center cursor-pointer"
                        >
                          Mua lại
                        </button>

                        <Link
                          to={`/orders/${order.id}`}
                          className="min-h-[44px] px-2 py-2 bg-ink hover:bg-accent text-white font-sans text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          Chi tiết <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* DESKTOP & TABLET LANDSCAPE VIEW (≥ md) */}
                  <div className="hidden md:flex items-center justify-between p-5 gap-6">
                    <div className="space-y-1.5 font-mono text-xs flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-ink text-xs tracking-wider">
                          ĐƠN HÀNG #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <div className="text-smoke flex items-center gap-1.5 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-stitch" /> Ngày đặt: {formattedDate}
                      </div>
                      <div className="text-steel font-sans text-xs">
                        Người nhận:{' '}
                        <strong className="text-ink">
                          {order.shipping_snapshot?.receiver_name}
                        </strong>{' '}
                        ({order.shipping_snapshot?.phone})
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right font-mono">
                        <div className="text-[10px] text-smoke uppercase">
                          Tổng thanh toán ({order.items?.length || 0} sản phẩm)
                        </div>
                        <div className="font-bold text-ink text-base stitch-underline">
                          {formattedTotal}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => setSelectedCancelOrder(order)}
                            className="min-h-[40px] px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition cursor-pointer"
                          >
                            Hủy đơn
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleReorder}
                          className="min-h-[40px] px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                          Mua lại
                        </button>

                        <Link
                          to={`/orders/${order.id}`}
                          className="min-h-[40px] px-4 py-2 bg-ink hover:bg-accent text-white font-sans text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          Chi tiết <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <CancelOrderModal
          isOpen={!!selectedCancelOrder}
          order={selectedCancelOrder}
          onClose={() => setSelectedCancelOrder(null)}
        />
      </main>
    </div>
  );
};
