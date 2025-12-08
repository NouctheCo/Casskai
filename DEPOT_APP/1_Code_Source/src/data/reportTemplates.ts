import { ReportTemplate } from '@/types/reports.types';

/**
 * Templates de rapports financiers prédéfinis
 * Conformes aux normes comptables françaises (PCG) et internationales (IFRS)
 */

export const DEFAULT_REPORT_TEMPLATES: Omit<ReportTemplate, 'id' | 'enterprise_id' | 'created_by' | 'created_at' | 'updated_at'>[] = [
  // 1. BILAN COMPTABLE STANDARD
  {
    name: 'Bilan Comptable Standard',
    description: 'Bilan comptable conforme au Plan Comptable Général français avec présentation par liquidité croissante',
    type: 'balance_sheet',
    sections: [
      {
        id: 'actif_immobilise',
        name: 'ACTIF IMMOBILISÉ',
        order: 1,
        items: [
          {
            id: 'immobilisations_incorporelles',
            name: 'Immobilisations incorporelles',
            account_codes: ['20', '203', '205', '206', '207', '208'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'immobilisations_corporelles',
            name: 'Immobilisations corporelles',
            account_codes: ['21', '213', '214', '215', '218'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'immobilisations_financieres',
            name: 'Immobilisations financières',
            account_codes: ['26', '27', '271', '272', '273', '274', '275'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          }
        ]
      },
      {
        id: 'actif_circulant',
        name: 'ACTIF CIRCULANT',
        order: 2,
        items: [
          {
            id: 'stocks',
            name: 'Stocks et en-cours',
            account_codes: ['31', '32', '33', '34', '35', '37'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'creances',
            name: 'Créances',
            account_codes: ['40', '41', '42', '43', '44', '45', '46', '47'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'disponibilites',
            name: 'Disponibilités',
            account_codes: ['50', '51', '53', '54'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          }
        ]
      },
      {
        id: 'passif_capitaux_propres',
        name: 'CAPITAUX PROPRES',
        order: 3,
        items: [
          {
            id: 'capital',
            name: 'Capital',
            account_codes: ['101', '104', '105', '106', '108'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'reserves',
            name: 'Réserves',
            account_codes: ['106', '110', '111', '112', '113', '114', '115', '116'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'resultat',
            name: 'Résultat de l\'exercice',
            account_codes: ['120'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          }
        ]
      },
      {
        id: 'passif_dettes',
        name: 'DETTES',
        order: 4,
        items: [
          {
            id: 'provisions',
            name: 'Provisions pour risques et charges',
            account_codes: ['14', '15'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'dettes_financieres',
            name: 'Dettes financières',
            account_codes: ['16', '17', '18'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'dettes_exploitation',
            name: 'Dettes d\'exploitation',
            account_codes: ['40', '42', '43', '44', '45', '46', '47'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          }
        ]
      }
    ],
    styling: {
      font_family: 'Arial',
      font_size: 10,
      header_color: '#2563eb',
      show_logo: true,
      show_watermark: false
    },
    is_default: true
  },

  // 2. COMPTE DE RÉSULTAT PAR NATURE
  {
    name: 'Compte de Résultat par Nature',
    description: 'Compte de résultat conforme au PCG français avec présentation par nature des charges',
    type: 'income_statement',
    sections: [
      {
        id: 'produits_exploitation',
        name: 'PRODUITS D\'EXPLOITATION',
        order: 1,
        items: [
          {
            id: 'chiffre_affaires',
            name: 'Chiffre d\'affaires',
            account_codes: ['701', '702', '703', '704', '705', '706', '707', '708'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'autres_produits',
            name: 'Autres produits d\'exploitation',
            account_codes: ['71', '72', '74', '75'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          }
        ]
      },
      {
        id: 'charges_exploitation',
        name: 'CHARGES D\'EXPLOITATION',
        order: 2,
        items: [
          {
            id: 'achats',
            name: 'Achats',
            account_codes: ['60', '601', '602', '603', '604', '605', '606', '607', '608', '609'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'services_exterieurs',
            name: 'Services extérieurs',
            account_codes: ['61', '62'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'impots_taxes',
            name: 'Impôts et taxes',
            account_codes: ['63'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'charges_personnel',
            name: 'Charges de personnel',
            account_codes: ['64'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'amortissements',
            name: 'Amortissements et provisions',
            account_codes: ['68'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          }
        ]
      },
      {
        id: 'resultat_exploitation',
        name: 'RÉSULTAT D\'EXPLOITATION',
        order: 3,
        items: [
          {
            id: 'resultat_exploitation_calc',
            name: 'Résultat d\'exploitation',
            account_codes: [],
            calculation_type: 'custom',
            format: 'currency',
            show_in_summary: true
          }
        ]
      },
      {
        id: 'resultat_financier',
        name: 'RÉSULTAT FINANCIER',
        order: 4,
        items: [
          {
            id: 'produits_financiers',
            name: 'Produits financiers',
            account_codes: ['76'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'charges_financieres',
            name: 'Charges financières',
            account_codes: ['66'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          }
        ]
      },
      {
        id: 'resultat_exceptionnel',
        name: 'RÉSULTAT EXCEPTIONNEL',
        order: 5,
        items: [
          {
            id: 'produits_exceptionnels',
            name: 'Produits exceptionnels',
            account_codes: ['77'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'charges_exceptionnelles',
            name: 'Charges exceptionnelles',
            account_codes: ['67'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          }
        ]
      },
      {
        id: 'resultat_net',
        name: 'RÉSULTAT NET',
        order: 6,
        items: [
          {
            id: 'impot_benefices',
            name: 'Impôt sur les bénéfices',
            account_codes: ['69'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'resultat_net_calc',
            name: 'Résultat net de l\'exercice',
            account_codes: [],
            calculation_type: 'custom',
            format: 'currency',
            show_in_summary: true
          }
        ]
      }
    ],
    styling: {
      font_family: 'Arial',
      font_size: 10,
      header_color: '#16a34a',
      show_logo: true,
      show_watermark: false
    },
    is_default: true
  },

  // 3. TABLEAU DE FLUX DE TRÉSORERIE
  {
    name: 'Tableau de Flux de Trésorerie',
    description: 'Tableau de flux de trésorerie selon la méthode indirecte conforme aux normes IFRS',
    type: 'cash_flow',
    sections: [
      {
        id: 'flux_exploitation',
        name: 'FLUX DE TRÉSORERIE LIÉS À L\'ACTIVITÉ',
        order: 1,
        items: [
          {
            id: 'resultat_net',
            name: 'Résultat net de l\'exercice',
            account_codes: ['120'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'amortissements_provisions',
            name: 'Amortissements et provisions',
            account_codes: ['681', '686', '687'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'variation_bfr',
            name: 'Variation du besoin en fonds de roulement',
            account_codes: [],
            calculation_type: 'custom',
            format: 'currency',
            show_in_summary: true
          }
        ]
      },
      {
        id: 'flux_investissement',
        name: 'FLUX DE TRÉSORERIE LIÉS AUX OPÉRATIONS D\'INVESTISSEMENT',
        order: 2,
        items: [
          {
            id: 'acquisitions_immobilisations',
            name: 'Acquisitions d\'immobilisations',
            account_codes: [],
            calculation_type: 'custom',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'cessions_immobilisations',
            name: 'Cessions d\'immobilisations',
            account_codes: ['775'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          }
        ]
      },
      {
        id: 'flux_financement',
        name: 'FLUX DE TRÉSORERIE LIÉS AUX OPÉRATIONS DE FINANCEMENT',
        order: 3,
        items: [
          {
            id: 'emissions_emprunts',
            name: 'Émissions d\'emprunts',
            account_codes: [],
            calculation_type: 'custom',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'remboursements_emprunts',
            name: 'Remboursements d\'emprunts',
            account_codes: [],
            calculation_type: 'custom',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'dividendes',
            name: 'Dividendes versés',
            account_codes: ['457'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          }
        ]
      }
    ],
    styling: {
      font_family: 'Arial',
      font_size: 10,
      header_color: '#dc2626',
      show_logo: true,
      show_watermark: false
    },
    is_default: true
  },

  // 4. BALANCE GÉNÉRALE
  {
    name: 'Balance Générale',
    description: 'Balance de tous les comptes avec soldes débiteurs et créditeurs',
    type: 'trial_balance',
    sections: [
      {
        id: 'comptes_bilan',
        name: 'COMPTES DE BILAN',
        order: 1,
        items: [
          {
            id: 'classe_1',
            name: 'Classe 1 - Comptes de capitaux',
            account_codes: ['1'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'classe_2',
            name: 'Classe 2 - Comptes d\'immobilisations',
            account_codes: ['2'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'classe_3',
            name: 'Classe 3 - Comptes de stocks',
            account_codes: ['3'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'classe_4',
            name: 'Classe 4 - Comptes de tiers',
            account_codes: ['4'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'classe_5',
            name: 'Classe 5 - Comptes financiers',
            account_codes: ['5'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          }
        ]
      },
      {
        id: 'comptes_gestion',
        name: 'COMPTES DE GESTION',
        order: 2,
        items: [
          {
            id: 'classe_6',
            name: 'Classe 6 - Comptes de charges',
            account_codes: ['6'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'classe_7',
            name: 'Classe 7 - Comptes de produits',
            account_codes: ['7'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          }
        ]
      }
    ],
    styling: {
      font_family: 'Courier New',
      font_size: 9,
      header_color: '#7c3aed',
      show_logo: false,
      show_watermark: false
    },
    is_default: true
  },

  // 5. ANALYSE DES CRÉANCES CLIENTS
  {
    name: 'Analyse des Créances Clients',
    description: 'État de vieillissement des créances clients avec analyse des risques',
    type: 'aged_receivables',
    sections: [
      {
        id: 'creances_courantes',
        name: 'CRÉANCES COURANTES',
        order: 1,
        items: [
          {
            id: 'non_echues',
            name: 'Créances non échues',
            account_codes: ['411'],
            calculation_type: 'custom',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'echu_30_jours',
            name: 'Échues à moins de 30 jours',
            account_codes: ['411'],
            calculation_type: 'custom',
            format: 'currency',
            show_in_summary: true
          }
        ]
      },
      {
        id: 'creances_risquees',
        name: 'CRÉANCES À RISQUE',
        order: 2,
        items: [
          {
            id: 'echu_30_60_jours',
            name: 'Échues de 30 à 60 jours',
            account_codes: ['411'],
            calculation_type: 'custom',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'echu_60_90_jours',
            name: 'Échues de 60 à 90 jours',
            account_codes: ['411'],
            calculation_type: 'custom',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'echu_plus_90_jours',
            name: 'Échues à plus de 90 jours',
            account_codes: ['411'],
            calculation_type: 'custom',
            format: 'currency',
            show_in_summary: true
          }
        ]
      },
      {
        id: 'provisions',
        name: 'PROVISIONS POUR CRÉANCES DOUTEUSES',
        order: 3,
        items: [
          {
            id: 'creances_douteuses',
            name: 'Créances douteuses',
            account_codes: ['416'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'provisions_creances',
            name: 'Provisions pour créances douteuses',
            account_codes: ['491'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          }
        ]
      }
    ],
    styling: {
      font_family: 'Arial',
      font_size: 10,
      header_color: '#ea580c',
      show_logo: true,
      show_watermark: false
    },
    is_default: true
  },

  // 6. RATIOS FINANCIERS AVANCÉS
  {
    name: 'Analyse par Ratios Financiers',
    description: 'Analyse complète des ratios de liquidité, rentabilité, activité et endettement',
    type: 'financial_ratios',
    sections: [
      {
        id: 'ratios_liquidite',
        name: 'RATIOS DE LIQUIDITÉ',
        order: 1,
        items: [
          {
            id: 'ratio_liquidite_generale',
            name: 'Ratio de liquidité générale',
            account_codes: [],
            calculation_type: 'custom',
            format: 'number',
            show_in_summary: true
          },
          {
            id: 'ratio_liquidite_reduite',
            name: 'Ratio de liquidité réduite',
            account_codes: [],
            calculation_type: 'custom',
            format: 'number',
            show_in_summary: true
          },
          {
            id: 'ratio_liquidite_immediate',
            name: 'Ratio de liquidité immédiate',
            account_codes: [],
            calculation_type: 'custom',
            format: 'number',
            show_in_summary: true
          }
        ]
      },
      {
        id: 'ratios_rentabilite',
        name: 'RATIOS DE RENTABILITÉ',
        order: 2,
        items: [
          {
            id: 'marge_brute',
            name: 'Marge brute (%)',
            account_codes: [],
            calculation_type: 'custom',
            format: 'percentage',
            show_in_summary: true
          },
          {
            id: 'marge_operationnelle',
            name: 'Marge opérationnelle (%)',
            account_codes: [],
            calculation_type: 'custom',
            format: 'percentage',
            show_in_summary: true
          },
          {
            id: 'marge_nette',
            name: 'Marge nette (%)',
            account_codes: [],
            calculation_type: 'custom',
            format: 'percentage',
            show_in_summary: true
          },
          {
            id: 'roa',
            name: 'Rentabilité des actifs (ROA) (%)',
            account_codes: [],
            calculation_type: 'custom',
            format: 'percentage',
            show_in_summary: true
          },
          {
            id: 'roe',
            name: 'Rentabilité des capitaux propres (ROE) (%)',
            account_codes: [],
            calculation_type: 'custom',
            format: 'percentage',
            show_in_summary: true
          }
        ]
      },
      {
        id: 'ratios_activite',
        name: 'RATIOS D\'ACTIVITÉ',
        order: 3,
        items: [
          {
            id: 'rotation_stocks',
            name: 'Rotation des stocks (jours)',
            account_codes: [],
            calculation_type: 'custom',
            format: 'number',
            show_in_summary: true
          },
          {
            id: 'delai_recouvrement',
            name: 'Délai de recouvrement clients (jours)',
            account_codes: [],
            calculation_type: 'custom',
            format: 'number',
            show_in_summary: true
          },
          {
            id: 'delai_paiement',
            name: 'Délai de paiement fournisseurs (jours)',
            account_codes: [],
            calculation_type: 'custom',
            format: 'number',
            show_in_summary: true
          }
        ]
      },
      {
        id: 'ratios_endettement',
        name: 'RATIOS D\'ENDETTEMENT',
        order: 4,
        items: [
          {
            id: 'ratio_endettement',
            name: 'Ratio d\'endettement',
            account_codes: [],
            calculation_type: 'custom',
            format: 'number',
            show_in_summary: true
          },
          {
            id: 'capacite_remboursement',
            name: 'Capacité de remboursement (années)',
            account_codes: [],
            calculation_type: 'custom',
            format: 'number',
            show_in_summary: true
          },
          {
            id: 'couverture_interets',
            name: 'Couverture des intérêts',
            account_codes: [],
            calculation_type: 'custom',
            format: 'number',
            show_in_summary: true
          }
        ]
      }
    ],
    styling: {
      font_family: 'Arial',
      font_size: 10,
      header_color: '#8b5cf6',
      show_logo: true,
      show_watermark: false
    },
    is_default: true
  },

  // 7. DÉCLARATION TVA
  {
    name: 'Déclaration TVA CA3',
    description: 'Déclaration de TVA mensuelle conforme aux obligations fiscales françaises',
    type: 'vat_report',
    sections: [
      {
        id: 'tva_collectee',
        name: 'TVA COLLECTÉE',
        order: 1,
        items: [
          {
            id: 'base_taux_normal',
            name: 'Base taux normal (20%)',
            account_codes: ['7011', '7012'],
            calculation_type: 'custom',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'tva_taux_normal',
            name: 'TVA taux normal',
            account_codes: ['44571'],
            calculation_type: 'custom',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'base_taux_reduit',
            name: 'Base taux réduit (5,5% et 10%)',
            account_codes: ['7013', '7014'],
            calculation_type: 'custom',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'tva_taux_reduit',
            name: 'TVA taux réduit',
            account_codes: ['44572'],
            calculation_type: 'custom',
            format: 'currency',
            show_in_summary: true
          }
        ]
      },
      {
        id: 'tva_deductible',
        name: 'TVA DÉDUCTIBLE',
        order: 2,
        items: [
          {
            id: 'tva_biens_services',
            name: 'TVA sur biens et services',
            account_codes: ['44566'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'tva_immobilisations',
            name: 'TVA sur immobilisations',
            account_codes: ['44562'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          }
        ]
      },
      {
        id: 'tva_due',
        name: 'TVA À DÉCAISSER',
        order: 3,
        items: [
          {
            id: 'total_tva_collectee',
            name: 'Total TVA collectée',
            account_codes: [],
            calculation_type: 'custom',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'total_tva_deductible',
            name: 'Total TVA déductible',
            account_codes: [],
            calculation_type: 'custom',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: 'tva_nette_due',
            name: 'TVA nette due',
            account_codes: [],
            calculation_type: 'custom',
            format: 'currency',
            show_in_summary: true
          }
        ]
      }
    ],
    styling: {
      font_family: 'Arial',
      font_size: 10,
      header_color: '#dc2626',
      show_logo: true,
      show_watermark: true
    },
    is_default: true
  }
];

// Fonction utilitaire pour créer les templates avec les IDs générés
export function createReportTemplate(
  templateData: Omit<ReportTemplate, 'id' | 'enterprise_id' | 'created_by' | 'created_at' | 'updated_at'>,
  enterpriseId: string,
  createdBy: string
): ReportTemplate {
  const now = new Date().toISOString();

  return {
    ...templateData,
    id: crypto.randomUUID(),
    enterprise_id: enterpriseId,
    created_by: createdBy,
    created_at: now,
    updated_at: now,
    sections: templateData.sections.map(section => ({
      ...section,
      id: section.id || crypto.randomUUID(),
      items: section.items.map(item => ({
        ...item,
        id: item.id || crypto.randomUUID()
      }))
    }))
  };
}

// Fonction pour obtenir un template par type
export function getTemplateByType(type: string): typeof DEFAULT_REPORT_TEMPLATES[0] | undefined {
  return DEFAULT_REPORT_TEMPLATES.find(template => template.type === type);
}

// Fonction pour obtenir tous les templates par catégorie
export function getTemplatesByCategory() {
  const categories = {
    financial: DEFAULT_REPORT_TEMPLATES.filter(t =>
      ['balance_sheet', 'income_statement', 'cash_flow'].includes(t.type)
    ),
    analytical: DEFAULT_REPORT_TEMPLATES.filter(t =>
      ['trial_balance', 'general_ledger', 'financial_ratios'].includes(t.type)
    ),
    commercial: DEFAULT_REPORT_TEMPLATES.filter(t =>
      ['aged_receivables', 'aged_payables'].includes(t.type)
    ),
    fiscal: DEFAULT_REPORT_TEMPLATES.filter(t =>
      ['vat_report', 'tax_summary'].includes(t.type)
    )
  };

  return categories;
}
