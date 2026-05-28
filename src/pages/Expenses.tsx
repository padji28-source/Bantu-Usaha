import React, { useState } from 'react';
import { useStore, Expense } from '../store/StoreContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, Trash2, X, Receipt } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function Expenses() {
  const { expenses, addExpense, deleteExpense } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Bahan Baku');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);

  const categories = [
    'Bahan Baku',
    'Operasional (Listrik, Air)',
    'Sewa Tempat',
    'Gaji Karyawan',
    'Pemasaran',
    'Lainnya'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({
      id: uuidv4(),
      date,
      category,
      description,
      amount
    });
    setIsModalOpen(false);
    setDescription('');
    setAmount(0);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Pengeluaran</h2>
          <p className="text-gray-500 text-sm mt-1">Catat semua biaya operasional usaha Anda</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Catat Pengeluaran</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
           <div className="p-4 bg-orange-50 text-orange-600 rounded-full">
             <Receipt className="w-6 h-6" />
           </div>
           <div>
             <p className="text-sm text-gray-500 font-medium">Total Pengeluaran</p>
             <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Tanggal</th>
                <th className="p-4 font-medium">Kategori</th>
                <th className="p-4 font-medium">Keterangan</th>
                <th className="p-4 font-medium text-right">Nominal</th>
                <th className="p-4 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">Belum ada catatan pengeluaran.</td>
                </tr>
              ) : expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(e => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-600">{formatDate(e.date)}</td>
                  <td className="p-4 font-medium text-gray-900">
                    <span className="inline-block px-2.5 py-1 bg-gray-100 rounded-md text-xs font-semibold text-gray-600">
                      {e.category}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{e.description || '-'}</td>
                  <td className="p-4 text-right text-orange-600 font-medium">{formatCurrency(e.amount)}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => deleteExpense(e.id)} className="p-2 text-gray-400 hover:text-red-600 border border-transparent hover:border-gray-200 transition-colors bg-transparent hover:bg-white rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold">Catat Pengeluaran</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan (Opsional)</label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Contoh: Beli token listrik" className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nominal Biaya</label>
                  <input type="number" required min="0" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="mt-8">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors">
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
