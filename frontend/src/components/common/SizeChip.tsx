import React from 'react';

export interface SizeChipProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export const SizeChip: React.FC<SizeChipProps> = ({
  label,
  selected = false,
  disabled = false,
  onClick,
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`min-w-[44px] h-10 px-3.5 rounded-lg border text-sm font-sans font-medium transition-all flex items-center justify-center ${
        disabled
          ? 'opacity-40 border-line bg-bg-alt text-ink-soft line-through cursor-not-allowed'
          : selected
          ? 'border-accent bg-accent text-white font-semibold shadow-xs'
          : 'border-line bg-card text-ink hover:border-accent hover:text-accent'
      }`}
    >
      {label}
    </button>
  );
};
