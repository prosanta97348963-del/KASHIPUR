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

export interface Order {
  id: string;
  orderId: string; // e.g. ORD-20261013-001
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
}
