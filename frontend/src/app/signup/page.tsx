'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  User,
  Users,
  MessageSquare,
  Check,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Globe,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

interface Competitor {
  name: string;
  website: string;
}

interface FormData {
  // Step 1: Account
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  
  // Step 2: Company
  companyName: string;
  brandName: string;
  brandAliases: string;
  website: string;
  industry: string;
  
  // Step 3: Competitors
  competitors: Competitor[];
  
  // Step 4: Queries
  queries: string[];
}

const STEPS = [
  { id: 1, name: 'Account', icon: User },
  { id: 2, name: 'Company', icon: Building2 },
  { id: 3, name: 'Competitors', icon: Users },
  { id: 4, name: 'Queries', icon: MessageSquare },
];

const INDUSTRY_OPTIONS = [
  'Manufacturing',
  'Technology',
  'Healthcare',
  'Finance',
  'Retail',
  'Marketing & Advertising',
  'Professional Services',
  'Education',
  'Real Estate',
  'Other',
];

const SAMPLE_QUERIES = [
  "Who is [BRAND] and what do they specialize in?",
  "Best [INDUSTRY] companies in the US",
  "[BRAND] vs [COMPETITOR] comparison",
  "Top [INDUSTRY] service providers",
  "What makes [BRAND] different from competitors?",
];

