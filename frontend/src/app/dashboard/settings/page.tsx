'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  User,
  Building2,
  Users,
  Key,
  Save,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { 
  getCurrentClient, 
  getCompetitors, 
  getCurrentUser, 
  deleteAccount, 
  getAccountStats, 
  updateBrandAliases,
  updateClient,
  addCompetitor,
  updateCompetitor,
  deleteCompetitor
} from '@/lib/api';

interface Client {
  id: number;
  name: string;
  slug: string;
  brand_name: string;
  brand_aliases: string | null;
  industry: string | null;
  description: string | null;
  primary_color: string;
  default_openai_model: string;
  default_gemini_model: string;
  default_perplexity_model: string;
}

interface Competitor {
  id: number;
  name: string;
  aliases: string | null;
  website: string | null;
}

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
}

interface AccountStats {
  users: number;
  competitors: number;
  predefined_queries: number;
  query_runs: number;
  query_results: number;
  total_records: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  
  // Delete account state
  const [accountStats, setAccountStats] = useState<AccountStats | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  // Brand aliases state
  const [brandAliases, setBrandAliases] = useState('');
  const [aliasesSaving, setAliasesSaving] = useState(false);
  const [aliasesSaved, setAliasesSaved] = useState(false);
  
  // Client settings form state
  const [clientForm, setClientForm] = useState({
    name: '',
    brand_name: '',
    industry: '',
    primary_color: '#e64626',
    default_openai_model: 'gpt-4o',
    default_gemini_model: 'gemini-2.0-flash-exp',
    default_perplexity_model: 'sonar',
  });
  const [clientSaving, setClientSaving] = useState(false);
  const [clientSaved, setClientSaved] = useState(false);
  
