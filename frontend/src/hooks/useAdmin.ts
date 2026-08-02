import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/reports/dashboard', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Không thể tải dữ liệu Báo cáo Dashboard');
      return res.json();
    },
  });
}

export function useAdminOrders() {
  return useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Không thể tải danh sách Đơn hàng');
      return res.json();
    },
  });
}

export function useAdminDiscounts() {
  return useQuery({
    queryKey: ['admin', 'discounts'],
    queryFn: async () => {
      const res = await fetch('/api/discounts', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Không thể tải danh sách Mã giảm giá');
      return res.json();
    },
  });
}

export function useAdminReturns() {
  return useQuery({
    queryKey: ['admin', 'returns'],
    queryFn: async () => {
      const res = await fetch('/api/returns', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Không thể tải danh sách Yêu cầu đổi trả');
      return res.json();
    },
  });
}

export function useAdminAuditLogs() {
  return useQuery({
    queryKey: ['admin', 'audit-logs'],
    queryFn: async () => {
      const res = await fetch('/api/audit-logs', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Không thể tải Nhật ký hệ thống');
      return res.json();
    },
  });
}
