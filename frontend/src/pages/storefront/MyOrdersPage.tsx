import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, Clock, Loader2 } from 'lucide-react';
import { useMyOrders } from '../../hooks/useOrders';
import { formatDateTime } from '../../lib/date-utils';
import { OrderStatusBadge } from '../../components/admin/OrderStatusBadge';

export const MyOrdersPage: React.FC = () => {
  const { data: orders = [], isLoading: loading } = useMyOrders();

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

              return (
                <div
                  key={order.id}
                  className="bg-canvas border border-chalk p-5 transition hover:border-steel/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-ink text-xs">
                        ĐƠN HÀNG #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="text-smoke flex items-center gap-1.5 text-[11px]">
                      <Clock className="w-3 h-3 text-stitch" /> Ngày đặt: {formattedDate}
                    </div>
                    <div className="text-steel font-sans text-xs">
                      Người nhận: <strong className="text-ink">{order.shipping_snapshot?.receiver_name}</strong> ({order.shipping_snapshot?.phone})
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-chalk">
                    <div className="text-left sm:text-right font-mono">
                      <div className="text-[10px] text-smoke uppercase">Tổng thanh toán ({order.items?.length || 0} sản phẩm)</div>
                      <div className="font-bold text-ink text-base stitch-underline">{formattedTotal}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!order.items || order.items.length === 0) return;
                          for (const item of order.items) {
                            if (item.variant_id) {
                              await fetch('/api/cart/items', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${localStorage.getItem('token')}`,
                                },
                                body: JSON.stringify({
                                  variant_id: item.variant_id,
                                  quantity: item.quantity || 1,
                                }),
                              });
                            }
                          }
                          window.location.href = '/cart';
                        }}
                        className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition"
                      >
                        Mua lại
                      </button>

                      <Link
                        to={`/orders/${order.id}`}
                        className="px-4 py-2 bg-ink hover:bg-accent text-white font-sans text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
                      >
                        Chi tiết <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
