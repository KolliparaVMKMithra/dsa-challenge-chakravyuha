'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Calendar, Sparkles, CheckCircle2, ChevronRight, Loader2, ShieldAlert, X, Flame, Timer, Clock, User, Mail, Phone, BookOpen, AlertCircle, Download } from 'lucide-react';
import { apiRequest, getAuthToken } from '@/utils/api';

interface EventData {
  id: number;
  name: string;
  description: string;
  status: string;
  is_registered: boolean;
  year_restricted: number | null;
}

interface StudentDetails {
  full_name: string;
  college_email: string;
  roll_number: string;
  phone_number: string;
  branch: string;
  year: number;
  qr_key: string;
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'rect' | 'circle' | 'triangle';
  life: number;
}

const COLORS = [
  '#d4af37', '#f6e05e', '#fbbf24', '#ef4444', '#ec4899',
  '#8b5cf6', '#3b82f6', '#10b981', '#f97316', '#ffffff',
];

function generateParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const fromLeft = Math.random() > 0.5;
    particles.push({
      id: i,
      x: fromLeft ? Math.random() * 12 : Math.random() * 100,
      y: fromLeft ? 60 + Math.random() * 40 : 88 + Math.random() * 12,
      vx: fromLeft ? 2.5 + Math.random() * 5 : (Math.random() - 0.5) * 4,
      vy: fromLeft ? -(3 + Math.random() * 7) : -(6 + Math.random() * 9),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 10,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
      shape: (['rect', 'circle', 'triangle'] as const)[Math.floor(Math.random() * 3)],
      life: 1,
    });
  }
  return particles;
}

function ConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particlesRef.current = particlesRef.current.filter(p => p.life > 0.01);

    for (const p of particlesRef.current) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.vx *= 0.99;
      p.rotation += p.rotationSpeed;
      p.life -= 0.012;
      p.opacity = p.life;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.translate((p.x / 100) * canvas.width, (p.y / 100) * canvas.height);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -p.size / 2);
        ctx.lineTo(p.size / 2, p.size / 2);
        ctx.lineTo(-p.size / 2, p.size / 2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    if (particlesRef.current.length > 0) {
      rafRef.current = requestAnimationFrame(draw);
    }
  }, []);

  useEffect(() => {
    if (active) {
      particlesRef.current = generateParticles(130);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-50"
    />
  );
}

// ─── Countdown Timer ───────────────────────────────────────────────────────────
const SIH_DATE = new Date('2026-08-29T00:00:00');
// Registration closes at 8:00 PM IST on 20 August 2026
const REGISTRATION_DEADLINE = new Date('2026-08-20T20:00:00+05:30');

function getTimeLeft() {
  const now = new Date();
  const diff = SIH_DATE.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative flex items-center justify-center rounded-xl font-black tabular-nums"
        style={{
          width: '78px',
          height: '78px',
          fontSize: '2.2rem',
          background: 'linear-gradient(135deg, #1a1400 0%, #0d0900 100%)',
          border: '1px solid rgba(212,175,55,0.3)',
          color: '#d4af37',
          boxShadow: '0 0 20px rgba(212,175,55,0.08), inset 0 1px 0 rgba(212,175,55,0.1)',
          fontFamily: 'monospace',
        }}
      >
        {String(value).padStart(2, '0')}
        <div className="absolute left-0 right-0 h-[1px] top-1/2" style={{ background: 'rgba(212,175,55,0.18)' }} />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{label}</span>
    </div>
  );
}

// ─── SIH Registration Modal ────────────────────────────────────────────────────
interface MemberState {
  full_name: string;
  college_email: string;
  personal_email: string;
  phone_number: string;
  study_year: number;
  branch: string;
  roll_number: string;
  gender: 'Woman' | 'Man' | '';
}

