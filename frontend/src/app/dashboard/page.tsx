'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, QrCode, Calendar, Sparkles, CheckCircle2, Flame, RefreshCw, Download, ArrowRight, UserCheck } from 'lucide-react';
import { apiRequest, getAuthToken, clearAuth } from '@/utils/api';

interface StudentInfo {
  name: string;
  roll_number: string;
  email: string;
  phone: string;
  branch: string;
  year: number;
  streak: number;
  qr_key: string;
}

interface DashboardStats {
  streak: number;
  solved_count: number;
  total_problems: number;
  completion_percentage: number;
  difficulty_breakdown: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
  attendance_history: string[];
  codechef_history: { week: number; status: string }[];
}

export default function Dashboard() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'leaderboard'>('stats');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const data = await apiRequest('/api/dsa/leaderboard');
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/');
        return;
      }
      
      const [profileData, statsData] = await Promise.all([
        apiRequest('/api/auth/me'),
        apiRequest('/api/dsa/dashboard-stats')
      ]);

      setStudent({
        name: profileData.full_name,
        roll_number: profileData.roll_number,
        email: profileData.college_email,
        phone: profileData.phone_number,
        branch: profileData.branch,
        year: profileData.year,
        streak: statsData.streak, // Sync with actual calculated stats streak
        qr_key: profileData.qr_key,
      });

      setStats(statsData);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load dashboard data. Please try logging in again.');
      if (err.message === 'Could not validate credentials') {
        clearAuth();
        router.push('/');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [router]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleDownloadQR = async () => {
    if (!student) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(student.qr_key)}`;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chakravyuha_qr_${student.roll_number}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download QR code', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-10 w-10 text-[#d4af37] animate-spin" />
          <span className="text-sm text-zinc-400 font-semibold tracking-wider uppercase">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !student || !stats) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <div className="rounded-lg border border-rose-950 bg-rose-950/20 p-6 text-center max-w-md">
          <h2 className="text-lg font-bold text-rose-300 mb-2">Access Error</h2>
          <p className="text-sm text-zinc-400 mb-4">{error || 'An error occurred fetching dashboard state.'}</p>
          <button 
            onClick={() => { clearAuth(); router.push('/'); }} 
            className="rounded border border-[#d4af37] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#d4af37] hover:bg-[#d4af37]/20"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(student.qr_key)}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#8c7030]/20 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-serif flex items-center gap-2">
            Warrior Dashboard
            <Sparkles className="h-5 w-5 text-[#d4af37] animate-pulse" />
          </h1>
          <p className="text-xs text-zinc-500">
            Welcome back, <span className="font-semibold text-white">{student.name}</span>. Maintain your streak and sharpen your weapons.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded border border-[#8c7030]/30 bg-zinc-900/60 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Sync Progress'}
        </button>
      </div>

      {/* Grid of Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile Card & QR Code */}
        <div className="space-y-8">
          
          {/* Warrior Profile Card */}
          <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-6 shadow-md glass-panel flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#d4af37] text-black font-bold text-[9px] uppercase px-3 py-1 rounded-bl">
              Active Warrior
            </div>
            
            {/* Avatar */}
            <div className="h-20 w-20 rounded-full border-2 border-[#d4af37]/80 bg-gradient-to-b from-[#d4af37]/20 to-black p-1 mb-4 flex items-center justify-center font-serif text-3xl text-[#d4af37] font-bold">
              {student.name.charAt(0)}
            </div>
            
            <h2 className="text-lg font-bold text-white leading-tight">{student.name}</h2>
            <p className="text-xs text-zinc-500 mt-1">{student.roll_number}</p>
            
            <div className="w-full grid grid-cols-2 gap-3 mt-6 border-t border-zinc-900 pt-4 text-left">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Branch</span>
                <p className="text-xs font-semibold text-zinc-300">{student.branch}</p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Year of Study</span>
                <p className="text-xs font-semibold text-zinc-300">{student.year} Year</p>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Registered Email</span>
                <p className="text-xs font-semibold text-zinc-300 truncate">{student.email}</p>
              </div>
            </div>
          </div>

          {/* QR Code Attendance Badge */}
          <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-6 shadow-md glass-panel flex flex-col items-center text-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-4 flex items-center gap-1.5">
              <QrCode className="h-4 w-4 text-[#d4af37]" />
              Attendance QR Code
            </h3>
            
            {/* QR Container */}
            <div className="bg-white p-4 rounded-lg shadow-inner border border-[#d4af37]/40 mb-4 transition-transform hover:scale-105 duration-300 relative group">
              <img 
                src={qrCodeUrl} 
                alt="Student QR Code" 
                className="h-40 w-40"
              />
            </div>
            
            <p className="text-[10px] text-zinc-500 max-w-xs mb-5">
              This QR code is your permanent attendance credential. Present it daily at the battlefield scanner to be marked present.
            </p>
            
            <button
              onClick={handleDownloadQR}
              className="flex w-full items-center justify-center gap-2 rounded border border-[#d4af37] bg-[#d4af37]/10 hover:bg-[#d4af37]/20 py-2.5 text-xs font-bold uppercase tracking-wider text-[#d4af37] transition-all gold-border-glow"
            >
              <Download className="h-4 w-4" />
              Download QR code
            </button>
          </div>

        </div>

        {/* Center & Right Column: Analytics & Progress & History */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Tab Toggle Navigation */}
          <div className="flex border-b border-[#8c7030]/20 pb-px mb-6">
            <button
              onClick={() => setActiveTab('stats')}
              className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 px-4 transition-all focus:outline-none ${
                activeTab === 'stats' 
                  ? 'border-[#d4af37] text-[#d4af37]' 
                  : 'border-transparent text-zinc-550 hover:text-zinc-300'
              }`}
            >
              My Warrior Stats
            </button>
            <button
              onClick={() => {
                setActiveTab('leaderboard');
                fetchLeaderboard();
              }}
              className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 px-4 transition-all focus:outline-none ${
                activeTab === 'leaderboard' 
                  ? 'border-[#d4af37] text-[#d4af37]' 
                  : 'border-transparent text-zinc-550 hover:text-zinc-300'
              }`}
            >
              Battlefield Leaderboard
            </button>
          </div>

          {activeTab === 'stats' ? (
            <>
              {/* Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Stat 1: Solved Problems */}
            <div className="rounded-lg border border-[#8c7030]/15 bg-zinc-950/50 p-5 glass-panel flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Total Solved</span>
                <p className="text-3xl font-extrabold text-[#d4af37]">{stats.solved_count}</p>
                <span className="text-[9px] text-zinc-400">out of {stats.total_problems} problems</span>
              </div>
              <div className="h-12 w-12 rounded-full bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/20">
                <Trophy className="h-6 w-6 text-[#d4af37]" />
              </div>
            </div>

            {/* Stat 2: Completion Rate */}
            <div className="rounded-lg border border-[#8c7030]/15 bg-zinc-950/50 p-5 glass-panel flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Completion %</span>
                <p className="text-3xl font-extrabold text-emerald-400">{stats.completion_percentage}%</p>
                <span className="text-[9px] text-zinc-400">Target: 100% Solve Rate</span>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
            </div>

            {/* Stat 3: Daily Streak */}
            <div className="rounded-lg border border-[#8c7030]/15 bg-zinc-950/50 p-5 glass-panel flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Daily Streak</span>
                <p className="text-3xl font-extrabold text-orange-400 flex items-center gap-1.5">
                  {stats.streak}
                  <Flame className="h-6 w-6 text-orange-500 animate-pulse fill-orange-500" />
                </p>
                <span className="text-[9px] text-zinc-400">consecutive days solved</span>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <Flame className="h-6 w-6 text-orange-400" />
              </div>
            </div>

          </div>

          {/* Difficulty Progression Breakdown */}
          <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-6 shadow-md glass-panel">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-5 border-b border-zinc-900 pb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#d4af37]" />
              Difficulty Solve Distribution
            </h3>
            
            <div className="space-y-5">
              {/* Easy Progress */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-emerald-400">Easy Problems</span>
                  <span className="text-zinc-400">{stats.difficulty_breakdown.Easy} solved</span>
                </div>
                <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500" 
                    style={{ width: `${Math.min(100, (stats.difficulty_breakdown.Easy / Math.max(1, stats.solved_count)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Medium Progress */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-amber-500">Medium Problems</span>
                  <span className="text-zinc-400">{stats.difficulty_breakdown.Medium} solved</span>
                </div>
                <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-500 transition-all duration-500" 
                    style={{ width: `${Math.min(100, (stats.difficulty_breakdown.Medium / Math.max(1, stats.solved_count)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Hard Progress */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-rose-500">Hard Problems</span>
                  <span className="text-zinc-400">{stats.difficulty_breakdown.Hard} solved</span>
                </div>
                <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-600 to-rose-500 transition-all duration-500" 
                    style={{ width: `${Math.min(100, (stats.difficulty_breakdown.Hard / Math.max(1, stats.solved_count)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Link
                href="/dsa"
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#d4af37] hover:text-[#f6e05e]"
              >
                Go to DSA Battlefield Sheet
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* History Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Attendance Logs */}
            <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-5 shadow-md glass-panel">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-4 border-b border-zinc-900 pb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#d4af37]" />
                Attendance Logs
              </h3>
              
              {stats.attendance_history.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  No attendance marked yet. Present your QR code at the daily scanner!
                </div>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {stats.attendance_history.map((date, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between rounded border border-zinc-900 bg-zinc-900/40 p-2.5 text-xs"
                    >
                      <span className="font-medium text-zinc-300">{date}</span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <UserCheck className="h-3 w-3" />
                        PRESENT
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CodeChef Wednesday Logs */}
            <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-5 shadow-md glass-panel">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-4 border-b border-zinc-900 pb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#d4af37]" />
                Wednesday Contest History
              </h3>
              
              {stats.codechef_history.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  No Wednesday CodeChef history logged yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {stats.codechef_history.map((cc, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between rounded border border-zinc-900 bg-zinc-900/40 p-2.5 text-xs"
                    >
                      <span className="font-medium text-zinc-300">CodeChef Contest (Week {cc.week})</span>
                      <span 
                        className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          cc.status === 'attended' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {cc.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
          </>
          ) : (
            <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-6 shadow-md glass-panel">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-5 border-b border-zinc-900 pb-3 flex items-center gap-2">
                <Trophy className="h-4.5 w-4.5 text-[#d4af37]" />
                Global Solver Rankings
              </h3>
              
              {leaderboardLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="mx-auto h-8 w-8 text-[#d4af37] animate-spin mb-2" />
                  <span className="text-xs text-zinc-550 uppercase tracking-wider">Syncing Leaderboard Ranks...</span>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-12 text-zinc-550 text-xs">
                  No warriors on the leaderboard yet. Solve problems to enlist!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-900 text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                        <th className="py-3 px-4 text-center w-16">Rank</th>
                        <th className="py-3 px-4">Warrior Name</th>
                        <th className="py-3 px-4">Roll Number</th>
                        <th className="py-3 px-4 text-center">Problems Solved</th>
                        <th className="py-3 px-4 text-center">Daily Streak</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/50 text-xs">
                      {leaderboard.map((row) => {
                        const isMe = row.roll_number === student.roll_number;
                        return (
                          <tr 
                            key={row.id} 
                            className={`transition-colors hover:bg-zinc-900/20 ${isMe ? 'bg-[#d4af37]/5 border-y border-[#d4af37]/25' : ''}`}
                          >
                            <td className="py-3 px-4 text-center font-bold">
                              {row.rank === 1 ? (
                                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#d4af37] text-black font-extrabold text-[10px]" title="First Rank">1</span>
                              ) : row.rank === 2 ? (
                                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-zinc-400 text-black font-extrabold text-[10px]" title="Second Rank">2</span>
                              ) : row.rank === 3 ? (
                                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-700 text-white font-extrabold text-[10px]" title="Third Rank">3</span>
                              ) : (
                                <span className="text-zinc-400 font-mono">#{row.rank}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-semibold text-zinc-200">
                              {row.full_name} {isMe && <span className="ml-1 text-[9px] bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 px-1.5 py-0.5 rounded-full font-bold uppercase">You</span>}
                            </td>
                            <td className="py-3 px-4 font-mono text-zinc-400">{row.roll_number}</td>
                            <td className="py-3 px-4 text-center font-bold text-zinc-200">{row.solved_count}</td>
                            <td className="py-3 px-4 text-center font-bold text-orange-400">
                              <span className="inline-flex items-center gap-1">
                                {row.streak}
                                <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
