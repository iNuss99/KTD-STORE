import React, { useState, useEffect } from 'react';
import { ReturnRequest, ReturnStatus } from '../../types';
import { RotateCcw, Search, CheckCircle2, XCircle, PackageCheck, DollarSign, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { getAuthHeader } from '../../lib/auth-storage';
import { apiClient } from '../../lib/apiClient';

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
      const data = await apiClient(url);
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

      await apiClient(`/api/returns/${confirmModal.item.id}/status`, {
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
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">Yêu cầu mới</span>;
      case 'APPROVED':
        return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">Đã duyệt (Chờ nhận hàng)</span>;
      case 'RECEIVED':
        return <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-full">Đã nhận hàng kho</span>;
      case 'REFUNDED':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">Đã hoàn tiền</span>;
      case 'REJECTED':
        return <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full">Đã từ chối</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2.5 py-1 rounded-full">{status}</span>;
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

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <RotateCcw className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-500">Không có yêu cầu đổi trả nào khớp với tìm kiếm.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="p-4">Mã Đơn hàng</th>
                    <th className="p-4">Khách hàng</th>
                    <th className="p-4">Lý do đổi trả</th>
                    <th className="p-4">Giá trị đơn</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4">Thời gian</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReturns.map((item) => {
                    const orderTotal = new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(item.order?.total || 0);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-extrabold text-slate-900 font-mono">
                          #{item.order_id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{item.user?.full_name || item.order?.shipping_snapshot?.receiver_name}</div>
                          <div className="text-gray-400 text-[11px]">{item.user?.email || item.order?.shipping_snapshot?.phone}</div>
                        </td>
                        <td className="p-4 max-w-xs">
                          <p className="font-medium text-slate-800 line-clamp-2">"{item.reason}"</p>
                          {item.rejection_reason && (
                            <p className="text-[11px] font-bold text-red-600 mt-1">Từ chối: {item.rejection_reason}</p>
                          )}
                        </td>
                        <td className="p-4 font-extrabold text-slate-900">
                          {orderTotal}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="p-4 text-gray-500 font-mono text-[11px]">
                          {new Date(item.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {item.status === 'REQUESTED' && (
                              <>
                                <button
                                  disabled={actionLoadingId === item.id}
                                  onClick={() => openApproveModal(item)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg transition shadow-2xs"
                                >
                                  Duyệt
                                </button>
                                <button
                                  disabled={actionLoadingId === item.id}
                                  onClick={() => openRejectModal(item)}
                                  className="px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-[11px] rounded-lg transition"
                                >
                                  Từ chối
                                </button>
                              </>
                            )}

                            {item.status === 'APPROVED' && (
                              <button
                                disabled={actionLoadingId === item.id}
                                onClick={() => openReceiveModal(item)}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded-lg transition flex items-center gap-1 shadow-2xs"
                                title="Nhận hàng về kho và cộng lại tồn kho"
                              >
                                <PackageCheck className="w-3.5 h-3.5" /> Nhận hàng kho
                              </button>
                            )}

                            {item.status === 'RECEIVED' && (
                              <button
                                disabled={actionLoadingId === item.id}
                                onClick={() => openRefundModal(item)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition flex items-center gap-1 shadow-2xs"
                                title="Xác nhận hoàn tiền cho khách"
                              >
                                <DollarSign className="w-3.5 h-3.5" /> Hoàn tiền
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
