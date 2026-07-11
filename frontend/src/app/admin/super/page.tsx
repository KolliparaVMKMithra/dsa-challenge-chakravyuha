'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, BarChart3, Users, FolderKanban, Megaphone, Search, Filter, Download, Plus, Pencil, Trash2, Calendar, RefreshCw, Send, Check, X, ShieldAlert, ArrowUpRight, Clock, Award, CheckCircle, Lock, User, AlertCircle } from 'lucide-react';
import { apiRequest, getAuthToken, getUserType, clearAuth, setAuthToken } from '@/utils/api';

interface StudentSummary {
  id: string;
  name: string;
  roll_number: string;
  email: string;
  phone: string;
  branch: string;
  year: number;
  streak: number;
  solved: number;
  total_problems: number;
  percentage: number;
  attendance_count: number;
}

interface Problem {
  id: number;
  topic: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  leetcode_link: string;
  is_active: boolean;
}

interface AnalyticsData {
  total_students: number;
  total_problems: number;
  leaderboard: {
    name: string;
    roll_number: string;
    branch: string;
    year: number;
    streak: number;
    solved: number;
  }[];
  topic_solve_rates: {
    topic: string;
    solved_count: number;
    total_problems: number;
    rate: number;
  }[];
  codechef_compliance: {
    week: number | null;
    attended: number;
    missed: number;
    rate: number;
  };
  attendance_trend: {
    date: string;
    present: number;
    absent: number;
  }[];
}

interface StudentDetail {
  student: {
    name: string;
    roll_number: string;
    email: string;
    phone: string;
    branch: string;
    year: number;
    streak: number;
    qr_key: string;
  };
  submissions: {
    title: string;
    topic: string;
    difficulty: string;
    link: string;
    date: string;
  }[];
  attendance: {
    date: string;
    timestamp: string;
    marked_by: string;
  }[];
  codechef: {
    week: number;
    status: string;
    proof: string | null;
    date: string;
  }[];
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'directory' | 'problems' | 'broadcast' | 'scan_admins'>('analytics');
  
  // Inline Login states
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Scan/Super Admins management states
  const [scanAdmins, setScanAdmins] = useState<any[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({
    full_name: '',
    college_email: '',
    roll_number: '',
    phone_number: '',
    password: ''
  });

  const [superAdmins, setSuperAdmins] = useState<any[]>([]);
  const [superAdminsLoading, setSuperAdminsLoading] = useState(false);
  const [newSuperAdminForm, setNewSuperAdminForm] = useState({
    full_name: '',
    college_email: '',
    roll_number: '',
    phone_number: '',
    password: ''
  });

  // Leaderboard states
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Pagination states
  const [directoryPage, setDirectoryPage] = useState(1);
  const [leaderboardPage, setLeaderboardPage] = useState(1);

  // Broadcaster Search & Selection States
  const [broadcasterStudents, setBroadcasterStudents] = useState<any[]>([]);
  const [broadcasterSearch, setBroadcasterSearch] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [broadcasterLoading, setBroadcasterLoading] = useState(false);

  // Roster States
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<StudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Problem CRUD States
  const [problems, setProblems] = useState<Problem[]>([]);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [newProblem, setNewProblem] = useState({
    title: '',
    topic: '',
    difficulty: 'Easy',
    leetcode_link: ''
  });
  
  // CodeChef / Email Broadcaster States
  const [codechefForm, setCodechefForm] = useState({
    week_number: '1',
    contest_link: '',
    deadline: ''
  });
  const [emailForm, setEmailForm] = useState({
    subject: '',
    body: '',
    filter_type: 'all'
  });
  
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const checkAdminAuth = () => {
    const token = getAuthToken();
    const type = getUserType();
    
    if (!token || type !== 'super_admin') {
      setIsAdmin(false);
      setShowLoginPrompt(true);
      setLoading(false);
      return;
    }
    
    setIsAdmin(true);
    setShowLoginPrompt(false);
    setLoading(false);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });

      if (data.user_type !== 'super_admin') {
        throw new Error('Access forbidden: Only Super Admins can access this page.');
      }

