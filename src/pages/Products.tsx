import React, { useState, useMemo } from 'react';
import { useStore, Product, ProductIngredient, Material } from '../store/StoreContext';
import { themeMap } from '../lib/theme';
import { formatCurrency } from '../lib/utils';
import { Plus, Calculator, Edit2, Trash2, X, PlusCircle, MinusCircle, HelpCircle, Flame, Check, Info, Library } from 'lucide-react';

export default function Products() {
  const { products, materials, overhead, theme, addProduct, updateProduct, deleteProduct } = useStore();
  const currentTheme = themeMap[theme] || themeMap.blue;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHppModalOpen, setIsHppModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Core Product Form State
  const [name, setName] = useState('');
  const [stock, setStock] = useState(0);
  const [hpp, setHpp] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);

  // Advanced Calculator Configs State
  const [calcIngredients, setCalcIngredients] = useState<ProductIngredient[]>([]);
  const [overheadType, setOverheadType] = useState<'otomatis' | 'manual'>('otomatis');
  const [overheadManual, setOverheadManual] = useState<number>(0);
  const [markupPercent, setMarkupPercent] = useState<number>(30); // Target Margin %
  const [taxPercent, setTaxPercent] = useState<number>(0); // Pajak %
  const [feeOnlinePercent, setFeeOnlinePercent] = useState<number>(15); // fee online channel %
  const [roundingMod, setRoundingMod] = useState<'none' | '500' | '1000' | '5000'>('1000');

  const openFormModal = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setName(product.name);
      setStock(product.stock);
      setHpp(product.hpp);
      setSellingPrice(product.sellingPrice);
      
      // Load calculator states
      setCalcIngredients(product.ingredients || []);
      setOverheadType(product.overheadManual !== undefined ? 'manual' : 'otomatis');
      setOverheadManual(product.overheadManual || 0);
      setMarkupPercent(product.markupPercent !== undefined ? product.markupPercent : 30);
      setTaxPercent(product.taxPercent !== undefined ? product.taxPercent : 0);
      setFeeOnlinePercent(product.feeOnlinePercent !== undefined ? product.feeOnlinePercent : 15);
    } else {
      setEditingId(null);
      setName('');
      setStock(50);
      setHpp(0);
      setSellingPrice(0);
      setCalcIngredients([]);
      setOverheadType('otomatis');
      setOverheadManual(0);
      setMarkupPercent(30);
      setTaxPercent(0);
      setFeeOnlinePercent(15);
    }
    setIsModalOpen(true);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Build the package
    const payload: Product = {
      id: editingId || 'p-' + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      stock,
      hpp,
      sellingPrice,
      ingredients: calcIngredients,
      overheadManual: overheadType === 'manual' ? overheadManual : undefined,
      markupPercent,
      taxPercent,
      feeOnlinePercent
    };

    if (editingId) {
      updateProduct(payload, 'Perubahan data produk & manual pricing');
    } else {
      addProduct(payload);
    }

    setIsModalOpen(false);
  };

  // ADVANCED CALCUALTION LOGICS (Sourced from slide 6 & 7)
  const calcTotalOverheadMonthly = useMemo(() => {
    return overhead.categories.reduce((sum, c) => sum + c.amount, 0);
  }, [overhead]);

  const calcOverheadPerUnit = useMemo(() => {
    return calcTotalOverheadMonthly / (overhead.targetSalesPerMonth || 1);
  }, [calcTotalOverheadMonthly, overhead]);

  const pricingBreakdown = useMemo(() => {
    // 1. Ingredients Raw cost
    let materialsCost = 0;
    calcIngredients.forEach(ing => {
      const mat = materials.find(m => m.id === ing.materialId);
      if (mat && mat.volume > 0) {
        materialsCost += (ing.quantityNeeded / mat.volume) * mat.cost;
      }
    });
    
    // 2. Overhead cost
    const chosenOverhead = overheadType === 'otomatis' ? calcOverheadPerUnit : overheadManual;
    
    // Base Total Cost (HPP)
    const baseHpp = Math.round(materialsCost + chosenOverhead);

    // 3. Margin pricing calculation
    // Base Price before taxation and platform fees:
    // Base Price = (Materials + Overhead) / (1 - Target Margin %)
    const marginRatio = (markupPercent || 0) / 100;
    const basePrice = marginRatio < 1 ? baseHpp / (1 - marginRatio) : baseHpp;
    const marginAmount = Math.round(basePrice - baseHpp);

    // 4. Pajak Amount
    const taxAmount = Math.round(basePrice * ((taxPercent || 0) / 100));

    // 5. Fee Online Channel Calculation
    // Selling price = (Base Price + Tax) / (1 - Online Fee %)
    const onlineFeeRatio = (feeOnlinePercent || 0) / 100;
    const sellingPriceBeforeFees = basePrice + taxAmount;
    const rawOnlineSellingPrice = onlineFeeRatio < 1 ? sellingPriceBeforeFees / (1 - onlineFeeRatio) : sellingPriceBeforeFees;
    const onlineFeeAmount = Math.round(rawOnlineSellingPrice * onlineFeeRatio);
    const finalCalculatedPrice = Math.round(rawOnlineSellingPrice);

    // 6. Rounding Modes (Pembulatan)
    let roundedPrice = finalCalculatedPrice;
    if (roundingMod === '500') {
      roundedPrice = Math.ceil(finalCalculatedPrice / 500) * 500;
    } else if (roundingMod === '1000') {
      roundedPrice = Math.ceil(finalCalculatedPrice / 1000) * 1000;
    } else if (roundingMod === '5000') {
      roundedPrice = Math.ceil(finalCalculatedPrice / 5000) * 5000;
    }

    return {
      materialsCost: Math.round(materialsCost),
      chosenOverhead: Math.round(chosenOverhead),
      baseHpp,
      marginAmount,
      taxAmount,
      onlineFeeAmount,
      finalPrice: finalCalculatedPrice,
      roundedPrice
    };
  }, [calcIngredients, overheadType, overheadManual, calcOverheadPerUnit, markupPercent, taxPercent, feeOnlinePercent, roundingMod, materials]);

  const handleAddIngredient = () => {
    // Pick the first available material
    if (materials.length === 0) return;
    setCalcIngredients([...calcIngredients, { materialId: materials[0].id, quantityNeeded: 10 }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setCalcIngredients(calcIngredients.filter((_, idx) => idx !== index));
  };

  const handleIngredientChange = (index: number, field: 'materialId' | 'quantityNeeded', value: any) => {
    const updated = [...calcIngredients];
    if (field === 'materialId') {
      updated[index].materialId = value;
    } else {
      updated[index].quantityNeeded = Number(value);
    }
    setCalcIngredients(updated);
  };

  // Close Calculator and Load calculated info to standard form fields
  const applyHppCalculations = () => {
    setHpp(pricingBreakdown.baseHpp);
    setSellingPrice(pricingBreakdown.roundedPrice);
    setIsHppModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Formulasi Produk & HPP</h2>
          <p className="text-gray-500 text-sm mt-1">
            Kalkulator resep otomatis, menyambungkan bahan baku modal langsung dengan profit kotor Anda
          </p>
        </div>
        <button
          onClick={() => openFormModal()}
          className={`px-4 py-2.5 text-white font-medium rounded-xl flex items-center space-x-2 transition-all cursor-pointer shadow-sm shadow-blue-500/10 ${currentTheme.bg} ${currentTheme.hover}`}
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Produk Baru</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-850 flex items-center space-x-2 text-sm uppercase tracking-wide">
            <Library className="w-4 h-4 text-gray-500" />
            <span>Katalog Produk Menu Aktif</span>
          </h3>
          <span className="text-xs text-gray-500 font-medium bg-white px-2.5 py-1 border border-gray-100 rounded-lg">
            {products.length} Menu Terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-medium text-xs border-b border-gray-100 uppercase tracking-wider">
                <th className="px-6 py-4">Nama Produk Pokok</th>
                <th className="px-6 py-4 text-center">Formulasi Resep</th>
                <th className="px-6 py-4 text-right">Stok Ready</th>
                <th className="px-6 py-4 text-right">HPP Campuran (Modal)</th>
                <th className="px-6 py-4 text-right">Harga Jual POS</th>
                <th className="px-6 py-4 text-right">Ratio Margin Bersih</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    Belum ada menu produk terdaftar. Klik 'Tambah Produk Baru' untuk memulai!
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const ingredientsCount = p.ingredients?.length || 0;
                  const grossProfit = p.sellingPrice - p.hpp;
                  const profitRatio = p.hpp > 0 ? (grossProfit / p.hpp) * 100 : 0;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 block">{p.name}</span>
                        <span className="text-[10px] text-gray-400 font-medium mt-0.5 block">Formula costing terpasang</span>
                      </td>
                      <td className="px-6 py-4 text-center text-xs">
                        {ingredientsCount > 0 ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg font-medium">
                            <Flame className="w-3 h-3 text-blue-500 animate-pulse" />
                            <span>{ingredientsCount} Bahan Baku</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium text-xs">Custom HPP Manual</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                          p.stock <= 5 
                            ? 'bg-red-50 text-red-650 font-black' 
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {p.stock} Porsi
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-600">
                        {formatCurrency(p.hpp)}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-gray-900">
                        {formatCurrency(p.sellingPrice)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div>
                          <span className={`font-bold text-xs ${grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {grossProfit >= 0 ? '+' : ''}{formatCurrency(grossProfit)}
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            ({profitRatio.toFixed(1)}% Markup)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openFormModal(p)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-150 rounded-lg transition-colors cursor-pointer"
                            title="Edit / Set Resep"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-150 rounded-lg transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL WINDOW: Create/Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Formulasi Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Nama Produk *</label>
                <input
                  type="text"
                  placeholder="misal: Roti Strawberry, Kopi Aren Latte"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${currentTheme.ring}`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Stock Awal</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className={`w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${currentTheme.ring}`}
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Tipe costing</label>
                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs flex justify-between items-center text-gray-600 font-semibold height-fit mt-0">
                    <span>{calcIngredients.length > 0 ? 'Costing Resep' : 'Harga Manual'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        // Open calculated formula dialog
                        setIsHppModalOpen(true);
                      }}
                      className={`text-xs ${currentTheme.text} hover:underline font-bold flex items-center cursor-pointer`}
                    >
                      <Calculator className="w-3 h-3 mr-1" />
                      <span>Atur resep</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">HPP (Modal Porsi)</label>
                  <input
                    type="number"
                    value={hpp}
                    onChange={(e) => setHpp(Number(e.target.value))}
                    className={`w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-sm focus:outline-none focus:ring-2 transition-all pb-safe ${currentTheme.ring}`}
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Harga Jual Pokok</label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className={`w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-emerald-800 text-sm focus:outline-none focus:ring-2 transition-all ${currentTheme.ring}`}
                    required
                    min="0"
                  />
                </div>
              </div>

              {calcIngredients.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                  <p>
                    <strong>Resep Aktif terformula:</strong> Costing di-link otomatis ke {calcIngredients.length} bahan baku. Untuk menyesuaikan HPP silakan modifikasi lewat tombol "Atur resep" di kanan atas.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className={`flex-1 py-2.5 text-white font-bold rounded-xl transition-all cursor-pointer ${currentTheme.bg} ${currentTheme.hover}`}
                >
                  Simpan Produk
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-750 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGER MODAL: ADVANCED "KALKULATOR HPP & DETAILED RECIPES" (EXACT REPLICA OF THE SCREENSHOTS 6 & 7) */}
      {isHppModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-4xl w-full p-6 animate-in fade-in slide-in-from-bottom-8 duration-200 flex flex-col md:flex-row gap-6">
            
            {/* Input elements & list */}
            <div className="flex-1 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Formulasi Resep & Kalkulator HPP</h3>
                <p className="text-gray-500 text-xs">Simulasi campuran bahan, takaran, pajak, & fee online secara presisi</p>
              </div>

              {materials.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs space-y-2">
                  <p className="font-bold">⚠️ Anda belum memiliki Bahan Baku terdaftar!</p>
                  <p>Silakan isi setup bahan baku Anda terlebih dahulu untuk bisa meracik formulas resep di sini.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <span className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Daftar Baris Bahan Baku & Kemasan
                  </span>

                  {calcIngredients.map((ing, index) => {
                    const matchedMat = materials.find(m => m.id === ing.materialId);
                    // Qty cost: (needed / volume) * cost
                    let computedCostValue = 0;
                    if (matchedMat && matchedMat.volume > 0) {
                      computedCostValue = (ing.quantityNeeded / matchedMat.volume) * matchedMat.cost;
                    }

                    return (
                      <div key={index} className="flex gap-2 items-center bg-gray-55/40 p-2 border border-gray-100 rounded-xl">
                        {/* Material selector */}
                        <div className="flex-1">
                          <select
                            value={ing.materialId}
                            onChange={(e) => handleIngredientChange(index, 'materialId', e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-gray-305 rounded-lg focus:outline-none"
                          >
                            {materials.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.volume} {m.unit} @ {formatCurrency(m.cost)})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Needed Qty */}
                        <div className="w-24 relative">
                          <input
                            type="number"
                            value={ing.quantityNeeded || ''}
                            onChange={(e) => handleIngredientChange(index, 'quantityNeeded', e.target.value)}
                            placeholder="Takaran"
                            min="0.1"
                            step="any"
                            className="w-full text-xs p-2 pr-6 bg-white border border-gray-305 rounded-lg text-right font-semibold"
                          />
                          <span className="absolute right-1.5 top-2 text-[9px] text-gray-400 font-bold font-mono">
                            {matchedMat?.unit || 'unit'}
                          </span>
                        </div>

                        {/* Calculated price */}
                        <div className="w-28 text-right bg-gray-50 px-2 py-2 rounded-lg border border-gray-200/50">
                          <span className="text-[11px] font-bold text-gray-800 font-mono">
                            {formatCurrency(Math.round(computedCostValue))}
                          </span>
                        </div>

                        {/* Delete row */}
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(index)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="w-full py-2 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 text-gray-600 font-medium rounded-xl text-xs flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-gray-500" />
                    <span>(+) Tambah Baris Bahan</span>
                  </button>
                </div>
              )}

              {/* Set Multipliers Setup: Markup Margin, Tax, Fee Online */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-150 pt-4">
                {/* Overhead Options */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Biaya Overhead Penyusun
                  </label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setOverheadType('otomatis')}
                      className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all ${
                        overheadType === 'otomatis'
                          ? 'bg-blue-50 text-blue-700 border-blue-400/50'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      Otomatis ({formatCurrency(Math.round(calcOverheadPerUnit))})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverheadType('manual')}
                      className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all ${
                        overheadType === 'manual'
                          ? 'bg-blue-50 text-blue-700 border-blue-400/50'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      Input Manual
                    </button>
                  </div>

                  {overheadType === 'manual' && (
                    <input
                      type="number"
                      placeholder="Biaya Overhead Manual per Produk (Rp)"
                      value={overheadManual || ''}
                      onChange={(e) => setOverheadManual(Number(e.target.value))}
                      className="w-full p-2 border border-gray-200 rounded-xl text-xs font-mono"
                    />
                  )}
                </div>

                {/* Target Markup Margin */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Target Margin (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={markupPercent || ''}
                      onChange={(e) => setMarkupPercent(Number(e.target.value))}
                      className="w-full p-2 border border-gray-200 rounded-xl text-xs font-mono font-bold text-right pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-[11px] font-bold text-gray-400">%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pajak (%) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Pajak Restoran (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxPercent || ''}
                      onChange={(e) => setTaxPercent(Number(e.target.value))}
                      className="w-full p-2 border border-gray-200 rounded-xl text-xs font-mono text-right pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-[11px] font-bold text-gray-400">%</span>
                  </div>
                </div>

                {/* Fee Online Platform (%) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Fee Online Channel (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={feeOnlinePercent || ''}
                      onChange={(e) => setFeeOnlinePercent(Number(e.target.value))}
                      className="w-full p-2 border border-gray-200 rounded-xl text-xs font-mono text-right pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-[11px] font-bold text-gray-400">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Preview Card (Exact Replica of Screenshots 6 & 7) */}
            <div className="w-full md:w-80 bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-5 flex flex-col justify-between">
              
              <div className="space-y-4">
                <span className="block text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200 pb-2.5">
                  Rincian Penjumlahan Costing
                </span>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-gray-500">
                    <span>Biaya Bahan Baku</span>
                    <span className="font-semibold text-gray-800 font-mono">
                      {formatCurrency(pricingBreakdown.materialsCost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500">
                    <span>Biaya Overhead</span>
                    <span className="font-semibold text-gray-800 font-mono">
                      {formatCurrency(pricingBreakdown.chosenOverhead)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-700 font-semibold border-t border-dashed border-gray-300 pt-1.5">
                    <span>Total Cost (HPP)</span>
                    <span className="text-gray-900 font-mono">
                      {formatCurrency(pricingBreakdown.baseHpp)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 pt-1.5">
                    <span>Target Margin ({markupPercent}%)</span>
                    <span className="font-semibold text-gray-800 font-mono">
                      {formatCurrency(pricingBreakdown.marginAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500">
                    <span>Pajak Restoran ({taxPercent}%)</span>
                    <span className="font-semibold text-gray-800 font-mono">
                      {formatCurrency(pricingBreakdown.taxAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500">
                    <span>Platform Fee ({feeOnlinePercent}%)</span>
                    <span className="font-semibold text-gray-800 font-mono">
                      {formatCurrency(pricingBreakdown.onlineFeeAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-gray-800 font-bold border-t border-gray-250 pt-2 text-[12px]">
                    <span>Total Harga Jual Raw</span>
                    <span className="font-mono text-gray-950">
                      {formatCurrency(pricingBreakdown.finalPrice)}
                    </span>
                  </div>
                </div>

                {/* Rounding Mode Option */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Model Pembulatan Otomatis (Rounding)
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRoundingMod('none')}
                      className={`py-1 px-1 text-[10px] uppercase font-bold rounded-md border ${
                        roundingMod === 'none' ? `${currentTheme.bg} text-white border-transparent` : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      Piringan Asli
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoundingMod('500')}
                      className={`py-1 px-1 text-[10px] uppercase font-bold rounded-md border ${
                        roundingMod === '500' ? `${currentTheme.bg} text-white border-transparent` : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      Atas Rp500
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoundingMod('1000')}
                      className={`py-1 px-2 text-[10px] uppercase font-bold rounded-md border ${
                        roundingMod === '1000' ? `${currentTheme.bg} text-white border-transparent` : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      Atas Rp1.000
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoundingMod('5000')}
                      className={`py-1 px-2 text-[10px] uppercase font-bold rounded-md border ${
                        roundingMod === '5000' ? `${currentTheme.bg} text-white border-transparent` : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      Atas Rp5.000
                    </button>
                  </div>
                </div>
              </div>

              {/* Action and final display */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="p-3 bg-white border border-gray-150 rounded-xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] font-semibold text-gray-400 block uppercase">Harga Jual POS</span>
                    <span className="text-xl font-extrabold text-emerald-600 font-mono">
                      {formatCurrency(pricingBreakdown.roundedPrice)}
                    </span>
                  </div>
                  <span className="text-[9px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-150">
                    Bulat
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={applyHppCalculations}
                    className={`flex-1 py-3 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center space-x-1 ${currentTheme.bg} ${currentTheme.hover}`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Terapkan costing</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsHppModalOpen(false)}
                    className="px-3.5 py-3 bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
