'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, ExternalLink, CheckSquare, Square, AlertCircle, Calendar, RefreshCw, Send, Check, X, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiRequest, getAuthToken, clearAuth } from '@/utils/api';

interface Problem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  leetcode_link: string;
  solved: boolean;
  submission_link: string | null;
  completed_at: string | null;
}

interface Topic {
  name: string;
  problems: Problem[];
  solved_count: number;
  total_count: number;
}

interface CodeChefData {
  contest: {
    id: number;
    week_number: number;
    contest_link: string;
    deadline: string;
  } | null;
  participation: {
    id: number;
    status: string;
    submission_proof: string | null;
  } | null;
  is_expired: boolean;
}

export default function DsaSheet() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [codechef, setCodechef] = useState<CodeChefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Submission Modal state
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [solutionLink, setSolutionLink] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // CodeChef Submission state
  const [codechefProof, setCodechefProof] = useState('');
  const [ccSubmitLoading, setCcSubmitLoading] = useState(false);
  const [ccSubmitSuccess, setCcSubmitSuccess] = useState(false);

  const fetchDsaData = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/');
        return;
      }

      const [sheetData, ccData] = await Promise.all([
        apiRequest('/api/dsa/sheet'),
        apiRequest('/api/dsa/codechef')
      ]);

      setTopics(sheetData);
      setCodechef(ccData);
      
      if (ccData?.participation?.submission_proof) {
        setCodechefProof(ccData.participation.submission_proof);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch DSA sheet.');
      if (err.message === 'Could not validate credentials') {
        clearAuth();
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDsaData();
  }, [router]);

  const handleOpenSubmit = (problem: Problem) => {
    setSelectedProblem(problem);
    setSolutionLink(problem.submission_link || '');
    setSubmitError(null);
  };

  const handleCloseSubmit = () => {
    setSelectedProblem(null);
    setSolutionLink('');
    setSubmitError(null);
  };

  const handleProblemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProblem) return;
    
    setSubmitLoading(true);
    setSubmitError(null);

    try {
      await apiRequest('/api/dsa/submit', {
        method: 'POST',
        body: JSON.stringify({
          problem_id: selectedProblem.id,
          submission_link: solutionLink
        })
      });

      // Confetti triggers on successful problem solve!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#8C7030', '#FFFFFF']
      });

      handleCloseSubmit();
      fetchDsaData();
    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCodeChefSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codechef?.contest) return;

    setCcSubmitLoading(true);
    setError(null);
    setCcSubmitSuccess(false);

    try {
      await apiRequest('/api/dsa/codechef/submit', {
        method: 'POST',
        body: JSON.stringify({
          contest_id: codechef.contest.id,
          submission_proof: codechefProof
        })
      });

      setCcSubmitSuccess(true);
      confetti({
        particleCount: 80,
        spread: 60,
        colors: ['#34D399', '#D4AF37', '#000000']
      });
      fetchDsaData();
    } catch (err: any) {
      setError(err.message || 'CodeChef submission failed.');
    } finally {
      setCcSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-10 w-10 text-[#d4af37] animate-spin" />
          <span className="text-sm text-zinc-400 font-semibold tracking-wider uppercase">Loading DSA Sheet...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* CodeChef Weekly Challenge Banner (Mandatory - impossible to miss) */}
      {codechef && codechef.contest && (
        <div className="rounded-lg border border-[#d4af37]/40 bg-gradient-to-r from-amber-950/20 via-black to-zinc-950/50 p-6 shadow-md relative overflow-hidden gold-border-glow">
          <div className="absolute top-0 right-0 bg-[#d4af37] text-black text-[9px] font-extrabold px-3 py-1 uppercase tracking-widest rounded-bl">
            Mandatory Contest
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Contest Info */}
            <div className="space-y-2 max-w-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 font-serif">
                <Calendar className="h-5 w-5 text-[#d4af37] animate-pulse" />
                Wednesday CodeChef Contest — Week {codechef.contest.week_number}
              </h2>
              <p className="text-xs text-zinc-400">
                Participation in the weekly CodeChef contest is mandatory for all students. Submit your solution or dashboard submission proof before the deadline.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <a 
                  href={codechef.contest.contest_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#d4af37] hover:underline font-semibold"
                >
                  Enter Contest Portal
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <span className="text-zinc-500">|</span>
                <span className="text-zinc-400">
                  Deadline: <span className="text-rose-400 font-semibold">{new Date(codechef.contest.deadline).toLocaleString()}</span>
                </span>
                <span className="text-zinc-500">|</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                  codechef.participation?.status === 'attended' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                }`}>
                  Status: {codechef.participation?.status || 'unsubmitted'}
                </span>
              </div>
            </div>

            {/* Proof Submission Form */}
            <div className="flex-shrink-0 w-full md:w-80">
              <form onSubmit={handleCodeChefSubmit} className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#c5a059]">
                  Submit Solution Link / Proof URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    disabled={codechef.is_expired}
                    value={codechefProof}
                    onChange={(e) => setCodechefProof(e.target.value)}
                    placeholder="https://www.codechef.com/users/yourusername"
                    className="block w-full rounded border border-[#8c7030]/25 bg-zinc-900/60 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-[#d4af37] focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={ccSubmitLoading || codechef.is_expired}
                    className="rounded border border-[#d4af37] bg-[#d4af37] hover:bg-[#f6e05e] px-3 py-2 text-black font-bold uppercase tracking-wider text-xs transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {ccSubmitLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {ccSubmitSuccess && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <Check className="h-3 w-3" />
                    Participation updated successfully!
                  </span>
                )}
                {codechef.is_expired && (
                  <span className="text-[10px] text-rose-400 flex items-center gap-1 font-semibold">
                    <ShieldAlert className="h-3 w-3" />
                    Contest is closed (deadline passed).
                  </span>
                )}
              </form>
            </div>

          </div>
        </div>
      )}

      {/* Sheet Summary */}
      <div className="flex items-center justify-between border-b border-[#8c7030]/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-serif flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-[#d4af37]" />
            DSA Challenge Sheet
          </h1>
          <p className="text-xs text-zinc-500">
            Exactly 6 problems per topic: 3 Easy, 2 Medium, 1 Hard. Solve to earn streaks.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-md border border-rose-950 bg-rose-950/20 p-4 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Topic Sheets List */}
      <div className="space-y-8">
        {topics.map((topic, tIdx) => (
          <div key={tIdx} className="rounded-lg border border-[#8c7030]/15 bg-zinc-950/40 p-6 shadow-md glass-panel space-y-4">
            
            {/* Topic Header & Progress */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-3">
              <div>
                <h3 className="text-md font-bold text-white font-serif tracking-wider">{topic.name}</h3>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Topic Module</span>
              </div>
              
              {/* Progress bar */}
              <div className="flex items-center gap-3 w-full sm:w-60">
                <span className="text-xs font-semibold text-[#d4af37] whitespace-nowrap min-w-14 text-right">
                  {topic.solved_count} / {topic.total_count} Solved
                </span>
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <div 
                    className="h-full bg-gradient-to-r from-[#8c7030] to-[#d4af37] transition-all duration-300"
                    style={{ width: `${(topic.solved_count / topic.total_count) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Problems Grid / Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Problem Title</th>
                    <th className="py-2.5 px-3">Difficulty</th>
                    <th className="py-2.5 px-3">LeetCode Link</th>
                    <th className="py-2.5 px-3">Submission Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60">
                  {topic.problems.map((problem, pIdx) => {
                    const diffColors = {
                      Easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                      Medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
                      Hard: 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                    };
                    
                    return (
                      <tr key={pIdx} className="hover:bg-zinc-900/30 transition-colors">
                        {/* Checkbox Status */}
                        <td className="py-3.5 px-3">
                          {problem.solved ? (
                            <CheckSquare className="h-4.5 w-4.5 text-emerald-400 cursor-pointer" onClick={() => handleOpenSubmit(problem)} />
                          ) : (
                            <Square className="h-4.5 w-4.5 text-zinc-600 cursor-pointer hover:text-[#d4af37] transition-colors" onClick={() => handleOpenSubmit(problem)} />
                          )}
                        </td>
                        
                        {/* Title */}
                        <td className="py-3.5 px-3 font-semibold text-zinc-200">
                          {problem.title}
                        </td>
                        
                        {/* Difficulty */}
                        <td className="py-3.5 px-3">
                          <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${diffColors[problem.difficulty]}`}>
                            {problem.difficulty}
                          </span>
                        </td>
                        
                        {/* LeetCode link */}
                        <td className="py-3.5 px-3">
                          <a 
                            href={problem.leetcode_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#c5a059] hover:text-[#d4af37] transition-colors hover:underline"
                          >
                            Solve on LeetCode
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                        
                        {/* Submission Link Info */}
                        <td className="py-3.5 px-3 text-zinc-500 italic max-w-[200px] truncate">
                          {problem.solved ? (
                            <span className="text-zinc-400 truncate block text-[11px]">
                              Submitted: {problem.submission_link}
                            </span>
                          ) : (
                            <span>Unsubmitted</span>
                          )}
                        </td>
                        
                        {/* Action Button */}
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => handleOpenSubmit(problem)}
                            className={`rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                              problem.solved
                                ? 'border-[#8c7030]/40 text-zinc-400 hover:text-white'
                                : 'border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 gold-border-glow'
                            }`}
                          >
                            {problem.solved ? 'Update Solve' : 'Log Solve'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
          </div>
        ))}
      </div>

      {/* Solution Submission Drawer Modal Overlay */}
      {selectedProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg border border-[#8c7030]/40 bg-zinc-950 p-6 shadow-2xl glass-panel relative">
            <button 
              onClick={handleCloseSubmit}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-lg font-bold text-white font-serif mb-2">
              Log Problem Solution
            </h3>
            <p className="text-xs text-zinc-400 mb-6">
              Log your solution for <span className="font-semibold text-[#d4af37]">{selectedProblem.title}</span> ({selectedProblem.difficulty}).
            </p>

            <form onSubmit={handleProblemSubmit} className="space-y-4">
              {submitError && (
                <div className="flex items-start gap-2.5 rounded-md border border-rose-950 bg-rose-950/20 p-2.5 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1.5">
                  Solution Link (LeetCode Submission/GitHub URL)
                </label>
                <input
                  type="url"
                  required
                  value={solutionLink}
                  onChange={(e) => setSolutionLink(e.target.value)}
                  placeholder="https://leetcode.com/submissions/detail/123456789/"
                  className="block w-full rounded border border-[#8c7030]/25 bg-zinc-900/60 px-3 py-2.5 text-sm text-white focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-900 mt-6">
                <button
                  type="button"
                  onClick={handleCloseSubmit}
                  className="rounded border border-zinc-800 bg-transparent px-4 py-2 text-xs font-bold uppercase text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="rounded border border-[#d4af37] bg-[#d4af37] hover:bg-[#f6e05e] px-5 py-2 text-xs font-bold uppercase text-black transition-colors"
                >
                  {submitLoading ? 'Submitting...' : 'Mark as Solved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
