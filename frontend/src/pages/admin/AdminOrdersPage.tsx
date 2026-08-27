import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import { Package, Search, CheckCircle2, Clock, Truck, ShieldCheck, XCircle, DollarSign, Loader2, AlertCircle, Trash2, Sparkles } from 'lucide-react';
import { OrderStatusBadge } from '../../components/admin/OrderStatusBadge';
import { PermissionGuard } from '../../components/guards/PermissionGuard';
import { getAuthHeader } from '../../lib/auth-storage';
import { apiClient } from '../../lib/apiClient';
import { useToast } from '../../context/ToastContext';

export const AdminOrdersPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  // Manual Override Modal
  const [overrideOrder, setOverrideOrder] = useState<Order | null>(null);
  const [targetStatus, setTargetStatus] = useState<OrderStatus>('DELIVERED');
  const [overrideReason, setOverrideReason] = useState<string>('');

  // Confirmation Pop-up Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    order: Order | null;
    actionType: 'CONFIRM_COD' | 'UPDATE_STATUS' | 'DELETE_ORDER';
    newStatus?: OrderStatus;
    title: string;
    message: string;
    theme: 'emerald' | 'blue' | 'purple' | 'sky' | 'red' | 'amber';
    loading: boolean;
    error?: string;
    isUnpaidWarning?: boolean;
  } | null>(null);

  const openDeleteOrderModal = (order: Order) => {
    setConfirmModal({
      isOpen: true,
      order,
      actionType: 'DELETE_ORDER',
      title: 'Xóa Đơn hàng hoàn tất',
      message: `Cảnh báo: Bạn có chắc chắn muốn xóa vĩnh viễn đơn hàng #${order.id.slice(0, 8).toUpperCase()} khỏi hệ thống? Dữ liệu đã xóa không thể phục hồi.`,
      theme: 'red',
      loading: false,
    });
  };

  const openConfirmCodModal = (order: Order) => {
    const payment = order.payments?.[0];
    const methodText = payment?.method === 'COD' ? 'COD' : 'Chuyển khoản';
    setConfirmModal({
      isOpen: true,
      order,
      actionType: 'CONFIRM_COD',
      title: `Xác nhận Thanh toán ${methodText}`,
      message: `Bạn có chắc chắn muốn xác nhận đã thu đủ tiền (${methodText}) cho đơn hàng #${order.id.slice(0, 8).toUpperCase()}?`,
      theme: 'emerald',
      loading: false,
    });
  };

  const openUpdateStatusModal = (order: Order, newStatus: OrderStatus) => {
    let title = 'Cập nhật trạng thái đơn hàng';
    let message = `Cập nhật trạng thái đơn hàng #${order.id.slice(0, 8).toUpperCase()}?`;
    let theme: 'emerald' | 'blue' | 'purple' | 'sky' | 'red' | 'amber' = 'blue';
    let isUnpaidWarning = false;

    const payment = order.payments?.[0];
    const isPaymentPending = payment?.status === 'PENDING';
    const methodText = payment?.method === 'COD' ? 'Thanh toán COD' : 'Chuyển khoản';

    switch (newStatus) {
      case 'CONFIRMED':
        title = 'Xác nhận Đơn hàng';
        message = `Xác nhận và duyệt đơn hàng #${order.id.slice(0, 8).toUpperCase()} để chuẩn bị đóng gói?`;
        theme = 'blue';
        break;
      case 'PROCESSING':
        title = 'Bắt đầu Đóng gói';
        message = `Chuyển đơn hàng #${order.id.slice(0, 8).toUpperCase()} sang trạng thái đang đóng gói sản phẩm?`;
        theme = 'purple';
        break;
      case 'SHIPPING':
        title = 'Giao đơn Vận chuyển';
        message = `Bàn giao đơn hàng #${order.id.slice(0, 8).toUpperCase()} cho đơn vị vận chuyển?`;
        theme = 'sky';
        break;
      case 'DELIVERED':
        if (isPaymentPending) {
          title = 'Cảnh báo: Đơn hàng chưa thu tiền';
          message = `Đơn hàng #${order.id.slice(0, 8).toUpperCase()} hiện chưa được ghi nhận thu tiền ("Chưa thu tiền" - ${methodText}). Bạn có muốn Xác nhận đã thu tiền và Hoàn tất đơn hàng ngay không?`;
          theme = 'amber';
          isUnpaidWarning = true;
        } else {
          title = 'Hoàn tất Giao hàng';
          message = `Xác nhận đơn hàng #${order.id.slice(0, 8).toUpperCase()} đã được giao thành công cho khách hàng?`;
          theme = 'emerald';
        }
        break;
      case 'CANCELLED':
        title = 'Hủy Đơn hàng';
        message = `Cảnh báo: Bạn có chắc chắn muốn hủy đơn hàng #${order.id.slice(0, 8).toUpperCase()}?`;
        theme = 'red';
        break;
    }

    setConfirmModal({
      isOpen: true,
      order,
      actionType: 'UPDATE_STATUS',
      newStatus,
      title,
      message,
      theme,
      loading: false,
      isUnpaidWarning,
    });
  };

  const handleExecuteModalAction = async (autoConfirmPayment: boolean = false) => {
    if (!confirmModal || !confirmModal.order) return;

    setConfirmModal((prev) => (prev ? { ...prev, loading: true, error: undefined } : null));

    try {
      const orderId = confirmModal.order.id;

      if (confirmModal.actionType === 'DELETE_ORDER') {
        await apiClient(`/api/orders/${orderId}`, {
          method: 'DELETE',
        });
      } else if (confirmModal.actionType === 'CONFIRM_COD' || autoConfirmPayment) {
        await apiClient(`/api/orders/${orderId}/confirm-payment`, {
          method: 'POST',
        });
      }

      if (confirmModal.actionType === 'UPDATE_STATUS' && confirmModal.newStatus) {
        await apiClient(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: confirmModal.newStatus }),
        });
      }

      setConfirmModal(null);
      await fetchOrders();
    } catch (err: any) {
      console.error('Error executing order action:', err);
      setConfirmModal((prev) =>
        prev ? { ...prev, loading: false, error: err.message || 'Thao tác thất bại.' } : null,
      );
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = selectedTab === 'ALL' ? '/api/orders' : `/api/orders?status=${selectedTab}`;
      const data = await apiClient(url);
      setOrders(data);
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedTab]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus, reason?: string) => {
    setActionLoadingId(orderId);
    try {
      await apiClient(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, reason }),
      });
      await fetchOrders();
      setOverrideOrder(null);
      setOverrideReason('');
    } catch (err: any) {
      console.error('Error updating order status:', err);
      alert(err.message || 'Không thể cập nhật trạng thái đơn hàng');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const orderId = order.id.toLowerCase();
    const name = order.shipping_snapshot?.receiver_name?.toLowerCase() || '';
    const phone = order.shipping_snapshot?.phone || '';
    return orderId.includes(term) || name.includes(term) || phone.includes(term);
  });

  const tabs = [
    { key: 'ALL', label: 'Tất cả đơn' },
    { key: 'PENDING', label: 'Mới' },
    { key: 'CONFIRMED', label: 'Đã xác nhận' },
    { key: 'PROCESSING', label: 'Đang đóng gói' },
    { key: 'SHIPPING', label: 'Đang giao' },
    { key: 'DELIVERED', label: 'Đã hoàn tất' },
    { key: 'RETURN_REQUESTED', label: 'Yêu cầu đổi trả' },
    { key: 'RETURNED', label: 'Đã hoàn trả' },
    { key: 'CANCELLED', label: 'Đã hủy' },
  ];

  return (
    <div className="flex flex-col font-sans">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-amber-600" /> Quản lý & Vận hành Đơn hàng
            </h1>
            <p className="text-xs text-gray-500 mt-1">Xử lý đơn hàng, cập nhật trạng thái vận chuyển và xác nhận thanh toán COD.</p>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Tìm mã đơn, tên, sđt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Tabs Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedTab === tab.key
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-500">Không có đơn hàng nào khớp với điều kiện tìm kiếm.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const payment = order.payments?.[0];
              const formattedTotal = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(order.total || 0);

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-gray-200 transition"
                >
                  {/* Mã đơn */}
                  <div className="w-28 shrink-0">
                    <span className="font-extrabold text-slate-900 text-xs font-label tracking-wide">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  {/* Khách hàng */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 text-sm truncate">
                      {order.shipping_snapshot?.receiver_name || 'Khách vãng lai'}
                    </div>
                    <div className="text-[11px] text-gray-500">{order.shipping_snapshot?.phone}</div>
                    <div className="text-[11px] text-gray-400 truncate">
                      {order.shipping_snapshot?.address_line}, {order.shipping_snapshot?.district},{' '}
                      {order.shipping_snapshot?.province}
                    </div>
                  </div>

                  {/* Tổng tiền */}
                  <div className="w-28 shrink-0 text-right">
                    <span className="font-bold text-slate-900 text-sm">{formattedTotal}</span>
                  </div>

                  {/* Thanh toán */}
                  <div className="w-36 shrink-0">
                    <div className="font-semibold text-slate-700 text-xs">
                      {payment?.method === 'COD' ? 'Thanh toán COD' : 'Chuyển khoản'}
                    </div>
                    {payment?.status === 'COMPLETED' ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Đã thu tiền
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> Chưa thu tiền
                      </span>
                    )}
                  </div>

                  {/* Trạng thái */}
                  <div className="w-36 shrink-0">
                    <OrderStatusBadge status={order.status} />
                  </div>

                  {/* Thao tác */}
                  <div className="shrink-0 flex items-center gap-2">
                    {payment?.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                      <button
                        disabled={actionLoadingId === order.id}
                        onClick={() => openConfirmCodModal(order)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition shadow-sm flex items-center gap-1 whitespace-nowrap"
                        title={`Xác nhận đã thu tiền (${payment?.method === 'COD' ? 'Thanh toán COD' : 'Chuyển khoản'})`}
                      >
                        <DollarSign className="w-3.5 h-3.5" /> {payment?.method === 'COD' ? 'XN COD' : 'XN CK'}
                      </button>
                    )}

                    {order.status === 'PENDING' && (
                      <>
                        <button
                          disabled={actionLoadingId === order.id}
                          onClick={() => openUpdateStatusModal(order, 'CONFIRMED')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg transition whitespace-nowrap"
                        >
                          Xác nhận đơn
                        </button>
                        <button
                          disabled={actionLoadingId === order.id}
                          onClick={() => openUpdateStatusModal(order, 'CANCELLED')}
                          className="px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-[11px] rounded-lg transition"
                        >
                          Hủy
                        </button>
                      </>
                    )}

                    {order.status === 'CONFIRMED' && (
                      <>
                        <button
                          disabled={actionLoadingId === order.id}
                          onClick={() => openUpdateStatusModal(order, 'PROCESSING')}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded-lg transition whitespace-nowrap"
                        >
                          Đóng gói
                        </button>
                        <button
                          disabled={actionLoadingId === order.id}
                          onClick={() => openUpdateStatusModal(order, 'CANCELLED')}
                          className="px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-[11px] rounded-lg transition"
                        >
                          Hủy
                        </button>
                      </>
                    )}

                    {order.status === 'PROCESSING' && (
                      <button
                        disabled={actionLoadingId === order.id}
                        onClick={() => openUpdateStatusModal(order, 'SHIPPING')}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] rounded-lg transition flex items-center gap-1 whitespace-nowrap"
                      >
                        <Truck className="w-3.5 h-3.5" /> Giao vận chuyển
                      </button>
                    )}

                    {order.status === 'SHIPPING' && (
                      <button
                        disabled={actionLoadingId === order.id}
                        onClick={() => openUpdateStatusModal(order, 'DELIVERED')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition flex items-center gap-1 whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn tất giao
                      </button>
                    )}

                    {order.status === 'DELIVERED' && (
                      <button
                        disabled={actionLoadingId === order.id}
                        onClick={() => openDeleteOrderModal(order)}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition flex items-center justify-center"
                        title="Xóa đơn hàng đã hoàn tất"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <PermissionGuard requireSuperAdmin>
                      <button
                        onClick={() => setOverrideOrder(order)}
                        className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] rounded-lg transition"
                        title="Can thiệp thủ công (Super Admin)"
                      >
                        Sửa
                      </button>
                    </PermissionGuard>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Order Status Action Confirmation Modal */}
        {confirmModal && confirmModal.isOpen && confirmModal.order && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn select-none">
            <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-2xl ${
                  confirmModal.theme === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                  confirmModal.theme === 'blue' ? 'bg-blue-50 text-blue-600' :
                  confirmModal.theme === 'purple' ? 'bg-purple-50 text-purple-600' :
                  confirmModal.theme === 'sky' ? 'bg-sky-50 text-sky-600' :
                  confirmModal.theme === 'amber' ? 'bg-amber-50 text-amber-600' :
                  'bg-red-50 text-red-600'
                }`}>
                  {confirmModal.actionType === 'CONFIRM_COD' ? <DollarSign className="w-6 h-6" /> :
                   confirmModal.actionType === 'DELETE_ORDER' ? <Trash2 className="w-6 h-6" /> :
                   confirmModal.theme === 'amber' ? <AlertCircle className="w-6 h-6" /> :
                   confirmModal.theme === 'emerald' ? <CheckCircle2 className="w-6 h-6" /> :
                   confirmModal.theme === 'blue' ? <CheckCircle2 className="w-6 h-6" /> :
                   confirmModal.theme === 'purple' ? <Package className="w-6 h-6" /> :
                   confirmModal.theme === 'sky' ? <Truck className="w-6 h-6" /> :
                   <XCircle className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {confirmModal.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium font-mono mt-0.5">
                    Mã đơn: #{confirmModal.order.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                {confirmModal.message}
              </p>

              {confirmModal.error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {confirmModal.error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 flex-wrap pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={confirmModal.loading}
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition disabled:opacity-50"
                >
                  Hủy bỏ
                </button>

                {confirmModal.isUnpaidWarning ? (
                  <>
                    <button
                      type="button"
                      disabled={confirmModal.loading}
                      onClick={() => handleExecuteModalAction(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition disabled:opacity-50"
                    >
                      Chỉ hoàn tất giao (Chưa thu)
                    </button>
                    <button
                      type="button"
                      disabled={confirmModal.loading}
                      onClick={() => handleExecuteModalAction(true)}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 transition disabled:opacity-50"
                    >
                      {confirmModal.loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <DollarSign className="w-4 h-4" />
                      Xác nhận đã thu tiền & Hoàn tất
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={confirmModal.loading}
                    onClick={() => handleExecuteModalAction(false)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition disabled:opacity-50 ${
                      confirmModal.theme === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' :
                      confirmModal.theme === 'blue' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' :
                      confirmModal.theme === 'purple' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' :
                      confirmModal.theme === 'sky' ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-200' :
                      'bg-red-600 hover:bg-red-700 shadow-red-200'
                    }`}
                  >
                    {confirmModal.loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Xác nhận
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Super Admin Override Modal */}
        {overrideOrder && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-bold text-slate-900">Can thiệp Trạng thái Đơn hàng</h3>
              </div>
              <p className="text-xs text-gray-500">
                Can thiệp nhảy cóc trạng thái chỉ dành cho Super Admin. Bắt buộc nhập lý do chi tiết để hệ thống ghi vào Audit Log.
              </p>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chuyển trạng thái sang:</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as OrderStatus)}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-600 font-bold"
                  >
                    <option value="PENDING">Mới (PENDING)</option>
                    <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
                    <option value="PROCESSING">Đang đóng gói (PROCESSING)</option>
                    <option value="SHIPPING">Đang giao (SHIPPING)</option>
                    <option value="DELIVERED">Đã giao thành công (DELIVERED)</option>
                    <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lý do can thiệp (*):</label>
                  <textarea
                    required
                    placeholder="Ví dụ: Khách nhận hàng trực tiếp tại cửa hàng, đã thu tiền..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-600"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setOverrideOrder(null)}
                    className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                  >
                    Hủy
                  </button>
                  <button
                    disabled={!overrideReason.trim()}
                    onClick={() => handleUpdateStatus(overrideOrder.id, targetStatus, overrideReason)}
                    className="px-5 py-2 font-bold bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-40 transition shadow-md"
                  >
                    Xác nhận Can thiệp
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
