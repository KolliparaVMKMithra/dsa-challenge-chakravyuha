'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, BarChart3, Users, FolderKanban, Megaphone, Search, Filter, Download, Plus, Pencil, Trash2, Calendar, RefreshCw, Send, Check, X, ShieldAlert, ArrowUpRight, Clock, Award, CheckCircle, Lock, User, AlertCircle, MessageSquare, Star, Terminal, Trophy, ChevronLeft } from 'lucide-react';
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
    id: string;
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
  const [activeTab, setActiveTab] = useState<'analytics' | 'directory' | 'problems' | 'broadcast' | 'scan_admins' | 'super_admins' | 'leaderboard' | 'feedback' | 'events'>('analytics');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<number | null>(null);

  // Event Management states
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [eventRegistrations, setEventRegistrations] = useState<any | null>(null);
  const [regsLoading, setRegsLoading] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    status: 'active'
  });
  
  // SIH 2026 Specific States
  const [sihTeams, setSihTeams] = useState<any[]>([]);
  const [sihAnalytics, setSihAnalytics] = useState<any | null>(null);
  const [sihExpandedTeamId, setSihExpandedTeamId] = useState<number | null>(null);
  const [sihSearch, setSihSearch] = useState('');
  const [sihPage, setSihPage] = useState(1);
  const SIH_PAGE_SIZE = 5;
  const [editSihTeamModalOpen, setEditSihTeamModalOpen] = useState(false);
  const [editingSihTeamId, setEditingSihTeamId] = useState<number | null>(null);
  const [editingSihTeamName, setEditingSihTeamName] = useState('');
  const [editingSihLeader, setEditingSihLeader] = useState<any>({
    full_name: '', college_email: '', personal_email: '', phone_number: '', study_year: 1, branch: 'CSE', roll_number: '', gender: ''
  });
  const [editingSihMembers, setEditingSihMembers] = useState<any[]>(
    Array.from({ length: 5 }, () => ({
      full_name: '', college_email: '', personal_email: '', phone_number: '', study_year: 1, branch: 'CSE', roll_number: '', gender: ''
    }))
  );
  const [editSihActiveTab, setEditSihActiveTab] = useState<number>(0);
  const [editSihSubmitting, setEditSihSubmitting] = useState(false);
  const [editSihError, setEditSihError] = useState<string | null>(null);
  const [editSihSuccess, setEditSihSuccess] = useState<string | null>(null);

  // PS Selection Analytics States
  const [psAnalytics, setPsAnalytics] = useState<any | null>(null);
  const [psTeams, setPsTeams] = useState<any[]>([]);
  const [psTeamsTotal, setPsTeamsTotal] = useState(0);
  const [psFilter, setPsFilter] = useState<'all' | 'confirmed' | 'not_confirmed'>('all');
  const [psTeamsPage, setPsTeamsPage] = useState(1);
  const [psTeamsSearch, setPsTeamsSearch] = useState('');
  const [psTeamsSearchInput, setPsTeamsSearchInput] = useState('');
  const [psTeamsLoading, setPsTeamsLoading] = useState(false);
  const [psOverrideTeamId, setPsOverrideTeamId] = useState<number | null>(null);
  const [psOverrideTeamName, setPsOverrideTeamName] = useState('');
  const [psOverrideSearch, setPsOverrideSearch] = useState('');
  const [psOverrideList, setPsOverrideList] = useState<any[]>([]);
  const [psOverrideLoading, setPsOverrideLoading] = useState(false);
  const [psOverrideSelected, setPsOverrideSelected] = useState<any | null>(null);
  const [psOverrideSubmitting, setPsOverrideSubmitting] = useState(false);
  const [psOverrideMsg, setPsOverrideMsg] = useState<string | null>(null);
  const PS_TEAMS_PAGE_SIZE = 10;

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

  // Event Detail Filter and Pagination States
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [eventBranchFilter, setEventBranchFilter] = useState('');
  const [eventYearFilter, setEventYearFilter] = useState('');
  const [eventSortBy, setEventSortBy] = useState('solved');
  const [eventListPage, setEventListPage] = useState(1);
  const [eventItemsPerPage, setEventItemsPerPage] = useState(25);

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

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const data = await apiRequest('/api/admin/events');
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.description) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await apiRequest('/api/admin/events', {
        method: 'POST',
        body: JSON.stringify(newEvent)
      });
      setActionSuccess('Event created successfully.');
      setNewEvent({ name: '', description: '', status: 'active' });
      fetchEvents();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create event.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: number, eventName: string) => {
    if (!confirm(`Are you sure you want to delete event "${eventName}"?`)) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await apiRequest(`/api/admin/events/${eventId}`, {
        method: 'DELETE'
      });
      setActionSuccess('Event deleted successfully.');
      fetchEvents();
      if (selectedEventId === eventId) {
        setSelectedEventId(null);
        setEventRegistrations(null);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete event.');
    }
  };

  const handleDeleteTeam = async (teamId: number, teamName: string) => {
    if (!confirm(`Are you sure you want to delete team "${teamName}"? This will also remove all members from the SIH event.`)) return;
    try {
      await apiRequest(`/api/admin/sih/teams/${teamId}`, { method: 'DELETE' });
      const [teamsData, analyticsData] = await Promise.all([
        apiRequest('/api/admin/sih/teams'),
        apiRequest('/api/admin/sih/analytics')
      ]);
      setSihTeams(teamsData || []);
      setSihAnalytics(analyticsData || null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete team.');
    }
  };

  const handleStartEditTeam = (team: any) => {
    setEditingSihTeamId(team.id);
    setEditingSihTeamName(team.team_name);
    
    const leaderData = team.members.find((m: any) => m.is_leader);
    const teammatesData = team.members.filter((m: any) => !m.is_leader);
    
    if (leaderData) {
      setEditingSihLeader({ ...leaderData });
    }
    
    const paddedTeammates = Array.from({ length: 5 }, (_, i) => {
      if (teammatesData[i]) return { ...teammatesData[i] };
      return { full_name: '', college_email: '', personal_email: '', phone_number: '', study_year: 1, branch: 'CSE', roll_number: '', gender: '' };
    });
    setEditingSihMembers(paddedTeammates);
    
    setEditSihActiveTab(0);
    setEditSihError(null);
    setEditSihSuccess(null);
    setEditSihTeamModalOpen(true);
  };

  const fetchEventRegistrations = async (eventId: number) => {
    const hasVal = eventId !== null && eventId !== undefined && String(eventId) !== '' && String(eventId) !== 'null' && String(eventId) !== 'undefined';
    if (!hasVal) {
      setEventRegistrations(null);
      return;
    }
    setRegsLoading(true);
    setSelectedEventId(eventId);
    try {
      const eventObj = events.find(e => e.id === eventId);
      const isSih = eventObj?.name?.toUpperCase().includes('SMART INDIA HACKATHON');
      
      if (isSih) {
        const [teamsData, analyticsData] = await Promise.all([
          apiRequest('/api/admin/sih/teams'),
          apiRequest('/api/admin/sih/analytics')
        ]);
        setSihTeams(teamsData || []);
        setSihAnalytics(analyticsData || null);
      }

      const data = await apiRequest(`/api/admin/events/${eventId}/registrations`);
      setEventRegistrations(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setRegsLoading(false);
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

  const getFilteredEventRegistrations = () => {
    if (!eventRegistrations || !eventRegistrations.students) return [];
    
    let list = [...eventRegistrations.students];
    
    // Search filter
    if (eventSearchQuery.trim()) {
      const q = eventSearchQuery.toLowerCase();
      list = list.filter(s => 
        s.full_name.toLowerCase().includes(q) ||
        s.college_email.toLowerCase().includes(q) ||
        (s.roll_number && s.roll_number.toLowerCase().includes(q))
      );
    }
    
    // Branch filter
    if (eventBranchFilter) {
      list = list.filter(s => s.branch === eventBranchFilter);
    }
    
    // Year filter
    if (eventYearFilter) {
      list = list.filter(s => s.year.toString() === eventYearFilter);
    }
    
    // Sorting
    list.sort((a, b) => {
      if (eventSortBy === 'solved') {
        return b.problems_solved - a.problems_solved;
      }
      if (eventSortBy === 'streak') {
        return b.streak_count - a.streak_count;
      }
      if (eventSortBy === 'attendance') {
        return b.attendance_count - a.attendance_count;
      }
      if (eventSortBy === 'name') {
        return a.full_name.localeCompare(b.full_name);
      }
      return 0;
    });
    
    return list;
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
    } else if (activeTab === 'feedback') {
      fetchFeedbacks();
    } else if (activeTab === 'events') {
      fetchEvents();
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
    } finally {
      setBroadcasterLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    setFeedbacksLoading(true);
    try {
      const data = await apiRequest('/api/admin/feedback');
      setFeedbacks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch feedbacks:', err);
      setFeedbacks([]);
    } finally {
      setFeedbacksLoading(false);
    }
  };

  const handleExportFeedback = async () => {
    try {
      const blob = await apiRequest('/api/admin/feedback/export');
      const dlUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = dlUrl;
      link.download = `student_feedback_report.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(dlUrl);
    } catch (err: any) {
      alert(err.message || 'Failed to export feedback.');
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

  // --- SIH TEAMS EXPORT (authenticated) ---
  const handleExportSihTeams = async () => {
    try {
      const blob = await apiRequest('/api/admin/sih/export');
      const dlUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = dlUrl;
      link.download = `SIH2026_Teams_Roster.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(dlUrl);
    } catch (err: any) {
      alert(err.message || 'Failed to export SIH teams.');
    }
  };

  // --- PER-EVENT EXPORT (authenticated) ---
  const handleExportEventRegistrations = async (eventId: number, eventName: string) => {
    try {
      const blob = await apiRequest(`/api/admin/events/${eventId}/export`);
      const dlUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = dlUrl;
      link.download = `${eventName.replace(/\s+/g, '_')}_report.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(dlUrl);
    } catch (err: any) {
      alert(err.message || 'Failed to export event registrations.');
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
          onClick={() => setActiveTab('events')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold uppercase tracking-wider rounded transition-colors whitespace-nowrap ${
            activeTab === 'events' ? 'bg-[#d4af37] text-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Events
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
        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold uppercase tracking-wider rounded transition-colors whitespace-nowrap ${
            activeTab === 'feedback' ? 'bg-[#d4af37] text-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Feedback
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
                <option value="CAI">CAI</option>
                <option value="AIDS">AIDS</option>
                <option value="Quantum">Quantum</option>
                <option value="CCE">CCE</option>
                <option value="ECE">ECE</option>
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

      {/* 8. FEEDBACK TAB */}
      {activeTab === 'feedback' && (
        <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-6 shadow-md glass-panel animate-fade-in space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#d4af37]" />
                Warrior Insights & Event Feedback ({feedbacks.length} Responses)
              </h3>
              <p className="text-[10px] text-zinc-500">
                Track how students evaluate overall event satisfaction, DSA concepts learning, and platform usability.
              </p>
            </div>
            
            <button
              onClick={handleExportFeedback}
              className="flex items-center justify-center gap-2 rounded border border-[#d4af37] bg-[#d4af37] px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#f6e05e]"
            >
              <Download className="h-4 w-4" />
              Export Feedback Excel
            </button>
          </div>

          {feedbacksLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="mx-auto h-8 w-8 text-[#d4af37] animate-spin mb-2" />
              <span className="text-xs text-zinc-550 uppercase tracking-wider">Loading Feedback Responses...</span>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12 text-zinc-550 text-xs">
              No student feedbacks submitted yet.
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((fb) => {
                const isExpanded = expandedFeedbackId === fb.id;
                return (
                  <div 
                    key={fb.id} 
                    className={`rounded-lg border transition-all ${
                      isExpanded ? 'border-[#d4af37]/65 bg-zinc-900/40' : 'border-zinc-900 bg-zinc-950/40 hover:border-zinc-800'
                    }`}
                  >
                    {/* Summary Header */}
                    <div 
                      onClick={() => setExpandedFeedbackId(isExpanded ? null : fb.id)}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-semibold text-white">{fb.student_name}</span>
                          <span className="text-xs text-[#d4af37] font-mono font-bold bg-[#d4af37]/5 px-2 py-0.5 rounded border border-[#d4af37]/15">
                            {fb.student_roll}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500">
                          {fb.student_email} • {fb.student_branch} - Yr {fb.student_year}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                        <div className="flex items-center gap-1">
                          <span>Overall Event:</span>
                          <span className="text-[#d4af37] font-bold">{fb.q1_dsa_difficulty || 0}/5 ⭐</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>DSA Learning:</span>
                          <span className="text-[#d4af37] font-bold">{fb.q6_prompting_effectiveness || 0}/5 ⭐</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>AI Help:</span>
                          <span className="text-[#d4af37] font-bold">{fb.q9_concept_understanding || 0}/5 ⭐</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Platform:</span>
                          <span className="text-[#d4af37] font-bold">{fb.q10_platform_rating || 0}/5 ⭐</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono font-normal">
                          {fb.submitted_at ? new Date(fb.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Accordion Content */}
                    {isExpanded && (
                      <div className="border-t border-zinc-900 p-6 bg-zinc-950/60 text-xs space-y-6 animate-slide-down">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Event Experience section */}
                          <div className="space-y-4">
                            <h4 className="font-bold text-[#c5a059] uppercase tracking-wide text-[10px] border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
                              <Terminal className="h-4 w-4" />
                              Section 1: Event Experience & Satisfaction
                            </h4>
                            
                            <div className="space-y-2">
                              <p className="text-zinc-500 font-medium">1. Overall Event Rating:</p>
                              <div className="text-white font-semibold flex items-center gap-1">
                                {fb.q1_dsa_difficulty}/5 
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                      key={star} 
                                      className={`h-3.5 w-3.5 ${
                                        star <= (fb.q1_dsa_difficulty || 0) ? 'fill-[#d4af37] text-[#d4af37]' : 'text-zinc-800'
                                      }`} 
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-zinc-500 font-medium">2. Liked Event Structure & Execution:</p>
                              <p className="text-white font-semibold">{fb.q2_dsa_clarity}</p>
                            </div>

                            <div className="space-y-2">
                              <p className="text-zinc-500 font-medium">3. Met Expectations:</p>
                              <p className="text-white font-semibold">{fb.q3_time_spent}</p>
                            </div>

                            <div className="space-y-2">
                              <p className="text-zinc-500 font-medium">4. Learned Anything New:</p>
                              <p className="text-white font-semibold">{fb.q4_solving_mode}</p>
                            </div>

                            <div className="space-y-2">
                              <p className="text-zinc-500 font-medium">5. Improved Coding Confidence:</p>
                              <p className="text-white font-semibold">{fb.q5_prompting_used}</p>
                            </div>
                          </div>

                          {/* DSA Concepts & AI section */}
                          <div className="space-y-4">
                            <h4 className="font-bold text-[#c5a059] uppercase tracking-wide text-[10px] border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
                              <Terminal className="h-4 w-4" />
                              Section 2: DSA Concepts & AI Assistance
                            </h4>

                            <div className="space-y-2">
                              <p className="text-zinc-500 font-medium">6. DSA Concept Understanding Rating:</p>
                              <div className="text-white font-semibold flex items-center gap-1">
                                {fb.q6_prompting_effectiveness}/5 
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                      key={star} 
                                      className={`h-3.5 w-3.5 ${
                                        star <= (fb.q6_prompting_effectiveness || 0) ? 'fill-[#d4af37] text-[#d4af37]' : 'text-zinc-800'
                                      }`} 
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-zinc-500 font-medium">7. Helpful in Practical DSA Applications:</p>
                              <p className="text-white font-semibold">{fb.q7_prompt_type}</p>
                            </div>

                            <div className="space-y-2">
                              <p className="text-zinc-500 font-medium">9. AI Prompting Helpfulness:</p>
                              <div className="text-white font-semibold flex items-center gap-1">
                                {fb.q9_concept_understanding}/5 
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                      key={star} 
                                      className={`h-3.5 w-3.5 ${
                                        star <= (fb.q9_concept_understanding || 0) ? 'fill-[#d4af37] text-[#d4af37]' : 'text-zinc-800'
                                      }`} 
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Open Ended & Future Section */}
                        <div className="space-y-4 pt-4 border-t border-zinc-900">
                          <h4 className="font-bold text-[#c5a059] uppercase tracking-wide text-[10px] border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
                            <Terminal className="h-4 w-4" />
                            Section 3: Open Responses & Future Outreach
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <p className="text-zinc-500 font-medium">8. Most Understood DSA Concepts Today:</p>
                              <div className="bg-zinc-900/60 border border-zinc-900 rounded p-3 text-zinc-300 select-all font-mono leading-relaxed">
                                {fb.q8_prompt_challenge}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-zinc-500 font-medium">13. Favorite Event Aspects:</p>
                              <div className="bg-zinc-900/60 border border-zinc-900 rounded p-3 text-zinc-300 select-all font-mono leading-relaxed">
                                {fb.q13_future_topics}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <p className="text-zinc-500 font-medium">15. General Suggestions to Coordinators:</p>
                              <div className="bg-zinc-900/60 border border-zinc-900 rounded p-3 text-zinc-300 select-all font-mono leading-relaxed">
                                {fb.q15_general_feedback}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <p className="text-zinc-500 font-medium">10. Platform Experience Rating:</p>
                                <div className="text-white font-semibold flex items-center gap-1">
                                  {fb.q10_platform_rating}/5 
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star 
                                        key={star} 
                                        className={`h-3.5 w-3.5 ${
                                          star <= (fb.q10_platform_rating || 0) ? 'fill-[#d4af37] text-[#d4af37]' : 'text-zinc-800'
                                        }`} 
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <p className="text-zinc-500 font-medium">12. Future Events Attendance Likelihood:</p>
                                <div className="text-white font-semibold flex items-center gap-1">
                                  {fb.q12_codechef_interest}/5 
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star 
                                        key={star} 
                                        className={`h-3.5 w-3.5 ${
                                          star <= (fb.q12_codechef_interest || 0) ? 'fill-[#d4af37] text-[#d4af37]' : 'text-zinc-800'
                                        }`} 
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <p className="text-zinc-500 font-medium">11. Problem Statement Clarity:</p>
                                <p className="text-white font-semibold">{fb.q11_attendance_experience}</p>
                              </div>

                              <div className="space-y-2">
                                <p className="text-zinc-500 font-medium">14. Recommend to Peers:</p>
                                <p className="text-white font-semibold">{fb.q14_prompting_improvement}</p>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 9. EVENTS MANAGEMENT TAB */}
      {activeTab === 'events' && (
        <div className="space-y-6 animate-fade-in text-xs">
          {actionSuccess && (
            <div className="rounded border border-emerald-950 bg-emerald-950/20 p-3 text-emerald-300">
              {actionSuccess}
            </div>
          )}
          {actionError && (
            <div className="rounded border border-rose-950 bg-rose-950/20 p-3 text-rose-300">
              {actionError}
            </div>
          )}

          {selectedEventId && eventRegistrations ? (
            <div className="space-y-6 animate-fade-in text-left">
              
              {/* Detailed Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950/70 border border-zinc-900 p-6 rounded-2xl shadow-md">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setSelectedEventId(null);
                      setEventRegistrations(null);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white font-bold text-[10px] uppercase tracking-wider transition"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                  <div>
                    <h3 className="text-base font-bold text-white font-serif tracking-wide flex items-center gap-2">
                      {eventRegistrations.event_name}
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border bg-emerald-950/30 text-emerald-400 border-emerald-500/20">
                        Active
                      </span>
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-1">Detailed registration roster and solver metrics.</p>
                  </div>
                </div>
                
                <button
                  onClick={
                    eventRegistrations.event_name.toUpperCase().includes('SMART INDIA HACKATHON')
                      ? handleExportSihTeams
                      : () => handleExportEventRegistrations(selectedEventId!, eventRegistrations.event_name)
                  }
                  className="flex items-center justify-center gap-1.5 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-950/60 border border-emerald-500/20 px-4 py-2 rounded text-[10px] font-extrabold uppercase tracking-wider transition"
                >
                  <Download className="h-4 w-4" /> Download Excel Report
                </button>
              </div>

              {/* Stats Grid */}
              {(() => {
                const isSih = eventRegistrations.event_name.toUpperCase().includes('SMART INDIA HACKATHON');

                if (isSih) {
                  return (
                    <div className="space-y-6">
                      {/* Analytics cards */}
                      {sihAnalytics && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 shadow-sm text-center">
                              <span className="block text-xl font-black text-[#d4af37]">{sihAnalytics.total_teams}</span>
                              <span className="text-[9px] uppercase tracking-widest font-extrabold text-zinc-500 block mt-1">Total Teams</span>
                            </div>
                            
                            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 shadow-sm text-center">
                              <span className="block text-xl font-black text-white">{sihAnalytics.total_students}</span>
                              <span className="text-[9px] uppercase tracking-widest font-extrabold text-zinc-500 block mt-1">Total Students</span>
                            </div>

                            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 shadow-sm text-center">
                              <span className="block text-xl font-black text-rose-400">{sihAnalytics.gender_breakdown.Woman}</span>
                              <span className="text-[9px] uppercase tracking-widest font-extrabold text-zinc-500 block mt-1">Women Participation</span>
                            </div>

                            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 shadow-sm text-center">
                              <span className="block text-xl font-black text-blue-400">{sihAnalytics.gender_breakdown.Man}</span>
                              <span className="text-[9px] uppercase tracking-widest font-extrabold text-zinc-500 block mt-1">Men Participation</span>
                            </div>
                          </div>

                          {/* All-1st-year teams cap card — full width banner */}
                          <div
                            className="rounded-xl border p-4 space-y-3"
                            style={{
                              background: sihAnalytics.all_first_year_teams >= 20
                                ? 'rgba(239,68,68,0.06)'
                                : 'rgba(212,175,55,0.05)',
                              borderColor: sihAnalytics.all_first_year_teams >= 20
                                ? 'rgba(239,68,68,0.35)'
                                : 'rgba(212,175,55,0.25)',
                            }}
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]">
                                  🎓 All-1st-Year Teams Registered
                                </p>
                                <p className="text-[10px] text-zinc-500 mt-0.5">
                                  Teams where every member is a 1st-year student. Max cap: 20.
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span
                                  className="text-2xl font-black"
                                  style={{
                                    color: sihAnalytics.all_first_year_teams >= 20 ? '#ef4444' : '#d4af37'
                                  }}
                                >
                                  {sihAnalytics.all_first_year_teams}
                                </span>
                                <span className="text-sm font-bold text-zinc-500"> / 20</span>
                                {sihAnalytics.all_first_year_teams >= 20 && (
                                  <p className="text-[9px] font-extrabold text-red-400 uppercase tracking-widest mt-0.5">Cap Reached</p>
                                )}
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${Math.min((sihAnalytics.all_first_year_teams / 20) * 100, 100)}%`,
                                  background: sihAnalytics.all_first_year_teams >= 20
                                    ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                                    : 'linear-gradient(90deg, #d4af37, #8c7030)',
                                }}
                              />
                            </div>
                            <p className="text-[9px] text-zinc-600 text-right">
                              {Math.max(0, 20 - sihAnalytics.all_first_year_teams)} slot{Math.max(0, 20 - sihAnalytics.all_first_year_teams) !== 1 ? 's' : ''} remaining
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Detailed analytics stats for branches and years */}
                      {sihAnalytics && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#d4af37] border-b border-zinc-900 pb-2">Branch Distribution</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                              {Object.entries(sihAnalytics.branch_breakdown).map(([br, count]: any) => (
                                <div key={br} className="flex justify-between p-1 bg-zinc-900/40 rounded border border-zinc-900">
                                  <span>{br}</span>
                                  <span className="font-bold text-white">{count}</span>
                                </div>
                              ))}
                              {Object.keys(sihAnalytics.branch_breakdown).length === 0 && (
                                <span className="text-zinc-500">No branch data available</span>
                              )}
                            </div>
                          </div>

                          <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#d4af37] border-b border-zinc-900 pb-2">Study Year Distribution</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                              {Object.entries(sihAnalytics.year_breakdown).map(([yr, count]: any) => (
                                <div key={yr} className="flex justify-between p-1 bg-zinc-900/40 rounded border border-zinc-900">
                                  <span>Year {yr}</span>
                                  <span className="font-bold text-white">{count}</span>
                                </div>
                              ))}
                              {Object.keys(sihAnalytics.year_breakdown).length === 0 && (
                                <span className="text-zinc-500">No year data available</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── PS Selection Analytics ── */}
                      <div className="rounded-xl border border-indigo-900/30 bg-indigo-950/10 p-5 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-sm font-bold text-white font-serif">Problem Statement Selection Analytics</h4>
                          <button
                            onClick={() => {
                              apiRequest('/api/admin/sih/ps-analytics').then((d: any) => setPsAnalytics(d)).catch(() => {});
                              setPsTeamsLoading(true);
                              apiRequest(`/api/admin/sih/teams-with-ps?ps_filter=${psFilter}&search=${encodeURIComponent(psTeamsSearch)}&page=${psTeamsPage}&limit=${PS_TEAMS_PAGE_SIZE}`)
                                .then((d: any) => { setPsTeams(d.items); setPsTeamsTotal(d.total); }).catch(() => {}).finally(() => setPsTeamsLoading(false));
                            }}
                            className="px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wider border border-indigo-800/40 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-900/40 transition"
                          >
                            Refresh PS Data
                          </button>
                        </div>

                        {/* Analytics Cards */}
                        {psAnalytics && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/10 p-4 text-center">
                              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-1">PS Confirmed</p>
                              <span className="text-2xl font-black text-emerald-400">{psAnalytics.confirmed}</span>
                              <p className="text-[10px] text-zinc-500 mt-1">of {psAnalytics.total_teams} teams</p>
                            </div>
                            <div className="rounded-xl border border-rose-900/40 bg-rose-950/10 p-4 text-center">
                              <p className="text-[10px] font-black uppercase tracking-wider text-rose-400 mb-1">Not Selected</p>
                              <span className="text-2xl font-black text-rose-400">{psAnalytics.not_confirmed}</span>
                              <p className="text-[10px] text-zinc-500 mt-1">pending selection</p>
                            </div>
                            <div className="col-span-2 sm:col-span-1 rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5 p-4">
                              <p className="text-[10px] font-black uppercase tracking-wider text-[#d4af37] mb-2">Top PS Choices</p>
                              {psAnalytics.ps_distribution.slice(0, 5).map((row: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between gap-2 text-xs py-0.5">
                                  <span className="text-zinc-300 font-mono">{row.ps_number}</span>
                                  <span className="text-[#d4af37] font-black">{row.team_count} team{row.team_count !== 1 ? 's' : ''}</span>
                                </div>
                              ))}
                              {psAnalytics.ps_distribution.length === 0 && <p className="text-xs text-zinc-600">No selections yet</p>}
                            </div>
                          </div>
                        )}

                        {/* Filter Tabs */}
                        <div className="flex gap-2 flex-wrap">
                          {(['all', 'confirmed', 'not_confirmed'] as const).map(f => (
                            <button
                              key={f}
                              onClick={() => { setPsFilter(f); setPsTeamsPage(1); }}
                              className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wider transition ${
                                psFilter === f
                                  ? f === 'confirmed' ? 'bg-emerald-950/40 border border-emerald-900/40 text-emerald-300'
                                  : f === 'not_confirmed' ? 'bg-rose-950/40 border border-rose-900/40 text-rose-300'
                                  : 'bg-indigo-950/40 border border-indigo-800/40 text-indigo-300'
                                  : 'border border-zinc-800 text-zinc-500 hover:text-white'
                              }`}
                            >
                              {f === 'all' ? 'All Teams' : f === 'confirmed' ? '✓ PS Confirmed' : '✗ Not Confirmed'}
                            </button>
                          ))}
                          <div className="relative ml-auto">
                            <input
                              type="text"
                              placeholder="Search team..."
                              value={psTeamsSearchInput}
                              onChange={e => setPsTeamsSearchInput(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') { setPsTeamsSearch(psTeamsSearchInput); setPsTeamsPage(1); } }}
                              className="w-40 bg-zinc-900 border border-zinc-800 rounded-lg pl-3 pr-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-600/50"
                            />
                          </div>
                        </div>

                        {/* Teams with PS table */}
                        {psTeamsLoading ? (
                          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400"></div></div>
                        ) : psTeams.length === 0 ? (
                          <p className="text-sm text-zinc-500 text-center py-6">No data loaded yet. Click &quot;Refresh PS Data&quot; to load.</p>
                        ) : (
                          <div className="space-y-2">
                            {psTeams.map((team: any) => (
                              <div key={team.id} className="rounded-xl border border-zinc-900/60 bg-zinc-950/30 p-4 flex items-start gap-4 flex-wrap">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-black text-white">{team.team_name}</p>
                                  <p className="text-[10px] text-zinc-500 mt-0.5">Registered: {new Date(team.created_at).toLocaleDateString('en-IN')}</p>
                                </div>
                                {team.ps_selection ? (
                                  <div className="text-right space-y-0.5 flex-shrink-0">
                                    <div className="flex items-center gap-2 justify-end">
                                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-900/30 text-emerald-400">✓ Confirmed</span>
                                      <span className="text-[10px] font-black text-[#d4af37] font-mono">{team.ps_selection.ps_number}</span>
                                      {team.ps_selection.last_edited_by_admin && (
                                        <span className="text-[8px] font-bold uppercase px-1 py-0.5 rounded bg-blue-950/40 border border-blue-800/40 text-blue-400">Admin Edited</span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-zinc-400 text-right">{team.ps_selection.title?.slice(0, 60)}{team.ps_selection.title?.length > 60 ? '...' : ''}</p>
                                  </div>
                                ) : (
                                  <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-rose-950/30 border border-rose-900/30 text-rose-400">Not Selected</span>
                                )}
                                <button
                                  onClick={() => {
                                    setPsOverrideTeamId(team.id);
                                    setPsOverrideTeamName(team.team_name);
                                    setPsOverrideSelected(null);
                                    setPsOverrideSearch('');
                                    setPsOverrideList([]);
                                    setPsOverrideMsg(null);
                                  }}
                                  className="flex-shrink-0 px-2.5 py-1.5 rounded text-[9px] font-black uppercase tracking-wider border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition"
                                >
                                  Edit PS
                                </button>
                              </div>
                            ))}
                            {/* PS Teams Pagination */}
                            {psTeamsTotal > PS_TEAMS_PAGE_SIZE && (
                              <div className="flex items-center justify-center gap-3 pt-2">
                                <button onClick={() => setPsTeamsPage(p => Math.max(1, p - 1))} disabled={psTeamsPage === 1} className="p-1.5 rounded border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 transition">
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                                <span className="text-xs text-zinc-500">Page {psTeamsPage} of {Math.ceil(psTeamsTotal / PS_TEAMS_PAGE_SIZE)}</span>
                                <button onClick={() => setPsTeamsPage(p => p + 1)} disabled={psTeamsPage >= Math.ceil(psTeamsTotal / PS_TEAMS_PAGE_SIZE)} className="p-1.5 rounded border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 transition">
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Admin PS Override Modal */}
                      {psOverrideTeamId !== null && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}>
                          <div className="relative w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: '#0a0900', border: '1px solid rgba(212,175,55,0.3)' }}>
                            <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#d4af37,#8c7030,#d4af37)' }} />
                            <button onClick={() => setPsOverrideTeamId(null)} className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition">
                              <X className="h-4 w-4" />
                            </button>
                            <div className="p-6 space-y-4">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]">Admin Override — PS Selection</p>
                                <h3 className="text-base font-extrabold text-white mt-0.5">{psOverrideTeamName}</h3>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Search PS by number or title..."
                                  value={psOverrideSearch}
                                  onChange={e => setPsOverrideSearch(e.target.value)}
                                  onKeyDown={async (e) => {
                                    if (e.key === 'Enter') {
                                      setPsOverrideLoading(true);
                                      try {
                                        const d: any = await apiRequest(`/api/admin/sih/ps-list?search=${encodeURIComponent(psOverrideSearch)}&limit=20`);
                                        setPsOverrideList(d.items);
                                      } finally { setPsOverrideLoading(false); }
                                    }
                                  }}
                                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#d4af37]/40"
                                />
                                <button
                                  onClick={async () => {
                                    setPsOverrideLoading(true);
                                    try {
                                      const d: any = await apiRequest(`/api/admin/sih/ps-list?search=${encodeURIComponent(psOverrideSearch)}&limit=20`);
                                      setPsOverrideList(d.items);
                                    } finally { setPsOverrideLoading(false); }
                                  }}
                                  className="px-3 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-xs font-bold hover:border-[#d4af37]/40 transition"
                                >
                                  Search
                                </button>
                              </div>
                              {psOverrideLoading && <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#d4af37]"></div></div>}
                              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                                {psOverrideList.map((ps: any) => (
                                  <div
                                    key={ps.id}
                                    onClick={() => setPsOverrideSelected(psOverrideSelected?.id === ps.id ? null : ps)}
                                    className="rounded-lg p-3 cursor-pointer transition"
                                    style={{
                                      border: `1px solid ${psOverrideSelected?.id === ps.id ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.05)'}`,
                                      background: psOverrideSelected?.id === ps.id ? 'rgba(20,16,0,0.7)' : 'rgba(10,10,10,0.4)',
                                    }}
                                  >
                                    <p className="text-[9px] font-black uppercase text-[#d4af37]">{ps.ps_number}</p>
                                    <p className="text-xs font-semibold text-white mt-0.5">{ps.title}</p>
                                  </div>
                                ))}
                                {psOverrideList.length === 0 && !psOverrideLoading && <p className="text-xs text-zinc-600 text-center py-4">Search for a PS to display results.</p>}
                              </div>
                              {psOverrideMsg && (
                                <p className={`text-xs font-semibold ${psOverrideMsg.startsWith('✅') ? 'text-emerald-400' : 'text-rose-400'}`}>{psOverrideMsg}</p>
                              )}
                              <div className="flex gap-3">
                                <button onClick={() => setPsOverrideTeamId(null)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider hover:text-white transition">Close</button>
                                <button
                                  disabled={!psOverrideSelected || psOverrideSubmitting}
                                  onClick={async () => {
                                    if (!psOverrideSelected || psOverrideTeamId === null) return;
                                    setPsOverrideSubmitting(true);
                                    setPsOverrideMsg(null);
                                    try {
                                      await apiRequest(`/api/admin/sih/teams/${psOverrideTeamId}/ps`, {
                                        method: 'PUT',
                                        body: JSON.stringify({ problem_statement_id: psOverrideSelected.id }),
                                      });
                                      setPsOverrideMsg(`✅ PS updated to ${psOverrideSelected.ps_number}`);
                                      // Refresh ps teams list
                                      const d: any = await apiRequest(`/api/admin/sih/teams-with-ps?ps_filter=${psFilter}&search=${encodeURIComponent(psTeamsSearch)}&page=${psTeamsPage}&limit=${PS_TEAMS_PAGE_SIZE}`);
                                      setPsTeams(d.items); setPsTeamsTotal(d.total);
                                      const a: any = await apiRequest('/api/admin/sih/ps-analytics');
                                      setPsAnalytics(a);
                                    } catch (err: any) {
                                      setPsOverrideMsg('❌ ' + (err.message || 'Failed to update PS.'));
                                    } finally {
                                      setPsOverrideSubmitting(false);
                                    }
                                  }}
                                  className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition disabled:opacity-40 flex items-center justify-center gap-2"
                                  style={{ background: 'linear-gradient(135deg,#d4af37,#8c7030)', color: '#000' }}
                                >
                                  {psOverrideSubmitting ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div> Saving...</> : '→ Override PS'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Teams Roster List */}
                      <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-5 space-y-4">
                        {/* Header with search */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <h4 className="text-sm font-bold text-white font-serif tracking-wide flex-shrink-0">
                            Registered Teams &amp; Rosters
                            <span className="ml-2 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                              ({sihTeams.filter((t: any) => {
                                const q = sihSearch.toLowerCase();
                                return !q || t.team_name?.toLowerCase().includes(q) || t.leader_name?.toLowerCase().includes(q);
                              }).length} {sihSearch ? 'found' : 'total'})
                            </span>
                          </h4>
                          <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Search by team or leader name…"
                              value={sihSearch}
                              onChange={(e) => { setSihSearch(e.target.value); setSihPage(1); }}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#d4af37]/50"
                            />
                            {sihSearch && (
                              <button
                                onClick={() => { setSihSearch(''); setSihPage(1); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {(() => {
                          const q = sihSearch.toLowerCase();
                          const filtered = sihTeams.filter((t: any) =>
                            !q || t.team_name?.toLowerCase().includes(q) || t.leader_name?.toLowerCase().includes(q)
                          );
                          const totalPages = Math.max(1, Math.ceil(filtered.length / SIH_PAGE_SIZE));
                          const paginated = filtered.slice((sihPage - 1) * SIH_PAGE_SIZE, sihPage * SIH_PAGE_SIZE);

                          if (filtered.length === 0) {
                            return (
                              <p className="text-zinc-500 text-center py-6 text-xs">
                                {sihSearch ? `No teams match "${sihSearch}".` : 'No teams registered yet.'}
                              </p>
                            );
                          }

                          return (
                            <>
                              <div className="space-y-4">
                                {paginated.map((team: any) => {
                                  const isExpanded = sihExpandedTeamId === team.id;
                                  const womanCount = team.members.filter((m: any) => m.gender === 'Woman').length;
                                  return (
                                    <div key={team.id} className="rounded-lg border border-zinc-900 bg-zinc-950 overflow-hidden text-[11px]">
                                      {/* Header */}
                                      <div
                                        onClick={() => setSihExpandedTeamId(isExpanded ? null : team.id)}
                                        className="flex items-center justify-between p-4 bg-zinc-900/30 hover:bg-zinc-900/50 cursor-pointer transition select-none"
                                      >
                                        <div className="space-y-1">
                                          <h5 className="text-sm font-extrabold text-white">{team.team_name}</h5>
                                          <p className="text-[10px] text-zinc-500">
                                            Leader: <span className="text-zinc-300 font-semibold">{team.leader_name}</span> &bull; 
                                            Registered: <span className="text-zinc-400 font-semibold">{new Date(team.created_at).toLocaleDateString()}</span>
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="px-2 py-0.5 rounded border border-emerald-900 bg-emerald-950/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
                                            {womanCount} Woman Member(s)
                                          </span>
                                          <span className="px-2.5 py-1 rounded bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] text-[10px] font-bold uppercase tracking-wide">
                                            {isExpanded ? 'Hide Roster' : 'View Roster'}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Expanded roster */}
                                      {isExpanded && (
                                        <div className="border-t border-zinc-900/60 p-4 bg-zinc-950/40">
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse text-xs">
                                              <thead>
                                                <tr className="border-b border-zinc-900 text-[9px] uppercase font-bold tracking-wider text-zinc-500">
                                                  <th className="py-2 px-3">Role</th>
                                                  <th className="py-2 px-3">Full Name</th>
                                                  <th className="py-2 px-3">Roll Number</th>
                                                  <th className="py-2 px-3">College Email</th>
                                                  <th className="py-2 px-3">Personal Email</th>
                                                  <th className="py-2 px-3">Phone</th>
                                                  <th className="py-2 px-3">Branch/Year</th>
                                                  <th className="py-2 px-3">Gender</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-zinc-900/40 text-zinc-300">
                                                {team.members.map((m: any, idx: number) => (
                                                  <tr key={idx} className="hover:bg-zinc-900/10">
                                                    <td className="py-2.5 px-3">
                                                      {m.is_leader ? (
                                                        <span className="px-1.5 py-0.5 rounded bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] text-[8px] font-bold uppercase">Leader</span>
                                                      ) : (
                                                        <span className="text-zinc-500 text-[9px] font-medium uppercase">Teammate {idx}</span>
                                                      )}
                                                    </td>
                                                    <td className="py-2.5 px-3 font-semibold text-white">{m.full_name}</td>
                                                    <td className="py-2.5 px-3 font-mono">{m.roll_number}</td>
                                                    <td className="py-2.5 px-3">{m.college_email}</td>
                                                    <td className="py-2.5 px-3">{m.personal_email}</td>
                                                    <td className="py-2.5 px-3">{m.phone_number}</td>
                                                    <td className="py-2.5 px-3">{m.branch} - Yr {m.study_year}</td>
                                                    <td className="py-2.5 px-3">
                                                      {m.gender === 'Woman' ? (
                                                        <span className="text-rose-400 font-medium">Woman</span>
                                                      ) : (
                                                        <span className="text-blue-400 font-medium">Man</span>
                                                      )}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900/60 mt-4">
                                            <button
                                              onClick={() => handleStartEditTeam(team)}
                                              className="px-4 py-2 rounded bg-zinc-900 border border-zinc-800 hover:border-[#d4af37]/65 text-white font-extrabold text-[10px] uppercase tracking-wider transition"
                                            >
                                              Edit Team
                                            </button>
                                            <button
                                              onClick={() => handleDeleteTeam(team.id, team.team_name)}
                                              className="px-4 py-2 rounded bg-red-950/20 border border-red-900/50 hover:border-red-600 text-red-300 hover:text-white font-extrabold text-[10px] uppercase tracking-wider transition"
                                            >
                                              Delete Team
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Pagination Controls */}
                              {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t border-zinc-900/60">
                                  <p className="text-[10px] text-zinc-500">
                                    Page <span className="text-white font-bold">{sihPage}</span> of <span className="text-white font-bold">{totalPages}</span>
                                    &nbsp;&bull;&nbsp;Showing {(sihPage - 1) * SIH_PAGE_SIZE + 1}–{Math.min(sihPage * SIH_PAGE_SIZE, filtered.length)} of {filtered.length}
                                  </p>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => setSihPage(1)}
                                      disabled={sihPage === 1}
                                      className="px-2 py-1 rounded text-[10px] font-bold border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      «
                                    </button>
                                    <button
                                      onClick={() => setSihPage(p => Math.max(1, p - 1))}
                                      disabled={sihPage === 1}
                                      className="px-2.5 py-1 rounded text-[10px] font-bold border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      ‹ Prev
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                      .filter(p => p === 1 || p === totalPages || Math.abs(p - sihPage) <= 1)
                                      .reduce((acc: (number | string)[], p, i, arr) => {
                                        if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
                                        acc.push(p);
                                        return acc;
                                      }, [])
                                      .map((item, i) =>
                                        item === '…' ? (
                                          <span key={`ellipsis-${i}`} className="px-1 text-zinc-600 text-[10px]">…</span>
                                        ) : (
                                          <button
                                            key={item}
                                            onClick={() => setSihPage(item as number)}
                                            className={`px-2.5 py-1 rounded text-[10px] font-bold border transition ${
                                              sihPage === item
                                                ? 'bg-[#d4af37] text-black border-[#d4af37]'
                                                : 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                                            }`}
                                          >
                                            {item}
                                          </button>
                                        )
                                      )}
                                    <button
                                      onClick={() => setSihPage(p => Math.min(totalPages, p + 1))}
                                      disabled={sihPage === totalPages}
                                      className="px-2.5 py-1 rounded text-[10px] font-bold border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      Next ›
                                    </button>
                                    <button
                                      onClick={() => setSihPage(totalPages)}
                                      disabled={sihPage === totalPages}
                                      className="px-2 py-1 rounded text-[10px] font-bold border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      »
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  );
                }

                const totalRegs = eventRegistrations?.students?.length || 0;
                const avgSolved = totalRegs > 0 
                  ? (eventRegistrations.students.reduce((acc: number, curr: any) => acc + (curr.problems_solved || 0), 0) / totalRegs).toFixed(1)
                  : 0;
                const avgStreak = totalRegs > 0
                  ? (eventRegistrations.students.reduce((acc: number, curr: any) => acc + (curr.streak_count || 0), 0) / totalRegs).toFixed(1)
                  : 0;
                const totalAttendanceLogs = eventRegistrations?.students?.reduce((acc: number, curr: any) => acc + (curr.attendance_count || 0), 0) || 0;

                const filteredRegs = getFilteredEventRegistrations();
                const totalFilteredCount = filteredRegs.length;
                const totalPages = Math.ceil(totalFilteredCount / eventItemsPerPage);
                const paginatedRegs = filteredRegs.slice((eventListPage - 1) * eventItemsPerPage, eventListPage * eventItemsPerPage);

                return (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 shadow-sm text-center">
                        <span className="block text-xl font-black text-white">{totalRegs}</span>
                        <span className="text-[9px] uppercase tracking-widest font-extrabold text-zinc-500 block mt-1">Registered Students</span>
                      </div>
                      
                      <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 shadow-sm text-center">
                        <span className="block text-xl font-black text-[#d4af37]">{avgSolved}</span>
                        <span className="text-[9px] uppercase tracking-widest font-extrabold text-zinc-500 block mt-1">Avg Problems Solved</span>
                      </div>

                      <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 shadow-sm text-center">
                        <span className="block text-xl font-black text-orange-400">{avgStreak} 🔥</span>
                        <span className="text-[9px] uppercase tracking-widest font-extrabold text-zinc-500 block mt-1">Avg Daily Streak</span>
                      </div>

                      <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 shadow-sm text-center">
                        <span className="block text-xl font-black text-blue-400">{totalAttendanceLogs}</span>
                        <span className="text-[9px] uppercase tracking-widest font-extrabold text-zinc-500 block mt-1">Total Attendance Checks</span>
                      </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl">
                      <div className="flex-grow flex flex-wrap items-center gap-3">
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-2 h-4 w-4 text-zinc-500 flex items-center" />
                          <input
                            type="text"
                            placeholder="Search name, email, roll number..."
                            value={eventSearchQuery}
                            onChange={(e) => { setEventSearchQuery(e.target.value); setEventListPage(1); }}
                            className="w-full bg-zinc-900 border border-zinc-900 rounded-lg pl-9 pr-3 py-1.5 text-white focus:border-[#d4af37] focus:outline-none"
                          />
                        </div>

                        <select
                          value={eventBranchFilter}
                          onChange={(e) => { setEventBranchFilter(e.target.value); setEventListPage(1); }}
                          className="bg-zinc-900 border border-zinc-900 rounded-lg px-3 py-1.5 text-white focus:border-[#d4af37] focus:outline-none"
                        >
                          <option value="">All Branches</option>
                          <option value="CSE">CSE</option>
                          <option value="CAI">CAI</option>
                          <option value="AIDS">AIDS</option>
                          <option value="Quantum">Quantum</option>
                          <option value="CCE">CCE</option>
                          <option value="ECE">ECE</option>
                        </select>

                        <select
                          value={eventYearFilter}
                          onChange={(e) => { setEventYearFilter(e.target.value); setEventListPage(1); }}
                          className="bg-zinc-900 border border-zinc-900 rounded-lg px-3 py-1.5 text-white focus:border-[#d4af37] focus:outline-none"
                        >
                          <option value="">All Years</option>
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                        </select>

                        <select
                          value={eventSortBy}
                          onChange={(e) => { setEventSortBy(e.target.value); setEventListPage(1); }}
                          className="bg-zinc-900 border border-zinc-900 rounded-lg px-3 py-1.5 text-white focus:border-[#d4af37] focus:outline-none"
                        >
                          <option value="solved">Sort: Solved count (Desc)</option>
                          <option value="streak">Sort: Streak count (Desc)</option>
                          <option value="attendance">Sort: Attendance logs (Desc)</option>
                          <option value="name">Sort: Student Name (A-Z)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 whitespace-nowrap">Show:</span>
                        <select
                          value={eventItemsPerPage}
                          onChange={(e) => { setEventItemsPerPage(parseInt(e.target.value, 10)); setEventListPage(1); }}
                          className="bg-zinc-900 border border-zinc-900 rounded-lg px-2 py-1.5 text-white focus:border-[#d4af37] focus:outline-none"
                        >
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>

                    {/* Roster Table */}
                    <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-6 shadow-xl backdrop-blur-sm">
                      {regsLoading ? (
                        <div className="text-center py-20">
                          <RefreshCw className="mx-auto h-8 w-8 text-[#d4af37] animate-spin" />
                          <p className="text-xs text-zinc-500 mt-2 font-medium">Fetching registrant details...</p>
                        </div>
                      ) : paginatedRegs.length === 0 ? (
                        <div className="text-center py-20 space-y-2">
                          <Users className="mx-auto h-12 w-12 text-zinc-700" />
                          <p className="text-zinc-500 font-medium">No matching registrations found.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-zinc-900 text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                                  <th className="py-3 px-4">Student Name</th>
                                  <th className="py-3 px-4">Roll Number</th>
                                  <th className="py-3 px-4">Email</th>
                                  <th className="py-3 px-4">Branch / Year</th>
                                  <th className="py-3 px-4 text-center">Problems Solved</th>
                                  <th className="py-3 px-4 text-center">Streak</th>
                                  <th className="py-3 px-4 text-center">Attendance logs</th>
                                  <th className="py-3 px-4 text-center">Event Attendance</th>
                                  <th className="py-3 px-4 text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-900/50 text-xs text-zinc-300">
                                {paginatedRegs.map((std: any) => (
                                  <tr key={std.student_id} className="hover:bg-zinc-900/20 transition-colors">
                                    <td className="py-3.5 px-4 font-semibold text-white">
                                      {std.full_name}
                                    </td>
                                    <td className="py-3.5 px-4 font-mono">
                                      {std.roll_number}
                                    </td>
                                    <td className="py-3.5 px-4">
                                      {std.college_email}
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      <span className="px-2.5 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 font-medium whitespace-nowrap">
                                        {std.branch} - Yr {std.year}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-center font-bold text-white">
                                      <div className="flex items-center justify-center gap-1.5 text-[#d4af37]">
                                        <Trophy className="h-3.5 w-3.5" />
                                        {std.problems_solved}
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-4 text-center font-bold text-orange-400">
                                      {std.streak_count > 0 ? `${std.streak_count} 🔥` : '-'}
                                    </td>
                                    <td className="py-3.5 px-4 text-center font-semibold text-blue-400">
                                      {std.attendance_count} logs
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                      {std.attended ? (
                                        <span className="px-2.5 py-0.5 rounded border border-emerald-950 bg-emerald-950/20 text-emerald-400 font-bold uppercase tracking-wider text-[9px]">Present</span>
                                      ) : (
                                        <span className="px-2.5 py-0.5 rounded border border-rose-950 bg-rose-950/20 text-rose-400 font-bold uppercase tracking-wider text-[9px]">Absent</span>
                                      )}
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                      <button
                                        onClick={() => handleStudentClick(std.student_id)}
                                        className="px-2.5 py-1 rounded border border-[#8c7030]/30 bg-zinc-900 hover:bg-[#8c7030]/20 text-[#d4af37] font-bold text-[9px] uppercase tracking-wider transition"
                                      >
                                        Inspect Profile
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Pagination Controls */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-zinc-900 pt-4 text-zinc-500 text-[10px]">
                              <span>
                                Showing {((eventListPage - 1) * eventItemsPerPage) + 1} to {Math.min(eventListPage * eventItemsPerPage, totalFilteredCount)} of {totalFilteredCount} registrations
                              </span>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  disabled={eventListPage === 1}
                                  onClick={() => setEventListPage(prev => Math.max(prev - 1, 1))}
                                  className="px-2.5 py-1 rounded border border-zinc-800 hover:bg-zinc-900 hover:text-white transition disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                  Prev
                                </button>
                                
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: totalPages }).map((_, pIdx) => {
                                    const pNum = pIdx + 1;
                                    const isCurrent = pNum === eventListPage;
                                    return (
                                      <button
                                        key={pNum}
                                        onClick={() => setEventListPage(pNum)}
                                        className={`h-6 w-6 rounded text-center transition ${isCurrent ? 'bg-[#d4af37] text-black font-extrabold' : 'border border-zinc-900 hover:bg-zinc-900'}`}
                                      >
                                        {pNum}
                                      </button>
                                    );
                                  })}
                                </div>

                                <button
                                  disabled={eventListPage === totalPages}
                                  onClick={() => setEventListPage(prev => Math.min(prev + 1, totalPages))}
                                  className="px-2.5 py-1 rounded border border-zinc-800 hover:bg-zinc-900 hover:text-white transition disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Events List (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-6 shadow-md glass-panel">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-4 border-b border-zinc-900 pb-3 flex items-center gap-1.5">
                    <Calendar className="h-4.5 w-4.5 text-[#d4af37]" />
                    Chakravyuha Events Manager
                  </h3>

                  {eventsLoading && events.length === 0 ? (
                    <div className="text-center py-10">
                      <RefreshCw className="mx-auto h-6 w-6 text-[#d4af37] animate-spin" />
                    </div>
                  ) : events.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                      No events registered. Create one using the form on the right.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {events.map((evt, idx) => (
                        <div 
                          key={idx}
                          className={`p-4 rounded-lg border transition-all cursor-pointer ${
                            selectedEventId === evt.id ? 'border-[#d4af37] bg-zinc-900/30' : 'border-zinc-900 bg-zinc-950/40 hover:border-zinc-800'
                          }`}
                          onClick={() => fetchEventRegistrations(evt.id)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-white tracking-wide">{evt.name}</h4>
                              <p className="text-[11px] text-zinc-400 font-light leading-relaxed">{evt.description}</p>
                            </div>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border flex-shrink-0 ${
                              evt.status === 'upcoming' ? 'bg-zinc-900 text-zinc-400 border-zinc-700/30' : 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20'
                            }`}>
                              {evt.status}
                            </span>
                          </div>

                          <div className="mt-4 pt-3 border-t border-zinc-900/60 flex items-center justify-between text-[10px] text-zinc-500" onClick={(e) => e.stopPropagation()}>
                            <span>Created on: {new Date(evt.created_at).toLocaleDateString()}</span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => fetchEventRegistrations(evt.id)}
                                className="text-[#d4af37] hover:underline font-bold uppercase tracking-wider text-[9px]"
                              >
                                View Registrations
                              </button>
                              <button
                                onClick={() => handleExportEventRegistrations(evt.id, evt.name)}
                                className="text-emerald-400 hover:underline font-bold uppercase tracking-wider text-[9px] flex items-center gap-0.5"
                              >
                                <Download className="h-3 w-3" /> Report Excel
                              </button>
                              {!evt.name.toUpperCase().includes('YUKTI') && (
                                <button
                                  onClick={() => handleDeleteEvent(evt.id, evt.name)}
                                  className="text-rose-500 hover:text-rose-400 transition-colors"
                                  title="Remove Event"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Create Event Form (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-6 shadow-md glass-panel">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-4 border-b border-zinc-900 pb-3 flex items-center gap-1.5">
                    <Plus className="h-4.5 w-4.5 text-[#d4af37]" />
                    Create New Event
                  </h3>

                  <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Event Name *</label>
                      <input
                        type="text"
                        required
                        value={newEvent.name}
                        onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                        placeholder="e.g. Prompt Engineering Challenge 2.0"
                        className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Event Description *</label>
                      <textarea
                        required
                        rows={4}
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        placeholder="Describe the format, timeline, and topics covered..."
                        className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Status</label>
                      <select
                        value={newEvent.status}
                        onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value })}
                        className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none"
                      >
                        <option value="active">Active (Ongoing)</option>
                        <option value="upcoming">Upcoming (Coming Soon)</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full rounded border border-[#d4af37] bg-[#d4af37] hover:bg-[#f6e05e] py-2 text-center text-black font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                      >
                        {actionLoading ? 'Creating...' : 'Create Event'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

            </div>
          )}
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

      {/* Edit SIH Team Modal (Super Admin only) */}
      {editSihTeamModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={(e) => { if (e.target === e.currentTarget) setEditSihTeamModalOpen(false); }}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden text-xs text-zinc-300"
            style={{
              background: 'linear-gradient(160deg, #0e0c00 0%, #060500 100%)',
              border: '1px solid rgba(212,175,55,0.25)',
              boxShadow: '0 0 80px rgba(212,175,55,0.08), 0 40px 100px rgba(0,0,0,0.9)',
            }}
          >
            <div className="h-[3px] w-full bg-gradient-to-r from-[#d4af37] via-[#8c7030] to-[#d4af37]" />
            <button
              onClick={() => setEditSihTeamModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition z-20"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-white font-serif tracking-wide flex items-center gap-2">
                  <span>🛠️</span> Edit SIH Team Details
                </h3>
                <p className="text-[10px] text-zinc-500">Super Admin Override Console</p>
              </div>

              {editSihError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-rose-950 bg-rose-950/20 p-3 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{editSihError}</span>
                </div>
              )}

              {editSihSuccess && (
                <div className="flex items-start gap-2.5 rounded-lg border border-emerald-950 bg-emerald-950/20 p-3 text-xs text-emerald-300">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{editSihSuccess}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Team Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Team Name</label>
                  <input
                    type="text"
                    value={editingSihTeamName}
                    onChange={(e) => setEditingSihTeamName(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-zinc-900 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#d4af37]/50"
                  />
                </div>

                {/* Member Selector Tabs */}
                <div className="flex flex-wrap gap-1.5 border-b border-zinc-900 pb-3">
                  <button
                    onClick={() => setEditSihActiveTab(0)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition text-[10px] uppercase ${
                      editSihActiveTab === 0 ? 'bg-[#d4af37] text-black' : 'bg-zinc-900/40 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Team Leader
                  </button>
                  {editingSihMembers.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setEditSihActiveTab(i + 1)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition text-[10px] uppercase ${
                        editSihActiveTab === i + 1 ? 'bg-[#d4af37] text-black' : 'bg-zinc-900/40 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Member {i + 1}
                    </button>
                  ))}
                </div>

                {/* Member Form Fields */}
                <div className="space-y-4 p-4 rounded-xl border border-zinc-900/60 bg-zinc-950/20">
                  <h4 className="text-[10px] font-bold text-[#d4af37] uppercase tracking-wider border-b border-zinc-900 pb-1.5">
                    {editSihActiveTab === 0 ? 'Section 1 – Team Leader Information' : `Section ${editSihActiveTab + 1} – Team Member ${editSihActiveTab} Information`}
                  </h4>

                  {(() => {
                    const isLeaderTab = editSihActiveTab === 0;
                    const data = isLeaderTab ? editingSihLeader : editingSihMembers[editSihActiveTab - 1];
                    
                    const handleChange = (field: string, val: any) => {
                      if (isLeaderTab) {
                        setEditingSihLeader((prev: any) => ({ ...prev, [field]: val }));
                      } else {
                        const updated = [...editingSihMembers];
                        updated[editSihActiveTab - 1] = { ...updated[editSihActiveTab - 1], [field]: val };
                        setEditingSihMembers(updated);
                      }
                    };

                    if (!data) return null;

                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-zinc-500 font-bold uppercase">Full Name</label>
                            <input
                              type="text"
                              value={data.full_name || ''}
                              onChange={(e) => handleChange('full_name', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-zinc-500 font-bold uppercase">Roll Number</label>
                            <input
                              type="text"
                              value={data.roll_number || ''}
                              onChange={(e) => handleChange('roll_number', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-zinc-500 font-bold uppercase">College Email</label>
                            <input
                              type="email"
                              value={data.college_email || ''}
                              onChange={(e) => handleChange('college_email', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-zinc-500 font-bold uppercase">Personal Email</label>
                            <input
                              type="email"
                              value={data.personal_email || ''}
                              onChange={(e) => handleChange('personal_email', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-zinc-500 font-bold uppercase">Phone Number</label>
                            <input
                              type="text"
                              value={data.phone_number || ''}
                              onChange={(e) => handleChange('phone_number', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-zinc-500 font-bold uppercase">Branch</label>
                            <select
                              value={data.branch || 'CSE'}
                              onChange={(e) => handleChange('branch', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                            >
                              <option value="CSE">CSE</option>
                              <option value="CSE-AI">CSE-AI</option>
                              <option value="AIDS">AIDS</option>
                              <option value="CCE">CCE</option>
                              <option value="ECE">ECE</option>
                              <option value="Quantum">Quantum</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-zinc-500 font-bold uppercase">Study Year</label>
                            <div className="flex gap-4 items-center h-8">
                              {[1, 2, 3, 4].map((yr) => (
                                <label key={yr} className="flex items-center gap-1.5 cursor-pointer text-zinc-400 hover:text-white select-none">
                                  <input
                                    type="radio"
                                    name={`edit-sih-yr-${editSihActiveTab}`}
                                    checked={data.study_year === yr}
                                    onChange={() => handleChange('study_year', yr)}
                                    className="h-3 w-3 text-[#d4af37] focus:ring-0 cursor-pointer"
                                  />
                                  <span>{yr}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-zinc-500 font-bold uppercase">Gender</label>
                            <div className="flex gap-4 items-center h-8">
                              {['Woman', 'Man'].map((gen) => (
                                <label key={gen} className="flex items-center gap-1.5 cursor-pointer text-zinc-400 hover:text-white select-none">
                                  <input
                                    type="radio"
                                    name={`edit-sih-gen-${editSihActiveTab}`}
                                    checked={data.gender === gen}
                                    onChange={() => handleChange('gender', gen)}
                                    className="h-3 w-3 text-[#d4af37] focus:ring-0 cursor-pointer"
                                  />
                                  <span>{gen === 'Woman' ? 'Woman' : 'Man'}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-900/60">
                <button
                  onClick={() => setEditSihTeamModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition border border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  disabled={editSihSubmitting}
                  onClick={async () => {
                    setEditSihError(null);
                    setEditSihSuccess(null);
                    setEditSihSubmitting(true);
                    try {
                      await apiRequest(`/api/admin/sih/teams/${editingSihTeamId}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                          team_name: editingSihTeamName,
                          leader: editingSihLeader,
                          members: editingSihMembers
                        })
                      });
                      setEditSihSuccess('Team details updated successfully!');
                      const [teamsData, analyticsData] = await Promise.all([
                        apiRequest('/api/admin/sih/teams'),
                        apiRequest('/api/admin/sih/analytics')
                      ]);
                      setSihTeams(teamsData || []);
                      setSihAnalytics(analyticsData || null);
                      setTimeout(() => setEditSihTeamModalOpen(false), 1500);
                    } catch (err: any) {
                      setEditSihError(err.message || 'Failed to update team details.');
                    } finally {
                      setEditSihSubmitting(false);
                    }
                  }}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition bg-[#d4af37] text-black hover:bg-[#f6e05e]"
                >
                  {editSihSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
