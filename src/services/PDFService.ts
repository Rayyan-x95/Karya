import { InvoiceWithItems, Result } from '../types';
import { StorageService } from './StorageService';

export class PDFService {
  /**
   * Generates invoice PDF and uploads to Supabase storage.
   * In production, this would use an HTML-to-PDF library like puppeteer or jsPDF.
   * For now, generates a text-based PDF representation and stores it.
   */
  static async generateInvoicePdf(invoice: InvoiceWithItems, workspaceId: string): Promise<Result<{ pdfUrl: string; storagePath: string }>> {
    try {
      const { invoice_number, total, subtotal, cgst, sgst, igst, id } = invoice;
      
      // Formulate a structured text snapshot acting as PDF payload
      const payload = `
        ========================================
                     KARYA TAX INVOICE
        ========================================
        Invoice Number : ${invoice_number}
        Subtotal       : ₹${subtotal.toFixed(2)}
        CGST (9%)      : ₹${cgst.toFixed(2)}
        SGST (9%)      : ₹${sgst.toFixed(2)}
        IGST (18%)     : ₹${igst.toFixed(2)}
        ----------------------------------------
        TOTAL PAID     : ₹${total.toFixed(2)}
        ========================================
      `;

      // Convert to base64 for storage
      const base64Content = btoa(payload);
      const pdfBytes = new Uint8Array(atob(base64Content).split('').map(c => c.charCodeAt(0)));
      const pdfFile = new File([pdfBytes], `${invoice_number}.pdf`, { type: 'application/pdf' });

      // Upload to Supabase storage with proper path structure
      const storagePath = `${invoice.project_id}/${id}/${invoice_number}.pdf`;
      const uploadRes = await StorageService.uploadFile(workspaceId, 'invoices', storagePath, pdfFile);
      
      if (uploadRes.success === false) {
        throw uploadRes.error;
      }

      return {
        success: true,
        data: {
          pdfUrl: uploadRes.data.publicUrl,
          storagePath: uploadRes.data.path,
        },
      };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }
}
