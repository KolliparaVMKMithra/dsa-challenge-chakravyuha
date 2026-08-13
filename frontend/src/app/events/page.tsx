'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Calendar, Sparkles, CheckCircle2, ChevronRight, Loader2, ShieldAlert, X, Flame, Timer, Clock, User, Mail, Phone, BookOpen, AlertCircle } from 'lucide-react';
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

// ─── Countdown Modal ───────────────────────────────────────────────────────────
function CountdownModal({ open, onClose, confettiActive }: {
  open: boolean;
  onClose: () => void;
  confettiActive: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    if (!open) return;
    const iv = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(iv);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Fullscreen confetti */}
      <ConfettiCanvas active={confettiActive} />

      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden z-10"
        style={{
          background: 'linear-gradient(160deg, #100c00 0%, #060400 100%)',
          border: '1px solid rgba(212,175,55,0.25)',
          boxShadow: '0 0 80px rgba(212,175,55,0.1), 0 40px 100px rgba(0,0,0,0.8)',
        }}
      >
        {/* Gold top bar */}
        <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #d4af37, #8c7030, #d4af37)' }} />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition z-20"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-8 space-y-7 text-center">
          {/* Top badge */}
          <div className="flex items-center justify-center gap-2">
            <Flame className="h-5 w-5 text-[#d4af37]" />
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#d4af37]">
              Smart India Hackathon 2026
            </span>
            <Flame className="h-5 w-5 text-[#d4af37]" />
          </div>

          {/* Title */}
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold font-serif text-white tracking-wide">Internal Hackathon</h2>
            <p className="text-sm text-zinc-400">
              The battle begins on{' '}
              <span className="text-[#d4af37] font-bold">August 29, 2026</span>
            </p>
          </div>

          {/* Countdown grid */}
          <div className="flex items-start justify-center gap-2 flex-wrap">
            <CountdownUnit value={timeLeft.days} label="Days" />
            <div className="text-[#d4af37] font-black text-3xl pt-5 opacity-50">:</div>
            <CountdownUnit value={timeLeft.hours} label="Hours" />
            <div className="text-[#d4af37] font-black text-3xl pt-5 opacity-50">:</div>
            <CountdownUnit value={timeLeft.minutes} label="Minutes" />
            <div className="text-[#d4af37] font-black text-3xl pt-5 opacity-50">:</div>
            <CountdownUnit value={timeLeft.seconds} label="Seconds" />
          </div>

          {/* Divider */}
          <div className="h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)' }} />

          {/* Registration badge */}
          <div className="space-y-2">
            <div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(140,112,48,0.05))',
                border: '1px solid rgba(212,175,55,0.2)',
              }}
            >
              <Timer className="h-4 w-4 text-[#d4af37]" />
              <span className="text-sm font-bold text-[#d4af37] tracking-wider uppercase">
                Registrations — Coming Soon
              </span>
            </div>
            <p className="text-xs text-zinc-600 font-medium">
              Stay tuned. Registrations will open before the event date.
            </p>
          </div>

          {/* Date pill */}
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
            <Clock className="h-3.5 w-3.5 text-[#d4af37]" />
            <span>Event Date: <span className="text-zinc-300 font-semibold">29 August 2026</span></span>
          </div>
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
  const [confettiActive, setConfettiActive] = useState(false);
  const [orientationModalOpen, setOrientationModalOpen] = useState(false);
  const [orientationEvent, setOrientationEvent] = useState<EventData | null>(null);
  const [studentYear, setStudentYear] = useState<number | null>(null);


  const fetchEvents = async () => {
    try {
      const data = await apiRequest('/api/dsa/events');
      setEvents(data);
      // Identify orientation event (year restricted to 1st year)
      const orient = data.find((e: EventData) => e.year_restricted === 1);
      if (orient) setOrientationEvent(orient);
      // After events, fetch student year if not yet fetched
      try {
        const details = await apiRequest('/api/dsa/events/my-details');
        setStudentYear(details.year);
      } catch (err) {
        console.warn('Could not fetch student details for year');
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

  const openSihModal = () => {
    setSihModalOpen(true);
    setConfettiActive(false);
    setTimeout(() => setConfettiActive(true), 80);
  };

  const closeSihModal = () => {
    setSihModalOpen(false);
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

            return (
              <div
                key={event.id}
                onClick={isSih ? openSihModal : undefined}
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
                    <button
                      onClick={(e) => { e.stopPropagation(); openSihModal(); }}
                      className="px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition"
                      style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.22)', color: '#d4af37' }}
                    >
                      Coming Soon
                    </button>
                  ) : isOrientation ? (
                    studentYear === 1 ? (
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

      {/* SIH Countdown Modal */}
      <CountdownModal open={sihModalOpen} onClose={closeSihModal} confettiActive={confettiActive} />
      <OrientationModal open={orientationModalOpen} onClose={() => setOrientationModalOpen(false)} event={orientationEvent} onSuccess={() => { fetchEvents(); }} />
    </div>
  );
}

