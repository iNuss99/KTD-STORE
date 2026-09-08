import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ConfirmDeleteVariantModal } from '../admin/ConfirmDeleteVariantModal';
import { ProductVariant } from '../../types';

describe('ConfirmDeleteVariantModal Component', () => {
  const mockVariant: ProductVariant = {
    id: 'var-test-1',
    product_id: 'prod-1',
    size_id: 'size-m',
    color_id: 'clr-wht',
    sku: 'GEN-SP-0268-9MQ0-M-WHT',
    stock_quantity: 50,
    price_override: 250000,
    is_active: true,
    size: {
      id: 'size-m',
      name: 'M',
      code: 'M',
    },
    color: {
      id: 'clr-wht',
      name: 'Trắng',
      code: 'WHT',
      hex_code: '#FFFFFF',
    },
  };

  it('Không render khi isOpen = false hoặc variant = null', () => {
    const { rerender } = render(
      <ConfirmDeleteVariantModal
        isOpen={false}
        variant={mockVariant}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.queryByText(/Xác nhận xóa biến thể/i)).not.toBeInTheDocument();

    rerender(
      <ConfirmDeleteVariantModal
        isOpen={true}
        variant={null}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.queryByText(/Xác nhận xóa biến thể/i)).not.toBeInTheDocument();
  });

  it('Render đúng thông tin biến thể SKU, Size, Màu sắc, Tồn kho và các nút thao tác khi isOpen = true', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <ConfirmDeleteVariantModal
        isOpen={true}
        variant={mockVariant}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    );

    expect(screen.getByText('Xác nhận xóa biến thể')).toBeInTheDocument();
    expect(screen.getByText('GEN-SP-0268-9MQ0-M-WHT')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('Trắng')).toBeInTheDocument();
    expect(screen.getByText(/50 sản phẩm/i)).toBeInTheDocument();
    expect(screen.getByText(/250.000\s*₫/i)).toBeInTheDocument();
    expect(screen.getByText(/Hành động này không thể hoàn tác/i)).toBeInTheDocument();

    // Click Hủy bỏ
    const cancelBtn = screen.getByRole('button', { name: /Hủy bỏ/i });
    await user.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Click Xóa biến thể
    const confirmBtn = screen.getByRole('button', { name: /Xóa biến thể/i });
    await user.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('Đóng modal khi nhấn phím Escape', () => {
    const handleClose = vi.fn();

    render(
      <ConfirmDeleteVariantModal
        isOpen={true}
        variant={mockVariant}
        onClose={handleClose}
        onConfirm={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });

  it('Khóa các nút thao tác và hiển thị loading khi isLoading = true', () => {
    render(
      <ConfirmDeleteVariantModal
        isOpen={true}
        variant={mockVariant}
        isLoading={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Hủy bỏ/i });
    const confirmBtn = screen.getByRole('button', { name: /Đang xóa.../i });

    expect(cancelBtn).toBeDisabled();
    expect(confirmBtn).toBeDisabled();
  });
});
