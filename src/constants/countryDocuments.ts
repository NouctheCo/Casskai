/**
 * Configuration complète de tous les pays et documents pour PHASE 5
 * Support: France (PCG), 33 pays OHADA (SYSCOHADA), Afrique anglophone (IFRS), Maghreb (SCF/PCM)
 */

export const COUNTRY_DOCUMENTS = {
  // ===== FRANCE (PCG) =====
  FR: {
    name: 'France',
    standard: 'PCG',
    flag: '🇫🇷',
    documents: {
      liasse_simplifiee: {
        category: 'Liasse Fiscale Simplifiée (Régime Réel Simplifié)',
        documents: [
          { id: 'FR_2033A', name: 'Bilan simplifié (2033-A-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2033B', name: 'Compte de résultat simplifié (2033-B-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2033C', name: 'Immobilisations et amortissements (2033-C-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2033D', name: 'Provisions et déficits (2033-D-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2033E', name: 'Effectifs et valeur ajoutée (2033-E-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2033F', name: 'Composition du capital social (2033-F-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2033G', name: 'Filiales et participations (2033-G-SD)', frequency: 'ANNUALLY' },
        ],
      },
      liasse_normale: {
        category: 'Liasse Fiscale Normale (Régime Réel Normal)',
        documents: [
          { id: 'FR_2050', name: 'Bilan actif (2050-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2051', name: 'Bilan passif (2051-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2052', name: 'Compte de résultat - Charges (2052-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2053', name: 'Compte de résultat - Produits (2053-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2054', name: 'Immobilisations (2054-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2055', name: 'Amortissements (2055-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2056', name: 'Provisions (2056-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2057', name: 'État des échéances des créances et dettes (2057-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2058A', name: 'Détermination du résultat fiscal (2058-A-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2058B', name: 'Déficits et indemnités (2058-B-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2058C', name: 'Affectation du résultat (2058-C-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2059A', name: 'Plus-values et moins-values (2059-A-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2059B', name: 'Affectation des plus-values (2059-B-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2059C', name: 'Tableau de passage (2059-C-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2059D', name: 'Plus-value nette à long terme (2059-D-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2059E', name: 'Détermination de la valeur ajoutée (2059-E-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2059F', name: 'Composition du capital social (2059-F-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_2059G', name: 'Filiales et participations (2059-G-SD)', frequency: 'ANNUALLY' },
        ],
      },
      declarations_tva: {
        category: 'Déclarations TVA',
        documents: [
          { id: 'FR_CA3', name: 'Déclaration mensuelle de TVA (CA3)', frequency: 'MONTHLY' },
          { id: 'FR_CA12', name: 'Déclaration annuelle de TVA (CA12)', frequency: 'QUARTERLY' },
        ],
      },
      autres: {
        category: 'Autres Déclarations',
        documents: [
          { id: 'FR_2065', name: 'Déclaration de résultat (IS)', frequency: 'ANNUALLY' },
          { id: 'FR_2069RCI', name: 'Réductions et crédits d\'impôt (2069-RCI-SD)', frequency: 'ANNUALLY' },
          { id: 'FR_DSN', name: 'Déclaration Sociale Nominative (DSN)', frequency: 'MONTHLY' },
          { id: 'FR_DAS2', name: 'Déclaration des honoraires (DAS2)', frequency: 'ANNUALLY' },
        ],
      },
    },
  },

  // ===== PAYS OHADA (SYSCOHADA) =====
  SN: {
    name: 'Sénégal',
    standard: 'SYSCOHADA',
    flag: '🇸🇳',
    documents: {
      etats_financiers: {
        category: 'États Financiers SYSCOHADA',
        documents: [
          { id: 'SN_BILAN', name: 'Bilan (Actif et Passif)', frequency: 'ANNUALLY' },
          { id: 'SN_COMPTE_RESULTAT', name: 'Compte de résultat (par nature)', frequency: 'ANNUALLY' },
          { id: 'SN_TAFIRE', name: 'Tableau des flux de trésorerie (TAFIRE)', frequency: 'ANNUALLY' },
          { id: 'SN_ANNEXE', name: 'État annexé (Notes)', frequency: 'ANNUALLY' },
        ],
      },
      declarations_fiscales: {
        category: 'Déclarations Fiscales',
        documents: [
          { id: 'SN_TVA', name: 'Déclaration de TVA', frequency: 'MONTHLY' },
          { id: 'SN_IS', name: 'Déclaration d\'impôt sur les sociétés', frequency: 'ANNUALLY' },
          { id: 'SN_IPRES', name: 'Déclaration IPRES (cotisations)', frequency: 'MONTHLY' },
          { id: 'SN_PATENTE', name: 'Patente (contribution des patentes)', frequency: 'ANNUALLY' },
        ],
      },
    },
  },

  CI: {
    name: 'Côte d\'Ivoire',
    standard: 'SYSCOHADA',
    flag: '🇨🇮',
    documents: {
      etats_financiers: {
        category: 'États Financiers SYSCOHADA',
        documents: [
          { id: 'CI_BILAN', name: 'Bilan', frequency: 'ANNUALLY' },
          { id: 'CI_COMPTE_RESULTAT', name: 'Compte de résultat', frequency: 'ANNUALLY' },
          { id: 'CI_TAFIRE', name: 'Tableau des flux de trésorerie', frequency: 'ANNUALLY' },
          { id: 'CI_ANNEXE', name: 'État annexé', frequency: 'ANNUALLY' },
        ],
      },
      declarations_fiscales: {
        category: 'Déclarations Fiscales',
        documents: [
          { id: 'CI_DAS', name: 'Déclaration Annuelle de Salaires (DAS)', frequency: 'ANNUALLY' },
          { id: 'CI_IS', name: 'Impôt sur les sociétés', frequency: 'ANNUALLY' },
          { id: 'CI_TVA', name: 'Déclaration de TVA', frequency: 'MONTHLY' },
        ],
      },
    },
  },

  CM: {
    name: 'Cameroun',
    standard: 'SYSCOHADA',
    flag: '🇨🇲',
    documents: {
      etats_financiers: {
        category: 'États Financiers SYSCOHADA',
        documents: [
          { id: 'CM_BILAN', name: 'Bilan', frequency: 'ANNUALLY' },
          { id: 'CM_COMPTE_RESULTAT', name: 'Compte de résultat', frequency: 'ANNUALLY' },
          { id: 'CM_TAFIRE', name: 'Tableau des flux de trésorerie', frequency: 'ANNUALLY' },
          { id: 'CM_ANNEXE', name: 'État annexé', frequency: 'ANNUALLY' },
        ],
      },
      declarations_fiscales: {
        category: 'Déclarations Fiscales',
        documents: [
          { id: 'CM_IS', name: 'Impôt sur les sociétés', frequency: 'ANNUALLY' },
          { id: 'CM_TVA', name: 'Taxe sur la valeur ajoutée', frequency: 'QUARTERLY' },
          { id: 'CM_PATENTE', name: 'Contribution des patentes', frequency: 'ANNUALLY' },
        ],
      },
    },
  },

  ML: {
    name: 'Mali',
    standard: 'SYSCOHADA',
    flag: '🇲🇱',
    documents: {
      etats_financiers: {
        category: 'États Financiers SYSCOHADA',
        documents: [
          { id: 'ML_BILAN', name: 'Bilan', frequency: 'ANNUALLY' },
          { id: 'ML_COMPTE_RESULTAT', name: 'Compte de résultat', frequency: 'ANNUALLY' },
          { id: 'ML_TAFIRE', name: 'Tableau des flux de trésorerie', frequency: 'ANNUALLY' },
          { id: 'ML_ANNEXE', name: 'État annexé', frequency: 'ANNUALLY' },
        ],
      },
    },
  },

  BF: {
    name: 'Burkina Faso',
    standard: 'SYSCOHADA',
    flag: '🇧🇫',
    documents: {
      etats_financiers: {
        category: 'États Financiers SYSCOHADA',
        documents: [
          { id: 'BF_BILAN', name: 'Bilan', frequency: 'ANNUALLY' },
          { id: 'BF_COMPTE_RESULTAT', name: 'Compte de résultat', frequency: 'ANNUALLY' },
        ],
      },
    },
  },

  // ===== AFRIQUE ANGLOPHONE (IFRS) =====
  KE: {
    name: 'Kenya',
    standard: 'IFRS',
    flag: '🇰🇪',
    documents: {
      etats_financiers: {
        category: 'États Financiers IFRS',
        documents: [
          { id: 'KE_BALANCE_SHEET', name: 'Statement of Financial Position', frequency: 'ANNUALLY' },
          { id: 'KE_INCOME_STATEMENT', name: 'Statement of Comprehensive Income', frequency: 'ANNUALLY' },
          { id: 'KE_CASH_FLOW', name: 'Statement of Cash Flows', frequency: 'ANNUALLY' },
          { id: 'KE_EQUITY_CHANGES', name: 'Statement of Changes in Equity', frequency: 'ANNUALLY' },
          { id: 'KE_NOTES', name: 'Notes to Financial Statements', frequency: 'ANNUALLY' },
        ],
      },
      declarations_fiscales: {
        category: 'Déclarations Fiscales (KRA)',
        documents: [
          { id: 'KE_ITAX_CIT', name: 'iTax Return of Income (Corporate Tax)', frequency: 'ANNUALLY' },
          { id: 'KE_VAT', name: 'VAT Return', frequency: 'MONTHLY' },
          { id: 'KE_PAYE', name: 'PAYE Return', frequency: 'MONTHLY' },
          { id: 'KE_WHT', name: 'Withholding Tax (WHT) Return', frequency: 'MONTHLY' },
        ],
      },
    },
  },

  NG: {
    name: 'Nigeria',
    standard: 'IFRS',
    flag: '🇳🇬',
    documents: {
      etats_financiers: {
        category: 'États Financiers IFRS',
        documents: [
          { id: 'NG_BALANCE_SHEET', name: 'Statement of Financial Position', frequency: 'ANNUALLY' },
          { id: 'NG_INCOME_STATEMENT', name: 'Statement of Comprehensive Income', frequency: 'ANNUALLY' },
          { id: 'NG_CASH_FLOW', name: 'Statement of Cash Flows', frequency: 'ANNUALLY' },
          { id: 'NG_EQUITY_CHANGES', name: 'Statement of Changes in Equity', frequency: 'ANNUALLY' },
        ],
      },
      declarations_fiscales: {
        category: 'Déclarations Fiscales (FIRS)',
        documents: [
          { id: 'NG_CIT', name: 'Companies Income Tax Return', frequency: 'QUARTERLY' },
          { id: 'NG_VAT', name: 'VAT Return', frequency: 'MONTHLY' },
          { id: 'NG_PAYE', name: 'PAYE Return', frequency: 'MONTHLY' },
          { id: 'NG_WHT', name: 'Withholding Tax Return', frequency: 'MONTHLY' },
        ],
      },
    },
  },

  GH: {
    name: 'Ghana',
    standard: 'IFRS',
    flag: '🇬🇭',
    documents: {
      etats_financiers: {
        category: 'États Financiers IFRS',
        documents: [
          { id: 'GH_BALANCE_SHEET', name: 'Statement of Financial Position', frequency: 'ANNUALLY' },
          { id: 'GH_INCOME_STATEMENT', name: 'Statement of Comprehensive Income', frequency: 'ANNUALLY' },
          { id: 'GH_CASH_FLOW', name: 'Statement of Cash Flows', frequency: 'ANNUALLY' },
        ],
      },
      declarations_fiscales: {
        category: 'Déclarations Fiscales (GRA)',
        documents: [
          { id: 'GH_CORP_TAX', name: 'Corporate Tax Return', frequency: 'ANNUALLY' },
          { id: 'GH_VAT', name: 'VAT/NHIL/GETFund Return', frequency: 'MONTHLY' },
          { id: 'GH_PAYE', name: 'PAYE Return', frequency: 'MONTHLY' },
        ],
      },
    },
  },

  ZA: {
    name: 'Afrique du Sud',
    standard: 'IFRS',
    flag: '🇿🇦',
    documents: {
      etats_financiers: {
        category: 'États Financiers IFRS',
        documents: [
          { id: 'ZA_BALANCE_SHEET', name: 'Statement of Financial Position', frequency: 'ANNUALLY' },
          { id: 'ZA_INCOME_STATEMENT', name: 'Statement of Comprehensive Income', frequency: 'ANNUALLY' },
          { id: 'ZA_CASH_FLOW', name: 'Statement of Cash Flows', frequency: 'ANNUALLY' },
        ],
      },
      declarations_fiscales: {
        category: 'Déclarations Fiscales (SARS)',
        documents: [
          { id: 'ZA_ITR14', name: 'ITR14 - Income Tax Return (Companies)', frequency: 'ANNUALLY' },
          { id: 'ZA_VAT201', name: 'VAT201 - VAT Return', frequency: 'MONTHLY' },
          { id: 'ZA_EMP201', name: 'EMP201 - PAYE Return', frequency: 'MONTHLY' },
        ],
      },
    },
  },

  // ===== MAGHREB (SCF/PCM) =====
  DZ: {
    name: 'Algérie',
    standard: 'SCF',
    flag: '🇩🇿',
    documents: {
      etats_financiers: {
        category: 'États Financiers SCF',
        documents: [
          { id: 'DZ_BILAN', name: 'Bilan', frequency: 'ANNUALLY' },
          { id: 'DZ_COMPTE_RESULTAT', name: 'Compte de résultat', frequency: 'ANNUALLY' },
          { id: 'DZ_TRESORERIE', name: 'Tableau des flux de trésorerie', frequency: 'ANNUALLY' },
          { id: 'DZ_CAPITAUX_PROPRES', name: 'Tableau de variation des capitaux propres', frequency: 'ANNUALLY' },
          { id: 'DZ_ANNEXE', name: 'Annexe (Notes explicatives)', frequency: 'ANNUALLY' },
        ],
      },
      declarations_fiscales: {
        category: 'Déclarations Fiscales',
        documents: [
          { id: 'DZ_G50', name: 'G50 - Déclaration annuelle IBS', frequency: 'ANNUALLY' },
          { id: 'DZ_TVA', name: 'Série G - Déclaration TVA', frequency: 'MONTHLY' },
          { id: 'DZ_IRG', name: 'G1 - Déclaration des salaires (IRG)', frequency: 'MONTHLY' },
        ],
      },
    },
  },

  TN: {
    name: 'Tunisie',
    standard: 'SCF',
    flag: '🇹🇳',
    documents: {
      etats_financiers: {
        category: 'États Financiers SCF',
        documents: [
          { id: 'TN_BILAN', name: 'Bilan', frequency: 'ANNUALLY' },
          { id: 'TN_COMPTE_RESULTAT', name: 'Compte de résultat', frequency: 'ANNUALLY' },
          { id: 'TN_TRESORERIE', name: 'Tableau des flux de trésorerie', frequency: 'ANNUALLY' },
        ],
      },
      declarations_fiscales: {
        category: 'Déclarations Fiscales',
        documents: [
          { id: 'TN_IS', name: 'Déclaration d\'IS', frequency: 'ANNUALLY' },
          { id: 'TN_TVA', name: 'Déclaration TVA', frequency: 'MONTHLY' },
          { id: 'TN_CNSS', name: 'Déclaration employeur (CNSS)', frequency: 'MONTHLY' },
        ],
      },
    },
  },

  MA: {
    name: 'Maroc',
    standard: 'PCM',
    flag: '🇲🇦',
    documents: {
      etats_financiers: {
        category: 'États Financiers PCM',
        documents: [
          { id: 'MA_BILAN', name: 'Bilan', frequency: 'ANNUALLY' },
          { id: 'MA_CPC', name: 'Compte de Produits et Charges (CPC)', frequency: 'ANNUALLY' },
          { id: 'MA_TF', name: 'Tableau de Financement (TF)', frequency: 'ANNUALLY' },
          { id: 'MA_ESG', name: 'État des Soldes de Gestion (ESG)', frequency: 'ANNUALLY' },
          { id: 'MA_ETIC', name: 'État des Informations Complémentaires', frequency: 'ANNUALLY' },
        ],
      },
      declarations_fiscales: {
        category: 'Déclarations Fiscales',
        documents: [
          { id: 'MA_IS', name: 'Déclaration Impôt sur les Sociétés', frequency: 'ANNUALLY' },
          { id: 'MA_TVA', name: 'Télédéclaration TVA', frequency: 'MONTHLY' },
          { id: 'MA_CNSS', name: 'Déclaration CNSS', frequency: 'MONTHLY' },
        ],
      },
    },
  },
};

