import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCart, useAddToCartMutation } from './useCart';
import { setAuthToken, clearAuthToken } from '../lib/auth-storage';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCart Hook', () => {
  beforeEach(() => {
    clearAuthToken();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('không gửi request và trả về undefined/null khi chưa có token đăng nhập', async () => {
    const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });

    expect(result.current.data).toBeUndefined();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('gửi request kèm Bearer token và lấy giỏ hàng thành công khi đã đăng nhập', async () => {
    setAuthToken('valid-cart-token');

    const mockCart = {
      id: 'cart-1',
      items: [
        { id: 'item-1', variant_id: 'var-1', quantity: 2, price: 150000 },
      ],
      total: 300000,
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockCart,
    });

    const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/cart',
      expect.objectContaining({
        headers: { Authorization: 'Bearer valid-cart-token' },
      }),
    );
    expect(result.current.data).toEqual(mockCart);
  });

  it('tự động dọn dẹp token và trả về null khi backend phản hồi 401 Unauthorized', async () => {
    setAuthToken('expired-cart-token');

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    });

    const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    // Token phải bị tự động dọn dẹp khỏi localStorage khi nhận 401
    await waitFor(() => expect(localStorage.getItem('access_token')).toBeNull());
  });

  it('thêm sản phẩm vào giỏ hàng qua useAddToCartMutation thành công', async () => {
    setAuthToken('valid-cart-token');

    const updatedCart = {
      id: 'cart-1',
      items: [{ id: 'item-2', variant_id: 'var-new', quantity: 1, price: 200000 }],
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => updatedCart,
    });

    const { result } = renderHook(() => useAddToCartMutation(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({ variant_id: 'var-new', quantity: 1 });
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/cart/items',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ variant_id: 'var-new', quantity: 1 }),
      }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
