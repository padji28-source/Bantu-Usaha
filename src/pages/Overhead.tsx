import React, { useState } from 'react';
import { useStore, OverheadCategory } from '../store/StoreContext';
import { themeMap } from '../lib/theme';
import { formatCurrency } from '../lib/utils';
import { Plus, Trash2, Edit2, Check, Calculator, Info, Landmark, Lightbulb, UserCheck, ShieldClose } from 'lucide-react';

export default function Overhead() {
  const { overhead, theme, updateOverhead } = useStore();
  const currentTheme = themeMap[theme] || themeMap.blue;

  // Local copy for direct editing
  const [targetSales, setTargetSales] = useState<number>(overhead.targetSalesPerMonth);
  const [categories, setCategories] = useState<OverheadCategory[]>(overhead.categories);

  // New Category form state
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState<number | ''>('');

  // Editing state
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);

  const totalMonthlyOverhead = categories.reduce((sum, c) => sum + c.amount, 0);
  const overheadPerProduct = totalMonthlyOverhead / (targetSales || 1);

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newAmount || newAmount <= 0) return;

    const newCat: OverheadCategory = {
      id: 'o-' + Math.random().toString(36).substr(2, 9),
      name: newName.trim(),
      amount: Number(newAmount),
    };

    const updated = [...categories, newCat];
    setCategories(updated);
    setNewName('');
    setNewAmount('');

    // Update in Context immediately
    updateOverhead({
      targetSalesPerMonth: targetSales,
      categories: updated
    });
  };

  const handleRemoveField = (id: string) => {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    updateOverhead({
      targetSalesPerMonth: targetSales,
      categories: updated
    });
  };

  const startEditAmount = (id: string, curr: number) => {
    setEditId(id);
    setEditAmount(curr);
  };

  const saveEditAmount = (id: string) => {
    const updated = categories.map(c => c.id === id ? { ...c, amount: editAmount } : c);
    setCategories(updated);
    setEditId(null);
    updateOverhead({
      targetSalesPerMonth: targetSales,
      categories: updated
    });
  };

  const handleTargetSalesChange = (val: number) => {
    setTargetSales(val);
    updateOverhead({
      targetSalesPerMonth: val,
      categories
    });
  };

  // Helper icons for preset categories
  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('gaji') || lower.includes('tenaga') || lower.includes('karyawan')) {
      return <UserCheck className="w-5 h-5 text-indigo-500" />;
    }
    if (lower.includes('listrik') || lower.includes('air') || lower.includes('internet') || lower.includes('telepon')) {
      return <Lightbulb className="w-5 h-5 text-amber-500" />;
    }
    if (lower.includes('sewa') || lower.includes('gedung') || lower.includes('toko') || lower.includes('kontrak')) {
      return <Landmark className="w-5 h-5 text-rose-500" />;
    }
    return <Calculator className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Setup Biaya Overhead Bulanan</h2>
        <p className="text-gray-500 text-sm mt-1">
          Menghitung pengeluaran non-bahan (gaji, utilitas, sewa, penyusutan) untuk dialokasikan ke harga jual produk
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input parameters panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Penjualan Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-full inline-block"></span>
              <span>1. Target Penjualan Bulanan</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Target Penjualan Per Bulan (Porsi / Produk) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={targetSales || ''}
                    min="1"
                    onChange={(e) => handleTargetSalesChange(Number(e.target.value))}
                    className={`w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-base font-semibold focus:bg-white focus:outline-none focus:ring-2 transition-all ${currentTheme.ring}`}
                  />
                  <span className="absolute right-4 top-3.5 text-xs text-gray-400 font-medium">cup / piring</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 p-4 bg-gray-50 rounded-xl border border-gray-100 leading-relaxed">
                <p className="font-semibold text-gray-700 mb-1">💡 Tips Estimasi Volume:</p>
                Asumsi bisnis Anda mampu menjual rata-rata <span className="font-bold text-gray-850 font-mono">{Math.round((targetSales || 0) / 30)} produk per hari</span>. Angka ini digunakan untuk membagi biaya overhead bulanan secara merata pada setiap porsi penjualan.
              </div>
            </div>
          </div>

          {/* List Overheads and Add item forms */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-850 text-sm uppercase tracking-wider flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full inline-block"></span>
                <span>2. Rincian Pengeluaran Bulanan</span>
              </h3>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                {categories.length} Komponen Biaya
              </span>
            </div>

            {/* Form inline */}
            <form onSubmit={handleAddField} className="p-5 bg-gray-50/30 border-b border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Nama Pengeluaran (misal Gaji Admin)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 transition-all ${currentTheme.ring}`}
                  required
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Jumlah Pengeluaran per Bulan (Rp)"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className={`w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 transition-all ${currentTheme.ring}`}
                  required
                  min="1"
                />
              </div>
              <button
                type="submit"
                className={`py-2.5 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer md:w-fit md:px-5 ${currentTheme.bg} ${currentTheme.hover}`}
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Biaya</span>
              </button>
            </form>

            {/* List */}
            <div className="divide-y divide-gray-100">
              {categories.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  Belum ada biaya overhead yang dicatat. Mulai tambahkan pengeluaran di atas!
                </div>
              ) : (
                categories.map((c) => (
                  <div key={c.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 border border-gray-100 bg-white shadow-xs rounded-lg">
                        {getCategoryIcon(c.name)}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 text-sm block">{c.name}</span>
                        <span className="text-[10px] text-gray-400 font-medium">Beban Tetap (Fixed Cost) / Bulan</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {editId === c.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(Number(e.target.value))}
                            className="p-1 text-xs border border-blue-500 rounded bg-white w-28 text-right font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => saveEditAmount(c.id)}
                            className="p-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-right">
                          <div className="font-bold text-gray-900">
                            {formatCurrency(c.amount)}
                          </div>
                          <button
                            onClick={() => startEditAmount(c.id, c.amount)}
                            className="text-[11px] text-blue-500 hover:underline inline-flex items-center space-x-0.5 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit biaya</span>
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => handleRemoveField(c.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Calculation Summaries (Exact replica of Slide 2 right card) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 h-fit">
          <h3 className="font-bold text-gray-850 text-xs uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center space-x-2">
            <span>Ringkasan Biaya Overhead</span>
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
              <span className="text-xs text-gray-400 font-medium block mb-1">Total Biaya Overhead Per Bulan</span>
              <span className="text-2xl font-black text-gray-850 text-stone-900 font-mono tracking-tight">
                {formatCurrency(totalMonthlyOverhead)}
              </span>
              <span className="text-[10px] text-gray-400 block mt-2 border-t border-gray-200/50 pt-1 leading-relaxed">
                Rumus: (Sewa + Listrik/Air/Internet + Gaji Tenaga Kerja + Pemasaran)
              </span>
            </div>

            <div className={`p-4 border rounded-2xl flex items-center justify-between ${currentTheme.border} ${currentTheme.light}`}>
              <div>
                <span className={`text-[11px] font-bold block mb-0.5 ${currentTheme.textLight}`}>
                  Total Biaya Overhead Per Produk
                </span>
                <span className="text-md text-gray-500 block leading-tight text-[10px]">
                  Nilai otomatis yang dibebankan per pcs
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-xl font-bold font-mono ${currentTheme.text}`}>
                  {formatCurrency(Math.round(overheadPerProduct))}
                </span>
                <span className="text-[9px] text-gray-400 block font-mono">/ produk</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 leading-relaxed space-y-2">
              <div className="flex items-start space-x-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[11px]">
                  <strong>Kenapa ini sering terlewat?</strong> Usaha mikro sering mengira bahan baku adalah satu-satunya pengeluaran (Cost). Listrik dan sewa yang terlewat membuat laba bersih tipis. Sistem ini secara dinamis menempelkan beban ini di balik HPP resep produk Anda!
                </p>
              </div>

              <div className="bg-emerald-500/10 text-emerald-800 p-3 rounded-xl text-[11px] font-medium border border-emerald-500/20">
                ✅ **Otomatis Sinkron!** Setiap kali Anda menambah/merevisi rincian biaya overhead, HPP seluruh produk bersangkutan akan menyesuaikan secara real-time.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
