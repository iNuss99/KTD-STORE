import React, { useState, useEffect } from 'react';
import { Brand, Category, Size, Color, Product } from '../types';
import { Plus, Tag, Layers, Package, CheckCircle2, AlertCircle, Sparkles, Loader2, X, Trash2 } from 'lucide-react';
import { getAuthHeader } from '../lib/auth-storage';
import { useToast } from '../context/ToastContext';

export const AdminCatalogPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [autoCreating, setAutoCreating] = useState(false);

  // Modals
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);

  // Form states
  const [brandForm, setBrandForm] = useState({ name: '', slug: '', code: '' });
  const [catForm, setCatForm] = useState({ name: '', slug: '', parent_id: '' });
  const [productForm, setProductForm] = useState<{
    name: string;
    description: string;
    brand_id: string;
    category_id: string;
    base_price: number;
    image_url: string;
    size_ids: string[];
    color_ids: string[];
    stock_quantity: number;
  }>({
    name: '',
    description: '',
    brand_id: '',
    category_id: '',
    base_price: 250000,
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80',
    size_ids: [],
    color_ids: [],
    stock_quantity: 50,
  });

  const loadAll = async () => {
    try {
      const headers = getAuthHeader();
      const [bRes, cRes, sRes, clRes, pRes] = await Promise.all([
        fetch('/api/brands', { headers }).then((r) => r.json()),
        fetch('/api/categories', { headers }).then((r) => r.json()),
        fetch('/api/products/sizes', { headers }).then((r) => r.json()),
        fetch('/api/products/colors', { headers }).then((r) => r.json()),
        fetch('/api/products', { headers }).then((r) => r.json()),
      ]);

      setBrands(Array.isArray(bRes) ? bRes : []);
      setCategories(Array.isArray(cRes) ? cRes : []);
      setSizes(Array.isArray(sRes) ? sRes : []);
      setColors(Array.isArray(clRes) ? clRes : []);
      setProducts(pRes?.data || []);

      if (sRes?.length > 0) setProductForm((f) => ({ ...f, size_ids: [sRes[0].id] }));
      if (clRes?.length > 0) setProductForm((f) => ({ ...f, color_ids: [clRes[0].id] }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAutoCreateProduct = async () => {
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
      const selectedBrand = brands[0]?.id || undefined;
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          name: item.name,
          code: item.code,
          slug,
          description: item.description,
          brand_id: selectedBrand,
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
        loadAll();
      } else {
        const errData = await res.json();
        showError('Không thể tạo sản phẩm', errData.message || 'Lỗi khi tự động tạo sản phẩm');
      }
    } catch (err: any) {
      showError('Lỗi mạng', err.message || 'Có lỗi xảy ra khi tự động thêm sản phẩm');
    } finally {
      setAutoCreating(false);
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(brandForm),
      });
      if (res.ok) {
        setMsg({ type: 'success', text: 'Tạo thương hiệu thành công!' });
        setBrandForm({ name: '', slug: '', code: '' });
        setShowBrandModal(false);
        loadAll();
      } else {
        const err = await res.json();
        setMsg({ type: 'error', text: err.message || 'Lỗi khi tạo thương hiệu' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Lỗi mạng khi tạo thương hiệu' });
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          name: catForm.name,
          slug: catForm.slug,
          parent_id: catForm.parent_id || undefined,
        }),
      });
      if (res.ok) {
        setMsg({ type: 'success', text: 'Tạo danh mục thành công!' });
        setCatForm({ name: '', slug: '', parent_id: '' });
        setShowCategoryModal(false);
        loadAll();
      } else {
        const err = await res.json();
        setMsg({ type: 'error', text: err.message || 'Lỗi khi tạo danh mục' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Lỗi mạng khi tạo danh mục' });
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
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
            variantsToCreate.push({
              size_id: sId || undefined,
              color_id: cId || undefined,
              stock_quantity: Number(productForm.stock_quantity),
            });
          }
        });
      });

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          name: productForm.name,
          code,
          slug,
          description: productForm.description,
          brand_id: productForm.brand_id,
          category_id: productForm.category_id,
          base_price: Number(productForm.base_price),
          image_urls: [productForm.image_url],
          variants: variantsToCreate,
        }),
      });
      if (res.ok) {
        setMsg({ type: 'success', text: 'Tạo sản phẩm thành công!' });
        setProductForm((f) => ({ ...f, name: '', description: '' }));
        setShowProductModal(false);
        loadAll();
      } else {
        const err = await res.json();
        setMsg({ type: 'error', text: err.message || 'Lỗi khi tạo sản phẩm' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Lỗi kết nối tạo sản phẩm' });
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      const res = await fetch(`/api/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (res.ok) {
        showSuccess('Thành công', 'Đã xóa sản phẩm');
        setProductToDelete(null);
        loadAll();
      } else {
        const err = await res.json();
        showError('Lỗi xóa sản phẩm', err.message || 'Không thể xóa sản phẩm này');
      }
    } catch (err) {
      showError('Lỗi mạng', 'Không thể kết nối đến máy chủ');
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
              Quản lý thương hiệu, danh mục và tạo thông tin cơ bản cho sản phẩm.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowBrandModal(true)}
              className="px-4 py-2 bg-white text-slate-700 font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition border border-gray-200 flex items-center gap-2"
            >
              <Tag className="w-4 h-4" /> + Tạo thương hiệu
            </button>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-2 bg-white text-slate-700 font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition border border-gray-200 flex items-center gap-2"
            >
              <Layers className="w-4 h-4" /> + Tạo danh mục
            </button>
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
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Danh sách sản phẩm hiện có</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase">
                <tr>
                  <th className="p-3">Sản phẩm</th>
                  <th className="p-3">Mã Code</th>
                  <th className="p-3">Thương hiệu</th>
                  <th className="p-3">Danh mục</th>
                  <th className="p-3">Giá cơ bản</th>
                  <th className="p-3">Số biến thể</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-3 font-semibold text-slate-900">{p.name}</td>
                    <td className="p-3 font-mono">{p.code}</td>
                    <td className="p-3">{p.brand?.name}</td>
                    <td className="p-3">{p.category?.name}</td>
                    <td className="p-3 font-bold">{new Intl.NumberFormat('vi-VN').format(p.base_price)} đ</td>
                    <td className="p-3 font-semibold">{p.variants?.length || 0} SKU</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.is_active ? 'Hoạt động' : 'Đã vô hiệu hóa'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setProductToDelete({ id: p.id, name: p.name })}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center justify-center"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODALS */}
      {showBrandModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowBrandModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-sky-600" /> Tạo thương hiệu
            </h3>
            <form onSubmit={handleCreateBrand} className="space-y-4">
              <input type="text" placeholder="Tên thương hiệu (vd: Nike)" value={brandForm.name} onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })} required className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition" />
              <input type="text" placeholder="Slug (vd: nike)" value={brandForm.slug} onChange={(e) => setBrandForm({ ...brandForm, slug: e.target.value })} required className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition" />
              <input type="text" placeholder="Mã SKU Prefix (vd: NK)" value={brandForm.code} onChange={(e) => setBrandForm({ ...brandForm, code: e.target.value })} required className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition" />
              <button type="submit" className="w-full py-3 mt-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition">
                <Plus className="w-4 h-4" /> Tạo Thương Hiệu
              </button>
            </form>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowCategoryModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-sky-600" /> Tạo danh mục
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <input type="text" placeholder="Tên danh mục (vd: Áo Thun)" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} required className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition" />
              <input type="text" placeholder="Slug (vd: ao-thun)" value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })} required className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition" />
              <select value={catForm.parent_id} onChange={(e) => setCatForm({ ...catForm, parent_id: e.target.value })} className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition">
                <option value="">Không có (Danh mục gốc)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button type="submit" className="w-full py-3 mt-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition">
                <Plus className="w-4 h-4" /> Tạo Danh Mục
              </button>
            </form>
          </div>
        </div>
      )}

      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowProductModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-6">
              <Package className="w-6 h-6 text-sky-600" /> Thêm sản phẩm mới
            </h3>
            <form onSubmit={handleCreateProduct} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Tên sản phẩm</label>
                <input type="text" placeholder="VD: Áo thun Polo cao cấp" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Thương hiệu</label>
                  <select value={productForm.brand_id} onChange={(e) => setProductForm({ ...productForm, brand_id: e.target.value })} required className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition">
                    <option value="">Chọn Thương hiệu</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Danh mục</label>
                  <select value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })} required className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition">
                    <option value="">Chọn Danh mục</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Giá cơ bản (VND)</label>
                <input
                  type="text"
                  placeholder="VD: 250.000"
                  value={productForm.base_price === 0 ? '' : new Intl.NumberFormat('vi-VN').format(productForm.base_price)}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/[^0-9]/g, '');
                    setProductForm({ ...productForm, base_price: rawValue ? Number(rawValue) : 0 });
                  }}
                  required
                  className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition"
                />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Biến thể ban đầu (Tự động tổ hợp)</label>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Chọn Sizes</label>
                    <div className="flex flex-wrap gap-2">
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                            productForm.size_ids.includes(s.id) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-gray-200 hover:border-slate-400'
                          }`}
                        >
                          Size {s.code}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Chọn Màu sắc</label>
                    <div className="flex flex-wrap gap-2">
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                            productForm.color_ids.includes(c.id) ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-gray-200 hover:border-sky-400'
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Tồn kho chung cho mỗi biến thể sinh ra</label>
                    <input
                      type="number"
                      placeholder="VD: 50"
                      value={productForm.stock_quantity}
                      onChange={(e) => setProductForm({ ...productForm, stock_quantity: Number(e.target.value) })}
                      className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-amber-50 text-amber-800 rounded-xl text-xs font-medium flex items-start gap-2 border border-amber-100">
                 <Sparkles className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                 Mã Code và URL (Slug) sẽ được hệ thống tự động sinh ra.
              </div>

              <button type="submit" className="w-full py-3 mt-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition">
                <Plus className="w-5 h-5" /> Lưu Sản Phẩm
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Xóa sản phẩm</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa sản phẩm <strong>"{productToDelete.name}"</strong> không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg hover:shadow-rose-200/50 transition"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
