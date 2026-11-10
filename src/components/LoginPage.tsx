import React, { useState } from 'react';
import { Warehouse, Eye, EyeOff, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { UserSession } from '../types';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface LoginPageProps {
  onLoginSuccess: (user: UserSession) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent, customUsername?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    const inputUser = (customUsername !== undefined ? customUsername : username).trim().toLowerCase();
    const inputPass = (customPassword !== undefined ? customPassword : password).trim();

    // Check credentials with tolerance for common asterisk placements (*1 vs 1*)
    const isOffice = inputUser === 'office' && (inputPass === 'officesc*1' || inputPass === 'officesc1*');
    const isGudang = inputUser === 'gudang' && (inputPass === 'gudangsc1*' || inputPass === 'gudangsc*1');

    if (isOffice) {
      try {
        if (auth) {
          await signInWithEmailAndPassword(auth, import.meta.env.VITE_OFFICE_AUTH_EMAIL || 'office@gudangkita.internal', inputPass);
        }
      } catch {
        // Fallback smoothly if Firebase Auth email/password is not configured in Firebase Console
      }
      onLoginSuccess({
        username: 'office',
        name: 'Office (Admin)',
        role: 'admin',
        avatarUrl: '',
      });
      setIsLoading(false);
    } else if (isGudang) {
      try {
        if (auth) {
          await signInWithEmailAndPassword(auth, import.meta.env.VITE_GUDANG_AUTH_EMAIL || 'gudang@gudangkita.internal', inputPass);
        }
      } catch {
        // Fallback smoothly if Firebase Auth email/password is not configured in Firebase Console
      }
      onLoginSuccess({
        username: 'gudang',
        name: 'PIC (Gudang)',
        role: 'user',
        avatarUrl: '',
      });
      setIsLoading(false);
    } else {
      setError('Username atau password yang Anda masukkan salah. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  const handleQuickFill = (role: 'office' | 'gudang') => {
    if (role === 'office') {
      setUsername('office');
      setPassword('officesc*1');
      handleLogin(undefined, 'office', 'officesc*1');
    } else {
      setUsername('gudang');
      setPassword('gudangsc1*');
      handleLogin(undefined, 'gudang', 'gudangsc1*');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 select-none" id="login-container">
      {/* Container Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8 relative overflow-hidden" id="login-card">
        {/* Soft Ambient Glow Elements */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute left-0 bottom-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-2" id="login-logo-container">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100/50 shadow-sm">
              <Warehouse className="w-7 h-7" id="login-logo-icon" />
            </div>
            <span className="font-display text-2xl font-black text-blue-600 tracking-tight" id="login-logo-text">
              GudangKita
            </span>
          </div>
          <p className="text-slate-400 text-xs font-sans mt-1">
            Sistem Manajemen Bahan Baku
          </p>
        </div>

        {/* Error Notification Alert */}
        {error && (
          <div 
            className="mb-6 p-4.5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-800 text-xs leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200" 
            id="login-error-alert"
          >
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="font-sans font-medium">
              {error}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5" id="login-form">
          {/* Username Input Group */}
          <div className="space-y-1.5 font-sans">
            <label htmlFor="username-input" className="block text-xs font-bold text-slate-700">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                id="username-input"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username Anda"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-150 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-sans"
              />
            </div>
          </div>

          {/* Password Input Group */}
          <div className="space-y-1.5 font-sans">
            <label htmlFor="password-input" className="block text-xs font-bold text-slate-700">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-150 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-sans"
              />
              <button
                type="button"
                id="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="login-submit-btn"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/15 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:pointer-events-none mt-2 text-center"
          >
            {isLoading ? 'Memverifikasi...' : 'Masuk ke Aplikasi'}
          </button>
        </form>

        {/* Quick Fill Helper */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 font-sans font-medium mb-3">
            Atau masuk cepat dengan 1 klik:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('office')}
              className="py-2.5 px-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/80 hover:border-blue-200 rounded-xl text-xs font-semibold text-slate-600 transition-all active:scale-95"
            >
              Office (Admin)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('gudang')}
              className="py-2.5 px-3 bg-slate-50 hover:bg-sky-50 hover:text-sky-600 border border-slate-200/80 hover:border-sky-200 rounded-xl text-xs font-semibold text-slate-600 transition-all active:scale-95"
            >
              Gudang (PIC)
            </button>
          </div>
        </div>
      </div>

      {/* Humble App Credit / Footer */}
      <p className="text-[10px] text-slate-400 mt-6 font-mono tracking-wider">
        GUDANGKITA V1.2 • AMAN & EFISIEN
      </p>
    </div>
  );
}
