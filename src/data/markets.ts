// data/markets.ts
import { MarketConfig } from '@/types/markets';

export const MARKET_CONFIGS: MarketConfig[] = [
  {
    id: 'france',
    name: 'France',
    region: 'europe',
    countries: ['FR'],
    defaultCurrency: 'EUR',
    accountingStandard: 'PCG',
    taxSystem: {
      vatRate: 20,
      vatNumber: 'FR',
      socialCharges: [0.4542], // Charges patronales moyennes
      payrollTaxes: [
        { name: 'Sécurité Sociale', rate: 0.1545, base: 'gross', ceiling: 43992 },
        { name: 'CSG/CRDS', rate: 0.097, base: 'gross' },
        { name: 'Assurance Chômage', rate: 0.0405, base: 'gross', ceiling: 175968 }
      ],
      fiscalYear: 'calendar'
    },
    pricing: {
      currency: 'EUR',
      starter: 19,
      professional: 49,
      enterprise: 99,
      vatIncluded: true
    },
    features: {
      bankingIntegration: ['BNP Paribas', 'Crédit Agricole', 'Société Générale', 'LCL'],
      paymentMethods: ['SEPA', 'CB', 'Virement', 'Prélèvement'],
      reportingStandards: ['DGFiP', 'FEC', 'SIREN/SIRET'],
      compliance: ['RGPD', 'LPF', 'Code Commerce']
    },
    localization: {
      dateFormat: 'DD/MM/YYYY',
      numberFormat: '1 234,56',
      language: 'fr-FR',
      timezone: 'Europe/Paris',
      workingDays: [1, 2, 3, 4, 5] // Lundi-Vendredi
    }
  },
  {
    id: 'belgium',
    name: 'Belgique',
    region: 'europe',
    countries: ['BE'],
    defaultCurrency: 'EUR',
    accountingStandard: 'PCG',
    taxSystem: {
      vatRate: 21,
      vatNumber: 'BE',
      socialCharges: [0.3500],
      payrollTaxes: [
        { name: 'Sécurité Sociale', rate: 0.1307, base: 'gross' },
        { name: 'Précompte Professionnel', rate: 0.25, base: 'gross' }
      ],
      fiscalYear: 'calendar'
    },
    pricing: {
      currency: 'EUR',
      starter: 19,
      professional: 49,
      enterprise: 99,
      vatIncluded: true
    },
    features: {
      bankingIntegration: ['KBC', 'BNP Paribas Fortis', 'ING', 'Belfius'],
      paymentMethods: ['SEPA', 'Bancontact', 'Virement'],
      reportingStandards: ['BNB', 'SPF Finances'],
      compliance: ['RGPD', 'Code Sociétés']
    },
    localization: {
      dateFormat: 'DD/MM/YYYY',
      numberFormat: '1.234,56',
      language: 'fr-BE',
      timezone: 'Europe/Brussels',
      workingDays: [1, 2, 3, 4, 5]
    }
  },
  {
    id: 'benin',
    name: 'Bénin',
    region: 'africa',
    countries: ['BJ'],
    defaultCurrency: 'XOF',
    accountingStandard: 'SYSCOHADA',
    taxSystem: {
      vatRate: 18,
      vatNumber: 'BJ',
      socialCharges: [0.1612], // CNSS + AT
      payrollTaxes: [
        { name: 'CNSS', rate: 0.036, base: 'gross', ceiling: 1080000 },
        { name: 'Accident Travail', rate: 0.015, base: 'gross' },
        { name: 'FOPROLOS', rate: 0.02, base: 'gross' }
      ],
      fiscalYear: 'calendar'
    },
    pricing: {
      currency: 'XOF',
      starter: 12000, // ~18€
      professional: 30000, // ~45€
      enterprise: 60000, // ~90€
      vatIncluded: false
    },
    features: {
      bankingIntegration: ['Ecobank', 'BOA', 'UBA', 'BSIC'],
      paymentMethods: ['Mobile Money', 'Virement', 'Espèces'],
      reportingStandards: ['DGI Bénin', 'OHADA', 'CNSS'],
      compliance: ['Code OHADA', 'Loi Informatique et Libertés']
    },
    localization: {
      dateFormat: 'DD/MM/YYYY',
      numberFormat: '1 234',
      language: 'fr-BJ',
      timezone: 'Africa/Porto-Novo',
      workingDays: [1, 2, 3, 4, 5]
    }
  },
  {
    id: 'ivory_coast',
    name: 'Côte d\'Ivoire',
    region: 'africa',
    countries: ['CI'],
    defaultCurrency: 'XOF',
    accountingStandard: 'SYSCOHADA',
    taxSystem: {
      vatRate: 18,
      vatNumber: 'CI',
      socialCharges: [0.165], // CNPS + autres
      payrollTaxes: [
        { name: 'CNPS', rate: 0.036, base: 'gross', ceiling: 1647315 },
        { name: 'Accident Travail', rate: 0.015, base: 'gross' },
        { name: 'Formation Prof.', rate: 0.012, base: 'gross' }
      ],
      fiscalYear: 'calendar'
    },
    pricing: {
      currency: 'XOF',
      starter: 12000,
      professional: 30000,
      enterprise: 60000,
      vatIncluded: false
    },
    features: {
      bankingIntegration: ['SGBCI', 'BICICI', 'Ecobank', 'UBA'],
      paymentMethods: ['Mobile Money', 'Orange Money', 'Virement'],
      reportingStandards: ['DGI Côte d\'Ivoire', 'OHADA', 'CNPS'],
      compliance: ['Code OHADA', 'Protection Données Personnelles']
    },
    localization: {
      dateFormat: 'DD/MM/YYYY',
      numberFormat: '1 234',
      language: 'fr-CI',
      timezone: 'Africa/Abidjan',
      workingDays: [1, 2, 3, 4, 5]
    }
  },
  {
    id: 'canada',
    name: 'Canada (Québec)',
    region: 'americas',
    countries: ['CA'],
    defaultCurrency: 'CAD',
    accountingStandard: 'GAAP',
    taxSystem: {
      vatRate: 14.975, // TPS + TVQ
      vatNumber: 'CA',
      socialCharges: [0.0737], // EI + RRQ
      payrollTaxes: [
        { name: 'RRQ', rate: 0.0315, base: 'gross', ceiling: 68500 },
        { name: 'Assurance Emploi', rate: 0.0422, base: 'gross', ceiling: 63300 },
        { name: 'RAMQ', rate: 0.0345, base: 'gross' }
      ],
      fiscalYear: 'calendar'
    },
    pricing: {
      currency: 'CAD',
      starter: 25,
      professional: 65,
      enterprise: 129,
      vatIncluded: false
    },
    features: {
      bankingIntegration: ['RBC', 'TD', 'BMO', 'Banque Nationale'],
      paymentMethods: ['Interac', 'Virement', 'Chèque'],
      reportingStandards: ['ARC', 'Revenu Québec', 'ASFC'],
      compliance: ['PIPEDA', 'Loi 25 Québec']
    },
    localization: {
      dateFormat: 'YYYY-MM-DD',
      numberFormat: '1,234.56',
      language: 'fr-CA',
      timezone: 'America/Montreal',
      workingDays: [1, 2, 3, 4, 5]
    }
  }
];
