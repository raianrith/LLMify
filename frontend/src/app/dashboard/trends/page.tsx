'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  ArrowRight,
  Activity,
  Zap,
  BarChart3,
  Tag,
  Info,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Bar,
} from 'recharts';
import { getTimeSeriesData, getCurrentClient } from '@/lib/api';

interface TimeSeriesDataPoint {
  date: string;
  mention_rate: number;
  first_third_rate: number;
  positive_rate: number;
  response_count: number;
}

interface TimeSeriesResponse {
  data_points: TimeSeriesDataPoint[];
  by_source: {
    [key: string]: Array<{ date: string; mention_rate: number }>;
  };
  trend: string;
  trend_change: number;
  branded_count: number;
  non_branded_count: number;
  filter_applied: string;
}

type BrandedFilter = 'all' | 'branded' | 'non_branded';

const COLORS = {
  brand: '#EB593B',
  brandLight: '#F29B85',
  emerald: '#10b981',
  emeraldLight: '#6ee7b7',
  blue: '#1F7AFC',
  blueLight: '#93c5fd',
  violet: '#8b5cf6',
  violetLight: '#c4b5fd',
  amber: '#f59e0b',
  amberLight: '#fcd34d',
  OpenAI: '#10b981',
  Gemini: '#1F7AFC',
  Perplexity: '#f59e0b',
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 min-w-[180px]">
        <p className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">{entry.name}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
              {entry.name.includes('Rate') || entry.name.includes('Context') ? '%' : ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function TrendsPage() {
  const [data, setData] = useState<TimeSeriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [brandName, setBrandName] = useState('');
  const [brandedFilter, setBrandedFilter] = useState<BrandedFilter>('all');

  useEffect(() => {
    loadData();
  }, [days, brandedFilter]);

  const loadData = async () => {
    setLoading(true);
    const branded = brandedFilter === 'all' ? null : brandedFilter === 'branded';
    try {
      const [timeSeriesData, client] = await Promise.all([
        getTimeSeriesData(days, branded),
        getCurrentClient(),
      ]);
      setData(timeSeriesData);
      setBrandName(client.brand_name);
    } catch (error) {
      console.error('Failed to load time series data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-6 h-6 text-emerald-500" />;
      case 'down':
        return <TrendingDown className="w-6 h-6 text-red-500" />;
      default:
        return <Minus className="w-6 h-6 text-gray-400" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data || data.data_points.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-100 to-violet-100 flex items-center justify-center mx-auto mb-6">
          <TrendingUp className="w-10 h-10 text-brand-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Historical Data</h2>
        <p className="text-gray-500 mb-6">
          Run multiple query analyses over time to see trends and patterns.
        </p>
        <a
          href="/dashboard/generator"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
        >
          Run Queries <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    );
  }

  const formattedData = data.data_points.map((point) => ({
    ...point,
    date: formatDate(point.date),
  }));

  const latestRate = data.data_points[data.data_points.length - 1]?.mention_rate || 0;
  const totalResponses = data.data_points.reduce((sum, p) => sum + p.response_count, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Time Series Analytics
            </h1>
            <p className="text-white/80">
              Track <span className="font-semibold text-white">{brandName}</span>&apos;s visibility trends over time
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/20 rounded-lg px-4 py-2 backdrop-blur-sm">
            <Calendar className="w-5 h-5 text-white/80" />
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value={7} className="text-gray-900">Last 7 days</option>
              <option value={30} className="text-gray-900">Last 30 days</option>
              <option value={90} className="text-gray-900">Last 90 days</option>
              <option value={365} className="text-gray-900">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Branded Filter Toggle */}
      <div className="bg-white rounded-xl p-4 shadow-soft border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Query Type Filter</span>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <p className="font-semibold mb-1">Branded vs Non-Branded</p>
                <p><strong>Non-Branded:</strong> See true organic visibility trends</p>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-8 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBrandedFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                brandedFilter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setBrandedFilter('non_branded')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                brandedFilter === 'non_branded' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Non-Branded
            </button>
            <button
              onClick={() => setBrandedFilter('branded')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                brandedFilter === 'branded' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Branded
            </button>
          </div>
        </div>
        {data && (
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span>Total across runs: {data.branded_count + data.non_branded_count} queries</span>
            <span>•</span>
            <span className="text-emerald-600">{data.non_branded_count} non-branded</span>
            <span>•</span>
            <span className="text-blue-600">{data.branded_count} branded</span>
          </div>
        )}
      </div>

      {/* Trend summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-5 card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              {getTrendIcon(data.trend)}
            </div>
            <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
              data.trend === 'up' ? 'bg-emerald-100 text-emerald-700' :
              data.trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {data.trend_change > 0 ? '+' : ''}{data.trend_change.toFixed(1)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 capitalize">{data.trend}</p>
          <p className="text-sm text-gray-500">Overall Trend</p>
        </div>

        <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-5 card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{latestRate.toFixed(1)}%</p>
          <p className="text-sm text-gray-500">Latest Mention Rate</p>
        </div>

        <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-5 card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.data_points.length}</p>
          <p className="text-sm text-gray-500">Data Points</p>
        </div>

        <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-5 card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalResponses.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total Responses</p>
        </div>
      </div>

      {/* Main metrics chart - Area chart with gradients */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Visibility Metrics Over Time</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-brand-500"></div>
              <span className="text-gray-600">Mention Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-gray-600">First Third</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">Positive Context</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="gradientBrand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.brand} stopOpacity={0.4} />
                <stop offset="100%" stopColor={COLORS.brand} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradientEmerald" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.emerald} stopOpacity={0.4} />
                <stop offset="100%" stopColor={COLORS.emerald} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradientBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.blue} stopOpacity={0.4} />
                <stop offset="100%" stopColor={COLORS.blue} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="mention_rate"
              name="Mention Rate"
              stroke={COLORS.brand}
              strokeWidth={3}
              fill="url(#gradientBrand)"
              dot={{ fill: COLORS.brand, strokeWidth: 2, stroke: '#fff', r: 4 }}
              activeDot={{ r: 6, strokeWidth: 3, stroke: '#fff' }}
            />
            <Area
              type="monotone"
              dataKey="first_third_rate"
              name="First Third Rate"
              stroke={COLORS.emerald}
              strokeWidth={3}
              fill="url(#gradientEmerald)"
              dot={{ fill: COLORS.emerald, strokeWidth: 2, stroke: '#fff', r: 4 }}
              activeDot={{ r: 6, strokeWidth: 3, stroke: '#fff' }}
            />
            <Area
              type="monotone"
              dataKey="positive_rate"
              name="Positive Context"
              stroke={COLORS.blue}
              strokeWidth={3}
              fill="url(#gradientBlue)"
              dot={{ fill: COLORS.blue, strokeWidth: 2, stroke: '#fff', r: 4 }}
              activeDot={{ r: 6, strokeWidth: 3, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* By source chart */}
      {Object.keys(data.by_source).length > 0 && (
        <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Performance by LLM Platform</h3>
            <div className="flex items-center gap-4 text-sm">
              {Object.keys(data.by_source).map((source) => (
                <div key={source} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[source as keyof typeof COLORS] || '#94a3b8' }}
                  ></div>
                  <span className="text-gray-600">{source}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart>
              <defs>
                {Object.keys(data.by_source).map((source) => (
                  <linearGradient key={source} id={`gradient${source}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS[source as keyof typeof COLORS] || '#94a3b8'} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={COLORS[source as keyof typeof COLORS] || '#94a3b8'} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                allowDuplicatedCategory={false}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              {Object.entries(data.by_source).map(([source, points]) => (
                <Line
                  key={source}
                  data={points.map((p) => ({ ...p, date: formatDate(p.date) }))}
                  type="monotone"
                  dataKey="mention_rate"
                  name={source}
                  stroke={COLORS[source as keyof typeof COLORS] || '#94a3b8'}
                  strokeWidth={3}
                  dot={{ 
                    fill: COLORS[source as keyof typeof COLORS] || '#94a3b8', 
                    strokeWidth: 2, 
                    stroke: '#fff', 
                    r: 4 
                  }}
                  activeDot={{ r: 6, strokeWidth: 3, stroke: '#fff' }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Response volume - Combo chart */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Analysis Volume & Trends</h3>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={formattedData}>
            <defs>
              <linearGradient id="gradientVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.violet} stopOpacity={0.8} />
                <stop offset="100%" stopColor={COLORS.violet} stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis 
              yAxisId="left"
              stroke="#94a3b8" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#94a3b8" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              yAxisId="left"
              dataKey="response_count"
              name="Responses"
              fill="url(#gradientVolume)"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="mention_rate"
              name="Mention Rate"
              stroke={COLORS.brand}
              strokeWidth={3}
              dot={{ fill: COLORS.brand, strokeWidth: 2, stroke: '#fff', r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
