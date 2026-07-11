'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import { apiRequest } from '@/utils/api';
import { CheckCircle2, XCircle, Award, ShieldCheck, Calendar, GraduationCap, Building2 } from 'lucide-react';

export default function VerificationPage() {
  const params = useParams();
  const studentId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;

    const verifyCertificate = async () => {
      try {
        const res = await apiRequest(`/api/dsa/verify/${studentId}`);
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Verification failed. This certificate is invalid or does not exist.');
      } finally {
        setLoading(false);
      }
    };

    verifyCertificate();
  }, [studentId]);

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl">
          
          {loading ? (
            <div className="text-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-2 border-[#d4af37] border-t-transparent mx-auto mb-4" />
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Running Security Validation...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-rose-950/45 bg-zinc-950/80 p-8 text-center shadow-2xl glass-panel animate-fade-in text-zinc-300">
              <XCircle className="mx-auto h-16 w-16 text-rose-500 mb-4 animate-pulse" />
              <h2 className="text-lg font-serif font-bold text-white mb-2 uppercase tracking-wide">Verification Failed</h2>
              <p className="text-xs text-zinc-400 mb-6">{error}</p>
              <div className="text-[10px] text-zinc-650 font-mono tracking-wider border-t border-zinc-900 pt-4 uppercase">
                Chakravyuha Secured Registry System
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-[#8c7030]/25 bg-gradient-to-b from-[#8c7030]/10 to-zinc-950/90 p-8 shadow-2xl glass-panel relative overflow-hidden animate-fade-in">
              {/* Background watermark icon */}
              <Award className="absolute -right-10 -bottom-10 h-44 w-44 text-[#d4af37]/5 pointer-events-none" />

              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                  Certificate Verified
                </div>
                
                <h1 className="text-2xl font-serif font-bold text-white tracking-wide uppercase">
                  Yukti Challenge Registry
                </h1>
                
                <p className="text-xs text-zinc-450 leading-relaxed max-w-md mx-auto">
                  Amrita Vishwa Vidyapeetham's Chakravyuha Club hereby confirms the authenticity of this digital certificate of completion.
                </p>
                
                <div className="border-y border-zinc-900 py-6 my-6 space-y-4 text-left">
                  
                  {/* Name */}
                  <div className="flex items-start gap-3">
                    <GraduationCap className="h-5 w-5 text-[#d4af37] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-zinc-550 uppercase tracking-widest font-semibold">Recipient Warrior</p>
                      <p className="text-md font-bold text-white">{data.student_name}</p>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">Roll: {data.student_roll}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{data.student_branch} • Year {data.student_year}</p>
                    </div>
                  </div>

                  {/* Event */}
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-[#d4af37] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-zinc-555 uppercase tracking-widest font-semibold">Event Completed</p>
                      <p className="text-sm font-bold text-[#d4af37]">{data.event_name}</p>
                      <p className="text-xs text-zinc-400">Completion Type: Full Practical Challenge & Prompting Project</p>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-[#d4af37] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-zinc-555 uppercase tracking-widest font-semibold">Date of Issuance</p>
                      <p className="text-xs font-semibold text-white">{data.date}</p>
                    </div>
                  </div>

                  {/* Organization */}
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-[#d4af37] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-zinc-555 uppercase tracking-widest font-semibold">Issuing Organization</p>
                      <p className="text-xs font-semibold text-zinc-300">{data.organization}</p>
                    </div>
                  </div>

                </div>

                <div className="text-[9px] text-zinc-600 font-mono tracking-widest uppercase pt-2">
                  Validation ID: {studentId}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
