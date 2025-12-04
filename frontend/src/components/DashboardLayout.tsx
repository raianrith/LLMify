'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  BarChart3,
  Users,
  Target,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Sparkles,
  Shield,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/api';

interface User {
  id: number;
  username: string;
  full_name: string | null;
  is_superadmin: boolean;
  client: {
    name: string;
    brand_name: string;
    primary_color: string;
  };
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Query Generator', href: '/dashboard/generator', icon: Search },
  { name: 'Visibility Analysis', href: '/dashboard/analysis', icon: TrendingUp },
  { name: 'Competitor Comparison', href: '/dashboard/competitors', icon: Users },
  { name: 'Gap Analysis', href: '/dashboard/gaps', icon: Target },
  { name: 'Time Series', href: '/dashboard/trends', icon: Sparkles },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        // Apply client's primary color to CSS variables
        if (userData?.client?.primary_color) {
          const color = userData.client.primary_color;
          document.documentElement.style.setProperty('--client-primary', color);
          document.documentElement.style.setProperty('--client-primary-light', `${color}20`);
          document.documentElement.style.setProperty('--client-primary-dark', adjustColor(color, -20));
        }
      } catch (error) {
        router.push('/login');
      }
    };
    loadUser();
  }, [router]);

  // Helper function to darken/lighten a hex color
  const adjustColor = (hex: string, amount: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 shadow-soft transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm"
              style={{ backgroundColor: user.client.primary_color || '#8b5cf6' }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 text-sm">LLMify</span>
              <span className="text-xs text-gray-500 truncate">{user.client.brand_name}</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const primaryColor = user.client.primary_color || '#8b5cf6';
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                style={isActive ? { 
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor
                } : undefined}
              >
                <item.icon 
                  className="w-5 h-5" 
                  style={{ color: isActive ? primaryColor : '#9ca3af' }}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200">
          {user.is_superadmin && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-wrike-600 bg-wrike-50 hover:bg-wrike-100 mb-1 font-medium"
            >
              <Shield className="w-5 h-5 text-wrike-500" />
              <span>Admin Portal</span>
            </Link>
          )}
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <Settings className="w-5 h-5 text-gray-400" />
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="h-full px-4 lg:px-6 flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">
                {navigation.find((n) => n.href === pathname)?.name || 'Dashboard'}
              </h1>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5" />
                <span 
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{ backgroundColor: user.client.primary_color || '#8b5cf6' }}
                ></span>
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                    style={{ backgroundColor: user.client.primary_color || '#8b5cf6' }}
                  >
                    {user.full_name?.[0] || user.username[0].toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user.full_name || user.username}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-soft-lg z-50 animate-slide-down">
                      <div className="p-1.5">
                        <div className="px-3 py-2 border-b border-gray-100 mb-1">
                          <p className="text-sm font-medium text-gray-900">{user.full_name || user.username}</p>
                          <p className="text-xs text-gray-500">{user.client.name}</p>
                        </div>
                        {user.is_superadmin && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-wrike-600 hover:bg-wrike-50"
                          >
                            <Shield className="w-4 h-4" />
                            Admin Portal
                          </Link>
                        )}
                        <Link
                          href="/dashboard/settings"
                          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
