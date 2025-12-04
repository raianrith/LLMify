'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Users,
  Target,
  MessageSquare,
  DollarSign,
  Clock,
  Mail,
  User,
  Shield,
  Globe,
} from 'lucide-react';
import { getAdminClientDetails } from '@/lib/api';

interface ClientDetails {
  client: {
    id: number;
    name: string;
    brand_name: string;
    slug: string;
    industry: string | null;
    description: string | null;
    primary_color: string;
    is_active: boolean;
    created_at: string | null;
    default_openai_model: string;
    default_gemini_model: string;
    default_perplexity_model: string;
  };
  users: {
    id: number;
    username: string;
    email: string;
    full_name: string | null;
    is_admin: boolean;
    is_active: boolean;
    last_login: string | null;
    created_at: string | null;
  }[];
  competitors: {
    id: number;
    name: string;
    website: string | null;
  }[];
  predefined_queries: {
    id: number;
    query_text: string;
    category: string | null;
  }[];
  usage_by_provider: {
    provider: string;
    calls: number;
    tokens: number;
    cost: number;
  }[];
}

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<ClientDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadClientDetails(Number(params.id));
    }
  }, [params.id]);

  const loadClientDetails = async (clientId: number) => {
    try {
      const details = await getAdminClientDetails(clientId);
      setData(details);
    } catch (error) {
      console.error('Failed to load client details:', error);
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
        <p className="text-gray-500">Client not found</p>
        <Link href="/admin/clients" className="text-amber-600 hover:underline mt-2 inline-block">
          Back to clients
        </Link>
      </div>
    );
  }

  const { client, users, competitors, predefined_queries, usage_by_provider } = data;
  const totalCost = usage_by_provider.reduce((sum, p) => sum + p.cost, 0);
  const totalCalls = usage_by_provider.reduce((sum, p) => sum + p.calls, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button */}
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </Link>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: client.primary_color }}
            >
              <Building2 className="w-8 h-8 text-gray-900" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-font-bold text-gray-900">{client.name}</h1>
                {!client.is_active && (
                  <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-gray-500 mt-1">
                Brand: <span className="text-gray-900">{client.brand_name}</span> · 
                Industry: <span className="text-gray-900">{client.industry || 'Not set'}</span>
              </p>
              {client.description && (
                <p className="text-sm text-gray-400 mt-2">{client.description}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="text-center px-4 py-2 rounded-xl bg-gray-100">
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              <p className="text-xs text-gray-500">Users</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-gray-100">
              <p className="text-2xl font-bold text-gray-900">{totalCalls}</p>
              <p className="text-xs text-gray-500">API Calls</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-gray-100">
              <p className="text-2xl font-bold text-gray-900">${totalCost.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Total Cost</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Users */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-font-semibold text-gray-900">Users ({users.length})</h2>
          </div>
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="p-3 rounded-xl bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{user.username}</p>
                        {user.is_admin && (
                          <Shield className="w-3.5 h-3.5 text-amber-600" title="Admin" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    {user.last_login ? (
                      <span>Last login: {new Date(user.last_login).toLocaleDateString()}</span>
                    ) : (
                      <span>Never logged in</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-gray-400 text-center py-4">No users</p>
            )}
          </div>
        </div>

        {/* Competitors */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-font-semibold text-gray-900">Competitors ({competitors.length})</h2>
          </div>
          <div className="space-y-3">
            {competitors.map((competitor) => (
              <div key={competitor.id} className="p-3 rounded-xl bg-gray-50 flex items-center justify-between">
                <p className="font-medium text-gray-900">{competitor.name}</p>
                {competitor.website && (
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    {competitor.website}
                  </span>
                )}
              </div>
            ))}
            {competitors.length === 0 && (
              <p className="text-gray-400 text-center py-4">No competitors configured</p>
            )}
          </div>
        </div>

        {/* Predefined Queries */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-font-semibold text-gray-900">Predefined Queries ({predefined_queries.length})</h2>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {predefined_queries.map((query) => (
              <div key={query.id} className="p-3 rounded-xl bg-gray-50">
                <p className="text-sm text-gray-900">{query.query_text}</p>
                {query.category && (
                  <span className="text-xs text-gray-400">{query.category}</span>
                )}
              </div>
            ))}
            {predefined_queries.length === 0 && (
              <p className="text-gray-400 text-center py-4">No predefined queries</p>
            )}
          </div>
        </div>

        {/* API Usage by Provider */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-font-semibold text-gray-900">API Usage by Provider</h2>
          </div>
          <div className="space-y-3">
            {usage_by_provider.map((provider) => (
              <div key={provider.provider} className="p-4 rounded-xl bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900 capitalize">{provider.provider}</p>
                  <p className="text-amber-600 font-semibold">${provider.cost.toFixed(4)}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{provider.calls.toLocaleString()} calls</span>
                  <span>{provider.tokens.toLocaleString()} tokens</span>
                </div>
              </div>
            ))}
            {usage_by_provider.length === 0 && (
              <p className="text-gray-400 text-center py-4">No API usage recorded</p>
            )}
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-font-semibold text-gray-900 mb-4">Configuration</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gray-50">
            <p className="text-sm text-gray-500">OpenAI Model</p>
            <p className="text-gray-900 font-medium">{client.default_openai_model}</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50">
            <p className="text-sm text-gray-500">Gemini Model</p>
            <p className="text-gray-900 font-medium">{client.default_gemini_model}</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50">
            <p className="text-sm text-gray-500">Perplexity Model</p>
            <p className="text-gray-900 font-medium">{client.default_perplexity_model}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

