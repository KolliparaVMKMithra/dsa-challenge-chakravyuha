'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, Trophy, QrCode, ClipboardList, User, LogOut, ShieldAlert, Sun, Moon } from 'lucide-react';
import { getAuthToken, getUserType, getUserName, clearAuth } from '@/utils/api';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'light') {
        document.body.classList.add('light');
      } else {
        document.body.classList.remove('light');
      }
    } else {
      document.body.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      const token = getAuthToken();
      setIsLoggedIn(!!token);
      setUserType(getUserType());
      setUserName(getUserName());
    };

    checkAuth();
    
    window.addEventListener('auth-change', checkAuth);
    return () => {
      window.removeEventListener('auth-change', checkAuth);
    };
  }, [pathname]);

  const handleLogout = () => {
    clearAuth();
    setIsLoggedIn(false);
    setUserType(null);
    setUserName(null);
    setIsMobileMenuOpen(false);
    router.push('/');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Trophy, show: isLoggedIn && userType === 'student' },
    { href: '/dsa', label: 'DSA Sheet', icon: ClipboardList, show: isLoggedIn && userType === 'student' },
    { href: '/admin/scan', label: 'QR Scanner', icon: QrCode, show: isLoggedIn && userType === 'attendance_admin' },
    { href: '/admin/super', label: 'Super Admin', icon: ShieldAlert, show: isLoggedIn && userType === 'super_admin' },
  ];

  // Do not render header/nav bar if we are on admin pages and not logged in as the correct admin type
  if (pathname === '/admin/scan' && userType !== 'attendance_admin') {
    return null;
  }
  if (pathname === '/admin/super' && userType !== 'super_admin') {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#8c7030]/30 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo and Branding */}
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-[#d4af37]/60 bg-zinc-900">
            <img 
              src="/club_logo.jpg" 
              alt="Chakravyuha Logo" 
              className="h-full w-full object-cover"
              onError={(e) => {
                // Fallback icon placeholder if image fails to load
                e.currentTarget.src = 'https://api.placeholder.com/150';
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-md font-bold tracking-wider text-gold-gradient font-serif">CHAKRAVYUHA</span>
            <span className="text-[10px] tracking-widest text-[#c5a059] uppercase">Daily DSA Challenge</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.filter(link => link.show).map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#d4af37] ${
                  isActive ? 'text-[#d4af37] border-b-2 border-[#d4af37] pb-1 mt-1' : 'text-zinc-400'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle & Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-[#d4af37] transition-colors focus:outline-none"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-400 bg-zinc-900 border border-[#8c7030]/20 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <User className="h-3 w-3 text-[#d4af37]" />
                {userName || 'Warrior'}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-rose-400 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-sm font-medium text-zinc-400 hover:text-[#d4af37] transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded border border-[#d4af37] bg-gradient-to-r from-[#d4af37]/20 to-[#8c7030]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#d4af37] hover:bg-[#d4af37]/30 transition-all gold-border-glow"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-zinc-400 hover:text-[#d4af37] focus:outline-none"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#8c7030]/20 bg-zinc-950/95 px-4 py-4 space-y-3">
          {navLinks.filter(link => link.show).map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-[#d4af37]/10 text-[#d4af37]' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
          
          <div className="border-t border-zinc-900 pt-3 space-y-2">
            {/* Theme Toggle (Mobile) */}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs text-zinc-400 font-medium">Theme Mode</span>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 rounded bg-zinc-900 border border-[#8c7030]/20 px-3 py-1 text-xs text-zinc-300 hover:text-[#d4af37] transition-all"
              >
                {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-indigo-450" />}
                <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
            </div>

            {isLoggedIn ? (
              <div className="space-y-3">
                <div className="px-3 py-1.5 text-xs text-zinc-400">
                  Logged in as <span className="font-semibold text-white">{userName}</span> ({userType})
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-950/20"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 px-3">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-center text-sm font-medium text-zinc-400 hover:text-[#d4af37] py-2"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded border border-[#d4af37] bg-gradient-to-r from-[#d4af37]/20 to-[#8c7030]/10 px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-[#d4af37] hover:bg-[#d4af37]/30"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
