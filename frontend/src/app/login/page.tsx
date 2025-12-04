'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Eye, 
  EyeOff, 
  Sparkles, 
  Target, 
  ArrowRight,
  Bot,
  Brain,
  LineChart,
  Play,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { login, getCurrentUser, getOAuthConfig, initiateGoogleLogin } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [demoScreen, setDemoScreen] = useState(0);
  const [oauthConfig, setOauthConfig] = useState<{ google_enabled: boolean } | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    // Check if Google OAuth is configured
    getOAuthConfig()
      .then(setOauthConfig)
      .catch(() => setOauthConfig({ google_enabled: false }));
  }, []);

  const handleGoogleLogin = async () => {
    setOauthLoading(true);
    setError('');
    try {
      await initiateGoogleLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed');
      setOauthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(username, password);
      localStorage.setItem('token', response.access_token);
      
      const user = await getCurrentUser();
      if (user.is_superadmin) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoScreens = [
    {
      title: 'Dashboard Overview',
      description: 'Get instant visibility into your brand\'s AI presence',
      icon: BarChart3,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Query Generator',
      description: 'Run queries across multiple LLMs simultaneously',
      icon: Search,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Visibility Analysis',
      description: 'Deep dive into mention rates and positioning',
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'Gap Analysis',
      description: 'Discover missed opportunities and critical gaps',
      icon: Target,
      color: 'from-amber-500 to-amber-600',
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-white overflow-hidden">
      {/* Left side - Hero Section */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-y-auto">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-2/3 left-1/3 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col w-full px-8 py-12">
          <div className="max-w-xl mx-auto text-center flex-1 flex flex-col justify-center">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <span className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                LLMify
              </span>
            </div>

            {/* Main headline */}
            <div className="mb-10">
              <h1 className="text-5xl xl:text-6xl font-bold leading-tight mb-6">
                <span className="text-white">The new </span>
                <span className="relative inline-block">
                  <span className="text-gray-500 line-through decoration-2">SEO</span>
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  AEO
                </span>
                <span className="text-white"> starts here.</span>
              </h1>
              <p className="text-lg text-gray-400 leading-relaxed max-w-md mx-auto">
                <span className="text-purple-400 font-semibold">AI Engine Optimization</span> — 
                Track your brand&apos;s visibility across AI platforms. 
                The future of search is AI.
              </p>
            </div>
            
            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-3 mb-10">
              <div className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all cursor-default text-left">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <p className="text-white font-semibold text-sm">Multi-LLM Tracking</p>
                <p className="text-gray-500 text-xs mt-1">All major AI platforms</p>
              </div>
              
              <div className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all cursor-default text-left">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <LineChart className="w-5 h-5 text-white" />
                </div>
                <p className="text-white font-semibold text-sm">Visibility Analytics</p>
                <p className="text-gray-500 text-xs mt-1">Real-time tracking</p>
              </div>
              
              <div className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-white/10 transition-all cursor-default text-left">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <p className="text-white font-semibold text-sm">Gap Analysis</p>
                <p className="text-gray-500 text-xs mt-1">Find opportunities</p>
              </div>
              
              <div className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/50 hover:bg-white/10 transition-all cursor-default text-left">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <p className="text-white font-semibold text-sm">Competitor Intel</p>
                <p className="text-gray-500 text-xs mt-1">Track rival mentions</p>
              </div>
            </div>

            {/* Powered by LLMs */}
            <div className="mb-8">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-4">Powered by</p>
              <div className="flex items-center justify-center gap-6">
                {/* OpenAI */}
                <div className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-emerald-500/50 transition-all">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
                      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.6 8.3829l2.02-1.1638a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
                    </svg>
                  </div>
                  <span className="text-gray-500 text-xs">OpenAI</span>
                </div>
                
                {/* Google Gemini */}
                <div className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-blue-500/50 transition-all">
                    <svg viewBox="0 0 28 28" className="w-7 h-7" fill="none">
                      <path d="M14 28C14 26.0633 13.6267 24.2433 12.88 22.54C12.1567 20.8367 11.165 19.355 9.905 18.095C8.645 16.835 7.16333 15.8433 5.46 15.12C3.75667 14.3733 1.93667 14 0 14C1.93667 14 3.75667 13.6383 5.46 12.915C7.16333 12.1683 8.645 11.165 9.905 9.905C11.165 8.645 12.1567 7.16333 12.88 5.46C13.6267 3.75667 14 1.93667 14 0C14 1.93667 14.3617 3.75667 15.085 5.46C15.8317 7.16333 16.835 8.645 18.095 9.905C19.355 11.165 20.8367 12.1683 22.54 12.915C24.2433 13.6383 26.0633 14 28 14C26.0633 14 24.2433 14.3733 22.54 15.12C20.8367 15.8433 19.355 16.835 18.095 18.095C16.835 19.355 15.8317 20.8367 15.085 22.54C14.3617 24.2433 14 26.0633 14 28Z" fill="url(#gemini-star)"/>
                      <defs>
                        <linearGradient id="gemini-star" x1="0" y1="14" x2="28" y2="14" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#1A73E8"/>
                          <stop offset="0.5" stopColor="#6C47FF"/>
                          <stop offset="1" stopColor="#E94235"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <span className="text-gray-500 text-xs">Gemini</span>
                </div>
                
                {/* Anthropic Claude */}
                <div className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-orange-500/50 transition-all">
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
                      <path d="M16.5 3L21 12L16.5 21H7.5L3 12L7.5 3H16.5Z" stroke="#D4A574" strokeWidth="1.5" fill="none"/>
                      <path d="M12 8V16M8.5 10L12 8L15.5 10M8.5 14L12 16L15.5 14" stroke="#D4A574" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-gray-500 text-xs">Claude</span>
                </div>
                
                {/* Perplexity */}
                <div className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-cyan-500/50 transition-all">
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
                      <path d="M12 2L4 6V12L12 22L20 12V6L12 2Z" stroke="#20B8CD" strokeWidth="1.5" fill="none"/>
                      <path d="M12 2V22M4 6L12 12L20 6M4 12L12 12" stroke="#20B8CD" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="text-gray-500 text-xs">Perplexity</span>
                </div>
              </div>
            </div>

            {/* See Demo Button */}
            <button
              onClick={() => setShowDemo(!showDemo)}
              className="mx-auto flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/20 hover:bg-white/10 hover:border-purple-500/50 transition-all text-gray-300 hover:text-white group"
            >
              <Play className="w-4 h-4 text-purple-400" />
              <span className="font-medium">See Demo</span>
              {showDemo ? (
                <ChevronUp className="w-4 h-4 group-hover:text-purple-400 transition-colors" />
              ) : (
                <ChevronDown className="w-4 h-4 group-hover:text-purple-400 transition-colors" />
              )}
            </button>
          </div>

          {/* Demo Section - Expandable */}
          {showDemo && (
            <div className="max-w-2xl mx-auto mt-8 pb-8 animate-fade-in">
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">See LLMify in Action</h3>
                  <p className="text-gray-400 text-sm">Explore the platform&apos;s key features</p>
                </div>

                {/* Feature selector */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {demoScreens.map((screen, index) => {
                    const Icon = screen.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => setDemoScreen(index)}
                        className={`p-3 rounded-xl text-center transition-all ${
                          demoScreen === index
                            ? 'bg-white/10 border-purple-500/50 border'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${screen.color} flex items-center justify-center mx-auto mb-2`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-white text-xs font-medium">{screen.title}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Demo preview */}
                <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
                  {/* Mock browser header */}
                  <div className="bg-slate-900/80 px-4 py-3 flex items-center gap-2 border-b border-slate-700/50">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="bg-slate-800 rounded-lg px-3 py-1.5 text-xs text-gray-400 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        app.llmify.io/dashboard
                      </div>
                    </div>
                  </div>

                  {/* Mock app content */}
                  <div className="p-4">
                    {demoScreen === 0 && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-semibold">Dashboard Overview</h3>
                          <span className="text-xs text-gray-500">Live data</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-gray-500 text-xs mb-1">Mention Rate</p>
                            <p className="text-2xl font-bold text-emerald-400">73.2%</p>
                            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                              <TrendingUp className="w-3 h-3" /> +5.2%
                            </p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-gray-500 text-xs mb-1">Queries Run</p>
                            <p className="text-2xl font-bold text-blue-400">1,247</p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-gray-500 text-xs mb-1">Competitors</p>
                            <p className="text-2xl font-bold text-purple-400">8</p>
                          </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <p className="text-gray-500 text-xs mb-3">Visibility Trend</p>
                          <div className="flex items-end gap-1 h-20">
                            {[40, 55, 45, 60, 75, 65, 80, 73, 85, 78].map((h, i) => (
                              <div
                                key={i}
                                className="flex-1 bg-gradient-to-t from-purple-500 to-blue-500 rounded-t"
                                style={{ height: `${h}%` }}
                              ></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {demoScreen === 1 && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-semibold">Query Generator</h3>
                          <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs">Running</span>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <p className="text-gray-500 text-xs mb-2">Query</p>
                          <p className="text-white text-sm">&quot;Best injection molding companies in Wisconsin&quot;</p>
                        </div>
                        <div className="space-y-2">
                          {['OpenAI GPT-4', 'Google Gemini', 'Perplexity'].map((llm, i) => (
                            <div key={i} className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between">
                              <span className="text-white text-sm">{llm}</span>
                              <div className="flex items-center gap-2">
                                {i < 2 ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {demoScreen === 2 && (
                      <div className="space-y-4 animate-fade-in">
                        <h3 className="text-white font-semibold">Visibility Analysis</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-gray-500 text-xs mb-1">First Third Rate</p>
                            <p className="text-xl font-bold text-emerald-400">45.8%</p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-gray-500 text-xs mb-1">Positive Context</p>
                            <p className="text-xl font-bold text-blue-400">82.3%</p>
                          </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <p className="text-gray-500 text-xs mb-3">Mention by Platform</p>
                          <div className="space-y-2">
                            {[
                              { name: 'OpenAI', pct: 78, color: 'bg-emerald-500' },
                              { name: 'Gemini', pct: 65, color: 'bg-blue-500' },
                              { name: 'Perplexity', pct: 82, color: 'bg-cyan-500' },
                            ].map((item) => (
                              <div key={item.name} className="flex items-center gap-3">
                                <span className="text-xs text-gray-400 w-20">{item.name}</span>
                                <div className="flex-1 bg-slate-700 rounded-full h-2">
                                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }}></div>
                                </div>
                                <span className="text-xs text-white w-10">{item.pct}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {demoScreen === 3 && (
                      <div className="space-y-4 animate-fade-in">
                        <h3 className="text-white font-semibold">Gap Analysis</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
                            <p className="text-emerald-400 font-bold text-lg">12</p>
                            <p className="text-gray-400 text-xs">Exclusive Wins</p>
                          </div>
                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                            <AlertTriangle className="w-5 h-5 text-red-400 mb-2" />
                            <p className="text-red-400 font-bold text-lg">5</p>
                            <p className="text-gray-400 text-xs">Critical Gaps</p>
                          </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <p className="text-gray-500 text-xs mb-2">Top Opportunity</p>
                          <p className="text-white text-sm mb-2">&quot;Best manufacturers for medical devices&quot;</p>
                          <div className="flex gap-2">
                            <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs">Missing from OpenAI</span>
                            <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-xs">2 competitors</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* CTA in demo */}
                <div className="mt-6 text-center">
                  <p className="text-gray-400 text-sm mb-3">Ready to optimize your AI visibility?</p>
                  <div className="flex items-center justify-center gap-2 text-purple-400">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm font-medium">Sign in on the right to get started →</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Login Panel */}
      <div className="w-full lg:w-2/5 flex flex-col bg-slate-900/50 backdrop-blur-sm">
        {/* Content area */}
        <div className="flex-1 flex items-center justify-center px-6 py-8 overflow-y-auto">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">LLMify</span>
              </div>
              <p className="text-gray-400 text-sm">AI Engine Optimization Platform</p>
            </div>

            {/* Login card */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
                <p className="text-gray-400">Sign in to your LLMify account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-slide-down">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    placeholder="Enter your username"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all pr-12"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-500 hover:to-blue-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25 group"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign in
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </button>
              </form>

              {/* OAuth Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-800/50 text-gray-500">or continue with</span>
                </div>
              </div>

              {/* Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={oauthLoading || !!(oauthConfig && !oauthConfig.google_enabled)}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-white hover:bg-gray-100 text-gray-800 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {oauthLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* Show hint if OAuth not configured */}
              {oauthConfig && !oauthConfig.google_enabled && (
                <p className="mt-3 text-xs text-gray-500 text-center">
                  Google login requires OAuth configuration
                </p>
              )}

              <div className="mt-6 pt-6 border-t border-slate-700">
                <p className="text-center text-sm text-gray-400">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                    Start free trial
                  </Link>
                </p>
              </div>
            </div>

            {/* Demo credentials hint */}
            <div className="mt-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
              <p className="text-sm text-gray-400 text-center">
                <span className="font-medium text-gray-300">Demo credentials:</span><br />
                <span className="text-purple-400">Admin:</span> superadmin / admin123<br />
                <span className="text-blue-400">Kaysun:</span> kaysun_admin / kaysun123
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-4 text-center border-t border-slate-700/50">
          <p className="text-xs text-gray-600">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
