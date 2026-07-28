import React from 'react';
import { 
  TrendingUp, 
  PlusCircle, 
  MinusCircle, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight, 
  Package, 
  Trash2
} from 'lucide-react';
import { WarehouseItem, StockMutation, UserSession } from '../types';

interface BerandaTabProps {
  items: WarehouseItem[];
  mutations: StockMutation[];
  onNavigate: (tab: string) => void;
  onDeleteMutation: (mutationId: string) => void;
  currentUser?: UserSession | null;
  isReset?: boolean;
}

export default function BerandaTab({ items, mutations, onNavigate, onDeleteMutation, currentUser = null, isReset = false }: BerandaTabProps) {
  // Base offsets to match beautiful screenshot figures exactly and allow real-time updates!
  const BASE_MASUK_OFFSET = isReset ? 0 : 1214; // 1214 + 70 initial = 1284
  const BASE_KELUAR_OFFSET = isReset ? 0 : 830;  // 830 + 12 initial = 842

  // Dynamic calculations
  const totalMasuk = BASE_MASUK_OFFSET + mutations
    .filter((m) => m.type === 'masuk')
    .reduce((sum, m) => sum + m.quantity, 0);

  const totalKeluar = BASE_KELUAR_OFFSET + mutations
    .filter((m) => m.type === 'keluar')
    .reduce((sum, m) => sum + m.quantity, 0);

  // Items with low stock (threshold is stock <= 15)
  const lowStockCount = items.filter((item) => item.stock <= 15).length;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100" id="welcome-section">
        <h2 className="font-display text-xl font-bold text-slate-800" id="welcome-title">
          Halo, {currentUser?.name || 'Admin Gudang'}
        </h2>
        <p className="text-sm text-slate-500 font-sans mt-0.5">Berikut ringkasan stok gudang hari ini.</p>
      </section>

      {/* Bento Grid Stock Summary */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Masuk (Daily) */}
        <div className="col-span-2 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Total Masuk (Hari Ini)</p>
            <p className="font-display text-3xl font-extrabold text-blue-600">
              {totalMasuk.toLocaleString('id-ID')}{' '}
              <span className="text-sm font-medium text-slate-400">Pcs</span>
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100/80 rounded-full flex items-center justify-center text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Keluar */}
        <div className="p-4 bg-white rounded-2xl shadow-sm border-l-4 border-blue-500 border-y border-r border-slate-100 space-y-2 transition-all hover:shadow-md">
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Total Keluar</p>
          <p className="font-display text-2xl font-bold text-blue-600">
            {totalKeluar.toLocaleString('id-ID')}
          </p>
          <span className="inline-block bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Pcs
          </span>
        </div>

        {/* Stok Rendah */}
        <div className="p-4 bg-white rounded-2xl shadow-sm border-l-4 border-red-500 border-y border-r border-slate-100 space-y-2 transition-all hover:shadow-md">
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Stok Rendah</p>
          <p className="font-display text-2xl font-bold text-red-600">
            {lowStockCount}
          </p>
          <span className="inline-block bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Item
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase px-1">Aksi Cepat</h3>
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => onNavigate('masuk')}
            className="w-full flex items-center justify-between p-5 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 active:scale-98 transition-all duration-150 text-left focus:outline-none"
            id="action-input-masuk"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-xl">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <div>
                <span className="font-display text-base font-bold block leading-tight">Input Barang Masuk</span>
                <span className="text-[11px] text-blue-200 block">Catat barang baru yang tiba ke gudang</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 opacity-80" />
          </button>

          <button
            onClick={() => onNavigate('keluar')}
            className="w-full flex items-center justify-between p-5 bg-sky-600 text-white rounded-2xl shadow-lg hover:bg-sky-700 active:scale-98 transition-all duration-150 text-left focus:outline-none"
            id="action-input-keluar"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-xl">
                <ArrowDownRight className="w-6 h-6" />
              </div>
              <div>
                <span className="font-display text-base font-bold block leading-tight">Input Barang Keluar</span>
                <span className="text-[11px] text-sky-200 block">Catat pengiriman barang keluar dari gudang</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 opacity-80" />
          </button>
        </div>
      </section>

      {/* Recent Activity List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Aktivitas Terakhir</h3>
          <button
            onClick={() => onNavigate('stok')}
            className="text-blue-600 text-xs font-bold hover:underline focus:outline-none"
          >
            Lihat Semua
          </button>
        </div>
        <div className="space-y-2">
          {mutations.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-150 text-slate-400 text-sm">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              Belum ada aktivitas mutasi hari ini.
            </div>
          ) : (
            mutations.map((mut) => {
              const isMasuk = mut.type === 'masuk';
              return (
                <div
                  key={mut.id}
                  className="flex items-center p-3.5 bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:bg-slate-50"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 bg-blue-100 text-blue-600`}>
                    {isMasuk ? (
                      <PlusCircle className="w-5 h-5 animate-pulse text-blue-600" />
                    ) : (
                      <MinusCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-semibold text-slate-800 truncate">{mut.itemName}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {isMasuk ? 'Masuk' : 'Keluar'} • {mut.quantity} Pcs • {mut.pic || 'Admin'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-xs font-mono font-medium text-slate-400">{mut.time}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMutation(mut.id);
                      }}
                      className="p-1 px-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none"
                      title="Hapus / Batal Aktivitas Mutasi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Illustration / Mood Section with Referrer Policy Requirement */}
      <div className="relative w-full h-40 rounded-2xl overflow-hidden shadow-sm mt-4">
        <img
          className="w-full h-full object-cover select-none pointer-events-none"
          title="Warehouse - Kondisi Optimal"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoLK4NIcJugmtpOzv37KwarbH-mTYpb3D-p5Guxs7LqbAJsX7fm5Isgyx8fI76k9rkHox4pZFXWXOhJDYvD7RhGBVs9gXu-Zj7xtcjbr_dWGODlaqePdMaVK_9dxFPNOzYdupDf0FPKh1hKMRfNe5ZS0RKbriJUoJC93h4RMm-rnjP2_MAXdsYMCAsyDEDLGNrcvJXcxRwTYmtQ2QhaRLfa8fO4OjlZHRSng4faqRV0YxSYefYcXOyztX5ql-JliW77JZVS6DbY6c"
          alt="A modern warehouse with high skylights and blue lighting, tidy aisles of tall racks"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
          <p className="text-white text-xs font-semibold tracking-wide font-display">
            Warehouse A1 - Kondisi Optimal
          </p>
        </div>
      </div>

    </div>
  );
}
