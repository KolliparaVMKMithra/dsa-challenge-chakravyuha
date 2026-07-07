'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, CheckCircle2, User, Mail, Calendar, Phone, Award, Lock, BookOpen } from 'lucide-react';
import { apiRequest, setAuthToken } from '@/utils/api';

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: '',
    college_email: '',
    roll_number: '',
    phone_number: '',
    branch: '',
    year: '1',
    password: '',
    confirm_password: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateField = (name: string, value: string, currentPassword?: string) => {
    let err = '';
    const pwd = currentPassword !== undefined ? currentPassword : formData.password;
    
    if (name === 'roll_number') {
      if (!value.startsWith('AV')) {
        err = 'Roll number must start with "AV"';
      } else if (!/^AV[A-Za-z0-9.]+$/.test(value)) {
        err = 'Roll number can contain letters, digits, and periods (e.g. AV.SC.U4CSE23233)';
      }
    } else if (name === 'college_email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        err = 'Invalid email address';
      } else {
        const domain = value.split('@').pop() || '';
        const invalidDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
        if (invalidDomains.includes(domain.toLowerCase())) {
          err = 'Please use official college email, not personal email';
        }
      }
    } else if (name === 'phone_number') {
      if (value.length < 10) {
        err = 'Phone number must be at least 10 digits';
      }
    } else if (name === 'password') {
      if (value.length < 6) {
        err = 'Password must be at least 6 characters';
      }
      if (formData.confirm_password && value !== formData.confirm_password) {
        setValidationErrors(prev => ({ ...prev, confirm_password: 'Passwords do not match' }));
      } else if (formData.confirm_password && value === formData.confirm_password) {
        setValidationErrors(prev => ({ ...prev, confirm_password: '' }));
      }
    } else if (name === 'confirm_password') {
      if (value !== pwd) {
        err = 'Passwords do not match';
      }
    }
    setValidationErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      validateField(name, value, name === 'password' ? value : updated.password);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    
    const errors = Object.values(validationErrors).filter(Boolean);
    if (errors.length > 0) {
      setError('Please fix the validation errors before submitting.');
      return;
    }

    setLoading(true);

    try {
      const { confirm_password, ...payload } = formData;
      const data = await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          year: parseInt(payload.year),
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
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-wider font-serif text-gold-gradient">
            JOIN CHAKRAVYUHA
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#c5a059]">
            Enlist as a DSA Warrior
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-8 shadow-xl backdrop-blur-sm glass-panel">
          
          {success ? (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500 animate-bounce" />
              <h2 className="text-xl font-bold text-white">Warrior Registered Successfully!</h2>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                Your unique credential QR code has been generated and dispatched to <span className="text-[#d4af37] font-semibold">{formData.phone_number}</span>.
              </p>
              <p className="text-xs text-zinc-500">Redirecting to battlefield dashboard...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 flex items-start gap-2.5 rounded-md border border-rose-950 bg-rose-950/20 p-3 text-xs text-rose-300">
                  <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form className="grid grid-cols-1 md:grid-cols-2 gap-5" onSubmit={handleSubmit}>
                
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      name="full_name"
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Arjuna Pandava"
                      className="block w-full rounded border border-[#8c7030]/25 bg-zinc-900/60 py-2 pl-9 pr-3 text-sm text-white focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] focus:outline-none"
                    />
                  </div>
                </div>

                {/* College Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1">
                    College Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      name="college_email"
                      type="email"
                      required
                      value={formData.college_email}
                      onChange={handleChange}
                      placeholder="arjuna@nit.edu"
                      className={`block w-full rounded border py-2 pl-9 pr-3 text-sm text-white bg-zinc-900 focus:ring-1 focus:ring-[#d4af37] focus:outline-none ${
                        validationErrors.college_email ? 'border-rose-500 focus:ring-rose-500' : 'border-[#8c7030]/25 focus:border-[#d4af37]'
                      }`}
                    />
                  </div>
                  {validationErrors.college_email && (
                    <span className="text-[10px] text-rose-400 mt-1 block">{validationErrors.college_email}</span>
                  )}
                </div>

                {/* Roll Number */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1">
                    Roll Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <Award className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      name="roll_number"
                      type="text"
                      required
                      value={formData.roll_number}
                      onChange={handleChange}
                      placeholder="AV.SC.U4CSE23233"
                      className={`block w-full rounded border py-2 pl-9 pr-3 text-sm text-white bg-zinc-900 focus:ring-1 focus:ring-[#d4af37] focus:outline-none ${
                        validationErrors.roll_number ? 'border-rose-500 focus:ring-rose-500' : 'border-[#8c7030]/25 focus:border-[#d4af37]'
                      }`}
                    />
                  </div>
                  {validationErrors.roll_number && (
                    <span className="text-[10px] text-rose-400 mt-1 block">{validationErrors.roll_number}</span>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <Phone className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      name="phone_number"
                      type="tel"
                      required
                      value={formData.phone_number}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className={`block w-full rounded border py-2 pl-9 pr-3 text-sm text-white bg-zinc-900 focus:ring-1 focus:ring-[#d4af37] focus:outline-none ${
                        validationErrors.phone_number ? 'border-rose-500 focus:ring-rose-500' : 'border-[#8c7030]/25 focus:border-[#d4af37]'
                      }`}
                    />
                  </div>
                  {validationErrors.phone_number && (
                    <span className="text-[10px] text-rose-400 mt-1 block">{validationErrors.phone_number}</span>
                  )}
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1">
                    Branch
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <BookOpen className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      name="branch"
                      type="text"
                      required
                      value={formData.branch}
                      onChange={handleChange}
                      placeholder="Computer Science"
                      className="block w-full rounded border border-[#8c7030]/25 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-white focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1">
                    Year of Study
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <Calendar className="h-4 w-4 text-zinc-500" />
                    </div>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="block w-full rounded border border-[#8c7030]/25 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-white focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] focus:outline-none"
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                      <option value="5">5th Year</option>
                    </select>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`block w-full rounded border py-2 pl-9 pr-3 text-sm text-white bg-zinc-900 focus:ring-1 focus:ring-[#d4af37] focus:outline-none ${
                        validationErrors.password ? 'border-rose-500 focus:ring-rose-500' : 'border-[#8c7030]/25 focus:border-[#d4af37]'
                      }`}
                    />
                  </div>
                  {validationErrors.password && (
                    <span className="text-[10px] text-rose-400 mt-1 block">{validationErrors.password}</span>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      name="confirm_password"
                      type="password"
                      required
                      value={formData.confirm_password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`block w-full rounded border py-2 pl-9 pr-3 text-sm text-white bg-zinc-900 focus:ring-1 focus:ring-[#d4af37] focus:outline-none ${
                        validationErrors.confirm_password ? 'border-rose-500 focus:ring-rose-500' : 'border-[#8c7030]/25 focus:border-[#d4af37]'
                      }`}
                    />
                  </div>
                  {validationErrors.confirm_password && (
                    <span className="text-[10px] text-rose-400 mt-1 block">{validationErrors.confirm_password}</span>
                  )}
                </div>

                {/* Submit button */}
                <div className="md:col-span-2 mt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex w-full justify-center rounded border border-[#d4af37] bg-gradient-to-r from-[#d4af37] to-[#8c7030] py-2.5 text-sm font-bold uppercase tracking-wider text-black hover:from-[#f6e05e] hover:to-[#d4af37] focus:outline-none transition-all disabled:opacity-50"
                  >
                    {loading ? 'Registering...' : 'Register as Warrior'}
                  </button>
                </div>
              </form>

              {/* Login redirection link */}
              <div className="mt-6 flex items-center justify-between text-xs border-t border-zinc-900 pt-4">
                <span className="text-zinc-500">Already registered?</span>
                <Link href="/" className="font-semibold text-[#d4af37] hover:text-[#f6e05e] transition-colors">
                  Log In here
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
