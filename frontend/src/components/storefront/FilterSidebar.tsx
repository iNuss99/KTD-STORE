import React from 'react';
import { Category, Brand, Size, Color } from '../../types';
import { SlidersHorizontal, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, Check } from 'lucide-react';

export interface FilterSidebarProps {
  categories: Category[];
  brands: Brand[];
  sizes: Size[];
  colors: Color[];
  selectedCategory?: string;
  selectedBrand?: string;
  selectedSize?: string;
  selectedColor?: string;
  minPrice?: number;
  maxPrice?: number;
  priceBounds?: { min: number; max: number };
  sortOrder?: 'default' | 'price-asc' | 'price-desc';
  onSortChange?: (sort: 'default' | 'price-asc' | 'price-desc') => void;
  onFilterChange: (filters: {
    category_id?: string;
    brand_id?: string;
    size_id?: string;
    color_id?: string;
    min_price?: number;
    max_price?: number;
  }) => void;
  onReset: () => void;
}

const vndFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const formatVND = (amount: number) => vndFormatter.format(amount);

const formatInputVND = (val: number) => {
  return `${new Intl.NumberFormat('vi-VN').format(val)} đ`;
};

const parseInputVND = (str: string) => {
  const digits = str.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
};

interface DualRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  valueMin?: number;
  valueMax?: number;
  onChange: (min: number, max: number) => void;
  onResetPrice: () => void;
}

