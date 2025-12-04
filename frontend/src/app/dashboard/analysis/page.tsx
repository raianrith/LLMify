'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BarChart3,
  TrendingUp,
  Target,
  Users,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Award,
  Link2,
  Globe,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  getQueryRuns,
  getRunAnalysisSummary,
  getCitationAnalysis,
  getCurrentClient,
} from '@/lib/api';

interface AnalysisSummary {
  query_run_id: number;
  total_responses: number;
  overall_mention_rate: number;
  avg_response_time: number;
  first_third_rate: number;
  positive_context_rate: number;
  mention_rates_by_source: Array<{
    source: string;
    mention_rate: number;
    total_responses: number;
    mentioned_count: number;
  }>;
  position_distribution: Array<{
    position: string;
    count: number;
    percentage: number;
  }>;
  context_distribution: Array<{
    context_type: string;
    count: number;
    percentage: number;
  }>;
  top_competitors: Array<{
    competitor: string;
    mention_count: number;
    percentage: number;
  }>;
  gap_summary: {
    exclusive_wins: number;
    critical_gaps: number;
    competitive_arena: number;
    blue_ocean: number;
    total_responses: number;
  };
  branded_count: number;
  non_branded_count: number;
  filter_applied: string;
}

type BrandedFilter = 'all' | 'branded' | 'non_branded';

interface CitationAnalysis {
  query_run_id: number;
  total_responses: number;
  responses_with_citations: number;
  citation_rate: number;
  total_citations: number;
  avg_citations_per_response: number;
  brand_url_citations: number;
  brand_citation_rate: number;
  brand_domain_mentions: number;
  top_domains: Array<{
    domain: string;
    count: number;
    percentage: number;
  }>;
  citations_by_source: Array<{
    source: string;
    total_responses: number;
    responses_with_citations: number;
    total_citations: number;
    citation_rate: number;
  }>;
  recent_citations: Array<{
    url: string;
    source: string;
    query: string;
  }>;
}

interface QueryRun {
  id: number;
  name: string | null;
  status: string;
  created_at: string;
}

const COLORS = {
  brand: '#EB593B',
  emerald: '#10b981',
  blue: '#1F7AFC',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  slate: '#64748b',
  cyan: '#06b6d4',
};

