import { Product, OrderItem, OrderValidationResult } from '../types';

/**
 * Validates shop details entered by salesman
 */
export function validateShopDetails(details: {
  shopName?: string;
  shopPhone?: string;
  shopAddress?: string;
}): { isValid: boolean; errors: { shopName?: string; shopPhone?: string; shopAddress?: string } } {
  const errors: { shopName?: string; shopPhone?: string; shopAddress?: string } = {};

  const cleanName = (details.shopName || '').trim();
  const cleanPhone = (details.shopPhone || '').trim();
  const cleanAddress = (details.shopAddress || '').trim();

  if (!cleanName) {
    errors.shopName = 'Shop name is required';
  } else if (cleanName.length < 2) {
    errors.shopName = 'Shop name must be at least 2 characters';
  }

  const digits = cleanPhone.replace(/\D/g, '');
  if (!cleanPhone) {
    errors.shopPhone = 'Shop phone number is required';
  } else if (digits.length < 7 || digits.length > 15) {
    errors.shopPhone = 'Enter a valid phone number (7 to 15 digits)';
  }

  if (!cleanAddress) {
    errors.shopAddress = 'Shop address is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates selected items against authoritative catalog,
 * verifies active status, rejects zero or negative quantities,
 * recalculates line totals and grand total with strict 2-decimal precision.
 */
export function validateAndCalculateOrder(
  selectedQuantities: Record<string, number>,
  catalog: Product[]
): OrderValidationResult {
  const errors: string[] = [];
  const validatedItems: OrderItem[] = [];

  const catalogMap = new Map<string, Product>();
  catalog.forEach((p) => catalogMap.set(p.id, p));

  const entries = Object.entries(selectedQuantities).filter(([_, qty]) => qty !== undefined && qty !== null);

  if (entries.length === 0) {
    return {
      isValid: false,
      errors: ['Order must contain at least one product.'],
      validatedItems: [],
      totalQuantity: 0,
      grandTotal: 0,
    };
  }

  let totalQuantity = 0;
  let rawGrandTotal = 0;

  for (const [productId, qty] of entries) {
    const rawQty = Number(qty);

    // Reject non-integers, zeros, negatives or NaN
    if (isNaN(rawQty) || !Number.isInteger(rawQty) || rawQty <= 0) {
      if (rawQty < 0) {
        errors.push(`Invalid quantity (${qty}) for item. Quantity must be a positive integer.`);
      }
      continue; // Skip zero or invalid
    }

    const product = catalogMap.get(productId);

    if (!product) {
      errors.push(`Product with ID "${productId}" was not found in the catalog.`);
      continue;
    }

    if (!product.active) {
      errors.push(`Product "${product.name}" is deactivated and cannot be ordered.`);
      continue;
    }

    // Authoritative price check
    const price = Number(product.price);
    if (isNaN(price) || price < 0) {
      errors.push(`Invalid price for product "${product.name}".`);
      continue;
    }

    // Line amount with 2 decimal precision
    const amount = roundCurrency(price * rawQty);

    validatedItems.push({
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      quantity: rawQty,
      price: roundCurrency(price),
      amount,
    });

    totalQuantity += rawQty;
    rawGrandTotal += amount;
  }

  if (validatedItems.length === 0) {
    errors.push('No valid products selected. Please add at least one active product with quantity > 0.');
  }

  const grandTotal = roundCurrency(rawGrandTotal);

  return {
    isValid: errors.length === 0 && validatedItems.length > 0,
    errors,
    validatedItems,
    totalQuantity,
    grandTotal,
  };
}

/**
 * Rounds a number to exactly 2 decimal places to avoid floating point anomalies (e.g. 3.43 * 3 = 10.289999999999999)
 */
export function roundCurrency(val: number): number {
  if (isNaN(val)) return 0;
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Generates a unique client-side idempotency key for an order
 */
export function generateIdempotencyKey(): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  const timePart = Date.now().toString(36);
  return `idemp_${timePart}_${randomPart}`;
}
