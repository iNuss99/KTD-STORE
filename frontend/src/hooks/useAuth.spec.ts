import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuth } from './useAuth';
import { clearAllAuth } from '../lib/auth-storage';

describe('useAuth Hook', () => {
  beforeEach(() => {
    clearAllAuth();
    localStorage.clear();
  });

  it('khởi tạo với trạng thái chưa đăng nhập khi không có token trong localStorage', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    expect(result.current.role).toBeNull();
    expect(result.current.isInternalStaff).toBe(false);
    expect(result.current.isSuperAdmin).toBe(false);
  });

  it('nhận diện chính xác phiên đăng nhập của Khách hàng (CUSTOMER)', () => {
    localStorage.setItem('access_token', 'mock-customer-token');
    localStorage.setItem('user_role', 'CUSTOMER');

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('mock-customer-token');
    expect(result.current.role).toBe('CUSTOMER');
    expect(result.current.isInternalStaff).toBe(false);
    expect(result.current.canDeleteUser).toBe(false);
    expect(result.current.canViewAuditLogs).toBe(false);
  });

  it('nhận diện đầy đủ đặc quyền quản trị của SUPER_ADMIN', () => {
    localStorage.setItem('admin_access_token', 'mock-admin-token');
    localStorage.setItem('admin_user_role', 'SUPER_ADMIN');

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('mock-admin-token');
    expect(result.current.role).toBe('SUPER_ADMIN');
    expect(result.current.isSuperAdmin).toBe(true);
    expect(result.current.isInternalStaff).toBe(true);
    expect(result.current.canDeleteUser).toBe(true);
    expect(result.current.canViewAuditLogs).toBe(true);
    expect(result.current.canManualOverrideOrder).toBe(true);
  });

  it('cho phép SUPER_ADMIN giả lập quyền (View As / Simulation) sang STAFF và phục hồi', () => {
    localStorage.setItem('admin_access_token', 'mock-admin-token');
    localStorage.setItem('admin_user_role', 'SUPER_ADMIN');

    const { result } = renderHook(() => useAuth());

    expect(result.current.isSuperAdmin).toBe(true);
    expect(result.current.isSimulating).toBe(false);

    // Kích hoạt giả lập quyền STAFF
    act(() => {
      result.current.setSimulatedRole('STAFF');
    });

    expect(result.current.role).toBe('STAFF');
    expect(result.current.actualRole).toBe('SUPER_ADMIN');
    expect(result.current.simulatedRole).toBe('STAFF');
    expect(result.current.isSimulating).toBe(true);
    expect(result.current.isStaff).toBe(true);
    expect(result.current.isSuperAdmin).toBe(false);
    expect(result.current.canDeleteUser).toBe(false); // Bị giới hạn quyền theo vai trò giả lập

    // Khôi phục về quyền gốc
    act(() => {
      result.current.setSimulatedRole(null);
    });

    expect(result.current.role).toBe('SUPER_ADMIN');
    expect(result.current.isSimulating).toBe(false);
    expect(result.current.isSuperAdmin).toBe(true);
    expect(result.current.canDeleteUser).toBe(true);
  });
});
