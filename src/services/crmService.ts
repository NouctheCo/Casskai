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

class CrmService {
  // Clients - Utilise la table third_parties existante
  async getClients(enterpriseId: string, filters?: CrmFilters): Promise<CrmServiceResponse<Client[]>> {
    try {
      let query = supabase
        .from('third_parties')
        .select('*')
        .eq('company_id', enterpriseId)
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Calculer le chiffre d'affaires pour chaque client
      const clients: Client[] = await Promise.all((data || []).map(async (client) => {
        // Calculer le CA depuis les opportunités gagnées
        const { data: wonOpportunities } = await supabase
          .from('crm_opportunities')
          .select('value')
          .eq('client_id', client.id)
          .eq('stage', 'won');

        const total_revenue = wonOpportunities?.reduce((sum, opp) => sum + (opp.value || 0), 0) || 0;

        // Dernière interaction depuis les actions
        const { data: lastAction } = await supabase
          .from('crm_actions')
          .select('completed_date, due_date')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          id: client.id,
          enterprise_id: enterpriseId,
          company_name: client.name,
          industry: client.industry || null,
          size: client.size as 'small' | 'medium' | 'large' | null,
          address: client.address_street,
          city: client.address_city,
          postal_code: client.address_postal_code,
          country: client.address_country,
          website: client.website,
          notes: client.notes,
          status: client.client_type === 'customer' ? 'active' : 'prospect',
          total_revenue,
          last_interaction: lastAction?.completed_date || lastAction?.due_date || null,
          created_at: client.created_at,
          updated_at: client.updated_at
        };
      }));

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
      console.error('Error fetching CRM clients:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: [],
        error: { message: 'Erreur lors de la récupération des clients' }
      };
    }
  }

  async createClient(enterpriseId: string, formData: ClientFormData): Promise<CrmServiceResponse<Client>> {
    try {
      // Créer dans la table third_parties
      const { data, error } = await supabase
        .from('third_parties')
        .insert({
          company_id: enterpriseId,
          name: formData.company_name,
          industry: formData.industry,
          address_street: formData.address,
          address_city: formData.city,
          address_postal_code: formData.postal_code,
          address_country: formData.country,
          website: formData.website,
          notes: formData.notes,
          client_type: formData.status === 'active' ? 'customer' : 'prospect',
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
        industry: data.industry,
        size: formData.size,
        address: data.address_street,
        city: data.address_city,
        postal_code: data.address_postal_code,
        country: data.address_country,
        website: data.website,
        notes: data.notes,
        status: formData.status,
        total_revenue: 0,
        last_interaction: null,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      return { success: true, data: newClient };
    } catch (error) {
      console.error('Error creating CRM client:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: {} as Client,
        error: { message: 'Erreur lors de la création du client' }
      };
    }
  }

  async updateClient(clientId: string, formData: ClientFormData): Promise<CrmServiceResponse<Client>> {
    try {
      const { data, error } = await supabase
        .from('third_parties')
        .update({
          name: formData.company_name,
          industry: formData.industry,
          address_street: formData.address,
          address_city: formData.city,
          address_postal_code: formData.postal_code,
          address_country: formData.country,
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
        industry: data.industry,
        size: formData.size,
        address: data.address_street,
        city: data.address_city,
        postal_code: data.address_postal_code,
        country: data.address_country,
        website: data.website,
        notes: data.notes,
        status: formData.status,
        total_revenue: 0,
        last_interaction: null,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      return { success: true, data: updatedClient };
    } catch (error) {
      console.error('Error updating CRM client:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: {} as Client,
        error: { message: 'Erreur lors de la mise à jour du client' }
      };
    }
  }

  async deleteClient(clientId: string): Promise<CrmServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('third_parties')
        .delete()
        .eq('id', clientId);

      if (error) throw error;
      return { success: true, data: true };
    } catch (error) {
      console.error('Error deleting CRM client:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: false,
        error: { message: 'Erreur lors de la suppression du client' }
      };
    }
  }

  // Contacts - Utilise maintenant la table crm_contacts
  async getContacts(clientId?: string, companyId?: string): Promise<CrmServiceResponse<Contact[]>> {
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
      console.error('Error fetching CRM contacts:', error instanceof Error ? error.message : String(error));
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
          client_id: formData.client_id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          notes: formData.notes,
          is_primary: formData.is_primary || false
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating CRM contact:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: {} as Contact,
        error: { message: 'Erreur lors de la création du contact' }
      };
    }
  }

  async updateContact(contactId: string, formData: Partial<ContactFormData>): Promise<CrmServiceResponse<Contact>> {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .update(formData)
        .eq('id', contactId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating CRM contact:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        data: {} as Contact,
        error: { message: 'Erreur lors de la mise à jour du contact' }
      };
    }
  }

  async deleteContact(contactId: string): Promise<CrmServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('crm_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;
      return { success: true, data: true };
    } catch (error) {
      console.error('Error deleting CRM contact:', error instanceof Error ? error.message : String(error));
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
        .select('*')
        .eq('company_id', enterpriseId)
        .order('created_at', { ascending: false });

      if (filters) {
        if (filters.search) {
          query = query.ilike('title', `%${filters.search}%`);
        }
        if (filters.stage && filters.stage !== 'all') {
          query = query.eq('stage', filters.stage);
        }
        if (filters.priority && filters.priority !== 'all') {
          query = query.eq('priority', filters.priority);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching CRM opportunities:', error instanceof Error ? error.message : String(error));
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
      let client_name = undefined;
      let contact_name = undefined;

      if (formData.client_id) {
        const { data: client } = await supabase
          .from('third_parties')
          .select('name')
          .eq('id', formData.client_id)
          .single();
        client_name = client?.name;
      }

      if (formData.contact_id) {
        const { data: contact } = await supabase
          .from('crm_contacts')
          .select('first_name, last_name')
          .eq('id', formData.contact_id)
          .single();
        contact_name = contact ? `${contact.first_name} ${contact.last_name}` : undefined;
      }

      const { data, error } = await supabase
        .from('crm_opportunities')
        .insert({
          company_id: companyId,
          client_id: formData.client_id,
          client_name,
          contact_id: formData.contact_id,
          contact_name,
          title: formData.title,
          description: formData.description,
          stage: formData.stage,
          value: formData.value,
          probability: formData.probability,
          expected_close_date: formData.expected_close_date,
          source: formData.source,
          assigned_to: formData.assigned_to,
          priority: formData.priority,
          tags: formData.tags,
          next_action: formData.next_action,
          next_action_date: formData.next_action_date
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating CRM opportunity:', error instanceof Error ? error.message : String(error));
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
          .single();
        updateData.client_name = client?.name;
      }

      if (formData.contact_id) {
        const { data: contact } = await supabase
          .from('crm_contacts')
          .select('first_name, last_name')
          .eq('id', formData.contact_id)
          .single();
        updateData.contact_name = contact ? `${contact.first_name} ${contact.last_name}` : null;
      }

      const { data, error } = await supabase
        .from('crm_opportunities')
        .update(updateData)
        .eq('id', opportunityId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating CRM opportunity:', error instanceof Error ? error.message : String(error));
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
      console.error('Error deleting CRM opportunity:', error instanceof Error ? error.message : String(error));
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
      console.error('Error fetching commercial actions:', error instanceof Error ? error.message : String(error));
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
      let client_name = undefined;
      let contact_name = undefined;
      let opportunity_title = undefined;

      if (formData.client_id) {
        const { data: client } = await supabase
          .from('third_parties')
          .select('name')
          .eq('id', formData.client_id)
          .single();
        client_name = client?.name;
      }

      if (formData.contact_id) {
        const { data: contact } = await supabase
          .from('crm_contacts')
          .select('first_name, last_name')
          .eq('id', formData.contact_id)
          .single();
        contact_name = contact ? `${contact.first_name} ${contact.last_name}` : undefined;
      }

      if (formData.opportunity_id) {
        const { data: opportunity } = await supabase
          .from('crm_opportunities')
          .select('title')
          .eq('id', formData.opportunity_id)
          .single();
        opportunity_title = opportunity?.title;
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
      console.error('Error creating commercial action:', error instanceof Error ? error.message : String(error));
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
        updateData.client_name = client?.name;
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
        updateData.opportunity_title = opportunity?.title;
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
      console.error('Error updating commercial action:', error instanceof Error ? error.message : String(error));
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
      console.error('Error deleting commercial action:', error instanceof Error ? error.message : String(error));
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

      const clients = clientsResponse.data;
      const opportunities = opportunitiesResponse.data;
      const actions = actionsResponse.data;

      const wonOpportunities = opportunities.filter(o => o.stage === 'won');
      const totalOpportunityValue = opportunities.reduce((sum, o) => sum + (o.value || 0), 0);
      const wonValue = wonOpportunities.reduce((sum, o) => sum + (o.value || 0), 0);

      // Calculer la croissance (comparer avec le mois dernier)
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      const lastMonthWonOpportunities = wonOpportunities.filter(o =>
        o.actual_close_date && new Date(o.actual_close_date) >= lastMonthDate
      );
      const lastMonthValue = lastMonthWonOpportunities.reduce((sum, o) => sum + (o.value || 0), 0);
      const revenue_growth = lastMonthValue > 0 ? ((wonValue - lastMonthValue) / lastMonthValue) * 100 : 0;

      const stats: CrmStats = {
        total_clients: clients.length,
        active_clients: clients.filter(c => c.status === 'active').length,
        prospects: clients.filter(c => c.status === 'prospect').length,
        total_opportunities: opportunities.length,
        opportunities_value: totalOpportunityValue,
        won_opportunities: wonOpportunities.length,
        won_value: wonValue,
        conversion_rate: opportunities.length > 0 ? (wonOpportunities.length / opportunities.length) * 100 : 0,
        pending_actions: actions.filter(a => a.status === 'planned').length,
        overdue_actions: actions.filter(a =>
          a.status === 'planned' &&
          a.due_date &&
          new Date(a.due_date) < new Date()
        ).length,
        monthly_revenue: wonValue,
        revenue_growth
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching CRM stats:', error instanceof Error ? error.message : String(error));
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
      const opportunities = opportunitiesResponse.data;

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
      console.error('Error fetching pipeline stats:', error instanceof Error ? error.message : String(error));
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

      const recentOpportunities = opportunitiesResponse.data
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5);

      const recentActions = actionsResponse.data
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5);

      const topClients = clientsResponse.data
        .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
        .slice(0, 5);

      // Calculer les vraies données de revenus depuis les opportunités gagnées
      const wonOpportunities = opportunitiesResponse.data.filter(o => o.stage === 'won' && o.actual_close_date);
      const revenueData: RevenueData[] = [];

      // Générer les données des 6 derniers mois
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().substr(0, 7); // YYYY-MM

        const monthRevenue = wonOpportunities
          .filter(o => o.actual_close_date && o.actual_close_date.startsWith(monthKey))
          .reduce((sum, o) => sum + (o.value || 0), 0);

        revenueData.push({
          month: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
          revenue: monthRevenue,
          target: monthRevenue * 1.1 // Target 10% au-dessus du réel pour exemple
        });
      }

      const dashboardData: CrmDashboardData = {
        stats: statsResponse.data,
        pipeline_stats: pipelineResponse.data,
        revenue_data: revenueData,
        recent_opportunities: recentOpportunities,
        recent_actions: recentActions,
        top_clients: topClients
      };

      return { success: true, data: dashboardData };
    } catch (error) {
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
