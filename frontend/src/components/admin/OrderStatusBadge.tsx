import React from 'react';
import { OrderStatus } from '../../types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'PENDING':
      return (
        <span className={`bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 ${className}`}>
          Mới (Chờ xác nhận)
        </span>
      );
    case 'CONFIRMED':
      return (
        <span className={`bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 ${className}`}>
          Đã xác nhận
        </span>
      );
    case 'PROCESSING':
      return (
        <span className={`bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 ${className}`}>
          Đang đóng gói
        </span>
      );
    case 'SHIPPING':
      return (
        <span className={`bg-sky-100 text-sky-800 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 ${className}`}>
          Đang giao hàng
        </span>
      );
    case 'DELIVERED':
      return (
        <span className={`bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 ${className}`}>
          Đã giao thành công
        </span>
      );
    case 'CANCELLED':
      return (
        <span className={`bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 ${className}`}>
          Đã hủy
        </span>
      );
    case 'RETURN_REQUESTED':
      return (
        <span className={`bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 ${className}`}>
          Yêu cầu đổi trả
        </span>
      );
    case 'RETURNED':
      return (
        <span className={`bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 ${className}`}>
          Đã hoàn trả
        </span>
      );
    default:
      return (
        <span className={`bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 ${className}`}>
          {status}
        </span>
      );
  }
};
