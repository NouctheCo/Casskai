import {
  ThirdParty,
  ThirdPartyFormData,
  ContactPerson,
  ContactPersonFormData,
  Transaction,
  ThirdPartyBalance,
  AgingReport,
  ThirdPartyStats,
  ThirdPartyFilters,
  ThirdPartyServiceResponse,
  ThirdPartyDashboardData,
  Address,
  BankDetails,
  ExportConfig
} from '../types/third-parties.types';

// Mock data
const mockAddresses: Address[] = [
  {
    street: '123 Rue de la Paix',
    city: 'Paris',
    postal_code: '75001',
    country: 'France',
    region: 'Île-de-France'
  },
  {
    street: '456 Avenue des Champs',
    city: 'Lyon',
    postal_code: '69000',
    country: 'France',
    region: 'Auvergne-Rhône-Alpes'
  }
];

const mockBankDetails: BankDetails[] = [
  {
    bank_name: 'BNP Paribas',
    account_number: '12345678901',
    iban: 'FR1420041010050500013M02606',
    swift_code: 'BNPAFRPP',
    account_holder: 'Entreprise ABC SARL'
  },
  {
    bank_name: 'Crédit Agricole',
    account_number: '98765432101',
    iban: 'FR1420041010050500013M02607',
    swift_code: 'AGRIFRPP',
    account_holder: 'Fournisseur XYZ SA'
  }
];

const mockContacts: ContactPerson[] = [
  {
    id: '1',
    first_name: 'Jean',
    last_name: 'Dupont',
    position: 'Directeur Commercial',
    email: 'j.dupont@entreprise-abc.fr',
    phone: '+33 1 42 86 83 02',
    mobile: '+33 6 12 34 56 78',
    is_primary: true,
    notes: 'Contact principal pour toutes les négociations commerciales'
  },
  {
    id: '2',
    first_name: 'Marie',
    last_name: 'Martin',
    position: 'Responsable Achats',
    email: 'm.martin@fournisseur-xyz.fr',
    phone: '+33 4 78 92 15 33',
    is_primary: true,
    notes: 'Disponible du lundi au vendredi de 9h à 17h'
  },
  {
    id: '3',
    first_name: 'Pierre',
    last_name: 'Leblanc',
    position: 'Comptable',
    email: 'p.leblanc@entreprise-abc.fr',
    phone: '+33 1 42 86 83 05',
    is_primary: false
  }
];

