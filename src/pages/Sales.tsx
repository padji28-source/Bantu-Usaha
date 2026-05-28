import React, { useState } from 'react';
import { useStore, SaleItem } from '../store/StoreContext';
import { formatCurrency } from '../lib/utils';
import { ShoppingCart, Plus, Minus, Trash2, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function Sales() {
  const { products, sales, addSale } = useStore();
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const addToCart = (product: any) => {
    if (product.stock <= 0) return alert("Stok habis!");
    
    setCart(current => {
      const existing = current.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert("Melebihi stok yang ada!");
          return current;
        }
        return current.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...current, { productId: product.id, quantity: 1, price: product.sellingPrice, hpp: product.hpp }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(current => {
      return current.map(item => {
        if (item.productId === productId) {
          const product = products.find(p => p.id === productId);
          const newQty = item.quantity + delta;
          if (newQty < 1) return item; // handle deletion elsewhere or via trash icon
          if (product && newQty > product.stock) {
            alert("Melebihi stok yang ada!");
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(current => current.filter(item => item.productId !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCOGS = cart.reduce((sum, item) => sum + (item.hpp * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    addSale({
      id: uuidv4(),
      date: new Date().toISOString(),
      items: cart,
      totalRevenue: cartTotal,
      totalCOGS: cartCOGS
    });
    setCart([]);
    setIsMobileCartOpen(false);
  };

  const CartContent = () => (
    <>
      <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center">
          <ShoppingCart className="w-5 h-5 text-gray-500 mr-2" />
          <h3 className="font-bold text-gray-900">Keranjang</h3>
        </div>
        <div className="flex items-center space-x-3">
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
            {cartCount} item
          </span>
          <button className="md:hidden p-1 text-gray-500" onClick={() => setIsMobileCartOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
            <ShoppingCart className="w-12 h-12 mb-3 text-gray-200" />
            <p>Belum ada item di keranjang</p>
          </div>
        ) : (
          cart.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return null;
            return (
              <div key={item.productId} className="flex flex-col border border-gray-100 p-3 rounded-xl bg-gray-50 relative">
                  <div className="flex justify-between items-start mb-2 pr-6">
                    <span className="font-medium text-sm text-gray-900">{product.name}</span>
                    <span className="font-semibold text-sm text-blue-600">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.productId)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-gray-500">{formatCurrency(item.price)} / item</span>
                    <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                      <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-50" disabled={item.quantity <= 1}>
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-medium w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 hover:bg-gray-100 rounded-md">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl">
        <div className="flex justify-between mb-4">
            <span className="text-gray-500">Total Pembayaran</span>
            <span className="text-xl font-bold text-gray-900">{formatCurrency(cartTotal)}</span>
        </div>
        <button 
          onClick={handleCheckout}
          disabled={cart.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors shadow-sm"
        >
          Bayar Pesanan
        </button>
      </div>
    </>
  );

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 relative">
      {/* Product List */}
      <div className="flex-1 space-y-4 pb-24 md:pb-0">
        <div>
           <h2 className="text-2xl font-bold tracking-tight text-gray-900">Penjualan POS</h2>
           <p className="text-gray-500 text-sm mt-1">Pilih produk untuk ditambahkan ke keranjang</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.stock === 0}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-32 transition-all ${
                product.stock === 0 
                  ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed' 
                  : 'border-gray-200 bg-white hover:border-blue-500 hover:shadow-md'
              }`}
            >
              <div className="font-medium text-gray-900 line-clamp-2">{product.name}</div>
              <div className="mt-auto">
                <div className="font-bold text-blue-600">{formatCurrency(product.sellingPrice)}</div>
                <div className="text-xs text-gray-500 mt-1">Stok: {product.stock}</div>
              </div>
            </button>
          ))}
          {products.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl">
              <p className="text-gray-500">Belum ada produk. Tambahkan produk di menu Produk.</p>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Cart Summary */}
      <div className="hidden md:flex w-80 lg:w-96 bg-white border border-gray-200 rounded-2xl shadow-sm flex-col h-[calc(100vh-8rem)] sticky top-6 shrink-0">
        <CartContent />
      </div>

      {/* Mobile Floating Action Bar for Cart */}
      {cartCount > 0 && !isMobileCartOpen && (
        <div className="md:hidden fixed bottom-[72px] left-4 right-4 z-40 bg-blue-900 text-white rounded-2xl p-4 shadow-xl flex items-center justify-between" onClick={() => setIsMobileCartOpen(true)}>
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-full relative">
              <ShoppingCart className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                {cartCount}
              </span>
            </div>
            <div>
              <p className="text-xs text-blue-200 font-medium tracking-wide">Total Pesanan</p>
              <p className="font-bold text-lg leading-tight">{formatCurrency(cartTotal)}</p>
            </div>
          </div>
          <button className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            Lihat
          </button>
        </div>
      )}

      {/* Mobile Cart Modal */}
      {isMobileCartOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex justify-center items-end" onClick={(e) => { if (e.target === e.currentTarget) setIsMobileCartOpen(false); }}>
          <div className="bg-white w-full rounded-t-3xl max-h-[85vh] flex flex-col pt-2 shadow-2xl animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-2" />
            <CartContent />
          </div>
        </div>
      )}
    </div>
  );
}
