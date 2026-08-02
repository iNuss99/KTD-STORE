import React from 'react';
import { Category, Brand, Size, Color } from '../types';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';

interface FilterSidebarProps {
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

      {/* Price Range Filter */}
      <div className="pt-4 border-t border-line">
        <h4 className="font-display text-sm font-semibold text-ink mb-3">Khoảng giá (VND)</h4>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Từ..."
              value={minPrice || ''}
              onChange={(e) =>
                onFilterChange({
                  min_price: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-1/2 p-2 bg-card border border-line rounded-lg text-xs font-mono text-ink placeholder-ink-soft focus:outline-none focus:border-accent"
            />
            <input
              type="number"
              placeholder="Đến..."
              value={maxPrice || ''}
              onChange={(e) =>
                onFilterChange({
                  max_price: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-1/2 p-2 bg-card border border-line rounded-lg text-xs font-mono text-ink placeholder-ink-soft focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