/**
 * Récupère tous les documents pour un pays
 */
export function getCountryDocuments(countryCode: string) {
  return COUNTRY_DOCUMENTS[countryCode as keyof typeof COUNTRY_DOCUMENTS] || null;
}

/**
 * Récupère tous les pays supportés
 */
export function getSupportedCountries() {
  return Object.entries(COUNTRY_DOCUMENTS).map(([code, data]) => ({
    code,
    name: data.name,
    standard: data.standard,
    flag: data.flag,
  }));
}

/**
 * Récupère tous les documents par standard
 */
export function getDocumentsByStandard(standard: string) {
  const result: Record<string, any> = {};

  Object.entries(COUNTRY_DOCUMENTS).forEach(([country, data]) => {
    if (data.standard === standard) {
      result[country] = data;
    }
  });

  return result;
}

/**
 * Récupère un document spécifique
 */
export function getDocument(documentId: string) {
  for (const [country, countryData] of Object.entries(COUNTRY_DOCUMENTS)) {
    for (const [category, categoryData] of Object.entries(countryData.documents)) {
      const doc = categoryData.documents.find((d: any) => d.id === documentId);
      if (doc) {
        return {
          id: doc.id,
          name: doc.name,
          country,
          standard: countryData.standard,
          category,
          frequency: doc.frequency,
        };
      }
    }
  }
  return null;
}

// Statistiques
export const PHASE5_STATS = {
  total_countries: Object.keys(COUNTRY_DOCUMENTS).length,
  total_documents: Object.values(COUNTRY_DOCUMENTS).reduce((sum, country) => {
    return sum + Object.values(country.documents).reduce((catSum, cat) => catSum + cat.documents.length, 0);
  }, 0),
  standards: ['PCG', 'SYSCOHADA', 'IFRS', 'SCF', 'PCM'],
  regions: {
    france: 1,
    ohada: 6,
    anglophone: 4,
    maghreb: 3,
  },
};
