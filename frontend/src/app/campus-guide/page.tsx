'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Map, 
  BookOpen, 
  Heart, 
  Info, 
  ExternalLink, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  Trophy, 
  Compass, 
  Users, 
  Bookmark,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { getAuthToken } from '@/utils/api';

export default function CampusGuide() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'rules' | 'dos' | 'policies'>('info');

  useEffect(() => {
    setIsLoggedIn(!!getAuthToken());
  }, []);

  const studentProjects = [
    {
      title: "Campus Compass",
      developer: "Karthi Tanukonda",
      url: "https://campus-compass-karthi.netlify.app/",
      desc: "An intuitive navigation guide displaying full interactive maps, rules, hostel pass workflows, and college contact sheets.",
      color: "from-amber-500/20 to-amber-600/10",
      borderColor: "border-amber-500/30 shadow-amber-500/5",
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Profound Alpaca",
      developer: "Haseeb",
      url: "https://profound-alpaca-350538.netlify.app/",
      desc: "A feature-rich academic manual with quick charts for dos & donts, calendar tracking, campus galleries, and onboarding steps.",
      color: "from-cyan-500/20 to-cyan-600/10",
      borderColor: "border-cyan-500/30 shadow-cyan-500/5",
      badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      title: "Whimsical Selkie",
      developer: "Narendra Tadiboyina",
      url: "https://whimsical-selkie-9ae561.netlify.app/",
      desc: "A sleek, clean dashboard outlining grading patterns, policies, freshman resources, and essential student code guidelines.",
      color: "from-purple-500/20 to-purple-600/10",
      borderColor: "border-purple-500/30 shadow-purple-500/5",
      badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    }
  ];

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-zinc-100 tech-dot-grid relative pb-20">
      
      {/* Symmetrical Hero / Event Banner */}
      <div className="relative overflow-hidden border-b border-[#8c7030]/20 bg-zinc-950/60 py-16 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-[#d4af37]/5 via-transparent to-transparent"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          
          <Link 
            href={isLoggedIn ? "/dashboard" : "/"}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#d4af37]" />
            {isLoggedIn ? "Back to Dashboard" : "Back to Home"}
          </Link>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#8c7030]/20 bg-zinc-950 text-[10px] font-extrabold text-[#d4af37] uppercase tracking-wider">
              <Compass className="h-3.5 w-3.5 text-[#d4af37] animate-spin-slow" /> Campus Compass Event
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-serif text-white tracking-wide leading-tight">
              Amrita Amaravati <span className="text-gold-gradient glow-text-gold">Campus Guide</span>
            </h1>
            <p className="mx-auto max-w-2xl text-sm sm:text-base text-zinc-300 font-light leading-relaxed">
              Explore award-winning guide portals designed and built by the students of Amrita Amaravati during the <strong>Campus Compass Hackathon</strong> conducted by Chakravyuha. Find rules, academic policies, dos & donts, and resources below.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
        
        {/* SECTION 1: AWARD WINNING PORTALS */}
        <div className="space-y-8">
          <div className="border-l-2 border-[#d4af37] pl-4">
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-white flex items-center gap-2">
              <Trophy className="h-5.5 w-5.5 text-[#d4af37]" />
              Award-Winning Student Portals
            </h2>
            <p className="text-xs text-zinc-400 mt-1">Sleek guidelines & digital platforms built by code warriors to help newcomers settle in.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {studentProjects.map((proj, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col justify-between rounded-xl border bg-gradient-to-b ${proj.color} p-6 transition-all hover:scale-[1.02] hover:-translate-y-1 shadow-lg ${proj.borderColor}`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${proj.badgeColor}`}>
                      Top Developer
                    </span>
                    <Sparkles className="h-4 w-4 text-[#d4af37]" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white font-serif">{proj.title}</h3>
                    <p className="text-xs text-[#d4af37] font-semibold">dev by {proj.developer}</p>
                  </div>
                  
                  <p className="text-xs text-zinc-200 leading-relaxed font-light">
                    {proj.desc}
                  </p>
                </div>

                <div className="pt-6 border-t border-zinc-900/50 mt-6">
                  <a 
                    href={proj.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded bg-zinc-950 hover:bg-[#d4af37] text-[#d4af37] hover:text-black border border-[#d4af37]/30 hover:border-[#d4af37] py-2 text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Open Live Site <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: REFERENCE DIRECTORY MANUAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Tab selection */}
          <div className="lg:col-span-4 space-y-3">
            <div className="border-l-2 border-[#d4af37] pl-4 mb-6">
              <h2 className="text-lg sm:text-xl font-bold font-serif text-white">Campus Reference Index</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Quick lookup rules, do's & don'ts, and policies.</p>
            </div>
            
            <button
              onClick={() => setActiveSubTab('info')}
              className={`flex w-full items-center justify-between rounded-lg border px-4 py-3.5 text-xs font-bold uppercase tracking-wider transition-all ${
                activeSubTab === 'info' 
                  ? 'border-[#d4af37] bg-[#d4af37]/5 text-[#d4af37]' 
                  : 'border-zinc-900 bg-zinc-950/40 text-zinc-400 hover:text-white hover:border-zinc-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Campus Infrastructure Info
              </span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => setActiveSubTab('rules')}
              className={`flex w-full items-center justify-between rounded-lg border px-4 py-3.5 text-xs font-bold uppercase tracking-wider transition-all ${
                activeSubTab === 'rules' 
                  ? 'border-[#d4af37] bg-[#d4af37]/5 text-[#d4af37]' 
                  : 'border-zinc-900 bg-zinc-950/40 text-zinc-400 hover:text-white hover:border-zinc-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Rules & Regulations
              </span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => setActiveSubTab('dos')}
              className={`flex w-full items-center justify-between rounded-lg border px-4 py-3.5 text-xs font-bold uppercase tracking-wider transition-all ${
                activeSubTab === 'dos' 
                  ? 'border-[#d4af37] bg-[#d4af37]/5 text-[#d4af37]' 
                  : 'border-zinc-900 bg-zinc-950/40 text-zinc-400 hover:text-white hover:border-zinc-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Do's & Don'ts
              </span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => setActiveSubTab('policies')}
              className={`flex w-full items-center justify-between rounded-lg border px-4 py-3.5 text-xs font-bold uppercase tracking-wider transition-all ${
                activeSubTab === 'policies' 
                  ? 'border-[#d4af37] bg-[#d4af37]/5 text-[#d4af37]' 
                  : 'border-zinc-900 bg-zinc-950/40 text-zinc-400 hover:text-white hover:border-zinc-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                University Policies
              </span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Right: Tab content panel */}
          <div className="lg:col-span-8 rounded-xl border border-zinc-900 bg-zinc-950/60 p-6 sm:p-8 shadow-xl min-h-[300px]">
            
            {activeSubTab === 'info' && (
              <div className="space-y-5">
                <h3 className="text-base font-bold text-white font-serif flex items-center gap-2 border-b border-zinc-900 pb-3">
                  <Info className="h-5 w-5 text-[#d4af37]" />
                  Amaravati Campus Infrastructure
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed font-light font-sans">
                  Amrita Vishwa Vidyapeetham's Amaravati Campus is a state-of-the-art tech-first institute located in the heart of Andhra Pradesh's capital region. It features modern lecture halls, advanced computer laboratories, residential student housing, and active sports fields.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-4">
                  <div className="p-4 rounded border border-zinc-900 bg-zinc-900/30">
                    <h5 className="font-extrabold text-[#d4af37] uppercase text-[10px] tracking-wider mb-1">Academic Blocks</h5>
                    <p className="text-zinc-405 font-light leading-relaxed">Integrated high-tech labs, research hubs, seminar halls, and highly interactive classrooms.</p>
                  </div>
                  <div className="p-4 rounded border border-zinc-900 bg-zinc-900/30">
                    <h5 className="font-extrabold text-[#d4af37] uppercase text-[10px] tracking-wider mb-1">Residential Facilities</h5>
                    <p className="text-zinc-405 font-light leading-relaxed">On-campus separate hostels for boys and girls with study rooms, high-speed internet, and dining halls.</p>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'rules' && (
              <div className="space-y-5">
                <h3 className="text-base font-bold text-white font-serif flex items-center gap-2 border-b border-zinc-900 pb-3">
                  <Bookmark className="h-5 w-5 text-[#d4af37]" />
                  Hostel & Academic Rules
                </h3>
                <ul className="space-y-3.5 text-xs text-zinc-300 font-light">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
                    <span><strong>ID Card Compliance:</strong> Students must wear their college ID cards visibly at all times when inside academic buildings.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
                    <span><strong>Gate Curfew:</strong> Hostel residents must comply with the 6:30 PM curfew for returning to the main campus gates, and 9:00 PM for girls' and boys' hostel entry.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
                    <span><strong>Class Attendance:</strong> Minimum 75% attendance is mandatory in each registered subject to qualify for end-semester examinations.</span>
                  </li>
                </ul>
              </div>
            )}

            {activeSubTab === 'dos' && (
              <div className="space-y-5">
                <h3 className="text-base font-bold text-white font-serif flex items-center gap-2 border-b border-zinc-900 pb-3">
                  <ShieldCheck className="h-5 w-5 text-[#d4af37]" />
                  Do's & Don'ts
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      Do's
                    </h4>
                    <ul className="space-y-2 text-[11px] text-zinc-300 list-disc list-inside font-light leading-relaxed">
                      <li>Keep the campus green and litter-free.</li>
                      <li>Log out after sessions in open computer labs.</li>
                      <li>Register in advance for mess leaves on the portal.</li>
                      <li>Collaborate and mentor incoming batches.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-rose-400" />
                      Don'ts
                    </h4>
                    <ul className="space-y-2 text-[11px] text-zinc-300 list-disc list-inside font-light leading-relaxed">
                      <li>No cooking appliances inside hostel rooms.</li>
                      <li>Do not share security OTPs or dashboard passwords.</li>
                      <li>Strictly avoid academic dishonesty/plagiarism.</li>
                      <li>Zero tolerance for ragging or harassment.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'policies' && (
              <div className="space-y-5">
                <h3 className="text-base font-bold text-white font-serif flex items-center gap-2 border-b border-zinc-900 pb-3">
                  <FileText className="h-5 w-5 text-[#d4af37]" />
                  University Academic Policies
                </h3>
                <ul className="space-y-4 text-xs text-zinc-300 font-light">
                  <li className="p-4 rounded border border-zinc-900 bg-zinc-900/20">
                    <strong className="text-white block mb-1">Grading System:</strong>
                    Continuous assessment (internal marks) accounts for 50%, and the end-semester examination accounts for 50% of the final course grades.
                  </li>
                  <li className="p-4 rounded border border-zinc-900 bg-zinc-900/20">
                    <strong className="text-white block mb-1">Out-Pass & Leaves:</strong>
                    Out-passes must be raised through the hostel management portal at least 24 hours prior to travel and require approval from the parents and warden.
                  </li>
                </ul>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
