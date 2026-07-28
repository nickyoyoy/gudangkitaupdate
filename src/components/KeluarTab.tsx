import React, { useState } from 'react';
import { 
  Package, 
  User, 
  AlertTriangle, 
  LogOut, 
  Loader2, 
  CheckCircle2, 
  History, 
  PlusCircle, 
  Search, 
  Trash2, 
  Calendar, 
  Filter, 
  ArrowUpRight 
} from 'lucide-react';
import { WarehouseItem, StockMutation } from '../types';

interface KeluarTabProps {
  items: WarehouseItem[];
  mutations: StockMutation[];
  onAddMutation: (mutation: Omit<StockMutation, 'id' | 'time' | 'date'>) => void;
  onDeleteMutation: (id: string) => void;
  onNavigate: (tab: string) => void;
}

export default function KeluarTab({ 
  items, 
  mutations, 
  onAddMutation, 
  onDeleteMutation, 
  onNavigate 
}: KeluarTabProps) {
  const [subTab, setSubTab] = useState<'form' | 'history'>('form');

  // Form states
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pic, setPic] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  // History states
  const [search, setSearch] = useState('');
  const [selectedFilterItem, setSelectedFilterItem] = useState('');

  // Find currently selected item and its stock level
  const selectedItem = items.find((itm) => itm.id === selectedItemId);
  const currentStock = selectedItem ? selectedItem.stock : 0;
  const isLowStock = selectedItem && selectedItem.stock <= 15;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !quantity || !pic) {
      alert('Mohon lengkapi semua data formulir.');
      return;
    }

    const qtyNumber = parseInt(quantity, 10);
    if (isNaN(qtyNumber) || qtyNumber <= 0) {
      alert('Jumlah keluar harus bernilai positif.');
      return;
    }

    if (qtyNumber > currentStock) {
      alert(`Stok tidak mencukupi! Hanya tersedia ${currentStock} Pcs.`);
      return;
    }

    setStatus('loading');

    setTimeout(() => {
      onAddMutation({
        itemId: selectedItemId,
        itemName: selectedItem?.name || '',
        type: 'keluar',
        quantity: qtyNumber,
        pic,
      });

      setStatus('success');

      setTimeout(() => {
        setSelectedItemId('');
        setQuantity('');
        setPic('');
        setStatus('idle');
        // Instantly switch to history to view results
        setSubTab('history');
      }, 1200);
    }, 1000);
  };

  // Get only 'keluar' mutations
  const outboundMutations = mutations.filter(m => m.type === 'keluar');

  // Filter history log mutations
  const filteredMutations = outboundMutations.filter(m => {
    const matchesSearch = m.itemName.toLowerCase().includes(search.toLowerCase()) || 
                          m.pic.toLowerCase().includes(search.toLowerCase());
    const matchesItem = selectedFilterItem ? m.itemId === selectedFilterItem : true;
    return matchesSearch && matchesItem;
  });

  // Outbound volume sum
  const totalOutboundQty = filteredMutations.reduce((sum, m) => sum + m.quantity, 0);

  return (
    <div className="max-w-md mx-auto space-y-5">
      {/* Sub Tab Switch Panel */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setSubTab('form')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            subTab === 'form' 
              ? 'bg-white text-indigo-650 text-indigo-650 text-indigo-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Catat Keluar</span>
        </button>
        <button
          onClick={() => setSubTab('history')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
            subTab === 'history' 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Keluar</span>
          {outboundMutations.length > 0 && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-505 bg-indigo-500"></span>
            </span>
          )}
        </button>
      </div>

      {subTab === 'form' ? (
        <div className="space-y-6">
          {/* Title banner */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100 mb-2">
            <h2 className="font-display text-base font-bold text-slate-800">Keluar Barang</h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Catat setiap perpindahan barang keluar dari inventaris warehouse secara akurat.
            </p>
          </section>

          {/* Form Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-5">
            {/* Field: Pilih Nama Barang */}
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase px-0.5" htmlFor="item-select">
                Pilih Nama Barang
              </label>
              <div className="relative">
                <select
                  id="item-select"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3.5 text-sm text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
                >
                  <option value="" disabled>
                    Pilih item dari daftar...
                  </option>
                  {items.map((itm) => (
                    <option key={itm.id} value={itm.id}>
                      {itm.name} (Stok: {itm.stock} Pcs)
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Package className="w-5 h-5 opacity-60" />
                </div>
              </div>
            </div>

            {/* Visual Stock Levels & Alerts */}
            {selectedItem && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                        Stok Tersedia
                      </p>
                      <p className="font-display text-2xl font-black text-slate-800">
                        {currentStock}{' '}
                        <span className="text-xs font-semibold text-slate-400">Pcs</span>
                      </p>
                    </div>
                  </div>
                  {isLowStock ? (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-650 text-red-600 animate-pulse">
                      Stok Rendah
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                      Stok Aman
                    </span>
                  )}
                </div>

                {isLowStock && (
                  <div className="p-3.5 rounded-xl bg-red-50 text-red-700 flex items-start gap-3 border border-red-200/50 select-none">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold">Peringatan: Stok hampir habis.</p>
                      <p className="text-red-650 text-red-600">Sangat diimbau untuk segera mengajukan pre-order (PO) di tab procurement.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Field: Jumlah Keluar */}
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-3 duration-200">
              <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase px-0.5" htmlFor="quantity">
                Jumlah Keluar
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 focus-within:bg-white transition-all">
                <span className="text-slate-400 pl-3.5">
                  <LogOut className="w-4 h-4 opacity-70" />
                </span>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max={currentStock || undefined}
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="w-full bg-transparent border-none py-3 px-3 text-sm text-slate-800 font-sans focus:outline-none"
                />
                <span className="pr-4 text-xs font-bold text-slate-400 select-none">Pcs</span>
              </div>
            </div>

            {/* Field: PIC */}
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-4 duration-200">
              <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase px-0.5" htmlFor="pic-name">
                Nama PIC Petugas
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 focus-within:bg-white transition-all">
                <span className="text-slate-400 pl-3.5">
                  <User className="w-4 h-4 opacity-70" />
                </span>
                <input
                  id="pic-name"
                  type="text"
                  placeholder="Nama lengkap petugas..."
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  required
                  className="w-full bg-transparent border-none py-3 px-3 text-sm text-slate-800 font-sans focus:outline-none"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2">
              <button
                onClick={handleSubmit}
                disabled={status !== 'idle'}
                className={`w-full font-display text-sm font-bold py-3.5 rounded-xl text-white shadow-lg active:scale-98 transition-all duration-150 flex items-center justify-center gap-2 ${
                  status === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-80'
                }`}
              >
                {status === 'idle' && (
                  <>
                    <LogOut className="w-5 h-5 shrink-0" />
                    <span>Catat Pengeluaran</span>
                  </>
                )}
                {status === 'loading' && (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                    <span>Memproses...</span>
                  </>
                )}
                {status === 'success' && (
                  <>
                    <CheckCircle2 className="w-5 h-5 shrink-0 animate-bounce" />
                    <span>Pengeluaran Berhasil Dicatat</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Graphic decoration image */}
          <div className="relative rounded-2xl overflow-hidden shadow-xs h-40 border border-slate-150">
            <img
              alt="Logistik Warehouse A1"
              className="w-full h-full object-cover select-none pointer-events-none"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbXGeKnckgVIc0iEVfiqtNFpE1H5KsivColMvCTuWlayoyEd5Jr0yaywb1AV0YfeaUkEVrYZkww0jPsUvAn8ScEXAA9buFaHxwLgMAWh2Cc1XhMK_TT-UROeYL19LdBpdPiUncQ9vthVDGIf9hS7puBfWyCwb-oYSpkI54PWZHbEQlghjVuGktvxJtJdlsQshofSccGHtOxp7GBRm9k76rbnLXctJHk4A9CPQBGsXFoZsWiaFkWcLyG8NQv9S4_RpA4t1SklYsYv8"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
              <p className="text-white text-xs font-semibold tracking-wide font-display">
                Logistik Warehouse A1
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-250">
          {/* History Search & Filter Frame */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest pl-0.5">
              Filter Riwayat Keluar
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Search text filter */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Cari barang atau nama PIC..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Item narrow-down filter */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Filter className="w-4 h-4" />
                </span>
                <select
                  value={selectedFilterItem}
                  onChange={(e) => setSelectedFilterItem(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-700 font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none"
                >
                  <option value="">Semua Barang</option>
                  {items.map((itm) => (
                    <option key={itm.id} value={itm.id}>
                      {itm.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Metrics of History */}
            <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-100">
              <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/40 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Total Transaksi
                </p>
                <p className="text-base font-black text-indigo-650 text-indigo-600 mt-0.5">
                  {filteredMutations.length} <span className="text-[10px] font-medium text-slate-400">mutasi</span>
                </p>
              </div>
              <div className="bg-red-50/50 p-2.5 rounded-xl border border-red-100/40 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Total Keluar
                </p>
                <p className="text-base font-black text-red-600 mt-0.5">
                  -{totalOutboundQty} <span className="text-[10px] font-medium text-slate-400">Pcs</span>
                </p>
              </div>
            </div>
          </div>

          {/* List of Outbound Mutations */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {filteredMutations.length > 0 ? (
              filteredMutations.map((mut) => (
                <div
                  key={mut.id}
                  className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between gap-3 hover:border-slate-200 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wide bg-red-50 text-red-700 border border-red-100">
                        <ArrowUpRight className="w-2.5 h-2.5 shrink-0" />
                        <span>KELUAR</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {mut.id.replace('mut-', '#')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 whitespace-nowrap">
                        <Calendar className="w-3 h-3 text-slate-400 opacity-60" />
                        {mut.date} @ {mut.time}
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-sm text-slate-800 truncate leading-tight">
                      {mut.itemName}
                    </h4>

                    <div className="text-[11px] text-slate-500 font-sans mt-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400 opacity-65" />
                      <span>PIC: <strong className="text-slate-600 font-semibold">{mut.pic}</strong></span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-2 shrink-0">
                    <div className="bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                      <span className="font-display font-black text-sm text-red-650 text-red-600">
                        -{mut.quantity}
                      </span>
                      <span className="text-[9px] font-bold text-red-500 block">Pcs</span>
                    </div>

                    {/* Delete cancellation handler */}
                    <button
                      onClick={() => onDeleteMutation(mut.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none"
                      title="Batalkan mutasi keluar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center space-y-2">
                <History className="w-8 h-8 text-slate-300 mx-auto opacity-70" />
                <p className="text-xs font-bold text-slate-600">
                  {outboundMutations.length === 0 
                    ? 'Belum ada data barang keluar' 
                    : 'Tidak ada data dengan filter terkait'}
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  {outboundMutations.length === 0 
                    ? 'Ketika tim mendistribusikan barang keluar, historinya akan langsung direkam di sini.' 
                    : 'Ubah kueri pencarian atau filter pilihan barang untuk melihat data lain.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