export default function SignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [createdUsername, setCreatedUsername] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
    brandName: '',
    brandAliases: '',
    website: '',
    industry: '',
    competitors: [{ name: '', website: '' }],
    queries: [''],
  });

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const addCompetitor = () => {
    setFormData(prev => ({
      ...prev,
      competitors: [...prev.competitors, { name: '', website: '' }]
    }));
  };

  const removeCompetitor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      competitors: prev.competitors.filter((_, i) => i !== index)
    }));
  };

  const updateCompetitor = (index: number, field: 'name' | 'website', value: string) => {
    setFormData(prev => ({
      ...prev,
      competitors: prev.competitors.map((comp, i) => 
        i === index ? { ...comp, [field]: value } : comp
      )
    }));
  };

  const addQuery = () => {
    setFormData(prev => ({
      ...prev,
      queries: [...prev.queries, '']
    }));
  };

  const removeQuery = (index: number) => {
    setFormData(prev => ({
      ...prev,
      queries: prev.queries.filter((_, i) => i !== index)
    }));
  };

  const updateQuery = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      queries: prev.queries.map((q, i) => i === index ? value : q)
    }));
  };

  const generateSampleQueries = () => {
    const brand = formData.brandName || formData.companyName || '[Your Brand]';
    const industry = formData.industry || '[Your Industry]';
    const competitor = formData.competitors[0]?.name || '[Competitor]';
    
    const generated = SAMPLE_QUERIES.map(q => 
      q.replace('[BRAND]', brand)
       .replace('[INDUSTRY]', industry)
       .replace('[COMPETITOR]', competitor)
    );
    
    setFormData(prev => ({ ...prev, queries: generated }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.email || !formData.password || !formData.fullName) {
          setError('Please fill in all required fields');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return false;
        }
        break;
      case 2:
        if (!formData.companyName || !formData.brandName) {
          setError('Please fill in company name and brand name');
          return false;
        }
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/signup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          company_name: formData.companyName,
          brand_name: formData.brandName,
          brand_aliases: formData.brandAliases,
          website: formData.website,
          industry: formData.industry,
          competitors: formData.competitors.filter(c => c.name.trim()),
          queries: formData.queries.filter(q => q.trim()),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error formats from the backend
        let errorMessage = 'Signup failed';
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          // Pydantic validation errors come as an array
          errorMessage = data.detail.map((e: any) => e.msg || e.message || String(e)).join(', ');
        } else if (data.detail && typeof data.detail === 'object') {
          errorMessage = data.detail.message || data.detail.msg || JSON.stringify(data.detail);
        } else if (data.message) {
          errorMessage = data.message;
        }
        throw new Error(errorMessage);
      }

      // Success - show the username and redirect
      setCreatedUsername(data.username);
      setCurrentStep(5); // Success step
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              LLMify
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Start Your Free Trial
          </h1>
          <p className="text-gray-400">
            Set up your AI Engine Optimization portal in minutes
          </p>
        </div>

        {/* Progress Steps */}
        {currentStep <= 4 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                      isActive
                        ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-500'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline text-sm font-medium">{step.name}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Form Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Account Details */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Account Details</h2>
                <p className="text-gray-400 text-sm mt-1">Create your login credentials</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-600 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-600 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-brand-500 transition-colors pr-12"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-brand-500 transition-colors"
                  placeholder="Confirm your password"
                />
              </div>
            </div>
          )}

          {/* Step 2: Company Details */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-xl font-font-semibold text-gray-900">Company Details</h2>
                <p className="text-gray-500 text-sm mt-1">Tell us about your business</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-brand-500 transition-colors"
                  placeholder="Acme Corporation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Name to Track *
                  <span className="text-slate-500 font-normal ml-2">(This is what we'll search for in LLM responses)</span>
                </label>
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={(e) => updateField('brandName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-brand-500 transition-colors"
                  placeholder="Acme"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Name Variations / Aliases
                  <span className="text-slate-500 font-normal ml-2">(Optional - comma-separated)</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Add alternative spellings, abbreviations, or partial names. For example: &quot;Acme Inc, Acme Corp, AC&quot;
                </p>
                <textarea
                  value={formData.brandAliases}
                  onChange={(e) => updateField('brandAliases', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-brand-500 transition-colors resize-none"
                  placeholder="Acme Inc, Acme Corp, AC"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-brand-500 transition-colors"
                    placeholder="https://www.acme.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                <select
                  value={formData.industry}
                  onChange={(e) => updateField('industry', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 focus:border-brand-500 transition-colors"
                >
                  <option value="">Select an industry</option>
                  {INDUSTRY_OPTIONS.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Competitors */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-xl font-font-semibold text-gray-900">Your Competitors</h2>
                <p className="text-gray-500 text-sm mt-1">Add competitors you want to track against</p>
              </div>

              <div className="space-y-4">
                {formData.competitors.map((competitor, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={competitor.name}
                        onChange={(e) => updateCompetitor(index, 'name', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-brand-500 transition-colors"
                        placeholder="Competitor name"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="url"
                        value={competitor.website}
                        onChange={(e) => updateCompetitor(index, 'website', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-brand-500 transition-colors"
                        placeholder="Website (optional)"
                      />
                    </div>
                    {formData.competitors.length > 1 && (
                      <button
                        onClick={() => removeCompetitor(index)}
                        className="p-3 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addCompetitor}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-slate-600 text-gray-500 hover:border-brand-500 hover:text-brand-400 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Another Competitor
              </button>

              <p className="text-sm text-slate-500 text-center">
                You can add or edit competitors later from your dashboard settings
              </p>
            </div>
          )}

          {/* Step 4: Queries */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-font-semibold text-gray-900">Predefined Queries</h2>
                <p className="text-gray-500 text-sm mt-1">Add queries to run against LLMs</p>
              </div>

              <button
                onClick={generateSampleQueries}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                Generate Sample Queries for {formData.brandName || 'Your Brand'}
              </button>

              <div className="space-y-3">
                {formData.queries.map((query, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-1">
                      <textarea
                        value={query}
                        onChange={(e) => updateQuery(index, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-brand-500 transition-colors resize-none"
                        placeholder={`Query ${index + 1}...`}
                        rows={2}
                      />
                    </div>
                    {formData.queries.length > 1 && (
                      <button
                        onClick={() => removeQuery(index)}
                        className="p-3 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors self-start"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addQuery}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-slate-600 text-gray-500 hover:border-brand-500 hover:text-brand-400 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Another Query
              </button>
            </div>
          )}

          {/* Step 5: Success */}
          {currentStep === 5 && (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-font-bold text-gray-900 mb-2">
                Account Created! 🎉
              </h2>
              <p className="text-gray-500 mb-6">
                Your portal is ready. Here are your login details:
              </p>
              
              <div className="glass rounded-xl p-6 mb-8 text-left">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Username:</span>
                    <span className="text-gray-900 font-mono font-medium">{createdUsername}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="text-gray-900">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Company:</span>
                    <span className="text-gray-900">{formData.companyName}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push('/login')}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-gray-900 font-medium hover:from-brand-600 hover:to-brand-700 transition-all"
              >
                Go to Login
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep <= 4 && (
            <div className="flex gap-4 mt-8">
              {currentStep > 1 && (
                <button
                  onClick={prevStep}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-600 text-gray-700 hover:bg-slate-800/50 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
              )}
              
              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-gray-900 font-medium hover:from-brand-600 hover:to-brand-700 transition-all"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-gray-900 font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <Check className="w-5 h-5" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Already have account */}
        {currentStep <= 4 && (
          <p className="text-center mt-6 text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

