'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Award, Phone, BookOpen, Calendar, Trophy, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import { apiRequest, getAuthToken } from '@/utils/api';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  roll_number: string | null;
  phone: string;
  branch: string;
  year: number;
  is_admin: boolean;
  registered_events: Array<{
    id: number;
    name: string;
    status: string;
    registered_at: string;
  }>;
  streak?: number;
}

export default function Profile() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/');
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await apiRequest('/api/dsa/profile');
        setProfile(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-[#d4af37] animate-spin mx-auto" />
          <p className="text-sm text-zinc-500 font-medium">Retrieving warrior profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center p-4">
        <div className="max-w-md w-full border border-rose-950 bg-rose-950/10 p-6 rounded-lg text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Profile Retrieval Failed</h2>
          <p className="text-sm text-rose-300">{error || 'Unable to connect to service.'}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-white rounded text-sm font-medium hover:bg-zinc-800 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* Banner Card */}
        <div className="relative rounded-2xl border border-[#8c7030]/25 bg-gradient-to-r from-zinc-950 via-zinc-950 to-[#8c7030]/10 p-8 overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="h-20 w-20 rounded-full border-2 border-[#d4af37] bg-zinc-900 flex items-center justify-center shadow-lg gold-border-glow flex-shrink-0">
              <User className="h-10 w-10 text-[#d4af37]" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <h2 className="text-2xl font-bold font-serif tracking-wide text-white">
                  {profile.name}
                </h2>
                {profile.streak !== undefined && profile.streak > 0 && (
                  <span className="flex items-center gap-1 bg-amber-950/40 text-[#d4af37] px-2.5 py-0.5 rounded-full text-xs font-bold border border-[#d4af37]/35">
                    <Sparkles className="h-3 w-3" />
                    Streak: {profile.streak} Days
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-400 font-medium">
                {profile.is_admin ? `${profile.admin_role.toUpperCase()} ADMIN` : `Chakravyuha Warrior`}
              </p>
            </div>
          </div>
          
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl px-6 py-4 text-center shadow-md min-w-[150px]">
            <span className="block text-2xl font-black text-[#d4af37]">
              {profile.is_admin ? '∞' : profile.registered_events.length}
            </span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
              Events Registered
            </span>
          </div>
        </div>

        {/* Profile Details & Registered Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left: General Stats / Profile Info (5 Cols) */}
          <div className="md:col-span-5 rounded-2xl border border-zinc-900 bg-zinc-950/60 p-6 shadow-xl backdrop-blur-sm space-y-6">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#c5a059] border-b border-zinc-900 pb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-[#d4af37]" /> Profile Credentials
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">College / Personal Email</span>
                <span className="text-sm text-zinc-300 font-medium flex items-center gap-2 overflow-x-auto whitespace-nowrap">
                  <Mail className="h-4 w-4 text-[#d4af37] flex-shrink-0" /> {profile.email}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Roll Number</span>
                <span className="text-sm text-zinc-300 font-medium flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#d4af37]" /> {profile.roll_number || 'N/A (Personal Registration)'}
                </span>
              </div>

              {!profile.is_admin && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Branch</span>
                      <span className="text-sm text-zinc-300 font-medium flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-[#d4af37]" /> {profile.branch}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Year</span>
                      <span className="text-sm text-zinc-300 font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#d4af37]" /> Year {profile.year}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Phone Number</span>
                    <span className="text-sm text-zinc-300 font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#d4af37]" /> {profile.phone}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Registered Events List (7 Cols) */}
          <div className="md:col-span-7 rounded-2xl border border-zinc-900 bg-zinc-950/60 p-6 shadow-xl backdrop-blur-sm space-y-6">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#c5a059] border-b border-zinc-900 pb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[#d4af37]" /> Registered Events
            </h3>

            {profile.is_admin ? (
              <p className="text-sm text-zinc-500 font-medium text-center py-8">
                Admins have full global access and do not require registering for individual events.
              </p>
            ) : profile.registered_events.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Trophy className="h-8 w-8 text-zinc-600 mx-auto" />
                <p className="text-sm text-zinc-500 font-medium">No registered events found.</p>
                <button 
                  onClick={() => router.push('/events')}
                  className="px-4 py-1.5 bg-[#d4af37] text-black rounded text-xs font-bold uppercase tracking-wider hover:bg-[#f6e05e] transition"
                >
                  Browse Events
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.registered_events.map((event) => (
                  <div 
                    key={event.id}
                    className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/90 shadow-md flex items-center justify-between hover:border-[#8c7030]/40 transition"
                  >
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white tracking-wide">
                        {event.name}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-medium">
                        Registered on: {new Date(event.registered_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${event.status === 'active' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20' : 'bg-amber-950/30 text-[#d4af37] border-[#d4af37]/20'}`}>
                        {event.status}
                      </span>
                      {event.status === 'active' && (
                        <button
                          onClick={() => {
                            if (event.name.includes("DSA")) {
                              router.push('/dsa');
                            } else {
                              router.push('/dashboard');
                            }
                          }}
                          className="px-3 py-1 bg-[#d4af37] hover:bg-[#f6e05e] text-black font-extrabold text-[10px] uppercase rounded tracking-wider transition"
                        >
                          Enter
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
