import { ProjectRepository } from '../repositories/ProjectRepository';
import { ClientRepository } from '../repositories/ClientRepository';
import { ProposalRepository } from '../repositories/ProposalRepository';
import { ContractRepository } from '../repositories/ContractRepository';
import { DeliverableRepository } from '../repositories/DeliverableRepository';
import { StorageService } from './StorageService';
import { WorkspaceService } from './WorkspaceService';
import { InvoiceService } from './InvoiceService';
import { ProjectSchema, ProposalSchema, ContractSchema } from '../schemas';
import { Project, ProjectWithClient, Result, QueryOptions, PaginatedResult } from '../types';
import { LoggingService } from './LoggingService';

import { ProjectStateMachine } from '../utils/StateMachine';

export class ProjectService {
  static async listProjects(
    workspaceId: string,
    options: QueryOptions = {}
  ): Promise<Result<PaginatedResult<ProjectWithClient>>> {
    try {
      const data = await ProjectRepository.getAll(workspaceId, options);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }

  static async getProjectDetails(workspaceId: string, id: string): Promise<Result<ProjectWithClient | null>> {
    try {
      const data = await ProjectRepository.getById(workspaceId, id);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }

  static async getProjectPortalToken(workspaceId: string, projectId: string): Promise<Result<string | null>> {
    try {
      const project = await ProjectRepository.getById(workspaceId, projectId);
      if (!project) {
        throw new Error('Project not found');
      }
      return { success: true, data: project.portal_token || null };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }

  static async addProject(
    workspaceId: string,
    profileId: string,
    projectData: Omit<Project, 'id' | 'workspace_id' | 'portal_token' | 'created_at' | 'updated_at' | 'deleted_at'>
  ): Promise<Result<Project>> {
    try {
      const validated = ProjectSchema.parse(projectData);
      
      // Enforce cross-workspace validation
      const client = await ClientRepository.getById(workspaceId, validated.client_id);
      if (!client) {
        throw new Error('Unauthorized: Client does not belong to your workspace');
      }

      const project = await ProjectRepository.create(workspaceId, validated as any);

      await LoggingService.logActivity({
        workspaceId,
        profileId,
        projectId: project.id,
        action: 'Project Created',
        details: { name: project.name },
      });

      return { success: true, data: project };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }

  static async updateProjectStatus(
    workspaceId: string,
    profileId: string,
    id: string,
    status: Project['status']
  ): Promise<Result<Project>> {
    try {
      const currentProject = await ProjectRepository.getById(workspaceId, id);
      if (!currentProject) {
        throw new Error('Project not found');
      }

      const currentStatus = currentProject.status;
      if (currentStatus !== status) {
        const client = await ClientRepository.getById(workspaceId, currentProject.client_id);
        
        await ProjectStateMachine.transition({
          workspaceId,
          profileId,
          projectId: id,
          projectName: currentProject.name,
          clientEmail: client?.email,
          current: currentStatus,
          next: status,
        });
      }

      const project = await ProjectRepository.update(workspaceId, id, { status });
      return { success: true, data: project };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }

  // --- Proposal Operations ---
  static async saveProposal(
    workspaceId: string,
    profileId: string,
    projectId: string,
    proposalId: string | undefined,
    proposalData: any,
    status: 'draft' | 'sent'
  ): Promise<Result<any>> {
    try {
      // Cross-workspace validation on project
      const project = await ProjectRepository.getById(workspaceId, projectId);
      if (!project) throw new Error('Unauthorized project workspace access');

      const validated = ProposalSchema.parse({
        ...proposalData,
        status,
      });

      let proposal;
      if (proposalId) {
        proposal = await ProposalRepository.update(workspaceId, proposalId, {
          introduction: validated.introduction,
          scope: validated.scope,
          pricing: validated.pricing,
          timeline: validated.timeline,
          terms: validated.terms,
          status,
        });
      } else {
        proposal = await ProposalRepository.create(workspaceId, {
          project_id: projectId,
          introduction: validated.introduction || null,
          scope: validated.scope || null,
          deliverables: [],
          pricing: validated.pricing,
          timeline: validated.timeline || null,
          revision_policy: null,
          terms: validated.terms || null,
          status,
          client_feedback: null,
        });
      }

      if (status === 'sent') {
        await ProjectRepository.update(workspaceId, projectId, { status: 'proposal' });
      }

      await LoggingService.logActivity({
        workspaceId,
        profileId,
        projectId,
        action: status === 'sent' ? 'Proposal Shared' : 'Proposal Saved',
        details: { proposalId: proposal.id },
      });

      return { success: true, data: proposal };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }

  // --- Contract Operations ---
  static async saveContract(
    workspaceId: string,
    profileId: string,
    projectId: string,
    contractId: string | undefined,
    content: string,
    status: 'draft' | 'sent'
  ): Promise<Result<any>> {
    try {
      const project = await ProjectRepository.getById(workspaceId, projectId);
      if (!project) throw new Error('Unauthorized project workspace access');

      const validated = ContractSchema.parse({
        content,
        status,
      });

      let contract;
      if (contractId) {
        contract = await ContractRepository.update(workspaceId, contractId, {
          content: validated.content,
          status: validated.status,
        });
      } else {
        contract = await ContractRepository.create(workspaceId, {
          project_id: projectId,
          content: validated.content,
          signed_copy_url: null,
          status: validated.status,
        });
      }

      await LoggingService.logActivity({
        workspaceId,
        profileId,
        projectId,
        action: status === 'sent' ? 'Contract Shared' : 'Contract Draft Saved',
        details: { contractId: contract.id },
      });

      return { success: true, data: contract };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }

  // --- Deliverables & Storage Operations ---
  static async uploadDeliverable(
    workspaceId: string,
    profileId: string,
    projectId: string,
    file: File
  ): Promise<Result<any>> {
    try {
      const project = await ProjectRepository.getById(workspaceId, projectId);
      if (!project) throw new Error('Unauthorized project workspace access');

      // Secure path structure: workspace_id/project_id/filename
      const secureFilePath = `${projectId}/${crypto.randomUUID()}-${file.name}`;
      
      const uploadRes = await StorageService.uploadFile(workspaceId, 'deliverables', secureFilePath, file);
      if (uploadRes.success === false) throw uploadRes.error;

      // Save record in deliverables table
      const deliverable = await DeliverableRepository.addDeliverable(workspaceId, {
        project_id: projectId,
        name: file.name,
        file_url: uploadRes.data.path,
        file_type: file.type,
        file_size: file.size,
      });

      await LoggingService.logActivity({
        workspaceId,
        profileId,
        projectId,
        action: 'Deliverable Uploaded',
        details: { deliverableId: deliverable.id, filename: file.name },
      });

      return { success: true, data: deliverable };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }

  // --- Invoice & GST Payout Generator ---
  static async generateInvoice(
    workspaceId: string,
    profileId: string,
    projectId: string,
    invoiceNo: string,
    amount: number,
    notes: string
  ): Promise<Result<any>> {
    try {
      const project = await ProjectRepository.getById(workspaceId, projectId);
      if (!project) throw new Error('Unauthorized project workspace access');

      const settingsRes = await WorkspaceService.getSettings(workspaceId);
      if (settingsRes.success === false) throw settingsRes.error;
      const settings = settingsRes.data;

      const hasGst = !!settings?.gstin;
      
      const invoiceResult = await InvoiceService.addInvoice(workspaceId, profileId, {
        project_id: projectId,
        invoice_number: invoiceNo,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days
        notes,
        gstin: settings?.gstin || null,
        isInterstate: false, // Default to same-state CGST+SGST unless customized
        items: [
          {
            description: `${project.name} - Final Deliverables`,
            quantity: 1,
            rate: amount,
            gst_rate: hasGst ? 18 : 0,
            hsn_code: '9983', // Professional consultancy standard
          }
        ]
      });

      if (invoiceResult.success === false) throw invoiceResult.error;

      // Update project status to invoice_sent
      await ProjectRepository.update(workspaceId, projectId, { status: 'invoice_sent' });

      return { success: true, data: invoiceResult.data };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }
}
