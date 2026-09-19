import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { Order } from '../../types';
import { useCancelOrderMutation } from '../../hooks/useOrders';
import { useToast } from '../../context/ToastContext';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSuccess?: (updatedOrder: Order) => void;
}

const PREDEFINED_REASONS = [
  'Tôi muốn thay đổi địa chỉ / số điện thoại nhận hàng',
  'Tôi muốn đổi kích cỡ (size), màu sắc hoặc sản phẩm khác',
  'Tôi đặt nhầm sản phẩm',
  'Tôi tìm thấy sản phẩm tương tự có giá tốt hơn',
  'Tôi đổi ý, không có nhu cầu mua nữa',
  'Khác',
];

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  const { showSuccess, showError } = useToast();
  const cancelMutation = useCancelOrderMutation();

  const [cancelReason, setCancelReason] = useState<string>(PREDEFINED_REASONS[4]);
  const [customReason, setCustomReason] = useState<string>('');

  if (!isOpen || !order) return null;

  const isPaid = order.payments?.some((p: any) => p.status === 'COMPLETED');

  const handleConfirm = async () => {
    const finalReason = cancelReason === 'Khác' ? customReason.trim() || 'Lý do khác' : cancelReason;

    try {
      const updatedOrder = await cancelMutation.mutateAsync({
        orderId: order.id,
        reason: finalReason,
      });

      showSuccess(
        'Đã hủy đơn hàng',
        isPaid
          ? 'Đơn hàng đã được hủy thành công. Do bạn đã thanh toán trước, bộ phận CSKH sẽ sớm liên hệ hoàn tiền.'
          : 'Đơn hàng của bạn đã được hủy thành công.',
      );

      if (onSuccess) {
        onSuccess(updatedOrder);
      }
      onClose();
    } catch (err: any) {
      console.error('Error cancelling order:', err);
      showError('Không thể hủy đơn hàng', err.message || 'Có lỗi xảy ra khi hủy đơn hàng');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 font-sans select-none animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
              ✕
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Hủy đơn hàng</h3>
              <p className="text-xs text-slate-500 font-medium">Mã đơn: #{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paid alert notice */}
        {isPaid && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Đơn hàng đã thanh toán trước:</strong> Sau khi bạn hủy, nhân viên CSKH của KTD Store sẽ chủ động liên hệ với bạn để hoàn tiền lại trong vòng 24h làm việc.
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Vui lòng chọn lý do hủy đơn:
          </label>
          <div className="space-y-2">
            {PREDEFINED_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium cursor-pointer transition ${
                  cancelReason === reason
                    ? 'border-amber-500 bg-amber-50/60 text-slate-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="cancel_reason"
                  checked={cancelReason === reason}
                  onChange={() => setCancelReason(reason)}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          {cancelReason === 'Khác' && (
            <div className="mt-3">
              <textarea
                rows={2}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Nhập chi tiết lý do của bạn..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={cancelMutation.isPending}
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            Không hủy nữa
          </button>
          <button
            type="button"
            disabled={cancelMutation.isPending || (cancelReason === 'Khác' && !customReason.trim())}
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            {cancelMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Xác nhận hủy đơn</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
