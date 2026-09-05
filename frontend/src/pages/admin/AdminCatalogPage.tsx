import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Package,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  X,
  Link2,
  ImagePlus,
  Star,
  GripVertical,
  Plus,
  Edit,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Brand, Category, Size, Color, Product } from '../../types';
import { getAdminAuthHeader } from '../../lib/auth-storage';
import { useToast } from '../../context/ToastContext';

export const AdminCatalogPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [autoCreating, setAutoCreating] = useState(false);
  const isAutoCreatingRef = useRef(false);

  // Form submitting state
  const [isCreating, setIsCreating] = useState(false);
  const isCreatingRef = useRef(false);

  // Bulk selection & deletion state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState<{
    name: string;
    description: string;
    category_id: string;
    base_price: number;
    images: { url: string; color_id?: string }[];
    size_ids: string[];
    color_ids: string[];
    is_active: boolean;
  }>({
    name: '',
    description: '',
    category_id: '',
    base_price: 250000,
    images: [],
    size_ids: [],
    color_ids: [],
    is_active: true,
  });
  // key: "sizeId|colorId", value: stock quantity
  const [variantStocks, setVariantStocks] = useState<Record<string, number>>({});

  // Image manager state
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  const encodeFilesToBase64 = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const oversized = fileArr.filter(f => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setUploadError(`${oversized.length} ảnh vượt quá 2MB: ${oversized.map(f => f.name).join(', ')}`);
      return;
    }
    setUploadError('');
    const validFiles = fileArr.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;
    Promise.all(
      validFiles.map(f => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(f);
      }))
    ).then(results => {
      setProductForm(prev => ({
        ...prev,
        images: [...prev.images, ...results.map(url => ({ url, color_id: undefined }))],
      }));
    });
  }, []);

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    try { new URL(url); } catch { setUrlError('URL không hợp lệ'); return; }
    setUrlError('');
    setProductForm(prev => ({ ...prev, images: [...prev.images, { url, color_id: undefined }] }));
    setUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setProductForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleImageColorChange = (index: number, colorId: string) => {
    setProductForm(prev => ({
      ...prev,
      images: prev.images.map((img, i) => (i === index ? { ...img, color_id: colorId || undefined } : img)),
    }));
  };

  // Drag-and-drop reorder
  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newList = [...productForm.images];
    const [moved] = newList.splice(dragIndex, 1);
    newList.splice(index, 0, moved);
    setDragIndex(index);
    setProductForm(prev => ({ ...prev, images: newList }));
  };
  const handleDragEnd = () => setDragIndex(null);

  // Drop zone
  const handleDropZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) encodeFilesToBase64(e.dataTransfer.files);
  };

  const refreshProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const headers = getAdminAuthHeader();
      const res = await fetch('/api/products', { headers });
      if (res.ok) {
        const pRes = await res.json();
        setProducts(pRes?.data || []);
      }
    } catch (err) {
      console.error('Lỗi tải sản phẩm:', err);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const loadAll = async () => {
    try {
      setLoadingProducts(true);
      const headers = getAdminAuthHeader();
      const [cRes, sRes, clRes, pRes] = await Promise.all([
        fetch('/api/categories', { headers }).then((r) => r.json()),
        fetch('/api/products/sizes', { headers }).then((r) => r.json()),
        fetch('/api/products/colors', { headers }).then((r) => r.json()),
        fetch('/api/products', { headers }).then((r) => r.json()),
      ]);

      setCategories(Array.isArray(cRes) ? cRes : []);
      setSizes(Array.isArray(sRes) ? sRes : []);
      setColors(Array.isArray(clRes) ? clRes : []);
      setProducts(pRes?.data || []);

      if (sRes?.length > 0) setProductForm((f) => ({ ...f, size_ids: [sRes[0].id] }));
      if (clRes?.length > 0) setProductForm((f) => ({ ...f, color_ids: [clRes[0].id] }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAutoCreateProduct = async () => {
    if (isAutoCreatingRef.current) return;
    isAutoCreatingRef.current = true;
    setAutoCreating(true);
    setMsg(null);
    try {
      const presets = [
        {
          name: 'Áo Suit Blazer Nam Lịch Lãm Premium',
          code: `SUIT-${Date.now().toString().slice(-4)}`,
          base_price: 1250000,
          description: 'Áo Blazer nam thiết kế chuẩn phong cách Ý, chất liệu dạ cao cấp đứng dáng, phù hợp công sở và sự kiện.',
          image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80',
        },
        {
          name: 'Áo Sơ Mi Nam Cotton Linen Cao Cấp',
          code: `SHIRT-${Date.now().toString().slice(-4)}`,
          base_price: 550000,
          description: 'Sơ mi Cotton Linen thoáng mát, thiết kế ôm vừa vặn thanh lịch, không nhăn.',
          image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80',
        },
        {
          name: 'Quần Âu Nam Slimfit Cao Cấp',
          code: `TROUSER-${Date.now().toString().slice(-4)}`,
          base_price: 680000,
          description: 'Quần tây nam form Slimfit tôn dáng, chất liệu co giãn nhẹ tạo cảm giác thoải mái cả ngày.',
          image_url: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=600&q=80',
        },
        {
          name: 'Áo Khoác Bomber Nam Da Thật Classic',
          code: `JACKET-${Date.now().toString().slice(-4)}`,
          base_price: 1890000,
          description: 'Bomber nam thiết kế hiện đại, khóa kéo đồng sang trọng, giữ ấm tốt trong mùa đông.',
          image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80',
        },
      ];

      const item = presets[Math.floor(Math.random() * presets.length)];
      const selectedCategory = categories[0]?.id || undefined;
      const selectedSize = sizes[0]?.id || undefined;
      const selectedColor = colors[0]?.id || undefined;

      const slug = item.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-') + `-${Date.now().toString().slice(-4)}`;

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeader() },
        body: JSON.stringify({
          name: item.name,
          code: item.code,
          slug,
          description: item.description,
          category_id: selectedCategory,
          base_price: item.base_price,
          image_urls: [item.image_url],
          variants: [
            {
              size_id: selectedSize,
              color_id: selectedColor,
              stock_quantity: 50,
            },
          ],
        }),
      });

      if (res.ok) {
        showSuccess('Tự động tạo sản phẩm thành công!', `Đã thêm "${item.name}" (Mã: ${item.code})`);
        await refreshProducts();
      } else {
        const errData = await res.json();
        showError('Không thể tạo sản phẩm', errData.message || 'Lỗi khi tự động tạo sản phẩm');
      }
    } catch (err: any) {
      showError('Lỗi mạng', err.message || 'Có lỗi xảy ra khi tự động thêm sản phẩm');
    } finally {
      setAutoCreating(false);
      isAutoCreatingRef.current = false;
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingRef.current) return;
    isCreatingRef.current = true;
    setIsCreating(true);
    setMsg(null);
    try {
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const code = `SP-${Date.now().toString().slice(-4)}-${randomStr}`;
      const slug = productForm.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-') + `-${Date.now().toString().slice(-4)}`;

      const variantsToCreate: any[] = [];
      const sizeList = productForm.size_ids.length > 0 ? productForm.size_ids : [null];
      const colorList = productForm.color_ids.length > 0 ? productForm.color_ids : [null];

      sizeList.forEach(sId => {
        colorList.forEach(cId => {
          if (sId || cId) {
            const key = `${sId || ''}|${cId || ''}`;
            variantsToCreate.push({
              size_id: sId || undefined,
              color_id: cId || undefined,
              stock_quantity: variantStocks[key] ?? 50,
            });
          }
        });
      });

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeader() },
        body: JSON.stringify({
          name: productForm.name,
          code,
          slug,
          description: productForm.description,
          category_id: productForm.category_id,
          base_price: Number(productForm.base_price),
          is_active: productForm.is_active,
          images: productForm.images.map((img, idx) => ({
            url: img.url,
            color_id: img.color_id || undefined,
            sort_order: idx,
          })),
          variants: variantsToCreate,
        }),
      });
      if (res.ok) {
        showSuccess('Thành công', 'Tạo sản phẩm mới thành công!');
        setProductForm((f) => ({ ...f, name: '', description: '', images: [] }));
        setVariantStocks({});
        setUrlInput('');
        setShowProductModal(false);
        await refreshProducts();
      } else {
        const err = await res.json();
        showError('Lỗi tạo sản phẩm', err.message || 'Không thể tạo sản phẩm');
      }
    } catch (err) {
      showError('Lỗi mạng', 'Lỗi kết nối khi tạo sản phẩm');
    } finally {
      setIsCreating(false);
      isCreatingRef.current = false;
    }
  };

  const handleQuickDelete = async (id: string, name: string) => {
    if (deletingId === id) return;
    const prevProducts = [...products];
    const prevSelected = [...selectedProductIds];

    // Optimistic UI: Gỡ sản phẩm khỏi danh sách ngay lập tức
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setSelectedProductIds((prev) => prev.filter((pId) => pId !== id));
    setDeletingId(id);

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: getAdminAuthHeader(),
      });
      if (res.ok) {
        showSuccess('Đã xóa', `Đã xóa sản phẩm "${name}"`);
      } else {
        const err = await res.json().catch(() => ({}));
        setProducts(prevProducts);
        setSelectedProductIds(prevSelected);
        showError('Lỗi xóa sản phẩm', err.message || 'Không thể xóa sản phẩm này');
      }
    } catch (err) {
      setProducts(prevProducts);
      setSelectedProductIds(prevSelected);
      showError('Lỗi mạng', 'Không thể kết nối đến máy chủ khi xóa');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectAll = () => {
    if (selectedProductIds.length === products.length && products.length > 0) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0 || isBulkDeleting) return;
    const idsToDelete = [...selectedProductIds];
    const prevProducts = [...products];

    // Optimistic UI: Gỡ tất cả sản phẩm được chọn khỏi bảng ngay lập tức
    setProducts((prev) => prev.filter((p) => !idsToDelete.includes(p.id)));
    setSelectedProductIds([]);
    setIsBulkDeleting(true);

    try {
      const headers = getAdminAuthHeader();
      const results = await Promise.allSettled(
        idsToDelete.map((id) =>
          fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers,
          }).then((res) => {
            if (!res.ok) throw new Error(`Lỗi xóa sản phẩm ${id}`);
            return id;
          })
        )
      );

      const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
      const rejected = results.filter((r) => r.status === 'rejected').length;

      if (rejected === 0) {
        showSuccess('Xóa hàng loạt thành công', `Đã xóa ${fulfilled} sản phẩm`);
      } else {
        showError(
          'Một số sản phẩm chưa xóa được',
          `Đã xóa thành công ${fulfilled}/${idsToDelete.length} sản phẩm`
        );
        await refreshProducts();
      }
    } catch (err) {
      setProducts(prevProducts);
      setSelectedProductIds(idsToDelete);
      showError('Lỗi mạng', 'Không thể hoàn tất xóa hàng loạt');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="flex flex-col font-sans relative">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-sky-600" /> Quản lý Sản phẩm & Catalog
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Quản lý danh mục và tạo thông tin cơ bản cho sản phẩm.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowProductModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2"
            >
              <Package className="w-4 h-4" /> + Thêm sản phẩm
            </button>
            <button
              onClick={handleAutoCreateProduct}
              disabled={autoCreating}
              className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2 border border-sky-500/20 disabled:opacity-50"
              title="Tự động khởi tạo sản phẩm thời trang cao cấp mẫu vào hệ thống"
            >
              {autoCreating ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-300" />
              )}
              + Tự động thêm sản phẩm mẫu
            </button>
          </div>
        </div>

        {msg && (
          <div
            className={`p-4 rounded-xl flex items-center gap-2 text-sm font-medium ${
              msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {msg.text}
          </div>
        )}

        {/* Existing Products List */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-900">Danh sách sản phẩm hiện có</h3>
              <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
                {products.length} sản phẩm
              </span>
              {loadingProducts && <Loader2 className="w-4 h-4 animate-spin text-sky-600" />}
            </div>

            {selectedProductIds.length > 0 && (
              <div className="flex items-center gap-3 bg-sky-50 border border-sky-200 py-1.5 px-3 rounded-xl animate-in fade-in">
                <span className="text-xs font-semibold text-sky-900">
                  Đã chọn <strong className="text-sky-600">{selectedProductIds.length}</strong> mục
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedProductIds([])}
                  className="text-xs text-gray-500 hover:text-slate-800 underline"
                >
                  Bỏ chọn
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5"
                >
                  {isBulkDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Xóa các mục đã chọn
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={products.length > 0 && selectedProductIds.length === products.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                      title="Chọn tất cả"
                    />
                  </th>
                  <th className="p-3">Sản phẩm</th>
                  <th className="p-3">Mã Code</th>
                  <th className="p-3">Danh mục</th>
                  <th className="p-3">Giá cơ bản</th>
                  <th className="p-3">Số biến thể</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      {loadingProducts ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
                          <span>Đang tải danh sách sản phẩm...</span>
                        </div>
                      ) : (
                        'Chưa có sản phẩm nào trong hệ thống.'
                      )}
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr
                      key={p.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        selectedProductIds.includes(p.id) ? 'bg-sky-50/40' : ''
                      }`}
                    >
                      <td className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(p.id)}
                          onChange={() => handleToggleSelect(p.id)}
                          className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{p.name}</td>
                      <td className="p-3 font-mono">{p.code}</td>
                      <td className="p-3">{p.category?.name}</td>
                      <td className="p-3 font-bold">{new Intl.NumberFormat('vi-VN').format(p.base_price)} đ</td>
                      <td className="p-3 font-semibold">{p.variants?.length || 0} SKU</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {p.is_active ? 'Hoạt động' : 'Đã vô hiệu hóa'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <Link
                            to={`/admin/products/${p.id}/edit`}
                            className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors inline-flex items-center justify-center"
                            title="Chỉnh sửa chi tiết sản phẩm và ảnh theo màu"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleQuickDelete(p.id, p.name)}
                            disabled={deletingId === p.id}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center justify-center disabled:opacity-50"
                            title="Xóa nhanh sản phẩm"
                          >
                            {deletingId === p.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODALS */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] overflow-hidden border border-gray-100">
            {/* STICKY HEADER */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-sky-600" /> Thêm sản phẩm mới
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* FORM BODY (2 COLUMNS) */}
            <form id="create-product-form" onSubmit={handleCreateProduct} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* LEFT COLUMN: Basic Info & Image */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Tên sản phẩm (*)</label>
                    <input
                      type="text"
                      placeholder="VD: Áo thun Polo cao cấp"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      required
                      className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Mô tả ngắn sản phẩm</label>
                    <textarea
                      rows={3}
                      placeholder="VD: Áo sơ mi nam chất liệu Cotton cao cấp, kiểu dáng hiện đại thanh lịch..."
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition resize-none"
                    />
                  </div>

                  {/* ===== IMAGE MANAGER ===== */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Hình ảnh sản phẩm</label>

                    {/* URL input row */}
                    <div className="flex gap-2 mb-2">
                      <div className="relative flex-1">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Dán URL ảnh vào đây..."
                          value={urlInput}
                          onChange={e => { setUrlInput(e.target.value); setUrlError(''); }}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
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
                    {urlError && <p className="text-[11px] text-rose-500 mb-1.5">{urlError}</p>}

                    {/* Drop zone */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDropZoneDrop}
                      className={`flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-xl py-4 cursor-pointer transition-colors ${
                        isDragOver ? 'border-sky-400 bg-sky-50' : 'border-gray-200 bg-gray-50 hover:border-sky-300 hover:bg-sky-50/50'
                      }`}
                    >
                      <ImagePlus className={`w-6 h-6 ${isDragOver ? 'text-sky-500' : 'text-gray-400'}`} />
                      <span className="text-[11px] text-gray-500 font-medium">
                        Kéo thả ảnh hoặc <span className="text-sky-600 font-bold">chọn từ máy</span>
                      </span>
                      <span className="text-[10px] text-gray-400">JPG, PNG, WEBP — tối đa 2MB/ảnh</span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={e => e.target.files && encodeFilesToBase64(e.target.files)}
                    />
                    {uploadError && <p className="text-[11px] text-rose-500 mt-1">{uploadError}</p>}

                    {/* Image grid with drag-to-reorder and color assignment */}
                    {productForm.images.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-[10px] text-gray-400 font-medium uppercase">Kéo thả để sắp xếp — Gán màu cho từng ảnh (tùy chọn)</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {productForm.images.map((imgItem, idx) => (
                            <div
                              key={idx}
                              draggable
                              onDragStart={() => handleDragStart(idx)}
                              onDragOver={e => handleDragOver(e, idx)}
                              onDragEnd={handleDragEnd}
                              className={`relative group rounded-xl overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all bg-white flex flex-col ${
                                dragIndex === idx
                                  ? 'border-sky-400 shadow-lg scale-105 opacity-70'
                                  : idx === 0
                                  ? 'border-amber-400'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="aspect-square bg-gray-100 relative">
                                <img
                                  src={imgItem.url}
                                  alt={`Ảnh ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={e => (e.currentTarget.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><text y=%2218%22 font-size=%2216%22>🖼️</text></svg>')}
                                />
                                {/* Thumbnail badge */}
                                {idx === 0 && (
                                  <div className="absolute top-0.5 left-0.5 bg-amber-400 rounded-md px-1 py-0.5 flex items-center gap-0.5 shadow-xs">
                                    <Star className="w-2 h-2 text-white fill-white" />
                                    <span className="text-[8px] text-white font-bold">ĐD</span>
                                  </div>
                                )}
                                {/* Drag handle */}
                                <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition">
                                  <GripVertical className="w-3 h-3 text-white drop-shadow" />
                                </div>
                                {/* Remove button */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(idx)}
                                  className="absolute bottom-0.5 right-0.5 w-5 h-5 bg-rose-500 hover:bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition flex items-center justify-center shadow"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Color dropdown */}
                              <div className="p-1 bg-gray-50 border-t border-gray-100">
                                <select
                                  value={imgItem.color_id || ''}
                                  onChange={e => handleImageColorChange(idx, e.target.value)}
                                  className="w-full text-[10px] py-1 px-1 rounded border border-gray-200 bg-white text-gray-700 outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                                  title="Chọn màu tương ứng cho ảnh"
                                >
                                  <option value="">Ảnh dùng chung</option>
                                  {colors.map(c => (
                                    <option key={c.id} value={c.id}>
                                      Màu: {c.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Trạng thái kích hoạt</span>
                      <span className="text-[11px] text-gray-500">Hiển thị sản phẩm lên trang bán hàng</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProductForm(f => ({ ...f, is_active: !f.is_active }))}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${productForm.is_active ? 'bg-sky-600' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out shadow-xs ${productForm.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                {/* RIGHT COLUMN: Category, Price & Variants */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Danh mục (*)</label>
                      <select
                        value={productForm.category_id}
                        onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                        required
                        className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition"
                      >
                        <option value="">Chọn Danh mục</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Giá cơ bản (VND) (*)</label>
                      <input
                        type="text"
                        placeholder="VD: 250.000"
                        value={productForm.base_price === 0 ? '' : new Intl.NumberFormat('vi-VN').format(productForm.base_price)}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/[^0-9]/g, '');
                          setProductForm({ ...productForm, base_price: rawValue ? Number(rawValue) : 0 });
                        }}
                        required
                        className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition font-semibold"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/80 rounded-2xl border border-gray-200/80 space-y-3">
                    <label className="text-xs font-bold text-slate-800 uppercase block pb-1 border-b border-gray-200">
                      Tổ hợp biến thể ban đầu
                    </label>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">Chọn Sizes</label>
                      <div className="flex flex-wrap gap-1.5">
                        {sizes.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setProductForm(prev => ({
                                ...prev,
                                size_ids: prev.size_ids.includes(s.id) ? prev.size_ids.filter(id => id !== s.id) : [...prev.size_ids, s.id]
                              }));
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                              productForm.size_ids.includes(s.id) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-gray-200 hover:border-slate-400'
                            }`}
                          >
                            Size {s.code}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">Chọn Màu sắc</label>
                      <div className="flex flex-wrap gap-1.5">
                        {colors.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setProductForm(prev => ({
                                ...prev,
                                color_ids: prev.color_ids.includes(c.id) ? prev.color_ids.filter(id => id !== c.id) : [...prev.color_ids, c.id]
                              }));
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                              productForm.color_ids.includes(c.id) ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-gray-200 hover:border-sky-400'
                            }`}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Variant preview table */}
                    {(productForm.size_ids.length > 0 || productForm.color_ids.length > 0) && (
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">
                          Kho từng biến thể ({productForm.size_ids.length || 1} size × {productForm.color_ids.length || 1} màu = {Math.max(productForm.size_ids.length, 1) * Math.max(productForm.color_ids.length, 1)} biến thể)
                        </label>
                        <div className="rounded-xl border border-gray-200 overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-100 text-gray-500 uppercase">
                                <th className="text-left px-3 py-2 font-bold">Size</th>
                                <th className="text-left px-3 py-2 font-bold">Màu</th>
                                <th className="text-right px-3 py-2 font-bold">Kho (cái)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {(productForm.size_ids.length > 0 ? productForm.size_ids : [null]).map(sId => (
                                (productForm.color_ids.length > 0 ? productForm.color_ids : [null]).map(cId => {
                                  const key = `${sId || ''}|${cId || ''}`;
                                  const sizeName = sId ? sizes.find(s => s.id === sId)?.code || sId : '—';
                                  const colorName = cId ? colors.find(c => c.id === cId)?.name || cId : '—';
                                  const stock = variantStocks[key] ?? 50;
                                  return (
                                    <tr key={key} className="bg-white hover:bg-sky-50/40 transition-colors">
                                      <td className="px-3 py-2 font-semibold text-slate-700">Size {sizeName}</td>
                                      <td className="px-3 py-2 text-slate-600">{colorName}</td>
                                      <td className="px-3 py-2">
                                        <input
                                          type="number"
                                          min={0}
                                          value={stock}
                                          onChange={e => setVariantStocks(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                                          className="w-20 text-right text-sm p-1.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition bg-white font-semibold ml-auto block"
                                        />
                                      </td>
                                    </tr>
                                  );
                                })
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-amber-50/80 text-amber-800 rounded-xl text-xs font-medium flex items-start gap-2 border border-amber-200/60">
                    <Sparkles className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <span>Mã SKU & URL sản phẩm sẽ được hệ thống tự động sinh ra.</span>
                  </div>
                </div>
              </div>
            </form>

            {/* STICKY FOOTER */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                disabled={isCreating}
                onClick={() => setShowProductModal(false)}
                className="px-5 py-2.5 bg-white border border-gray-200 text-slate-700 hover:bg-gray-100 text-xs font-bold rounded-xl transition disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="create-product-form"
                disabled={isCreating}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Lưu Sản Phẩm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
