import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { PermissionGuard } from '../guards/PermissionGuard';

describe('PermissionGuard Component (UI RBAC & Role View Simulation)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('Bảo vệ ẩn nút khi user là STAFF và requireSuperAdmin', () => {
    localStorage.setItem('access_token', 'test-token');
    localStorage.setItem('user_role', 'STAFF');

    render(
      <PermissionGuard requireSuperAdmin fallback={<span data-testid="fallback">Access Denied</span>}>
        <button data-testid="delete-btn">Xóa tài khoản</button>
      </PermissionGuard>
    );

    expect(screen.queryByTestId('delete-btn')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('Hiển thị nút khi user là SUPER_ADMIN', () => {
    localStorage.setItem('access_token', 'admin-token');
    localStorage.setItem('user_role', 'SUPER_ADMIN');

    render(
      <PermissionGuard requireSuperAdmin>
        <button data-testid="delete-btn">Xóa tài khoản</button>
      </PermissionGuard>
    );

    expect(screen.getByTestId('delete-btn')).toBeInTheDocument();
  });

  it('Super Admin giả lập góc nhìn STAFF -> Ẩn nút SuperAdmin', () => {
    localStorage.setItem('access_token', 'admin-token');
    localStorage.setItem('user_role', 'SUPER_ADMIN');
    localStorage.setItem('view_as_role', 'STAFF'); // ĐANG GIẢ LẬP STAFF

    render(
      <PermissionGuard requireSuperAdmin fallback={<span data-testid="fallback">Access Denied</span>}>
        <button data-testid="delete-btn">Xóa tài khoản</button>
      </PermissionGuard>
    );

    expect(screen.queryByTestId('delete-btn')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });
});
