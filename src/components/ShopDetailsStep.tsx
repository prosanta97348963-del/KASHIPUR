import React, { useState } from 'react';
import { CurrentDraft, SalesBoy } from '../types';
import { StorageService } from '../utils/storage';
import { Store, Phone, MapPin, User, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

interface ShopDetailsStepProps {
  draft: CurrentDraft;
  setDraft: React.Dispatch<React.SetStateAction<CurrentDraft>>;
  currentSalesBoy: SalesBoy | null;
  onStartOrder: () => void;
}

export const ShopDetailsStep: React.FC<ShopDetailsStepProps> = ({
  draft,
  setDraft,
  currentSalesBoy,
  onStartOrder,
}) => {
  const [errors, setErrors] = useState<{
    shopName?: string;
    shopPhone?: string;
    shopAddress?: string;
  }>({});

  const savedShops = StorageService.getSavedShops();

  const handleAutofillShop = (shop: { shopName: string; shopPhone: string; shopAddress: string }) => {
    setDraft((prev) => ({
      ...prev,
      shopName: shop.shopName,
      shopPhone: shop.shopPhone,
      shopAddress: shop.shopAddress,
    }));
    setErrors({});
  };

  const handleValidateAndProceed = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!draft.shopName.trim()) {
      newErrors.shopName = 'Shop Name is required to start order';
    }

    if (!draft.shopPhone.trim()) {
      newErrors.shopPhone = 'Shop Phone Number is required';
    } else if (draft.shopPhone.replace(/\D/g, '').length < 7) {
      newErrors.shopPhone = 'Enter a valid phone number (at least 7-10 digits)';
    }

    if (!draft.shopAddress.trim()) {
      newErrors.shopAddress = 'Shop Address is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onStartOrder();
    }
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

        {/* Sales Boy Name */}
        <div>
          <label className="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
            Sales Boy Name <span className="text-gray-400 font-normal text-[11px]">(Optional)</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              value={draft.salesBoyName || currentSalesBoy?.name || ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, salesBoyName: e.target.value }))}
              placeholder="e.g. Rahul"
              className="w-full pl-10 pr-3 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30 focus:outline-hidden"
            />
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
