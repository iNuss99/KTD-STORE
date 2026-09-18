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
  Palette,
  FolderTree,
  FileText,
  Layers,
  Tag,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Brand, Category, Size, Color, Product } from '../../types';
import { getAdminAuthHeader } from '../../lib/auth-storage';
import { useToast } from '../../context/ToastContext';
import {
  QuickAddColorModal,
  AdminColorManagerModal,
  ConfirmDeleteColorModal,
  QuickAddCategoryModal,
  AdminCategoryManagerModal,
} from '../../components';

export const AdminCatalogPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form submitting state
  const [isCreating, setIsCreating] = useState(false);
  const isCreatingRef = useRef(false);

  // Bulk selection & deletion state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('default');
  const [sortColumn, setSortColumn] = useState<'name' | 'code' | 'category' | 'price' | 'sku' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showColorManagerModal, setShowColorManagerModal] = useState(false);
  const [showQuickAddColorModal, setShowQuickAddColorModal] = useState(false);
  const [showCategoryManagerModal, setShowCategoryManagerModal] = useState(false);
  const [showQuickAddCategoryModal, setShowQuickAddCategoryModal] = useState(false);
  const [colorToDelete, setColorToDelete] = useState<Color | null>(null);
  const [isDeletingColor, setIsDeletingColor] = useState(false);
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
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk stock state
  const [bulkStockValue, setBulkStockValue] = useState<number | ''>('');

  const handleApplyBulkStock = () => {
    if (bulkStockValue === '' || Number(bulkStockValue) < 0) return;
    const count = Number(bulkStockValue);
    const newStocks: Record<string, number> = {};
    const activeSizes = productForm.size_ids.length > 0 ? productForm.size_ids : [null];
    const activeColors = productForm.color_ids.length > 0 ? productForm.color_ids : [null];
    activeSizes.forEach((sId) => {
      activeColors.forEach((cId) => {
        newStocks[`${sId || ''}|${cId || ''}`] = count;
      });
    });
    setVariantStocks((prev) => ({ ...prev, ...newStocks }));
  };

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
      const res = await fetch('/api/products?all=true&limit=100', { headers });
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
        fetch('/api/categories?all=true', { headers }).then((r) => r.json()),
        fetch('/api/products/sizes', { headers }).then((r) => r.json()),
        fetch('/api/products/colors', { headers }).then((r) => r.json()),
        fetch('/api/products?all=true&limit=100', { headers }).then((r) => r.json()),
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

  const handleDeleteColorQuick = (color: Color) => {
    setColorToDelete(color);
  };

  const handleConfirmDeleteColor = async () => {
    if (!colorToDelete) return;
    setIsDeletingColor(true);
    try {
      const res = await fetch(`/api/products/colors/${colorToDelete.id}`, {
        method: 'DELETE',
        headers: getAdminAuthHeader(),
      });
      if (res.ok) {
        setColors((prev) => prev.filter((c) => c.id !== colorToDelete.id));
        setProductForm((prev) => ({
          ...prev,
          color_ids: prev.color_ids.filter((id) => id !== colorToDelete.id),
        }));
        showSuccess('Đã xóa màu', `Màu "${colorToDelete.name}" đã được gỡ bỏ khỏi hệ thống.`);
        setColorToDelete(null);
      } else {
        const err = await res.json().catch(() => ({}));
        showError('Không thể xóa màu', err.message || 'Màu này đang được sử dụng trong các biến thể');
      }
    } catch (err: any) {
      showError('Lỗi mạng', err.message || 'Không thể kết nối đến máy chủ');
    } finally {
      setIsDeletingColor(false);
    }
  };

  const handleSort = (column: 'name' | 'code' | 'category' | 'price' | 'sku') => {
    if (sortColumn === column) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
        setSortBy(`${column}_desc`);
      } else {
        setSortColumn(null);
        setSortOrder('asc');
        setSortBy('default');
      }
    } else {
      setSortColumn(column);
      setSortOrder('asc');
      setSortBy(`${column}_asc`);
    }
  };

  const handleSortByChange = (val: string) => {
    setSortBy(val);
    if (val === 'default') {
      setSortColumn(null);
      setSortOrder('asc');
    } else if (val === 'price_asc') {
      setSortColumn('price');
      setSortOrder('asc');
    } else if (val === 'price_desc') {
      setSortColumn('price');
      setSortOrder('desc');
    } else if (val === 'name_asc') {
      setSortColumn('name');
      setSortOrder('asc');
    } else if (val === 'name_desc') {
      setSortColumn('name');
      setSortOrder('desc');
    } else if (val === 'sku_desc') {
      setSortColumn('sku');
      setSortOrder('desc');
    } else if (val === 'sku_asc') {
      setSortColumn('sku');
      setSortOrder('asc');
    }
  };

  const getCategoryProductCount = (catId: string) => {
    return products.filter((p) => {
      const matchCat = p.category_id === catId || p.category?.id === catId;
      if (statusFilter === 'ACTIVE') return matchCat && p.is_active;
      if (statusFilter === 'INACTIVE') return matchCat && !p.is_active;
      return matchCat;
    }).length;
  };

  const totalMatchingStatusCount = products.filter((p) => {
    if (statusFilter === 'ACTIVE') return p.is_active;
    if (statusFilter === 'INACTIVE') return !p.is_active;
    return true;
  }).length;

  const getCategoryBadgeClass = (categoryName?: string) => {
    if (!categoryName) return 'bg-slate-100 text-slate-600 border-slate-200';
    const nameLower = categoryName.toLowerCase();
    if (nameLower.includes('thun')) return 'bg-blue-50 text-blue-700 border-blue-200/80';
    if (nameLower.includes('khoác')) return 'bg-amber-50 text-amber-700 border-amber-200/80';
    if (nameLower.includes('sơ mi')) return 'bg-purple-50 text-purple-700 border-purple-200/80';
    if (nameLower.includes('polo')) return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    if (nameLower.includes('quần')) return 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
    return 'bg-sky-50 text-sky-700 border-sky-200/80';
  };

  const displayedProducts = products
    .filter((p) => {
      if (statusFilter === 'ACTIVE' && !p.is_active) return false;
      if (statusFilter === 'INACTIVE' && p.is_active) return false;

      if (selectedCategoryId !== 'ALL') {
        const catId = p.category_id || p.category?.id;
        if (catId !== selectedCategoryId) return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchName = p.name?.toLowerCase().includes(term);
        const matchCode = p.code?.toLowerCase().includes(term);
        const matchCategory = p.category?.name?.toLowerCase().includes(term);
        if (!matchName && !matchCode && !matchCategory) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (!sortColumn) return 0;

      if (sortColumn === 'name') {
        const valA = a.name?.toLowerCase() || '';
        const valB = b.name?.toLowerCase() || '';
        return sortOrder === 'asc' ? valA.localeCompare(valB, 'vi') : valB.localeCompare(valA, 'vi');
      }
      if (sortColumn === 'code') {
        const valA = a.code?.toLowerCase() || '';
        const valB = b.code?.toLowerCase() || '';
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (sortColumn === 'category') {
        const valA = a.category?.name?.toLowerCase() || '';
        const valB = b.category?.name?.toLowerCase() || '';
        return sortOrder === 'asc' ? valA.localeCompare(valB, 'vi') : valB.localeCompare(valA, 'vi');
      }
      if (sortColumn === 'price') {
        const valA = Number(a.base_price) || 0;
        const valB = Number(b.base_price) || 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      if (sortColumn === 'sku') {
        const valA = a.variants?.length || 0;
        const valB = b.variants?.length || 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });

  const handleQuickDelete = async (id: string, name: string) => {
    if (deletingId === id) return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: getAdminAuthHeader(),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (data.deleted) {
          // Xóa vĩnh viễn khỏi DB
          setProducts((prev) => prev.filter((p) => p.id !== id));
          setSelectedProductIds((prev) => prev.filter((pId) => pId !== id));
          showSuccess('Đã xóa vĩnh viễn', data.message || `Đã xóa vĩnh viễn sản phẩm "${name}" khỏi cơ sở dữ liệu.`);
        } else {
          // Sản phẩm đã có trong đơn hàng -> chuyển sang vô hiệu hóa
          setProducts((prev) =>
            prev.map((p) => (p.id === id ? { ...p, is_active: false } : p))
          );
          showSuccess('Đã vô hiệu hóa', data.message || `Sản phẩm "${name}" đã chuyển sang trạng thái vô hiệu hóa.`);
        }
      } else {
        showError('Lỗi xóa sản phẩm', data.message || 'Không thể xóa sản phẩm này');
      }
    } catch (err) {
      showError('Lỗi mạng', 'Không thể kết nối đến máy chủ khi xóa');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectAll = () => {
    if (displayedProducts.length > 0 && selectedProductIds.length === displayedProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(displayedProducts.map((p) => p.id));
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
    setIsBulkDeleting(true);

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getAdminAuthHeader(),
      };
      const res = await fetch('/api/products/batch-delete', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ids: idsToDelete }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showSuccess('Xóa hàng loạt thành công', data.message || `Đã xóa vĩnh viễn ${idsToDelete.length} sản phẩm.`);
        setProducts((prev) => prev.filter((p) => !idsToDelete.includes(p.id)));
        setSelectedProductIds([]);
      } else {
        showError('Không thể xóa hàng loạt', data.message || 'Lỗi khi xóa các sản phẩm đã chọn');
      }
      await refreshProducts();
    } catch (err) {
      showError('Lỗi mạng', 'Không thể hoàn tất xóa hàng loạt');
      await refreshProducts();
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
              type="button"
              onClick={() => setShowCategoryManagerModal(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-gray-200 shadow-2xs hover:border-slate-300 transition flex items-center gap-2"
              title="Quản lý và thêm/xóa danh mục sản phẩm toàn hệ thống"
            >
              <FolderTree className="w-4 h-4 text-sky-600" />
              <span>Quản lý danh mục ({categories.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setShowColorManagerModal(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-gray-200 shadow-2xs hover:border-slate-300 transition flex items-center gap-2"
              title="Quản lý danh mục màu sắc sản phẩm toàn hệ thống"
            >
              <Palette className="w-4 h-4 text-sky-600" />
              <span>Bảng màu sắc ({colors.length})</span>
            </button>
            <button
              onClick={() => setShowProductModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2"
            >
              <Package className="w-4 h-4" /> + Thêm sản phẩm
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
          {/* Header & Bulk Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-bold text-slate-900">Danh sách sản phẩm</h3>
              <span className="text-xs text-slate-500 font-medium">
                ({displayedProducts.length}/{products.length} sản phẩm)
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

          {/* Category Tabs / Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedCategoryId('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                selectedCategoryId === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/70'
              }`}
            >
              <span>Tất cả danh mục</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  selectedCategoryId === 'ALL'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {totalMatchingStatusCount}
              </span>
            </button>

            {categories.map((cat) => {
              const count = getCategoryProductCount(cat.id);
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/70'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search, Status & Sort Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên hoặc mã SP..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md transition-colors"
                  title="Xóa từ khóa"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filters & Sort Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter */}
              <div className="inline-flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    statusFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Đang bán
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('INACTIVE')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    statusFilter === 'INACTIVE'
                      ? 'bg-white text-rose-700 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Đã vô hiệu hóa
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => handleSortByChange(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="default">Sắp xếp: Mặc định</option>
                  <option value="price_asc">Giá: Thấp đến Cao</option>
                  <option value="price_desc">Giá: Cao đến Thấp</option>
                  <option value="name_asc">Tên: A → Z</option>
                  <option value="name_desc">Tên: Z → A</option>
                  <option value="sku_desc">Biến thể: Nhiều nhất</option>
                  <option value="sku_asc">Biến thể: Ít nhất</option>
                </select>
              </div>

              {/* Reset Filter Button */}
              {(searchTerm || selectedCategoryId !== 'ALL' || statusFilter !== 'ALL' || sortBy !== 'default') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategoryId('ALL');
                    setStatusFilter('ALL');
                    setSortBy('default');
                    setSortColumn(null);
                    setSortOrder('asc');
                  }}
                  className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1 border border-slate-200"
                  title="Đặt lại toàn bộ bộ lọc"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase select-none">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={displayedProducts.length > 0 && selectedProductIds.length === displayedProducts.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                      title="Chọn tất cả"
                    />
                  </th>
                  <th
                    className="p-3 cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Sản phẩm</span>
                      {sortColumn === 'name' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-sky-600" /> : <ArrowDown className="w-3.5 h-3.5 text-sky-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3 cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('code')}
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Mã Code</span>
                      {sortColumn === 'code' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-sky-600" /> : <ArrowDown className="w-3.5 h-3.5 text-sky-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3 cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('category')}
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Danh mục</span>
                      {sortColumn === 'category' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-sky-600" /> : <ArrowDown className="w-3.5 h-3.5 text-sky-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3 cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('price')}
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Giá cơ bản</span>
                      {sortColumn === 'price' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-sky-600" /> : <ArrowDown className="w-3.5 h-3.5 text-sky-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3 cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('sku')}
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Số biến thể</span>
                      {sortColumn === 'sku' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-sky-600" /> : <ArrowDown className="w-3.5 h-3.5 text-sky-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      {loadingProducts ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
                          <span>Đang tải danh sách sản phẩm...</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p>Không có sản phẩm nào phù hợp với bộ lọc hiện tại.</p>
                          {(searchTerm || selectedCategoryId !== 'ALL' || statusFilter !== 'ALL') && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearchTerm('');
                                setSelectedCategoryId('ALL');
                                setStatusFilter('ALL');
                                setSortBy('default');
                                setSortColumn(null);
                                setSortOrder('asc');
                              }}
                              className="text-xs font-semibold text-sky-600 hover:text-sky-700 underline cursor-pointer"
                            >
                              Xóa bộ lọc để xem tất cả
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  displayedProducts.map((p) => (
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
                      <td className="p-3">
                        {p.category?.name ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${getCategoryBadgeClass(
                              p.category.name
                            )}`}
                          >
                            {p.category.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa phân loại</span>
                        )}
                      </td>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden border border-slate-100">
            {/* STICKY HEADER */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Thêm sản phẩm mới</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Khởi tạo thông tin, tải ảnh và cấu hình biến thể sản phẩm</p>
                </div>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* FORM BODY (2 COLUMNS: 7 COLS & 5 COLS) */}
            <form id="create-product-form" onSubmit={handleCreateProduct} className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/50">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT COLUMN: 7 COLS (Nội dung chính & Thư viện ảnh) */}
                <div className="lg:col-span-7 space-y-5">
                  
                  {/* CARD 1: THÔNG TIN CƠ BẢN */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                      <FileText className="w-4 h-4 text-sky-600" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Thông tin chung</h4>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Tên sản phẩm <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Áo thun Polo Cotton Supima cao cấp"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        required
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition bg-white placeholder:text-slate-400 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Mô tả ngắn sản phẩm
                      </label>
                      <textarea
                        rows={3}
                        placeholder="VD: Form dáng may đo chuẩn xác, chất vải chải kỹ thoáng khí, giữ form sắc nét suốt ngày dài..."
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition resize-none bg-white placeholder:text-slate-400 font-medium"
                      />
                    </div>
                  </div>

                  {/* CARD 2: THƯ VIỆN HÌNH ẢNH */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <ImagePlus className="w-4 h-4 text-sky-600" />
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Hình ảnh sản phẩm</h4>
                        {productForm.images.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-bold border border-sky-100">
                            {productForm.images.length} ảnh
                          </span>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                          showUrlInput 
                            ? 'bg-sky-100 text-sky-700 border border-sky-200' 
                            : 'text-slate-600 hover:text-sky-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>{showUrlInput ? 'Đóng ô URL' : 'Dán URL ảnh'}</span>
                      </button>
                    </div>

                    {/* Toggleable URL input box */}
                    {showUrlInput && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 animate-in fade-in duration-200">
                        <label className="text-[11px] font-bold text-slate-600 block">Thêm ảnh từ đường link (URL)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="https://images.unsplash.com/photo-..."
                            value={urlInput}
                            onChange={e => { setUrlInput(e.target.value); setUrlError(''); }}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
                            className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none bg-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleAddUrl}
                            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition shrink-0 cursor-pointer"
                          >
                            Thêm URL
                          </button>
                        </div>
                        {urlError && <p className="text-[11px] text-rose-500 font-medium">{urlError}</p>}
                      </div>
                    )}

                    {/* Drop zone */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDropZoneDrop}
                      className={`flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-xl py-3.5 cursor-pointer transition-all ${
                        isDragOver ? 'border-sky-500 bg-sky-50/70 scale-[0.99]' : 'border-slate-200 bg-slate-50/60 hover:border-sky-300 hover:bg-sky-50/30'
                      }`}
                    >
                      <ImagePlus className={`w-5 h-5 ${isDragOver ? 'text-sky-600' : 'text-slate-400'}`} />
                      <span className="text-xs text-slate-600 font-medium">
                        Kéo thả ảnh vào đây hoặc <span className="text-sky-600 font-bold hover:underline">chọn từ máy tính</span>
                      </span>
                      <span className="text-[10px] text-slate-400">JPG, PNG, WEBP — tối đa 2MB mỗi ảnh</span>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={e => e.target.files && encodeFilesToBase64(e.target.files)}
                    />
                    {uploadError && <p className="text-[11px] text-rose-500 font-medium">{uploadError}</p>}

                    {/* Image grid with drag-to-reorder and color assignment */}
                    {productForm.images.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                          <span>Kéo thả để đổi thứ tự</span>
                          <span>Ảnh đầu tiên là ảnh đại diện</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 items-start">
                          {productForm.images.map((imgItem, idx) => {
                            const selectedColor = colors.find((c) => c.id === imgItem.color_id);
                            return (
                              <div
                                key={idx}
                                draggable
                                onDragStart={() => handleDragStart(idx)}
                                onDragOver={(e) => handleDragOver(e, idx)}
                                onDragEnd={handleDragEnd}
                                className={`relative group rounded-xl overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all bg-white flex flex-col shadow-2xs ${
                                  dragIndex === idx
                                    ? 'border-sky-400 shadow-md scale-105 opacity-70 z-10'
                                    : idx === 0
                                    ? 'border-amber-400 ring-2 ring-amber-400/20'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="relative aspect-square w-full bg-slate-100 overflow-hidden shrink-0">
                                  <img
                                    src={imgItem.url}
                                    alt={`Ảnh ${idx + 1}`}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    onError={(e) =>
                                      (e.currentTarget.src =
                                        'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><text y=%2218%22 font-size=%2216%22>🖼️</text></svg>')
                                    }
                                  />
                                  {idx === 0 && (
                                    <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white rounded-md px-1.5 py-0.5 flex items-center gap-1 shadow-xs z-10 pointer-events-none">
                                      <Star className="w-2.5 h-2.5 fill-white text-white" />
                                      <span className="text-[8px] font-bold uppercase">Đại diện</span>
                                    </div>
                                  )}
                                  <div className="absolute bottom-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition p-1 bg-black/50 rounded text-white pointer-events-none">
                                    <GripVertical className="w-3 h-3 text-white drop-shadow-xs" />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveImage(idx);
                                    }}
                                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-rose-500 hover:bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-sm z-10 cursor-pointer"
                                    title="Xóa ảnh này"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="p-1.5 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                                    style={{
                                      backgroundColor: selectedColor?.hex_code || '#cbd5e1',
                                    }}
                                    title={selectedColor ? selectedColor.name : 'Dùng chung'}
                                  />
                                  <select
                                    value={imgItem.color_id || ''}
                                    onChange={(e) => handleImageColorChange(idx, e.target.value)}
                                    className="w-full text-[11px] font-medium py-1 px-1 rounded-md border border-slate-200 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer truncate"
                                    title={selectedColor ? `Màu: ${selectedColor.name}` : 'Ảnh dùng chung cho các màu'}
                                  >
                                    <option value="">Ảnh dùng chung</option>
                                    {colors.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: 5 COLS (Trạng thái, Giá & Danh mục, Biến thể & Tồn kho) */}
                <div className="lg:col-span-5 space-y-5">

                  {/* CARD 1: TRẠNG THÁI PHÁT HÀNH (PUBLISH STATUS) */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`w-2 h-2 rounded-full ${productForm.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Trạng thái hiển thị
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {productForm.is_active ? 'Đang bật — Hiển thị trên cửa hàng' : 'Đang ẩn — Khách hàng không thấy'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setProductForm(f => ({ ...f, is_active: !f.is_active }))}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${
                        productForm.is_active ? 'bg-sky-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out shadow-xs ${
                          productForm.is_active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* CARD 2: PHÂN LOẠI & GIÁ BÁN */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                      <Tag className="w-4 h-4 text-sky-600" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Giá & Phân loại</h4>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Danh mục <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowQuickAddCategoryModal(true)}
                            className="text-[11px] font-bold text-sky-600 hover:text-sky-700 hover:bg-sky-50 px-1.5 py-0.5 rounded transition flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Thêm
                          </button>
                          <span className="text-slate-300 text-xs">|</span>
                          <button
                            type="button"
                            onClick={() => setShowCategoryManagerModal(true)}
                            className="text-[11px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-1.5 py-0.5 rounded transition flex items-center gap-0.5 cursor-pointer"
                          >
                            <FolderTree className="w-3 h-3 text-slate-500" /> Quản lý
                          </button>
                        </div>
                      </div>
                      <select
                        value={productForm.category_id}
                        onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                        required
                        className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition bg-white font-medium"
                      >
                        <option value="">-- Chọn Danh mục --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Giá cơ bản (VND) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="VD: 250.000"
                          value={productForm.base_price === 0 ? '' : new Intl.NumberFormat('vi-VN').format(productForm.base_price)}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/[^0-9]/g, '');
                            setProductForm({ ...productForm, base_price: rawValue ? Number(rawValue) : 0 });
                          }}
                          required
                          className="w-full text-sm pl-3.5 pr-12 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition font-bold text-slate-900 bg-white"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                          VNĐ
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: BIẾN THỂ & BẢNG KHO */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                      <Layers className="w-4 h-4 text-sky-600" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Biến thể & Tồn kho</h4>
                    </div>

                    {/* SIZES */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Chọn Sizes</label>
                      <div className="flex flex-wrap gap-1.5">
                        {sizes.map((s) => {
                          const isSelected = productForm.size_ids.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setProductForm(prev => ({
                                  ...prev,
                                  size_ids: prev.size_ids.includes(s.id) ? prev.size_ids.filter(id => id !== s.id) : [...prev.size_ids, s.id]
                                }));
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' 
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                              }`}
                            >
                              Size {s.code}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* COLORS */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">Chọn Màu sắc</label>
                        <button
                          type="button"
                          onClick={() => setShowColorManagerModal(true)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-sky-600 transition-colors cursor-pointer"
                        >
                          <Palette className="w-3 h-3 text-sky-500" />
                          <span>Bảng màu</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {colors.map((c) => {
                          const isSelected = productForm.color_ids.includes(c.id);
                          return (
                            <div key={c.id} className="group relative inline-flex items-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setProductForm((prev) => ({
                                    ...prev,
                                    color_ids: prev.color_ids.includes(c.id)
                                      ? prev.color_ids.filter((id) => id !== c.id)
                                      : [...prev.color_ids, c.id],
                                  }));
                                }}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                <span
                                  className={`w-2.5 h-2.5 rounded-full shrink-0 border ${
                                    isSelected ? 'border-white/60' : 'border-slate-300'
                                  }`}
                                  style={{ backgroundColor: c.hex_code || '#94A3B8' }}
                                />
                                <span>{c.name}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteColorQuick(c);
                                }}
                                className="opacity-0 group-hover:opacity-100 hover:scale-110 -ml-2 mr-0.5 p-0.5 rounded-full bg-white text-rose-500 hover:text-rose-700 border border-slate-200 shadow-2xs transition-all z-10 cursor-pointer"
                                title={`Xóa màu "${c.name}"`}
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => setShowQuickAddColorModal(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 border border-dashed border-sky-300 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Thêm màu</span>
                        </button>
                      </div>
                    </div>

                    {/* VARIANT STOCK TABLE + BULK APPLY */}
                    {(productForm.size_ids.length > 0 || productForm.color_ids.length > 0) && (
                      <div className="pt-2 border-t border-slate-100 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-bold text-slate-700">
                            Kho từng biến thể
                          </label>
                          <span className="text-[11px] font-mono text-slate-400">
                            {productForm.size_ids.length || 1}S × {productForm.color_ids.length || 1}M = {Math.max(productForm.size_ids.length, 1) * Math.max(productForm.color_ids.length, 1)} biến thể
                          </span>
                        </div>

                        {/* BULK APPLY BAR */}
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-600 shrink-0">Áp dụng tất cả:</span>
                          <input
                            type="number"
                            min={0}
                            placeholder="SL (cái)"
                            value={bulkStockValue}
                            onChange={(e) => setBulkStockValue(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-20 text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-semibold outline-none focus:ring-1 focus:ring-sky-500"
                          />
                          <button
                            type="button"
                            onClick={handleApplyBulkStock}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold rounded-lg transition shrink-0 cursor-pointer"
                          >
                            Áp dụng
                          </button>
                        </div>

                        {/* SCROLLABLE TABLE */}
                        <div className="rounded-xl border border-slate-200 overflow-hidden max-h-52 overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-slate-600 z-10">
                              <tr className="border-b border-slate-200">
                                <th className="text-left px-3 py-2 font-bold">Size</th>
                                <th className="text-left px-3 py-2 font-bold">Màu</th>
                                <th className="text-right px-3 py-2 font-bold">Kho (cái)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {(productForm.size_ids.length > 0 ? productForm.size_ids : [null]).map(sId => (
                                (productForm.color_ids.length > 0 ? productForm.color_ids : [null]).map(cId => {
                                  const key = `${sId || ''}|${cId || ''}`;
                                  const sizeName = sId ? sizes.find(s => s.id === sId)?.code || sId : '—';
                                  const colorName = cId ? colors.find(c => c.id === cId)?.name || cId : '—';
                                  const stock = variantStocks[key] ?? 50;
                                  return (
                                    <tr key={key} className="hover:bg-sky-50/40 transition-colors">
                                      <td className="px-3 py-2 font-semibold text-slate-800">Size {sizeName}</td>
                                      <td className="px-3 py-2 text-slate-600">{colorName}</td>
                                      <td className="px-3 py-2">
                                        <input
                                          type="number"
                                          min={0}
                                          value={stock}
                                          onChange={e => setVariantStocks(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                                          className="w-20 text-right text-xs p-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none transition bg-white font-bold ml-auto block"
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

                  {/* SKU HINT */}
                  <div className="p-3 bg-amber-50/90 text-amber-800 rounded-xl text-xs font-medium flex items-start gap-2 border border-amber-200/60">
                    <Sparkles className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <span>Mã SKU &amp; URL sản phẩm sẽ được hệ thống tự động sinh ra khi lưu.</span>
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

      {/* Quick Add Color Modal */}
      <QuickAddColorModal
        isOpen={showQuickAddColorModal}
        onClose={() => setShowQuickAddColorModal(false)}
        onSuccess={(newColor) => {
          setColors((prev) => {
            if (prev.some((c) => c.id === newColor.id)) return prev;
            return [...prev, newColor].sort((a, b) => a.name.localeCompare(b.name));
          });
          setProductForm((prev) => ({
            ...prev,
            color_ids: prev.color_ids.includes(newColor.id)
              ? prev.color_ids
              : [...prev.color_ids, newColor.id],
          }));
        }}
      />

      {/* Admin Color Manager Modal */}
      <AdminColorManagerModal
        isOpen={showColorManagerModal}
        onClose={() => setShowColorManagerModal(false)}
        colors={colors}
        onColorsChange={(updatedColors) => {
          setColors(updatedColors);
          const validIds = new Set(updatedColors.map((c) => c.id));
          setProductForm((prev) => ({
            ...prev,
            color_ids: prev.color_ids.filter((id) => validIds.has(id)),
          }));
        }}
      />

      {/* Confirm Delete Color Modal */}
      <ConfirmDeleteColorModal
        isOpen={Boolean(colorToDelete)}
        color={colorToDelete}
        isLoading={isDeletingColor}
        onClose={() => {
          if (!isDeletingColor) setColorToDelete(null);
        }}
        onConfirm={handleConfirmDeleteColor}
      />

      {/* Quick Add Category Modal */}
      <QuickAddCategoryModal
        isOpen={showQuickAddCategoryModal}
        onClose={() => setShowQuickAddCategoryModal(false)}
        onSuccess={(newCat) => {
          setCategories((prev) => {
            if (prev.some((c) => c.id === newCat.id)) return prev;
            return [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name));
          });
          setProductForm((prev) => ({ ...prev, category_id: newCat.id }));
        }}
        parentCategories={categories}
      />

      {/* Admin Category Manager Modal */}
      <AdminCategoryManagerModal
        isOpen={showCategoryManagerModal}
        onClose={() => setShowCategoryManagerModal(false)}
        categories={categories}
        onCategoriesChange={(updatedCategories) => {
          setCategories(updatedCategories);
          if (!updatedCategories.some((c) => c.id === productForm.category_id)) {
            setProductForm((prev) => ({ ...prev, category_id: '' }));
          }
        }}
      />
    </div>
  );
};
