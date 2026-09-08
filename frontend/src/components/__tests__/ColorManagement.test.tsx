import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuickAddColorModal } from '../admin/QuickAddColorModal';
import { AdminColorManagerModal } from '../admin/AdminColorManagerModal';
import { ToastProvider } from '../../context/ToastContext';
import { Color } from '../../types';

const mockColors: Color[] = [
  { id: 'c1', name: 'Đen', code: 'BLK', hex_code: '#000000' },
  { id: 'c2', name: 'Trắng', code: 'WHT', hex_code: '#FFFFFF' },
];

describe('QuickAddColorModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Tự động gợi ý mã SKU khi nhập tên màu', async () => {
    const user = userEvent.setup();
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <ToastProvider>
        <QuickAddColorModal isOpen={true} onClose={handleClose} onSuccess={handleSuccess} />
      </ToastProvider>
    );

    const nameInput = screen.getByPlaceholderText('VD: Xanh Rêu, Be / Kem, Hồng Pastel...');
    await user.type(nameInput, 'Xanh Rêu');

    expect(screen.getByText('XRE')).toBeInTheDocument();
  });

  it('Bấm chọn bảng màu thịnh hành tự động điền thông tin và sinh mã SKU', async () => {
    const user = userEvent.setup();
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <ToastProvider>
        <QuickAddColorModal isOpen={true} onClose={handleClose} onSuccess={handleSuccess} />
      </ToastProvider>
    );

    const presetBtn = screen.getByRole('button', { name: /Đỏ Đô/i });
    await user.click(presetBtn);

    const nameInput = screen.getByPlaceholderText('VD: Xanh Rêu, Be / Kem, Hồng Pastel...');
    expect(nameInput).toHaveValue('Đỏ Đô');
    expect(screen.getByText('DDO')).toBeInTheDocument();
  });

  it('Gửi yêu cầu POST tạo màu không cần nhập code thủ công', async () => {
    const user = userEvent.setup();
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    const createdColor = { id: 'c3', name: 'Xanh Rêu', code: 'XRE', hex_code: '#2E4F4F' };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createdColor),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(
      <ToastProvider>
        <QuickAddColorModal isOpen={true} onClose={handleClose} onSuccess={handleSuccess} />
      </ToastProvider>
    );

    const nameInput = screen.getByPlaceholderText('VD: Xanh Rêu, Be / Kem, Hồng Pastel...');
    await user.type(nameInput, 'Xanh Rêu');

    const submitBtn = screen.getByRole('button', { name: /Lưu & Chọn màu này/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/products/colors',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'Xanh Rêu',
            hex_code: '#2E4F4F',
          }),
        })
      );
      expect(handleSuccess).toHaveBeenCalledWith(createdColor);
    });
  });
});

describe('AdminColorManagerModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Hiển thị danh sách màu sắc, mở popup xác nhận xóa và gọi DELETE API khi xác nhận', async () => {
    const user = userEvent.setup();
    const handleColorsChange = vi.fn();
    const handleClose = vi.fn();

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(
      <ToastProvider>
        <AdminColorManagerModal
          isOpen={true}
          onClose={handleClose}
          colors={mockColors}
          onColorsChange={handleColorsChange}
        />
      </ToastProvider>
    );

    expect(screen.getByText(/Quản lý & Xóa Bảng Màu Sắc/i)).toBeInTheDocument();
    expect(screen.getByText('Đen')).toBeInTheDocument();
    expect(screen.getByText('BLK')).toBeInTheDocument();

    const deleteButtons = screen.getAllByRole('button', { name: /Xóa/i });
    expect(deleteButtons.length).toBeGreaterThan(0);

    // Click xóa một dòng màu
    await user.click(deleteButtons[0]);

    // Popup xác nhận xóa hiển thị thay cho window.confirm
    expect(screen.getByText('Xác nhận xóa màu')).toBeInTheDocument();
    expect(screen.getByText(/Hành động này sẽ gỡ bỏ màu sắc khỏi danh sách hệ thống/i)).toBeInTheDocument();

    // Click nút Xác nhận xóa trong popup
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận xóa/i });
    await user.click(confirmBtn);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/products/colors/c1',
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(handleColorsChange).toHaveBeenCalledWith([mockColors[1]]);
  });
});
