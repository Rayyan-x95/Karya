import { supabase } from '../lib/supabaseClient';
import { Invoice, InvoiceItem, InvoiceWithItems, QueryOptions, PaginatedResult } from '../types';


export class InvoiceRepository {
  static async getAll(
    workspaceId: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<InvoiceWithItems>> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('invoices')
      .select('*, projects(*, clients(*))', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null);

    if (options.search) {
      query = query.or(`invoice_number.ilike.%${options.search}%`);
    }

    if (options.filter?.status) {
      query = query.eq('status', options.filter.status);
    }

    if (options.filter?.project_id) {
      query = query.eq('project_id', options.filter.project_id);
    }

    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error, count } = await query.range(from, to);

    if (error) throw new Error(error.message);
    
    const total = count || 0;
    return {
      data: (data as InvoiceWithItems[]) || [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  static async getById(workspaceId: string, id: string): Promise<InvoiceWithItems | null> {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, projects(*, clients(*))')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .single();

    if (error || !invoice) return null;

    const { data: items } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoice.id)
      .eq('workspace_id', workspaceId);

    return {
      ...invoice,
      invoice_items: items || [],
    };
  }

  static async getByProjectId(workspaceId: string, projectId: string): Promise<InvoiceWithItems[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, projects(*, clients(*))')
      .eq('project_id', projectId)
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null);

    if (error) throw new Error(error.message);
    return data || [];
  }

  static async create(
    workspaceId: string,
    invoiceData: Omit<Invoice, 'id' | 'workspace_id' | 'created_at' | 'updated_at' | 'deleted_at'>,
    items: Omit<InvoiceItem, 'id' | 'workspace_id' | 'invoice_id'>[]
  ): Promise<InvoiceWithItems> {
    // Perform transactional inserts
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert({
        ...invoiceData,
        workspace_id: workspaceId,
      })
      .select()
      .single();

    if (invError || !invoice) throw new Error(invError?.message || 'Failed to create invoice header');

    const itemsToInsert = items.map(item => ({
      ...item,
      invoice_id: invoice.id,
      workspace_id: workspaceId,
    }));

    const { data: insertedItems, error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert)
      .select();

    if (itemsError) {
      // rollback manually by deleting the header in mock/real environments
      await supabase.from('invoices').delete().eq('id', invoice.id);
      throw new Error(itemsError.message);
    }

    return {
      ...invoice,
      invoice_items: insertedItems || [],
    };
  }

  static async update(workspaceId: string, id: string, invoiceData: Partial<Invoice>): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update(invoiceData)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async softDelete(workspaceId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('invoices')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', workspaceId);

    if (error) throw new Error(error.message);
  }
}
