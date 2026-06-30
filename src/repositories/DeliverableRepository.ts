import { supabase } from '../lib/supabaseClient';
import { Deliverable } from '../types';

export class DeliverableRepository {
  static async getByProjectId(workspaceId: string, projectId: string): Promise<Deliverable[]> {
    const { data, error } = await supabase
      .from('deliverables')
      .select('*')
      .eq('project_id', projectId)
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null);

    if (error) throw new Error(error.message);
    return data || [];
  }

  static async addDeliverable(workspaceId: string, deliverableData: Omit<Deliverable, 'id' | 'workspace_id' | 'uploaded_at' | 'downloaded_at' | 'created_at' | 'deleted_at'>): Promise<Deliverable> {
    const { data, error } = await supabase
      .from('deliverables')
      .insert({
        ...deliverableData,
        workspace_id: workspaceId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async markDownloaded(workspaceId: string, id: string): Promise<Deliverable> {
    const { data, error } = await supabase
      .from('deliverables')
      .update({ downloaded_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
