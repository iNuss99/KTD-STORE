import React, { useState, useEffect } from 'react';
import { Discount, Category, Brand } from '../types';
import { Ticket, Plus, Calendar, Tag, Layers, CheckCircle2, XCircle, Trash2, Loader2, AlertCircle } from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { getAuthHeader } from '../lib/auth-storage';

export const AdminDiscountsPage: React.FC = () => {
  const { isSuperAdmin, isCEO, isManager, role } = useAuth();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form Fields
  const [code, setCode] = useState<string>('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [value, setValue] = useState<number>(10);
  const [maxUses, setMaxUses] = useState<number>(100);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [validFrom, setValidFrom] = useState<string>(new Date().toISOString().slice(0, 16));
  const [validTo, setValidTo] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  );
  const [scopeType, setScopeType] = useState<'ALL' | 'CATEGORY' | 'BRAND'>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeader();
      const [discRes, catRes, brandRes] = await Promise.all([
        fetch('/api/discounts', { headers }),
        fetch('/api/categories', { headers }),
        fetch('/api/brands', { headers }),
      ]);

      if (discRes.ok) {
        const data = await discRes.json();
        setDiscounts(data);
      }
      if (catRes.ok) {
        const data = await catRes.json();
        setCategories(data);
      }
      if (brandRes.ok) {
        const data = await brandRes.json();
        setBrands(data);
      }
    } catch (err) {
      console.error('Error fetching admin discounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!isSuperAdmin && !isCEO && !isManager) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 max-w-md mx-auto my-12 shadow-sm select-none">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 font-extrabold text-xl">
          403
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Truy cập bị từ chối</h2>
        <p className="text-xs text-slate-500 font-medium">
          Vai trò <b className="text-slate-700">{role}</b> không có quyền truy cập Quản lý Khuyến mãi.
        </p>
      </div>
    );
  }

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        code,
        discount_type: discountType,
        value: Number(value),
        max_uses: Number(maxUses),
        min_order_amount: Number(minOrderAmount),
        valid_from: validFrom,
        valid_to: validTo,
      };

      if (scopeType === 'CATEGORY' && selectedCategoryId) {
        payload.scopes = [{ category_id: selectedCategoryId }];
      } else if (scopeType === 'BRAND' && selectedBrandId) {
        payload.scopes = [{ brand_id: selectedBrandId }];
      }

      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('Tạo mã giảm giá mới thành công!');
        setShowModal(false);
        setCode('');
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Không thể tạo mã giảm giá');
      }
    } catch (err) {
      console.error('Error creating discount:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (discount: Discount) => {
    try {
      const res = await fetch(`/api/discounts/${discount.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ is_active: !discount.is_active }),
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error toggling active discount:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) return;
    try {
      const res = await fetch(`/api/discounts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error deleting discount:', err);
    }
  };

  return (
    <div className="flex flex-col font-sans">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Ticket className="w-6 h-6 text-amber-600" /> Quản lý Khuyến mãi & Mã giảm giá
            </h1>
            <p className="text-xs text-gray-500 mt-1">Cấu hình mã giảm giá, giới hạn lượt dùng và phạm vi áp dụng.</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" /> Tạo mã giảm giá mới
          </button>
        </div>

        {/* Discounts Table */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
          </div>
        ) : discounts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <Ticket className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-500">Chưa có mã giảm giá nào. Hãy tạo mã đầu tiên!</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="p-4">Mã Code</th>
                    <th className="p-4">Loại & Giá trị</th>
                    <th className="p-4">Phạm vi áp dụng</th>
                    <th className="p-4">Lượt đã dùng</th>
                    <th className="p-4">Đơn tối thiểu</th>
                    <th className="p-4">Thời hạn</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {discounts.map((disc) => {
                    const isExpired = new Date() > new Date(disc.valid_to);
                    const formattedValue =
                      disc.discount_type === 'PERCENTAGE'
                        ? `${disc.value}%`
                        : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(disc.value);

                    const scopeLabel =
                      !disc.scopes || disc.scopes.length === 0
                        ? 'Toàn hệ thống'
                        : disc.scopes.map((s) => s.category?.name || s.brand?.name || 'N/A').join(', ');

                    return (
                      <tr key={disc.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-extrabold text-slate-900 font-mono text-sm">
                          {disc.code}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg">
                            {formattedValue}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-gray-600 max-w-xs truncate">
                          {scopeLabel}
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          {disc.used_count} / {disc.max_uses}
                        </td>
                        <td className="p-4 text-gray-600 font-medium">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(disc.min_order_amount || 0)}
                        </td>
                        <td className="p-4 text-gray-500 font-mono text-[11px]">
                          {new Date(disc.valid_from).toLocaleDateString('vi-VN')} - {new Date(disc.valid_to).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="p-4">
                          {isExpired ? (
                            <span className="bg-gray-100 text-gray-600 text-[11px] font-bold px-2 py-0.5 rounded-md">Hết hạn</span>
                          ) : disc.is_active ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-md">Hoạt động</span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-md">Tạm dừng</span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleToggleActive(disc)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] rounded-lg transition"
                          >
                            {disc.is_active ? 'Tắt' : 'Bật'}
                          </button>
                          <button
                            onClick={() => handleDelete(disc.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Discount Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-sky-600" /> Tạo Mã Giảm Giá Mới
              </h3>
              <form onSubmit={handleCreateDiscount} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mã giảm giá (*):</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: SUMMER10, DISCOUNT50K"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full p-3 rounded-xl border border-gray-200 font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Loại giảm giá (*):</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="w-full p-3 rounded-xl border border-gray-200 font-bold focus:outline-none focus:ring-2 focus:ring-sky-600"
                    >
                      <option value="PERCENTAGE">Theo phần trăm (%)</option>
                      <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Giá trị giảm (*):</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={value}
                      onChange={(e) => setValue(Number(e.target.value))}
                      className="w-full p-3 rounded-xl border border-gray-200 font-bold focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Số lượt dùng tối đa:</label>
                    <input
                      type="number"
                      min={1}
                      value={maxUses}
                      onChange={(e) => setMaxUses(Number(e.target.value))}
                      className="w-full p-3 rounded-xl border border-gray-200 font-bold focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Giá trị đơn tối thiểu (VNĐ):</label>
                    <input
                      type="number"
                      min={0}
                      value={minOrderAmount}
                      onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                      className="w-full p-3 rounded-xl border border-gray-200 font-bold focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bắt đầu từ (*):</label>
                    <input
                      type="datetime-local"
                      required
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Đến ngày (*):</label>
                    <input
                      type="datetime-local"
                      required
                      value={validTo}
                      onChange={(e) => setValidTo(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                </div>

                {/* Scope Selection */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phạm vi áp dụng (*):</label>
                  <select
                    value={scopeType}
                    onChange={(e) => setScopeType(e.target.value as any)}
                    className="w-full p-3 rounded-xl border border-gray-200 font-bold focus:outline-none focus:ring-2 focus:ring-sky-600"
                  >
                    <option value="ALL">Toàn hệ thống (tất cả sản phẩm)</option>
                    <option value="CATEGORY">Theo Danh mục sản phẩm cụ thể</option>
                    <option value="BRAND">Theo Thương hiệu sản phẩm cụ thể</option>
                  </select>
                </div>

                {scopeType === 'CATEGORY' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Chọn Danh mục (*):</label>
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-600"
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {scopeType === 'BRAND' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Chọn Thương hiệu (*):</label>
                    <select
                      value={selectedBrandId}
                      onChange={(e) => setSelectedBrandId(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-600"
                    >
                      <option value="">-- Chọn thương hiệu --</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition shadow-md flex items-center gap-1"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tạo mã giảm giá'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
