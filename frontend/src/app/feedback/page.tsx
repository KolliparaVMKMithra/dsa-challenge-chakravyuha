'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { apiRequest, getAuthToken, getUserType } from '@/utils/api';
import { Star, Send, ShieldAlert, Award, ClipboardCheck, Terminal, AlertCircle } from 'lucide-react';

interface QuestionOption {
  value: string;
  label: string;
}

export default function FeedbackPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<{ submitted: boolean; is_admin: boolean } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 15 questions form state
  const [q1, setQ1] = useState(0); // 1-5
  const [q2, setQ2] = useState(''); // radio
  const [q3, setQ3] = useState(''); // radio
  const [q4, setQ4] = useState(''); // radio
  const [q5, setQ5] = useState(''); // radio
  const [q6, setQ6] = useState(0); // 1-5
  const [q7, setQ7] = useState(''); // radio
  const [q8, setQ8] = useState(''); // textarea
  const [q9, setQ9] = useState(0); // 1-5
  const [q10, setQ10] = useState(0); // 1-5
  const [q11, setQ11] = useState(''); // radio
  const [q12, setQ12] = useState(0); // 1-5
  const [q13, setQ13] = useState(''); // textarea
  const [q14, setQ14] = useState(''); // radio
  const [q15, setQ15] = useState(''); // textarea

  useEffect(() => {
    const token = getAuthToken();
    const role = getUserType();
    
    if (!token || role !== 'student') {
      router.push('/');
      return;
    }

    const loadData = async () => {
      try {
        const statusData = await apiRequest('/api/dsa/feedback/status');
        setFeedbackStatus(statusData);
        
        // Fetch current student profile
        const meData = await apiRequest('/api/auth/me');
        setProfile(meData);
      } catch (err) {
        console.error('Failed to load profile/status:', err);
        setError('Failed to initialize feedback form. Please log in again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (q1 === 0 || q6 === 0 || q9 === 0 || q10 === 0 || q12 === 0) {
      setError('Please provide a rating for all rating-based questions (1, 6, 9, 10, and 12).');
      return;
    }
    if (!q2 || !q3 || !q4 || !q5 || !q7 || !q11 || !q14) {
      setError('Please answer all multiple-choice questions.');
      return;
    }
    if (!q8.trim() || !q13.trim() || !q15.trim()) {
      setError('Please fill out all open-ended questions.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      q1_dsa_difficulty: q1,
      q2_dsa_clarity: q2,
      q3_time_spent: q3,
      q4_solving_mode: q4,
      q5_prompting_used: q5,
      q6_prompting_effectiveness: q6,
      q7_prompt_type: q7,
      q8_prompt_challenge: q8,
      q9_concept_understanding: q9,
      q10_platform_rating: q10,
      q11_attendance_experience: q11,
      q12_codechef_interest: q12,
      q13_future_topics: q13,
      q14_prompting_improvement: q14,
      q15_general_feedback: q15
    };

    try {
      await apiRequest('/api/dsa/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setSuccess(true);
      if (feedbackStatus) {
        setFeedbackStatus({ ...feedbackStatus, submitted: true });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, setRating: (r: number) => void) => {
    return (
      <div className="flex items-center gap-1.5 mt-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= rating ? 'fill-[#d4af37] text-[#d4af37]' : 'text-zinc-700 hover:text-[#d4af37]/50'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const renderRadio = (
    currentValue: string,
    setValue: (val: string) => void,
    options: QuestionOption[]
  ) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2">
        {options.map((opt) => {
          const isSelected = currentValue === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setValue(opt.value)}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all ${
                isSelected
                  ? 'border-[#d4af37] bg-[#d4af37]/5 text-white shadow-[0_0_8px_rgba(212,175,55,0.15)] font-semibold'
                  : 'border-zinc-900 bg-zinc-900/40 text-zinc-400 hover:border-zinc-800 hover:text-zinc-300'
              }`}
            >
              <span className="text-xs">{opt.label}</span>
              <div
                className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center transition-all ${
                  isSelected ? 'border-[#d4af37]' : 'border-zinc-800'
                }`}
              >
                {isSelected && <div className="h-2 w-2 rounded-full bg-[#d4af37]" />}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-black text-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-2 border-[#d4af37] border-t-transparent mx-auto mb-4" />
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Preparing Feedback Form...</p>
          </div>
        </main>
      </div>
    );
  }

  if (feedbackStatus?.submitted) {
    return (
      <div className="flex min-h-screen flex-col bg-black text-white">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-8 text-center shadow-lg glass-panel text-zinc-300">
            <Award className="mx-auto h-12 w-12 text-[#d4af37] mb-4 animate-bounce" />
            <h2 className="text-lg font-serif font-bold text-white mb-2 uppercase tracking-wide">Feedback Logged!</h2>
            <p className="text-xs text-zinc-400 mb-6">
              Thank you, warrior! You have already submitted your feedback for today's challenge. Your insights have been securely saved to the scrolls.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="rounded border border-[#d4af37] bg-[#d4af37] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#f6e05e]"
            >
              Return to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Header />
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Banner Card */}
        <div className="rounded-lg border border-[#8c7030]/25 bg-gradient-to-r from-[#8c7030]/10 to-zinc-950/80 p-6 mb-8 glass-panel shadow-md">
          <div className="flex items-center gap-3.5 mb-2">
            <ClipboardCheck className="h-6 w-6 text-[#d4af37]" />
            <h1 className="text-xl font-serif font-bold text-white uppercase tracking-wide">Daily Challenge Feedback</h1>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            Warrior, your insights are invaluable. Please answer these 15 questions regarding today's DSA challenge and your AI prompting experience. Your response will guide the path of future challenges.
          </p>
          {profile && (
            <div className="flex flex-wrap gap-4 border-t border-zinc-900 pt-4 text-xs font-semibold text-zinc-500">
              <div>
                NAME: <span className="text-[#d4af37]">{profile.full_name || profile.name}</span>
              </div>
              <div>
                ROLL NUMBER: <span className="text-[#d4af37] font-mono">{profile.roll_number}</span>
              </div>
              <div>
                EMAIL: <span className="text-zinc-300 font-mono">{profile.college_email}</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-md border border-rose-950/40 bg-rose-950/15 p-4 text-xs text-rose-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="rounded-lg border border-emerald-950/40 bg-emerald-950/15 p-8 text-center shadow-lg text-zinc-300">
            <ClipboardCheck className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
            <h2 className="text-lg font-serif font-bold text-white mb-2 uppercase tracking-wide">Submission Successful!</h2>
            <p className="text-xs text-zinc-450 mb-6">
              Your feedback was successfully submitted. Keep sharpening your blade, warrior!
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="rounded border border-emerald-500 bg-emerald-500 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-emerald-400"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section 1: DSA Challenge */}
            <div className="rounded-lg border border-zinc-900 bg-zinc-950/45 p-6 space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] border-b border-zinc-900 pb-2 flex items-center gap-2">
                <Terminal className="h-4.5 w-4.5" />
                Section 1: Daily DSA Challenge Details
              </h3>

              {/* Q1 */}
              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  1. How would you rate the difficulty of today's DSA challenge?
                </label>
                {renderStars(q1, setQ1)}
              </div>

              {/* Q2 */}
              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  2. Was the problem statement clear and easy to understand?
                </label>
                {renderRadio(q2, setQ2, [
                  { value: 'Yes', label: 'Yes, very clear' },
                  { value: 'Neutral', label: 'Neutral / Average' },
                  { value: 'No', label: 'No, it was confusing' }
                ])}
              </div>

              {/* Q3 */}
              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  3. How much time did you spend solving today's challenge?
                </label>
                {renderRadio(q3, setQ3, [
                  { value: 'Under 30 mins', label: 'Less than 30 minutes' },
                  { value: '30-60 mins', label: '30 to 60 minutes' },
                  { value: '1-2 hours', label: '1 to 2 hours' },
                  { value: 'Over 2 hours', label: 'More than 2 hours' }
                ])}
              </div>

              {/* Q4 */}
              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  4. Did you solve the problem individually or collaborate with others?
                </label>
                {renderRadio(q4, setQ4, [
                  { value: 'Individually', label: 'Solved Individually' },
                  { value: 'Collaborated', label: 'Collaborated with peer(s)' },
                  { value: 'Did not solve', label: 'Did not manage to solve' }
                ])}
              </div>
            </div>

            {/* Section 2: AI Prompting */}
            <div className="rounded-lg border border-zinc-900 bg-zinc-950/45 p-6 space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] border-b border-zinc-900 pb-2 flex items-center gap-2">
                <Terminal className="h-4.5 w-4.5" />
                Section 2: Generative AI & Prompting Insights
              </h3>

              {/* Q5 */}
              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  5. Did you use any generative AI tools (ChatGPT, Gemini, Claude, etc.) to help you solve the problem?
                </label>
                {renderRadio(q5, setQ5, [
                  { value: 'Significant help', label: 'Yes, for complete coding help' },
                  { value: 'Minor help', label: 'Yes, for hints / syntax check' },
                  { value: 'No help', label: 'No, solved completely on my own' }
                ])}
              </div>

              {/* Q6 */}
              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  6. How effective was AI prompting in helping you understand/solve the DSA problem?
                </label>
                {renderStars(q6, setQ6)}
              </div>

              {/* Q7 */}
              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  7. What kind of prompts were most helpful?
                </label>
                {renderRadio(q7, setQ7, [
                  { value: 'Explaining code logic', label: 'Explaining code logic' },
                  { value: 'Finding syntax errors', label: 'Syntax checks / debugging' },
                  { value: 'Optimizing time/space complexity', label: 'Performance optimization' },
                  { value: 'Generating hints', label: 'Getting logic hints/clues' }
                ])}
              </div>

              {/* Q8 */}
              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  8. What was the biggest challenge you faced when prompting the AI model?
                </label>
                <textarea
                  required
                  value={q8}
                  onChange={(e) => setQ8(e.target.value)}
                  placeholder="Explain any issues like code hallucinations, wrong edge-cases, or difficulty phrasing the prompt..."
                  rows={3}
                  className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3.5 py-3 text-xs text-white focus:border-[#d4af37] focus:outline-none resize-none mt-2 placeholder-zinc-700"
                />
              </div>

              {/* Q9 */}
              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  9. How well do you feel you understand the underlying DSA concept now?
                </label>
                {renderStars(q9, setQ9)}
              </div>
            </div>

            {/* Section 3: Platform & Coordination */}
            <div className="rounded-lg border border-zinc-900 bg-zinc-950/45 p-6 space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] border-b border-zinc-900 pb-2 flex items-center gap-2">
                <Terminal className="h-4.5 w-4.5" />
                Section 3: Platform and Future Expectations
              </h3>

              {/* Q10 */}
              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  10. How would you rate the overall platform experience (submitting solutions, directory, leaderboard)?
                </label>
                {renderStars(q10, setQ10)}
              </div>

              {/* Q11 */}
              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  11. Was the QR attendance scanning smooth and fast?
                </label>
                {renderRadio(q11, setQ11, [
                  { value: 'Yes', label: 'Yes, very smooth' },
                  { value: 'No', label: 'No, there were delays' },
                  { value: 'N/A', label: 'Not applicable (Did not attend scan)' }
                ])}
              </div>

              {/* Q12 */}
              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  12. How would you rate your interest in the weekly CodeChef contests?
                </label>
                {renderStars(q12, setQ12)}
              </div>

              {/* Q13 */}
              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  13. What DSA topics would you like to see in future sessions?
                </label>
                <textarea
                  required
                  value={q13}
                  onChange={(e) => setQ13(e.target.value)}
                  placeholder="e.g. Dynamic Programming, Graphs, Advanced Trees, Segment Trees..."
                  rows={3}
                  className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3.5 py-3 text-xs text-white focus:border-[#d4af37] focus:outline-none resize-none mt-2 placeholder-zinc-700"
                />
              </div>

              {/* Q14 */}
              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  14. Would you like more sessions on advanced AI prompting techniques?
                </label>
                {renderRadio(q14, setQ14, [
                  { value: 'Definitely', label: 'Yes, definitely interested' },
                  { value: 'Maybe', label: 'Maybe / Depends' },
                  { value: 'No', label: 'No, not needed' }
                ])}
              </div>

              {/* Q15 */}
              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  15. Any other suggestions or general feedback for the Chakravyuha club coordinators?
                </label>
                <textarea
                  required
                  value={q15}
                  onChange={(e) => setQ15(e.target.value)}
                  placeholder="Share any other thoughts, suggestions, or comments here..."
                  rows={3}
                  className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3.5 py-3 text-xs text-white focus:border-[#d4af37] focus:outline-none resize-none mt-2 placeholder-zinc-700"
                />
              </div>
            </div>

            {/* Submission Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded border border-[#d4af37] bg-[#d4af37] py-3 text-center text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#f6e05e] disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Transmitting Feedback...' : 'Submit Feedback'}
              </button>
            </div>

          </form>
        )}
        
      </main>
    </div>
  );
}