const mockThirdParties: ThirdParty[] = [
  {
    id: '1',
    code: 'CL001',
    type: 'client',
    category: 'company',
    name: 'Entreprise ABC SARL',
    legal_name: 'Entreprise ABC Société à Responsabilité Limitée',
    display_name: 'ABC Corp',
    siret: '12345678901234',
    vat_number: 'FR12345678901',
    registration_number: '123456789',
    legal_form: 'SARL',
    primary_email: 'contact@entreprise-abc.fr',
    secondary_email: 'commercial@entreprise-abc.fr',
    primary_phone: '+33 1 42 86 83 02',
    secondary_phone: '+33 1 42 86 83 03',
    website: 'https://www.entreprise-abc.fr',
    billing_address: mockAddresses[0],
    shipping_address: mockAddresses[0],
    currency: 'EUR',
    payment_terms: 30,
    credit_limit: 50000,
    current_balance: 15750.50,
    total_receivables: 25800.00,
    total_payables: 0,
    bank_details: mockBankDetails[0],
    client_since: '2022-01-15',
    status: 'active',
    contacts: [mockContacts[0], mockContacts[2]],
    industry: 'Technology',
    company_size: 'medium',
    annual_revenue: 2500000,
    employee_count: 45,
    internal_notes: 'Client stratégique avec un fort potentiel de croissance',
    tags: ['stratégique', 'technologie', 'croissance'],
    enterprise_id: 'company-1',
    created_by: 'user-1',
    created_at: '2022-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z',
    last_interaction: '2024-01-18T14:22:00Z',
    preferred_language: 'fr',
    communication_preference: 'email',
    invoice_delivery_method: 'email'
  },
  {
    id: '2',
    code: 'FO001',
    type: 'supplier',
    category: 'company',
    name: 'Fournisseur XYZ SA',
    legal_name: 'Fournisseur XYZ Société Anonyme',
    siret: '98765432109876',
    vat_number: 'FR98765432109',
    primary_email: 'contact@fournisseur-xyz.fr',
    primary_phone: '+33 4 78 92 15 33',
    website: 'https://www.fournisseur-xyz.fr',
    billing_address: mockAddresses[1],
    currency: 'EUR',
    payment_terms: 45,
    credit_limit: 75000,
    current_balance: -12450.75,
    total_receivables: 0,
    total_payables: 18900.00,
    bank_details: mockBankDetails[1],
    supplier_since: '2021-06-20',
    status: 'active',
    contacts: [mockContacts[1]],
    industry: 'Manufacturing',
    company_size: 'large',
    annual_revenue: 15000000,
    employee_count: 200,
    internal_notes: 'Fournisseur fiable avec d\'excellents délais de livraison',
    tags: ['fiable', 'manufacturier', 'livraison-rapide'],
    enterprise_id: 'company-1',
    created_by: 'user-1',
    created_at: '2021-06-20T09:15:00Z',
    updated_at: '2024-01-19T11:45:00Z',
    last_interaction: '2024-01-17T09:30:00Z',
    preferred_language: 'fr',
    communication_preference: 'phone',
    invoice_delivery_method: 'email'
  },
  {
    id: '3',
    code: 'CL002',
    type: 'client',
    category: 'individual',
    name: 'Sophie Durand',
    legal_name: 'Sophie Marie Durand',
    primary_email: 's.durand@email.fr',
    primary_phone: '+33 6 98 76 54 32',
    billing_address: {
      street: '78 Rue Victor Hugo',
      city: 'Marseille',
      postal_code: '13001',
      country: 'France',
      region: 'Provence-Alpes-Côte d\'Azur'
    },
    currency: 'EUR',
    payment_terms: 15,
    current_balance: 850.00,
    total_receivables: 1200.00,
    total_payables: 0,
    client_since: '2023-03-10',
    status: 'active',
    contacts: [],
    tags: ['particulier', 'ponctuel'],
    enterprise_id: 'company-1',
    created_by: 'user-2',
    created_at: '2023-03-10T14:20:00Z',
    updated_at: '2024-01-15T16:10:00Z',
    preferred_language: 'fr',
    communication_preference: 'email',
    invoice_delivery_method: 'email'
  }
];

const mockTransactions: Transaction[] = [
  {
    id: '1',
    third_party_id: '1',
    type: 'invoice',
    direction: 'incoming',
    reference: 'FAC-2024-001',
    description: 'Prestation de conseil - Janvier 2024',
    amount: 5400.00,
    currency: 'EUR',
    transaction_date: '2024-01-15',
    due_date: '2024-02-14',
    status: 'pending',
    payment_status: 'unpaid',
    tax_amount: 900.00,
    net_amount: 4500.00,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    third_party_id: '2',
    type: 'payment',
    direction: 'outgoing',
    reference: 'PAY-2024-001',
    description: 'Paiement facture matières premières',
    amount: 3200.00,
    currency: 'EUR',
    transaction_date: '2024-01-10',
    payment_date: '2024-01-10',
    status: 'paid',
    payment_status: 'paid',
    net_amount: 3200.00,
    payment_method: 'transfer',
    created_at: '2024-01-10T14:20:00Z',
    updated_at: '2024-01-10T14:25:00Z'
  },
  {
    id: '3',
    third_party_id: '3',
    type: 'invoice',
    direction: 'incoming',
    reference: 'FAC-2024-002',
    description: 'Formation personnalisée',
    amount: 1200.00,
    currency: 'EUR',
    transaction_date: '2024-01-20',
    due_date: '2024-02-04',
    status: 'pending',
    payment_status: 'unpaid',
    tax_amount: 200.00,
    net_amount: 1000.00,
    created_at: '2024-01-20T11:45:00Z',
    updated_at: '2024-01-20T11:45:00Z'
  }
];

