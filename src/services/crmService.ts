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

// Mock data
const mockClients: Client[] = [
  {
    id: '1',
    company_name: 'TechCorp Solutions',
    industry: 'Technology',
    size: 'large',
    address: '123 Tech Street',
    city: 'Paris',
    postal_code: '75001',
    country: 'France',
    website: 'https://techcorp.com',
    status: 'active',
    enterprise_id: 'company-1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z',
    total_revenue: 125000,
    last_interaction: '2024-01-20T15:30:00Z'
  },
  {
    id: '2',
    company_name: 'Green Energy Ltd',
    industry: 'Energy',
    size: 'medium',
    address: '456 Green Avenue',
    city: 'Lyon',
    postal_code: '69000',
    country: 'France',
    website: 'https://greenenergy.fr',
    status: 'prospect',
    enterprise_id: 'company-1',
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-18T11:00:00Z',
    total_revenue: 0,
    last_interaction: '2024-01-18T11:00:00Z'
  },
  {
    id: '3',
    company_name: 'Retail Plus',
    industry: 'Retail',
    size: 'small',
    address: '789 Commerce Road',
    city: 'Marseille',
    postal_code: '13000',
    country: 'France',
    status: 'active',
    enterprise_id: 'company-1',
    created_at: '2023-12-05T14:00:00Z',
    updated_at: '2024-01-15T16:00:00Z',
    total_revenue: 45000,
    last_interaction: '2024-01-15T16:00:00Z'
  }
];

const mockContacts: Contact[] = [
  {
    id: '1',
    first_name: 'Jean',
    last_name: 'Dupont',
    email: 'jean.dupont@techcorp.com',
    phone: '+33 1 23 45 67 89',
    position: 'CEO',
    client_id: '1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z'
  },
  {
    id: '2',
    first_name: 'Marie',
    last_name: 'Martin',
    email: 'marie.martin@greenenergy.fr',
    phone: '+33 4 56 78 90 12',
    position: 'CTO',
    client_id: '2',
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-18T11:00:00Z'
  },
  {
    id: '3',
    first_name: 'Pierre',
    last_name: 'Bernard',
    email: 'pierre.bernard@retailplus.fr',
    phone: '+33 4 91 23 45 67',
    position: 'Manager',
    client_id: '3',
    created_at: '2023-12-05T14:00:00Z',
    updated_at: '2024-01-15T16:00:00Z'
  }
];

const mockOpportunities: Opportunity[] = [
  {
    id: '1',
    title: 'Implementation ERP System',
    description: 'Complete ERP system implementation for TechCorp',
    client_id: '1',
    client_name: 'TechCorp Solutions',
    contact_id: '1',
    contact_name: 'Jean Dupont',
    stage: 'negotiation',
    value: 85000,
    probability: 75,
    expected_close_date: '2024-02-15',
    source: 'Website',
    assigned_to: 'Sales Team',
    priority: 'high',
    enterprise_id: 'company-1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z',
    tags: ['ERP', 'Enterprise'],
    next_action: 'Send final proposal',
    next_action_date: '2024-01-25'
  },
  {
    id: '2',
    title: 'Green Energy Consulting',
    description: 'Energy efficiency consulting services',
    client_id: '2',
    client_name: 'Green Energy Ltd',
    contact_id: '2',
    contact_name: 'Marie Martin',
    stage: 'qualification',
    value: 35000,
    probability: 40,
    expected_close_date: '2024-03-01',
    source: 'Referral',
    assigned_to: 'Consulting Team',
    priority: 'medium',
    enterprise_id: 'company-1',
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-18T11:00:00Z',
    tags: ['Consulting', 'Energy'],
    next_action: 'Schedule demo',
    next_action_date: '2024-01-22'
  },
  {
    id: '3',
    title: 'Retail Management Software',
    description: 'Point of sale and inventory management system',
    client_id: '3',
    client_name: 'Retail Plus',
    contact_id: '3',
    contact_name: 'Pierre Bernard',
    stage: 'proposal',
    value: 25000,
    probability: 60,
    expected_close_date: '2024-02-28',
    source: 'Cold Call',
    assigned_to: 'Sales Team',
    priority: 'medium',
    enterprise_id: 'company-1',
    created_at: '2023-12-05T14:00:00Z',
    updated_at: '2024-01-15T16:00:00Z',
    tags: ['Software', 'Retail'],
    next_action: 'Follow up on proposal',
    next_action_date: '2024-01-20'
  }
];

