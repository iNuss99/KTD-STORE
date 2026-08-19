import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartPage } from '../storefront/CartPage';
import { LanguageProvider } from '../../context/LanguageContext';
import * as useCartHook from '../../hooks/useCart';

vi.mock('../../hooks/useCart');

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('CartPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('access_token', 'mock-token');
  });

  it('Hiển thị cảnh báo và khóa nút Checkout khi có sản phẩm hết hàng (is_available === false)', () => {
    vi.spyOn(useCartHook, 'useCart').mockReturnValue({
      data: {
        id: 'cart-1',
        user_id: 'u-1',
        items: [
          {
            id: 'item-1',
            cart_id: 'cart-1',
            variant_id: 'v-1',
            quantity: 1,
            effective_price: 300000,
            is_available: false, // HẾT HÀNG / KHÔNG KHẢ DỤNG
            current_stock: 0,
            variant: {
              id: 'v-1',
              sku: 'TEST-SKU',
              product: { id: 'p-1', name: 'Áo thun Nam' },
              size: { id: 's-1', name: 'M' },
              color: { id: 'c-1', name: 'Đen' },
            },
          },
        ],
      },
      isLoading: false,
    } as any);

    vi.spyOn(useCartHook, 'useUpdateCartItemMutation').mockReturnValue({ isPending: false } as any);
    vi.spyOn(useCartHook, 'useRemoveCartItemMutation').mockReturnValue({ isPending: false } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <MemoryRouter>
            <CartPage />
          </MemoryRouter>
        </LanguageProvider>
      </QueryClientProvider>
    );

    // Kiểm tra có banner cảnh báo
    expect(
      screen.getByText(/Có sản phẩm trong giỏ hàng đã hết hàng hoặc không khả dụng/i)
    ).toBeInTheDocument();

    // Kiểm tra nút Tiến hành thanh toán bị disabled
    const checkoutBtn = screen.getByRole('button', { name: /Tiến hành thanh toán/i });
    expect(checkoutBtn).toBeDisabled();
  });
});
