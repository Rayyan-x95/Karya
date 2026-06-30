import { Result } from '../types';
import { buildUpiPayload } from '../utils/qr';

export class QRService {
  /**
   * Generates a standard Bharat QR/UPI pay-to URI.
   * e.g., upi://pay?pa=name@upi&pn=PayeeName&am=150.00&cu=INR
   */
  static generateUpiUri(params: {
    upiId: string;
    payeeName: string;
    amount: number;
    transactionNote?: string;
  }): Result<string> {
    try {
      const { upiId, payeeName, amount, transactionNote } = params;

      if (!upiId || !upiId.includes('@')) {
        return { success: false, error: new Error('Invalid UPI ID') };
      }
      if (amount <= 0) {
        return { success: false, error: new Error('Transaction amount must be positive') };
      }

      const uri = buildUpiPayload(upiId, payeeName, amount, transactionNote);
      return { success: true, data: uri };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }
}