const mockCommercialActions: CommercialAction[] = [
  {
    id: '1',
    type: 'meeting',
    title: 'Initial meeting with TechCorp',
    description: 'Discuss ERP implementation requirements',
    client_id: '1',
    client_name: 'TechCorp Solutions',
    contact_id: '1',
    contact_name: 'Jean Dupont',
    opportunity_id: '1',
    opportunity_title: 'Implementation ERP System',
    status: 'completed',
    due_date: '2024-01-15T14:00:00Z',
    completed_date: '2024-01-15T14:00:00Z',
    assigned_to: 'Sales Team',
    priority: 'high',
    outcome: 'Positive meeting, client interested in full implementation',
    follow_up_required: true,
    follow_up_date: '2024-01-25',
    enterprise_id: 'company-1',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-15T16:00:00Z'
  },
  {
    id: '2',
    type: 'call',
    title: 'Follow-up call Green Energy',
    description: 'Discuss consulting services proposal',
    client_id: '2',
    client_name: 'Green Energy Ltd',
    contact_id: '2',
    contact_name: 'Marie Martin',
    opportunity_id: '2',
    opportunity_title: 'Green Energy Consulting',
    status: 'planned',
    due_date: '2024-01-22T10:00:00Z',
    assigned_to: 'Consulting Team',
    priority: 'medium',
    follow_up_required: false,
    enterprise_id: 'company-1',
    created_at: '2024-01-18T11:00:00Z',
    updated_at: '2024-01-18T11:00:00Z'
  },
  {
    id: '3',
    type: 'email',
    title: 'Send proposal to Retail Plus',
    description: 'Send detailed software proposal',
    client_id: '3',
    client_name: 'Retail Plus',
    contact_id: '3',
    contact_name: 'Pierre Bernard',
    opportunity_id: '3',
    opportunity_title: 'Retail Management Software',
    status: 'completed',
    due_date: '2024-01-10T09:00:00Z',
    completed_date: '2024-01-10T09:30:00Z',
    assigned_to: 'Sales Team',
    priority: 'medium',
    outcome: 'Proposal sent, awaiting response',
    follow_up_required: true,
    follow_up_date: '2024-01-20',
    enterprise_id: 'company-1',
    created_at: '2024-01-08T10:00:00Z',
    updated_at: '2024-01-10T09:30:00Z'
  }
];

