import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuickAddCategoryModal } from '../admin/QuickAddCategoryModal';
import { AdminCategoryManagerModal } from '../admin/AdminCategoryManagerModal';
import { ToastProvider } from '../../context/ToastContext';
import { Category } from '../../types';

const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Áo Khoác', slug: 'ao-khoac', description: 'Các mẫu áo khoác', is_active: true, products_count: 5 },
  { id: 'cat-2', name: 'Áo Thun', slug: 'ao-thun', description: 'Các mẫu áo thun cao cấp', is_active: true, products_count: 0 },
];

describe('QuickAddCategoryModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Tự động gợi ý slug chuẩn SEO khi nhập tên danh mục tiếng Việt', async () => {
    const user = userEvent.setup();
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <ToastProvider>
        <QuickAddCategoryModal isOpen={true} onClose={handleClose} onSuccess={handleSuccess} />
      </ToastProvider>
    );

    const nameInput = screen.getByPlaceholderText('VD: Áo Len, Quần Shorts...');
    await user.type(nameInput, 'Áo Khoác Gió');

    const slugInput = screen.getByPlaceholderText('VD: ao-len');
    expect(slugInput).toHaveValue('ao-khoac-gio');
  });

  it('Bấm chọn gợi ý danh mục phổ biến tự động điền tên và tạo slug', async () => {
    const user = userEvent.setup();
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <ToastProvider>
        <QuickAddCategoryModal isOpen={true} onClose={handleClose} onSuccess={handleSuccess} />
      </ToastProvider>
    );

    const presetBtn = screen.getByRole('button', { name: /Áo Len/i });
    await user.click(presetBtn);

    const nameInput = screen.getByPlaceholderText('VD: Áo Len, Quần Shorts...');
    expect(nameInput).toHaveValue('Áo Len');

    const slugInput = screen.getByPlaceholderText('VD: ao-len');
    expect(slugInput).toHaveValue('ao-len');
  });

  it('Gửi yêu cầu POST tạo danh mục mới đến /api/categories', async () => {
    const user = userEvent.setup();
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    const createdCategory = {
      id: 'cat-3',
      name: 'Áo Len',
      slug: 'ao-len',
      description: '',
      is_active: true,
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createdCategory),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(
      <ToastProvider>
        <QuickAddCategoryModal isOpen={true} onClose={handleClose} onSuccess={handleSuccess} />
      </ToastProvider>
    );

    const nameInput = screen.getByPlaceholderText('VD: Áo Len, Quần Shorts...');
    await user.type(nameInput, 'Áo Len');

    const submitBtn = screen.getByRole('button', { name: /Tạo danh mục/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/categories',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'Áo Len',
            slug: 'ao-len',
            parent_id: undefined,
          }),
        })
      );
      expect(handleSuccess).toHaveBeenCalledWith(createdCategory);
    });
  });
});

describe('AdminCategoryManagerModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Hiển thị danh sách danh mục, hỗ trợ tìm kiếm và hiển thị số lượng sản phẩm liên kết', async () => {
    const user = userEvent.setup();
    const handleCategoriesChange = vi.fn();
    const handleClose = vi.fn();

    render(
      <ToastProvider>
        <AdminCategoryManagerModal
          isOpen={true}
          onClose={handleClose}
          categories={mockCategories}
          onCategoriesChange={handleCategoriesChange}
        />
      </ToastProvider>
    );

    expect(screen.getByText(/Quản lý danh mục sản phẩm/i)).toBeInTheDocument();
    expect(screen.getByText('Áo Khoác')).toBeInTheDocument();
    expect(screen.getByText('ao-khoac')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    expect(screen.getByText('Áo Thun')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();

    // Test tìm kiếm
    const searchInput = screen.getByPlaceholderText('Tìm kiếm danh mục theo tên, slug...');
    await user.type(searchInput, 'Thun');

    expect(screen.queryByText('Áo Khoác')).not.toBeInTheDocument();
    expect(screen.getByText('Áo Thun')).toBeInTheDocument();
  });

  it('Mở popup xác nhận xóa và gọi DELETE API khi xác nhận xóa danh mục', async () => {
    const user = userEvent.setup();
    const handleCategoriesChange = vi.fn();
    const handleClose = vi.fn();

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(
      <ToastProvider>
        <AdminCategoryManagerModal
          isOpen={true}
          onClose={handleClose}
          categories={mockCategories}
          onCategoriesChange={handleCategoriesChange}
        />
      </ToastProvider>
    );

    // Bấm nút xóa của danh mục thứ hai (Áo Thun)
    const deleteButtons = screen.getAllByTitle('Xóa danh mục');
    await user.click(deleteButtons[1]);

    // Popup xác nhận xóa hiển thị
    expect(screen.getByText('Xác nhận xóa danh mục')).toBeInTheDocument();
    expect(screen.getByText(/Hành động này sẽ gỡ bỏ danh mục khỏi hệ thống cửa hàng/i)).toBeInTheDocument();

    // Click xác nhận xóa trong modal
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận xóa/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/categories/cat-2',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(handleCategoriesChange).toHaveBeenCalledWith([mockCategories[0]]);
    });
  });
});
