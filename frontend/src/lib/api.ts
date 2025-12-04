/**
 * API client for the LLM Search Visibility backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

// Get token from localStorage
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

// Generic fetch wrapper with auth
async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  // Handle 401 - redirect to login
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  
  return response;
}

// ─── AUTH API ────────────────────────────────────────────────────────────────

export async function login(username: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/login/json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }
  
  return response.json();
}

export async function getCurrentUser() {
  const response = await fetchWithAuth('/auth/me');
  
  if (!response.ok) {
    throw new Error('Failed to get user');
  }
  
  return response.json();
}

// ─── OAUTH API ────────────────────────────────────────────────────────────────

export async function getOAuthConfig() {
  const response = await fetch(`${API_BASE}/oauth/config`);
  
  if (!response.ok) {
    throw new Error('Failed to get OAuth config');
  }
  
  return response.json();
}

export async function initiateGoogleLogin() {
  const response = await fetch(`${API_BASE}/oauth/google/login`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to initiate Google login');
  }
  
  const data = await response.json();
  window.location.href = data.auth_url;
}

// ─── CLIENT API ──────────────────────────────────────────────────────────────

export async function getCurrentClient() {
  const response = await fetchWithAuth('/clients/current');
  
  if (!response.ok) {
    throw new Error('Failed to get client');
  }
  
  return response.json();
}

export async function updateBrandAliases(brandAliases: string) {
  const response = await fetchWithAuth('/clients/current/brand-aliases', {
    method: 'PUT',
    body: JSON.stringify({ brand_aliases: brandAliases }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update brand aliases');
  }
  
  return response.json();
}

export async function updateClient(clientId: number, data: {
  name?: string;
  brand_name?: string;
  brand_aliases?: string;
  industry?: string;
  primary_color?: string;
  default_openai_model?: string;
  default_gemini_model?: string;
  default_perplexity_model?: string;
}) {
  const response = await fetchWithAuth(`/clients/${clientId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update client');
  }
  
  return response.json();
}

export async function getCompetitors(clientId: number) {
  const response = await fetchWithAuth(`/clients/${clientId}/competitors`);
  
  if (!response.ok) {
    throw new Error('Failed to get competitors');
  }
  
  return response.json();
}

export async function addCompetitor(clientId: number, data: { name: string; aliases?: string; website?: string }) {
  const response = await fetchWithAuth(`/clients/${clientId}/competitors`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add competitor');
  }
  
  return response.json();
}

export async function updateCompetitor(clientId: number, competitorId: number, data: { name: string; aliases?: string; website?: string }) {
  const response = await fetchWithAuth(`/clients/${clientId}/competitors/${competitorId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update competitor');
  }
  
  return response.json();
}

export async function deleteCompetitor(clientId: number, competitorId: number) {
  const response = await fetchWithAuth(`/clients/${clientId}/competitors/${competitorId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete competitor');
  }
  
  return response.json();
}

export async function getPredefinedQueries(clientId: number) {
  const response = await fetchWithAuth(`/clients/${clientId}/queries`);
  
  if (!response.ok) {
    throw new Error('Failed to get predefined queries');
  }
  
  return response.json();
}

// ─── QUERIES API ─────────────────────────────────────────────────────────────

export interface QueryRunCreate {
  name?: string;
  description?: string;
  queries: string[];
  run_type?: string;
  openai_model?: string;
  gemini_model?: string;
  perplexity_model?: string;
}

export async function createQueryRun(data: QueryRunCreate) {
  const response = await fetchWithAuth('/queries/run', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create query run');
  }
  
  return response.json();
}

export async function runPredefinedQueries(name?: string) {
  const url = name ? `/queries/run-predefined?name=${encodeURIComponent(name)}` : '/queries/run-predefined';
  const response = await fetchWithAuth(url, { method: 'POST' });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to run predefined queries');
  }
  
  return response.json();
}

export async function getQueryRuns(limit = 50, offset = 0) {
  const response = await fetchWithAuth(`/queries/runs?limit=${limit}&offset=${offset}`);
  
  if (!response.ok) {
    throw new Error('Failed to get query runs');
  }
  
  return response.json();
}

export async function getQueryRun(runId: number) {
  const response = await fetchWithAuth(`/queries/runs/${runId}`);
  
  if (!response.ok) {
    throw new Error('Failed to get query run');
  }
  
  return response.json();
}

export async function getQueryRunStatus(runId: number) {
  const response = await fetchWithAuth(`/queries/runs/${runId}/status`);
  
  if (!response.ok) {
    throw new Error('Failed to get query run status');
  }
  
  return response.json();
}

export async function deleteQueryRun(runId: number) {
  const response = await fetchWithAuth(`/queries/runs/${runId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete query run');
  }
  
  return response.json();
}

// ─── ANALYSIS API ────────────────────────────────────────────────────────────

export async function getRunAnalysisSummary(runId: number, branded?: boolean | null) {
  let url = `/analysis/runs/${runId}/summary`;
  if (branded !== undefined && branded !== null) {
    url += `?branded=${branded}`;
  }
  const response = await fetchWithAuth(url);
  
  if (!response.ok) {
    throw new Error('Failed to get analysis summary');
  }
  
  return response.json();
}

export async function getGapAnalysis(runId: number, branded?: boolean | null) {
  let url = `/analysis/runs/${runId}/gaps`;
  if (branded !== undefined && branded !== null) {
    url += `?branded=${branded}`;
  }
  const response = await fetchWithAuth(url);
  
  if (!response.ok) {
    throw new Error('Failed to get gap analysis');
  }
  
  return response.json();
}

export async function getCompetitorAnalysis(runId: number, branded?: boolean | null) {
  let url = `/analysis/runs/${runId}/competitors`;
  if (branded !== undefined && branded !== null) {
    url += `?branded=${branded}`;
  }
  const response = await fetchWithAuth(url);
  
  if (!response.ok) {
    throw new Error('Failed to get competitor analysis');
  }
  
  return response.json();
}

export async function getTimeSeriesData(days = 30, branded?: boolean | null) {
  let url = `/analysis/time-series?days=${days}`;
  if (branded !== undefined && branded !== null) {
    url += `&branded=${branded}`;
  }
  const response = await fetchWithAuth(url);
  
  if (!response.ok) {
    throw new Error('Failed to get time series data');
  }
  
  return response.json();
}

export async function getCitationAnalysis(runId: number) {
  const response = await fetchWithAuth(`/analysis/runs/${runId}/citations`);
  
  if (!response.ok) {
    throw new Error('Failed to get citation analysis');
  }
  
  return response.json();
}

export async function getDashboardStats() {
  const response = await fetchWithAuth('/analysis/dashboard-stats');
  
  if (!response.ok) {
    throw new Error('Failed to get dashboard stats');
  }
  
  return response.json();
}

export async function getMentionRatesBySource(branded?: boolean | null) {
  let url = '/analysis/mention-rates-by-source';
  if (branded !== undefined && branded !== null) {
    url += `?branded=${branded}`;
  }
  const response = await fetchWithAuth(url);
  
  if (!response.ok) {
    throw new Error('Failed to get mention rates by source');
  }
  
  return response.json();
}

export async function getDashboardStatsFiltered(branded?: boolean | null) {
  let url = '/analysis/dashboard-stats-filtered';
  if (branded !== undefined && branded !== null) {
    url += `?branded=${branded}`;
  }
  const response = await fetchWithAuth(url);
  
  if (!response.ok) {
    throw new Error('Failed to get dashboard stats');
  }
  
  return response.json();
}

// ─── ACCOUNT API ──────────────────────────────────────────────────────────────

export async function getAccountStats() {
  const response = await fetchWithAuth('/account/stats');
  
  if (!response.ok) {
    throw new Error('Failed to get account stats');
  }
  
  return response.json();
}

export async function deleteAccount(password: string, confirmText: string) {
  const response = await fetchWithAuth('/account/delete', {
    method: 'POST',
    body: JSON.stringify({
      password,
      confirm_text: confirmText,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete account');
  }
  
  return response.json();
}

// ─── ADMIN API ────────────────────────────────────────────────────────────────

export async function getAdminDashboard() {
  const response = await fetchWithAuth('/admin/dashboard');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get admin dashboard');
  }
  
  return response.json();
}

export async function getAdminClients(skip = 0, limit = 50, search?: string) {
  let url = `/admin/clients?skip=${skip}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  
  const response = await fetchWithAuth(url);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get clients');
  }
  
  return response.json();
}

export async function getAdminClientDetails(clientId: number) {
  const response = await fetchWithAuth(`/admin/clients/${clientId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get client details');
  }
  
  return response.json();
}

export async function toggleClientActive(clientId: number) {
  const response = await fetchWithAuth(`/admin/clients/${clientId}/toggle-active`, {
    method: 'PATCH',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to toggle client');
  }
  
  return response.json();
}

export async function getAdminUsers(skip = 0, limit = 50, clientId?: number, search?: string) {
  let url = `/admin/users?skip=${skip}&limit=${limit}`;
  if (clientId) {
    url += `&client_id=${clientId}`;
  }
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  
  const response = await fetchWithAuth(url);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get users');
  }
  
  return response.json();
}

export async function getAdminAPIUsage(days = 30, clientId?: number, provider?: string) {
  let url = `/admin/api-usage?days=${days}`;
  if (clientId) {
    url += `&client_id=${clientId}`;
  }
  if (provider) {
    url += `&provider=${provider}`;
  }
  
  const response = await fetchWithAuth(url);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get API usage');
  }
  
  return response.json();
}

export async function getAdminActivity(skip = 0, limit = 100, action?: string, clientId?: number, userId?: number) {
  let url = `/admin/activity?skip=${skip}&limit=${limit}`;
  if (action) {
    url += `&action=${action}`;
  }
  if (clientId) {
    url += `&client_id=${clientId}`;
  }
  if (userId) {
    url += `&user_id=${userId}`;
  }
  
  const response = await fetchWithAuth(url);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get activity logs');
  }
  
  return response.json();
}

export async function getAdminSystemStats() {
  const response = await fetchWithAuth('/admin/system-stats');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get system stats');
  }
  
  return response.json();
}

