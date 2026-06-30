import { supabase } from '../lib/supabaseClient';
import { Result } from '../types';

export class StorageService {
  static async uploadFile(
    workspaceId: string,
    bucket: 'avatars' | 'contracts' | 'proposals' | 'invoices' | 'deliverables' | 'branding',
    filePath: string,
    file: File
  ): Promise<Result<{ path: string; publicUrl: string }>> {
    try {
      // Structure the path securely by prepending workspace ID to restrict unauthorized crossover access
      const securePath = `${workspaceId}/${filePath}`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(securePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) return { success: false, error: new Error(error.message) };

      // Obtain public url
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(securePath);

      // Track file uploads in metadata database table
      await supabase.from('file_uploads').insert({
        workspace_id: workspaceId,
        name: file.name,
        storage_path: securePath,
        bucket,
        size: file.size,
        mime_type: file.type,
      });

      return {
        success: true,
        data: {
          path: data.path,
          publicUrl: urlData.publicUrl,
        },
      };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }
}
