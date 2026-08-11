import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProductCard } from '../components/ProductCard';
import { FilterSidebar } from '../components/FilterSidebar';
import { EmptyState } from '../components/EmptyState';
import { Category, Brand } from '../types';
import { Search, RefreshCw, SlidersHorizontal, ArrowUpDown, X, Tag } from 'lucide-react';
import { useProducts, useProductMetadata } from '../hooks/useProducts';

export const ProductListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial filter values from URL params
  const [filters, setFilters] = useState<{
    category_id?: string;
    brand_id?: string;
    size_id?: string;
    color_id?: string;
    min_price?: number;
    max_price?: number;
    search?: string;
  }>(() => ({
    category_id: searchParams.get('category_id') || undefined,
    brand_id: searchParams.get('brand_id') || undefined,
    size_id: searchParams.get('size_id') || undefined,
    color_id: searchParams.get('color_id') || undefined,
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    search: searchParams.get('search') || undefined,
  }));

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [sortOrder, setSortOrder] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  // Sync state when URL params change externally (e.g. clicking a link in Header or autocomplete)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || undefined;
    const urlCategory = searchParams.get('category_id') || undefined;
    const urlBrand = searchParams.get('brand_id') || undefined;
    const urlSize = searchParams.get('size_id') || undefined;
    const urlColor = searchParams.get('color_id') || undefined;
    const urlMin = searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined;
    const urlMax = searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined;

    setFilters({
      search: urlSearch,
      category_id: urlCategory,
      brand_id: urlBrand,
      size_id: urlSize,
      color_id: urlColor,
      min_price: urlMin,
      max_price: urlMax,
    });
    setSearchTerm(urlSearch || '');
  }, [searchParams]);

  // Update URL params when filters change
  const updateFiltersAndUrl = (newFilters: typeof filters) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.category_id) params.set('category_id', newFilters.category_id);
    if (newFilters.brand_id) params.set('brand_id', newFilters.brand_id);
    if (newFilters.size_id) params.set('size_id', newFilters.size_id);
    if (newFilters.color_id) params.set('color_id', newFilters.color_id);
    if (newFilters.min_price) params.set('min_price', String(newFilters.min_price));
    if (newFilters.max_price) params.set('max_price', String(newFilters.max_price));
    setSearchParams(params);
  };

  // TanStack Query Hooks
  const { data: productsData, isLoading: loadingProducts, isError } = useProducts(filters);
  const { data: metadata } = useProductMetadata();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories', 'tree'],
    queryFn: async () => {
      const res = await fetch('/api/categories/tree');
      return res.ok ? res.json() : [];
    },
  });

  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await fetch('/api/brands');
      return res.ok ? res.json() : [];
    },
  });

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFiltersAndUrl({ ...filters, search: searchTerm.trim() || undefined });
  };

  const handleResetFilters = () => {
    setFilters({});
    setSearchTerm('');
    setSortOrder('default');
    setSearchParams(new URLSearchParams());
  };

  const removeSingleFilter = (key: keyof typeof filters) => {
    const updated = { ...filters, [key]: undefined };
    if (key === 'search') setSearchTerm('');
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

  // Helper names for active filter badges
  const activeCategoryName = categories.find((c) => c.id === filters.category_id)?.name;
  const activeBrandName = brands.find((b) => b.id === filters.brand_id)?.name;
  const activeSizeName = sizes.find((s: any) => s.id === filters.size_id)?.name;
  const activeColorName = colors.find((c: any) => c.id === filters.color_id)?.name;

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans">
      {/* Header Banner Section */}
      <section className="bg-bg-alt border-b border-line py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="font-mono text-accent text-xs font-semibold uppercase tracking-widest block mb-1">
              DANH MỤC SẢN PHẨM
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight">
              {filters.search ? `Kết quả tìm kiếm: "${filters.search}"` : 'Bộ Sưu Tập Thời Trang Nam'}
            </h1>
            <p className="text-ink-soft text-sm font-sans mt-1 max-w-lg">
              Thiết kế tối giản, chất liệu cao cấp, tôn vinh phong cách người đàn ông hiện đại.
            </p>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
            <input
              type="text"
              placeholder="Tìm kiếm áo polo, sơ mi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card border border-line text-ink placeholder-ink-soft text-xs font-mono rounded-full px-4 py-3 pl-10 pr-10 focus:outline-none focus:border-accent transition-colors shadow-xs"
            />
            <Search className="w-4 h-4 text-ink-soft absolute left-3.5 top-3.5" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  removeSingleFilter('search');
                }}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-card border border-line rounded-2xl">
            <span className="text-xs font-bold text-ink-soft flex items-center gap-1.5 mr-1">
              <Tag className="w-3.5 h-3.5 text-accent" /> Đang lọc theo:
            </span>

            {filters.search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent/10 text-accent border border-accent/20 rounded-full text-xs font-semibold">
                Từ khóa: "{filters.search}"
                <button type="button" onClick={() => removeSingleFilter('search')} className="hover:opacity-75">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {activeCategoryName && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-semibold">
                Danh mục: {activeCategoryName}
                <button type="button" onClick={() => removeSingleFilter('category_id')} className="hover:opacity-75">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {activeBrandName && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold">
                Thương hiệu: {activeBrandName}
                <button type="button" onClick={() => removeSingleFilter('brand_id')} className="hover:opacity-75">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {activeSizeName && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-full text-xs font-semibold">
                Size: {activeSizeName}
                <button type="button" onClick={() => removeSingleFilter('size_id')} className="hover:opacity-75">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {activeColorName && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-full text-xs font-semibold">
                Màu: {activeColorName}
                <button type="button" onClick={() => removeSingleFilter('color_id')} className="hover:opacity-75">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(filters.min_price !== undefined || filters.max_price !== undefined) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold">
                Giá: {filters.min_price ? `${filters.min_price.toLocaleString('vi-VN')}đ` : '0đ'} -{' '}
                {filters.max_price ? `${filters.max_price.toLocaleString('vi-VN')}đ` : 'Tối đa'}
                <button
                  type="button"
                  onClick={() => updateFiltersAndUrl({ ...filters, min_price: undefined, max_price: undefined })}
                  className="hover:opacity-75"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-coral hover:underline ml-auto flex items-center gap-1 py-1"
            >
              <RefreshCw className="w-3 h-3" /> Xóa tất cả
            </button>
          </div>
        )}

        {/* Results Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-line gap-4">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-4 h-4 text-accent" />
            <span className="font-mono text-xs font-semibold text-ink uppercase tracking-wider">
              Kết quả tìm kiếm
            </span>
            <span className="font-mono text-xs font-bold text-white bg-accent px-2.5 py-0.5 rounded-full">
              {products.length} sản phẩm
            </span>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {/* Sorting */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-ink-soft" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-card border border-line rounded-lg text-xs font-mono text-ink px-3 py-1.5 focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="default">Sắp xếp: Mới nhất</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
              </select>
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
            onFilterChange={(newFilters) => updateFiltersAndUrl({ ...filters, ...newFilters })}
            onReset={handleResetFilters}
          />

          {/* Product Grid / Skeleton / Empty State */}
          <div className="flex-1 w-full">
            {loadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-card border border-line rounded-2xl p-4 space-y-4">
                    <div className="aspect-[4/5] bg-bg-alt rounded-xl" />
                    <div className="h-4 bg-bg-alt rounded w-3/4" />
                    <div className="h-4 bg-bg-alt rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : isError || products.length === 0 ? (
              <EmptyState
                title="Không tìm thấy sản phẩm nào"
                description={
                  filters.search
                    ? `Không có sản phẩm nào khớp với từ khóa "${filters.search}". Thử tìm kiếm với từ khóa khác.`
                    : 'Thử điều chỉnh hoặc bỏ bớt các tiêu chí bộ lọc để khám phá thêm nhiều lựa chọn khác.'
                }
                actionLabel="Xóa bộ lọc"
                onAction={handleResetFilters}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
