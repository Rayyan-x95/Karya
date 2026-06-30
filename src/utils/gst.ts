export interface GSTCalculationResult {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

/**
 * Calculates GST splits based on interstate vs intrastate parameters.
 */
export function calculateGST(subtotal: number, gstRatePercent: number, isInterstate: boolean): GSTCalculationResult {
  const gstRateDecimal = gstRatePercent / 100;
  const totalGst = subtotal * gstRateDecimal;

  if (isInterstate) {
    return {
      subtotal,
      cgst: 0,
      sgst: 0,
      igst: totalGst,
      total: subtotal + totalGst,
    };
  } else {
    const halfGst = totalGst / 2;
    return {
      subtotal,
      cgst: halfGst,
      sgst: halfGst,
      igst: 0,
      total: subtotal + totalGst,
    };
  }
}

/**
 * Validates the HSN (Harmonized System of Nomenclature) code format.
 * In India, HSN codes are typically 2, 4, 6, or 8 digits.
 */
export function isValidHsnCode(hsnCode: string): boolean {
  const clean = hsnCode.replace(/\s+/g, '');
  return /^\d{2,8}$/.test(clean);
}
