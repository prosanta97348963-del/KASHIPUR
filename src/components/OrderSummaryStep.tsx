import React, { useState } from 'react';
import { CurrentDraft, Product, CompanySettings, OrderItem } from '../types';
import { Store, Phone, MapPin, User, ArrowLeft, CheckCircle2, AlertTriangle, Trash2, Edit3 } from 'lucide-react';

interface OrderSummaryStepProps {
  draft: CurrentDraft;
  products: Product[];
  companySettings: CompanySettings;
  onEditOrder: () => void;
  onConfirmOrderRequest: () => void;
  onRemoveItem: (productId: string) => void;
}

export const OrderSummaryStep: React.FC<OrderSummaryStepProps> = ({
  draft,
  products,
  companySettings,
  onEditOrder,
  onConfirmOrderRequest,
  onRemoveItem,
}) => {
  const currency = companySettings.currency || '₹';

  // Compute selected items
  const orderItems: OrderItem[] = Object.entries(draft.selectedQuantities)
    .filter(([_, qty]) => qty > 0)
    .map(([productId, quantity]) => {
      const prod = products.find((p) => p.id === productId);
      const name = prod ? prod.name : 'Unknown Product';
      const code = prod ? prod.code : 'SKU';
      const price = prod ? prod.price : 0;
      return {
        productId,
        productName: name,
        productCode: code,
        quantity,
        price,
        amount: price * quantity,
      };
    });

  const totalItems = orderItems.length;
  const totalQuantity = orderItems.reduce((acc, item) => acc + item.quantity, 0);
  const grandTotal = orderItems.reduce((acc, item) => acc + item.amount, 0);

  return (
    <div className="max-w-md mx-auto p-4 pb-28 animate-in fade-in duration-150 space-y-4">
      {/* Title Header */}
      <div className="flex items-center justify-between pb-1">
        <button
          onClick={onEditOrder}
          className="flex items-center text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Edit Order
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Step 3 of 3: Review Order
        </span>
      </div>

      {/* SHOP DETAILS CARD */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
          <h3 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center">
            <Store className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Shop Details
          </h3>
          <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
            Customer
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <span className="text-[11px] font-semibold text-gray-400 block uppercase">Shop Name</span>
            <span className="font-bold text-gray-900 text-base">{draft.shopName}</span>
          </div>

          <div className="flex items-start space-x-2 pt-1">
            <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-semibold text-gray-400 block">Phone</span>
              <a href={`tel:${draft.shopPhone}`} className="font-semibold text-gray-800 text-sm hover:underline">
                {draft.shopPhone}
              </a>
            </div>
          </div>

          <div className="flex items-start space-x-2 pt-1">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-semibold text-gray-400 block">Address</span>
              <span className="text-gray-700 text-xs font-medium leading-relaxed">
                {draft.shopAddress}
              </span>
            </div>
          </div>

          {draft.salesBoyName && (
            <div className="flex items-center space-x-2 pt-1 border-t border-gray-100 mt-2">
              <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500">
                Sales Boy: <b className="text-gray-800">{draft.salesBoyName}</b>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ORDER DETAILS LIST / TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
            Order Details ({totalItems} Products)
          </h3>
          <span className="text-xs font-semibold text-gray-500">
            Total Qty: <b className="text-gray-900">{totalQuantity}</b>
          </span>
        </div>

        {orderItems.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-800">No products in order</p>
            <p className="text-xs text-gray-500 mt-1">Please add at least one product to proceed.</p>
            <button
              onClick={onEditOrder}
              className="mt-3 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-lg"
            >
              Add Products
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orderItems.map((item, idx) => (
              <div key={item.productId} className="p-3.5 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                      <span className="font-mono text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.2 rounded">
                        {item.productCode}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm mt-0.5">{item.productName}</h4>
                    <div className="text-xs text-gray-500 mt-1 flex items-center space-x-2">
                      <span>
                        Rate: {currency}{item.price.toLocaleString('en-IN')}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded">
                        Qty: {item.quantity}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end justify-between self-stretch">
                    <div className="text-sm font-extrabold text-gray-900">
                      {currency}
                      {item.amount.toLocaleString('en-IN')}
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.productId)}
                      className="p-1 text-gray-300 hover:text-red-500 rounded-md transition-colors"
                      title="Remove from order"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Totals Summary Footer */}
        <div className="bg-emerald-50/60 p-4 border-t border-gray-200 space-y-1.5">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Total Items:</span>
            <span className="font-bold text-gray-900">{totalItems}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Total Quantity:</span>
            <span className="font-bold text-gray-900">{totalQuantity} units</span>
          </div>
          <div className="flex justify-between text-base font-extrabold text-gray-900 pt-2 border-t border-emerald-200">
            <span>Grand Total:</span>
            <span className="text-emerald-800 text-lg">
              {currency}
              {grandTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-2.5 pt-2">
        <button
          type="button"
          onClick={onConfirmOrderRequest}
          disabled={totalItems === 0}
          className={`w-full py-4 px-6 rounded-xl font-extrabold text-base flex items-center justify-center space-x-2 shadow-md transition-all ${
            totalItems > 0
              ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white active:scale-[0.98]'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>CONFIRM ORDER</span>
        </button>

        <button
          type="button"
          onClick={onEditOrder}
          className="w-full py-3 px-4 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-bold text-sm rounded-xl border border-gray-300 transition-colors flex items-center justify-center space-x-2"
        >
          <Edit3 className="w-4 h-4" />
          <span>EDIT ORDER</span>
        </button>
      </div>
    </div>
  );
};
