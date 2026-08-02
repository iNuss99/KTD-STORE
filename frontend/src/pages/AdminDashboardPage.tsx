import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PackageCheck,
  Clock,
  AlertTriangle,
  RefreshCw,
  Award,
  ArrowUpRight,
  ChevronRight,
  Users,
  Sparkles,
  Box,
  ArrowRight,
  MoveHorizontal,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const CustomLuxuryTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const revItem = payload.find((p: any) => p.dataKey === 'revenue');
    const orderItem = payload.find((p: any) => p.dataKey === 'orderCount');

    const revValue = revItem ? revItem.value : 0;
    const orderValue = orderItem ? orderItem.value : 0;
    const aov = orderValue > 0 ? Math.round(revValue / orderValue) : 0;

    return (
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-2xl rounded-2xl p-4 text-white text-xs select-none min-w-[210px] animate-fadeIn">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2 mb-3">
          <span className="font-extrabold text-slate-200 tracking-wide">{label}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Chi tiết kỳ
          </span>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-xs shadow-indigo-400"></span>
              <span className="text-slate-400 font-medium">Doanh thu:</span>
            </div>
            <span className="font-extrabold text-white text-sm">
              {revValue.toLocaleString('vi-VN')} ₫
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs shadow-amber-400"></span>
              <span className="text-slate-400 font-medium">Số đơn hàng:</span>
            </div>
            <span className="font-extrabold text-amber-300 text-sm">
              {orderValue} đơn
            </span>
          </div>

          {orderValue > 0 && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>TB / đơn (AOV):</span>
              <span className="font-semibold text-slate-300">
                {aov.toLocaleString('vi-VN')} ₫
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

interface OverviewStats {
  totalRevenue: number;
  totalCompletedOrders: number;
  pendingOrdersCount: number;
  lowStockCount: number;
}

interface RevenueItem {
  period: string;
  revenue: number;
  orderCount: number;
}

interface TopProduct {
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface LowStockVariant {
  id: string;
  sku: string;
  productName: string;
  sizeName: string;
  colorName: string;
  stockQuantity: number;
  price: number;
}

interface StaffPerf {
  staffId: string;
  staffName: string;
  staffEmail: string;
  confirmedOrdersCount: number;
  totalAmount: number;
}

import { useAuth } from '../hooks/useAuth';
import { getAuthHeader } from '../lib/auth-storage';

export const AdminDashboardPage: React.FC = () => {
  const { isSuperAdmin, isCEO, isManager, role } = useAuth();
  const [overview, setOverview] = useState<OverviewStats>({
    totalRevenue: 0,
    totalCompletedOrders: 0,
    pendingOrdersCount: 0,
    lowStockCount: 0,
  });
  const [revenueData, setRevenueData] = useState<RevenueItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStockVariants, setLowStockVariants] = useState<LowStockVariant[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<StaffPerf[]>([]);
  const [periodFilter, setPeriodFilter] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('day');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers = { ...getAuthHeader() };

      const [resOverview, resRevenue, resTop, resStock, resStaff] = await Promise.all([
        fetch('/api/reports/overview', { headers }),
        fetch(`/api/reports/revenue?period=${periodFilter}`, { headers }),
        fetch('/api/reports/top-products?limit=10', { headers }),
        fetch('/api/reports/low-stock?threshold=5', { headers }),
        fetch('/api/reports/staff-performance', { headers }),
      ]);

      if (resOverview.ok) setOverview(await resOverview.json());
      if (resRevenue.ok) setRevenueData(await resRevenue.json());
      if (resTop.ok) setTopProducts(await resTop.json());
      if (resStock.ok) setLowStockVariants(await resStock.json());
      if (resStaff.ok) setStaffPerformance(await resStaff.json());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [periodFilter]);

  if (!isSuperAdmin && !isCEO && !isManager) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 max-w-md mx-auto my-12 shadow-sm select-none">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 font-extrabold text-xl">
          403
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Truy cập bị từ chối</h2>
        <p className="text-xs text-slate-500 font-medium">
          Vai trò <b className="text-slate-700">{role}</b> không có quyền xem Báo cáo & Dashboard quản trị.
        </p>
      </div>
    );
  }

  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue), 1);
  const totalPeriodRevenue = revenueData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
  const totalPeriodOrders = revenueData.reduce((acc, curr) => acc + (curr.orderCount || 0), 0);
  const avgOrderValue = totalPeriodOrders > 0 ? Math.round(totalPeriodRevenue / totalPeriodOrders) : 0;

  const handleSeedData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/seed', {
        method: 'POST',
        headers: getAuthHeader(),
      });
      const data = await res.json();
      alert(data.message || 'Khởi tạo dữ liệu mẫu CRM thành công!');
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col font-sans bg-slate-50/50 min-h-screen">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Bento Grid Header / Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
              <LayoutDashboard className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600 shrink-0" />
              Báo cáo & Dashboard Quản trị CRM
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Tổng quan chỉ số kinh doanh, doanh thu, tồn kho và hiệu suất bán hàng Knot To Detail.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              onClick={handleSeedData}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5"
              title="Tạo dữ liệu báo cáo, đơn hàng & nhân sự mẫu cho CRM"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Tạo dữ liệu ảo
            </button>

            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="day">Theo Ngày</option>
              <option value="week">Theo Tuần</option>
              <option value="month">Theo Tháng</option>
              <option value="quarter">Theo Quý</option>
              <option value="year">Theo Năm</option>
            </select>

            <button
              onClick={() => fetchDashboardData()}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>

        {/* Bento Grid Layout - Responsive Across All Devices (Mobile, Tablet, Laptop, Desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6 mb-8">

          {/* Bento Tile 1: Total Revenue */}
          <div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden hover:shadow-md transition duration-300 flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Tổng Doanh thu
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
                  {overview.totalRevenue.toLocaleString('vi-VN')} ₫
                </h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                +12.5%
              </span>
              <span className="text-xs text-slate-400 font-medium">so với kỳ trước</span>
            </div>
          </div>

          {/* Bento Tile 2: Completed Orders */}
          <div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden hover:shadow-md transition duration-300 flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Đơn thành công
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
                  {overview.totalCompletedOrders}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <PackageCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                +8.2%
              </span>
              <span className="text-xs text-slate-400 font-medium">so với kỳ trước</span>
            </div>
          </div>

          {/* Bento Tile 3: Pending Orders */}
          <div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden hover:shadow-md transition duration-300 flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Đơn chờ xử lý
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
                  {overview.pendingOrdersCount}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                <TrendingDown className="w-3.5 h-3.5 mr-1" />
                -2.4%
              </span>
              <span className="text-xs text-slate-400 font-medium">so với kỳ trước</span>
            </div>
          </div>

          {/* Bento Tile 4: Low Stock Alert */}
          <div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden hover:shadow-md transition duration-300 flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Tồn kho thấp (≤ 5)
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-rose-600 mt-1 tracking-tight">
                  {overview.lowStockCount}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="flex items-center text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                Cần nhập hàng
              </span>
              <span className="text-xs text-slate-400 font-medium">ngay lập tức</span>
            </div>
          </div>

          {/* Bento Tile 5: Main Revenue & Orders Chart (Full Width Span) */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 xl:col-span-6 bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/50 border border-slate-200/80 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-300/40 select-none">
            {/* Header Row & Mini KPI Summary */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 mb-6">
              <div className="flex items-center justify-between sm:justify-start gap-3 w-full lg:w-auto">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/80 shadow-2xs">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                      Biểu đồ Doanh thu & Đơn hàng
                    </h2>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">
                      Hiệu suất kinh doanh qua thời gian ({periodFilter === 'day' ? 'Theo Ngày' : periodFilter === 'week' ? 'Theo Tuần' : periodFilter === 'month' ? 'Theo Tháng' : periodFilter === 'quarter' ? 'Theo Quý' : 'Theo Năm'})
                    </p>
                  </div>
                </div>

                {/* Mobile Scroll Hint Badge */}
                {revenueData.length > 8 && (
                  <span className="inline-flex sm:hidden items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-full border border-indigo-100 shrink-0">
                    <MoveHorizontal className="w-3 h-3 text-indigo-600 animate-pulse" /> Vuốt ngang
                  </span>
                )}
              </div>

              {/* Mini KPI Summary Cards in Header */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <div className="bg-slate-50/80 border border-slate-100 px-3.5 py-2 rounded-2xl flex items-center gap-2.5">
                  <div className="w-2 h-6 sm:h-7 rounded-full bg-indigo-600"></div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng kỳ này</div>
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                      {totalPeriodRevenue.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/80 border border-slate-100 px-3.5 py-2 rounded-2xl flex items-center gap-2.5">
                  <div className="w-2 h-6 sm:h-7 rounded-full bg-amber-500"></div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số đơn hàng</div>
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                      {totalPeriodOrders} đơn
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/80 border border-slate-100 px-3.5 py-2 rounded-2xl flex items-center gap-2.5">
                  <div className="w-2 h-6 sm:h-7 rounded-full bg-emerald-500"></div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TB / Đơn (AOV)</div>
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                      {avgOrderValue.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {revenueData.length === 0 ? (
              <div className="h-[280px] sm:h-[340px] flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                Chưa có dữ liệu doanh thu trong khoảng thời gian này
              </div>
            ) : (
              /* Horizontal Scrollable Container for Mobile Charts */
              <div className="w-full overflow-x-auto custom-scrollbar pb-2 pt-1">
                <div 
                  className="h-[300px] sm:h-[360px] w-full"
                  style={{
                    minWidth: revenueData.length > 10 ? `${Math.max(revenueData.length * 28, 650)}px` : '100%',
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={revenueData}
                      margin={{ top: 20, right: 15, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity={1} />
                          <stop offset="100%" stopColor="#818cf8" stopOpacity={0.7} />
                        </linearGradient>
                        <linearGradient id="colorOrderArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.22} />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />

                      <XAxis 
                        dataKey="period" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
                        dy={12} 
                      />
                      <YAxis 
                        yAxisId="left" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} 
                      />

                      <Tooltip content={<CustomLuxuryTooltip />} />

                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="orderCount"
                        fill="url(#colorOrderArea)"
                        stroke="none"
                      />

                      <Bar 
                        yAxisId="left" 
                        dataKey="revenue" 
                        name="Doanh thu" 
                        fill="url(#colorRevenueGradient)" 
                        radius={[8, 8, 0, 0]} 
                        maxBarSize={36} 
                      />

                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="orderCount" 
                        name="Số lượng đơn" 
                        stroke="#f59e0b" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff' }} 
                        activeDot={{ r: 6, fill: '#d97706', stroke: '#ffffff', strokeWidth: 2 }} 
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Bento Tile 6: Top Selling Products */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-3 bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col hover:shadow-md transition duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  Top 10 Sản phẩm Bán chạy
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Dựa trên tổng doanh thu và số lượng đã bán.</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 max-h-[360px] custom-scrollbar">
              {topProducts.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs py-8 border-2 border-dashed border-slate-100 rounded-xl">
                  Chưa có dữ liệu bán hàng
                </div>
              ) : (
                <div className="space-y-3.5">
                  {topProducts.map((prod, idx) => {
                    const maxQty = Math.max(...topProducts.map(p => p.totalQuantity), 1);
                    const percent = Math.min((prod.totalQuantity / maxQty) * 100, 100);
                    return (
                      <div key={idx} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className={`w-6 h-6 rounded-md font-bold flex items-center justify-center text-[10px] shrink-0 ${
                            idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-200 text-slate-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'
                          }`}>
                            #{idx + 1}
                          </span>
                          <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                            <Box className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-xs sm:text-sm truncate group-hover:text-indigo-600 transition">{prod.productName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">{prod.totalQuantity} đã bán</span>
                              <div className="h-1.5 w-full max-w-[80px] sm:max-w-[100px] bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percent}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-3 shrink-0">
                          <div className="font-extrabold text-slate-900 text-xs sm:text-sm">{prod.totalRevenue.toLocaleString('vi-VN')} ₫</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bento Tile 7: Low Stock Warning */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-3 bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col hover:shadow-md transition duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  Cảnh báo Tồn kho thấp (≤ 5)
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Các biến thể sản phẩm cần được nhập thêm hàng ngay.</p>
              </div>
            </div>

            <div className="overflow-x-auto flex-1 max-h-[360px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold text-[10px] uppercase border-y border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">Sản phẩm</th>
                    <th className="py-2.5 px-3">Phân loại</th>
                    <th className="py-2.5 px-3 text-right">Tồn kho</th>
                    <th className="py-2.5 px-3 text-center rounded-r-lg">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {lowStockVariants.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-emerald-600 font-medium border-2 border-dashed border-emerald-100 rounded-xl mt-4 block w-full">
                        <PackageCheck className="w-7 h-7 mx-auto mb-2 opacity-50" />
                        Tất cả biến thể đều đủ hàng tồn kho!
                      </td>
                    </tr>
                  ) : (
                    lowStockVariants.map((variant) => (
                      <tr key={variant.id} className="hover:bg-slate-50 transition group">
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800 line-clamp-1 text-xs">{variant.productName}</div>
                          <div className="font-mono text-[9px] text-slate-400 mt-0.5">{variant.sku}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-medium whitespace-nowrap text-[11px]">
                          {variant.colorName} / {variant.sizeName}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                            {variant.stockQuantity}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button className="px-2 py-1 text-[10px] font-bold bg-white border border-slate-200 text-slate-600 rounded shadow-2xs hover:bg-slate-50 hover:text-indigo-600 transition inline-flex items-center gap-1">
                            Nhập hàng <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bento Tile 8: Staff Performance (Full Width Span) */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 xl:col-span-6 bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition duration-200">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Hiệu suất Nhân viên Xác nhận Đơn
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Theo dõi số lượng đơn hàng và giá trị đơn hàng do từng nhân viên xử lý.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 min-w-[540px]">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 rounded-l-lg">Nhân viên</th>
                    <th className="py-3 px-4">Liên hệ</th>
                    <th className="py-3 px-4 text-center">Đơn đã xác nhận</th>
                    <th className="py-3 px-4 text-right rounded-r-lg">Tổng giá trị đơn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {staffPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl mt-4 block w-full">
                        Chưa có dữ liệu xử lý đơn của nhân viên
                      </td>
                    </tr>
                  ) : (
                    staffPerformance.map((staff) => (
                      <tr key={staff.staffId} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {staff.staffName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-900">{staff.staffName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{staff.staffEmail}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-100 min-w-[3rem]">
                            {staff.confirmedOrdersCount}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                          {staff.totalAmount.toLocaleString('vi-VN')} ₫
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

