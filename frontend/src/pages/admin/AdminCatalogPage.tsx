import React, { useState, useEffect } from 'react';
import { Brand, Category, Size, Color, Product } from '../../types';
import { Plus, Tag, Layers, Package, CheckCircle2, AlertCircle, Sparkles, Loader2, X, Trash2 } from 'lucide-react';
import { getAuthHeader } from '../../lib/auth-storage';
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

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [productForm, setProductForm] = useState<{
    name: string;
    description: string;
    category_id: string;
    base_price: number;
    image_url: string;
    size_ids: string[];
    color_ids: string[];
    stock_quantity: number;
    is_active: boolean;
  }>({
    name: '',
    description: '',
    category_id: '',
    base_price: 250000,
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80',
    size_ids: [],
    color_ids: [],
    stock_quantity: 50,
    is_active: true,
  });

  const loadAll = async () => {
    try {
      const headers = getAuthHeader();
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
          category_id: productForm.category_id,
          base_price: Number(productForm.base_price),
          is_active: productForm.is_active,
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
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Danh sách sản phẩm hiện có</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase">
                <tr>
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
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-3 font-semibold text-slate-900">{p.name}</td>
                    <td className="p-3 font-mono">{p.code}</td>
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

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">URL Hình ảnh đại diện (*)</label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={productForm.image_url}
                        onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                        required
                        className="flex-1 text-sm p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition font-mono text-xs"
                      />
                      {productForm.image_url && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 shrink-0 bg-gray-50 shadow-2xs">
                          <img
                            src={productForm.image_url}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        </div>
                      )}
                    </div>
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

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Số lượng tồn kho mỗi biến thể</label>
                      <input
                        type="number"
                        placeholder="VD: 50"
                        value={productForm.stock_quantity}
                        onChange={(e) => setProductForm({ ...productForm, stock_quantity: Number(e.target.value) })}
                        className="w-full text-sm p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none transition bg-white"
                      />
                    </div>
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
                onClick={() => setShowProductModal(false)}
                className="px-5 py-2.5 bg-white border border-gray-200 text-slate-700 hover:bg-gray-100 text-xs font-bold rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="create-product-form"
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Lưu Sản Phẩm
              </button>
            </div>
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
