'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, User, AlertCircle, LogIn } from 'lucide-react';
import { apiRequest, setAuthToken, getAuthToken, getUserType } from '@/utils/api';

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect if already logged in
    const token = getAuthToken();
    const type = getUserType();
    if (token && type) {
      if (type === 'attendance_admin') {
        router.push('/admin/scan');
      } else if (type === 'super_admin') {
        router.push('/admin/super');
      } else {
        router.push('/dashboard');
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      // Save token, user type, and name in localStorage
      setAuthToken(data.access_token, data.user_type, data.name);
      
      // Redirect based on user role
      if (data.user_type === 'attendance_admin') {
        router.push('/admin/scan');
      } else if (data.user_type === 'super_admin') {
        router.push('/admin/super');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        
        {/* Title / Hero Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#d4af37] bg-gradient-to-b from-[#d4af37]/20 to-black gold-border-glow">
            <Shield className="h-8 w-8 text-[#d4af37]" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-wider font-serif text-gold-gradient">
            CHAKRAVYUHA
          </h1>
          <p className="text-sm font-semibold tracking-wider text-[#c5a059] uppercase">
            Breach the Formations of Code
          </p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Welcome, Warrior. Solve daily DSA problems, maintain your streaks, and conquer the battlefield.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-8 shadow-xl backdrop-blur-sm glass-panel">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-zinc-900 pb-3">
            <LogIn className="h-5 w-5 text-[#d4af37]" />
            Enter the Battlefield
          </h2>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-md border border-rose-950 bg-rose-950/20 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1.5">
                Email or Roll Number
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="AV1234 or email@college.edu"
                  className="block w-full rounded border border-[#8c7030]/25 bg-zinc-900/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-500 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded border border-[#8c7030]/25 bg-zinc-900/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-500 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded border border-[#d4af37] bg-gradient-to-r from-[#d4af37] to-[#8c7030] py-2.5 text-sm font-bold uppercase tracking-wider text-black hover:from-[#f6e05e] hover:to-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37] transition-all disabled:opacity-50"
              >
                {loading ? 'Entering...' : 'Enter Platform'}
              </button>
            </div>
          </form>

          {/* Navigation Links */}
          <div className="mt-6 flex items-center justify-between text-xs border-t border-zinc-900 pt-4">
            <span className="text-zinc-500">Need credentials?</span>
            <Link href="/signup" className="font-semibold text-[#d4af37] hover:text-[#f6e05e] transition-colors">
              Sign Up As Warrior
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
