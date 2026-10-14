import React, { useState } from 'react';
import { SalesBoy } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { User, Phone, Lock, X, Check, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesBoys: SalesBoy[];
  currentSalesBoy: SalesBoy | null;
  onSelectSalesBoy: (salesBoy: SalesBoy) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  salesBoys,
  currentSalesBoy,
  onSelectSalesBoy,
}) => {
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectStaff = (sb: SalesBoy) => {
    setSelectedStaffId(sb.id);
    setMobile(sb.mobile);
    setError('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanMobile = mobile.trim();
    const cleanPin = pin.trim();

    if (!cleanMobile) {
      setError('Please enter or select your mobile number.');
      return;
    }

    if (!cleanPin) {
      setError('Please enter your 4-digit salesman PIN.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await SupabaseService.verifySalesmanLogin(cleanMobile, cleanPin, salesBoys);
      if (res.success && res.salesman) {
        onSelectSalesBoy(res.salesman);
        setPin('');
        setError('');
        onClose();
      } else {
        setError(res.message || 'Invalid Mobile Number or PIN.');
        setPin('');
      }
    } catch (err: any) {
      setError(err.message || 'Error verifying credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const activeSalesStaff = salesBoys.filter((sb) => sb.active);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Salesman Login</h3>
              <p className="text-xs text-emerald-100">
                Enter your secure 4-digit PIN to authenticate
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

        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Staff Select (Fills mobile, still REQUIRES PIN) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Select Your Name (or type mobile below)
            </label>
            <div className="grid grid-cols-1 gap-2">
              {activeSalesStaff.map((sb) => {
                const isSelected = selectedStaffId === sb.id || (mobile.trim() === sb.mobile.trim() && mobile !== '');
                return (
                  <button
                    key={sb.id}
                    type="button"
                    onClick={() => handleSelectStaff(sb)}
                    className={`w-full p-2.5 text-left rounded-xl border flex items-center justify-between transition-all active:scale-[0.99] ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {sb.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-gray-900">{sb.name}</div>
                        <div className="text-[11px] text-gray-500 font-mono">📱 {sb.mobile}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center">
                        <Check className="w-3 h-3 mr-1" /> Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value);
                    setError('');
                  }}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Salesman 4-Digit Security PIN
                </label>
                <span className="text-[10px] text-emerald-700 font-medium">PIN verification required</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                  placeholder="••••"
                  autoFocus={Boolean(mobile)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden tracking-widest font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !mobile.trim() || pin.length < 4}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-xs transition-all flex items-center justify-center space-x-2 ${
                isLoading || !mobile.trim() || pin.length < 4
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white active:scale-98'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  <span>Verifying PIN...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify PIN & Start Ordering</span>
                </>
              )}
            </button>
          </form>

          {currentSalesBoy && (
            <div className="pt-2 text-center border-t border-gray-100">
              <span className="text-xs text-gray-500">Currently logged in as: </span>
              <span className="text-xs font-bold text-gray-800">{currentSalesBoy.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
