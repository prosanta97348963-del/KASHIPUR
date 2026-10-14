import React, { useState } from 'react';
import { CurrentDraft, SalesBoy } from '../types';
import { StorageService } from '../utils/storage';
import { validateShopDetails } from '../utils/orderValidation';
import { Store, Phone, MapPin, User, ArrowRight, AlertCircle, Sparkles, LogIn } from 'lucide-react';

interface ShopDetailsStepProps {
  draft: CurrentDraft;
  setDraft: React.Dispatch<React.SetStateAction<CurrentDraft>>;
  currentSalesBoy: SalesBoy | null;
  onStartOrder: () => void;
  onOpenLogin?: () => void;
}

export const ShopDetailsStep: React.FC<ShopDetailsStepProps> = ({
  draft,
  setDraft,
  currentSalesBoy,
  onStartOrder,
  onOpenLogin,
}) => {
  const [errors, setErrors] = useState<{
    shopName?: string;
    shopPhone?: string;
    shopAddress?: string;
    salesBoy?: string;
  }>({});

  const savedShops = StorageService.getSavedShops();

  const handleAutofillShop = (shop: { shopName: string; shopPhone: string; shopAddress: string }) => {
    setDraft((prev) => ({
      ...prev,
      shopName: shop.shopName,
      shopPhone: shop.shopPhone,
      shopAddress: shop.shopAddress,
    }));
    setErrors((prev) => ({ ...prev, shopName: undefined, shopPhone: undefined, shopAddress: undefined }));
  };

  const handleValidateAndProceed = (e: React.FormEvent) => {
    e.preventDefault();

    // Check salesman login
    if (!currentSalesBoy) {
      setErrors((prev) => ({
        ...prev,
        salesBoy: 'Salesman authentication is required. Please login with your PIN to start taking orders.',
      }));
      if (onOpenLogin) onOpenLogin();
      return;
    }

    const valResult = validateShopDetails({
      shopName: draft.shopName,
      shopPhone: draft.shopPhone,
      shopAddress: draft.shopAddress,
    });

    if (!valResult.isValid) {
      setErrors(valResult.errors);
      return;
    }

    setErrors({});
    onStartOrder();
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-20 animate-in fade-in duration-150">
      {/* Intro Card */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-5 mb-4 shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-white/15 backdrop-blur-xs rounded-xl">
            <Store className="w-6 h-6 text-emerald-100" />
          </div>
          <div>
            <h2 className="text-lg font-bold">New Sales Order</h2>
            <p className="text-xs text-emerald-100">Step 1 of 3: Enter shop & customer details</p>
          </div>
        </div>
        <p className="text-xs text-emerald-50 mt-1 leading-relaxed">
          Fill in the retail shop details below to begin adding products to the order.
        </p>
      </div>

      {/* Salesman Login prompt if not logged in */}
      {!currentSalesBoy && (
        <div className="mb-4 bg-amber-50 border border-amber-300 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-900 block">Salesman Login Required</span>
              <span className="text-[11px] text-amber-700">Login with your PIN before placing orders</span>
            </div>
          </div>
          {onOpenLogin && (
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center space-x-1"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}
        </div>
      )}

      {/* Quick Repeat Shop Autofill Chips */}
      {savedShops.length > 0 && (
        <div className="mb-4 bg-emerald-50/70 border border-emerald-100 rounded-xl p-3">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-900 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Quick Select Recent Shop (1-Tap):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {savedShops.slice(0, 4).map((shop, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAutofillShop(shop)}
                className="text-left text-xs bg-white hover:bg-emerald-100 border border-emerald-200 text-emerald-950 px-2.5 py-1.5 rounded-lg transition-colors font-medium active:scale-95 shadow-2xs"
              >
                🏪 {shop.shopName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleValidateAndProceed} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
        {errors.salesBoy && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errors.salesBoy}</span>
          </div>
        )}

        {/* Shop Name */}
        <div>
          <label className="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
            Shop Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Store className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              required
              value={draft.shopName}
              onChange={(e) => {
                setDraft((prev) => ({ ...prev, shopName: e.target.value }));
                if (errors.shopName) setErrors((prev) => ({ ...prev, shopName: undefined }));
              }}
              placeholder="e.g. ABC Store / Sharma Kirana"
              className={`w-full pl-10 pr-3 py-3 text-sm font-medium border rounded-xl focus:outline-hidden transition-all ${
                errors.shopName
                  ? 'border-red-400 bg-red-50/40 focus:ring-2 focus:ring-red-400'
                  : 'border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30'
              }`}
            />
          </div>
          {errors.shopName && (
            <p className="mt-1 text-xs text-red-600 flex items-center">
              <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
              {errors.shopName}
            </p>
          )}
        </div>

        {/* Shop Phone Number */}
        <div>
          <label className="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
            Shop Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="tel"
              required
              value={draft.shopPhone}
              onChange={(e) => {
                setDraft((prev) => ({ ...prev, shopPhone: e.target.value }));
                if (errors.shopPhone) setErrors((prev) => ({ ...prev, shopPhone: undefined }));
              }}
              placeholder="e.g. 9876543210"
              className={`w-full pl-10 pr-3 py-3 text-sm font-medium border rounded-xl focus:outline-hidden transition-all ${
                errors.shopPhone
                  ? 'border-red-400 bg-red-50/40 focus:ring-2 focus:ring-red-400'
                  : 'border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30'
              }`}
            />
          </div>
          {errors.shopPhone && (
            <p className="mt-1 text-xs text-red-600 flex items-center">
              <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
              {errors.shopPhone}
            </p>
          )}
        </div>

        {/* Shop Address */}
        <div>
          <label className="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
            Shop Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <textarea
              rows={2}
              required
              value={draft.shopAddress}
              onChange={(e) => {
                setDraft((prev) => ({ ...prev, shopAddress: e.target.value }));
                if (errors.shopAddress) setErrors((prev) => ({ ...prev, shopAddress: undefined }));
              }}
              placeholder="e.g. Kolkata, West Bengal (Market, Street, Landmark)"
              className={`w-full pl-10 pr-3 py-2.5 text-sm font-medium border rounded-xl focus:outline-hidden transition-all ${
                errors.shopAddress
                  ? 'border-red-400 bg-red-50/40 focus:ring-2 focus:ring-red-400'
                  : 'border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30'
              }`}
            />
          </div>
          {errors.shopAddress && (
            <p className="mt-1 text-xs text-red-600 flex items-center">
              <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
              {errors.shopAddress}
            </p>
          )}
        </div>

        {/* Salesman info display */}
        <div>
          <label className="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
            Salesman
          </label>
          <div className="relative flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="flex items-center space-x-2 text-xs">
              <User className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-gray-900">
                {currentSalesBoy ? currentSalesBoy.name : 'Not logged in'}
              </span>
              {currentSalesBoy && (
                <span className="text-[11px] text-gray-500 font-mono">({currentSalesBoy.mobile})</span>
              )}
            </div>
            {onOpenLogin && (
              <button
                type="button"
                onClick={onOpenLogin}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold underline"
              >
                {currentSalesBoy ? 'Switch' : 'Login'}
              </button>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-base rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
          >
            <span>START ORDER</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-[11px] text-gray-400 text-center mt-2 font-medium">
            Order cannot start until Shop Name, Phone, and Address are entered.
          </p>
        </div>
      </form>
    </div>
  );
};
