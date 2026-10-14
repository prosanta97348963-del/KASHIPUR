import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { StorageService } from './storage';
import { Order } from '../types';

// Mock localStorage for headless Node environment
const memoryStore = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => memoryStore.get(key) || null,
  setItem: (key: string, value: string) => memoryStore.set(key, String(value)),
  removeItem: (key: string) => memoryStore.delete(key),
  clear: () => memoryStore.clear(),
};

beforeAll(() => {
  if (typeof globalThis.localStorage === 'undefined') {
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  }
});

describe('StorageService Pending Queue and Order ID Generation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('manages durable pending orders queue with add, get, and mark synced', () => {
    const dummyOrder: Order = {
      id: 'ord-123',
      orderId: 'ORD-20261014-S1-001-ABC',
      idempotencyKey: 'idemp_test_123',
      shopName: 'Test Shop',
      shopPhone: '9876543210',
      shopAddress: 'Test Address',
      salesBoyName: 'Rahul',
      orderDate: '14/10/2026',
      orderTime: '10:00 AM',
      timestamp: Date.now(),
      totalItems: 1,
      totalQuantity: 5,
      grandTotal: 100,
      status: 'Confirmed',
      syncStatus: 'pending',
      items: [
        {
          productId: 'p-HM05',
          productName: 'HALDI MASALA(₹5/-)',
          productCode: 'HM05',
          quantity: 5,
          price: 20,
          amount: 100,
        },
      ],
    };

    StorageService.addPendingOrder(dummyOrder);
    expect(StorageService.getPendingOrders().length).toBe(1);
    expect(StorageService.getPendingOrders()[0].idempotencyKey).toBe('idemp_test_123');

    // Add to all orders
    StorageService.addOrder(dummyOrder);
    expect(StorageService.getOrders()[0].syncStatus).toBe('pending');

    // Mark as synced with server confirmed ID
    StorageService.markOrderSynced('idemp_test_123', 'ORD-20261014-001');
    expect(StorageService.getPendingOrders().length).toBe(0);
    expect(StorageService.getOrders()[0].syncStatus).toBe('synced');
    expect(StorageService.getOrders()[0].orderId).toBe('ORD-20261014-001');
  });

  it('generates unique collision-proof IDs for different salesmen on the same day', () => {
    const idBoy1 = StorageService.generateNextOrderId('sb-1');
    const idBoy2 = StorageService.generateNextOrderId('sb-2');

    expect(idBoy1).not.toBe(idBoy2);
    expect(idBoy1.startsWith('ORD-')).toBe(true);
    expect(idBoy2.startsWith('ORD-')).toBe(true);
  });

  it('does not auto-authenticate salesmen when storage is empty', () => {
    expect(StorageService.getCurrentSalesBoy()).toBeNull();
  });

  it('clears deactivated salesmen automatically from current user session', () => {
    StorageService.setCurrentSalesBoy({
      id: 'sb-inactive',
      name: 'Deactivated User',
      mobile: '9999999999',
      pin: '1234',
      active: false,
    });
    expect(StorageService.getCurrentSalesBoy()).toBeNull();
  });
});
