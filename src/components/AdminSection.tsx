import React, { useState } from 'react';
import { Product, CompanySettings, SalesBoy } from '../types';
import { ProductMasterView } from './ProductMasterView';
import { AdminSettingsView } from './AdminSettingsView';
import { Package, SlidersHorizontal, Lock, LogOut, Shield } from 'lucide-react';

interface AdminSectionProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  settings: CompanySettings;
  onSaveSettings: (settings: CompanySettings) => void;
  salesBoys: SalesBoy[];
  onAddSalesBoy: (boy: Omit<SalesBoy, 'id'>) => void;
  onUpdateSalesBoy: (boy: SalesBoy) => void;
  onDeleteSalesBoy: (id: string) => void;
  onResetAllData: () => void;
  allOrdersCount: number;
  onSyncWithSupabase?: () => Promise<void>;
  onExitAdmin?: () => void;
}

export const AdminSection: React.FC<AdminSectionProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  settings,
  onSaveSettings,
  salesBoys,
  onAddSalesBoy,
  onUpdateSalesBoy,
  onDeleteSalesBoy,
  onResetAllData,
  allOrdersCount,
  onSyncWithSupabase,
  onExitAdmin,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'settings'>('products');

  return (
    <div className="max-w-md mx-auto p-3.5 pb-28 animate-in fade-in duration-150 space-y-3.5">
      {/* Top Admin Security Bar */}
      <div className="bg-gray-900 text-white rounded-2xl p-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs text-white leading-tight">Admin Protected Area</h3>
            <span className="text-[10px] text-gray-400">Owner Access Verified</span>
          </div>
        </div>

        {onExitAdmin && (
          <button
            type="button"
            onClick={onExitAdmin}
            className="flex items-center space-x-1 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-gray-700 active:scale-95"
            title="Lock Admin and return to Salesman Panel"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Admin</span>
          </button>
        )}
      </div>

      {/* Sub tabs */}
      <div className="flex bg-gray-200/80 p-1 rounded-xl">
        <button
          onClick={() => setActiveSubTab('products')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            activeSubTab === 'products'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Products Master</span>
        </button>
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            activeSubTab === 'settings'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Settings & WhatsApp</span>
        </button>
      </div>

      {activeSubTab === 'products' ? (
        <ProductMasterView
          products={products}
          onAddProduct={onAddProduct}
          onUpdateProduct={onUpdateProduct}
          onDeleteProduct={onDeleteProduct}
          companySettings={settings}
        />
      ) : (
        <AdminSettingsView
          settings={settings}
          onSaveSettings={onSaveSettings}
          salesBoys={salesBoys}
          onAddSalesBoy={onAddSalesBoy}
          onUpdateSalesBoy={onUpdateSalesBoy}
          onDeleteSalesBoy={onDeleteSalesBoy}
          onResetAllData={onResetAllData}
          allProductsCount={products.length}
          allOrdersCount={allOrdersCount}
          onSyncWithSupabase={onSyncWithSupabase}
        />
      )}
    </div>
  );
};
