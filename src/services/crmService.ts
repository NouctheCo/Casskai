/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */
import { supabase } from '@/lib/supabase';
import {
  Client,
  Contact,
  Opportunity,
  CommercialAction,
  CrmStats,
  PipelineStats,
  RevenueData,
  ClientFormData,
  ContactFormData,
  OpportunityFormData,
  CommercialActionFormData,
  CrmFilters,
  CrmServiceResponse,
  CrmDashboardData
} from '../types/crm.types';
import { auditService } from './auditService';
import { logger } from '@/lib/logger';
import { acceptedAccountingService } from './acceptedAccountingService';

const normalizeStageKey = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '_')
    .trim();

// Mapping explicit des noms français vers clés anglaises standards
const STAGE_NAME_TO_KEY: Record<string, string> = {
  'prospection': 'prospecting',
  'qualification': 'qualification',
  'proposition': 'proposal',
  'négociation': 'negotiation',
  'negociation': 'negotiation',
  'fermeture': 'closing',
  'cloture': 'closing',
  'clôture': 'closing',
  'gagné': 'won',
  'gagne': 'won',
  'perdu': 'lost'
};

const mapStageNameToKey = (stageName: string): string => {
  const normalized = normalizeStageKey(stageName);
  return STAGE_NAME_TO_KEY[normalized] || normalized;
};

/**
 * Calcule le CA par client depuis les ÉCRITURES COMPTABLES (SOURCE DE VÉRITÉ)
 * Cherche les écritures sur les comptes 70x (revenue accounts)
 * Agrégé par third_party_id qui est désormais stocké dans journal_entry_lines
 */
