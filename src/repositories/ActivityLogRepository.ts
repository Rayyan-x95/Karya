import { supabase } from '../lib/supabaseClient';
import { ActivityLog } from '../types';

export class ActivityLogRepository {
  static async getRecent(profileId: string, limitNum: number): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limitNum);

    if (error) throw new Error(error.message);
    return data || [];
  }
}
