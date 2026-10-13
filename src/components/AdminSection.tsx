import React, { useState } from 'react';
import { Product, CompanySettings, SalesBoy } from '../types';
import { ProductMasterView } from './ProductMasterView';
import { AdminSettingsView } from './AdminSettingsView';
import { Package, SlidersHorizontal, Lock } from 'lucide-react';

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
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'settings'>('products');

  return (
    <div className="max-w-md mx-auto p-4 pb-28 animate-in fade-in duration-150 space-y-4">
      {/* Sub tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl">
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
