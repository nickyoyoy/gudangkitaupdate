import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight, 
  PlusCircle,
  MinusCircle,
  Search,
  Filter,
  Calendar,
  Download
} from 'lucide-react';
import { WarehouseItem, StockMutation } from '../types';

interface SummaryTabProps {
  items: WarehouseItem[];
  mutations: StockMutation[];
  isReset?: boolean;
}

export default function SummaryTab({ items, mutations, isReset = false }: SummaryTabProps) {
  const [timeframe, setTimeframe] = useState<'harian' | 'bulanan'>('harian');
  const [categoryType, setCategoryType] = useState<'masuk' | 'keluar'>('masuk');
  const [hoveredIndex, setHoveredIndex] = useState<{ index: number; type: 'masuk' | 'keluar' } | null>(null);

  // Advanced Tracking & Reporting States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFlow, setSelectedFlow] = useState<'semua' | 'masuk' | 'keluar'>('semua');
  const [filterDate, setFilterDate] = useState<string>('semua');

  // 1. Calculate live mutation aggregates
  const liveMasuk = mutations.filter(m => m.type === 'masuk').reduce((sum, m) => sum + m.quantity, 0);
  const liveKeluar = mutations.filter(m => m.type === 'keluar').reduce((sum, m) => sum + m.quantity, 0);

  // 2. Adjust core indicators with live updates over realistic baselines
  const totalMasukBase = isReset ? 0 : (timeframe === 'harian' ? 1510 : 7820);
  const totalKeluarBase = isReset ? 0 : (timeframe === 'harian' ? 1284 : 6554);

  const totalMasuk = totalMasukBase + liveMasuk;
  const totalKeluar = totalKeluarBase + liveKeluar;
  const selisihNet = totalMasuk - totalKeluar;
  const totalAktivitas = totalMasuk + totalKeluar;

  // Helpers to get today's day & month for live interactive graph highlighting
  const getDayLabel = () => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return days[new Date().getDay()];
  };

  const getMonthLabel = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return months[new Date().getMonth()];
  };

  const currentDay = getDayLabel();
  const currentMonth = getMonthLabel();

  // Baseline comparing Masuk (Emerald) and Keluar (Blue)
  const dailyBase = [
    { label: 'Sen', masuk: isReset ? 0 : 165, keluar: isReset ? 0 : 142 },
    { label: 'Sel', masuk: isReset ? 0 : 110, keluar: isReset ? 0 : 98 },
    { label: 'Rab', masuk: isReset ? 0 : 250, keluar: isReset ? 0 : 210 },
    { label: 'Kam', masuk: isReset ? 0 : 160, keluar: isReset ? 0 : 165 },
    { label: 'Jum', masuk: isReset ? 0 : 180, keluar: isReset ? 0 : 130 },
    { label: 'Sab', masuk: isReset ? 0 : 85,  keluar: isReset ? 0 : 72 },
    { label: 'Min', masuk: isReset ? 0 : 115, keluar: isReset ? 0 : 95 },
  ];

  const monthlyBase = [
    { label: 'Jan', masuk: isReset ? 0 : 750,  keluar: isReset ? 0 : 640 },
    { label: 'Feb', masuk: isReset ? 0 : 1200, keluar: isReset ? 0 : 1040 },
    { label: 'Mar', masuk: isReset ? 0 : 980,  keluar: isReset ? 0 : 800 },
    { label: 'Apr', masuk: isReset ? 0 : 1610, keluar: isReset ? 0 : 1440 },
    { label: 'Mei', masuk: isReset ? 0 : 1380, keluar: isReset ? 0 : 1200 },
    { label: 'Jun', masuk: isReset ? 0 : 1150, keluar: isReset ? 0 : 960 },
    { label: 'Jul', masuk: isReset ? 0 : 1400, keluar: isReset ? 0 : 1280 },
  ];

  // Map to apply live inputs to today's column dynamically
  const dailyData = dailyBase.map((d) => {
    let m = d.masuk;
    let k = d.keluar;
    if (d.label === currentDay) {
      m += liveMasuk;
      k += liveKeluar;
    }
    const maxVal = isReset ? Math.max(10, liveMasuk, liveKeluar) : 280; // denominator to calculate visual heights
    return {
      label: d.label,
      masuk: m,
      keluar: k,
      heightM: m === 0 ? 0 : Math.min(100, Math.max(10, Math.round((m / maxVal) * 100))),
      heightK: k === 0 ? 0 : Math.min(100, Math.max(10, Math.round((k / maxVal) * 100))),
    };
  });

  const monthlyData = monthlyBase.map((d) => {
    let m = d.masuk;
    let k = d.keluar;
    if (d.label === currentMonth) {
      m += liveMasuk;
      k += liveKeluar;
    }
    const maxVal = isReset ? Math.max(50, liveMasuk, liveKeluar) : 1800;
    return {
      label: d.label,
      masuk: m,
      keluar: k,
      heightM: m === 0 ? 0 : Math.min(100, Math.max(10, Math.round((m / maxVal) * 100))),
      heightK: k === 0 ? 0 : Math.min(100, Math.max(10, Math.round((k / maxVal) * 100))),
    };
  });

  const currentChartData = timeframe === 'harian' ? dailyData : monthlyData;

  // 3. Category Data Calculation
  const categoriesMasukBase = [
    { name: 'Box 35 ML', cat: 'Kemasan', baseQty: isReset ? 0 : 420, color: 'bg-emerald-500' },
    { name: 'Bubble Wrap', cat: 'Proteksi', baseQty: isReset ? 0 : 250, color: 'bg-teal-500' },
    { name: 'Lakban Bening', cat: 'Perekat', baseQty: isReset ? 0 : 380, color: 'bg-emerald-650 bg-emerald-600' },
    { name: 'Plastik Polymail 20x30', cat: 'Kurir', baseQty: isReset ? 0 : 310, color: 'bg-sky-500' },
  ];

  const categoriesKeluarBase = [
    { name: 'Box 35 ML', cat: 'Kemasan', baseQty: isReset ? 0 : 320, color: 'bg-blue-500' },
    { name: 'Bubble Wrap', cat: 'Proteksi', baseQty: isReset ? 0 : 150, color: 'bg-indigo-500' },
    { name: 'Lakban Bening', cat: 'Perekat', baseQty: isReset ? 0 : 412, color: 'bg-blue-650 bg-blue-600' },
    { name: 'Fragile', cat: 'Sticker', baseQty: isReset ? 0 : 210, color: 'bg-rose-500' },
    { name: 'Box 10 ML', cat: 'Kemasan', baseQty: isReset ? 0 : 85, color: 'bg-blue-400' },
    { name: 'Plastik Polymail 20x30', cat: 'Kurir', baseQty: isReset ? 0 : 112, color: 'bg-sky-500' },
    { name: 'Plastik Polymail 30x40', cat: 'Kurir', baseQty: isReset ? 0 : 94, color: 'bg-sky-620 bg-sky-600' },
    { name: 'Sticker Warning', cat: 'Sticker', baseQty: isReset ? 0 : 188, color: 'bg-rose-450 bg-rose-400' },
  ];

  // Aggregate current live session mutation by item name
  const liveInboundMap: { [itemName: string]: number } = {};
  const liveOutboundMap: { [itemName: string]: number } = {};

  mutations.forEach((m) => {
    if (m.type === 'masuk') {
      liveInboundMap[m.itemName] = (liveInboundMap[m.itemName] || 0) + m.quantity;
    } else {
      liveOutboundMap[m.itemName] = (liveOutboundMap[m.itemName] || 0) + m.quantity;
    }
  });

  const processedMasuk = categoriesMasukBase.map((item) => {
    const qty = item.baseQty + (liveInboundMap[item.name] || 0);
    const maxDenom = isReset ? Math.max(10, ...Object.values(liveInboundMap)) : 500;
    const pct = qty === 0 ? 0 : Math.min(100, Math.round((qty / maxDenom) * 100));
    return { ...item, qty, pct };
  });

  const processedKeluar = categoriesKeluarBase.map((item) => {
    const qty = item.baseQty + (liveOutboundMap[item.name] || 0);
    const maxDenom = isReset ? Math.max(10, ...Object.values(liveOutboundMap)) : 500;
    const pct = qty === 0 ? 0 : Math.min(100, Math.round((qty / maxDenom) * 100));
    return { ...item, qty, pct };
  });

  const currentCategoryList = categoryType === 'masuk' ? processedMasuk : processedKeluar;

  // -------------------------------------------------------------
  // DATES TRACKING & EXPORTER IMPLEMENTATION
  // -------------------------------------------------------------
  
  // Format standard YYYY-MM-DD back to localization Indonesian
  const formatIndonesianDate = (dateString: string) => {
    try {
      const parsed = new Date(dateString);
      if (isNaN(parsed.getTime())) return dateString;
      return parsed.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Find unique dates from user mutations list to populate filters
  const uniqueDates = Array.from(new Set(mutations.map(m => m.date))).sort((a, b) => b.localeCompare(a));

  // Filter mutations based on active selections
  const filteredMutations = mutations.filter(m => {
    const matchesSearch = 
      m.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (m.pic && m.pic.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedFlow === 'semua' ? true : m.type === selectedFlow;
    const matchesDate = filterDate === 'semua' ? true : m.date === filterDate;

    return matchesSearch && matchesType && matchesDate;
  });

  // Group filtered results by Date for clean structural report dividers
  const groupedMutationsByDate: { [date: string]: StockMutation[] } = {};
  filteredMutations.forEach(m => {
    if (!groupedMutationsByDate[m.date]) {
      groupedMutationsByDate[m.date] = [];
    }
    groupedMutationsByDate[m.date].push(m);
  });

  // Sort dates descending
  const sortedDateKeys = Object.keys(groupedMutationsByDate).sort((a, b) => b.localeCompare(a));

  // Real Client-Side XLSX Exporter Engine
  const handleExportXLSX = () => {
    if (filteredMutations.length === 0) {
      alert('Maaf, tidak ada data laporan yang cocok dengan filter Anda untuk diunduh.');
      return;
    }

    // Transform mutations list into a neat list of objects for the Excel sheet
    const formattedData = filteredMutations.map((m, idx) => {
      const isMasuk = m.type === 'masuk';
      return {
        'No': idx + 1,
        'Tanggal': m.date,
        'Waktu': m.time,
        'Nama Barang': m.itemName,
        'Arus Barang': isMasuk ? 'Pemasukan (Masuk)' : 'Pengeluaran (Keluar)',
        'Jumlah (Pcs)': m.quantity,
        'Petugas (PIC)': m.pic || 'Admin'
      };
    });

    // Create a new Excel worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Apply auto-fit or standardized column widths for perfect presentation
    worksheet['!cols'] = [
      { wch: 6 },   // No
      { wch: 15 },  // Tanggal
      { wch: 10 },  // Waktu
      { wch: 32 },  // Nama Barang
      { wch: 24 },  // Arus Barang
      { wch: 15 },  // Jumlah (Pcs)
      { wch: 22 }   // Petugas (PIC)
    ];

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Mutasi');

    // Trigger the actual XLSX file download
    const fileName = `Laporan_Mutasi_GudangKita_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-6">
      {/* Timeframe switch controller */}
      <section className="flex justify-center select-none">
        <div className="bg-slate-200/60 p-1 rounded-full w-full max-w-sm flex border border-slate-100">
          <button
            onClick={() => setTimeframe('harian')}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-300 focus:outline-none ${
              timeframe === 'harian'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Harian
          </button>
          <button
            onClick={() => setTimeframe('bulanan')}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-300 focus:outline-none ${
              timeframe === 'bulanan'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Bulanan
          </button>
        </div>
      </section>

      {/* Grid of Key Performance Indicators (including Pemasukan & Pengeluaran) */}
      <section className="grid grid-cols-2 gap-4">
        
        {/* KPI 1: TOTAL PEMASUKAN */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between h-32 hover:shadow-md transition-all">
          <div className="flex justify-between items-start select-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">
              Pemasukan (Masuk)
            </span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-black text-emerald-600">
                {totalMasuk.toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] font-bold text-slate-400 font-sans">Pcs</span>
            </div>
            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
              <span>+15% dari target</span>
            </p>
          </div>
        </div>

        {/* KPI 2: TOTAL PENGELUARAN */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between h-32 hover:shadow-md transition-all">
          <div className="flex justify-between items-start select-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">
              Pengeluaran (Keluar)
            </span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-black text-blue-600">
                {totalKeluar.toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] font-bold text-slate-400 font-sans">Pcs</span>
            </div>
            <p className="text-[10px] text-emerald-600 font-bold">
              <span>Optimasi +12%</span>
            </p>
          </div>
        </div>
      </section>

      {/* Side-by-Side Inbound & Outbound Activity Graph */}
      <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="font-display font-bold text-base text-slate-800">Perbandingan Arus Barang</h2>
            <p className="text-xs text-slate-400 select-none">
              {timeframe === 'harian' ? '7 Hari Terakhir' : '6 Bulan Terakhir'} • Masuk vs Keluar
            </p>
          </div>
          {/* Detailed Legend */}
          <div className="flex items-center gap-3 text-[10px] font-bold select-none">
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs block"></span> Masuk
            </span>
            <span className="flex items-center gap-1 text-blue-600">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-xs block"></span> Keluar
            </span>
          </div>
        </div>

        {/* Dynamic double-column bar chart with micro-tooltips */}
        <div className="h-44 flex items-end justify-between gap-1 px-1 pt-6 pb-2 select-none relative">
          {currentChartData.map((bar, index) => {
            const isMasukHovered = hoveredIndex?.index === index && hoveredIndex?.type === 'masuk';
            const isKeluarHovered = hoveredIndex?.index === index && hoveredIndex?.type === 'keluar';

            return (
              <div
                key={bar.label}
                className="flex flex-col items-center flex-1 gap-2 relative"
              >
                {/* Visual grouping of dual bars */}
                <div className="w-full h-32 flex items-end justify-center gap-1 sm:gap-1.5">
                  
                  {/* BAR 1: MASUK (Pemasukan) - Emerald Theme */}
                  <div 
                    className="flex-1 max-w-[12px] sm:max-w-[16px] relative h-full flex items-end group/bar cursor-pointer"
                    onMouseEnter={() => setHoveredIndex({ index, type: 'masuk' })}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {isMasukHovered && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono font-bold px-2.5 py-1.5 rounded-lg shadow-lg z-30 whitespace-nowrap">
                        <span className="text-emerald-400 mr-1">Masuk ({bar.label}):</span>
                        <span>{bar.masuk.toLocaleString('id-ID')} Pcs</span>
                      </div>
                    )}
                    <div 
                      className="w-full bg-emerald-500/15 group-hover/bar:bg-emerald-500/25 rounded-t-sm transition-all duration-300 relative overflow-hidden"
                      style={{ height: `${bar.heightM}%` }}
                    >
                      <div 
                        className={`absolute bottom-0 left-0 w-full bg-emerald-500 transition-all ${
                          isMasukHovered ? 'h-full opacity-100 font-black' : 'h-3/5 opacity-80'
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* BAR 2: KELUAR (Pengeluaran) - Blue Theme */}
                  <div 
                    className="flex-1 max-w-[12px] sm:max-w-[16px] relative h-full flex items-end group/bar cursor-pointer"
                    onMouseEnter={() => setHoveredIndex({ index, type: 'keluar' })}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {isKeluarHovered && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono font-bold px-2.5 py-1.5 rounded-lg shadow-lg z-30 whitespace-nowrap">
                        <span className="text-blue-400 mr-1">Keluar ({bar.label}):</span>
                        <span>{bar.keluar.toLocaleString('id-ID')} Pcs</span>
                      </div>
                    )}
                    <div 
                      className="w-full bg-blue-500/15 group-hover/bar:bg-blue-500/25 rounded-t-sm transition-all duration-300 relative overflow-hidden"
                      style={{ height: `${bar.heightK}%` }}
                    >
                      <div 
                        className={`absolute bottom-0 left-0 w-full bg-blue-600 transition-all ${
                          isKeluarHovered ? 'h-full opacity-100 font-black' : 'h-3/5 opacity-80'
                        }`}
                      ></div>
                    </div>
                  </div>

                </div>

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{bar.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* NEW: Date-by-Date Detailed Report and Real-Time Exporter Section */}
      <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="font-display font-bold text-base text-slate-800">Laporan Mutasi Pertanggal</h2>
            <p className="text-xs text-slate-400">
              Tracking detail pemasukan & pengeluaran untuk pembukuan dan laporan bulanan
            </p>
          </div>
          
          <button
            onClick={handleExportXLSX}
            className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-150 shrink-0"
            title="Download Laporan ke File Excel (XLSX)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor XLSX Laporan</span>
          </button>
        </div>

        {/* Dynamic State Search & Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
          {/* Item / PIC Text Search block */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Cari barang atau PIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:border-blue-500 text-slate-700"
            />
          </div>

          {/* Flow Type selector filter dropdown */}
          <div className="flex gap-2">
            <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex items-center shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <select
              value={selectedFlow}
              onChange={(e) => setSelectedFlow(e.target.value as any)}
              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs focus:outline-none text-slate-700"
            >
              <option value="semua">Semua Arus Barang</option>
              <option value="masuk">Pemasukan (Masuk)</option>
              <option value="keluar">Pengeluaran (Keluar)</option>
            </select>
          </div>

          {/* Date Picker select dropdown */}
          <div className="flex gap-2">
            <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex items-center shrink-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs focus:outline-none text-slate-700"
            >
              <option value="semua">Semua Tanggal</option>
              {uniqueDates.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mutasi List Grouped by Date */}
        {sortedDateKeys.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400">
            <p className="text-sm font-semibold select-none">Tidak ada data aktivitas yang cocok</p>
            <p className="text-xs mt-1 select-none">Coba sesuaikan kata pencarian atau bersihkan filter di atas.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {sortedDateKeys.map(dateKey => {
              const dateMutations = groupedMutationsByDate[dateKey];
              const dateIn = dateMutations.filter(m => m.type === 'masuk').reduce((sum, m) => sum + m.quantity, 0);
              const dateOut = dateMutations.filter(m => m.type === 'keluar').reduce((sum, m) => sum + m.quantity, 0);

              return (
                <div key={dateKey} className="space-y-2.5">
                  {/* Subtle Date Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-slate-50/70 p-2.5 rounded-lg border border-slate-150/40 select-none">
                    <span className="font-display text-xs font-bold text-slate-700">
                      📅 {formatIndonesianDate(dateKey)}
                    </span>
                    <div className="text-[10px] font-bold space-x-2.5 font-mono">
                      {dateIn > 0 && <span className="text-emerald-600">Total Masuk: +{dateIn} Pcs</span>}
                      {dateOut > 0 && <span className="text-blue-600">Total Keluar: -{dateOut} Pcs</span>}
                    </div>
                  </div>

                  {/* Date Grid Transactions */}
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-white">
                    {dateMutations.map(m => {
                      const isMasuk = m.type === 'masuk';
                      return (
                        <div key={m.id} className="flex items-center justify-between p-3.5 hover:bg-slate-50/40 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Direction Tag icon */}
                            <span className={`p-1.5 rounded-lg shrink-0 ${isMasuk ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                              {isMasuk ? <PlusCircle className="w-3.5 h-3.5" /> : <MinusCircle className="w-3.5 h-3.5" />}
                            </span>

                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-800 truncate leading-tight">
                                {m.itemName}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                                PIC: {m.pic || 'Admin'} • Jam: {m.time}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`text-xs font-bold font-mono ${isMasuk ? 'text-emerald-600' : 'text-blue-600'}`}>
                              {isMasuk ? '+' : '-'}{m.quantity} Pcs
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Dynamic Category Breakdowns per Flow Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display font-bold text-sm text-slate-800 select-none">
            Breakdown Kategori Barang
          </h2>
          {/* Segment Toggle */}
          <div className="bg-slate-100 p-0.5 rounded-lg flex border border-slate-200 select-none">
            <button
              onClick={() => setCategoryType('masuk')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all focus:outline-none ${
                categoryType === 'masuk'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pemasukan
            </button>
            <button
              onClick={() => setCategoryType('keluar')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all focus:outline-none ${
                categoryType === 'keluar'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pengeluaran
            </button>
          </div>
        </div>

        {/* Dynamic Category Items List */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-slate-100">
          <div className="divide-y divide-slate-100">
            {currentCategoryList.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    categoryType === 'masuk' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <Package className="w-5 h-5 shrink-0 opacity-85" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-sm text-slate-800 truncate">
                      {item.name}
                    </h3>
                  </div>
                </div>

                {/* Percentage details display */}
                <div className="text-right shrink-0 pl-3">
                  <p className={`text-xs font-bold font-mono ${categoryType === 'masuk' ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {item.qty.toLocaleString('id-ID')}{' '}
                    <span className="text-[10px] font-normal text-slate-400 uppercase font-sans">Pcs</span>
                  </p>
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden border border-slate-200/30">
                    <div 
                      className={`${item.color} h-full rounded-full transition-all duration-500`} 
                      style={{ width: `${item.pct}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

