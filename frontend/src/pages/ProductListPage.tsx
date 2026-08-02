import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProductCard } from '../components/ProductCard';
import { FilterSidebar } from '../components/FilterSidebar';
import { EmptyState } from '../components/EmptyState';
import { Category, Brand } from '../types';
import { Search, RefreshCw, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useProducts, useProductMetadata } from '../hooks/useProducts';

export const ProductListPage: React.FC = () => {
  const [filters, setFilters] = useState<{
    category_id?: string;
    brand_id?: string;
    size_id?: string;
    color_id?: string;
    min_price?: number;
    max_price?: number;
    search?: string;
  }>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'default' | 'price-asc' | 'price-desc'>('default');

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

  let products = productsData?.data || [];
  const sizes = metadata?.sizes || [];
  const colors = metadata?.colors || [];

  // Client-side sorting
  if (sortOrder === 'price-asc') {
    products = [...products].sort((a, b) => a.base_price - b.base_price);
  } else if (sortOrder === 'price-desc') {
    products = [...products].sort((a, b) => b.base_price - a.base_price);
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchTerm }));
  };

  const handleResetFilters = () => {
    setFilters({});
    setSearchTerm('');
    setSortOrder('default');
  };

  const hasActiveFilters =
    Boolean(filters.category_id || filters.brand_id || filters.size_id || filters.color_id || filters.search || filters.min_price || filters.max_price);

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans">
      {/* Header Banner Section */}
      <section className="bg-bg-alt border-b border-line py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="font-mono text-accent text-xs font-semibold uppercase tracking-widest block mb-1">
              DANH MỤC SẢN PHẨM
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight">
              Bộ Sưu Tập Thời Trang Nam
            </h1>
            <p className="text-ink-soft text-sm font-sans mt-1 max-w-lg">
              Thiết kế tối giản, chất liệu cao cấp, đường nét tinh tế cho người đàn ông hiện đại.
            </p>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card border border-line text-ink placeholder-ink-soft text-xs font-mono rounded-full px-4 py-3 pl-10 focus:outline-none focus:border-accent transition-colors shadow-xs"
            />
            <Search className="w-4 h-4 text-ink-soft absolute left-3.5 top-3.5" />
          </form>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Results Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-line gap-4">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-4 h-4 text-accent" />
            <span className="font-mono text-xs font-semibold text-ink uppercase tracking-wider">
              Kết quả tìm kiếm
            </span>
            <span className="font-mono text-xs font-bold text-white bg-accent px-2.5 py-0.5 rounded-full">
              {products.length} {products.length === 1 ? 'sản phẩm' : 'sản phẩm'}
            </span>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {/* Sorting */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-ink-soft" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-card border border-line rounded-lg text-xs font-mono text-ink px-3 py-1.5 focus:outline-none focus:border-accent"
              >
                <option value="default">Sắp xếp: Mặc định</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-mono font-medium text-coral hover:underline flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Đặt lại bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* 2 Column Layout (980px / lg) */}
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
            onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
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
                description="Thử điều chỉnh hoặc bỏ bớt các tiêu chí bộ lọc để khám phá thêm nhiều lựa chọn khác."
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
