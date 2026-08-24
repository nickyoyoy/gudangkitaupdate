import React, { useState } from 'react';
import { 
  Package, 
  User, 
  Info, 
  Save, 
  Loader2, 
  CheckCircle2, 
  History, 
  PlusCircle, 
  Search, 
  Trash2, 
  Calendar, 
  Filter, 
  ArrowDownLeft,
  CheckSquare,
  Square,
  AlertTriangle,
  Edit3,
  X
} from 'lucide-react';
import { WarehouseItem, StockMutation } from '../types';
import EditMutationModal from './EditMutationModal';

interface MasukTabProps {
  items: WarehouseItem[];
  mutations: StockMutation[];
  onAddMutation: (mutation: Omit<StockMutation, 'id' | 'time' | 'date'>) => void;
  onEditMutation?: (mutation: StockMutation) => void;
  onDeleteMutation?: (id: string) => void;
  onDeleteMutations?: (ids: string[]) => void;
  onNavigate: (tab: string) => void;
}

export default function MasukTab({ 
  items, 
  mutations, 
  onAddMutation, 
  onEditMutation,
  onDeleteMutation, 
  onDeleteMutations,
  onNavigate 
}: MasukTabProps) {
  const [subTab, setSubTab] = useState<'form' | 'history'>('form');
  
  // Form states
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pic, setPic] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  // History state filter & bulk selection
  const [search, setSearch] = useState('');
  const [selectedFilterItem, setSelectedFilterItem] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [idsToDelete, setIdsToDelete] = useState<string[]>([]);

  // Edit mutation state
  const [editingMutation, setEditingMutation] = useState<StockMutation | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !quantity || !pic) {
      alert('Mohon lengkapi semua data formulir.');
      return;
    }

    const qtyNumber = parseInt(quantity, 10);
    if (isNaN(qtyNumber) || qtyNumber <= 0) {
      alert('Jumlah keluar masuk harus bernilai positif.');
      return;
    }

    setStatus('loading');

    setTimeout(() => {
      onAddMutation({
        itemId: selectedItemId,
        itemName: items.find((itm) => itm.id === selectedItemId)?.name || '',
        type: 'masuk',
        quantity: qtyNumber,
        pic,
      });

      setStatus('success');

      setTimeout(() => {
        setSelectedItemId('');
        setQuantity('');
        setPic('');
        setStatus('idle');
        // Switch to history tab to easily see the newly logged data
        setSubTab('history');
      }, 1200);
    }, 1000);
  };

  // Get only 'masuk' type mutations
  const inboundMutations = mutations.filter(m => m.type === 'masuk');

  // Filtered mutations for history
  const filteredMutations = inboundMutations.filter(m => {
    const matchesSearch = m.itemName.toLowerCase().includes(search.toLowerCase()) || 
                          m.pic.toLowerCase().includes(search.toLowerCase());
    const matchesItem = selectedFilterItem ? m.itemId === selectedFilterItem : true;
    return matchesSearch && matchesItem;
  });

  // Simple statistics
  const totalInboundQty = filteredMutations.reduce((sum, m) => sum + m.quantity, 0);

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (filteredMutations.length === 0) return;
    const allFilteredIds = filteredMutations.map(m => m.id);
    const isAllSelected = allFilteredIds.every(id => selectedIds.includes(id));
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedIds(Array.from(new Set([...selectedIds, ...allFilteredIds])));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleOpenBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setIdsToDelete(selectedIds);
    setIsConfirmDeleteOpen(true);
  };

  const handleOpenSingleDelete = (id: string) => {
    setIdsToDelete([id]);
    setIsConfirmDeleteOpen(true);
  };

  const handleOpenEdit = (mut: StockMutation) => {
    setEditingMutation(mut);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updatedMut: StockMutation) => {
    if (onEditMutation) {
      onEditMutation(updatedMut);
    }
  };

  const handleExecuteDelete = () => {
    if (idsToDelete.length === 0) return;
    if (onDeleteMutations) {
      onDeleteMutations(idsToDelete);
    } else if (onDeleteMutation) {
      idsToDelete.forEach(id => onDeleteMutation(id));
    }
    setSelectedIds(prev => prev.filter(id => !idsToDelete.includes(id)));
    setIdsToDelete([]);
    setIsConfirmDeleteOpen(false);
  };

  const isAllFilteredSelected = filteredMutations.length > 0 && 
    filteredMutations.every(m => selectedIds.includes(m.id));

  return (
    <div className="max-w-md mx-auto space-y-5">
      {/* Tab Switcher Controller */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setSubTab('form')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            subTab === 'form' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Catat Masuk</span>
        </button>
        <button
          onClick={() => setSubTab('history')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
            subTab === 'history' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Masuk</span>
          {inboundMutations.length > 0 && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          )}
        </button>
      </div>

      {subTab === 'form' ? (
        <div className="space-y-6">
          {/* Decorative Image */}
          <div className="relative h-40 w-full rounded-2xl overflow-hidden shadow-xs border border-slate-150">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQlC89MaYhxTDlk3xRZm4XNhYo-_v9FWuJhDxGaVk6DpeEP2mLY97OovfkihYIEYPxH5VdHPKhcNTeAh-eDZj_WB8YYdE4iMhfuzfHW064JriW9oBdEyzgnx7QqVT21TdnILowOYGUTyu4TeVn0SwpoK9KJQ-ECJS-WVp_zEc0-aXbyYpCuCLi4nu7BIZOY8Jx3ZUPOfVF_gJGQFmIg27xS9Hhy_ZZnxbzf0dwNUtBfgb7vGHME_HO2AjSQunEuf_jdLunWHS_BMs"
              alt="Logistik Gudang Utama"
              className="w-full h-full object-cover select-none pointer-events-none"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
              <p className="text-white text-xs font-semibold tracking-wide font-display">
                Logistik Gudang Utama
              </p>
            </div>
          </div>

          {/* Form Card */}
          <section className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100">
            <form onSubmit={handleSubmit} className="space-y-5" id="inputForm">
              {/* Dropdown Field */}
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase px-0.5">
                  Pilih Nama Barang
                </label>
                <div className="relative">
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3.5 text-sm text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
                  >
                    <option value="" disabled>
                      Pilih item dari daftar...
                    </option>
                    {items.map((itm) => (
                      <option key={itm.id} value={itm.id}>
                        {itm.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Package className="w-5 h-5 opacity-60" />
                  </div>
                </div>
              </div>

              {/* Number Input Field */}
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase px-0.5">
                  Jumlah Masuk
                </label>
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 focus-within:bg-white transition-all">
                  <span className="text-slate-400 pl-3.5">
                    <Package className="w-4 h-4 opacity-70" />
                  </span>
                  <input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    className="w-full bg-transparent border-none py-3 px-3 text-sm text-slate-800 font-sans focus:outline-none"
                  />
                  <span className="pr-4 text-xs font-bold text-slate-400 select-none">Pcs</span>
                </div>
              </div>

              {/* Text Input Field */}
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-3 duration-200">
                <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase px-0.5">
                  Nama PIC Petugas
                </label>
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 focus-within:bg-white transition-all">
                  <span className="text-slate-400 pl-3.5">
                    <User className="w-4 h-4 opacity-70" />
                  </span>
                  <input
                    type="text"
                    placeholder="Masukkan nama petugas"
                    value={pic}
                    onChange={(e) => setPic(e.target.value)}
                    required
                    className="w-full bg-transparent border-none py-3 px-3 text-sm text-slate-800 font-sans focus:outline-none"
                  />
                </div>
              </div>

              {/* Helper Text */}
              <p className="text-[11px] text-slate-400 px-0.5 flex items-center bg-slate-50 p-2.5 rounded-xl gap-1.5 border border-slate-100 select-none animate-in fade-in slide-in-from-bottom-1 duration-200">
                <Info className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Pastikan semua data sudah sesuai sebelum menyimpan. Data akan tersinkronisasi ke tabel stok barang secara otomatis.</span>
              </p>

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={status !== 'idle'}
                  className={`w-full font-display text-sm font-bold py-3.5 rounded-xl text-white shadow-md active:scale-98 transition-all duration-150 flex items-center justify-center gap-2 ${
                    status === 'success'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-80'
                  }`}
                >
                  {status === 'idle' && (
                    <>
                      <Save className="w-5 h-5 shrink-0" />
                      <span>Simpan Data</span>
                    </>
                  )}
                  {status === 'loading' && (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                      <span>Menyimpan...</span>
                    </>
                  )}
                  {status === 'success' && (
                    <>
                      <CheckCircle2 className="w-5 h-5 shrink-0 animate-bounce" />
                      <span>Berhasil Disimpan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-250">
          {/* History Search & Filter Panel */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest pl-0.5">
              Filter Riwayat Masuk
            </h3>
            
            <div className="grid grid-cols-1 gap-2.5">
              {/* Search input */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Cari barang atau nama PIC..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Item selection filter dropdown */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Filter className="w-4 h-4" />
                </span>
                <select
                  value={selectedFilterItem}
                  onChange={(e) => setSelectedFilterItem(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-700 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none"
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

            {/* Quick Metrics of Inbound history */}
            <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-100">
              <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/40 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Total Transaksi
                </p>
                <p className="text-base font-black text-blue-600 mt-0.5">
                  {filteredMutations.length} <span className="text-[10px] font-medium text-slate-400">mutasi</span>
                </p>
              </div>
              <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/40 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Total Volume
                </p>
                <p className="text-base font-black text-emerald-600 mt-0.5">
                  +{totalInboundQty} <span className="text-[10px] font-medium text-slate-400">Pcs</span>
                </p>
              </div>
            </div>
          </div>

          {/* Bulk Selection Action Toolbar */}
          {filteredMutations.length > 0 && (
            <div className="bg-white rounded-2xl p-3 shadow-xs border border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors focus:outline-none select-none"
              >
                {isAllFilteredSelected ? (
                  <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span>
                  {isAllFilteredSelected ? 'Batalkan Semua' : 'Pilih Semua'} ({filteredMutations.length})
                </span>
              </button>

              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                    {selectedIds.length} dipilih
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenBulkDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs focus:outline-none animate-in zoom-in-95 duration-150"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus ({selectedIds.length})</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mutation List View */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {filteredMutations.length > 0 ? (
              filteredMutations.map((mut) => {
                const isSelected = selectedIds.includes(mut.id);
                return (
                  <div
                    key={mut.id}
                    className={`bg-white p-3.5 rounded-xl border shadow-xs flex items-center justify-between gap-3 transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50/20 ring-1 ring-blue-500/30' 
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {/* Checkbox selector */}
                    <button
                      type="button"
                      onClick={() => handleToggleSelectItem(mut.id)}
                      className="p-1 text-slate-400 hover:text-blue-600 focus:outline-none shrink-0"
                      title={isSelected ? 'Batalkan pilihan' : 'Pilih item'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </button>

                    <div 
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => handleToggleSelectItem(mut.id)}
                    >
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <ArrowDownLeft className="w-2.5 h-2.5 shrink-0" />
                          <span>MASUK</span>
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
                      <div className="bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                        <span className="font-display font-black text-sm text-emerald-700">
                          +{mut.quantity}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-500 block">Pcs</span>
                      </div>

                      {/* Row action buttons: Edit / Koreksi & Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(mut);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none"
                          title="Koreksi / Edit transaksi masuk ini"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSingleDelete(mut.id);
                          }}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none"
                          title="Hapus riwayat mutasi ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center space-y-2">
                <History className="w-8 h-8 text-slate-300 mx-auto opacity-70" />
                <p className="text-xs font-bold text-slate-600">
                  {inboundMutations.length === 0 
                    ? 'Belum ada data barang masuk' 
                    : 'Tidak ada data dengan filter terkait'}
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  {inboundMutations.length === 0 
                    ? 'Saat Anda mencatatkan data masuk, historinya akan otomatis direkap di panel ini.' 
                    : 'Harap sesuaikan input pencarian atau dropdown filter barang Anda.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting History Log */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-xl animate-in zoom-in-95 duration-200 text-slate-800 border border-slate-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-100/50 mb-3.5">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-display text-base font-bold text-slate-900 mb-1.5">
                Hapus {idsToDelete.length} Catatan Riwayat Masuk?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4 font-sans">
                Catatan riwayat yang dipilih akan dihapus secara permanen dari daftar log untuk meringankan data.
              </p>

              <div className="w-full bg-emerald-50/60 border border-emerald-100/80 rounded-2xl p-3 text-left font-sans text-xs text-emerald-800 space-y-1.5 mb-5">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Stok Fisik Aman (Tidak Berubah)</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-tight">
                  Jumlah stok barang di gudang saat ini akan tetap sama dan tidak mengalami pengurangan.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 w-full font-sans">
                <button
                  type="button"
                  onClick={() => setIsConfirmDeleteOpen(false)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors focus:outline-none"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors focus:outline-none shadow-md shadow-rose-500/10"
                >
                  Ya, Hapus ({idsToDelete.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Editing / Correcting Inbound Mutation */}
      <EditMutationModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingMutation(null);
        }}
        mutation={editingMutation}
        item={items.find((itm) => itm.id === editingMutation?.itemId)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
