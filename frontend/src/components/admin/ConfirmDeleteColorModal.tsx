import React, { useEffect } from 'react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { Color } from '../../types';

interface ConfirmDeleteColorModalProps {
  isOpen: boolean;
  color: Color | null;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export const ConfirmDeleteColorModal: React.FC<ConfirmDeleteColorModalProps> = ({
  isOpen,
  color,
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

  if (!isOpen || !color) return null;

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
          <h3 className="text-base font-bold text-slate-800">Xác nhận xóa màu</h3>
          <p className="text-xs text-slate-500 mt-1">
            Hành động này sẽ gỡ bỏ màu sắc khỏi danh sách hệ thống.
          </p>
        </div>

        {/* Target Color Preview */}
        <div className="my-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
          <span
            className="w-7 h-7 rounded-lg border border-slate-300/80 shadow-2xs shrink-0"
            style={{ backgroundColor: color.hex_code || '#94A3B8' }}
          />
          <div className="min-w-0 flex-1 text-left">
            <p className="text-xs font-bold text-slate-800 truncate">{color.name}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Mã SKU: <span className="font-mono font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">{color.code}</span>
            </p>
          </div>
        </div>

        {/* System notice */}
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 mb-4 text-left">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-amber-800 font-medium">
            Lưu ý: Nếu màu này đang được dùng trong sản phẩm hoặc biến thể, hệ thống sẽ tự động chặn xóa để bảo vệ dữ liệu.
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
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>
  );
};
export default ConfirmDeleteColorModal;
