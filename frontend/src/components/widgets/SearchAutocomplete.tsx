import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

// Module-level formatter — tạo 1 lần, dùng lại mỗi lần gọi
const vndFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const formatVND = (price: number) => vndFormatter.format(price);

interface SuggestionItem {
  id: string;
  name: string;
  slug: string;
  code: string;
  base_price: number;
  brand_name?: string | null;
  category_name?: string | null;
  image_url?: string | null;
}

interface SearchAutocompleteProps {
  onSearchSubmitted?: () => void;
  className?: string;
  placeholder?: string;
  expandable?: boolean;
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  onSearchSubmitted,
  className = '',
  placeholder = 'Tìm kiếm sản phẩm...',
  expandable = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(!expandable);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Debounced autocomplete fetch
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await apiClient<SuggestionItem[]>(`/api/products/autocomplete?q=${encodeURIComponent(query.trim())}&limit=6`);
        setSuggestions(data || []);
        setIsOpen(true);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (expandable) {
          setIsExpanded(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expandable]);

  const handleSelectProduct = (product: SuggestionItem) => {
    setIsOpen(false);
    if (expandable) setIsExpanded(false);
    setQuery('');
    if (onSearchSubmitted) onSearchSubmitted();
    navigate(`/products/${product.slug || product.id}`);
  };

  const handleSubmitSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setIsOpen(false);
    if (expandable) setIsExpanded(false);
    if (onSearchSubmitted) onSearchSubmitted();
    navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelectProduct(suggestions[selectedIndex]);
      } else {
        handleSubmitSearch(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      if (expandable) {
        setIsExpanded(false);
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <AnimatePresence initial={false} mode="wait">
        {expandable && !isExpanded ? (
          <motion.button
            key="search-trigger-btn"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            type="button"
            onClick={() => {
              setIsExpanded(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            className="p-2 text-[#1A1A1A] hover:text-[#C8A96E] transition-colors rounded-full flex items-center justify-center"
            aria-label="Mở tìm kiếm"
            title="Tìm kiếm"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
        ) : (
          <motion.div
            key="search-input-wrapper"
            initial={expandable ? { width: 40, opacity: 0 } : undefined}
            animate={expandable ? { width: '100%', opacity: 1 } : undefined}
            exit={expandable ? { width: 40, opacity: 0 } : undefined}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`relative flex items-center ${
              expandable ? 'w-[210px] xs:w-[240px] sm:w-[270px]' : 'w-full'
            }`}
          >
            <Search className="w-4 h-4 text-[#6E6E6E] absolute left-3 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(-1);
              }}
              onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full pl-9 pr-8 py-1.5 sm:py-2 bg-white text-[#1A1A1A] text-xs sm:text-sm font-sans border border-[#1A1A1A]/20 focus:border-[#C8A96E] focus:ring-1 focus:ring-[#C8A96E]/20 rounded-full transition-all outline-none shadow-xs"
            />
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 text-[#6E6E6E] animate-spin absolute right-2.5" />
            ) : query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSuggestions([]);
                  inputRef.current?.focus();
                }}
                className="p-1 text-[#6E6E6E] hover:text-[#1A1A1A] absolute right-2 rounded-full"
                aria-label="Xóa nội dung"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : expandable ? (
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setIsOpen(false);
                }}
                className="p-1 text-[#6E6E6E] hover:text-[#1A1A1A] absolute right-2 rounded-full"
                aria-label="Đóng tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div className={`absolute top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
          expandable ? 'right-0 w-[280px] sm:w-[340px]' : 'left-0 right-0'
        }`}>
          <div className="p-2 border-b border-slate-50 flex items-center justify-between text-[11px] font-semibold text-slate-400 px-3">
            <span>Gợi ý sản phẩm ({suggestions.length})</span>
            <span className="text-[10px]">Nhấn Enter để tìm</span>
          </div>

          {suggestions.length === 0 && !isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Không tìm thấy sản phẩm nào với từ khóa "{query}"
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {suggestions.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectProduct(item)}
                  className={`flex items-center gap-3 p-2.5 sm:p-3 cursor-pointer transition ${
                    selectedIndex === idx ? 'bg-[#FAF8F5] text-[#1A1A1A]' : 'hover:bg-[#FAF8F5] text-[#1A1A1A]'
                  }`}
                >
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=200&q=80'}
                    alt={item.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=200&q=80';
                    }}
                    className="w-10 h-10 object-cover rounded-lg shrink-0 border border-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate leading-tight">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      {item.category_name && <span>{item.category_name}</span>}
                      {item.brand_name && <span>• {item.brand_name}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono text-[#C8A96E]">{formatVND(item.base_price)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Full Search Action Button */}
          <div className="p-2 bg-slate-50 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleSubmitSearch(query)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-[#FAF8F5] text-[#1A1A1A] hover:text-[#C8A96E] text-xs font-bold rounded-xl border border-slate-200 transition shadow-xs"
            >
              <span>Xem tất cả kết quả cho "{query}"</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
