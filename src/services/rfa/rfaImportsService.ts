import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { csvLite } from '@/utils/csvLite';

export type RFAImportType = 'product_groups' | 'product_group_items' | 'turnover_data' | 'contracts';

export type RFAImportRowDetail = {
  row: number;
  status: 'success' | 'error' | 'warning' | 'skipped';
  message?: string;
  data?: Record<string, unknown>;
};

const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
};

const nowIso = () => new Date().toISOString();

const inc = (summary: Record<string, number>, key: string) => {
  summary[key] = (summary[key] || 0) + 1;
};

const toNumber = (value: string): number | null => {
  const v = value?.trim();
  if (!v) return null;
  const normalized = v.replace(/\s/g, '').replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
};

const toDate = (value: string): string | null => {
  const v = value?.trim();
  if (!v) return null;
  // Accept YYYY-MM-DD or DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
};

export const rfaImportsService = {
  templates: {
    product_groups_csv(): string {
      return [
        'code;name;description;color;is_active',
        'ALIM;Alimentation;Produits alimentaires;#3B82F6;true'
      ].join('\n');
    },
    product_group_items_csv(): string {
      return [
        'product_group_code;product_reference;product_name;unit',
        'ALIM;PDT-001;Pâtes 500g;pcs'
      ].join('\n');
    },
    turnover_data_csv(): string {
      return [
        'third_party_id;period_start;period_end;amount_excl_tax;amount_incl_tax;product_group_code',
        '00000000-0000-0000-0000-000000000000;2026-01-01;2026-01-31;10000;12000;ALIM'
      ].join('\n');
    }
  },

  async downloadTemplate(templateText: string, filename: string): Promise<void> {
    const blob = new Blob([templateText], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  async runImport(params: {
    companyId: string;
    importType: RFAImportType;
    file: File;
  }): Promise<{ importId: string; details: RFAImportRowDetail[] }>{
    const userId = await getCurrentUserId();

    const parsed = await csvLite.parse(params.file);

    const insertImport = await supabase
      .from('rfa_imports')
      .insert({
        company_id: params.companyId,
        import_type: params.importType,
        file_name: params.file.name,
        file_size: params.file.size,
        file_mime_type: params.file.type || null,
        import_config: { headers: parsed.headers },
        total_rows: parsed.rows.length,
        processed_rows: 0,
        success_rows: 0,
        error_rows: 0,
        warning_rows: 0,
        skipped_rows: 0,
        status: 'validating',
        progress_percent: 5,
        current_step: 'validation',
        started_at: nowIso(),
        created_by: userId
      })
      .select('id')
      .single();

    if (insertImport.error || !insertImport.data) {
      logger.error('RFAImports', 'insert import error', insertImport.error);
      throw insertImport.error;
    }

    const importId = insertImport.data.id as string;

    try {
      const { details, counters, createdIds } = await this.applyImport({
        importId,
        companyId: params.companyId,
        importType: params.importType,
        rows: parsed.rows
      });

      const hasErrors = (counters.error_rows || 0) > 0;

      await supabase.from('rfa_imports').update({
        processed_rows: parsed.rows.length,
        ...counters,
        row_details: details,
        error_summary: counters.error_summary,
        created_record_ids: createdIds,
        status: hasErrors ? 'completed_with_errors' : 'completed',
        progress_percent: 100,
        current_step: 'done',
        completed_at: nowIso()
      }).eq('id', importId);

      return { importId, details };
    } catch (e) {
      await supabase.from('rfa_imports').update({
        status: 'failed',
        progress_percent: 100,
        current_step: 'failed',
        completed_at: nowIso()
      }).eq('id', importId);
      throw e;
    }
  },

  async applyImport(params: {
    importId: string;
    companyId: string;
    importType: RFAImportType;
    rows: Record<string, string>[];
  }): Promise<{
    details: RFAImportRowDetail[];
    counters: {
      success_rows: number;
      error_rows: number;
      warning_rows: number;
      skipped_rows: number;
      error_summary: Record<string, number>;
    };
    createdIds: string[];
  }> {
    const details: RFAImportRowDetail[] = [];
    const error_summary: Record<string, number> = {};
    const createdIds: string[] = [];

    let success_rows = 0;
    let error_rows = 0;
    let warning_rows = 0;
    let skipped_rows = 0;

    await supabase.from('rfa_imports').update({
      status: 'importing',
      progress_percent: 20,
      current_step: 'import'
    }).eq('id', params.importId);

    if (params.importType === 'product_groups') {
      for (let i = 0; i < params.rows.length; i++) {
        const row = params.rows[i];
        const code = (row['code'] || '').trim();
        const name = (row['name'] || '').trim();
        const description = (row['description'] || '').trim() || null;
        const color = (row['color'] || '').trim() || null;
        const isActiveRaw = (row['is_active'] || '').trim().toLowerCase();
        const is_active = isActiveRaw === '' ? true : ['1', 'true', 'yes', 'oui'].includes(isActiveRaw);

        if (!name) {
          error_rows++;
          inc(error_summary, 'missing_name');
          details.push({ row: i + 2, status: 'error', message: 'Champ name requis', data: row });
          continue;
        }

        try {
          const { data, error } = await supabase
            .from('rfa_product_groups')
            .upsert({
              company_id: params.companyId,
              code: code || null,
              name,
              description,
              color,
              is_active
            }, { onConflict: 'company_id,code' })
            .select('id')
            .single();

          if (error) throw error;
          if (data?.id) createdIds.push(String(data.id));

          success_rows++;
          details.push({ row: i + 2, status: 'success' });
        } catch (e: any) {
          error_rows++;
          inc(error_summary, 'db_error');
          details.push({ row: i + 2, status: 'error', message: e?.message || 'Erreur DB', data: row });
        }
      }

      return {
        details,
        counters: { success_rows, error_rows, warning_rows, skipped_rows, error_summary },
        createdIds
      };
    }

    if (params.importType === 'product_group_items') {
      // Load groups by code for mapping
      const { data: groups, error: groupsError } = await supabase
        .from('rfa_product_groups')
        .select('id, code')
        .eq('company_id', params.companyId);

      if (groupsError) throw groupsError;

      const codeToId = new Map<string, string>();
      (groups || []).forEach((g: any) => {
        if (g.code) codeToId.set(String(g.code).trim(), String(g.id));
      });

      for (let i = 0; i < params.rows.length; i++) {
        const row = params.rows[i];
        const groupCode = (row['product_group_code'] || '').trim();
        const product_reference = (row['product_reference'] || '').trim();
        const product_name = (row['product_name'] || '').trim() || null;

        if (!groupCode || !product_reference) {
          error_rows++;
          inc(error_summary, 'missing_group_or_reference');
          details.push({ row: i + 2, status: 'error', message: 'product_group_code et product_reference requis', data: row });
          continue;
        }

        const product_group_id = codeToId.get(groupCode);
        if (!product_group_id) {
          error_rows++;
          inc(error_summary, 'unknown_group_code');
          details.push({ row: i + 2, status: 'error', message: `Groupe introuvable: ${groupCode}`, data: row });
          continue;
        }

        try {
          const { data, error } = await supabase
            .from('rfa_product_group_items')
            .upsert({
              product_group_id,
              product_reference,
              product_name
            }, { onConflict: 'product_group_id,product_reference' })
            .select('id')
            .single();

          if (error) throw error;
          if (data?.id) createdIds.push(String(data.id));

          success_rows++;
          details.push({ row: i + 2, status: 'success' });
        } catch (e: any) {
          error_rows++;
          inc(error_summary, 'db_error');
          details.push({ row: i + 2, status: 'error', message: e?.message || 'Erreur DB', data: row });
        }
      }

      // Refresh invoice line group assignments
      try {
        await supabase.rpc('rfa_assign_invoice_lines_groups', { p_company_id: params.companyId });
      } catch (_error) {
        // Not fatal, but useful
        warning_rows++;
        inc(error_summary, 'assign_groups_failed');
      }

      return {
        details,
        counters: { success_rows, error_rows, warning_rows, skipped_rows, error_summary },
        createdIds
      };
    }

    if (params.importType === 'turnover_data') {
      // Map group codes -> id
      const { data: groups, error: groupsError } = await supabase
        .from('rfa_product_groups')
        .select('id, code')
        .eq('company_id', params.companyId);

      if (groupsError) throw groupsError;

      const codeToId = new Map<string, string>();
      (groups || []).forEach((g: any) => {
        if (g.code) codeToId.set(String(g.code).trim(), String(g.id));
      });

      for (let i = 0; i < params.rows.length; i++) {
        const row = params.rows[i];
        const third_party_id = (row['third_party_id'] || '').trim() || null;
        const period_start = toDate(row['period_start'] || '');
        const period_end = toDate(row['period_end'] || '');
        const amount_excl_tax = toNumber(row['amount_excl_tax'] || '') ?? 0;
        const amount_incl_tax = toNumber(row['amount_incl_tax'] || '') ?? 0;
        const groupCode = (row['product_group_code'] || '').trim();
        const rfa_product_group_id = groupCode ? (codeToId.get(groupCode) || null) : null;

        if (!period_start || !period_end) {
          error_rows++;
          inc(error_summary, 'invalid_period');
          details.push({ row: i + 2, status: 'error', message: 'period_start / period_end invalides', data: row });
          continue;
        }

        if (groupCode && !rfa_product_group_id) {
          error_rows++;
          inc(error_summary, 'unknown_group_code');
          details.push({ row: i + 2, status: 'error', message: `Groupe introuvable: ${groupCode}`, data: row });
          continue;
        }

        try {
          const { data, error } = await supabase
            .from('rfa_turnover_entries')
            .upsert({
              company_id: params.companyId,
              third_party_id,
              rfa_product_group_id,
              period_start,
              period_end,
              amount_excl_tax,
              amount_incl_tax,
              source_import_id: params.importId
            }, { onConflict: 'company_id,third_party_id,rfa_product_group_id,period_start,period_end' })
            .select('id')
            .single();

          if (error) throw error;
          if (data?.id) createdIds.push(String(data.id));

          success_rows++;
          details.push({ row: i + 2, status: 'success' });
        } catch (e: any) {
          error_rows++;
          inc(error_summary, 'db_error');
          details.push({ row: i + 2, status: 'error', message: e?.message || 'Erreur DB', data: row });
        }
      }

      return {
        details,
        counters: { success_rows, error_rows, warning_rows, skipped_rows, error_summary },
        createdIds
      };
    }

    // contracts not implemented (yet)
    for (let i = 0; i < params.rows.length; i++) {
      skipped_rows++;
      details.push({ row: i + 2, status: 'skipped', message: 'Import contracts non supporté dans cette version', data: params.rows[i] });
    }

    inc(error_summary, 'contracts_not_supported');
    return {
      details,
      counters: { success_rows, error_rows, warning_rows, skipped_rows, error_summary },
      createdIds
    };
  }
};
