import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OrderStatusBadge } from '../admin/OrderStatusBadge';

describe('OrderStatusBadge Component', () => {
  it('Render đúng nhãn cho trạng thái PENDING', () => {
    render(<OrderStatusBadge status="PENDING" />);
    expect(screen.getByText('Mới (Chờ xác nhận)')).toBeInTheDocument();
  });

  it('Render đúng nhãn cho trạng thái DELIVERED', () => {
    render(<OrderStatusBadge status="DELIVERED" />);
    expect(screen.getByText('Đã giao thành công')).toBeInTheDocument();
  });

  it('Render đúng nhãn cho trạng thái CANCELLED', () => {
    render(<OrderStatusBadge status="CANCELLED" />);
    expect(screen.getByText('Đã hủy')).toBeInTheDocument();
  });

  it('Render đúng nhãn cho trạng thái CONFIRMED', () => {
    render(<OrderStatusBadge status="CONFIRMED" />);
    expect(screen.getByText('Đã xác nhận')).toBeInTheDocument();
  });
});
