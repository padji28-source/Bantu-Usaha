import React, { createContext, useContext, useEffect, useState } from 'react';

export type Material = {
  id: string;
  name: string;
  type: 'Bahan' | 'Packaging';
  cost: number; // Harga pembelian pacakage
  volume: number; // Berat/volume dalam package (misal 1000 gram)
  unit: string; // Unit (gram, ml, pcs, lembar)
  priceHistory: { date: string; cost: number; reason: string }[];
};

export type ProductIngredient = {
  materialId: string;
  quantityNeeded: number; // Volume/berat yang digunakan per porsi
};

export type Product = {
  id: string;
  name: string;
  stock: number;
  hpp: number; // Harga Pokok Penjualan (Bahan Baku + Overhead)
  sellingPrice: number;
  ingredients: ProductIngredient[];
  overheadManual?: number; // Nilai overhead manual per produk jika tidak pakai otomatis
  markupPercent?: number; // Target margin %
  taxPercent?: number; // Pajak %
  feeOnlinePercent?: number; // Fee channel online %
};

export type SaleItem = {
  productId: string;
  quantity: number;
  price: number;
  hpp: number;
};

export type Sale = {
  id: string;
  date: string;
  items: SaleItem[];
  totalRevenue: number;
  totalCOGS: number;
};

export type Expense = {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
};

export type OverheadCategory = {
  id: string;
  name: string;
  amount: number; // Pengambilan bulanan
};

export type OverheadSetup = {
  targetSalesPerMonth: number;
  categories: OverheadCategory[];
};

export type Discount = {
  id: string;
  productId: string;
  discountPercent: number;
  status: 'Aktif' | 'Inaktif';
  description: string;
  dateAdded: string;
};

export type PriceHistoryLog = {
  id: string;
  productId: string;
  productName: string;
  oldSellingPrice: number;
  newSellingPrice: number;
  oldHpp: number;
  newHpp: number;
  date: string;
  reason: string;
};

export type ThemeName = 'blue' | 'green' | 'purple' | 'orange' | 'brown' | 'dark' | 'neon' | 'red';

type StoreState = {
  products: Product[];
  materials: Material[];
  sales: Sale[];
  expenses: Expense[];
  overhead: OverheadSetup;
  discounts: Discount[];
  priceLogs: PriceHistoryLog[];
  theme: ThemeName;
  
  // Actions
  addProduct: (product: Product) => void;
  updateProduct: (product: Product, reason?: string) => void;
  deleteProduct: (id: string) => void;
  
  addMaterial: (material: Material) => void;
  updateMaterial: (material: Material, reason?: string) => void;
  deleteMaterial: (id: string) => void;
  
  addSale: (sale: Sale) => void;
  deleteSale: (id: string) => void;
  
  addExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  
  updateOverhead: (overhead: OverheadSetup) => void;
  
  addDiscount: (discount: Discount) => void;
  updateDiscount: (discount: Discount) => void;
  deleteDiscount: (id: string) => void;
  
  setTheme: (theme: ThemeName) => void;
  addPriceLog: (log: PriceHistoryLog) => void;
  recalculateProductHpp: (productId: string, updatedMaterials?: Material[], updatedOverhead?: OverheadSetup) => number;
};

const StoreContext = createContext<StoreState | undefined>(undefined);

// Initial Default Raw Materials
const defaultMaterials: Material[] = [
  { id: 'm1', name: 'Kopi Arabica Murni', type: 'Bahan', cost: 150000, volume: 1000, unit: 'gram', priceHistory: [{ date: '2026-05-01T00:00:00Z', cost: 150000, reason: 'Harga Awal' }] },
  { id: 'm2', name: 'Susu Segar Pasteur', type: 'Bahan', cost: 24000, volume: 1000, unit: 'ml', priceHistory: [{ date: '2026-05-01T00:00:00Z', cost: 24000, reason: 'Harga Awal' }] },
  { id: 'm3', name: 'Gula Aren Cair Super', type: 'Bahan', cost: 30000, volume: 1000, unit: 'gram', priceHistory: [{ date: '2026-05-01T00:00:00Z', cost: 30000, reason: 'Harga Awal' }] },
  { id: 'm4', name: 'Gelas Cup Plastik 16oz', type: 'Packaging', cost: 25000, volume: 50, unit: 'pcs', priceHistory: [{ date: '2026-05-01T00:00:00Z', cost: 25000, reason: 'Harga Awal' }] },
  { id: 'm5', name: 'Sedotan Plastik Hitam', type: 'Packaging', cost: 5000, volume: 100, unit: 'pcs', priceHistory: [{ date: '2026-05-01T00:00:00Z', cost: 5000, reason: 'Harga Awal' }] },
  { id: 'm6', name: 'Cokelat Bubuk Premium', type: 'Bahan', cost: 80000, volume: 1000, unit: 'gram', priceHistory: [{ date: '2026-05-01T00:00:00Z', cost: 80000, reason: 'Harga Awal' }] },
];

