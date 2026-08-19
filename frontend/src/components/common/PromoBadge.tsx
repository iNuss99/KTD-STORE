import React from 'react';

export interface PromoBadgeProps {
  type?: 'sale' | 'out' | 'ok' | 'custom';
  children: React.ReactNode;
  className?: string;
}

export const PromoBadge: React.FC<PromoBadgeProps> = ({
  type = 'sale',
  children,
  className = '',
}) => {
  const getBadgeStyle = () => {
    switch (type) {
      case 'sale':
        return 'bg-coral text-white font-mono font-medium';
      case 'out':
        return 'bg-ink-soft/90 text-white font-mono font-medium backdrop-blur-xs';
      case 'ok':
        return 'bg-ok text-white font-mono font-medium';
      default:
        return 'bg-bg-alt text-ink font-mono font-medium';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider ${getBadgeStyle()} ${className}`}
    >
      {children}
    </span>
  );
};
