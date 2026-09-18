import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProductCard } from '../../components/storefront/ProductCard';
import { FilterSidebar } from '../../components/storefront/FilterSidebar';
import { EmptyState } from '../../components/common/EmptyState';
import { Category, Brand } from '../../types';
import { RefreshCw, SlidersHorizontal, ArrowUpDown, X, Tag, Grid2X2, Grid3X3 } from 'lucide-react';
import { useProducts, useProductMetadata } from '../../hooks/useProducts';

const EMPTY_CATEGORIES: Category[] = [];
const EMPTY_BRANDS: Brand[] = [];

export const ProductListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [gridCols, setGridCols] = useState<'gallery' | 'grid'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  useEffect(() => {
    if (mobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileFilterOpen]);

  const { data: categories = EMPTY_CATEGORIES } = useQuery<Category[]>({
    queryKey: ['categories', 'tree'],
    queryFn: async () => {
      const res = await fetch('/api/categories/tree');
      return res.ok ? res.json() : [];
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: brands = EMPTY_BRANDS } = useQuery<Brand[]>({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await fetch('/api/brands');
      return res.ok ? res.json() : [];
    },
    staleTime: 1000 * 60 * 30,
  });

  // Helper tìm kiếm danh mục đệ quy theo cả ID (UUID) và slug (ao-thun, ao-so-mi...)
  const findCategory = useCallback(
    (ident?: string): Category | undefined => {
      if (!ident) return undefined;
      const stack = [...categories];
      while (stack.length > 0) {
        const node = stack.pop()!;
        if (node.id === ident || node.slug === ident) return node;
        if (node.children?.length) {
          stack.push(...node.children);
        }
      }
      return undefined;
    },
    [categories],
  );

  const filters = useMemo(() => {
    const rawCategory = searchParams.get('category_id') || searchParams.get('category') || undefined;
    const matchedCategory = findCategory(rawCategory);
    // Nếu tìm thấy danh mục theo slug hoặc UUID thì lấy ID chuẩn của danh mục
    const resolvedCategoryId = matchedCategory ? matchedCategory.id : rawCategory;

    return {
      search: searchParams.get('search') || undefined,
      category_id: resolvedCategoryId,
      brand_id: searchParams.get('brand_id') || undefined,
      size_id: searchParams.get('size_id') || undefined,
      color_id: searchParams.get('color_id') || undefined,
      min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    };
  }, [searchParams, findCategory]);

  const updateFiltersAndUrl = (newFilters: typeof filters) => {
    const params = new URLSearchParams();
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.category_id) {
      const cat = findCategory(newFilters.category_id);
      params.set('category', cat?.slug || newFilters.category_id);
    }
    if (newFilters.brand_id) params.set('brand_id', newFilters.brand_id);
    if (newFilters.size_id) params.set('size_id', newFilters.size_id);
    if (newFilters.color_id) params.set('color_id', newFilters.color_id);
    if (newFilters.min_price) params.set('min_price', String(newFilters.min_price));
    if (newFilters.max_price) params.set('max_price', String(newFilters.max_price));
    setSearchParams(params);
  };

  const { data: productsData, isLoading: loadingProducts, isError } = useProducts(filters);
  const { data: allCatalogData } = useProducts({ limit: 100 });
  const { data: metadata } = useProductMetadata();

  const priceBounds = useMemo(() => {
    const list = allCatalogData?.data || [];
    const prices = list
      .map((p) => Number(p.base_price))
      .filter((n) => !isNaN(n) && n > 0);
    if (prices.length === 0) {
      return { min: 0, max: 2000000 };
    }
    const minRaw = Math.min(...prices);
    const maxRaw = Math.max(...prices);
    const min = Math.floor(minRaw / 50000) * 50000;
    const max = Math.ceil(maxRaw / 50000) * 50000;
    return { min, max: Math.max(max, min + 100000) };
  }, [allCatalogData?.data]);

  const sizes = metadata?.sizes || [];
  const colors = metadata?.colors || [];

  let products = useMemo(() => {
    let list = productsData?.data || [];
    if (sortOrder === 'price-asc') {
      return [...list].sort((a, b) => a.base_price - b.base_price);
    } else if (sortOrder === 'price-desc') {
      return [...list].sort((a, b) => b.base_price - a.base_price);
    }
    return list;
  }, [productsData, sortOrder]);

  const handleResetFilters = () => {
    setSortOrder('default');
    setSearchParams(new URLSearchParams());
  };

  const removeSingleFilter = (key: keyof typeof filters) => {
    const updated = { ...filters, [key]: undefined };
    updateFiltersAndUrl(updated);
  };

  const hasActiveFilters = Boolean(
    filters.category_id ||
      filters.brand_id ||
      filters.size_id ||
      filters.color_id ||
      filters.search ||
      filters.min_price ||
      filters.max_price,
  );

  const activeCategory = findCategory(filters.category_id);
  const activeCategoryName = activeCategory?.name;
  const activeBrandName = brands.find((b) => b.id === filters.brand_id)?.name;
  const activeSizeName = sizes.find((s: any) => s.id === filters.size_id)?.name;
  const activeColorName = colors.find((c: any) => c.id === filters.color_id)?.name;

  const formatVND = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
    <div className="min-h-screen bg-[#F5F2EE] flex flex-col font-sans">
      {/* Header Banner Section */}
      <section className="bg-white border-b border-[#1A1A1A]/10 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-3">
          <span className="font-mono text-[#C8A96E] text-xs font-semibold uppercase tracking-[0.25em] block">
            BỘ SƯU TẬP
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl font-bold text-[#1A1A1A] tracking-tight leading-[1.25] sm:leading-[1.18] py-1">
            {filters.search
              ? `Kết quả: "${filters.search}"`
              : activeCategoryName
              ? activeCategoryName
              : 'Trang Phục Nam Tối Giản'}
          </h1>
          <p className="text-[#6E6E6E] text-sm sm:text-base font-sans max-w-xl leading-relaxed pt-1">
            {activeCategoryName
              ? `Khám phá các thiết kế ${activeCategoryName} cao cấp tại KTDL với chất liệu tuyển chọn và form dáng may đo tinh tế.`
              : 'Thiết kế KTDL tỉ mỉ, chất liệu cao cấp tuyển chọn cho phong cách quý ông hiện đại.'}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-6">
        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 p-4 bg-white border border-[#1A1A1A]/10">
            <span className="font-mono text-xs text-[#6E6E6E] uppercase tracking-wider flex items-center gap-1.5 mr-2">
              <Tag className="w-3.5 h-3.5 text-[#C8A96E]" /> Đang lọc:
            </span>

            {filters.search && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#F5F2EE] text-[#1A1A1A] border border-[#1A1A1A]/10 font-mono text-xs">
                "{filters.search}"
                <button type="button" onClick={() => removeSingleFilter('search')} className="hover:opacity-75">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.category_id && activeCategoryName && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#F5F2EE] text-[#1A1A1A] border border-[#1A1A1A]/10 font-mono text-xs">
                {activeCategoryName}
                <button type="button" onClick={() => removeSingleFilter('category_id')} className="hover:opacity-75">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.brand_id && activeBrandName && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#F5F2EE] text-[#1A1A1A] border border-[#1A1A1A]/10 font-mono text-xs">
                {activeBrandName}
                <button type="button" onClick={() => removeSingleFilter('brand_id')} className="hover:opacity-75">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.size_id && activeSizeName && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#F5F2EE] text-[#1A1A1A] border border-[#1A1A1A]/10 font-mono text-xs">
                Size: {activeSizeName}
                <button type="button" onClick={() => removeSingleFilter('size_id')} className="hover:opacity-75">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.color_id && activeColorName && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#F5F2EE] text-[#1A1A1A] border border-[#1A1A1A]/10 font-mono text-xs">
                Màu: {activeColorName}
                <button type="button" onClick={() => removeSingleFilter('color_id')} className="hover:opacity-75">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(filters.min_price !== undefined || filters.max_price !== undefined) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#F5F2EE] text-[#1A1A1A] border border-[#1A1A1A]/10 font-mono text-xs">
                Giá: {filters.min_price ? formatVND(filters.min_price) : '0đ'} -{' '}
                {filters.max_price ? formatVND(filters.max_price) : formatVND(priceBounds.max)}
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...filters, min_price: undefined, max_price: undefined };
                    updateFiltersAndUrl(updated);
                  }}
                  className="hover:opacity-75"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="font-mono text-xs text-[#D4432A] hover:underline ml-auto flex items-center gap-1 py-1 uppercase tracking-wider"
            >
              <RefreshCw className="w-3 h-3" /> Xóa tất cả
            </button>
          </div>
        )}

        {/* Results Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#1A1A1A]/10 gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <span className="font-mono text-xs text-[#6E6E6E] uppercase tracking-wider">
              Hiển thị <strong className="text-[#1A1A1A] font-bold">{products.length}</strong> sản phẩm
            </span>

            {/* Mobile & Tablet Filter Trigger Button */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden min-h-[40px] px-3.5 py-1.5 bg-white border border-[#1A1A1A]/15 text-xs font-mono font-bold text-ink rounded-lg flex items-center gap-2 hover:border-accent shadow-2xs transition cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
              <span>Bộ lọc</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-accent inline-block" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-4 self-end sm:self-auto">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#6E6E6E] uppercase tracking-wider hidden sm:inline">
                Sắp xếp:
              </span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-white border border-[#1A1A1A]/15 text-xs font-mono text-[#1A1A1A] px-3 py-1.5 focus:outline-none focus:border-[#C8A96E]"
              >
                <option value="default">Mặc định</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
              </select>
            </div>

            {/* View Mode */}
            <div className="flex items-center border border-[#1A1A1A]/15 bg-white">
              <button
                type="button"
                onClick={() => setGridCols('gallery')}
                className={`p-1.5 transition-colors ${gridCols === 'gallery' ? 'bg-[#1A1A1A] text-white' : 'text-[#6E6E6E] hover:text-[#1A1A1A]'}`}
                title="Dạng xem 2 cột lớn"
              >
                <Grid2X2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setGridCols('grid')}
                className={`p-1.5 transition-colors ${gridCols === 'grid' ? 'bg-[#1A1A1A] text-white' : 'text-[#6E6E6E] hover:text-[#1A1A1A]'}`}
                title="Dạng xem 3 cột chuẩn"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2 Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Sidebar (Desktop Only) */}
          <div className="hidden lg:block w-72 shrink-0">
            <FilterSidebar
              categories={categories}
              brands={brands}
              sizes={sizes}
              colors={colors}
              selectedCategory={filters.category_id}
              selectedBrand={filters.brand_id}
              selectedSize={filters.size_id}
              selectedColor={filters.color_id}
              minPrice={filters.min_price}
              maxPrice={filters.max_price}
              priceBounds={priceBounds}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
              onFilterChange={(newFilters) => updateFiltersAndUrl({ ...filters, ...newFilters })}
              onReset={handleResetFilters}
            />
          </div>

          {/* Product Grid / Skeleton / Empty State */}
          <div className="flex-1 w-full">
            {loadingProducts ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white border border-[#1A1A1A]/10 p-4 space-y-4">
                    <div className="aspect-[3/4] bg-[#EFECE6]" />
                    <div className="h-4 bg-[#EFECE6] w-3/4" />
                    <div className="h-4 bg-[#EFECE6] w-1/2" />
                  </div>
                ))}
              </div>
            ) : isError || products.length === 0 ? (
              <EmptyState
                title="Không tìm thấy sản phẩm nào"
                description={
                  filters.search
                    ? `Không có sản phẩm nào khớp với từ khóa "${filters.search}".`
                    : 'Thử điều chỉnh hoặc bỏ bớt các tiêu chí bộ lọc.'
                }
                actionLabel="Xóa bộ lọc"
                onAction={handleResetFilters}
              />
            ) : (
              <div
                className={
                  gridCols === 'gallery'
                    ? 'grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8'
                    : 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6'
                }
              >
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile & Tablet Filter Modal / Slide-over Drawer */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setMobileFilterOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer Panel */}
            <aside
              aria-label="Mobile Filters"
              className="fixed inset-y-0 right-0 max-w-md w-full bg-[#F5F2EE] shadow-2xl flex flex-col justify-between overflow-hidden border-l border-line transform transition-transform duration-300 ease-out"
            >
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-accent" />
                  <h3 className="font-editorial text-lg font-bold text-ink">Bộ lọc sản phẩm</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-ink-soft hover:text-ink rounded-full transition cursor-pointer"
                  aria-label="Đóng bộ lọc"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                <FilterSidebar
                  categories={categories}
                  brands={brands}
                  sizes={sizes}
                  colors={colors}
                  selectedCategory={filters.category_id}
                  selectedBrand={filters.brand_id}
                  selectedSize={filters.size_id}
                  selectedColor={filters.color_id}
                  minPrice={filters.min_price}
                  maxPrice={filters.max_price}
                  priceBounds={priceBounds}
                  sortOrder={sortOrder}
                  onSortChange={setSortOrder}
                  onFilterChange={(newFilters) => updateFiltersAndUrl({ ...filters, ...newFilters })}
                  onReset={handleResetFilters}
                />
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-line bg-white flex items-center gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => {
                    handleResetFilters();
                    setMobileFilterOpen(false);
                  }}
                  className="flex-1 min-h-[44px] py-2.5 px-4 border border-line text-ink font-mono text-xs font-bold uppercase rounded-xl hover:bg-bg-alt transition cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1 min-h-[44px] py-2.5 px-4 bg-ink hover:bg-accent text-white font-mono text-xs font-bold uppercase rounded-xl transition cursor-pointer shadow-xs"
                >
                  Xem {products.length} sản phẩm
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

