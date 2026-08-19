import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VariantSelector } from '../../components/storefront/VariantSelector';
import { CartPage } from '../storefront/CartPage';
import { ProductVariant } from '../../types';

// Mock auth storage token
vi.mock('../../lib/auth-storage', () => ({
  getAuthToken: () => 'mock-jwt-token',
  getAuthHeader: () => ({ Authorization: 'Bearer mock-jwt-token' }),
}));

// Mock useCart hook
const mockUseCart = vi.fn();
vi.mock('../../hooks/useCart', () => ({
  useCart: () => mockUseCart(),
  useUpdateCartItemMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveCartItemMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Redesign UI & Business Rule Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Trạng thái hết hàng (stock_quantity = 0) ở trang chi tiết sản phẩm hiển thị dạng bị khóa (disabled + line-through)', () => {
    const mockVariants: ProductVariant[] = [
      {
        id: 'v-m-in-stock',
        product_id: 'p1',
        size_id: 's-m',
        color_id: 'c-black',
        sku: 'MWH-TSHIRT-M',
        effective_price: 350000,
        stock_quantity: 10,
        is_active: true,
        size: { id: 's-m', code: 'M', name: 'Medium' },
        color: { id: 'c-black', code: 'BLK', name: 'Đen', hex_code: '#000000' },
      },
      {
        id: 'v-l-out-of-stock',
        product_id: 'p1',
        size_id: 's-l',
        color_id: 'c-black',
        sku: 'MWH-TSHIRT-L',
        effective_price: 350000,
        stock_quantity: 0, // HẾT HÀNG
        is_active: true,
        size: { id: 's-l', code: 'L', name: 'Large' },
        color: { id: 'c-black', code: 'BLK', name: 'Đen', hex_code: '#000000' },
      },
    ];

    const onSelect = vi.fn();
    render(<VariantSelector variants={mockVariants} onVariantSelect={onSelect} />);

    // Size M còn hàng -> enabled
    const sizeMBtn = screen.getByRole('button', { name: 'M' });
    expect(sizeMBtn).not.toBeDisabled();

    // Size L hết hàng -> disabled
    const sizeLBtn = screen.getByRole('button', { name: 'L' });
    expect(sizeLBtn).toBeDisabled();
    expect(sizeLBtn).toHaveClass('line-through');
  });

  it('2. Giỏ hàng hiển thị cảnh báo và KHÓA nút Tiến hành đặt hàng khi có sản phẩm bị hết hàng', () => {
    mockUseCart.mockReturnValue({
      data: {
        id: 'cart-1',
        user_id: 'u-1',
        items: [
          {
            id: 'item-1',
            cart_id: 'cart-1',
            variant_id: 'v-out-of-stock',
            quantity: 2,
            added_at: '2026-08-02',
            effective_price: 490000,
            is_available: false,
            current_stock: 0,
            variant: {
              id: 'v-out-of-stock',
              product_id: 'p-1',
              size_id: 's-xl',
              color_id: 'c-white',
              sku: 'MWH-SHIRT-XL',
              stock_quantity: 0,
              is_active: true,
              size: { id: 's-xl', code: 'XL', name: 'X-Large' },
              color: { id: 'c-white', code: 'WHT', name: 'Trắng' },
              product: {
                id: 'p-1',
                name: 'Áo Sơ Mi Premium',
                base_price: 490000,
                code: 'MWH-P1',
                slug: 'ao-so-mi-premium',
                brand_id: 'b1',
                category_id: 'c1',
                is_active: true,
                created_at: '2026-08-01',
              },
            },
          },
        ],
      },
      isLoading: false,
    });

    renderWithProviders(<CartPage />);

    // Warning message appears
    expect(
      screen.getByText(/Phát hiện sản phẩm không đủ tồn kho!/i)
    ).toBeInTheDocument();

    // Checkout button is disabled
    const checkoutBtn = screen.getByRole('button', { name: /Tiến hành thanh toán/i });
    expect(checkoutBtn).toBeDisabled();
  });

  it('3. Áp dụng mã giảm giá không hợp lệ hiển thị thông báo lỗi rõ ràng', async () => {
    mockUseCart.mockReturnValue({
      data: {
        id: 'cart-1',
        user_id: 'u-1',
        items: [
          {
            id: 'item-1',
            cart_id: 'cart-1',
            variant_id: 'v-1',
            quantity: 1,
            added_at: '2026-08-02',
            effective_price: 500000,
            is_available: true,
            current_stock: 10,
            variant: {
              id: 'v-1',
              product_id: 'p-1',
              size_id: 's-m',
              color_id: 'c-black',
              sku: 'MWH-M',
              stock_quantity: 10,
              is_active: true,
              size: { id: 's-m', code: 'M', name: 'Medium' },
              color: { id: 'c-black', code: 'BLK', name: 'Đen' },
              product: {
                id: 'p-1',
                name: 'Áo Polo',
                base_price: 500000,
                code: 'MWH-P2',
                slug: 'ao-polo',
                brand_id: 'b1',
                category_id: 'c1',
                is_active: true,
                created_at: '2026-08-01',
              },
            },
          },
        ],
      },
      isLoading: false,
    });

    // Mock fetch validation error
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Mã giảm giá đã hết lượt sử dụng' }),
    });

    const user = userEvent.setup();
    renderWithProviders(<CartPage />);

    const promoInput = screen.getByPlaceholderText(/Nhập mã giảm giá.../i);
    const applyBtn = screen.getByRole('button', { name: /Áp dụng/i });

    await user.type(promoInput, 'EXPIRED20');
    await user.click(applyBtn);

    await waitFor(() => {
      expect(screen.getByText(/Mã giảm giá đã hết lượt sử dụng/i)).toBeInTheDocument();
    });
  });
});
