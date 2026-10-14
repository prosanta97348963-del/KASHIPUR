import { Product, SalesBoy, Order, CompanySettings, CurrentDraft } from '../types';
import { CATALOG_PRODUCTS } from '../data/catalog';

const STORAGE_KEYS = {
  PRODUCTS: 'arsells_products_v3',
  SALES_BOYS: 'quickorder_sales_boys_v1',
  ORDERS: 'quickorder_orders_v1',
  PENDING_ORDERS: 'arsells_pending_orders_v1',
  SETTINGS: 'quickorder_settings_v1',
  CURRENT_USER: 'quickorder_current_user_v1',
  CURRENT_DRAFT: 'quickorder_draft_v1',
  SAVED_SHOPS: 'arsells_shops_v3',
};

// Official A.R SELLS product catalog
export const DEFAULT_PRODUCTS: Product[] = CATALOG_PRODUCTS;

export const DEFAULT_SALES_BOYS: SalesBoy[] = [
  { id: 'sb-1', name: 'Rahul Sharma', mobile: '9876543210', pin: '1234', active: true },
  { id: 'sb-2', name: 'Amit Verma', mobile: '9811223344', pin: '1234', active: true },
  { id: 'sb-3', name: 'Suresh Kumar', mobile: '9765432109', pin: '1234', active: true },
];

export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'A.R SELLS',
  whatsappNumber: '919876543210', // Admin WhatsApp number where orders arrive
  adminPin: '9999',
  currency: '₹',
};

// No fake demo shops - salesmen will enter real shops
export const DEFAULT_SHOPS: Array<{ shopName: string; shopPhone: string; shopAddress: string }> = [];

// Helper to safely read from localStorage
function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (e) {
    console.warn(`Error reading key ${key} from storage:`, e);
    return fallback;
  }
}

