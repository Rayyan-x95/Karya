import { LoggingService } from '../services/LoggingService';
import { NotificationService } from '../services/NotificationService';
import { Project, Invoice } from '../types';

export type ProjectStatus = Project['status'];
export type InvoiceStatus = Invoice['status'];
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type ContractStatus = 'draft' | 'sent' | 'signed' | 'void';

export class ProjectStateMachine {
  private static allowed: Record<ProjectStatus, ProjectStatus[]> = {
    'lead': ['proposal', 'archived'],
    'proposal': ['approved', 'archived'],
    'approved': ['contract_signed', 'archived'],
    'contract_signed': ['advance_paid', 'in_progress', 'archived'],
    'advance_paid': ['in_progress', 'archived'],
    'in_progress': ['delivered', 'archived'],
    'delivered': ['invoice_sent', 'archived'],
    'invoice_sent': ['paid', 'archived'],
    'paid': ['archived'],
    'archived': ['lead', 'proposal', 'in_progress'],
  };

  static validate(current: ProjectStatus, next: ProjectStatus): boolean {
    if (current === next) return true;
    const targets = this.allowed[current] || [];
    return targets.includes(next);
  }

  static async transition(params: {
    workspaceId: string;
    profileId: string;
    projectId: string;
    projectName: string;
    clientEmail?: string | null;
    current: ProjectStatus;
    next: ProjectStatus;
  }) {
    const { workspaceId, profileId, projectId, projectName, clientEmail, current, next } = params;
    if (!this.validate(current, next)) {
      throw new Error(`Invalid project state transition from '${current}' to '${next}'`);
    }

    // 1. Log transition
    await LoggingService.logActivity({
      workspaceId,
      profileId,
      projectId,
      action: 'Project Status Updated',
      details: { from: current, to: next, projectName },
    });

    // 2. Dispatch notifications
    if (clientEmail) {
      const subject = `Project "${projectName}" status updated to ${next}`;
      const body = `
        <p>Dear Client,</p>
        <p>Your project <strong>${projectName}</strong> has progressed to status <strong>${next}</strong>.</p>
        <p>You can view updates on your client portal.</p>
      `;
      await NotificationService.sendEmail(workspaceId, profileId, clientEmail, subject, body);
    }
  }
}

export class InvoiceStateMachine {
  private static allowed: Record<InvoiceStatus, InvoiceStatus[]> = {
    'draft': ['sent', 'cancelled'],
    'sent': ['viewed', 'cancelled', 'pending_verification'],
    'viewed': ['pending_verification', 'cancelled', 'paid', 'overdue'],
    'pending_verification': ['paid', 'cancelled', 'sent'],
    'paid': ['cancelled'],
    'overdue': ['paid', 'cancelled'],
    'cancelled': ['draft'],
  };

  static validate(current: InvoiceStatus, next: InvoiceStatus): boolean {
    if (current === next) return true;
    const targets = this.allowed[current] || [];
    return targets.includes(next);
  }

  static async transition(params: {
    workspaceId: string;
    profileId: string;
    invoiceId: string;
    invoiceNumber: string;
    clientEmail?: string | null;
    current: InvoiceStatus;
    next: InvoiceStatus;
  }) {
    const { workspaceId, profileId, invoiceId, invoiceNumber, clientEmail, current, next } = params;
    if (!this.validate(current, next)) {
      throw new Error(`Invalid invoice state transition from '${current}' to '${next}'`);
    }

    // 1. Log transition
    await LoggingService.logActivity({
      workspaceId,
      profileId,
      action: 'Invoice Status Updated',
      details: { invoiceId, invoiceNumber, from: current, to: next },
    });

    // 2. Dispatch notifications
    if (clientEmail) {
      const subject = `Invoice ${invoiceNumber} status: ${next}`;
      const body = `
        <p>Dear Client,</p>
        <p>The status of invoice <strong>${invoiceNumber}</strong> has been updated to <strong>${next}</strong>.</p>
      `;
      await NotificationService.sendEmail(workspaceId, profileId, clientEmail, subject, body);
    }
  }
}

export class PaymentStateMachine {
  private static allowed: Record<PaymentStatus, PaymentStatus[]> = {
    'pending': ['completed', 'failed'],
    'completed': [],
    'failed': ['pending'],
  };

  static validate(current: PaymentStatus, next: PaymentStatus): boolean {
    if (current === next) return true;
    const targets = this.allowed[current] || [];
    return targets.includes(next);
  }

  static async transition(params: {
    workspaceId: string;
    profileId: string;
    paymentId: string;
    utr: string;
    current: PaymentStatus;
    next: PaymentStatus;
  }) {
    const { workspaceId, profileId, paymentId, utr, current, next } = params;
    if (!this.validate(current, next)) {
      throw new Error(`Invalid payment state transition from '${current}' to '${next}'`);
    }

    // Log transition
    await LoggingService.logActivity({
      workspaceId,
      profileId,
      action: 'Payment Status Updated',
      details: { paymentId, utr, from: current, to: next },
    });
  }
}

export class ContractStateMachine {
  private static allowed: Record<ContractStatus, ContractStatus[]> = {
    'draft': ['sent', 'void'],
    'sent': ['signed', 'void'],
    'signed': ['void'],
    'void': ['draft'],
  };

  static validate(current: ContractStatus, next: ContractStatus): boolean {
    if (current === next) return true;
    const targets = this.allowed[current] || [];
    return targets.includes(next);
  }

  static async transition(params: {
    workspaceId: string;
    profileId: string;
    contractId: string;
    projectName: string;
    current: ContractStatus;
    next: ContractStatus;
  }) {
    const { workspaceId, profileId, contractId, projectName, current, next } = params;
    if (!this.validate(current, next)) {
      throw new Error(`Invalid contract state transition from '${current}' to '${next}'`);
    }

    // Log transition
    await LoggingService.logActivity({
      workspaceId,
      profileId,
      action: 'Contract Status Updated',
      details: { contractId, projectName, from: current, to: next },
    });
  }
}
