'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Users,
  Activity,
  DollarSign,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Clock,
} from 'lucide-react';
import { getAdminClients, toggleClientActive } from '@/lib/api';

interface Client {
  id: number;
  name: string;
  brand_name: string;
  slug: string;
  industry: string | null;
  is_active: boolean;
  created_at: string | null;
  user_count: number;
  query_runs: number;
  total_cost: number;
  last_activity: string | null;
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClients();
  }, [searchTerm]);

  const loadClients = async () => {
    try {
      const data = await getAdminClients(0, 50, searchTerm || undefined);
      setClients(data.clients);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (clientId: number) => {
    try {
      const result = await toggleClientActive(clientId);
      setClients(clients.map(c => 
        c.id === clientId ? { ...c, is_active: result.is_active } : c
      ));
    } catch (error) {
      console.error('Failed to toggle client:', error);
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
          <h1 className="text-2xl font-font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500">{total} total clients</p>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full sm:w-64 rounded-xl bg-gray-100 border border-gray-200 text-gray-900 placeholder-slate-500 focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Clients List */}
      <div className="space-y-4">
        {clients.map((client) => (
          <div
            key={client.id}
            className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-amber-500/30 transition-all"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Client Info */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-gray-900" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                    {!client.is_active && (
                      <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Brand: {client.brand_name} · {client.industry || 'No industry'}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {client.created_at ? new Date(client.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                    {client.last_activity && (
                      <span>Last active: {new Date(client.last_activity).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Users className="w-4 h-4" />
                    <span className="text-lg font-semibold text-gray-900">{client.user_count}</span>
                  </div>
                  <p className="text-xs text-gray-400">Users</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Activity className="w-4 h-4" />
                    <span className="text-lg font-semibold text-gray-900">{client.query_runs}</span>
                  </div>
                  <p className="text-xs text-gray-400">Runs</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-gray-500">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-lg font-semibold text-gray-900">${client.total_cost.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-400">Cost</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => handleToggleActive(client.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      client.is_active 
                        ? 'text-emerald-600 hover:bg-emerald-500/10' 
                        : 'text-gray-500 hover:bg-gray-200/50'
                    }`}
                    title={client.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {client.is_active ? (
                      <ToggleRight className="w-6 h-6" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-100 text-amber-600 hover:bg-amber-500/30 transition-colors"
                  >
                    Details
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {clients.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-gray-500">No clients found</p>
        </div>
      )}
    </div>
  );
}

