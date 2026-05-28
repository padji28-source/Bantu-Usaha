import React, { useState } from 'react';
import { StoreProvider, useStore } from './store/StoreContext';
import { themeMap } from './lib/theme';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Database, 
  Landmark, 
  Percent, 
  ShoppingCart, 
  Receipt, 
  BarChart3,
  Menu,
  X
} from 'lucide-react';
import { cn } from './lib/utils';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Materials from './pages/Materials';
import Overhead from './pages/Overhead';
import Discounts from './pages/Discounts';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';

const navItems = [
  { path: '/', label: 'Beranda', icon: LayoutDashboard },
  { path: '/products', label: 'Produk & Resep', icon: Package },
  { path: '/materials', label: 'Bahan Baku', icon: Database },
  { path: '/overhead', label: 'Biaya Overhead', icon: Landmark },
  { path: '/discounts', label: 'Kalkulator Diskon', icon: Percent },
  { path: '/sales', label: 'Penjualan / POS', icon: ShoppingCart },
  { path: '/expenses', label: 'Pengeluaran', icon: Receipt },
  { path: '/reports', label: 'Laporan Laba Rugi', icon: BarChart3 },
];

function AppLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useStore();
  const currentTheme = themeMap[theme] || themeMap.blue;
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-gray-55 flex flex-col md:flex-row antialiased text-gray-900 overflow-hidden">
      {/* Mobile Top Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-250 shrink-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-650 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className={cn("w-3 h-3 rounded-full animate-ping", currentTheme.bg)} />
            <h1 className="font-extrabold text-lg tracking-tight text-gray-900">
              Bantu<span className={currentTheme.text}>Usaha</span>
            </h1>
          </div>
        </div>
        
        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 border border-gray-150 px-2.5 py-1 rounded-lg uppercase">
          {currentTheme.name}
        </span>
      </div>

      {/* Mobile Drawer Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-40 animate-fade-in transition-opacity"
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <div 
        className={cn(
          "md:hidden fixed inset-y-0 left-0 w-64 bg-white z-50 border-r border-gray-250 flex flex-col transform transition-transform duration-300 ease-in-out shadow-2xl",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-gray-150 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={cn("w-3 h-3 rounded-full", currentTheme.bg)} />
            <h1 className="font-extrabold text-lg tracking-tight text-gray-900 leading-none">
              Bantu<span className={currentTheme.text}>Usaha</span>
            </h1>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-2 text-gray-450 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileSidebarOpen(false)}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-150 text-sm font-semibold",
                  isActive 
                    ? cn("shadow-xs border", currentTheme.light, currentTheme.textLight, currentTheme.border)
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform", isActive ? currentTheme.text : "text-gray-455")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {currentTheme.name} Mode
          </span>
        </div>
      </div>

      {/* Desktop Sidebar with dynamic theme colors */}
      <nav className="hidden md:flex inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex-col shrink-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className={cn("w-3.5 h-3.5 rounded-full", currentTheme.bg)} />
            <h1 className="font-black text-2xl tracking-tight text-gray-900 leading-none">
              Bantu<span className={currentTheme.text}>Usaha</span>
            </h1>
          </div>
          <span className="text-[10px] mt-1.5 font-bold text-gray-400 uppercase block tracking-widest bg-gray-50 p-1 rounded border border-gray-100 text-center">
            {currentTheme.name} Mode
          </span>
        </div>
        
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-150 text-sm font-semibold",
                  isActive 
                    ? cn("shadow-xs border", currentTheme.light, currentTheme.textLight, currentTheme.border)
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:pl-5 border border-transparent"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform", isActive ? currentTheme.text : "text-gray-450")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full p-4 md:p-8 pb-8">
        <div className="max-w-7xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
}

function MainAppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/products" element={<Products />} />
      <Route path="/materials" element={<Materials />} />
      <Route path="/overhead" element={<Overhead />} />
      <Route path="/discounts" element={<Discounts />} />
      <Route path="/sales" element={<Sales />} />
      <Route path="/expenses" element={<Expenses />} />
      <Route path="/reports" element={<Reports />} />
    </Routes>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppLayout>
          <MainAppRoutes />
        </AppLayout>
      </BrowserRouter>
    </StoreProvider>
  );
}
