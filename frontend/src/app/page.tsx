'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, User, AlertCircle, LogIn, Mail, Phone, Award, BookOpen, ChevronLeft, ChevronRight, CheckCircle2, ArrowDown, Users, Flame, Terminal, Code, Cpu, Trophy, Activity, Map, Compass, ExternalLink, ArrowRight, Menu, X, TrendingUp, Sparkles, Quote, XCircle } from 'lucide-react';
import { apiRequest, setAuthToken, getAuthToken, getUserType } from '@/utils/api';

interface TeamMember {
  name: string;
  role: string;
  img: string;
  dept: 'founders' | 'core' | 'tech' | 'design' | 'events' | 'content' | 'community';
  title?: string; // optional special title shown in modal
}

const graphMilestones = [
  {
    era: "Early 2024 (Pre-Chakravyuha)",
    year: "2024 Q1",
    participants: 12,
    teams: 2,
    tag: "Isolated Era",
    color: "#ef4444",
    desc: "Individual coders working in silos without mentorship or structured DSA practice. Zero organized hackathon participation from Amrita Amaravati.",
    highlights: ["No centralized DSA sheets", "Low contest participation", "Lack of team formation support"]
  },
  {
    era: "Late 2024 (Club Inception)",
    year: "2024 Q3",
    participants: 48,
    teams: 10,
    tag: "Foundation Phase",
    color: "#f59e0b",
    desc: "Chakravyuha founded by Mithra & core team. Introduction of structured problem sets, weekly meetups, and initial team registration for hackathons.",
    highlights: ["First YUKTI DSA sheets launched", "Weekly peer code reviews", "10 hackathon teams formed"]
  },
  {
    era: "2025 (YUKTI & DSA Expansion)",
    year: "2025 Q2",
    participants: 180,
    teams: 32,
    tag: "Growth Surge",
    color: "#3b82f6",
    desc: "Daily attendance check-ins via QR scanner, live leaderboard rankings, and dedicated mentorship tracks for competitive coding platforms.",
    highlights: ["Over 25,000+ DSA problems solved", "Daily attendance QR check-ins", "32 active hackathon squads"]
  },
  {
    era: "2026 Present (National Dominance)",
    year: "2026 Q1",
    participants: 450,
    teams: 65,
    tag: "Golden Era",
    color: "#d4af37",
    desc: "65+ teams competing in SIH & national hackathons, 18 national finalists, student-developed campus compass portals, and 350+ daily active coders.",
    highlights: ["65+ SIH & National Teams", "18+ National Finalist Teams", "45,000+ Lifetime DSA Solves"]
  }
];

const studentTestimonials = [
  {
    name: "Anonymous Student",
    role: "CSE 3rd Year • LeetCode 1750+",
    rating: 5,
    quote: "Chakravyuha completely shifted my perspective. The YUKTI DSA sheets gave me a structured roadmap, and seeing my rank on the daily leaderboard kept me addicted to consistency!",
    badge: "Top DSA Solver",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30"
  },
  {
    name: "Anonymous Student",
    role: "AI & DS 3rd Year • SIH Finalist",
    rating: 5,
    quote: "Before Chakravyuha, we didn't even know how to submit a proper hackathon proposal. The mentorship sessions from the Founders and Tech Leads transformed our team into national finalists!",
    badge: "SIH Finalist",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30"
  },
  {
    name: "Anonymous Student",
    role: "ECE 4th Year • Full Stack Lead",
    rating: 5,
    quote: "The coding culture went from non-existent to hyper-competitive yet supportive. You're never coding alone at 2 AM — someone from the club is always debugging with you.",
    badge: "Hackathon Veteran",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30"
  },
  {
    name: "Anonymous Student",
    role: "CSE 1st Year • CP Enthusiast",
    rating: 5,
    quote: "As a 1st year student, the Campus Guide and student-developed portals gave me all the rules, tips, and roadmap I needed. Joined Chakravyuha on day 1!",
    badge: "Freshman Lead",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
  },
  {
    name: "Anonymous Student",
    role: "CSE 2nd Year • 45-Day Streak",
    rating: 5,
    quote: "The scanner check-ins and streak rewards made learning data structures feel like leveling up in an RPG. I haven't broken my 45-day solve streak!",
    badge: "Streak Champion",
    badgeColor: "bg-amber-500/10 text-[#d4af37] border-[#d4af37]/30"
  }
];