  // Competitor form state
  const [newCompetitor, setNewCompetitor] = useState({ name: '', aliases: '', website: '' });
  const [addingCompetitor, setAddingCompetitor] = useState(false);
  const [editingCompetitorId, setEditingCompetitorId] = useState<number | null>(null);
  const [editingCompetitor, setEditingCompetitor] = useState({ name: '', aliases: '', website: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientData, userData] = await Promise.all([
        getCurrentClient(),
        getCurrentUser(),
      ]);
      setClient(clientData);
      setUser(userData);
      setBrandAliases(clientData?.brand_aliases || '');
      
      // Initialize client form with current values
      if (clientData) {
        setClientForm({
          name: clientData.name || '',
          brand_name: clientData.brand_name || '',
          industry: clientData.industry || '',
          primary_color: clientData.primary_color || '#e64626',
          default_openai_model: clientData.default_openai_model || 'gpt-4o',
          default_gemini_model: clientData.default_gemini_model || 'gemini-2.0-flash-exp',
          default_perplexity_model: clientData.default_perplexity_model || 'sonar',
        });
        
        const competitorsData = await getCompetitors(clientData.id);
        setCompetitors(competitorsData);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBrandAliases = async () => {
    setAliasesSaving(true);
    try {
      await updateBrandAliases(brandAliases);
      setAliasesSaved(true);
      setTimeout(() => setAliasesSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save brand aliases:', error);
    } finally {
      setAliasesSaving(false);
    }
  };

  const handleSaveClientSettings = async () => {
    if (!client) return;
    setClientSaving(true);
    try {
      const updated = await updateClient(client.id, {
        name: clientForm.name,
        brand_name: clientForm.brand_name,
        brand_aliases: brandAliases,
        industry: clientForm.industry,
        primary_color: clientForm.primary_color,
      });
      setClient(updated);
      setClientSaved(true);
      setTimeout(() => setClientSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save client settings:', error);
    } finally {
      setClientSaving(false);
    }
  };

  const handleSaveApiSettings = async () => {
    if (!client) return;
    setClientSaving(true);
    try {
      const updated = await updateClient(client.id, {
        default_openai_model: clientForm.default_openai_model,
        default_gemini_model: clientForm.default_gemini_model,
        default_perplexity_model: clientForm.default_perplexity_model,
      });
      setClient(updated);
      setClientSaved(true);
      setTimeout(() => setClientSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save API settings:', error);
    } finally {
      setClientSaving(false);
    }
  };

  const handleAddCompetitor = async () => {
    if (!client || !newCompetitor.name.trim()) return;
    setAddingCompetitor(true);
    try {
      const added = await addCompetitor(client.id, {
        name: newCompetitor.name.trim(),
        aliases: newCompetitor.aliases.trim() || undefined,
        website: newCompetitor.website.trim() || undefined,
      });
      setCompetitors([...competitors, added]);
      setNewCompetitor({ name: '', aliases: '', website: '' });
    } catch (error) {
      console.error('Failed to add competitor:', error);
    } finally {
      setAddingCompetitor(false);
    }
  };

  const handleUpdateCompetitor = async (competitorId: number) => {
    if (!client || !editingCompetitor.name.trim()) return;
    try {
      const updated = await updateCompetitor(client.id, competitorId, {
        name: editingCompetitor.name.trim(),
        aliases: editingCompetitor.aliases.trim() || undefined,
        website: editingCompetitor.website.trim() || undefined,
      });
      setCompetitors(competitors.map(c => c.id === competitorId ? updated : c));
      setEditingCompetitorId(null);
      setEditingCompetitor({ name: '', aliases: '', website: '' });
    } catch (error) {
      console.error('Failed to update competitor:', error);
    }
  };

  const handleDeleteCompetitor = async (competitorId: number) => {
    if (!client) return;
    if (!confirm('Are you sure you want to remove this competitor?')) return;
    try {
      await deleteCompetitor(client.id, competitorId);
      setCompetitors(competitors.filter(c => c.id !== competitorId));
    } catch (error) {
      console.error('Failed to delete competitor:', error);
    }
  };

  const startEditingCompetitor = (competitor: Competitor) => {
    setEditingCompetitorId(competitor.id);
    setEditingCompetitor({ name: competitor.name, aliases: competitor.aliases || '', website: competitor.website || '' });
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'client', label: 'Client Settings', icon: Building2 },
    { id: 'competitors', label: 'Competitors', icon: Users },
    { id: 'api', label: 'API Configuration', icon: Key },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, danger: true },
  ];

  // Load account stats when danger tab is selected
  useEffect(() => {
    if (activeTab === 'danger' && !accountStats) {
      loadAccountStats();
    }
  }, [activeTab]);

  const loadAccountStats = async () => {
    try {
      const stats = await getAccountStats();
      setAccountStats(stats);
    } catch (error) {
      console.error('Failed to load account stats:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }
    if (!deletePassword) {
      setDeleteError('Please enter your password');
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');

    try {
      await deleteAccount(deletePassword, deleteConfirmText);
      // Clear auth and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login?deleted=true');
    } catch (error: any) {
      setDeleteError(error.message || 'Failed to delete account');
      setDeleteLoading(false);
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
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
            <Settings className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500">Manage your account and preferences</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isDanger = 'danger' in tab && tab.danger;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all border ${
                activeTab === tab.id
                  ? isDanger
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-brand-50 text-brand-700 border-brand-200'
                  : isDanger
                    ? 'text-red-500 hover:text-red-700 hover:bg-red-50 border-transparent'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && user && (
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Profile Information
          </h2>
          <div className="space-y-5 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                defaultValue={user.full_name || ''}
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-wrike-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                defaultValue={user.email}
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-wrike-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                defaultValue={user.username}
                disabled
                className="w-full px-4 py-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed"
              />
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
            >
              {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Client Settings Tab */}
      {activeTab === 'client' && client && (
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Client Settings
          </h2>
          <div className="space-y-5 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={clientForm.name}
                onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-wrike-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand Name (for tracking)
              </label>
              <input
                type="text"
                value={clientForm.brand_name}
                onChange={(e) => setClientForm({ ...clientForm, brand_name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-wrike-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand Name Variations / Aliases
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Add alternative spellings, abbreviations, or partial names to track (comma-separated). 
                These will be used to detect brand mentions in LLM responses.
              </p>
              <textarea
                value={brandAliases}
                onChange={(e) => setBrandAliases(e.target.value)}
                placeholder="e.g., Amazing Plastics, Plastics Corp, APC, Amazing Plastic"
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-wrike-500 transition-colors resize-none"
                rows={3}
              />
              {brandAliases && (
                <p className="mt-2 text-xs text-gray-500">
                  Will match: <span className="font-medium text-gray-700">{clientForm.brand_name}</span>
                  {brandAliases.split(',').filter(a => a.trim()).map(alias => (
                    <span key={alias.trim()}>, <span className="font-medium text-gray-700">{alias.trim()}</span></span>
                  ))}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <input
                type="text"
                value={clientForm.industry}
                onChange={(e) => setClientForm({ ...clientForm, industry: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-wrike-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={clientForm.primary_color}
                  onChange={(e) => setClientForm({ ...clientForm, primary_color: e.target.value })}
                  className="w-12 h-12 rounded-lg cursor-pointer border border-gray-300"
                />
                <input
                  type="text"
                  value={clientForm.primary_color}
                  onChange={(e) => setClientForm({ ...clientForm, primary_color: e.target.value })}
                  className="flex-1 px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-wrike-500 transition-colors"
                />
              </div>
            </div>
            <button
              onClick={handleSaveClientSettings}
              disabled={clientSaving}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              {clientSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : clientSaved ? (
                <Check className="w-5 h-5" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {clientSaved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Competitors Tab */}
      {activeTab === 'competitors' && (
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Competitors
            </h2>
          </div>

          {/* Add New Competitor Form */}
          <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Competitor</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newCompetitor.name}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                  placeholder="Competitor Name *"
                  className="flex-1 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-wrike-500 transition-colors"
                />
                <input
                  type="text"
                  value={newCompetitor.website}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, website: e.target.value })}
                  placeholder="Website (optional)"
                  className="flex-1 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-wrike-500 transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newCompetitor.aliases}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, aliases: e.target.value })}
                  placeholder="Aliases (comma-separated, e.g., 'Amazon,AWS,Amazon.com')"
                  className="flex-1 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-wrike-500 transition-colors"
                />
                <button 
                  onClick={handleAddCompetitor}
                  disabled={!newCompetitor.name.trim() || addingCompetitor}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors font-medium disabled:opacity-50"
                >
                  {addingCompetitor ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {competitors.map((competitor) => (
              <div
                key={competitor.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200"
              >
                {editingCompetitorId === competitor.id ? (
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={editingCompetitor.name}
                        onChange={(e) => setEditingCompetitor({ ...editingCompetitor, name: e.target.value })}
                        placeholder="Competitor Name"
                        className="flex-1 px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 focus:border-wrike-500 transition-colors"
                      />
                      <input
                        type="text"
                        value={editingCompetitor.website}
                        onChange={(e) => setEditingCompetitor({ ...editingCompetitor, website: e.target.value })}
                        placeholder="Website"
                        className="flex-1 px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-wrike-500 transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={editingCompetitor.aliases}
                        onChange={(e) => setEditingCompetitor({ ...editingCompetitor, aliases: e.target.value })}
                        placeholder="Aliases (comma-separated)"
                        className="flex-1 px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-wrike-500 transition-colors"
                      />
                      <button 
                        onClick={() => handleUpdateCompetitor(competitor.id)}
                        className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => { setEditingCompetitorId(null); setEditingCompetitor({ name: '', aliases: '', website: '' }); }}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => startEditingCompetitor(competitor)}
                    >
                      <p className="font-medium text-gray-900">{competitor.name}</p>
                      {competitor.aliases && (
                        <p className="text-xs text-wrike-600">
                          Also matches: {competitor.aliases}
                        </p>
                      )}
                      {competitor.website && (
                        <p className="text-sm text-gray-500">{competitor.website}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => startEditingCompetitor(competitor)}
                        className="p-2 rounded-lg text-gray-400 hover:text-wrike-600 hover:bg-wrike-50 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCompetitor(competitor.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {competitors.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No competitors configured yet. Add your first competitor above.</p>
            </div>
          )}
        </div>
      )}

      {/* API Configuration Tab */}
      {activeTab === 'api' && client && (
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            LLM Model Configuration
          </h2>
          <div className="space-y-5 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI Model
              </label>
              <select
                value={clientForm.default_openai_model}
                onChange={(e) => setClientForm({ ...clientForm, default_openai_model: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:border-wrike-500 transition-colors"
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gemini Model
              </label>
              <select
                value={clientForm.default_gemini_model}
                onChange={(e) => setClientForm({ ...clientForm, default_gemini_model: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:border-wrike-500 transition-colors"
              >
                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Perplexity Model
              </label>
              <select
                value={clientForm.default_perplexity_model}
                onChange={(e) => setClientForm({ ...clientForm, default_perplexity_model: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:border-wrike-500 transition-colors"
              >
                <option value="sonar">Sonar</option>
                <option value="sonar-pro">Sonar Pro</option>
              </select>
            </div>
            <button
              onClick={handleSaveApiSettings}
              disabled={clientSaving}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              {clientSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : clientSaved ? (
                <Check className="w-5 h-5" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {clientSaved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Danger Zone Tab */}
      {activeTab === 'danger' && (
        <div className="space-y-6">
          {/* Warning Banner */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-700">Danger Zone</h2>
                <p className="text-gray-700 mt-1">
                  Actions here are <strong className="text-red-600">permanent and irreversible</strong>. 
                  Please proceed with extreme caution.
                </p>
              </div>
            </div>
          </div>

          {/* Delete Account Card */}
          <div className="bg-white rounded-xl p-6 shadow-soft border border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Account & Portal
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              This will permanently delete your company portal and all associated data. 
              This action cannot be undone.
            </p>

            {/* What will be deleted */}
            {accountStats && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  The following data will be permanently deleted:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-2xl font-bold text-red-600">{accountStats.users}</p>
                    <p className="text-xs text-gray-500">Users</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-2xl font-bold text-red-600">{accountStats.competitors}</p>
                    <p className="text-xs text-gray-500">Competitors</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-2xl font-bold text-red-600">{accountStats.predefined_queries}</p>
                    <p className="text-xs text-gray-500">Queries</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-2xl font-bold text-red-600">{accountStats.query_runs}</p>
                    <p className="text-xs text-gray-500">Query Runs</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-2xl font-bold text-red-600">{accountStats.query_results}</p>
                    <p className="text-xs text-gray-500">Results</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-2xl font-bold text-red-600">{accountStats.total_records}</p>
                    <p className="text-xs text-gray-500">Total Records</p>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Form */}
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full px-4 py-3 rounded-lg bg-white border border-red-300 text-gray-900 placeholder-gray-400 focus:border-red-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="text-red-600 font-mono">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-4 py-3 rounded-lg bg-white border border-red-300 text-gray-900 placeholder-gray-400 focus:border-red-500 transition-colors font-mono"
                />
              </div>

              {deleteError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                  {deleteError}
                </div>
              )}

              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmText !== 'DELETE' || !deletePassword}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  deleteConfirmText === 'DELETE' && deletePassword
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Permanently Delete Account
                  </>
                )}
              </button>
            </div>

            {/* Admin Notice */}
            {user && !user.is_admin && (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="text-amber-800 text-sm">
                  <strong>Note:</strong> Only admin users can delete the company portal. 
                  Contact your admin if you need to delete this account.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
