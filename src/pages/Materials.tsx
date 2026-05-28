import React, { useState, useMemo } from 'react';
import { useStore, Material, Product } from '../store/StoreContext';
import { themeMap } from '../lib/theme';
import { formatCurrency } from '../lib/utils';
import { Plus, Edit2, Trash2, ArrowUpRight, ArrowDownRight, Info, AlertTriangle, ShieldCheck, Database, FileText } from 'lucide-react';

export default function Materials() {
  const { materials, products, theme, addMaterial, updateMaterial, deleteMaterial } = useStore();
  const currentTheme = themeMap[theme] || themeMap.blue;

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMat, setEditingMat] = useState<Material | null>(null);
  
  // Material Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'Bahan' | 'Packaging'>('Bahan');
  const [cost, setCost] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1000);
  const [unit, setUnit] = useState('gram');

  // Confirmation screen state (for material price editing)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMaterialData, setConfirmMaterialData] = useState<Material | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [changeReason, setChangeReason] = useState('Penyesuaian Biaya Pasar');

  const openAddModal = () => {
    setName('');
    setType('Bahan');
    setCost(0);
    setVolume(1000);
    setUnit('gram');
    setIsAddOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || cost <= 0 || volume <= 0) return;

    const newMat: Material = {
      id: 'm-' + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      type,
      cost,
      volume,
      unit,
      priceHistory: [{ date: new Date().toISOString(), cost, reason: 'Harga Awal Bahan' }]
    };

    addMaterial(newMat);
    setIsAddOpen(false);
  };

  const initiateEdit = (mat: Material) => {
    setEditingMat(mat);
    setName(mat.name);
    setType(mat.type);
    setCost(mat.cost);
    setVolume(mat.volume);
    setUnit(mat.unit);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMat || !name.trim() || cost <= 0 || volume <= 0) return;

    // Check if the cost has changed -> if so, we trigger the CONFIRMATION modal!
    if (editingMat.cost !== cost) {
      setConfirmMaterialData({ ...editingMat, name, type, volume, unit });
      setNewPrice(cost);
      setShowConfirmModal(true);
    } else {
      // Normal non-price edit (e.g. name, type, unit)
      const updated: Material = {
        ...editingMat,
        name: name.trim(),
        type,
        volume,
        unit
      };
      updateMaterial(updated, 'Update deskripsi bahan');
      setEditingMat(null);
    }
  };

  const handleConfirmPriceUpdate = () => {
    if (!confirmMaterialData) return;

    // Generate price update
    const updated: Material = {
      ...confirmMaterialData,
      cost: newPrice
    };

    // Store action handles updating recipes HPP under the hood
    updateMaterial(updated, changeReason);
    
    // Reset state & close both edit pane and confirmation prompt
    setShowConfirmModal(false);
    setConfirmMaterialData(null);
    setEditingMat(null);
  };

  // Find products / recipes affected by the edited material
  const affectedProducts = useMemo(() => {
    if (!confirmMaterialData) return [];
    return products.filter(p => p.ingredients.some(ing => ing.materialId === confirmMaterialData.id));
  }, [confirmMaterialData, products]);

  // Preview recipe material cost change
  const calculateCostPreview = (prod: Product, targetMat: Material, tempPrice: number) => {
    let oldMatCost = 0;
    let newMatCost = 0;

    prod.ingredients.forEach(ing => {
      const isTarget = ing.materialId === targetMat.id;
      const mat = isTarget ? targetMat : materials.find(m => m.id === ing.materialId);
      
      if (mat && mat.volume > 0) {
        const ingOldCost = (ing.quantityNeeded / mat.volume) * mat.cost;
        oldMatCost += ingOldCost;

        if (isTarget) {
          const ingNewCost = (ing.quantityNeeded / mat.volume) * tempPrice;
          newMatCost += ingNewCost;
        } else {
          newMatCost += ingOldCost;
        }
      }
    });

    return {
      oldMaterialCost: Math.round(oldMatCost),
      newMaterialCost: Math.round(newMatCost),
      diff: Math.round(newMatCost - oldMatCost)
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Setup Bahan Baku & Kemasan</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola harga beli modal bahan mentah dan packaging</p>
        </div>
        <button
          onClick={openAddModal}
          className={`px-4 py-2.5 text-white font-medium rounded-xl flex items-center space-x-2 transition-all shadow-sm shadow-blue-500/10 cursor-pointer ${currentTheme.bg} ${currentTheme.hover}`}
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Bahan Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core List Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-semibold text-gray-800 flex items-center space-x-2">
              <Database className="w-4 h-4 text-gray-500" />
              <span>Daftar Bahan & Kemasan</span>
            </h3>
            <span className="text-xs text-gray-500 font-medium bg-white px-2.5 py-1 border border-gray-100 rounded-lg">
              {materials.length} Item
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 font-medium text-xs border-b border-gray-100">
                  <th className="px-6 py-4">Nama Bahan</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Volume Package</th>
                  <th className="px-6 py-4">Harga Beli</th>
                  <th className="px-6 py-4">Biaya Per Unit</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {materials.map((mat) => {
                  const unitPrice = mat.cost / mat.volume;
                  return (
                    <tr key={mat.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{mat.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                          mat.type === 'Bahan' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}>
                          {mat.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {mat.volume} {mat.unit}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {formatCurrency(mat.cost)}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-500 bg-gray-50/30">
                        {formatCurrency(Math.round(unitPrice * 10) / 10)} / {mat.unit}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center space-x-2">
                          <button
                            onClick={() => initiateEdit(mat)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Bahan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteMaterial(mat.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit / Detail Frame Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit space-y-4">
          <h3 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-3 flex items-center space-x-2">
            <span>{editingMat ? 'Edit Detail Bahan' : 'Petunjuk Biaya Raw Material'}</span>
          </h3>

          {editingMat ? (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Nama Bahan *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 transition-all ${currentTheme.ring}`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Tipe</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className={`w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${currentTheme.ring}`}
                  >
                    <option value="Bahan">Bahan Baku</option>
                    <option value="Packaging">Kemasan/Pkg</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Unit Unit</label>
                  <input
                    type="text"
                    value={unit}
                    placeholder="misal: gram, ml"
                    onChange={(e) => setUnit(e.target.value)}
                    className={`w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${currentTheme.ring}`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Volume Pack</label>
                  <input
                    type="number"
                    value={volume || ''}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className={`w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${currentTheme.ring}`}
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Harga Beli Pack</label>
                  <input
                    type="number"
                    value={cost || ''}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className={`w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${currentTheme.ring}`}
                    required
                    min="1"
                  />
                </div>
              </div>

              {editingMat.cost !== cost && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5 animate-pulse">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Menduga Perubahan Harga:</span> Mengubah biaya dari {formatCurrency(editingMat.cost)} ke {formatCurrency(cost)} membutuhkan konfirmasi resep setelah tombol Simpan diklik.
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className={`flex-1 py-2.5 text-white font-medium rounded-xl transition-all ${currentTheme.bg} ${currentTheme.hover}`}
                >
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => setEditingMat(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center space-x-3">
                <Info className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-xs text-gray-700">Pilih edit pada item bahan di tabel kiri untuk memperbarui detail harga jual bahan.</p>
              </div>
              <p>Setup Bahan Baku sangat vital karena:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Menentukan HPP otomatis di dalam resep</li>
                <li>HPP real-time mendeteksi margin rugi</li>
                <li>Update material akan langsung mengoreksi seluruh resep yang terikat material tersebut secara langsung!</li>
              </ul>
              <div>
                <h4 className="font-semibold text-gray-800 text-xs uppercase tracking-wider mb-2">Riwayat Update Lainnya</h4>
                <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1">
                  {materials.flatMap(m => m.priceHistory.map(h => ({ ...h, matName: m.name })))
                    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map((log, idx) => (
                      <div key={idx} className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-[11px] flex justify-between items-center gap-2">
                        <div className="truncate">
                          <span className="font-semibold text-gray-800">{log.matName}</span>
                          <span className="text-gray-400 font-mono"> ({log.reason})</span>
                        </div>
                        <span className="font-bold text-gray-900 shrink-0">{formatCurrency(log.cost)}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* POPUP: Add Material Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-gray-900 text-xl border-b border-gray-100 pb-3 mb-4">Tambah Bahan Baku / Kemasan Baru</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Nama Bahan / Kemasan *</label>
                <input
                  type="text"
                  placeholder="misal: Cokelat Cair, Cup 14oz"
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${currentTheme.ring}`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Tipe Kategori</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className={`w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${currentTheme.ring}`}
                  >
                    <option value="Bahan">Bahan Baku</option>
                    <option value="Packaging">Kemasan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Unit (Takaran)</label>
                  <input
                    type="text"
                    placeholder="gram, ml, pcs"
                    onChange={(e) => setUnit(e.target.value)}
                    className={`w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${currentTheme.ring}`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Volume (Qty Pack)</label>
                  <input
                    type="number"
                    placeholder="misal: 1000 atau 50"
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className={`w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${currentTheme.ring}`}
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Harga Beli Pack (Rp)</label>
                  <input
                    type="number"
                    placeholder="misal: 120000"
                    onChange={(e) => setCost(Number(e.target.value))}
                    className={`w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${currentTheme.ring}`}
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className={`flex-1 py-2.5 text-white font-medium rounded-xl transition-all cursor-pointer ${currentTheme.bg} ${currentTheme.hover}`}
                >
                  Tambah Bahan
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP DIALOG: "3. Konfirmasi Perubahan Harga Material" & "4. Gak perlu hitung ulang satu-satu" (EXACT REPLICA OF THE SCREENSHOT) */}
      {showConfirmModal && confirmMaterialData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-2xl w-full p-6 animate-in fade-in slide-in-from-bottom-8 duration-200">
            {/* Header Alert Title */}
            <div className="flex items-center space-x-3 border-b border-gray-100 pb-4 mb-4">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">Konfirmasi Perubahan Harga Material</h4>
                <p className="text-gray-500 text-xs">Perubahan ini akan mempengaruhi perhitungan harga produk secara langsung</p>
              </div>
            </div>

            {/* Price change detail card */}
            <div className="grid grid-cols-3 gap-4 bg-gray-50/70 p-4 rounded-xl border border-gray-100 mb-4 text-xs">
              <div>
                <span className="text-gray-500 block mb-1">Material Utama</span>
                <span className="font-bold text-gray-900 text-sm">{confirmMaterialData.name}</span>
                <span className="text-gray-400 block mt-0.5">({confirmMaterialData.volume} {confirmMaterialData.unit})</span>
              </div>
              <div className="border-l border-gray-200 pl-4">
                <span className="text-gray-500 block mb-1">Selisih Biaya</span>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500 line-through">{formatCurrency(confirmMaterialData.cost)}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-bold text-red-600 text-sm">{formatCurrency(newPrice)}</span>
                </div>
              </div>
              <div className="border-l border-gray-200 pl-4">
                <span className="text-gray-500 block mb-1">Perubahan</span>
                <span className={`inline-flex items-center text-xs font-bold ${newPrice > confirmMaterialData.cost ? 'text-red-600' : 'text-emerald-600'}`}>
                  {newPrice > confirmMaterialData.cost ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                  {Math.round(((newPrice - confirmMaterialData.cost) / confirmMaterialData.cost) * 1000) / 10}%
                </span>
              </div>
            </div>

            {/* Warning bar */}
            <div className="bg-amber-500/10 border-l-4 border-amber-500 p-3.5 rounded-r-xl text-amber-800 text-xs mb-4 flex items-start space-x-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="font-medium">
                Rincian resep <span className="underline font-bold font-mono">{affectedProducts.length} produk</span> akan di-update secara otomatis. Harga jual produk akan disesuaikan demi menjaga rasio margin laba Anda.
              </p>
            </div>

            {/* Affected Recipes List */}
            <div className="space-y-2 mb-6">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Produk yang Terpengaruh:</span>
              
              <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 border border-gray-100 rounded-xl p-3 bg-gray-50/20">
                {affectedProducts.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-xs">
                    Tidak ada produk terdaftar yang menggunakan bahan mentah ini. Aman untuk disimpan!
                  </div>
                ) : (
                  affectedProducts.map((p, idx) => {
                    const priceDetails = calculateCostPreview(p, confirmMaterialData, newPrice);
                    return (
                      <div key={p.id} className="bg-white p-3.5 rounded-lg border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-800 font-mono text-[11px] bg-gray-100 text-gray-600 w-5 h-5 rounded-md inline-flex items-center justify-center">{idx + 1}</span>
                            <span className="font-bold text-gray-900">{p.name}</span>
                          </div>
                          <span className="text-gray-400 text-[10px] ml-7">Formulasi resep aktif / otomatis</span>
                        </div>
                        
                        <div className="flex items-center space-x-4 ml-7 md:ml-0 self-end md:self-auto">
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 block">Total Biaya Resep</span>
                            <div className="flex items-center space-x-1 font-medium font-mono text-[11px]">
                              <span className="text-gray-400">{formatCurrency(p.hpp)}</span>
                              <span>→</span>
                              <span className="text-red-600 font-bold">{formatCurrency(p.hpp + priceDetails.diff)}</span>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${priceDetails.diff >= 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {priceDetails.diff >= 0 ? '+' : ''}{Math.round((priceDetails.diff / p.hpp) * 1000) / 10}%
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Alasan Perubahan input */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Mengapa Anda merubah harga ini? Log Catatan Rekam Jejak:</label>
              <input
                type="text"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="misal: Kenaikan harga di pasar lokal, inflasi supplier"
                className={`w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all text-xs ${currentTheme.ring}`}
              />
            </div>

            {/* Core Action buttons */}
            <div className="flex flex-row-reverse gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleConfirmPriceUpdate}
                className="flex-1 md:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer text-sm"
              >
                Ya, Update Rincian Resep
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmMaterialData(null);
                }}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors cursor-pointer text-sm"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
