import { supabase } from '../lib/supabaseClient';
import { env } from '../app/config/env';
import { Result } from '../types';

export class NotificationService {
  static async sendEmail(
    workspaceId: string,
    profileId: string,
    recipient: string,
    subject: string,
    htmlBody: string
  ): Promise<Result<{ resendId: string | null }>> {
    try {
      // 1. Write initial pending log
      const { data: log, error: logError } = await supabase
        .from('email_logs')
        .insert({
          workspace_id: workspaceId,
          profile_id: profileId,
          recipient,
          subject,
          body: htmlBody,
          status: 'pending',
        })
        .select()
        .single();

      if (logError || !log) {
        return { success: false, error: new Error(logError?.message || 'Failed to initialize email audit log') };
      }

      // If live Resend integration is keyless/not set, mark sent immediately for mock/offline fallback
      if (!env.VITE_RESEND_API_KEY) {
        await supabase
          .from('email_logs')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', log.id);

        return { success: true, data: { resendId: 'mock-resend-id-offline' } };
      }

      // Live integration: dispatch via Supabase Edge Function or direct SMTP/REST endpoints
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.VITE_RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Karya Portal <notifications@karya.in>',
          to: [recipient],
          subject,
          html: htmlBody,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        await supabase
          .from('email_logs')
          .update({
            status: 'failed',
            error_message: errText,
          })
          .eq('id', log.id);

        return { success: false, error: new Error(errText) };
      }

      const resData = await response.json();
      await supabase
        .from('email_logs')
        .update({
          status: 'sent',
          resend_id: resData.id,
          sent_at: new Date().toISOString(),
        })
        .eq('id', log.id);

      return { success: true, data: { resendId: resData.id } };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }
}
