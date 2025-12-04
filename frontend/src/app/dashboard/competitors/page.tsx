'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  Trophy,
  Target,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Swords,
  Crown,
  Medal,
  Shield,
  Tag,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Cell,
} from 'recharts';
import { getQueryRuns, getCompetitorAnalysis, getCurrentClient } from '@/lib/api';

interface QueryRun {
  id: number;
  name: string | null;
  status: string;
  created_at: string;
}

interface CompetitorData {
  name: string;
  is_brand: boolean;
  mention_count: number;
  mention_rate: number;
  first_third_rate?: number;
  positive_rate?: number;
  unique_queries?: number;
}

interface CompetitorAnalysis {
  query_run_id: number;
  total_responses: number;
  comparison: CompetitorData[];
  win_loss: {
    wins: number;
    ties: number;
    losses: number;
    neither: number;
  };
  branded_count: number;
  non_branded_count: number;
  filter_applied: string;
}

type BrandedFilter = 'all' | 'branded' | 'non_branded';

const COLORS = {
  brand: '#EB593B',
  emerald: '#10b981',
  blue: '#1F7AFC',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  pink: '#ec4899',
  slate: '#64748b',
};

const BAR_COLORS = ['#EB593B', '#10b981', '#1F7AFC', '#f59e0b', '#8b5cf6', '#ec4899'];

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 min-w-[180px]">
        <p className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">
          {label || payload[0]?.payload?.name}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-sm text-gray-600">{entry.name || 'Value'}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {typeof entry.value === 'number' ? 
                (entry.dataKey === 'mention_rate' ? `${entry.value.toFixed(1)}%` : entry.value) 
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function CompetitorsPage() {
  const searchParams = useSearchParams();
  const runId = searchParams.get('run');

  const [queryRuns, setQueryRuns] = useState<QueryRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(
    runId ? parseInt(runId) : null
  );
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [brandName, setBrandName] = useState('');
  const [brandedFilter, setBrandedFilter] = useState<BrandedFilter>('all');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedRunId) {
      loadAnalysis(selectedRunId, brandedFilter);
    }
  }, [selectedRunId, brandedFilter]);

  const loadInitialData = async () => {
    try {
      const [runs, client] = await Promise.all([
        getQueryRuns(20),
        getCurrentClient(),
      ]);
      setBrandName(client.brand_name);

      const completedRuns = runs.filter((r: QueryRun) => r.status === 'completed');
      setQueryRuns(completedRuns);

      if (!selectedRunId && completedRuns.length > 0) {
        setSelectedRunId(completedRuns[0].id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysis = async (runId: number, filter: BrandedFilter) => {
    const branded = filter === 'all' ? null : filter === 'branded';
    try {
      const data = await getCompetitorAnalysis(runId, branded);
      setAnalysis(data);
    } catch (error) {
      console.error('Failed to load analysis:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (queryRuns.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-100 to-blue-100 flex items-center justify-center mx-auto mb-6">
          <Users className="w-10 h-10 text-brand-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h2>
        <p className="text-gray-500 mb-6">Run some queries first to see competitor analysis.</p>
        <a
          href="/dashboard/generator"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
        >
          Run Queries <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    );
  }

  const sortedComparison = analysis?.comparison.sort((a, b) => b.mention_rate - a.mention_rate) || [];
  const brandData = sortedComparison.find(c => c.is_brand);
  const competitorData = sortedComparison.filter(c => !c.is_brand);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Swords className="w-5 h-5 text-white/80" />
              <span className="text-white/80 text-sm font-medium">Competitor Analysis</span>
            </div>
            <h1 className="text-2xl font-bold mb-1">
              Head-to-Head Comparison
            </h1>
            <p className="text-white/80">
              <span className="font-semibold text-white">{brandName}</span> vs competitors across LLM platforms
            </p>
          </div>
          <select
            value={selectedRunId || ''}
            onChange={(e) => setSelectedRunId(parseInt(e.target.value))}
            className="px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            {queryRuns.map((run) => (
              <option key={run.id} value={run.id} className="text-gray-900">
                {run.name || `Run #${run.id}`} - {new Date(run.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
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
                <p><strong>Non-Branded:</strong> Shows true competitive landscape</p>
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
        {analysis && (
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span>Showing: {analysis.total_responses} responses</span>
            <span>•</span>
            <span className="text-emerald-600">{analysis.non_branded_count} non-branded</span>
            <span>•</span>
            <span className="text-blue-600">{analysis.branded_count} branded</span>
          </div>
        )}
      </div>

      {analysis && (
        <>
          {/* Win/Loss Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-5 card-hover relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-100 rounded-full opacity-50"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-gray-500">Wins</span>
                </div>
                <p className="text-3xl font-bold text-emerald-600">{analysis.win_loss.wins}</p>
                <p className="text-xs text-gray-500 mt-1">{brandName} only</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-5 card-hover relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-100 rounded-full opacity-50"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                    <Minus className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-gray-500">Ties</span>
                </div>
                <p className="text-3xl font-bold text-amber-600">{analysis.win_loss.ties}</p>
                <p className="text-xs text-gray-500 mt-1">Both appear</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-5 card-hover relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-red-100 rounded-full opacity-50"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-gray-500">Losses</span>
                </div>
                <p className="text-3xl font-bold text-red-600">{analysis.win_loss.losses}</p>
                <p className="text-xs text-gray-500 mt-1">Competitor only</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-5 card-hover relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-gray-100 rounded-full opacity-50"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-gray-500">Neither</span>
                </div>
                <p className="text-3xl font-bold text-gray-600">{analysis.win_loss.neither}</p>
                <p className="text-xs text-gray-500 mt-1">No brands mentioned</p>
              </div>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Visibility Leaderboard</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Company</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Mention Count</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Mention Rate</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedComparison.map((comp, index) => (
                    <tr key={comp.name} className={`border-b border-gray-50 ${comp.is_brand ? 'bg-brand-50' : 'hover:bg-gray-50'}`}>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            comp.is_brand 
                              ? 'bg-gradient-to-br from-brand-400 to-brand-600' 
                              : 'bg-gray-100'
                          }`}>
                            {comp.is_brand ? (
                              <Shield className="w-4 h-4 text-white" />
                            ) : (
                              <Users className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <span className={`font-medium ${comp.is_brand ? 'text-brand-600' : 'text-gray-900'}`}>
                            {comp.name}
                          </span>
                          {comp.is_brand && (
                            <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-600 text-xs font-medium">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-700 font-medium">{comp.mention_count}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${comp.is_brand ? 'bg-gradient-to-r from-brand-400 to-brand-600' : 'bg-blue-500'}`}
                              style={{ width: `${comp.mention_rate}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-700">{comp.mention_rate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          index === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white' :
                          index === 1 ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-white' :
                          index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          #{index + 1}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Mention Rate Comparison</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={sortedComparison} layout="vertical">
                <defs>
                  {sortedComparison.map((_, index) => (
                    <linearGradient key={index} id={`barGrad${index}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={BAR_COLORS[index % BAR_COLORS.length]} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={BAR_COLORS[index % BAR_COLORS.length]} stopOpacity={1} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="mention_rate" name="Mention Rate" radius={[0, 8, 8, 0]} barSize={28}>
                  {sortedComparison.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.is_brand ? 'url(#barGrad0)' : `url(#barGrad${(index % BAR_COLORS.length) || 1})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
