'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy, ChevronRight, Clock, FileText, Download,
  Users, ExternalLink, X, Loader2, AlertCircle, Calendar, ArrowLeft,
  BookOpen, Star, Globe, MapPin, Search, CheckCircle, Lock,
  ChevronLeft, ChevronDown, ChevronUp, Building2
} from 'lucide-react';
import { apiRequest, getAuthToken } from '@/utils/api';

const REGISTRATION_DEADLINE = new Date('2026-08-20T20:20:00+05:30');
const PS_SELECTION_DEADLINE = new Date('2026-08-24T19:00:00+05:30'); // 24 Aug 2026, 7:00 PM IST

const ROADMAP_STEPS = [
  {
    num: 1, title: 'Team Registration', dates: '13 Aug – 20 Aug 2026',
    deadline: '20 Aug 2026, 8:20 PM',
    desc: 'Teams of 6 members register through the Chakravyuha portal. Each team must include at least one woman member.',
    status: 'done', icon: '📋', color: '#d4af37',
  },
  {
    num: 2, title: 'Problem Statement Selection', dates: 'By 24 Aug 2026',
    deadline: '24 Aug 2026',
    desc: 'Registered teams choose their preferred problem statements from the available PS list.',
    status: 'current', icon: '🎯', color: '#818cf8',
  },
  {
    num: 3, title: 'Round 1 — PPT Evaluation', dates: '29 Aug 2026',
    deadline: '29 Aug 2026',
    desc: 'Internal hackathon. Teams present their solution through a structured PPT presentation to a panel of evaluators.',
    status: 'upcoming', icon: '🖥️', color: '#34d399',
  },
  {
    num: 4, title: 'National Nomination', dates: 'After Round 1',
    deadline: 'Post Evaluation',
    desc: 'Top 45 teams (5 teams waitlisted) nominated to represent Chakravyuha nationally (Total 50 teams).',
    status: 'upcoming', icon: '🏆', color: '#fb923c',
  },
  {
    num: 5, title: 'SIH 2026 Grand Finale', dates: 'Dec 2026',
    deadline: 'National Level',
    desc: 'Nominated teams participate in the Smart India Hackathon 2026 Grand Finale — a 36-hour national-level hackathon.',
    status: 'upcoming', icon: '🚀', color: '#f472b6',
  },
];

type PSItem = {
  id: number;
  ps_id: number;
  ps_number: string;
  title: string;
  organization: string;
  category: string | null;
  theme: string | null;
  description: string | null;
};

type ActiveTab = 'home' | 'ps';

function PSSelectionCountdown() {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calc = () => {
      const diff = PS_SELECTION_DEADLINE.getTime() - new Date().getTime();
      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft(null);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds });
      setIsExpired(false);
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border border-indigo-950/30 bg-indigo-950/10 p-5 text-center max-w-2xl mx-auto space-y-2 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#818cf8] to-transparent animate-pulse" />
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#818cf8]">
        Smart India Hackathon 2026 — Problem Statement Selection Deadline
      </p>
      {isExpired ? (
        <p className="text-xl font-black text-rose-500 tracking-wider">PS SELECTION CLOSED</p>
      ) : timeLeft ? (
        <div className="flex items-center justify-center gap-4 text-white">
          <div className="text-center">
            <span className="text-2xl font-black font-mono">{timeLeft.days}</span>
            <span className="block text-[8px] font-bold text-zinc-500 uppercase">Days</span>
          </div>
          <span className="text-xl font-bold text-zinc-600">:</span>
          <div className="text-center">
            <span className="text-2xl font-black font-mono">{timeLeft.hours.toString().padStart(2, '0')}</span>
            <span className="block text-[8px] font-bold text-zinc-500 uppercase">Hours</span>
          </div>
          <span className="text-xl font-bold text-zinc-600">:</span>
          <div className="text-center">
            <span className="text-2xl font-black font-mono">{timeLeft.minutes.toString().padStart(2, '0')}</span>
            <span className="block text-[8px] font-bold text-zinc-500 uppercase">Mins</span>
          </div>
          <span className="text-xl font-bold text-zinc-600">:</span>
          <div className="text-center">
            <span className="text-2xl font-black font-mono">{timeLeft.seconds.toString().padStart(2, '0')}</span>
            <span className="block text-[8px] font-bold text-zinc-500 uppercase">Secs</span>
          </div>
        </div>
      ) : (
        <div className="animate-pulse text-zinc-500 text-sm">Calculating...</div>
      )}
      <p className="text-[10px] text-zinc-500">Closes on 24 Aug 2026, 7:00 PM IST</p>
    </div>
  );
}

