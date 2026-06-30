import { supabase } from '../lib/supabaseClient';
import { Contract, ContractSignature, ContractWithSignature } from '../types';

export class ContractRepository {
  static async getByProjectId(workspaceId: string, projectId: string): Promise<ContractWithSignature | null> {
    const { data: contract, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('project_id', projectId)
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .single();

    if (error || !contract) return null;

    const { data: signature } = await supabase
      .from('contract_signatures')
      .select('*')
      .eq('contract_id', contract.id)
      .eq('workspace_id', workspaceId)
      .single();

    return {
      ...contract,
      contract_signatures: signature || null,
    };
  }

  static async create(workspaceId: string, contractData: Omit<Contract, 'id' | 'workspace_id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Contract> {
    const { data, error } = await supabase
      .from('contracts')
      .insert({
        ...contractData,
        workspace_id: workspaceId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async update(workspaceId: string, id: string, contractData: Partial<Contract>): Promise<Contract> {
    const { data, error } = await supabase
      .from('contracts')
      .update(contractData)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async addSignature(workspaceId: string, signatureData: Omit<ContractSignature, 'id' | 'workspace_id' | 'signature_date' | 'created_at'>): Promise<ContractSignature> {
    const { data, error } = await supabase
      .from('contract_signatures')
      .insert({
        ...signatureData,
        workspace_id: workspaceId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
