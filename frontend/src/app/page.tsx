'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, User, AlertCircle, LogIn, Mail, Phone, Award, BookOpen, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { apiRequest, setAuthToken, getAuthToken, getUserType } from '@/utils/api';

export default function Home() {
  const router = useRouter();
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

  return (
    <div className="flex min-h-screen bg-black text-white relative overflow-hidden">
      
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-900/15 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main Grid: Info/Carousel on Left (60%), Login/Register on Right (40%) */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 min-h-screen px-4 py-8 lg:px-8 items-center gap-12 relative z-10">
        
        {/* Left Side: Club Branding, Info, Image Slider */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-8 select-none">
          
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-[#d4af37]/80 bg-zinc-950 flex-shrink-0 gold-border-glow">
              <img 
                src="/club_logo.jpg" 
                alt="Chakravyuha Logo" 
                className="h-full w-full object-cover"
                onError={(e) => { e.currentTarget.src = 'https://api.placeholder.com/150'; }}
              />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-wider font-serif text-gold-gradient">
                CHAKRAVYUHA
              </h1>
              <p className="text-xs font-semibold tracking-widest text-[#c5a059] uppercase">
                Official Coding & DSA Club of Amrita
              </p>
            </div>
          </div>

          {/* Interactive Photo Slider */}
          <div className="relative rounded-2xl border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md overflow-hidden aspect-[16/9] shadow-2xl group">
            {slides.map((slide, idx) => (
              <div 
                key={idx}
                className={`absolute inset-0 w-full h-full flex flex-col justify-end p-8 transition-opacity duration-1000 bg-gradient-to-t from-black via-black/40 to-transparent ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                {/* Background image / Gradient fallback */}
                <img 
                  src={slide.image} 
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-50 z-[-1] transition-transform duration-10000 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Gradient Fallback when image fails */}
                <div className={`absolute inset-0 bg-gradient-to-br ${slide.fallbackGrad} opacity-30 z-[-2]`}></div>

                <div className="space-y-2 max-w-xl">
                  <h3 className="text-2xl font-bold tracking-wide font-serif text-[#d4af37]">
                    {slide.title}
                  </h3>
                  <p className="text-sm text-zinc-300 leading-relaxed font-light">
                    {slide.desc}
                  </p>
                </div>
              </div>
            ))}

            {/* Slider Navigation */}
            <div className="absolute top-1/2 -translate-y-1/2 left-3 right-3 flex justify-between z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                className="p-1.5 rounded-full bg-black/60 border border-zinc-800 text-white hover:bg-black transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                className="p-1.5 rounded-full bg-black/60 border border-zinc-800 text-white hover:bg-black transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Slider Dots */}
            <div className="absolute bottom-4 right-8 flex gap-2 z-20">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-[#d4af37] w-6' : 'bg-zinc-600'}`}
                ></button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Tabbed Login / Register Portal */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="rounded-2xl border border-[#8c7030]/25 bg-zinc-950/80 p-8 shadow-2xl backdrop-blur-md relative glass-panel">
            
            {/* Tabs */}
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
              <form onSubmit={handleRegister} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
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
                      <option value="CCE">CCE</option>
                      <option value="AIE">AIE</option>
                      <option value="ECE">ECE</option>
                      <option value="MECH">MECH</option>
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
    </div>
  );
}
