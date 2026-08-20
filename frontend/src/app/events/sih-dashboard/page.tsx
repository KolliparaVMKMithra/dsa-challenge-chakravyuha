'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy, ChevronRight, Clock, FileText, Download,
  Users, ExternalLink, X, Loader2, AlertCircle, Calendar, ArrowLeft,
  BookOpen, Star, Globe, MapPin
} from 'lucide-react';
import { apiRequest, getAuthToken } from '@/utils/api';

const REGISTRATION_DEADLINE = new Date('2026-08-20T19:00:00+05:30');

const ROADMAP_STEPS = [
  {
    num: 1,
    title: 'Team Registration',
    dates: '13 Aug – 20 Aug 2026',
    deadline: '20 Aug 2026, 7:00 PM',
    desc: 'Teams of 6 members register through the Chakravyuha portal. Each team must include at least one woman member.',
    status: 'current',
    icon: 'ICON_1',
    color: '#d4af37',
  },
  {
    num: 2,
    title: 'Problem Statement Selection',
    dates: 'By 24 Aug 2026',
    deadline: '24 Aug 2026',
    desc: 'Registered teams choose their preferred problem statements from the available PS list.',
    status: 'upcoming',
    icon: 'ICON_2',
    color: '#818cf8',
  },
  {
    num: 3,
    title: 'Round 1 — PPT Evaluation',
    dates: '29 Aug 2026',
    deadline: '29 Aug 2026',
    desc: 'Internal hackathon. Teams present their solution through a structured PPT presentation to a panel of evaluators.',
    status: 'upcoming',
    icon: 'ICON_3',
    color: '#34d399',
  },
  {
    num: 4,
    title: 'National Nomination',
    dates: 'After Round 1',
    deadline: 'Post Evaluation',
    desc: 'Top 45 teams (5 teams waitlisted) nominated to represent Chakravyuha nationally (Total 50 teams).',
    status: 'upcoming',
    icon: 'ICON_4',
    color: '#fb923c',
  },
  {
    num: 5,
    title: 'SIH 2026 Grand Finale',
    dates: 'Dec 2026',
    deadline: 'National Level',
    desc: 'Nominated teams participate in the Smart India Hackathon 2026 Grand Finale — a 36-hour national-level hackathon.',
    status: 'upcoming',
    icon: 'ICON_5',
    color: '#f472b6',
  },
];