// Initial default overhead cost setup
const defaultOverhead: OverheadSetup = {
  targetSalesPerMonth: 3000,
  categories: [
    { id: 'o1', name: 'Sewa Tempat Tahunan', amount: 2000000 },
    { id: 'o2', name: 'Listrik, Air & Internet', amount: 1000000 },
    { id: 'o3', name: 'Gaji Tenaga Kerja', amount: 1500000 },
    { id: 'o4', name: 'Pemasaran & Ads', amount: 364250 },
  ]
};

// Default Products using Recipe setup
const defaultProducts: Product[] = [
  {
    id: '1',
    name: 'Kopi Susu Gula Aren',
    stock: 50,
    hpp: 8921, // 7300 (Bahan) + 1621 (Overhead)
    sellingPrice: 18000,
    ingredients: [
      { materialId: 'm1', quantityNeeded: 15 }, // 15g * Rp150/g = Rp2.250
      { materialId: 'm2', quantityNeeded: 150 }, // 150ml * Rp24/ml = Rp3.600
      { materialId: 'm3', quantityNeeded: 30 }, // 30g * Rp30/g = Rp900
      { materialId: 'm4', quantityNeeded: 1 }, // 1pcs * Rp500 = Rp500
      { materialId: 'm5', quantityNeeded: 1 }, // 1pcs * Rp50 = Rp50
    ],
    markupPercent: 40,
    taxPercent: 5,
    feeOnlinePercent: 10
  },
  {
    id: '2',
    name: 'Americano Ice',
    stock: 30,
    hpp: 5121, // 3500 (Bahan) + 1621 (Overhead)
    sellingPrice: 15000,
    ingredients: [
      { materialId: 'm1', quantityNeeded: 20 }, // 20g * Rp150/g = Rp3.000
      { materialId: 'm4', quantityNeeded: 1 }, // 1pcs = Rp500
    ],
    markupPercent: 50,
    taxPercent: 5,
    feeOnlinePercent: 10
  }
];

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [overhead, setOverhead] = useState<OverheadSetup>({ targetSalesPerMonth: 3000, categories: [] });
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [priceLogs, setPriceLogs] = useState<PriceHistoryLog[]>([]);
  const [theme, setThemeState] = useState<ThemeName>('blue');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedProducts = localStorage.getItem('bantuusaha_products');
    const storedMaterials = localStorage.getItem('bantuusaha_materials');
    const storedSales = localStorage.getItem('bantuusaha_sales');
    const storedExpenses = localStorage.getItem('bantuusaha_expenses');
    const storedOverhead = localStorage.getItem('bantuusaha_overhead');
    const storedDiscounts = localStorage.getItem('bantuusaha_discounts');
    const storedPriceLogs = localStorage.getItem('bantuusaha_pricelogs');
    const storedTheme = localStorage.getItem('bantuusaha_theme');

    if (storedMaterials) setMaterials(JSON.parse(storedMaterials));
    else setMaterials(defaultMaterials);

    if (storedOverhead) setOverhead(JSON.parse(storedOverhead));
    else setOverhead(defaultOverhead);

    if (storedProducts) {
      setProducts(JSON.parse(storedProducts));
    } else {
      setProducts(defaultProducts);
    }

    if (storedSales) setSales(JSON.parse(storedSales));
    if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
    if (storedDiscounts) setDiscounts(JSON.parse(storedDiscounts));
    if (storedPriceLogs) setPriceLogs(JSON.parse(storedPriceLogs));
    if (storedTheme) setThemeState(storedTheme as ThemeName);

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('bantuusaha_products', JSON.stringify(products));
      localStorage.setItem('bantuusaha_materials', JSON.stringify(materials));
      localStorage.setItem('bantuusaha_sales', JSON.stringify(sales));
      localStorage.setItem('bantuusaha_expenses', JSON.stringify(expenses));
      localStorage.setItem('bantuusaha_overhead', JSON.stringify(overhead));
      localStorage.setItem('bantuusaha_discounts', JSON.stringify(discounts));
      localStorage.setItem('bantuusaha_pricelogs', JSON.stringify(priceLogs));
      localStorage.setItem('bantuusaha_theme', theme);
    }
  }, [products, materials, sales, expenses, overhead, discounts, priceLogs, theme, isLoaded]);

  // Helper HPP recalculating formula
  const recalculateProductHpp = (productId: string, updatedMaterials: Material[] = materials, updatedOverhead: OverheadSetup = overhead): number => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return 0;

    // 1. Calculate raw materials cost
    let materialsCost = 0;
    prod.ingredients.forEach(ing => {
      const mat = updatedMaterials.find(m => m.id === ing.materialId);
      if (mat && mat.volume > 0) {
        materialsCost += (ing.quantityNeeded / mat.volume) * mat.cost;
      }
    });

    // 2. Calculate overhead split cost
    let overheadCost = 0;
    if (prod.overheadManual !== undefined) {
      overheadCost = prod.overheadManual;
    } else {
      const totalMonthlyOverhead = updatedOverhead.categories.reduce((sum, c) => sum + c.amount, 0);
      const units = updatedOverhead.targetSalesPerMonth || 1;
      overheadCost = totalMonthlyOverhead / units;
    }

    return Math.round(materialsCost + overheadCost);
  };

  const addProduct = (product: Product) => setProducts([...products, product]);
  
  const updateProduct = (updated: Product, reason: string = 'Update Info Produk') => {
    const oldProd = products.find(p => p.id === updated.id);
    if (oldProd && (oldProd.sellingPrice !== updated.sellingPrice || oldProd.hpp !== updated.hpp)) {
      // Log price changes
      const newLog: PriceHistoryLog = {
        id: Math.random().toString(36).substr(2, 9),
        productId: updated.id,
        productName: updated.name,
        oldSellingPrice: oldProd.sellingPrice,
        newSellingPrice: updated.sellingPrice,
        oldHpp: oldProd.hpp,
        newHpp: updated.hpp,
        date: new Date().toISOString(),
        reason: reason
      };
      setPriceLogs(prev => [newLog, ...prev]);
    }
    setProducts(products.map(p => p.id === updated.id ? updated : p));
  };

  const deleteProduct = (id: string) => setProducts(products.filter(p => p.id !== id));

  const addMaterial = (material: Material) => setMaterials([...materials, material]);
  
  // Custom update material that automatically propagates to all linked product HPPs
  const updateMaterial = (updatedMat: Material, reason: string = 'Penyesuaian Harga') => {
    // 1. Update the material array itself with priceHistory appended
    const updatedMats = materials.map(m => {
      if (m.id === updatedMat.id) {
        const history = [...m.priceHistory];
        if (m.cost !== updatedMat.cost) {
          history.push({ date: new Date().toISOString(), cost: updatedMat.cost, reason });
        }
        return { ...updatedMat, priceHistory: history };
      }
      return m;
    });
    setMaterials(updatedMats);

    // 2. Reprocess and recalculate HPP for all products using this material
    const updatedProds = products.map(p => {
      const usesMaterial = p.ingredients.some(ing => ing.materialId === updatedMat.id);
      if (usesMaterial) {
        // Recalculate HPP
        let materialsCost = 0;
        p.ingredients.forEach(ing => {
          const mat = ing.materialId === updatedMat.id ? updatedMat : materials.find(m => m.id === ing.materialId);
          if (mat && mat.volume > 0) {
            materialsCost += (ing.quantityNeeded / mat.volume) * mat.cost;
          }
        });

        const totalMonthlyOverhead = overhead.categories.reduce((sum, c) => sum + c.amount, 0);
        const units = overhead.targetSalesPerMonth || 1;
        const overheadCost = p.overheadManual !== undefined ? p.overheadManual : totalMonthlyOverhead / units;
        const newHpp = Math.round(materialsCost + overheadCost);

        // Track price change if HPP changed
        if (p.hpp !== newHpp) {
          const newLog: PriceHistoryLog = {
            id: Math.random().toString(36).substr(2, 9),
            productId: p.id,
            productName: p.name,
            oldSellingPrice: p.sellingPrice,
            newSellingPrice: p.sellingPrice,
            oldHpp: p.hpp,
            newHpp: newHpp,
            date: new Date().toISOString(),
            reason: `Penyesuaian HPP akibat perubahan harga bahan (${updatedMat.name})`
          };
          setPriceLogs(prev => [newLog, ...prev]);
        }

        return { ...p, hpp: newHpp };
      }
      return p;
    });
    setProducts(updatedProds);
  };

  const deleteMaterial = (id: string) => setMaterials(materials.filter(m => m.id !== id));

  // Overhead updates also recalculate all automated overhead product HPPs
  const updateOverhead = (newOverhead: OverheadSetup) => {
    setOverhead(newOverhead);
    
    // Recalculate HPP for products that use dynamic overhead calculation
    const updatedProds = products.map(p => {
      if (p.overheadManual === undefined) {
        let materialsCost = 0;
        p.ingredients.forEach(ing => {
          const mat = materials.find(m => m.id === ing.materialId);
          if (mat && mat.volume > 0) {
            materialsCost += (ing.quantityNeeded / mat.volume) * mat.cost;
          }
        });

        const totalMonthlyOverhead = newOverhead.categories.reduce((sum, c) => sum + c.amount, 0);
        const units = newOverhead.targetSalesPerMonth || 1;
        const overheadCost = totalMonthlyOverhead / units;
        const newHpp = Math.round(materialsCost + overheadCost);

        if (p.hpp !== newHpp) {
          const newLog: PriceHistoryLog = {
            id: Math.random().toString(36).substr(2, 9),
            productId: p.id,
            productName: p.name,
            oldSellingPrice: p.sellingPrice,
            newSellingPrice: p.sellingPrice,
            oldHpp: p.hpp,
            newHpp: newHpp,
            date: new Date().toISOString(),
            reason: 'Penyesuaian HPP akibat perubahan Biaya Overhead bulanan'
          };
          setPriceLogs(prev => [newLog, ...prev]);
        }
        return { ...p, hpp: newHpp };
      }
      return p;
    });
    setProducts(updatedProds);
  };

  const addSale = (sale: Sale) => {
    setSales([...sales, sale]);
    // update stock
    const newProducts = [...products];
    sale.items.forEach(item => {
      const p = newProducts.find(p => p.id === item.productId);
      if (p) p.stock -= item.quantity;
    });
    setProducts(newProducts);
  };
  const deleteSale = (id: string) => setSales(sales.filter(s => s.id !== id));

  const addExpense = (expense: Expense) => setExpenses([...expenses, expense]);
  const deleteExpense = (id: string) => setExpenses(expenses.filter(e => e.id !== id));

  const addDiscount = (discount: Discount) => setDiscounts([...discounts, discount]);
  const updateDiscount = (updated: Discount) => setDiscounts(discounts.map(d => d.id === updated.id ? updated : d));
  const deleteDiscount = (id: string) => setDiscounts(discounts.filter(d => d.id !== id));
  
  const setTheme = (selectedTheme: ThemeName) => setThemeState(selectedTheme);
  const addPriceLog = (log: PriceHistoryLog) => setPriceLogs(prev => [log, ...prev]);

  if (!isLoaded) return null;

  return (
    <StoreContext.Provider value={{
      products, materials, sales, expenses, overhead, discounts, priceLogs, theme,
      addProduct, updateProduct, deleteProduct,
      addMaterial, updateMaterial, deleteMaterial,
      addSale, deleteSale, addExpense, deleteExpense,
      updateOverhead,
      addDiscount, updateDiscount, deleteDiscount,
      setTheme, addPriceLog, recalculateProductHpp
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
}
