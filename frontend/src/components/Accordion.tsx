import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  title,
  children,
  defaultOpen = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border-b border-line py-3.5 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left font-display font-medium text-ink hover:text-accent transition-colors"
      >
        <span>{title}</span>
        <ChevronDown
          className={`w-4 h-4 text-ink-soft transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-accent' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="mt-3 text-sm text-ink-soft leading-relaxed space-y-2 font-sans">
          {children}
        </div>
      )}
    </div>
  );
};
