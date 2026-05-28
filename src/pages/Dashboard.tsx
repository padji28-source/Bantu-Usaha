import React, { useMemo } from 'react';
import { useStore, ThemeName } from '../store/StoreContext';
import { themeMap } from '../lib/theme';
import { formatCurrency, formatDate } from '../lib/utils';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, ShoppingBag, Palette, ArrowUpRight, Scale, Activity, History } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const { products, materials, sales, expenses, priceLogs, theme, setTheme } = useStore();
  const currentTheme = themeMap[theme] || themeMap.blue;

  // 1. Business performance summary
  const summary = useMemo(() => {
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalCOGS = sales.reduce((sum, s) => sum + s.totalCOGS, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalCOGS - totalExpenses;
    
    const lowStockItems = products.filter(p => p.stock <= 5);
    const salesCount = sales.length;

    return { totalRevenue, netProfit, lowStockItems, salesCount };
  }, [products, sales, expenses]);

  // 2. Top 10 Bahan Baku Termahal (Slide 8/9 requirement)
  const top10Materials = useMemo(() => {
    return [...materials]
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);
  }, [materials]);

  // 3. Fallback Pricing Trend Data for Chart
  const trendData = useMemo(() => {
    // Generate some historical logs if empty for visual polish
    const logs = priceLogs.length > 0 ? [...priceLogs] : [
      { id: '1', productName: 'Ice Americano', oldSellingPrice: 12000, newSellingPrice: 15000, date: '2026-05-18T10:00:00Z', reason: 'Penyesuaian Pasar' },
      { id: '2', productName: 'Kopi Susu Gula Aren', oldSellingPrice: 16000, newSellingPrice: 18000, date: '2026-05-22T14:30:00Z', reason: 'Kenaikan Bahan Baku Mandiri' },
      { id: '3', productName: 'Cokelat Premium Latte', oldSellingPrice: 18000, newSellingPrice: 18500, date: '2026-05-25T11:00:00Z', reason: 'Overhead Gaji Naik' },
    ];

    return logs.map(l => ({
      name: l.productName,
      date: formatDate(l.date),
      sebelum: l.oldSellingPrice,
      sesudah: l.newSellingPrice
    })).reverse();
  }, [priceLogs]);

  // 4. Availabe themes (Slide 9 - " tinggal klik semua warna berubah")
  const supportedThemes: { id: ThemeName; color: string; label: string }[] = [
    { id: 'blue', color: 'bg-blue-600', label: 'Ocean Blue' },
    { id: 'green', color: 'bg-emerald-600', label: 'Emerald Mint' },
    { id: 'purple', color: 'bg-purple-600', label: 'Sunset Violet' },
    { id: 'orange', color: 'bg-orange-500', label: 'Retro Orange' },
    { id: 'brown', color: 'bg-amber-800', label: 'Coffee Latte' },
    { id: 'dark', color: 'bg-slate-900', label: 'Slate Stealth' },
    { id: 'neon', color: 'bg-fuchsia-600', label: 'Cyberpunk Neon' },
    { id: 'red', color: 'bg-rose-600', label: 'Crimson Rose' },
  ];

  return (
    <div className="space-y-6">
      {/* Dynamic Welcome Heading */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-150 pb-5">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Dashboard Utama Kendali Penuh</h2>
          <p className="text-gray-500 text-sm mt-1">Cek Cost Bahan Baku termahal, trend harga, & kelola laba rugi instan</p>
        </div>

        {/* Dynamic theme customize selector (Slide 9) */}
        <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-xs flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <Palette className={`w-4 h-4 ${currentTheme.text} animate-pulse`} />
            <span className="text-xs font-bold text-gray-700">Tema Aktif:</span>
          </div>

          <div className="flex items-center space-x-1.5 border-l border-gray-200 pl-3">
            {supportedThemes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`w-6 h-6 rounded-full cursor-pointer transition-all hover:scale-115 flex items-center justify-center ${t.color} ${
                  theme === t.id 
                    ? 'ring-2 ring-offset-2 ring-gray-900 p-0.5 scale-110' 
                    : 'opacity-80 hover:opacity-100'
                }`}
                title={t.label}
              >
                {theme === t.id && (
                  <span className="w-1.5 h-1.5 bg-white rounded-full inline-block"></span>
                )}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 uppercase">
            {currentTheme.name}
          </span>
        </div>
      </div>

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-500 text-xs uppercase tracking-wide">Total Pendapatan</h3>
            <div className={`p-2.5 rounded-xl ${currentTheme.light} ${currentTheme.text}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 font-mono tracking-tight">{formatCurrency(summary.totalRevenue)}</p>
            <span className="text-[10px] text-gray-400 font-medium block mt-1">Akumulasi POS Penjualan</span>
          </div>
        </div>

        {/* Profit Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-500 text-xs uppercase tracking-wide">Laba Bersih</h3>
            <div className={`p-2.5 rounded-xl ${summary.netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-650'}`}>
              {summary.netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div>
            <p className={`text-2xl font-black font-mono tracking-tight ${summary.netProfit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {formatCurrency(summary.netProfit)}
            </p>
            <span className="text-[10px] text-gray-400 font-medium block mt-1">Dikurangi HPP & Biaya Bulanan</span>
          </div>
        </div>

        {/* Total Sales Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-500 text-xs uppercase tracking-wide">Volume Penjualan</h3>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 font-mono tracking-tight">{summary.salesCount} Transaksi</p>
            <span className="text-[10px] text-gray-400 font-medium block mt-1">Menu pesanan yang keluar</span>
          </div>
        </div>

        {/* Total Materials Count Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-500 text-xs uppercase tracking-wide">Total Jenis Bahan</h3>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 font-mono tracking-tight">{materials.length} Raw Bahan</p>
            <span className="text-[10px] text-gray-400 font-medium block mt-1">Garis modal mentah usaha</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Top 10 Bahan Baku Termahal (Slide 8/9 requirement) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-850 text-sm uppercase tracking-wide flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-red-650 rounded-full inline-block animate-pulse"></span>
                <span>Top 10 Bahan Baku Termahal</span>
              </h3>
              <span className="text-[10px] text-gray-400 font-bold">Biaya Modal Terbesar</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                    <th className="px-5 py-3">Nama Bahan</th>
                    <th className="px-5 py-3 text-center">Tipe</th>
                    <th className="px-5 py-3">Batas Kemasan</th>
                    <th className="px-5 py-3 text-right">Harga Modal Beli</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {top10Materials.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-gray-400">
                        Belum ada data bahan baku terdaftar.
                      </td>
                    </tr>
                  ) : (
                    top10Materials.map((mat, idx) => (
                      <tr key={mat.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 font-bold text-gray-900 flex items-center space-x-2">
                          <span className="text-[10px] text-gray-400 font-mono">#{idx+1}</span>
                          <span>{mat.name}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            mat.type === 'Bahan' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            {mat.type}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500">
                          {mat.volume} {mat.unit}
                        </td>
                        <td className="px-5 py-3 text-right font-black font-mono text-gray-900">
                          {formatCurrency(mat.cost)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-500">
            📊 **Analisis Cost:** Selalu perhatikan fluktuasi bahan teratas. Penaikan tipis pada komponen teratas bisa memangkas margin kotor menu resep Anda secara drastis!
          </div>
        </div>

        {/* Pricing Shifting Trend Charts (Slide 8 - "trend harga instant") */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-850 text-sm uppercase tracking-wide flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span>Trend Harga Jual Keluar</span>
            </h3>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">
              Rekam Jejak Terakhir
            </span>
          </div>

          {/* Line Chart */}
          <div className="h-56 w-full text-xs font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }} 
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="sebelum" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorPrev)" name="Harga Lama" />
                <Area type="monotone" dataKey="sesudah" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorNew)" name="Harga Baru" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pricing shifting logs audit trail list */}
          <div className="space-y-2 border-t border-gray-150 pt-3">
            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block flex items-center space-x-1">
              <History className="w-3.5 h-3.5" />
              <span>Log Mutasi Audit Harga Terbaru</span>
            </span>

            <div className="max-h-[110px] overflow-y-auto space-y-1.5 pr-1">
              {priceLogs.length === 0 ? (
                <div className="text-center py-4 bg-gray-55/40 text-[11px] text-gray-400 rounded-xl">
                  Belum ada mutasi harga produk yang terekam.
                </div>
              ) : (
                priceLogs.slice(0, 3).map((log) => (
                  <div key={log.id} className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-[11px] flex justify-between items-start gap-3">
                    <div className="truncate">
                      <span className="font-bold text-gray-900 block truncate">{log.productName}</span>
                      <span className="text-[10px] text-gray-400 font-medium block truncate">{log.reason}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center space-x-1 font-bold text-gray-800">
                        <span className="text-gray-400 line-through">{formatCurrency(log.oldSellingPrice)}</span>
                        <span>→</span>
                        <span className="text-blue-600">{formatCurrency(log.newSellingPrice)}</span>
                      </div>
                      <span className="text-[9px] text-gray-400 font-mono block mt-0.5">{formatDate(log.date)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
