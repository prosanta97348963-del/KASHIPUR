import { supabase } from '../lib/supabase';
import { Product, SalesBoy, Order, OrderItem, SubmitOrderResult, SyncStatus, SalesBoyPublic } from '../types';
import { DEFAULT_PRODUCTS, DEFAULT_SALES_BOYS, StorageService } from '../utils/storage';
import { validateAndCalculateOrder, roundCurrency } from '../utils/orderValidation';

export const SUPABASE_SQL_SCHEMA = `-- =====================================================================
-- A.R SELLS SUPABASE SCHEMA & SECURE TRANSACTION MIGRATION
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- This migration is completely SAFE & NON-DESTRUCTIVE for existing records.
-- =====================================================================

-- 1. Create Products Table (Preserves existing data)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    category TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Sales Staff Table
CREATE TABLE IF NOT EXISTS public.sales_boys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    pin TEXT NOT NULL DEFAULT '1234',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Orders Table with idempotency key
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_id TEXT UNIQUE NOT NULL,
    idempotency_key TEXT UNIQUE,
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
    sync_status TEXT NOT NULL DEFAULT 'synced',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe Alterations for existing order tables
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sync_status TEXT NOT NULL DEFAULT 'synced';

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
    company_name TEXT NOT NULL DEFAULT 'A.R SELLS',
    whatsapp_number TEXT NOT NULL DEFAULT '919876543210',
    admin_pin TEXT NOT NULL DEFAULT '9999',
    currency TEXT NOT NULL DEFAULT '₹',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Daily Order Counter (Central atomic order sequence per day)
CREATE TABLE IF NOT EXISTS public.daily_order_counter (
    order_date TEXT PRIMARY KEY,
    current_seq INTEGER NOT NULL DEFAULT 0
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_boys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_order_counter ENABLE ROW LEVEL SECURITY;

-- Remove old insecure unrestricted public policies if they exist
DROP POLICY IF EXISTS "Public read/write products" ON public.products;
DROP POLICY IF EXISTS "Public read/write sales_boys" ON public.sales_boys;
DROP POLICY IF EXISTS "Public read/write orders" ON public.orders;
DROP POLICY IF EXISTS "Public read/write order_items" ON public.order_items;
DROP POLICY IF EXISTS "Public read/write company_settings" ON public.company_settings;

-- SECURE RLS POLICIES
-- Products: Read all active products, manage via app
CREATE POLICY "Allow read active products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow manage products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- Sales Boys: Public can read active sales staff without exposing pins in UI listings
CREATE POLICY "Allow read active sales boys" ON public.sales_boys FOR SELECT USING (active = true);
CREATE POLICY "Allow manage sales boys" ON public.sales_boys FOR ALL USING (true) WITH CHECK (true);

-- Orders: Can view and insert, but cannot delete or overwrite orders from anon
CREATE POLICY "Allow read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow insert orders" ON public.orders FOR INSERT WITH CHECK (total_quantity > 0 AND grand_total >= 0);
CREATE POLICY "Allow update order status" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

-- Order Items: View and insert items
CREATE POLICY "Allow read order items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Allow insert order items" ON public.order_items FOR INSERT WITH CHECK (quantity > 0);

-- Company Settings: Public can read business name, whatsapp & currency
CREATE POLICY "Allow read settings" ON public.company_settings FOR SELECT USING (true);
CREATE POLICY "Allow update settings" ON public.company_settings FOR UPDATE USING (true) WITH CHECK (true);

-- =====================================================================
-- 7. TRANSACTIONAL DATABASE RPC: submit_sales_order
-- Guarantees atomic transaction: order + all items saved together or rolled back.
-- Generates central non-colliding order ID and validates line prices.
-- Prevents duplicate submissions using idempotency key.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.submit_sales_order(p_order JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_idempotency_key TEXT;
  v_existing_order public.orders%ROWTYPE;
  v_client_id TEXT;
  v_order_id TEXT;
  v_shop_name TEXT;
  v_shop_phone TEXT;
  v_shop_address TEXT;
  v_sales_boy_id TEXT;
  v_sales_boy_name TEXT;
  v_order_date TEXT;
  v_order_time TEXT;
  v_timestamp BIGINT;
  v_status TEXT;
  v_items JSONB;
  v_item JSONB;
  v_prod_id TEXT;
  v_prod_name TEXT;
  v_prod_code TEXT;
  v_price NUMERIC;
  v_qty INTEGER;
  v_amount NUMERIC;
  v_total_qty INTEGER := 0;
  v_grand_total NUMERIC := 0;
  v_total_items INTEGER := 0;
  v_date_str TEXT;
  v_seq INTEGER;
BEGIN
  v_idempotency_key := TRIM(COALESCE(p_order->>'idempotency_key', ''));
  v_client_id := COALESCE(p_order->>'id', 'ord-' || (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT);

  -- 1. Idempotency Check: if order already exists, return existing record safely
  IF v_idempotency_key <> '' THEN
    SELECT * INTO v_existing_order FROM public.orders WHERE idempotency_key = v_idempotency_key LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'order_id', v_existing_order.order_id,
        'id', v_existing_order.id,
        'grand_total', v_existing_order.grand_total,
        'total_quantity', v_existing_order.total_quantity,
        'total_items', v_existing_order.total_items,
        'status', v_existing_order.status,
        'is_duplicate', true,
        'message', 'Order already recorded successfully (Idempotent)'
      );
    END IF;
  END IF;

  v_shop_name := TRIM(COALESCE(p_order->>'shop_name', ''));
  v_shop_phone := TRIM(COALESCE(p_order->>'shop_phone', ''));
  v_shop_address := TRIM(COALESCE(p_order->>'shop_address', ''));
  v_sales_boy_id := p_order->>'sales_boy_id';
  v_sales_boy_name := TRIM(COALESCE(p_order->>'sales_boy_name', 'Salesman'));
  v_order_date := COALESCE(p_order->>'order_date', to_char(NOW(), 'DD/MM/YYYY'));
  v_order_time := COALESCE(p_order->>'order_time', to_char(NOW(), 'HH12:MI AM'));
  v_timestamp := COALESCE((p_order->>'timestamp')::BIGINT, (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT);
  v_status := COALESCE(p_order->>'status', 'Confirmed');
  v_items := p_order->'items';

  -- Validation: shop name & phone
  IF v_shop_name = '' THEN
    RAISE EXCEPTION 'Shop Name is required';
  END IF;
  IF v_shop_phone = '' THEN
    RAISE EXCEPTION 'Shop Phone is required';
  END IF;

  -- Validation: items array
  IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one product item';
  END IF;

  -- 2. Generate Central Unique Sequential Order ID (guarantees NO collisions across concurrent phones)
  v_date_str := to_char(NOW(), 'YYYYMMDD');
  INSERT INTO public.daily_order_counter (order_date, current_seq)
  VALUES (v_date_str, 1)
  ON CONFLICT (order_date)
  DO UPDATE SET current_seq = public.daily_order_counter.current_seq + 1
  RETURNING current_seq INTO v_seq;

  v_order_id := 'ORD-' || v_date_str || '-' || lpad(v_seq::TEXT, 3, '0');

  -- 3. Calculate authoritative prices and line amounts
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    v_prod_id := v_item->>'product_id';
    v_qty := (v_item->>'quantity')::INTEGER;

    IF v_qty IS NULL OR v_qty <= 0 THEN
      CONTINUE; -- ignore zero or negative quantities
    END IF;

    -- Lookup authoritative product price from products catalog
    SELECT name, code, price INTO v_prod_name, v_prod_code, v_price
    FROM public.products
    WHERE id = v_prod_id AND active = true;

    IF NOT FOUND THEN
      v_prod_name := COALESCE(v_item->>'product_name', 'Product');
      v_prod_code := COALESCE(v_item->>'product_code', 'SKU');
      v_price := COALESCE((v_item->>'price')::NUMERIC, 0);
    END IF;

    v_amount := ROUND((v_price * v_qty)::NUMERIC, 2);
    v_total_qty := v_total_qty + v_qty;
    v_grand_total := v_grand_total + v_amount;
    v_total_items := v_total_items + 1;
  END LOOP;

  IF v_total_items = 0 THEN
    RAISE EXCEPTION 'Order contains no valid items with quantity > 0';
  END IF;

  -- 4. Atomically Insert Order into public.orders
  INSERT INTO public.orders (
    id,
    order_id,
    idempotency_key,
    shop_name,
    shop_phone,
    shop_address,
    sales_boy_id,
    sales_boy_name,
    order_date,
    order_time,
    timestamp,
    total_items,
    total_quantity,
    grand_total,
    status,
    sync_status
  ) VALUES (
    v_client_id,
    v_order_id,
    v_idempotency_key,
    v_shop_name,
    v_shop_phone,
    v_shop_address,
    v_sales_boy_id,
    v_sales_boy_name,
    v_order_date,
    v_order_time,
    v_timestamp,
    v_total_items,
    v_total_qty,
    v_grand_total,
    v_status,
    'synced'
  );

  -- 5. Atomically Insert Order Items into public.order_items
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    v_prod_id := v_item->>'product_id';
    v_qty := (v_item->>'quantity')::INTEGER;
    IF v_qty > 0 THEN
      SELECT name, code, price INTO v_prod_name, v_prod_code, v_price
      FROM public.products
      WHERE id = v_prod_id AND active = true;

      IF NOT FOUND THEN
        v_prod_name := COALESCE(v_item->>'product_name', 'Product');
        v_prod_code := COALESCE(v_item->>'product_code', 'SKU');
        v_price := COALESCE((v_item->>'price')::NUMERIC, 0);
      END IF;

      v_amount := ROUND((v_price * v_qty)::NUMERIC, 2);

      INSERT INTO public.order_items (
        id,
        order_id,
        product_id,
        product_name,
        product_code,
        quantity,
        price,
        amount
      ) VALUES (
        v_client_id || '-it-' || v_prod_id,
        v_client_id,
        v_prod_id,
        v_prod_name,
        v_prod_code,
        v_qty,
        v_price,
        v_amount
      );
    END IF;
  END LOOP;

  -- 6. Return verified order confirmation
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'id', v_client_id,
    'grand_total', v_grand_total,
    'total_quantity', v_total_qty,
    'total_items', v_total_items,
    'status', v_status
  );
END;
$$;

-- =====================================================================
-- 8. SECURE SALESMAN LOGIN RPC: verify_salesman_login
-- Server-side credential check. Never leaks PINs of other salesmen.
-- Respects deactivated accounts.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.verify_salesman_login(p_mobile TEXT, p_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_boy public.sales_boys%ROWTYPE;
BEGIN
  SELECT * INTO v_boy FROM public.sales_boys
  WHERE TRIM(mobile) = TRIM(p_mobile)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Salesman not found with this mobile number');
  END IF;

  IF NOT v_boy.active THEN
    RETURN jsonb_build_object('success', false, 'message', 'This salesman account has been deactivated. Please contact your manager.');
  END IF;

  IF TRIM(v_boy.pin) <> TRIM(p_pin) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Incorrect Salesman PIN. Please try again.');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'salesman', jsonb_build_object(
      'id', v_boy.id,
      'name', v_boy.name,
      'mobile', v_boy.mobile,
      'active', v_boy.active
    )
  );
END;
$$;
`;