const STEP_EMOJIS: Record<string, string> = {
  ICON_1: '📋', ICON_2: '🎯', ICON_3: '🖥️', ICON_4: '🏆', ICON_5: '🚀'
};

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
          <p className="text-sm text-zinc-400">This section will be unlocked after team registrations close and problem statements are assigned.</p>
          <p className="text-xs text-zinc-600">Check back after 24 Aug 2026.</p>
          <button
            onClick={onClose}
            className="mt-2 px-6 py-2 rounded-lg border border-[#d4af37]/30 text-[#d4af37] text-xs font-bold uppercase tracking-wider hover:bg-[#d4af37]/10 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SihDashboard() {
  const router = useRouter();
  const [teamData, setTeamData] = useState<any>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [comingSoonModal, setComingSoonModal] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [registrationClosed, setRegistrationClosed] = useState(new Date() >= REGISTRATION_DEADLINE);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) { router.push('/'); return; }
    apiRequest('/api/dsa/events/sih/my-team')
      .then(data => setTeamData(data))
      .catch(err => {
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('not found') || msg.includes('no team') || msg.includes('not registered') || msg.includes('404')) {
          router.push('/events');
        } else {
          setTeamError(err.message || 'Failed to load team data.');
        }
      })
      .finally(() => setLoadingTeam(false));
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRegistrationClosed(new Date() >= REGISTRATION_DEADLINE);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

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

      {/* Nav Bar */}
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
              <a href="#home" className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#d4af37] border-b-2 border-[#d4af37]/70">Home</a>
              <button onClick={() => setComingSoonModal('Problem Statements')} className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition">Problem Statements</button>
              <button onClick={() => setComingSoonModal('Internal Hackathon - Panel & Room Allocation')} className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition">Internal Hackathon</button>
            </div>
            {registrationClosed ? (
              <span className="px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-950/20 border border-red-900/40 text-red-400">Registrations Closed</span>
            ) : (
              <span className="px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950/20 border border-emerald-900/40 text-emerald-400">Registered</span>
            )}
          </div>
        </div>
      </nav>

      <div id="home" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14 relative z-10">

        {/* Hero */}
        <div className="text-center space-y-3">
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37] px-3 py-1 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5">Phase 01: Team Registration — Live</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-white tracking-wide">Chakravyuha SIH 2026 Selection Roadmap</h1>
          <p className="text-sm text-zinc-400 max-w-2xl mx-auto">Click any milestone to explore details and follow the complete journey to the SIH Grand Finale</p>
        </div>

        {/* Roadmap */}
        <section className="space-y-3">
          {ROADMAP_STEPS.map((step) => {
            const isOpen = expandedStep === step.num;
            return (
              <div key={step.num} className="rounded-xl overflow-hidden transition-all" style={{ border: `1px solid ${isOpen ? step.color + '40' : 'rgba(255,255,255,0.05)'}`, background: isOpen ? 'rgba(20,16,0,0.6)' : 'rgba(10,10,10,0.4)' }}>
                <button onClick={() => setExpandedStep(isOpen ? null : step.num)} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition">
                  <div className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-xl" style={{ background: step.color + '18', border: `1px solid ${step.color}40` }}>
                    {STEP_EMOJIS[step.icon]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: step.color }}>Step {step.num}</span>
                      {step.status === 'current' && (
                        <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-950/40 border border-[#d4af37]/30 text-[#d4af37]">Current Phase</span>
                      )}
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
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Team Status */}
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
                <div className="flex items-start gap-2 rounded-lg border border-rose-950 bg-rose-950/20 p-3 text-sm text-rose-300">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /><span>{teamError}</span>
                </div>
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
                        <p className="text-xs text-zinc-300 font-semibold">
                          {new Date(teamData.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
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
                        {teamData.members?.map((m: any, idx: number) => (
                          <tr key={idx} className="hover:bg-zinc-900/10">
                            <td className="py-2.5 px-3">
                              {m.is_leader ? (
                                <span className="px-1.5 py-0.5 rounded bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] text-[8px] font-black uppercase">Leader</span>
                              ) : (
                                <span className="text-zinc-500 text-[9px] font-medium">Member</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-white">{m.full_name}</td>
                            <td className="py-2.5 px-3 font-mono text-zinc-400">{m.roll_number}</td>
                            <td className="py-2.5 px-3">{m.branch} — Yr {m.study_year}</td>
                            <td className="py-2.5 px-3">
                              {m.gender === 'Woman' ? <span className="text-rose-400 font-semibold">Woman</span> : <span className="text-blue-400 font-semibold">Man</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!registrationClosed && (
                    <div className="flex justify-end items-center gap-3">
                      {teamData.is_leader ? (
                        <button onClick={() => router.push('/events')} className="px-4 py-2 rounded border border-zinc-800 hover:border-[#d4af37]/40 text-white text-xs font-bold uppercase tracking-wider transition">Edit Team Details</button>
                      ) : (
                        <span className="text-[11px] text-zinc-500 italic">🔒 Registered Member (Only Team Leader can edit details)</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 2-column: About + Resources */}
        <section className="grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-zinc-900/60 bg-zinc-950/40 p-6 space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d4af37] mb-1">About</p>
              <h2 className="text-lg font-extrabold font-serif text-white">Chakravyuha SIH Internal Hackathon</h2>
            </div>
            <p className="text-sm text-[#d4af37]/80 leading-relaxed">
              Chakravyuha Coding Club conducts internal evaluation rounds to identify top software and hardware teams to represent the institution at Smart India Hackathon 2026.
            </p>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-white mb-3">Key Evaluation Pillars</p>
              <ul className="space-y-2">
                {['Novelty & Technical Feasibility','Impact & Practical Utility','Working Prototype / Demo Depth','Presentation & Defense Quality'].map(p => (
                  <li key={p} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Star className="h-3.5 w-3.5 text-[#d4af37] flex-shrink-0 mt-0.5" />{p}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-900/60 bg-zinc-950/40 p-6 space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d4af37] mb-1">Resources</p>
              <h2 className="text-lg font-extrabold font-serif text-white">Official SIH National Resources</h2>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">Access official documentation, templates, and guidelines from sih.gov.in:</p>
            <div className="space-y-3">
              {/* PDF 1: SIH 2026 Guidelines */}
              <a
                href="/SIH%202026%20Guidelines.pdf"
                download="SIH_2026_Guidelines.pdf"
                className="flex items-center justify-between gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/5 transition group"
                style={{ border: '1px solid rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.04)' }}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-[#d4af37] flex-shrink-0" />
                  <span className="text-left text-xs">Download Official SIH 2026 Guidelines (PDF)</span>
                </div>
                <Download className="h-3.5 w-3.5 text-zinc-500 group-hover:text-[#d4af37] transition flex-shrink-0" />
              </a>

              {/* PDF 2: SIH 2026 Internal Hackathon Instructions */}
              <a
                href="/SIH2026_Internal_Hackathon_Instructions.pdf"
                download="SIH2026_Internal_Hackathon_Instructions.pdf"
                className="flex items-center justify-between gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/5 transition group"
                style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-left text-xs">Download Internal Hackathon Instructions (PDF)</span>
                </div>
                <Download className="h-3.5 w-3.5 text-zinc-500 group-hover:text-emerald-400 transition flex-shrink-0" />
              </a>

              {/* PPT 1: SIH 2026 Idea Presentation Format */}
              <a
                href="/SIH2026-IDEA-Presentation-Format.pptx"
                download="SIH2026-IDEA-Presentation-Format.pptx"
                className="flex items-center justify-between gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/5 transition group"
                style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-purple-400 flex-shrink-0" />
                  <span className="text-left text-xs">Download Official Idea PPT Format (.pptx)</span>
                </div>
                <Download className="h-3.5 w-3.5 text-zinc-500 group-hover:text-purple-400 transition flex-shrink-0" />
              </a>

              {/* External Portal Link */}
              <a
                href="https://sih.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/5 transition group"
                style={{ border: '1px solid rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.04)' }}
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <span className="text-left text-xs">Visit Official National Portal (sih.gov.in)</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-zinc-500 group-hover:text-blue-400 transition flex-shrink-0" />
              </a>
            </div>
          </div>
        </section>

        {/* Mobile nav quick buttons */}
        <section className="md:hidden grid grid-cols-2 gap-4">
          <button onClick={() => setComingSoonModal('Problem Statements')} className="flex flex-col items-center gap-3 p-5 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-700 transition">
            <BookOpen className="h-6 w-6 text-[#d4af37]" />
            <div className="text-center">
              <p className="text-xs font-black text-white uppercase tracking-wider">Problem Statements</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Coming Soon</p>
            </div>
          </button>
          <button onClick={() => setComingSoonModal('Internal Hackathon - Panel & Room Allocation')} className="flex flex-col items-center gap-3 p-5 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-700 transition">
            <MapPin className="h-6 w-6 text-purple-400" />
            <div className="text-center">
              <p className="text-xs font-black text-white uppercase tracking-wider">Internal Hackathon</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Panel & Room — Soon</p>
            </div>
          </button>
        </section>

        <div className="text-center pb-4">
          <p className="text-[11px] text-zinc-600">SIH 2026 Internal Selection · Chakravyuha Coding Club</p>
        </div>
      </div>

      {comingSoonModal && <ComingSoonModal title={comingSoonModal} onClose={() => setComingSoonModal(null)} />}
    </div>
  );
}

