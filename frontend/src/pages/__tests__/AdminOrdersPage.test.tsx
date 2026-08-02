import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminOrdersPage } from '../AdminOrdersPage';
import { ToastProvider } from '../../context/ToastContext';

describe('AdminOrdersPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Hiển thị nút hành động đúng theo thứ tự trạng thái đơn hàng (PENDING -> CONFIRMED)', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'access_token') return 'admin-token';
      if (key === 'user_role') return 'MANAGER';
      return null;
    });

    const mockOrders = [
      {
        id: 'ord-pending-12345678',
        user_id: 'u-1',
        status: 'PENDING', // Đơn mới
        subtotal: 500000,
        discount_amount: 0,
        shipping_fee: 0,
        total: 500000,
        created_at: new Date().toISOString(),
        shipping_snapshot: { receiver_name: 'Nguyen Van A', phone: '0901234567', address_line: '123 Le Loi', province: 'HCM' },
        payments: [{ method: 'COD', status: 'PENDING' }],
      },
    ];

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => {
      return {
        ok: true,
        json: async () => mockOrders,
      } as Response;
    }));

    render(
      <ToastProvider>
        <MemoryRouter>
          <AdminOrdersPage />
        </MemoryRouter>
      </ToastProvider>
    );

    // Chờ đơn PENDING hiển thị nút "Xác nhận đơn"
    const confirmBtn = await screen.findByRole('button', { name: 'Xác nhận đơn' });
    expect(confirmBtn).toBeInTheDocument();

    // Đơn PENDING không được có nút "Đóng gói" hay "Giao vận chuyển"
    expect(screen.queryByRole('button', { name: 'Đóng gói' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Giao vận chuyển' })).not.toBeInTheDocument();
  });
});
