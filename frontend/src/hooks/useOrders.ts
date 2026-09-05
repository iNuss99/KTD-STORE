import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Order } from '../types';
import { getAuthToken, getAuthHeader } from '../lib/auth-storage';

export function useMyOrders() {
  const token = getAuthToken();

  return useQuery<Order[]>({
    queryKey: ['orders', 'my'],
    queryFn: async () => {
      if (!token) return [];
      const res = await fetch('/api/orders/my', {
        headers: getAuthHeader(),
      });
      if (!res.ok) {
        throw new Error('Không thể tải danh sách đơn hàng');
      }
      return res.json();
    },
    enabled: !!token,
    staleTime: 30_000, // 30s cache để tránh spam request khi chuyển trang; mutations tự động invalidate
  });
}

export function useOrderDetail(id?: string) {
  const token = getAuthToken();

  return useQuery<Order>({
    queryKey: ['orders', 'detail', id],
    queryFn: async () => {
      if (!id) throw new Error('ID đơn hàng không hợp lệ');
      const res = await fetch(`/api/orders/${id}`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) {
        throw new Error('Không tìm thấy thông tin đơn hàng');
      }
      return res.json();
    },
    enabled: !!token && !!id,
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      address_id?: string;
      shipping_address?: string;
      receiver_name?: string;
      receiver_phone?: string;
      payment_method: string;
      discount_code?: string;
      note?: string;
    }) => {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Không thể tạo đơn hàng');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useSandboxPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, payment_method }: { orderId: string; payment_method: string }) => {
      const res = await fetch(`/api/orders/${orderId}/sandbox-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ payment_method }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Thanh toán Sandbox không thành công');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'my'] });
    },
  });
}
