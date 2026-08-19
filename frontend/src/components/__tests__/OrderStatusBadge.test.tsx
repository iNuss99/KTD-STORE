import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OrderStatusBadge } from '../admin/OrderStatusBadge';

describe('OrderStatusBadge Component', () => {
  it('Render đúng nhãn và màu sắc cho trạng thái PENDING', () => {
    render(<OrderStatusBadge status="PENDING" />);
    const badge = screen.getByText('Mới (Chờ xác nhận)');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-amber-100');
  });

  it('Render đúng nhãn và màu sắc cho trạng thái DELIVERED', () => {
    render(<OrderStatusBadge status="DELIVERED" />);
    const badge = screen.getByText('Đã giao thành công');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-emerald-100');
  });

  it('Render đúng nhãn và màu sắc cho trạng thái CANCELLED', () => {
    render(<OrderStatusBadge status="CANCELLED" />);
    const badge = screen.getByText('Đã hủy');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-200');
  });
});
