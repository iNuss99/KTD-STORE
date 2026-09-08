/**
 * Utility functions for Color Management and SKU code generation
 */

export const removeVietnameseTones = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

/**
 * Tự động gợi ý mã viết tắt SKU từ tên màu tiếng Việt hoặc tiếng Anh
 * Ví dụ:
 * - "Xanh Rêu" -> "XRE"
 * - "Hồng Pastel" -> "HPAS"
 * - "Đen" -> "DEN"
 * - "Be / Kem" -> "BE"
 * - "Xanh Lá Cây" -> "XLC"
 */
export const generateColorSkuCode = (name: string): string => {
  const clean = removeVietnameseTones(name)
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim();
  if (!clean) return '';

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 4).toUpperCase();
  }
  if (words.length === 2) {
    const first = words[0][0];
    const second = words[1].slice(0, 2);
    return (first + second).toUpperCase();
  }
  // 3 words or more: combine initials
  return words.map(w => w[0]).join('').slice(0, 5).toUpperCase();
};

export const isValidHexCode = (hex: string): boolean => {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex.trim());
};

export interface FashionColorPreset {
  name: string;
  code: string;
  hex: string;
}

export const POPULAR_FASHION_PRESETS: FashionColorPreset[] = [
  { name: 'Xanh Rêu', code: 'XRE', hex: '#2E4F4F' },
  { name: 'Đỏ Đô', code: 'DDO', hex: '#800020' },
  { name: 'Be / Kem', code: 'BE', hex: '#F5F5DC' },
  { name: 'Nâu Tây', code: 'NTAY', hex: '#8B5A2B' },
  { name: 'Xanh Olive', code: 'XOLI', hex: '#556B2F' },
  { name: 'Hồng Pastel', code: 'HPAS', hex: '#F8C8DC' },
  { name: 'Xanh Coban', code: 'XCOB', hex: '#0047AB' },
  { name: 'Vàng Mù Tạt', code: 'VMUT', hex: '#E1AD01' },
  { name: 'Tím Khói', code: 'TKHO', hex: '#776B7D' },
  { name: 'Xanh Mint', code: 'XMIN', hex: '#98FF98' },
  { name: 'Cam Đất', code: 'CDAT', hex: '#C05A3E' },
  { name: 'Nâu Cà Phê', code: 'NCAF', hex: '#4A3B32' },
];
