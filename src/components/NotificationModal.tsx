import React from 'react';
import { 
  X, Bell, CheckCheck, CheckCircle2, 
  AlertTriangle, Info, ArrowUpRight, Trash2 
} from 'lucide-react';
import { SystemNotification } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
  onMarkAllAsRead: () => void;
  onNavigate: (tab: string) => void;
  onDeleteNotification: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onClearReadNotifications: () => void;
}

export default function NotificationModal({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onNavigate,
  onDeleteNotification,
  onMarkAsRead,
  onClearReadNotifications,
}: NotificationModalProps) {
  if (!isOpen) return null;

  const unreadAlerts = notifications.filter(n => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-screen flex flex-col shadow-2xl relative animate-in slide-in-from-right duration-300">
        
        {/* Header Drawer */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white text-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-100/80 rounded-full flex items-center justify-center text-blue-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-slate-800">Pemberitahuan</h2>
              <p className="text-[11px] text-slate-400 font-sans">Pantau peringatan dan status gudang</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
            title="Tutup Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Panels Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          <div className="space-y-3">
            {notifications.length > 0 && (
              <div className="flex flex-col gap-2 mb-2 px-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Daftar Notifikasi ({unreadAlerts} Baru)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {unreadAlerts > 0 && (
                    <button
                      onClick={onMarkAllAsRead}
                      className="text-[11px] text-blue-600 font-bold hover:text-blue-700 flex items-center gap-1 focus:outline-none bg-blue-50/50 hover:bg-blue-50 py-1.5 px-3 rounded-lg border border-blue-100/40 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Tandai Semua Terbaca
                    </button>
                  )}
                  {notifications.some(n => n.isRead) && (
                    <button
                      onClick={onClearReadNotifications}
                      className="text-[11px] text-rose-600 font-bold hover:text-rose-700 flex items-center gap-1 focus:outline-none bg-rose-50/50 hover:bg-rose-50 py-1.5 px-3 rounded-lg border border-rose-100/40 transition-colors ml-auto"
                      title="Hapus semua notifikasi yang sudah dibaca"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus Semua Terbaca
                    </button>
                  )}
                </div>
              </div>
            )}

            {notifications.length === 0 ? (
              <div className="text-center p-12 text-slate-400 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/80 mx-auto" />
                <div>
                  <p className="font-semibold text-slate-700">Semua Terkendali!</p>
                  <p className="text-xs">Belum ada peringatan stok atau pemberitahuan saat ini.</p>
                </div>
              </div>
            ) : (
              notifications.map((notif) => {
                const isWarning = notif.type === 'warning';
                const isSuccess = notif.type === 'success';

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.isRead) {
                        onMarkAsRead(notif.id);
                      }
                    }}
                    className={`p-4 bg-white rounded-xl border transition-all duration-200 relative overflow-hidden ${
                      notif.isRead 
                        ? 'border-slate-100 opacity-80 hover:opacity-100' 
                        : 'border-blue-100 shadow-sm hover:border-blue-300 cursor-pointer'
                    }`}
                  >
                    {!notif.isRead && (
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                    )}

                    <div className="flex gap-3">
                      <div className={`p-2 rounded-full shrink-0 h-9 w-9 flex items-center justify-center ${
                        isWarning ? 'bg-amber-50 text-amber-600' : isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {isWarning ? (
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                        ) : isSuccess ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 shrink-0" />
                        )}
                      </div>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex justify-between items-start">
                          <span className="font-display text-xs font-bold text-slate-800 leading-tight block">
                            {notif.title}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                            <span className="font-mono text-[9px] text-slate-400 font-medium">
                              {notif.time}
                            </span>
                            
                            {notif.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteNotification(notif.id);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:outline-none"
                                title="Hapus Pemberitahuan Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-xs text-slate-500 leading-normal">{notif.message}</p>
                        
                        {notif.linkToTab && (
                          <button
                            onClick={() => {
                              onNavigate(notif.linkToTab!);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 font-bold text-[10px] uppercase tracking-wider py-1 px-2.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors focus:outline-none"
                          >
                            <span>Buka Menu</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
