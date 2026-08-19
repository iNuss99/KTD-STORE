import React from 'react';
import { CheckCircle2, Clock, PackageCheck, Truck, ShoppingBag, XCircle } from 'lucide-react';
import { OrderStatus } from '../../types';

interface OrderTimelineProps {
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ status, createdAt, updatedAt }) => {
  if (status === 'CANCELLED') {
    return (
      <div className="p-4 bg-coral/10 border border-coral/30 rounded-2xl flex items-center gap-3 text-coral">
        <XCircle className="w-5 h-5 shrink-0" />
        <div className="text-xs">
          <strong className="block font-bold">Đơn hàng đã hủy</strong>
          <span>Đơn hàng đã được hủy và hoàn tiền theo quy định.</span>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'PENDING', label: 'Đã đặt hàng', icon: ShoppingBag, desc: 'Hệ thống đã tiếp nhận đơn' },
    { key: 'CONFIRMED', label: 'Đã xác nhận', icon: CheckCircle2, desc: 'Đã kiểm tra và duyệt đơn' },
    { key: 'PROCESSING', label: 'Đang đóng gói', icon: PackageCheck, desc: 'Kho đang chuẩn bị sản phẩm' },
    { key: 'SHIPPING', label: 'Đang giao hàng', icon: Truck, desc: 'Đơn vị vận chuyển đang phát' },
    { key: 'DELIVERED', label: 'Đã giao hàng', icon: CheckCircle2, desc: 'Giao hàng thành công' },
  ];

  const statusOrder: Record<OrderStatus, number> = {
    PENDING: 0,
    CONFIRMED: 1,
    PROCESSING: 2,
    SHIPPING: 3,
    DELIVERED: 4,
    CANCELLED: -1,
    RETURNED: -1,
    RETURN_REQUESTED: -1,
  };

  const currentStepIndex = statusOrder[status] ?? 0;

  return (
    <div className="bg-card border border-line rounded-3xl p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-base sm:text-lg text-ink">Tiến Trình Đơn Hàng</h3>
          <p className="font-mono text-xs text-ink-soft mt-0.5">
            Cập nhật thời gian thực qua hệ thống kho vận KTD
          </p>
        </div>
        <span className="font-mono text-xs font-semibold px-3 py-1 bg-bg-alt border border-line rounded-full text-ink">
          {new Date(createdAt).toLocaleDateString('vi-VN')}
        </span>
      </div>

      {/* Stepper Bar */}
      <div className="relative">
        {/* Connection Line */}
        <div className="hidden md:block absolute top-5 left-8 right-8 h-1 bg-bg-alt -z-0">
          <div
            className="h-full bg-accent transition-all duration-500 rounded-full"
            style={{
              width: `${(Math.min(currentStepIndex, 4) / 4) * 100}%`,
            }}
          />
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const Icon = step.icon;

            return (
              <div
                key={step.key}
                className={`flex md:flex-col items-center md:items-center gap-3 md:text-center p-3 md:p-0 rounded-2xl md:rounded-none transition-all ${
                  isCurrent ? 'bg-accent/5 md:bg-transparent border border-accent/20 md:border-none' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all shadow-xs shrink-0 ${
                    isCompleted
                      ? 'bg-accent text-white ring-4 ring-accent/20'
                      : 'bg-bg-alt text-ink-soft/50 border border-line'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0 md:w-full">
                  <span
                    className={`font-sans text-xs font-bold block truncate ${
                      isCompleted ? 'text-ink' : 'text-ink-soft/60'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="font-sans text-[11px] text-ink-soft block mt-0.5 leading-tight">
                    {step.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
