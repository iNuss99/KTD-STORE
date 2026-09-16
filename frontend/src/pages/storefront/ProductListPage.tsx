import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProductCard } from '../../components/storefront/ProductCard';
import { FilterSidebar } from '../../components/storefront/FilterSidebar';
import { EmptyState } from '../../components/common/EmptyState';
import { Category, Brand } from '../../types';
import { RefreshCw, SlidersHorizontal, ArrowUpDown, X, Tag, Grid2X2, Grid3X3 } from 'lucide-react';
import { useProducts, useProductMetadata } from '../../hooks/useProducts';

export const ProductListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [gridCols, setGridCols] = useState<'gallery' | 'grid'>('grid');

  const [filters, setFilters] = useState<{
    category_id?: string;
    brand_id?: string;
    size_id?: string;
    color_id?: string;
    min_price?: number;
    max_price?: number;
    search?: string;
  }>(() => ({
    category_id: searchParams.get('category_id') || searchParams.get('category') || undefined,
    brand_id: searchParams.get('brand_id') || undefined,
    size_id: searchParams.get('size_id') || undefined,
    color_id: searchParams.get('color_id') || undefined,
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    search: searchParams.get('search') || undefined,
  }));

  const [sortOrder, setSortOrder] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories', 'tree'],
    queryFn: async () => {
      const res = await fetch('/api/categories/tree');
      return res.ok ? res.json() : [];
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: brands = [] } = useQuery<Brand[]>({
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

  useEffect(() => {
    const rawCategory = searchParams.get('category_id') || searchParams.get('category') || undefined;
    const matchedCategory = findCategory(rawCategory);
    // Nếu tìm thấy danh mục theo slug hoặc UUID thì lấy ID chuẩn của danh mục
    const resolvedCategoryId = matchedCategory ? matchedCategory.id : rawCategory;

    setFilters({
      search: searchParams.get('search') || undefined,
      category_id: resolvedCategoryId,
      brand_id: searchParams.get('brand_id') || undefined,
      size_id: searchParams.get('size_id') || undefined,
      color_id: searchParams.get('color_id') || undefined,
      min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    });
  }, [searchParams, categories, findCategory]);

  const updateFiltersAndUrl = (newFilters: typeof filters) => {
    setFilters(newFilters);
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
    setFilters({});
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
              ? `Khám phá các thiết kế ${activeCategoryName} cao cấp tại KTDL với chất liệu tuyển chọn và phom dáng may đo tinh tế.`
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
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#6E6E6E] uppercase tracking-wider">
              Hiển thị <strong className="text-[#1A1A1A] font-bold">{products.length}</strong> sản phẩm
            </span>
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
          {/* Left Sidebar */}
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

          {/* Product Grid / Skeleton / Empty State */}
          <div className="flex-1 w-full">
            {loadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    ? 'grid grid-cols-1 sm:grid-cols-2 gap-8'
                    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                }
              >
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

