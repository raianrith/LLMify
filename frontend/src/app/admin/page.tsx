'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  Search,
  TrendingUp,
  DollarSign,
  Clock,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import { getAdminDashboard } from '@/lib/api';

interface DashboardData {
  total_clients: number;
  total_users: number;
  total_query_runs: number;
  total_queries: number;
  active_clients: number;
  recent_signups: number;
  total_cost: number;
  monthly_cost: number;
  queries_today: number;
  recent_activity: {
    id: number;
    client_name: string;
    user: string;
    queries: number;
    created_at: string;
  }[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const dashboardData = await getAdminDashboard();
      setData(dashboardData);
    } catch (error) {
      console.error('Failed to load admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-wrike-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Clients',
      value: data.total_clients,
      icon: Building2,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      href: '/admin/clients',
    },
    {
      label: 'Total Users',
      value: data.total_users,
      icon: Users,
      bgColor: 'bg-violet-100',
      iconColor: 'text-violet-600',
      href: '/admin/users',
    },
    {
      label: 'Query Runs',
      value: data.total_query_runs,
      icon: Search,
      bgColor: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      href: '/admin/activity',
    },
    {
      label: 'Total Queries',
      value: data.total_queries.toLocaleString(),
      icon: TrendingUp,
      bgColor: 'bg-amber-100',
      iconColor: 'text-amber-600',
      href: '/admin/costs',
    },
  ];

  const metrics = [
    {
      label: 'Active Clients (30d)',
      value: data.active_clients,
      subtitle: `${Math.round((data.active_clients / data.total_clients) * 100) || 0}% of total`,
    },
    {
      label: 'New Signups (7d)',
      value: data.recent_signups,
      subtitle: 'Last week',
    },
    {
      label: 'Queries Today',
      value: data.queries_today,
      subtitle: 'Since midnight',
    },
    {
      label: 'Monthly API Cost',
      value: `$${data.monthly_cost.toFixed(2)}`,
      subtitle: 'Last 30 days',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-wrike-50 border border-wrike-200 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Monitor your platform&apos;s performance and usage</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group relative bg-white rounded-xl border border-gray-200 p-6 hover:border-wrike-300 hover:shadow-soft transition-all"
            >
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-wrike-500 transition-colors" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-4">{stat.value}</p>
              <p className="text-gray-500 mt-1">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-soft"
          >
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            <p className="text-sm text-gray-700 mt-1">{metric.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{metric.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity & Cost Summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <Link href="/admin/activity" className="text-sm text-wrike-600 hover:text-wrike-700 font-medium">
              View all
            </Link>
          </div>
          
          <div className="space-y-3">
            {data.recent_activity.length > 0 ? (
              data.recent_activity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <div>
                    <p className="font-medium text-gray-900">{activity.client_name}</p>
                    <p className="text-sm text-gray-500">
                      {activity.user} ran {activity.queries} queries
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {activity.created_at ? new Date(activity.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {activity.created_at ? new Date(activity.created_at).toLocaleTimeString() : ''}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* Cost Overview */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">API Costs</h2>
            </div>
            <Link href="/admin/costs" className="text-sm text-wrike-600 hover:text-wrike-700 font-medium">
              View details
            </Link>
          </div>

          <div className="space-y-4">
            <div className="text-center py-6 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-4xl font-bold text-gray-900">${data.total_cost.toFixed(2)}</p>
              <p className="text-gray-600 mt-1">Total API Spend</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-xl font-bold text-gray-900">${data.monthly_cost.toFixed(2)}</p>
                <p className="text-sm text-gray-500">This Month</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-xl font-bold text-gray-900">
                  ${(data.monthly_cost / (data.total_clients || 1)).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">Avg per Client</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/clients"
            className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors font-medium"
          >
            View All Clients
          </Link>
          <Link
            href="/admin/users"
            className="px-4 py-2 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors font-medium"
          >
            Manage Users
          </Link>
          <Link
            href="/admin/costs"
            className="px-4 py-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors font-medium"
          >
            API Usage Report
          </Link>
          <Link
            href="/admin/activity"
            className="px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors font-medium"
          >
            Activity Logs
          </Link>
        </div>
      </div>
    </div>
  );
}
