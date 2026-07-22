'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Calendar, Sparkles, CheckCircle2, ChevronRight, Loader2, ShieldAlert } from 'lucide-react';
import { apiRequest, getAuthToken } from '@/utils/api';

interface EventData {
  id: number;
  name: string;
  description: string;
  status: string;
  is_registered: boolean;
}

export default function Events() {
  const router = useRouter();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registeringId, setRegisteringId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      const data = await apiRequest('/api/dsa/events');
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/');
      return;
    }
    fetchEvents();
  }, [router]);

  const handleRegister = async (eventId: number) => {
    setError(null);
    setSuccessMsg(null);
    setRegisteringId(eventId);

    try {
      await apiRequest(`/api/dsa/events/${eventId}/register`, {
        method: 'POST'
      });
      
      setSuccessMsg('Successfully registered for the event!');
      
      // Refresh event list to show the "Enter" button
      await fetchEvents();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to register for the event.');
    } finally {
      setRegisteringId(null);
    }
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
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-950/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto space-y-10 relative z-10">
        
        {/* Header Branding */}
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
            <ShieldAlert className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-950 bg-emerald-950/20 p-4 text-sm text-emerald-300">
            <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {events.map((event) => {
            const isYukti = event.name.toUpperCase().includes('YUKTI');
            const isUpcoming = event.status === 'upcoming';
            
            return (
              <div 
                key={event.id}
                className="rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md p-6 shadow-xl flex flex-col justify-between hover:border-[#8c7030]/30 transition group relative overflow-hidden"
              >
                {/* Visual badge border highlight for active event */}
                {!isUpcoming && (
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#d4af37] to-[#8c7030]"></div>
                )}
                
                <div className="space-y-4">
                  {/* Event Name & Badge */}
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-bold font-serif text-white tracking-wide leading-snug">
                      {event.name}
                    </h3>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border flex-shrink-0 ${isUpcoming ? 'bg-zinc-900 text-zinc-400 border-zinc-700/30' : 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20'}`}>
                      {event.status}
                    </span>
                  </div>

                  {/* Event Description */}
                  <p className="text-sm text-zinc-400 leading-relaxed font-light">
                    {event.description}
                  </p>
                </div>

                {/* Event Actions Footer */}
                <div className="mt-8 pt-4 border-t border-zinc-900/60 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                    <Calendar className="h-4 w-4 text-[#d4af37]" />
                    {isYukti ? 'Live Active Session' : 'Orientation / TBD'}
                  </div>

                  {isUpcoming ? (
                    <button
                      disabled
                      className="px-4 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-wider cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  ) : event.is_registered ? (
                    <button
                      onClick={() => {
                        if (isYukti) {
                          router.push('/dsa');
                        } else {
                          router.push('/dashboard');
                        }
                      }}
                      className="group/btn flex items-center gap-1.5 px-4 py-2 bg-[#d4af37] text-black font-extrabold text-xs uppercase rounded tracking-wider hover:bg-[#f6e05e] transition"
                    >
                      Enter Event
                      <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegister(event.id)}
                      disabled={registeringId === event.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-[#d4af37]/65 text-white font-extrabold text-xs uppercase rounded tracking-wider transition disabled:opacity-50"
                    >
                      {registeringId === event.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 text-[#d4af37]" />
                          Register Now
                        </>
                      )}
                    </button>
                  )}
                </div>

              </div>
            );
          })}

        </div>

      </div>
    </div>
  );
}
