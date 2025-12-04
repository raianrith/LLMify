'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  User,
  Building2,
  LogIn,
  LogOut,
  UserPlus,
  Trash2,
  Play,
  Clock,
  Filter,
} from 'lucide-react';
import { getAdminActivity } from '@/lib/api';

interface ActivityLog {
  id: number;
  action: string;
  resource_type: string | null;
  resource_id: number | null;
  details: any;
  user_id: number | null;
  username: string | null;
  client_id: number | null;
  client_name: string | null;
  ip_address: string | null;
  created_at: string | null;
}

const actionIcons: Record<string, any> = {
  login: LogIn,
  logout: LogOut,
  signup: UserPlus,
  query_run: Play,
  delete_account: Trash2,
};

const actionColors: Record<string, string> = {
  login: 'text-emerald-600 bg-emerald-100',
  logout: 'text-gray-500 bg-slate-500/20',
  signup: 'text-blue-400 bg-blue-500/20',
  query_run: 'text-amber-600 bg-amber-100',
  delete_account: 'text-red-400 bg-red-500/20',
};

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('');

  useEffect(() => {
    loadActivity();
  }, [actionFilter]);

  const loadActivity = async () => {
    try {
      const data = await getAdminActivity(0, 100, actionFilter || undefined);
      setLogs(data.logs);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load activity:', error);
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-500">{total} total events</p>
        </div>
        
        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-900 focus:border-amber-500 transition-colors"
          >
            <option value="">All Actions</option>
            <option value="login">Logins</option>
            <option value="logout">Logouts</option>
            <option value="signup">Signups</option>
            <option value="query_run">Query Runs</option>
            <option value="delete_account">Account Deletions</option>
          </select>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="divide-y divide-slate-800/50">
          {logs.length > 0 ? (
            logs.map((log) => {
              const Icon = actionIcons[log.action] || Activity;
              const colorClass = actionColors[log.action] || 'text-gray-500 bg-slate-500/20';
              
              return (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {log.action.replace(/_/g, ' ')}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                            {log.username && (
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                {log.username}
                              </span>
                            )}
                            {log.client_name && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" />
                                {log.client_name}
                              </span>
                            )}
                            {log.ip_address && (
                              <span className="text-gray-400">{log.ip_address}</span>
                            )}
                          </div>
                          {log.details && (
                            <p className="text-xs text-gray-400 mt-1">
                              {typeof log.details === 'object' 
                                ? JSON.stringify(log.details) 
                                : log.details}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5" />
                          {log.created_at 
                            ? new Date(log.created_at).toLocaleString()
                            : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center">
              <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-gray-500">No activity logs found</p>
              <p className="text-sm text-gray-400 mt-1">
                Activity will appear here as users interact with the platform
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-sm text-gray-500">
          <strong className="text-gray-700">Tip:</strong> Activity logs help you monitor user behavior 
          and track important events across your platform. Use filters to focus on specific actions.
        </p>
      </div>
    </div>
  );
}

