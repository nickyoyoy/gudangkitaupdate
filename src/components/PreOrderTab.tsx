import React, { useState } from 'react';
import { Search, Plus, Calendar, RotateCcw, Check, Clock, AlertCircle, History, Package, X, ArrowUpRight, Trash2 } from 'lucide-react';
import { WarehouseItem, PreOrder, StockMutation, UserSession } from '../types';

interface PreOrderTabProps {
  items: WarehouseItem[];
  preOrders: PreOrder[];
  onAddPreOrder: (newPo: PreOrder) => void;
  onReceiveItems: (poId: string, receivedQty: number, pic: string) => void;
  onDeletePreOrder: (poId: string) => void;
  currentUser?: UserSession | null;
}

const VENDORS = [
  'Mury Rizky',
  'Megawaty',
  'Hara Plasindo',
  'H&D',
  'PT.Karya Generasi Biru'
];

export default function PreOrderTab({ 
  items, 
  preOrders, 
  onAddPreOrder, 
  onReceiveItems, 
  onDeletePreOrder,
  currentUser = null
}: PreOrderTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Pending' | 'Partial' | 'Complete'>('Semua');
  const [expandedPoId, setExpandedPoId] = useState<string | null>(null);

  // Manage New PO modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPoItem, setNewPoItem] = useState('');
  const [newPoCode, setNewPoCode] = useState('');
  const [newPoQty, setNewPoQty] = useState('');
  const [newPoVendor, setNewPoVendor] = useState('Mury Rizky');

  // Receive items dialog state
  const [receivePoId, setReceivePoId] = useState<string | null>(null);
  const [receiveQty, setReceiveQty] = useState('');
  const [receivePic, setReceivePic] = useState(currentUser?.name || 'Staff Penerimaan');

  // Delete PO dialog state
  const [deletePoId, setDeletePoId] = useState<string | null>(null);

  // Dynamic calculations
  const activePreOrdersCount = preOrders.filter((po) => po.status !== 'Complete').length;
  const totalMenungguMasuk = preOrders
    .filter((po) => po.status !== 'Complete')
    .reduce((sum, po) => sum + (po.totalQty - po.receivedQty), 0);

  // Filter list
  const filteredPreOrders = preOrders.filter((po) => {
    const matchesSearch =
      po.itemName.toLowerCase().includes(search.toLowerCase()) ||
      po.poCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenReceive = (poId: string) => {
    const po = preOrders.find((p) => p.id === poId);
    if (po) {
      setReceivePoId(poId);
      // pre-fill remaining quantity
      setReceiveQty((po.totalQty - po.receivedQty).toString());
      setReceivePic(currentUser?.name || 'Staff Penerimaan');
    }
  };

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivePoId || !receiveQty) return;

    const qtyNumber = parseInt(receiveQty, 10);
    if (isNaN(qtyNumber) || qtyNumber <= 0) {
      alert('Jumlah penerimaan harus bernilai positif!');
      return;
    }

    const po = preOrders.find((p) => p.id === receivePoId);
    if (!po) return;

    const remaining = po.totalQty - po.receivedQty;
    if (qtyNumber > remaining) {
      alert(`Jumlah penerimaan (${qtyNumber} Pcs) tidak boleh melebihi sisa PO (${remaining} Pcs)!`);
      return;
    }

    onReceiveItems(receivePoId, qtyNumber, receivePic);
    setReceivePoId(null);
    setReceiveQty('');
    alert('Barang pre-order berhasil masuk inventaris gudang!');
  };

  const handleCreatePo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoItem || !newPoCode || !newPoQty) {
      alert('Semua baris Isian harus dilengkapi!');
      return;
    }

    const qtyNumber = parseInt(newPoQty, 10);
    if (isNaN(qtyNumber) || qtyNumber <= 0) {
      alert('Jumlah unit harus bernilai positif!');
      return;
    }

    const selectedItem = items.find((itm) => itm.id === newPoItem);
    if (!selectedItem) return;

    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    onAddPreOrder({
      id: `po-${Date.now()}`,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      poCode: newPoCode,
      orderDate: dateStr,
      totalQty: qtyNumber,
      receivedQty: 0,
      status: 'Pending',
      receivingHistory: [],
      vendor: newPoVendor || 'Mury Rizky',
    });

    setShowAddModal(false);
    setNewPoItem('');
    setNewPoCode('');
    setNewPoQty('');
    setNewPoVendor('Mury Rizky');
    alert(`Pre-order ${newPoCode} berhasil dibuat!`);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Section */}
      <section className="w-full space-y-3">
        <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase px-0.5 select-none">
          Cari atau Filter Pre Order
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-5 h-5 opacity-75" />
          </span>
          <input
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            placeholder="Cari PO berdasarkan item atau ID..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {/* Stats Summary Panel */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-blue-100 uppercase tracking-widest leading-none mb-2 select-none">
            Total PO Aktif
          </span>
          <span className="font-display text-2xl font-black">{activePreOrdersCount}</span>
        </div>
        <div className="bg-slate-100 p-4 rounded-2xl text-slate-800 shadow-sm border border-slate-200/50 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-2 select-none">
            Menunggu Masuk
          </span>
          <span className="font-display text-2xl font-black text-blue-600">
            {totalMenungguMasuk.toLocaleString('id-ID')}{' '}
            <span className="text-xs font-normal text-slate-400 font-sans">Pcs</span>
          </span>
        </div>
      </section>

      {/* PO List Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-sm font-bold text-slate-800">Riwayat Pre Order</h2>
        <div className="flex gap-1.5 items-center bg-white border border-slate-200 rounded-xl p-1 text-xs font-semibold text-slate-600 select-none">
          <span className="text-[10px] uppercase text-slate-400 px-1 font-bold">Filter:</span>
          {['Semua', 'Pending', 'Partial', 'Complete'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st as any)}
              className={`px-2 py-1 rounded-lg transition-colors focus:outline-none ${
                statusFilter === st ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Pre Order Cards List */}
      <div className="flex flex-col gap-4">
        {filteredPreOrders.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-150 text-slate-400 text-sm">
            Belum ada PO dengan kriteria pencarian ini.
          </div>
        ) : (
          filteredPreOrders.map((po) => {
            const isPending = po.status === 'Pending';
            const isPartial = po.status === 'Partial';
            const isComplete = po.status === 'Complete';

            const remainingQty = po.totalQty - po.receivedQty;
            const progressPct = po.totalQty > 0 ? (po.receivedQty / po.totalQty) * 100 : 0;

            const isExpanded = expandedPoId === po.id;

            return (
              <div
                key={po.id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4 hover:shadow-md transition-all"
              >
                {/* Header card row */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 font-display leading-tight">
                      {po.itemName}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-sans">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{po.poCode} • {po.orderDate}</span>
                    </p>
                    {po.vendor && (
                      <p className="text-xs text-indigo-600 font-bold mt-1.5 font-sans flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0 animate-pulse"></span>
                        <span>Vendor: <span className="bg-indigo-50/75 px-1.5 py-0.5 rounded text-indigo-700 font-bold font-sans">{po.vendor}</span></span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isComplete
                          ? 'bg-emerald-100 text-emerald-700'
                          : isPartial
                          ? 'bg-indigo-150 bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {po.status}
                    </span>
                    <button
                      onClick={() => setDeletePoId(po.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none"
                      title="Hapus Pre Order"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Grid Columns */}
                <div className="grid grid-cols-3 gap-2 py-1 text-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wilder mb-0.5 select-none">
                      Total PO
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {po.totalQty.toLocaleString('id-ID')} <span className="text-[9px] font-normal text-slate-400">Pcs</span>
                    </span>
                  </div>
                  <div className="flex flex-col border-x border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wilder mb-0.5 select-none">
                      Diterima
                    </span>
                    <span className="text-xs font-bold text-emerald-600">
                      {po.receivedQty.toLocaleString('id-ID')} <span className="text-[9px] font-normal text-slate-400">Pcs</span>
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wilder mb-0.5 select-none">
                      Sisa PO
                    </span>
                    <span className={`text-xs font-bold ${remainingQty > 0 ? 'text-rose-600 font-extrabold' : 'text-slate-400'}`}>
                      {remainingQty.toLocaleString('id-ID')} <span className="text-[9px] font-normal text-slate-400">Pcs</span>
                    </span>
                  </div>
                </div>

                {/* Progression Bar Layout */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/55">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isComplete ? 'bg-emerald-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-end select-none">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {isComplete ? '100% Selesai' : `${Math.round(progressPct)}% Terpenuhi`}
                    </span>
                  </div>
                </div>

                {/* Receiving History Accordion details */}
                {po.receivingHistory.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Riwayat Penerimaan</span>
                      <button
                        onClick={() => setExpandedPoId(isExpanded ? null : po.id)}
                        className="flex items-center gap-1.5 text-blue-600 text-xs font-bold hover:underline focus:outline-none"
                      >
                        <History className="w-3.5 h-3.5 shrink-0" />
                        <span>{isExpanded ? 'Sembunyikan' : 'Lihat Riwayat'}</span>
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                        {po.receivingHistory.map((rh, idx) => (
                          <div
                            key={rh.id}
                            className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center text-xs"
                          >
                            <span className="text-slate-500">Penerimaan {idx + 1}: {rh.date}</span>
                            <span className="font-mono font-bold text-slate-800">
                              +{rh.qty.toLocaleString('id-ID')} Pcs
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Card Actions */}
                {!isComplete && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleOpenReceive(po.id)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-all focus:outline-none shadow-sm"
                    >
                      <Plus className="w-4 h-4 shrink-0" />
                      <span>Terima Barang</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Primary Pre-Order Creator FAB Action button */}
      {currentUser?.role === 'admin' && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-24 right-5 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-transform z-40 focus:outline-none uppercase font-bold text-xs gap-1"
          title="Create New Pre Order"
        >
          <Plus className="w-6 h-6 shrink-0" />
        </button>
      )}

      {/* Floating Modal: Register New PO */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-display text-base font-bold text-slate-800">Buat Pre Order Baru</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-4">
              {/* Select Item */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Barang Inventaris</label>
                <select
                  value={newPoItem}
                  onChange={(e) => setNewPoItem(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  <option value="" disabled>Pilih item dari daftar...</option>
                  {items.map((itm) => (
                    <option key={itm.id} value={itm.id}>
                      {itm.name} (SKU: {itm.sku})
                    </option>
                  ))}
                </select>
              </div>

              {/* PO Code */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Kode PO / Doc ID</label>
                <input
                  type="text"
                  placeholder="e.g. PO-2026-1042"
                  value={newPoCode}
                  onChange={(e) => setNewPoCode(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Jumlah PO (Pcs)</label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  value={newPoQty}
                  onChange={(e) => setNewPoQty(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Vendor Select Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Vendor</label>
                <select
                  value={newPoVendor}
                  onChange={(e) => setNewPoVendor(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  {VENDORS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 focus:outline-none"
                >
                  <ArrowUpRight className="w-5 h-5 shrink-0" />
                  <span>Submit Pre Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Dialog: Receive items */}
      {receivePoId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-in zoom-in-95 duration-250">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-display text-base font-bold text-slate-800">Catat Penerimaan Barang</h3>
              <button
                onClick={() => setReceivePoId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveSubmit} className="space-y-4">
              <p className="text-xs text-slate-500 leading-normal">
                Penerimaan barang dari PO ini akan menambah stok fisik barang di gudang secara otomatis dan dicatat dalam aktivitas mutasi terbaru.
              </p>

              {/* Received quantity */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Jumlah yang Diterima (Pcs)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={receiveQty}
                  onChange={(e) => setReceiveQty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-400 block px-0.5">
                  Sisa yang belum diterima:{' '}
                  {preOrders.find((p) => p.id === receivePoId)
                    ? (preOrders.find((p) => p.id === receivePoId)!.totalQty -
                       preOrders.find((p) => p.id === receivePoId)!.receivedQty).toLocaleString('id-ID')
                    : 0}{' '}
                  Pcs
                </span>
              </div>

              {/* PIC */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Petugas Penerimaan (PIC)</label>
                <input
                  type="text"
                  required
                  value={receivePic}
                  onChange={(e) => setReceivePic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 focus:outline-none"
                >
                  <Check className="w-5 h-5 shrink-0" />
                  <span>Konfirmasi Terima</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Dialog: Confirm Delete Pre Order */}
      {deletePoId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-in zoom-in-95 duration-250">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
              <h3 className="font-display text-base font-bold text-red-600 flex items-center gap-1.5">
                <Trash2 className="w-5 h-5 text-red-500" />
                <span>Konfirmasi Hapus PO</span>
              </h3>
              <button
                onClick={() => setDeletePoId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-normal">
                Apakah Anda yakin ingin menghapus Pre Order ini? Tindakan ini tidak dapat dibatalkan dan data po akan dihapus permanen dari sistem.
              </p>

              {(() => {
                const targetPo = preOrders.find((p) => p.id === deletePoId);
                if (!targetPo) return null;
                return (
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-slate-700 space-y-1 font-sans">
                    <p><strong>Item:</strong> {targetPo.itemName}</p>
                    <p><strong>Kode PO:</strong> {targetPo.poCode}</p>
                    {targetPo.vendor && <p><strong>Vendor:</strong> {targetPo.vendor}</p>}
                    <p><strong>Jumlah:</strong> {targetPo.totalQty.toLocaleString('id-ID')} Pcs</p>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletePoId(null)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors focus:outline-none text-center"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeletePreOrder(deletePoId);
                    setDeletePoId(null);
                  }}
                  className="py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors focus:outline-none flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Hapus PO</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
