import { describe, it, expect } from 'vitest';
import { generateSlugFromCategoryName } from '../category-utils';

describe('category-utils', () => {
  it('chuyển đổi tên tiếng Việt có dấu sang slug chuẩn SEO', () => {
    expect(generateSlugFromCategoryName('Áo Sơ Mi Nam')).toBe('ao-so-mi-nam');
    expect(generateSlugFromCategoryName('Đầm & Váy Dạ Hội')).toBe('dam-vay-da-hoi');
    expect(generateSlugFromCategoryName('Quần Kaki / Chinos')).toBe('quan-kaki-chinos');
  });

  it('xử lý ký tự đặc biệt và khoảng trắng liên tiếp', () => {
    expect(generateSlugFromCategoryName('  Áo   Polo---Cao  Cấp  ')).toBe('ao-polo-cao-cap');
  });

  it('trả về chuỗi rỗng khi đầu vào rỗng hoặc không hợp lệ', () => {
    expect(generateSlugFromCategoryName('')).toBe('');
    expect(generateSlugFromCategoryName(null as any)).toBe('');
    expect(generateSlugFromCategoryName(undefined as any)).toBe('');
  });
});
