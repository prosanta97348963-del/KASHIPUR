import { describe, it, expect } from 'vitest';
import {
  validateShopDetails,
  validateAndCalculateOrder,
  roundCurrency,
  generateIdempotencyKey,
} from './orderValidation';
import { Product } from '../types';

describe('Order Validation and Calculations', () => {
  const sampleCatalog: Product[] = [
    {
      id: 'p-HM05',
      code: 'HM05',
      name: 'HALDI MASALA(₹5/-)',
      price: 3.43,
      category: 'Pouches (₹5/-)',
      active: true,
    },
    {
      id: 'p-GM10',
      code: 'GM10',
      name: 'GARAM MASALA ( ₹10/-)',
      price: 8.01,
      category: 'Pouches (₹10/-)',
      active: true,
    },
    {
      id: 'p-INACTIVE',
      code: 'INACT',
      name: 'DISCONTINUED SPICE',
      price: 5.5,
      category: 'Inactive',
      active: false,
    },
  ];

  describe('Shop Details Validation', () => {
    it('accepts valid shop name, phone and address', () => {
      const res = validateShopDetails({
        shopName: 'M/S Radhe Krishna Stores',
        shopPhone: '9876543210',
        shopAddress: 'Barabazar, Kolkata',
      });
      expect(res.isValid).toBe(true);
      expect(Object.keys(res.errors).length).toBe(0);
    });

    it('rejects blank or whitespace shop names', () => {
      const res = validateShopDetails({
        shopName: '   ',
        shopPhone: '9876543210',
        shopAddress: 'Kolkata',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.shopName).toBeDefined();
    });

    it('rejects invalid or too short phone numbers', () => {
      const res = validateShopDetails({
        shopName: 'Radhe Krishna Stores',
        shopPhone: '123',
        shopAddress: 'Kolkata',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.shopPhone).toBeDefined();
    });

    it('rejects blank addresses', () => {
      const res = validateShopDetails({
        shopName: 'Radhe Krishna Stores',
        shopPhone: '9876543210',
        shopAddress: '   ',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.shopAddress).toBeDefined();
    });
  });

  describe('Currency Rounding Precision', () => {
    it('rounds numbers to strictly 2 decimal places avoiding IEEE floating point drift', () => {
      // 3.43 * 3 in javascript is 10.289999999999999
      expect(3.43 * 3).not.toBe(10.29);
      expect(roundCurrency(3.43 * 3)).toBe(10.29);
      expect(roundCurrency(8.01 * 7)).toBe(56.07);
    });

    it('handles NaN or invalid numbers safely', () => {
      expect(roundCurrency(NaN)).toBe(0);
    });
  });

  describe('Authoritative Order Calculation & Line Item Validation', () => {
    it('calculates line amounts and grand total using authoritative catalog prices', () => {
      const res = validateAndCalculateOrder(
        {
          'p-HM05': 10, // 3.43 * 10 = 34.30
          'p-GM10': 5,  // 8.01 * 5  = 40.05
        },
        sampleCatalog
      );

      expect(res.isValid).toBe(true);
      expect(res.errors.length).toBe(0);
      expect(res.totalQuantity).toBe(15);
      expect(res.grandTotal).toBe(74.35);
      expect(res.validatedItems.length).toBe(2);

      const hmItem = res.validatedItems.find((it) => it.productId === 'p-HM05');
      expect(hmItem).toBeDefined();
      expect(hmItem?.amount).toBe(34.3);
      expect(hmItem?.price).toBe(3.43);
    });

    it('rejects empty orders with no items', () => {
      const res = validateAndCalculateOrder({}, sampleCatalog);
      expect(res.isValid).toBe(false);
      expect(res.errors[0]).toContain('at least one product');
    });

    it('rejects zero or negative quantities', () => {
      const res = validateAndCalculateOrder(
        {
          'p-HM05': -5,
          'p-GM10': 0,
        },
        sampleCatalog
      );
      expect(res.isValid).toBe(false);
      expect(res.errors.length).toBeGreaterThan(0);
    });

    it('rejects inactive / discontinued products and prevents zero-priced order items', () => {
      const res = validateAndCalculateOrder(
        {
          'p-INACTIVE': 3,
        },
        sampleCatalog
      );
      expect(res.isValid).toBe(false);
      expect(res.errors.some((e) => e.includes('deactivated'))).toBe(true);
      expect(res.validatedItems.length).toBe(0);
    });

    it('rejects non-existent product IDs', () => {
      const res = validateAndCalculateOrder(
        {
          'unknown-id-999': 4,
        },
        sampleCatalog
      );
      expect(res.isValid).toBe(false);
      expect(res.errors.some((e) => e.includes('was not found'))).toBe(true);
    });
  });

  describe('Idempotency Key Generation', () => {
    it('generates unique non-empty string keys', () => {
      const key1 = generateIdempotencyKey();
      const key2 = generateIdempotencyKey();
      expect(key1).toBeDefined();
      expect(key2).toBeDefined();
      expect(key1).not.toBe(key2);
      expect(key1.startsWith('idemp_')).toBe(true);
    });
  });
});
