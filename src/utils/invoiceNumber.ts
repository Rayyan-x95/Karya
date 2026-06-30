/**
 * Generates an sequential invoice number template based on current year and index.
 * e.g., INV-2026-0001
 */
export function generateInvoiceNumber(index: number, prefix: string = 'INV'): string {
  const year = new Date().getFullYear();
  const sequenceStr = String(index).padStart(4, '0');
  return `${prefix}-${year}-${sequenceStr}`;
}

/**
 * Validates if an invoice number follows typical invoicing structures.
 */
export function isValidInvoiceNumber(invoiceNum: string): boolean {
  return /^[A-Z0-9_-]{3,20}$/i.test(invoiceNum);
}