function ComingSoonModal({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: '#0a0900', border: '1px solid rgba(212,175,55,0.25)', boxShadow: '0 0 60px rgba(212,175,55,0.08)' }}
      >
        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#d4af37,#8c7030,#d4af37)' }} />
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition">
          <X className="h-4 w-4" />
        </button>
        <div className="p-8 text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <h2 className="text-lg font-extrabold font-serif text-white">{title}</h2>
          <p className="text-sm text-zinc-400">This section will be unlocked soon. Check back after PS selection closes on 24 Aug 2026.</p>
          <button onClick={onClose} className="mt-2 px-6 py-2 rounded-lg border border-[#d4af37]/30 text-[#d4af37] text-xs font-bold uppercase tracking-wider hover:bg-[#d4af37]/10 transition">Got it</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmPSModal({ ps, onConfirm, onCancel, loading }: { ps: PSItem; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(16px)' }}>
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden" style={{ background: '#0a0900', border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 0 80px rgba(212,175,55,0.1)' }}>
        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#d4af37,#8c7030,#d4af37)' }} />
        <div className="p-7 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 bg-amber-950/30 border border-[#d4af37]/30">⚠️</div>
            <div>
              <h2 className="text-base font-extrabold text-white">Confirm Problem Statement</h2>
              <p className="text-xs text-zinc-400 mt-1">This action <strong className="text-red-400">cannot be undone</strong>. Your team&apos;s PS selection will be permanently locked.</p>
            </div>
          </div>
          <div className="rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5 p-4 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]">{ps.ps_number}</p>
            <p className="text-sm font-bold text-white leading-snug">{ps.title}</p>
            <p className="text-xs text-zinc-400">{ps.organization}</p>
            {ps.theme && (
              <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-950/40 border border-indigo-800/40 text-indigo-300">{ps.theme}</span>
            )}
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Are you sure you want to select <strong className="text-white">{ps.ps_number}</strong> as your team&apos;s Problem Statement? Once confirmed, this <strong className="text-red-400">cannot be changed</strong>.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel} disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider hover:border-zinc-500 hover:text-white transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm} disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#d4af37,#8c7030)', color: '#000' }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {loading ? 'Confirming...' : 'Yes, Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PSTab({ teamData }: { teamData: any }) {
  const [myPS, setMyPS] = useState<any | null | undefined>(undefined);
  const [psList, setPsList] = useState<PSItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loadingPS, setLoadingPS] = useState(false);
  const [selectedPS, setSelectedPS] = useState<PSItem | null>(null);
  const [expandedPS, setExpandedPS] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const LIMIT = 15;
  const isLeader = teamData?.is_leader === true;

  // Deadline check: 24 Aug 2026, 7:00 PM IST
  const isDeadlinePassed = new Date() >= PS_SELECTION_DEADLINE;

  const fetchMyPS = useCallback(() => {
    apiRequest('/api/dsa/events/sih/my-ps')
      .then((data: any) => setMyPS(data.selection))
      .catch(() => setMyPS(null));
  }, []);

  useEffect(() => { fetchMyPS(); }, [fetchMyPS]);

  useEffect(() => {
    if (myPS !== undefined && myPS !== null) return;
    if (isDeadlinePassed) return;
    setLoadingPS(true);
    apiRequest(`/api/dsa/events/sih/ps-list?search=${encodeURIComponent(search)}&page=${page}&limit=${LIMIT}`)
      .then((data: any) => { setPsList(data.items); setTotal(data.total); })
      .catch((err: any) => setError(err.message))
      .finally(() => setLoadingPS(false));
  }, [search, page, myPS, isDeadlinePassed]);

  const handleSearch = () => { setSearch(searchInput.trim()); setPage(1); };

  const handleConfirmPS = async () => {
    if (!selectedPS) return;
    setConfirming(true);
    setError(null);
    try {
      await apiRequest('/api/dsa/events/sih/ps-select', {
        method: 'POST',
        body: JSON.stringify({ problem_statement_id: selectedPS.id }),
      });
      setSuccessMsg(`✅ ${selectedPS.ps_number} confirmed successfully!`);
      setConfirmModal(false);
      fetchMyPS();
    } catch (err: any) {
      setError(err.message || 'Failed to confirm PS. Please try again.');
      setConfirmModal(false);
    } finally {
      setConfirming(false);
    }
  };

  if (myPS === undefined) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 text-[#d4af37] animate-spin" /></div>;
  }

  // Confirmed PS view
  if (myPS !== null) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl overflow-hidden shadow-2xl transition-all duration-300" style={{ border: '1px solid rgba(52,211,153,0.3)', background: 'linear-gradient(135deg,rgba(5,25,15,0.95),rgba(3,15,8,0.98))' }}>
          <div className="h-[4px]" style={{ background: 'linear-gradient(90deg,#10b981,#34d399,#10b981)' }} />
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center shadow-lg shadow-emerald-950/50">
                <Lock className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">PS Confirmed & Locked</p>
                <p className="text-lg font-black text-white">Your team&apos;s selected Problem Statement</p>
              </div>
              <span className="ml-auto px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 shadow-md">✓ Confirmed</span>
            </div>
            
            <div className="rounded-xl border border-emerald-805/20 bg-emerald-950/20 p-4 flex items-start gap-3 shadow-inner">
              <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-300 leading-relaxed font-semibold">
                Your team has successfully confirmed a Problem Statement and is eligible for the Internal Hackathon. Prepare your presentation slide deck using the official format below!
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-6 space-y-3 shadow-xl">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37]">{myPS.ps_number}</span>
              <h3 className="text-xl font-extrabold text-white leading-snug">{myPS.title}</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-2">
                <Building2 className="h-4 w-4 text-[#d4af37] flex-shrink-0" />
                <span className="font-semibold text-zinc-300">{myPS.organization}</span>
              </div>
              <div className="flex gap-2.5 mt-3 flex-wrap">
                {myPS.category && (
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded ${myPS.category === 'Software' ? 'bg-sky-950/60 border border-sky-800/40 text-sky-400' : 'bg-purple-950/60 border border-purple-800/40 text-purple-400'}`}>
                    {myPS.category}
                  </span>
                )}
                {myPS.theme && <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-zinc-800/60 border border-zinc-700/40 text-zinc-300">{myPS.theme}</span>}
              </div>
            </div>

            {myPS.description && (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Problem Description</p>
                <div className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/20 p-4 rounded-xl border border-zinc-900/60 max-h-80 overflow-y-auto pr-2 scrollbar-thin">
                  {myPS.description.split('\n').map((para: string, pIdx: number) => (
                    <p key={pIdx} className={pIdx > 0 ? 'mt-2' : ''}>{para}</p>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-zinc-500 pt-3 border-t border-zinc-900/80">
              <Calendar className="h-4 w-4 text-zinc-600" />
              <span>Confirmed on {new Date(myPS.selected_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              {myPS.last_edited_by_admin && (
                <span className="ml-2 px-2 py-0.5 rounded text-[8px] font-black uppercase bg-blue-950/60 border border-blue-800/40 text-blue-400">Admin Override</span>
              )}
            </div>
          </div>
        </div>
        <p className="text-xs text-zinc-600 text-center">🔒 PS selection is final and cannot be changed. Contact admin if there&apos;s an issue.</p>
      </div>
    );
  }

  // Deadline passed and NO PS selected
  if (isDeadlinePassed && myPS === null) {
    return (
      <div className="rounded-2xl border border-rose-950/50 bg-rose-950/10 p-8 text-center space-y-4 max-w-2xl mx-auto shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-rose-950/30 border border-rose-900/40 flex items-center justify-center mx-auto text-3xl shadow-lg">❌</div>
        <h2 className="text-xl font-extrabold text-white font-serif tracking-wide">Selection Window Closed</h2>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
          The Problem Statement selection deadline (24 Aug 2026, 7:00 PM IST) has passed. 
          Your team did not select a Problem Statement in time. 
          Therefore, your team is <strong className="text-rose-400">NOT eligible</strong> to participate in the Internal Hackathon.
        </p>
        <div className="pt-2">
          <span className="px-4 py-2 rounded-xl text-xs font-black uppercase bg-rose-950/30 border border-rose-900/40 text-rose-400 shadow-md">Not Eligible</span>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      {!isLeader && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-900/30 bg-amber-950/15 p-4 shadow-md">
          <AlertCircle className="h-4 w-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-400">Only the <strong className="text-[#d4af37]">Team Leader</strong> can select the Problem Statement. You can browse the list below.</p>
        </div>
      )}
      {successMsg && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4 shadow-md">
          <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-300 font-semibold">{successMsg}</p>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-900/40 bg-rose-950/20 p-4 shadow-md">
          <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      {/* Modern Search bar */}
      <div className="flex gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-[#d4af37] transition" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by PS ID, title, organization or theme..."
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-zinc-900/40 border border-zinc-800/50 text-white placeholder-zinc-600 focus:outline-none focus:border-[#d4af37]/60 focus:bg-zinc-900/60 transition shadow-inner"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-6 py-3 rounded-xl border border-zinc-700 bg-zinc-900/60 text-white text-xs font-black uppercase tracking-wider hover:border-[#d4af37] hover:bg-[#d4af37]/5 transition shadow-md active:scale-95"
        >
          Search
        </button>
        {search && (
          <button
            onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
            className="px-3.5 py-3 rounded-xl border border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:text-white transition hover:border-zinc-500"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
        <span>{total} problem statements {search && `matching "${search}"`}</span>
        {selectedPS && <span className="text-[#d4af37] font-bold">Selected: {selectedPS.ps_number}</span>}
      </div>

      {/* PS Cards List */}
      {loadingPS ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 text-[#d4af37] animate-spin" /></div>
      ) : psList.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 text-sm border border-zinc-900 rounded-2xl bg-zinc-950/20">No problem statements found.</div>
      ) : (
        <div className="space-y-3">
          {psList.map(ps => {
            const isSelected = selectedPS?.id === ps.id;
            const isExpanded = expandedPS === ps.id;
            return (
              <div
                key={ps.id}
                onClick={() => isLeader && setSelectedPS(isSelected ? null : ps)}
                className="rounded-2xl transition-all duration-300 relative overflow-hidden"
                style={{
                  border: `1px solid ${isSelected ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.04)'}`,
                  background: isSelected ? 'linear-gradient(135deg, rgba(25,20,5,0.85), rgba(15,10,0,0.92))' : 'rgba(10,10,10,0.3)',
                  boxShadow: isSelected ? '0 8px 30px rgba(212,175,55,0.06)' : 'none',
                  cursor: isLeader ? 'pointer' : 'default',
                }}
              >
                {isSelected && (
                  <div className="absolute top-0 left-0 bottom-0 w-[3px]" style={{ background: 'linear-gradient(180deg,#d4af37,#8c7030)' }} />
                )}
                <div className="p-5 flex items-start gap-4">
                  {isLeader && (
                    <div
                      className="flex-shrink-0 mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-md"
                      style={{ borderColor: isSelected ? '#d4af37' : '#3f3f46', background: isSelected ? '#d4af37' : 'transparent' }}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-black" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]">{ps.ps_number}</span>
                      {ps.category && (
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${ps.category === 'Software' ? 'bg-sky-950/60 border border-sky-900/40 text-sky-400' : 'bg-purple-950/60 border border-purple-900/40 text-purple-400'}`}>
                          {ps.category}
                        </span>
                      )}
                      {ps.theme && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-zinc-800/40 border border-zinc-700/40 text-zinc-400">{ps.theme}</span>}
                    </div>
                    <p className="text-base font-extrabold text-white leading-snug group-hover:text-[#d4af37] transition">{ps.title}</p>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-[#d4af37] flex-shrink-0" />
                      <span className="font-semibold">{ps.organization}</span>
                    </p>
                    
                    {isExpanded && ps.description && (
                      <div className="text-xs text-zinc-300 leading-relaxed mt-4 bg-zinc-950/30 p-4 rounded-xl border border-zinc-900/60 shadow-inner max-h-96 overflow-y-auto pr-2 scrollbar-thin">
                        <p className="text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-2">Detailed Description</p>
                        {ps.description.split('\n').map((para: string, pIdx: number) => (
                          <p key={pIdx} className={pIdx > 0 ? 'mt-2' : ''}>{para}</p>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setExpandedPS(isExpanded ? null : ps.id); }}
                    className="flex-shrink-0 p-1.5 rounded-lg border border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-800/40 transition-all mt-0.5"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 disabled:opacity-30 transition shadow-sm bg-zinc-900/20"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-zinc-400 font-bold font-mono">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-xl border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 disabled:opacity-30 transition shadow-sm bg-zinc-900/20"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Sticky confirm button */}
      {isLeader && selectedPS && (
        <div className="sticky bottom-6 flex justify-center pt-4 z-20">
          <button
            onClick={() => setConfirmModal(true)}
            className="flex items-center gap-2.5 px-10 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider shadow-2xl transition hover:scale-105 active:scale-95 duration-200"
            style={{ background: 'linear-gradient(135deg,#d4af37,#8c7030)', color: '#000', boxShadow: '0 10px 40px rgba(212,175,55,0.45)' }}
          >
            <CheckCircle className="h-5 w-5" />
            Confirm Selection: {selectedPS.ps_number}
          </button>
        </div>
      )}

      {confirmModal && selectedPS && (
        <ConfirmPSModal ps={selectedPS} onConfirm={handleConfirmPS} onCancel={() => setConfirmModal(false)} loading={confirming} />
      )}
    </div>
  );
}

export default function SihDashboard() {
  const router = useRouter();
  const [teamData, setTeamData] = useState<any>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [comingSoonModal, setComingSoonModal] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(2);
  const [registrationClosed] = useState(new Date() >= REGISTRATION_DEADLINE);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) { router.push('/'); return; }
    apiRequest('/api/dsa/events/sih/my-team')
      .then((data: any) => setTeamData(data))
      .catch((err: any) => {
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('not found') || msg.includes('no team') || msg.includes('not registered') || msg.includes('404')) {
          router.push('/events');
        } else {
          setTeamError(err.message || 'Failed to load team data.');
        }
      })
      .finally(() => setLoadingTeam(false));
  }, [router]);

  if (loadingTeam) {
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-[#d4af37] animate-spin mx-auto" />
          <p className="text-sm text-zinc-500 font-medium">Loading your SIH dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-950/10 rounded-full blur-[120px] pointer-events-none" />
      <nav className="sticky top-0 z-50 border-b border-zinc-900/80 backdrop-blur-xl" style={{ background: 'rgba(5,4,0,0.92)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/events')} className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-white/5 transition">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="h-4 w-px bg-zinc-800" />
              <Trophy className="h-5 w-5 text-[#d4af37]" />
              <div>
                <p className="text-[10px] text-zinc-500 leading-none font-bold uppercase tracking-widest">Smart India Hackathon</p>
                <p className="text-sm font-extrabold text-white leading-none font-serif">SIH 2026 Internal</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-1">
              {(['home', 'ps'] as ActiveTab[]).map(t => (
                <button key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${activeTab === t ? 'text-[#d4af37] border-b-2 border-[#d4af37]/70' : 'text-zinc-400 hover:text-white'}`}
                >
                  {t === 'home' ? 'Home' : 'Problem Statements'}
                </button>
              ))}
              <button
                onClick={() => setComingSoonModal('Internal Hackathon — Panel & Room Allocation')}
                className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition"
              >
                Internal Hackathon
              </button>
            </div>
            {registrationClosed ? (
              <span className="px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-950/20 border border-red-900/40 text-red-400">Registrations Closed</span>
            ) : (
              <span className="px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950/20 border border-emerald-900/40 text-emerald-400">Registered</span>
            )}
          </div>
        </div>
        <div className="md:hidden flex overflow-x-auto border-t border-zinc-900/40 px-4">
          {(['home', 'ps'] as ActiveTab[]).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-shrink-0 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition ${activeTab === t ? 'text-[#d4af37] border-b-2 border-[#d4af37]/70' : 'text-zinc-500 hover:text-white'}`}
            >
              {t === 'home' ? 'Home' : 'Problem Statements'}
            </button>
          ))}
          <button onClick={() => setComingSoonModal('Internal Hackathon')} className="flex-shrink-0 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition">Hackathon</button>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 relative z-10">
        
        {/* Countdown Banner */}
        <PSSelectionCountdown />

        {activeTab === 'home' && (
          <>
            <div className="text-center space-y-3">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#818cf8] px-3 py-1 rounded-full border border-[#818cf8]/20 bg-[#818cf8]/5">Phase 02: PS Selection — Active</span>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-white tracking-wide">Chakravyuha SIH 2026 Selection Roadmap</h1>
              <p className="text-sm text-zinc-400 max-w-2xl mx-auto">Follow the complete journey from team registration to the SIH Grand Finale</p>
            </div>
            <section className="space-y-3">
              {ROADMAP_STEPS.map((step) => {
                const isOpen = expandedStep === step.num;
                const isDone = step.status === 'done';
                return (
                  <div key={step.num} className="rounded-xl overflow-hidden transition-all" style={{ border: `1px solid ${isOpen ? step.color + '40' : isDone ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)'}`, background: isOpen ? 'rgba(20,16,0,0.6)' : isDone ? 'rgba(5,20,10,0.4)' : 'rgba(10,10,10,0.4)' }}>
                    <button onClick={() => setExpandedStep(isOpen ? null : step.num)} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition">
                      <div className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-xl" style={{ background: step.color + '18', border: `1px solid ${step.color}40` }}>
                        {isDone ? '✅' : step.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: step.color }}>Step {step.num}</span>
                          {isDone && <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-900/30 text-emerald-400">Completed</span>}
                          {step.status === 'current' && <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-950/40 border border-indigo-800/30 text-indigo-300">Current Phase</span>}
                        </div>
                        <p className="text-sm font-extrabold text-white">{step.title}</p>
                        <p className="text-[11px] text-zinc-500">{step.dates}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-600 flex-shrink-0 transition-transform" style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }} />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 border-t border-white/[0.04]">
                        <div className="grid sm:grid-cols-2 gap-4 items-start">
                          <p className="text-sm text-zinc-300 leading-relaxed">{step.desc}</p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                              <Calendar className="h-3.5 w-3.5 flex-shrink-0" style={{ color: step.color }} />
                              <span><strong className="text-white">Timeline:</strong> {step.dates}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                              <Clock className="h-3.5 w-3.5 flex-shrink-0" style={{ color: step.color }} />
                              <span><strong className="text-white">Deadline:</strong> {step.deadline}</span>
                            </div>
                            {step.status === 'current' && (
                              <button onClick={() => setActiveTab('ps')} className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 hover:bg-indigo-900/40 transition">
                                <BookOpen className="h-3 w-3" />
                                Select Problem Statement →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
            <section>
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.2)', background: 'linear-gradient(135deg, rgba(20,16,0,0.8), rgba(10,8,0,0.9))' }}>
                <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#d4af37,#8c7030,#d4af37)' }} />
                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d4af37]">Your Team Status</p>
                      <h2 className="text-xl font-extrabold font-serif text-white mt-0.5">Registered Team Details</h2>
                    </div>
                    <span className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950/40 border border-emerald-900/40 text-emerald-400">Confirmed</span>
                  </div>
                  {teamError ? (
                    <div className="flex items-start gap-2 rounded-lg border border-rose-950 bg-rose-950/20 p-3 text-sm text-rose-300"><AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /><span>{teamError}</span></div>
                  ) : !teamData ? (
                    <div className="py-6 text-center text-zinc-500 text-sm">Team data unavailable.</div>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3 pb-4 border-b border-zinc-900/60">
                        <Users className="h-5 w-5 text-[#d4af37]" />
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Team Name</p>
                          <p className="text-lg font-extrabold text-white">{teamData.team_name}</p>
                        </div>
                        {teamData.created_at && (
                          <div className="ml-auto text-right">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Registered On</p>
                            <p className="text-xs text-zinc-300 font-semibold">{new Date(teamData.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          </div>
                        )}
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-zinc-900/60">
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="border-b border-zinc-900 bg-zinc-900/20">
                              <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-zinc-500">Role</th>
                              <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-zinc-500">Name</th>
                              <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-zinc-500">Roll No.</th>
                              <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-zinc-500">Branch / Year</th>
                              <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-zinc-500">Gender</th>
                            </tr>
                          </thead>
                           <tbody className="divide-y divide-zinc-900/40 text-zinc-300">
                            {(() => {
                              const allMembers = [
                                ...(teamData.leader ? [{ ...teamData.leader, is_leader: true }] : []),
                                ...(teamData.members || []).map((m: any) => ({ ...m, is_leader: false }))
                              ];
                              return allMembers.map((m: any, idx: number) => (
                                <tr key={idx} className="hover:bg-zinc-900/10">
                                  <td className="py-2.5 px-3">
                                    {m.is_leader ? (
                                      <span className="px-1.5 py-0.5 rounded bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] text-[8px] font-black uppercase">
                                        Leader
                                      </span>
                                    ) : (
                                      <span className="text-zinc-500 text-[9px] font-medium">Member</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-white">{m.full_name}</td>
                                  <td className="py-2.5 px-3 font-mono text-zinc-400">{m.roll_number}</td>
                                  <td className="py-2.5 px-3">{m.branch} — Yr {m.study_year}</td>
                                  <td className="py-2.5 px-3">
                                    {m.gender === 'Woman' ? (
                                      <span className="text-rose-400 font-semibold">Woman</span>
                                    ) : (
                                      <span className="text-blue-400 font-semibold">Man</span>
                                    )}
                                  </td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                      {!registrationClosed && (
                        <div className="flex justify-end items-center gap-3">
                          {teamData.is_leader ? (
                            <button onClick={() => router.push('/events')} className="px-4 py-2 rounded border border-zinc-800 hover:border-[#d4af37]/40 text-white text-xs font-bold uppercase tracking-wider transition">Edit Team Details</button>
                          ) : (
                            <span className="text-[11px] text-zinc-500 italic">🔒 Only Team Leader can edit details</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
            <section className="grid md:grid-cols-2 gap-8">
              <div className="rounded-2xl border border-zinc-900/60 bg-zinc-950/40 p-6 space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d4af37] mb-1">About</p>
                  <h2 className="text-lg font-extrabold font-serif text-white">Chakravyuha SIH Internal Hackathon</h2>
                </div>
                <p className="text-sm text-[#d4af37]/80 leading-relaxed">Chakravyuha Coding Club conducts internal evaluation rounds to identify top software and hardware teams to represent the institution at Smart India Hackathon 2026.</p>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-white mb-3">Key Evaluation Pillars</p>
                  <ul className="space-y-2">
                    {['Novelty & Technical Feasibility','Impact & Practical Utility','Working Prototype / Demo Depth','Presentation & Defense Quality'].map(p => (
                      <li key={p} className="flex items-start gap-2 text-sm text-zinc-300"><Star className="h-3.5 w-3.5 text-[#d4af37] flex-shrink-0 mt-0.5" />{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-900/60 bg-zinc-950/40 p-6 space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d4af37] mb-1">Resources</p>
                  <h2 className="text-lg font-extrabold font-serif text-white">Official SIH National Resources</h2>
                </div>
                <p className="text-sm text-zinc-400">Access official documentation and templates:</p>
                <div className="space-y-3">
                  <a href="/SIH%202026%20Guidelines.pdf" download="SIH_2026_Guidelines.pdf" className="flex items-center justify-between gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/5 transition group" style={{ border: '1px solid rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.04)' }}>
                    <div className="flex items-center gap-3"><FileText className="h-4 w-4 text-[#d4af37] flex-shrink-0" /><span className="text-left text-xs">Download Official SIH 2026 Guidelines (PDF)</span></div>
                    <Download className="h-3.5 w-3.5 text-zinc-500 group-hover:text-[#d4af37] transition flex-shrink-0" />
                  </a>
                  <a href="/SIH2026_Internal_Hackathon_Instructions.pdf" download="SIH2026_Internal_Hackathon_Instructions.pdf" className="flex items-center justify-between gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/5 transition group" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-3"><FileText className="h-4 w-4 text-emerald-400 flex-shrink-0" /><span className="text-left text-xs">Download Internal Hackathon Instructions (PDF)</span></div>
                    <Download className="h-3.5 w-3.5 text-zinc-500 group-hover:text-emerald-400 transition flex-shrink-0" />
                  </a>
                  <a href="/SIH2026-IDEA-Presentation-Format.pptx" download="SIH2026-IDEA-Presentation-Format.pptx" className="flex items-center justify-between gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/5 transition group" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-3"><FileText className="h-4 w-4 text-purple-400 flex-shrink-0" /><span className="text-left text-xs">Download Official Idea PPT Format (.pptx)</span></div>
                    <Download className="h-3.5 w-3.5 text-zinc-500 group-hover:text-purple-400 transition flex-shrink-0" />
                  </a>
                  <a href="https://sih.gov.in" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/5 transition group" style={{ border: '1px solid rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.04)' }}>
                    <div className="flex items-center gap-3"><Globe className="h-4 w-4 text-blue-400 flex-shrink-0" /><span className="text-left text-xs">Visit Official National Portal (sih.gov.in)</span></div>
                    <ExternalLink className="h-3.5 w-3.5 text-zinc-500 group-hover:text-blue-400 transition flex-shrink-0" />
                  </a>
                </div>
              </div>
            </section>
            <section className="md:hidden grid grid-cols-2 gap-4">
              <button onClick={() => setActiveTab('ps')} className="flex flex-col items-center gap-3 p-5 rounded-xl border border-indigo-900/40 bg-indigo-950/10 hover:border-indigo-700 transition">
                <BookOpen className="h-6 w-6 text-indigo-400" />
                <div className="text-center"><p className="text-xs font-black text-white uppercase tracking-wider">Problem Statements</p><p className="text-[10px] text-indigo-400 mt-0.5">Select Now →</p></div>
              </button>
              <button onClick={() => setComingSoonModal('Internal Hackathon — Panel & Room Allocation')} className="flex flex-col items-center gap-3 p-5 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-700 transition">
                <MapPin className="h-6 w-6 text-purple-400" />
                <div className="text-center"><p className="text-xs font-black text-white uppercase tracking-wider">Internal Hackathon</p><p className="text-[10px] text-zinc-500 mt-0.5">Panel & Room — Soon</p></div>
              </button>
            </section>
            <div className="text-center pb-4"><p className="text-[11px] text-zinc-600">SIH 2026 Internal Selection · Chakravyuha Coding Club</p></div>
          </>
        )}
        {activeTab === 'ps' && (
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#818cf8]">Phase 02 · Active</p>
              <h1 className="text-2xl font-extrabold font-serif text-white mt-1">Problem Statement Selection</h1>
              <p className="text-sm text-zinc-400 mt-1">Browse all official SIH 2026 problem statements. {teamData?.is_leader ? 'Select one and confirm — this cannot be changed.' : 'Only the Team Leader can confirm a selection.'}</p>
            </div>
            <PSTab teamData={teamData} />
          </div>
        )}
      </div>
      {comingSoonModal && <ComingSoonModal title={comingSoonModal} onClose={() => setComingSoonModal(null)} />}
    </div>
  );
}
