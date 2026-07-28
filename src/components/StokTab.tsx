import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, CheckCircle, ShieldAlert, Navigation, QrCode, X, Plus, Minus, Edit, Check, TrendingUp, Clock, HelpCircle } from 'lucide-react';
import { WarehouseItem, StockMutation } from '../types';

interface StokTabProps {
  items: WarehouseItem[];
  mutations: StockMutation[];
  onUpdateItemStock: (itemId: string, newStock: number) => void;
  onUpdateItemRack: (itemId: string, newRack: string) => void;
}

export default function StokTab({ items, mutations, onUpdateItemStock, onUpdateItemRack }: StokTabProps) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'Semua' | 'Kritis' | 'Rendah' | 'Aman'>('Semua');

  // Simulation rates for each item code: {[itemId]: ratePerDay}
  const [simulatedRates, setSimulatedRates] = useState<Record<string, number>>({});

  // Scanner modal state
  const [showScanner, setShowScanner] = useState(false);
  const [selectedScanItemId, setSelectedScanItemId] = useState('');
  const [scanQtyChange, setScanQtyChange] = useState(1);

  // Edit rack modal or inline state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempRack, setTempRack] = useState('');

  // Filtering logic
  const getStockStatus = (stock: number): 'Kritis' | 'Rendah' | 'Aman' => {
    if (stock <= 5) return 'Kritis';
    if (stock <= 20) return 'Rendah';
    return 'Aman';
  };

  const filteredItems = items.filter((itm) => {
    const status = getStockStatus(itm.stock);
    const matchesSearch =
      itm.name.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = activeFilter === 'Semua' || status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // Calculate dynamic summary stats
  const totalBarangQty = items.reduce((sum, itm) => sum + itm.stock, 0);
  const perluRestockCount = items.filter((itm) => itm.stock <= 15).length;

  const handleEditRackStart = (itm: WarehouseItem) => {
    setEditingItemId(itm.id);
    setTempRack(itm.rack);
  };

  const handleSaveRack = (itemId: string) => {
    onUpdateItemRack(itemId, tempRack);
    setEditingItemId(null);
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
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold whitespace-nowrap rounded-full transition-all focus:outline-none shadow-sm ${
              activeFilter === 'Semua'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Semua</span>
          </button>

          {[
            { id: 'Kritis', label: 'Kritis', color: 'bg-red-50 text-red-600 border border-red-200' },
            { id: 'Rendah', label: 'Rendah', color: 'bg-amber-55 bg-indigo-50 text-blue-600 border border-blue-200' },
            { id: 'Aman', label: 'Aman', color: 'bg-emerald-50 text-emerald-600 border border-emerald-200' },
          ].map((flt) => {
            const isActive = activeFilter === flt.id;
            return (
              <button
                key={flt.id}
                onClick={() => setActiveFilter(flt.id as any)}
                className={`px-4 py-2 text-xs font-bold whitespace-nowrap rounded-full transition-all focus:outline-none shadow-sm ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : `bg-white text-slate-500 border border-slate-200 hover:text-slate-800`
                }`}
              >
                {flt.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Stock Cards Grid Item list */}
      <div className="grid gap-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-150 text-slate-400 text-sm">
            Tidak ada item stok yang cocok.
          </div>
        ) : (
          filteredItems.map((itm) => {
            const status = getStockStatus(itm.stock);
            let borderStyle = '';
            let bgBadge = '';
            let textBadge = '';
            let statusIcon = null;

            if (status === 'Kritis') {
              borderStyle = 'border-l-4 border-l-red-500';
              bgBadge = 'bg-red-50 text-red-700 border border-red-100';
              statusIcon = <ShieldAlert className="w-3 h-3 text-red-500" />;
            } else if (status === 'Rendah') {
              borderStyle = 'border-l-4 border-l-blue-500';
              bgBadge = 'bg-blue-50 text-blue-700 border border-blue-100';
              statusIcon = <AlertTriangle className="w-3 h-3 text-blue-500" />;
            } else {
              borderStyle = 'border-l-4 border-l-emerald-500';
              bgBadge = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
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
                            ? 'text-red-650 text-red-600'
                            : status === 'Rendah'
                            ? 'text-blue-600'
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

                {/* FORECASTING & ESTIMATION EXPANSION PANEL */}
                {(() => {
                  // Calculate actual historical daily consumption rate for this specific item
                  const itemKeluarMutations = mutations.filter(m => m.itemId === itm.id && m.type === 'keluar');
                  const totalOutgoing = itemKeluarMutations.reduce((sum, m) => sum + m.quantity, 0);
                  const uniqueDates = Array.from(new Set(itemKeluarMutations.map(m => m.date)));
                  const activeDaysCount = uniqueDates.length;
                  const historicalAvg = activeDaysCount > 0 ? (totalOutgoing / activeDaysCount) : 0;

                  // Read current simulation rate, defaulting to historicalAvg if greater than 0, otherwise default to 0.
                  const currentRate = simulatedRates[itm.id] !== undefined
                    ? simulatedRates[itm.id]
                    : (historicalAvg > 0 ? Math.round(historicalAvg) : 0);

                  // Days of stock remaining based on rate
                  const estDays = currentRate > 0 ? Math.ceil(itm.stock / currentRate) : null;

                  return (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-2 mt-1">
                      {/* Sub header for forecasting */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[10px] uppercase tracking-wider">
                          <TrendingUp className="w-3 h-3 text-indigo-500" />
                          <span>Proyeksi & Estimasi Stok</span>
                        </div>
                        {historicalAvg > 0 && (
                          <span className="text-[8px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-bold font-mono">
                            HISTORI AKTIF
                          </span>
                        )}
                      </div>

                      {/* Interactive controllers */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100 pt-2">
                        {/* Custom rate slider adjustment */}
                        <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                          <span className="text-[11px] text-slate-400 font-medium">Laju Pakai:</span>
                          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextVal = Math.max(0, currentRate - 1);
                                setSimulatedRates(prev => ({ ...prev, [itm.id]: nextVal }));
                              }}
                              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 font-bold rounded-md select-none transition-colors focus:outline-none"
                              title="Kurangi Laju"
                            >
                              -
                            </button>
                            <span className="text-[11px] font-mono font-bold text-slate-700 w-20 text-center select-none">
                              {currentRate} Pcs/hari
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextVal = currentRate + 1;
                                setSimulatedRates(prev => ({ ...prev, [itm.id]: nextVal }));
                              }}
                              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 font-bold rounded-md select-none transition-colors focus:outline-none"
                              title="Tambah Laju"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Forecast indicator output */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pb-1 sm:pb-0">
                          <span className="text-[11px] text-slate-400 font-medium">Sisa Hari:</span>
                          {estDays !== null ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                              estDays <= 3
                                ? 'bg-red-50 border-red-150 text-red-700 animate-pulse'
                                : estDays <= 10
                                ? 'bg-amber-50 border-amber-150 text-amber-700'
                                : 'bg-emerald-50 border-emerald-150 text-emerald-700'
                            }`}>
                              <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>± {estDays} Hari</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-400 border border-slate-200">
                              <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>Laju Pakai Nol</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Micro footnotes info block */}
                      {historicalAvg > 0 ? (
                        <p className="text-[9px] text-slate-400 leading-normal font-sans pt-1 border-t border-slate-100/60 italic">
                          * Terhitung dari histori keluar: total <strong>{totalOutgoing} Pcs</strong> dalam <strong>{activeDaysCount} hari aktif</strong> (rata-rata <strong>{Math.round(historicalAvg * 10) / 10} Pcs/hari</strong>).
                        </p>
                      ) : (
                        <p className="text-[9px] text-slate-400 leading-normal font-sans pt-1 border-t border-slate-100/60 italic">
                          * Belum ada histori keluar. Silakan klik tombol [+] untuk melakukan simulasi.
                        </p>
                      )}
                    </div>
                  );
                })()}
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
    </div>
  );
}
