import React, { useState, useEffect } from 'react';
import { 
  X, 
  ClipboardCheck, 
  Package, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  Check, 
  TrendingUp, 
  TrendingDown,
  FileText
} from 'lucide-react';
import { WarehouseItem } from '../types';

interface StockOpnameModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: WarehouseItem[];
  preselectedItemId?: string | null;
  onSaveOpname: (itemId: string, actualStock: number, pic: string, notes: string) => void;
}

export default function StockOpnameModal({
  isOpen,
  onClose,
  items,
  preselectedItemId,
  onSaveOpname,
}: StockOpnameModalProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [actualStock, setActualStock] = useState<number>(0);
  const [pic, setPic] = useState<string>('');
  const [reasonCategory, setReasonCategory] = useState<string>('Hasil Fisik Stok Opname Rutin');
  const [customNote, setCustomNote] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const initialId = preselectedItemId || (items.length > 0 ? items[0].id : '');
      setSelectedItemId(initialId);
      const selected = items.find((itm) => itm.id === initialId);
      if (selected) {
        setActualStock(selected.stock);
      }
      setPic('');
      setReasonCategory('Hasil Fisik Stok Opname Rutin');
      setCustomNote('');
    }
  }, [isOpen, preselectedItemId, items]);

  const currentItem = items.find((itm) => itm.id === selectedItemId);
  const systemStock = currentItem ? currentItem.stock : 0;
  const diff = actualStock - systemStock;

  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    const target = items.find((itm) => itm.id === itemId);
    if (target) {
      setActualStock(target.stock);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !currentItem) {
      alert('Pilih barang yang ingin diopname.');
      return;
    }
    if (actualStock < 0) {
      alert('Jumlah stok fisik tidak boleh negatif.');
      return;
    }
    if (!pic.trim()) {
      alert('Mohon masukkan nama petugas (PIC).');
      return;
    }

    const finalNote = customNote.trim()
      ? `${reasonCategory} - ${customNote.trim()}`
      : reasonCategory;

    onSaveOpname(selectedItemId, actualStock, pic.trim(), finalNote);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-slate-800 border border-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 leading-tight">
                Koreksi Stok (Opname Manual)
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Sinkronkan angka sistem dengan stok fisik riil
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Item Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Pilih Barang
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => handleItemChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {items.map((itm) => (
                <option key={itm.id} value={itm.id}>
                  {itm.name} (Stok Sistem: {itm.stock} Pcs - Rak: {itm.rack})
                </option>
              ))}
            </select>
          </div>

          {/* Current System Stock vs Real Physical Count */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Stok di Sistem
              </span>
              <p className="font-display font-black text-xl text-slate-700 mt-0.5">
                {systemStock} <span className="text-xs font-normal text-slate-400">Pcs</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                Stok Fisik Riil
              </span>
              <p className="font-display font-black text-xl text-indigo-600 mt-0.5">
                {actualStock} <span className="text-xs font-normal text-indigo-400">Pcs</span>
              </p>
            </div>
          </div>

          {/* Physical Stock Counter & Steppers */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Hitungan Fisik Nyata (Hasil Cek Gudang)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActualStock((prev) => Math.max(0, prev - 1))}
                className="w-11 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center transition-colors focus:outline-none"
              >
                -1
              </button>
              <input
                type="number"
                min="0"
                required
                value={actualStock}
                onChange={(e) => setActualStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="flex-1 text-center font-display font-black text-2xl text-slate-900 bg-slate-50 border border-slate-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setActualStock((prev) => prev + 1)}
                className="w-11 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center transition-colors focus:outline-none"
              >
                +1
              </button>
            </div>

            {/* Quick adjust steppers */}
            <div className="flex gap-2 justify-center">
              {[-10, -5, +5, +10].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setActualStock((prev) => Math.max(0, prev + step))}
                  className="px-2.5 py-1 text-[11px] font-semibold font-mono bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors focus:outline-none"
                >
                  {step > 0 ? `+${step}` : step}
                </button>
              ))}
            </div>
          </div>

          {/* Discrepancy (Selisih) Status Badge */}
          <div
            className={`p-3 rounded-2xl border text-xs transition-all ${
              diff === 0
                ? 'bg-slate-50 border-slate-200 text-slate-600'
                : diff > 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                {diff > 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : diff < 0 ? (
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                )}
                <span>
                  {diff === 0 
                    ? 'Stok Sesuai (Tidak Ada Selisih)' 
                    : diff > 0 
                    ? 'Selisih Lebih (Surplus)' 
                    : 'Selisih Kurang (Defisit)'}
                </span>
              </span>
              <span className="font-mono text-sm font-black">
                {diff > 0 ? `+${diff}` : diff} Pcs
              </span>
            </div>
            <p className="text-[11px] mt-1 text-slate-500 font-sans leading-tight">
              {diff === 0
                ? 'Angka fisik dan sistem sama. Tidak ada mutasi koreksi yang akan dibuat.'
                : diff > 0
                ? `Sistem akan otomatis mencatat mutasi MASUK sebesar +${diff} Pcs agar stok sistem sesuai fisik.`
                : `Sistem akan otomatis mencatat mutasi KELUAR sebesar ${Math.abs(diff)} Pcs untuk menyamakan stok fisik.`}
            </p>
          </div>

          {/* Reason Category */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Kategori / Alasan Koreksi
            </label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="Hasil Fisik Stok Opname Rutin">Hasil Fisik Stok Opname Rutin</option>
              <option value="Barang Rusak / Kadaluarsa">Barang Rusak / Kadaluarsa</option>
              <option value="Koreksi Salah Input Transaksi Sebelumnya">Koreksi Salah Input Transaksi Sebelumnya</option>
              <option value="Barang Hilang / Selisih Gudang">Barang Hilang / Selisih Gudang</option>
              <option value="Ditemukan Barang Tak Tercatat">Ditemukan Barang Tak Tercatat</option>
              <option value="Penyesuaian Internal / Sample">Penyesuaian Internal / Sample</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Custom Note (Optional) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Catatan Detail (Opsional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Contoh: Ditemukan 2 botol pecah di rak A-02"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* PIC (Petugas Opname) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Petugas Pelaksana (PIC)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                placeholder="Contoh: Staff Gudang / Budi"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors focus:outline-none"
            >
              Batal
            </button>
            <button
              type="submit"
              className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors focus:outline-none shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan Opname</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
