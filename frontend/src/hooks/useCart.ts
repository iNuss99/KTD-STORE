import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Cart } from '../types';
import { getAuthHeader, clearAuthToken } from '../lib/auth-storage';
import { useAuth } from './useAuth';

export function useCart() {
  const { token } = useAuth();

  return useQuery<Cart | null>({
    queryKey: ['cart'],
    queryFn: async () => {
      if (!token) return null;
      const res = await fetch('/api/cart', {
        headers: getAuthHeader(),
      });
      if (res.status === 401) {
        clearAuthToken();
        return null;
      }
      if (!res.ok) {
        throw new Error('Không thể tải dữ liệu giỏ hàng');
      }
      return res.json();
    },
    enabled: !!token,
    staleTime: 0, // Giỏ hàng luôn phản ánh dữ liệu mới nhất
  });
}

export function useAddToCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ variant_id, quantity }: { variant_id: string; quantity: number }) => {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ variant_id, quantity }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Không thể thêm vào giỏ hàng');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useUpdateCartItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Không thể cập nhật số lượng');
      }
      return res.json();
    },
    onSuccess: (updatedCart) => {
      // setQueryData trực tiếp — không cần invalidateQueries thêm để tránh double fetch
      queryClient.setQueryData(['cart'], updatedCart);
    },
  });
}

export function useRemoveCartItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      if (!res.ok) {
        throw new Error('Không thể xóa sản phẩm khỏi giỏ hàng');
      }
      return res.json();
    },
    onSuccess: (updatedCart) => {
      // setQueryData trực tiếp — không cần invalidateQueries thêm để tránh double fetch
      queryClient.setQueryData(['cart'], updatedCart);
    },
  });
}
