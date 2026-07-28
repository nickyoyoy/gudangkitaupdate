import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

function AppWithCatch() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleErr = (e: ErrorEvent) => {
      console.error('Global error caught:', e);
      setError(e.message || 'Error occurred');
    };
    window.addEventListener('error', handleErr);
    return () => window.removeEventListener('error', handleErr);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-800 font-sans">
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100 font-bold text-xl">
            ⚠️
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Terjadi Kesalahan Aplikasi</h2>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Aplikasi mengalami kendala. Silakan muat ulang halaman.
          </p>
          <div className="bg-slate-100 p-3 rounded-xl text-left text-[11px] font-mono text-slate-700 mb-5 overflow-auto max-h-32">
            {error}
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20"
          >
            Muat Ulang Aplikasi
          </button>
        </div>
      </div>
    );
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithCatch />
  </StrictMode>
);
