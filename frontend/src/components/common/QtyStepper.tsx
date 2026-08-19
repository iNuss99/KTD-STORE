import React from 'react';
import { Minus, Plus } from 'lucide-react';

export interface QtyStepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export const QtyStepper: React.FC<QtyStepperProps> = ({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
}) => {
  const handleDecrement = () => {
    if (!disabled && value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (!disabled && (max === undefined || value < max)) {
      onChange(value + 1);
    }
  };

  return (
    <div className="inline-flex items-center border border-line bg-card rounded-lg p-1">
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={handleDecrement}
        aria-label="Giảm số lượng"
        className="w-8 h-8 rounded-md flex items-center justify-center text-ink hover:bg-bg-alt disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="w-10 text-center font-mono text-sm font-medium text-ink select-none">
        {value}
      </span>
      <button
        type="button"
        disabled={disabled || (max !== undefined && value >= max)}
        onClick={handleIncrement}
        aria-label="Tăng số lượng"
        className="w-8 h-8 rounded-md flex items-center justify-center text-ink hover:bg-bg-alt disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
