import { describe, it, expect, beforeEach } from 'vitest';
import { getAuthToken, setAuthToken, clearAuthToken, getAuthHeader } from '../auth-storage';

describe('auth-storage utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lưu và đọc token từ access_token key', () => {
    setAuthToken('test-token-123');
    expect(getAuthToken()).toBe('test-token-123');
    expect(getAuthHeader()).toEqual({ Authorization: 'Bearer test-token-123' });
  });

  it('tự động migrate từ key cũ token sang access_token', () => {
    localStorage.setItem('token', 'old-token-456');
    expect(getAuthToken()).toBe('old-token-456');
    // Đã dọn dẹp key cũ 'token'
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('access_token')).toBe('old-token-456');
  });

  it('xóa sạch token khi logout', () => {
    setAuthToken('test-token-789');
    localStorage.setItem('user', JSON.stringify({ full_name: 'Test' }));
    clearAuthToken();
    expect(getAuthToken()).toBeNull();
    expect(getAuthHeader()).toEqual({});
    expect(localStorage.getItem('user')).toBeNull();
  });
});
