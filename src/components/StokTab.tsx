import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  Navigation, 
  QrCode, 
  X, 
  Plus, 
  Minus, 
  Edit, 
  Check, 
  TrendingUp, 
  Clock, 
  HelpCircle,
  ClipboardCheck,
  Layers,
  Cloud,
  Save,
  RotateCcw
} from 'lucide-react';
import { WarehouseItem, StockMutation } from '../types';
import StockOpnameModal from './StockOpnameModal';

interface StokTabProps {
  items: WarehouseItem[];
  mutations: StockMutation[];
  onUpdateItemStock: (itemId: string, newStock: number) => void;
  onUpdateItemRack: (itemId: string, newRack: string) => void;
  onStockOpname?: (itemId: string, actualStock: number, pic: string, notes: string) => void;
  onUpdateItemTargetRate?: (itemId: string, newRate: number | null) => void;
}

export default function StokTab({ 
  items, 
  mutations, 
  onUpdateItemStock, 
  onUpdateItemRack,
  onStockOpname,
  onUpdateItemTargetRate
}: StokTabProps) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'Semua' | 'Kritis' | 'Rendah' | 'Aman'>('Semua');

  // Simulation rates for each item code: {[itemId]: ratePerDay}
  const [simulatedRates, setSimulatedRates] = useState<Record<string, number>>({});
  const [justSavedItemId, setJustSavedItemId] = useState<string | null>(null);

  // Scanner modal state
  const [showScanner, setShowScanner] = useState(false);
  const [selectedScanItemId, setSelectedScanItemId] = useState('');
  const [scanQtyChange, setScanQtyChange] = useState(1);

  // Stock Opname modal state
  const [showOpnameModal, setShowOpnameModal] = useState(false);
  const [opnameItemId, setOpnameItemId] = useState<string | null>(null);

  // Edit rack modal or inline state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempRack, setTempRack] = useState('');

  const handleSaveTargetRate = (itemId: string, rate: number) => {
    if (onUpdateItemTargetRate) {
      onUpdateItemTargetRate(itemId, rate);
      setJustSavedItemId(itemId);
      setTimeout(() => {
        setJustSavedItemId(null);
      }, 2500);
      setSimulatedRates((prev) => {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      });
    }
  };

  const handleResetToAuto = (itemId: string) => {
    if (onUpdateItemTargetRate) {
      onUpdateItemTargetRate(itemId, null);
      setSimulatedRates((prev) => {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      });
    }
  };

  // Proyeksi & Estimasi Health & Status Calculator per item
  const getItemStockHealth = (itm: WarehouseItem) => {
    // Calculate actual historical daily consumption rate for this specific item
    const itemKeluarMutations = mutations.filter(m => m.itemId === itm.id && m.type === 'keluar');
    const totalOutgoing = itemKeluarMutations.reduce((sum, m) => sum + m.quantity, 0);
    const uniqueDates = Array.from(new Set(itemKeluarMutations.map(m => m.date)));
    const activeDaysCount = uniqueDates.length;
    const historicalAvg = activeDaysCount > 0 ? (totalOutgoing / activeDaysCount) : 0;

    // Check if item has a custom target daily rate saved in Firebase
    const hasCustomTarget = itm.targetDailyRate !== undefined && itm.targetDailyRate !== null;

    // Default rate: if targetDailyRate is set, use it; else if historicalAvg > 0, round(historicalAvg); else 0
    const defaultRate = hasCustomTarget 
      ? itm.targetDailyRate! 
      : (historicalAvg > 0 ? Math.round(historicalAvg) : 0);

    // Read current rate (either temporary in simulatedRates or the defaultRate)
    const currentRate = simulatedRates[itm.id] !== undefined
      ? simulatedRates[itm.id]
      : defaultRate;

    // Is the currently displayed rate different from what is saved in Firestore?
    const isRateModified = hasCustomTarget 
      ? currentRate !== itm.targetDailyRate
      : (historicalAvg > 0 ? currentRate !== Math.round(historicalAvg) : currentRate > 0);

    // If physical stock is 0 or less, immediately marked as 'Kritis'
    if (itm.stock <= 0) {
      return {
        status: 'Kritis' as const,
        estDays: 0,
        currentRate,
        historicalAvg,
        totalOutgoing,
        activeDaysCount,
        hasCustomTarget,
        isRateModified,
      };
    }

    // Days of stock remaining based on consumption rate
    const estDays = currentRate > 0 ? Math.ceil(itm.stock / currentRate) : null;

    let status: 'Kritis' | 'Rendah' | 'Aman' = 'Aman';
    if (estDays !== null) {
      if (estDays <= 3) {
        status = 'Kritis'; // 1 - 3 hari (atau <= 3 hari)
      } else if (estDays <= 7) {
        status = 'Rendah'; // 4 - 7 hari
      } else {
        status = 'Aman';   // > 7 hari
      }
    } else {
      // Jika laju pakai 0 (belum ada histori keluar & simulasi 0), stok aman selama fisik > 0
      status = 'Aman';
    }

    return {
      status,
      estDays,
      currentRate,
      historicalAvg,
      totalOutgoing,
      activeDaysCount,
      hasCustomTarget,
      isRateModified,
    };
  };

  // Map items with their calculated stock projection health
  const itemsWithHealth = items.map((itm) => ({
    item: itm,
    health: getItemStockHealth(itm),
  }));

  const kritisCount = itemsWithHealth.filter((x) => x.health.status === 'Kritis').length;
  const rendahCount = itemsWithHealth.filter((x) => x.health.status === 'Rendah').length;
  const amanCount = itemsWithHealth.filter((x) => x.health.status === 'Aman').length;

  const filteredItemsWithHealth = itemsWithHealth.filter(({ item: itm, health }) => {
    const matchesSearch = itm.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'Semua' || health.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // Calculate dynamic summary stats
  const totalBarangQty = items.reduce((sum, itm) => sum + itm.stock, 0);
  const perluRestockCount = kritisCount + rendahCount;

  const handleEditRackStart = (itm: WarehouseItem) => {
    setEditingItemId(itm.id);
    setTempRack(itm.rack);
  };

  const handleSaveRack = (itemId: string) => {
    onUpdateItemRack(itemId, tempRack);
    setEditingItemId(null);
  };

  const handleOpenOpname = (itemId?: string) => {
    setOpnameItemId(itemId || null);
    setShowOpnameModal(true);
  };

  const handleSaveOpname = (itemId: string, actualStock: number, pic: string, notes: string) => {
    if (onStockOpname) {
      onStockOpname(itemId, actualStock, pic, notes);
    } else {
      onUpdateItemStock(itemId, actualStock);
    }
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScanItemId) return;

    const targetItem = items.find((itm) => itm.id === selectedScanItemId);
    if (!targetItem) return;

    const newStock = targetItem.stock + scanQtyChange;
    onUpdateItemStock(selectedScanItemId, newStock);

    setShowScanner(false);
    setSelectedScanItemId('');
    alert(`Sukses memindai barcode! Stok ${targetItem.name} bertambah ${scanQtyChange} Pcs.`);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Selection Section */}
      <section className="mb-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5 opacity-75" />
          </div>
          <input
            className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            placeholder="Cari nama barang..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Categories / Stock status pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5 select-none" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setActiveFilter('Semua')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold whitespace-nowrap rounded-full transition-all focus:outline-none shadow-xs ${
              activeFilter === 'Semua'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Semua ({items.length})</span>
          </button>

          {[
            { 
              id: 'Kritis', 
              label: 'Kritis', 
              count: kritisCount,
              badgeClass: 'bg-red-50 text-red-700 border-red-200', 
              tag: '1-3 Hari' 
            },
            { 
              id: 'Rendah', 
              label: 'Rendah', 
              count: rendahCount,
              badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', 
              tag: '4-7 Hari' 
            },
            { 
              id: 'Aman', 
              label: 'Aman', 
              count: amanCount,
              badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
              tag: '>7 Hari' 
            },
          ].map((flt) => {
            const isActive = activeFilter === flt.id;
            return (
              <button
                key={flt.id}
                onClick={() => setActiveFilter(flt.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold whitespace-nowrap rounded-full transition-all focus:outline-none shadow-xs ${
                  isActive
                    ? 'bg-slate-900 text-white ring-2 ring-slate-900/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <span>{flt.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  isActive ? 'bg-white/20 text-white' : flt.badgeClass
                }`}>
                  {flt.count}
                </span>
                <span className="text-[9px] font-normal opacity-70">({flt.tag})</span>
              </button>
            );
          })}
        </div>

        {/* Quick Action Banner: Manual Stock Opname / Koreksi Stok */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 rounded-2xl border border-indigo-900/40 text-white shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30 shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-white">
                Koreksi Stok (Opname Manual)
              </h4>
              <p className="text-[11px] text-slate-300">
                Sesuaikan selisih fisik gudang dengan sistem
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenOpname()}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 flex items-center gap-1.5 focus:outline-none"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Mulai Opname</span>
          </button>
        </div>
      </section>

      {/* Stock Cards Grid Item list */}
      <div className="grid gap-3">
        {filteredItemsWithHealth.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-150 text-slate-400 text-sm">
            Tidak ada item stok yang cocok.
          </div>
        ) : (
          filteredItemsWithHealth.map(({ item: itm, health }) => {
            const { status, estDays, currentRate, historicalAvg, totalOutgoing, activeDaysCount } = health;
            let borderStyle = '';
            let bgBadge = '';
            let statusIcon = null;

            if (status === 'Kritis') {
              borderStyle = 'border-l-4 border-l-red-500';
              bgBadge = 'bg-red-50 text-red-700 border border-red-200';
              statusIcon = <ShieldAlert className="w-3 h-3 text-red-500" />;
            } else if (status === 'Rendah') {
              borderStyle = 'border-l-4 border-l-amber-500';
              bgBadge = 'bg-amber-50 text-amber-700 border border-amber-200';
              statusIcon = <AlertTriangle className="w-3 h-3 text-amber-500" />;
            } else {
              borderStyle = 'border-l-4 border-l-emerald-500';
              bgBadge = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
              statusIcon = <CheckCircle className="w-3 h-3 text-emerald-500" />;
            }

            const isEditingRack = editingItemId === itm.id;

            return (
              <div
                key={itm.id}
                className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100/80 ${borderStyle} flex flex-col gap-3 hover:shadow-md transition-all duration-200`}
              >
                {/* Main Row Information */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1 min-w-0 pr-2">
                    {/* Status header badge */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wide leading-none ${bgBadge}`}>
                        {statusIcon}
                        <span>{status}</span>
                      </span>
                    </div>

                    {/* Item Name */}
                    <h3 className="font-display font-bold text-base text-slate-800 truncate leading-tight">
                      {itm.name}
                    </h3>
                  </div>

                  {/* Larger Stock number count displayed right */}
                  <div className="text-right shrink-0 select-none flex flex-col items-end gap-1">
                    <div>
                      <span
                        className={`text-2xl font-black font-display tracking-tight leading-none ${
                          status === 'Kritis'
                            ? 'text-red-600'
                            : status === 'Rendah'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {itm.stock}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 block tracking-widest uppercase mt-0.5">
                        Pcs
                      </span>
                    </div>
                  </div>
                </div>

                {/* Item Location Rack & Quick Opname Actions */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Navigation className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500 font-medium text-[11px]">Lokasi:</span>
                    {isEditingRack ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={tempRack}
                          onChange={(e) => setTempRack(e.target.value)}
                          className="w-20 px-2 py-0.5 text-xs bg-slate-50 border border-slate-300 rounded font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Rak A-01"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRack(itm.id)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Simpan Rak"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingItemId(null)}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                          title="Batal"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {itm.rack || 'Belum diatur'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEditRackStart(itm)}
                          className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
                          title="Ubah Rak"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenOpname(itm.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] transition-colors focus:outline-none shrink-0"
                    title="Koreksi stok fisik barang ini (Stock Opname)"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Koreksi / Opname</span>
                  </button>
                </div>

                {/* FORECASTING & ESTIMATION EXPANSION PANEL */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2.5 mt-1">
                  {/* Sub header for forecasting with Cloud badge and Reset action */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[10px] uppercase tracking-wider">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Proyeksi & Estimasi Stok</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {health.hasCustomTarget ? (
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold font-mono inline-flex items-center gap-1 shadow-2xs"
                            title="Laju pakai ini dikunci dan tersimpan permanen di cloud Firebase"
                          >
                            <Cloud className="w-2.5 h-2.5 text-emerald-600" />
                            TARGET TETAP: {itm.targetDailyRate} Pcs/hari
                          </span>
                          <button
                            type="button"
                            onClick={() => handleResetToAuto(itm.id)}
                            className="text-[9px] text-slate-500 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 px-1.5 py-0.5 rounded-md font-medium inline-flex items-center gap-0.5 transition-colors focus:outline-none"
                            title="Hapus target tetap dan kembalikan ke rata-rata histori keluar otomatis"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Reset Histori</span>
                          </button>
                        </div>
                      ) : historicalAvg > 0 ? (
                        <span className="text-[8px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-bold font-mono">
                          HISTORI OTOMATIS
                        </span>
                      ) : (
                        <span className="text-[8px] text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-medium font-mono">
                          BELUM DIATUR
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Interactive controllers */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-slate-200/60 pt-2.5">
                    {/* Custom rate input & stepper */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-medium">Laju Pakai:</span>
                      
                      <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-xs focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-400">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextVal = Math.max(0, currentRate - 1);
                            setSimulatedRates(prev => ({ ...prev, [itm.id]: nextVal }));
                          }}
                          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 font-bold rounded-md select-none transition-colors focus:outline-none"
                          title="Kurangi 1 Pcs/hari"
                        >
                          -
                        </button>

                        <div className="flex items-center px-1">
                          <input
                            type="number"
                            min="0"
                            max="99999"
                            value={currentRate}
                            onChange={(e) => {
                              const parsed = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                              const val = isNaN(parsed) ? 0 : Math.max(0, parsed);
                              setSimulatedRates(prev => ({ ...prev, [itm.id]: val }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveTargetRate(itm.id, currentRate);
                              }
                            }}
                            className="w-12 text-center font-mono font-bold text-slate-800 text-xs py-0.5 px-0.5 border-0 focus:outline-none bg-transparent"
                            title="Ketik angka (misal: 100) lalu klik Simpan Target"
                          />
                          <span className="text-[10px] text-slate-400 font-medium ml-0.5 select-none pointer-events-none">
                            Pcs/hr
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextVal = currentRate + 1;
                            setSimulatedRates(prev => ({ ...prev, [itm.id]: nextVal }));
                          }}
                          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 font-bold rounded-md select-none transition-colors focus:outline-none"
                          title="Tambah 1 Pcs/hari"
                        >
                          +
                        </button>
                      </div>

                      {/* Save Button / Cloud Sync Status */}
                      {justSavedItemId === itm.id ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold animate-in fade-in">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Tersimpan di Cloud!</span>
                        </span>
                      ) : health.isRateModified ? (
                        <button
                          type="button"
                          onClick={() => handleSaveTargetRate(itm.id, currentRate)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] shadow-xs transition-all focus:outline-none cursor-pointer"
                          title="Simpan angka laju pakai ini permanen ke database Firebase"
                        >
                          <Save className="w-3 h-3" />
                          <span>Simpan Target ({currentRate})</span>
                        </button>
                      ) : health.hasCustomTarget ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 select-none">
                          <Cloud className="w-3 h-3 text-emerald-600" />
                          <span className="hidden sm:inline">Permanen di Cloud</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSaveTargetRate(itm.id, currentRate)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-lg font-medium text-[10px] transition-colors focus:outline-none cursor-pointer"
                          title="Kunci angka ini sebagai target tetap di Firebase"
                        >
                          <Cloud className="w-3 h-3 text-slate-400" />
                          <span>Kunci Laju</span>
                        </button>
                      )}
                    </div>

                    {/* Forecast indicator output */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pb-1 sm:pb-0">
                      <span className="text-[11px] text-slate-500 font-medium">Sisa Hari:</span>
                      {estDays !== null ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          estDays <= 3
                            ? 'bg-red-50 border-red-200 text-red-700 animate-pulse'
                            : estDays <= 7
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        }`}>
                          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>± {estDays} Hari</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>Laju Pakai Nol</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Micro footnotes info block */}
                  {health.hasCustomTarget ? (
                    <p className="text-[9px] text-slate-500 leading-normal font-sans pt-1 border-t border-slate-200/60">
                      💡 <strong>Target tetap aktif:</strong> Menggunakan patokan <strong>{itm.targetDailyRate} Pcs/hari</strong> yang tersimpan di cloud database. {historicalAvg > 0 && `(Histori riwayat keluar: rata-rata ${Math.round(historicalAvg * 10) / 10} Pcs/hari dari total ${totalOutgoing} Pcs).`}
                    </p>
                  ) : historicalAvg > 0 ? (
                    <p className="text-[9px] text-slate-400 leading-normal font-sans pt-1 border-t border-slate-200/60 italic">
                      * Terhitung dari histori keluar: total <strong>{totalOutgoing} Pcs</strong> dalam <strong>{activeDaysCount} hari aktif</strong> (rata-rata <strong>{Math.round(historicalAvg * 10) / 10} Pcs/hari</strong>). Anda dapat mengetik angka genap (misal: 100) lalu klik <strong>Simpan Target</strong> agar tersimpan permanen di cloud.
                    </p>
                  ) : (
                    <p className="text-[9px] text-slate-400 leading-normal font-sans pt-1 border-t border-slate-200/60 italic">
                      * Belum ada histori keluar. Silakan ketik angka target laju pakai lalu klik <strong>Simpan Target</strong>.
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Decorative dynamic summary statistics box */}
      <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest leading-none select-none">
              Ringkasan Hari Ini
            </p>
            <h4 className="font-display text-lg font-bold leading-tight">Total Aset Gudang</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-display text-2xl font-black">
                {totalBarangQty.toLocaleString('id-ID')}
              </p>
              <p className="text-xs font-medium text-blue-100/80 uppercase tracking-wide">Total Barang</p>
            </div>
            <div>
              <p className="font-display text-2xl font-black">{perluRestockCount}</p>
              <p className="text-xs font-medium text-blue-100/80 uppercase tracking-wide">Perlu Restock</p>
            </div>
          </div>
        </div>
        {/* Decorative backdrop blurring abstract circle */}
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {/* FAB scanner mock overlay button */}
      <button
        onClick={() => setShowScanner(true)}
        className="fixed bottom-24 right-5 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-transform active:scale-90 focus:outline-none"
        title="Simpan scan barcode"
      >
        <QrCode className="w-6 h-6 shrink-0" />
      </button>

      {/* Interactive Barcode Scanner Simulation modal Dialog overlay */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Green glowing laser simulation scanner box overlay */}
            <div className="absolute top-2 left-0 w-full h-1 bg-emerald-500 animate-[bounce_3s_infinite] shadow-[0_0_8px_#10b981] opacity-75"></div>

            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-400" />
                <h3 className="font-display text-base font-bold text-slate-200">Simulasi Barcode Scanner</h3>
              </div>
              <button
                onClick={() => setShowScanner(false)}
                className="p-1 text-slate-400 hover:text-slate-300 rounded-full hover:bg-slate-800 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScanSubmit} className="space-y-4">
              <p className="text-xs text-slate-400 font-sans leading-normal">
                Gunakan terminal scanner portable ini untuk memindai kode barcode fisik pada item untuk menyesuaikan atau restock unit fisik secara cepat.
              </p>

              {/* Select Scan Item */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase select-none">
                  Pindai / Pilih Item
                </label>
                <select
                  required
                  value={selectedScanItemId}
                  onChange={(e) => setSelectedScanItemId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-750/60 text-slate-200 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="" disabled className="text-slate-500">Pilih item hasil scan...</option>
                  {items.map((itm) => (
                    <option key={itm.id} value={itm.id} className="text-slate-100 bg-slate-800">
                      {itm.name} (Stok: {itm.stock})
                    </option>
                  ))}
                </select>
              </div>

              {/* Adjust Stock modification quantity */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase select-none">
                  Jumlah Penyesuaian
                </label>
                <div className="flex items-center justify-between bg-slate-800 border border-slate-750 rounded-xl p-1 w-full">
                  <button
                    type="button"
                    onClick={() => setScanQtyChange(Math.max(1, scanQtyChange - 1))}
                    className="w-9 h-9 flex items-center justify-center bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-300 font-bold text-lg focus:outline-none"
                  >
                    <Minus className="w-4 h-4 shrink-0" />
                  </button>
                  <span className="font-mono text-base font-bold text-white px-4 select-none">
                    +{scanQtyChange} Pcs
                  </span>
                  <button
                    type="button"
                    onClick={() => setScanQtyChange(scanQtyChange + 1)}
                    className="w-9 h-9 flex items-center justify-center bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-300 font-bold text-lg focus:outline-none"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!selectedScanItemId}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 focus:outline-none shadow-md"
                >
                  <Check className="w-5 h-5 shrink-0" />
                  <span>Kirim Data Scan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Stock Opname / Discrepancy Correction Modal */}
      <StockOpnameModal
        isOpen={showOpnameModal}
        onClose={() => {
          setShowOpnameModal(false);
          setOpnameItemId(null);
        }}
        items={items}
        preselectedItemId={opnameItemId}
        onSaveOpname={handleSaveOpname}
      />
    </div>
  );
}
