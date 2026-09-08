import React, { useState } from 'react';
import {
  X,
  Palette,
  Plus,
  Trash2,
  Edit2,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  Search,
} from 'lucide-react';
import { Color } from '../../types';
import { getAdminAuthHeader } from '../../lib/auth-storage';
import { useToast } from '../../context/ToastContext';
import {
  generateColorSkuCode,
  isValidHexCode,
  POPULAR_FASHION_PRESETS,
} from '../../lib/color-utils';
import { ConfirmDeleteColorModal } from './ConfirmDeleteColorModal';

interface AdminColorManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  colors: Color[];
  onColorsChange: (colors: Color[]) => void;
}

export const AdminColorManagerModal: React.FC<AdminColorManagerModalProps> = ({
  isOpen,
  onClose,
  colors,
  onColorsChange,
}) => {
  const { showSuccess, showError } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [hexCode, setHexCode] = useState('#2E4F4F');
  const [isCreating, setIsCreating] = useState(false);

  // Edit inline state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editHex, setEditHex] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [colorToDelete, setColorToDelete] = useState<Color | null>(null);

  if (!isOpen) return null;

  const autoSkuCode = generateColorSkuCode(name) || 'Tự động';

  const handleCreateColor = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedHex = hexCode.trim().toUpperCase();

    if (!trimmedName || !isValidHexCode(trimmedHex)) {
      showError('Thông tin chưa hợp lệ', 'Vui lòng nhập Tên màu sắc và Chọn mã Hex hợp lệ');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/products/colors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader(),
        },
        body: JSON.stringify({
          name: trimmedName,
          hex_code: trimmedHex,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        const updated = [...colors, created].sort((a, b) => a.name.localeCompare(b.name));
        onColorsChange(updated);
        showSuccess('Thành công', `Đã thêm màu "${created.name}" (SKU: ${created.code})`);
        setName('');
        setHexCode('#2E4F4F');
        setShowAddForm(false);
      } else {
        const err = await res.json().catch(() => ({}));
        showError('Không thể tạo màu', err.message || 'Lỗi khi tạo màu');
      }
    } catch (err: any) {
      showError('Lỗi mạng', err.message || 'Không thể kết nối đến máy chủ');
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (color: Color) => {
    setEditingId(color.id);
    setEditName(color.name);
    setEditHex(color.hex_code || '#000000');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditHex('');
  };

  const saveEdit = async (id: string) => {
    const trimmedName = editName.trim();
    const trimmedHex = editHex.trim().toUpperCase();

    if (!trimmedName || !isValidHexCode(trimmedHex)) {
      showError('Thông tin chưa hợp lệ', 'Vui lòng kiểm tra lại thông tin sửa đổi');
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/products/colors/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader(),
        },
        body: JSON.stringify({
          name: trimmedName,
          hex_code: trimmedHex,
        }),
      });

      if (res.ok) {
        const updatedColor = await res.json();
        const updatedList = colors
          .map((c) => (c.id === id ? updatedColor : c))
          .sort((a, b) => a.name.localeCompare(b.name));
        onColorsChange(updatedList);
        showSuccess('Đã cập nhật', `Đã lưu thay đổi cho màu "${updatedColor.name}"`);
        cancelEdit();
      } else {
        const err = await res.json().catch(() => ({}));
        showError('Lỗi cập nhật', err.message || 'Không thể cập nhật màu');
      }
    } catch (err: any) {
      showError('Lỗi mạng', err.message || 'Không thể kết nối máy chủ');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = (color: Color) => {
    setColorToDelete(color);
  };

  const handleConfirmDelete = async () => {
    if (!colorToDelete) return;
    setDeletingId(colorToDelete.id);
    try {
      const res = await fetch(`/api/products/colors/${colorToDelete.id}`, {
        method: 'DELETE',
        headers: getAdminAuthHeader(),
      });

      if (res.ok) {
        const updatedList = colors.filter((c) => c.id !== colorToDelete.id);
        onColorsChange(updatedList);
        showSuccess('Đã xóa thành công', `Màu "${colorToDelete.name}" đã được xóa khỏi hệ thống.`);
        setColorToDelete(null);
      } else {
        const err = await res.json().catch(() => ({}));
        showError('Không thể xóa màu', err.message || 'Màu này đang được sử dụng bởi biến thể sản phẩm.');
      }
    } catch (err: any) {
      showError('Lỗi mạng', err.message || 'Không thể kết nối máy chủ khi xóa');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredColors = colors.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-xs">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Quản lý & Xóa Bảng Màu Sắc</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-700">
                  {colors.length} màu
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Thêm màu mới (tự sinh mã SKU) hoặc xóa các màu không còn sử dụng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-slate-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Action Bar & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm màu theo tên hoặc mã SKU..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-gray-200 bg-white outline-none focus:border-sky-500 transition"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                showAddForm
                  ? 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                  : 'bg-sky-600 text-white hover:bg-sky-700'
              }`}
            >
              {showAddForm ? (
                <>
                  <X className="w-3.5 h-3.5" /> Đóng form thêm
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> Thêm màu mới
                </>
              )}
            </button>
          </div>

          {/* Collapsible Add Form */}
          {showAddForm && (
            <form
              onSubmit={handleCreateColor}
              className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 space-y-3.5 animate-in slide-in-from-top-2 duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-900 block">Thêm màu mới (Mã SKU tự động)</span>
                {name.trim() && (
                  <span className="text-[11px] font-mono text-sky-700 bg-white px-2 py-0.5 rounded-md border border-sky-200">
                    SKU: {autoSkuCode}
                  </span>
                )}
              </div>

              {/* Preset suggestion */}
              <div className="flex flex-wrap gap-1.5 p-2 bg-white/80 rounded-xl border border-sky-100">
                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mr-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Bảng màu gợi ý:
                </span>
                {POPULAR_FASHION_PRESETS.slice(0, 6).map((preset) => (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => {
                      setName(preset.name);
                      setHexCode(preset.hex);
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-white border border-gray-200 text-slate-700 hover:border-sky-400 transition"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: preset.hex }}
                    />
                    {preset.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Tên màu sắc</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Xanh Rêu, Be / Kem, Hồng Pastel..."
                    className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Mã màu Hex</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={isValidHexCode(hexCode) ? hexCode : '#2E4F4F'}
                      onChange={(e) => setHexCode(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <input
                      type="text"
                      required
                      value={hexCode}
                      onChange={(e) => setHexCode(e.target.value)}
                      placeholder="#2E4F4F"
                      className="w-full text-xs font-mono uppercase px-2.5 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Lưu màu mới
                </button>
              </div>
            </form>
          )}

          {/* Color Table */}
          <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-gray-200 uppercase font-bold text-[10px]">
                  <th className="text-left px-4 py-3">Màu</th>
                  <th className="text-left px-4 py-3">Tên màu</th>
                  <th className="text-left px-4 py-3">Mã SKU (tự động)</th>
                  <th className="text-left px-4 py-3">Mã Hex</th>
                  <th className="text-right px-4 py-3">Thao tác / Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredColors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-400">
                      Không tìm thấy màu sắc nào phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredColors.map((c) => {
                    const isEditing = editingId === c.id;
                    const isDeleting = deletingId === c.id;

                    if (isEditing) {
                      return (
                        <tr key={c.id} className="bg-sky-50/40">
                          <td className="px-4 py-2.5">
                            <input
                              type="color"
                              value={isValidHexCode(editHex) ? editHex : '#000000'}
                              onChange={(e) => setEditHex(e.target.value)}
                              className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full text-xs px-2.5 py-1 rounded border border-gray-200 bg-white focus:border-sky-500 outline-none"
                            />
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-500">{c.code}</td>
                          <td className="px-4 py-2.5">
                            <input
                              type="text"
                              value={editHex}
                              onChange={(e) => setEditHex(e.target.value)}
                              className="w-24 text-xs font-mono uppercase px-2 py-1 rounded border border-gray-200 bg-white focus:border-sky-500 outline-none"
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right space-x-1">
                            <button
                              type="button"
                              disabled={isSavingEdit}
                              onClick={() => saveEdit(c.id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Lưu"
                            >
                              {isSavingEdit ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4 stroke-[2.5]" />
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={isSavingEdit}
                              onClick={cancelEdit}
                              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition"
                              title="Hủy"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-6 h-6 rounded-full border border-gray-300 shadow-2xs inline-block shrink-0"
                              style={{ backgroundColor: c.hex_code || '#CCCCCC' }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{c.name}</td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                            {c.code}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500">{c.hex_code || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEdit(c)}
                              className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                              title="Chỉnh sửa màu"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Prominent Red Delete Button */}
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleDelete(c)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 rounded-lg text-xs font-bold transition disabled:opacity-50"
                              title={`Xóa màu ${c.name}`}
                            >
                              {isDeleting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              <span>Xóa</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2 text-amber-800 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Lưu ý khi xóa:</strong> Màu sắc đang được sử dụng trong các biến thể sản phẩm bán hàng
              sẽ được hệ thống bảo vệ chặn xóa nhằm đảm bảo an toàn cho đơn hàng và dữ liệu kho.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-gray-100 bg-slate-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-gray-200 hover:bg-gray-50 shadow-2xs transition"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Custom Confirmation Popup for Deleting Color */}
      <ConfirmDeleteColorModal
        isOpen={Boolean(colorToDelete)}
        color={colorToDelete}
        isLoading={Boolean(deletingId)}
        onClose={() => {
          if (!deletingId) setColorToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
