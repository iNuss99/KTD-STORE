import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ConfirmDeleteColorModal } from '../admin/ConfirmDeleteColorModal';
import { Color } from '../../types';

describe('ConfirmDeleteColorModal Component', () => {
  const mockColor: Color = {
    id: 'clr-test',
    name: 'Ghi / Xám',
    code: 'GRY',
    hex_code: '#64748B',
  };

  it('Không render khi isOpen = false hoặc color = null', () => {
    const { rerender } = render(
      <ConfirmDeleteColorModal
        isOpen={false}
        color={mockColor}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.queryByText(/Xác nhận xóa màu/i)).not.toBeInTheDocument();

    rerender(
      <ConfirmDeleteColorModal
        isOpen={true}
        color={null}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.queryByText(/Xác nhận xóa màu/i)).not.toBeInTheDocument();
  });

  it('Render đúng thông tin màu sắc và các nút thao tác khi isOpen = true', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <ConfirmDeleteColorModal
        isOpen={true}
        color={mockColor}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    );

    expect(screen.getByText('Xác nhận xóa màu')).toBeInTheDocument();
    expect(screen.getByText('Ghi / Xám')).toBeInTheDocument();
    expect(screen.getByText('GRY')).toBeInTheDocument();
    expect(screen.getByText(/Lưu ý: Nếu màu này đang được dùng trong sản phẩm/i)).toBeInTheDocument();

    // Click Hủy bỏ
    const cancelBtn = screen.getByRole('button', { name: /Hủy bỏ/i });
    await user.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Click Xác nhận xóa
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận xóa/i });
    await user.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('Đóng popup khi nhấn phím Escape', () => {
    const handleClose = vi.fn();

    render(
      <ConfirmDeleteColorModal
        isOpen={true}
        color={mockColor}
        onClose={handleClose}
        onConfirm={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });

  it('Khóa các nút thao tác và hiển thị loading spinner khi isLoading = true', () => {
    render(
      <ConfirmDeleteColorModal
        isOpen={true}
        color={mockColor}
        isLoading={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Hủy bỏ/i });
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận xóa/i });

    expect(cancelBtn).toBeDisabled();
    expect(confirmBtn).toBeDisabled();
  });
});
