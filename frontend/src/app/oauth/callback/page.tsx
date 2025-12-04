'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { getCurrentUser } from '@/lib/api';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing login...');

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const provider = searchParams.get('provider');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(error === 'no_account' 
          ? 'No account found with this email. Please sign up first.'
          : 'Authentication failed. Please try again.'
        );
        return;
      }

      if (!token) {
        setStatus('error');
        setMessage('No authentication token received.');
        return;
      }

      try {
        // Store the token
        localStorage.setItem('token', token);
        
        // Verify and get user info
        const user = await getCurrentUser();
        
        setStatus('success');
        setMessage(`Welcome back! Signed in with ${provider === 'google' ? 'Google' : 'Microsoft'}.`);
        
        // Redirect after a brief delay
        setTimeout(() => {
          if (user.is_superadmin) {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
        }, 1500);
      } catch (err) {
        setStatus('error');
        setMessage('Failed to verify authentication. Please try again.');
        localStorage.removeItem('token');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <span className="text-3xl font-bold text-white">LLMify</span>
        </div>

        {/* Status card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 max-w-md">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Authenticating...</h2>
              <p className="text-gray-400">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Success!</h2>
              <p className="text-gray-400">{message}</p>
              <p className="text-sm text-gray-500 mt-4">Redirecting to dashboard...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Authentication Failed</h2>
              <p className="text-gray-400 mb-6">{message}</p>
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-500 hover:to-blue-500 transition-all"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

