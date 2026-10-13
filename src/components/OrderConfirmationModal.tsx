import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  shopName: string;
  totalQuantity: number;
  grandTotal: number;
  currency: string;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  shopName,
  totalQuantity,
  grandTotal,
  currency,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 stroke-[2.2]" />
        </div>

        <h3 className="text-lg font-extrabold text-gray-900 leading-tight">
          Are you sure you want to complete this order?
        </h3>

        <div className="my-4 p-3 bg-gray-50 rounded-xl text-left border border-gray-200 text-xs space-y-1">
          <div className="text-gray-500">
            Shop: <b className="text-gray-900">{shopName}</b>
          </div>
          <div className="text-gray-500">
            Total Quantity: <b className="text-gray-900">{totalQuantity} units</b>
          </div>
          <div className="text-gray-500">
            Grand Total: <b className="text-emerald-700 font-extrabold">{currency}{grandTotal.toLocaleString('en-IN')}</b>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-6">
          This will generate the final Order ID and create the formatted message for WhatsApp.
        </p>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold rounded-xl text-sm shadow-md transition-all active:scale-95"
          >
            Confirm Order
          </button>
        </div>
      </div>
    </div>
  );
};
