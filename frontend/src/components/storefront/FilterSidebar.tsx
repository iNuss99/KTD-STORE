import React from 'react';
import { Category, Brand, Size, Color } from '../../types';
import { SlidersHorizontal, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

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

const PRICE_PRESETS = [
  { label: 'Tất cả mức giá', min: undefined, max: undefined },
  { label: 'Dưới 300.000₫', min: undefined, max: 300000 },
  { label: '300.000₫ - 500.000₫', min: 300000, max: 500000 },
  { label: '500.000₫ - 1.000.000₫', min: 500000, max: 1000000 },
  { label: 'Trên 1.000.000₫', min: 1000000, max: undefined },
];

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

      {/* Brand Filter */}
      {brands.length > 0 && (
        <div className="pt-4 border-t border-line">
          <h4 className="font-display text-sm font-semibold text-ink mb-3">Thương hiệu</h4>
          <div className="flex flex-wrap gap-1.5">
            {brands.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onFilterChange({ brand_id: selectedBrand === b.id ? undefined : b.id })}
                className={`text-xs font-mono px-3 py-1.5 border rounded-lg transition-all ${
                  selectedBrand === b.id
                    ? 'border-accent bg-accent text-white font-semibold shadow-xs'
                    : 'border-line text-ink hover:border-ink bg-card font-medium'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

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

      {/* Price Range Filter Presets */}
      <div className="pt-4 border-t border-line">
        <h4 className="font-display text-sm font-semibold text-ink mb-3">Mức giá phổ biến</h4>
        <div className="flex flex-col gap-1.5">
          {PRICE_PRESETS.map((preset, idx) => {
            const isSelected =
              (preset.min === undefined && preset.max === undefined && minPrice === undefined && maxPrice === undefined) ||
              (preset.min === minPrice && preset.max === maxPrice);

            return (
              <button
                key={idx}
                type="button"
                onClick={() =>
                  onFilterChange({
                    min_price: preset.min,
                    max_price: preset.max,
                  })
                }
                className={`text-left text-xs px-3 py-2 border rounded-xl transition-all ${
                  isSelected
                    ? 'border-accent bg-accent text-white font-semibold shadow-xs'
                    : 'border-line text-ink hover:border-ink bg-card font-medium'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
