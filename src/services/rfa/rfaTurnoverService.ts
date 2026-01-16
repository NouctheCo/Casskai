import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export type RFATurnoverQuery = {
  companyId: string;
  thirdPartyId: string;
  startDate: string;
  endDate: string;
  groupIds?: string[]; // optional filter
  base: 'ht' | 'ttc';
};

export const rfaTurnoverService = {
  async sumFromInvoices(params: RFATurnoverQuery): Promise<number> {
    // Sum from invoice_lines_rfa joined to invoices by invoice_id
    // We cannot do SQL joins with supabase-js in one call easily, so we do 2-step:
    // 1) Get invoices ids in period for the third party
    // 2) Get invoice lines totals, optionally filtered by rfa_product_group_id
    const { data: invoices, error: invErr } = await supabase
      .from('invoices')
      .select('id')
      .eq('company_id', params.companyId)
      .or(`third_party_id.eq.${params.thirdPartyId},customer_id.eq.${params.thirdPartyId}`)
      .eq('invoice_type', 'sale')
      .in('status', ['sent', 'paid', 'partially_paid'])
      .gte('invoice_date', params.startDate)
      .lte('invoice_date', params.endDate);

    if (invErr) {
      logger.error('RFATurnover', 'sumFromInvoices invoices error', invErr);
      throw invErr;
    }

    const invoiceIds = (invoices || []).map(i => (i as any).id).filter(Boolean);
    if (invoiceIds.length === 0) return 0;

    let q = supabase
      .from('invoice_lines_rfa')
      .select('invoice_id, line_total_excl_tax, line_total_incl_tax, rfa_product_group_id')
      .in('invoice_id', invoiceIds);

    if (params.groupIds && params.groupIds.length > 0) {
      q = q.in('rfa_product_group_id', params.groupIds);
    }

    const { data: lines, error: linesErr } = await q;

    if (linesErr) {
      logger.error('RFATurnover', 'sumFromInvoices lines error', linesErr);
      throw linesErr;
    }

    const sum = (lines || []).reduce((acc: number, line: any) => {
      const value = params.base === 'ht' ? Number(line.line_total_excl_tax || 0) : Number(line.line_total_incl_tax || 0);
      return acc + value;
    }, 0);

    return sum;
  }
};
