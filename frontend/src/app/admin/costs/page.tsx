'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Zap,
  Database,
  Building2,
  Calendar,
} from 'lucide-react';
import { getAdminAPIUsage } from '@/lib/api';

interface APIUsageData {
  period_days: number;
  by_provider: {
    provider: string;
    calls: number;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    total_cost: number;
  }[];
  daily_usage: {
    date: string;
    calls: number;
    cost: number;
  }[];
  top_clients: {
    client_id: number;
    client_name: string;
    calls: number;
    cost: number;
  }[];
}

export default function AdminCostsPage() {
  const [data, setData] = useState<APIUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadUsage();
  }, [days]);

  const loadUsage = async () => {
    try {
      setLoading(true);
      const usage = await getAdminAPIUsage(days);
      setData(usage);
    } catch (error) {
      console.error('Failed to load API usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load API usage data</p>
      </div>
    );
  }

  const totalCost = data.by_provider.reduce((sum, p) => sum + p.total_cost, 0);
  const totalCalls = data.by_provider.reduce((sum, p) => sum + p.calls, 0);
  const totalTokens = data.by_provider.reduce((sum, p) => sum + p.total_tokens, 0);

  const providerColors: Record<string, string> = {
    openai: 'from-emerald-500 to-teal-500',
    gemini: 'from-blue-500 to-cyan-500',
    perplexity: 'from-violet-500 to-purple-500',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-font-bold text-gray-900">API Usage & Costs</h1>
          <p className="text-gray-500">Monitor API spending and usage across all clients</p>
        </div>
        
        {/* Time Range */}
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-900 focus:border-amber-500 transition-colors"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-amber-600" />
            <span className="text-sm text-amber-600">Total Cost</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">${totalCost.toFixed(4)}</p>
          <p className="text-sm text-gray-500 mt-1">Last {days} days</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-6 h-6 text-emerald-600" />
            <span className="text-sm text-gray-500">API Calls</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalCalls.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Total requests</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-6 h-6 text-blue-400" />
            <span className="text-sm text-gray-500">Tokens Used</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalTokens.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Input + Output</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Usage by Provider */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-font-semibold text-gray-900 mb-4">Usage by Provider</h2>
          <div className="space-y-4">
            {data.by_provider.length > 0 ? (
              data.by_provider.map((provider) => {
                const percentage = totalCost > 0 ? (provider.total_cost / totalCost) * 100 : 0;
                return (
                  <div key={provider.provider} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 capitalize">{provider.provider}</span>
                      <span className="text-amber-600 font-semibold">${provider.total_cost.toFixed(4)}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${providerColors[provider.provider] || 'from-gray-500 to-gray-600'}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{provider.calls.toLocaleString()} calls</span>
                      <span>{provider.total_tokens.toLocaleString()} tokens</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-400 text-center py-8">No usage data available</p>
            )}
          </div>
        </div>

        {/* Top Clients by Cost */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-font-semibold text-gray-900 mb-4">Top Clients by Cost</h2>
          <div className="space-y-3">
            {data.top_clients.length > 0 ? (
              data.top_clients.map((client, index) => (
                <div
                  key={client.client_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{client.client_name}</p>
                      <p className="text-xs text-gray-400">{client.calls.toLocaleString()} calls</p>
                    </div>
                  </div>
                  <p className="text-amber-600 font-semibold">${client.cost.toFixed(4)}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">No client data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Daily Usage */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-font-semibold text-gray-900 mb-4">Daily Usage</h2>
        {data.daily_usage.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-end gap-1 h-48">
              {data.daily_usage.map((day, index) => {
                const maxCost = Math.max(...data.daily_usage.map(d => d.cost));
                const height = maxCost > 0 ? (day.cost / maxCost) * 100 : 0;
                return (
                  <div
                    key={day.date}
                    className="flex-1 bg-amber-100 hover:bg-amber-500/40 transition-colors rounded-t cursor-pointer group relative"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${day.date}: $${day.cost.toFixed(4)} (${day.calls} calls)`}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 px-2 py-1 rounded text-xs text-gray-900 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {day.date}<br />${day.cost.toFixed(4)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-400 pt-2 border-t border-slate-800">
              <span>{data.daily_usage[0]?.date}</span>
              <span>{data.daily_usage[data.daily_usage.length - 1]?.date}</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No daily usage data available</p>
        )}
      </div>

      {/* Cost Estimation Note */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-sm text-gray-500">
          <strong className="text-gray-700">Note:</strong> Costs are estimated based on current API pricing. 
          Actual costs may vary based on your agreements with API providers.
        </p>
      </div>
    </div>
  );
}

