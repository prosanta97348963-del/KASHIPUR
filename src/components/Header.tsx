import React, { useState, useEffect } from 'react';
import { SalesBoy, CompanySettings } from '../types';
import { ShoppingBag, History, Shield, User, Wifi, WifiOff, Store, LogOut, Smartphone } from 'lucide-react';

interface HeaderProps {
  currentTab: 'order' | 'history' | 'admin';
  setCurrentTab: (tab: 'order' | 'history' | 'admin') => void;
  currentSalesBoy: SalesBoy | null;
  onOpenLogin: () => void;
  companySettings: CompanySettings;
  draftItemCount: number;
  isAdminAuthenticated: boolean;
  onExitAdmin: () => void;
  onOpenInstallModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  currentSalesBoy,
  onOpenLogin,
  companySettings,
  draftItemCount,
  isAdminAuthenticated,
  onExitAdmin,
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
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-2xs">
      {/* Top Application Bar */}
      <div className="max-w-md mx-auto px-3.5 py-2.5 flex items-center justify-between">
        {/* Brand & Connection Status */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-2xs shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-sm font-extrabold text-gray-900 leading-none">
                {companySettings.companyName || 'A.R SELLS'}
              </h1>
              {/* Online/Offline status dot */}
              <span
                className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isOnline
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-amber-800 bg-amber-100'
                }`}
                title={isOnline ? 'Network Online' : 'Offline - Orders saved locally'}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-1 ${
                    isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                  }`}
                />
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <span className="text-[11px] font-medium text-gray-500 leading-none block mt-0.5">
              Sales Order App
            </span>
          </div>
        </div>

        {/* Right side: Salesman Profile & Optional Quick Actions */}
        <div className="flex items-center space-x-1.5">
          {/* Quick Install APK button */}
          {onOpenInstallModal && (
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Install App / APK"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          )}

          {/* Salesman Profile Switcher */}
          {currentSalesBoy ? (
            <button
              onClick={onOpenLogin}
              className="flex items-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-full pl-2.5 pr-1 py-1 transition-colors border border-gray-200/80"
              title="Switch Salesman Profile"
            >
              <span className="text-xs font-bold text-gray-800 truncate max-w-[85px] mr-1.5">
                {currentSalesBoy.name.split(' ')[0]}
              </span>
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold shadow-2xs">
                {currentSalesBoy.name.charAt(0)}
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 flex items-center"
            >
              <User className="w-3.5 h-3.5 mr-1" />
              Login
            </button>
          )}
        </div>
      </div>

      {/* Admin Mode Active Banner (Only shown when Admin is logged in via PIN) */}
      {isAdminAuthenticated && (
        <div className="bg-gray-900 text-white px-4 py-1.5 flex items-center justify-between text-xs border-t border-gray-800">
          <div className="flex items-center space-x-1.5 font-bold text-emerald-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Mode (Owner Access)</span>
          </div>
          <button
            onClick={onExitAdmin}
            className="flex items-center space-x-1 text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors"
          >
            <LogOut className="w-3 h-3" />
            <span>Lock & Exit Admin</span>
          </button>
        </div>
      )}

      {/* Navigation Tabs - Strict Salesman Separation */}
      <nav className="max-w-md mx-auto border-t border-gray-100 flex items-stretch bg-gray-50/80">
        {/* Tab 1: New Order */}
        <button
          onClick={() => setCurrentTab('order')}
          className={`flex-1 py-3 px-2 text-center text-xs font-bold flex items-center justify-center space-x-1.5 border-b-2 transition-all ${
            currentTab === 'order'
              ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          <ShoppingBag className="w-4 h-4 shrink-0" />
          <span>New Order</span>
          {draftItemCount > 0 && (
            <span className="bg-emerald-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.2 shrink-0">
              {draftItemCount}
            </span>
          )}
        </button>

        {/* Tab 2: Orders History */}
        <button
          onClick={() => setCurrentTab('history')}
          className={`flex-1 py-3 px-2 text-center text-xs font-bold flex items-center justify-center space-x-1.5 border-b-2 transition-all ${
            currentTab === 'history'
              ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          <History className="w-4 h-4 shrink-0" />
          <span>Orders History</span>
        </button>

        {/* Tab 3: Admin (ONLY visible if Admin PIN was verified!) */}
        {isAdminAuthenticated && (
          <button
            onClick={() => setCurrentTab('admin')}
            className={`flex-1 py-3 px-2 text-center text-xs font-bold flex items-center justify-center space-x-1.5 border-b-2 transition-all ${
              currentTab === 'admin'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Admin Settings</span>
          </button>
        )}
      </nav>
    </header>
  );
};
