import { supabase } from '@/lib/supabase';

interface ChartOfAccountsConfig {
  country: string;
  standard: 'PCG' | 'SYSCOHADA' | 'IFRS' | 'US_GAAP';
  currency: string;
  fiscalYearEnd: string;
}

interface SampleDataConfig {
  includeTransactions: boolean;
  includeCustomers: boolean;
  includeSuppliers: boolean;
  includeProducts: boolean;
  transactionCount: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export class SampleDataService {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  // Plans comptables par pays/standard
  private getChartOfAccounts(config: ChartOfAccountsConfig) {
    const baseAccounts = {
      PCG: [
        // Classe 1 - Comptes de capitaux (10XXXX)
        { code: '101100', name: 'Capital social', type: 'equity', class: 1 },
        { code: '106100', name: 'Réserves légales', type: 'equity', class: 1 },
        { code: '106800', name: 'Autres réserves', type: 'equity', class: 1 },
        { code: '110000', name: 'Report à nouveau', type: 'equity', class: 1 },
        { code: '120000', name: 'Résultat de l\'exercice (bénéfice)', type: 'equity', class: 1 },
        { code: '129000', name: 'Résultat de l\'exercice (perte)', type: 'equity', class: 1 },

        // Classe 2 - Comptes d'immobilisations (20XXXX)
        { code: '201100', name: 'Frais d\'établissement', type: 'asset', class: 2 },
        { code: '211100', name: 'Terrains', type: 'asset', class: 2 },
        { code: '212100', name: 'Agencements et aménagements de terrains', type: 'asset', class: 2 },
        { code: '213100', name: 'Constructions', type: 'asset', class: 2 },
        { code: '215100', name: 'Installations techniques, matériels et outillages', type: 'asset', class: 2 },
        { code: '218100', name: 'Autres immobilisations corporelles', type: 'asset', class: 2 },
        { code: '231200', name: 'Immobilisations en cours', type: 'asset', class: 2 },
        { code: '281200', name: 'Amortissements des immobilisations en cours', type: 'asset', class: 2 },
        { code: '283100', name: 'Amortissements des constructions', type: 'asset', class: 2 },
        { code: '283500', name: 'Amortissements des installations techniques', type: 'asset', class: 2 },

        // Classe 3 - Comptes de stocks (30XXXX)
        { code: '301000', name: 'Matières premières A', type: 'asset', class: 3 },
        { code: '302000', name: 'Matières premières B', type: 'asset', class: 3 },
        { code: '310000', name: 'Matières et fournitures consommables', type: 'asset', class: 3 },
        { code: '320000', name: 'Emballages', type: 'asset', class: 3 },
        { code: '330000', name: 'Produits en cours', type: 'asset', class: 3 },
        { code: '340000', name: 'Produits intermédiaires', type: 'asset', class: 3 },
        { code: '350000', name: 'Produits résiduels', type: 'asset', class: 3 },
        { code: '360000', name: 'Produits finis', type: 'asset', class: 3 },
        { code: '370000', name: 'Marchandises A', type: 'asset', class: 3 },
        { code: '371000', name: 'Marchandises B', type: 'asset', class: 3 },
        { code: '390000', name: 'Dépréciations des stocks', type: 'asset', class: 3 },

        // Classe 4 - Comptes de tiers (40XXXX)
        { code: '401100', name: 'Fournisseurs', type: 'liability', class: 4 },
        { code: '401700', name: 'Fournisseurs - Achats de biens', type: 'liability', class: 4 },
        { code: '405100', name: 'Fournisseurs d\'immobilisations', type: 'liability', class: 4 },
        { code: '408100', name: 'Fournisseurs - Retenues de garantie', type: 'liability', class: 4 },
        { code: '409100', name: 'Fournisseurs - Débiteurs', type: 'liability', class: 4 },
        { code: '411100', name: 'Clients', type: 'asset', class: 4 },
        { code: '413100', name: 'Clients - Effets à recevoir', type: 'asset', class: 4 },
        { code: '416100', name: 'Clients douteux ou litigieux', type: 'asset', class: 4 },
        { code: '418100', name: 'Clients - Produits non encore facturés', type: 'asset', class: 4 },
        { code: '421100', name: 'Personnel - Rémunérations dues', type: 'liability', class: 4 },
        { code: '422100', name: 'Personnel - Charges sociales', type: 'liability', class: 4 },
        { code: '424100', name: 'Participation des salariés aux résultats', type: 'liability', class: 4 },
        { code: '425100', name: 'Personnel - Avances et acomptes', type: 'asset', class: 4 },
        { code: '426100', name: 'Personnel - Dépôts', type: 'liability', class: 4 },
        { code: '431100', name: 'Sécurité sociale', type: 'liability', class: 4 },
        { code: '437100', name: 'Autres organismes sociaux', type: 'liability', class: 4 },
        { code: '441100', name: 'État - Impôts sur les bénéfices', type: 'liability', class: 4 },
        { code: '442100', name: 'État - Autres impôts et taxes', type: 'liability', class: 4 },
        { code: '443100', name: 'État - Impôts sur les sociétés', type: 'liability', class: 4 },
        { code: '444100', name: 'État - Taxes sur le chiffre d\'affaires', type: 'liability', class: 4 },
        { code: '445200', name: 'TVA due intracommunautaire', type: 'liability', class: 4 },
        { code: '445500', name: 'TVA à décaisser', type: 'liability', class: 4 },
        { code: '445600', name: 'TVA déductible sur autres biens et services', type: 'asset', class: 4 },
        { code: '445700', name: 'TVA collectée', type: 'liability', class: 4 },
        { code: '445800', name: 'TVA assimilée', type: 'liability', class: 4 },
        { code: '448100', name: 'État - Charges à payer', type: 'liability', class: 4 },
        { code: '451100', name: 'Groupe - Comptes courants', type: 'asset', class: 4 },
        { code: '455100', name: 'Associés - Comptes courants', type: 'asset', class: 4 },
        { code: '456100', name: 'Associés - Comptes d\'apport en société', type: 'liability', class: 4 },
        { code: '457100', name: 'Associés - Dividendes à payer', type: 'liability', class: 4 },
        { code: '471100', name: 'Comptes d\'attente', type: 'asset', class: 4 },
        { code: '475100', name: 'Comptes de régularisation actif', type: 'asset', class: 4 },
        { code: '477100', name: 'Comptes de régularisation passif', type: 'liability', class: 4 },

        // Classe 5 - Comptes financiers (50XXXX)
        { code: '501100', name: 'Valeurs mobilières de placement', type: 'asset', class: 5 },
        { code: '502100', name: 'Retenues de garantie', type: 'asset', class: 5 },
        { code: '503100', name: 'Titres de participation', type: 'asset', class: 5 },
        { code: '511100', name: 'Banques - Compte chèque', type: 'asset', class: 5 },
        { code: '512100', name: 'Banques - Compte courant', type: 'asset', class: 5 },
        { code: '514100', name: 'Chèques de banque', type: 'asset', class: 5 },
        { code: '515100', name: 'Banques - Crédits de trésorerie', type: 'asset', class: 5 },
        { code: '516100', name: 'Banques - Crédits mobilisés', type: 'asset', class: 5 },
        { code: '517100', name: 'Banques - Intérêts courus', type: 'asset', class: 5 },
        { code: '518100', name: 'Banques - Concours bancaires courants', type: 'asset', class: 5 },
        { code: '519100', name: 'Banques - Crédits de trésorerie', type: 'liability', class: 5 },
        { code: '530100', name: 'Caisse', type: 'asset', class: 5 },
        { code: '540100', name: 'Chèques postaux', type: 'asset', class: 5 },
        { code: '550100', name: 'Régies d\'avances et accréditifs', type: 'asset', class: 5 },

        // Classe 6 - Comptes de charges (60XXXX)
        { code: '601100', name: 'Achats de matières premières', type: 'expense', class: 6 },
        { code: '602100', name: 'Achats de matières et fournitures consommables', type: 'expense', class: 6 },
        { code: '603100', name: 'Variations des stocks de matières premières', type: 'expense', class: 6 },
        { code: '604100', name: 'Achats d\'études et prestations de services', type: 'expense', class: 6 },
        { code: '605100', name: 'Achats de matériels, équipements et travaux', type: 'expense', class: 6 },
        { code: '606100', name: 'Achats non stockés de matières et fournitures', type: 'expense', class: 6 },
        { code: '607100', name: 'Achats de marchandises', type: 'expense', class: 6 },
        { code: '608100', name: 'Frais accessoires sur achats', type: 'expense', class: 6 },
        { code: '609100', name: 'Rabais, remises et ristournes obtenus', type: 'expense', class: 6 },
        { code: '611100', name: 'Sous-traitance générale', type: 'expense', class: 6 },
        { code: '612100', name: 'Redevances de crédit-bail', type: 'expense', class: 6 },
        { code: '613100', name: 'Locations', type: 'expense', class: 6 },
        { code: '614100', name: 'Charges locatives', type: 'expense', class: 6 },
        { code: '615100', name: 'Entretien et réparations', type: 'expense', class: 6 },
        { code: '616100', name: 'Primes d\'assurance', type: 'expense', class: 6 },
        { code: '617100', name: 'Études et recherches', type: 'expense', class: 6 },
        { code: '618100', name: 'Divers', type: 'expense', class: 6 },
        { code: '621100', name: 'Personnel extérieur à l\'entreprise', type: 'expense', class: 6 },
        { code: '622100', name: 'Rémunérations d\'intermédiaires', type: 'expense', class: 6 },
        { code: '623100', name: 'Publicité, publications, relations publiques', type: 'expense', class: 6 },
        { code: '624100', name: 'Transports de biens et transports collectifs', type: 'expense', class: 6 },
        { code: '625100', name: 'Déplacements, missions et réceptions', type: 'expense', class: 6 },
        { code: '626100', name: 'Frais postaux et de télécommunications', type: 'expense', class: 6 },
        { code: '627100', name: 'Services bancaires et assimilés', type: 'expense', class: 6 },
        { code: '628100', name: 'Divers', type: 'expense', class: 6 },
        { code: '631100', name: 'Impôts, taxes et versements assimilés', type: 'expense', class: 6 },
        { code: '633100', name: 'Impôts sur les bénéfices', type: 'expense', class: 6 },
        { code: '635100', name: 'Autres impôts, taxes et versements assimilés', type: 'expense', class: 6 },
        { code: '641100', name: 'Rémunérations du personnel', type: 'expense', class: 6 },
        { code: '642100', name: 'Charges sociales', type: 'expense', class: 6 },
        { code: '643100', name: 'Charges sociales sur congés à payer', type: 'expense', class: 6 },
        { code: '644100', name: 'Rémunération des gérants', type: 'expense', class: 6 },
        { code: '645100', name: 'Charges de sécurité sociale et de prévoyance', type: 'expense', class: 6 },
        { code: '646100', name: 'Cotisations sociales personnelles', type: 'expense', class: 6 },
        { code: '647100', name: 'Autres charges sociales', type: 'expense', class: 6 },
        { code: '651100', name: 'Charges dépréciations des immobilisations', type: 'expense', class: 6 },
        { code: '652100', name: 'Charges dépréciations des stocks', type: 'expense', class: 6 },
        { code: '653100', name: 'Charges dépréciations des créances', type: 'expense', class: 6 },
        { code: '654100', name: 'Charges pour risques à court terme', type: 'expense', class: 6 },
        { code: '655100', name: 'Charges pour risques à long terme', type: 'expense', class: 6 },
        { code: '658100', name: 'Charges diverses de gestion courante', type: 'expense', class: 6 },
        { code: '661100', name: 'Charges d\'intérêts', type: 'expense', class: 6 },
        { code: '662100', name: 'Charges sur titres de placement', type: 'expense', class: 6 },
        { code: '663100', name: 'Escomptes accordés', type: 'expense', class: 6 },
        { code: '664100', name: 'Pertes sur créances irrécouvrables', type: 'expense', class: 6 },
        { code: '665100', name: 'Pertes de change', type: 'expense', class: 6 },
        { code: '666100', name: 'Charges nettes sur cessions de valeurs mobilières', type: 'expense', class: 6 },
        { code: '667100', name: 'Autres charges financières', type: 'expense', class: 6 },
        { code: '671100', name: 'Charges exceptionnelles sur opérations de gestion', type: 'expense', class: 6 },
        { code: '672100', name: 'Charges exceptionnelles sur opérations en capital', type: 'expense', class: 6 },
        { code: '673100', name: 'Charges exceptionnelles diverses', type: 'expense', class: 6 },
        { code: '675100', name: 'Valeurs comptables des éléments d\'actif cédés', type: 'expense', class: 6 },
        { code: '678100', name: 'Charges pour impôts exigibles à l\'étranger', type: 'expense', class: 6 },
        { code: '681100', name: 'Dotations aux amortissements', type: 'expense', class: 6 },
        { code: '686100', name: 'Dotations aux provisions', type: 'expense', class: 6 },
        { code: '687100', name: 'Dotations aux dépréciations', type: 'expense', class: 6 },

        // Classe 7 - Comptes de produits (70XXXX)
        { code: '701100', name: 'Ventes de produits finis A', type: 'revenue', class: 7 },
        { code: '702100', name: 'Ventes de produits finis B', type: 'revenue', class: 7 },
        { code: '703100', name: 'Ventes de produits intermédiaires', type: 'revenue', class: 7 },
        { code: '704100', name: 'Ventes de produits résiduels', type: 'revenue', class: 7 },
        { code: '705100', name: 'Travaux', type: 'revenue', class: 7 },
        { code: '706100', name: 'Services vendus', type: 'revenue', class: 7 },
        { code: '707100', name: 'Ventes de marchandises A', type: 'revenue', class: 7 },
        { code: '708100', name: 'Ventes de marchandises B', type: 'revenue', class: 7 },
        { code: '709100', name: 'Rabais, remises et ristournes accordés', type: 'revenue', class: 7 },
        { code: '711100', name: 'Subventions d\'exploitation', type: 'revenue', class: 7 },
        { code: '712100', name: 'Production immobilisée', type: 'revenue', class: 7 },
        { code: '713100', name: 'Variation des stocks de produits', type: 'revenue', class: 7 },
        { code: '714100', name: 'Subventions d\'investissement', type: 'revenue', class: 7 },
        { code: '715100', name: 'Autres produits de gestion courante', type: 'revenue', class: 7 },
        { code: '716100', name: 'Produits financiers', type: 'revenue', class: 7 },
        { code: '717100', name: 'Produits des cessions d\'éléments d\'actif', type: 'revenue', class: 7 },
        { code: '718100', name: 'Produits divers de gestion courante', type: 'revenue', class: 7 },
        { code: '721100', name: 'Produits exceptionnels sur opérations de gestion', type: 'revenue', class: 7 },
        { code: '722100', name: 'Produits exceptionnels sur opérations en capital', type: 'revenue', class: 7 },
        { code: '723100', name: 'Produits exceptionnels divers', type: 'revenue', class: 7 },
        { code: '724100', name: 'Produits des cessions d\'éléments d\'actif', type: 'revenue', class: 7 },
        { code: '725100', name: 'Quotes-parts de subventions d\'investissement virées au résultat', type: 'revenue', class: 7 },
        { code: '726100', name: 'Charges financières', type: 'revenue', class: 7 },
        { code: '727100', name: 'Produits financiers', type: 'revenue', class: 7 },
        { code: '728100', name: 'Reprises sur provisions et dépréciations', type: 'revenue', class: 7 },
        { code: '729100', name: 'Reprises sur amortissements', type: 'revenue', class: 7 }
      ],

      SYSCOHADA: [
        // Classe 1 - Ressources durables
        { code: '10', name: 'Capital et réserves', type: 'equity', level: 1 },
        { code: '101', name: 'Capital social', type: 'equity', level: 2 },
        { code: '106', name: 'Réserves', type: 'equity', level: 2 },
        { code: '16', name: 'Emprunts et dettes assimilées', type: 'liability', level: 1 },

        // Classe 2 - Actif immobilisé
        { code: '21', name: 'Immobilisations corporelles', type: 'asset', level: 1 },
        { code: '213', name: 'Bâtiments, installations techniques', type: 'asset', level: 2 },
        { code: '24', name: 'Matériel', type: 'asset', level: 1 },
        { code: '28', name: 'Amortissements des immobilisations', type: 'asset', level: 1 },

        // Classe 3 - Stocks
        { code: '31', name: 'Matières premières et fournitures', type: 'asset', level: 1 },
        { code: '37', name: 'Stocks de marchandises', type: 'asset', level: 1 },

        // Classe 4 - Créances et dettes
        { code: '41', name: 'Clients et comptes rattachés', type: 'asset', level: 1 },
        { code: '411', name: 'Clients', type: 'asset', level: 2 },
        { code: '40', name: 'Fournisseurs et comptes rattachés', type: 'liability', level: 1 },
        { code: '401', name: 'Fournisseurs', type: 'liability', level: 2 },
        { code: '421', name: 'Personnel', type: 'liability', level: 2 },
        { code: '4441', name: 'État - TVA facturée', type: 'liability', level: 2 },
        { code: '4454', name: 'État - TVA récupérable', type: 'asset', level: 2 },

        // Classe 5 - Trésorerie
        { code: '52', name: 'Banques', type: 'asset', level: 1 },
        { code: '521', name: 'Banques locales', type: 'asset', level: 2 },
        { code: '53', name: 'Caisses', type: 'asset', level: 1 },

        // Classe 6 - Charges
        { code: '60', name: 'Achats et variations de stocks', type: 'expense', level: 1 },
        { code: '601', name: 'Achats de matières premières', type: 'expense', level: 2 },
        { code: '607', name: 'Achats de marchandises', type: 'expense', level: 2 },
        { code: '61', name: 'Transports', type: 'expense', level: 1 },
        { code: '62', name: 'Services extérieurs A', type: 'expense', level: 1 },
        { code: '66', name: 'Charges de personnel', type: 'expense', level: 1 },
        { code: '661', name: 'Rémunérations directes versées au personnel', type: 'expense', level: 2 },

        // Classe 7 - Produits
        { code: '70', name: 'Ventes', type: 'revenue', level: 1 },
        { code: '701', name: 'Ventes de marchandises', type: 'revenue', level: 2 },
        { code: '702', name: 'Ventes de produits finis', type: 'revenue', level: 2 }
      ]
    };

    return baseAccounts[config.standard] || baseAccounts.PCG;
  }

  // Données d'exemple pour clients
  private getSampleCustomers(config: ChartOfAccountsConfig) {
    const countryPrefixes = {
      'FR': '+33',
      'SN': '+221',
      'CI': '+225',
      'ML': '+223',
      'MA': '+212',
      'TN': '+216'
    };

    return [
      {
        name: 'SARL TECHNO SOLUTIONS',
        email: 'contact@technosolutions.com',
        phone: `${countryPrefixes[config.country as keyof typeof countryPrefixes] || '+33'} 1 23 45 67 89`,
        address: 'Zone industrielle, Lot 15',
        city: config.country === 'FR' ? 'Lyon' : 'Dakar',
        postal_code: config.country === 'FR' ? '69000' : '10000',
        country: config.country,
        tax_number: config.country === 'FR' ? 'FR12345678901' : 'SN123456789',
        customer_type: 'B2B',
        payment_terms: 30,
        currency: config.currency,
        credit_limit: 50000
      },
      {
        name: 'Martin Dubois',
        email: 'martin.dubois@email.com',
        phone: `${countryPrefixes[config.country as keyof typeof countryPrefixes] || '+33'} 6 12 34 56 78`,
        address: '123 Rue de la République',
        city: config.country === 'FR' ? 'Paris' : 'Abidjan',
        postal_code: config.country === 'FR' ? '75001' : '01234',
        country: config.country,
        customer_type: 'B2C',
        payment_terms: 0,
        currency: config.currency,
        credit_limit: 5000
      },
      {
        name: 'GROUPE COMMERCIAL AFRIQUE',
        email: 'info@gca-group.com',
        phone: `${countryPrefixes[config.country as keyof typeof countryPrefixes] || '+33'} 3 45 67 89 01`,
        address: 'Avenue de l\'Indépendance, Immeuble le Phoenix',
        city: config.country === 'FR' ? 'Marseille' : 'Bamako',
        postal_code: config.country === 'FR' ? '13000' : '99999',
        country: config.country,
        tax_number: config.country === 'FR' ? 'FR98765432109' : 'ML987654321',
        customer_type: 'B2B',
        payment_terms: 60,
        currency: config.currency,
        credit_limit: 100000
      }
    ];
  }

  // Données d'exemple pour fournisseurs
  private getSampleSuppliers(config: ChartOfAccountsConfig) {
    return [
      {
        name: 'FOURNISSEUR GLOBAL SARL',
        email: 'commandes@fournisseurglobal.com',
        phone: '+33 4 56 78 90 12',
        address: 'Zone Industrielle Nord',
        city: 'Rennes',
        postal_code: '35000',
        country: 'FR',
        tax_number: 'FR11223344556',
        supplier_type: 'materials',
        payment_terms: 30,
        currency: 'EUR'
      },
      {
        name: 'IMPORT EXPORT MAGHREB',
        email: 'contact@iemagreb.ma',
        phone: '+212 5 22 33 44 55',
        address: 'Boulevard Hassan II',
        city: 'Casablanca',
        postal_code: '20000',
        country: 'MA',
        tax_number: 'MA123456789',
        supplier_type: 'goods',
        payment_terms: 45,
        currency: 'MAD'
      }
    ];
  }

  // Données d'exemple pour produits/services
  private getSampleProducts(config: ChartOfAccountsConfig) {
    return [
      {
        name: 'Service Consulting Informatique',
        description: 'Prestation de conseil en informatique et transformation digitale',
        sku: 'SERV-CONSULT-001',
        category: 'Services',
        unit_price: config.currency === 'EUR' ? 500 : (config.currency === 'XOF' ? 250000 : 800),
        currency: config.currency,
        tax_rate: config.country === 'FR' ? 20 : (config.standard === 'SYSCOHADA' ? 18 : 20),
        is_service: true,
        is_active: true
      },
      {
        name: 'Ordinateur Portable Professionnel',
        description: 'PC portable haute performance pour usage professionnel',
        sku: 'PROD-PC-001',
        category: 'Matériel Informatique',
        unit_price: config.currency === 'EUR' ? 1200 : (config.currency === 'XOF' ? 600000 : 1800),
        currency: config.currency,
        tax_rate: config.country === 'FR' ? 20 : (config.standard === 'SYSCOHADA' ? 18 : 20),
        is_service: false,
        stock_quantity: 25,
        is_active: true
      },
      {
        name: 'Formation Logiciel Comptable',
        description: 'Formation à l\'utilisation des logiciels comptables CassKai',
        sku: 'FORM-COMPTA-001',
        category: 'Formation',
        unit_price: config.currency === 'EUR' ? 800 : (config.currency === 'XOF' ? 400000 : 1200),
        currency: config.currency,
        tax_rate: config.country === 'FR' ? 20 : (config.standard === 'SYSCOHADA' ? 18 : 20),
        is_service: true,
        is_active: true
      }
    ];
  }

  // Génération des écritures comptables d'exemple
  private generateSampleTransactions(config: ChartOfAccountsConfig, sampleConfig: SampleDataConfig) {
    const transactions = [];
    const startDate = new Date(sampleConfig.dateRange.start);
    const endDate = new Date(sampleConfig.dateRange.end);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Transaction types avec leurs écritures
    const transactionTypes = [
      {
        type: 'sale_invoice',
        description: 'Facture de vente',
        entries: [
          { account: '411000', debit: true, amount: 1200 },
          { account: '707000', debit: false, amount: 1000 },
          { account: '445700', debit: false, amount: 200 } // TVA
        ]
      },
      {
        type: 'purchase_invoice',
        description: 'Facture d\'achat',
        entries: [
          { account: '601000', debit: true, amount: 800 },
          { account: '445660', debit: true, amount: 160 }, // TVA déductible
          { account: '401000', debit: false, amount: 960 }
        ]
      },
      {
        type: 'bank_payment',
        description: 'Paiement client par virement',
        entries: [
          { account: '512000', debit: true, amount: 1200 },
          { account: '411000', debit: false, amount: 1200 }
        ]
      },
      {
        type: 'salary_payment',
        description: 'Paiement salaires',
        entries: [
          { account: '641000', debit: true, amount: 3000 },
          { account: '645000', debit: true, amount: 900 }, // Charges sociales
          { account: '421000', debit: false, amount: 2400 }, // Net à payer
          { account: '431000', debit: false, amount: 1500 } // Organismes sociaux
        ]
      }
    ];

    for (let i = 0; i < sampleConfig.transactionCount; i++) {
      const randomDays = Math.floor(Math.random() * daysDiff);
      const transactionDate = new Date(startDate.getTime() + (randomDays * 24 * 60 * 60 * 1000));
      const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];

      // Ajuster les montants selon la devise
      const currencyMultiplier = config.currency === 'XOF' ? 650 :
                                 config.currency === 'MAD' ? 10 :
                                 config.currency === 'TND' ? 3 : 1;

      transactions.push({
        date: transactionDate.toISOString().split('T')[0],
        reference: `${transactionType.type.toUpperCase()}-${String(i + 1).padStart(4, '0')}`,
        description: `${transactionType.description} #${i + 1}`,
        entries: transactionType.entries.map(entry => ({
          account_code: entry.account,
          debit_amount: entry.debit ? entry.amount * currencyMultiplier : 0,
          credit_amount: !entry.debit ? entry.amount * currencyMultiplier : 0,
          description: `${transactionType.description} - ${entry.account}`
        }))
      });
    }

    return transactions;
  }

