import React, { useState } from 'react';
import { Order, CompanySettings } from '../types';
import { formatWhatsAppOrderMessage, getWhatsAppShareUrl, sanitizeWhatsAppPhone } from '../utils/whatsapp';
import {
  CheckCircle2,
  MessageCircle,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  CloudCheck,
  CloudOff,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface OrderSuccessStepProps {
  order: Order;
  companySettings: CompanySettings;
  onStartNewOrder: () => void;
  onViewHistory: () => void;
  onRetrySync?: (order: Order) => Promise<void>;
}

export const OrderSuccessStep: React.FC<OrderSuccessStepProps> = ({
  order,
  companySettings,
  onStartNewOrder,
  onViewHistory,
  onRetrySync,
}) => {
  const [copied, setCopied] = useState(false);
  const [includePrices, setIncludePrices] = useState(false);
  const [isRetryingSync, setIsRetryingSync] = useState(false);
  const [syncStatus, setSyncStatus] = useState(order.syncStatus || 'synced');
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

  const handleManualRetry = async () => {
    if (!onRetrySync) return;
    setIsRetryingSync(true);
    try {
      await onRetrySync(order);
      setSyncStatus('synced');
    } catch (e) {
      console.warn('Manual sync retry failed:', e);
    } finally {
      setIsRetryingSync(false);
    }
  };

  const isCloudSynced = syncStatus === 'synced';

  return (
    <div className="max-w-md mx-auto p-4 pb-28 animate-in fade-in duration-200 space-y-4">
      {/* Success Banner */}
      <div
        className={`${
          isCloudSynced ? 'bg-emerald-600' : 'bg-amber-600'
        } text-white rounded-2xl p-5 text-center shadow-lg relative overflow-hidden transition-colors`}
      >
        <div className="w-14 h-14 bg-white/20 backdrop-blur-xs rounded-full flex items-center justify-center mx-auto mb-2.5 shadow-inner">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>

        <div className="inline-flex items-center space-x-1 text-[11px] uppercase tracking-widest font-extrabold bg-black/20 px-3 py-0.5 rounded-full mb-1">
          {isCloudSynced ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1" />
              <span>Confirmed & Cloud Synced</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              <span>Saved Locally (Pending Cloud Sync)</span>
            </>
          )}
        </div>

        <h2 className="text-lg font-black mt-0.5">
          {isCloudSynced ? 'Order Saved Successfully!' : 'Order Saved to Device Queue!'}
        </h2>

        {!isCloudSynced && (
          <p className="text-xs text-amber-100 mt-1 max-w-xs mx-auto">
            Offline or slow connection. Your order is safely saved on this phone and will automatically push to the cloud. You can safely send it on WhatsApp right now!
          </p>
        )}

        <div className="mt-3.5 pt-3 border-t border-white/20 flex items-center justify-around text-xs">
          <div className="text-center">
            <span className="opacity-80 block text-[10px]">Order ID</span>
            <span className="font-mono font-bold text-xs">{order.orderId}</span>
          </div>
          <div className="h-5 w-px bg-white/20"></div>
          <div className="text-center">
            <span className="opacity-80 block text-[10px]">Total Items</span>
            <span className="font-bold text-xs">{order.totalItems} items</span>
          </div>
          <div className="h-5 w-px bg-white/20"></div>
          <div className="text-center">
            <span className="opacity-80 block text-[10px]">Total Quantity</span>
            <span className="font-bold text-xs">{order.totalQuantity} pcs</span>
          </div>
        </div>
      </div>

      {/* Manual Retry Sync button if pending */}
      {!isCloudSynced && onRetrySync && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between">
          <div className="text-xs text-amber-900">
            <span className="font-bold block">Need cloud confirmation now?</span>
            <span className="text-[11px] text-amber-700">Tap to retry pushing to Supabase</span>
          </div>
          <button
            type="button"
            onClick={handleManualRetry}
            disabled={isRetryingSync}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetryingSync ? 'animate-spin' : ''}`} />
            <span>{isRetryingSync ? 'Syncing...' : 'Retry Cloud Sync'}</span>
          </button>
        </div>
      )}

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
