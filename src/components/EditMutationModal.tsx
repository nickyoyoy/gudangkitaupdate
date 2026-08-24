import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Calendar, 
  Clock, 
  User, 
  Package, 
  Check, 
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { StockMutation, WarehouseItem } from '../types';

interface EditMutationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mutation: StockMutation | null;
  item?: WarehouseItem;
  onSave: (updatedMutation: StockMutation) => void;
}

export default function EditMutationModal({
  isOpen,
  onClose,
  mutation,
  item,
  onSave,
}: EditMutationModalProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [pic, setPic] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [reason, setReason] = useState<string>('Salah input jumlah sebelumnya');

  useEffect(() => {
    if (mutation) {
      setQuantity(mutation.quantity);
      setPic(mutation.pic.replace(/\s*\(Koreksi:.*?\)/, ''));
      setDate(mutation.date);
      setTime(mutation.time);
      setReason('Salah input jumlah sebelumnya');
    }
  }, [mutation]);

  if (!isOpen || !mutation) return null;

  const isMasuk = mutation.type === 'masuk';
  const oldQty = mutation.quantity;
  const currentWarehouseStock = item ? item.stock : 0;

  // Calculate the difference & resulting warehouse stock
  const qtyDiff = quantity - oldQty;
  const stockDelta = isMasuk ? qtyDiff : -qtyDiff;
  const newWarehouseStock = currentWarehouseStock + stockDelta;
  const isStockInvalid = newWarehouseStock < 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      alert('Jumlah quantity harus lebih dari 0.');
      return;
    }
    if (isStockInvalid) {
      alert('Koreksi tidak valid: stok gudang tidak boleh menjadi minus / negatif.');
      return;
    }
    if (!pic.trim()) {
      alert('Mohon isi nama PIC / Petugas.');
      return;
    }

    const updatedPic = reason.trim() 
      ? `${pic.trim()} (Koreksi: ${reason.trim()})` 
      : pic.trim();

    const updatedMutation: StockMutation = {
      ...mutation,
      quantity,
      pic: updatedPic,
      date: date || mutation.date,
      time: time || mutation.time,
    };

    onSave(updatedMutation);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-slate-800 border border-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 leading-tight">
                Koreksi Transaksi
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {mutation.id.replace('mut-', '#')}
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
          {/* Target Item Info Badge */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wide border ${
                    isMasuk
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {isMasuk ? (
                    <ArrowDownLeft className="w-3 h-3" />
                  ) : (
                    <ArrowUpRight className="w-3 h-3" />
                  )}
                  <span>{isMasuk ? 'BARANG MASUK' : 'BARANG KELUAR'}</span>
                </span>
              </div>
              <h4 className="font-display font-bold text-sm text-slate-800 truncate">
                {mutation.itemName}
              </h4>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                Stok Fisik Saat Ini
              </span>
              <span className="font-display font-black text-sm text-slate-700">
                {currentWarehouseStock} Pcs
              </span>
            </div>
          </div>

          {/* Quantity Edit with Quick Steppers */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Jumlah Quantity Riil
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="w-11 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center transition-colors focus:outline-none"
              >
                -1
              </button>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="flex-1 text-center font-display font-black text-lg text-slate-900 bg-slate-50 border border-slate-200 rounded-xl py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setQuantity((prev) => prev + 1)}
                className="w-11 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center transition-colors focus:outline-none"
              >
                +1
              </button>
            </div>
            
            {/* Quick +/- 10 steppers */}
            <div className="flex gap-2 justify-center">
              {[-10, -5, +5, +10].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev + step))}
                  className="px-2.5 py-1 text-[11px] font-semibold font-mono bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors focus:outline-none"
                >
                  {step > 0 ? `+${step}` : step}
                </button>
              ))}
            </div>
          </div>

          {/* Discrepancy & Stock Impact Calculation Preview */}
          <div
            className={`rounded-2xl p-3.5 border transition-all text-xs ${
              isStockInvalid
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : qtyDiff === 0
                ? 'bg-slate-50 border-slate-200 text-slate-600'
                : stockDelta > 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-indigo-50 border-indigo-200 text-indigo-900'
            }`}
          >
            <div className="flex items-center justify-between font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                {stockDelta > 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : stockDelta < 0 ? (
                  <TrendingDown className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Package className="w-4 h-4 text-slate-400" />
                )}
                <span>Simulasi Dampak Stok Gudang</span>
              </span>
              <span className="font-mono font-bold">
                {qtyDiff > 0 ? `+${qtyDiff}` : qtyDiff} Pcs (Mutasi)
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-black/5">
              <span>Stok saat ini: <strong>{currentWarehouseStock} Pcs</strong></span>
              <span className="font-bold">
                ➔ Menjadi: <span className="text-sm font-black underline">{newWarehouseStock} Pcs</span>
              </span>
            </div>

            {isStockInvalid && (
              <div className="flex items-center gap-1.5 mt-2 text-rose-600 font-bold text-[11px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Stok tidak mencukupi untuk koreksi keluar ini (stok menjadi {newWarehouseStock} Pcs).</span>
              </div>
            )}
          </div>

          {/* PIC (Petugas) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Nama PIC / Petugas
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
                placeholder="Contoh: Budi Santoso"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Reason / Alasan Koreksi */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Alasan Koreksi
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="Salah input jumlah sebelumnya">Salah input jumlah sebelumnya</option>
              <option value="Salah hitung fisik barang">Salah hitung fisik barang</option>
              <option value="Revisi nota / surat jalan">Revisi nota / surat jalan</option>
              <option value="Penyesuaian faktur penerimaan">Penyesuaian faktur penerimaan</option>
              <option value="Koreksi nama petugas / data">Koreksi nama petugas / data</option>
            </select>
          </div>

          {/* Date & Time fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Tanggal Transaksi
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Waktu (Jam)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="09:30"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
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
              disabled={isStockInvalid}
              className="py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors focus:outline-none shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Koreksi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
