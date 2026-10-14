/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Product, SalesBoy, Order, CompanySettings, CurrentDraft, OrderStatus } from './types';
import { StorageService } from './utils/storage';
import { SupabaseService } from './services/supabaseService';
import { validateShopDetails, validateAndCalculateOrder, generateIdempotencyKey } from './utils/orderValidation';
import { Header } from './components/Header';
import { ShopDetailsStep } from './components/ShopDetailsStep';
import { ProductCatalogStep } from './components/ProductCatalogStep';
import { OrderSummaryStep } from './components/OrderSummaryStep';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { OrderSuccessStep } from './components/OrderSuccessStep';
import { OrderHistoryView } from './components/OrderHistoryView';
import { AdminSection } from './components/AdminSection';
import { LoginModal } from './components/LoginModal';
import { AdminAccessModal } from './components/AdminAccessModal';
import { InstallAppModal } from './components/InstallAppModal';
import { usePWAInstall } from './hooks/usePWAInstall';
import { Smartphone, Lock } from 'lucide-react';

export default function App() {
  // Navigation tabs: 'order' | 'history' | 'admin'
  const [currentTab, setCurrentTab] = useState<'order' | 'history' | 'admin'>('order');

  // Order taking step: 'shop-details' | 'product-catalog' | 'order-summary' | 'order-success'
  const [orderStep, setOrderStep] = useState<'shop-details' | 'product-catalog' | 'order-summary' | 'order-success'>('shop-details');

  // Master Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [salesBoys, setSalesBoys] = useState<SalesBoy[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(StorageService.getSettings());
  const [currentSalesBoy, setCurrentSalesBoy] = useState<SalesBoy | null>(null);

  // Supabase Cloud State
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);

  // Security: Admin Authentication State (Strictly decoupled from Salesman login)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isAccessAdminModalOpen, setIsAccessAdminModalOpen] = useState<boolean>(false);

  // Order Submission State
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [submitStatusText, setSubmitStatusText] = useState<string>('Saving order securely...');
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Current Working Order Draft
  const [draft, setDraft] = useState<CurrentDraft>({
    shopName: '',
    shopPhone: '',
    shopAddress: '',
    salesBoyName: '',
    selectedQuantities: {},
  });

  // Completed Order for Success Screen
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Modal States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Android PWA / APK install hook
  const { isInstallable, isInstalled, triggerInstall } = usePWAInstall();

  // Sync with Supabase Cloud Database with Safe Reconcile (never overwrites pending local orders)
  const syncWithSupabase = useCallback(async () => {
    try {
      const conn = await SupabaseService.testConnection();
      if (conn.success && conn.tablesExist) {
        setSupabaseConnected(true);

        // 1. Fetch remote products
        const remoteProds = await SupabaseService.getProducts();
        const hasLegacyDemo = remoteProds && remoteProds.some((p) => p.id === 'prod-1' || p.name.includes('Parle-G'));
        if (remoteProds && remoteProds.length > 0 && !hasLegacyDemo) {
          setProducts(remoteProds);
          StorageService.saveProducts(remoteProds);
        } else {
          // Seed official catalog if cloud table is empty
          const localProds = StorageService.getProducts();
          for (const p of localProds) {
            await SupabaseService.upsertProduct(p);
          }
        }

        // 2. Fetch remote sales boys
        const remoteBoys = await SupabaseService.getSalesBoys();
        if (remoteBoys && remoteBoys.length > 0) {
          setSalesBoys(remoteBoys);
          StorageService.saveSalesBoys(remoteBoys);
        } else {
          const localBoys = StorageService.getSalesBoys();
          for (const b of localBoys) {
            await SupabaseService.upsertSalesBoy(b);
          }
        }

        // 3. Sync any pending offline orders
        await SupabaseService.syncPendingOrders(StorageService.getProducts());

        // 4. Fetch remote orders and safely merge with local pending orders
        const remoteOrders = await SupabaseService.getOrders();
        if (remoteOrders) {
          const pendingOrders = StorageService.getPendingOrders();
          const remoteIdempKeys = new Set(remoteOrders.map((o) => o.idempotencyKey));
          const unsyncedLocal = pendingOrders.filter((p) => !remoteIdempKeys.has(p.idempotencyKey));

          const merged = [...unsyncedLocal, ...remoteOrders];
          merged.sort((a, b) => b.timestamp - a.timestamp);

          setOrders(merged);
          StorageService.saveOrders(merged);
        }
      } else if (conn.success && !conn.tablesExist) {
        setSupabaseConnected(false);
      }
    } catch (err) {
      console.warn('Supabase sync background check failed:', err);
    }
  }, []);

  // Initialize data on mount (Strictly DO NOT auto-authenticate salesman without PIN)
  useEffect(() => {
    const loadedProducts = StorageService.getProducts();
    const loadedBoys = StorageService.getSalesBoys();
    const loadedOrders = StorageService.getOrders();
    const loadedSettings = StorageService.getSettings();
    const activeBoy = StorageService.getCurrentSalesBoy(); // No auto-login fallback

    setProducts(loadedProducts);
    setSalesBoys(loadedBoys);
    setOrders(loadedOrders);
    setSettings(loadedSettings);
    setCurrentSalesBoy(activeBoy);

    // Load draft if available
    const savedDraft = StorageService.getDraft();
    if (savedDraft) {
      setDraft(savedDraft);
      if (savedDraft.shopName && Object.keys(savedDraft.selectedQuantities).length > 0) {
        setOrderStep('product-catalog');
      }
    } else if (activeBoy) {
      setDraft((prev) => ({ ...prev, salesBoyName: activeBoy.name }));
    }

    // Trigger Supabase Cloud sync
    syncWithSupabase();
  }, [syncWithSupabase]);

  // Sync draft sales boy when active sales boy changes
  useEffect(() => {
    if (currentSalesBoy && !draft.salesBoyName) {
      setDraft((prev) => ({ ...prev, salesBoyName: currentSalesBoy.name }));
    }
  }, [currentSalesBoy]);

  // Persist draft changes locally so salesman never loses work
  useEffect(() => {
    if (draft.shopName || Object.keys(draft.selectedQuantities).length > 0) {
      StorageService.saveDraft(draft);
    }
  }, [draft]);

  // Automatically retry pending offline orders when network connection is restored
  useEffect(() => {
    const handleOnline = () => {
      SupabaseService.syncPendingOrders(products).then(() => {
        setOrders(StorageService.getOrders());
      }).catch(() => {});
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [products]);

  // Compute active item count for badge
  const draftItemCount = Object.values(draft.selectedQuantities).filter((q) => q > 0).length;

  // Handlers for Products Master
  const handleAddProduct = (prodData: Omit<Product, 'id'>) => {
    const added = StorageService.addProduct(prodData);
    setProducts(StorageService.getProducts());
    SupabaseService.upsertProduct(added).catch(() => {});
  };

  const handleUpdateProduct = (updated: Product) => {
    StorageService.updateProduct(updated);
    setProducts(StorageService.getProducts());
    SupabaseService.upsertProduct(updated).catch(() => {});
  };

  const handleDeleteProduct = (id: string) => {
    StorageService.deleteProduct(id);
    setProducts(StorageService.getProducts());
    SupabaseService.deleteProduct(id).catch(() => {});
  };

  // Handlers for Sales Staff & Settings
  const handleSaveSettings = (newSettings: CompanySettings) => {
    StorageService.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const handleAddSalesBoy = (boyData: Omit<SalesBoy, 'id'>) => {
    const added = StorageService.addSalesBoy(boyData);
    setSalesBoys(StorageService.getSalesBoys());
    SupabaseService.upsertSalesBoy(added).catch(() => {});
  };

  const handleUpdateSalesBoy = (updated: SalesBoy) => {
    StorageService.updateSalesBoy(updated);
    setSalesBoys(StorageService.getSalesBoys());
    if (currentSalesBoy?.id === updated.id) {
      setCurrentSalesBoy(updated);
      StorageService.setCurrentSalesBoy(updated);
    }
    SupabaseService.upsertSalesBoy(updated).catch(() => {});
  };

  const handleDeleteSalesBoy = (id: string) => {
    StorageService.deleteSalesBoy(id);
    setSalesBoys(StorageService.getSalesBoys());
    if (currentSalesBoy?.id === id) {
      setCurrentSalesBoy(null);
      StorageService.setCurrentSalesBoy(null);
    }
    SupabaseService.deleteSalesBoy(id).catch(() => {});
  };

  const handleSelectSalesBoy = (sb: SalesBoy) => {
    setCurrentSalesBoy(sb);
    StorageService.setCurrentSalesBoy(sb);
    setDraft((prev) => ({ ...prev, salesBoyName: sb.name }));
  };

  // Safe navigation handler
  const handleTabChange = (tab: 'order' | 'history' | 'admin') => {
    if (tab === 'admin') {
      if (!isAdminAuthenticated) {
        setIsAccessAdminModalOpen(true);
        return;
      }
    }
    setCurrentTab(tab);
  };

  const handleExitAdmin = () => {
    setIsAdminAuthenticated(false);
    setCurrentTab('order');
  };

  // Handlers for Order Confirmation & Finalization
  const handleFinalizeOrder = async () => {
    setSubmissionError(null);
    setIsSubmittingOrder(true);
    setSubmitStatusText('Validating order & prices...');

    // 1. Validate salesman authentication
    if (!currentSalesBoy) {
      setIsSubmittingOrder(false);
      setSubmissionError('Salesman authentication is required. Please login with your PIN.');
      setIsLoginModalOpen(true);
      return;
    }

    // 2. Validate shop details
    const shopValidation = validateShopDetails({
      shopName: draft.shopName,
      shopPhone: draft.shopPhone,
      shopAddress: draft.shopAddress,
    });
    if (!shopValidation.isValid) {
      setIsSubmittingOrder(false);
      setSubmissionError(Object.values(shopValidation.errors)[0] || 'Please check shop details.');
      return;
    }

    // 3. Validate and calculate items using authoritative catalog
    const orderValidation = validateAndCalculateOrder(draft.selectedQuantities, products);
    if (!orderValidation.isValid) {
      setIsSubmittingOrder(false);
      setSubmissionError(orderValidation.errors[0] || 'Please select at least one active product.');
      return;
    }

    // 4. Stable Idempotency Key (ensures retries NEVER create duplicate orders)
    const idempotencyKey = draft.idempotencyKey || generateIdempotencyKey();
    if (!draft.idempotencyKey) {
      setDraft((prev) => ({ ...prev, idempotencyKey }));
    }

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const orderDateStr = `${dd}/${mm}/${yyyy}`;

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const orderTimeStr = `${hours}:${minutes} ${ampm}`;

    // Collision-proof order ID
    const initialOrderId = StorageService.generateNextOrderId(currentSalesBoy.id);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderId: initialOrderId,
      idempotencyKey,
      shopName: draft.shopName.trim(),
      shopPhone: draft.shopPhone.trim(),
      shopAddress: draft.shopAddress.trim(),
      salesBoyId: currentSalesBoy.id,
      salesBoyName: currentSalesBoy.name,
      orderDate: orderDateStr,
      orderTime: orderTimeStr,
      timestamp: Date.now(),
      totalItems: orderValidation.validatedItems.length,
      totalQuantity: orderValidation.totalQuantity,
      grandTotal: orderValidation.grandTotal,
      status: 'Confirmed',
      syncStatus: 'pending',
      items: orderValidation.validatedItems,
    };

    // 5. Save locally in orders and durable pending queue FIRST
    StorageService.addOrder(newOrder);
    StorageService.addPendingOrder(newOrder);
    setOrders(StorageService.getOrders());

    // 6. Attempt server-side submission
    setSubmitStatusText('Syncing order with Supabase cloud database...');
    try {
      const result = await SupabaseService.submitOrder(newOrder, products);

      if (result.success && result.syncStatus === 'synced') {
        // Server confirmed!
        StorageService.markOrderSynced(idempotencyKey, result.order.orderId);
        setOrders(StorageService.getOrders());

        // Safe to clear draft only now
        StorageService.saveDraft(null);
        setDraft({
          shopName: '',
          shopPhone: '',
          shopAddress: '',
          salesBoyName: currentSalesBoy.name,
          selectedQuantities: {},
        });

        setIsConfirmModalOpen(false);
        setIsSubmittingOrder(false);
        setCompletedOrder(result.order);
        setOrderStep('order-success');
      } else {
        // Network offline or pending sync: order is safely stored on device queue
        StorageService.markOrderFailed(idempotencyKey, result.error || 'Pending cloud sync');
        setOrders(StorageService.getOrders());

        // Safe local persistence achieved
        StorageService.saveDraft(null);
        setDraft({
          shopName: '',
          shopPhone: '',
          shopAddress: '',
          salesBoyName: currentSalesBoy.name,
          selectedQuantities: {},
        });

        setIsConfirmModalOpen(false);
        setIsSubmittingOrder(false);
        setCompletedOrder({
          ...newOrder,
          syncStatus: 'pending',
          lastSyncError: result.error,
        });
        setOrderStep('order-success');
      }
    } catch (e: any) {
      StorageService.markOrderFailed(idempotencyKey, e.message || 'Network exception');
      setOrders(StorageService.getOrders());
      setIsSubmittingOrder(false);
      setSubmissionError(`Submission error: ${e.message}. Your draft has been kept safe.`);
    }
  };

  const handleStartNewOrder = () => {
    StorageService.saveDraft(null);
    setDraft({
      shopName: '',
      shopPhone: '',
      shopAddress: '',
      salesBoyName: currentSalesBoy?.name || '',
      selectedQuantities: {},
    });
    setCompletedOrder(null);
    setOrderStep('shop-details');
    setCurrentTab('order');
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    StorageService.updateOrderStatus(orderId, status);
    setOrders(StorageService.getOrders());
    SupabaseService.updateOrderStatus(orderId, status).catch(() => {});
  };

  const handleRetrySyncOrder = async (order: Order) => {
    const res = await SupabaseService.submitOrder(order, products);
    if (res.success && res.syncStatus === 'synced') {
      StorageService.markOrderSynced(order.idempotencyKey, res.order.orderId);
      setOrders(StorageService.getOrders());
    } else {
      StorageService.markOrderFailed(order.idempotencyKey, res.error || 'Retry failed');
      setOrders(StorageService.getOrders());
      throw new Error(res.error || 'Failed to sync to cloud');
    }
  };

  const handleSyncAllPending = async () => {
    await SupabaseService.syncPendingOrders(products);
    setOrders(StorageService.getOrders());
  };

  const handleResetAllData = () => {
    StorageService.resetAllData();
    setProducts(StorageService.getProducts());
    setSalesBoys(StorageService.getSalesBoys());
    setOrders(StorageService.getOrders());
    setSettings(StorageService.getSettings());
    setCurrentSalesBoy(null);
    handleStartNewOrder();
  };

  const handleReloadCatalog = () => {
    const catalog = StorageService.resetToCatalog();
    setProducts(catalog);
  };

  // Calculate quick totals for confirmation modal using authoritative pricing
  const confirmationTotals = (() => {
    const res = validateAndCalculateOrder(draft.selectedQuantities, products);
    return { qty: res.totalQuantity, total: res.grandTotal };
  })();

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans flex flex-col selection:bg-emerald-200">
      {/* Top Application Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        currentSalesBoy={currentSalesBoy}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        companySettings={settings}
        draftItemCount={draftItemCount}
        isAdminAuthenticated={isAdminAuthenticated}
        onExitAdmin={handleExitAdmin}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
      />

      {/* Main App Content View */}
      <main className="flex-1 w-full">
        {currentTab === 'order' && (
          <>
            {orderStep === 'shop-details' && (
              <ShopDetailsStep
                draft={draft}
                setDraft={setDraft}
                currentSalesBoy={currentSalesBoy}
                onStartOrder={() => setOrderStep('product-catalog')}
                onOpenLogin={() => setIsLoginModalOpen(true)}
              />
            )}

            {orderStep === 'product-catalog' && (
              <ProductCatalogStep
                products={products}
                draft={draft}
                setDraft={setDraft}
                companySettings={settings}
                onBackToShopDetails={() => setOrderStep('shop-details')}
                onViewOrder={() => setOrderStep('order-summary')}
              />
            )}

            {orderStep === 'order-summary' && (
              <OrderSummaryStep
                draft={draft}
                products={products}
                companySettings={settings}
                onEditOrder={() => setOrderStep('product-catalog')}
                onConfirmOrderRequest={() => {
                  setSubmissionError(null);
                  setIsConfirmModalOpen(true);
                }}
                onRemoveItem={(prodId) => {
                  setDraft((prev) => {
                    const next = { ...prev.selectedQuantities };
                    delete next[prodId];
                    return { ...prev, selectedQuantities: next };
                  });
                }}
              />
            )}

            {orderStep === 'order-success' && completedOrder && (
              <OrderSuccessStep
                order={completedOrder}
                companySettings={settings}
                onStartNewOrder={handleStartNewOrder}
                onViewHistory={() => {
                  setCurrentTab('history');
                  setOrderStep('shop-details');
                }}
                onRetrySync={handleRetrySyncOrder}
              />
            )}
          </>
        )}

        {currentTab === 'history' && (
          <OrderHistoryView
            orders={orders}
            companySettings={settings}
            onUpdateStatus={handleUpdateOrderStatus}
            onStartNewOrder={handleStartNewOrder}
            onRetrySyncOrder={handleRetrySyncOrder}
            onSyncAllPending={handleSyncAllPending}
          />
        )}

        {/* Admin Section: STRICTLY protected by isAdminAuthenticated */}
        {currentTab === 'admin' && isAdminAuthenticated && (
          <AdminSection
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            settings={settings}
            onSaveSettings={handleSaveSettings}
            salesBoys={salesBoys}
            onAddSalesBoy={handleAddSalesBoy}
            onUpdateSalesBoy={handleUpdateSalesBoy}
            onDeleteSalesBoy={handleDeleteSalesBoy}
            onResetAllData={handleResetAllData}
            allOrdersCount={orders.length}
            onSyncWithSupabase={syncWithSupabase}
            onExitAdmin={handleExitAdmin}
            onReloadCatalog={handleReloadCatalog}
          />
        )}
      </main>

      {/* Subtle Footer with Hidden "Access Admin" */}
      <footer className="pt-4 pb-20 text-center">
        <button
          type="button"
          onClick={() => setIsAccessAdminModalOpen(true)}
          className="text-[11px] text-gray-400 hover:text-gray-600 active:text-gray-800 transition-colors inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-gray-200/60 bg-white/50"
        >
          <Lock className="w-3 h-3 text-gray-400" />
          <span>Access Admin</span>
        </button>
      </footer>

      {/* Order Confirmation Modal with Real-time Saving State & Safe Retry */}
      <OrderConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          if (!isSubmittingOrder) {
            setIsConfirmModalOpen(false);
          }
        }}
        onConfirm={handleFinalizeOrder}
        shopName={draft.shopName}
        totalQuantity={confirmationTotals.qty}
        grandTotal={confirmationTotals.total}
        currency={settings.currency || '₹'}
        isSubmitting={isSubmittingOrder}
        submitStatusText={submitStatusText}
        submissionError={submissionError}
      />

      {/* Salesman Login Modal (Requires 4-Digit PIN, NO Quick Select Bypass) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        salesBoys={salesBoys}
        currentSalesBoy={currentSalesBoy}
        onSelectSalesBoy={handleSelectSalesBoy}
      />

      {/* Secure Hidden Admin PIN Modal */}
      <AdminAccessModal
        isOpen={isAccessAdminModalOpen}
        onClose={() => setIsAccessAdminModalOpen(false)}
        onSuccess={() => {
          setIsAdminAuthenticated(true);
          setCurrentTab('admin');
        }}
        correctPin={settings.adminPin || '9999'}
      />

      {/* Small Bottom APK Download / Install Button */}
      <div
        className={`fixed z-30 transition-all ${
          orderStep === 'product-catalog' && currentTab === 'order'
            ? 'bottom-22 right-3'
            : 'bottom-4 right-3 sm:right-6'
        }`}
      >
        <button
          type="button"
          onClick={() => setIsInstallModalOpen(true)}
          className="bg-emerald-950/90 hover:bg-emerald-900 active:bg-black text-white text-[11px] font-extrabold px-3 py-2 rounded-full shadow-xl border border-emerald-500/50 flex items-center space-x-1.5 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          title="Download APK / Install A.R SELLS App on Phone"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>APK Download</span>
        </button>
      </div>

      {/* APK / PWA Install Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        isInstallable={isInstallable}
        triggerInstall={triggerInstall}
        isInstalled={isInstalled}
      />
    </div>
  );
}