const POSITION_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#64748b'];
const SOURCE_COLORS = { OpenAI: '#10b981', Gemini: '#1F7AFC', Perplexity: '#f59e0b' };

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 min-w-[160px]">
        <p className="text-sm font-semibold text-gray-900 mb-2 pb-2 border-b border-gray-100">
          {label || payload[0]?.payload?.source || payload[0]?.payload?.position || payload[0]?.payload?.domain}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 py-1">
            <span className="text-sm text-gray-600">{entry.name}</span>
            <span className="text-sm font-semibold text-gray-900">
              {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
              {entry.name?.includes('Rate') || entry.name?.includes('rate') ? '%' : ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalysisPage() {
  const searchParams = useSearchParams();
  const runId = searchParams.get('run');

  const [queryRuns, setQueryRuns] = useState<QueryRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(
    runId ? parseInt(runId) : null
  );
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [citations, setCitations] = useState<CitationAnalysis | null>(null);
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
    
    // Load summary first (required)
    try {
      const summaryData = await getRunAnalysisSummary(runId, branded);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load analysis summary:', error);
    }
    
    // Load citations separately (optional - don't block if it fails)
    try {
      const citationData = await getCitationAnalysis(runId);
      setCitations(citationData);
    } catch (error) {
      console.error('Failed to load citation analysis:', error);
      setCitations(null);
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
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-100 to-violet-100 flex items-center justify-center mx-auto mb-6">
          <BarChart3 className="w-10 h-10 text-brand-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Analysis Available</h2>
        <p className="text-gray-500 mb-6">Run some queries first to see your visibility analysis.</p>
        <a
          href="/dashboard/generator"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
        >
          Run Queries <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-white/80" />
              <span className="text-white/80 text-sm font-medium">Visibility Analysis</span>
            </div>
            <h1 className="text-2xl font-bold mb-1">
              {brandName} Performance Report
            </h1>
            <p className="text-white/80">
              Comprehensive analysis across all LLM platforms
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
                <p className="font-semibold mb-1">Branded vs Non-Branded Queries</p>
                <p><strong>Branded:</strong> Queries mentioning &quot;{brandName}&quot; - typically 100% mention rate</p>
                <p className="mt-1"><strong>Non-Branded:</strong> Generic queries - true organic visibility</p>
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
        {summary && (
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span>Showing: {summary.total_responses} responses</span>
            <span>•</span>
            <span className="text-emerald-600">{summary.non_branded_count} non-branded</span>
            <span>•</span>
            <span className="text-blue-600">{summary.branded_count} branded</span>
          </div>
        )}
      </div>

      {summary && (
        <>
          {/* Key metrics with gradients */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-5 card-hover relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-brand-100 to-brand-50 rounded-bl-full opacity-50"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-gray-500">
                    Mention Rate
                    {brandedFilter !== 'all' && (
                      <span className={`ml-1 text-xs ${brandedFilter === 'branded' ? 'text-blue-600' : 'text-emerald-600'}`}>
                        ({brandedFilter === 'branded' ? 'branded' : 'non-branded'})
                      </span>
                    )}
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {summary.overall_mention_rate.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-5 card-hover relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-bl-full opacity-50"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-gray-500">First Third Rate</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {summary.first_third_rate.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-5 card-hover relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-50 rounded-bl-full opacity-50"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-gray-500">Positive Context</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {summary.positive_context_rate.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-5 card-hover relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100 to-amber-50 rounded-bl-full opacity-50"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-gray-500">Total Responses</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {summary.total_responses}
                </p>
              </div>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mention Rate by Source */}
            <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Mention Rate by LLM Platform
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={summary.mention_rates_by_source} layout="vertical">
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={COLORS.brand} stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#F29B85" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="source" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="mention_rate" name="Mention Rate" fill="url(#barGradient)" radius={[0, 8, 8, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Position Distribution */}
            <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Position Distribution
              </h3>
              <div className="relative">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={summary.position_distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="position"
                    >
                      {summary.position_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={POSITION_COLORS[index % POSITION_COLORS.length]} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{summary.total_responses}</p>
                    <p className="text-sm text-gray-500">Total</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {summary.position_distribution.map((item, index) => (
                  <div key={item.position} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: POSITION_COLORS[index % POSITION_COLORS.length] }} />
                    <span className="text-sm text-gray-600">{item.position}: {item.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gap Summary */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Gap Analysis Summary</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-200/50 rounded-full"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm text-emerald-700 font-medium">Exclusive Wins</span>
                  </div>
                  <p className="text-3xl font-bold text-emerald-700">{summary.gap_summary.exclusive_wins}</p>
                </div>
              </div>

              <div className="relative p-5 rounded-xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-red-200/50 rounded-full"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-red-700 font-medium">Critical Gaps</span>
                  </div>
                  <p className="text-3xl font-bold text-red-700">{summary.gap_summary.critical_gaps}</p>
                </div>
              </div>

              <div className="relative p-5 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-200/50 rounded-full"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-amber-600" />
                    <span className="text-sm text-amber-700 font-medium">Competitive</span>
                  </div>
                  <p className="text-3xl font-bold text-amber-700">{summary.gap_summary.competitive_arena}</p>
                </div>
              </div>

              <div className="relative p-5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-gray-200/50 rounded-full"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700 font-medium">Blue Ocean</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-700">{summary.gap_summary.blue_ocean}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Citation Analysis Section */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Citation Analysis</h3>
                <p className="text-sm text-gray-500">Source URLs referenced by LLMs in their responses</p>
              </div>
            </div>
            
            {citations && citations.total_citations > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Stats & Chart */}
                <div>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-100">
                      <p className="text-2xl font-bold text-cyan-700">{citations.citation_rate}%</p>
                      <p className="text-xs text-cyan-600">Citation Rate</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                      <p className="text-2xl font-bold text-blue-700">{citations.total_citations}</p>
                      <p className="text-xs text-blue-600">Total Citations</p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                      <p className="text-2xl font-bold text-emerald-700">{citations.brand_url_citations}</p>
                      <p className="text-xs text-emerald-600">Brand Citations</p>
                    </div>
                    <div className="p-3 rounded-lg bg-violet-50 border border-violet-100">
                      <p className="text-2xl font-bold text-violet-700">{citations.top_domains.length}</p>
                      <p className="text-xs text-violet-600">Unique Domains</p>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={citations.citations_by_source}>
                      <defs>
                        <linearGradient id="citationGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={COLORS.cyan} stopOpacity={0.8} />
                          <stop offset="100%" stopColor={COLORS.blue} stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="source" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="total_citations" name="Citations" fill="url(#citationGradient)" radius={[6, 6, 0, 0]} barSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Right: Top Domains */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Top Cited Domains</h4>
                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
                    {citations.top_domains.slice(0, 8).map((domain, index) => (
                      <div key={domain.domain} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 font-mono w-5">{index + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900 text-sm truncate flex items-center gap-2">
                              {domain.domain}
                              {brandName.toLowerCase().includes(domain.domain.split('.')[0].toLowerCase()) && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs">You</span>
                              )}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">{domain.count}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500"
                              style={{ width: `${Math.min(domain.percentage * 2, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium mb-2">No Citations Found</p>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  The LLM responses in this analysis don&apos;t contain source URLs. 
                  This is common for OpenAI and Gemini. Perplexity typically includes citations 
                  when answering factual queries.
                </p>
              </div>
            )}
          </div>

          {/* Top Competitors */}
          {summary.top_competitors.length > 0 && (
            <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Top Competitors Mentioned</h3>
              </div>
              <div className="space-y-4">
                {summary.top_competitors.slice(0, 5).map((comp, index) => (
                  <div key={comp.competitor} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                      index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{comp.competitor}</span>
                        <span className="text-sm font-semibold text-gray-700">{comp.mention_count} ({comp.percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500" style={{ width: `${comp.percentage}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
