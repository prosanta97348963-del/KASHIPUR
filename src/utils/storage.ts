import { Product, SalesBoy, Order, CompanySettings, CurrentDraft } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'quickorder_products_v1',
  SALES_BOYS: 'quickorder_sales_boys_v1',
  ORDERS: 'quickorder_orders_v1',
  SETTINGS: 'quickorder_settings_v1',
  CURRENT_USER: 'quickorder_current_user_v1',
  CURRENT_DRAFT: 'quickorder_draft_v1',
  SAVED_SHOPS: 'quickorder_saved_shops_v1',
};

// Initial realistic default products
export const DEFAULT_PRODUCTS: Product[] = [
  { id: 'prod-1', name: 'Parle-G Glucose Biscuits (800g)', code: 'P001', price: 90, category: 'Biscuits & Bakery', active: true },
  { id: 'prod-2', name: 'Britannia Good Day Butter (600g)', code: 'P002', price: 120, category: 'Biscuits & Bakery', active: true },
  { id: 'prod-3', name: 'Maggi 2-Minute Noodles (12-Pack)', code: 'P003', price: 168, category: 'Instant Food', active: true },
  { id: 'prod-4', name: 'Tata Tea Gold (500g)', code: 'P004', price: 295, category: 'Beverages', active: true },
  { id: 'prod-5', name: 'Bru Instant Coffee (200g)', code: 'P005', price: 280, category: 'Beverages', active: true },
  { id: 'prod-6', name: 'Fortune Refined Sunflower Oil (1L)', code: 'P006', price: 145, category: 'Staples & Oils', active: true },
  { id: 'prod-7', name: 'Aashirvaad Shudh Chakki Atta (5kg)', code: 'P007', price: 240, category: 'Staples & Oils', active: true },
  { id: 'prod-8', name: 'Surf Excel Quick Wash Detergent (1kg)', code: 'P008', price: 155, category: 'Home Care', active: true },
  { id: 'prod-9', name: 'Dettol Original Liquid Handwash (750ml Refill)', code: 'P009', price: 110, category: 'Personal Care', active: true },
  { id: 'prod-10', name: 'Colgate MaxFresh Spicy Red (150g)', code: 'P010', price: 115, category: 'Personal Care', active: true },
  { id: 'prod-11', name: 'Haldiram Bhujia Sev (400g)', code: 'P011', price: 135, category: 'Snacks & Savouries', active: true },
  { id: 'prod-12', name: 'Everest Garam Masala (100g)', code: 'P012', price: 92, category: 'Spices', active: true },
];

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

export const DEFAULT_SHOPS = [
  { shopName: 'Maa Kali General Store', shopPhone: '9830112233', shopAddress: '14 B.B. Ganguly Street, Bowbazar, Kolkata' },
  { shopName: 'ABC Grocery & Daily Needs', shopPhone: '9876543210', shopAddress: 'Shop #4, College Square Market, Kolkata' },
  { shopName: 'Gupta Brothers Variety Store', shopPhone: '9831998877', shopAddress: '22 MG Road, Girish Park, Kolkata' },
  { shopName: 'Om Sai Super Store', shopPhone: '9820554433', shopAddress: 'Near Garia Metro Station, Kolkata' },
];

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
    if (!existing || existing.length === 0) {
      safeSet(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
      return DEFAULT_PRODUCTS;
    }
    return existing;
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
    return safeGet<SalesBoy | null>(STORAGE_KEYS.CURRENT_USER, DEFAULT_SALES_BOYS[0]);
  },

  setCurrentSalesBoy(salesBoy: SalesBoy | null): void {
    safeSet(STORAGE_KEYS.CURRENT_USER, salesBoy);
  },

  getOrders(): Order[] {
    const orders = safeGet<Order[]>(STORAGE_KEYS.ORDERS, []);
    return orders.sort((a, b) => b.timestamp - a.timestamp);
  },

  saveOrders(orders: Order[]): void {
    safeSet(STORAGE_KEYS.ORDERS, orders);
  },

  generateNextOrderId(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const prefix = `ORD-${yyyy}${mm}${dd}`;

    const orders = this.getOrders();
    const todayOrders = orders.filter((o) => o.orderId.startsWith(prefix));
    const nextSeq = todayOrders.length + 1;
    return `${prefix}-${String(nextSeq).padStart(3, '0')}`;
  },

  addOrder(order: Order): void {
    const orders = this.getOrders();
    orders.unshift(order);
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
  },

  getSavedShops(): Array<{ shopName: string; shopPhone: string; shopAddress: string }> {
    const existing = safeGet<Array<{ shopName: string; shopPhone: string; shopAddress: string }>>(
      STORAGE_KEYS.SAVED_SHOPS,
      DEFAULT_SHOPS
    );
    return existing;
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
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.SALES_BOYS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_DRAFT);
    localStorage.removeItem(STORAGE_KEYS.SAVED_SHOPS);
  },
};
