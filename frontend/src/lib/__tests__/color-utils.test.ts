import { describe, it, expect } from 'vitest';
import { generateColorSkuCode, removeVietnameseTones, isValidHexCode } from '../color-utils';

describe('color-utils', () => {
  describe('removeVietnameseTones', () => {
    it('loại bỏ dấu tiếng Việt chính xác', () => {
      expect(removeVietnameseTones('Xanh Rêu')).toBe('Xanh Reu');
      expect(removeVietnameseTones('Đỏ Đô')).toBe('Do Do');
      expect(removeVietnameseTones('Nâu Đất')).toBe('Nau Dat');
    });
  });

  describe('generateColorSkuCode', () => {
    it('gợi ý mã viết tắt cho từ đơn', () => {
      expect(generateColorSkuCode('Đen')).toBe('DEN');
      expect(generateColorSkuCode('Be')).toBe('BE');
    });

    it('gợi ý mã viết tắt 3 ký tự cho 2 từ', () => {
      expect(generateColorSkuCode('Xanh Rêu')).toBe('XRE');
      expect(generateColorSkuCode('Hồng Pastel')).toBe('HPA');
      expect(generateColorSkuCode('Đỏ Đô')).toBe('DDO');
    });

    it('gợi ý mã viết tắt dạng ký tự đầu cho cụm từ dài', () => {
      expect(generateColorSkuCode('Xanh Lá Cây')).toBe('XLC');
    });
  });

  describe('isValidHexCode', () => {
    it('xác thực đúng định dạng hex hợp lệ', () => {
      expect(isValidHexCode('#FFF')).toBe(true);
      expect(isValidHexCode('#000000')).toBe(true);
      expect(isValidHexCode('#2E4F4F')).toBe(true);
      expect(isValidHexCode('2E4F4F')).toBe(false);
      expect(isValidHexCode('#GGG')).toBe(false);
      expect(isValidHexCode('')).toBe(false);
    });
  });
});
