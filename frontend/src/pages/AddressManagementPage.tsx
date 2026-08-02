import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Address } from '../types';
import { MapPin, Plus, Check, Trash2, Edit, Loader2, Star, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

import { useToast } from '../context/ToastContext';

export const AddressManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useToast();
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [receiverName, setReceiverName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [ward, setWard] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Fetch Addresses
  const { data: addresses = [], isLoading } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await fetch('/api/addresses', { headers: getAuthHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Save / Update Address Mutation
  const saveAddressMutation = useMutation({
    mutationFn: async (payload: Partial<Address>) => {
      const isEdit = !!editingAddress?.id;
      const url = isEdit ? `/api/addresses/${editingAddress.id}` : '/api/addresses';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Không thể lưu địa chỉ');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      showSuccess('Lưu địa chỉ thành công', 'Địa chỉ giao hàng đã được cập nhật.');
      closeModal();
    },
    onError: (err: any) => {
      showError('Không thể lưu địa chỉ', err.message || 'Có lỗi xảy ra khi lưu địa chỉ');
    },
  });

  // Delete Address Mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Không thể xóa địa chỉ');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  // Set Default Address Mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/addresses/${id}/default`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Không thể đặt địa chỉ mặc định');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const openCreateModal = () => {
    setEditingAddress(null);
    setReceiverName('');
    setPhone('');
    setAddressLine('');
    setWard('');
    setDistrict('');
    setProvince('');
    setIsDefault(addresses.length === 0);
    setShowModal(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setReceiverName(addr.receiver_name);
    setPhone(addr.phone);
    setAddressLine(addr.address_line);
    setWard(addr.ward || '');
    setDistrict(addr.district || '');
    setProvince(addr.province);
    setIsDefault(addr.is_default);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAddress(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveAddressMutation.mutate({
      receiver_name: receiverName,
      phone,
      address_line: addressLine,
      ward,
      district,
      province,
      is_default: isDefault,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <Link to="/products" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-sky-600 mb-6 transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Trang chủ
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-sky-600" /> Sổ địa chỉ nhận hàng
            </h1>
            <p className="text-sm text-gray-500 mt-1">Quản lý danh sách địa chỉ để thanh toán nhanh chóng hơn.</p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-slate-900 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Thêm địa chỉ mới
          </button>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-lg mx-auto">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Chưa có địa chỉ nào</h3>
            <p className="text-sm text-gray-500 mb-6">Hãy lưu địa chỉ giao hàng để tiện lợi khi mua sắm.</p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition shadow-md"
            >
              <Plus className="w-4 h-4" /> Thêm địa chỉ đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`bg-white rounded-3xl p-6 border-2 transition relative flex flex-col justify-between ${
                  addr.is_default ? 'border-sky-600 shadow-md' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-slate-900 text-base">{addr.receiver_name}</span>
                    {addr.is_default && (
                      <span className="bg-sky-100 text-sky-700 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-sky-600" /> Mặc định
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 font-mono mb-2">{addr.phone}</div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {addr.address_line}, {addr.ward ? `${addr.ward}, ` : ''}{addr.district ? `${addr.district}, ` : ''}{addr.province}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                  {!addr.is_default ? (
                    <button
                      disabled={setDefaultMutation.isPending}
                      onClick={() => setDefaultMutation.mutate(addr.id)}
                      className="text-sky-600 font-bold hover:underline"
                    >
                      Đặt làm mặc định
                    </button>
                  ) : (
                    <span className="text-gray-400 font-medium">Địa chỉ giao mặc định</span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(addr)}
                      className="p-2 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition"
                      title="Sửa địa chỉ"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      disabled={deleteAddressMutation.isPending}
                      onClick={() => {
                        if (window.confirm('Bạn có chắc muốn xóa địa chỉ này không?')) {
                          deleteAddressMutation.mutate(addr.id);
                        }
                      }}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                      title="Xóa địa chỉ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Create/Edit Address */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Tên người nhận (*)"
                  required
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
                <input
                  type="text"
                  placeholder="Số điện thoại (*)"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
                <input
                  type="text"
                  placeholder="Địa chỉ chi tiết (Số nhà, tên đường...) (*)"
                  required
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Phường/Xã"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                  <input
                    type="text"
                    placeholder="Quận/Huyện"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                  <input
                    type="text"
                    placeholder="Tỉnh/TP (*)"
                    required
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="default-check"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                  />
                  <label htmlFor="default-check" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Đặt làm địa chỉ giao hàng mặc định
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={saveAddressMutation.isPending}
                    className="px-5 py-2 text-xs font-bold bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition shadow-md flex items-center gap-1"
                  >
                    {saveAddressMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Lưu địa chỉ
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
