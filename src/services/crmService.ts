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
      let filteredClients = mockClients.filter(client => client.enterprise_id === enterpriseId);
      
      if (filters) {
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredClients = filteredClients.filter(client =>
            client.company_name.toLowerCase().includes(searchLower) ||
            client.industry?.toLowerCase().includes(searchLower)
          );
        }
        
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
      return {
        data: [],
        error: { message: 'Erreur lors de la récupération des clients' }
      };
    }
  }

  async createClient(enterpriseId: string, formData: ClientFormData): Promise<CrmServiceResponse<Client>> {
    try {
      const newClient: Client = {
        id: Date.now().toString(),
        ...formData,
        enterprise_id: enterpriseId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_revenue: 0
      };
      
      mockClients.push(newClient);
      return { data: newClient };
    } catch (error) {
      return {
        data: {} as Client,
        error: { message: 'Erreur lors de la création du client' }
      };
    }
  }

  async updateClient(clientId: string, formData: ClientFormData): Promise<CrmServiceResponse<Client>> {
    try {
      const clientIndex = mockClients.findIndex(client => client.id === clientId);
      if (clientIndex === -1) {
        return {
          data: {} as Client,
          error: { message: 'Client non trouvé' }
        };
      }
      
      mockClients[clientIndex] = {
        ...mockClients[clientIndex],
        ...formData,
        updated_at: new Date().toISOString()
      };
      
      return { data: mockClients[clientIndex] };
    } catch (error) {
      return {
        data: {} as Client,
        error: { message: 'Erreur lors de la mise à jour du client' }
      };
    }
  }

  async deleteClient(clientId: string): Promise<CrmServiceResponse<boolean>> {
    try {
      const clientIndex = mockClients.findIndex(client => client.id === clientId);
      if (clientIndex === -1) {
        return {
          data: false,
          error: { message: 'Client non trouvé' }
        };
      }
      
      mockClients.splice(clientIndex, 1);
      return { data: true };
    } catch (error) {
      return {
        data: false,
        error: { message: 'Erreur lors de la suppression du client' }
      };
    }
  }

  // Contacts
  async getContacts(clientId?: string): Promise<CrmServiceResponse<Contact[]>> {
    try {
      let filteredContacts = mockContacts;
      if (clientId) {
        filteredContacts = mockContacts.filter(contact => contact.client_id === clientId);
      }
      return { data: filteredContacts };
    } catch (error) {
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
      
      mockContacts.push(newContact);
      return { data: newContact };
    } catch (error) {
      return {
        data: {} as Contact,
        error: { message: 'Erreur lors de la création du contact' }
      };
    }
  }

  // Opportunities
  async getOpportunities(enterpriseId: string, filters?: CrmFilters): Promise<CrmServiceResponse<Opportunity[]>> {
    try {
      let filteredOpportunities = mockOpportunities.filter(opp => opp.enterprise_id === enterpriseId);
      
      if (filters) {
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredOpportunities = filteredOpportunities.filter(opp =>
            opp.title.toLowerCase().includes(searchLower) ||
            opp.client_name?.toLowerCase().includes(searchLower)
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
      return {
        data: [],
        error: { message: 'Erreur lors de la récupération des opportunités' }
      };
    }
  }

  async createOpportunity(enterpriseId: string, formData: OpportunityFormData): Promise<CrmServiceResponse<Opportunity>> {
    try {
      const client = mockClients.find(c => c.id === formData.client_id);
      const contact = mockContacts.find(c => c.id === formData.contact_id);
      
      const newOpportunity: Opportunity = {
        id: Date.now().toString(),
        ...formData,
        client_name: client?.company_name,
        contact_name: contact ? `${contact.first_name} ${contact.last_name}` : undefined,
        enterprise_id: enterpriseId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockOpportunities.push(newOpportunity);
      return { data: newOpportunity };
    } catch (error) {
      return {
        data: {} as Opportunity,
        error: { message: 'Erreur lors de la création de l\'opportunité' }
      };
    }
  }

  async updateOpportunity(opportunityId: string, formData: Partial<OpportunityFormData>): Promise<CrmServiceResponse<Opportunity>> {
    try {
      const oppIndex = mockOpportunities.findIndex(opp => opp.id === opportunityId);
      if (oppIndex === -1) {
        return {
          data: {} as Opportunity,
          error: { message: 'Opportunité non trouvée' }
        };
      }
      
      const client = formData.client_id ? mockClients.find(c => c.id === formData.client_id) : undefined;
      const contact = formData.contact_id ? mockContacts.find(c => c.id === formData.contact_id) : undefined;
      
      mockOpportunities[oppIndex] = {
        ...mockOpportunities[oppIndex],
        ...formData,
        client_name: client?.company_name || mockOpportunities[oppIndex].client_name,
        contact_name: contact ? `${contact.first_name} ${contact.last_name}` : mockOpportunities[oppIndex].contact_name,
        updated_at: new Date().toISOString()
      };
      
      return { data: mockOpportunities[oppIndex] };
    } catch (error) {
      return {
        data: {} as Opportunity,
        error: { message: 'Erreur lors de la mise à jour de l\'opportunité' }
      };
    }
  }

  // Commercial Actions
  async getCommercialActions(enterpriseId: string, filters?: CrmFilters): Promise<CrmServiceResponse<CommercialAction[]>> {
    try {
      let filteredActions = mockCommercialActions.filter(action => action.enterprise_id === enterpriseId);
      
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
      return {
        data: [],
        error: { message: 'Erreur lors de la récupération des actions commerciales' }
      };
    }
  }

  async createCommercialAction(enterpriseId: string, formData: CommercialActionFormData): Promise<CrmServiceResponse<CommercialAction>> {
    try {
      const client = formData.client_id ? mockClients.find(c => c.id === formData.client_id) : undefined;
      const contact = formData.contact_id ? mockContacts.find(c => c.id === formData.contact_id) : undefined;
      const opportunity = formData.opportunity_id ? mockOpportunities.find(o => o.id === formData.opportunity_id) : undefined;
      
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
      
      mockCommercialActions.push(newAction);
      return { data: newAction };
    } catch (error) {
      return {
        data: {} as CommercialAction,
        error: { message: 'Erreur lors de la création de l\'action commerciale' }
      };
    }
  }

  // Statistics and Dashboard
  async getCrmStats(enterpriseId: string): Promise<CrmServiceResponse<CrmStats>> {
    try {
      const clients = mockClients.filter(c => c.enterprise_id === enterpriseId);
      const opportunities = mockOpportunities.filter(o => o.enterprise_id === enterpriseId);
      const actions = mockCommercialActions.filter(a => a.enterprise_id === enterpriseId);
      
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
      return {
        data: {} as CrmStats,
        error: { message: 'Erreur lors de la récupération des statistiques' }
      };
    }
  }

  async getPipelineStats(enterpriseId: string): Promise<CrmServiceResponse<PipelineStats[]>> {
    try {
      const opportunities = mockOpportunities.filter(o => o.enterprise_id === enterpriseId);
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
      
      const recentOpportunities = mockOpportunities
        .filter(o => o.enterprise_id === enterpriseId)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5);
      
      const recentActions = mockCommercialActions
        .filter(a => a.enterprise_id === enterpriseId)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5);
      
      const topClients = mockClients
        .filter(c => c.enterprise_id === enterpriseId)
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