// Helper to safely write to localStorage
function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error saving key ${key} to storage:`, e);
  }
}

export const StorageService = {
  getProducts(): Product[] {
    const existing = safeGet<Product[] | null>(STORAGE_KEYS.PRODUCTS, null);
    // Check if not set or contains legacy demo items (e.g. Parle-G, prod-1)
    const hasLegacyDemo =
      !existing ||
      existing.length === 0 ||
      existing.some((p) => p.id === 'prod-1' || p.name.includes('Parle-G') || p.name.includes('Britannia'));

    if (hasLegacyDemo) {
      safeSet(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
      return DEFAULT_PRODUCTS;
    }
    return existing;
  },

  resetToCatalog(): Product[] {
    safeSet(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    return DEFAULT_PRODUCTS;
  },

  saveProducts(products: Product[]): void {
    safeSet(STORAGE_KEYS.PRODUCTS, products);
  },

  addProduct(product: Omit<Product, 'id'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    products.push(newProduct);
    this.saveProducts(products);
    return newProduct;
  },

  updateProduct(updated: Product): void {
    const products = this.getProducts().map((p) => (p.id === updated.id ? updated : p));
    this.saveProducts(products);
  },

  deleteProduct(id: string): void {
    const products = this.getProducts().filter((p) => p.id !== id);
    this.saveProducts(products);
  },

  getSalesBoys(): SalesBoy[] {
    const existing = safeGet<SalesBoy[] | null>(STORAGE_KEYS.SALES_BOYS, null);
    if (!existing || existing.length === 0) {
      safeSet(STORAGE_KEYS.SALES_BOYS, DEFAULT_SALES_BOYS);
      return DEFAULT_SALES_BOYS;
    }
    return existing;
  },

  saveSalesBoys(salesBoys: SalesBoy[]): void {
    safeSet(STORAGE_KEYS.SALES_BOYS, salesBoys);
  },

  addSalesBoy(boy: Omit<SalesBoy, 'id'>): SalesBoy {
    const boys = this.getSalesBoys();
    const newBoy: SalesBoy = {
      ...boy,
      id: `sb-${Date.now()}`,
    };
    boys.push(newBoy);
    this.saveSalesBoys(boys);
    return newBoy;
  },

  updateSalesBoy(updated: SalesBoy): void {
    const boys = this.getSalesBoys().map((b) => (b.id === updated.id ? updated : b));
    this.saveSalesBoys(boys);
  },

  deleteSalesBoy(id: string): void {
    const boys = this.getSalesBoys().filter((b) => b.id !== id);
    this.saveSalesBoys(boys);
  },

  getSettings(): CompanySettings {
    const existing = safeGet<CompanySettings | null>(STORAGE_KEYS.SETTINGS, null);
    if (!existing) {
      safeSet(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    // Automatically migrate old placeholder name to A.R SELLS
    if (existing.companyName === 'Shree Ganesh Wholesale Distributors' || !existing.companyName) {
      existing.companyName = 'A.R SELLS';
      safeSet(STORAGE_KEYS.SETTINGS, existing);
    }
    return existing;
  },

  saveSettings(settings: CompanySettings): void {
    safeSet(STORAGE_KEYS.SETTINGS, settings);
  },

  getCurrentSalesBoy(): SalesBoy | null {
    const boy = safeGet<SalesBoy | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (boy && !boy.active) {
      safeSet(STORAGE_KEYS.CURRENT_USER, null);
      return null;
    }
    return boy;
  },

  setCurrentSalesBoy(salesBoy: SalesBoy | null): void {
    if (salesBoy && !salesBoy.active) {
      safeSet(STORAGE_KEYS.CURRENT_USER, null);
      return;
    }
    safeSet(STORAGE_KEYS.CURRENT_USER, salesBoy);
  },

  getOrders(): Order[] {
    const orders = safeGet<Order[]>(STORAGE_KEYS.ORDERS, []);
    // Ensure all orders have syncStatus and idempotencyKey
    const sanitized = orders.map((o) => ({
      ...o,
      syncStatus: (o.syncStatus || 'synced') as Order['syncStatus'],
      idempotencyKey: o.idempotencyKey || `migrated_${o.id || o.orderId}`,
    }));
    return sanitized.sort((a, b) => b.timestamp - a.timestamp);
  },

  saveOrders(orders: Order[]): void {
    safeSet(STORAGE_KEYS.ORDERS, orders);
  },

  getPendingOrders(): Order[] {
    const pending = safeGet<Order[]>(STORAGE_KEYS.PENDING_ORDERS, []);
    return pending.sort((a, b) => a.timestamp - b.timestamp);
  },

  savePendingOrders(pending: Order[]): void {
    safeSet(STORAGE_KEYS.PENDING_ORDERS, pending);
  },

  addPendingOrder(order: Order): void {
    const pending = this.getPendingOrders();
    const existingIdx = pending.findIndex((p) => p.idempotencyKey === order.idempotencyKey || p.id === order.id);
    if (existingIdx >= 0) {
      pending[existingIdx] = order;
    } else {
      pending.push(order);
    }
    this.savePendingOrders(pending);
  },

  removePendingOrder(idempotencyKeyOrId: string): void {
    const pending = this.getPendingOrders().filter(
      (p) => p.idempotencyKey !== idempotencyKeyOrId && p.id !== idempotencyKeyOrId
    );
    this.savePendingOrders(pending);
  },

  markOrderSynced(idempotencyKey: string, serverOrderId?: string): void {
    // 1. Remove from pending queue
    this.removePendingOrder(idempotencyKey);

    // 2. Update status in all orders list
    const orders = this.getOrders().map((o) => {
      if (o.idempotencyKey === idempotencyKey) {
        return {
          ...o,
          orderId: serverOrderId || o.orderId,
          syncStatus: 'synced' as const,
          lastSyncError: undefined,
        };
      }
      return o;
    });
    this.saveOrders(orders);
  },

  markOrderFailed(idempotencyKey: string, errorMessage: string): void {
    const orders = this.getOrders().map((o) => {
      if (o.idempotencyKey === idempotencyKey) {
        return {
          ...o,
          syncStatus: 'failed' as const,
          lastSyncError: errorMessage,
        };
      }
      return o;
    });
    this.saveOrders(orders);

    const pending = this.getPendingOrders().map((p) => {
      if (p.idempotencyKey === idempotencyKey) {
        return {
          ...p,
          syncStatus: 'failed' as const,
          lastSyncError: errorMessage,
        };
      }
      return p;
    });
    this.savePendingOrders(pending);
  },

  /**
   * Generates a unique, collision-proof order ID.
   * Format: ORD-YYYYMMDD-[salesmanShort]-[seq]-[randHex]
   * Ensures concurrent orders from different phones cannot receive duplicate IDs.
   */
  generateNextOrderId(salesBoyId?: string): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const datePrefix = `ORD-${yyyy}${mm}${dd}`;

    const boyCode = salesBoyId ? salesBoyId.replace(/\D/g, '').slice(-3) || 'S1' : 'X';
    const randSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();

    const orders = this.getOrders();
    const todayOrders = orders.filter((o) => o.orderDate?.includes(`${dd}/${mm}/${yyyy}`) || o.orderId.startsWith(datePrefix));
    const nextSeq = String(todayOrders.length + 1).padStart(3, '0');

    return `${datePrefix}-${boyCode}-${nextSeq}-${randSuffix}`;
  },

  addOrder(order: Order): void {
    const orders = this.getOrders();
    const existingIdx = orders.findIndex(
      (o) => o.idempotencyKey === order.idempotencyKey || o.id === order.id
    );
    if (existingIdx >= 0) {
      orders[existingIdx] = order;
    } else {
      orders.unshift(order);
    }
    this.saveOrders(orders);

    // Also remember this shop for quick autofill next time
    this.saveShop({
      shopName: order.shopName,
      shopPhone: order.shopPhone,
      shopAddress: order.shopAddress,
    });
  },

  updateOrderStatus(orderId: string, status: Order['status']): void {
    const orders = this.getOrders().map((o) => (o.id === orderId ? { ...o, status } : o));
    this.saveOrders(orders);
  },

  deleteOrder(orderId: string): void {
    const orders = this.getOrders().filter((o) => o.id !== orderId);
    this.saveOrders(orders);
    this.removePendingOrder(orderId);
  },

  getSavedShops(): Array<{ shopName: string; shopPhone: string; shopAddress: string }> {
    const existing = safeGet<Array<{ shopName: string; shopPhone: string; shopAddress: string }>>(
      STORAGE_KEYS.SAVED_SHOPS,
      DEFAULT_SHOPS
    );
    // Automatically purge old demo shops
    const cleaned = existing.filter(
      (s) =>
        !s.shopName.includes('Maa Kali') &&
        !s.shopName.includes('ABC Grocery') &&
        !s.shopName.includes('Gupta Brothers') &&
        !s.shopName.includes('Om Sai')
    );
    if (cleaned.length !== existing.length) {
      safeSet(STORAGE_KEYS.SAVED_SHOPS, cleaned);
    }
    return cleaned;
  },

  saveShop(shop: { shopName: string; shopPhone: string; shopAddress: string }): void {
    if (!shop.shopName) return;
    const existing = this.getSavedShops();
    const filtered = existing.filter(
      (s) => s.shopName.toLowerCase() !== shop.shopName.toLowerCase()
    );
    filtered.unshift(shop);
    // Keep max 20 recent shops
    safeSet(STORAGE_KEYS.SAVED_SHOPS, filtered.slice(0, 20));
  },

  getDraft(): CurrentDraft | null {
    return safeGet<CurrentDraft | null>(STORAGE_KEYS.CURRENT_DRAFT, null);
  },

  saveDraft(draft: CurrentDraft | null): void {
    safeSet(STORAGE_KEYS.CURRENT_DRAFT, draft);
  },

  resetAllData(): void {
    safeSet(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    safeSet(STORAGE_KEYS.SAVED_SHOPS, []);
    safeSet(STORAGE_KEYS.ORDERS, []);
    safeSet(STORAGE_KEYS.PENDING_ORDERS, []);
    safeSet(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    safeSet(STORAGE_KEYS.CURRENT_USER, null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_DRAFT);
    // Clean old keys too
    localStorage.removeItem('quickorder_products_v1');
    localStorage.removeItem('quickorder_saved_shops_v1');
  },
};

