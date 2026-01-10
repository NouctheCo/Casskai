/**
 * CassKai - Templates réglementaires OHADA (SYSCOHADA)
 * Configurations pour les 17 pays membres de l'OHADA
 */

import { createTemplatesFromConfigs, type TemplateConfig } from './templateFactory';

/**
 * TEMPLATES OHADA - SYSCOHADA RÉVISÉ
 *
 * L'OHADA (Organisation pour l'Harmonisation en Afrique du Droit des Affaires)
 * couvre 17 pays avec le système comptable SYSCOHADA harmonisé.
 *
 * ÉTATS FINANCIERS COMMUNS à tous les pays OHADA (4 documents):
 * - Bilan Actif/Passif SYSCOHADA
 * - Compte de résultat par nature
 * - TAFIRE (Tableau financier des ressources et emplois)
 * - État annexé
 *
 * DÉCLARATIONS FISCALES PAR PAYS:
 * Les déclarations fiscales varient selon chaque pays membre.
 * Actuellement implémentées pour: SN, CI, CM (12 déclarations)
 * À implémenter: BJ, BF, CG, CD, GA, GN, GW, GQ, KM, ML, NE, CF, TD, TG
 *
 * TOTAL ACTUEL: 16 templates (4 états financiers + 12 déclarations fiscales)
 */

/**
 * Liste complète des 17 pays membres de l'OHADA
 */
export const OHADA_COUNTRIES = [
  { code: 'BJ', name: 'Bénin', taxImplemented: false },
  { code: 'BF', name: 'Burkina Faso', taxImplemented: false },
  { code: 'CM', name: 'Cameroun', taxImplemented: true },
  { code: 'CF', name: 'République Centrafricaine', taxImplemented: false },
  { code: 'KM', name: 'Comores', taxImplemented: false },
  { code: 'CG', name: 'Congo-Brazzaville', taxImplemented: false },
  { code: 'CD', name: 'République Démocratique du Congo', taxImplemented: false },
  { code: 'CI', name: 'Côte d\'Ivoire', taxImplemented: true },
  { code: 'GA', name: 'Gabon', taxImplemented: false },
  { code: 'GN', name: 'Guinée-Conakry', taxImplemented: false },
  { code: 'GW', name: 'Guinée-Bissau', taxImplemented: false },
  { code: 'GQ', name: 'Guinée équatoriale', taxImplemented: false },
  { code: 'ML', name: 'Mali', taxImplemented: false },
  { code: 'NE', name: 'Niger', taxImplemented: false },
  { code: 'SN', name: 'Sénégal', taxImplemented: true },
  { code: 'TD', name: 'Tchad', taxImplemented: false },
  { code: 'TG', name: 'Togo', taxImplemented: false }
] as const;

