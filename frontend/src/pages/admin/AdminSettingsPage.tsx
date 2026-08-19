import React, { useState, useEffect } from 'react';
import { Settings, Save, Store, ShieldAlert, Bell, Palette, CheckCircle2, RefreshCw, QrCode } from 'lucide-react';
import { getAuthHeader } from '../../lib/auth-storage';

export const AdminSettingsPage: React.FC = () => {
  const [storeName, setStoreName] = useState('Knot To Detail');
  const [hotline, setHotline] = useState('1900 8888');
  const [supportEmail, setSupportEmail] = useState('support@knottodetail.vn');
  const [zaloUrl, setZaloUrl] = useState('https://zalo.me/0912345678');
  const [fanpageUrl, setFanpageUrl] = useState('https://facebook.com/knottodetail');
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [shippingFee, setShippingFee] = useState(30000);
  const [returnPeriodDays, setReturnPeriodDays] = useState(7);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Bank / VietQR Configs
  const [bankCode, setBankCode] = useState('MB');
  const [bankName, setBankName] = useState('MBBank (Ngân hàng Quân Đội)');
  const [bankAccountNo, setBankAccountNo] = useState('999988888');
  const [bankAccountName, setBankAccountName] = useState('KNOT TO DETAIL');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const res = await fetch('/api/system-configs', { headers: getAuthHeader() });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            data.forEach((item: any) => {
              if (item.key === 'STORE_NAME') setStoreName(item.value);
              if (item.key === 'HOTLINE') setHotline(item.value);
              if (item.key === 'SUPPORT_EMAIL') setSupportEmail(item.value);
              if (item.key === 'ZALO_URL') setZaloUrl(item.value);
              if (item.key === 'FANPAGE_URL') setFanpageUrl(item.value);
              if (item.key === 'LOW_STOCK_THRESHOLD') setLowStockThreshold(Number(item.value) || 5);
              if (item.key === 'SHIPPING_FEE') setShippingFee(Number(item.value) || 30000);
              if (item.key === 'RETURN_PERIOD_DAYS') setReturnPeriodDays(Number(item.value) || 7);
              if (item.key === 'MAINTENANCE_MODE') setMaintenanceMode(item.value === 'true');
              if (item.key === 'BANK_CODE') setBankCode(item.value);
              if (item.key === 'BANK_NAME') setBankName(item.value);
              if (item.key === 'BANK_ACCOUNT_NO') setBankAccountNo(item.value);
              if (item.key === 'BANK_ACCOUNT_NAME') setBankAccountName(item.value);
            });
          }
        }
      } catch (err) {
        console.error('Error fetching configs:', err);
      }
    };
    fetchConfigs();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);

    try {
      const configs = [
        { key: 'STORE_NAME', value: storeName },
        { key: 'HOTLINE', value: hotline },
        { key: 'SUPPORT_EMAIL', value: supportEmail },
        { key: 'ZALO_URL', value: zaloUrl },
        { key: 'FANPAGE_URL', value: fanpageUrl },
        { key: 'LOW_STOCK_THRESHOLD', value: String(lowStockThreshold) },
        { key: 'SHIPPING_FEE', value: String(shippingFee) },
        { key: 'RETURN_PERIOD_DAYS', value: String(returnPeriodDays) },
        { key: 'MAINTENANCE_MODE', value: String(maintenanceMode) },
        { key: 'BANK_CODE', value: bankCode },
        { key: 'BANK_NAME', value: bankName },
        { key: 'BANK_ACCOUNT_NO', value: bankAccountNo },
        { key: 'BANK_ACCOUNT_NAME', value: bankAccountName },
      ];

      await Promise.all(
        configs.map((cfg) =>
          fetch(`/api/system-configs/${cfg.key}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeader(),
            },
            body: JSON.stringify({ value: cfg.value }),
          })
        )
      );

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto font-sans space-y-8 pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-amber-600" />
            Cấu hình & Thiết lập Hệ thống
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý thông tin cửa hàng, chính sách bán hàng, hạn mức tồn kho và giao diện quản trị Knot To Detail.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Lưu cấu hình
        </button>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Đã lưu toàn bộ cấu hình hệ thống thành công!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Thông tin Cửa hàng */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Store className="w-5 h-5 text-amber-600" />
            Thông tin Thương hiệu & Cửa hàng
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên Cửa Hàng / Thương Hiệu
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hotline Hỗ Trợ
              </label>
              <input
                type="text"
                value={hotline}
                onChange={(e) => setHotline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email CSKH
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Đường dẫn Zalo Chat (hoặc SĐT)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: https://zalo.me/0912345678"
                value={zaloUrl}
                onChange={(e) => setZaloUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Đường dẫn Facebook Fanpage / Messenger
              </label>
              <input
                type="text"
                placeholder="Ví dụ: https://facebook.com/knottodetail"
                value={fanpageUrl}
                onChange={(e) => setFanpageUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section: Cấu hình Tài khoản Ngân hàng & VietQR */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <QrCode className="w-5 h-5 text-amber-600" />
            Cấu hình Thanh toán Chuyển khoản VietQR / Mã QR
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mã Ngân Hàng (Bank Code - VietQR)
              </label>
              <select
                value={bankCode}
                onChange={(e) => {
                  setBankCode(e.target.value);
                  const selectedText = e.target.options[e.target.selectedIndex].text;
                  setBankName(selectedText);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="MB">MBBank (Ngân hàng Quân Đội)</option>
                <option value="VCB">Vietcombank (Ngân hàng Ngoại thương)</option>
                <option value="TCB">Techcombank (Ngân hàng Kỹ thương)</option>
                <option value="ACB">ACB (Ngân hàng Á Châu)</option>
                <option value="VPB">VPBank (Ngân hàng Thịnh Vượng)</option>
                <option value="BIDV">BIDV (Ngân hàng Đầu tư và Phát triển)</option>
                <option value="CTG">VietinBank (Ngân hàng Công thương)</option>
                <option value="TPB">TPBank (Ngân hàng Tiên Phong)</option>
                <option value="STB">Sacombank (Ngân hàng Sài Gòn Thương Tín)</option>
                <option value="VIB">VIB (Ngân hàng Quốc Tế)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Dùng để tự động phát sinh mã QR chuyển khoản VietQR chuẩn Napas247.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên Ngân Hàng Hiển Thị
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số Tài Khoản Nhận Thanh Toán
              </label>
              <input
                type="text"
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
                placeholder="Ví dụ: 0988888888"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên Chủ Tài Khoản (Viết hoa không dấu)
              </label>
              <input
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                placeholder="Ví dụ: NGUYEN VAN A"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Vận hành & Kho hàng */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Bell className="w-5 h-5 text-amber-600" />
            Cấu hình Vận hành & Cảnh báo Tồn kho
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngưỡng Cảnh Báo Tồn Kho Thấp (Sản phẩm)
              </label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Biến thể có số lượng ≤ ngưỡng này sẽ báo đỏ trên Dashboard.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phí Vận Chuyển Mặc Định (VNĐ)
              </label>
              <input
                type="number"
                value={shippingFee}
                onChange={(e) => setShippingFee(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Thời Hạn Cho Phép Đổi Trả (Ngày)
              </label>
              <input
                type="number"
                value={returnPeriodDays}
                onChange={(e) => setReturnPeriodDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Giao diện & Trạng thái Hệ thống */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Palette className="w-5 h-5 text-amber-600" />
            Giao diện Thương hiệu & Trạng thái Hệ thống
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl">
              <div>
                <p className="text-xs font-bold text-amber-950">Màu chủ đạo Giao diện CRM</p>
                <p className="text-[11px] text-amber-800">Đã đồng bộ với Logo Knot To Detail (Warm Gold Amber #F59E0B)</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow-xs"></div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" /> Chế độ Bảo trì Hệ thống
                </p>
                <p className="text-[11px] text-slate-500">Tạm ngưng nhận đơn hàng mới từ phía khách hàng</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu thay đổi hệ thống
          </button>
        </div>
      </form>
    </div>
  );
};
