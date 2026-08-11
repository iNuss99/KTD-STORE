import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';
import { apiClient } from '../lib/apiClient';

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
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  onSearchSubmitted,
  className = '',
  placeholder = 'Tìm kiếm áo polo, sơ mi, quần jean...',
}) => {
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
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectProduct = (product: SuggestionItem) => {
    setIsOpen(false);
    setQuery('');
    if (onSearchSubmitted) onSearchSubmitted();
    navigate(`/products/${product.slug || product.id}`);
  };

  const handleSubmitSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setIsOpen(false);
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
    }
  };

  const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
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
          className="w-full pl-10 pr-9 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 text-xs sm:text-sm font-medium border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-full transition-all outline-none"
        />
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin absolute right-3" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              inputRef.current?.focus();
            }}
            className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 rounded-full"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
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
                    selectedIndex === idx ? 'bg-indigo-50/70 text-indigo-900' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=200&q=80'}
                    alt={item.name}
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
                    <span className="text-xs font-extrabold text-indigo-600">{formatVND(item.base_price)}</span>
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
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 text-xs font-bold rounded-xl border border-slate-200 transition shadow-xs"
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
