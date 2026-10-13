import React, { useState } from 'react';
import { Order, CompanySettings } from '../types';
import { formatWhatsAppOrderMessage, getWhatsAppShareUrl, sanitizeWhatsAppPhone } from '../utils/whatsapp';
import { CheckCircle2, MessageCircle, Copy, Check, ArrowRight, Store, ExternalLink, Calendar, Hash } from 'lucide-react';

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
  const currency = companySettings.currency || '₹';

  const messageText = formatWhatsAppOrderMessage(order, currency);
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
      <div className="bg-emerald-600 text-white rounded-2xl p-6 text-center shadow-lg relative overflow-hidden">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-xs rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <span className="inline-block text-xs uppercase tracking-widest font-extrabold bg-emerald-700/80 px-3 py-1 rounded-full mb-1">
          Order Confirmed
        </span>
        <h2 className="text-xl font-black mt-1">Order Generated Successfully!</h2>

        <div className="mt-4 pt-3 border-t border-emerald-500/50 flex items-center justify-around text-xs">
          <div className="text-center">
            <span className="opacity-80 block text-[10px]">Order ID</span>
            <span className="font-mono font-bold text-sm">{order.orderId}</span>
          </div>
          <div className="h-6 w-px bg-emerald-500/50"></div>
          <div className="text-center">
            <span className="opacity-80 block text-[10px]">Total Qty</span>
            <span className="font-bold text-sm">{order.totalQuantity} pcs</span>
          </div>
          <div className="h-6 w-px bg-emerald-500/50"></div>
          <div className="text-center">
            <span className="opacity-80 block text-[10px]">Grand Total</span>
            <span className="font-bold text-sm">
              {currency}{order.grandTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* WHATSAPP ACTION BUTTON - Primary User Action */}
      <div className="bg-white rounded-2xl border-2 border-emerald-500 p-5 shadow-md space-y-3">
        <div className="text-center">
          <h3 className="font-extrabold text-gray-900 text-base">Next Step: Send to Company</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Click below to open WhatsApp with the pre-filled order message. Review and press send.
          </p>
          {targetPhone && (
            <div className="mt-1.5 inline-block text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Sending to: +{sanitizeWhatsAppPhone(targetPhone)} ({companySettings.companyName || 'Company'})
            </div>
          )}
        </div>

        {/* Large WhatsApp Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 px-5 bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1caa51] text-white font-black text-base rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center space-x-2.5 text-center decoration-transparent"
        >
          <span className="text-xl">🟢</span>
          <span className="tracking-wide">SHARE ORDER ON WHATSAPP</span>
          <ExternalLink className="w-5 h-5 ml-1" />
        </a>

        {/* Copy Fallback Button */}
        <div className="flex items-center justify-center pt-1">
          <button
            type="button"
            onClick={handleCopyMessage}
            className="text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-500" />
                <span>Copy Order Message</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Formatted Message Preview Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
            <MessageCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            WhatsApp Message Preview
          </span>
          <span className="text-[10px] text-gray-400">Pre-formatted text</span>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono text-xs text-gray-800 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto selection:bg-emerald-200">
          {messageText}
        </div>
      </div>

      {/* Navigation Buttons for Sales Boy */}
      <div className="space-y-2.5 pt-2">
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
          className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl border border-gray-300 transition-colors"
        >
          View All Orders History
        </button>
      </div>
    </div>
  );
};
