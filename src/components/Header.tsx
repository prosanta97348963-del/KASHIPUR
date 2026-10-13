import React, { useState, useEffect } from 'react';
import { SalesBoy, CompanySettings } from '../types';
import { ShoppingBag, History, Settings, User, Wifi, WifiOff, LogOut, Store, Database, Download, Smartphone } from 'lucide-react';

interface HeaderProps {
  currentTab: 'order' | 'history' | 'admin';
  setCurrentTab: (tab: 'order' | 'history' | 'admin') => void;
  currentSalesBoy: SalesBoy | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  companySettings: CompanySettings;
  draftItemCount: number;
  supabaseConnected?: boolean;
  onOpenInstallModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  currentSalesBoy,
  onOpenLogin,
  onLogout,
  companySettings,
  draftItemCount,
  supabaseConnected,
  onOpenInstallModal,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
      {/* Top Banner / Company Name & User Badge */}
      <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight truncate max-w-[170px] sm:max-w-[210px]">
              {companySettings.companyName || 'Sales Order App'}
            </h1>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="inline-flex items-center text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                Order Taking
              </span>
              {/* Online/Offline indicator */}
              <span
                className={`inline-flex items-center text-[10px] px-1.5 py-0.2 rounded font-medium ${
                  isOnline
                    ? 'text-green-700 bg-green-50'
                    : 'text-amber-800 bg-amber-100 font-semibold'
                }`}
                title={isOnline ? 'Online' : 'Offline - Orders saved locally'}
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-2.5 h-2.5 mr-0.5 text-green-600" />
                    Online
                  </>
                ) : (
                  <>
                    <WifiOff className="w-2.5 h-2.5 mr-0.5 text-amber-700" />
                    Offline
                  </>
                )}
              </span>

              {/* Supabase status badge */}
              {supabaseConnected && (
                <span
                  className="inline-flex items-center text-[10px] px-1.5 py-0.2 rounded font-semibold text-teal-800 bg-teal-50 border border-teal-200"
                  title="Supabase Cloud Sync Active"
                >
                  <Database className="w-2.5 h-2.5 mr-0.5 text-teal-600" />
                  Supabase
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Current User Pill & APK Install Button */}
        <div className="flex items-center space-x-1.5">
          {onOpenInstallModal && (
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="px-2 py-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center space-x-1 transition-colors shadow-2xs"
              title="Download APK / Install on Phone"
            >
              <Smartphone className="w-3 h-3 text-emerald-600" />
              <span>APK</span>
            </button>
          )}

          {currentSalesBoy ? (
            <div className="flex items-center bg-gray-100 hover:bg-gray-200 rounded-full pl-2.5 pr-1 py-1 transition-colors">
              <div className="flex flex-col text-right mr-1.5">
                <span className="text-[10px] text-gray-500 leading-none">Sales Boy</span>
                <span className="text-xs font-semibold text-gray-800 leading-tight truncate max-w-[90px]">
                  {currentSalesBoy.name}
                </span>
              </div>
              <button
                onClick={onOpenLogin}
                className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs"
                title="Switch Sales Boy"
              >
                {currentSalesBoy.name.charAt(0)}
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 flex items-center"
            >
              <User className="w-3.5 h-3.5 mr-1" />
              Login
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs - Mobile Finger Friendly */}
      <div className="max-w-md mx-auto px-2 border-t border-gray-100 flex items-center justify-around bg-gray-50/70">
        <button
          onClick={() => setCurrentTab('order')}
          className={`flex-1 py-2.5 px-2 text-center text-xs font-semibold flex items-center justify-center space-x-1.5 border-b-2 transition-colors ${
            currentTab === 'order'
              ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>New Order</span>
          {draftItemCount > 0 && (
            <span className="bg-emerald-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.2">
              {draftItemCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentTab('history')}
          className={`flex-1 py-2.5 px-2 text-center text-xs font-semibold flex items-center justify-center space-x-1.5 border-b-2 transition-colors ${
            currentTab === 'history'
              ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Orders</span>
        </button>

        <button
          onClick={() => setCurrentTab('admin')}
          className={`flex-1 py-2.5 px-2 text-center text-xs font-semibold flex items-center justify-center space-x-1.5 border-b-2 transition-colors ${
            currentTab === 'admin'
              ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Admin</span>
        </button>
      </div>
    </header>
  );
};