export const OHADA_TEMPLATES_CONFIG: TemplateConfig[] = [
  // ========== ÉTATS FINANCIERS SYSCOHADA (Communs à tous les pays) ==========

  // Bilan Actif SYSCOHADA
  {
    documentType: 'OHADA_BILAN_ACTIF',
    countryCode: 'XX', // Applicable SN, CI, CM
    accountingStandard: 'SYSCOHADA',
    name: 'Bilan Actif SYSCOHADA',
    description: 'Bilan actif selon le plan comptable SYSCOHADA révisé',
    category: 'financial_statements',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'actif_immobilise',
        title: 'ACTIF IMMOBILISÉ',
        fields: [
          { id: 'charges_immobilisees', label: 'Charges immobilisées', accounts: ['20'], debitCredit: 'DEBIT' },
          { id: 'immob_incorp', label: 'Immobilisations incorporelles', accounts: ['21', '22', '23'], debitCredit: 'DEBIT' },
          { id: 'immob_corp', label: 'Immobilisations corporelles', accounts: ['24'], debitCredit: 'DEBIT' },
          { id: 'immob_financieres', label: 'Immobilisations financières', accounts: ['26', '27'], debitCredit: 'DEBIT' },
          { id: 'amortissements', label: 'Amortissements', accounts: ['28'], debitCredit: 'CREDIT' },
          { id: 'provisions_actif', label: 'Provisions pour dépréciation', accounts: ['29'], debitCredit: 'CREDIT' },
          { id: 'total_actif_immob', label: 'TOTAL ACTIF IMMOBILISÉ NET', formula: '=charges_immobilisees+immob_incorp+immob_corp+immob_financieres-amortissements-provisions_actif' }
        ]
      },
      {
        id: 'actif_circulant',
        title: 'ACTIF CIRCULANT',
        fields: [
          { id: 'stocks', label: 'Stocks et en-cours', accounts: ['31', '32', '33', '34', '35', '36', '37', '38'], debitCredit: 'DEBIT' },
          { id: 'creances_clients', label: 'Créances clients', accounts: ['411', '4181'], debitCredit: 'DEBIT' },
          { id: 'autres_creances', label: 'Autres créances', accounts: ['40', '42', '43', '44', '45', '46', '47', '48'], debitCredit: 'DEBIT' },
          { id: 'titres_placement', label: 'Titres de placement', accounts: ['50'], debitCredit: 'DEBIT' },
          { id: 'valeurs_exploitees', label: 'Valeurs à encaisser', accounts: ['51'], debitCredit: 'DEBIT' },
          { id: 'banques', label: 'Banques, chèques postaux, caisse', accounts: ['52', '53', '54', '57'], debitCredit: 'DEBIT' },
          { id: 'total_actif_circulant', label: 'TOTAL ACTIF CIRCULANT', formula: '=stocks+creances_clients+autres_creances+titres_placement+valeurs_exploitees+banques' }
        ]
      },
      {
        id: 'tresorerie_actif',
        title: 'TRÉSORERIE - ACTIF',
        fields: [
          { id: 'tresorerie_actif', label: 'Trésorerie - Actif', accounts: ['58'], debitCredit: 'DEBIT' }
        ]
      },
      {
        id: 'ecart_conversion',
        title: 'ÉCART DE CONVERSION - ACTIF',
        fields: [
          { id: 'ecart_conversion_actif', label: 'Écart de conversion - Actif', accounts: ['478'], debitCredit: 'DEBIT' }
        ]
      }
    ],
    balanceChecks: [
      { left: ['total_actif_immob', 'total_actif_circulant', 'tresorerie_actif', 'ecart_conversion_actif'], right: ['total_passif'], tolerance: 1.0 }
    ]
  },

  // Bilan Passif SYSCOHADA
  {
    documentType: 'OHADA_BILAN_PASSIF',
    countryCode: 'XX',
    accountingStandard: 'SYSCOHADA',
    name: 'Bilan Passif SYSCOHADA',
    description: 'Bilan passif selon le plan comptable SYSCOHADA révisé',
    category: 'financial_statements',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'capitaux_propres',
        title: 'CAPITAUX PROPRES ET RESSOURCES ASSIMILÉES',
        fields: [
          { id: 'capital', label: 'Capital', accounts: ['101'], debitCredit: 'CREDIT' },
          { id: 'apporteurs_capital', label: 'Apporteurs capital non appelé', accounts: ['109'], debitCredit: 'DEBIT' },
          { id: 'primes', label: 'Primes et réserves', accounts: ['104', '105', '11'], debitCredit: 'CREDIT' },
          { id: 'ecarts_reevaluation', label: 'Écarts de réévaluation', accounts: ['12'], debitCredit: 'CREDIT' },
          { id: 'resultat_net', label: 'Résultat net de l\'exercice', required: true },
          { id: 'subventions_invest', label: 'Subventions d\'investissement', accounts: ['14'], debitCredit: 'CREDIT' },
          { id: 'provisions_reglementees', label: 'Provisions réglementées', accounts: ['15'], debitCredit: 'CREDIT' },
          { id: 'total_capitaux_propres', label: 'TOTAL CAPITAUX PROPRES', formula: '=capital-apporteurs_capital+primes+ecarts_reevaluation+resultat_net+subventions_invest+provisions_reglementees' }
        ]
      },
      {
        id: 'dettes_financieres',
        title: 'DETTES FINANCIÈRES ET RESSOURCES ASSIMILÉES',
        fields: [
          { id: 'emprunts', label: 'Emprunts et dettes financières', accounts: ['16', '17', '18'], debitCredit: 'CREDIT' },
          { id: 'provisions_risques', label: 'Provisions pour risques et charges', accounts: ['19'], debitCredit: 'CREDIT' },
          { id: 'total_dettes_financieres', label: 'TOTAL DETTES FINANCIÈRES', formula: '=emprunts+provisions_risques' }
        ]
      },
      {
        id: 'passif_circulant',
        title: 'PASSIF CIRCULANT',
        fields: [
          { id: 'dettes_fournisseurs', label: 'Fournisseurs et comptes rattachés', accounts: ['401', '408'], debitCredit: 'CREDIT' },
          { id: 'clients_crediteurs', label: 'Clients créditeurs', accounts: ['419'], debitCredit: 'CREDIT' },
          { id: 'dettes_fiscales', label: 'Dettes fiscales', accounts: ['44'], debitCredit: 'CREDIT' },
          { id: 'dettes_sociales', label: 'Dettes sociales', accounts: ['42', '43'], debitCredit: 'CREDIT' },
          { id: 'autres_dettes', label: 'Autres dettes', accounts: ['40', '45', '46', '47', '48'], debitCredit: 'CREDIT' },
          { id: 'risques_provisionnes', label: 'Risques provisionnés', accounts: ['499'], debitCredit: 'CREDIT' },
          { id: 'total_passif_circulant', label: 'TOTAL PASSIF CIRCULANT', formula: '=dettes_fournisseurs+clients_crediteurs+dettes_fiscales+dettes_sociales+autres_dettes+risques_provisionnes' }
        ]
      },
      {
        id: 'tresorerie_passif',
        title: 'TRÉSORERIE - PASSIF',
        fields: [
          { id: 'tresorerie_passif', label: 'Trésorerie - Passif', accounts: ['56'], debitCredit: 'CREDIT' }
        ]
      },
      {
        id: 'ecart_conversion_passif',
        title: 'ÉCART DE CONVERSION - PASSIF',
        fields: [
          { id: 'ecart_conversion_passif', label: 'Écart de conversion - Passif', accounts: ['479'], debitCredit: 'CREDIT' },
          { id: 'total_passif', label: 'TOTAL PASSIF', formula: '=total_capitaux_propres+total_dettes_financieres+total_passif_circulant+tresorerie_passif+ecart_conversion_passif' }
        ]
      }
    ]
  },

  // Compte de résultat (par nature)
  {
    documentType: 'OHADA_COMPTE_RESULTAT',
    countryCode: 'XX',
    accountingStandard: 'SYSCOHADA',
    name: 'Compte de résultat SYSCOHADA',
    description: 'Compte de résultat par nature selon SYSCOHADA',
    category: 'financial_statements',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'activite_exploitation',
        title: 'ACTIVITÉ D\'EXPLOITATION',
        fields: [
          { id: 'ventes_marchandises', label: 'Ventes de marchandises', accounts: ['701'], debitCredit: 'CREDIT' },
          { id: 'achats_marchandises', label: 'Achats de marchandises', accounts: ['601'], debitCredit: 'DEBIT' },
          { id: 'marge_commerciale', label: 'MARGE COMMERCIALE', formula: '=ventes_marchandises-achats_marchandises' },
          { id: 'production_vendue', label: 'Production vendue', accounts: ['702', '703', '704', '705', '706'], debitCredit: 'CREDIT' },
          { id: 'production_stockee', label: 'Production stockée', accounts: ['73'], debitCredit: 'NET' },
          { id: 'production_immobilisee', label: 'Production immobilisée', accounts: ['72'], debitCredit: 'CREDIT' },
          { id: 'achats_matieres', label: 'Achats de matières et fournitures', accounts: ['602', '603', '604', '605', '608'], debitCredit: 'DEBIT' },
          { id: 'variation_stocks', label: 'Variation des stocks', accounts: ['6033'], debitCredit: 'NET' },
          { id: 'transports', label: 'Transports', accounts: ['61'], debitCredit: 'DEBIT' },
          { id: 'services_exterieurs', label: 'Services extérieurs', accounts: ['62', '63'], debitCredit: 'DEBIT' },
          { id: 'impots_taxes', label: 'Impôts et taxes', accounts: ['64'], debitCredit: 'DEBIT' },
          { id: 'autres_charges', label: 'Autres charges', accounts: ['65'], debitCredit: 'DEBIT' },
          { id: 'charges_personnel', label: 'Charges de personnel', accounts: ['66'], debitCredit: 'DEBIT' },
          { id: 'valeur_ajoutee', label: 'VALEUR AJOUTÉE', formula: '=marge_commerciale+production_vendue+production_stockee+production_immobilisee-achats_matieres-variation_stocks-transports-services_exterieurs-impots_taxes-autres_charges' },
          { id: 'excedent_brut', label: 'EXCÉDENT BRUT D\'EXPLOITATION', formula: '=valeur_ajoutee-charges_personnel' }
        ]
      },
      {
        id: 'resultat_exploitation',
        title: 'RÉSULTAT D\'EXPLOITATION',
        fields: [
          { id: 'dotations_amortissements', label: 'Dotations aux amortissements', accounts: ['681'], debitCredit: 'DEBIT' },
          { id: 'dotations_provisions', label: 'Dotations aux provisions', accounts: ['691'], debitCredit: 'DEBIT' },
          { id: 'reprises_provisions', label: 'Reprises de provisions', accounts: ['791', '798'], debitCredit: 'CREDIT' },
          { id: 'resultat_exploitation', label: 'RÉSULTAT D\'EXPLOITATION', formula: '=excedent_brut-dotations_amortissements-dotations_provisions+reprises_provisions' }
        ]
      },
      {
        id: 'resultat_financier',
        title: 'RÉSULTAT FINANCIER',
        fields: [
          { id: 'produits_financiers', label: 'Produits financiers', accounts: ['77'], debitCredit: 'CREDIT' },
          { id: 'charges_financieres', label: 'Charges financières', accounts: ['67'], debitCredit: 'DEBIT' },
          { id: 'resultat_financier', label: 'RÉSULTAT FINANCIER', formula: '=produits_financiers-charges_financieres' }
        ]
      },
      {
        id: 'resultat_hao',
        title: 'RÉSULTAT HAO (Hors Activités Ordinaires)',
        fields: [
          { id: 'produits_hao', label: 'Produits HAO', accounts: ['82', '84', '86', '88'], debitCredit: 'CREDIT' },
          { id: 'charges_hao', label: 'Charges HAO', accounts: ['81', '83', '85'], debitCredit: 'DEBIT' },
          { id: 'resultat_hao', label: 'RÉSULTAT HAO', formula: '=produits_hao-charges_hao' }
        ]
      },
      {
        id: 'resultat_net',
        title: 'RÉSULTAT NET',
        fields: [
          { id: 'participation_personnel', label: 'Participation des travailleurs', accounts: ['87'], debitCredit: 'DEBIT' },
          { id: 'impots_benefices', label: 'Impôts sur le résultat', accounts: ['89'], debitCredit: 'DEBIT' },
          { id: 'resultat_net', label: 'RÉSULTAT NET DE L\'EXERCICE', formula: '=resultat_exploitation+resultat_financier+resultat_hao-participation_personnel-impots_benefices' }
        ]
      }
    ]
  },

  // TAFIRE (Tableau Financier des Ressources et Emplois)
  {
    documentType: 'OHADA_TAFIRE',
    countryCode: 'XX',
    accountingStandard: 'SYSCOHADA',
    name: 'TAFIRE',
    description: 'Tableau financier des ressources et emplois',
    category: 'financial_statements',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'capacite_autofinancement',
        title: 'CAPACITÉ D\'AUTOFINANCEMENT',
        fields: [
          { id: 'excedent_brut_exploit', label: 'Excédent brut d\'exploitation', required: true },
          { id: 'produits_financiers_caf', label: 'Produits financiers encaissables', required: false },
          { id: 'charges_financieres_caf', label: 'Charges financières décaissables', required: false },
          { id: 'produits_hao_caf', label: 'Produits HAO encaissables', required: false },
          { id: 'charges_hao_caf', label: 'Charges HAO décaissables', required: false },
          { id: 'impots_benefices_caf', label: 'Impôts sur le résultat', required: false },
          { id: 'caf', label: 'CAPACITÉ D\'AUTOFINANCEMENT', formula: '=excedent_brut_exploit+produits_financiers_caf-charges_financieres_caf+produits_hao_caf-charges_hao_caf-impots_benefices_caf' }
        ]
      },
      {
        id: 'variation_bfr',
        title: 'VARIATION DU BESOIN DE FINANCEMENT D\'EXPLOITATION',
        fields: [
          { id: 'variation_stocks_bfr', label: 'Variation des stocks', required: false },
          { id: 'variation_creances', label: 'Variation des créances', required: false },
          { id: 'variation_dettes', label: 'Variation des dettes circulantes', required: false },
          { id: 'variation_bfr', label: 'VARIATION BFR', formula: '=variation_stocks_bfr+variation_creances-variation_dettes' }
        ]
      },
      {
        id: 'flux_tresorerie',
        title: 'FLUX DE TRÉSORERIE',
        fields: [
          { id: 'flux_tresorerie_exploitation', label: 'Flux trésorerie d\'exploitation', formula: '=caf-variation_bfr' },
          { id: 'flux_tresorerie_investissement', label: 'Flux trésorerie d\'investissement', required: false },
          { id: 'flux_tresorerie_financement', label: 'Flux trésorerie de financement', required: false },
          { id: 'variation_tresorerie', label: 'VARIATION DE TRÉSORERIE', formula: '=flux_tresorerie_exploitation+flux_tresorerie_investissement+flux_tresorerie_financement' }
        ]
      }
    ]
  },

  // ========== DÉCLARATIONS FISCALES SÉNÉGAL ==========

  // Déclaration TVA Sénégal
  {
    documentType: 'SN_TVA',
    countryCode: 'SN',
    accountingStandard: 'SYSCOHADA',
    name: 'Déclaration TVA - Sénégal',
    description: 'Déclaration mensuelle de TVA au Sénégal',
    category: 'tax_returns',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'tva_collectee',
        title: 'TVA COLLECTÉE',
        fields: [
          { id: 'ca_taux_18', label: 'Chiffre d\'affaires HT (taux 18%)', required: true },
          { id: 'tva_18', label: 'TVA collectée (18%)', formula: '=ca_taux_18*0.18' },
          { id: 'ca_exportations', label: 'Exportations et exonérées', required: false },
          { id: 'total_tva_collectee', label: 'TOTAL TVA COLLECTÉE', formula: '=tva_18' }
        ]
      },
      {
        id: 'tva_deductible',
        title: 'TVA DÉDUCTIBLE',
        fields: [
          { id: 'tva_immobilisations', label: 'TVA sur immobilisations', required: false },
          { id: 'tva_biens_services', label: 'TVA sur biens et services', required: false },
          { id: 'total_tva_deductible', label: 'TOTAL TVA DÉDUCTIBLE', formula: '=tva_immobilisations+tva_biens_services' }
        ]
      },
      {
        id: 'tva_nette',
        title: 'TVA NETTE',
        fields: [
          { id: 'credit_tva_anterieur', label: 'Crédit de TVA du mois précédent', required: false },
          { id: 'tva_nette_due', label: 'TVA nette à payer', formula: '=total_tva_collectee-total_tva_deductible-credit_tva_anterieur' }
        ]
      }
    ]
  },

  // Déclaration IS Sénégal
  {
    documentType: 'SN_IS',
    countryCode: 'SN',
    accountingStandard: 'SYSCOHADA',
    name: 'Déclaration IS - Sénégal',
    description: 'Déclaration annuelle de l\'impôt sur les sociétés au Sénégal',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'resultat_fiscal',
        title: 'RÉSULTAT FISCAL',
        fields: [
          { id: 'resultat_comptable', label: 'Résultat comptable', required: true },
          { id: 'reintegrations', label: 'Réintégrations', required: false },
          { id: 'deductions', label: 'Déductions', required: false },
          { id: 'resultat_fiscal', label: 'RÉSULTAT FISCAL', formula: '=resultat_comptable+reintegrations-deductions' }
        ]
      },
      {
        id: 'impot_societes',
        title: 'IMPÔT SUR LES SOCIÉTÉS',
        fields: [
          { id: 'taux_is', label: 'Taux IS (30%)', type: 'percentage', required: true },
          { id: 'is_du', label: 'IS dû', formula: '=resultat_fiscal>0 ? resultat_fiscal*taux_is/100 : 0' },
          { id: 'acomptes_verses', label: 'Acomptes versés', required: false },
          { id: 'solde_is', label: 'Solde IS à payer', formula: '=is_du-acomptes_verses' }
        ]
      }
    ]
  },

  // Taxe sur les salaires Sénégal
  {
    documentType: 'SN_TAXE_SALAIRES',
    countryCode: 'SN',
    accountingStandard: 'SYSCOHADA',
    name: 'Taxe sur les salaires - Sénégal',
    description: 'Déclaration et paiement de la taxe sur les salaires',
    category: 'social_declarations',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'salaires',
        title: 'MASSE SALARIALE',
        fields: [
          { id: 'salaires_bruts', label: 'Salaires bruts', accounts: ['661'], debitCredit: 'DEBIT' },
          { id: 'taux_taxe', label: 'Taux de taxe (%)', type: 'percentage', required: true },
          { id: 'taxe_salaires', label: 'Taxe sur les salaires', formula: '=salaires_bruts*taux_taxe/100' }
        ]
      }
    ]
  },

  // Contribution forfaitaire Sénégal
  {
    documentType: 'SN_CFE',
    countryCode: 'SN',
    accountingStandard: 'SYSCOHADA',
    name: 'Contribution Forfaitaire des Entreprises - Sénégal',
    description: 'Contribution forfaitaire annuelle',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'contribution',
        title: 'CONTRIBUTION FORFAITAIRE',
        fields: [
          { id: 'chiffre_affaires', label: 'Chiffre d\'affaires annuel', required: true },
          { id: 'taux_contribution', label: 'Taux de contribution (%)', type: 'percentage', required: true },
          { id: 'contribution_due', label: 'Contribution due', formula: '=chiffre_affaires*taux_contribution/100' }
        ]
      }
    ]
  },

  // ========== DÉCLARATIONS FISCALES CÔTE D'IVOIRE ==========

  // Déclaration TVA Côte d'Ivoire
  {
    documentType: 'CI_TVA',
    countryCode: 'CI',
    accountingStandard: 'SYSCOHADA',
    name: 'Déclaration TVA - Côte d\'Ivoire',
    description: 'Déclaration mensuelle de TVA en Côte d\'Ivoire',
    category: 'tax_returns',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'tva_collectee',
        title: 'TVA COLLECTÉE',
        fields: [
          { id: 'ca_taux_18', label: 'Chiffre d\'affaires HT (taux 18%)', required: true },
          { id: 'tva_18', label: 'TVA collectée (18%)', formula: '=ca_taux_18*0.18' },
          { id: 'ca_exportations', label: 'Exportations et opérations exonérées', required: false },
          { id: 'total_tva_collectee', label: 'TOTAL TVA COLLECTÉE', formula: '=tva_18' }
        ]
      },
      {
        id: 'tva_deductible',
        title: 'TVA DÉDUCTIBLE',
        fields: [
          { id: 'tva_immobilisations', label: 'TVA sur immobilisations', required: false },
          { id: 'tva_achats_services', label: 'TVA sur achats et services', required: false },
          { id: 'total_tva_deductible', label: 'TOTAL TVA DÉDUCTIBLE', formula: '=tva_immobilisations+tva_achats_services' }
        ]
      },
      {
        id: 'tva_nette',
        title: 'TVA NETTE',
        fields: [
          { id: 'credit_tva_precedent', label: 'Crédit de TVA du mois précédent', required: false },
          { id: 'tva_nette_due', label: 'TVA nette à payer', formula: '=total_tva_collectee-total_tva_deductible-credit_tva_precedent' }
        ]
      }
    ]
  },

  // Déclaration BIC Côte d'Ivoire
  {
    documentType: 'CI_BIC',
    countryCode: 'CI',
    accountingStandard: 'SYSCOHADA',
    name: 'Déclaration BIC - Côte d\'Ivoire',
    description: 'Déclaration des Bénéfices Industriels et Commerciaux',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'resultat_fiscal',
        title: 'RÉSULTAT FISCAL',
        fields: [
          { id: 'resultat_comptable', label: 'Résultat comptable', required: true },
          { id: 'reintegrations', label: 'Réintégrations fiscales', required: false },
          { id: 'deductions', label: 'Déductions fiscales', required: false },
          { id: 'resultat_fiscal', label: 'RÉSULTAT FISCAL', formula: '=resultat_comptable+reintegrations-deductions' }
        ]
      },
      {
        id: 'impot_bic',
        title: 'IMPÔT BIC',
        fields: [
          { id: 'taux_bic', label: 'Taux BIC (25%)', type: 'percentage', required: true },
          { id: 'impot_bic', label: 'Impôt BIC', formula: '=resultat_fiscal>0 ? resultat_fiscal*taux_bic/100 : 0' },
          { id: 'acomptes_bic', label: 'Acomptes versés', required: false },
          { id: 'solde_bic', label: 'Solde à payer', formula: '=impot_bic-acomptes_bic' }
        ]
      }
    ]
  },

  // ITS Côte d'Ivoire
  {
    documentType: 'CI_ITS',
    countryCode: 'CI',
    accountingStandard: 'SYSCOHADA',
    name: 'ITS - Côte d\'Ivoire',
    description: 'Impôt sur les Traitements et Salaires',
    category: 'social_declarations',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'salaires',
        title: 'MASSE SALARIALE',
        fields: [
          { id: 'salaires_bruts', label: 'Salaires bruts imposables', accounts: ['661'], debitCredit: 'DEBIT' },
          { id: 'its_retenu', label: 'ITS retenu à la source', required: true },
          { id: 'cn_patronale', label: 'Contribution Nationale (CN) patronale', required: false }
        ]
      }
    ]
  },

  // Patente Côte d'Ivoire
  {
    documentType: 'CI_PATENTE',
    countryCode: 'CI',
    accountingStandard: 'SYSCOHADA',
    name: 'Patente - Côte d\'Ivoire',
    description: 'Contribution des patentes (licence d\'exploitation)',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'patente',
        title: 'PATENTE',
        fields: [
          { id: 'chiffre_affaires', label: 'Chiffre d\'affaires annuel', required: true },
          { id: 'valeur_locative', label: 'Valeur locative des locaux', required: false },
          { id: 'patente_due', label: 'Patente due', required: true }
        ]
      }
    ]
  },

  // ========== DÉCLARATIONS FISCALES CAMEROUN ==========

  // Déclaration TVA Cameroun
  {
    documentType: 'CM_TVA',
    countryCode: 'CM',
    accountingStandard: 'SYSCOHADA',
    name: 'Déclaration TVA - Cameroun',
    description: 'Déclaration mensuelle de TVA au Cameroun',
    category: 'tax_returns',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'tva_collectee',
        title: 'TVA COLLECTÉE',
        fields: [
          { id: 'ca_taux_1925', label: 'Chiffre d\'affaires HT (taux 19,25%)', required: true },
          { id: 'tva_1925', label: 'TVA collectée (19,25%)', formula: '=ca_taux_1925*0.1925' },
          { id: 'ca_exportations', label: 'Exportations et exonérées', required: false },
          { id: 'total_tva_collectee', label: 'TOTAL TVA COLLECTÉE', formula: '=tva_1925' }
        ]
      },
      {
        id: 'tva_deductible',
        title: 'TVA DÉDUCTIBLE',
        fields: [
          { id: 'tva_immobilisations', label: 'TVA sur immobilisations', required: false },
          { id: 'tva_autres_achats', label: 'TVA sur autres achats', required: false },
          { id: 'total_tva_deductible', label: 'TOTAL TVA DÉDUCTIBLE', formula: '=tva_immobilisations+tva_autres_achats' }
        ]
      },
      {
        id: 'tva_nette',
        title: 'TVA NETTE',
        fields: [
          { id: 'credit_tva_mois_precedent', label: 'Crédit de TVA mois précédent', required: false },
          { id: 'tva_nette_due', label: 'TVA nette à payer', formula: '=total_tva_collectee-total_tva_deductible-credit_tva_mois_precedent' }
        ]
      }
    ]
  },

  // Déclaration IS Cameroun
  {
    documentType: 'CM_IS',
    countryCode: 'CM',
    accountingStandard: 'SYSCOHADA',
    name: 'Déclaration IS - Cameroun',
    description: 'Déclaration annuelle de l\'impôt sur les sociétés',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'resultat_fiscal',
        title: 'RÉSULTAT FISCAL',
        fields: [
          { id: 'resultat_comptable', label: 'Résultat comptable', required: true },
          { id: 'reintegrations', label: 'Réintégrations', required: false },
          { id: 'deductions', label: 'Déductions', required: false },
          { id: 'resultat_fiscal', label: 'RÉSULTAT FISCAL', formula: '=resultat_comptable+reintegrations-deductions' }
        ]
      },
      {
        id: 'impot_societes',
        title: 'IMPÔT SUR LES SOCIÉTÉS',
        fields: [
          { id: 'taux_is', label: 'Taux IS (33%)', type: 'percentage', required: true },
          { id: 'is_du', label: 'IS dû', formula: '=resultat_fiscal>0 ? resultat_fiscal*taux_is/100 : 0' },
          { id: 'acomptes_is', label: 'Acomptes IS versés', required: false },
          { id: 'solde_is', label: 'Solde IS', formula: '=is_du-acomptes_is' }
        ]
      }
    ]
  },

  // IRCM Cameroun
  {
    documentType: 'CM_IRCM',
    countryCode: 'CM',
    accountingStandard: 'SYSCOHADA',
    name: 'IRCM - Cameroun',
    description: 'Impôt sur le Revenu des Personnes Morales',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'revenus',
        title: 'REVENUS IMPOSABLES',
        fields: [
          { id: 'revenus_locatifs', label: 'Revenus locatifs', required: false },
          { id: 'revenus_capitaux_mobiliers', label: 'Revenus de capitaux mobiliers', required: false },
          { id: 'autres_revenus', label: 'Autres revenus', required: false },
          { id: 'total_revenus', label: 'TOTAL REVENUS', formula: '=revenus_locatifs+revenus_capitaux_mobiliers+autres_revenus' }
        ]
      },
      {
        id: 'ircm',
        title: 'IRCM',
        fields: [
          { id: 'taux_ircm', label: 'Taux IRCM (%)', type: 'percentage', required: true },
          { id: 'ircm_du', label: 'IRCM dû', formula: '=total_revenus*taux_ircm/100' }
        ]
      }
    ]
  },

  // Taxe sur la masse salariale Cameroun
  {
    documentType: 'CM_TAXE_SALAIRES',
    countryCode: 'CM',
    accountingStandard: 'SYSCOHADA',
    name: 'Taxe sur la masse salariale - Cameroun',
    description: 'Taxe sur la masse salariale et contributions sociales',
    category: 'social_declarations',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'masse_salariale',
        title: 'MASSE SALARIALE',
        fields: [
          { id: 'salaires_bruts', label: 'Masse salariale brute', accounts: ['661'], debitCredit: 'DEBIT' },
          { id: 'cnps_patronale', label: 'CNPS part patronale', required: false },
          { id: 'fne', label: 'FNE (Fonds National de l\'Emploi)', required: false },
          { id: 'credit_foncier', label: 'Crédit Foncier', required: false },
          { id: 'total_charges_sociales', label: 'TOTAL CHARGES SOCIALES', formula: '=cnps_patronale+fne+credit_foncier' }
        ]
      }
    ]
  }
];

/**
 * Génère tous les templates OHADA
 */
export function generateAllOhadaTemplates(): Array<Omit<RegulatoryTemplate, 'id' | 'createdAt' | 'updatedAt'>> {
  return createTemplatesFromConfigs(OHADA_TEMPLATES_CONFIG);
}

/**
 * Récupère un template OHADA par son type
 */
export function getOhadaTemplateConfig(documentType: string): TemplateConfig | undefined {
  return OHADA_TEMPLATES_CONFIG.find(t => t.documentType === documentType);
}

/**
 * Liste des types de documents OHADA disponibles
 */
export const OHADA_DOCUMENT_TYPES = OHADA_TEMPLATES_CONFIG.map(t => t.documentType);

/**
 * Récupère les templates par pays
 */
export function getOhadaTemplatesByCountry(countryCode: string): TemplateConfig[] {
  return OHADA_TEMPLATES_CONFIG.filter(t =>
    t.countryCode === countryCode || t.countryCode === 'MULTI'
  );
}
