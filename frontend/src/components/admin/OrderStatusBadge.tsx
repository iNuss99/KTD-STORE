import React from 'react';
import { OrderStatus } from '../../types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, className = '' }) => {
  const configs: Record<
    string,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    PENDING: {
      label: 'Mới (Chờ xác nhận)',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200/80',
      dot: 'bg-amber-500',
    },
    CONFIRMED: {
      label: 'Đã xác nhận',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200/80',
      dot: 'bg-blue-500',
    },
    PROCESSING: {
      label: 'Đang đóng gói',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200/80',
      dot: 'bg-purple-500',
    },
    SHIPPING: {
      label: 'Đang giao hàng',
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200/80',
      dot: 'bg-sky-500',
    },
    DELIVERED: {
      label: 'Đã giao thành công',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200/80',
      dot: 'bg-emerald-500',
    },
    CANCELLED: {
      label: 'Đã hủy',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200/80',
      dot: 'bg-rose-400',
    },
    RETURN_REQUESTED: {
      label: 'Yêu cầu đổi trả',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200/80',
      dot: 'bg-orange-500',
    },
    RETURNED: {
      label: 'Đã hoàn trả',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200/80',
      dot: 'bg-slate-400',
    },
  };

  const current = configs[status] || {
    label: status,
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
};
