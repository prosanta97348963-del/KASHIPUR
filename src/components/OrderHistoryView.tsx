import React, { useState, useMemo } from 'react';
import { Order, CompanySettings, OrderStatus } from '../types';
import { formatWhatsAppOrderMessage, getWhatsAppShareUrl } from '../utils/whatsapp';
import {
  Search,
  Store,
  Phone,
  Calendar,
  User,
  Eye,
  MessageCircle,
  CheckCircle,
  Clock,
  X,
  ExternalLink,
  Printer,
  RefreshCw,
  AlertTriangle,
  CloudCheck,
  CloudAlert
} from 'lucide-react';

interface OrderHistoryViewProps {
  orders: Order[];
  companySettings: CompanySettings;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onStartNewOrder: () => void;
  onRetrySyncOrder?: (order: Order) => Promise<void>;
  onSyncAllPending?: () => Promise<void>;
}

export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({
  orders,
  companySettings,
  onUpdateStatus,
  onStartNewOrder,
  onRetrySyncOrder,
  onSyncAllPending,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus | 'PendingSync'>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);

  const currency = companySettings.currency || '₹';

  const pendingOrdersCount = orders.filter((o) => o.syncStatus !== 'synced').length;

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchSearch =
        searchQuery === '' ||
        order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.shopPhone.includes(searchQuery) ||
        order.salesBoyName.toLowerCase().includes(searchQuery.toLowerCase());

      let matchStatus = true;
      if (statusFilter === 'PendingSync') {
        matchStatus = order.syncStatus !== 'synced';
      } else if (statusFilter !== 'All') {
        matchStatus = order.status === statusFilter;
      }

      return matchSearch && matchStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const handleSyncAll = async () => {
    if (!onSyncAllPending) return;
    setIsSyncingAll(true);
    try {
      await onSyncAllPending();
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleRetryOrder = async (order: Order) => {
    if (!onRetrySyncOrder) return;
    setRetryingOrderId(order.id);
    try {
      await onRetrySyncOrder(order);
    } finally {
      setRetryingOrderId(null);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-28 animate-in fade-in duration-150 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Order History</h2>
          <p className="text-xs text-gray-500">
            {orders.length} total orders recorded
          </p>
        </div>
        <button
          onClick={onStartNewOrder}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
        >
          + New Order
        </button>
      </div>

      {/* Pending Sync Queue Alert Banner */}
      {pendingOrdersCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="text-xs text-amber-900">
              <span className="font-bold">{pendingOrdersCount} Order{pendingOrdersCount > 1 ? 's' : ''} Pending Cloud Sync</span>
              <p className="text-[11px] text-amber-700">Orders saved locally on device</p>
            </div>
          </div>
          {onSyncAllPending && (
            <button
              type="button"
              onClick={handleSyncAll}
              disabled={isSyncingAll}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs rounded-lg shadow-2xs flex items-center space-x-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          )}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, Shop, Phone..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30 focus:outline-hidden font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5">
          {(['All', 'Confirmed', 'Completed', 'PendingSync'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors shrink-0 ${
                statusFilter === tab
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab === 'PendingSync' ? `Pending Sync (${pendingOrdersCount})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <h4 className="font-bold text-gray-800 text-sm">No orders found</h4>
          <p className="text-xs text-gray-500 mt-1">
            {orders.length === 0
              ? 'No orders have been submitted yet. Start your first order!'
              : 'No orders match your filter criteria.'}
          </p>
          {orders.length === 0 && (
            <button
              onClick={onStartNewOrder}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-xs"
            >
              Start First Order
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const messageText = formatWhatsAppOrderMessage(order, currency);
            const waUrl = getWhatsAppShareUrl(companySettings.whatsappNumber, messageText);
            const isSynced = order.syncStatus === 'synced';
            const isRetrying = retryingOrderId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-2xs hover:shadow-xs transition-all overflow-hidden"
              >
                {/* Header row */}
                <div className="p-3 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {order.orderId}
                    </span>
                    <span className="text-[11px] text-gray-500">{order.orderDate}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Sync Status Badge */}
                    {isSynced ? (
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3 mr-0.5 text-emerald-600" />
                        Cloud
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-full">
                        <Clock className="w-3 h-3 mr-0.5 text-amber-600" />
                        Queued
                      </span>
                    )}

                    {/* Status Dropdown */}
                    <select
                      value={order.status}
                      onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-hidden ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Body details */}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{order.shopName}</h4>
                      <p className="text-xs text-gray-500 flex items-center mt-0.5">
                        <Phone className="w-3 h-3 mr-1 text-gray-400" />
                        {order.shopPhone}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate max-w-[240px] mt-0.5">
                        📍 {order.shopAddress}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-extrabold text-emerald-800">
                        {currency}{order.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <span className="text-[11px] text-gray-500 font-medium block">
                        {order.totalQuantity} pcs ({order.totalItems} items)
                      </span>
                    </div>
                  </div>

                  {order.lastSyncError && !isSynced && (
                    <div className="text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                      Sync notice: {order.lastSyncError}
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1 text-[11px]">
                      <User className="w-3 h-3 text-gray-400" />
                      <span>By: <b className="text-gray-700">{order.salesBoyName || 'Salesman'}</b></span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1.5">
                      {!isSynced && onRetrySyncOrder && (
                        <button
                          type="button"
                          onClick={() => handleRetryOrder(order)}
                          disabled={isRetrying}
                          className="px-2 py-1 text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg flex items-center space-x-1 transition-colors"
                          title="Retry Cloud Sync"
                        >
                          <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                          <span>{isRetrying ? 'Syncing...' : 'Retry'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="px-2.5 py-1 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center space-x-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>

                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] rounded-lg flex items-center space-x-1 transition-colors shadow-2xs"
                        title="Share this order to WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-4 py-3 bg-emerald-800 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider">
                  Order Slip
                </span>
                <h3 className="font-mono font-bold text-sm">{selectedOrder.orderId}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              {/* Shop Card */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
                <div className="font-bold text-gray-900 text-sm">{selectedOrder.shopName}</div>
                <div className="text-gray-600">📞 {selectedOrder.shopPhone}</div>
                <div className="text-gray-600">📍 {selectedOrder.shopAddress}</div>
                <div className="text-gray-500 pt-1 border-t border-gray-200 mt-1 flex justify-between">
                  <span>Salesman: <b>{selectedOrder.salesBoyName}</b></span>
                  <span>Date: <b>{selectedOrder.orderDate} {selectedOrder.orderTime}</b></span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                  Line Items ({selectedOrder.items.length})
                </h5>
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden text-xs">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between bg-white">
                      <div>
                        <div className="font-bold text-gray-900">{item.productName}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {item.productCode} • {currency}{item.price} × {item.quantity}
                        </div>
                      </div>
                      <div className="text-right font-extrabold text-gray-900">
                        {currency}{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                  <div className="p-3 bg-emerald-50/70 font-bold flex justify-between text-sm text-gray-900 border-t border-gray-200">
                    <span>Grand Total ({selectedOrder.totalQuantity} pcs):</span>
                    <span className="text-emerald-800 font-extrabold">
                      {currency}{selectedOrder.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Share Button */}
              <div className="pt-2">
                <a
                  href={getWhatsAppShareUrl(
                    companySettings.whatsappNumber,
                    formatWhatsAppOrderMessage(selectedOrder, currency)
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Order to WhatsApp</span>
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
