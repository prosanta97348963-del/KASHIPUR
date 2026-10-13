import { supabase, getSupabaseConfig } from '../lib/supabase';
import { Product, SalesBoy, Order, CompanySettings, OrderItem } from '../types';
import { DEFAULT_PRODUCTS, DEFAULT_SALES_BOYS, DEFAULT_SETTINGS } from '../utils/storage';

export const SUPABASE_SQL_SCHEMA = `-- QUICKORDER SUPABASE SCHEMA & TABLES
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    category TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Sales Boys Staff Table
CREATE TABLE IF NOT EXISTS public.sales_boys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    pin TEXT NOT NULL DEFAULT '1234',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_id TEXT UNIQUE NOT NULL,
    shop_name TEXT NOT NULL,
    shop_phone TEXT NOT NULL,
    shop_address TEXT NOT NULL,
    sales_boy_id TEXT,
    sales_boy_name TEXT NOT NULL,
    order_date TEXT NOT NULL,
    order_time TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    total_items INTEGER NOT NULL DEFAULT 0,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    grand_total NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Confirmed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_code TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC NOT NULL DEFAULT 0,
    amount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Company Settings Table
CREATE TABLE IF NOT EXISTS public.company_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    company_name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    admin_pin TEXT NOT NULL DEFAULT '9999',
    currency TEXT NOT NULL DEFAULT '₹',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) & Public access policies for Anon Key
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_boys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Allow read/write with anon key for field sales order taking
CREATE POLICY "Public read/write products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write sales_boys" ON public.sales_boys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write company_settings" ON public.company_settings FOR ALL USING (true) WITH CHECK (true);
`;

