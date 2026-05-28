import React, { useMemo } from 'react';
import { useStore } from '../store/StoreContext';
import { formatCurrency } from '../lib/utils';
import { FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Reports() {
  const { sales, expenses } = useStore();

  const report = useMemo(() => {
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalCOGS = sales.reduce((sum, s) => sum + s.totalCOGS, 0);
    const grossProfit = totalRevenue - totalCOGS; // Laba Kotor

    // Group expenses by category
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(e => {
       expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses; // Laba Bersih

    return { totalRevenue, totalCOGS, grossProfit, expensesByCategory, totalExpenses, netProfit };
  }, [sales, expenses]);

  const chartData = useMemo(() => {
    // Group sales and expenses by month (simple dummy grouping for display)
    // For a real app, you'd aggregate properly by date
    const monthlyData: Record<string, { month: string, revenue: number, expense: number }> = {};
    
    [...sales, ...expenses].forEach(item => {
      const date = new Date(item.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[key]) {
        monthlyData[key] = { month: monthName, revenue: 0, expense: 0 };
      }
      
      if ('totalRevenue' in item) {
        monthlyData[key].revenue += item.totalRevenue;
      } else {
        monthlyData[key].expense += item.amount;
        // Optionally also include COGS in expenses in chart:
        // monthlyData[key].expense += item.amount;
      }
    });

    // Also add COGS to expenses for full picture
    sales.forEach(s => {
      const date = new Date(s.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (monthlyData[key]) {
        monthlyData[key].expense += s.totalCOGS;
      }
    });

    return Object.values(monthlyData);
  }, [sales, expenses]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Laporan Laba Rugi</h2>
          <p className="text-gray-500 text-sm mt-1">Ringkasan performa finansial usaha Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Statement Table */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
           <div className="p-6 border-b border-gray-100 bg-gray-50">
             <h3 className="font-semibold text-lg flex items-center text-gray-900">
               <FileText className="w-5 h-5 mr-2 text-blue-600" />
               Statement Laba Rugi
             </h3>
           </div>
           <div className="p-6 space-y-6">
             {/* Pendapatan */}
             <div>
               <h4 className="font-bold text-gray-900 mb-3 uppercase text-sm tracking-wider">Pendapatan Penjualan</h4>
               <div className="flex justify-between text-gray-600 mb-2">
                 <span>Penjualan Bersih</span>
                 <span>{formatCurrency(report.totalRevenue)}</span>
               </div>
               <div className="flex justify-between text-gray-600 pl-4 border-b border-gray-100 pb-2">
                 <span>HPP (Harga Pokok Penjualan)</span>
                 <span className="text-red-500">({formatCurrency(report.totalCOGS)})</span>
               </div>
               <div className="flex justify-between font-medium text-gray-900 mt-3 bg-gray-50 p-2 rounded-lg">
                 <span>Laba Kotor</span>
                 <span>{formatCurrency(report.grossProfit)}</span>
               </div>
             </div>

             {/* Beban Operasional */}
             <div>
               <h4 className="font-bold text-gray-900 mb-3 uppercase text-sm tracking-wider">Beban Operasional</h4>
               <div className="space-y-2 mb-3">
                 {Object.entries(report.expensesByCategory).map(([category, amount]) => (
                   <div key={category} className="flex justify-between text-gray-600 pl-4">
                     <span>{category}</span>
                     <span>{formatCurrency(amount as number)}</span>
                   </div>
                 ))}
                 {Object.keys(report.expensesByCategory).length === 0 && (
                   <div className="text-gray-400 pl-4 italic text-sm">Belum ada beban operasional.</div>
                 )}
               </div>
               <div className="flex justify-between text-gray-700 pl-4 border-t border-gray-100 pt-2 font-medium">
                 <span>Total Beban Operasional</span>
                 <span className="text-red-500">({formatCurrency(report.totalExpenses)})</span>
               </div>
             </div>

             {/* Net Profit */}
             <div className={`mt-6 p-4 rounded-xl border ${report.netProfit >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-red-50 border-red-100 text-red-900'} flex justify-between items-center`}>
               <span className="font-bold text-lg">Laba Bersih</span>
               <span className="font-black text-2xl tracking-tight">{formatCurrency(report.netProfit)}</span>
             </div>
           </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-6 text-gray-900">Grafik Pemasukan vs Pengeluaran</h3>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => `Rp${val/1000}k`} />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    cursor={{fill: '#F3F4F6'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Bar dataKey="revenue" name="Pemasukan" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Pengeluaran (HPP + Ops)" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">
              Belum ada data untuk grafik
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
