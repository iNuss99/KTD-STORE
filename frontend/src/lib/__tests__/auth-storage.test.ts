import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  getAuthHeader,
  setActiveSession,
  getUserRole,
  getUserName,
  setAdminActiveSession,
  getAdminAuthToken,
} from '../auth-storage';

describe('auth-storage utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lưu và đọc token từ access_token key', () => {
    setAuthToken('test-token-123');
    expect(getAuthToken()).toBe('test-token-123');
    expect(getAuthHeader()).toEqual({ Authorization: 'Bearer test-token-123' });
  });

  it('xóa sạch token khi logout', () => {
    setAuthToken('test-token-789');
    localStorage.setItem('user', JSON.stringify({ full_name: 'Test' }));
    clearAuthToken();
    expect(getAuthToken()).toBeNull();
    expect(getAuthHeader()).toEqual({});
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('duy trì chính xác phiên đăng nhập khi F5 và không bị lật role', () => {
    // 1. Đăng nhập tài khoản Khách hàng
    setActiveSession({
      accessToken: 'customer-jwt-token',
      user: { id: 'cust-1', role: 'CUSTOMER', full_name: 'Nguyen Khach Hang' },
    });

    // F5 / đọc lại storage: phải là Khách hàng, không thể bị biến thành Admin
    expect(getAuthToken()).toBe('customer-jwt-token');
    expect(getUserRole()).toBe('CUSTOMER');
    expect(getUserName()).toBe('Nguyen Khach Hang');

    // 2. Đăng nhập tài khoản Admin: tự động dọn dẹp sạch sẽ phiên cũ
    setActiveSession({
      accessToken: 'admin-jwt-token',
      user: { id: 'adm-1', role: 'SUPER_ADMIN', full_name: 'Super Admin Demo' },
    });

    // F5 / đọc lại storage: phải là Admin, không bị văng về khách cũ
    expect(getAuthToken()).toBe('admin-jwt-token');
    expect(getUserRole()).toBe('SUPER_ADMIN');
    expect(getUserName()).toBe('Super Admin Demo');

    // 3. Đăng xuất: dọn dẹp sạch toàn bộ
    clearAuthToken();
    expect(getAuthToken()).toBeNull();
    expect(getUserRole()).toBeNull();
    expect(getUserName()).toBeNull();
  });

  it('cô lập hoàn toàn giữa Admin namespace và Customer namespace', () => {
    // 1. Admin login trong CRM
    setAdminActiveSession({
      accessToken: 'admin-jwt-test',
      user: { id: 'admin-1', role: 'SUPER_ADMIN', full_name: 'Super Admin Default' },
    });

    // Admin namespace có dữ liệu
    expect(getAdminAuthToken()).toBe('admin-jwt-test');

    // Customer namespace KHÔNG bị ghi đè hay rò rỉ token admin
    expect(getAuthToken()).toBeNull();
    expect(getUserRole()).toBeNull();
    expect(getUserName()).toBeNull();
    expect(getAuthHeader()).toEqual({});

    // 2. setActiveSession() xóa admin namespace để đảm bảo isolation hoàn toàn
    // Behavior đúng: không cho phép cùng lúc có session admin + customer trên 1 browser
    setActiveSession({
      accessToken: 'customer-jwt-test',
      user: { id: 'cust-1', role: 'CUSTOMER', full_name: 'Nguyen Van Khach' },
    });

    // Customer namespace active
    expect(getAuthToken()).toBe('customer-jwt-test');
    expect(getUserRole()).toBe('CUSTOMER');
    expect(getUserName()).toBe('Nguyen Van Khach');
    expect(getAuthHeader()).toEqual({ Authorization: 'Bearer customer-jwt-test' });

    // Admin namespace đã bị xóa — isolation đảm bảo
    expect(getAdminAuthToken()).toBeNull();

    // 3. Khách hàng đăng xuất
    clearAuthToken();
    expect(getAuthToken()).toBeNull();
    expect(getUserRole()).toBeNull();
  });
});
