import { Purchase, PurchaseFormData, PurchaseFilters, PurchaseStats, Supplier } from '../types/purchase.types';

// Service error interface
interface ServiceError {
  message: string;
  code?: string;
  details?: unknown;
}

// Mock data for development
const mockPurchases: Purchase[] = [
  {
    id: '1',
    invoice_number: 'FAC-2024-001',
    purchase_date: '2024-01-15',
    supplier_id: 'sup-1',
    supplier_name: 'Fourniture Bureau Pro',
    description: 'Matériel de bureau - Ordinateurs',
    amount_ht: 2500.00,
    tva_amount: 500.00,
    amount_ttc: 3000.00,
    tva_rate: 20,
    payment_status: 'paid',
    payment_date: '2024-01-30',
    due_date: '2024-02-15',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-30T14:30:00Z',
    company_id: 'company-1'
  },
  {
    id: '2',
    invoice_number: 'FAC-2024-002',
    purchase_date: '2024-01-20',
    supplier_id: 'sup-2',
    supplier_name: 'Services Comptables SA',
    description: 'Prestations de conseil comptable',
    amount_ht: 1200.00,
    tva_amount: 240.00,
    amount_ttc: 1440.00,
    tva_rate: 20,
    payment_status: 'pending',
    due_date: '2024-02-20',
    created_at: '2024-01-20T09:15:00Z',
    updated_at: '2024-01-20T09:15:00Z',
    company_id: 'company-1'
  },
  {
    id: '3',
    invoice_number: 'FAC-2024-003',
    purchase_date: '2024-01-10',
    supplier_id: 'sup-3',
    supplier_name: 'Maintenance Informatique',
    description: 'Maintenance serveurs et réseaux',
    amount_ht: 800.00,
    tva_amount: 160.00,
    amount_ttc: 960.00,
    tva_rate: 20,
    payment_status: 'overdue',
    due_date: '2024-01-25',
    created_at: '2024-01-10T16:45:00Z',
    updated_at: '2024-01-10T16:45:00Z',
    company_id: 'company-1'
  }
];

const mockSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Fourniture Bureau Pro',
    email: 'contact@bureau-pro.fr',
    phone: '01 23 45 67 89',
    address: '123 Avenue des Affaires, 75001 Paris',
    company_id: 'company-1'
  },
  {
    id: 'sup-2',
    name: 'Services Comptables SA',
    email: 'info@services-comptables.fr',
    phone: '01 34 56 78 90',
    address: '456 Rue de la Comptabilité, 75002 Paris',
    company_id: 'company-1'
  },
  {
    id: 'sup-3',
    name: 'Maintenance Informatique',
    email: 'support@maintenance-info.fr',
    phone: '01 45 67 89 01',
    address: '789 Boulevard Technologique, 75003 Paris',
    company_id: 'company-1'
  }
];

