import React, { useState, useMemo } from 'react';
import { useStore, Discount, Product } from '../store/StoreContext';
import { themeMap } from '../lib/theme';
import { formatCurrency } from '../lib/utils';
import { Percent, Plus, Trash2, Edit2, AlertCircle, Sparkles, CheckCircle2, ShieldAlert, BadgeInfo } from 'lucide-react';

export default function Discounts() {
  const { products, discounts, theme, addDiscount, updateDiscount, deleteDiscount } = useStore();
  const currentTheme = themeMap[theme] || themeMap.blue;

  // Form states
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [status, setStatus] = useState<'Aktif' | 'Inaktif'>('Aktif');
  const [description, setDescription] = useState('');

  // Selected product details
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || null;
  }, [selectedProductId, products]);

  // Discount pricing computation
  const calculation = useMemo(() => {
    if (!selectedProduct) return { discountedPrice: 0, marginAmount: 0, marginPercent: 0, isNegative: false };
    
    const price = selectedProduct.sellingPrice;
    const hpp = selectedProduct.hpp;
    
    // Discounted target price
    const discountedPrice = Math.round(price * (1 - (discountPercent || 0) / 100));
    
    // Profit margin = Discounted Price - HPP
    const marginAmount = discountedPrice - hpp;
    const marginPercent = hpp > 0 ? (marginAmount / hpp) * 100 : 0;
    const isNegative = marginAmount < 0;

    return {
      discountedPrice,
      marginAmount,
      marginPercent,
      isNegative
    };
  }, [selectedProduct, discountPercent]);

  const handleSaveDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || calculation.isNegative) return; // Prevent saving negative margins!

    const newDiscount: Discount = {
      id: 'd-' + Math.random().toString(36).substr(2, 9),
      productId: selectedProductId,
      discountPercent,
      status,
      description: description.trim() || `Diskon ${discountPercent}% untuk ${selectedProduct.name}`,
      dateAdded: new Date().toISOString()
    };

    addDiscount(newDiscount);
    setDescription('');
    setDiscountPercent(10);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Kalkulator Diskon & Proteksi Margin</h2>
        <p className="text-gray-500 text-sm mt-1">
          Simulasikan diskon promo tanpa takut boncos. Kerugian ditolak otomatis oleh sistem sebelum disimpan!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Create and Simulate Discount (Exact Replica of Slide 1 side element) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 h-fit">
          <h3 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-3">Tambah Diskon Baru</h3>

          <form onSubmit={handleSaveDiscount} className="space-y-4">
            {/* Produk selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                Pilih Produk Cenderung *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className={`w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${currentTheme.ring}`}
                required
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} - ({formatCurrency(p.sellingPrice)}) [HPP: {formatCurrency(p.hpp)}]
                  </option>
                ))}
              </select>
            </div>

            {/* Discount entry */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                Diskon (%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent || ''}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className={`w-full p-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-base font-semibold focus:outline-none focus:ring-2 transition-all ${currentTheme.ring}`}
                  required
                />
                <span className="absolute right-4 top-3 text-gray-400 font-bold">%</span>
              </div>
            </div>

            {/* Price Preview Blue Box */}
            <div className="p-4 bg-sky-500/10 rounded-xl border border-sky-200 flex items-center justify-between text-sky-800">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-5 h-5 text-sky-500 shrink-0" />
                <div>
                  <span className="text-[11px] font-bold block">Preview Harga Diskon</span>
                  <span className="text-xl font-black font-mono">
                    {formatCurrency(calculation.discountedPrice)}
                  </span>
                </div>
              </div>
              <span className="text-[10px] bg-sky-200/50 px-2 py-0.5 rounded-md font-semibold shrink-0">Simulasi</span>
            </div>

            {/* CRITICAL MARGIN WARNING ENGINES (Exact representation of slide 1) */}
            {selectedProduct && (
              calculation.isNegative ? (
                /* RED CONTAINER: "Margin Negatif (Rugi)" */
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl space-y-3.5 shadow-sm animate-bounce-short">
                  <div className="flex items-center space-x-2 text-red-700">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <span className="font-bold text-sm">⚠️ Margin Negatif (Rugi)</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs border-y border-red-200/50 py-2 font-medium">
                    <div>
                      <span className="text-gray-500 block">Total Cost (HPP)</span>
                      <span className="font-bold text-gray-900 font-mono text-[13px]">
                        {formatCurrency(selectedProduct.hpp)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Proyeksi Rugi</span>
                      <span className="font-bold text-red-600 font-mono text-[13px]">
                        {formatCurrency(calculation.marginAmount)} ({calculation.marginPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 text-xs font-semibold py-0.5 text-red-700 bg-red-100/60 p-2.5 rounded-lg border border-red-100">
                    <span>❌</span>
                    <p>Sistem menolak menyimpan karena diskon melampaui harga modal (HPP) produk!</p>
                  </div>
                </div>
              ) : (
                /* GREEN CONTAINER: "Margin Aman (Untung)" */
                <div className="p-4 bg-emerald-55/10 border border-emerald-200 text-emerald-800 rounded-xl space-y-3 shadow-xs">
                  <div className="flex items-center space-x-2 text-emerald-700">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                    <span className="font-bold text-sm">✓ Margin Aman (Untung)</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs border-y border-emerald-200/40 py-2">
                    <div>
                      <span className="text-gray-400 block font-medium">Total Cost (HPP)</span>
                      <span className="font-bold text-gray-900 font-mono">
                        {formatCurrency(selectedProduct.hpp)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Margin Bersih</span>
                      <span className="font-bold text-emerald-600 font-mono">
                        +{formatCurrency(calculation.marginAmount)} (+{calculation.marginPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-700 leading-tight">
                    Sistem mengizinkan diskon ini untuk diposting secara aktif di POS Kasir!
                  </p>
                </div>
              )
            )}

            {/* Description & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className={`w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 transition-all ${currentTheme.ring}`}
                >
                  <option value="Aktif">Aktif (POS)</option>
                  <option value="Inaktif">Nonaktif</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Keterangan Promosi</label>
                <input
                  type="text"
                  placeholder="Promo Gajian / Hari Raya"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 transition-all ${currentTheme.ring}`}
                />
              </div>
            </div>

            {/* CTA action button */}
            <button
              type="submit"
              disabled={calculation.isNegative || !selectedProduct}
              className={`w-full py-3 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer ${
                calculation.isNegative 
                  ? 'bg-gray-300 border border-gray-200 shadow-none text-gray-500 cursor-not-allowed' 
                  : `${currentTheme.bg} ${currentTheme.hover} shadow-blue-500/10`
              }`}
            >
              <Percent className="w-5 h-5" />
              <span>Simpan Kupon Diskon</span>
            </button>
          </form>
        </div>

        {/* Right column: List of savings active discounts */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-fit">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-850 text-sm uppercase tracking-wider flex items-center space-x-2">
              <Percent className="w-4 h-4 text-gray-500" />
              <span>Daftar Diskon Promo Aktif</span>
            </h3>
            <span className="text-xs font-bold bg-white text-gray-600 px-2.5 py-1 rounded-lg border border-gray-100">
              {discounts.length} Promo Berjalan
            </span>
          </div>

          <div className="overflow-x-auto">
            {discounts.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm px-6">
                <BadgeInfo className="w-10 h-10 mx-auto opacity-40 mb-3" />
                <p className="font-semibold text-gray-700 mb-1">Belum Ada Diskon yang Tersimpan</p>
                <p className="text-xs text-gray-500">Mulai buat simulasinya di panel sebelah kiri untuk melindungi margin produk usaha Anda.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 font-medium text-xs text-gray-600 border-b border-gray-100">
                    <th className="px-5 py-4">Nama Produk</th>
                    <th className="px-5 py-4 text-center">Diskon</th>
                    <th className="px-5 py-4">Harga Promo</th>
                    <th className="px-5 py-4">Margin Promo</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {discounts.map((disc) => {
                    const prod = products.find(p => p.id === disc.productId);
                    if (!prod) return null;

                    const promoPrice = Math.round(prod.sellingPrice * (1 - disc.discountPercent / 100));
                    const promoMargin = promoPrice - prod.hpp;
                    const marginPct = prod.hpp > 0 ? (promoMargin / prod.hpp) * 100 : 0;

                    return (
                      <tr key={disc.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-bold text-gray-900 block">{prod.name}</span>
                          <span className="text-[10px] text-gray-400 font-medium block mt-0.5 truncate max-w-[150px]">
                            {disc.description}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-100">
                            {disc.discountPercent}% OFF
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-gray-850 font-mono">{formatCurrency(promoPrice)}</span>
                          <span className="text-[10px] text-gray-400 block line-through mt-0.5">{formatCurrency(prod.sellingPrice)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-emerald-600 font-mono">{formatCurrency(promoMargin)}</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">({marginPct.toFixed(1)}% Laba)</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                            disc.status === 'Aktif' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-gray-100 text-gray-600 border border-gray-250'
                          }`}>
                            {disc.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => deleteDiscount(disc.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
