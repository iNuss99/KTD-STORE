import React, { useEffect } from 'react';
import { AlertTriangle, Loader2, Trash2, X, FolderTree } from 'lucide-react';
import { Category } from '../../types';

interface ConfirmDeleteCategoryModalProps {
  isOpen: boolean;
  category: (Category & { products_count?: number }) | null;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export const ConfirmDeleteCategoryModal: React.FC<ConfirmDeleteCategoryModalProps> = ({
  isOpen,
  category,
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

  if (!isOpen || !category) return null;

  const hasProducts = Boolean(category.products_count && category.products_count > 0);

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
          <h3 className="text-base font-bold text-slate-800">Xác nhận xóa danh mục</h3>
          <p className="text-xs text-slate-500 mt-1">
            Hành động này sẽ gỡ bỏ danh mục khỏi hệ thống cửa hàng.
          </p>
        </div>

        {/* Target Category Preview */}
        <div className="my-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-left space-y-2">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-sky-600 shrink-0" />
            <p className="text-sm font-bold text-slate-800 truncate">{category.name}</p>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Slug URL:</span>
            <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
              {category.slug}
            </span>
          </div>
          {category.products_count !== undefined && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Sản phẩm liên kết:</span>
              <span className={`font-bold ${hasProducts ? 'text-amber-600' : 'text-emerald-600'}`}>
                {category.products_count} sản phẩm
              </span>
            </div>
          )}
        </div>

        {/* System notice */}
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 mb-4 text-left">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-amber-800 font-medium">
            {hasProducts
              ? `Lưu ý: Danh mục này đang có ${category.products_count} sản phẩm. Khi xóa, các sản phẩm sẽ được chuyển về trạng thái 'Chưa phân loại' để không làm mất dữ liệu.`
              : 'Hành động này sẽ xóa hoàn toàn danh mục khỏi hệ thống cửa hàng.'}
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
                <span>Xác nhận xóa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
