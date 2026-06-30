import { supabase } from '../lib/supabaseClient';
import { Payment, QueryOptions, PaginatedResult } from '../types';

export class PaymentRepository {
  static async getAll(
    workspaceId: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<any>> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('payments')
      .select('*, invoices(invoice_number, total)', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null);

    if (options.search) {
      query = query.or(`transaction_reference.ilike.%${options.search}%`);
    }

    if (options.filter?.status) {
      query = query.eq('status', options.filter.status);
    }

    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error, count } = await query.range(from, to);

    if (error) throw new Error(error.message);

    const total = count || 0;
    return {
      data: data || [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  static async getByInvoiceId(workspaceId: string, invoiceId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null);

    if (error) throw new Error(error.message);
    return data || [];
  }

  static async submitPayment(workspaceId: string, paymentData: Omit<Payment, 'id' | 'workspace_id' | 'status' | 'created_at' | 'deleted_at'>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        ...paymentData,
        workspace_id: workspaceId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async updateStatus(workspaceId: string, paymentId: string, status: 'completed' | 'failed'): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .update({ status })
      .eq('id', paymentId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
