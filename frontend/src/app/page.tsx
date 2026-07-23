'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, User, AlertCircle, LogIn, Mail, Phone, Award, BookOpen, ChevronLeft, ChevronRight, CheckCircle2, ArrowDown, Users, Flame, Terminal, Code, Cpu, Trophy, Activity } from 'lucide-react';
import { apiRequest, setAuthToken, getAuthToken, getUserType } from '@/utils/api';

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
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.reveal-fade-up, .reveal-fade-left, .reveal-fade-right');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
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
    <div className="flex flex-col bg-black text-white relative overflow-hidden min-h-screen">
      
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
          
          <div className="lg:col-span-6 space-y-6 reveal-fade-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#8c7030]/20 bg-zinc-950/80 text-[10px] font-extrabold text-[#d4af37] uppercase tracking-wider">
              <Code className="h-3.5 w-3.5" /> Who We Are
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-white leading-tight">
              Shaping the Next Generation of Tech Leaders
            </h2>
            <p className="text-sm text-zinc-400 font-light leading-relaxed">
              Chakravyuha is Amrita's premier technical hub for coders. We provide a structured environment to cultivate coding standards, algorithmic problem-solving capabilities, and software design skills.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-[#d4af37] flex-shrink-0">
                  <Terminal className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">DSA Challenges</h4>
                  <p className="text-xs text-zinc-500 mt-1">Topic-wise daily sheets curated for beginners and experts.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-[#d4af37] flex-shrink-0">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Hackathon Mentorship</h4>
                  <p className="text-xs text-zinc-500 mt-1">Preparation blueprints and mentorship for SIH 2026.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Visual Frame */}
          <div className="lg:col-span-6 space-y-4 select-none reveal-fade-right">
            <div className="relative rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md overflow-hidden aspect-[16/10] shadow-2xl group p-3">
              <div className="w-full h-full relative rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950">
                <img 
                  src="/DSC01551.JPG" 
                  alt="Chakravyuha Featured Visual"
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-opacity duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 to-zinc-950/80 mix-blend-multiply"></div>
                <div className="absolute bottom-6 left-6 right-6 space-y-1.5">
                  <h3 className="text-lg font-bold tracking-wide font-serif text-[#d4af37]">
                    The Amrita Vanguard
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed font-light">
                    Forging competitive programming leaders through algorithmic excellence and national hackathon conquests.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. SHOWCASE GALLERY SECTION */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 w-full relative">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3 reveal-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#8c7030]/20 bg-zinc-950/80 text-[10px] font-extrabold text-[#d4af37] uppercase tracking-wider">
            <Trophy className="h-3.5 w-3.5" /> Club Showcase
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-serif text-white tracking-wide leading-tight">
            Warriors in the Arena
          </h2>
          <p className="text-sm text-zinc-400 font-light leading-relaxed max-w-xl mx-auto">
            Witness the focus, intensity, and triumph of Chakravyuha members conquering real-world challenges, algorithms, and hackathons.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Photo 1 */}
          <div className="group relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950/40 p-4 shadow-xl reveal-fade-left">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950">
              <img 
                src="/DSC01551.JPG" 
                alt="Chakravyuha coding lab session" 
                className="w-full h-full object-cover image-glow-hover opacity-75 group-hover:opacity-100 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 space-y-2">
                <span className="text-[9px] uppercase font-black text-[#d4af37] tracking-widest bg-[#d4af37]/10 px-2 py-0.5 rounded border border-[#d4af37]/20">Competitive Coding</span>
                <h3 className="text-lg font-bold text-white font-serif tracking-wide">High-Octane Coding Wars</h3>
                <p className="text-xs text-zinc-300 font-light leading-relaxed">Students testing their algorithms in local club battlegrounds and mock runs.</p>
              </div>
            </div>
          </div>

          {/* Photo 2 */}
          <div className="group relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950/40 p-4 shadow-xl reveal-fade-right">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950">
              <img 
                src="/DSC01678.JPG" 
                alt="Warriors working in lab" 
                className="w-full h-full object-cover image-glow-hover opacity-75 group-hover:opacity-100 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 space-y-2">
                <span className="text-[9px] uppercase font-black text-blue-400 tracking-widest bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Development</span>
                <h3 className="text-lg font-bold text-white font-serif tracking-wide">Collaborative System Engineering</h3>
                <p className="text-xs text-zinc-300 font-light leading-relaxed">Full-stack project development and white-board mapping for next-generation systems.</p>
              </div>
            </div>
          </div>

          {/* Photo 3 */}
          <div className="group relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950/40 p-4 shadow-xl reveal-fade-left delay-100">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950">
              <img 
                src="/DSC07025.JPG" 
                alt="Hackathon team whiteboarding" 
                className="w-full h-full object-cover image-glow-hover opacity-75 group-hover:opacity-100 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 space-y-2">
                <span className="text-[9px] uppercase font-black text-purple-400 tracking-widest bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">Brainstorming</span>
                <h3 className="text-lg font-bold text-white font-serif tracking-wide">Hackathon Warfare Room</h3>
                <p className="text-xs text-zinc-300 font-light leading-relaxed">Cross-functional teams designing blueprints to solve national challenges for SIH.</p>
              </div>
            </div>
          </div>

          {/* Photo 4 */}
          <div className="group relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950/40 p-4 shadow-xl reveal-fade-right delay-100">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950">
              <img 
                src="/DSC07187.JPG.jpeg" 
                alt="Award ceremonies" 
                className="w-full h-full object-cover image-glow-hover opacity-75 group-hover:opacity-100 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 space-y-2">
                <span className="text-[9px] uppercase font-black text-emerald-400 tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Victory</span>
                <h3 className="text-lg font-bold text-white font-serif tracking-wide">Champions and Awards</h3>
                <p className="text-xs text-zinc-300 font-light leading-relaxed">Celebrating victories at competitive programming matches and hackathon championships.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. CLUB STATS PILLARS */}
      <section className="py-20 border-y border-[#8c7030]/15 bg-zinc-950/20 backdrop-blur-md z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            
            <div className="space-y-1 reveal-fade-up">
              <span className="block text-4xl font-extrabold text-[#d4af37] font-serif">390+</span>
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Active Warriors</span>
            </div>

            <div className="space-y-1 reveal-fade-up delay-100">
              <span className="block text-4xl font-extrabold text-[#d4af37] font-serif">5,000+</span>
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Problems Solved</span>
            </div>

            <div className="space-y-1 reveal-fade-up delay-200">
              <span className="block text-4xl font-extrabold text-[#d4af37] font-serif">10+</span>
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Hackathons Won</span>
            </div>

            <div className="space-y-1 reveal-fade-up delay-300">
              <span className="block text-4xl font-extrabold text-[#d4af37] font-serif">30+</span>
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Rankings Placed</span>
            </div>

          </div>
        </div>
      </section>

      {/* 5. MAIN REGISTRATION AND LOGIN SECTION */}
      <section ref={authSectionRef} className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 w-full relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Descriptive info leading to registration */}
          <div className="lg:col-span-7 space-y-6 reveal-fade-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#8c7030]/20 bg-zinc-950/80 text-[10px] font-extrabold text-[#d4af37] uppercase tracking-wider">
              <Activity className="h-3.5 w-3.5" /> Portal Gateways
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold font-serif text-white leading-tight">
              Ready to breach the formations?
            </h2>
            
            <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed max-w-xl">
              Create an account or login to access your customized dashboard. Track your coding progress, submit solutions to YUKTI sheets, and download verification certificates for successful completions.
            </p>

            <ul className="space-y-3 text-xs text-zinc-300">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-[#d4af37] flex-shrink-0" />
                <span>Unified authentication across all club events.</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-[#d4af37] flex-shrink-0" />
                <span>Nullable roll numbers and personal emails supported for incoming 2026 Batch.</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-[#d4af37] flex-shrink-0" />
                <span>Dynamic dashboards showing live stats, leaderboards, and certificate registries.</span>
              </li>
            </ul>
          </div>

          {/* Right Column: Tabbed Auth Card */}
          <div className="lg:col-span-5 flex flex-col justify-center w-full reveal-fade-right">
            <div className="rounded-2xl border border-[#8c7030]/25 bg-zinc-950/85 p-5 sm:p-8 shadow-2xl backdrop-blur-md relative glass-panel w-full">
              
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1.5">
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1.5">
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 rounded border border-[#d4af37] bg-gradient-to-r from-[#d4af37] to-[#8c7030] py-2.5 text-sm font-bold uppercase tracking-wider text-black hover:from-[#f6e05e] hover:to-[#d4af37] transition-all disabled:opacity-50"
                  >
                    {loading ? 'Authorizing...' : 'Enter Battlefield'}
                  </button>
                </form>
              )}

              {/* REGISTER FORM */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1.5">
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1.5">
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
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#c5a059]">
                        Roll Number (AV...)
                      </label>
                      <span className="text-[10px] text-zinc-500 font-light">Optional for 2026 Batch</span>
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1.5">
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
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1.5">
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
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1.5">
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1.5">
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1.5">
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
