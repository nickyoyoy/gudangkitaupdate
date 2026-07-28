import React from 'react';
import { Warehouse, Bell, Menu, ArrowLeft, User, LogOut } from 'lucide-react';
import { UserSession } from '../types';

interface HeaderProps {
  activeTab: string;
  onBackToHome: () => void;
  onOpenProfile?: () => void;
  onOpenNotifications?: () => void;
  hasUnreadNotifications?: boolean;
  currentUser?: UserSession | null;
  onLogout?: () => void;
  cloudStatus?: 'connecting' | 'connected' | 'error';
}

export default function Header({ 
  activeTab, 
  onBackToHome, 
  onOpenProfile,
  onOpenNotifications,
  hasUnreadNotifications = true,
  currentUser = null,
  onLogout,
  cloudStatus,
}: HeaderProps) {
  // Determine left action and title depending on tab
  const isFormPage = activeTab === 'masuk' || activeTab === 'keluar';

  const renderLeftSection = () => {
    if (isFormPage) {
      return (
        <button
          onClick={onBackToHome}
          className="mr-3 text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors duration-200 focus:outline-none"
          id="btn-back"
          title="Back to Home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      );
    }

    if (activeTab === 'summary') {
      return (
        <button
          className="mr-3 text-blue-600 p-2 hover:bg-slate-100 rounded-full transition-transform active:scale-95 focus:outline-none"
          id="btn-menu"
          title="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      );
    }

    // Default icon for standard tabs
    return (
      <div className="flex items-center gap-1.5 text-blue-600 mr-2">
        <Warehouse className="w-6 h-6" />
      </div>
    );
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'home':
        return 'GudangKita';
      case 'masuk':
        return 'Input Barang Masuk';
      case 'keluar':
        return 'GudangKita'; // As per screenshot Keluar Barang header shows "GudangKita" but content shows "Keluar Barang"
      case 'preorder':
        return 'Daftar Pre Order';
      case 'stok':
        return 'GudangKita';
      case 'summary':
        return 'Ringkasan Pengeluaran';
      default:
        return 'GudangKita';
    }
  };

  const renderRightSection = () => {
    if (isFormPage) {
      return (
        <div className="ml-auto text-blue-600 focus:outline-none">
          <Warehouse className="w-6 h-6" />
        </div>
      );
    }

    const getUserInitial = () => {
      if (!currentUser) return 'GK';
      if (currentUser.username === 'office') return 'O';
      if (currentUser.username === 'gudang') return 'G';
      return currentUser.name.substring(0, 2).toUpperCase();
    };

    const userInitials = getUserInitial();

    return (
      <div className="ml-auto flex items-center gap-2" id="header-right-actions">
        <button
          onClick={onOpenNotifications}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors duration-200 focus:outline-none relative"
          id="btn-notify"
          title="Notifications & Active Chat"
        >
          <Bell className="w-5 h-5" />
          {hasUnreadNotifications && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          )}
        </button>
 
        {/* Profile Avatar / Indicator */}
        <button
          onClick={onOpenProfile}
          className="w-8 h-8 rounded-full overflow-hidden border border-slate-250 hover:opacity-90 transition-opacity focus:outline-none flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-xs font-sans animate-in fade-in duration-200"
          id="btn-profile"
          title={`Profil: ${currentUser?.name || 'User'}`}
        >
          {currentUser?.avatarUrl && currentUser.username !== 'office' && currentUser.username !== 'gudang' ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span>{userInitials}</span>
          )}
        </button>

        {/* Log Out Icon Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors duration-200 focus:outline-none"
            id="btn-logout"
            title="Keluar / Logout"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex items-center px-4 h-14 bg-white border-b border-slate-100 shadow-sm transition-colors duration-200">
      <div className="flex items-center">
        {renderLeftSection()}
        <div className="flex flex-col">
          <h1 className="font-display text-base font-bold text-blue-600 select-none leading-none">
            {getTitle()}
          </h1>
          {cloudStatus && (
            <div className="flex items-center gap-1 mt-1 select-none">
              <span className={`w-1.5 h-1.5 rounded-full ${
                cloudStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
                cloudStatus === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-rose-500'
              }`} />
              <span className="text-[8px] text-slate-400 font-bold font-mono uppercase tracking-wider">
                {cloudStatus === 'connected' ? 'Cloud Terkoneksi' :
                 cloudStatus === 'connecting' ? 'Menghubungkan...' : 'Cloud Terputus'}
              </span>
            </div>
          )}
        </div>
      </div>
      {renderRightSection()}
    </header>
  );
}