function SihRegistrationModal({ open, onClose, onSuccess, isEdit = false }: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isEdit?: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState(120);
  const [timerExpired, setTimerExpired] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [teamName, setTeamName] = useState('');
  const [leader, setLeader] = useState<MemberState>({
    full_name: '',
    college_email: '',
    personal_email: '',
    phone_number: '',
    study_year: 1,
    branch: 'CSE',
    roll_number: '',
    gender: ''
  });
  
  const [members, setMembers] = useState<MemberState[]>(
    Array.from({ length: 5 }, () => ({
      full_name: '',
      college_email: '',
      personal_email: '',
      phone_number: '',
      study_year: 1,
      branch: 'CSE',
      roll_number: '',
      gender: ''
    }))
  );

  const [activeTab, setActiveTab] = useState<number>(0); // 0 = Leader, 1..5 = Teammates
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null); setDone(false);
    
    if (isEdit) {
      setShowForm(true);
      setTimerExpired(true);
      setRulesAccepted(true);
      setActiveTab(0);
      setLoadingDetails(true);
      apiRequest('/api/dsa/events/sih/my-team')
        .then(data => {
          setTeamName(data.team_name || '');
          if (data.leader) setLeader(data.leader);
          if (data.members && data.members.length === 5) setMembers(data.members);
        })
        .catch(err => setErrorMsg(err.message || 'Failed to load existing team details.'))
        .finally(() => setLoadingDetails(false));
      return;
    }

    setShowForm(false); setRulesAccepted(false);
    setActiveTab(0); setLoadingDetails(true);
    setTeamName('');
    setMembers(Array.from({ length: 5 }, () => ({
      full_name: '',
      college_email: '',
      personal_email: '',
      phone_number: '',
      study_year: 1,
      branch: 'CSE',
      roll_number: '',
      gender: ''
    })));

    // Fetch Team Leader Details
    apiRequest('/api/dsa/events/my-details')
      .then(data => {
        setLeader(prev => ({
          ...prev,
          full_name: data.full_name || '',
          college_email: data.college_email || '',
          roll_number: data.roll_number || '',
          phone_number: data.phone_number || '',
          branch: data.branch || 'CSE',
          study_year: data.year || 1
        }));
      })
      .catch(err => console.error('Failed to pre-fill leader data', err))
      .finally(() => setLoadingDetails(false));

    // Persisted 3-minute Countdown Timer
    let startTime = localStorage.getItem('sih_timer_start');
    if (!startTime) {
      startTime = Date.now().toString();
      localStorage.setItem('sih_timer_start', startTime);
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - parseInt(startTime!, 10)) / 1000);
      const remaining = 120 - elapsed;
      if (remaining <= 0) {
        setTimeLeft(0);
        setTimerExpired(true);
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
        setTimerExpired(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [open, isEdit]);

  const handleMemberChange = (idx: number, field: keyof MemberState, value: any) => {
    const updated = [...members];
    updated[idx] = { ...updated[idx], [field]: value };
    setMembers(updated);
  };

  const handleLeaderChange = (field: keyof MemberState, value: any) => {
    setLeader(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    setActiveTab(prev => Math.min(prev + 1, 5));
  };

  const handlePrev = () => {
    setActiveTab(prev => Math.max(prev - 1, 0));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Client-side Validations
    if (!teamName.trim()) { setErrorMsg('Team Name is required.'); return; }
    if (!leader.full_name.trim()) { setErrorMsg('Team Leader Full Name is required.'); return; }
    if (!leader.personal_email.trim()) { setErrorMsg('Team Leader Personal Email is required.'); return; }
    if (!leader.phone_number.trim()) { setErrorMsg('Team Leader Phone Number is required.'); return; }
    if (!leader.roll_number.trim()) { setErrorMsg('Team Leader Roll Number is required.'); return; }
    if (!leader.gender) { setErrorMsg('Team Leader Gender is required.'); return; }

    for (let i = 0; i < 5; i++) {
      const m = members[i];
      const lbl = `Teammate ${i + 1}`;
      if (!m.full_name.trim()) { setErrorMsg(`${lbl} Full Name is required.`); return; }
      if (!m.college_email.trim()) { setErrorMsg(`${lbl} College Email is required.`); return; }
      if (!m.personal_email.trim()) { setErrorMsg(`${lbl} Personal Email is required.`); return; }
      if (!m.phone_number.trim()) { setErrorMsg(`${lbl} Phone Number is required.`); return; }
      if (!m.roll_number.trim()) { setErrorMsg(`${lbl} Roll Number is required.`); return; }
      if (!m.gender) { setErrorMsg(`${lbl} Gender is required.`); return; }
    }

    // 2. Validate identical college email domains
    const allEmails = [leader.college_email, ...members.map(m => m.college_email)];
    const domains = allEmails.map(email => {
      const parts = email.split('@');
      return parts.length > 1 ? parts[1].toLowerCase().trim() : '';
    });
    if (domains.some(d => !d)) { setErrorMsg('All college emails must be valid.'); return; }
    if (new Set(domains).size > 1) {
      setErrorMsg('All members must belong to the same college (identical college email domains).');
      return;
    }

    // 3. Validate girl member mandatory
    const genders = [leader.gender, ...members.map(m => m.gender)];
    if (!genders.includes('Woman')) {
      setErrorMsg('At least one female member (Woman) is mandatory in the team.');
      return;
    }

    // 4. Validate duplicate details in form
    const lowerCollege = allEmails.map(e => e.toLowerCase().trim());
    if (new Set(lowerCollege).size < 6) { setErrorMsg('Each college email must be unique in the team.'); return; }

    const personalEmails = [leader.personal_email, ...members.map(m => m.personal_email)].map(e => e.toLowerCase().trim());
    if (new Set(personalEmails).size < 6) { setErrorMsg('Each personal email must be unique in the team.'); return; }

    const rolls = [leader.roll_number, ...members.map(m => m.roll_number)].map(r => r.toUpperCase().trim());
    if (new Set(rolls).size < 6) { setErrorMsg('Each roll number must be unique in the team.'); return; }

    setSubmitting(true);
    try {
      const url = isEdit ? '/api/dsa/events/sih/my-team' : '/api/dsa/events/sih/register';
      const method = isEdit ? 'PUT' : 'POST';
      await apiRequest(url, {
        method: method,
        body: JSON.stringify({
          team_name: teamName,
          leader: leader,
          members: members
        })
      });
      setDone(true);
      setTimeout(() => {
        onClose();
        onSuccess();
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed. Please check entries and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0e0c00 0%, #060500 100%)',
          border: '1px solid rgba(212,175,55,0.25)',
          boxShadow: '0 0 80px rgba(212,175,55,0.08), 0 40px 100px rgba(0,0,0,0.9)',
        }}
      >
        <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #d4af37, #8c7030, #d4af37)' }} />
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition z-20">
          <X className="h-4 w-4" />
        </button>

        <div className="p-7 space-y-6 max-h-[85vh] overflow-y-auto">
          
          {/* Header */}
          <div className="space-y-1 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d4af37]">🏆 Nominate Your Warriors</p>
            <h2 className="text-xl font-extrabold font-serif text-white tracking-wide">Smart India Hackathon 2026 Registration</h2>
            <p className="text-xs text-zinc-500">Form a team of 6 members to nominate your college on the national stage.</p>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-950 bg-rose-950/20 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /><span>{errorMsg}</span>
            </div>
          )}

          {done ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-400" />
              <p className="text-lg font-extrabold text-white">{isEdit ? 'Team Updated Successfully!' : 'Team Registered Successfully!'}</p>
              <p className="text-xs text-zinc-400">{isEdit ? 'Your team details have been successfully updated.' : 'A confirmation email has been sent to your Team Leader inbox.'}</p>
            </div>
          ) : !showForm ? (
            /* Part 1: Rules and Instructions */
            <div className="space-y-6">

              {/* PDF Download Banner */}
              <div
                className="rounded-xl p-4 flex items-center gap-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(140,112,48,0.05) 100%)',
                  border: '1px solid rgba(212,175,55,0.35)',
                }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)' }}>
                  📄
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-extrabold text-[#d4af37] uppercase tracking-wider">Step 1 — Download &amp; Read the Official Brochure</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">You must read the official SIH 2026 Internal Hackathon Instructions document before you begin filling the registration form. The 2-minute timer below will unlock the form after you have had time to go through it.</p>
                </div>
                <a
                  href="/SIH2026_Internal_Hackathon_Instructions.pdf"
                  download="SIH2026_Internal_Hackathon_Instructions.pdf"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg font-extrabold text-[10px] uppercase tracking-wider text-black transition hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #d4af37, #8c7030)' }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </a>
              </div>

              <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#d4af37] border-b border-zinc-900 pb-2">📋 Internal Selection Guidelines &amp; Rules</h3>
                <ul className="text-xs text-zinc-400 space-y-2.5 list-disc pl-4 leading-relaxed">
                  <li><strong className="text-[#d4af37]">Read the Brochure:</strong> Download and thoroughly read the official SIH 2026 Internal Hackathon Instructions PDF above before proceeding. The timer gives you 2 minutes to do so.</li>
                  <li><strong>Team Composition:</strong> A team must consist of exactly <strong>6 members</strong> (1 Team Leader and 5 Teammates). No more, no less.</li>
                  <li><strong>Gender Mandate:</strong> At least <strong>one female member (Woman)</strong> is strictly mandatory to build gender diversity.</li>
                  <li><strong>Same Institution:</strong> All team members must belong to the <strong>exact same college</strong> (email domains must match).</li>
                  <li><strong>One Account Submission:</strong> Only the <strong>Team Leader</strong> must fill this registration form. Team members should not submit.</li>
                  <li><strong>Website Registration:</strong> Every team member <strong>must be registered on our website</strong> to participate in SIH. You cannot register the team if any member is unregistered.</li>
                  <li><strong>No Double Nominations:</strong> A student cannot be part of multiple registered teams. If a teammate is already registered, submission will fail.</li>
                </ul>
              </div>

              <div className="flex items-center gap-3 bg-zinc-900/40 p-4 rounded-xl border border-zinc-900">
                <input
                  type="checkbox"
                  id="sih-accept-rules"
                  checked={rulesAccepted}
                  disabled={!timerExpired}
                  onChange={(e) => setRulesAccepted(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-zinc-800 bg-zinc-900 text-[#d4af37] focus:ring-[#d4af37] cursor-pointer disabled:opacity-40"
                />
                <label htmlFor="sih-accept-rules" className="text-xs text-zinc-400 leading-normal cursor-pointer select-none">
                  I certify that I am the Team Leader and agree that all team members belong to the same college and comply with the rules.
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
                >
                  Cancel
                </button>
                <button
                  disabled={!timerExpired || !rulesAccepted}
                  onClick={() => setShowForm(true)}
                  className="px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition disabled:opacity-50"
                  style={{
                    background: timerExpired && rulesAccepted
                      ? 'linear-gradient(135deg, #d4af37, #8c7030)'
                      : 'rgba(255,255,255,0.05)',
                    color: timerExpired && rulesAccepted ? '#000' : '#888',
                    border: timerExpired && rulesAccepted ? 'none' : '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  {timerExpired ? 'Proceed to Registration →' : `⏳ Read brochure & rules: ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`}
                </button>
              </div>
            </div>
          ) : (
            /* Part 2: 6-Section Registration Form */
            <form onSubmit={handleFormSubmit} className="space-y-6">
              
              {/* Team Name Input */}
              <div className="space-y-1.5 bg-zinc-950/30 p-4 rounded-xl border border-zinc-900">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]">Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter unique team name (e.g. CyberKnights)"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-900 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              {/* Roster Tabs */}
              <div className="space-y-4">
                <div className="flex gap-1.5 border-b border-zinc-900/60 pb-2.5 overflow-x-auto whitespace-nowrap scrollbar-thin">
                  {['Team Leader', 'Member 1', 'Member 2', 'Member 3', 'Member 4', 'Member 5'].map((name, idx) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setActiveTab(idx)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition ${
                        activeTab === idx
                          ? 'bg-[#d4af37] text-black'
                          : 'bg-zinc-900/60 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>

                {/* Tab Content Rendering */}
                <div className="rounded-xl border border-zinc-900/60 bg-zinc-950/20 p-5 space-y-4">
                  {activeTab === 0 ? (
                    /* Section 1: Team Leader Information */
                    <div className="space-y-4 animate-fade-in">
                      <p className="text-[11px] font-black text-[#d4af37] uppercase tracking-wider">Section 1 – Team Leader Information</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase">Full Name</label>
                          <input
                            type="text"
                            required
                            value={leader.full_name}
                            onChange={(e) => handleLeaderChange('full_name', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase">College Email ID (Disabled)</label>
                          <input
                            type="email"
                            disabled
                            value={leader.college_email}
                            className="w-full bg-zinc-900 border border-zinc-900/30 rounded-lg px-3 py-1.5 text-xs text-zinc-500 focus:outline-none cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase">Personal Email ID</label>
                          <input
                            type="email"
                            required
                            placeholder="leader.personal@gmail.com"
                            value={leader.personal_email}
                            onChange={(e) => handleLeaderChange('personal_email', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase">Phone Number</label>
                          <input
                            type="tel"
                            required
                            value={leader.phone_number}
                            onChange={(e) => handleLeaderChange('phone_number', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase">Roll Number</label>
                          <input
                            type="text"
                            required
                            value={leader.roll_number}
                            onChange={(e) => handleLeaderChange('roll_number', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase">Branch</label>
                          <select
                            value={leader.branch}
                            onChange={(e) => handleLeaderChange('branch', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                          >
                            <option value="CSE">CSE</option>
                            <option value="CSE-AI">CSE-AI</option>
                            <option value="AIDS">AIDS</option>
                            <option value="CCE">CCE</option>
                            <option value="ECE">ECE</option>
                            <option value="Quantum">Quantum</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase block">Study Year</label>
                          <div className="flex gap-4">
                            {[1, 2, 3, 4].map(y => (
                              <label key={y} className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name="leader-year"
                                  checked={leader.study_year === y}
                                  onChange={() => handleLeaderChange('study_year', y)}
                                  className="text-[#d4af37] focus:ring-[#d4af37]"
                                />
                                {y}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase block">Gender</label>
                          <div className="flex gap-4">
                            {['Woman', 'Man'].map(g => (
                              <label key={g} className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name="leader-gender"
                                  checked={leader.gender === g}
                                  onChange={() => handleLeaderChange('gender', g as any)}
                                  className="text-[#d4af37] focus:ring-[#d4af37]"
                                />
                                {g}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Sections 2-6: Teammates */
                    <div className="space-y-4 animate-fade-in">
                      <p className="text-[11px] font-black text-[#d4af37] uppercase tracking-wider">Section {activeTab + 1} – Team Member {activeTab} Information</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase">Full Name</label>
                          <input
                            type="text"
                            required
                            value={members[activeTab - 1].full_name}
                            onChange={(e) => handleMemberChange(activeTab - 1, 'full_name', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase">College Email ID</label>
                          <input
                            type="email"
                            required
                            placeholder="teammate@college.edu"
                            value={members[activeTab - 1].college_email}
                            onChange={(e) => handleMemberChange(activeTab - 1, 'college_email', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase">Personal Email ID</label>
                          <input
                            type="email"
                            required
                            placeholder="teammate@gmail.com"
                            value={members[activeTab - 1].personal_email}
                            onChange={(e) => handleMemberChange(activeTab - 1, 'personal_email', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase">Phone Number</label>
                          <input
                            type="tel"
                            required
                            value={members[activeTab - 1].phone_number}
                            onChange={(e) => handleMemberChange(activeTab - 1, 'phone_number', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase">Roll Number</label>
                          <input
                            type="text"
                            required
                            value={members[activeTab - 1].roll_number}
                            onChange={(e) => handleMemberChange(activeTab - 1, 'roll_number', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase">Branch</label>
                          <select
                            value={members[activeTab - 1].branch}
                            onChange={(e) => handleMemberChange(activeTab - 1, 'branch', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                          >
                            <option value="CSE">CSE</option>
                            <option value="CSE-AI">CSE-AI</option>
                            <option value="AIDS">AIDS</option>
                            <option value="CCE">CCE</option>
                            <option value="ECE">ECE</option>
                            <option value="Quantum">Quantum</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase block">Study Year</label>
                          <div className="flex gap-4">
                            {[1, 2, 3, 4].map(y => (
                              <label key={y} className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name={`member-${activeTab}-year`}
                                  checked={members[activeTab - 1].study_year === y}
                                  onChange={() => handleMemberChange(activeTab - 1, 'study_year', y)}
                                  className="text-[#d4af37] focus:ring-[#d4af37]"
                                />
                                {y}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase block">Gender</label>
                          <div className="flex gap-4">
                            {['Woman', 'Man'].map(g => (
                              <label key={g} className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name={`member-${activeTab}-gender`}
                                  checked={members[activeTab - 1].gender === g}
                                  onChange={() => handleMemberChange(activeTab - 1, 'gender', g as any)}
                                  className="text-[#d4af37] focus:ring-[#d4af37]"
                                />
                                {g}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={activeTab === 0}
                  className="px-4 py-2 border border-zinc-800 bg-zinc-900 rounded-lg text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition disabled:opacity-40"
                >
                  &larr; Prev Member
                </button>

                {activeTab < 5 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-[#d4af37] rounded-lg text-xs font-bold uppercase tracking-wider hover:border-[#d4af37] transition"
                  >
                    Next Member &rarr;
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#8c7030] text-black font-black text-xs uppercase rounded-lg tracking-wider hover:from-[#f6e05e] hover:to-[#d4af37] transition disabled:opacity-60 flex items-center gap-2"
                  >
                    {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Submitting...</> : 'Submit Team Nomination'}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
        <div className="h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.12), transparent)' }} />
      </div>
    </div>
  );
}


// ─── Orientation Registration Modal ───────────────────────────────────────────
function OrientationModal({ open, onClose, event, onSuccess }: {
  open: boolean;
  onClose: () => void;
  event: EventData | null;
  onSuccess: () => void;
}) {
  const [details, setDetails] = useState<StudentDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open || !event) return;
    setDetails(null); setSubmitError(null); setDone(false);
    setLoadingDetails(true);
    apiRequest('/api/dsa/events/my-details')
      .then(data => setDetails(data))
      .catch(err => setSubmitError(err.message || 'Failed to load your details.'))
      .finally(() => setLoadingDetails(false));
  }, [open, event]);

  const handleConfirm = async () => {
    if (!event || !details) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await apiRequest(`/api/dsa/events/${event.id}/register`, { method: 'POST' });
      setDone(true);
      setTimeout(() => {
        onClose();
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setSubmitError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !event) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.90)', backdropFilter: 'blur(10px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0e0c00 0%, #060500 100%)',
          border: '1px solid rgba(212,175,55,0.25)',
          boxShadow: '0 0 80px rgba(212,175,55,0.08), 0 40px 100px rgba(0,0,0,0.9)',
        }}
      >
        <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #d4af37, #8c7030, #d4af37)' }} />
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition z-20">
          <X className="h-4 w-4" />
        </button>

        <div className="p-7 space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d4af37]">🎯 Confirm Registration</p>
            <h2 className="text-lg font-extrabold font-serif text-white leading-tight">{event.name}</h2>
            <p className="text-xs text-zinc-500">Verify your details below and confirm your spot.</p>
          </div>

          {/* Body */}
          {loadingDetails ? (
            <div className="flex items-center justify-center py-10 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-[#d4af37]" />
              <span className="text-sm text-zinc-400">Fetching your details...</span>
            </div>
          ) : submitError ? (
            <div className="flex items-start gap-2 text-sm text-rose-300 bg-rose-950/20 border border-rose-900/40 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /><span>{submitError}</span>
            </div>
          ) : done ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <p className="text-base font-bold text-white">Registration Confirmed!</p>
              <p className="text-xs text-zinc-400">A confirmation email with your QR code has been sent to your college email.</p>
            </div>
          ) : details ? (
            <div className="space-y-4">
              {/* Details card */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.15)', background: 'rgba(212,175,55,0.03)' }}>
                <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(212,175,55,0.1)', background: 'rgba(212,175,55,0.05)' }}>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d4af37]">Your Details</p>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { Icon: User, label: 'Name', val: details.full_name },
                    { Icon: Mail, label: 'Email', val: details.college_email },
                    { Icon: BookOpen, label: 'Roll No', val: details.roll_number },
                    { Icon: Phone, label: 'Phone', val: details.phone_number },
                    { Icon: BookOpen, label: 'Branch / Year', val: `${details.branch} — Year ${details.year}` },
                  ].map(({ Icon, label, val }) => (
                    <div key={label} className="flex items-start gap-3">
                      <Icon className="h-3.5 w-3.5 mt-0.5 text-[#d4af37] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">{label}</p>
                        <p className="text-sm text-zinc-200 font-medium truncate">{val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 text-center">After confirming, a registration email with your QR code will be sent to your college email.</p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #d4af37, #8c7030)', color: '#000' }}
                >
                  {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Registering...</> : 'Confirm & Register'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.12), transparent)' }} />
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Events() {
  const router = useRouter();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registeringId, setRegisteringId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [sihModalOpen, setSihModalOpen] = useState(false);
  const [sihModalEditMode, setSihModalEditMode] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [orientationModalOpen, setOrientationModalOpen] = useState(false);
  const [orientationEvent, setOrientationEvent] = useState<EventData | null>(null);
  const [studentYear, setStudentYear] = useState<number | null>(null);
  const [isSihLeader, setIsSihLeader] = useState<boolean>(false);

  const fetchEvents = async () => {
    try {
      const data = await apiRequest('/api/dsa/events');
      setEvents(data);
      // Identify orientation event (year restricted to 1st year)
      const orient = data.find((e: EventData) => e.year_restricted === 1);
      if (orient) setOrientationEvent(orient);
      // Fetch student year & SIH leader status
      try {
        const details = await apiRequest('/api/dsa/events/my-details');
        setStudentYear(details.year);
      } catch (err) {
        console.warn('Could not fetch student details for year');
      }
      try {
        const sihTeam = await apiRequest('/api/dsa/events/sih/my-team');
        setIsSihLeader(sihTeam.is_leader === true);
      } catch (err) {
        setIsSihLeader(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) { router.push('/'); return; }
    fetchEvents();
  }, [router]);

  const handleRegister = async (eventId: number) => {
    setError(null); setSuccessMsg(null); setRegisteringId(eventId);
    try {
      await apiRequest(`/api/dsa/events/${eventId}/register`, { method: 'POST' });
      setSuccessMsg('Successfully registered for the event!');
      await fetchEvents();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to register for the event.');
    } finally {
      setRegisteringId(null);
    }
  };

  const openSihModal = (editMode = false) => {
    setSihModalEditMode(editMode);
    setSihModalOpen(true);
    setConfettiActive(false);
    if (!editMode) {
      setTimeout(() => setConfettiActive(true), 80);
    }
  };

  const closeSihModal = () => {
    setSihModalOpen(false);
    setSihModalEditMode(false);
    setConfettiActive(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-[#d4af37] animate-spin mx-auto" />
          <p className="text-sm text-zinc-500 font-medium">Loading club events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-950/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-10 relative z-10">

        {/* Header */}
        <div className="space-y-2 border-b border-zinc-900 pb-5">
          <h2 className="text-3xl font-extrabold font-serif text-white tracking-wide flex items-center gap-3">
            <Trophy className="h-8 w-8 text-[#d4af37]" /> Club Events Arena
          </h2>
          <p className="text-sm text-zinc-400 font-medium">
            Discover, register, and enter active event dashboards and challenges conducted by Chakravyuha.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-rose-950 bg-rose-950/20 p-4 text-sm text-rose-300">
            <ShieldAlert className="h-5 w-5 mt-0.5 flex-shrink-0" /><span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-950 bg-emerald-950/20 p-4 text-sm text-emerald-300">
            <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" /><span>{successMsg}</span>
          </div>
        )}

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {events.map((event) => {
            const isYukti = event.name.toUpperCase().includes('YUKTI');
            const isSih = event.name.toUpperCase().includes('SMART INDIA HACKATHON');
            const isOrientation = event.year_restricted === 1;
            const isUpcoming = event.status === 'upcoming';
            const registrationClosed = isSih && new Date() >= REGISTRATION_DEADLINE;

            return (
              <div
                key={event.id}
                onClick={isSih ? (event.is_registered ? () => router.push('/events/sih-dashboard') : (!registrationClosed ? () => openSihModal() : undefined)) : undefined}
                className="rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md p-6 shadow-xl flex flex-col justify-between hover:border-[#8c7030]/30 transition group relative overflow-hidden"
                style={{ cursor: isSih ? 'pointer' : 'default' }}
              >
                {!isUpcoming && (
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#d4af37] to-[#8c7030]" />
                )}
                {isSih && (
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                    style={{ boxShadow: 'inset 0 0 0 1.5px rgba(212,175,55,0.25), inset 0 0 32px rgba(212,175,55,0.04)' }}
                  />
                )}

                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-bold font-serif text-white tracking-wide leading-snug">{event.name}</h3>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border flex-shrink-0 ${isUpcoming ? 'bg-zinc-900 text-zinc-400 border-zinc-700/30' : 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20'}`}>
                      {event.status}
                    </span>
                  </div>

                  <p className="text-sm text-zinc-400 leading-relaxed font-light">{event.description}</p>

                  {isSih && (
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full"
                        style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', color: '#d4af37' }}
                      >
                        <Calendar className="h-3 w-3" /> 29 August 2026
                      </span>
                      <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">
                        Click for countdown
                      </span>
                    </div>
                  )}
                  {isOrientation && (
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', color: '#d4af37' }}>
                        🎓 Orientation for 1st Years
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-zinc-900/60 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                    <Calendar className="h-4 w-4 text-[#d4af37]" />
                    {isYukti ? 'Live Active Session' : isSih ? '29 Aug 2026 — Internal Hackathon' : 'Orientation / TBD'}
                  </div>

                  {isSih ? (
                    event.is_registered ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push('/events/sih-dashboard'); }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#d4af37] hover:bg-[#f6e05e] text-black font-extrabold text-xs uppercase rounded tracking-wider transition"
                        >
                          View Dashboard
                        </button>
                        {isSihLeader && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openSihModal(true); }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-[#d4af37]/50 text-white font-extrabold text-xs uppercase rounded tracking-wider transition"
                          >
                            Edit Team
                          </button>
                        )}
                      </div>
                    ) : registrationClosed ? (
                      <button disabled className="px-4 py-2 rounded bg-red-950/20 border border-red-900/40 text-red-400 text-xs font-bold uppercase tracking-wider cursor-not-allowed">
                        Registrations Closed
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); openSihModal(); }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#d4af37] text-black font-extrabold text-xs uppercase rounded tracking-wider hover:bg-[#f6e05e] transition"
                      >
                        Register Team
                      </button>
                    )
                  ) : isOrientation ? (
                    event.is_registered ? (
                      <button disabled className="px-4 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-[#d4af37] text-xs font-bold uppercase tracking-wider cursor-not-allowed">
                        Already Registered
                      </button>
                    ) : studentYear === 1 ? (
                      <button
                        onClick={() => { setOrientationEvent(event); setOrientationModalOpen(true); }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#d4af37] text-black font-extrabold text-xs uppercase rounded tracking-wider hover:bg-[#f6e05e] transition"
                      >
                        Register Orientation
                      </button>
                    ) : (
                      <button disabled className="px-4 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-wider cursor-not-allowed">
                        Ineligible (Year {studentYear || '—'})
                      </button>
                    )
                  ) : isUpcoming ? (
                    <button disabled className="px-4 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-wider cursor-not-allowed">
                      Coming Soon
                    </button>
                  ) : event.is_registered ? (
                    <button
                      onClick={() => { if (isYukti) router.push('/dsa'); else router.push('/dashboard'); }}
                      className="group/btn flex items-center gap-1.5 px-4 py-2 bg-[#d4af37] text-black font-extrabold text-xs uppercase rounded tracking-wider hover:bg-[#f6e05e] transition"
                    >
                      Enter Event <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegister(event.id)}
                      disabled={registeringId === event.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-[#d4af37]/65 text-white font-extrabold text-xs uppercase rounded tracking-wider transition disabled:opacity-50"
                    >
                      {registeringId === event.id ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" />Registering...</>
                      ) : (
                        <><Sparkles className="h-3.5 w-3.5 text-[#d4af37]" />Register Now</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* SIH Registration Modal */}
      <SihRegistrationModal open={sihModalOpen} onClose={closeSihModal} onSuccess={() => { fetchEvents(); }} isEdit={sihModalEditMode} />
      <OrientationModal open={orientationModalOpen} onClose={() => setOrientationModalOpen(false)} event={orientationEvent} onSuccess={() => { fetchEvents(); }} />
    </div>
  );
}

