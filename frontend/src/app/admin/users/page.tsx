'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Mail,
  Building2,
  Shield,
  ShieldCheck,
  Clock,
  Activity,
} from 'lucide-react';
import { getAdminUsers } from '@/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  client_id: number;
  client_name: string;
  is_admin: boolean;
  is_superadmin: boolean;
  is_active: boolean;
  query_runs: number;
  last_login: string | null;
  created_at: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, [searchTerm]);

  const loadUsers = async () => {
    try {
      const data = await getAdminUsers(0, 50, undefined, searchTerm || undefined);
      setUsers(data.users);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load users:', error);
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
          <h1 className="text-2xl font-font-bold text-gray-900">Users</h1>
          <p className="text-gray-500">{total} total users across all clients</p>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full sm:w-64 rounded-xl bg-gray-100 border border-gray-200 text-gray-900 placeholder-slate-500 focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">User</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Client</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Role</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Activity</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Last Login</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-800/50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-gray-900 font-medium">
                        {user.full_name?.[0] || user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name || user.username}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      {user.client_name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {user.is_superadmin ? (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 text-amber-600 text-xs font-medium">
                          <ShieldCheck className="w-3 h-3" />
                          Superadmin
                        </span>
                      ) : user.is_admin ? (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/20 text-violet-400 text-xs font-medium">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-lg bg-gray-200/50 text-gray-500 text-xs font-medium">
                          User
                        </span>
                      )}
                      {!user.is_active && (
                        <span className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Activity className="w-4 h-4 text-gray-400" />
                      {user.query_runs} runs
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Clock className="w-3.5 h-3.5" />
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleDateString()
                        : 'Never'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {user.created_at 
                      ? new Date(user.created_at).toLocaleDateString()
                      : 'N/A'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-gray-500">No users found</p>
        </div>
      )}
    </div>
  );
}