async function calculateClientRevenuesFromAccounting(
  companyId: string,
  clientIds: string[]
): Promise<Record<string, number>> {
  const revenueMap: Record<string, number> = {};

  if (clientIds.length === 0) {
    logger.info('Crm', '[Accounting] No clients provided');
    return revenueMap;
  }

  try {
    logger.info('Crm', `[Accounting] ⚙️ STARTING: Calculating CA from journal entries`, {
      clientCount: clientIds.length,
      clientIdSample: clientIds.slice(0, 2)
    });

    // 1. Récupérer les écritures sur les comptes 70x pour ces clients
    logger.info('Crm', '[Accounting] 📊 Querying journal_entry_lines with third_party_id...');
    const { data: revenueLines, error } = await supabase
      .from('journal_entry_lines')
      .select('third_party_id, credit_amount, account_id')
      .eq('company_id', companyId)
      .in('third_party_id', clientIds);

    if (error) {
      logger.error('Crm', `[Accounting] ❌ SUPABASE ERROR: ${error.message}`, {
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return revenueMap;
    }

    logger.info('Crm', `[Accounting] ✅ Query successful`, {
      linesFound: revenueLines?.length || 0
    });

    if (!revenueLines || revenueLines.length === 0) {
      logger.warn('Crm', '[Accounting] ⚠️ No revenue entries found - checking if column exists...');
      
      // Diagnostic 1: Get database statistics about third_party_id
      const { count: totalLinesCount } = await supabase
        .from('journal_entry_lines')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      const { count: linesWithThirdPartyCount } = await supabase
        .from('journal_entry_lines')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .not('third_party_id', 'is', null);

      // Diagnostic 2: Get sample records to see their structure
      const { data: allLines, error: diagError } = await supabase
        .from('journal_entry_lines')
        .select('id, third_party_id, credit_amount, description')
        .eq('company_id', companyId)
        .limit(3);

      // Diagnostic 3: Try to get ANY line with a third_party_id
      const { data: linesWithThirdParty } = await supabase
        .from('journal_entry_lines')
        .select('id, third_party_id')
        .eq('company_id', companyId)
        .not('third_party_id', 'is', null)
        .limit(3);

      // Diagnostic 4: Check the client IDs we're looking for
      const { data: clientsData } = await supabase
        .from('third_parties')
        .select('id, name')
        .eq('company_id', companyId)
        .in('id', clientIds)
        .limit(5);

      logger.info('Crm', '[Accounting] 🔍 DIAGNOSTIC - Database state:', {
        totalLines: totalLinesCount,
        linesWithThirdParty: linesWithThirdPartyCount,
        linesWithoutThirdParty: (totalLinesCount || 0) - (linesWithThirdPartyCount || 0),
        queriedClientIds: clientIds.length,
        foundClientsInDB: clientsData?.length || 0,
        clientsInDB: clientsData?.map(c => ({ id: c.id, name: c.name })) || [],
        exampleLinesWithThirdParty: linesWithThirdParty?.map(l => ({
          id: l.id,
          third_party_id: l.third_party_id
        })) || [],
        exampleLines: allLines?.map(l => ({
          id: l.id,
          third_party_id: l.third_party_id,
          credit_amount: l.credit_amount,
          description: l.description
        })) || [],
        error: diagError?.message || 'none'
      });
      
      return revenueMap;
    }

    // 2. Filtrer pour ne garder que les comptes 70x
    const accountIds = Array.from(new Set(revenueLines.map(line => line.account_id)));
    const { data: accounts } = await supabase
      .from('chart_of_accounts')
      .select('id, account_number')
      .in('id', accountIds);

    const accountNumberByIdMap = new Map<string, string>();
    (accounts || []).forEach(acc => {
      accountNumberByIdMap.set(acc.id, acc.account_number);
    });

    // 3. Agréger par client - seulement les comptes 70x
    let linesWith70 = 0;
    revenueLines.forEach(line => {
      const accountNumber = accountNumberByIdMap.get(line.account_id) || '';
      if (accountNumber.startsWith('70')) {
        linesWith70++;
        if (line.third_party_id && line.credit_amount) {
          const amount = Number(line.credit_amount);
          revenueMap[line.third_party_id] = (revenueMap[line.third_party_id] || 0) + amount;
        }
      }
    });

    logger.info('Crm', '[Accounting] ✅ COMPLETED Revenue calculation', {
      totalLinesProcessed: revenueLines.length,
      linesOn70Accounts: linesWith70,
      clientsWithRevenue: Object.keys(revenueMap).length,
      totalRevenue: Object.values(revenueMap).reduce((sum, val) => sum + val, 0),
      breakdown: Object.entries(revenueMap)
        .slice(0, 3)
        .map(([clientId, revenue]) => ({ clientId, revenue }))
    });

    return revenueMap;
  } catch (error) {
    logger.error('Crm', '❌ EXCEPTION in calculateClientRevenuesFromAccounting:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return revenueMap;
  }
}

/**
 * Calcule le CA par client depuis les écritures comptables
 * Retourne un Record<clientId, revenue>
 * COMPLEXE : nécessite que customer_account_id soit renseigné
 */
/**
 * Fallback pour invoices (source secondaire si aucun CA en comptabilité)
 */
async function calculateClientRevenuesFromInvoices(
  companyId: string,
  clientIds: string[]
): Promise<Record<string, number>> {
  const revenueMap: Record<string, number> = {};

  if (clientIds.length === 0) {
    return revenueMap;
  }

  try {
    logger.info('Crm', `[Invoices] 📋 Querying invoices as fallback (${clientIds.length} clients)`);

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('third_party_id, total_incl_tax')
      .eq('company_id', companyId)
      .in('third_party_id', clientIds)
      .eq('invoice_type', 'sale')
      .in('status', ['sent', 'viewed', 'paid', 'partial', 'overdue']);

    if (error) {
      logger.error('Crm', `[Invoices] ❌ SUPABASE ERROR: ${error.message}`, error);
      return revenueMap;
    }

    if (!invoices || invoices.length === 0) {
      logger.info('Crm', '[Invoices] No invoices found (OK, fallback)');
      return revenueMap;
    }

    invoices.forEach(invoice => {
      if (invoice.third_party_id) {
        const amount = Number(invoice.total_incl_tax || 0);
        revenueMap[invoice.third_party_id] = (revenueMap[invoice.third_party_id] || 0) + amount;
      }
    });

    logger.info('Crm', '[Invoices] ✅ Calculated from invoices (fallback)', {
      invoiceCount: invoices.length,
      clientsWithRevenue: Object.keys(revenueMap).length,
      totalRevenue: Object.values(revenueMap).reduce((sum, val) => sum + val, 0)
    });

    return revenueMap;
  } catch (error) {
    logger.error('Crm', '❌ Exception in calculateClientRevenuesFromInvoices:', error instanceof Error ? error.message : String(error));
    return revenueMap;
  }
}

class CrmService {
  // Helper functions
  private normalizeUuid(value?: string | null): string | null {
    if (value === undefined || value === null) return null;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }

  private normalizeDate(value?: string | null): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }

  private async getDefaultPipelineId(companyId: string): Promise<string | null> {
    try {
      // Chercher un pipeline marqué comme défaut
      const { data: defaultPipeline } = await supabase
        .from('crm_pipelines')
        .select('id')
        .eq('company_id', companyId)
        .eq('is_default', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (defaultPipeline?.id) return defaultPipeline.id;

      // Chercher le premier pipeline existant
      const { data: firstPipeline } = await supabase
        .from('crm_pipelines')
        .select('id')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (firstPipeline?.id) return firstPipeline.id;

      // Créer un pipeline par défaut s'il n'en existe aucun
      return await this.createDefaultPipeline(companyId);
    } catch (error) {
      logger.error('Crm', 'Error getting default pipeline:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  private async createDefaultPipeline(companyId: string): Promise<string | null> {
    try {
      const pipelineId = crypto.randomUUID();
      
      // Créer le pipeline par défaut
      const { error: pipelineError } = await supabase
        .from('crm_pipelines')
        .insert({
          id: pipelineId,
          company_id: companyId,
          name: 'Pipeline Standard',
          description: 'Pipeline par défaut pour les opportunités commerciales',
          is_default: true,
          is_active: true
        });

      if (pipelineError) {
        logger.warn('Crm', 'Table crm_pipelines not available or error creating pipeline:', pipelineError.message);
        // Si la table n'existe pas, on retourne null et on laissera l'erreur remonter à createOpportunity
        return null;
      }

      // Créer les stages par défaut pour ce pipeline (seulement si la table existe)
      const stages = [
        { name: 'Prospection', key: 'prospecting', order: 1, probability: 5 },
        { name: 'Qualification', key: 'qualification', order: 2, probability: 15 },
        { name: 'Proposition', key: 'proposal', order: 3, probability: 40 },
        { name: 'Négociation', key: 'negotiation', order: 4, probability: 70 },
        { name: 'Fermeture', key: 'closing', order: 5, probability: 90 },
        { name: 'Gagné', key: 'won', order: 6, probability: 100 },
        { name: 'Perdu', key: 'lost', order: 7, probability: 0 }
      ];

      for (const stage of stages) {
        const { error: stageError } = await supabase.from('crm_stages').insert({
          id: crypto.randomUUID(),
          company_id: companyId,
          pipeline_id: pipelineId,
          name: stage.name,
          stage_order: stage.order,
          default_probability: stage.probability,
          is_closed_won: stage.key === 'won',
          is_closed_lost: stage.key === 'lost',
          color: '#6366F1'
        });

        if (stageError) {
          logger.warn('Crm', 'Error creating stage:', stageError.message);
        }
      }

      logger.info('Crm', 'Default pipeline created successfully:', pipelineId);
      return pipelineId;
    } catch (error) {
      logger.error('Crm', 'Error creating default pipeline:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  private async getStageIdForPipeline(
    companyId: string,
    pipelineId: string,
    stageKey?: string
  ): Promise<{ id: string | null; isWon: boolean; isLost: boolean }> {
    const { data: stages } = await supabase
      .from('crm_stages')
      .select('id, name, is_closed_won, is_closed_lost, stage_order')
      .eq('company_id', companyId)
      .eq('pipeline_id', pipelineId)
      .order('stage_order', { ascending: true });

    if (!stages || stages.length === 0) {
      return { id: null, isWon: false, isLost: false };
    }

    const key = stageKey ? stageKey.toLowerCase() : '';
    let match = stages[0];

    if (key) {
      if (key === 'won') {
        match = stages.find(s => s.is_closed_won) || match;
      } else if (key === 'lost') {
        match = stages.find(s => s.is_closed_lost) || match;
      } else {
        match = stages.find(s => mapStageNameToKey(s.name) === key) || match;
      }
    }

    return {
      id: match?.id || null,
      isWon: !!match?.is_closed_won,
      isLost: !!match?.is_closed_lost
    };
  }

  // Clients - Utilise la table third_parties unifiée (Phase 2)
  async getClients(enterpriseId: string, filters?: CrmFilters): Promise<CrmServiceResponse<Client[]>> {
    try {
      let query = supabase
        .from('third_parties')
        .select('*')
        .eq('company_id', enterpriseId)
        .eq('is_active', true)
        .or('type.eq.customer,client_type.eq.customer,client_type.eq.prospect,client_type.eq.partner')
        .order('created_at', { ascending: false });
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      const rawClients = data || [];
      
      logger.info('Crm', `Loaded raw clients from DB`, {
        count: rawClients.length,
        sampleClients: rawClients.slice(0, 3).map(c => ({
          id: c.id,
          name: c.name,
          customer_account_id: c.customer_account_id,
          type: c.type || c.client_type
        }))
      });

      if (rawClients.length === 0) {
        return { success: true, data: [] };
      }

      // ✅ Batch queries pour éviter le pattern N+1
      const clientIds = rawClients.map(c => c.id);

      logger.info('Crm', `Processing ${rawClients.length} clients`, {
        totalClients: rawClients.length
      });

      // 1. PRIORITÉ 1 : Comptabilité (écritures on comptes 70x) - SOURCE DE VÉRITÉ
      logger.info('Crm', '[getClients] 📞 Calling calculateClientRevenuesFromAccounting...', {
        companyId: enterpriseId,
        clientCount: clientIds.length
      });
      const revenueFromAccounting = await calculateClientRevenuesFromAccounting(enterpriseId, clientIds);

      // 2. PRIORITÉ 2 : Factures (fallback si rien en comptabilité)
      logger.info('Crm', '[getClients] 📞 Calling calculateClientRevenuesFromInvoices...', {
        companyId: enterpriseId,
        clientCount: clientIds.length
      });
      const revenueFromInvoices = await calculateClientRevenuesFromInvoices(enterpriseId, clientIds);
      
      logger.info('Crm', `🎯 Revenue calculation results`, {
        fromAccounting: {
          clientsWithRevenue: Object.keys(revenueFromAccounting).length,
          totalRevenue: Object.values(revenueFromAccounting).reduce((sum, val) => sum + val, 0)
        },
        fromInvoices: {
          clientsWithRevenue: Object.keys(revenueFromInvoices).length,
          totalRevenue: Object.values(revenueFromInvoices).reduce((sum, val) => sum + val, 0)
        }
      });

      // 3. Batch : récupérer les opportunités gagnées (priorité 3 - fallback final)
      const wonRevenueMap: Record<string, number> = {};
      const { data: wonOpps } = await supabase
        .from('crm_opportunities')
        .select('client_id, value, crm_stages!inner(is_closed_won)')
        .in('client_id', clientIds)
        .eq('crm_stages.is_closed_won', true);
      (wonOpps || []).forEach(opp => {
        if (opp.client_id) {
          wonRevenueMap[opp.client_id] = (wonRevenueMap[opp.client_id] || 0) + (opp.value || 0);
        }
      });

      logger.info('Crm', `Calculated revenues from won opportunities`, {
        clientsWithRevenue: Object.keys(wonRevenueMap).length,
        totalRevenue: Object.values(wonRevenueMap).reduce((sum, val) => sum + val, 0)
      });

      // 4. Batch : compter les contacts par client
      const contactCountMap: Record<string, number> = {};
      const { data: contactCounts } = await supabase
        .from('crm_contacts')
        .select('client_id')
        .in('client_id', clientIds);
      (contactCounts || []).forEach(c => {
        if (c.client_id) {
          contactCountMap[c.client_id] = (contactCountMap[c.client_id] || 0) + 1;
        }
      });

      // 4. Batch : dernière action par client (récupérer toutes les actions récentes)
      const lastActionMap: Record<string, string | null> = {};
      const { data: recentActions } = await supabase
        .from('crm_actions')
        .select('client_id, completed_date, due_date, created_at')
        .in('client_id', clientIds)
        .order('created_at', { ascending: false });
      (recentActions || []).forEach(action => {
        if (action.client_id && !lastActionMap[action.client_id]) {
          lastActionMap[action.client_id] = action.completed_date || action.due_date || null;
        }
      });

      // Mapper les résultats
      logger.info('Crm', `[getClients] 🔄 MAPPING ${rawClients.length} clients with revenue data`, {
        accountingClientsWithRevenue: Object.keys(revenueFromAccounting).length,
        invoicesClientsWithRevenue: Object.keys(revenueFromInvoices).length
      });

      const clients = rawClients.map((client) => {
        // PRIORITÉ : Comptabilité (70x) > Factures > Opportunités gagnées > 0
        // La comptabilité est la SOURCE DE VÉRITÉ
        let total_revenue = 0;
        let revenue_source = 'none';
        
        if (revenueFromAccounting[client.id] !== undefined && revenueFromAccounting[client.id] > 0) {
          total_revenue = revenueFromAccounting[client.id];
          revenue_source = 'accounting';
        } else if (revenueFromInvoices[client.id] !== undefined && revenueFromInvoices[client.id] > 0) {
          total_revenue = revenueFromInvoices[client.id];
          revenue_source = 'invoices';
        } else if (wonRevenueMap[client.id] !== undefined && wonRevenueMap[client.id] > 0) {
          total_revenue = wonRevenueMap[client.id];
          revenue_source = 'opportunities';
        }

        // Log pour chaque client
        if (total_revenue > 0) {
          logger.debug('Crm', `[Mapping] Client ${client.name} (${client.id}):`, {
            total_revenue,
            revenue_source,
            fromAccounting: revenueFromAccounting[client.id] || 0,
            fromInvoices: revenueFromInvoices[client.id] || 0,
            fromOpportunities: wonRevenueMap[client.id] || 0
          });
        }

        logger.debug('Crm', `Client ${client.name} (${client.id}):`, {
          total_revenue,
          revenue_source,
          fromInvoices: revenueFromInvoices[client.id] || 0,
          fromAccounting: revenueFromAccounting[client.id] || 0,
          fromOpportunities: wonRevenueMap[client.id] || 0
        });

        return {
          id: client.id,
          enterprise_id: enterpriseId,
          company_name: client.name,
          industry: client.internal_notes ?? null,
          size: null as string | null,
          address: client.billing_address_line1 || client.address_line1 || null,
          city: client.billing_city || client.city || null,
          postal_code: client.billing_postal_code || client.postal_code || null,
          country: client.billing_country || client.country || null,
          website: client.website ?? null,
          notes: client.notes ?? null,
          status: client.client_type === 'customer' ? 'active' : 'prospect',
          total_revenue,
          contact_count: contactCountMap[client.id] || 0,
          last_interaction: lastActionMap[client.id] ?? null,
          created_at: client.created_at,
          updated_at: client.updated_at
        };
      }) as Client[];

      // Log final du résultat
      const clientsWithRevenue = clients.filter(c => (c.total_revenue ?? 0) > 0);
      logger.info('Crm', `Final revenue summary`, {
        totalClients: clients.length,
        clientsWithRevenue: clientsWithRevenue.length,
        clientsWithoutRevenue: clients.length - clientsWithRevenue.length,
        totalRevenue: clients.reduce((sum, c) => sum + (c.total_revenue ?? 0), 0)
      });

      // Appliquer les filtres
      let filteredClients = clients;
      if (filters) {
        if (filters.status && filters.status !== 'all') {
          filteredClients = filteredClients.filter(client => client.status === filters.status);
        }
        if (filters.industry && filters.industry !== 'all') {
          filteredClients = filteredClients.filter(client => client.industry === filters.industry);
        }
        if (filters.size && filters.size !== 'all') {
          filteredClients = filteredClients.filter(client => client.size === filters.size);
        }
      }
      return { success: true, data: filteredClients };
    } catch (error) {
      logger.error('Crm', 'Error fetching CRM clients:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: [],
        error: { message: 'Erreur lors de la récupération des clients' }
      };
    }
  }
  async createClient(enterpriseId: string, formData: ClientFormData): Promise<CrmServiceResponse<Client>> {
    try {
      // Générer un code unique pour le client
      const code = `CL-${Date.now().toString(36).toUpperCase()}`;

      // Créer dans la table third_parties unifiée
      const { data, error } = await supabase
        .from('third_parties')
        .insert({
          company_id: enterpriseId,
          type: 'customer',
          client_type: formData.status === 'active' ? 'customer' : 'prospect',
          code,
          customer_number: code,
          name: formData.company_name,
          company_name: formData.company_name,
          internal_notes: formData.industry, // industry stocké dans internal_notes
          billing_address_line1: formData.address,
          billing_city: formData.city,
          billing_postal_code: formData.postal_code,
          billing_country: formData.country || 'FR',
          website: formData.website,
          notes: formData.notes,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      // Transform back to Client format
      const newClient: Client = {
        id: data.id,
        enterprise_id: enterpriseId,
        company_name: data.name,
        industry: data.internal_notes ?? null,
        size: formData.size ?? null,
        address: data.billing_address_line1 ?? null,
        city: data.billing_city ?? null,
        postal_code: data.billing_postal_code ?? null,
        country: data.billing_country ?? null,
        website: data.website ?? null,
        notes: data.notes ?? null,
        status: formData.status,
        total_revenue: 0,
        last_interaction: null,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      // ✅ Audit Log: CREATE client (HIGH - données personnelles)
      auditService.log({
        event_type: 'CREATE',
        table_name: 'third_parties',
        record_id: data.id,
        company_id: enterpriseId,
        new_values: {
          name: data.name,
          client_type: data.client_type,
          industry: data.industry
        },
        security_level: 'high', // Données clients = sensible
        compliance_tags: ['RGPD']
      }).catch(err => logger.error('Crm', 'Audit log failed:', err));
      return { success: true, data: newClient };
    } catch (error) {
      logger.error('Crm', 'Error creating CRM client:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: {} as Client,
        error: { message: 'Erreur lors de la création du client' }
      };
    }
  }
  async updateClient(clientId: string, formData: ClientFormData): Promise<CrmServiceResponse<Client>> {
    try {
      // ✅ Récupérer les anciennes valeurs pour l'audit
      const { data: oldData } = await supabase
        .from('third_parties')
        .select('*')
        .eq('id', clientId)
        .single();
      const { data, error } = await supabase
        .from('third_parties')
        .update({
          name: formData.company_name,
          company_name: formData.company_name,
          internal_notes: formData.industry, // industry stocké dans internal_notes
          billing_address_line1: formData.address,
          billing_city: formData.city,
          billing_postal_code: formData.postal_code,
          billing_country: formData.country || 'FR',
          website: formData.website,
          notes: formData.notes,
          client_type: formData.status === 'active' ? 'customer' : 'prospect',
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
        .select()
        .single();
      if (error) throw error;
      // Transform back to Client format
      const updatedClient: Client = {
        id: data.id,
        enterprise_id: data.company_id,
        company_name: data.name,
        industry: data.internal_notes ?? null,
        size: formData.size ?? null,
        address: data.billing_address_line1 ?? null,
        city: data.billing_city ?? null,
        postal_code: data.billing_postal_code ?? null,
        country: data.billing_country ?? null,
        website: data.website ?? null,
        notes: data.notes ?? null,
        status: formData.status,
        total_revenue: 0,
        last_interaction: null,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      // ✅ Audit Log: UPDATE client (HIGH - données personnelles)
      if (oldData) {
        const changedFields: string[] = [];
        if (oldData.name !== data.name) changedFields.push('name');
        if (oldData.industry !== data.industry) changedFields.push('industry');
        if (oldData.client_type !== data.client_type) changedFields.push('client_type');
        auditService.log({
          event_type: 'UPDATE',
          table_name: 'third_parties',
          record_id: clientId,
          company_id: data.company_id,
          old_values: {
            name: oldData.name,
            client_type: oldData.client_type,
            industry: oldData.industry
          },
          new_values: {
            name: data.name,
            client_type: data.client_type,
            industry: data.industry
          },
          changed_fields: changedFields,
          security_level: 'high',
          compliance_tags: ['RGPD']
        }).catch(err => logger.error('Crm', 'Audit log failed:', err));
      }
      return { success: true, data: updatedClient };
    } catch (error) {
      logger.error('Crm', 'Error updating CRM client:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: {} as Client,
        error: { message: 'Erreur lors de la mise à jour du client' }
      };
    }
  }
  async deleteClient(clientId: string): Promise<CrmServiceResponse<boolean>> {
    try {
      // ✅ Récupérer les données avant suppression pour l'audit
      const { data: clientToDelete } = await supabase
        .from('third_parties')
        .select('*')
        .eq('id', clientId)
        .single();

      // Soft delete - marquer comme inactif au lieu de supprimer physiquement
      const { error } = await supabase
        .from('third_parties')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', clientId);
      if (error) throw error;

      // ✅ Audit Log: SOFT DELETE client (HIGH - désactivation données personnelles)
      if (clientToDelete) {
        auditService.log({
          event_type: 'UPDATE',
          table_name: 'third_parties',
          record_id: clientId,
          company_id: clientToDelete.company_id,
          old_values: {
            name: clientToDelete.name,
            client_type: clientToDelete.client_type,
            is_active: true
          },
          new_values: {
            is_active: false
          },
          changed_fields: ['is_active'],
          security_level: 'high',
          compliance_tags: ['RGPD']
        }).catch(err => logger.error('Crm', 'Audit log failed:', err));
      }
      return { success: true, data: true };
    } catch (error) {
      logger.error('Crm', 'Error deleting CRM client:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: false,
        error: { message: 'Erreur lors de la suppression du client' }
      };
    }
  }
  async createSupplier(enterpriseId: string, formData: ClientFormData): Promise<CrmServiceResponse<Client>> {
    try {
      // Générer un code unique pour le fournisseur
      const code = `FO-${Date.now().toString(36).toUpperCase()}`;

      // Créer dans la table third_parties unifiée avec type = supplier
      const { data, error } = await supabase
        .from('third_parties')
        .insert({
          company_id: enterpriseId,
          type: 'supplier',
          client_type: 'supplier',
          code,
          supplier_number: code,
          name: formData.company_name,
          company_name: formData.company_name,
          internal_notes: formData.industry, // industry stocké dans internal_notes
          billing_address_line1: formData.address,
          billing_city: formData.city,
          billing_postal_code: formData.postal_code,
          billing_country: formData.country || 'FR',
          website: formData.website,
          notes: formData.notes,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      // Transform back to Client format (suppliers use same structure)
      const newSupplier: Client = {
        id: data.id,
        enterprise_id: enterpriseId,
        company_name: data.name,
        industry: data.internal_notes ?? null,
        size: formData.size ?? null,
        address: data.billing_address_line1 ?? null,
        city: data.billing_city ?? null,
        postal_code: data.billing_postal_code ?? null,
        country: data.billing_country ?? null,
        website: data.website ?? null,
        notes: data.notes ?? null,
        status: formData.status || 'active',
        total_revenue: 0,
        last_interaction: null,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      return { success: true, data: newSupplier };
    } catch (error) {
      logger.error('Crm', 'Error creating supplier:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: {} as Client,
        error: { message: 'Erreur lors de la création du fournisseur' }
      };
    }
  }
  // Contacts - Utilise maintenant la table crm_contacts
  async getContacts(companyId?: string, clientId?: string): Promise<CrmServiceResponse<Contact[]>> {
    try {
      let query = supabase
        .from('crm_contacts')
        .select('*')
        .order('created_at', { ascending: false });
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      logger.error('Crm', 'Error fetching CRM contacts:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: [],
        error: { message: 'Erreur lors de la récupération des contacts' }
      };
    }
  }
  async createContact(companyId: string, formData: ContactFormData): Promise<CrmServiceResponse<Contact>> {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .insert({
          company_id: companyId,
          client_id: formData.client_id && formData.client_id.trim() !== '' ? formData.client_id : null,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email || null,
          phone: formData.phone || null,
          position: formData.position || null,
          notes: formData.notes || null,
          is_primary: formData.is_primary || false
        })
        .select()
        .single();
      if (error) throw error;
      // ✅ Audit Log: CREATE contact (HIGH - données personnelles)
      auditService.log({
        event_type: 'CREATE',
        table_name: 'crm_contacts',
        record_id: data.id,
        company_id: companyId,
        new_values: {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          position: data.position
        },
        security_level: 'high',
        compliance_tags: ['RGPD']
      }).catch(err => logger.error('Crm', 'Audit log failed:', err));
      return { success: true, data };
    } catch (error) {
      logger.error('Crm', 'Error creating CRM contact:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: {} as Contact,
        error: { message: 'Erreur lors de la création du contact' }
      };
    }
  }
  async updateContact(contactId: string, formData: Partial<ContactFormData>): Promise<CrmServiceResponse<Contact>> {
    try {
      // ✅ Récupérer les anciennes valeurs pour l'audit
      const { data: oldData } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      // Sanitize formData: convert empty strings to null for optional fields
      const sanitizedData: Record<string, unknown> = {};
      if (formData.first_name !== undefined) sanitizedData.first_name = formData.first_name;
      if (formData.last_name !== undefined) sanitizedData.last_name = formData.last_name;
      if (formData.email !== undefined) sanitizedData.email = formData.email || null;
      if (formData.phone !== undefined) sanitizedData.phone = formData.phone || null;
      if (formData.position !== undefined) sanitizedData.position = formData.position || null;
      if (formData.notes !== undefined) sanitizedData.notes = formData.notes || null;
      if (formData.client_id !== undefined) sanitizedData.client_id = formData.client_id && formData.client_id.trim() !== '' ? formData.client_id : null;
      if (formData.is_primary !== undefined) sanitizedData.is_primary = formData.is_primary;

      const { data, error } = await supabase
        .from('crm_contacts')
        .update(sanitizedData)
        .eq('id', contactId)
        .select()
        .single();
      if (error) throw error;
      // ✅ Audit Log: UPDATE contact (HIGH - données personnelles)
      if (oldData) {
        auditService.log({
          event_type: 'UPDATE',
          table_name: 'crm_contacts',
          record_id: contactId,
          company_id: data.company_id,
          old_values: {
            first_name: oldData.first_name,
            last_name: oldData.last_name,
            email: oldData.email
          },
          new_values: {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email
          },
          changed_fields: Object.keys(formData),
          security_level: 'high',
          compliance_tags: ['RGPD']
        }).catch(err => logger.error('Crm', 'Audit log failed:', err));
      }
      return { success: true, data };
    } catch (error) {
      logger.error('Crm', 'Error updating CRM contact:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: {} as Contact,
        error: { message: 'Erreur lors de la mise à jour du contact' }
      };
    }
  }
  async deleteContact(contactId: string): Promise<CrmServiceResponse<boolean>> {
    try {
      // ✅ Récupérer les données avant suppression pour l'audit
      const { data: contactToDelete } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('id', contactId)
        .single();
      const { error } = await supabase
        .from('crm_contacts')
        .delete()
        .eq('id', contactId);
      if (error) throw error;
      // ✅ Audit Log: DELETE contact (CRITICAL)
      if (contactToDelete) {
        auditService.log({
          event_type: 'DELETE',
          table_name: 'crm_contacts',
          record_id: contactId,
          company_id: contactToDelete.company_id,
          old_values: {
            first_name: contactToDelete.first_name,
            last_name: contactToDelete.last_name,
            email: contactToDelete.email
          },
          security_level: 'critical',
          compliance_tags: ['RGPD']
        }).catch(err => logger.error('Crm', 'Audit log failed:', err));
      }
      return { success: true, data: true };
    } catch (error) {
      logger.error('Crm', 'Error deleting CRM contact:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: false,
        error: { message: 'Erreur lors de la suppression du contact' }
      };
    }
  }
  // Opportunities - Utilise maintenant la table crm_opportunities
  async getOpportunities(enterpriseId: string, filters?: CrmFilters): Promise<CrmServiceResponse<Opportunity[]>> {
    try {
      let query = supabase
        .from('crm_opportunities')
        .select('*, crm_stages(name, is_closed_won, is_closed_lost)')
        .eq('company_id', enterpriseId)
        .order('created_at', { ascending: false });
      if (filters) {
        if (filters.search) {
          query = query.ilike('title', `%${filters.search}%`);
        }
        if (filters.stage && filters.stage !== 'all') {
          const stageKey = filters.stage.toLowerCase();
          const { data: stageRows } = await supabase
            .from('crm_stages')
            .select('id, name, is_closed_won, is_closed_lost')
            .eq('company_id', enterpriseId);

          const stageIds = (stageRows || [])
            .filter((s) => {
              if (stageKey === 'won') return s.is_closed_won;
              if (stageKey === 'lost') return s.is_closed_lost;
              return mapStageNameToKey(s.name) === stageKey;
            })
            .map((s) => s.id);

          if (stageIds.length) {
            query = query.in('stage_id', stageIds);
          } else {
            query = query.eq('stage_id', '00000000-0000-0000-0000-000000000000');
          }
        }
        if (filters.priority && filters.priority !== 'all') {
          query = query.eq('priority', filters.priority);
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      const mapped = (data || []).map((row: any) => {
        const stageInfo = row.crm_stages;
        const stageName = typeof stageInfo?.name === 'string' ? stageInfo.name : '';
        let stageKey = stageName ? mapStageNameToKey(stageName) : '';
        if (stageInfo?.is_closed_won) stageKey = 'won';
        if (stageInfo?.is_closed_lost) stageKey = 'lost';
        return {
          ...row,
          stage: stageKey || row.stage || 'prospecting',
          assigned_to: row.owner_id ?? null
        } as Opportunity;
      });
      return { success: true, data: mapped };
    } catch (error) {
      logger.error('Crm', 'Error fetching CRM opportunities:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: [],
        error: { message: 'Erreur lors de la récupération des opportunités' }
      };
    }
  }
  async createOpportunity(companyId: string, formData: OpportunityFormData): Promise<CrmServiceResponse<Opportunity>> {
    try {
      // Récupérer les noms pour dénormalisation
      let client_name: string | null = null;
      let contact_name: string | null = null;
      let resolvedClientId: string | null = formData.client_id ?? null;
      if (formData.client_id) {
        const { data: client } = await supabase
          .from('third_parties')
          .select('name')
          .eq('id', formData.client_id)
          .maybeSingle();
        client_name = client?.name ?? null;

        const { data: crmClient } = await supabase
          .from('crm_clients')
          .select('id')
          .eq('id', formData.client_id)
          .maybeSingle();
        if (!crmClient?.id) {
          resolvedClientId = null;
        }
      }
      if (formData.contact_id) {
        const { data: contact } = await supabase
          .from('crm_contacts')
          .select('first_name, last_name')
          .eq('id', formData.contact_id)
          .maybeSingle();
        contact_name = contact ? `${contact.first_name} ${contact.last_name}` : null;
      }

      const pipelineId = await this.getDefaultPipelineId(companyId);
      
      // Note: pipeline_id et stage_id peuvent être NULL si les tables crm_pipelines/crm_stages n'existent pas encore
      // Dans ce cas, on crée quand même l'opportunité avec les colonnes stage (texte) à la place
      let stageId = null;
      let stageInfo: { id: string | null; isWon: boolean; isLost: boolean } = { id: null, isWon: false, isLost: false };
      
      if (pipelineId) {
        stageInfo = await this.getStageIdForPipeline(companyId, pipelineId, formData.stage);
        stageId = stageInfo.id;
      }

      const { error } = await supabase
        .from('crm_opportunities')
        .insert({
          company_id: companyId,
          pipeline_id: this.normalizeUuid(pipelineId || null),
          stage_id: this.normalizeUuid(stageId || null),
          stage: formData.stage,  // Utiliser la colonne stage directement
          client_id: this.normalizeUuid(resolvedClientId),
          client_name,
          contact_id: this.normalizeUuid(formData.contact_id),
          contact_name,
          title: formData.title,
          description: formData.description,
          value: formData.value,
          probability: formData.probability,
          expected_close_date: this.normalizeDate(formData.expected_close_date),
          source: formData.source,
          owner_id: this.normalizeUuid(formData.assigned_to),
          priority: formData.priority,
          tags: formData.tags,
          next_action: formData.next_action,
          next_action_date: this.normalizeDate(formData.next_action_date)
        });
      if (error) throw error;
      return { success: true, data: {} as Opportunity };
    } catch (error) {
      logger.error('Crm', 'Error creating CRM opportunity:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: {} as Opportunity,
        error: { message: 'Erreur lors de la création de l\'opportunité' }
      };
    }
  }
  async updateOpportunity(opportunityId: string, formData: Partial<OpportunityFormData>): Promise<CrmServiceResponse<Opportunity>> {
    try {
      // Mettre à jour les noms dénormalisés si nécessaire
      const updateData: any = { ...formData };
      if (formData.client_id) {
        const { data: client } = await supabase
          .from('third_parties')
          .select('name')
          .eq('id', formData.client_id)
          .maybeSingle();
        updateData.client_name = client?.name;

        const { data: crmClient } = await supabase
          .from('crm_clients')
          .select('id')
          .eq('id', formData.client_id)
          .maybeSingle();
        if (!crmClient?.id) {
          updateData.client_id = null;
        }
      }
      if (formData.contact_id) {
        const { data: contact } = await supabase
          .from('crm_contacts')
          .select('first_name, last_name')
          .eq('id', formData.contact_id)
          .maybeSingle();
        updateData.contact_name = contact ? `${contact.first_name} ${contact.last_name}` : null;
      }

      if (formData.assigned_to !== undefined) {
        updateData.owner_id = this.normalizeUuid(formData.assigned_to);
      }
      if ('assigned_to' in updateData) {
        delete updateData.assigned_to;
      }

      if (formData.expected_close_date !== undefined) {
        updateData.expected_close_date = this.normalizeDate(formData.expected_close_date);
      }
      if (formData.next_action_date !== undefined) {
        updateData.next_action_date = this.normalizeDate(formData.next_action_date);
      }

      if (formData.client_id !== undefined) {
        updateData.client_id = this.normalizeUuid(updateData.client_id);
      }
      if (formData.contact_id !== undefined) {
        updateData.contact_id = this.normalizeUuid(formData.contact_id);
      }

      if (formData.stage) {
        const normalizedStage = mapStageNameToKey(formData.stage);
        const { data: existing } = await supabase
          .from('crm_opportunities')
          .select('company_id, pipeline_id, actual_close_date, stage')
          .eq('id', opportunityId)
          .maybeSingle();

        if (existing?.company_id && existing?.pipeline_id) {
          const stageInfo = await this.getStageIdForPipeline(
            existing.company_id,
            existing.pipeline_id,
            formData.stage
          );
          if (stageInfo.id) {
            updateData.stage_id = stageInfo.id;
          }
          // Auto-remplir actual_close_date au MOMENT du changement vers won/lost/closing
          // (mise à jour TOUJOURS avec la date du jour du changement)
          const isClosedStage = stageInfo.isWon || stageInfo.isLost || normalizedStage === 'closing';
          const wasNotClosed = !['won', 'lost', 'closing'].includes(existing.stage || '');
          if (isClosedStage && wasNotClosed) {
            // Première fois qu'on passe en statut fermé: remplir avec date du jour
            updateData.actual_close_date = new Date().toISOString().split('T')[0];
          }
        } else if (normalizedStage === 'won' || normalizedStage === 'lost' || normalizedStage === 'closing') {
          const wasNotClosed = !['won', 'lost', 'closing'].includes(existing?.stage || '');
          if (wasNotClosed) {
            updateData.actual_close_date = new Date().toISOString().split('T')[0];
          }
        }
        // Garder le champ stage texte synchronisé (ne pas le supprimer)
        // updateData.stage contient déjà la valeur de formData.stage
      }

      const { data, error } = await supabase
        .from('crm_opportunities')
        .update(updateData)
        .eq('id', opportunityId)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data: { ...data, assigned_to: data?.owner_id ?? null } };
    } catch (error) {
      logger.error('Crm', 'Error updating CRM opportunity:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: {} as Opportunity,
        error: { message: 'Erreur lors de la mise à jour de l\'opportunité' }
      };
    }
  }
  async deleteOpportunity(opportunityId: string): Promise<CrmServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('crm_opportunities')
        .delete()
        .eq('id', opportunityId);
      if (error) throw error;
      return { success: true, data: true };
    } catch (error) {
      logger.error('Crm', 'Error deleting CRM opportunity:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: false,
        error: { message: 'Erreur lors de la suppression de l\'opportunité' }
      };
    }
  }
  // Commercial Actions - Utilise maintenant la table crm_actions
  async getCommercialActions(enterpriseId: string, filters?: CrmFilters): Promise<CrmServiceResponse<CommercialAction[]>> {
    try {
      let query = supabase
        .from('crm_actions')
        .select('*')
        .eq('company_id', enterpriseId)
        .order('created_at', { ascending: false });
      if (filters) {
        if (filters.search) {
          query = query.or(`title.ilike.%${filters.search}%,client_name.ilike.%${filters.search}%`);
        }
        if (filters.type && filters.type !== 'all') {
          query = query.eq('type', filters.type);
        }
        if (filters.priority && filters.priority !== 'all') {
          query = query.eq('priority', filters.priority);
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      logger.error('Crm', 'Error fetching commercial actions:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: [],
        error: { message: 'Erreur lors de la récupération des actions commerciales' }
      };
    }
  }
  async createCommercialAction(companyId: string, formData: CommercialActionFormData): Promise<CrmServiceResponse<CommercialAction>> {
    try {
      // Récupérer les noms pour dénormalisation
        let client_name: string | null = null;
        let contact_name: string | null = null;
        let opportunity_title: string | null = null;
      if (formData.client_id) {
        const { data: client } = await supabase
          .from('third_parties')
          .select('name')
          .eq('id', formData.client_id)
          .maybeSingle();
        client_name = client?.name ?? null;
      }
      if (formData.contact_id) {
        const { data: contact } = await supabase
          .from('crm_contacts')
          .select('first_name, last_name')
          .eq('id', formData.contact_id)
          .maybeSingle();
        contact_name = contact ? `${contact.first_name} ${contact.last_name}` : null;
      }
      if (formData.opportunity_id) {
        const { data: opportunity } = await supabase
          .from('crm_opportunities')
          .select('title')
          .eq('id', formData.opportunity_id)
          .maybeSingle();
        opportunity_title = opportunity?.title ?? null;
      }
      const { data, error } = await supabase
        .from('crm_actions')
        .insert({
          company_id: companyId,
          client_id: formData.client_id,
          client_name,
          contact_id: formData.contact_id,
          contact_name,
          opportunity_id: formData.opportunity_id,
          opportunity_title,
          type: formData.type,
          title: formData.title,
          description: formData.description,
          status: formData.status,
          due_date: formData.due_date,
          completed_date: formData.completed_date,
          assigned_to: formData.assigned_to,
          priority: formData.priority,
          outcome: formData.outcome,
          follow_up_required: formData.follow_up_required,
          follow_up_date: formData.follow_up_date,
          duration_minutes: formData.duration_minutes
        })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('Crm', 'Error creating commercial action:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: {} as CommercialAction,
        error: { message: 'Erreur lors de la création de l\'action commerciale' }
      };
    }
  }
  async updateCommercialAction(actionId: string, formData: Partial<CommercialActionFormData>): Promise<CrmServiceResponse<CommercialAction>> {
    try {
      // Mettre à jour les noms dénormalisés si nécessaire
      const updateData: any = { ...formData };
        if (formData.client_id) {
        const { data: client } = await supabase
          .from('third_parties')
          .select('name')
          .eq('id', formData.client_id)
          .single();
          updateData.client_name = client?.name ?? null;
      }
      if (formData.contact_id) {
        const { data: contact } = await supabase
          .from('crm_contacts')
          .select('first_name, last_name')
          .eq('id', formData.contact_id)
          .single();
          updateData.contact_name = contact ? `${contact.first_name} ${contact.last_name}` : null;
      }
      if (formData.opportunity_id) {
        const { data: opportunity } = await supabase
          .from('crm_opportunities')
          .select('title')
          .eq('id', formData.opportunity_id)
          .single();
          updateData.opportunity_title = opportunity?.title ?? null;
      }
      const { data, error } = await supabase
        .from('crm_actions')
        .update(updateData)
        .eq('id', actionId)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('Crm', 'Error updating commercial action:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: {} as CommercialAction,
        error: { message: 'Erreur lors de la mise à jour de l\'action commerciale' }
      };
    }
  }
  async deleteCommercialAction(actionId: string): Promise<CrmServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('crm_actions')
        .delete()
        .eq('id', actionId);
      if (error) throw error;
      return { success: true, data: true };
    } catch (error) {
      logger.error('Crm', 'Error deleting commercial action:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: false,
        error: { message: 'Erreur lors de la suppression de l\'action commerciale' }
      };
    }
  }
  // Statistics and Dashboard - Utilise maintenant toutes les vraies données
  async getCrmStats(enterpriseId: string): Promise<CrmServiceResponse<CrmStats>> {
    try {
      // Paralléliser les requêtes pour de meilleures performances
      const [clientsResponse, opportunitiesResponse, actionsResponse] = await Promise.all([
        this.getClients(enterpriseId),
        this.getOpportunities(enterpriseId),
        this.getCommercialActions(enterpriseId)
      ]);
      if (clientsResponse.error || opportunitiesResponse.error || actionsResponse.error) {
        throw new Error('Erreur lors de la récupération des données CRM');
      }
      const clients = clientsResponse.data ?? [];
      const opportunities = opportunitiesResponse.data ?? [];
      const actions = actionsResponse.data ?? [];
      const wonOpportunities = opportunities.filter(o => o.stage === 'won');
      const lostOpportunities = opportunities.filter(o => o.stage === 'lost');
      const closingOpportunities = opportunities.filter(o => o.stage === 'closing');
      const totalOpportunityValue = opportunities.reduce((sum, o) => sum + (o.value || 0), 0);
      const wonValue = wonOpportunities.reduce((sum, o) => sum + (o.value || 0), 0);

      // ✅ Revenu mensuel depuis la comptabilité (Source Unique de Vérité)
      const now = new Date();
      let currentMonthRevenue = 0;
      let revenue_growth = 0;

      try {
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        const { revenue: currentRevenue } = await acceptedAccountingService.calculateRevenueWithAudit(
          enterpriseId, currentMonthStart, currentMonthEnd, undefined,
          { vatTreatment: 'ttc', includeBreakdown: false, includeReconciliation: false }
        );
        currentMonthRevenue = currentRevenue;

        // Mois précédent pour la croissance
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

        const { revenue: lastRevenue } = await acceptedAccountingService.calculateRevenueWithAudit(
          enterpriseId, lastMonthStart, lastMonthEnd, undefined,
          { vatTreatment: 'ttc', includeBreakdown: false, includeReconciliation: false }
        );

        revenue_growth = lastRevenue > 0 ? ((currentMonthRevenue - lastRevenue) / lastRevenue) * 100 : 0;
      } catch (error) {
        // Fallback sur les opportunités gagnées si comptabilité non disponible
        logger.warn('Crm', 'Failed to get revenue from accounting, using opportunities fallback');
        const currentMonthKey = now.toISOString().substring(0, 7);
        const currentMonthWon = wonOpportunities.filter(o =>
          o.actual_close_date && o.actual_close_date.startsWith(currentMonthKey)
        );
        currentMonthRevenue = currentMonthWon.reduce((sum, o) => sum + (o.value || 0), 0);

        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthKey = lastMonthDate.toISOString().substring(0, 7);
        const lastMonthWon = wonOpportunities.filter(o =>
          o.actual_close_date && o.actual_close_date.startsWith(lastMonthKey)
        );
        const lastMonthValue = lastMonthWon.reduce((sum, o) => sum + (o.value || 0), 0);
        revenue_growth = lastMonthValue > 0 ? ((currentMonthRevenue - lastMonthValue) / lastMonthValue) * 100 : 0;
      }

      // Taux de conversion : won / (won + lost) - exclure les opportunités en cours
      const closedCount = wonOpportunities.length + lostOpportunities.length + closingOpportunities.length;
      const conversion_rate = closedCount > 0 ? (wonOpportunities.length / closedCount) * 100 : 0;

      const stats: CrmStats = {
        total_clients: clients.length,
        active_clients: clients.filter(c => c.status === 'active').length,
        prospects: clients.filter(c => c.status === 'prospect').length,
        total_opportunities: opportunities.length,
        opportunities_value: totalOpportunityValue,
        won_opportunities: wonOpportunities.length,
        won_value: wonValue,
        conversion_rate,
        pending_actions: actions.filter(a => a.status === 'planned').length,
        overdue_actions: actions.filter(a =>
          a.status === 'planned' &&
          a.due_date &&
          new Date(a.due_date) < new Date()
        ).length,
        monthly_revenue: currentMonthRevenue,
        revenue_growth
      };
      return { success: true, data: stats };
    } catch (error) {
      logger.error('Crm', 'Error fetching CRM stats:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: {} as CrmStats,
        error: { message: 'Erreur lors de la récupération des statistiques' }
      };
    }
  }
  async getPipelineStats(enterpriseId: string): Promise<CrmServiceResponse<PipelineStats[]>> {
    try {
      const opportunitiesResponse = await this.getOpportunities(enterpriseId);
      if (opportunitiesResponse.error) {
        throw new Error(typeof opportunitiesResponse.error === 'string' ? opportunitiesResponse.error : opportunitiesResponse.error.message);
      }
      const opportunities = opportunitiesResponse.data ?? [];
      const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closing', 'won', 'lost'];
      const pipelineStats: PipelineStats[] = stages.map(stage => {
        const stageOpps = opportunities.filter(o => o.stage === stage);
        const totalValue = stageOpps.reduce((sum, o) => sum + (o.value || 0), 0);
        return {
          stage,
          count: stageOpps.length,
          value: totalValue,
          avg_deal_size: stageOpps.length > 0 ? totalValue / stageOpps.length : 0
        };
      });
      return { success: true, data: pipelineStats };
    } catch (error) {
      logger.error('Crm', 'Error fetching pipeline stats:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: [],
        error: { message: 'Erreur lors de la récupération des statistiques du pipeline' }
      };
    }
  }
  async getDashboardData(enterpriseId: string): Promise<CrmServiceResponse<CrmDashboardData>> {
    try {
      const [statsResponse, pipelineResponse, opportunitiesResponse, actionsResponse, clientsResponse] = await Promise.all([
        this.getCrmStats(enterpriseId),
        this.getPipelineStats(enterpriseId),
        this.getOpportunities(enterpriseId),
        this.getCommercialActions(enterpriseId),
        this.getClients(enterpriseId)
      ]);
      if (statsResponse.error || pipelineResponse.error) {
        throw new Error('Erreur lors de la récupération des données du tableau de bord');
      }
      const recentOpportunities = (opportunitiesResponse.data ?? [])
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5);
      const recentActions = (actionsResponse.data ?? [])
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5);
      const topClients = (clientsResponse.data ?? [])
        .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
        .slice(0, 5);
      // ✅ Données de revenus depuis la comptabilité (Source Unique de Vérité)
      const revenueData: RevenueData[] = [];
      try {
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

          const { revenue: monthRevenue } = await acceptedAccountingService.calculateRevenueWithAudit(
            enterpriseId, monthStart, monthEnd, undefined,
            { vatTreatment: 'ttc', includeBreakdown: false, includeReconciliation: false }
          );

          revenueData.push({
            month: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
            revenue: monthRevenue,
            target: monthRevenue * 1.1
          });
        }
      } catch (error) {
        logger.warn('Crm', 'Failed to get dashboard revenue from accounting, using opportunities fallback');
        const wonOpportunities = (opportunitiesResponse.data ?? []).filter(o => o.stage === 'won');
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = date.toISOString().substring(0, 7);
          const monthRevenue = wonOpportunities
            .filter(o => {
              const closeDate = o.actual_close_date || o.updated_at;
              return closeDate && closeDate.startsWith(monthKey);
            })
            .reduce((sum, o) => sum + (o.value || 0), 0);
          revenueData.push({
            month: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
            revenue: monthRevenue,
            target: monthRevenue * 1.1
          });
        }
      }
      const dashboardData: CrmDashboardData = {
        stats: statsResponse.data || {} as CrmStats,
        pipeline_stats: pipelineResponse.data || [],
        revenue_data: revenueData,
        recent_opportunities: recentOpportunities,
        recent_actions: recentActions,
        top_clients: topClients
      };
      return { success: true, data: dashboardData };
    } catch (_error) {
      return {
        success: false,
        data: {} as CrmDashboardData,
        error: { message: 'Erreur lors de la récupération des données du tableau de bord' }
      };
    }
  }
  // Export functions
  exportClientsToCSV(clients: Client[], filename: string = 'clients') {
    const headers = [
      'Entreprise',
      'Secteur',
      'Taille',
      'Statut',
      'Ville',
      'Site Web',
      'Chiffre d\'affaires',
      'Date de création'
    ];
    const csvContent = [
      headers.join(','),
      ...clients.map(client => [
        `"${client.company_name}"`,
        `"${client.industry || ''}"`,
        `"${client.size || ''}"`,
        `"${client.status}"`,
        `"${client.city || ''}"`,
        `"${client.website || ''}"`,
        client.total_revenue || 0,
        new Date(client.created_at).toLocaleDateString('fr-FR')
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  exportOpportunitiesToCSV(opportunities: Opportunity[], filename: string = 'opportunites') {
    const headers = [
      'Titre',
      'Client',
      'Étape',
      'Valeur',
      'Probabilité',
      'Date de clôture prévue',
      'Priorité',
      'Responsable'
    ];
    const csvContent = [
      headers.join(','),
      ...opportunities.map(opp => [
        `"${opp.title}"`,
        `"${opp.client_name || ''}"`,
        `"${opp.stage}"`,
        opp.value,
        `${opp.probability}%`,
        new Date(opp.expected_close_date).toLocaleDateString('fr-FR'),
        `"${opp.priority}"`,
        `"${opp.assigned_to || ''}"`
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
export const crmService = new CrmService();