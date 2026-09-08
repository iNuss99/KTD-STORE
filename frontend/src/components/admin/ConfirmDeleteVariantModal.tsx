import React, { useEffect } from 'react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { ProductVariant } from '../../types';

interface ConfirmDeleteVariantModalProps {
  isOpen: boolean;
  variant: ProductVariant | null;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export const ConfirmDeleteVariantModal: React.FC<ConfirmDeleteVariantModalProps> = ({
  isOpen,
  variant,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !variant) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full p-5 overflow-hidden animate-in zoom-in-95 duration-150 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close icon button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
          aria-label="Đóng popup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon Badge */}
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-3 mx-auto">
          <Trash2 className="w-6 h-6" />
        </div>

        {/* Header */}
        <div className="text-center">
          <h3 className="text-base font-bold text-slate-800">Xác nhận xóa biến thể</h3>
          <p className="text-xs text-slate-500 mt-1">
            Bạn có chắc chắn muốn xóa biến thể này khỏi danh mục sản phẩm không?
          </p>
        </div>

        {/* Target Variant Preview */}
        <div className="my-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Mã SKU:</span>
            <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
              {variant.sku}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Size:</span>
            <span className="font-bold text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded">
              {variant.size?.name || 'N/A'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Màu sắc:</span>
            <div className="inline-flex items-center gap-1.5 font-medium text-slate-700">
              <span
                className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0"
                style={{ backgroundColor: variant.color?.hex_code || '#cbd5e1' }}
              />
              <span>{variant.color?.name || 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Tồn kho hiện tại:</span>
            <span className="font-bold text-slate-800">{variant.stock_quantity} sản phẩm</span>
          </div>

          {variant.price_override ? (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Giá riêng:</span>
              <span className="font-bold text-sky-600">
                {Number(variant.price_override).toLocaleString('vi-VN')} ₫
              </span>
            </div>
          ) : null}
        </div>

        {/* System notice */}
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 mb-4 text-left">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-amber-800 font-medium">
            Lưu ý: Hành động này không thể hoàn tác. Dữ liệu tồn kho của biến thể này sẽ bị gỡ bỏ khỏi hệ thống.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa biến thể</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
