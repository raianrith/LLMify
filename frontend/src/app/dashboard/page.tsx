'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  BarChart3,
  Users,
  Target,
  ArrowRight,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Tag,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  getDashboardStats,
  getQueryRuns,
  getCurrentClient,
  getMentionRatesBySource,
  getDashboardStatsFiltered,
} from '@/lib/api';

interface DashboardStats {
  total_query_runs: number;
  total_responses: number;
  overall_mention_rate: number;
  recent_trend: string;
  trend_change: number;
}

interface FilteredStats {
  total_query_runs: number;
  total_responses: number;
  overall_mention_rate: number;
  branded_count: number;
  non_branded_count: number;
  filter_applied: string;
}

interface QueryRun {
  id: number;
  name: string | null;
  status: string;
  total_queries: number;
  completed_queries: number;
  created_at: string;
}

interface Client {
  name: string;
  brand_name: string;
  primary_color: string;
}

interface MentionRateBySource {
  source: string;
  total_responses: number;
  mentioned_count: number;
  mention_rate: number;
  first_third_rate: number;
  positive_rate: number;
}

type BrandedFilter = 'all' | 'branded' | 'non_branded';

const SOURCE_COLORS: Record<string, string> = {
  OpenAI: '#10b981',
  Gemini: '#1F7AFC',
  Perplexity: '#f59e0b',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 min-w-[180px]">
        <p className="text-sm font-semibold text-gray-900 mb-2 pb-2 border-b border-gray-100">
          {data.source}
        </p>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Mention Rate</span>
            <span className="text-sm font-semibold text-gray-900">{data.mention_rate}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">First Third</span>
            <span className="text-sm font-semibold text-gray-900">{data.first_third_rate}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Positive</span>
            <span className="text-sm font-semibold text-gray-900">{data.positive_rate}%</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-gray-100 mt-1">
            <span className="text-xs text-gray-500">Total Responses</span>
            <span className="text-xs text-gray-600">{data.total_responses}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [filteredStats, setFilteredStats] = useState<FilteredStats | null>(null);
  const [recentRuns, setRecentRuns] = useState<QueryRun[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [mentionRates, setMentionRates] = useState<MentionRateBySource[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandedFilter, setBrandedFilter] = useState<BrandedFilter>('all');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadFilteredData();
  }, [brandedFilter]);

  const loadInitialData = async () => {
    try {
      const [statsData, runsData, clientData] = await Promise.all([
        getDashboardStats(),
        getQueryRuns(5),
        getCurrentClient(),
      ]);
      setStats(statsData);
      setRecentRuns(runsData);
      setClient(clientData);
      
      // Load filtered data
      await loadFilteredData();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredData = async () => {
    try {
      const branded = brandedFilter === 'all' ? null : brandedFilter === 'branded';
      const [ratesData, filteredStatsData] = await Promise.all([
        getMentionRatesBySource(branded),
        getDashboardStatsFiltered(branded),
      ]);
      setMentionRates(ratesData);
      setFilteredStats(filteredStatsData);
    } catch (error) {
      console.error('Failed to load filtered data:', error);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-emerald-600" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'running':
        return <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome section */}
      <div className="bg-white rounded-xl p-6 lg:p-8 shadow-soft border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              Welcome back! 👋
            </h1>
            <p className="text-gray-600">
              Here&apos;s how{' '}
              <span className="text-brand-500 font-semibold">{client?.brand_name}</span>{' '}
              is performing across AI platforms
            </p>
          </div>
          <Link
            href="/dashboard/generator"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors shadow-soft"
          >
            <Play className="w-5 h-5" />
            Run New Analysis
          </Link>
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
                <p className="font-semibold mb-1">Branded vs Non-Branded Queries</p>
                <p><strong>Branded:</strong> Queries that mention your brand (e.g., &quot;What does {client?.brand_name} do?&quot;)</p>
                <p className="mt-1"><strong>Non-Branded:</strong> Generic queries where your brand should ideally appear naturally</p>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-8 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBrandedFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                brandedFilter === 'all'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Queries
            </button>
            <button
              onClick={() => setBrandedFilter('non_branded')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                brandedFilter === 'non_branded'
                  ? 'bg-white shadow-sm text-emerald-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Non-Branded
            </button>
            <button
              onClick={() => setBrandedFilter('branded')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                brandedFilter === 'branded'
                  ? 'bg-white shadow-sm text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Branded
            </button>
          </div>
        </div>
        {filteredStats && (
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span>Total: {filteredStats.branded_count + filteredStats.non_branded_count} queries</span>
            <span>•</span>
            <span className="text-emerald-600">{filteredStats.non_branded_count} non-branded</span>
            <span>•</span>
            <span className="text-blue-600">{filteredStats.branded_count} branded</span>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Overall Mention Rate */}
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-brand-600" />
            </div>
            {stats && getTrendIcon(stats.recent_trend)}
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {filteredStats?.overall_mention_rate.toFixed(1) || stats?.overall_mention_rate.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500">
            Mention Rate
            {brandedFilter !== 'all' && (
              <span className={`ml-1 text-xs ${brandedFilter === 'branded' ? 'text-blue-600' : 'text-emerald-600'}`}>
                ({brandedFilter === 'branded' ? 'branded' : 'non-branded'})
              </span>
            )}
          </p>
        </div>

        {/* Total Query Runs */}
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-wrike-100 flex items-center justify-center">
              <Search className="w-6 h-6 text-wrike-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {stats?.total_query_runs || 0}
          </p>
          <p className="text-sm text-gray-500">Total Query Runs</p>
        </div>

        {/* Total Responses */}
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {filteredStats?.total_responses.toLocaleString() || stats?.total_responses.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500">
            Responses
            {brandedFilter !== 'all' && (
              <span className={`ml-1 text-xs ${brandedFilter === 'branded' ? 'text-blue-600' : 'text-emerald-600'}`}>
                ({brandedFilter === 'branded' ? 'branded' : 'non-branded'})
              </span>
            )}
          </p>
        </div>

        {/* Trend Status */}
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Target className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1 capitalize">
            {stats?.recent_trend || 'N/A'}
          </p>
          <p className="text-sm text-gray-500">Recent Trend</p>
        </div>
      </div>

      {/* Mention Rate by LLM Chart */}
      {mentionRates.length > 0 && mentionRates.some(r => r.total_responses > 0) && (
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Mention Rate by LLM Platform</h2>
              <p className="text-sm text-gray-500">
                {brandedFilter === 'all' ? 'All queries' : brandedFilter === 'branded' ? 'Branded queries only' : 'Non-branded queries only'}
                {' '}across all runs
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar Chart */}
            <div className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={mentionRates} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                  <YAxis type="category" dataKey="source" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="mention_rate" name="Mention Rate" radius={[0, 8, 8, 0]} barSize={40}>
                    {mentionRates.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SOURCE_COLORS[entry.source] || '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stats Cards */}
            <div className="space-y-3">
              {mentionRates.map((rate) => (
                <div
                  key={rate.source}
                  className="p-4 rounded-lg border border-gray-200 bg-gray-50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: SOURCE_COLORS[rate.source] }}
                    />
                    <span className="font-medium text-gray-900">{rate.source}</span>
                    <span className="text-xs text-gray-400">({rate.total_responses})</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{rate.mention_rate}%</p>
                      <p className="text-xs text-gray-500">Mention</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{rate.first_third_rate}%</p>
                      <p className="text-xs text-gray-500">1st Third</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{rate.positive_rate}%</p>
                      <p className="text-xs text-gray-500">Positive</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick actions and recent runs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/generator"
              className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                  <Search className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Run Predefined Queries</p>
                  <p className="text-sm text-gray-500">Execute all configured queries at once</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/dashboard/analysis"
              className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">View Latest Analysis</p>
                  <p className="text-sm text-gray-500">See detailed visibility metrics</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/dashboard/gaps"
              className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Target className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Identify Gaps</p>
                  <p className="text-sm text-gray-500">Find opportunities for improvement</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>

        {/* Recent Query Runs */}
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Runs</h2>
            <Link
              href="/dashboard/generator"
              className="text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors"
            >
              View all →
            </Link>
          </div>

          {recentRuns.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">No query runs yet</p>
              <Link
                href="/dashboard/generator"
                className="inline-flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors"
              >
                Run your first analysis <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRuns.map((run) => (
                <Link
                  key={run.id}
                  href={`/dashboard/analysis?run=${run.id}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(run.status)}
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {run.name || `Run #${run.id}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(run.created_at).toLocaleDateString()} •{' '}
                        {run.completed_queries}/{run.total_queries} queries
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      run.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : run.status === 'running'
                        ? 'bg-brand-100 text-brand-700'
                        : run.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {run.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
