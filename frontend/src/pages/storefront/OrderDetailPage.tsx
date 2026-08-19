import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Order } from '../../types';
import { ArrowLeft, Package, MapPin, CreditCard, Clock, CheckCircle2, AlertCircle, Loader2, RotateCcw, Star } from 'lucide-react';
import { OrderStatusBadge } from '../../components/admin/OrderStatusBadge';
import { OrderTimeline } from '../../components/storefront/OrderTimeline';
import { OrderReviewModal } from '../../components/storefront/OrderReviewModal';
import { getSocket } from '../../lib/socketClient';

import { getAuthToken, getAuthHeader } from '../../lib/auth-storage';
import { useToast } from '../../context/ToastContext';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  // Return Request State
  const [returnRequest, setReturnRequest] = useState<any>(null);
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [returnReason, setReturnReason] = useState<string>('');
  const [submittingReturn, setSubmittingReturn] = useState<boolean>(false);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [selectedReviewItem, setSelectedReviewItem] = useState<{
    orderItemId: string;
    productId: string;
    productName: string;
    productImage?: string;
    variantInfo?: string;
  } | null>(null);
  const [userReviews, setUserReviews] = useState<any[]>([]);

  const fetchOrderDetail = async () => {
    try {
      const [orderRes, returnsRes, reviewsRes] = await Promise.all([
        fetch(`/api/orders/${id}`, { headers: getAuthHeader() }),
        fetch('/api/returns/my', { headers: getAuthHeader() }),
        fetch('/api/reviews/my', { headers: getAuthHeader() }),
      ]);

      if (orderRes.ok) {
        const data = await orderRes.json();
        setOrder(data);
      }

      if (returnsRes.ok) {
        const returnsData = await returnsRes.json();
        const activeReq = returnsData.find((r: any) => r.order_id === id);
        if (activeReq) {
          setReturnRequest(activeReq);
        }
      }

      if (reviewsRes.ok) {
        const revData = await reviewsRes.json();
        setUserReviews(Array.isArray(revData) ? revData : []);
      }
    } catch (err) {
      console.error('Error fetching order detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrderDetail();

    const token = getAuthToken();
    if (!token) return;

    // Join WebSocket room for real-time updates via centralized client (proxy-aware)
    const socket = getSocket(token);

    const handleOrderUpdated = (data: any) => {
      if (data?.orderId === id || data?.id === id) {
        fetchOrderDetail();
      }
    };

    const handleNotification = () => {
      fetchOrderDetail();
    };

    socket.on('order_updated', handleOrderUpdated);
    socket.on('notification', handleNotification);

    return () => {
      socket.off('order_updated', handleOrderUpdated);
      socket.off('notification', handleNotification);
    };
  }, [id]);

  const [reordering, setReordering] = useState(false);

  const handleReorder = async () => {
    if (!order?.items || order.items.length === 0) return;
    setReordering(true);
    try {
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
      showSuccess('Đã thêm vào giỏ hàng', 'Đã tải lại toàn bộ sản phẩm vào giỏ hàng của bạn.');
      navigate('/cart');
    } catch (err) {
      showError('Có lỗi xảy ra', 'Không thể thêm lại một số sản phẩm vào giỏ.');
    } finally {
      setReordering(false);
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !returnReason.trim()) return;

    setSubmittingReturn(true);
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          order_id: order.id,
          reason: returnReason.trim(),
        }),
      });

      if (res.ok) {
        showSuccess('Gửi yêu cầu thành công', 'Nhân viên sẽ hỗ trợ bạn xử lý đổi trả trong thời gian sớm nhất.');
        setShowReturnModal(false);
        setReturnReason('');
        await fetchOrderDetail();
      } else {
        const err = await res.json();
        showError('Không thể gửi yêu cầu', err.message || 'Có lỗi xảy ra khi gửi yêu cầu đổi trả');
      }
    } catch (err) {
      console.error('Error creating return request:', err);
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;

    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      if (res.ok) {
        const updated = await res.json();
        setOrder(updated);
        showSuccess('Đã hủy đơn hàng', 'Đơn hàng của bạn đã được hủy thành công.');
      } else {
        const errorData = await res.json();
        showError('Không thể hủy đơn hàng', errorData.message || 'Có lỗi xảy ra khi hủy đơn hàng');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-white flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <Loader2 className="w-8 h-8 text-stitch animate-spin" />
          <span className="font-mono text-xs text-smoke">Đang tải chi tiết đơn hàng...</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-warm-white flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <h2 className="font-serif text-2xl text-ink">Không tìm thấy đơn hàng</h2>
          <Link to="/my-orders" className="font-mono text-xs text-stitch hover:underline flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách đơn hàng của tôi
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(order.created_at).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedTotal = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(order.total || 0);

  const formattedSubtotal = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(order.subtotal || 0);

  const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED';
  const payment = order.payments && order.payments.length > 0 ? order.payments[0] : null;

  return (
    <div className="min-h-screen bg-warm-white flex flex-col font-sans">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <Link to="/my-orders" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-sky-600 mb-6 transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Danh sách đơn hàng
        </Link>

        {/* Header */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold text-slate-900">
                Đơn hàng #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Thời gian khởi tạo: {formattedDate}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={reordering}
              onClick={handleReorder}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              {reordering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              <span>Mua lại đơn này</span>
            </button>

            {canCancel && (
              <button
                disabled={cancelling}
                onClick={handleCancelOrder}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition flex items-center gap-1"
              >
                {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Hủy đơn hàng'}
              </button>
            )}

            {order.status === 'DELIVERED' && !returnRequest && (
              <button
                onClick={() => setShowReturnModal(true)}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-xl transition flex items-center gap-1"
              >
                Yêu cầu Đổi trả
              </button>
            )}
          </div>
        </div>

        {/* Order Visual Timeline */}
        <div className="mb-6">
          <OrderTimeline status={order.status} createdAt={order.created_at} />
        </div>

        {/* Active Return Request Banner */}
        {returnRequest && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 mb-6 flex items-start gap-3 text-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-900">
                Yêu cầu đổi trả ({returnRequest.status})
              </div>
              <p className="text-amber-800 mt-0.5">Lý do: "{returnRequest.reason}"</p>
              {returnRequest.rejection_reason && (
                <p className="text-red-700 font-bold mt-1">Lý do từ chối: {returnRequest.rejection_reason}</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-8 space-y-6">
            {/* Items */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-lg text-slate-900 pb-3 border-b border-gray-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-sky-600" /> Danh sách sản phẩm ({order.items?.length || 0})
              </h3>

              <div className="space-y-4">
                {order.items?.map((item) => {
                  const prodId = (item as any).variant?.product_id;
                  const existingReview = userReviews.find(
                    (r) => r.order_item_id === item.id || (prodId && r.product_id === prodId)
                  );

                  return (
                    <div key={item.id} className="py-3 border-b border-gray-50 last:border-0">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{item.product_name}</div>
                          <div className="text-xs text-gray-500 mt-0.5 space-x-2">
                            <span>Size: <strong className="text-slate-800">{item.size_name}</strong></span>
                            <span>Màu: <strong className="text-slate-800">{item.color_name}</strong></span>
                            <span className="font-mono text-gray-400">SKU: {item.sku}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-slate-900 text-sm">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)} × {item.quantity}
                          </div>
                          <div className="font-extrabold text-sky-600 text-sm mt-0.5">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>

                      {/* Review Button for Delivered Orders */}
                      {order.status === 'DELIVERED' && (
                        <div className="mt-2 flex items-center justify-end gap-2 pt-2 border-t border-slate-100/60">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReviewItem({
                                orderItemId: item.id,
                                productId: prodId,
                                productName: item.product_name,
                                variantInfo: `Size: ${item.size_name} | Màu: ${item.color_name}`,
                              });
                              setShowReviewModal(true);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs ${
                              existingReview
                                ? 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                                : 'bg-slate-900 text-white hover:bg-amber-600'
                            }`}
                          >
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span>
                              {existingReview ? `Đã đánh giá (${existingReview.rating}⭐) - Sửa` : 'Đánh giá sản phẩm'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shipping Snapshot */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
              <h3 className="font-extrabold text-lg text-slate-900 pb-3 border-b border-gray-100 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-sky-600" /> Thông tin nhận hàng (Snapshot)
              </h3>

              <div className="text-sm space-y-1 text-gray-700">
                <div>Người nhận: <strong className="text-slate-900">{order.shipping_snapshot?.receiver_name}</strong></div>
                <div>Số điện thoại: <strong className="text-slate-900">{order.shipping_snapshot?.phone}</strong></div>
                <div>
                  Địa chỉ giao: <span className="text-gray-600">
                    {order.shipping_snapshot?.address_line}, {order.shipping_snapshot?.ward ? `${order.shipping_snapshot.ward}, ` : ''}{order.shipping_snapshot?.district ? `${order.shipping_snapshot.district}, ` : ''}{order.shipping_snapshot?.province}
                  </span>
                </div>
                {order.note && (
                  <div className="pt-2 text-xs italic text-gray-500">
                    Ghi chú: "{order.note}"
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-lg text-slate-900 pb-3 border-b border-gray-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-sky-600" /> Thanh toán
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Phương thức:</span>
                  <span className="font-bold text-slate-900">{payment?.method === 'COD' ? 'Thanh toán COD' : 'Chuyển khoản'}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Trạng thái thanh toán:</span>
                  <span className={`font-bold ${payment?.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {payment?.status === 'COMPLETED' ? 'Đã thanh toán' : 'Chờ xác nhận'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính:</span>
                  <span className="font-bold text-slate-900">{formattedSubtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Vận chuyển:</span>
                  <span className="font-bold text-emerald-600">Miễn phí</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
                <span className="font-extrabold text-slate-900 text-sm">Tổng cộng:</span>
                <span className="font-extrabold text-2xl text-sky-600">{formattedTotal}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Return Request Modal */}
        {showReturnModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 font-sans">
              <h3 className="text-lg font-bold text-slate-900">Yêu cầu Đổi trả / Hoàn tiền</h3>
              <p className="text-xs text-gray-500">
                Đơn hàng được chấp nhận đổi trả trong vòng 7 ngày kể từ khi nhận hàng. Vui lòng ghi rõ lý do.
              </p>
              <form onSubmit={handleCreateReturn} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lý do đổi trả (*):</label>
                  <textarea
                    required
                    placeholder="Ví dụ: Sản phẩm bị lỗi chỉ, sai size, không vừa..."
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-600"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReturnModal(false)}
                    className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReturn || !returnReason.trim()}
                    className="px-5 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition shadow-md flex items-center gap-1 disabled:opacity-40"
                  >
                    {submittingReturn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gửi yêu cầu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Product Review Modal */}
        {selectedReviewItem && (
          <OrderReviewModal
            isOpen={showReviewModal}
            onClose={() => {
              setShowReviewModal(false);
              setSelectedReviewItem(null);
            }}
            productId={selectedReviewItem.productId}
            orderItemId={selectedReviewItem.orderItemId}
            productName={selectedReviewItem.productName}
            productImage={selectedReviewItem.productImage}
            variantInfo={selectedReviewItem.variantInfo}
            onReviewSubmitted={() => {
              fetchOrderDetail();
              showSuccess('Đánh giá thành công', 'Cảm ơn bạn đã chia sẻ đánh giá sản phẩm!');
            }}
          />
        )}
      </main>
    </div>
  );
};