export const SupabaseService = {
  /**
   * Tests connection to Supabase
   */
  async testConnection(): Promise<{ success: boolean; message: string; tablesExist: boolean }> {
    try {
      const { data, error } = await supabase.from('products').select('id').limit(1);
      if (error) {
        if (error.code === '42P01') {
          // relation does not exist
          return {
            success: true,
            tablesExist: false,
            message: 'Connected to Supabase! Tables need to be created using the SQL script.',
          };
        }
        return {
          success: false,
          tablesExist: false,
          message: `Connection error: ${error.message} (Code: ${error.code})`,
        };
      }
      return {
        success: true,
        tablesExist: true,
        message: 'Successfully connected to Supabase and tables are verified!',
      };
    } catch (err: any) {
      return {
        success: false,
        tablesExist: false,
        message: err.message || 'Network error connecting to Supabase',
      };
    }
  },

  /**
   * Fetches all products from Supabase
   */
  async getProducts(): Promise<Product[] | null> {
    try {
      const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
      if (error) {
        console.warn('Supabase getProducts error:', error);
        return null;
      }
      if (!data) return null;
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        price: Number(row.price),
        category: row.category || 'General',
        active: Boolean(row.active),
      }));
    } catch (e) {
      console.warn('Supabase fetch products failed:', e);
      return null;
    }
  },

  /**
   * Upserts a product into Supabase
   */
  async upsertProduct(product: Product): Promise<boolean> {
    try {
      const { error } = await supabase.from('products').upsert({
        id: product.id,
        name: product.name,
        code: product.code,
        price: product.price,
        category: product.category,
        active: product.active,
      });
      if (error) {
        console.warn('Supabase upsertProduct error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase upsert product exception:', e);
      return false;
    }
  },

  /**
   * Deletes a product from Supabase
   */
  async deleteProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Fetches sales boys from Supabase
   */
  async getSalesBoys(): Promise<SalesBoy[] | null> {
    try {
      const { data, error } = await supabase.from('sales_boys').select('*').order('name');
      if (error || !data) return null;
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        mobile: row.mobile,
        pin: row.pin,
        active: Boolean(row.active),
      }));
    } catch (e) {
      console.warn('Supabase getSalesBoys error:', e);
      return null;
    }
  },

  /**
   * Upserts a sales boy
   */
  async upsertSalesBoy(boy: SalesBoy): Promise<boolean> {
    try {
      const { error } = await supabase.from('sales_boys').upsert({
        id: boy.id,
        name: boy.name,
        mobile: boy.mobile,
        pin: boy.pin,
        active: boy.active,
      });
      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Deletes a sales boy
   */
  async deleteSalesBoy(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('sales_boys').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Fetches orders along with their order items
   */
  async getOrders(): Promise<Order[] | null> {
    try {
      const { data: orderRows, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .order('timestamp', { ascending: false });

      if (orderErr || !orderRows) return null;

      const { data: itemRows, error: itemErr } = await supabase.from('order_items').select('*');
      const itemsMap: Record<string, OrderItem[]> = {};

      if (!itemErr && itemRows) {
        itemRows.forEach((row: any) => {
          if (!itemsMap[row.order_id]) itemsMap[row.order_id] = [];
          itemsMap[row.order_id].push({
            productId: row.product_id,
            productName: row.product_name,
            productCode: row.product_code,
            quantity: Number(row.quantity),
            price: Number(row.price),
            amount: Number(row.amount),
          });
        });
      }

      return orderRows.map((row: any) => ({
        id: row.id,
        orderId: row.order_id,
        shopName: row.shop_name,
        shopPhone: row.shop_phone,
        shopAddress: row.shop_address,
        salesBoyId: row.sales_boy_id,
        salesBoyName: row.sales_boy_name,
        orderDate: row.order_date,
        orderTime: row.order_time,
        timestamp: Number(row.timestamp),
        totalItems: Number(row.total_items),
        totalQuantity: Number(row.total_quantity),
        grandTotal: Number(row.grand_total),
        status: row.status as any,
        items: itemsMap[row.id] || [],
      }));
    } catch (e) {
      console.warn('Supabase getOrders exception:', e);
      return null;
    }
  },

  /**
   * Saves a new order and all its line items to Supabase
   */
  async saveOrder(order: Order): Promise<boolean> {
    try {
      const { error: orderError } = await supabase.from('orders').upsert({
        id: order.id,
        order_id: order.orderId,
        shop_name: order.shopName,
        shop_phone: order.shopPhone,
        shop_address: order.shopAddress,
        sales_boy_id: order.salesBoyId || null,
        sales_boy_name: order.salesBoyName,
        order_date: order.orderDate,
        order_time: order.orderTime,
        timestamp: order.timestamp,
        total_items: order.totalItems,
        total_quantity: order.totalQuantity,
        grand_total: order.grandTotal,
        status: order.status,
      });

      if (orderError) {
        console.warn('Error inserting order in Supabase:', orderError);
        return false;
      }

      if (order.items && order.items.length > 0) {
        const itemInserts = order.items.map((item, idx) => ({
          id: `${order.id}-item-${idx}`,
          order_id: order.id,
          product_id: item.productId,
          product_name: item.productName,
          product_code: item.productCode,
          quantity: item.quantity,
          price: item.price,
          amount: item.amount,
        }));

        const { error: itemsError } = await supabase.from('order_items').upsert(itemInserts);
        if (itemsError) {
          console.warn('Error inserting order items in Supabase:', itemsError);
        }
      }

      return true;
    } catch (e) {
      console.warn('Supabase saveOrder exception:', e);
      return false;
    }
  },

  /**
   * Updates an order status in Supabase
   */
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean> {
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Seeds Supabase with initial default FMCG products and default sales boys
   */
  async seedInitialData(): Promise<{ success: boolean; count: number }> {
    try {
      let count = 0;
      for (const prod of DEFAULT_PRODUCTS) {
        const ok = await this.upsertProduct(prod);
        if (ok) count++;
      }
      for (const boy of DEFAULT_SALES_BOYS) {
        await this.upsertSalesBoy(boy);
      }
      return { success: count > 0, count };
    } catch (e) {
      return { success: false, count: 0 };
    }
  },
};
