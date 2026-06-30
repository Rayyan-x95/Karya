import { InvoiceRepository } from '../repositories/InvoiceRepository';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { InvoiceSchema } from '../schemas';
import { Invoice, InvoiceItem, InvoiceWithItems, Result, QueryOptions, PaginatedResult } from '../types';
import { LoggingService } from './LoggingService';

import { InvoiceStateMachine } from '../utils/StateMachine';
import { ClientRepository } from '../repositories/ClientRepository';

export class InvoiceService {
  static async listInvoices(
    workspaceId: string,
    options: QueryOptions = {}
  ): Promise<Result<PaginatedResult<InvoiceWithItems>>> {
    try {
      const data = await InvoiceRepository.getAll(workspaceId, options);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }

  static async getInvoiceDetails(workspaceId: string, id: string): Promise<Result<InvoiceWithItems | null>> {
    try {
      const data = await InvoiceRepository.getById(workspaceId, id);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }

  static async addInvoice(
    workspaceId: string,
    profileId: string,
    invoiceData: {
      project_id: string;
      invoice_number: string;
      invoice_date: string;
      due_date: string;
      notes?: string | null;
      gstin?: string | null;
      isInterstate: boolean;
      items: Omit<InvoiceItem, 'id' | 'workspace_id' | 'invoice_id' | 'amount'>[];
    }
  ): Promise<Result<InvoiceWithItems>> {
    try {
      // Validate inputs using Zod
      const validated = InvoiceSchema.parse({
        project_id: invoiceData.project_id,
        invoice_number: invoiceData.invoice_number,
        invoice_date: invoiceData.invoice_date,
        due_date: invoiceData.due_date,
        notes: invoiceData.notes,
        gstin: invoiceData.gstin,
        items: invoiceData.items,
      });

      // Verify project ownership
      const project = await ProjectRepository.getById(workspaceId, validated.project_id);
      if (!project) {
        throw new Error('Unauthorized: Project does not belong to your workspace');
      }

      // 1. Calculate GST math (intrastate vs interstate)
      let subtotal = 0;
      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      const itemsWithAmounts = invoiceData.items.map(item => {
        const itemAmount = Number(item.quantity) * Number(item.rate);
        subtotal += itemAmount;

        const gstRateDecimal = Number(item.gst_rate) / 100;
        const gstAmount = itemAmount * gstRateDecimal;

        if (invoiceData.isInterstate) {
          igst += gstAmount;
        } else {
          cgst += gstAmount / 2;
          sgst += gstAmount / 2;
        }

        return {
          ...item,
          amount: itemAmount,
        };
      });

      const total = subtotal + cgst + sgst + igst;

      const newInvoice = await InvoiceRepository.create(
        workspaceId,
        {
          project_id: invoiceData.project_id,
          invoice_number: invoiceData.invoice_number,
          invoice_date: invoiceData.invoice_date,
          due_date: invoiceData.due_date,
          notes: invoiceData.notes || null,
          gstin: invoiceData.gstin || null,
          subtotal,
          cgst,
          sgst,
          igst,
          total,
          status: 'draft',
          pdf_url: null,
        },
        itemsWithAmounts
      );

      await LoggingService.logActivity({
        workspaceId,
        profileId,
        projectId: invoiceData.project_id,
        action: 'Invoice Generated',
        details: { invoiceId: newInvoice.id, invoiceNumber: newInvoice.invoice_number, total },
      });

      return { success: true, data: newInvoice };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }

  static async updateInvoiceStatus(
    workspaceId: string,
    profileId: string,
    id: string,
    status: Invoice['status']
  ): Promise<Result<Invoice>> {
    try {
      const currentInvoice = await InvoiceRepository.getById(workspaceId, id);
      if (!currentInvoice) {
        throw new Error('Invoice not found');
      }

      const currentStatus = currentInvoice.status;
      if (currentStatus !== status) {
        const project = await ProjectRepository.getById(workspaceId, currentInvoice.project_id);
        let clientEmail: string | undefined;
        if (project) {
          const client = await ClientRepository.getById(workspaceId, project.client_id);
          clientEmail = client?.email;
        }

        await InvoiceStateMachine.transition({
          workspaceId,
          profileId,
          invoiceId: id,
          invoiceNumber: currentInvoice.invoice_number,
          clientEmail,
          current: currentStatus,
          next: status,
        });
      }

      const invoice = await InvoiceRepository.update(workspaceId, id, { status });
      return { success: true, data: invoice };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }

  static async markInvoicePaid(workspaceId: string, profileId: string, id: string): Promise<Result<Invoice>> {
    try {
      // 1. Mark invoice as paid
      const invRes = await this.updateInvoiceStatus(workspaceId, profileId, id, 'paid');
      if (!invRes.success || !invRes.data) return invRes;
      const invoice = invRes.data;

      // 2. Mark payments completed
      const { PaymentRepository } = await import('../repositories/PaymentRepository');
      const { PaymentStateMachine, ProjectStateMachine } = await import('../utils/StateMachine');

      const payments = await PaymentRepository.getByInvoiceId(workspaceId, id);
      const pendingPayments = payments.filter(p => p.status === 'pending');
      for (const payment of pendingPayments) {
        await PaymentStateMachine.transition({
          workspaceId,
          profileId,
          paymentId: payment.id,
          utr: payment.transaction_reference || '',
          current: 'pending',
          next: 'completed',
        });
        await PaymentRepository.updateStatus(workspaceId, payment.id, 'completed');
      }

      // 3. Project status transition safety
      const project = await ProjectRepository.getById(workspaceId, invoice.project_id);
      if (project) {
        if (['contract_signed', 'advance_paid'].includes(project.status)) {
          if (ProjectStateMachine.validate(project.status, 'in_progress')) {
            await ProjectStateMachine.transition({
              workspaceId,
              profileId,
              projectId: project.id,
              projectName: project.name,
              current: project.status,
              next: 'in_progress',
            });
            await ProjectRepository.update(workspaceId, project.id, { status: 'in_progress' });
          }
        } else {
          const allInvoices = await InvoiceRepository.getByProjectId(workspaceId, invoice.project_id);
          const unpaid = allInvoices.filter(i => i.id !== id && i.status !== 'paid');
          if (unpaid.length === 0 && ProjectStateMachine.validate(project.status, 'paid')) {
            await ProjectStateMachine.transition({
              workspaceId,
              profileId,
              projectId: project.id,
              projectName: project.name,
              current: project.status,
              next: 'paid',
            });
            await ProjectRepository.update(workspaceId, project.id, { status: 'paid' });
          }
        }
      }

      return { success: true, data: invoice };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }
}
