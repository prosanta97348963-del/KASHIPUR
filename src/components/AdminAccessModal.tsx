import React, { useState } from 'react';
import { Lock, X, ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react';

interface AdminAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPin: string;
}

export const AdminAccessModal: React.FC<AdminAccessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  correctPin,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetPin = (correctPin || '9999').trim();

    if (pin.trim() === targetPin) {
      setPin('');
      setError('');
      onSuccess();
      onClose();
    } else {
      setError('Access Denied: Incorrect Admin PIN.');
      setPin('');
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full sm:max-w-xs rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gray-900 text-white p-5 text-center relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2">
            <Lock className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h3 className="font-bold text-base tracking-tight">Access Admin</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Restricted area. Enter Admin Security PIN.
          </p>
        </div>

        {/* Content & PIN Input */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold text-center flex items-center justify-center space-x-1.5 animate-in shake duration-150">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Masked PIN Display */}
          <div className="text-center py-1">
            <div className="flex justify-center items-center space-x-3 mb-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    pin.length > idx
                      ? 'bg-emerald-600 border-emerald-600 scale-110'
                      : 'border-gray-300 bg-gray-100'
                  }`}
                />
              ))}
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              placeholder="••••"
              autoFocus
              className="w-full text-center tracking-[0.5em] font-mono text-xl py-2 border-b-2 border-gray-300 focus:border-emerald-600 focus:outline-hidden bg-transparent"
            />
          </div>

          {/* Numeric Keypad for fast phone entry */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-12 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-900 font-bold text-lg flex items-center justify-center shadow-2xs border border-gray-200 transition-all active:scale-95"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="h-12 rounded-xl text-gray-500 hover:text-gray-800 text-xs font-bold flex items-center justify-center"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-12 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-900 font-bold text-lg flex items-center justify-center shadow-2xs border border-gray-200 transition-all active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="h-12 rounded-xl text-gray-600 hover:text-rose-600 text-xs font-bold flex items-center justify-center"
            >
              ⌫
            </button>
          </div>

          <button
            type="submit"
            disabled={pin.length < 4}
            className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center space-x-2 shadow-md transition-all ${
              pin.length >= 4
                ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white active:scale-98'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Verify & Open Admin</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