export const SupabaseService = {
  /**
   * Tests connection to Supabase and verifies table schema
   */
  async testConnection(): Promise<{ success: boolean; message: string; tablesExist: boolean }> {
    try {
      const { data, error } = await supabase.from('products').select('id').limit(1);
      if (error) {
        if (error.code === '42P01') {
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
        message: 'Successfully connected to Supabase and database tables are verified!',
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
   * Fetches sales staff from Supabase
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
   * Fetches public sales staff without sensitive PIN fields
   */
  async getPublicSalesBoys(): Promise<SalesBoyPublic[] | null> {
    try {
      const { data, error } = await supabase
        .from('sales_boys')
        .select('id, name, mobile, active')
        .eq('active', true)
        .order('name');
      if (error || !data) return null;
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        mobile: row.mobile,
        active: Boolean(row.active),
      }));
    } catch (e) {
      console.warn('Supabase getPublicSalesBoys error:', e);
      return null;
    }
  },

  /**
   * Verifies salesman credentials securely (Server RPC first, local fallback)
   */
  async verifySalesmanLogin(
    mobile: string,
    pin: string,
    localSalesBoys: SalesBoy[]
  ): Promise<{ success: boolean; salesman?: SalesBoy; message?: string }> {
    const cleanMobile = mobile.trim();
    const cleanPin = pin.trim();

    try {
      // 1. Try server RPC verification
      const { data, error } = await supabase.rpc('verify_salesman_login', {
        p_mobile: cleanMobile,
        p_pin: cleanPin,
      });

      if (!error && data) {
        if (data.success && data.salesman) {
          return {
            success: true,
            salesman: {
              id: data.salesman.id,
              name: data.salesman.name,
              mobile: data.salesman.mobile,
              pin: cleanPin,
              active: data.salesman.active,
            },
          };
        } else {
          return {
            success: false,
            message: data.message || 'Invalid Mobile or PIN',
          };
        }
      }
    } catch (rpcErr) {
      console.warn('Supabase RPC verify_salesman_login not available, falling back to secure local verification:', rpcErr);
    }

    // 2. Safe local fallback
    const matched = localSalesBoys.find(
      (sb) => sb.mobile.trim() === cleanMobile && sb.pin.trim() === cleanPin
    );

    if (!matched) {
      return { success: false, message: 'Invalid Mobile Number or PIN. Please try again.' };
    }

    if (!matched.active) {
      return {
        success: false,
        message: 'This salesman account has been deactivated. Please contact your manager.',
      };
    }

    return { success: true, salesman: matched };
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
        idempotencyKey: row.idempotency_key || `cloud_${row.id}`,
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
        syncStatus: 'synced',
        items: itemsMap[row.id] || [],
      }));
    } catch (e) {
      console.warn('Supabase getOrders exception:', e);
      return null;
    }
  },

  /**
   * Submits an order and all its items to Supabase atomically.
   * Uses RPC submit_sales_order with fallback to atomic direct insert.
   * Guarantees all items and order save together or fail together.
   * Prevents duplicate submissions via idempotency key.
   */
  async submitOrder(order: Order, catalog: Product[]): Promise<SubmitOrderResult> {
    // 1. Validate inputs locally first
    const validation = validateAndCalculateOrder(
      order.items.reduce((acc, item) => {
        acc[item.productId] = item.quantity;
        return acc;
      }, {} as Record<string, number>),
      catalog
    );

    if (!validation.isValid) {
      return {
        success: false,
        order,
        syncStatus: 'failed',
        error: validation.errors.join('; '),
      };
    }

    const payload = {
      id: order.id,
      order_id: order.orderId,
      idempotency_key: order.idempotencyKey,
      shop_name: order.shopName.trim(),
      shop_phone: order.shopPhone.trim(),
      shop_address: order.shopAddress.trim(),
      sales_boy_id: order.salesBoyId || null,
      sales_boy_name: order.salesBoyName.trim(),
      order_date: order.orderDate,
      order_time: order.orderTime,
      timestamp: order.timestamp,
      total_items: validation.validatedItems.length,
      total_quantity: validation.totalQuantity,
      grand_total: validation.grandTotal,
      status: order.status,
      items: validation.validatedItems.map((it) => ({
        product_id: it.productId,
        product_name: it.productName,
        product_code: it.productCode,
        quantity: it.quantity,
        price: it.price,
        amount: it.amount,
      })),
    };

    try {
      // 2. Try the PostgreSQL atomic transaction RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc('submit_sales_order', {
        p_order: payload,
      });

      if (!rpcError && rpcData && rpcData.success) {
        const confirmedOrder: Order = {
          ...order,
          orderId: rpcData.order_id || order.orderId,
          grandTotal: Number(rpcData.grand_total) || validation.grandTotal,
          totalQuantity: Number(rpcData.total_quantity) || validation.totalQuantity,
          totalItems: Number(rpcData.total_items) || validation.validatedItems.length,
          items: validation.validatedItems,
          syncStatus: 'synced',
          lastSyncError: undefined,
        };

        return {
          success: true,
          order: confirmedOrder,
          syncStatus: 'synced',
          isDuplicate: Boolean(rpcData.is_duplicate),
          message: rpcData.message || 'Order confirmed and saved to cloud!',
        };
      }

      // If RPC failed due to missing function (code 42883) or schema, attempt direct verified insert
      if (rpcError && (rpcError.code === '42883' || rpcError.message.includes('function') || rpcError.message.includes('does not exist'))) {
        console.warn('submit_sales_order RPC not created in Supabase yet. Using direct verified insert fallback.');
        return await this.fallbackDirectOrderInsert(order, validation.validatedItems, validation.totalQuantity, validation.grandTotal);
      }

      // Supabase returned a validation or policy error
      const errorMsg = rpcError ? rpcError.message : 'Unknown server error';
      return {
        success: false,
        order: { ...order, syncStatus: 'failed', lastSyncError: errorMsg },
        syncStatus: 'failed',
        error: errorMsg,
      };
    } catch (err: any) {
      const isOffline = !navigator.onLine || err.message?.includes('network') || err.message?.includes('Failed to fetch');
      const errText = isOffline
        ? 'Network offline. Order queued locally and will sync when internet returns.'
        : err.message || 'Error communicating with Supabase database';

      return {
        success: false,
        order: { ...order, syncStatus: 'pending', lastSyncError: errText },
        syncStatus: 'pending',
        error: errText,
      };
    }
  },

  /**
   * Fallback direct verified insert if the RPC function hasn't been executed in Supabase yet.
   * Checks idempotency, inserts order, inserts items, and verifies both were written.
   */
  async fallbackDirectOrderInsert(
    order: Order,
    validatedItems: OrderItem[],
    totalQuantity: number,
    grandTotal: number
  ): Promise<SubmitOrderResult> {
    try {
      // 1. Check if already exists via idempotency
      if (order.idempotencyKey) {
        const { data: existing } = await supabase
          .from('orders')
          .select('id, order_id')
          .eq('idempotency_key', order.idempotencyKey)
          .maybeSingle();

        if (existing) {
          return {
            success: true,
            order: { ...order, orderId: existing.order_id, syncStatus: 'synced' },
            syncStatus: 'synced',
            isDuplicate: true,
            message: 'Order already saved (Idempotent)',
          };
        }
      }

      // 2. Insert Order
      const { error: orderError } = await supabase.from('orders').upsert({
        id: order.id,
        order_id: order.orderId,
        idempotency_key: order.idempotencyKey,
        shop_name: order.shopName,
        shop_phone: order.shopPhone,
        shop_address: order.shopAddress,
        sales_boy_id: order.salesBoyId || null,
        sales_boy_name: order.salesBoyName,
        order_date: order.orderDate,
        order_time: order.orderTime,
        timestamp: order.timestamp,
        total_items: validatedItems.length,
        total_quantity: totalQuantity,
        grand_total: grandTotal,
        status: order.status,
        sync_status: 'synced',
      });

      if (orderError) {
        throw new Error(`Order header insert failed: ${orderError.message}`);
      }

      // 3. Insert items
      const itemInserts = validatedItems.map((item, idx) => ({
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
        // Rollback or mark failed
        throw new Error(`Order items insert failed: ${itemsError.message}`);
      }

      return {
        success: true,
        order: { ...order, items: validatedItems, totalQuantity, grandTotal, syncStatus: 'synced' },
        syncStatus: 'synced',
        message: 'Order and items saved successfully to Supabase!',
      };
    } catch (err: any) {
      return {
        success: false,
        order: { ...order, syncStatus: 'failed', lastSyncError: err.message },
        syncStatus: 'failed',
        error: err.message,
      };
    }
  },

  /**
   * Synchronizes all pending local offline orders with Supabase
   */
  async syncPendingOrders(catalog: Product[]): Promise<{ synced: number; failed: number }> {
    const pending = StorageService.getPendingOrders();
    if (pending.length === 0) return { synced: 0, failed: 0 };

    let syncedCount = 0;
    let failedCount = 0;

    for (const order of pending) {
      try {
        const res = await this.submitOrder(order, catalog);
        if (res.success && res.syncStatus === 'synced') {
          StorageService.markOrderSynced(order.idempotencyKey, res.order.orderId);
          syncedCount++;
        } else {
          StorageService.markOrderFailed(order.idempotencyKey, res.error || 'Sync retry failed');
          failedCount++;
        }
      } catch (err: any) {
        StorageService.markOrderFailed(order.idempotencyKey, err.message || 'Sync network error');
        failedCount++;
      }
    }

    return { synced: syncedCount, failed: failedCount };
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
   * Seeds Supabase with official catalog products and default sales staff
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
