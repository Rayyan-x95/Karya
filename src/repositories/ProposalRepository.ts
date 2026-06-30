import { supabase } from '../lib/supabaseClient';
import { Proposal, ProposalSection, ProposalWithSections } from '../types';

export class ProposalRepository {
  static async getByProjectId(workspaceId: string, projectId: string): Promise<ProposalWithSections | null> {
    const { data: proposal, error: propError } = await supabase
      .from('proposals')
      .select('*')
      .eq('project_id', projectId)
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .single();

    if (propError || !proposal) return null;

    const { data: sections } = await supabase
      .from('proposal_sections')
      .select('*')
      .eq('proposal_id', proposal.id)
      .eq('workspace_id', workspaceId)
      .order('sort_order', { ascending: true });

    return {
      ...proposal,
      proposal_sections: sections || [],
    };
  }

  static async getByProposalId(workspaceId: string, proposalId: string): Promise<ProposalWithSections | null> {
    const { data: proposal, error: propError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .single();

    if (propError || !proposal) return null;

    const { data: sections } = await supabase
      .from('proposal_sections')
      .select('*')
      .eq('proposal_id', proposal.id)
      .eq('workspace_id', workspaceId)
      .order('sort_order', { ascending: true });

    return {
      ...proposal,
      proposal_sections: sections || [],
    };
  }

  static async create(workspaceId: string, proposalData: Omit<Proposal, 'id' | 'workspace_id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Proposal> {
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        ...proposalData,
        workspace_id: workspaceId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async update(workspaceId: string, id: string, proposalData: Partial<Proposal>): Promise<Proposal> {
    const { data, error } = await supabase
      .from('proposals')
      .update(proposalData)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async addSection(workspaceId: string, sectionData: Omit<ProposalSection, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>): Promise<ProposalSection> {
    const { data, error } = await supabase
      .from('proposal_sections')
      .insert({
        ...sectionData,
        workspace_id: workspaceId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async updateSection(workspaceId: string, sectionId: string, sectionData: Partial<ProposalSection>): Promise<ProposalSection> {
    const { data, error } = await supabase
      .from('proposal_sections')
      .update(sectionData)
      .eq('id', sectionId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async deleteSection(workspaceId: string, sectionId: string): Promise<void> {
    const { error } = await supabase
      .from('proposal_sections')
      .delete()
      .eq('id', sectionId)
      .eq('workspace_id', workspaceId);

    if (error) throw new Error(error.message);
  }
}
