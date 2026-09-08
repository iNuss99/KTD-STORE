import React, { useState } from 'react';
import {
  X,
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  Check,
  Loader2,
  Search,
  AlertCircle,
  Package,
} from 'lucide-react';
import { Category } from '../../types';
import { getAdminAuthHeader } from '../../lib/auth-storage';
import { useToast } from '../../context/ToastContext';
import { generateSlugFromCategoryName } from '../../lib/category-utils';
import { ConfirmDeleteCategoryModal } from './ConfirmDeleteCategoryModal';

interface CategoryWithCount extends Category {
  products_count?: number;
}

interface AdminCategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryWithCount[];
  onCategoriesChange: (categories: CategoryWithCount[]) => void;
}

export const AdminCategoryManagerModal: React.FC<AdminCategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCategoriesChange,
}) => {
  const { showSuccess, showError } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [parentId, setParentId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit inline state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete state
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryWithCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const finalSlug = (slug || generateSlugFromCategoryName(trimmedName)).trim();

    if (!trimmedName) {
      showError('Thiếu thông tin', 'Vui lòng nhập Tên danh mục');
      return;
    }

    setIsCreating(true);
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
        const created = await res.json();
        const updated = [...categories, { ...created, products_count: 0 }].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        onCategoriesChange(updated);
        showSuccess('Thành công', `Đã thêm danh mục "${created.name}"`);
        setName('');
        setSlug('');
        setIsCustomSlug(false);
        setParentId('');
        setShowAddForm(false);
      } else {
        const err = await res.json().catch(() => ({}));
        showError('Không thể tạo danh mục', err.message || 'Lỗi khi tạo danh mục');
      }
    } catch (err: any) {
      showError('Lỗi mạng', err.message || 'Không thể kết nối đến máy chủ');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartEdit = (cat: CategoryWithCount) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditSlug(cat.slug);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditSlug('');
  };

  const handleSaveEdit = async (catId: string) => {
    const trimmedName = editName.trim();
    const trimmedSlug = editSlug.trim();

    if (!trimmedName) {
      showError('Lỗi', 'Tên danh mục không được để trống');
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/categories/${catId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader(),
        },
        body: JSON.stringify({
          name: trimmedName,
          slug: trimmedSlug || undefined,
        }),
      });

      if (res.ok) {
        const updatedCat = await res.json();
        const updated = categories.map((c) =>
          c.id === catId ? { ...c, ...updatedCat } : c
        );
        onCategoriesChange(updated);
        showSuccess('Thành công', `Đã cập nhật danh mục "${updatedCat.name}"`);
        handleCancelEdit();
      } else {
        const err = await res.json().catch(() => ({}));
        showError('Không thể cập nhật', err.message || 'Lỗi cập nhật danh mục');
      }
    } catch (err: any) {
      showError('Lỗi mạng', err.message || 'Không thể kết nối');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
        headers: getAdminAuthHeader(),
      });

      if (res.ok) {
        const updated = categories.filter((c) => c.id !== categoryToDelete.id);
        onCategoriesChange(updated);
        showSuccess('Đã xóa', `Đã xóa danh mục "${categoryToDelete.name}" thành công`);
        setCategoryToDelete(null);
      } else {
        const err = await res.json().catch(() => ({}));
        showError('Không thể xóa danh mục', err.message || 'Lỗi khi xóa danh mục');
      }
    } catch (err: any) {
      showError('Lỗi mạng', err.message || 'Không thể kết nối đến máy chủ');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
  });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                Quản lý danh mục sản phẩm
                <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {categories.length} danh mục
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Thêm mới, sửa tên hoặc xóa các danh mục trong cửa hàng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            aria-label="Đóng bảng quản lý"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action bar: Search + Toggle Add Form */}
        <div className="py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm danh mục theo tên, slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              showAddForm
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-sky-600 text-white hover:bg-sky-700 shadow-xs'
            }`}
          >
            {showAddForm ? (
              <>
                <X className="w-3.5 h-3.5" /> Đóng form thêm
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" /> Thêm danh mục mới
              </>
            )}
          </button>
        </div>

        {/* Collapsible Add Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateCategory}
            className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 shrink-0 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-sky-600" /> Nhập thông tin danh mục mới
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                  Tên danh mục <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Áo Len, Quần Shorts..."
                  value={name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setName(val);
                    if (!isCustomSlug) setSlug(generateSlugFromCategoryName(val));
                  }}
                  required
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Slug URL</label>
                  {isCustomSlug && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomSlug(false);
                        setSlug(generateSlugFromCategoryName(name));
                      }}
                      className="text-[10px] text-sky-600 hover:underline"
                    >
                      Tự động
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="VD: ao-len"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setIsCustomSlug(true);
                  }}
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {isCreating ? 'Đang tạo...' : 'Tạo danh mục'}
              </button>
            </div>
          </form>
        )}

        {/* Categories Table */}
        <div className="flex-1 overflow-y-auto min-h-0 border border-slate-200/80 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="p-3">Tên danh mục</th>
                <th className="p-3">Slug URL</th>
                <th className="p-3 text-center">Sản phẩm</th>
                <th className="p-3 text-center w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((c) => {
                  const isEditing = editingId === c.id;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-semibold text-slate-800">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full text-xs px-2 py-1 rounded border border-sky-400 bg-white outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <FolderTree className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <span>{c.name}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editSlug}
                            onChange={(e) => setEditSlug(e.target.value)}
                            className="w-full text-xs font-mono px-2 py-1 rounded border border-sky-400 bg-white outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        ) : (
                          <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {c.slug}
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            c.products_count && c.products_count > 0
                              ? 'bg-sky-50 text-sky-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Package className="w-3 h-3" />
                          {c.products_count ?? 0}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(c.id)}
                                disabled={isSavingEdit}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition"
                                title="Lưu thay đổi"
                              >
                                {isSavingEdit ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded transition"
                                title="Hủy"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(c)}
                                className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                                title="Sửa danh mục"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setCategoryToDelete(c)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Xóa danh mục"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">
                    {searchQuery
                      ? `Không tìm thấy danh mục nào phù hợp với từ khóa "${searchQuery}"`
                      : 'Chưa có danh mục nào.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400">
            Mẹo: Danh mục có sản phẩm liên kết sẽ được hệ thống bảo vệ chặn xóa an toàn.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Confirm Delete Category Modal */}
      <ConfirmDeleteCategoryModal
        isOpen={Boolean(categoryToDelete)}
        category={categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};