class CrmService {
  // Clients
  async getClients(enterpriseId: string, filters?: CrmFilters): Promise<CrmServiceResponse<Client[]>> {
    try {
      // Utilise la table third_parties existante comme source de données CRM
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

      // Transform third_parties data to Client format
      const clients: Client[] = (data || []).map(client => ({
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
        total_revenue: 0, // Sera calculé plus tard avec les vraies données
        last_interaction: null,
        created_at: client.created_at,
        updated_at: client.updated_at
      }));

      // Appliquer les filtres supplémentaires
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
      
      return { data: filteredClients };
    } catch (error) {
      console.error('Error fetching CRM clients:', error);
      return {
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
      
      return { data: newClient };
    } catch (error) {
      console.error('Error creating CRM client:', error);
      return {
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
      
      return { data: updatedClient };
    } catch (error) {
      console.error('Error updating CRM client:', error);
      return {
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
      return { data: true };
    } catch (error) {
      console.error('Error deleting CRM client:', error);
      return {
        data: false,
        error: { message: 'Erreur lors de la suppression du client' }
      };
    }
  }

  // Contacts - Utilise localStorage temporairement car pas de table contacts dans Supabase
  async getContacts(clientId?: string): Promise<CrmServiceResponse<Contact[]>> {
    try {
      // Récupération depuis localStorage pour simuler la persistance
      const storedContacts = localStorage.getItem('crm_contacts');
      let allContacts: Contact[] = storedContacts ? JSON.parse(storedContacts) : mockContacts;
      
      let filteredContacts = allContacts;
      if (clientId) {
        filteredContacts = allContacts.filter(contact => contact.client_id === clientId);
      }
      
      return { data: filteredContacts };
    } catch (error) {
      console.error('Error fetching CRM contacts:', error);
      return {
        data: [],
        error: { message: 'Erreur lors de la récupération des contacts' }
      };
    }
  }

  async createContact(formData: ContactFormData): Promise<CrmServiceResponse<Contact>> {
    try {
      const newContact: Contact = {
        id: Date.now().toString(),
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Sauvegarde dans localStorage
      const storedContacts = localStorage.getItem('crm_contacts');
      const allContacts: Contact[] = storedContacts ? JSON.parse(storedContacts) : mockContacts;
      allContacts.push(newContact);
      localStorage.setItem('crm_contacts', JSON.stringify(allContacts));
      
      return { data: newContact };
    } catch (error) {
      console.error('Error creating CRM contact:', error);
      return {
        data: {} as Contact,
        error: { message: 'Erreur lors de la création du contact' }
      };
    }
  }

  async updateContact(contactId: string, formData: ContactFormData): Promise<CrmServiceResponse<Contact>> {
    try {
      const storedContacts = localStorage.getItem('crm_contacts');
      const allContacts: Contact[] = storedContacts ? JSON.parse(storedContacts) : mockContacts;
      
      const contactIndex = allContacts.findIndex(contact => contact.id === contactId);
      if (contactIndex === -1) {
        return {
          data: {} as Contact,
          error: { message: 'Contact non trouvé' }
        };
      }
      
      allContacts[contactIndex] = {
        ...allContacts[contactIndex],
        ...formData,
        updated_at: new Date().toISOString()
      };
      
      localStorage.setItem('crm_contacts', JSON.stringify(allContacts));
      return { data: allContacts[contactIndex] };
    } catch (error) {
      console.error('Error updating CRM contact:', error);
      return {
        data: {} as Contact,
        error: { message: 'Erreur lors de la mise à jour du contact' }
      };
    }
  }

  async deleteContact(contactId: string): Promise<CrmServiceResponse<boolean>> {
    try {
      const storedContacts = localStorage.getItem('crm_contacts');
      const allContacts: Contact[] = storedContacts ? JSON.parse(storedContacts) : mockContacts;
      
      const contactIndex = allContacts.findIndex(contact => contact.id === contactId);
      if (contactIndex === -1) {
        return {
          data: false,
          error: { message: 'Contact non trouvé' }
        };
      }
      
      allContacts.splice(contactIndex, 1);
      localStorage.setItem('crm_contacts', JSON.stringify(allContacts));
      return { data: true };
    } catch (error) {
      console.error('Error deleting CRM contact:', error);
      return {
        data: false,
        error: { message: 'Erreur lors de la suppression du contact' }
      };
    }
  }

  // Opportunities - Utilise localStorage avec connexion aux clients réels de la DB
  async getOpportunities(enterpriseId: string, filters?: CrmFilters): Promise<CrmServiceResponse<Opportunity[]>> {
    try {
      // Récupération depuis localStorage pour les opportunités
      const storedOpportunities = localStorage.getItem('crm_opportunities');
      let allOpportunities: Opportunity[] = storedOpportunities ? JSON.parse(storedOpportunities) : mockOpportunities;
      
      let filteredOpportunities = allOpportunities.filter(opp => opp.enterprise_id === enterpriseId);
      
      if (filters) {
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredOpportunities = filteredOpportunities.filter(opp =>
            opp.title.toLowerCase().includes(searchLower)
          );
        }
        
        if (filters.stage && filters.stage !== 'all') {
          filteredOpportunities = filteredOpportunities.filter(opp => opp.stage === filters.stage);
        }
        
        if (filters.priority && filters.priority !== 'all') {
          filteredOpportunities = filteredOpportunities.filter(opp => opp.priority === filters.priority);
        }
      }
      
      return { data: filteredOpportunities };
    } catch (error) {
      console.error('Error fetching CRM opportunities:', error);
      return {
        data: [],
        error: { message: 'Erreur lors de la récupération des opportunités' }
      };
    }
  }

  async createOpportunity(enterpriseId: string, formData: OpportunityFormData): Promise<CrmServiceResponse<Opportunity>> {
    try {
      const newOpportunity: Opportunity = {
        id: Date.now().toString(),
        enterprise_id: enterpriseId,
        client_id: formData.client_id,
        contact_id: formData.contact_id,
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
        next_action_date: formData.next_action_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Sauvegarde dans localStorage
      const storedOpportunities = localStorage.getItem('crm_opportunities');
      const allOpportunities: Opportunity[] = storedOpportunities ? JSON.parse(storedOpportunities) : mockOpportunities;
      allOpportunities.push(newOpportunity);
      localStorage.setItem('crm_opportunities', JSON.stringify(allOpportunities));
      
      return { data: newOpportunity };
    } catch (error) {
      console.error('Error creating CRM opportunity:', error);
      return {
        data: {} as Opportunity,
        error: { message: 'Erreur lors de la création de l\'opportunité' }
      };
    }
  }

  async updateOpportunity(opportunityId: string, formData: Partial<OpportunityFormData>): Promise<CrmServiceResponse<Opportunity>> {
    try {
      const storedOpportunities = localStorage.getItem('crm_opportunities');
      const allOpportunities: Opportunity[] = storedOpportunities ? JSON.parse(storedOpportunities) : mockOpportunities;
      
      const oppIndex = allOpportunities.findIndex(opp => opp.id === opportunityId);
      if (oppIndex === -1) {
        return {
          data: {} as Opportunity,
          error: { message: 'Opportunité non trouvée' }
        };
      }
      
      allOpportunities[oppIndex] = {
        ...allOpportunities[oppIndex],
        ...formData,
        updated_at: new Date().toISOString()
      };
      
      localStorage.setItem('crm_opportunities', JSON.stringify(allOpportunities));
      return { data: allOpportunities[oppIndex] };
    } catch (error) {
      console.error('Error updating CRM opportunity:', error);
      return {
        data: {} as Opportunity,
        error: { message: 'Erreur lors de la mise à jour de l\'opportunité' }
      };
    }
  }

  async deleteOpportunity(opportunityId: string): Promise<CrmServiceResponse<boolean>> {
    try {
      const storedOpportunities = localStorage.getItem('crm_opportunities');
      const allOpportunities: Opportunity[] = storedOpportunities ? JSON.parse(storedOpportunities) : mockOpportunities;
      
      const oppIndex = allOpportunities.findIndex(opp => opp.id === opportunityId);
      if (oppIndex === -1) {
        return {
          data: false,
          error: { message: 'Opportunité non trouvée' }
        };
      }
      
      allOpportunities.splice(oppIndex, 1);
      localStorage.setItem('crm_opportunities', JSON.stringify(allOpportunities));
      return { data: true };
    } catch (error) {
      console.error('Error deleting CRM opportunity:', error);
      return {
        data: false,
        error: { message: 'Erreur lors de la suppression de l\'opportunité' }
      };
    }
  }

  // Nouvelles méthodes pour compléter l'intégration backend
  async updateCommercialAction(actionId: string, formData: Partial<CommercialActionFormData>): Promise<CrmServiceResponse<CommercialAction>> {
    try {
      const storedActions = localStorage.getItem('crm_actions');
      const allActions: CommercialAction[] = storedActions ? JSON.parse(storedActions) : mockCommercialActions;
      
      const actionIndex = allActions.findIndex(action => action.id === actionId);
      if (actionIndex === -1) {
        return {
          data: {} as CommercialAction,
          error: { message: 'Action commerciale non trouvée' }
        };
      }
      
      // Mise à jour des champs modifiés
      allActions[actionIndex] = {
        ...allActions[actionIndex],
        ...formData,
        updated_at: new Date().toISOString()
      };
      
      localStorage.setItem('crm_actions', JSON.stringify(allActions));
      return { data: allActions[actionIndex] };
    } catch (error) {
      console.error('Error updating commercial action:', error);
      return {
        data: {} as CommercialAction,
        error: { message: 'Erreur lors de la mise à jour de l\'action commerciale' }
      };
    }
  }

  async deleteCommercialAction(actionId: string): Promise<CrmServiceResponse<boolean>> {
    try {
      const storedActions = localStorage.getItem('crm_actions');
      const allActions: CommercialAction[] = storedActions ? JSON.parse(storedActions) : mockCommercialActions;
      
      const actionIndex = allActions.findIndex(action => action.id === actionId);
      if (actionIndex === -1) {
        return {
          data: false,
          error: { message: 'Action commerciale non trouvée' }
        };
      }
      
      allActions.splice(actionIndex, 1);
      localStorage.setItem('crm_actions', JSON.stringify(allActions));
      return { data: true };
    } catch (error) {
      console.error('Error deleting commercial action:', error);
      return {
        data: false,
        error: { message: 'Erreur lors de la suppression de l\'action commerciale' }
      };
    }
  }

  // Commercial Actions - Utilise localStorage avec persistance locale
  async getCommercialActions(enterpriseId: string, filters?: CrmFilters): Promise<CrmServiceResponse<CommercialAction[]>> {
    try {
      // Récupération depuis localStorage avec fallback vers mock
      const storedActions = localStorage.getItem('crm_actions');
      let allActions: CommercialAction[] = storedActions ? JSON.parse(storedActions) : mockCommercialActions;
      
      let filteredActions = allActions.filter(action => action.enterprise_id === enterpriseId);
      
      if (filters) {
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredActions = filteredActions.filter(action =>
            action.title.toLowerCase().includes(searchLower) ||
            action.client_name?.toLowerCase().includes(searchLower)
          );
        }
        
        if (filters.type && filters.type !== 'all') {
          filteredActions = filteredActions.filter(action => action.type === filters.type);
        }
        
        if (filters.priority && filters.priority !== 'all') {
          filteredActions = filteredActions.filter(action => action.priority === filters.priority);
        }
      }
      
      return { data: filteredActions };
    } catch (error) {
      console.error('Error fetching commercial actions:', error);
      return {
        data: [],
        error: { message: 'Erreur lors de la récupération des actions commerciales' }
      };
    }
  }

  async createCommercialAction(enterpriseId: string, formData: CommercialActionFormData): Promise<CrmServiceResponse<CommercialAction>> {
    try {
      // Récupérer les données existantes pour les références
      const clientsResponse = await this.getClients(enterpriseId);
      const contactsResponse = await this.getContacts();
      const opportunitiesResponse = await this.getOpportunities(enterpriseId);
      
      const client = formData.client_id ? clientsResponse.data.find(c => c.id === formData.client_id) : undefined;
      const contact = formData.contact_id ? contactsResponse.data.find(c => c.id === formData.contact_id) : undefined;
      const opportunity = formData.opportunity_id ? opportunitiesResponse.data.find(o => o.id === formData.opportunity_id) : undefined;
      
      const newAction: CommercialAction = {
        id: Date.now().toString(),
        ...formData,
        client_name: client?.company_name,
        contact_name: contact ? `${contact.first_name} ${contact.last_name}` : undefined,
        opportunity_title: opportunity?.title,
        enterprise_id: enterpriseId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Sauvegarde dans localStorage
      const storedActions = localStorage.getItem('crm_actions');
      const allActions: CommercialAction[] = storedActions ? JSON.parse(storedActions) : mockCommercialActions;
      allActions.push(newAction);
      localStorage.setItem('crm_actions', JSON.stringify(allActions));
      
      return { data: newAction };
    } catch (error) {
      console.error('Error creating commercial action:', error);
      return {
        data: {} as CommercialAction,
        error: { message: 'Erreur lors de la création de l\'action commerciale' }
      };
    }
  }

  // Statistics and Dashboard - Utilise les vraies données
  async getCrmStats(enterpriseId: string): Promise<CrmServiceResponse<CrmStats>> {
    try {
      // Récupère les clients de la DB
      const clientsResponse = await this.getClients(enterpriseId);
      if (clientsResponse.error) {
        throw new Error(clientsResponse.error.message);
      }
      const clients = clientsResponse.data;
      
      // Récupère les opportunités du localStorage
      const opportunitiesResponse = await this.getOpportunities(enterpriseId);
      if (opportunitiesResponse.error) {
        throw new Error(opportunitiesResponse.error.message);
      }
      const opportunities = opportunitiesResponse.data;
      
      // Récupère les actions commerciales depuis localStorage
      const actionsResponse = await this.getCommercialActions(enterpriseId);
      if (actionsResponse.error) {
        throw new Error(actionsResponse.error.message);
      }
      const actions = actionsResponse.data;
      
      const wonOpportunities = opportunities.filter(o => o.stage === 'won');
      const totalOpportunityValue = opportunities.reduce((sum, o) => sum + o.value, 0);
      const wonValue = wonOpportunities.reduce((sum, o) => sum + o.value, 0);
      
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
        revenue_growth: 15.5 // Mock growth percentage
      };
      
      return { data: stats };
    } catch (error) {
      console.error('Error fetching CRM stats:', error);
      return {
        data: {} as CrmStats,
        error: { message: 'Erreur lors de la récupération des statistiques' }
      };
    }
  }

  async getPipelineStats(enterpriseId: string): Promise<CrmServiceResponse<PipelineStats[]>> {
    try {
      // Utilise les vraies données d'opportunités
      const opportunitiesResponse = await this.getOpportunities(enterpriseId);
      if (opportunitiesResponse.error) {
        throw new Error(opportunitiesResponse.error.message);
      }
      const opportunities = opportunitiesResponse.data;
      
      const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closing'];
      
      const pipelineStats: PipelineStats[] = stages.map(stage => {
        const stageOpps = opportunities.filter(o => o.stage === stage);
        const totalValue = stageOpps.reduce((sum, o) => sum + o.value, 0);
        
        return {
          stage,
          count: stageOpps.length,
          value: totalValue,
          avg_deal_size: stageOpps.length > 0 ? totalValue / stageOpps.length : 0
        };
      });
      
      return { data: pipelineStats };
    } catch (error) {
      console.error('Error fetching pipeline stats:', error);
      return {
        data: [],
        error: { message: 'Erreur lors de la récupération des statistiques du pipeline' }
      };
    }
  }

  async getDashboardData(enterpriseId: string): Promise<CrmServiceResponse<CrmDashboardData>> {
    try {
      const [statsResponse, pipelineResponse] = await Promise.all([
        this.getCrmStats(enterpriseId),
        this.getPipelineStats(enterpriseId)
      ]);
      
      if (statsResponse.error || pipelineResponse.error) {
        throw new Error('Erreur lors de la récupération des données du tableau de bord');
      }
      
      // Utilise les vraies données pour le tableau de bord
      const opportunitiesResponse = await this.getOpportunities(enterpriseId);
      const actionsResponse = await this.getCommercialActions(enterpriseId);
      const clientsResponse = await this.getClients(enterpriseId);
      
      const recentOpportunities = opportunitiesResponse.data
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5);
      
      const recentActions = actionsResponse.data
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5);
      
      const topClients = clientsResponse.data
        .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
        .slice(0, 5);
      
      const revenueData: RevenueData[] = [
        { month: 'Jan 2024', revenue: 45000, target: 50000 },
        { month: 'Fév 2024', revenue: 52000, target: 55000 },
        { month: 'Mar 2024', revenue: 48000, target: 60000 },
        { month: 'Avr 2024', revenue: 61000, target: 65000 },
        { month: 'Mai 2024', revenue: 58000, target: 70000 },
        { month: 'Juin 2024', revenue: 67000, target: 75000 }
      ];
      
      const dashboardData: CrmDashboardData = {
        stats: statsResponse.data,
        pipeline_stats: pipelineResponse.data,
        revenue_data: revenueData,
        recent_opportunities: recentOpportunities,
        recent_actions: recentActions,
        top_clients: topClients
      };
      
      return { data: dashboardData };
    } catch (error) {
      return {
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