  async generateSampleData(chartConfig: ChartOfAccountsConfig, sampleConfig: SampleDataConfig) {
    try {
      const results = {
        accounts: 0,
        customers: 0,
        suppliers: 0,
        products: 0,
        transactions: 0
      };

      // 1. Créer le plan comptable
      const accounts = this.getChartOfAccounts(chartConfig);
      const accountsToInsert = accounts.map(account => ({
        company_id: this.companyId,
        account_code: account.code,
        account_name: account.name,
        account_type: account.type,
        level: account.level,
        is_active: true,
        currency: chartConfig.currency
      }));

      const { error: accountsError } = await supabase
        .from('accounts')
        .insert(accountsToInsert);

      if (!accountsError) results.accounts = accountsToInsert.length;

      // 2. Créer les clients d'exemple
      if (sampleConfig.includeCustomers) {
        const customers = this.getSampleCustomers(chartConfig);
        const customersToInsert = customers.map(customer => ({
          company_id: this.companyId,
          ...customer
        }));

        const { error: customersError } = await supabase
          .from('customers')
          .insert(customersToInsert);

        if (!customersError) results.customers = customersToInsert.length;
      }

      // 3. Créer les fournisseurs d'exemple
      if (sampleConfig.includeSuppliers) {
        const suppliers = this.getSampleSuppliers(chartConfig);
        const suppliersToInsert = suppliers.map(supplier => ({
          company_id: this.companyId,
          ...supplier
        }));

        const { error: suppliersError } = await supabase
          .from('suppliers')
          .insert(suppliersToInsert);

        if (!suppliersError) results.suppliers = suppliersToInsert.length;
      }

      // 4. Créer les produits/services d'exemple
      if (sampleConfig.includeProducts) {
        const products = this.getSampleProducts(chartConfig);
        const productsToInsert = products.map(product => ({
          company_id: this.companyId,
          ...product
        }));

        const { error: productsError } = await supabase
          .from('products')
          .insert(productsToInsert);

        if (!productsError) results.products = productsToInsert.length;
      }

      // 5. Créer les transactions d'exemple
      if (sampleConfig.includeTransactions) {
        const transactions = this.generateSampleTransactions(chartConfig, sampleConfig);

        for (const transaction of transactions) {
          // Créer l'écriture comptable
          const { data: journalEntry, error: journalError } = await supabase
            .from('journal_entries')
            .insert({
              company_id: this.companyId,
              entry_date: transaction.date,
              reference: transaction.reference,
              description: transaction.description,
              total_amount: transaction.entries.reduce((sum, entry) => sum + entry.debit_amount, 0)
            })
            .select('id')
            .single();

          if (journalEntry) {
            // Créer les lignes d'écriture
            const entryLines = transaction.entries.map(entry => ({
              company_id: this.companyId,
              journal_entry_id: journalEntry.id,
              account_code: entry.account_code,
              debit_amount: entry.debit_amount,
              credit_amount: entry.credit_amount,
              description: entry.description
            }));

            await supabase
              .from('journal_entry_lines')
              .insert(entryLines);

            results.transactions++;
          }
        }
      }

      return { success: true, results };
    } catch (error) {
      console.error('Erreur génération données d\'exemple:', error);
      return { success: false, error: error.message };
    }
  }

  // Fonction de suppression des données d'exemple (RAZ)
  async resetSampleData() {
    try {
      const tablesToReset = [
        'journal_entry_lines',
        'journal_entries',
        'invoice_lines',
        'invoices',
        'products',
        'suppliers',
        'customers',
        'accounts'
      ];

      for (const table of tablesToReset) {
        await supabase
          .from(table)
          .delete()
          .eq('company_id', this.companyId);
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur suppression données d\'exemple:', error);
      return { success: false, error: error.message };
    }
  }
}