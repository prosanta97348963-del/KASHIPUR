export interface Product {
  id: string;
  name: string;
  code: string; // SKU
  price: number;
  category?: string;
  active: boolean;
}

export interface SalesBoy {
  id: string;
  name: string;
  mobile: string;
  pin: string;
  active: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  price: number;
  amount: number;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
export type SyncStatus = 'synced' | 'pending' | 'failed';

export interface Order {
  id: string; // client id (e.g. ord-17123456789)
  orderId: string; // business order number (e.g. ORD-20261013-001)
  idempotencyKey: string; // unique key preventing duplicate submissions
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  salesBoyId?: string;
  salesBoyName: string;
  orderDate: string; // DD/MM/YYYY or YYYY-MM-DD
  orderTime: string; // HH:MM AM/PM
  timestamp: number;
  totalItems: number;
  totalQuantity: number;
  grandTotal: number;
  status: OrderStatus;
  items: OrderItem[];
  syncStatus: SyncStatus;
  lastSyncError?: string;
}

export interface CompanySettings {
  companyName: string;
  whatsappNumber: string; // Destination WhatsApp number
  adminPin: string;
  currency: string;
}

export interface CurrentDraft {
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  salesBoyName: string;
  selectedQuantities: Record<string, number>; // productId -> quantity
  idempotencyKey?: string;
}

export interface SalesBoyPublic {
  id: string;
  name: string;
  mobile: string;
  active: boolean;
}

export interface OrderValidationResult {
  isValid: boolean;
  errors: string[];
  validatedItems: OrderItem[];
  totalQuantity: number;
  grandTotal: number;
}

export interface SubmitOrderResult {
  success: boolean;
  order: Order;
  syncStatus: SyncStatus;
  message?: string;
  isDuplicate?: boolean;
  error?: string;
}
