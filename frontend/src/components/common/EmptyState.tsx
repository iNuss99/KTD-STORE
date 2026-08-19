import React from 'react';
import { PackageX } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-card border border-line rounded-2xl max-w-md mx-auto my-6 shadow-xs">
      <div className="w-16 h-16 rounded-full bg-bg-alt text-ink-soft flex items-center justify-center mb-4">
        {icon || <PackageX className="w-8 h-8 stroke-[1.5]" />}
      </div>
      <h3 className="font-display font-semibold text-lg text-ink mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-ink-soft font-sans mb-6 leading-relaxed max-w-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-6 py-2.5 rounded-full bg-accent hover:bg-accent-dark text-white font-sans text-xs font-semibold uppercase tracking-wider transition-all shadow-xs"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
