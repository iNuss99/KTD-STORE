import React, { useState } from 'react';
import { X, Palette, Loader2, Sparkles, Check } from 'lucide-react';
import { Color } from '../../types';
import { getAdminAuthHeader } from '../../lib/auth-storage';
import { useToast } from '../../context/ToastContext';
import { generateColorSkuCode, isValidHexCode, POPULAR_FASHION_PRESETS } from '../../lib/color-utils';

interface QuickAddColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (color: Color) => void;
}

export const QuickAddColorModal: React.FC<QuickAddColorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showSuccess, showError } = useToast();

  const [name, setName] = useState('');
  const [hexCode, setHexCode] = useState('#2E4F4F');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const autoSkuCode = generateColorSkuCode(name) || 'Tự động';

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (validationError) setValidationError('');
  };

  const handleHexChange = (val: string) => {
    let clean = val.trim();
    if (!clean.startsWith('#') && clean.length > 0) {
      clean = '#' + clean;
    }
    setHexCode(clean);
    if (validationError) setValidationError('');
  };

  const handleSelectPreset = (preset: { name: string; hex: string }) => {
    setName(preset.name);
    setHexCode(preset.hex);
    if (validationError) setValidationError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedHex = hexCode.trim().toUpperCase();

    if (!trimmedName) {
      setValidationError('Vui lòng nhập tên màu sắc.');
      return;
    }
    if (!isValidHexCode(trimmedHex)) {
      setValidationError('Mã Hex không hợp lệ (ví dụ đúng: #2E4F4F hoặc #FFF).');
      return;
    }

    setLoading(true);
    setValidationError('');

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
        const newColor = await res.json();
        showSuccess('Thành công', `Đã thêm màu "${newColor.name}" (SKU: ${newColor.code}) vào hệ thống!`);
        onSuccess(newColor);
        handleClose();
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = err.message || 'Không thể tạo màu mới';
        setValidationError(Array.isArray(msg) ? msg.join(', ') : msg);
        showError('Lỗi thêm màu', Array.isArray(msg) ? msg.join(', ') : msg);
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
    setHexCode('#2E4F4F');
    setValidationError('');
    onClose();
  };

  const isLightColor =
    hexCode.toLowerCase() === '#ffffff' ||
    hexCode.toLowerCase() === '#fff' ||
    name.toLowerCase().includes('trắng');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-xs">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Thêm màu sắc mới</h3>
              <p className="text-xs text-gray-500">Mã SKU sẽ được hệ thống tự động sinh theo tên màu</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-slate-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {validationError}
            </div>
          )}

          {/* Quick Preset Swatches */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Bảng màu thời trang gợi ý
              </label>
              <span className="text-[11px] text-gray-400">Bấm để chọn nhanh</span>
            </div>
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-gray-100">
              {POPULAR_FASHION_PRESETS.map((preset) => (
                <button
                  key={preset.code}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    hexCode.toUpperCase() === preset.hex.toUpperCase()
                      ? 'bg-white border-sky-500 text-sky-700 shadow-xs ring-2 ring-sky-100'
                      : 'bg-white border-gray-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-gray-300 shrink-0"
                    style={{ backgroundColor: preset.hex }}
                  />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Tên màu sắc <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="VD: Xanh Rêu, Be / Kem, Hồng Pastel..."
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all text-slate-800 placeholder:text-gray-400 font-medium"
            />
            {name.trim() && (
              <p className="text-[11px] text-sky-600 font-medium mt-1 flex items-center gap-1">
                <span>Mã SKU tự động:</span>
                <span className="font-mono font-bold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                  {autoSkuCode}
                </span>
              </p>
            )}
          </div>

          {/* Hex Code & Visual Picker */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Chọn màu sắc hiển thị <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={isValidHexCode(hexCode) ? hexCode : '#2E4F4F'}
                onChange={(e) => handleHexChange(e.target.value)}
                className="w-11 h-11 rounded-xl border border-gray-200 cursor-pointer p-0.5 bg-white shadow-xs shrink-0"
                title="Bấm để chọn màu trực quan"
              />
              <div className="flex-1">
                <input
                  type="text"
                  required
                  value={hexCode}
                  onChange={(e) => handleHexChange(e.target.value)}
                  placeholder="#2E4F4F"
                  maxLength={7}
                  className="w-full text-sm font-mono uppercase px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all text-slate-800 font-semibold"
                />
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Bấm ô vuông màu để chọn hoặc gõ mã Hex</p>
          </div>

          {/* Live Preview Box */}
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-gray-200/80 space-y-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Xem trước hiển thị (Live Preview)
            </span>
            <div className="flex flex-wrap items-center gap-4">
              {/* Admin Button Preview */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-400">Nút chọn trong Admin:</span>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600 text-white shadow-xs">
                  <span
                    className="w-3 h-3 rounded-full border border-white/50"
                    style={{ backgroundColor: isValidHexCode(hexCode) ? hexCode : '#2E4F4F' }}
                  />
                  <span>{name || 'Tên màu'}</span>
                </div>
              </div>

              {/* Storefront Swatch Preview */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-400">Ô màu ngoài Cửa hàng:</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-9 h-6 rounded-md border border-slate-300 flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: isValidHexCode(hexCode) ? hexCode : '#2E4F4F' }}
                  >
                    <Check
                      className={`w-3 h-3 stroke-[2.5] ${isLightColor ? 'text-slate-900' : 'text-white'}`}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{name || 'Tên màu'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              disabled={loading}
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-gray-100 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 active:scale-98 transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Palette className="w-4 h-4" />
                  <span>Lưu & Chọn màu này</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
