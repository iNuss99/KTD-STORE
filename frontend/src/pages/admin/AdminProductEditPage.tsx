import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  Loader2,
  ImagePlus,
  Link2,
  Trash2,
  GripVertical,
  Star,
  X,
  Plus,
  Palette,
  Package,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FolderTree,
} from 'lucide-react';
import { Product, Category, Size, Color, Brand, ProductVariant } from '../../types';
import { getAdminAuthHeader } from '../../lib/auth-storage';
import { useToast } from '../../context/ToastContext';
import {
  QuickAddColorModal,
  AdminColorManagerModal,
  ConfirmDeleteVariantModal,
  QuickAddCategoryModal,
  AdminCategoryManagerModal,
} from '../../components';

export const AdminProductEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [showQuickAddColor, setShowQuickAddColor] = useState(false);
  const [showColorManager, setShowColorManager] = useState(false);
  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Product form state
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    slug: string;
    description: string;
    category_id: string;
    base_price: number;
    is_active: boolean;
  }>({
    name: '',
    code: '',
    slug: '',
    description: '',
    category_id: '',
    base_price: 0,
    is_active: true,
  });

  // Images state
  const [images, setImages] = useState<{
    id?: string;
    url: string;
    color_id?: string | null;
    sort_order?: number;
    alt_text?: string;
  }[]>([]);

  // Variants state
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // New variant form
  const [newVariant, setNewVariant] = useState<{
    size_id: string;
    color_id: string;
    stock_quantity: number;
    price_override?: number;
  }>({
    size_id: '',
    color_id: '',
    stock_quantity: 50,
  });

  // Delete variant state
  const [variantToDelete, setVariantToDelete] = useState<ProductVariant | null>(null);
  const [isDeletingVariant, setIsDeletingVariant] = useState(false);

  // Image input & drag state
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  // Load product and lookups
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const headers = getAdminAuthHeader();

        const [cRes, sRes, clRes, pRes] = await Promise.all([
          fetch('/api/categories', { headers }).then((r) => (r.ok ? r.json() : [])),
          fetch('/api/products/sizes', { headers }).then((r) => (r.ok ? r.json() : [])),
          fetch('/api/products/colors', { headers }).then((r) => (r.ok ? r.json() : [])),
          fetch(`/api/products/${id}`, { headers }).then((r) => (r.ok ? r.json() : null)),
        ]);

        setCategories(Array.isArray(cRes) ? cRes : []);
        setSizes(Array.isArray(sRes) ? sRes : []);
        setColors(Array.isArray(clRes) ? clRes : []);

        if (pRes) {
          setFormData({
            name: pRes.name || '',
            code: pRes.code || '',
            slug: pRes.slug || '',
            description: pRes.description || '',
            category_id: pRes.category_id || '',
            base_price: Number(pRes.base_price) || 0,
            is_active: pRes.is_active !== undefined ? pRes.is_active : true,
          });

          if (pRes.images && pRes.images.length > 0) {
            setImages(
              pRes.images.map((img: any, idx: number) => ({
                id: img.id,
                url: img.url,
                color_id: img.color_id || null,
                sort_order: img.sort_order ?? idx,
                alt_text: img.alt_text,
              }))
            );
          }

          if (pRes.variants && pRes.variants.length > 0) {
            setVariants(pRes.variants);
          }
        } else {
          showError('Lỗi', 'Không tìm thấy sản phẩm');
          navigate('/admin/catalog');
        }
      } catch (err: any) {
        showError('Lỗi', err.message || 'Không thể tải dữ liệu sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  // Image actions
  const encodeFilesToBase64 = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const oversized = fileArr.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setUploadError(`${oversized.length} ảnh vượt quá 2MB`);
      return;
    }
    setUploadError('');
    const validFiles = fileArr.filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    Promise.all(
      validFiles.map(
        (f) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(f);
          })
      )
    ).then((results) => {
      setImages((prev) => [
        ...prev,
        ...results.map((url) => ({ url, color_id: null, sort_order: prev.length })),
      ]);
    });
  }, []);

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      setUrlError('URL không hợp lệ');
      return;
    }
    setUrlError('');
    setImages((prev) => [...prev, { url, color_id: null, sort_order: prev.length }]);
    setUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageColorChange = (index: number, colorId: string) => {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, color_id: colorId ? colorId : null } : img))
    );
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newList = [...images];
    const [moved] = newList.splice(dragIndex, 1);
    newList.splice(index, 0, moved);
    setDragIndex(index);
    setImages(newList);
  };
  const handleDragEnd = () => setDragIndex(null);

  // Variant actions
  const handleUpdateVariantStock = (vId: string, stock: number) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === vId ? { ...v, stock_quantity: Math.max(0, stock) } : v))
    );
  };

  const handleUpdateVariantPrice = (vId: string, price: number | undefined) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === vId ? { ...v, price_override: price } : v))
    );
  };

  const handleToggleVariantActive = (vId: string) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === vId ? { ...v, is_active: !v.is_active } : v))
    );
  };

  const handleDeleteVariant = (v: ProductVariant) => {
    setVariantToDelete(v);
  };

  const handleConfirmDeleteVariant = async () => {
    if (!variantToDelete || !id) return;
    setIsDeletingVariant(true);
    try {
      const headers = getAdminAuthHeader();
      const res = await fetch(`/api/products/${id}/variants/${variantToDelete.id}`, {
        method: 'DELETE',
        headers,
      });

      if (res.ok) {
        setVariants((prev) => prev.filter((v) => v.id !== variantToDelete.id));
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['product', id] });
        showSuccess('Thành công', `Đã xóa biến thể ${variantToDelete.sku}!`);
        setVariantToDelete(null);
      } else {
        const err = await res.json().catch(() => ({}));
        showError('Không thể xóa biến thể', err.message || 'Lỗi khi xóa biến thể');
      }
    } catch (err: any) {
      showError('Lỗi mạng', err.message || 'Không thể kết nối đến máy chủ');
    } finally {
      setIsDeletingVariant(false);
    }
  };

  const handleAddNewVariant = async () => {
    if (!newVariant.size_id || !newVariant.color_id) {
      showError('Thiếu thông tin', 'Vui lòng chọn cả Size và Màu để thêm biến thể');
      return;
    }
    const exists = variants.some(
      (v) => v.size_id === newVariant.size_id && v.color_id === newVariant.color_id
    );
    if (exists) {
      showError('Biến thể đã có', 'Cặp Size và Màu này đã tồn tại trong sản phẩm!');
      return;
    }

    try {
      const headers = getAdminAuthHeader();
      const res = await fetch(`/api/products/${id}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          size_id: newVariant.size_id,
          color_id: newVariant.color_id,
          stock_quantity: Number(newVariant.stock_quantity) || 0,
          price_override: newVariant.price_override ? Number(newVariant.price_override) : undefined,
        }),
      });

      if (res.ok) {
        showSuccess('Thành công', 'Đã thêm biến thể mới!');
        // Reset form thêm biến thể mới
        setNewVariant({ size_id: '', color_id: '', stock_quantity: 50, price_override: undefined });
        // Làm mới cache React Query
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['product', id] });

        // Reload product details to get full relations for new variant
        const reloadRes = await fetch(`/api/products/${id}`, { headers });
        if (reloadRes.ok) {
          const fresh = await reloadRes.json();
          setVariants(fresh.variants || []);
        }
      } else {
        const err = await res.json();
        showError('Không thể thêm biến thể', err.message || 'Lỗi khi tạo biến thể');
      }
    } catch (err: any) {
      showError('Lỗi mạng', err.message || 'Không thể kết nối đến máy chủ');
    }
  };

  // Submit all product changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      const headers = getAdminAuthHeader();

      // Tự động kiểm tra nếu có biến thể đang chọn dở ở ô "THÊM BIẾN THỂ MỚI" thì tự gộp vào để lưu luôn
      const hasPendingNewVariant =
        Boolean(newVariant.size_id && newVariant.color_id) &&
        !variants.some(
          (v) => v.size_id === newVariant.size_id && v.color_id === newVariant.color_id
        );

      const allVariantsPayload = [
        ...variants.map((v) => ({
          id: v.id,
          stock_quantity: Number(v.stock_quantity),
          price_override: v.price_override ? Number(v.price_override) : undefined,
          is_active: v.is_active,
        })),
        ...(hasPendingNewVariant
          ? [
              {
                size_id: newVariant.size_id,
                color_id: newVariant.color_id,
                stock_quantity: Number(newVariant.stock_quantity) || 50,
                price_override: newVariant.price_override ? Number(newVariant.price_override) : undefined,
                is_active: true,
              },
            ]
          : []),
      ];

      const payload = {
        name: formData.name,
        code: formData.code,
        slug: formData.slug,
        description: formData.description,
        category_id: formData.category_id,
        base_price: Number(formData.base_price),
        is_active: formData.is_active,
        images: images.map((img, idx) => ({
          url: img.url,
          color_id: img.color_id || null,
          sort_order: idx,
          alt_text: img.alt_text,
        })),
        variants: allVariantsPayload,
      };

      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        // Invalidate React Query cache trên toàn ứng dụng
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['product', id] });
        if (formData.slug) {
          queryClient.invalidateQueries({ queryKey: ['product', formData.slug] });
        }

        if (updated.images) {
          setImages(
            updated.images.map((img: any, idx: number) => ({
              id: img.id,
              url: img.url,
              color_id: img.color_id || null,
              sort_order: img.sort_order ?? idx,
              alt_text: img.alt_text,
            }))
          );
        }
        if (updated.variants) {
          setVariants(updated.variants);
        }
        // Reset form biến thể mới
        setNewVariant({ size_id: '', color_id: '', stock_quantity: 50, price_override: undefined });

        showSuccess('Cập nhật thành công', `Đã lưu sản phẩm "${formData.name}"! Đang chuyển về danh mục...`);

        // Tự động chuyển về trang danh mục sản phẩm theo yêu cầu người dùng
        setTimeout(() => {
          navigate('/admin/catalog');
        }, 800);
      } else {
        const err = await res.json();
        showError('Lỗi lưu sản phẩm', err.message || 'Không thể cập nhật sản phẩm');
      }
    } catch (err: any) {
      showError('Lỗi mạng', err.message || 'Lỗi kết nối khi lưu sản phẩm');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/catalog"
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition"
            title="Quay lại danh mục"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Chỉnh sửa: {formData.name}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                  formData.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {formData.is_active ? 'Đang bán' : 'Vô hiệu hóa'}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono mt-0.5">Mã: {formData.code} — ID: {id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={`/products/${id}`}
            target="_blank"
            className="px-3.5 py-2 border border-gray-200 hover:bg-gray-50 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Xem trên Web
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-sky-600" /> Thông tin cơ bản
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Tên sản phẩm (*)</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Danh mục (*)</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowCategoryManager(true)}
                    className="text-xs font-medium text-slate-500 hover:text-sky-600 inline-flex items-center gap-1 transition-colors cursor-pointer"
                    title="Quản lý danh sách danh mục (xem, sửa, xóa)"
                  >
                    <FolderTree className="w-3.5 h-3.5 text-sky-500" /> Quản lý danh mục
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddCategory(true)}
                    className="text-xs font-medium text-sky-600 hover:text-sky-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
                    title="Thêm nhanh danh mục mới"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm
                  </button>
                </div>
              </div>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                required
                className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition bg-white"
              >
                <option value="">Chọn danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Mã sản phẩm (Code)</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Slug URL</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Giá cơ bản (VNĐ) (*)</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
                required
                className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition font-mono font-bold text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Mô tả chi tiết</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition resize-none"
              placeholder="Nhập mô tả chất liệu, kiểu dáng, điểm nhấn..."
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <span className="text-xs font-bold text-gray-700 block">Trạng thái bán</span>
              <span className="text-[11px] text-gray-400">Cho phép khách hàng tìm thấy và đặt mua sản phẩm</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>
        </div>

        {/* Section 2: Image Management with Color Assignment */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-sky-600" /> Quản lý hình ảnh & Gán màu sắc
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowColorManager(true)}
                className="text-xs font-medium text-slate-500 hover:text-sky-600 inline-flex items-center gap-1 transition-colors"
                title="Mở bảng quản lý để xem, sửa hoặc xóa màu"
              >
                <Palette className="w-3.5 h-3.5 text-sky-500" /> Quản lý bảng màu
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => setShowQuickAddColor(true)}
                className="text-xs font-medium text-sky-600 hover:text-sky-700 inline-flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm màu
              </button>
              <span className="text-xs text-gray-400 font-mono ml-1">{images.length} hình ảnh</span>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Chọn màu sắc cụ thể cho từng ảnh để khách hàng khi bấm chọn màu sẽ tự động nhìn thấy ảnh đó. Ảnh để "Ảnh dùng chung" sẽ hiển thị cho tất cả các màu.
          </p>

          {/* Add Image Controls */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Dán URL hình ảnh mới vào đây..."
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    setUrlError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
                  className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleAddUrl}
                className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shrink-0"
              >
                Thêm URL
              </button>
            </div>
            {urlError && <p className="text-[11px] text-rose-500">{urlError}</p>}

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files?.length) encodeFilesToBase64(e.dataTransfer.files);
              }}
              className={`flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-xl py-4 cursor-pointer transition-colors ${
                isDragOver ? 'border-sky-400 bg-sky-50' : 'border-gray-200 bg-gray-50 hover:border-sky-300 hover:bg-sky-50/50'
              }`}
            >
              <ImagePlus className={`w-6 h-6 ${isDragOver ? 'text-sky-500' : 'text-gray-400'}`} />
              <span className="text-[11px] text-gray-500 font-medium">
                Kéo thả ảnh hoặc <span className="text-sky-600 font-bold">tải lên từ máy tính</span>
              </span>
              <span className="text-[10px] text-gray-400">JPG, PNG, WEBP — tối đa 2MB/ảnh</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && encodeFilesToBase64(e.target.files)}
            />
            {uploadError && <p className="text-[11px] text-rose-500">{uploadError}</p>}
          </div>

          {/* Images Grid */}
          {images.length > 0 ? (
            <div className="space-y-2 pt-2">
              <p className="text-[10px] text-gray-400 font-medium uppercase">
                Kéo thả để sắp xếp — Ảnh đầu tiên (ĐD) làm ảnh đại diện sản phẩm
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 items-start">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`relative group rounded-xl overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all bg-white flex flex-col h-fit ${
                      dragIndex === idx
                        ? 'border-sky-400 shadow-lg scale-105 opacity-70'
                        : idx === 0
                        ? 'border-amber-400 ring-1 ring-amber-400'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="relative aspect-square w-full bg-gray-100 overflow-hidden shrink-0">
                      <img
                        src={img.url}
                        alt={`Ảnh ${idx + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><text y=%2218%22 font-size=%2216%22>🖼️</text></svg>';
                        }}
                      />
                      {idx === 0 && (
                        <div className="absolute top-1 left-1 bg-amber-400 rounded-md px-1.5 py-0.5 flex items-center gap-1 shadow-xs z-10 pointer-events-none">
                          <Star className="w-2.5 h-2.5 text-white fill-white" />
                          <span className="text-[9px] text-white font-bold">Đại diện</span>
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition p-1 bg-black/40 rounded text-white pointer-events-none z-10">
                        <GripVertical className="w-3.5 h-3.5 text-white drop-shadow" />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-rose-500 hover:bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition flex items-center justify-center shadow-xs z-10 cursor-pointer"
                        title="Xóa ảnh này"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Color selection dropdown for this image */}
                    <div className="p-2 bg-gray-50 border-t border-gray-100 space-y-1 w-full shrink-0">
                      <label className="text-[10px] font-bold text-gray-500 uppercase block tracking-wide">Gán màu sắc:</label>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full border border-gray-300 shrink-0 shadow-2xs"
                          style={{
                            backgroundColor:
                              colors.find((c) => c.id === img.color_id)?.hex_code || '#cbd5e1',
                          }}
                        />
                        <select
                          value={img.color_id || ''}
                          onChange={(e) => handleImageColorChange(idx, e.target.value)}
                          className="w-full text-xs py-1 px-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer truncate"
                        >
                          <option value="">Ảnh dùng chung</option>
                          {colors.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 border border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-xs">
              Sản phẩm chưa có hình ảnh nào. Hãy dán URL hoặc tải ảnh lên.
            </div>
          )}
        </div>

        {/* Section 3: Variants & Stock Management */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-sky-600" /> Biến thể sản phẩm & Tồn kho
            </h2>
            <span className="text-xs text-gray-400 font-mono">{variants.length} SKU</span>
          </div>

          {/* Existing Variants Table */}
          {variants.length > 0 ? (
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold">
                  <tr>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Size</th>
                    <th className="p-3">Màu sắc</th>
                    <th className="p-3 w-32">Kho (SL)</th>
                    <th className="p-3 w-40">Giá riêng (VNĐ)</th>
                    <th className="p-3 text-center w-24">Trạng thái</th>
                    <th className="p-3 text-center w-16">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-slate-700">
                  {variants.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50/60 transition">
                      <td className="p-3 font-mono font-bold text-slate-800">{v.sku}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-gray-100 text-slate-700 rounded font-bold">
                          {v.size?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-full border border-gray-300"
                            style={{ backgroundColor: v.color?.hex_code || '#cbd5e1' }}
                          />
                          <span>{v.color?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min={0}
                          value={v.stock_quantity}
                          onChange={(e) => handleUpdateVariantStock(v.id, Number(e.target.value))}
                          className="w-full text-xs p-1.5 rounded-lg border border-gray-200 focus:ring-1 focus:ring-sky-500 font-mono outline-none"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          placeholder="Kế thừa giá gốc"
                          value={v.price_override ?? ''}
                          onChange={(e) =>
                            handleUpdateVariantPrice(
                              v.id,
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                          className="w-full text-xs p-1.5 rounded-lg border border-gray-200 focus:ring-1 focus:ring-sky-500 font-mono outline-none"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleVariantActive(v.id)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition ${
                            v.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {v.is_active ? 'Bán' : 'Tắt'}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteVariant(v)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition inline-flex items-center justify-center cursor-pointer"
                          title={`Xóa biến thể ${v.sku}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-400 p-4 border border-dashed rounded-xl text-center">
              Chưa có biến thể nào. Bạn có thể thêm biến thể bên dưới.
            </p>
          )}

          {/* Add New Variant Box */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase block">Thêm biến thể mới</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Chọn Size</label>
                <select
                  value={newVariant.size_id}
                  onChange={(e) => setNewVariant({ ...newVariant, size_id: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">-- Chọn Size --</option>
                  {sizes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Chọn Màu</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowColorManager(true)}
                      className="text-[10px] font-medium text-slate-500 hover:text-sky-600 inline-flex items-center gap-0.5"
                      title="Mở bảng quản lý để xem, sửa hoặc xóa màu"
                    >
                      <Palette className="w-2.5 h-2.5 text-sky-500" /> Bảng màu
                    </button>
                    <span className="text-gray-300 text-[10px]">|</span>
                    <button
                      type="button"
                      onClick={() => setShowQuickAddColor(true)}
                      className="text-[10px] font-medium text-sky-600 hover:text-sky-700 inline-flex items-center gap-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" /> Thêm
                    </button>
                  </div>
                </div>
                <select
                  value={newVariant.color_id}
                  onChange={(e) => setNewVariant({ ...newVariant, color_id: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">-- Chọn Màu --</option>
                  {colors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Số lượng kho</label>
                <input
                  type="number"
                  min={0}
                  value={newVariant.stock_quantity}
                  onChange={(e) =>
                    setNewVariant({ ...newVariant, stock_quantity: Number(e.target.value) })
                  }
                  className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white font-mono outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddNewVariant}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm biến thể
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Floating / Bottom Save Bar */}
        <div className="sticky bottom-4 z-20 flex justify-end gap-3 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-gray-200 shadow-lg">
          <Link
            to="/admin/catalog"
            className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            Quay lại danh mục
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Đang lưu sản phẩm...' : 'Lưu tất cả thay đổi'}
          </button>
        </div>
      </form>

      {/* Quick Add Color Modal */}
      <QuickAddColorModal
        isOpen={showQuickAddColor}
        onClose={() => setShowQuickAddColor(false)}
        onSuccess={(newColor) => {
          setColors((prev) => {
            if (prev.some((c) => c.id === newColor.id)) return prev;
            return [...prev, newColor].sort((a, b) => a.name.localeCompare(b.name));
          });
          setNewVariant((prev) => ({ ...prev, color_id: newColor.id }));
        }}
      />

      {/* Admin Color Manager Modal */}
      <AdminColorManagerModal
        isOpen={showColorManager}
        onClose={() => setShowColorManager(false)}
        colors={colors}
        onColorsChange={(updatedColors) => {
          setColors(updatedColors);
        }}
      />

      {/* Confirm Delete Variant Modal */}
      <ConfirmDeleteVariantModal
        isOpen={Boolean(variantToDelete)}
        variant={variantToDelete}
        onClose={() => setVariantToDelete(null)}
        onConfirm={handleConfirmDeleteVariant}
        isLoading={isDeletingVariant}
      />

      {/* Quick Add Category Modal */}
      <QuickAddCategoryModal
        isOpen={showQuickAddCategory}
        onClose={() => setShowQuickAddCategory(false)}
        onSuccess={(newCat) => {
          setCategories((prev) => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
          setFormData((prev) => ({ ...prev, category_id: newCat.id }));
        }}
        parentCategories={categories}
      />

      {/* Admin Category Manager Modal */}
      <AdminCategoryManagerModal
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        categories={categories}
        onCategoriesChange={(updatedCategories) => {
          setCategories(updatedCategories);
          if (!updatedCategories.some((c) => c.id === formData.category_id)) {
            setFormData((prev) => ({ ...prev, category_id: '' }));
          }
        }}
      />
    </div>
  );
};
