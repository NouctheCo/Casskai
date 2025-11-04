export const defaultChartOfAccounts = [
  { account_number: '101000', name: 'Capital social', type: 'EQUITY', class: 1, currency: 'EUR', is_active: true },
  { account_number: '106000', name: 'Réserves', type: 'EQUITY', class: 1, currency: 'EUR', is_active: true },
  { account_number: '120000', name: 'Résultat de l\'exercice', type: 'EQUITY', class: 1, currency: 'EUR', is_active: true },
  
  { account_number: '211000', name: 'Terrains', type: 'ASSET', class: 2, currency: 'EUR', is_active: true },
  { account_number: '213000', name: 'Constructions', type: 'ASSET', class: 2, currency: 'EUR', is_active: true },
  { account_number: '218000', name: 'Autres immobilisations corporelles', type: 'ASSET', class: 2, currency: 'EUR', is_active: true },
  
  { account_number: '401000', name: 'Fournisseurs', type: 'LIABILITY', class: 4, currency: 'EUR', is_active: true },
  { account_number: '411000', name: 'Clients', type: 'ASSET', class: 4, currency: 'EUR', is_active: true },
  { account_number: '421000', name: 'Personnel - rémunérations dues', type: 'LIABILITY', class: 4, currency: 'EUR', is_active: true },
  { account_number: '445660', name: 'TVA déductible sur ABS', type: 'ASSET', class: 4, currency: 'EUR', is_active: true },
  { account_number: '445710', name: 'TVA collectée', type: 'LIABILITY', class: 4, currency: 'EUR', is_active: true },
  
  { account_number: '512000', name: 'Banque', type: 'ASSET', class: 5, currency: 'EUR', is_active: true },
  { account_number: '530000', name: 'Caisse', type: 'ASSET', class: 5, currency: 'EUR', is_active: true },
  
  { account_number: '601000', name: 'Achats stockés - Matières premières', type: 'EXPENSE', class: 6, currency: 'EUR', is_active: true },
  { account_number: '607000', name: 'Achats de marchandises', type: 'EXPENSE', class: 6, currency: 'EUR', is_active: true },
  { account_number: '626000', name: 'Frais postaux et de télécommunications', type: 'EXPENSE', class: 6, currency: 'EUR', is_active: true },
  { account_number: '641000', name: 'Rémunérations du personnel', type: 'EXPENSE', class: 6, currency: 'EUR', is_active: true },
  
  { account_number: '701000', name: 'Ventes de produits finis', type: 'REVENUE', class: 7, currency: 'EUR', is_active: true },
  { account_number: '706000', name: 'Prestations de services', type: 'REVENUE', class: 7, currency: 'EUR', is_active: true },
  { account_number: '707000', name: 'Ventes de marchandises', type: 'REVENUE', class: 7, currency: 'EUR', is_active: true }
];

export const defaultJournals = [
  { code: 'VE', name: 'Journal des ventes', type: 'sale', description: 'Enregistrement des factures de vente', is_active: true },
  { code: 'AC', name: 'Journal des achats', type: 'purchase', description: 'Enregistrement des factures d\'achat', is_active: true },
  { code: 'BQ', name: 'Journal de banque', type: 'bank', description: 'Mouvements bancaires', is_active: true },
  { code: 'CA', name: 'Journal de caisse', type: 'cash', description: 'Mouvements de caisse', is_active: true },
  { code: 'OD', name: 'Opérations diverses', type: 'miscellaneous', description: 'Écritures diverses et de régularisation', is_active: true }
];
