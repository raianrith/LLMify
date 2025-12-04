'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Target,
  CheckCircle2,
  XCircle,
  Users,
  Lightbulb,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Sparkles,
  Eye,
  EyeOff,
  Tag,
  Info,
} from 'lucide-react';
import { getQueryRuns, getGapAnalysis, getCurrentClient } from '@/lib/api';

interface QueryRun {
  id: number;
  name: string | null;
  status: string;
  created_at: string;
}

interface GapResponse {
  source: string;
  brand_mentioned: boolean;
  brand_position: string | null;
  context_type: string | null;
  competitors_found: string | null;
  response_preview: string | null;
  full_response: string | null;
}

interface Gap {
  query: string;
  category: string;
  brand_mentioned: boolean;
  has_competitors: boolean;
  competitors: string[];
  mentioned_sources: string[];
  missing_sources: string[];
  responses: GapResponse[];
}

interface GapAnalysis {
  query_run_id: number;
  total_queries: number;
  gaps: Gap[];
  branded_count: number;
  non_branded_count: number;
  filter_applied: string;
}

type BrandedFilter = 'all' | 'branded' | 'non_branded';

export default function GapsPage() {
  const searchParams = useSearchParams();
  const runId = searchParams.get('run');

  const [queryRuns, setQueryRuns] = useState<QueryRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(
    runId ? parseInt(runId) : null
  );
  const [analysis, setAnalysis] = useState<GapAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [brandName, setBrandName] = useState('');
  const [expandedGaps, setExpandedGaps] = useState<Set<number>>(new Set());
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'critical' | 'wins' | 'blue_ocean'>('all');
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
      const data = await getGapAnalysis(runId, branded);
      setAnalysis(data);
    } catch (error) {
      console.error('Failed to load analysis:', error);
    }
  };

  const toggleGap = (index: number) => {
    const newExpanded = new Set(expandedGaps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedGaps(newExpanded);
  };

  const toggleResponse = (gapIndex: number, responseIndex: number) => {
    const key = `${gapIndex}-${responseIndex}`;
    const newExpanded = new Set(expandedResponses);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedResponses(newExpanded);
  };

  const isResponseExpanded = (gapIndex: number, responseIndex: number) => {
    return expandedResponses.has(`${gapIndex}-${responseIndex}`);
  };

  const getCategoryType = (gap: Gap): 'win' | 'critical' | 'competitive' | 'blue_ocean' => {
    if (gap.brand_mentioned && !gap.has_competitors) return 'win';
    if (!gap.brand_mentioned && gap.has_competitors) return 'critical';
    if (gap.brand_mentioned && gap.has_competitors) return 'competitive';
    return 'blue_ocean';
  };

  const getCategoryConfig = (type: string) => {
    switch (type) {
      case 'win':
        return {
          icon: CheckCircle2,
          label: 'Exclusive Win',
          bgColor: 'from-emerald-50 to-emerald-100',
          borderColor: 'border-emerald-200',
          textColor: 'text-emerald-700',
          iconBg: 'from-emerald-400 to-emerald-600',
          badgeBg: 'bg-emerald-100',
          badgeText: 'text-emerald-700',
        };
      case 'critical':
        return {
          icon: XCircle,
          label: 'Critical Gap',
          bgColor: 'from-red-50 to-red-100',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          iconBg: 'from-red-400 to-red-600',
          badgeBg: 'bg-red-100',
          badgeText: 'text-red-700',
        };
      case 'competitive':
        return {
          icon: Users,
          label: 'Competitive',
          bgColor: 'from-amber-50 to-amber-100',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-700',
          iconBg: 'from-amber-400 to-amber-600',
          badgeBg: 'bg-amber-100',
          badgeText: 'text-amber-700',
        };
      default:
        return {
          icon: Lightbulb,
          label: 'Blue Ocean',
          bgColor: 'from-gray-50 to-gray-100',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
          iconBg: 'from-gray-400 to-gray-600',
          badgeBg: 'bg-gray-100',
          badgeText: 'text-gray-700',
        };
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
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-red-100 flex items-center justify-center mx-auto mb-6">
          <Target className="w-10 h-10 text-brand-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h2>
        <p className="text-gray-500 mb-6">Run some queries first to see gap analysis.</p>
        <a
          href="/dashboard/generator"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
        >
          Run Queries <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    );
  }

  // Calculate stats
  const stats = {
    wins: analysis?.gaps.filter(g => getCategoryType(g) === 'win').length || 0,
    critical: analysis?.gaps.filter(g => getCategoryType(g) === 'critical').length || 0,
    competitive: analysis?.gaps.filter(g => getCategoryType(g) === 'competitive').length || 0,
    blue_ocean: analysis?.gaps.filter(g => getCategoryType(g) === 'blue_ocean').length || 0,
  };

  // Filter gaps
  const filteredGaps = analysis?.gaps.filter(gap => {
    if (filter === 'all') return true;
    if (filter === 'critical') return getCategoryType(gap) === 'critical';
    if (filter === 'wins') return getCategoryType(gap) === 'win';
    if (filter === 'blue_ocean') return getCategoryType(gap) === 'blue_ocean';
    return true;
  }) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-white/80" />
              <span className="text-white/80 text-sm font-medium">Gap Analysis</span>
            </div>
            <h1 className="text-2xl font-bold mb-1">
              Opportunity Finder
            </h1>
            <p className="text-white/80">
              Discover where <span className="font-semibold text-white">{brandName}</span> is missing or winning
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
                <p><strong>Non-Branded:</strong> Shows real gaps and opportunities</p>
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
            <span>Showing: {analysis.total_queries} queries</span>
            <span>•</span>
            <span className="text-emerald-600">{analysis.non_branded_count} non-branded</span>
            <span>•</span>
            <span className="text-blue-600">{analysis.branded_count} branded</span>
          </div>
        )}
      </div>

      {analysis && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setFilter(filter === 'wins' ? 'all' : 'wins')}
              className={`bg-white rounded-xl shadow-soft border p-5 card-hover text-left transition-all ${
                filter === 'wins' ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-gray-500">Exclusive Wins</span>
              </div>
              <p className="text-3xl font-bold text-emerald-600">{stats.wins}</p>
              <p className="text-xs text-gray-500 mt-1">Brand only mentioned</p>
            </button>

            <button
              onClick={() => setFilter(filter === 'critical' ? 'all' : 'critical')}
              className={`bg-white rounded-xl shadow-soft border p-5 card-hover text-left transition-all ${
                filter === 'critical' ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-gray-500">Critical Gaps</span>
              </div>
              <p className="text-3xl font-bold text-red-600">{stats.critical}</p>
              <p className="text-xs text-gray-500 mt-1">Missing opportunities</p>
            </button>

            <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-gray-500">Competitive</span>
              </div>
              <p className="text-3xl font-bold text-amber-600">{stats.competitive}</p>
              <p className="text-xs text-gray-500 mt-1">Head-to-head battles</p>
            </div>

            <button
              onClick={() => setFilter(filter === 'blue_ocean' ? 'all' : 'blue_ocean')}
              className={`bg-white rounded-xl shadow-soft border p-5 card-hover text-left transition-all ${
                filter === 'blue_ocean' ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-gray-500">Blue Ocean</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">{stats.blue_ocean}</p>
              <p className="text-xs text-gray-500 mt-1">Untapped opportunities</p>
            </button>
          </div>

          {/* Filter indicator */}
          {filter !== 'all' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Showing:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                filter === 'wins' ? 'bg-emerald-100 text-emerald-700' :
                filter === 'critical' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {filter === 'wins' ? 'Exclusive Wins' : filter === 'critical' ? 'Critical Gaps' : 'Blue Ocean'}
              </span>
              <button
                onClick={() => setFilter('all')}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Show all
              </button>
            </div>
          )}

          {/* Gap List */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Query Analysis</h3>
                  <p className="text-sm text-gray-500">{filteredGaps.length} queries ({analysis.total_queries} total)</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {filteredGaps.map((gap, index) => {
                const categoryType = getCategoryType(gap);
                const config = getCategoryConfig(categoryType);
                const Icon = config.icon;
                const isExpanded = expandedGaps.has(index);

                return (
                  <div
                    key={index}
                    className={`rounded-xl border overflow-hidden transition-all ${config.borderColor} bg-gradient-to-r ${config.bgColor}`}
                  >
                    <button
                      onClick={() => toggleGap(index)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{gap.query}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.badgeBg} ${config.badgeText}`}>
                              {config.label}
                            </span>
                            {gap.competitors.length > 0 && (
                              <span className="text-xs text-gray-500">
                                • {gap.competitors.length} competitor{gap.competitors.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {gap.missing_sources.map((source) => (
                            <span key={source} className="px-2 py-1 rounded bg-red-100 text-red-600 text-xs font-medium">
                              {source}
                            </span>
                          ))}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3">
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-xs font-medium text-gray-500">Missing from:</span>
                          {gap.missing_sources.map((source) => (
                            <span key={source} className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium flex items-center gap-1">
                              <EyeOff className="w-3 h-3" />
                              {source}
                            </span>
                          ))}
                        </div>
                        {gap.competitors.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            <span className="text-xs font-medium text-gray-500">Competitors mentioned:</span>
                            {gap.competitors.map((comp) => (
                              <span key={comp} className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                                {comp}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Response previews */}
                        <div className="grid gap-3 mt-4">
                          {gap.responses.map((response, rIndex) => {
                            const isExpanded = isResponseExpanded(index, rIndex);
                            const hasLongResponse = response.full_response && response.full_response.length > 300;
                            
                            return (
                              <div key={rIndex} className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-900">{response.source}</span>
                                  <div className="flex items-center gap-2">
                                    {response.brand_mentioned ? (
                                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                                        <Eye className="w-3 h-3" /> Mentioned
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 text-xs text-red-600">
                                        <EyeOff className="w-3 h-3" /> Not mentioned
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {response.full_response && (
                                  <div>
                                    <p className={`text-sm text-gray-600 whitespace-pre-wrap ${!isExpanded && hasLongResponse ? 'line-clamp-3' : ''}`}>
                                      {isExpanded ? response.full_response : response.response_preview}
                                    </p>
                                    {hasLongResponse && (
                                      <button
                                        onClick={() => toggleResponse(index, rIndex)}
                                        className="mt-2 text-sm text-wrike-600 hover:text-wrike-700 font-medium flex items-center gap-1"
                                      >
                                        {isExpanded ? (
                                          <>
                                            <ChevronUp className="w-4 h-4" /> Show less
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="w-4 h-4" /> Show full response
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
