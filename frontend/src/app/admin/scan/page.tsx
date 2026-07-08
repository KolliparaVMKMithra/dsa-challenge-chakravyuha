'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, ClipboardCheck, Users, Calendar, AlertCircle, Play, Square, RefreshCw, CheckCircle, XCircle, FileSpreadsheet, Lock, User } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { apiRequest, getAuthToken, getUserType, clearAuth, setAuthToken } from '@/utils/api';

interface AttendanceRecord {
  name: string;
  roll_number: string;
  branch: string;
  year: number;
  timestamp: string;
  marked_by: string;
}

export default function QrScannerPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Inline Login states
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    name?: string;
    roll_number?: string;
    branch?: string;
    year?: number;
    time?: string;
    message?: string;
  } | null>(null);
  
  // Attendance records state
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Date range filters for Excel export
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  const [session, setSession] = useState<'forenoon' | 'afternoon'>('forenoon');
  const sessionRef = useRef<'forenoon' | 'afternoon'>('forenoon');

  const handleSessionChange = (newSession: 'forenoon' | 'afternoon') => {
    setSession(newSession);
    sessionRef.current = newSession;
    fetchTodayAttendance(newSession);
  };

  // Helper to play synthesized beep sounds using browser AudioContext API
  const playBeep = (type: 'success' | 'error') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch A5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime); // Low pitch A3 buzz
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn('AudioContext failed:', e);
    }
  };

  const checkAdminAuth = async () => {
    const token = getAuthToken();
    const type = getUserType();
    
    if (!token || type !== 'attendance_admin') {
      setIsAdmin(false);
      setShowLoginPrompt(true);
      setLoading(false);
      return;
    }
    
    setIsAdmin(true);
    setShowLoginPrompt(false);
    setLoading(false);
    fetchTodayAttendance();
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

      if (data.user_type !== 'attendance_admin') {
        throw new Error('Access forbidden: Only Scan Admins can access this page.');
      }

      setAuthToken(data.access_token, data.user_type, data.name);
      setIsAdmin(true);
      setShowLoginPrompt(false);
      fetchTodayAttendance();
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchTodayAttendance = async (sessionVal = sessionRef.current) => {
    setRecordsLoading(true);
    try {
      const data = await apiRequest(`/api/admin/attendance/today?session=${sessionVal}`);
      setAttendanceRecords(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    checkAdminAuth();
    
    // Automatically poll attendance list every 3 seconds to keep multiple scanners synced
    const syncInterval = setInterval(() => {
      const token = getAuthToken();
      const type = getUserType();
      if (token && (type === 'attendance_admin' || type === 'super_admin')) {
        fetchTodayAttendance(sessionRef.current);
      }
    }, 3000);

    return () => {
      stopScanning();
      clearInterval(syncInterval);
    };
  }, []);

  const startScanning = async () => {
    setError(null);
    setScanResult(null);
    setIsScanning(true);
    
    // Wait briefly for DOM node to mount
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('scanner-container');
        qrScannerRef.current = scanner;
        
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          onScanSuccess,
          onScanFailure
        );
      } catch (err: any) {
        console.error(err);
        setError('Failed to access webcam camera. Make sure permissions are granted.');
        setIsScanning(false);
      }
    }, 300);
  };

  const stopScanning = async () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      try {
        await qrScannerRef.current.stop();
      } catch (err) {
        console.error('Failed to stop scanning', err);
      }
    }
    setIsScanning(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    // Pause scanning immediately on scan success to prevent multiple rapid scans
    stopScanning();
    
    try {
      const result = await apiRequest('/api/admin/scan', {
        method: 'POST',
        body: JSON.stringify({ qr_key: decodedText, session: sessionRef.current })
      });
      
      playBeep('success');
      setScanResult({
        success: true,
        name: result.student_name,
        roll_number: result.roll_number,
        branch: result.branch,
        year: result.year,
        time: `${result.time} (${result.session})`
      });
      
      // Reload today's attendance logs
      fetchTodayAttendance(sessionRef.current);
    } catch (err: any) {
      playBeep('error');
      setScanResult({
        success: false,
        message: err.message || 'Verification failed.'
      });
    }
  };

  const onScanFailure = (error: any) => {
    // This fires continuously while search happens, usually okay to ignore logs
  };

  const handleExportExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    setExportLoading(true);
    try {
      let url = '/api/admin/attendance/export';
      const params = [];
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const blob = await apiRequest(url);
      const dlUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = dlUrl;
      link.download = `attendance_report_${startDate || 'all'}_to_${endDate || 'all'}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(dlUrl);
    } catch (err: any) {
      alert(err.message || 'Failed to export attendance.');
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-10 w-10 text-[#d4af37] animate-spin" />
          <span className="text-sm text-zinc-400 font-semibold tracking-wider uppercase">Verifying Credentials...</span>
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
              ATTENDANCE SCANNER
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#c5a059]">
              Authentication Required
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
                  Email / Roll Number
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
                    placeholder="attendance_admin@chakravyuha.edu"
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
                  {loginLoading ? 'Authenticating...' : 'Unlock Scanner'}
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
      
      {/* Title Widget */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#8c7030]/20 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-serif flex items-center gap-2">
            <QrCode className="h-6 w-6 text-[#d4af37]" />
            Attendance Marker Scanner
          </h1>
          <p className="text-xs text-zinc-500">
            Webcam-based real-time credential scanner for marking daily attendance. Fast and simple.
          </p>
        </div>

        {/* Session Selector (Forenoon / Afternoon) */}
        <div className="flex bg-zinc-900/80 rounded-md border border-[#8c7030]/20 p-1">
          <button
            onClick={() => handleSessionChange('forenoon')}
            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all focus:outline-none ${
              session === 'forenoon'
                ? 'bg-[#d4af37] text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Forenoon (FN)
          </button>
          <button
            onClick={() => handleSessionChange('afternoon')}
            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all focus:outline-none ${
              session === 'afternoon'
                ? 'bg-[#d4af37] text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Afternoon (AN)
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: QR Code webcam scanner container (L: 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-6 shadow-md glass-panel flex flex-col items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-5 border-b border-zinc-900 pb-3 w-full text-center flex items-center justify-center gap-2">
              <ClipboardCheck className="h-4.5 w-4.5 text-[#d4af37]" />
              Battlefield Scanner
            </h3>
            
            {/* Webcam Window Panel */}
            <div className="relative w-full aspect-square max-w-[320px] rounded-lg border-2 border-dashed border-zinc-800 bg-black flex items-center justify-center overflow-hidden mb-6">
              
              {isScanning ? (
                <div id="scanner-container" className="w-full h-full object-cover"></div>
              ) : (
                <div className="text-center p-6 space-y-3">
                  <QrCode className="mx-auto h-16 w-16 text-zinc-700" />
                  <p className="text-xs text-zinc-500">Webcam scanning is currently offline.</p>
                </div>
              )}
              
              {/* Scan target guidelines overlays */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[200px] h-[200px] border-2 border-[#d4af37] border-dashed rounded opacity-40 animate-pulse"></div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="w-full space-y-4">
              {isScanning ? (
                <button
                  onClick={stopScanning}
                  className="flex w-full items-center justify-center gap-2 rounded border border-rose-500 bg-rose-500/10 hover:bg-rose-500/20 py-3 text-xs font-bold uppercase tracking-wider text-rose-500 transition-colors"
                >
                  <Square className="h-4 w-4" />
                  Stop Scanner
                </button>
              ) : (
                <button
                  onClick={startScanning}
                  className="flex w-full items-center justify-center gap-2 rounded border border-[#d4af37] bg-[#d4af37]/10 hover:bg-[#d4af37]/20 py-3 text-xs font-bold uppercase tracking-wider text-[#d4af37] transition-all gold-border-glow"
                >
                  <Play className="h-4 w-4 fill-[#d4af37]" />
                  Launch Scanner
                </button>
              )}
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2.5 rounded-md border border-rose-950 bg-rose-950/20 p-3 text-xs text-rose-300 w-full">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Real-time Scan Result Panel */}
          {scanResult && (
            <div className={`rounded-lg border p-5 shadow-md glass-panel text-center ${
              scanResult.success 
                ? 'border-emerald-500/30 bg-emerald-950/5' 
                : 'border-rose-500/30 bg-rose-950/5'
            }`}>
              {scanResult.success ? (
                <div className="space-y-3">
                  <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Attendance Marked</h3>
                  
                  <div className="bg-zinc-900/60 p-3.5 rounded border border-zinc-900/80 text-left text-xs space-y-2">
                    <p className="text-zinc-400">Warrior: <span className="font-semibold text-white">{scanResult.name || scanResult.student_name}</span></p>
                    <p className="text-zinc-400">Roll No: <span className="font-semibold text-white">{scanResult.roll_number}</span></p>
                    <p className="text-zinc-400">Branch/Year: <span className="font-semibold text-white">{scanResult.branch} - Year {scanResult.year}</span></p>
                    <p className="text-zinc-400">Marked At: <span className="font-semibold text-white">{scanResult.time}</span></p>
                  </div>
                  
                  <button 
                    onClick={startScanning} 
                    className="inline-flex items-center gap-1.5 text-xs text-[#d4af37] font-semibold hover:underline mt-2"
                  >
                    Scan Next Warrior &rarr;
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <XCircle className="mx-auto h-12 w-12 text-rose-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Scan Blocked</h3>
                  <p className="text-xs text-rose-300 max-w-sm mx-auto">{scanResult.message}</p>
                  
                  <button 
                    onClick={startScanning} 
                    className="inline-flex items-center gap-1.5 text-xs text-[#d4af37] font-semibold hover:underline mt-2"
                  >
                    Try Scan Again &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column: Today's Log & Excel Exporter (R: 7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Styled Excel Report Exporter */}
          <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-5 shadow-md glass-panel">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] mb-4 border-b border-zinc-900 pb-3 flex items-center gap-2">
              <FileSpreadsheet className="h-4.5 w-4.5 text-[#d4af37]" />
              Export Attendance Reports
            </h3>
            
            <form onSubmit={handleExportExcel} className="flex flex-col sm:flex-row items-end gap-4">
              <div className="w-full">
                <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-[#d4af37] focus:outline-none"
                />
              </div>
              <div className="w-full">
                <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full rounded border border-zinc-900 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-[#d4af37] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={exportLoading}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded border border-[#d4af37] bg-[#d4af37] hover:bg-[#f6e05e] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition-colors disabled:opacity-50"
              >
                {exportLoading ? 'Exporting...' : 'Export Excel'}
              </button>
            </form>
          </div>

          {/* Today's Check-ins Roster */}
          <div className="rounded-lg border border-[#8c7030]/20 bg-zinc-950/80 p-5 shadow-md glass-panel">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-[#d4af37]" />
                Today's Attendance Roster
              </h3>
              <button 
                onClick={fetchTodayAttendance}
                disabled={recordsLoading}
                className="text-zinc-500 hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 ${recordsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {recordsLoading && attendanceRecords.length === 0 ? (
              <div className="text-center py-10">
                <RefreshCw className="mx-auto h-6 w-6 text-[#d4af37] animate-spin" />
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="text-center py-12 text-xs text-zinc-500">
                No scans recorded today. Launch camera above and start scanning credentials!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Roll Number</th>
                      <th className="py-2.5 px-3">Warrior</th>
                      <th className="py-2.5 px-3">Branch/Year</th>
                      <th className="py-2.5 px-3">Scanned By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
                    {attendanceRecords.map((rec, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/10">
                        <td className="py-3 px-3 font-semibold text-emerald-400">
                          {new Date(rec.timestamp).toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                        </td>
                        <td className="py-3 px-3 font-semibold">{rec.roll_number}</td>
                        <td className="py-3 px-3 text-white">{rec.name || rec.full_name}</td>
                        <td className="py-3 px-3">{rec.branch} - Yr {rec.year}</td>
                        <td className="py-3 px-3 text-zinc-500">{rec.marked_by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