      setAuthToken(data.access_token, data.user_type, data.name);
      setIsAdmin(true);
      setShowLoginPrompt(false);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const fetchSuperAdmins = async () => {
    setSuperAdminsLoading(true);
    try {
      const data = await apiRequest('/api/admin/super-admins');
      setSuperAdmins(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSuperAdminsLoading(false);
    }
  };

  const handleAddSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setActionLoading(true);
    try {
      await apiRequest('/api/admin/super-admins', {
        method: 'POST',
        body: JSON.stringify(newSuperAdminForm)
      });
      setActionSuccess('Super Admin registered successfully!');
      setNewSuperAdminForm({
        full_name: '',
        college_email: '',
        roll_number: '',
        phone_number: '',
        password: ''
      });
      fetchSuperAdmins();
    } catch (err: any) {
      setActionError(err.message || 'Failed to add Super Admin.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSuperAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to remove this Super Admin?')) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await apiRequest(`/api/admin/super-admins/${adminId}`, {
        method: 'DELETE'
      });
      setActionSuccess('Super Admin removed successfully.');
      fetchSuperAdmins();
    } catch (err: any) {
      setActionError(err.message || 'Failed to remove Super Admin.');
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`WARNING: This will permanently delete student "${studentName}" and all their code submissions, attendance logs, and leaderboard rankings from the database. This action CANNOT be undone.\n\nAre you sure you want to continue?`)) return;
    
    setActionError(null);
    setActionSuccess(null);
    try {
      setSelectedStudentDetail(null);
      await apiRequest(`/api/admin/students/${studentId}`, {
        method: 'DELETE'
      });
      setActionSuccess(`Student "${studentName}" deleted successfully.`);
      fetchStudentsDirectory();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete student.');
    }
  };

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const data = await apiRequest('/api/dsa/leaderboard');
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    
    if (activeTab === 'analytics') {
      fetchAnalytics();
    } else if (activeTab === 'directory') {
      fetchStudentsDirectory();
    } else if (activeTab === 'problems') {
      fetchProblems();
    } else if (activeTab === 'scan_admins') {
      fetchScanAdmins();
    } else if (activeTab === 'super_admins') {
      fetchSuperAdmins();
    } else if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    } else if (activeTab === 'broadcast') {
      fetchBroadcasterStudents();
    }
  }, [activeTab, isAdmin, searchQuery, selectedBranch, selectedYear]);

  useEffect(() => {
    setDirectoryPage(1);
  }, [searchQuery, selectedBranch, selectedYear]);

  // --- API CALLS ---

  const fetchAnalytics = async () => {
    try {
      const data = await apiRequest('/api/admin/reports/dashboard');
      setAnalytics(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchScanAdmins = async () => {
    setAdminsLoading(true);
    try {
      const data = await apiRequest('/api/admin/scan-admins');
      setScanAdmins(data);
    } catch (e) {
      console.error(e);
    } finally {
      setAdminsLoading(false);
    }
  };

  const fetchBroadcasterStudents = async () => {
    setBroadcasterLoading(true);
    try {
      const data = await apiRequest('/api/admin/students');
      setBroadcasterStudents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setBroadcasterLoading(false);
    }
  };

  const handleAddScanAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setActionLoading(true);
    try {
      await apiRequest('/api/admin/scan-admins', {
        method: 'POST',
        body: JSON.stringify(newAdminForm)
      });
      setActionSuccess('Scan Admin registered successfully!');
      setNewAdminForm({
        full_name: '',
        college_email: '',
        roll_number: '',
        phone_number: '',
        password: ''
      });
      fetchScanAdmins();
    } catch (err: any) {
      setActionError(err.message || 'Failed to add Scan Admin.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteScanAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to remove this Scan Admin?')) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await apiRequest(`/api/admin/scan-admins/${adminId}`, {
        method: 'DELETE'
      });
      setActionSuccess('Scan Admin removed successfully.');
      fetchScanAdmins();
    } catch (err: any) {
      setActionError(err.message || 'Failed to remove Scan Admin.');
    }
  };

  const fetchStudentsDirectory = async () => {
    try {
      let url = '/api/admin/students';
      const params = [];
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
      if (selectedBranch) params.push(`branch=${encodeURIComponent(selectedBranch)}`);
      if (selectedYear) params.push(`year=${selectedYear}`);
      
      if (params.length > 0) url += `?${params.join('&')}`;
      const data = await apiRequest(url);
      setStudents(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProblems = async () => {
    try {
      const data = await apiRequest('/api/admin/problems');
      setProblems(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStudentClick = async (studentId: string) => {
    setDetailLoading(true);
    try {
      const data = await apiRequest(`/api/admin/students/${studentId}/detail`);
      setSelectedStudentDetail(data);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  // --- STUDENT DIRECTORY EXPORT ---
  const handleExportStudents = async () => {
    try {
      let url = '/api/admin/students/export';
      const params = [];
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
      if (selectedBranch) params.push(`branch=${encodeURIComponent(selectedBranch)}`);
      if (selectedYear) params.push(`year=${selectedYear}`);
      
      if (params.length > 0) url += `?${params.join('&')}`;

      const blob = await apiRequest(url);
      const dlUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = dlUrl;
      link.download = `student_progress_report.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(dlUrl);
    } catch (err: any) {
      alert(err.message || 'Failed to export students.');
    }
  };

  // --- CRUD ACTIONS ---

  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await apiRequest('/api/admin/problems', {
        method: 'POST',
        body: JSON.stringify(newProblem)
      });
      
      setActionSuccess('Problem added successfully.');
      setNewProblem({ title: '', topic: '', difficulty: 'Easy', leetcode_link: '' });
      fetchProblems();
    } catch (err: any) {
      setActionError(err.message || 'Failed to add problem.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProblem) return;
    
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await apiRequest(`/api/admin/problems/${editingProblem.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingProblem)
      });
      
      setActionSuccess('Problem updated successfully.');
      setEditingProblem(null);
      fetchProblems();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update problem.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProblem = async (problemId: number) => {
    if (!confirm('Are you sure you want to delete this problem?')) return;
    
    setActionError(null);
    setActionSuccess(null);

    try {
      await apiRequest(`/api/admin/problems/${problemId}`, {
        method: 'DELETE'
      });
      
      setActionSuccess('Problem deleted successfully.');
      fetchProblems();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete problem.');
    }
  };

  // --- CODECHEF WEBHOOK ---
  const handleUpdateCodeChef = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await apiRequest('/api/admin/codechef/contest', {
        method: 'POST',
        body: JSON.stringify({
          week_number: parseInt(codechefForm.week_number),
          contest_link: codechefForm.contest_link,
          deadline: new Date(codechefForm.deadline).toISOString()
        })
      });
      
      setActionSuccess('CodeChef weekly challenge updated successfully.');
      setCodechefForm({ week_number: '', contest_link: '', deadline: '' });
    } catch (err: any) {
      setActionError(err.message || 'Failed to update contest link.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- BULK BROADCAST EMAIL ---
  const handleSendBulkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const payload: any = {
        subject: emailForm.subject,
        body: emailForm.body,
        filter_type: emailForm.filter_type
      };

      if (emailForm.filter_type === 'custom') {
        if (selectedStudentIds.length === 0) {
          throw new Error('Please select at least one student warrior to email.');
        }
        payload.student_ids = selectedStudentIds;
      }

      const res = await apiRequest('/api/admin/bulk-email', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      setActionSuccess(`Bulk email broadcast complete! Simulated sending to ${res.recipient_count} student(s). Logs saved to debug outbox.`);
      setEmailForm({ subject: '', body: '', filter_type: 'all' });
      setSelectedStudentIds([]);
    } catch (err: any) {
      setActionError(err.message || 'Failed to send bulk email.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-10 w-10 text-[#d4af37] animate-spin" />
          <span className="text-sm text-zinc-400 font-semibold tracking-wider uppercase">Loading Admin Console...</span>
        </div>
      </div>
    );
  }

  if (showLoginPrompt) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold tracking-wider font-serif text-gold-gradient">
              SUPER ADMIN CONSOLE
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#c5a059]">
              Super Admin Authorization Required
            </p>
          </div>

          <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-8 shadow-xl backdrop-blur-sm glass-panel">
            {loginError && (
              <div className="mb-6 flex items-start gap-2.5 rounded-md border border-rose-950 bg-rose-950/20 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleAdminLogin}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1">
                  Super Admin Email / Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="super_admin@chakravyuha.edu"
                    className="block w-full rounded border border-[#8c7030]/25 bg-zinc-900 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-600 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded border border-[#8c7030]/25 bg-zinc-900 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-600 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="group relative flex w-full justify-center rounded border border-[#d4af37] bg-gradient-to-r from-[#d4af37] to-[#8c7030] py-2.5 text-sm font-bold uppercase tracking-wider text-black hover:from-[#f6e05e] hover:to-[#d4af37] focus:outline-none transition-all disabled:opacity-50 font-semibold"
                >
                  {loginLoading ? 'Authorizing...' : 'Unlock Console'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#8c7030]/20 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-serif flex items-center gap-2">
            <ShieldCheck className="h-6.5 w-6.5 text-[#d4af37]" />
            Super Admin Control Center
          </h1>
          <p className="text-xs text-zinc-500">
            Complete platform oversight: detailed student tracking, sheet controls, and messaging gateways.
          </p>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-zinc-900 bg-zinc-950/40 p-1 rounded-lg max-w-4xl border border-[#8c7030]/15 overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold uppercase tracking-wider rounded transition-colors whitespace-nowrap ${
            activeTab === 'analytics' ? 'bg-[#d4af37] text-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold uppercase tracking-wider rounded transition-colors whitespace-nowrap ${
            activeTab === 'directory' ? 'bg-[#d4af37] text-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Users className="h-4 w-4" />
          Directory
        </button>
        <button
          onClick={() => setActiveTab('problems')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold uppercase tracking-wider rounded transition-colors whitespace-nowrap ${
            activeTab === 'problems' ? 'bg-[#d4af37] text-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <FolderKanban className="h-4 w-4" />
          DSA Sheet
        </button>
        <button
          onClick={() => setActiveTab('scan_admins')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold uppercase tracking-wider rounded transition-colors whitespace-nowrap ${
            activeTab === 'scan_admins' ? 'bg-[#d4af37] text-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Scan Admins
        </button>
        <button
          onClick={() => setActiveTab('super_admins')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold uppercase tracking-wider rounded transition-colors whitespace-nowrap ${
            activeTab === 'super_admins' ? 'bg-[#d4af37] text-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          Super Admins
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold uppercase tracking-wider rounded transition-colors whitespace-nowrap ${
            activeTab === 'leaderboard' ? 'bg-[#d4af37] text-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Award className="h-4 w-4" />
          Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold uppercase tracking-wider rounded transition-colors whitespace-nowrap ${
            activeTab === 'broadcast' ? 'bg-[#d4af37] text-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Megaphone className="h-4 w-4" />
          Broadcaster
        </button>
      </div>

      {/* Action feedback overlays */}
      {actionSuccess && (
        <div className="flex items-start gap-2.5 rounded-md border border-emerald-950 bg-emerald-950/20 p-4 text-xs text-emerald-400">
          <CheckCircle className="h-4.5 w-4.5 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="flex items-start gap-2.5 rounded-md border border-rose-950 bg-rose-950/20 p-4 text-xs text-rose-300">
          <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* TABS CONTAINER */}
      
      {/* 1. ANALYTICS TAB */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-8">
          {/* Key Aggregates Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Registered Solvers */}
            <div className="rounded-lg border border-[#8c7030]/15 bg-zinc-950/40 p-5 glass-panel flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Active Solvers</span>
                <h3 className="text-3xl font-extrabold text-white mt-1">{analytics.total_students}</h3>
                <p className="text-[10px] text-zinc-500 mt-1">Registered members in directory</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-[#d4af37]" />
              </div>
            </div>

            {/* Total DSA Problems */}
            <div className="rounded-lg border border-[#8c7030]/15 bg-zinc-950/40 p-5 glass-panel flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Total Problems</span>
                <h3 className="text-3xl font-extrabold text-white mt-1">{analytics.total_problems}</h3>
                <p className="text-[10px] text-zinc-500 mt-1">Active questions in the sheet</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center">
                <FolderKanban className="h-6 w-6 text-[#d4af37]" />
              </div>
            </div>

            {/* CodeChef Weekly Compliance */}
            <div className="rounded-lg border border-[#8c7030]/15 bg-zinc-950/40 p-5 glass-panel flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">CodeChef Compliance</span>
                <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">
                  {analytics.codechef_compliance.rate}%
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Week {analytics.codechef_compliance.week || 'N/A'} (Attended: {analytics.codechef_compliance.attended})
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Award className="h-6 w-6 text-emerald-400" />
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Topic-Wise Solve Rates */}
            <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-6 shadow-md glass-panel">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-4 border-b border-zinc-900 pb-3">
                Topic Solve Percentage Across Club
              </h3>
              
              {analytics.topic_solve_rates.length === 0 ? (
                <div className="text-center py-10 text-xs text-zinc-500">No submissions recorded yet.</div>
              ) : (
                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                  {analytics.topic_solve_rates.map((ts, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-zinc-300">{ts.topic}</span>
                        <span className="text-zinc-400 font-bold">{ts.rate}% <span className="text-[10px] font-normal text-zinc-500">({ts.solved_count} solves)</span></span>
                      </div>
                      <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                        <div 
                          className="h-full bg-gradient-to-r from-[#8c7030] to-[#d4af37]"
                          style={{ width: `${ts.rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Leaderboard */}
            <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-6 shadow-md glass-panel">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-4 border-b border-zinc-900 pb-3 flex items-center gap-1.5">
                <Award className="h-4.5 w-4.5 text-[#d4af37]" />
                Top Performers Leaderboard
              </h3>
              
              {analytics.leaderboard.length === 0 ? (
                <div className="text-center py-10 text-xs text-zinc-500">No student statistics logged.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-2 text-center">Rank</th>
                        <th className="py-2.5 px-2">Warrior</th>
                        <th className="py-2.5 px-2">Branch/Year</th>
                        <th className="py-2.5 px-2 text-center">Streak</th>
                        <th className="py-2.5 px-2 text-right">Solved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
                      {analytics.leaderboard.map((student, idx) => (
                        <tr key={idx} className="hover:bg-zinc-900/20">
                          <td className="py-2.5 px-2 text-center font-bold text-zinc-400">
                            #{idx + 1}
                          </td>
                          <td className="py-2.5 px-2 font-semibold text-white">
                            {student.name}
                            <span className="block text-[10px] text-zinc-500 font-normal">{student.roll_number}</span>
                          </td>
                          <td className="py-2.5 px-2">{student.branch} - Yr {student.year}</td>
                          <td className="py-2.5 px-2 text-center font-bold text-orange-400">
                            {student.streak} 🔥
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-[#d4af37]">
                            {student.solved} solved
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Attendance trends */}
            <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-6 shadow-md glass-panel lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-4 border-b border-zinc-900 pb-3 flex items-center gap-1.5">
                <Clock className="h-4.5 w-4.5 text-[#d4af37]" />
                Daily Attendance Trends (Last 7 Days)
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-4 text-center">
                {analytics.attendance_trend.map((day, idx) => (
                  <div key={idx} className="bg-zinc-900/40 border border-zinc-900 p-3 rounded">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block mb-2">{day.date}</span>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-emerald-400">{day.present} <span className="text-[9px] font-normal text-zinc-500">Present</span></p>
                      <p className="text-xs font-semibold text-zinc-500">{day.absent} Absent</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. DIRECTORY TAB */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="rounded-lg border border-[#8c7030]/15 bg-zinc-950/40 p-4 glass-panel flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:max-w-3xl">
              {/* Search */}
              <div className="flex w-full items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    value={searchInputValue}
                    onChange={(e) => setSearchInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setSearchQuery(searchInputValue);
                      }
                    }}
                    placeholder="Search by name, roll number, or email..."
                    className="block w-full rounded border border-zinc-900 bg-zinc-900 pl-9 pr-3 py-2 text-xs text-white focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => setSearchQuery(searchInputValue)}
                  className="rounded border border-[#d4af37] bg-[#d4af37] hover:bg-[#f6e05e] px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition-colors"
                >
                  Search
                </button>
              </div>
              
              {/* Branch filter */}
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full sm:w-44 rounded border border-zinc-900 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-[#d4af37] focus:outline-none"
              >
                <option value="">All Branches</option>
                <option value="CSE">CSE</option>
                <option value="AIE">AIE</option>
                <option value="AIDS">AIDS</option>
                <option value="CCE">CCE</option>
                <option value="ECE">ECE</option>
                <option value="Quantum Computing">Quantum Computing</option>
              </select>

              {/* Year filter */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full sm:w-36 rounded border border-zinc-900 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-[#d4af37] focus:outline-none"
              >
                <option value="">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            {/* Export buttons */}
            <button
              onClick={handleExportStudents}
              className="w-full md:w-auto flex items-center justify-center gap-2 rounded border border-[#d4af37] bg-[#d4af37] hover:bg-[#f6e05e] px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition-colors"
            >
              <Download className="h-4 w-4" />
              Export Roster Excel
            </button>
          </div>

          {/* Directory Table */}
          <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-5 shadow-md glass-panel">
            {students.length === 0 ? (
              <div className="text-center py-12 text-xs text-zinc-500">
                No student profiles found matching the filters.
              </div>
            ) : (() => {
              const itemsPerPage = 50;
              const totalPages = Math.ceil(students.length / itemsPerPage);
              const paginatedStudents = students.slice((directoryPage - 1) * itemsPerPage, directoryPage * itemsPerPage);

              return (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-wider">
                          <th className="py-3 px-3">Roll Number</th>
                          <th className="py-3 px-3">Warrior Name</th>
                          <th className="py-3 px-3">Branch/Year</th>
                          <th className="py-3 px-3">Contact</th>
                          <th className="py-3 px-3 text-center">Streak</th>
                          <th className="py-3 px-3 text-center">Attendance</th>
                          <th className="py-3 px-3 text-right">DSA Progress</th>
                          <th className="py-3 px-3 text-center w-20">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
                        {paginatedStudents.map((student, idx) => (
                          <tr 
                            key={idx} 
                            className="hover:bg-zinc-900/30 transition-colors cursor-pointer"
                            onClick={() => handleStudentClick(student.id)}
                          >
                            <td className="py-3.5 px-3 font-semibold text-white hover:text-[#d4af37]">
                              {student.roll_number}
                            </td>
                            <td className="py-3.5 px-3 font-semibold">{student.name}</td>
                            <td className="py-3.5 px-3">{student.branch} - Yr {student.year}</td>
                            <td className="py-3.5 px-3 text-zinc-500">
                              {student.email}
                              <span className="block text-[10px]">{student.phone}</span>
                            </td>
                            <td className="py-3.5 px-3 text-center font-bold text-orange-400">
                              {student.streak} 🔥
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className="font-semibold text-zinc-200">{student.attendance_count} Present</span>
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <span className="font-bold text-[#d4af37]">{student.percentage}%</span>
                              <span className="block text-[10px] text-zinc-500 font-normal">({student.solved}/{student.total_problems} solved)</span>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteStudent(student.id, student.name);
                                }}
                                className="rounded p-1.5 text-zinc-550 hover:bg-rose-950/20 hover:text-rose-450 transition-colors"
                                title="Delete Student Warrior"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Navigation */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-zinc-900 pt-4 text-xs">
                      <button
                        disabled={directoryPage === 1}
                        onClick={() => setDirectoryPage(p => Math.max(p - 1, 1))}
                        className="rounded border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-semibold text-zinc-450 hover:text-white disabled:opacity-50 transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-zinc-400 font-medium">
                        Page {directoryPage} of {totalPages}
                      </span>
                      <button
                        disabled={directoryPage === totalPages}
                        onClick={() => setDirectoryPage(p => Math.min(p + 1, totalPages))}
                        className="rounded border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-semibold text-zinc-450 hover:text-white disabled:opacity-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 3. DSA PROBLEMS CRUD TAB */}
      {activeTab === 'problems' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create/Edit Form (L: 1 col) */}
          <div className="space-y-6">
            <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-6 shadow-md glass-panel">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-5 border-b border-zinc-900 pb-3 flex items-center gap-2">
                <FolderKanban className="h-4.5 w-4.5 text-[#d4af37]" />
                {editingProblem ? 'Edit DSA Problem' : 'Add New Problem'}
              </h3>
              
              <form onSubmit={editingProblem ? handleUpdateProblem : handleCreateProblem} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Problem Title</label>
                  <input
                    type="text"
                    required
                    value={editingProblem ? editingProblem.title : newProblem.title}
                    onChange={(e) => {
                      if (editingProblem) setEditingProblem({ ...editingProblem, title: e.target.value });
                      else setNewProblem({ ...newProblem, title: e.target.value });
                    }}
                    placeholder="e.g. Subarray Sum Equals K"
                    className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2.5 text-white placeholder-zinc-700 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Topic Group</label>
                  <input
                    type="text"
                    required
                    value={editingProblem ? editingProblem.topic : newProblem.topic}
                    onChange={(e) => {
                      if (editingProblem) setEditingProblem({ ...editingProblem, topic: e.target.value });
                      else setNewProblem({ ...newProblem, topic: e.target.value });
                    }}
                    placeholder="e.g. Arrays, Trees, DP"
                    className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2.5 text-white placeholder-zinc-700 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Difficulty</label>
                  <select
                    value={editingProblem ? editingProblem.difficulty : newProblem.difficulty}
                    onChange={(e) => {
                      if (editingProblem) setEditingProblem({ ...editingProblem, difficulty: e.target.value as any });
                      else setNewProblem({ ...newProblem, difficulty: e.target.value });
                    }}
                    className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2.5 text-white focus:border-[#d4af37] focus:outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">LeetCode Link</label>
                  <input
                    type="url"
                    required
                    value={editingProblem ? editingProblem.leetcode_link : newProblem.leetcode_link}
                    onChange={(e) => {
                      if (editingProblem) setEditingProblem({ ...editingProblem, leetcode_link: e.target.value });
                      else setNewProblem({ ...newProblem, leetcode_link: e.target.value });
                    }}
                    placeholder="https://leetcode.com/problems/..."
                    className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2.5 text-white placeholder-zinc-700 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-3 border-t border-zinc-900">
                  {editingProblem && (
                    <button
                      type="button"
                      onClick={() => setEditingProblem(null)}
                      className="flex-1 rounded border border-zinc-800 bg-transparent py-2 text-center text-zinc-400 font-bold uppercase"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 rounded border border-[#d4af37] bg-[#d4af37] hover:bg-[#f6e05e] py-2 text-center text-black font-bold uppercase transition-colors"
                  >
                    {actionLoading ? 'Saving...' : editingProblem ? 'Save Changes' : 'Add Question'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Problems List (R: 2 cols) */}
          <div className="lg:col-span-2 rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-5 shadow-md glass-panel">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-4 border-b border-zinc-900 pb-3">
              DSA Problems List
            </h3>
            
            <div className="overflow-x-auto max-h-[560px] overflow-y-auto pr-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-2">Topic</th>
                    <th className="py-2.5 px-2">Question Title</th>
                    <th className="py-2.5 px-2">Difficulty</th>
                    <th className="py-2.5 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/50 text-zinc-300">
                  {problems.map((prob, idx) => {
                    const colors = {
                      Easy: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
                      Medium: 'text-amber-500 border-amber-500/20 bg-amber-500/10',
                      Hard: 'text-rose-500 border-rose-500/20 bg-rose-500/10'
                    };
                    
                    return (
                      <tr key={idx} className="hover:bg-zinc-900/10">
                        <td className="py-3 px-2 font-semibold text-zinc-400">{prob.topic}</td>
                        <td className="py-3 px-2 font-bold text-white">
                          <a href={prob.leetcode_link} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                            {prob.title}
                            <ArrowUpRight className="h-3 w-3 text-zinc-500" />
                          </a>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-block px-2 py-0.5 rounded border font-bold text-[9px] uppercase tracking-wider ${colors[prob.difficulty]}`}>
                            {prob.difficulty}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right space-x-2">
                          <button
                            onClick={() => setEditingProblem(prob)}
                            className="inline-flex items-center justify-center p-1.5 rounded border border-zinc-800 text-zinc-400 hover:text-white"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProblem(prob.id)}
                            className="inline-flex items-center justify-center p-1.5 rounded border border-rose-950 text-rose-500 hover:text-rose-400 hover:bg-rose-950/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. CODECHEF & BROADCASTER TAB */}
      {activeTab === 'broadcast' && (
        <div className="space-y-8 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* CodeChef Weekly Challenge Link Updater */}
            <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-6 shadow-md glass-panel flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-5 border-b border-zinc-900 pb-3 flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-[#d4af37]" />
                  Update Weekly CodeChef Challenge
                </h3>
                
                <form onSubmit={handleUpdateCodeChef} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Contest Week Number</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={codechefForm.week_number}
                      onChange={(e) => setCodechefForm({ ...codechefForm, week_number: e.target.value })}
                      className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2.5 text-white focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">CodeChef Contest URL</label>
                    <input
                      type="url"
                      required
                      value={codechefForm.contest_link}
                      onChange={(e) => setCodechefForm({ ...codechefForm, contest_link: e.target.value })}
                      placeholder="https://www.codechef.com/START..."
                      className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2.5 text-white placeholder-zinc-700 focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Participation Deadline</label>
                    <input
                      type="datetime-local"
                      required
                      value={codechefForm.deadline}
                      onChange={(e) => setCodechefForm({ ...codechefForm, deadline: e.target.value })}
                      className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2.5 text-white focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>

                  <div className="pt-3 border-t border-zinc-900 mt-6">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full rounded border border-[#d4af37] bg-[#d4af37] hover:bg-[#f6e05e] py-2.5 text-center text-black font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? 'Updating...' : 'Publish Contest Link'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Bulk Email Sender */}
            <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-6 shadow-md glass-panel">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-5 border-b border-zinc-900 pb-3 flex items-center gap-2">
                <Megaphone className="h-4.5 w-4.5 text-[#d4af37]" />
                Simulated Bulk Email Sender
              </h3>
              
              <form onSubmit={handleSendBulkEmail} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Target Recipient Group</label>
                  <select
                    value={emailForm.filter_type}
                    onChange={(e) => setEmailForm({ ...emailForm, filter_type: e.target.value })}
                    className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2.5 text-white focus:border-[#d4af37] focus:outline-none"
                  >
                    <option value="all">Broadcast to All Students</option>
                    <option value="missed_codechef">Students who missed this week's CodeChef</option>
                    <option value="inactive">Inactive Students (0 Solved Problems)</option>
                    <option value="custom">Custom Selection (Select Specific Warriors Below)</option>
                  </select>
                  {emailForm.filter_type === 'custom' && (
                    <div className="mt-2 text-[10px] text-[#d4af37] font-semibold">
                      Selected Recipients: {selectedStudentIds.length} student(s) selected in directory.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Email Subject</label>
                  <input
                    type="text"
                    required
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                    placeholder="e.g. Warning: Mandatory CodeChef Participation Missing"
                    className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2.5 text-white placeholder-zinc-700 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Message Body</label>
                  <textarea
                    required
                    rows={6}
                    value={emailForm.body}
                    onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                    placeholder="Warrior, you have not logged your solution for this week's contest. Do so immediately to keep your battlefield ranking..."
                    className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2.5 text-white placeholder-zinc-700 focus:border-[#d4af37] focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-zinc-900 mt-6">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 rounded border border-[#d4af37] bg-[#d4af37] hover:bg-[#f6e05e] py-2.5 text-center text-black font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {actionLoading ? 'Broadcasting...' : 'Broadcast Email'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Student Selector Directory Panel */}
          <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-6 shadow-md glass-panel">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-4 mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] flex items-center gap-1.5">
                  <Users className="h-4.5 w-4.5 text-[#d4af37]" />
                  Warrior Recipient Directory ({broadcasterStudents.length} Registered)
                </h3>
                <p className="text-[10px] text-zinc-500">
                  Search and select specific students to target with custom email broadcasts.
                </p>
              </div>

              {/* Search Input */}
              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  value={broadcasterSearch}
                  onChange={(e) => setBroadcasterSearch(e.target.value)}
                  placeholder="Search by name, roll, or email..."
                  className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-[#d4af37] focus:outline-none"
                />
              </div>
            </div>

            {broadcasterLoading && broadcasterStudents.length === 0 ? (
              <div className="text-center py-10">
                <RefreshCw className="mx-auto h-6 w-6 text-[#d4af37] animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2 px-2 text-center w-12">
                        <input
                          type="checkbox"
                          checked={
                            broadcasterStudents.length > 0 &&
                            broadcasterStudents.every(s => selectedStudentIds.includes(s.id))
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentIds(broadcasterStudents.map(s => s.id));
                            } else {
                              setSelectedStudentIds([]);
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-zinc-800 bg-zinc-900 text-[#d4af37] focus:ring-[#d4af37]"
                        />
                      </th>
                      <th className="py-2 px-3">Warrior Name</th>
                      <th className="py-2 px-3">Roll Number</th>
                      <th className="py-2 px-3">College Email</th>
                      <th className="py-2 px-3">Branch/Year</th>
                      <th className="py-2 px-3 text-center">Streak</th>
                      <th className="py-2 px-3 text-center">Solved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
                    {broadcasterStudents
                      .filter(s => 
                        s.name.toLowerCase().includes(broadcasterSearch.toLowerCase()) ||
                        s.roll_number.toLowerCase().includes(broadcasterSearch.toLowerCase()) ||
                        s.email.toLowerCase().includes(broadcasterSearch.toLowerCase())
                      )
                      .map((student, sIdx) => {
                        const isChecked = selectedStudentIds.includes(student.id);
                        return (
                          <tr 
                            key={sIdx} 
                            onClick={() => {
                              if (isChecked) {
                                setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                              } else {
                                setSelectedStudentIds([...selectedStudentIds, student.id]);
                              }
                            }}
                            className={`cursor-pointer hover:bg-zinc-900/30 transition-colors ${
                              isChecked ? 'bg-[#d4af37]/5 border-l-2 border-l-[#d4af37]' : ''
                            }`}
                          >
                            <td className="py-3 px-2 text-center w-12" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStudentIds([...selectedStudentIds, student.id]);
                                  } else {
                                    setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                                  }
                                }}
                                className="h-3.5 w-3.5 rounded border-zinc-800 bg-zinc-900 text-[#d4af37] focus:ring-[#d4af37]"
                              />
                            </td>
                            <td className="py-3 px-3 font-semibold text-white">{student.name}</td>
                            <td className="py-3 px-3 font-mono">{student.roll_number}</td>
                            <td className="py-3 px-3">{student.email}</td>
                            <td className="py-3 px-3">{student.branch} - Yr {student.year}</td>
                            <td className="py-3 px-3 text-center text-orange-400 font-bold">{student.streak} 🔥</td>
                            <td className="py-3 px-3 text-center text-[#d4af37] font-bold">{student.solved}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 5. SCAN ADMINS TAB */}
      {activeTab === 'scan_admins' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: List Scan Admins (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-6 shadow-md glass-panel">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-4 border-b border-zinc-900 pb-3 flex items-center gap-1.5">
                  <ShieldCheck className="h-4.5 w-4.5 text-[#d4af37]" />
                  Active Scan Admins Directory
                </h3>

                {adminsLoading && scanAdmins.length === 0 ? (
                  <div className="text-center py-10">
                    <RefreshCw className="mx-auto h-6 w-6 text-[#d4af37] animate-spin" />
                  </div>
                ) : scanAdmins.length === 0 ? (
                  <div className="text-center py-12 text-xs text-zinc-500">
                    No scan admins registered. Create one using the form on the right.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3">Name</th>
                          <th className="py-2.5 px-3">Roll Number</th>
                          <th className="py-2.5 px-3">Email</th>
                          <th className="py-2.5 px-3">Phone</th>
                          <th className="py-2.5 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
                        {scanAdmins.map((adm, idx) => (
                          <tr key={idx} className="hover:bg-zinc-900/10">
                            <td className="py-3 px-3 font-semibold text-white">{adm.full_name}</td>
                            <td className="py-3 px-3 font-mono">{adm.roll_number}</td>
                            <td className="py-3 px-3">{adm.college_email}</td>
                            <td className="py-3 px-3 text-zinc-400">{adm.phone_number}</td>
                            <td className="py-3 px-3 text-center">
                              {adm.roll_number === 'AVATTENDANCE' ? (
                                <span className="text-[10px] text-zinc-600 font-bold uppercase">System Default</span>
                              ) : (
                                <button
                                  onClick={() => handleDeleteScanAdmin(adm.id)}
                                  className="text-rose-500 hover:text-rose-400 transition-colors p-1"
                                  title="Remove Admin"
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Add Scan Admin Form (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-5 shadow-md glass-panel">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-4 border-b border-zinc-900 pb-3 flex items-center gap-1.5">
                  <Plus className="h-4.5 w-4.5 text-[#d4af37]" />
                  Add Scan Admin
                </h3>

                <form onSubmit={handleAddScanAdmin} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newAdminForm.full_name}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, full_name: e.target.value })}
                      placeholder="e.g. Sahadeva Pandava"
                      className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">College Email</label>
                    <input
                      type="email"
                      required
                      value={newAdminForm.college_email}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, college_email: e.target.value })}
                      placeholder="e.g. sahadeva@chakravyuha.edu"
                      className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Roll Number / Username</label>
                    <input
                      type="text"
                      required
                      value={newAdminForm.roll_number}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, roll_number: e.target.value })}
                      placeholder="e.g. medha or AV.SC.U4CSE23299"
                      className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={newAdminForm.phone_number}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, phone_number: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Password (Min 6 chars)</label>
                    <input
                      type="password"
                      required
                      value={newAdminForm.password}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                      placeholder="••••••••"
                      className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>

                  <div className="pt-3 border-t border-zinc-900 mt-5">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 rounded border border-[#d4af37] bg-[#d4af37] hover:bg-[#f6e05e] py-2.5 text-center text-black font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      {actionLoading ? 'Creating...' : 'Register Scan Admin'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 6. SUPER ADMINS TAB */}
      {activeTab === 'super_admins' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: List Super Admins (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-6 shadow-md glass-panel">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-4 border-b border-zinc-900 pb-3 flex items-center gap-1.5">
                  <ShieldCheck className="h-4.5 w-4.5 text-[#d4af37]" />
                  Active Super Admins Directory
                </h3>

                {superAdminsLoading && superAdmins.length === 0 ? (
                  <div className="text-center py-10">
                    <RefreshCw className="mx-auto h-6 w-6 text-[#d4af37] animate-spin" />
                  </div>
                ) : superAdmins.length === 0 ? (
                  <div className="text-center py-12 text-xs text-zinc-500">
                    No other super admins registered. Create one using the form on the right.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3">Name</th>
                          <th className="py-2.5 px-3">Roll Number</th>
                          <th className="py-2.5 px-3">Email</th>
                          <th className="py-2.5 px-3">Phone</th>
                          <th className="py-2.5 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
                        {superAdmins.map((adm, idx) => (
                          <tr key={idx} className="hover:bg-zinc-900/10">
                            <td className="py-3 px-3 font-semibold text-white">{adm.full_name}</td>
                            <td className="py-3 px-3 font-mono">{adm.roll_number}</td>
                            <td className="py-3 px-3">{adm.college_email}</td>
                            <td className="py-3 px-3 text-zinc-400">{adm.phone_number}</td>
                            <td className="py-3 px-3 text-center">
                              {adm.roll_number === 'AVSUPERADMIN' || adm.college_email === 'mithra@chakravyuha.club' ? (
                                <span className="text-[10px] text-zinc-600 font-bold uppercase">Primary Owner</span>
                              ) : (
                                <button
                                  onClick={() => handleDeleteSuperAdmin(adm.id)}
                                  className="text-rose-500 hover:text-rose-455 transition-colors p-1"
                                  title="Remove Super Admin"
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Add Super Admin Form (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-5 shadow-md glass-panel">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-4 border-b border-zinc-900 pb-3 flex items-center gap-1.5">
                  <Plus className="h-4.5 w-4.5 text-[#d4af37]" />
                  Add Super Admin
                </h3>

                <form onSubmit={handleAddSuperAdmin} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newSuperAdminForm.full_name}
                      onChange={(e) => setNewSuperAdminForm({ ...newSuperAdminForm, full_name: e.target.value })}
                      placeholder="e.g. Rudrabhishek"
                      className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">College Email</label>
                    <input
                      type="email"
                      required
                      value={newSuperAdminForm.college_email}
                      onChange={(e) => setNewSuperAdminForm({ ...newSuperAdminForm, college_email: e.target.value })}
                      placeholder="e.g. rudra@chakravyuha.club"
                      className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Roll Number / Username</label>
                    <input
                      type="text"
                      required
                      value={newSuperAdminForm.roll_number}
                      onChange={(e) => setNewSuperAdminForm({ ...newSuperAdminForm, roll_number: e.target.value })}
                      placeholder="e.g. medha or AV.SC.U4CSE23001"
                      className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={newSuperAdminForm.phone_number}
                      onChange={(e) => setNewSuperAdminForm({ ...newSuperAdminForm, phone_number: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Password (Min 6 chars)</label>
                    <input
                      type="password"
                      required
                      value={newSuperAdminForm.password}
                      onChange={(e) => setNewSuperAdminForm({ ...newSuperAdminForm, password: e.target.value })}
                      placeholder="••••••••"
                      className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>

                  <div className="pt-3 border-t border-zinc-900 mt-5">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 rounded border border-[#d4af37] bg-[#d4af37] hover:bg-[#f6e05e] py-2.5 text-center text-black font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      {actionLoading ? 'Creating...' : 'Register Super Admin'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 7. LEADERBOARD TAB */}
      {activeTab === 'leaderboard' && (
        <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-6 shadow-md glass-panel animate-fade-in">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-5 border-b border-zinc-900 pb-3 flex items-center gap-2">
            <Award className="h-5 w-5 text-[#d4af37]" />
            Global Solver Leaderboard Directory
          </h3>
          
          {leaderboardLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="mx-auto h-8 w-8 text-[#d4af37] animate-spin mb-2" />
              <span className="text-xs text-zinc-550 uppercase tracking-wider">Syncing Leaderboard...</span>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-zinc-550 text-xs">
              No students enrolled on the leaderboard.
            </div>
          ) : (() => {
            const itemsPerPage = 50;
            const totalPages = Math.ceil(leaderboard.length / itemsPerPage);
            const paginatedLeaderboard = leaderboard.slice((leaderboardPage - 1) * itemsPerPage, leaderboardPage * itemsPerPage);

            return (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-900 text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                        <th className="py-3 px-4 text-center w-16">Rank</th>
                        <th className="py-3 px-4">Warrior Name</th>
                        <th className="py-3 px-4">Roll Number</th>
                        <th className="py-3 px-4">Branch/Year</th>
                        <th className="py-3 px-4 text-center">Problems Solved</th>
                        <th className="py-3 px-4 text-center">Daily Streak</th>
                        <th className="py-3 px-4 text-center">Last Active Solve</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/50 text-zinc-350">
                      {paginatedLeaderboard.map((row) => (
                        <tr 
                          key={row.id} 
                          className="transition-colors hover:bg-zinc-900/10 cursor-pointer"
                          onClick={() => handleStudentClick(row.id)}
                        >
                          <td className="py-3 px-4 text-center font-bold">
                            {row.rank === 1 ? (
                              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#d4af37] text-black font-extrabold text-[10px]">1</span>
                            ) : row.rank === 2 ? (
                              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-zinc-400 text-black font-extrabold text-[10px]">2</span>
                            ) : row.rank === 3 ? (
                              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-700 text-white font-extrabold text-[10px]">3</span>
                            ) : (
                              <span className="text-zinc-500 font-mono">#{row.rank}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold text-white hover:text-[#d4af37]">{row.full_name}</td>
                          <td className="py-3 px-4 font-mono text-zinc-400">{row.roll_number}</td>
                          <td className="py-3 px-4">{row.branch} - Yr {row.year}</td>
                          <td className="py-3 px-4 text-center font-bold text-[#d4af37]">{row.solved_count} solved</td>
                          <td className="py-3 px-4 text-center font-bold text-orange-400">
                            <span className="inline-flex items-center gap-1">
                              {row.streak} 🔥
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-zinc-400 font-mono">
                            {row.last_submission_time 
                              ? new Date(row.last_submission_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) 
                              : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteStudent(row.id, row.full_name);
                              }}
                              className="rounded p-1 text-zinc-555 hover:text-rose-450 hover:bg-rose-950/20 transition-colors"
                              title="Delete Student Warrior"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-zinc-900 pt-4 text-xs">
                    <button
                      disabled={leaderboardPage === 1}
                      onClick={() => setLeaderboardPage(p => Math.max(p - 1, 1))}
                      className="rounded border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-semibold text-zinc-450 hover:text-white disabled:opacity-50 transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-zinc-400 font-medium">
                      Page {leaderboardPage} of {totalPages}
                    </span>
                    <button
                      disabled={leaderboardPage === totalPages}
                      onClick={() => setLeaderboardPage(p => Math.min(p + 1, totalPages))}
                      className="rounded border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-semibold text-zinc-450 hover:text-white disabled:opacity-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* STUDENT DETAIL MODAL DRAWER OVERLAY */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl h-full border-l border-[#8c7030]/40 bg-zinc-950 p-6 shadow-2xl overflow-y-auto glass-panel relative flex flex-col justify-between">
            <div>
              {/* Close Button */}
              <button 
                onClick={() => setSelectedStudentDetail(null)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-lg font-bold text-white font-serif mb-6 border-b border-zinc-900 pb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#d4af37]" />
                Warrior Profile Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/40 border border-zinc-900/80 p-4 rounded-lg text-xs mb-6">
                <p className="text-zinc-400">Name: <span className="font-semibold text-white">{selectedStudentDetail.student.name}</span></p>
                <p className="text-zinc-400">Roll Number: <span className="font-semibold text-white">{selectedStudentDetail.student.roll_number}</span></p>
                <p className="text-zinc-400">College Email: <span className="font-semibold text-white">{selectedStudentDetail.student.email}</span></p>
                <p className="text-zinc-400">Phone: <span className="font-semibold text-white">{selectedStudentDetail.student.phone}</span></p>
                <p className="text-zinc-400">Branch: <span className="font-semibold text-white">{selectedStudentDetail.student.branch}</span></p>
                <p className="text-zinc-400">Year: <span className="font-semibold text-white">{selectedStudentDetail.student.year} Year</span></p>
                <p className="text-zinc-400">Current Streak: <span className="font-bold text-orange-400">{selectedStudentDetail.student.streak} 🔥</span></p>
                <p className="text-zinc-400">QR Key: <span className="font-semibold text-zinc-500 font-mono select-all">{selectedStudentDetail.student.qr_key}</span></p>
              </div>

              {/* Submissions Logs */}
              <div className="space-y-6">
                
                {/* Solved Problems */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-3 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Solved Problems ({selectedStudentDetail.submissions.length})
                  </h3>
                  {selectedStudentDetail.submissions.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic pl-5">No problems solved yet.</p>
                  ) : (
                    <div className="overflow-x-auto max-h-40 overflow-y-auto border border-zinc-900 rounded">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-zinc-900/60 text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                            <th className="py-2 px-3">Title</th>
                            <th className="py-2 px-3">Topic</th>
                            <th className="py-2 px-3 text-center">Difficulty</th>
                            <th className="py-2 px-3 text-right">Link</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900 text-zinc-300">
                          {selectedStudentDetail.submissions.map((sub, sIdx) => (
                            <tr key={sIdx} className="hover:bg-zinc-900/20">
                              <td className="py-2 px-3 font-semibold text-white">{sub.title}</td>
                              <td className="py-2 px-3 text-zinc-400">{sub.topic}</td>
                              <td className="py-2 px-3 text-center">
                                <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                                  sub.difficulty === 'Easy' ? 'text-emerald-400 border-emerald-500/20' : sub.difficulty === 'Medium' ? 'text-amber-500 border-amber-500/20' : 'text-rose-500 border-rose-500/20'
                                }`}>
                                  {sub.difficulty}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <a href={sub.link} target="_blank" rel="noopener noreferrer" className="text-[#d4af37] hover:underline">
                                  Proof &rarr;
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Attendance Dates Log */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-3 flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-sky-400" />
                    Attendance Dates ({selectedStudentDetail.attendance.length})
                  </h3>
                  {selectedStudentDetail.attendance.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic pl-5">No attendance marked.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto border border-zinc-900/80 p-3 rounded bg-zinc-900/20">
                      {selectedStudentDetail.attendance.map((att, aIdx) => (
                        <span 
                          key={aIdx} 
                          className="inline-block text-[10px] font-bold bg-zinc-900 text-zinc-300 border border-zinc-800 px-2.5 py-1 rounded"
                          title={`Marked at ${new Date(att.timestamp).toLocaleTimeString()} by ${att.marked_by}`}
                        >
                          {att.date}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* CodeChef History */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-3 flex items-center gap-1">
                    <Award className="h-4 w-4 text-[#d4af37]" />
                    Wednesday CodeChef History ({selectedStudentDetail.codechef.length})
                  </h3>
                  {selectedStudentDetail.codechef.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic pl-5">No CodeChef records.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedStudentDetail.codechef.map((cc, cIdx) => (
                        <div key={cIdx} className="flex justify-between items-center rounded bg-zinc-900/30 border border-zinc-900 p-2 text-xs">
                          <span className="font-semibold text-zinc-300">Contest Week {cc.week}</span>
                          <div className="flex items-center gap-3">
                            {cc.proof && (
                              <a href={cc.proof} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#d4af37] hover:underline">
                                View Solution Proof
                              </a>
                            )}
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                              cc.status === 'attended' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-rose-400 border-rose-500/20 bg-rose-500/10'
                            }`}>
                              {cc.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div className="border-t border-zinc-900 pt-4 mt-6 flex justify-between items-center">
              <button
                onClick={() => handleDeleteStudent(selectedStudentDetail.student.id || '', selectedStudentDetail.student.name)}
                className="rounded border border-rose-900 bg-rose-950/10 hover:bg-rose-950/30 px-5 py-2 text-xs font-bold uppercase text-rose-400 transition-all focus:outline-none"
              >
                Delete Student Profile
              </button>
              <button 
                onClick={() => setSelectedStudentDetail(null)}
                className="rounded border border-zinc-800 bg-transparent px-5 py-2 text-xs font-bold uppercase text-zinc-400 hover:text-white"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
