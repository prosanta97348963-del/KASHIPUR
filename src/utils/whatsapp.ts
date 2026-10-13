import { Order } from '../types';

export interface WhatsAppFormatOptions {
  includePrices?: boolean; // defaults to false (compact format for billing software)
  currency?: string;
}

/**
 * Formats order into a clean, concise, compact WhatsApp message.
 * Removes unnecessary line breaks, spaces, prices, and amounts by default.
 * Designed specifically for fast entry into billing software.
 * 
 * Example Output:
 * *ORDER: ABC Store*
 * ID: ORD-20261013-001 | Date: 13/10/2026
 * Phone: 9876543210
 * Address: Kolkata, West Bengal
 * 
 * *ITEMS:*
 * 1. Parle-G Glucose Biscuits (800g) (P001) - 10 pcs
 * 2. Maggi 2-Minute Noodles (12-Pack) (P003) - 5 pcs
 * 
 * Total Items: 2 | Total Qty: 15 pcs
 * Salesman: Rahul
 */
export function formatWhatsAppOrderMessage(
  order: Order,
  optionsOrCurrency: WhatsAppFormatOptions | string = {}
): string {
  const options: WhatsAppFormatOptions =
    typeof optionsOrCurrency === 'string'
      ? { currency: optionsOrCurrency, includePrices: false }
      : { includePrices: false, currency: '₹', ...optionsOrCurrency };

  const currency = options.currency || '₹';
  const includePrices = Boolean(options.includePrices);

  const formatAmount = (num: number) => num.toLocaleString('en-IN');

  // Single-line compact product items
  const productLines = order.items.map((item, index) => {
    if (includePrices) {
      return `${index + 1}. ${item.productName} (${item.productCode}) - ${item.quantity} pcs @ ${currency}${formatAmount(item.price)} = ${currency}${formatAmount(item.amount)}`;
    }
    // Clean compact format: No price/amount, 1 line per product
    return `${index + 1}. ${item.productName} (${item.productCode}) - ${item.quantity} pcs`;
  });

  const lines: string[] = [
    `*ORDER: ${order.shopName}*`,
    `ID: ${order.orderId} | Date: ${order.orderDate}`,
    `Phone: ${order.shopPhone}`,
  ];

  if (order.shopAddress) {
    lines.push(`Address: ${order.shopAddress}`);
  }

  lines.push('');
  lines.push('*ITEMS:*');
  lines.push(...productLines);
  lines.push('');
  lines.push(`Total Items: ${order.totalItems} | Total Qty: ${order.totalQuantity} pcs`);

  if (includePrices) {
    lines.push(`Grand Total: ${currency}${formatAmount(order.grandTotal)}`);
  }

  if (order.salesBoyName) {
    lines.push(`Salesman: ${order.salesBoyName}`);
  }

  return lines.join('\n');
}

/**
 * Normalizes a phone number for WhatsApp wa.me links
 * Strips all spaces, dashes, symbols.
 * If 10 digits (typical India mobile), prepends '91' by default if no country code.
 */
export function sanitizeWhatsAppPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

/**
 * Generates WhatsApp URL
 */
export function getWhatsAppShareUrl(phone: string, message: string): string {
  const cleanPhone = sanitizeWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}
