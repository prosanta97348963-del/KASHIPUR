import React, { useState } from 'react';
import { Product, CompanySettings } from '../types';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, Save, X, Package, RotateCcw } from 'lucide-react';

interface ProductMasterViewProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  companySettings: CompanySettings;
  onReloadCatalog?: () => void;
}

export const ProductMasterView: React.FC<ProductMasterViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  companySettings,
  onReloadCatalog,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [category, setCategory] = useState('');
  const [active, setActive] = useState(true);

  const currency = companySettings.currency || '₹';

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    // Auto suggest next SKU code
    const existingCount = products.length + 1;
    setCode(`P${String(existingCount).padStart(3, '0')}`);
    setPrice('');
    setCategory('General');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setCode(product.code);
    setPrice(product.price);
    setCategory(product.category || '');
    setActive(product.active);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    const numPrice = Number(price) || 0;

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        price: numPrice,
        category: category.trim() || 'General',
        active,
      });
    } else {
      onAddProduct({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        price: numPrice,
        category: category.trim() || 'General',
        active,
      });
    }

    setIsModalOpen(false);
  };

  const toggleProductActive = (product: Product) => {
    onUpdateProduct({
      ...product,
      active: !product.active,
    });
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Product Master</h3>
          <p className="text-xs text-gray-500">
            {products.filter((p) => p.active).length} Active • {products.length} Total
          </p>
        </div>
        <div className="flex items-center space-x-1.5">
          {onReloadCatalog && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Reload official A.R SELLS catalog? This will restore all standard products.')) {
                  onReloadCatalog();
                }
              }}
              className="px-2.5 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-bold text-xs rounded-xl flex items-center space-x-1 transition-colors"
              title="Reload all standard products"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reload Catalog</span>
            </button>
          )}
          <button
            onClick={openAddModal}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name or code..."
          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-400 font-medium"
        />
      </div>

      {/* Info notice */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-2.5 text-xs">
        💡 <b>Rule:</b> Only <b>Active</b> products are visible to sales boys when taking orders. Inactive items are hidden.
      </div>

      {/* Products list */}
      <div className="space-y-2">
        {filtered.map((product) => (
          <div
            key={product.id}
            className={`p-3 bg-white rounded-xl border flex items-center justify-between transition-all ${
              product.active ? 'border-gray-200' : 'border-gray-200 bg-gray-50/60 opacity-60'
            }`}
          >
            <div className="flex-1 pr-2">
              <div className="flex items-center space-x-1.5">
                <span className="font-mono text-[10px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.2 rounded">
                  {product.code}
                </span>
                <button
                  type="button"
                  onClick={() => toggleProductActive(product)}
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full cursor-pointer ${
                    product.active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {product.active ? 'Active' : 'Inactive'}
                </button>
              </div>
              <h4 className="font-bold text-sm text-gray-900 mt-0.5">{product.name}</h4>
              <div className="text-xs font-extrabold text-emerald-800 mt-0.5">
                {currency}{product.price.toLocaleString('en-IN')}
                {product.category && (
                  <span className="text-[10px] text-gray-400 font-normal ml-2">
                    ({product.category})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => openEditModal(product)}
                className="p-2 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Edit Product"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete "${product.name}"?`)) {
                    onDeleteProduct(product.id);
                  }
                }}
                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete Product"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-4 py-3 bg-emerald-800 text-white flex items-center justify-between">
              <h4 className="font-bold text-sm">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. HALDI MASALA(₹5/-)"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Code / SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. P001"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Price ({currency}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="100"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Category (Optional)
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Biscuits, Beverages, Snacks"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="active-toggle"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <label htmlFor="active-toggle" className="text-xs font-bold text-gray-800">
                  Active (Visible to Sales Boys)
                </label>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-xs font-bold border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