const teamMembers: TeamMember[] = [
  // Founders & Co-Founders
  { name: "Mithra", role: "Founder", img: "/team/founders and co-founders/Mithra_founder.jpg", dept: "founders" },
  { name: "Rudra", role: "Co-Founder", img: "/team/founders and co-founders/Rudra.jpg", dept: "founders", title: "President of Student Council" },
  { name: "Ganesh", role: "Co-Founder", img: "/team/founders and co-founders/Ganesh.jpg", dept: "founders" },
  { name: "Harikiran", role: "Co-Founder", img: "/team/founders and co-founders/Harikiran.jpg", dept: "founders" },
  { name: "Krishna", role: "Co-Founder", img: "/team/founders and co-founders/Krishna.jpg", dept: "founders" },
  { name: "Maneesh", role: "Co-Founder", img: "/team/founders and co-founders/maneesh.jpg", dept: "founders" },
  { name: "Sindhuja", role: "Co-Founder", img: "/team/founders and co-founders/sindhuja.jpg", dept: "founders" },
  
  // Core Roles (Medha first)
  { name: "Medha", role: "General Secretary", img: "/team/core_roles/medha_general_secretary.jpg", dept: "core" },
  { name: "Athul Krishna", role: "Strategy & Innovation Head", img: "/team/core_roles/athul_krishna_strategy_and_innovation_head.jpg", dept: "core" },
  { name: "Jaydeep", role: "Treasurer", img: "/team/core_roles/jaydeep_tresurer.jpg", dept: "core" },
  
  // Tech Leads
  { name: "Dhanush", role: "Tech Lead", img: "/team/tech leads/dhanuh.jpg", dept: "tech" },
  { name: "Mithun", role: "Tech Lead", img: "/team/tech leads/mithun.jpg", dept: "tech" },
  { name: "Revanth", role: "Tech Lead", img: "/team/tech leads/revanth.jpg", dept: "tech" },
  { name: "Rishikesh", role: "Tech Lead", img: "/team/tech leads/rishikesh.jpg", dept: "tech" },
  { name: "Rishitha", role: "Tech Lead", img: "/team/tech leads/rishitha.jpg", dept: "tech" },
  
  // Design Leads
  { name: "Harini", role: "Design Lead", img: "/team/design leads/harini.jpg", dept: "design" },
  { name: "Hasini", role: "Design Lead", img: "/team/design leads/hasini.jpg", dept: "design" },
  { name: "Hemendra", role: "Design Lead", img: "/team/design leads/hemendra.jpg", dept: "design" },
  { name: "Rithesh", role: "Design Lead", img: "/team/design leads/rithesh.jpg", dept: "design" },
  
  // Events & PR Leads
  { name: "Akhila", role: "Events & PR Lead", img: "/team/events and pr leads/akhila.jpg", dept: "events" },
  { name: "Gayatri", role: "Events & PR Lead", img: "/team/events and pr leads/gayatri.jpg", dept: "events" },
  { name: "Karthik", role: "Events & PR Lead", img: "/team/events and pr leads/karthik.jpg", dept: "events" },
  { name: "Lalith Aditya", role: "Events & PR Lead", img: "/team/events and pr leads/lalith aditya.jpg", dept: "events" },
  { name: "Pranavi", role: "Events & PR Lead", img: "/team/events and pr leads/pranavi.jpg", dept: "events" },
  { name: "Rithvik", role: "Events & PR Lead", img: "/team/events and pr leads/rithvik.jpg", dept: "events" },
  { name: "Satya Shivani", role: "Events & PR Lead", img: "/team/events and pr leads/satya_shivani.jpg", dept: "events" },
  
  // Content Leads
  { name: "Lasya", role: "Content Lead", img: "/team/content leads/lasya.jpg", dept: "content" },
  { name: "Shreeram", role: "Content Lead", img: "/team/content leads/shreeram.jpg", dept: "content" },
  
  // Community Leads
  { name: "Mohitha", role: "Community & Engagement Lead", img: "/team/community and engagement leads/mohitha.jpg", dept: "community" },
  { name: "Reshma", role: "Community & Engagement Lead", img: "/team/community and engagement leads/reshma.jpg", dept: "community" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Forgot Password Modal
// ─────────────────────────────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [studentName, setStudentName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiRequest('/api/auth/forgot-password/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setResetToken(data.reset_token);
      setStudentName(data.name);
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Email verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await apiRequest('/api/auth/forgot-password/reset', {
        method: 'POST',
        body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
      });
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
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

        <div className="p-7 space-y-5">
          {/* Header */}
          <div className="text-center space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d4af37]">🔐 Account Recovery</p>
            <h2 className="text-lg font-extrabold font-serif text-white">Reset Your Password</h2>
            <p className="text-xs text-zinc-500">Your account data will remain completely safe.</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {['Verify Email', 'New Password', 'Done'].map((label, i) => {
              const stepIdx = step === 'email' ? 0 : step === 'reset' ? 1 : 2;
              return (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${i <= stepIdx ? 'bg-[#d4af37] text-black' : 'bg-zinc-800 text-zinc-500'}`}>{i + 1}</div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${i <= stepIdx ? 'text-[#d4af37]' : 'text-zinc-600'}`}>{label}</span>
                  {i < 2 && <div className={`flex-1 h-px ${i < stepIdx ? 'bg-[#d4af37]/40' : 'bg-zinc-800'}`} />}
                </div>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-950 bg-rose-950/20 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Verify Email */}
          {step === 'email' && (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#d4af37] mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute inset-y-0 left-3 h-full w-4 text-zinc-500 flex items-center" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your-college@amrita.edu or personal@email.com"
                    className="block w-full rounded border border-[#8c7030]/20 bg-zinc-900/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-500 focus:border-[#d4af37] focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-[10px] text-zinc-600 mt-1.5">Enter the email you used during registration (college or personal).</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded border border-[#d4af37] bg-gradient-to-r from-[#d4af37] to-[#8c7030] py-2.5 text-sm font-bold uppercase tracking-wider text-black hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>
          )}

          {/* Step 2: Reset Password */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="rounded-lg bg-emerald-950/20 border border-emerald-900/40 p-3 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>Email verified! Welcome back, <strong>{studentName}</strong>.</span>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#d4af37] mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute inset-y-0 left-3 h-full w-4 text-zinc-500 flex items-center" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="block w-full rounded border border-[#8c7030]/20 bg-zinc-900/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-500 focus:border-[#d4af37] focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#d4af37] mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute inset-y-0 left-3 h-full w-4 text-zinc-500 flex items-center" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className={`block w-full rounded border bg-zinc-900/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors ${confirmPassword && confirmPassword !== newPassword ? 'border-rose-500' : 'border-[#8c7030]/20 focus:border-[#d4af37]'}`}
                  />
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-[10px] text-rose-500 mt-1 font-semibold">Passwords do not match.</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded border border-[#d4af37] bg-gradient-to-r from-[#d4af37] to-[#8c7030] py-2.5 text-sm font-bold uppercase tracking-wider text-black hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Step 3: Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle2 className="h-14 w-14 text-emerald-400" />
              <div>
                <p className="text-lg font-extrabold text-white">Password Updated!</p>
                <p className="text-xs text-zinc-400 mt-1">Your password has been reset successfully. All your data is intact — only your password was changed.</p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2 rounded border border-[#d4af37] bg-gradient-to-r from-[#d4af37] to-[#8c7030] text-xs font-black uppercase tracking-wider text-black hover:opacity-90 transition"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const authSectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.35;
    }
  }, []);

  // Custom client-side scroll reveal animation trigger using IntersectionObserver
  useEffect(() => {
    // Fail-safe timer: reveal everything anyway after a short delay if observer does not trigger
    const fallbackTimer = setTimeout(() => {
      document.querySelectorAll('.reveal-fade-up, .reveal-fade-left, .reveal-fade-right, .reveal-skew-up, .reveal-scale-up').forEach(el => {
        el.classList.add('active');
      });
    }, 600);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.01, rootMargin: '0px 0px 100px 0px' }
    );

    const elements = document.querySelectorAll('.reveal-fade-up, .reveal-fade-left, .reveal-fade-right, .reveal-skew-up, .reveal-scale-up');
    elements.forEach((el) => observer.observe(el));

    return () => {
      clearTimeout(fallbackTimer);
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [selectedDept, setSelectedDept] = useState<'founders' | 'core' | 'tech' | 'design' | 'events' | 'content' | 'community'>('founders');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  
  // Growth section state & scroll ref
  const [selectedGraphEra, setSelectedGraphEra] = useState<number>(3);
  const testimonialScrollRef = useRef<HTMLDivElement>(null);

  const scrollTestimonials = (direction: 'left' | 'right') => {
    if (testimonialScrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      testimonialScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Login fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  // Register fields
  const [registerForm, setRegisterForm] = useState({
    full_name: '',
    college_email: '',
    roll_number: '',
    phone_number: '',
    branch: 'CSE',
    year: '1',
    password: '',
    confirm_password: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      title: "Breach the Formations of Code",
      desc: "Welcome to Chakravyuha Club, the ultimate coding arena at Amrita. Master DSA and ace competitive programming.",
      image: "/photos/1.jpg",
      fallbackGrad: "from-blue-900/60 to-purple-950/60"
    },
    {
      title: "YUKTI DSA Challenge",
      desc: "Conquer topic-wise sheets, maintain daily solve streaks, and rank on the absolute leaderboard.",
      image: "/photos/2.jpg",
      fallbackGrad: "from-[#d4af37]/20 to-zinc-900/80"
    },
    {
      title: "Smart India Hackathon 2026",
      desc: "Join our upcoming internal hackathon and design solutions to tackle real-world national problems.",
      image: "/photos/3.jpg",
      fallbackGrad: "from-emerald-900/50 to-zinc-950/80"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
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

  const validateField = (name: string, value: string, currentPassword?: string) => {
    let err = '';
    const pwd = currentPassword !== undefined ? currentPassword : registerForm.password;
    
    if (name === 'roll_number') {
      if (value.trim() !== '') {
        if (!value.toUpperCase().startsWith('AV')) {
          err = 'Roll number must start with "AV"';
        } else if (!/^AV[A-Za-z0-9.]+$/i.test(value)) {
          err = 'Roll number must be alphanumeric (e.g. AV.SC.U4CSE23233)';
        }
      }
    } else if (name === 'college_email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        err = 'Invalid email address';
      }
    } else if (name === 'phone_number') {
      if (value.length < 10) {
        err = 'Phone number must be at least 10 digits';
      }
    } else if (name === 'password') {
      if (value.length < 6) {
        err = 'Password must be at least 6 characters';
      }
      if (registerForm.confirm_password && value !== registerForm.confirm_password) {
        setValidationErrors(prev => ({ ...prev, confirm_password: 'Passwords do not match' }));
      } else if (registerForm.confirm_password && value === registerForm.confirm_password) {
        setValidationErrors(prev => ({ ...prev, confirm_password: '' }));
      }
    } else if (name === 'confirm_password') {
      if (value !== pwd) {
        err = 'Passwords do not match';
      }
    }
    setValidationErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRegisterForm(prev => {
      const updated = { ...prev, [name]: value };
      validateField(name, value, name === 'password' ? value : updated.password);
      return updated;
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      setAuthToken(data.access_token, data.user_type, data.name);
      
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate all required fields
    if (!registerForm.full_name || !registerForm.college_email || !registerForm.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (registerForm.password !== registerForm.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    
    const errors = Object.values(validationErrors).filter(Boolean);
    if (errors.length > 0) {
      setError('Please fix validation errors first.');
      return;
    }

    setLoading(true);

    try {
      const { confirm_password: _, ...payload } = registerForm;
      const data = await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          year: parseInt(registerForm.year, 10),
        }),
      });

      setSuccess(true);
      setAuthToken(data.access_token, data.user_type, data.name);
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToAuth = () => {
    authSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col bg-black text-white relative overflow-hidden min-h-screen pt-16">
      
      {/* =================== PREMIUM NAVBAR =================== */}
      <header className="fixed top-0 left-0 w-full z-50 transition-all duration-500"
        style={{background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(212,175,55,0.08)'}}>
        
        {/* Ultra-thin gold accent line at very top */}
        <div className="h-px w-full" style={{background: 'linear-gradient(90deg, transparent 0%, #d4af37 30%, #f6e05e 50%, #d4af37 70%, transparent 100%)', opacity: 0.6}}></div>

        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 lg:px-12">
          
          {/* Logo */}
          <div className="flex items-center gap-3.5 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative h-10 w-10 overflow-hidden rounded-full flex-shrink-0"
              style={{border: '1.5px solid rgba(212,175,55,0.5)', boxShadow: '0 0 12px rgba(212,175,55,0.15)'}}>
              <img 
                src="/club_logo.jpg" 
                alt="Chakravyuha Logo" 
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-black tracking-[0.15em] uppercase" style={{background: 'linear-gradient(135deg, #d4af37, #f6e05e, #d4af37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontFamily: 'Georgia, serif'}}>CHAKRAVYUHA</span>
              <span className="text-[9px] tracking-[0.25em] text-[#c5a059]/60 uppercase font-medium">Amrita · Amaravati</span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-10">
            {[
              { label: 'Impact & Growth', id: 'impact-section' },
              { label: 'Our Team', id: 'team-section' },
              { label: 'Campus Guide', id: 'campus-guide-section' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
                className="relative text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400 hover:text-white transition-colors duration-300 group py-1"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-px group-hover:w-full transition-all duration-400" style={{background: 'linear-gradient(90deg, #d4af37, #f6e05e)'}}></span>
              </button>
            ))}
            
            <button 
              onClick={scrollToAuth}
              className="relative text-[11px] font-black uppercase tracking-[0.18em] text-black px-5 py-2.5 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105"
              style={{background: 'linear-gradient(135deg, #d4af37 0%, #f6e05e 50%, #8c7030 100%)', boxShadow: '0 4px 20px rgba(212,175,55,0.25)'}}
            >
              <span className="relative z-10">Login / Register</span>
            </button>
          </nav>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={scrollToAuth}
              className="text-[10px] font-black uppercase tracking-wider text-black px-3 py-2 rounded-lg"
              style={{background: 'linear-gradient(135deg, #d4af37, #8c7030)'}}
            >
              Login
            </button>
            <button 
              onClick={() => {
                const target = document.getElementById('mobile-nav');
                if (target) target.classList.toggle('hidden');
              }}
              className="p-2 text-zinc-400 hover:text-[#d4af37] transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

        </div>

        {/* Mobile Nav dropdown */}
        <div id="mobile-nav" className="hidden py-4 px-6 space-y-4"
          style={{background: 'rgba(0,0,0,0.95)', borderTop: '1px solid rgba(212,175,55,0.1)'}}>

          <button 
            onClick={() => {
              document.getElementById('impact-section')?.scrollIntoView({ behavior: 'smooth' });
              document.getElementById('mobile-nav')?.classList.add('hidden');
            }}
            className="block w-full text-left text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-[#d4af37] py-2 transition-colors"
          >
            Impact & Growth
          </button>
          <button 
            onClick={() => {
              document.getElementById('team-section')?.scrollIntoView({ behavior: 'smooth' });
              document.getElementById('mobile-nav')?.classList.add('hidden');
            }}
            className="block w-full text-left text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-[#d4af37] py-2 transition-colors"
          >
            Our Team
          </button>
          <button 
            onClick={() => {
              document.getElementById('campus-guide-section')?.scrollIntoView({ behavior: 'smooth' });
              document.getElementById('mobile-nav')?.classList.add('hidden');
            }}
            className="block w-full text-left text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-[#d4af37] py-2 transition-colors"
          >
            Campus Guide
          </button>
          <button 
            onClick={() => {
              scrollToAuth();
              document.getElementById('mobile-nav')?.classList.add('hidden');
            }}
            className="block w-full text-left text-xs font-bold uppercase tracking-wider py-2 transition-colors"
            style={{color: '#d4af37'}}
          >
            Login / Register →
          </button>
        </div>
      </header>



      {/* Background radial glows */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/3 w-[450px] h-[450px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 py-20 overflow-hidden">
        
        {/* Background Video */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <video 
            ref={videoRef}
            autoPlay 
            loop 
            muted
            playsInline 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full object-cover opacity-100"
          >
            <source src="/intro_reveal.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black"></div>
        </div>

        <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 select-none relative z-10 bg-black/40 backdrop-blur-md border border-[#8c7030]/25 p-5 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/90 w-full">
          
          <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 border-[#d4af37]/80 bg-zinc-950 shadow-lg gold-border-glow">
            <Shield className="h-8 w-8 sm:h-9 sm:w-9 text-[#d4af37]" />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-wider font-serif text-gold-gradient py-1 sm:py-2 drop-shadow-[0_4px_16px_rgba(212,175,55,0.45)]">
              CHAKRAVYUHA
            </h1>
            <p className="text-xs sm:text-sm md:text-base font-black tracking-widest text-[#d4af37] uppercase max-w-xl mx-auto border-y border-[#8c7030]/20 py-2.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Official Coding & DSA Club of Amrita
            </p>
          </div>

          <p className="text-xs sm:text-sm md:text-base text-zinc-200 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            We are the vanguard of competitive programmers, algorithmic thinkers, and software engineers. Join our ranks to conquer weekly challenges, construct production systems, and launch into national hackathons.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-2 sm:pt-4 relative z-20 w-full">
            <button
              onClick={scrollToAuth}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-lg border border-[#d4af37] bg-gradient-to-r from-[#d4af37] to-[#8c7030] text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider hover:from-[#f6e05e] hover:to-[#d4af37] transition-all shadow-xl shadow-amber-500/5"
            >
              Enter Club Portal
            </button>
            <button
              onClick={() => {
                document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:text-white text-zinc-300 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer flex flex-col items-center gap-1.5 text-zinc-500" onClick={() => {
          document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' });
        }}>
          <span className="text-[10px] uppercase font-bold tracking-widest">Scroll Down</span>
          <ArrowDown className="h-4 w-4 text-[#d4af37]" />
        </div>
      </section>

      {/* 2. ABOUT THE CLUB SECTION */}
      <section id="about-section" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 w-full relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          
          <div className="lg:col-span-6 space-y-6 reveal-skew-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#8c7030]/40 bg-zinc-950/80 text-[10px] font-extrabold text-[#d4af37] uppercase tracking-wider">
              <Code className="h-3.5 w-3.5" /> Who We Are
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-white leading-tight">
              Shaping the Next Generation of <span className="text-gold-gradient glow-text-gold">Tech Leaders</span>
            </h2>
            <p className="text-base text-zinc-200 font-normal leading-relaxed">
              Chakravyuha is Amrita's premier technical hub for coders. We provide a structured environment to cultivate coding standards, algorithmic problem-solving capabilities, and software design skills.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="flex items-start gap-3 p-4 rounded-xl border border-zinc-900 bg-zinc-950/60 shadow-md">
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[#d4af37] flex-shrink-0">
                  <Terminal className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm">DSA Challenges</h4>
                  <p className="text-xs text-zinc-300 mt-1 font-light leading-relaxed">Topic-wise daily sheets curated for beginners and experts.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 rounded-xl border border-zinc-900 bg-zinc-950/60 shadow-md">
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[#d4af37] flex-shrink-0">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm">Hackathon Mentorship</h4>
                  <p className="text-xs text-zinc-300 mt-1 font-light leading-relaxed">Preparation blueprints and mentorship for SIH 2026.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Visual Frame */}
          <div className="lg:col-span-6 space-y-4 select-none reveal-scale-up">
            <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950/40 backdrop-blur-md overflow-hidden aspect-[16/10] shadow-2xl group p-3 slashed-clip gradient-border-animated">
              <div className="w-full h-full relative rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950">
                <img 
                  src="/DSC01551.JPG" 
                  alt="Chakravyuha Featured Visual"
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-all duration-700 group-hover:scale-103"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/15 to-zinc-955/90 mix-blend-multiply"></div>
                <div className="absolute bottom-6 left-6 right-6 space-y-1.5">
                  <span className="text-[9px] uppercase font-black text-[#d4af37] tracking-widest bg-[#d4af37]/10 px-2 py-0.5 rounded border border-[#d4af37]/20">Featured Arena</span>
                  <h3 className="text-xl font-bold tracking-wide font-serif text-[#d4af37]">
                    The Amrita Vanguard
                  </h3>
                  <p className="text-xs text-zinc-200 leading-relaxed font-light">
                    Forging competitive programming leaders through algorithmic excellence and national hackathon conquests.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. SHOWCASE GALLERY SECTION */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 w-full relative tech-dot-grid">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3 reveal-skew-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#8c7030]/20 bg-zinc-950/80 text-[10px] font-extrabold text-[#d4af37] uppercase tracking-wider">
            <Trophy className="h-3.5 w-3.5" /> Club Showcase
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-serif text-white tracking-wide leading-tight">
            Warriors in the <span className="text-gold-gradient glow-text-gold">Battlefield</span>
          </h2>
          <p className="text-base text-zinc-200 font-normal leading-relaxed max-w-xl mx-auto">
            Witness the focus, intensity, and triumph of Chakravyuha members conquering real-world challenges, algorithms, and hackathons.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Photo 1 */}
          <div className="group relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950/40 p-4 shadow-xl reveal-scale-up slashed-clip gradient-border-animated">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950">
              <img 
                src="/DSC01551.JPG" 
                alt="Chakravyuha coding lab session" 
                className="w-full h-full object-cover image-glow-hover opacity-70 group-hover:opacity-100 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 space-y-2">
                <span className="text-[9px] uppercase font-black text-[#d4af37] tracking-widest bg-[#d4af37]/15 px-2 py-0.5 rounded border border-[#d4af37]/30">Competitive Coding</span>
                <h3 className="text-lg font-bold text-white font-serif tracking-wide">High-Octane Coding Wars</h3>
                <p className="text-xs text-zinc-200 font-normal leading-relaxed">Students testing their algorithms in local club battlegrounds and mock runs.</p>
              </div>
            </div>
          </div>

          {/* Photo 2 */}
          <div className="group relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950/40 p-4 shadow-xl reveal-scale-up delay-100 slashed-clip gradient-border-animated">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950">
              <img 
                src="/DSC01678.JPG" 
                alt="Chakravyuha Founders" 
                className="w-full h-full object-cover image-glow-hover opacity-70 group-hover:opacity-100 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 space-y-2">
                <span className="text-[9px] uppercase font-black text-[#d4af37] tracking-widest bg-[#d4af37]/15 px-2 py-0.5 rounded border border-[#d4af37]/30">Founders</span>
                <h3 className="text-lg font-bold text-white font-serif tracking-wide">Chakravyuha Founders</h3>
                <p className="text-xs text-zinc-200 font-normal leading-relaxed">The builders who laid down the initial blueprints of algorithmic and coding mentorship at Amrita.</p>
              </div>
            </div>
          </div>

          {/* Photo 3 */}
          <div className="group relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950/40 p-4 shadow-xl reveal-scale-up delay-200 slashed-clip gradient-border-animated">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950">
              <img 
                src="/DSC07025.JPG" 
                alt="Hackathon team whiteboarding" 
                className="w-full h-full object-cover image-glow-hover opacity-70 group-hover:opacity-100 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 space-y-2">
                <span className="text-[9px] uppercase font-black text-purple-400 tracking-widest bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">Brainstorming</span>
                <h3 className="text-lg font-bold text-white font-serif tracking-wide">Hackathon Warfare Room</h3>
                <p className="text-xs text-zinc-200 font-normal leading-relaxed">Cross-functional teams designing blueprints to solve national challenges for SIH.</p>
              </div>
            </div>
          </div>

          {/* Photo 4 */}
          <div className="group relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950/40 p-4 shadow-xl reveal-scale-up delay-300 slashed-clip gradient-border-animated">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950">
              <img 
                src="/DSC07187.JPG.jpeg" 
                alt="Award ceremonies" 
                className="w-full h-full object-cover image-glow-hover opacity-70 group-hover:opacity-100 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 space-y-2">
                <span className="text-[9px] uppercase font-black text-emerald-400 tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Core Team</span>
                <h3 className="text-lg font-bold text-white font-serif tracking-wide">Chakravyuha Core Team</h3>
                <p className="text-xs text-zinc-200 font-normal leading-relaxed">The elite squad coordinating sheets, contests, and hackathons for all club members.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =================== THE CHAKRAVYUHA REVOLUTION & IMPACT SECTION =================== */}
      <section id="impact-section" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 w-full relative">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4 reveal-skew-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#8c7030]/40 bg-zinc-950/90 text-[10px] font-black text-[#d4af37] uppercase tracking-[0.2em] shadow-lg">
            <TrendingUp className="h-3.5 w-3.5 text-[#d4af37]" /> Exponential Growth & Impact
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black font-serif text-white tracking-tight leading-tight">
            How We Revolutionized <br />
            <span className="text-gold-gradient glow-text-gold">Amrita's Tech Ecosystem</span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-300 font-normal leading-relaxed max-w-2xl mx-auto">
            From isolated coders working in silence to a high-octane national powerhouse of hackathon champions, daily problem solvers, and peer mentors.
          </p>
        </div>

        {/* 1. KEY METRICS & MILESTONE CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          
          <div className="relative group p-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-md hover:border-[#d4af37]/50 transition-all duration-500 reveal-scale-up hover:-translate-y-1 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-[#d4af37] group-hover:scale-110 transition-transform">
              <Trophy className="h-6 w-6" />
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-black font-serif text-white tracking-tight">12x</span>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Surge</span>
            </div>
            <h4 className="text-sm font-bold text-zinc-200 mb-1">Hackathon Participation</h4>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">From 5 scattered entries to 65+ registered squads in SIH & national hackathons.</p>
          </div>

          <div className="relative group p-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-md hover:border-[#d4af37]/50 transition-all duration-500 reveal-scale-up delay-100 hover:-translate-y-1 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6" />
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-black font-serif text-white tracking-tight">350+</span>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Warriors</span>
            </div>
            <h4 className="text-sm font-bold text-zinc-200 mb-1">Daily Active Coders</h4>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">Active student community solving YUKTI DSA sheets with live leaderboard tracking.</p>
          </div>

          <div className="relative group p-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-md hover:border-[#d4af37]/50 transition-all duration-500 reveal-scale-up delay-200 hover:-translate-y-1 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
              <Terminal className="h-6 w-6" />
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-black font-serif text-white tracking-tight">45k+</span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Submissions</span>
            </div>
            <h4 className="text-sm font-bold text-zinc-200 mb-1">DSA Problems Solved</h4>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">Algorithmic submissions logged across LeetCode, CodeChef, and platform sheets.</p>
          </div>

          <div className="relative group p-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-md hover:border-[#d4af37]/50 transition-all duration-500 reveal-scale-up delay-300 hover:-translate-y-1 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform">
              <Award className="h-6 w-6" />
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-black font-serif text-white tracking-tight">18+</span>
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Finalists</span>
            </div>
            <h4 className="text-sm font-bold text-zinc-200 mb-1">National Finalist Teams</h4>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">Teams selected for national stages in SIH and inter-collegiate hackathons.</p>
          </div>

        </div>

        {/* 2. INTERACTIVE HACKATHON PARTICIPATION GRAPH */}
        <div className="mb-24 rounded-3xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl p-6 sm:p-10 shadow-2xl relative overflow-hidden reveal-scale-up">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-zinc-800/80 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#d4af37] mb-1">
                <Activity className="h-4 w-4" /> Interactive Growth Curve
              </div>
              <h3 className="text-2xl font-serif font-bold text-white">Hackathon Participation Skyrocket</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Click timeline node to inspect era:</span>
            </div>
          </div>

          {/* SVG Vector Chart */}
          <div className="relative w-full overflow-x-auto">
            <div className="min-w-[650px]">
              <svg viewBox="0 0 800 240" className="w-full h-auto overflow-visible select-none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4af37" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#d4af37" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="35%" stopColor="#f59e0b" />
                    <stop offset="70%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#d4af37" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line x1="40" y1="40" x2="760" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                <line x1="40" y1="100" x2="760" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                <line x1="40" y1="160" x2="760" y2="160" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

                {/* Y-Axis Labels */}
                <text x="30" y="44" fill="#71717a" fontSize="10" textAnchor="end" fontFamily="monospace">450+</text>
                <text x="30" y="104" fill="#71717a" fontSize="10" textAnchor="end" fontFamily="monospace">180</text>
                <text x="30" y="164" fill="#71717a" fontSize="10" textAnchor="end" fontFamily="monospace">48</text>
                <text x="30" y="214" fill="#71717a" fontSize="10" textAnchor="end" fontFamily="monospace">12</text>

                {/* Area Fill Under Curve */}
                <path
                  d="M 60,195 L 60,195 Q 180,180 280,150 T 500,90 T 740,30 L 740,210 L 60,210 Z"
                  fill="url(#chartGradient)"
                />

                {/* Smooth Curved Trend Line */}
                <path
                  d="M 60,195 Q 180,180 280,150 T 500,90 T 740,30"
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {/* Interactive Points / Nodes */}
                {[
                  { x: 60, y: 195, idx: 0 },
                  { x: 280, y: 150, idx: 1 },
                  { x: 500, y: 90, idx: 2 },
                  { x: 740, y: 30, idx: 3 },
                ].map((node) => {
                  const item = graphMilestones[node.idx];
                  const isSelected = selectedGraphEra === node.idx;
                  return (
                    <g key={node.idx} className="cursor-pointer group" onClick={() => setSelectedGraphEra(node.idx)}>
                      {isSelected && (
                        <circle cx={node.x} cy={node.y} r="14" fill="none" stroke={item.color} strokeWidth="2" className="animate-ping opacity-75" />
                      )}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={isSelected ? "9" : "7"}
                        fill="#0b0b0c"
                        stroke={item.color}
                        strokeWidth="3"
                        className="transition-all duration-300 group-hover:scale-125"
                      />
                      <text x={node.x} y={node.y - 16} fill={isSelected ? "#ffffff" : "#a1a1aa"} fontSize="11" fontWeight="bold" textAnchor="middle">
                        {item.participants} Warriors
                      </text>
                      <text x={node.x} y="230" fill={isSelected ? "#d4af37" : "#71717a"} fontSize="10" fontWeight="bold" textAnchor="middle">
                        {item.year}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Selected Node Detailed Info Card */}
          <div className="mt-8 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md transition-all duration-500">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ background: graphMilestones[selectedGraphEra].color }}></span>
                <h4 className="text-lg font-bold text-white font-serif">{graphMilestones[selectedGraphEra].era}</h4>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border"
                  style={{ color: graphMilestones[selectedGraphEra].color, borderColor: `${graphMilestones[selectedGraphEra].color}40`, backgroundColor: `${graphMilestones[selectedGraphEra].color}15` }}>
                  {graphMilestones[selectedGraphEra].tag}
                </span>
              </div>
              <div className="text-xs font-mono text-zinc-400">
                Teams Formed: <strong className="text-white">{graphMilestones[selectedGraphEra].teams} Teams</strong>
              </div>
            </div>
            <p className="text-sm text-zinc-300 font-light leading-relaxed mb-4">
              {graphMilestones[selectedGraphEra].desc}
            </p>
            <div className="flex flex-wrap gap-2">
              {graphMilestones[selectedGraphEra].highlights.map((h, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#d4af37]" /> {h}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 3. BEFORE vs AFTER CHAKRAVYUHA COMPARISON */}
        <div className="mb-24 reveal-skew-up">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#d4af37] mb-2">
              <Sparkles className="h-4 w-4" /> The Paradigm Shift
            </div>
            <h3 className="text-3xl font-serif font-bold text-white">Before vs. After Chakravyuha</h3>
            <p className="text-xs text-zinc-400 mt-2">See how our club transformed student culture across Amrita Amaravati campus.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* BEFORE CARD */}
            <div className="p-8 rounded-3xl border border-red-950/60 bg-zinc-950/90 relative overflow-hidden shadow-xl group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-red-950/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                    <XCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500">The Past Era</span>
                    <h4 className="text-lg font-bold text-white font-serif">Before Chakravyuha</h4>
                  </div>
                </div>
                <span className="text-xs font-mono text-zinc-500">Pre-2024</span>
              </div>

              <ul className="space-y-5">
                {[
                  { title: "Isolated Solo Coding", desc: "Students practiced individually in silos without code reviews or guidance." },
                  { title: "Low Hackathon Turnout", desc: "Barely 1-2 teams attempting national hackathons like SIH without support." },
                  { title: "Inconsistent Practice", desc: "High drop-off rate after 3 days of independent LeetCode practice." },
                  { title: "Lack of Junior Roadmaps", desc: "Freshmen confused about tech stacks, rules, and contest preparations." },
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0 mt-0.5">
                      <span className="text-xs">✕</span>
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-zinc-200">{item.title}</h5>
                      <p className="text-xs text-zinc-400 font-light mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* AFTER CARD */}
            <div className="p-8 rounded-3xl border border-[#d4af37]/40 bg-zinc-950/90 relative overflow-hidden shadow-2xl group shadow-[#d4af37]/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#d4af37]/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]">The Golden Era</span>
                    <h4 className="text-lg font-bold text-white font-serif">After Chakravyuha</h4>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#d4af37] font-bold">Present Era</span>
              </div>

              <ul className="space-y-5">
                {[
                  { title: "Unified Vanguard Squads", desc: "Structured YUKTI DSA sheets, core lead mentorship, and peer debugging." },
                  { title: "65+ Hackathon Teams", desc: "Systematic hackathon training blueprints resulting in 18+ national finalists!" },
                  { title: "Gamified Streak Tracking", desc: "Daily QR scanner check-ins, live ranks, and continuous 45+ day solve streaks." },
                  { title: "Student-Built Campus Guides", desc: "Comprehensive student-developed Netlify compass portals guiding upcoming batches." },
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] flex-shrink-0 mt-0.5">
                      <span className="text-xs">✓</span>
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">{item.title}</h5>
                      <p className="text-xs text-zinc-300 font-light mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* 4. STUDENT FEEDBACK & LOVE (HORIZONTAL SCROLL REVEAL CAROUSEL) */}
        <div className="reveal-skew-up">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#d4af37] mb-2">
                <Quote className="h-4 w-4" /> Student Love & Endorsements
              </div>
              <h3 className="text-3xl font-serif font-bold text-white">What Warriors Say About Chakravyuha</h3>
            </div>
            
            {/* Scroll Navigation Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => scrollTestimonials('left')}
                className="w-10 h-10 rounded-xl border border-zinc-800 bg-zinc-950/80 hover:border-[#d4af37]/50 hover:bg-zinc-900 text-zinc-300 hover:text-white flex items-center justify-center transition-all shadow-md"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => scrollTestimonials('right')}
                className="w-10 h-10 rounded-xl border border-zinc-800 bg-zinc-950/80 hover:border-[#d4af37]/50 hover:bg-zinc-900 text-zinc-300 hover:text-white flex items-center justify-center transition-all shadow-md"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Horizontal Scroll Track */}
          <div
            ref={testimonialScrollRef}
            className="flex gap-6 overflow-x-auto pb-8 scrollbar-none snap-x snap-mandatory select-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {studentTestimonials.map((t, i) => (
              <div
                key={i}
                className="w-[320px] sm:w-[380px] flex-shrink-0 snap-start p-7 rounded-3xl border border-zinc-800 bg-zinc-950/70 backdrop-blur-xl hover:border-[#d4af37]/40 transition-all duration-500 flex flex-col justify-between shadow-xl hover:-translate-y-1 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex text-amber-400 text-sm gap-0.5">
                      {'★'.repeat(t.rating)}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${t.badgeColor}`}>
                      {t.badge}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-200 font-light leading-relaxed mb-6 italic">
                    "{t.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-zinc-900">
                  <div className="w-9 h-9 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] flex-shrink-0 shadow-sm">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white group-hover:text-[#d4af37] transition-colors">{t.name}</h5>
                    <p className="text-xs text-zinc-400 font-light">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* =================== TEAM SECTION =================== */}
      <section id="team-section" className="relative z-10 overflow-hidden"
        style={{background: 'linear-gradient(180deg, #050505 0%, #080600 50%, #050505 100%)'}}>
        
        {/* Cyber grid background */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(212,175,55,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.6) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}></div>
        
        {/* Ambient glow orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] pointer-events-none opacity-[0.03]"
          style={{background: 'radial-gradient(ellipse, #d4af37, transparent 70%)', filter: 'blur(80px)'}}></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] pointer-events-none opacity-[0.03]"
          style={{background: 'radial-gradient(ellipse, #d4af37, transparent 70%)', filter: 'blur(60px)'}}></div>

        <div className="max-w-[1500px] mx-auto px-6 lg:px-16 py-28">

          {/* HEADER */}
          <div className="mb-20 reveal-skew-up">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 max-w-[80px]" style={{background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5))'}}></div>
              <span className="text-[10px] uppercase tracking-[0.5em] font-black" style={{color: 'rgba(212,175,55,0.6)'}}>CHAKRAVYUHA · PERSONNEL DATABASE</span>
              <div className="h-px flex-1" style={{background: 'linear-gradient(90deg, rgba(212,175,55,0.5), transparent)'}}></div>
            </div>
            <h2 className="text-6xl md:text-8xl lg:text-[9rem] font-black leading-none tracking-tight mb-4" style={{
              fontFamily: 'Georgia, serif',
              background: 'linear-gradient(135deg, #ffffff 0%, #d4af37 40%, #8c7030 70%, #d4af37 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              letterSpacing: '-0.03em'
            }}>
              THE PANTHEON
            </h2>
            <p className="text-zinc-500 text-base max-w-lg font-light tracking-wide mt-4" style={{letterSpacing: '0.05em'}}>
              Authorized Personnel Only — Chakravyuha Command Structure
            </p>
          </div>

          {/* MAIN LAYOUT */}
          <div className="flex flex-col lg:flex-row gap-12 items-start">

            {/* LEFT: Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="lg:sticky lg:top-24 overflow-hidden" style={{
                background: 'rgba(10,8,0,0.8)',
                border: '1px solid rgba(212,175,55,0.08)',
                backdropFilter: 'blur(30px)',
                clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
              }}>
                {/* Sidebar header */}
                <div className="px-5 py-4 flex items-center gap-2" style={{borderBottom: '1px solid rgba(212,175,55,0.06)'}}>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background: '#d4af37', boxShadow: '0 0 6px #d4af37'}}></div>
                  <p className="text-[9px] uppercase tracking-[0.4em] font-black" style={{color: 'rgba(212,175,55,0.5)'}}>DIVISION SELECT</p>
                </div>
                {[
                  { id: 'founders', label: 'Founders & Co-Founders', count: 7 },
                  { id: 'core', label: 'Core Secretariat', count: 3 },
                  { id: 'tech', label: 'Tech Leads', count: 5 },
                  { id: 'design', label: 'Design Leads', count: 4 },
                  { id: 'events', label: 'Events & PR Leads', count: 7 },
                  { id: 'content', label: 'Content Leads', count: 2 },
                  { id: 'community', label: 'Community Leads', count: 2 },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedDept(tab.id as any)}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left transition-all duration-300 relative group"
                    style={{
                      borderBottom: '1px solid rgba(212,175,55,0.04)',
                      borderLeft: selectedDept === tab.id ? '2px solid #d4af37' : '2px solid transparent',
                      background: selectedDept === tab.id ? 'linear-gradient(90deg, rgba(212,175,55,0.07), transparent)' : 'transparent'
                    }}
                  >
                    {/* Active scan line */}
                    {selectedDept === tab.id && (
                      <div className="absolute inset-0 pointer-events-none opacity-30"
                        style={{background: 'linear-gradient(90deg, rgba(212,175,55,0.1), transparent 60%)'}}></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-xs uppercase tracking-wider truncate transition-colors ${selectedDept === tab.id ? 'text-[#d4af37]' : 'text-zinc-600 group-hover:text-zinc-300'}`}
                        style={{letterSpacing: '0.12em'}}>
                        {tab.label}
                      </p>
                    </div>
                    <span className="text-[9px] font-black flex-shrink-0"
                      style={{color: selectedDept === tab.id ? 'rgba(212,175,55,0.7)' : 'rgba(255,255,255,0.1)'}}>
                      {String(tab.count).padStart(2, '0')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT: Cards */}
            <div className="flex-1 min-w-0">
              {/* Section title */}
              <div className="mb-10 dept-slide-in" key={selectedDept}>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-[0.5em] font-black mb-1" style={{color: 'rgba(212,175,55,0.4)'}}>
                      DIVISION
                    </span>
                    <h3 className="text-3xl font-black text-white uppercase" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
                      {selectedDept === 'founders' ? 'Founders & Co-Founders' :
                       selectedDept === 'core' ? 'Core Secretariat' :
                       selectedDept === 'tech' ? 'Tech Leads' :
                       selectedDept === 'design' ? 'Design Leads' :
                       selectedDept === 'events' ? 'Events & PR Leads' :
                       selectedDept === 'content' ? 'Content Leads' : 'Community Leads'}
                    </h3>
                  </div>
                  <div className="flex-1 h-px" style={{background: 'linear-gradient(90deg, rgba(212,175,55,0.3), transparent)'}}></div>
                </div>
              </div>

              {/* Member Cards — Futuristic Portrait Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {teamMembers
                  .filter((m) => m.dept === selectedDept)
                  .map((member, idx) => (
                    <div
                      key={`${selectedDept}-${idx}`}
                      onClick={() => setSelectedMember(member)}
                      className="group relative cursor-pointer overflow-hidden"
                      style={{
                        aspectRatio: (selectedDept === 'founders' || selectedDept === 'core') ? '1/1' : '4/5',
                        background: '#0a0800',
                        transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                        clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-10px) scale(1.03)';
                        e.currentTarget.style.boxShadow = '0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.4), 0 0 30px rgba(212,175,55,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                        e.currentTarget.style.boxShadow = '0 0 0 1px rgba(212,175,55,0.08)';
                      }}
                    >
                      {/* Outer border via box-shadow on rest */}
                      <div className="absolute inset-0" style={{boxShadow: 'inset 0 0 0 1px rgba(212,175,55,0.08)'}}></div>

                      {/* Photo - Centered to match exact aspect ratio */}
                      <img
                        src={member.img}
                        alt={member.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        style={{objectPosition: 'center center'}}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const p = e.currentTarget.parentElement!;
                          p.style.background = 'linear-gradient(160deg, #1a1200 0%, #0a0800 100%)';
                        }}
                      />

                      {/* Bottom gradient for text readability */}
                      <div className="absolute inset-0" style={{
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.7) 75%, rgba(0,0,0,0.95) 100%)'
                      }}></div>


                      {/* Scan line effect */}
                      <div className="absolute inset-0 opacity-[0.04] pointer-events-none group-hover:opacity-[0.07] transition-opacity" style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, rgba(212,175,55,0.8) 0px, rgba(212,175,55,0.8) 1px, transparent 1px, transparent 3px)',
                        backgroundSize: '100% 3px'
                      }}></div>

                      {/* Hover neon border glow */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{boxShadow: 'inset 0 0 0 1px rgba(212,175,55,0.35), inset 0 0 20px rgba(212,175,55,0.05)'}}></div>

                      {/* Top-right diagonal slash decoration */}
                      <div className="absolute top-0 right-0 w-8 h-8 opacity-40 group-hover:opacity-80 transition-opacity duration-300"
                        style={{background: 'linear-gradient(225deg, rgba(212,175,55,0.5) 0%, transparent 60%)'}}></div>

                      {/* Index number — top left */}
                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-black" style={{
                          color: 'rgba(212,175,55,0.35)',
                          fontFamily: 'monospace',
                          letterSpacing: '0.1em'
                        }}>{String(idx + 1).padStart(2, '0')}</span>
                      </div>

                      {/* Bottom info panel */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        {/* Role badge — appears on hover */}
                        <div className="mb-2 overflow-hidden" style={{height: '0', transition: 'height 0.3s ease'}}>
                          <span className="text-[8px] uppercase tracking-[0.25em] font-black px-2 py-0.5 block w-fit"
                            style={{
                              background: 'rgba(212,175,55,0.1)',
                              border: '1px solid rgba(212,175,55,0.25)',
                              color: '#d4af37',
                              clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)'
                            }}>
                            {member.dept === 'founders' ? (member.role === 'Founder' ? 'FOUNDER' : 'CO-FOUNDER') : member.role.toUpperCase()}
                          </span>
                        </div>

                        <h4 className="text-white font-black text-base leading-tight" style={{
                          fontFamily: 'Georgia, serif',
                          textShadow: '0 2px 20px rgba(0,0,0,1)',
                          letterSpacing: '0.02em'
                        }}>
                          {member.name}
                        </h4>

                        {/* Expandable role text on hover */}
                        <p className="text-xs font-medium mt-0.5 translate-y-1 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
                          style={{color: 'rgba(212,175,55,0.65)'}}>
                          {member.role}
                        </p>

                        {/* CTA line */}
                        <div className="flex items-center gap-2 mt-3 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400">
                          <div className="h-px w-4" style={{background: '#d4af37'}}></div>
                          <span className="text-[8px] uppercase tracking-[0.3em] font-black" style={{color: 'rgba(212,175,55,0.5)'}}>VIEW FILE</span>
                        </div>
                      </div>

                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================== MEMBER MODAL =================== */}
      {selectedMember && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop-enter"
          style={{background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)'}}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedMember(null); }}
        >
          <div className="modal-enter relative w-full max-w-4xl overflow-hidden"
            style={{
              background: '#060500',
              border: '1px solid rgba(212,175,55,0.15)',
              maxHeight: '92vh',
              overflow: 'auto',
              clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))'
            }}>

            {/* Cyber grid overlay */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
              backgroundImage: `linear-gradient(rgba(212,175,55,1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}></div>

            {/* Close */}
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-5 right-5 z-20 w-10 h-10 flex items-center justify-center transition-all duration-300 hover:scale-110 group"
              style={{background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)',
                clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))'}}
            >
              <X className="w-4 h-4 text-zinc-500 group-hover:text-[#d4af37] transition-colors" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-[45%_55%] min-h-[480px]">

              {/* LEFT: Full photo */}
              <div className="relative overflow-hidden min-h-[320px] md:min-h-0 bg-[#080600] flex items-center justify-center p-3">
                <img
                  src={selectedMember.img}
                  alt={selectedMember.name}
                  className="w-full h-full object-contain max-h-[520px] transition-transform duration-500"
                  style={{objectPosition: 'center center'}}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const p = e.currentTarget.parentElement!;
                    p.style.background = 'linear-gradient(160deg, #1a1200, #060500)';
                  }}
                />
                {/* Gradient fades for blending */}
                <div className="absolute inset-0 hidden md:block" style={{
                  background: 'linear-gradient(90deg, transparent 60%, #060500 100%)'
                }}></div>
                <div className="absolute inset-0 md:hidden" style={{
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 40%, rgba(6,5,0,1) 95%)'
                }}></div>
                {/* Scan lines */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, rgba(212,175,55,0.8) 0px, transparent 1px, transparent 3px)',
                  backgroundSize: '100% 3px'
                }}></div>
              </div>

              {/* RIGHT: Info panel */}
              <div className="relative p-8 md:p-12 flex flex-col justify-center">

                {/* Top classification badge */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{background: '#d4af37', boxShadow: '0 0 8px #d4af37'}}></div>
                  <span className="text-[9px] uppercase tracking-[0.5em] font-black" style={{color: 'rgba(212,175,55,0.5)'}}>
                    {selectedMember.dept === 'founders' ? 'FOUNDER CIRCLE' : selectedMember.dept === 'core' ? 'CORE SECRETARIAT' : 'DIVISION COMMANDER'}
                  </span>
                </div>

                {/* Name */}
                <h2 className="font-black leading-tight mb-1" style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  letterSpacing: '-0.01em',
                  background: 'linear-gradient(135deg, #fff 0%, rgba(212,175,55,0.8) 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                }}>
                  {selectedMember.name}
                </h2>
                <p className="text-sm font-semibold uppercase tracking-widest" style={{color: 'rgba(212,175,55,0.6)'}}>
                  {selectedMember.role}
                </p>

                {/* Special title badge — shown only when member has a title */}
                {selectedMember.title && (
                  <div className="mt-3 mb-6 inline-flex items-center gap-2 px-3 py-1.5"
                    style={{
                      background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.05))',
                      border: '1px solid rgba(212,175,55,0.35)',
                      clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))'
                    }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background: '#d4af37', boxShadow: '0 0 6px #d4af37'}}></div>
                    <span className="text-xs font-black uppercase tracking-widest" style={{color: '#d4af37'}}>
                      {selectedMember.title}
                    </span>
                  </div>
                )}

                {/* Divider */}
                <div className="h-px mb-8 mt-4" style={{background: 'linear-gradient(90deg, rgba(212,175,55,0.3), transparent)'}}></div>

                {/* Data rows */}
                <div className="space-y-5 mb-10">
                  {([
                    { label: 'DIVISION', value: selectedMember.dept.toUpperCase() },
                    { label: 'DESIGNATION', value: selectedMember.role },
                    selectedMember.title ? { label: 'STUDENT TITLE', value: selectedMember.title } : null,
                    { label: 'HEADQUARTERS', value: 'Amrita Vishwa Vidyapeetham, Amaravati' },
                    { label: 'CLEARANCE', value: selectedMember.dept === 'founders' ? 'ALPHA — HIGHEST' : selectedMember.dept === 'core' ? 'BETA — ELEVATED' : 'GAMMA — STANDARD' },
                  ].filter(Boolean) as {label: string, value: string}[]).map((row) => (
                    <div key={row.label} className="flex gap-4 items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="w-1 h-1 mt-[5px] rounded-full" style={{background: 'rgba(212,175,55,0.5)'}}></div>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.3em] mb-0.5" style={{color: 'rgba(212,175,55,0.35)'}}>
                          {row.label}
                        </p>
                        <p className="text-sm font-medium text-zinc-200">{row.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Close button */}
                <button
                  onClick={() => setSelectedMember(null)}
                  className="w-full py-4 font-black text-xs uppercase tracking-[0.4em] text-black transition-all duration-300 hover:opacity-90 hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #d4af37 0%, #f6e05e 50%, #8c7030 100%)',
                    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
                  }}
                >
                  CLOSE FILE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* 4. CLUB STATS PILLARS */}
      <section className="py-20 border-y border-[#8c7030]/15 bg-zinc-950/30 backdrop-blur-md z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            
            <div className="space-y-1.5 reveal-scale-up">
              <span className="block text-4xl sm:text-5xl font-extrabold text-[#d4af37] font-serif glow-text-gold">390+</span>
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Active Warriors</span>
            </div>

            <div className="space-y-1.5 reveal-scale-up delay-100">
              <span className="block text-4xl sm:text-5xl font-extrabold text-[#d4af37] font-serif glow-text-gold">5,000+</span>
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Problems Solved</span>
            </div>

            <div className="space-y-1.5 reveal-scale-up delay-200">
              <span className="block text-4xl sm:text-5xl font-extrabold text-[#d4af37] font-serif glow-text-gold">10+</span>
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Hackathons Won</span>
            </div>

            <div className="space-y-1.5 reveal-scale-up delay-300">
              <span className="block text-4xl sm:text-5xl font-extrabold text-[#d4af37] font-serif glow-text-gold">30+</span>
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Rankings Placed</span>
            </div>

          </div>
        </div>
      </section>

      {/* 4.5 CAMPUS COMPASS SECTION */}
      <section id="campus-guide-section" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 w-full relative tech-dot-grid border-t border-[#8c7030]/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left: Card visual linking to Haseeb's, Karthi's, and Narendra's sites */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4 order-2 lg:order-1 reveal-scale-up">
            
            {/* Card 1: Karthi */}
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-5 flex flex-col justify-between hover:scale-103 transition-transform">
              <div className="space-y-3">
                <Compass className="h-5 w-5 text-amber-400" />
                <h4 className="text-sm font-bold text-white font-serif">Campus Compass</h4>
                <p className="text-[10px] text-zinc-300 font-light leading-relaxed">
                  Interactive campus mapping, contact directory, and leave guides.
                </p>
              </div>
              <a 
                href="https://campus-compass-karthi.netlify.app/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="mt-4 flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 py-1.5 rounded hover:bg-amber-500 hover:text-black transition-colors"
              >
                Open Site <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Card 2: Haseeb */}
            <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-5 flex flex-col justify-between hover:scale-103 transition-transform">
              <div className="space-y-3">
                <Compass className="h-5 w-5 text-cyan-400" />
                <h4 className="text-sm font-bold text-white font-serif">Profound Alpaca</h4>
                <p className="text-[10px] text-zinc-300 font-light leading-relaxed">
                  Freshman orientation checklist, academic calendar, and photo gallery.
                </p>
              </div>
              <a 
                href="https://profound-alpaca-350538.netlify.app/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="mt-4 flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-cyan-400 bg-cyan-500/10 py-1.5 rounded hover:bg-cyan-500 hover:text-black transition-colors"
              >
                Open Site <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Card 3: Narendra */}
            <div className="rounded-xl border border-purple-500/25 bg-purple-500/5 p-5 flex flex-col justify-between hover:scale-103 transition-transform">
              <div className="space-y-3">
                <Compass className="h-5 w-5 text-purple-400" />
                <h4 className="text-sm font-bold text-white font-serif">Whimsical Selkie</h4>
                <p className="text-[10px] text-zinc-300 font-light leading-relaxed">
                  Grading system details, academic guidelines, and student rules.
                </p>
              </div>
              <a 
                href="https://whimsical-selkie-9ae561.netlify.app/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="mt-4 flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-purple-400 bg-purple-500/10 py-1.5 rounded hover:bg-purple-500 hover:text-black transition-colors"
              >
                Open Site <ExternalLink className="h-3 w-3" />
              </a>
            </div>

          </div>

          {/* Right: Symmetrical text block describing the event */}
          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2 reveal-skew-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#8c7030]/20 bg-zinc-950/80 text-[10px] font-extrabold text-[#d4af37] uppercase tracking-wider">
              <Map className="h-3.5 w-3.5 text-[#d4af37]" /> Campus Compass Guide
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-white leading-tight">
              Explore Amrita <span className="text-gold-gradient glow-text-gold">Campus Guide Portals</span>
            </h2>
            
            <p className="text-base text-zinc-200 font-normal leading-relaxed">
              During our flagship <strong>Campus Compass Event</strong>, Chakravyuha challenged students to engineer digital guide systems for incoming batches. Students developed interactive solutions containing campus routes, hostels guidelines, academic policies, mess menus, dos & donts, and resource libraries.
            </p>
            
            <div className="pt-2">
              <Link 
                href="/campus-guide" 
                className="inline-flex items-center gap-2.5 rounded border border-[#d4af37] bg-gradient-to-r from-[#d4af37] to-[#8c7030] px-6 py-3 text-xs font-bold uppercase tracking-wider text-black hover:from-[#f6e05e] hover:to-[#d4af37] transition-all shadow-lg shadow-[#d4af37]/5"
              >
                Open Full Campus Guide Hub <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 5. MAIN REGISTRATION AND LOGIN SECTION */}
      <section ref={authSectionRef} className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 w-full relative tech-dot-grid">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Descriptive info leading to registration */}
          <div className="lg:col-span-6 space-y-8 reveal-skew-up">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#8c7030]/30 bg-zinc-950/80 text-[10px] font-extrabold text-[#d4af37] uppercase tracking-wider">
                <Activity className="h-3.5 w-3.5" /> Portal Gateways
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif text-white leading-tight">
                Enter the <span className="text-gold-gradient glow-text-gold">Chakravyuha</span>
              </h2>
            </div>
            
            <p className="text-base text-zinc-200 font-normal leading-relaxed">
              Create an account or login to access your customized dashboard. Track your coding progress, submit solutions to YUKTI sheets, and download verification certificates for successful completions.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-4">
                <div className="p-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/35 text-[#d4af37] flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Unified Authentication</h4>
                  <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed font-light">One single account connects you across all sheets, challenges, and mock events.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/35 text-[#d4af37] flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Flexible Profiles</h4>
                  <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed font-light">Supports non-standard roll numbers and personal emails for incoming 2026 Batch warriors.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/35 text-[#d4af37] flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Dynamic Battlefield Stats</h4>
                  <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed font-light">Live updates, rank streaks, and secure digital certificate generation.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Symmetrical Vertical line separator (only visible on lg screens) */}
          <div className="hidden lg:flex lg:col-span-1 justify-center h-96 relative">
            <div className="w-[1px] glowing-portal-line h-full"></div>
          </div>

          {/* Right Column: Tabbed Auth Card */}
          <div className="lg:col-span-5 flex flex-col justify-center w-full reveal-scale-up">
            <div className="rounded-2xl relative w-full cyber-card-glow p-6 sm:p-8 slashed-clip">
              
              {/* Tab Selector */}
              <div className="flex border-b border-zinc-900 mb-6 gap-6">
                <button
                  onClick={() => { setActiveTab('login'); setError(null); }}
                  className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'login' ? 'text-[#d4af37]' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Enter (Login)
                  {activeTab === 'login' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#d4af37]"></div>}
                </button>
                <button
                  onClick={() => { setActiveTab('register'); setError(null); }}
                  className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'register' ? 'text-[#d4af37]' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Join (Register)
                  {activeTab === 'register' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#d4af37]"></div>}
                </button>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-2.5 rounded-md border border-rose-950 bg-rose-950/20 p-3 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-5 flex items-start gap-2.5 rounded-md border border-emerald-950 bg-emerald-950/20 p-3 text-xs text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Welcome warrior! Preparing your dashboard...</span>
                </div>
              )}

              {/* LOGIN FORM */}
              {activeTab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#d4af37] mb-1.5">
                      Email or Roll Number
                    </label>
                    <div className="relative">
                      <User className="absolute inset-y-0 left-3 h-full w-4 text-zinc-500 flex items-center" />
                      <input
                        type="text"
                        required
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="AV.SC.U4CSE23221 or personal@mail.com"
                        className="block w-full rounded border border-[#8c7030]/20 bg-zinc-900/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-500 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#d4af37] mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute inset-y-0 left-3 h-full w-4 text-zinc-500 flex items-center" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full rounded border border-[#8c7030]/20 bg-zinc-900/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-500 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Forgot Password link */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setForgotPasswordOpen(true)}
                      className="text-[11px] text-[#d4af37]/70 hover:text-[#d4af37] transition underline underline-offset-2"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 rounded border border-[#d4af37] bg-gradient-to-r from-[#d4af37] to-[#8c7030] py-2.5 text-sm font-bold uppercase tracking-wider text-black hover:from-[#f6e05e] hover:to-[#d4af37] transition-all disabled:opacity-50"
                  >
                    {loading ? 'Authorizing...' : 'Enter Battlefield'}
                  </button>
                </form>
              )}

              {/* Forgot Password Modal */}
              {forgotPasswordOpen && (
                <ForgotPasswordModal onClose={() => setForgotPasswordOpen(false)} />
              )}

              {/* REGISTER FORM */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#d4af37] mb-1.5">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute inset-y-0 left-3 h-full w-4 text-zinc-500 flex items-center" />
                      <input
                        type="text"
                        name="full_name"
                        required
                        value={registerForm.full_name}
                        onChange={handleRegisterChange}
                        placeholder="Krithick Sai"
                        className="block w-full rounded border border-[#8c7030]/20 bg-zinc-900/60 py-2 pl-10 pr-3 text-sm text-white placeholder-zinc-500 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#d4af37] mb-1.5">
                      College or Personal Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute inset-y-0 left-3 h-full w-4 text-zinc-500 flex items-center" />
                      <input
                        type="email"
                        name="college_email"
                        required
                        value={registerForm.college_email}
                        onChange={handleRegisterChange}
                        placeholder="krithick@gmail.com"
                        className={`block w-full rounded border py-2 pl-10 pr-3 text-sm bg-zinc-900/60 text-white placeholder-zinc-500 focus:outline-none ${validationErrors.college_email ? 'border-rose-500 focus:border-rose-500' : 'border-[#8c7030]/20 focus:border-[#d4af37]'}`}
                      />
                    </div>
                    {validationErrors.college_email && (
                      <p className="text-[10px] text-rose-500 mt-1 font-semibold">{validationErrors.college_email}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                        Roll Number (AV...)
                      </label>
                      <span className="text-[10px] text-zinc-400 font-light">Optional for 2026 Batch</span>
                    </div>
                    <div className="relative">
                      <Award className="absolute inset-y-0 left-3 h-full w-4 text-zinc-500 flex items-center" />
                      <input
                        type="text"
                        name="roll_number"
                        value={registerForm.roll_number}
                        onChange={handleRegisterChange}
                        placeholder="AV.SC.U4CCE25053"
                        className={`block w-full rounded border py-2 pl-10 pr-3 text-sm bg-zinc-900/60 text-white placeholder-zinc-500 focus:outline-none ${validationErrors.roll_number ? 'border-rose-500 focus:border-rose-500' : 'border-[#8c7030]/20 focus:border-[#d4af37]'}`}
                      />
                    </div>
                    {validationErrors.roll_number && (
                      <p className="text-[10px] text-rose-500 mt-1 font-semibold">{validationErrors.roll_number}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#d4af37] mb-1.5">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute inset-y-0 left-3 h-full w-4 text-zinc-500 flex items-center" />
                      <input
                        type="text"
                        name="phone_number"
                        required
                        value={registerForm.phone_number}
                        onChange={handleRegisterChange}
                        placeholder="9701066969"
                        className={`block w-full rounded border py-2 pl-10 pr-3 text-sm bg-zinc-900/60 text-white placeholder-zinc-500 focus:outline-none ${validationErrors.phone_number ? 'border-rose-500 focus:border-rose-500' : 'border-[#8c7030]/20 focus:border-[#d4af37]'}`}
                      />
                    </div>
                    {validationErrors.phone_number && (
                      <p className="text-[10px] text-rose-500 mt-1 font-semibold">{validationErrors.phone_number}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#d4af37] mb-1.5">
                        Branch
                      </label>
                      <select
                        name="branch"
                        value={registerForm.branch}
                        onChange={handleRegisterChange}
                        className="block w-full rounded border border-[#8c7030]/20 bg-zinc-900 py-2 px-3 text-sm text-white focus:border-[#d4af37] focus:outline-none"
                      >
                        <option value="CSE">CSE</option>
                        <option value="CAI">CAI</option>
                        <option value="AIDS">AIDS</option>
                        <option value="Quantum">Quantum</option>
                        <option value="CCE">CCE</option>
                        <option value="ECE">ECE</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#d4af37] mb-1.5">
                        Year
                      </label>
                      <select
                        name="year"
                        value={registerForm.year}
                        onChange={handleRegisterChange}
                        className="block w-full rounded border border-[#8c7030]/20 bg-zinc-900 py-2 px-3 text-sm text-white focus:border-[#d4af37] focus:outline-none"
                      >
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#d4af37] mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute inset-y-0 left-3 h-full w-4 text-zinc-500 flex items-center" />
                      <input
                        type="password"
                        name="password"
                        required
                        value={registerForm.password}
                        onChange={handleRegisterChange}
                        placeholder="••••••••"
                        className={`block w-full rounded border py-2 pl-10 pr-3 text-sm bg-zinc-900/60 text-white placeholder-zinc-500 focus:outline-none ${validationErrors.password ? 'border-rose-500 focus:border-rose-500' : 'border-[#8c7030]/20 focus:border-[#d4af37]'}`}
                      />
                    </div>
                    {validationErrors.password && (
                      <p className="text-[10px] text-rose-500 mt-1 font-semibold">{validationErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#d4af37] mb-1.5">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute inset-y-0 left-3 h-full w-4 text-zinc-500 flex items-center" />
                      <input
                        type="password"
                        name="confirm_password"
                        required
                        value={registerForm.confirm_password}
                        onChange={handleRegisterChange}
                        placeholder="••••••••"
                        className={`block w-full rounded border py-2 pl-10 pr-3 text-sm bg-zinc-900/60 text-white placeholder-zinc-500 focus:outline-none ${validationErrors.confirm_password ? 'border-rose-500 focus:border-rose-500' : 'border-[#8c7030]/20 focus:border-[#d4af37]'}`}
                      />
                    </div>
                    {validationErrors.confirm_password && (
                      <p className="text-[10px] text-rose-500 mt-1 font-semibold">{validationErrors.confirm_password}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-3 rounded border border-[#d4af37] bg-gradient-to-r from-[#d4af37] to-[#8c7030] py-2.5 text-sm font-bold uppercase tracking-wider text-black hover:from-[#f6e05e] hover:to-[#d4af37] transition-all disabled:opacity-50"
                  >
                    {loading ? 'Creating Warrior...' : 'Initiate Signup'}
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
