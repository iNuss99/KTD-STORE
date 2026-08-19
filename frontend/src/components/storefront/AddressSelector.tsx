import React, { useMemo } from 'react';
import { getProvinces, getDistricts, getWards } from '../../lib/vnAdministrativeData';
import { MapPin, Building, Home } from 'lucide-react';

interface AddressSelectorProps {
  province: string;
  district: string;
  ward: string;
  addressLine: string;
  onChange: (addr: {
    province: string;
    district: string;
    ward: string;
    addressLine: string;
  }) => void;
  disabled?: boolean;
}

export const AddressSelector: React.FC<AddressSelectorProps> = ({
  province,
  district,
  ward,
  addressLine,
  onChange,
  disabled = false,
}) => {
  const provinces = useMemo(() => getProvinces(), []);
  const districts = useMemo(() => (province ? getDistricts(province) : []), [province]);
  const wards = useMemo(() => (province && district ? getWards(province, district) : []), [province, district]);

  const handleProvinceChange = (newProvince: string) => {
    onChange({
      province: newProvince,
      district: '',
      ward: '',
      addressLine,
    });
  };

  const handleDistrictChange = (newDistrict: string) => {
    onChange({
      province,
      district: newDistrict,
      ward: '',
      addressLine,
    });
  };

  const handleWardChange = (newWard: string) => {
    onChange({
      province,
      district,
      ward: newWard,
      addressLine,
    });
  };

  const handleAddressLineChange = (newLine: string) => {
    onChange({
      province,
      district,
      ward,
      addressLine: newLine,
    });
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Province, District, Ward in responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Tỉnh / Thành phố */}
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-accent" /> Tỉnh / Thành phố <span className="text-coral">*</span>
          </label>
          <select
            value={province}
            disabled={disabled}
            onChange={(e) => handleProvinceChange(e.target.value)}
            className="w-full bg-card border border-line rounded-xl px-3 py-2.5 text-xs text-ink focus:outline-none focus:border-accent disabled:opacity-50 cursor-pointer shadow-2xs font-medium"
            required
          >
            <option value="">-- Chọn Tỉnh/Thành --</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Quận / Huyện */}
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5 flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-accent" /> Quận / Huyện <span className="text-coral">*</span>
          </label>
          <select
            value={district}
            disabled={disabled || !province}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="w-full bg-card border border-line rounded-xl px-3 py-2.5 text-xs text-ink focus:outline-none focus:border-accent disabled:opacity-50 cursor-pointer shadow-2xs font-medium"
            required
          >
            <option value="">{province ? '-- Chọn Quận/Huyện --' : '-- Chọn Tỉnh trước --'}</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Phường / Xã */}
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5 flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-accent" /> Phường / Xã <span className="text-coral">*</span>
          </label>
          {wards.length > 0 ? (
            <select
              value={ward}
              disabled={disabled || !district}
              onChange={(e) => handleWardChange(e.target.value)}
              className="w-full bg-card border border-line rounded-xl px-3 py-2.5 text-xs text-ink focus:outline-none focus:border-accent disabled:opacity-50 cursor-pointer shadow-2xs font-medium"
              required
            >
              <option value="">{district ? '-- Chọn Phường/Xã --' : '-- Chọn Huyện trước --'}</option>
              {wards.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="Nhập Phường/Xã..."
              value={ward}
              disabled={disabled || !district}
              onChange={(e) => handleWardChange(e.target.value)}
              className="w-full bg-card border border-line rounded-xl px-3 py-2.5 text-xs text-ink focus:outline-none focus:border-accent disabled:opacity-50 shadow-2xs font-medium"
              required
            />
          )}
        </div>
      </div>

      {/* Specific street address */}
      <div>
        <label className="block text-xs font-bold text-ink mb-1.5">
          Địa chỉ chi tiết (Số nhà, tên đường, tòa nhà...) <span className="text-coral">*</span>
        </label>
        <input
          type="text"
          placeholder="Ví dụ: 123 Lê Lợi, Chung cư Horizon, P. Bến Nghé"
          value={addressLine}
          disabled={disabled}
          onChange={(e) => handleAddressLineChange(e.target.value)}
          className="w-full bg-card border border-line rounded-xl px-3 py-2.5 text-xs text-ink placeholder-ink-soft focus:outline-none focus:border-accent disabled:opacity-50 shadow-2xs font-medium"
          required
        />
      </div>
    </div>
  );
};