class ThirdPartiesService {
  // Third parties CRUD
  async getThirdParties(enterpriseId: string, filters?: ThirdPartyFilters): Promise<ThirdPartyServiceResponse<ThirdParty[]>> {
    try {
      let filteredThirdParties = mockThirdParties.filter(tp => tp.enterprise_id === enterpriseId);
      
      if (filters) {
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredThirdParties = filteredThirdParties.filter(tp =>
            tp.name.toLowerCase().includes(searchLower) ||
            tp.primary_email.toLowerCase().includes(searchLower) ||
            tp.code.toLowerCase().includes(searchLower)
          );
        }
        
        if (filters.type) {
          filteredThirdParties = filteredThirdParties.filter(tp => tp.type === filters.type);
        }
        
        if (filters.category) {
          filteredThirdParties = filteredThirdParties.filter(tp => tp.category === filters.category);
        }
        
        if (filters.status) {
          filteredThirdParties = filteredThirdParties.filter(tp => tp.status === filters.status);
        }
        
        if (filters.industry) {
          filteredThirdParties = filteredThirdParties.filter(tp => tp.industry === filters.industry);
        }
        
        if (filters.balance_status) {
          if (filters.balance_status === 'positive') {
            filteredThirdParties = filteredThirdParties.filter(tp => tp.current_balance > 0);
          } else if (filters.balance_status === 'negative') {
            filteredThirdParties = filteredThirdParties.filter(tp => tp.current_balance < 0);
          } else if (filters.balance_status === 'zero') {
            filteredThirdParties = filteredThirdParties.filter(tp => tp.current_balance === 0);
          }
        }
        
        if (filters.has_overdue) {
          // Mock logic for overdue - in real implementation would check actual due dates
          filteredThirdParties = filteredThirdParties.filter(tp => tp.current_balance > 1000);
        }
        
        if (filters.tags && filters.tags.length > 0) {
          filteredThirdParties = filteredThirdParties.filter(tp =>
            filters.tags!.some(tag => tp.tags.includes(tag))
          );
        }
      }
      
      return { data: filteredThirdParties };
    } catch (error) {
      return {
        data: [],
        error: { message: 'Erreur lors de la récupération des tiers' }
      };
    }
  }

  async getThirdPartyById(thirdPartyId: string): Promise<ThirdPartyServiceResponse<ThirdParty>> {
    try {
      const thirdParty = mockThirdParties.find(tp => tp.id === thirdPartyId);
      if (!thirdParty) {
        return {
          data: {} as ThirdParty,
          error: { message: 'Tiers non trouvé' }
        };
      }
      
      return { data: thirdParty };
    } catch (error) {
      return {
        data: {} as ThirdParty,
        error: { message: 'Erreur lors de la récupération du tiers' }
      };
    }
  }

  async createThirdParty(enterpriseId: string, formData: ThirdPartyFormData): Promise<ThirdPartyServiceResponse<ThirdParty>> {
    try {
      const newThirdParty: ThirdParty = {
        id: Date.now().toString(),
        code: this.generateThirdPartyCode(formData.type),
        type: formData.type,
        category: formData.category,
        name: formData.name,
        legal_name: formData.legal_name,
        siret: formData.siret,
        vat_number: formData.vat_number,
        primary_email: formData.primary_email,
        primary_phone: formData.primary_phone,
        website: formData.website,
        billing_address: formData.billing_address,
        shipping_address: formData.shipping_address,
        currency: formData.currency,
        payment_terms: formData.payment_terms,
        credit_limit: formData.credit_limit,
        current_balance: 0,
        total_receivables: 0,
        total_payables: 0,
        bank_details: formData.bank_details,
        client_since: formData.type === 'client' || formData.type === 'both' ? new Date().toISOString().split('T')[0] : undefined,
        supplier_since: formData.type === 'supplier' || formData.type === 'both' ? new Date().toISOString().split('T')[0] : undefined,
        status: 'active',
        contacts: [],
        industry: formData.industry,
        company_size: formData.company_size,
        internal_notes: formData.internal_notes,
        tags: formData.tags,
        enterprise_id: enterpriseId,
        created_by: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        preferred_language: formData.preferred_language,
        communication_preference: formData.communication_preference,
        invoice_delivery_method: formData.invoice_delivery_method
      };
      
      mockThirdParties.push(newThirdParty);
      return { data: newThirdParty };
    } catch (error) {
      return {
        data: {} as ThirdParty,
        error: { message: 'Erreur lors de la création du tiers' }
      };
    }
  }

  async updateThirdParty(thirdPartyId: string, formData: Partial<ThirdPartyFormData>): Promise<ThirdPartyServiceResponse<ThirdParty>> {
    try {
      const thirdPartyIndex = mockThirdParties.findIndex(tp => tp.id === thirdPartyId);
      if (thirdPartyIndex === -1) {
        return {
          data: {} as ThirdParty,
          error: { message: 'Tiers non trouvé' }
        };
      }
      
      mockThirdParties[thirdPartyIndex] = {
        ...mockThirdParties[thirdPartyIndex],
        ...formData,
        updated_at: new Date().toISOString()
      };
      
      return { data: mockThirdParties[thirdPartyIndex] };
    } catch (error) {
      return {
        data: {} as ThirdParty,
        error: { message: 'Erreur lors de la mise à jour du tiers' }
      };
    }
  }

  async deleteThirdParty(thirdPartyId: string): Promise<ThirdPartyServiceResponse<boolean>> {
    try {
      const thirdPartyIndex = mockThirdParties.findIndex(tp => tp.id === thirdPartyId);
      if (thirdPartyIndex === -1) {
        return {
          data: false,
          error: { message: 'Tiers non trouvé' }
        };
      }
      
      mockThirdParties.splice(thirdPartyIndex, 1);
      return { data: true };
    } catch (error) {
      return {
        data: false,
        error: { message: 'Erreur lors de la suppression du tiers' }
      };
    }
  }

  // Contact management
  async addContact(thirdPartyId: string, contactData: ContactPersonFormData): Promise<ThirdPartyServiceResponse<ContactPerson>> {
    try {
      const thirdParty = mockThirdParties.find(tp => tp.id === thirdPartyId);
      if (!thirdParty) {
        return {
          data: {} as ContactPerson,
          error: { message: 'Tiers non trouvé' }
        };
      }
      
      const newContact: ContactPerson = {
        id: Date.now().toString(),
        ...contactData
      };
      
      thirdParty.contacts.push(newContact);
      thirdParty.updated_at = new Date().toISOString();
      
      return { data: newContact };
    } catch (error) {
      return {
        data: {} as ContactPerson,
        error: { message: 'Erreur lors de l\'ajout du contact' }
      };
    }
  }

  async updateContact(thirdPartyId: string, contactId: string, contactData: Partial<ContactPersonFormData>): Promise<ThirdPartyServiceResponse<ContactPerson>> {
    try {
      const thirdParty = mockThirdParties.find(tp => tp.id === thirdPartyId);
      if (!thirdParty) {
        return {
          data: {} as ContactPerson,
          error: { message: 'Tiers non trouvé' }
        };
      }
      
      const contactIndex = thirdParty.contacts.findIndex(c => c.id === contactId);
      if (contactIndex === -1) {
        return {
          data: {} as ContactPerson,
          error: { message: 'Contact non trouvé' }
        };
      }
      
      thirdParty.contacts[contactIndex] = {
        ...thirdParty.contacts[contactIndex],
        ...contactData
      };
      
      thirdParty.updated_at = new Date().toISOString();
      
      return { data: thirdParty.contacts[contactIndex] };
    } catch (error) {
      return {
        data: {} as ContactPerson,
        error: { message: 'Erreur lors de la mise à jour du contact' }
      };
    }
  }

  async deleteContact(thirdPartyId: string, contactId: string): Promise<ThirdPartyServiceResponse<boolean>> {
    try {
      const thirdParty = mockThirdParties.find(tp => tp.id === thirdPartyId);
      if (!thirdParty) {
        return {
          data: false,
          error: { message: 'Tiers non trouvé' }
        };
      }
      
      const contactIndex = thirdParty.contacts.findIndex(c => c.id === contactId);
      if (contactIndex === -1) {
        return {
          data: false,
          error: { message: 'Contact non trouvé' }
        };
      }
      
      thirdParty.contacts.splice(contactIndex, 1);
      thirdParty.updated_at = new Date().toISOString();
      
      return { data: true };
    } catch (error) {
      return {
        data: false,
        error: { message: 'Erreur lors de la suppression du contact' }
      };
    }
  }

  // Transactions
  async getTransactions(thirdPartyId: string): Promise<ThirdPartyServiceResponse<Transaction[]>> {
    try {
      const transactions = mockTransactions.filter(t => t.third_party_id === thirdPartyId);
      return { data: transactions };
    } catch (error) {
      return {
        data: [],
        error: { message: 'Erreur lors de la récupération des transactions' }
      };
    }
  }

  // Balance and aging
  async getThirdPartyBalance(thirdPartyId: string): Promise<ThirdPartyServiceResponse<ThirdPartyBalance>> {
    try {
      const thirdParty = mockThirdParties.find(tp => tp.id === thirdPartyId);
      if (!thirdParty) {
        return {
          data: {} as ThirdPartyBalance,
          error: { message: 'Tiers non trouvé' }
        };
      }
      
      const transactions = mockTransactions.filter(t => t.third_party_id === thirdPartyId);
      const overdueTransactions = transactions.filter(t => 
        t.status === 'overdue' || (t.due_date && new Date(t.due_date) < new Date())
      );
      
      const balance: ThirdPartyBalance = {
        third_party_id: thirdParty.id,
        third_party_name: thirdParty.name,
        current_balance: thirdParty.current_balance,
        receivables: thirdParty.total_receivables,
        payables: thirdParty.total_payables,
        overdue_amount: overdueTransactions.reduce((sum, t) => sum + t.amount, 0),
        overdue_count: overdueTransactions.length,
        last_transaction_date: transactions.length > 0 ? transactions[0].transaction_date : undefined,
        credit_limit: thirdParty.credit_limit,
        credit_available: (thirdParty.credit_limit || 0) - thirdParty.current_balance,
        payment_history: {
          on_time_payments: Math.floor(Math.random() * 20) + 10,
          late_payments: Math.floor(Math.random() * 5) + 1,
          average_payment_delay: Math.floor(Math.random() * 10) + 2
        }
      };
      
      return { data: balance };
    } catch (error) {
      return {
        data: {} as ThirdPartyBalance,
        error: { message: 'Erreur lors de la récupération du solde' }
      };
    }
  }

  async getAgingReport(enterpriseId: string): Promise<ThirdPartyServiceResponse<AgingReport[]>> {
    try {
      const enterpriseThirdParties = mockThirdParties.filter(tp => tp.enterprise_id === enterpriseId);
      
      const agingReports = enterpriseThirdParties.map(tp => {
        // Mock aging buckets calculation
        const totalOutstanding = tp.total_receivables;
        const current = totalOutstanding * 0.4;
        const bucket30 = totalOutstanding * 0.3;
        const bucket60 = totalOutstanding * 0.2;
        const bucket90 = totalOutstanding * 0.08;
        const bucketOver120 = totalOutstanding * 0.02;
        
        return {
          third_party_id: tp.id,
          third_party_name: tp.name,
          aging_buckets: {
            current,
            bucket_30: bucket30,
            bucket_60: bucket60,
            bucket_90: bucket90,
            bucket_over_120: bucketOver120
          },
          total_outstanding: totalOutstanding,
          oldest_invoice_date: tp.client_since
        };
      });
      
      return { data: agingReports };
    } catch (error) {
      return {
        data: [],
        error: { message: 'Erreur lors de la génération du rapport d\'ancienneté' }
      };
    }
  }

  // Dashboard
  async getDashboardData(enterpriseId: string): Promise<ThirdPartyServiceResponse<ThirdPartyDashboardData>> {
    try {
      const enterpriseThirdParties = mockThirdParties.filter(tp => tp.enterprise_id === enterpriseId);
      
      const stats: ThirdPartyStats = {
        total_third_parties: enterpriseThirdParties.length,
        active_clients: enterpriseThirdParties.filter(tp => tp.type === 'client' && tp.status === 'active').length,
        active_suppliers: enterpriseThirdParties.filter(tp => tp.type === 'supplier' && tp.status === 'active').length,
        new_this_month: enterpriseThirdParties.filter(tp => {
          const createdDate = new Date(tp.created_at);
          const now = new Date();
          return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
        }).length,
        total_receivables: enterpriseThirdParties.reduce((sum, tp) => sum + tp.total_receivables, 0),
        total_payables: enterpriseThirdParties.reduce((sum, tp) => sum + tp.total_payables, 0),
        overdue_receivables: enterpriseThirdParties.reduce((sum, tp) => sum + (tp.current_balance > 1000 ? tp.current_balance : 0), 0),
        overdue_payables: enterpriseThirdParties.reduce((sum, tp) => sum + (tp.current_balance < -1000 ? Math.abs(tp.current_balance) : 0), 0),
        top_clients_by_revenue: enterpriseThirdParties
          .filter(tp => tp.type === 'client')
          .sort((a, b) => b.total_receivables - a.total_receivables)
          .slice(0, 5)
          .map(tp => ({
            id: tp.id,
            name: tp.name,
            revenue: tp.total_receivables
          })),
        top_suppliers_by_spending: enterpriseThirdParties
          .filter(tp => tp.type === 'supplier')
          .sort((a, b) => b.total_payables - a.total_payables)
          .slice(0, 5)
          .map(tp => ({
            id: tp.id,
            name: tp.name,
            spending: tp.total_payables
          }))
      };
      
      const agingReportsResponse = await this.getAgingReport(enterpriseId);
      const agingSummary = agingReportsResponse.data || [];
      
      const dashboardData: ThirdPartyDashboardData = {
        stats,
        recent_third_parties: enterpriseThirdParties.slice(0, 5),
        aging_summary: agingSummary.slice(0, 10),
        recent_transactions: mockTransactions.slice(0, 5),
        alerts: {
          overdue_invoices: Math.floor(Math.random() * 5) + 2,
          credit_limit_exceeded: Math.floor(Math.random() * 3) + 1,
          missing_information: Math.floor(Math.random() * 8) + 3
        }
      };
      
      return { data: dashboardData };
    } catch (error) {
      return {
        data: {} as ThirdPartyDashboardData,
        error: { message: 'Erreur lors de la récupération des données du tableau de bord' }
      };
    }
  }

  // Export functions
  exportThirdPartiesToCSV(thirdParties: ThirdParty[], config: ExportConfig, filename: string = 'tiers') {
    const headers = [
      'Code',
      'Type',
      'Nom',
      'Email',
      'Téléphone',
      'Solde actuel',
      'Créances',
      'Dettes',
      'Statut',
      'Date de création'
    ];
    
    if (config.include_contacts) {
      headers.push('Contacts');
    }
    
    const csvContent = [
      headers.join(','),
      ...thirdParties.map(tp => {
        const row = [
          `"${tp.code}"`,
          `"${tp.type}"`,
          `"${tp.name}"`,
          `"${tp.primary_email}"`,
          `"${tp.primary_phone}"`,
          tp.current_balance.toFixed(2),
          tp.total_receivables.toFixed(2),
          tp.total_payables.toFixed(2),
          `"${tp.status}"`,
          new Date(tp.created_at).toLocaleDateString('fr-FR')
        ];
        
        if (config.include_contacts) {
          const contactsStr = tp.contacts.map(c => `${c.first_name} ${c.last_name} (${c.email})`).join('; ');
          row.push(`"${contactsStr}"`);
        }
        
        return row.join(',');
      })
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

  generatePDFReport(thirdParties: ThirdParty[], config: ExportConfig): void {
    // Mock PDF generation
    console.log(`Génération du rapport PDF pour ${thirdParties.length} tiers`);
    // In a real implementation, you would use a library like jsPDF or call a backend service
  }

  // Utility functions
  private generateThirdPartyCode(type: string): string {
    const prefix = type === 'client' ? 'CL' : type === 'supplier' ? 'FO' : 'TP';
    const number = String(mockThirdParties.length + 1).padStart(3, '0');
    return `${prefix}${number}`;
  }
}

export const thirdPartiesService = new ThirdPartiesService();