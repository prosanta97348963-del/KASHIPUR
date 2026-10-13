import { Order } from '../types';

/**
 * Formats order into the exact WhatsApp message format specified in instructions:
 * 
 * NEW SALES ORDER
 * 
 * Order ID: ORD-20261013-001
 * Date: 13/10/2026
 * 
 * SHOP DETAILS
 * Shop Name: ABC Store
 * Phone: 9876543210
 * Address: Kolkata, West Bengal
 * 
 * PRODUCT DETAILS
 * 
 * 1. Product A
 *    Code: P001
 *    Quantity: 10
 *    Price: ₹100
 *    Amount: ₹1,000
 * 
 * ---
 * 
 * Total Items: 2
 * Total Quantity: 15
 * Grand Total: ₹2,000
 * 
 * Sales Boy: Rahul
 * 
 * Please confirm this order.
 */
export function formatWhatsAppOrderMessage(order: Order, currency = '₹'): string {
  const formatAmount = (num: number) => {
    return num.toLocaleString('en-IN');
  };

  const productList = order.items
    .map((item, index) => {
      return `${index + 1}. ${item.productName}\n   Code: ${item.productCode}\n   Quantity: ${item.quantity}\n   Price: ${currency}${formatAmount(item.price)}\n   Amount: ${currency}${formatAmount(item.amount)}`;
    })
    .join('\n\n');

  const lines = [
    '*NEW SALES ORDER*',
    '',
    `*Order ID:* ${order.orderId}`,
    `*Date:* ${order.orderDate}`,
    '',
    '*SHOP DETAILS*',
    `Shop Name: ${order.shopName}`,
    `Phone: ${order.shopPhone}`,
    `Address: ${order.shopAddress}`,
    '',
    '*PRODUCT DETAILS*',
    '',
    productList,
    '',
    '---',
    '',
    `*Total Items:* ${order.totalItems}`,
    `*Total Quantity:* ${order.totalQuantity}`,
    `*Grand Total:* ${currency}${formatAmount(order.grandTotal)}`,
    '',
    `*Sales Boy:* ${order.salesBoyName || 'N/A'}`,
    '',
    'Please confirm this order.'
  ];

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
