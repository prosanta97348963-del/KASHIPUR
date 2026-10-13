import React, { useState } from 'react';
import { Order, CompanySettings } from '../types';
import { formatWhatsAppOrderMessage, getWhatsAppShareUrl, sanitizeWhatsAppPhone } from '../utils/whatsapp';
import { CheckCircle2, MessageCircle, Copy, Check, ArrowRight, Store, ExternalLink, Calendar, Hash, FileText } from 'lucide-react';

interface OrderSuccessStepProps {
  order: Order;
  companySettings: CompanySettings;
  onStartNewOrder: () => void;
  onViewHistory: () => void;
}

export const OrderSuccessStep: React.FC<OrderSuccessStepProps> = ({
  order,
  companySettings,
  onStartNewOrder,
  onViewHistory,
}) => {
  const [copied, setCopied] = useState(false);
  const [includePrices, setIncludePrices] = useState(false); // Defaults to FALSE (clean & compact as requested)
  const currency = companySettings.currency || '₹';

  const messageText = formatWhatsAppOrderMessage(order, {
    includePrices,
    currency,
  });
  const targetPhone = companySettings.whatsappNumber || '';
  const whatsappUrl = getWhatsAppShareUrl(targetPhone, messageText);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-28 animate-in fade-in duration-200 space-y-4">
      {/* Success Banner */}
      <div className="bg-emerald-600 text-white rounded-2xl p-5 text-center shadow-lg relative overflow-hidden">
        <div className="w-14 h-14 bg-white/20 backdrop-blur-xs rounded-full flex items-center justify-center mx-auto mb-2.5 shadow-inner">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <span className="inline-block text-[10px] uppercase tracking-widest font-extrabold bg-emerald-700/80 px-2.5 py-0.5 rounded-full mb-1">
          Order Confirmed
        </span>
        <h2 className="text-lg font-black mt-0.5">Order Saved Successfully!</h2>

        <div className="mt-3.5 pt-3 border-t border-emerald-500/50 flex items-center justify-around text-xs">
          <div className="text-center">
            <span className="opacity-80 block text-[10px]">Order ID</span>
            <span className="font-mono font-bold text-xs">{order.orderId}</span>
          </div>
          <div className="h-5 w-px bg-emerald-500/50"></div>
          <div className="text-center">
            <span className="opacity-80 block text-[10px]">Total Items</span>
            <span className="font-bold text-xs">{order.totalItems} items</span>
          </div>
          <div className="h-5 w-px bg-emerald-500/50"></div>
          <div className="text-center">
            <span className="opacity-80 block text-[10px]">Total Quantity</span>
            <span className="font-bold text-xs">{order.totalQuantity} pcs</span>
          </div>
        </div>
      </div>

      {/* WHATSAPP ACTION BUTTON - Primary User Action */}
      <div className="bg-white rounded-2xl border-2 border-emerald-500 p-4.5 shadow-md space-y-3">
        <div className="text-center">
          <h3 className="font-extrabold text-gray-900 text-sm">Send to Company WhatsApp</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Click below to open WhatsApp with the clean, compact order message.
          </p>
          {targetPhone && (
            <div className="mt-1.5 inline-block text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Sending to: +{sanitizeWhatsAppPhone(targetPhone)} ({companySettings.companyName || 'Company'})
            </div>
          )}
        </div>

        {/* Large WhatsApp Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 px-5 bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1caa51] text-white font-black text-sm rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center space-x-2 text-center decoration-transparent"
        >
          <span className="text-lg">🟢</span>
          <span className="tracking-wide">SHARE ORDER ON WHATSAPP</span>
          <ExternalLink className="w-4 h-4 ml-0.5" />
        </a>

        {/* Action row: Format toggle & Copy fallback */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
          <label className="flex items-center space-x-1.5 cursor-pointer text-gray-600 select-none">
            <input
              type="checkbox"
              checked={includePrices}
              onChange={(e) => setIncludePrices(e.target.checked)}
              className="w-3.5 h-3.5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
            />
            <span className="text-[11px] font-medium">Include Amount</span>
          </label>

          <button
            type="button"
            onClick={handleCopyMessage}
            className="text-[11px] font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-gray-500" />
                <span>Copy Text</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Formatted Message Preview Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-3.5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
            <MessageCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Compact WhatsApp Message Preview
          </span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
            Billing Friendly
          </span>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono text-[11px] text-gray-800 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto selection:bg-emerald-200">
          {messageText}
        </div>
      </div>

      {/* Navigation Buttons for Sales Boy */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={onStartNewOrder}
          className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
        >
          <span>START NEW ORDER (Next Shop)</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onViewHistory}
          className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl border border-gray-300 transition-colors"
        >
          View All Orders History
        </button>
      </div>
    </div>
  );
};
