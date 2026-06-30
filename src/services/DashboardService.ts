import { ClientRepository } from '../repositories/ClientRepository';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { InvoiceRepository } from '../repositories/InvoiceRepository';
import { ActivityLogRepository } from '../repositories/ActivityLogRepository';
import { AuthService } from './AuthService';
import { Result } from '../types';

export interface DashboardMetrics {
  profileName: string;
  activeProjects: number;
  outstanding: number;
  earnedThisMonth: number;
  totalClients: number;
  pipeline: { label: string; count: number; variant: 'outline' | 'primary' | 'success' | 'warning' }[];
  activities: any[];
}

export class DashboardService {
  static async getDashboardData(workspaceId: string, profileId: string): Promise<Result<DashboardMetrics>> {
    try {
      // 1. Profile Name
      const profRes = await AuthService.getProfile(profileId);
      const profileName = (profRes.success && profRes.data?.full_name) || 'Freelancer';

      // 2. Clients List Count
      const clientsResult = await ClientRepository.getAll(workspaceId);
      const clients = clientsResult.data;
      const totalClients = clients.length;

      // 3. Projects list (for active and pipeline)
      const projectsResult = await ProjectRepository.getAll(workspaceId);
      const projects = projectsResult.data;
      const activeProjects = projects.filter(p => p.status !== 'paid' && p.status !== 'archived').length;

      // 4. Invoices
      const invoicesResult = await InvoiceRepository.getAll(workspaceId);
      const invoices = invoicesResult.data;
      let outstanding = 0;
      let earnedThisMonth = 0;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      invoices.forEach(inv => {
        if (inv.status !== 'paid') {
          outstanding += (Number(inv.total) || 0);
        } else {
          const paidDate = new Date(inv.updated_at || inv.invoice_date);
          if (paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear) {
            earnedThisMonth += (Number(inv.total) || 0);
          }
        }
      });

      // 5. Pipeline stats
      const countByStatus = (status: string) => projects.filter(p => p.status === status).length;
      const pipeline = [
        { label: 'Proposal Sent', count: countByStatus('proposal'), variant: 'outline' as const },
        { label: 'Contract Sent', count: countByStatus('approved'), variant: 'primary' as const },
        { label: 'In Progress', count: countByStatus('in_progress') + countByStatus('contract_signed') + countByStatus('advance_paid'), variant: 'success' as const },
        { label: 'Invoice Shared', count: countByStatus('invoice_sent'), variant: 'warning' as const },
      ];

      // 6. Recent activities
      const activities = await ActivityLogRepository.getRecent(profileId, 5);

      return {
        success: true,
        data: {
          profileName,
          activeProjects,
          outstanding,
          earnedThisMonth,
          totalClients,
          pipeline,
          activities,
        }
      };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }
}
