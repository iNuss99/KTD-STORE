import React, { useState, useEffect } from 'react';
import { ReturnRequest, ReturnStatus } from '../../types';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  PackageCheck,
  DollarSign,
  Loader2,
  AlertCircle,
  Sparkles,
  Calendar,
  Clock,
  MessageSquareQuote,
  Check,
  X,
} from 'lucide-react';
import { adminApiClient } from '../../lib/apiClient';

export const AdminReturnsPage: React.FC = () => {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Unified Glassmorphic Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    item: ReturnRequest | null;
    targetStatus: ReturnStatus;
    title: string;
    message: string;
    theme: 'blue' | 'purple' | 'emerald' | 'red';
    loading: boolean;
    error?: string;
    reasonInput?: string;
    refundAmountInput?: number;
  } | null>(null);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const url = selectedTab === 'ALL' ? '/api/returns' : `/api/returns?status=${selectedTab}`;
      const data = await adminApiClient(url);
      setReturns(data);
    } catch (err) {
      console.error('Error fetching return requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [selectedTab]);

  const openApproveModal = (item: ReturnRequest) => {
    setConfirmModal({
      isOpen: true,
      item,
      targetStatus: 'APPROVED',
      title: 'Duyệt Yêu cầu Đổi trả',
      message: `Chấp nhận duyệt yêu cầu đổi trả cho đơn hàng #${item.order_id.slice(0, 8).toUpperCase()}? Khách hàng sẽ gửi lại hàng về kho.`,
      theme: 'blue',
      loading: false,
    });
  };

  const openRejectModal = (item: ReturnRequest) => {
    setConfirmModal({
      isOpen: true,
      item,
      targetStatus: 'REJECTED',
      title: 'Từ chối Yêu cầu Đổi trả',
      message: `Vui lòng nhập lý do từ chối yêu cầu đổi trả của đơn hàng #${item.order_id.slice(0, 8).toUpperCase()}:`,
      theme: 'red',
      loading: false,
      reasonInput: '',
    });
  };

  const openReceiveModal = (item: ReturnRequest) => {
    setConfirmModal({
      isOpen: true,
      item,
      targetStatus: 'RECEIVED',
      title: 'Xác nhận Đã nhận hàng về kho',
      message: `Xác nhận kho đã nhận lại sản phẩm đổi trả từ khách hàng cho đơn #${item.order_id.slice(0, 8).toUpperCase()}? Tồn kho sản phẩm sẽ được tự động cộng lại.`,
      theme: 'purple',
      loading: false,
    });
  };

  const openRefundModal = (item: ReturnRequest) => {
    setConfirmModal({
      isOpen: true,
      item,
      targetStatus: 'REFUNDED',
      title: 'Xác nhận Hoàn tiền cho Khách',
      message: `Xác nhận đã hoàn tiền cho đơn hàng #${item.order_id.slice(0, 8).toUpperCase()}?`,
      theme: 'emerald',
      loading: false,
      refundAmountInput: item.order?.total || 0,
    });
  };

  const handleExecuteModalAction = async () => {
    if (!confirmModal || !confirmModal.item) return;

    if (confirmModal.targetStatus === 'REJECTED' && !confirmModal.reasonInput?.trim()) {
      setConfirmModal((prev) => (prev ? { ...prev, error: 'Vui lòng nhập lý do từ chối.' } : null));
      return;
    }

    setConfirmModal((prev) => (prev ? { ...prev, loading: true, error: undefined } : null));

    try {
      const payload: any = {
        status: confirmModal.targetStatus,
      };
      if (confirmModal.targetStatus === 'REJECTED' && confirmModal.reasonInput) {
        payload.rejection_reason = confirmModal.reasonInput;
      }
      if (confirmModal.targetStatus === 'REFUNDED') {
        payload.refund_amount = Number(confirmModal.refundAmountInput) || 0;
      }

      await adminApiClient(`/api/returns/${confirmModal.item.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      setConfirmModal(null);
      await fetchReturns();
    } catch (err: any) {
      console.error('Error updating return status:', err);
      setConfirmModal((prev) =>
        prev ? { ...prev, loading: false, error: err.message || 'Cập nhật trạng thái thất bại.' } : null,
      );
    }
  };

  const filteredReturns = returns.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const orderId = item.order_id?.toLowerCase() || '';
    const name = item.user?.full_name?.toLowerCase() || item.order?.shipping_snapshot?.receiver_name?.toLowerCase() || '';
    return orderId.includes(term) || name.includes(term);
  });

  const getStatusBadge = (status: ReturnStatus) => {
    switch (status) {
      case 'REQUESTED':
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200/70 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Yêu cầu mới
          </span>
        );
      case 'APPROVED':
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200/70 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Đã duyệt (Chờ nhận hàng)
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="bg-purple-50 text-purple-700 border border-purple-200/70 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            Đã nhận hàng kho
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Đã hoàn tiền
          </span>
        );
      case 'REJECTED':
        return (
          <span className="bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Đã từ chối
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2.5 py-1 rounded-full">
            {status}
          </span>
        );
    }
  };

  const tabs = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'REQUESTED', label: 'Mới gửi' },
    { key: 'APPROVED', label: 'Đã duyệt' },
    { key: 'RECEIVED', label: 'Đã nhận kho' },
    { key: 'REFUNDED', label: 'Đã hoàn tiền' },
    { key: 'REJECTED', label: 'Từ chối' },
  ];

  return (
    <div className="flex flex-col font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-6 h-6 text-amber-600" /> Quản lý Đổi trả & Hoàn tiền
            </h1>
            <p className="text-xs text-gray-500 mt-1">Duyệt yêu cầu đổi trả, nhận hàng về kho và xác nhận hoàn tiền.</p>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Tìm mã đơn, tên khách..."
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

        {/* Card List View */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-medium mt-2">Đang tải danh sách đổi trả...</p>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs">
            <RotateCcw className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Không tìm thấy yêu cầu đổi trả nào.</p>
            <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReturns.map((item) => {
              const orderTotal = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(item.order?.total || 0);

              const customerName =
                item.user?.full_name || item.order?.shipping_snapshot?.receiver_name || 'Khách hàng';
              const customerContact =
                item.user?.email || item.order?.shipping_snapshot?.phone || 'Chưa có thông tin liên hệ';
              const avatarInitial = customerName.charAt(0).toUpperCase();

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition duration-200 p-5 sm:p-6 space-y-4"
                >
                  {/* Top Row: Order Code, Status Badge & Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono font-extrabold text-xs tracking-wider border border-slate-200/60">
                        #{item.order_id.slice(0, 8).toUpperCase()}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                      <span className="text-slate-300">•</span>
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {new Date(item.created_at).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Middle Row: Customer Info & Order Total */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Customer info */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-sm shrink-0">
                        {avatarInitial}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{customerName}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{customerContact}</p>
                      </div>
                    </div>

                    {/* Order value */}
                    <div className="sm:text-right bg-slate-50/80 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-slate-100 sm:border-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Giá trị đơn hàng
                      </p>
                      <p className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-0.5">
                        {orderTotal}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Row: Return Reason & Action Buttons */}
                  <div className="bg-slate-50/90 rounded-xl p-3.5 sm:p-4 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2.5">
                        <MessageSquareQuote className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-700 font-medium leading-relaxed">
                            <span className="font-bold text-slate-900 mr-1">Lý do đổi trả:</span>
                            <span className="italic text-slate-600">"{item.reason}"</span>
                          </p>
                          {item.rejection_reason && (
                            <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 w-fit">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              Lý do từ chối: {item.rejection_reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60 w-full md:w-auto justify-end">
                      {item.status === 'REQUESTED' && (
                        <>
                          <button
                            disabled={actionLoadingId === item.id}
                            onClick={() => openApproveModal(item)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs shadow-blue-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" /> Duyệt
                          </button>
                          <button
                            disabled={actionLoadingId === item.id}
                            onClick={() => openRejectModal(item)}
                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl border border-rose-100 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" /> Từ chối
                          </button>
                        </>
                      )}

                      {item.status === 'APPROVED' && (
                        <button
                          disabled={actionLoadingId === item.id}
                          onClick={() => openReceiveModal(item)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs shadow-purple-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="Nhận hàng về kho và cộng lại tồn kho"
                        >
                          <PackageCheck className="w-3.5 h-3.5" /> Nhận hàng kho
                        </button>
                      )}

                      {item.status === 'RECEIVED' && (
                        <button
                          disabled={actionLoadingId === item.id}
                          onClick={() => openRefundModal(item)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs shadow-emerald-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="Xác nhận hoàn tiền cho khách"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> Hoàn tiền
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Step-by-Step Glassmorphic Action Modal */}
        {confirmModal && confirmModal.isOpen && confirmModal.item && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn select-none">
            <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${
                  confirmModal.theme === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                  confirmModal.theme === 'blue' ? 'bg-blue-50 text-blue-600' :
                  confirmModal.theme === 'purple' ? 'bg-purple-50 text-purple-600' :
                  'bg-red-50 text-red-600'
                }`}>
                  {confirmModal.theme === 'emerald' ? <DollarSign className="w-6 h-6" /> :
                   confirmModal.theme === 'blue' ? <CheckCircle2 className="w-6 h-6" /> :
                   confirmModal.theme === 'purple' ? <PackageCheck className="w-6 h-6" /> :
                   <XCircle className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {confirmModal.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium font-mono mt-0.5">
                    Mã đơn: #{confirmModal.item.order_id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                {confirmModal.message}
              </p>

              {/* Rejection Reason Input */}
              {confirmModal.targetStatus === 'REJECTED' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Lý do từ chối (*):</label>
                  <textarea
                    rows={3}
                    placeholder="Ví dụ: Sản phẩm đã qua sử dụng, quá 7 ngày quy định đổi trả..."
                    value={confirmModal.reasonInput || ''}
                    onChange={(e) => setConfirmModal((prev) => (prev ? { ...prev, reasonInput: e.target.value } : null))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}

              {/* Refund Amount Input */}
              {confirmModal.targetStatus === 'REFUNDED' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Số tiền hoàn (VNĐ):</label>
                  <input
                    type="number"
                    value={confirmModal.refundAmountInput || 0}
                    onChange={(e) => setConfirmModal((prev) => (prev ? { ...prev, refundAmountInput: Number(e.target.value) } : null))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {confirmModal.error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {confirmModal.error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={confirmModal.loading}
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={confirmModal.loading}
                  onClick={handleExecuteModalAction}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition disabled:opacity-50 ${
                    confirmModal.theme === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' :
                    confirmModal.theme === 'blue' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' :
                    confirmModal.theme === 'purple' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' :
                    'bg-red-600 hover:bg-red-700 shadow-red-200'
                  }`}
                >
                  {confirmModal.loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
