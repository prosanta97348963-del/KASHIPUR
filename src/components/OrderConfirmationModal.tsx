import React from 'react';
import { CheckCircle, AlertCircle, X, Loader2, RefreshCw } from 'lucide-react';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  shopName: string;
  totalQuantity: number;
  grandTotal: number;
  currency: string;
  isSubmitting?: boolean;
  submitStatusText?: string;
  submissionError?: string | null;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  shopName,
  totalQuantity,
  grandTotal,
  currency,
  isSubmitting = false,
  submitStatusText = 'Saving order securely...',
  submissionError = null,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          {isSubmitting ? (
            <Loader2 className="w-8 h-8 stroke-[2.2] animate-spin text-emerald-600" />
          ) : (
            <CheckCircle className="w-8 h-8 stroke-[2.2]" />
          )}
        </div>

        <h3 className="text-lg font-extrabold text-gray-900 leading-tight">
          {isSubmitting ? 'Saving Order...' : 'Confirm Sales Order'}
        </h3>

        <div className="my-4 p-3 bg-gray-50 rounded-xl text-left border border-gray-200 text-xs space-y-1.5">
          <div className="text-gray-500">
            Shop: <b className="text-gray-900">{shopName}</b>
          </div>
          <div className="text-gray-500">
            Total Quantity: <b className="text-gray-900">{totalQuantity} units</b>
          </div>
          <div className="text-gray-500">
            Grand Total: <b className="text-emerald-700 font-extrabold">{currency}{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
          </div>
        </div>

        {/* Dynamic Saving Status or Error Banner */}
        {isSubmitting && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-4 text-xs font-semibold text-emerald-800 flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>{submitStatusText}</span>
          </div>
        )}

        {submissionError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl mb-4 text-xs font-semibold text-rose-700 text-left">
            <div className="flex items-start space-x-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Submission Notice:</span>
                <span>{submissionError}</span>
              </div>
            </div>
          </div>
        )}

        {!isSubmitting && !submissionError && (
          <p className="text-xs text-gray-500 mb-6">
            This will record the order, verify product prices, and generate your WhatsApp message.
          </p>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className={`flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-bold rounded-xl text-sm transition-colors ${
              isSubmitting ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:bg-gray-50 active:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 font-extrabold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-1.5 ${
              isSubmitting
                ? 'bg-emerald-400 text-white cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : submissionError ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1" />
                <span>Retry Order</span>
              </>
            ) : (
              <span>Confirm Order</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
