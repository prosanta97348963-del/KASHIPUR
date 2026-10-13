import React, { useState } from 'react';
import { SalesBoy, CompanySettings } from '../types';
import { User, Phone, Lock, X, Check, ShieldCheck, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesBoys: SalesBoy[];
  currentSalesBoy: SalesBoy | null;
  onSelectSalesBoy: (salesBoy: SalesBoy) => void;
  companySettings: CompanySettings;
  onAdminLogin?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  salesBoys,
  currentSalesBoy,
  onSelectSalesBoy,
  companySettings,
  onAdminLogin,
}) => {
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');

  if (!isOpen) return null;

  const handleMobilePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const matched = salesBoys.find(
      (sb) => sb.mobile.trim() === mobile.trim() && sb.pin.trim() === pin.trim()
    );

    if (matched) {
      if (!matched.active) {
        setError('This sales account is inactive. Please contact admin.');
        return;
      }
      onSelectSalesBoy(matched);
      onClose();
    } else {
      setError('Invalid Mobile Number or PIN. Please try again.');
    }
  };

  const handleQuickSelect = (sb: SalesBoy) => {
    onSelectSalesBoy(sb);
    onClose();
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput.trim() === (companySettings.adminPin || '9999')) {
      if (onAdminLogin) onAdminLogin();
      onClose();
    } else {
      setError('Incorrect Admin PIN. Default is 9999.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-800 rounded-lg">
              <User className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isAdminMode ? 'Admin Verification' : 'Sales Boy Login'}
              </h3>
              <p className="text-xs text-emerald-100">
                {isAdminMode ? 'Enter PIN to manage catalog & settings' : 'Select your profile to start taking orders'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          {!isAdminMode ? (
            <>
              {/* Quick Select for Fast Field Work */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  1-Tap Quick Select
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {salesBoys
                    .filter((sb) => sb.active)
                    .map((sb) => {
                      const isSelected = currentSalesBoy?.id === sb.id;
                      return (
                        <button
                          key={sb.id}
                          type="button"
                          onClick={() => handleQuickSelect(sb)}
                          className={`w-full p-3 text-left rounded-xl border flex items-center justify-between transition-all active:scale-[0.99] ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400/30'
                              : 'bg-gray-50/70 border-gray-200 hover:border-gray-300 hover:bg-gray-100 text-gray-800'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                                isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {sb.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-sm">{sb.name}</div>
                              <div className="text-xs text-gray-500">📱 {sb.mobile}</div>
                            </div>
                          </div>
                          {isSelected ? (
                            <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full">
                              <Check className="w-3.5 h-3.5 mr-1" /> Active
                            </span>
                          ) : (
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Or Login with Mobile + PIN */}
              <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-400 font-medium">or login with PIN</span>
                </div>
              </div>

              <form onSubmit={handleMobilePinLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    4-Digit PIN
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="password"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="PIN (Default: 1234)"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-lg text-sm shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <span>Verify & Login</span>
                </button>
              </form>

              {/* Admin Access Switch */}
              <div className="pt-2 text-center border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminMode(true);
                    setError('');
                  }}
                  className="text-xs text-gray-500 hover:text-emerald-700 font-semibold inline-flex items-center"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Admin / Owner Access
                </button>
              </div>
            </>
          ) : (
            /* Admin PIN Mode */
            <form onSubmit={handleAdminAuth} className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Owner & Admin Access</h4>
                <p className="text-xs text-gray-500">
                  Enter master PIN to manage products, sales boys and WhatsApp settings.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Admin PIN (Default: 9999)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="password"
                    maxLength={6}
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                    placeholder="Enter Admin PIN"
                    autoFocus
                    className="w-full pl-9 pr-3 py-2.5 text-base text-center tracking-widest font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminMode(false);
                    setError('');
                  }}
                  className="flex-1 py-2.5 px-3 border border-gray-300 text-gray-700 font-semibold rounded-lg text-sm hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow-xs"
                >
                  Unlock Admin
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