const DualRangeSlider: React.FC<DualRangeSliderProps> = ({
  min,
  max,
  step = 50000,
  valueMin,
  valueMax,
  onChange,
  onResetPrice,
}) => {
  const currentMin = valueMin !== undefined ? valueMin : min;
  const currentMax = valueMax !== undefined ? valueMax : max;

  const [localMin, setLocalMin] = React.useState(currentMin);
  const [localMax, setLocalMax] = React.useState(currentMax);
  const [minInputStr, setMinInputStr] = React.useState(formatInputVND(currentMin));
  const [maxInputStr, setMaxInputStr] = React.useState(formatInputVND(currentMax));

  React.useEffect(() => {
    setLocalMin(currentMin);
    setMinInputStr(formatInputVND(currentMin));
  }, [currentMin]);

  React.useEffect(() => {
    setLocalMax(currentMax);
    setMaxInputStr(formatInputVND(currentMax));
  }, [currentMax]);

  const minPercent = max > min ? Math.max(0, Math.min(100, ((localMin - min) / (max - min)) * 100)) : 0;
  const maxPercent = max > min ? Math.max(0, Math.min(100, ((localMax - min) / (max - min)) * 100)) : 100;

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), localMax - step);
    setLocalMin(val);
    setMinInputStr(formatInputVND(val));
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), localMin + step);
    setLocalMax(val);
    setMaxInputStr(formatInputVND(val));
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinInputStr(e.target.value);
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxInputStr(e.target.value);
  };

  const handleMinInputBlur = () => {
    const rawVal = parseInputVND(minInputStr);
    const clamped = Math.max(min, Math.min(rawVal, localMax - step));
    setLocalMin(clamped);
    setMinInputStr(formatInputVND(clamped));
  };

  const handleMaxInputBlur = () => {
    const rawVal = parseInputVND(maxInputStr);
    const clamped = Math.min(max, Math.max(rawVal, localMin + step));
    setLocalMax(clamped);
    setMaxInputStr(formatInputVND(clamped));
  };

  const handleApply = () => {
    const rawMin = parseInputVND(minInputStr);
    const rawMax = parseInputVND(maxInputStr);
    const safeMin = Math.max(min, Math.min(rawMin, max - step));
    const safeMax = Math.min(max, Math.max(rawMax, safeMin + step));
    setLocalMin(safeMin);
    setLocalMax(safeMax);
    setMinInputStr(formatInputVND(safeMin));
    setMaxInputStr(formatInputVND(safeMax));
    onChange(safeMin, safeMax);
  };

  const isCustomPrice = valueMin !== undefined || valueMax !== undefined;

  return (
    <div className="space-y-4">
      {/* Dual Slider Bar */}
      <div className="relative h-6 flex items-center pt-2">
        {/* Track Base */}
        <div className="absolute w-full h-1.5 bg-[#E2E8F0] rounded-full" />

        {/* Selected Price Range Track */}
        <div
          className="absolute h-1.5 bg-[#C8A96E] rounded-full pointer-events-none transition-all duration-75"
          style={{
            left: `${minPercent}%`,
            width: `${Math.max(0, maxPercent - minPercent)}%`,
          }}
        />

        {/* Min Range Slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMin}
          onChange={handleMinChange}
          aria-label="Mức giá tối thiểu"
          className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none z-20 
            [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[#C8A96E] [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(200,169,110,0.35)] [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing
            [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-[#C8A96E] [&::-moz-range-thumb]:shadow-[0_2px_6px_rgba(200,169,110,0.35)] [&::-moz-range-thumb]:cursor-grab active:[&::-moz-range-thumb]:cursor-grabbing"
        />

        {/* Max Range Slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMax}
          onChange={handleMaxChange}
          aria-label="Mức giá tối đa"
          className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none z-20 
            [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[#C8A96E] [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(200,169,110,0.35)] [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing
            [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-[#C8A96E] [&::-moz-range-thumb]:shadow-[0_2px_6px_rgba(200,169,110,0.35)] [&::-moz-range-thumb]:cursor-grab active:[&::-moz-range-thumb]:cursor-grabbing"
        />
      </div>

      {/* Two Input Boxes */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-xs focus-within:border-[#C8A96E] focus-within:ring-1 focus-within:ring-[#C8A96E]/20 transition-all">
          <input
            type="text"
            value={minInputStr}
            onChange={handleMinInputChange}
            onBlur={handleMinInputBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            className="w-full text-center text-xs sm:text-sm font-semibold text-ink bg-transparent outline-none font-sans"
            placeholder="0 đ"
            aria-label="Giá tối thiểu"
          />
        </div>
        <span className="text-slate-400 font-medium shrink-0">—</span>
        <div className="flex-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-xs focus-within:border-[#C8A96E] focus-within:ring-1 focus-within:ring-[#C8A96E]/20 transition-all">
          <input
            type="text"
            value={maxInputStr}
            onChange={handleMaxInputChange}
            onBlur={handleMaxInputBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            className="w-full text-center text-xs sm:text-sm font-semibold text-ink bg-transparent outline-none font-sans"
            placeholder="0 đ"
            aria-label="Giá tối đa"
          />
        </div>
      </div>

      {/* Apply Button */}
      <button
        type="button"
        onClick={handleApply}
        className="w-full py-2.5 bg-[#C8A96E] hover:bg-[#B39358] active:bg-[#9F8048] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
      >
        <Check className="w-4 h-4 stroke-[2.5]" />
        <span>Áp dụng lọc</span>
      </button>

      {/* Reset Price Option */}
      {isCustomPrice && (
        <div className="flex justify-center pt-0.5">
          <button
            type="button"
            onClick={onResetPrice}
            className="text-[11px] font-mono text-[#6E6E6E] hover:text-[#C8A96E] transition-colors hover:underline"
          >
            Khôi phục khoảng giá mặc định
          </button>
        </div>
      )}
    </div>
  );
};

const MAX_CATEGORY_DEPTH = 3;

interface CategoryNodeProps {
  category: Category;
  depth: number;
  selectedCategory?: string;
  onSelect: (id: string) => void;
}

const CategoryNode: React.FC<CategoryNodeProps> = ({
  category,
  depth,
  selectedCategory,
  onSelect,
}) => {
  const isSelected = selectedCategory === category.id;
  const hasChildren = category.children && category.children.length > 0 && depth < MAX_CATEGORY_DEPTH;

  return (
    <div className={depth > 1 ? 'pl-3 space-y-1 mt-1 border-l border-line' : 'space-y-1'}>
      <button
        type="button"
        onClick={() => onSelect(category.id)}
        className={`w-full text-left transition-all ${
          depth === 1
            ? `text-xs font-mono uppercase tracking-wider px-3 py-2 rounded-lg ${
                isSelected
                  ? 'bg-ink font-semibold text-white shadow-xs'
                  : 'text-ink-soft hover:text-ink hover:bg-card font-medium'
              }`
            : depth === 2
            ? `text-xs px-2 py-1 rounded-md ${
                isSelected ? 'font-semibold text-accent bg-accent/10' : 'text-ink-soft hover:text-ink font-medium'
              }`
            : `text-[11px] px-2 py-0.5 rounded-md ${
                isSelected ? 'font-semibold text-accent bg-accent/10' : 'text-ink-soft hover:text-ink'
              }`
        }`}
      >
        {depth === 2 ? '• ' : depth === 3 ? '└ ' : ''}{category.name}
      </button>

      {hasChildren &&
        category.children!.map((child) => (
          <CategoryNode
            key={child.id}
            category={child}
            depth={depth + 1}
            selectedCategory={selectedCategory}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
};

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  categories,
  brands,
  sizes,
  colors,
  selectedCategory,
  selectedBrand,
  selectedSize,
  selectedColor,
  minPrice,
  maxPrice,
  priceBounds,
  sortOrder = 'default',
  onSortChange,
  onFilterChange,
  onReset,
}) => {
  return (
    <aside className="w-full lg:w-64 bg-bg-alt p-6 border border-line rounded-2xl shadow-xs space-y-6 self-start font-sans">
      <div className="flex items-center justify-between pb-4 border-b border-line">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink font-semibold">
          <SlidersHorizontal className="w-4 h-4 text-accent" />
          <span>Bộ Lọc</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-[11px] font-mono font-medium text-ink-soft hover:text-accent flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Đặt lại
        </button>
      </div>

      {/* Category Filter */}
      <div>
        <h4 className="font-display text-sm font-semibold text-ink mb-3">Danh mục</h4>
        <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => onFilterChange({ category_id: undefined })}
            className={`w-full text-left text-xs font-mono uppercase tracking-wider px-3 py-2 rounded-lg transition-all ${
              !selectedCategory
                ? 'bg-ink font-semibold text-white shadow-xs'
                : 'text-ink-soft hover:text-ink hover:bg-card font-medium'
            }`}
          >
            Tất cả danh mục
          </button>
          {categories.map((cat) => (
            <CategoryNode
              key={cat.id}
              category={cat}
              depth={1}
              selectedCategory={selectedCategory}
              onSelect={(id) => onFilterChange({ category_id: id })}
            />
          ))}
        </div>
      </div>



      {/* Size Filter */}
      {sizes.length > 0 && (
        <div className="pt-4 border-t border-line">
          <h4 className="font-display text-sm font-semibold text-ink mb-3">Kích thước</h4>
          <div className="grid grid-cols-4 gap-1.5">
            {sizes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onFilterChange({ size_id: selectedSize === s.id ? undefined : s.id })}
                className={`text-xs font-mono py-1.5 border rounded-lg text-center transition-all ${
                  selectedSize === s.id
                    ? 'border-accent bg-accent text-white font-semibold shadow-xs'
                    : 'border-line text-ink hover:border-ink bg-card font-medium'
                }`}
              >
                {s.code}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Filter */}
      {colors.length > 0 && (
        <div className="pt-4 border-t border-line">
          <h4 className="font-display text-sm font-semibold text-ink mb-3">Màu sắc</h4>
          <div className="flex flex-wrap gap-1.5">
            {colors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onFilterChange({ color_id: selectedColor === c.id ? undefined : c.id })}
                className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 border rounded-lg transition-all ${
                  selectedColor === c.id
                    ? 'border-accent bg-accent text-white font-semibold shadow-xs'
                    : 'border-line text-ink hover:border-ink bg-card font-medium'
                }`}
              >
                {c.hex_code && (
                  <span
                    className="w-3 h-3 rounded-full border border-line inline-block shadow-inner"
                    style={{ backgroundColor: c.hex_code }}
                  />
                )}
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Sorting */}
      {onSortChange && (
        <div className="pt-4 border-t border-line">
          <div className="flex items-center gap-1.5 mb-3">
            <ArrowUpDown className="w-3.5 h-3.5 text-accent" />
            <h4 className="font-display text-sm font-semibold text-ink">Sắp xếp theo giá</h4>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              type="button"
              onClick={() => onSortChange('price-asc')}
              className={`flex items-center justify-between text-xs px-3 py-2 border rounded-xl transition-all ${
                sortOrder === 'price-asc'
                  ? 'border-accent bg-accent text-white font-semibold shadow-xs'
                  : 'border-line text-ink hover:border-ink bg-card font-medium'
              }`}
            >
              <span>Giá: Thấp đến Cao</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onSortChange('price-desc')}
              className={`flex items-center justify-between text-xs px-3 py-2 border rounded-xl transition-all ${
                sortOrder === 'price-desc'
                  ? 'border-accent bg-accent text-white font-semibold shadow-xs'
                  : 'border-line text-ink hover:border-ink bg-card font-medium'
              }`}
            >
              <span>Giá: Cao đến Thấp</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            {sortOrder !== 'default' && (
              <button
                type="button"
                onClick={() => onSortChange('default')}
                className="text-[11px] font-mono text-ink-soft hover:text-accent text-center py-1 mt-0.5"
              >
                Trở về sắp xếp mặc định
              </button>
            )}
          </div>
        </div>
      )}

      {/* Price Range Dual Slider */}
      <div className="pt-4 border-t border-line">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-display text-sm sm:text-base font-bold text-ink">Khoảng Giá</h4>
        </div>
        <DualRangeSlider
          min={priceBounds?.min ?? 0}
          max={priceBounds?.max ?? 2000000}
          step={50000}
          valueMin={minPrice}
          valueMax={maxPrice}
          onChange={(min, max) =>
            onFilterChange({
              min_price: min,
              max_price: max,
            })
          }
          onResetPrice={() =>
            onFilterChange({
              min_price: undefined,
              max_price: undefined,
            })
          }
        />
      </div>
    </aside>
  );
};
