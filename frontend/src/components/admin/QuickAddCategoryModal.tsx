import React, { useState } from 'react';
import { X, FolderTree, Loader2, Sparkles } from 'lucide-react';
import { Category } from '../../types';
import { getAdminAuthHeader } from '../../lib/auth-storage';
import { useToast } from '../../context/ToastContext';
import { generateSlugFromCategoryName } from '../../lib/category-utils';

interface QuickAddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (category: Category) => void;
  parentCategories?: Category[];
}

const POPULAR_CATEGORY_PRESETS = [
  'Áo Len',
  'Áo Nỉ / Hoodie',
  'Áo Gió Chống Nước',
  'Quần Shorts',
  'Quần Jogger',
  'Quần Lót Nam',
  'Phụ Kiện Thời Trang',
  'Giày & Dép',
];

export const QuickAddCategoryModal: React.FC<QuickAddCategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  parentCategories = [],
}) => {
  const { showSuccess, showError } = useToast();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [parentId, setParentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isCustomSlug) {
      setSlug(generateSlugFromCategoryName(val));
    }
    if (validationError) setValidationError('');
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setIsCustomSlug(true);
    if (validationError) setValidationError('');
  };

  const handleSelectPreset = (presetName: string) => {
    setName(presetName);
    setSlug(generateSlugFromCategoryName(presetName));
    setIsCustomSlug(false);
    if (validationError) setValidationError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const finalSlug = (slug || generateSlugFromCategoryName(trimmedName)).trim();

    if (!trimmedName) {
      setValidationError('Vui lòng nhập tên danh mục.');
      return;
    }

    setLoading(true);
    setValidationError('');

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader(),
        },
        body: JSON.stringify({
          name: trimmedName,
          slug: finalSlug || undefined,
          parent_id: parentId || undefined,
        }),
      });

      if (res.ok) {
        const newCat = await res.json();
        showSuccess('Thành công', `Đã thêm danh mục "${newCat.name}" vào hệ thống!`);
        onSuccess(newCat);
        handleClose();
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = err.message || 'Không thể tạo danh mục mới';
        setValidationError(Array.isArray(msg) ? msg.join(', ') : msg);
        showError('Lỗi thêm danh mục', Array.isArray(msg) ? msg.join(', ') : msg);
      }
    } catch (err: any) {
      setValidationError('Không thể kết nối đến máy chủ.');
      showError('Lỗi kết nối', err?.message || 'Không thể kết nối');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setSlug('');
    setIsCustomSlug(false);
    setParentId('');
    setValidationError('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Thêm danh mục mới</h3>
              <p className="text-xs text-slate-400">Tạo danh mục sản phẩm vào hệ thống</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Tên danh mục */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên danh mục <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              placeholder="VD: Áo Len, Quần Shorts..."
              value={name}
              onChange={handleNameChange}
              required
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
            />
          </div>

          {/* Slug URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Slug URL (Tự động tạo)
              </label>
              {isCustomSlug && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomSlug(false);
                    setSlug(generateSlugFromCategoryName(name));
                  }}
                  className="text-[10px] text-sky-600 hover:underline font-medium"
                >
                  Đặt lại tự động
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder="VD: ao-len"
              value={slug}
              onChange={handleSlugChange}
              className="w-full text-xs font-mono px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition bg-slate-50/50"
            />
          </div>

          {/* Danh mục cha (nếu có) */}
          {parentCategories.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Danh mục cha (Không bắt buộc)
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition bg-white"
              >
                <option value="">-- Là danh mục gốc (Cấp cao nhất) --</option>
                {parentCategories.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Gợi ý danh mục phổ biến */}
          <div>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-500 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Gợi ý danh mục phổ biến:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_CATEGORY_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                    name === p
                      ? 'bg-sky-50 text-sky-700 border-sky-300 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Lỗi xác thực */}
          {validationError && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-xl font-medium">
              {validationError}
            </p>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center gap-2"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {loading ? 'Đang tạo...' : 'Tạo danh mục'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
