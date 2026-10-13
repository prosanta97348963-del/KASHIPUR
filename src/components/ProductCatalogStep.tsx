import React, { useState, useMemo } from 'react';
import { Product, CurrentDraft, CompanySettings } from '../types';
import { Search, Plus, Minus, Store, ShoppingCart, ArrowLeft, ArrowRight, X, Filter } from 'lucide-react';

interface ProductCatalogStepProps {
  products: Product[];
  draft: CurrentDraft;
  setDraft: React.Dispatch<React.SetStateAction<CurrentDraft>>;
  companySettings: CompanySettings;
  onBackToShopDetails: () => void;
  onViewOrder: () => void;
}

export const ProductCatalogStep: React.FC<ProductCatalogStepProps> = ({
  products,
  draft,
  setDraft,
  companySettings,
  onBackToShopDetails,
  onViewOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingDirectQty, setEditingDirectQty] = useState<string | null>(null);

  // Filter only active products
  const activeProducts = useMemo(() => {
    return products.filter((p) => p.active);
  }, [products]);

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    activeProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [activeProducts]);

  // Filter by search & category
  const filteredProducts = useMemo(() => {
    return activeProducts.filter((p) => {
      const matchSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        selectedCategory === 'All' || p.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [activeProducts, searchQuery, selectedCategory]);

  // Order summary calculations
  const { totalItems, totalQuantity, grandTotal } = useMemo(() => {
    let itemsCount = 0;
    let qtyCount = 0;
    let totalAmt = 0;

    Object.entries(draft.selectedQuantities).forEach(([prodId, qty]) => {
      if (qty > 0) {
        itemsCount += 1;
        qtyCount += qty;
        const prod = activeProducts.find((p) => p.id === prodId);
        if (prod) {
          totalAmt += prod.price * qty;
        }
      }
    });

    return {
      totalItems: itemsCount,
      totalQuantity: qtyCount,
      grandTotal: totalAmt,
    };
  }, [draft.selectedQuantities, activeProducts]);

  const updateQuantity = (productId: string, delta: number) => {
    setDraft((prev) => {
      const current = prev.selectedQuantities[productId] || 0;
      const next = Math.max(0, current + delta);
      const newQuantities = { ...prev.selectedQuantities };
      if (next === 0) {
        delete newQuantities[productId];
      } else {
        newQuantities[productId] = next;
      }
      return {
        ...prev,
        selectedQuantities: newQuantities,
      };
    });
  };

  const setDirectQuantity = (productId: string, value: number) => {
    const safeVal = isNaN(value) ? 0 : Math.max(0, Math.floor(value));
    setDraft((prev) => {
      const newQuantities = { ...prev.selectedQuantities };
      if (safeVal === 0) {
        delete newQuantities[productId];
      } else {
        newQuantities[productId] = safeVal;
      }
      return {
        ...prev,
        selectedQuantities: newQuantities,
      };
    });
  };

  const currency = companySettings.currency || '₹';

  return (
    <div className="max-w-md mx-auto pb-32 animate-in fade-in duration-150">
      {/* Active Shop Info Header Bar */}
      <div className="bg-emerald-800 text-white px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-2 truncate">
          <Store className="w-4 h-4 text-emerald-300 shrink-0" />
          <div className="truncate">
            <span className="font-bold text-xs truncate block">{draft.shopName}</span>
            <span className="text-[10px] text-emerald-200 truncate block">
              {draft.shopAddress}
            </span>
          </div>
        </div>
        <button
          onClick={onBackToShopDetails}
          className="text-xs bg-emerald-700 hover:bg-emerald-600 px-2.5 py-1 rounded-md font-semibold text-emerald-100 shrink-0 transition-colors"
        >
          Edit Shop
        </button>
      </div>

      {/* Sticky Search & Category Bar */}
      <div className="sticky top-[89px] z-30 bg-white/95 backdrop-blur-md px-4 py-2.5 border-b border-gray-200 shadow-2xs space-y-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Product Name or Code (e.g. P001)..."
            className="w-full pl-10 pr-9 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30 focus:outline-hidden font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 p-0.5 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills (Horizontal Scrollable) */}
        {categories.length > 2 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap font-semibold transition-colors shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product List */}
      <div className="p-3 space-y-2.5">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-6">
            <Filter className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h4 className="font-bold text-gray-800 text-sm">No products found</h4>
            <p className="text-xs text-gray-500 mt-1">
              Try changing your search terms or category filter.
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          filteredProducts.map((product) => {
            const qty = draft.selectedQuantities[product.id] || 0;
            const hasQuantity = qty > 0;
            const itemTotal = qty * product.price;

            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl border transition-all p-3.5 flex flex-col justify-between shadow-2xs ${
                  hasQuantity
                    ? 'border-emerald-500 ring-2 ring-emerald-500/15 bg-emerald-50/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                        {product.code}
                      </span>
                      {product.category && (
                        <span className="text-[10px] text-gray-400 font-medium">
                          {product.category}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm mt-1 leading-snug">
                      {product.name}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-extrabold text-gray-900">
                      {currency}
                      {product.price.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-gray-400 block">per unit</span>
                  </div>
                </div>

                {/* Tactile Quantity Selector - Big touch targets for one-handed thumb use */}
                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-xs text-gray-500 font-medium">
                    {hasQuantity ? (
                      <span className="text-emerald-700 font-bold">
                        Amount: {currency}
                        {itemTotal.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span>Select quantity:</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5 bg-gray-100 p-1 rounded-xl">
                    {/* Minus button */}
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, -1)}
                      disabled={qty === 0}
                      className={`w-11 h-10 rounded-lg flex items-center justify-center font-bold transition-all active:scale-90 ${
                        qty === 0
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'bg-white text-rose-600 shadow-xs hover:bg-rose-50 border border-gray-200'
                      }`}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    {/* Quantity Display / Tap to Type Direct Input */}
                    {editingDirectQty === product.id ? (
                      <input
                        type="number"
                        min="0"
                        autoFocus
                        value={qty}
                        onBlur={() => setEditingDirectQty(null)}
                        onChange={(e) => setDirectQuantity(product.id, parseInt(e.target.value) || 0)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setEditingDirectQty(null);
                        }}
                        className="w-14 h-10 text-center font-bold text-base text-gray-900 bg-white border border-emerald-500 rounded-lg focus:outline-hidden"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingDirectQty(product.id)}
                        className={`w-14 h-10 rounded-lg flex flex-col items-center justify-center transition-colors ${
                          hasQuantity
                            ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                            : 'bg-white text-gray-700 font-bold border border-gray-200'
                        }`}
                        title="Tap to type custom quantity"
                      >
                        <span className="text-base leading-none">{qty}</span>
                        <span className="text-[8px] opacity-75 font-normal">tap to edit</span>
                      </button>
                    )}

                    {/* Plus button */}
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, 1)}
                      className="w-11 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs transition-all active:scale-90"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sticky Bottom Order Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-300 shadow-2xl">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2 text-xs font-semibold text-gray-700">
            <div className="flex items-center space-x-3">
              <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md">
                Items: <b className="text-emerald-700">{totalItems}</b>
              </span>
              <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md">
                Total Qty: <b className="text-emerald-700">{totalQuantity}</b>
              </span>
            </div>
            <div className="text-right">
              <span className="text-gray-500 text-[11px] block">Total Amount</span>
              <span className="text-base font-extrabold text-emerald-800 leading-none">
                {currency}
                {grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onViewOrder}
            disabled={totalItems === 0}
            className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-base flex items-center justify-center space-x-2 shadow-md transition-all ${
              totalItems > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>VIEW ORDER</span>
            {totalItems > 0 && (
              <span className="bg-emerald-800 text-white text-xs px-2 py-0.5 rounded-full font-bold ml-1">
                {totalQuantity} pcs
              </span>
            )}
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