// Helper function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const purchasesService = {
  // Get all purchases with filters
  async getPurchases(companyId: string, filters: PurchaseFilters = {}): Promise<{ data: Purchase[]; error?: ServiceError }> {
    await delay(500); // Simulate API call
    
    let filteredPurchases = mockPurchases.filter(p => p.company_id === companyId);
    
    // Apply filters
    if (filters.supplier_id) {
      filteredPurchases = filteredPurchases.filter(p => p.supplier_id === filters.supplier_id);
    }
    
    if (filters.payment_status && filters.payment_status !== 'all') {
      filteredPurchases = filteredPurchases.filter(p => p.payment_status === filters.payment_status);
    }
    
    if (filters.date_from) {
      filteredPurchases = filteredPurchases.filter(p => p.purchase_date >= filters.date_from!);
    }
    
    if (filters.date_to) {
      filteredPurchases = filteredPurchases.filter(p => p.purchase_date <= filters.date_to!);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredPurchases = filteredPurchases.filter(p => 
        p.invoice_number.toLowerCase().includes(searchLower) ||
        p.supplier_name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }
    
    return { data: filteredPurchases };
  },

  // Get purchase by ID
  async getPurchaseById(id: string): Promise<{ data: Purchase | null; error?: ServiceError }> {
    await delay(300);
    const purchase = mockPurchases.find(p => p.id === id);
    return { data: purchase || null };
  },

  // Create new purchase
  async createPurchase(companyId: string, purchaseData: PurchaseFormData): Promise<{ data: Purchase | null; error?: ServiceError }> {
    await delay(800);
    
    // Check for duplicate invoice number
    const existingPurchase = mockPurchases.find(p => 
      p.company_id === companyId && p.invoice_number === purchaseData.invoice_number
    );
    
    if (existingPurchase) {
      return { 
        data: null, 
        error: { message: 'Une facture avec ce numéro existe déjà' } 
      };
    }
    
    const newPurchase: Purchase = {
      id: Date.now().toString(),
      invoice_number: purchaseData.invoice_number,
      purchase_date: purchaseData.purchase_date,
      supplier_id: purchaseData.supplier_id,
      supplier_name: mockSuppliers.find(s => s.id === purchaseData.supplier_id)?.name || 'Fournisseur inconnu',
      description: purchaseData.description,
      amount_ht: purchaseData.amount_ht,
      tva_amount: purchaseData.amount_ht * (purchaseData.tva_rate / 100),
      amount_ttc: purchaseData.amount_ht * (1 + purchaseData.tva_rate / 100),
      tva_rate: purchaseData.tva_rate,
      payment_status: 'pending',
      due_date: purchaseData.due_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      company_id: companyId
    };
    
    mockPurchases.push(newPurchase);
    return { data: newPurchase };
  },

  // Update purchase
  async updatePurchase(id: string, purchaseData: Partial<PurchaseFormData>): Promise<{ data: Purchase | null; error?: ServiceError }> {
    await delay(600);
    
    const purchaseIndex = mockPurchases.findIndex(p => p.id === id);
    if (purchaseIndex === -1) {
      return { data: null, error: { message: 'Achat introuvable' } };
    }
    
    const existingPurchase = mockPurchases[purchaseIndex];
    
    // Check for duplicate invoice number if it's being changed
    if (purchaseData.invoice_number && purchaseData.invoice_number !== existingPurchase.invoice_number) {
      const duplicatePurchase = mockPurchases.find(p => 
        p.company_id === existingPurchase.company_id && 
        p.invoice_number === purchaseData.invoice_number &&
        p.id !== id
      );
      
      if (duplicatePurchase) {
        return { 
          data: null, 
          error: { message: 'Une facture avec ce numéro existe déjà' } 
        };
      }
    }
    
    const updatedPurchase: Purchase = {
      ...existingPurchase,
      invoice_number: purchaseData.invoice_number ?? existingPurchase.invoice_number,
      purchase_date: purchaseData.purchase_date ?? existingPurchase.purchase_date,
      supplier_id: purchaseData.supplier_id ?? existingPurchase.supplier_id,
      description: purchaseData.description ?? existingPurchase.description,
      amount_ht: purchaseData.amount_ht ?? existingPurchase.amount_ht,
      tva_rate: purchaseData.tva_rate ?? existingPurchase.tva_rate,
      due_date: purchaseData.due_date ?? existingPurchase.due_date,
      tva_amount: purchaseData.amount_ht ? purchaseData.amount_ht * ((purchaseData.tva_rate || existingPurchase.tva_rate) / 100) : existingPurchase.tva_amount,
      amount_ttc: purchaseData.amount_ht ? purchaseData.amount_ht * (1 + (purchaseData.tva_rate || existingPurchase.tva_rate) / 100) : existingPurchase.amount_ttc,
      supplier_name: purchaseData.supplier_id ?
        mockSuppliers.find(s => s.id === purchaseData.supplier_id)?.name || existingPurchase.supplier_name :
        existingPurchase.supplier_name,
      updated_at: new Date().toISOString()
    };
    
    mockPurchases[purchaseIndex] = updatedPurchase;
    return { data: updatedPurchase };
  },

  // Delete purchase
  async deletePurchase(id: string): Promise<{ data: boolean; error?: ServiceError }> {
    await delay(400);
    
    const purchaseIndex = mockPurchases.findIndex(p => p.id === id);
    if (purchaseIndex === -1) {
      return { data: false, error: { message: 'Achat introuvable' } };
    }
    
    mockPurchases.splice(purchaseIndex, 1);
    return { data: true };
  },

  // Mark purchase as paid
  async markAsPaid(id: string, paymentDate?: string): Promise<{ data: Purchase | null; error?: ServiceError }> {
    await delay(300);
    
    const purchaseIndex = mockPurchases.findIndex(p => p.id === id);
    if (purchaseIndex === -1) {
      return { data: null, error: { message: 'Achat introuvable' } };
    }
    
    mockPurchases[purchaseIndex] = {
      ...mockPurchases[purchaseIndex],
      payment_status: 'paid',
      payment_date: paymentDate || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    };
    
    return { data: mockPurchases[purchaseIndex] };
  },

  // Get purchase statistics
  async getPurchaseStats(companyId: string): Promise<{ data: PurchaseStats; error?: ServiceError }> {
    await delay(200);
    
    const companyPurchases = mockPurchases.filter(p => p.company_id === companyId);
    
    const stats: PurchaseStats = {
      total_purchases: companyPurchases.length,
      total_amount: companyPurchases.reduce((sum, p) => sum + p.amount_ttc, 0),
      pending_payments: companyPurchases.filter(p => p.payment_status === 'pending').length,
      overdue_payments: companyPurchases.filter(p => p.payment_status === 'overdue').length
    };
    
    return { data: stats };
  },

  // Get suppliers
  async getSuppliers(companyId: string): Promise<{ data: Supplier[]; error?: ServiceError }> {
    await delay(300);
    
    const companySuppliers = mockSuppliers.filter(s => s.company_id === companyId);
    return { data: companySuppliers };
  },

  // Export purchases to CSV
  async exportToCsv(companyId: string, filters: PurchaseFilters = {}): Promise<{ data: string; error?: ServiceError }> {
    await delay(1000);
    
    const { data: purchases } = await this.getPurchases(companyId, filters);
    
    const headers = [
      'Numéro facture',
      'Date d\'achat',
      'Fournisseur',
      'Description',
      'Montant HT',
      'TVA',
      'Montant TTC',
      'Statut paiement',
      'Date d\'échéance'
    ];
    
    const csvData = [
      headers.join(','),
      ...purchases.map(p => [
        p.invoice_number,
        p.purchase_date,
        `"${p.supplier_name}"`,
        `"${p.description}"`,
        p.amount_ht.toFixed(2),
        p.tva_amount.toFixed(2),
        p.amount_ttc.toFixed(2),
        p.payment_status,
        p.due_date
      ].join(','))
    ].join('\n');
    
    return { data: csvData };
  }
};