'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  getCurrentClient,
  getPredefinedQueries,
  createQueryRun,
  runPredefinedQueries,
  getQueryRuns,
  getQueryRunStatus,
} from '@/lib/api';

interface PredefinedQuery {
  id: number;
  query_text: string;
  category: string | null;
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
  id: number;
  brand_name: string;
  default_openai_model: string;
  default_gemini_model: string;
  default_perplexity_model: string;
}

export default function GeneratorPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [predefinedQueries, setPredefinedQueries] = useState<PredefinedQuery[]>([]);
  const [customQueries, setCustomQueries] = useState<string>('');
  const [queryRuns, setQueryRuns] = useState<QueryRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeRunId) {
      const interval = setInterval(async () => {
        try {
          const status = await getQueryRunStatus(activeRunId);
          setProgress((status.completed_queries / status.total_queries) * 100);
          
          if (status.status === 'completed' || status.status === 'failed') {
            setActiveRunId(null);
            setRunning(false);
            loadQueryRuns();
          }
        } catch (error) {
          console.error('Failed to get status:', error);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [activeRunId]);

  const loadData = async () => {
    try {
      const [clientData, runsData] = await Promise.all([
        getCurrentClient(),
        getQueryRuns(10),
      ]);
      setClient(clientData);
      setQueryRuns(runsData);

      const queries = await getPredefinedQueries(clientData.id);
      setPredefinedQueries(queries);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQueryRuns = async () => {
    try {
      const runsData = await getQueryRuns(10);
      setQueryRuns(runsData);
    } catch (error) {
      console.error('Failed to load query runs:', error);
    }
  };

  const handleRunPredefined = async () => {
    if (!client) return;
    setRunning(true);
    setProgress(0);

    try {
      const run = await runPredefinedQueries();
      setActiveRunId(run.id);
    } catch (error) {
      console.error('Failed to run predefined queries:', error);
      setRunning(false);
    }
  };

  const handleRunCustom = async () => {
    if (!client || !customQueries.trim()) return;

    const queries = customQueries
      .split('\n')
      .map((q) => q.trim())
      .filter((q) => q.length > 0);

    if (queries.length === 0) return;

    setRunning(true);
    setProgress(0);

    try {
      const run = await createQueryRun({
        name: `Custom Run - ${new Date().toLocaleString()}`,
        queries,
        run_type: 'custom',
        openai_model: client.default_openai_model,
        gemini_model: client.default_gemini_model,
        perplexity_model: client.default_perplexity_model,
      });
      setActiveRunId(run.id);
      setCustomQueries('');
    } catch (error) {
      console.error('Failed to run custom queries:', error);
      setRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'running':
        return (
          <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        );
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
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Multi-LLM Query Generator
            </h1>
            <p className="text-gray-600">
              Run queries across OpenAI, Gemini, and Perplexity to analyze{' '}
              <span className="text-brand-500 font-semibold">{client?.brand_name}</span>&apos;s visibility
            </p>
          </div>
          {running && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-brand-50 border border-brand-200">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-brand-600 font-medium">{Math.round(progress)}% Complete</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar when running */}
      {running && (
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Running Queries...</h3>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-4">
            This may take a few minutes. The page will update automatically when complete.
          </p>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Predefined Queries */}
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Predefined Queries</h2>
                <p className="text-sm text-gray-500">{predefinedQueries.length} queries configured</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto mb-6">
            {predefinedQueries.map((query, index) => (
              <div
                key={query.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm"
              >
                <span className="text-gray-400 font-mono w-6">{index + 1}.</span>
                <span className="text-gray-700 flex-1">{query.query_text.substring(0, 80)}...</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleRunPredefined}
            disabled={running || predefinedQueries.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5" />
            Run All {predefinedQueries.length} Predefined Queries
          </button>
        </div>

        {/* Custom Queries */}
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Custom Queries</h2>
              <p className="text-sm text-gray-500">Enter one query per line</p>
            </div>
          </div>

          <textarea
            value={customQueries}
            onChange={(e) => setCustomQueries(e.target.value)}
            placeholder="Enter your custom queries here...&#10;One query per line&#10;&#10;Example:&#10;Best injection molding companies in Wisconsin&#10;How does Kaysun compare to PTI Plastics?"
            className="w-full h-48 px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-wrike-500 transition-colors resize-none text-sm"
            disabled={running}
          />

          <button
            onClick={handleRunCustom}
            disabled={running || !customQueries.trim()}
            className="w-full flex items-center justify-center gap-2 mt-4 py-3 px-4 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5" />
            Run Custom Queries
          </button>
        </div>
      </div>

      {/* Recent Runs */}
      <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Query Runs</h2>
          <button
            onClick={loadQueryRuns}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {queryRuns.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No query runs yet. Start by running some queries above!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="rounded-tl-xl">Run</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Date</th>
                  <th className="rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queryRuns.map((run) => (
                  <tr key={run.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {getStatusIcon(run.status)}
                        <span className="font-medium text-gray-900">{run.name || `Run #${run.id}`}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          run.status === 'completed'
                            ? 'badge-success'
                            : run.status === 'running'
                            ? 'badge-info'
                            : run.status === 'failed'
                            ? 'badge-error'
                            : 'badge-warning'
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full"
                            style={{
                              width: `${(run.completed_queries / run.total_queries) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {run.completed_queries}/{run.total_queries}
                        </span>
                      </div>
                    </td>
                    <td className="text-gray-600">
                      {new Date(run.created_at).toLocaleDateString()}{' '}
                      {new Date(run.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      {run.status === 'completed' && (
                        <Link
                          href={`/dashboard/analysis?run=${run.id}`}
                          className="inline-flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors"
                        >
                          View Results <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
