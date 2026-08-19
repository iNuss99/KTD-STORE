import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { VariantSelector } from '../storefront/VariantSelector';
import { ProductVariant } from '../../types';

const mockVariants: ProductVariant[] = [
  {
    id: 'v1',
    product_id: 'p1',
    size_id: 's-m',
    color_id: 'c-red',
    sku: 'NK-TSHIRT-M-RED',
    effective_price: 250000,
    stock_quantity: 5,
    is_active: true,
    size: { id: 's-m', code: 'M', name: 'Medium' },
    color: { id: 'c-red', code: 'RED', name: 'Đỏ', hex_code: '#FF0000' },
  },
  {
    id: 'v2',
    product_id: 'p1',
    size_id: 's-l',
    color_id: 'c-red',
    sku: 'NK-TSHIRT-L-RED',
    effective_price: 250000,
    stock_quantity: 0, // HẾT HÀNG
    is_active: true,
    size: { id: 's-l', code: 'L', name: 'Large' },
    color: { id: 'c-red', code: 'RED', name: 'Đỏ', hex_code: '#FF0000' },
  },
];

describe('VariantSelector Component', () => {
  it('Disable nút Size nếu biến thể đó hết hàng (stock_quantity === 0)', () => {
    const handleSelect = vi.fn();
    render(<VariantSelector variants={mockVariants} onVariantSelect={handleSelect} />);

    // Size M còn hàng -> enabled
    const sizeMBtn = screen.getByRole('button', { name: 'M' });
    expect(sizeMBtn).not.toBeDisabled();

    // Size L hết hàng -> disabled
    const sizeLBtn = screen.getByRole('button', { name: 'L' });
    expect(sizeLBtn).toBeDisabled();
    expect(sizeLBtn).toHaveClass('cursor-not-allowed');
  });

  it('Không thể click chọn size bị hết hàng', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<VariantSelector variants={mockVariants} onVariantSelect={handleSelect} />);

    const sizeLBtn = screen.getByRole('button', { name: 'L' });
    await user.click(sizeLBtn);

    // callback không được gọi với v2
    expect(handleSelect).not.toHaveBeenCalledWith(expect.objectContaining({ id: 'v2' }));
  });
});
