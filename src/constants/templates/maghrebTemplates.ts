/**
 * CassKai - Templates réglementaires Maghreb
 * Configurations pour Algérie (SCF), Tunisie (PCM), Maroc (PCM)
 */

import { createTemplatesFromConfigs, type TemplateConfig } from './templateFactory';
import type { RegulatoryTemplate } from '@/types/regulatory';

/**
 * TEMPLATES MAGHREB - SCF/PCM
 *
 * ÉTATS FINANCIERS COMMUNS (5 documents):
 * - Bilan Actif/Passif
 * - Compte de résultat par nature
 * - Tableau des flux de trésorerie
 * - Tableau de variation des capitaux propres
 *
 * DÉCLARATIONS FISCALES ALGÉRIE - SCF (4 documents):
 * - Déclaration TVA mensuelle (G50)
 * - Déclaration IBS (Impôt sur les Bénéfices des Sociétés)
 * - Déclaration IRG salaires
 * - Bilan fiscal (série G)
 *
 * DÉCLARATIONS FISCALES TUNISIE - PCM (4 documents):
 * - Déclaration TVA mensuelle
 * - Déclaration IS (Impôt sur les Sociétés)
 * - Déclaration employeur (retenue à la source)
 * - TFP (Taxe de Formation Professionnelle)
 *
 * DÉCLARATIONS FISCALES MAROC - PCM (4 documents):
 * - Déclaration TVA mensuelle
 * - Déclaration IS
 * - Déclaration IR salaires
 * - Taxe professionnelle
 *
 * TOTAL: 17 documents Maghreb
 */

export const MAGHREB_TEMPLATES_CONFIG: TemplateConfig[] = [
  // ========== ÉTATS FINANCIERS SCF/PCM (Communs) ==========

  // Bilan Actif
  {
    documentType: 'MAGHREB_BILAN_ACTIF',
    countryCode: 'XX', // Applicable DZ, TN, MA
    accountingStandard: 'SCF', // Ou PCM selon pays
    name: 'Bilan Actif - Maghreb',
    description: 'Bilan actif selon les normes SCF/PCM',
    category: 'financial_statements',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'actif_non_courant',
        title: 'ACTIF NON COURANT',
        fields: [
          { id: 'immob_incorp', label: 'Immobilisations incorporelles', accounts: ['20', '21', '22'], debitCredit: 'DEBIT' },
          { id: 'immob_corp', label: 'Immobilisations corporelles', accounts: ['23', '24'], debitCredit: 'DEBIT' },
          { id: 'immob_financieres', label: 'Immobilisations financières', accounts: ['26', '27'], debitCredit: 'DEBIT' },
          { id: 'amortissements', label: 'Amortissements', accounts: ['28'], debitCredit: 'CREDIT' },
          { id: 'provisions', label: 'Provisions pour dépréciation', accounts: ['29'], debitCredit: 'CREDIT' },
          { id: 'total_actif_non_courant', label: 'TOTAL ACTIF NON COURANT', formula: '=immob_incorp+immob_corp+immob_financieres-amortissements-provisions' }
        ]
      },
      {
        id: 'actif_courant',
        title: 'ACTIF COURANT',
        fields: [
          { id: 'stocks', label: 'Stocks et en-cours', accounts: ['30', '31', '32', '33', '34', '35', '37'], debitCredit: 'DEBIT' },
          { id: 'creances_clients', label: 'Clients et comptes rattachés', accounts: ['41'], debitCredit: 'DEBIT' },
          { id: 'autres_creances', label: 'Autres créances', accounts: ['42', '43', '44', '45', '46', '47', '48'], debitCredit: 'DEBIT' },
          { id: 'disponibilites', label: 'Disponibilités', accounts: ['50', '51', '52', '53', '54'], debitCredit: 'DEBIT' },
          { id: 'total_actif_courant', label: 'TOTAL ACTIF COURANT', formula: '=stocks+creances_clients+autres_creances+disponibilites' }
        ]
      },
      {
        id: 'total_actif',
        title: 'TOTAL ACTIF',
        fields: [
          { id: 'total_general_actif', label: 'TOTAL GÉNÉRAL ACTIF', formula: '=total_actif_non_courant+total_actif_courant' }
        ]
      }
    ],
    balanceChecks: [
      { left: ['total_general_actif'], right: ['total_general_passif'], tolerance: 1.0 }
    ]
  },

  // Bilan Passif
  {
    documentType: 'MAGHREB_BILAN_PASSIF',
    countryCode: 'XX',
    accountingStandard: 'SCF',
    name: 'Bilan Passif - Maghreb',
    description: 'Bilan passif selon les normes SCF/PCM',
    category: 'financial_statements',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'capitaux_propres',
        title: 'CAPITAUX PROPRES',
        fields: [
          { id: 'capital_social', label: 'Capital social', accounts: ['101'], debitCredit: 'CREDIT' },
          { id: 'primes', label: 'Primes et réserves', accounts: ['104', '105', '106'], debitCredit: 'CREDIT' },
          { id: 'report_nouveau', label: 'Report à nouveau', accounts: ['11', '119'], debitCredit: 'NET' },
          { id: 'resultat_exercice', label: 'Résultat de l\'exercice', required: true },
          { id: 'subventions', label: 'Subventions d\'investissement', accounts: ['13'], debitCredit: 'CREDIT' },
          { id: 'provisions_reglementees', label: 'Provisions réglementées', accounts: ['14'], debitCredit: 'CREDIT' },
          { id: 'total_capitaux_propres', label: 'TOTAL CAPITAUX PROPRES', formula: '=capital_social+primes+report_nouveau+resultat_exercice+subventions+provisions_reglementees' }
        ]
      },
      {
        id: 'passif_non_courant',
        title: 'PASSIF NON COURANT',
        fields: [
          { id: 'emprunts_dettes', label: 'Emprunts et dettes financières', accounts: ['16', '17'], debitCredit: 'CREDIT' },
          { id: 'provisions_risques', label: 'Provisions pour risques et charges', accounts: ['15'], debitCredit: 'CREDIT' },
          { id: 'total_passif_non_courant', label: 'TOTAL PASSIF NON COURANT', formula: '=emprunts_dettes+provisions_risques' }
        ]
      },
      {
        id: 'passif_courant',
        title: 'PASSIF COURANT',
        fields: [
          { id: 'fournisseurs', label: 'Fournisseurs et comptes rattachés', accounts: ['40'], debitCredit: 'CREDIT' },
          { id: 'dettes_fiscales', label: 'Dettes fiscales', accounts: ['44'], debitCredit: 'CREDIT' },
          { id: 'dettes_sociales', label: 'Dettes sociales', accounts: ['43'], debitCredit: 'CREDIT' },
          { id: 'autres_dettes', label: 'Autres dettes', accounts: ['42', '45', '46', '47', '48'], debitCredit: 'CREDIT' },
          { id: 'tresorerie_passif', label: 'Trésorerie passif', accounts: ['519', '52'], debitCredit: 'CREDIT' },
          { id: 'total_passif_courant', label: 'TOTAL PASSIF COURANT', formula: '=fournisseurs+dettes_fiscales+dettes_sociales+autres_dettes+tresorerie_passif' }
        ]
      },
      {
        id: 'total_passif',
        title: 'TOTAL PASSIF',
        fields: [
          { id: 'total_general_passif', label: 'TOTAL GÉNÉRAL PASSIF', formula: '=total_capitaux_propres+total_passif_non_courant+total_passif_courant' }
        ]
      }
    ]
  },

  // Compte de résultat
  {
    documentType: 'MAGHREB_COMPTE_RESULTAT',
    countryCode: 'XX',
    accountingStandard: 'SCF',
    name: 'Compte de résultat - Maghreb',
    description: 'Compte de résultat par nature selon SCF/PCM',
    category: 'financial_statements',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'exploitation',
        title: 'ACTIVITÉ D\'EXPLOITATION',
        fields: [
          { id: 'chiffre_affaires', label: 'Chiffre d\'affaires', accounts: ['70', '701', '702', '703', '704', '705', '706', '707'], debitCredit: 'CREDIT' },
          { id: 'production_stockee', label: 'Production stockée', accounts: ['72'], debitCredit: 'NET' },
          { id: 'production_immobilisee', label: 'Production immobilisée', accounts: ['73'], debitCredit: 'CREDIT' },
          { id: 'subventions_exploit', label: 'Subventions d\'exploitation', accounts: ['74'], debitCredit: 'CREDIT' },
          { id: 'achats_consommes', label: 'Achats consommés', accounts: ['60', '601', '602'], debitCredit: 'DEBIT' },
          { id: 'services_exterieurs', label: 'Services extérieurs', accounts: ['61', '62'], debitCredit: 'DEBIT' },
          { id: 'impots_taxes', label: 'Impôts, taxes et versements assimilés', accounts: ['63'], debitCredit: 'DEBIT' },
          { id: 'charges_personnel', label: 'Charges de personnel', accounts: ['64'], debitCredit: 'DEBIT' },
          { id: 'autres_charges', label: 'Autres charges opérationnelles', accounts: ['65'], debitCredit: 'DEBIT' },
          { id: 'dotations_amortissements', label: 'Dotations aux amortissements', accounts: ['681'], debitCredit: 'DEBIT' },
          { id: 'dotations_provisions', label: 'Dotations aux provisions', accounts: ['685'], debitCredit: 'DEBIT' },
          { id: 'resultat_exploitation', label: 'RÉSULTAT D\'EXPLOITATION', formula: '=chiffre_affaires+production_stockee+production_immobilisee+subventions_exploit-achats_consommes-services_exterieurs-impots_taxes-charges_personnel-autres_charges-dotations_amortissements-dotations_provisions' }
        ]
      },
      {
        id: 'financier',
        title: 'RÉSULTAT FINANCIER',
        fields: [
          { id: 'produits_financiers', label: 'Produits financiers', accounts: ['76', '77'], debitCredit: 'CREDIT' },
          { id: 'charges_financieres', label: 'Charges financières', accounts: ['66'], debitCredit: 'DEBIT' },
          { id: 'resultat_financier', label: 'RÉSULTAT FINANCIER', formula: '=produits_financiers-charges_financieres' }
        ]
      },
      {
        id: 'courant',
        title: 'RÉSULTAT COURANT',
        fields: [
          { id: 'resultat_courant', label: 'RÉSULTAT COURANT AVANT IMPÔTS', formula: '=resultat_exploitation+resultat_financier' }
        ]
      },
      {
        id: 'non_courant',
        title: 'ÉLÉMENTS NON COURANTS',
        fields: [
          { id: 'produits_non_courants', label: 'Produits non courants', accounts: ['78'], debitCredit: 'CREDIT' },
          { id: 'charges_non_courantes', label: 'Charges non courantes', accounts: ['68'], debitCredit: 'DEBIT' },
          { id: 'resultat_non_courant', label: 'RÉSULTAT NON COURANT', formula: '=produits_non_courants-charges_non_courantes' }
        ]
      },
      {
        id: 'resultat_net',
        title: 'RÉSULTAT NET',
        fields: [
          { id: 'impots_benefices', label: 'Impôts sur les bénéfices', accounts: ['69'], debitCredit: 'DEBIT' },
          { id: 'resultat_net', label: 'RÉSULTAT NET DE L\'EXERCICE', formula: '=resultat_courant+resultat_non_courant-impots_benefices' }
        ]
      }
    ]
  },

  // Tableau des flux de trésorerie
  {
    documentType: 'MAGHREB_FLUX_TRESORERIE',
    countryCode: 'XX',
    accountingStandard: 'SCF',
    name: 'Tableau des flux de trésorerie - Maghreb',
    description: 'Tableau des flux de trésorerie selon SCF/PCM',
    category: 'financial_statements',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'flux_exploitation',
        title: 'FLUX DE TRÉSORERIE LIÉS À L\'EXPLOITATION',
        fields: [
          { id: 'resultat_net', label: 'Résultat net', required: true },
          { id: 'ajustements_amort', label: 'Amortissements et provisions', required: false },
          { id: 'variation_bfr', label: 'Variation du besoin en fonds de roulement', required: false },
          { id: 'flux_tresorerie_exploit', label: 'FLUX TRÉSORERIE EXPLOITATION', formula: '=resultat_net+ajustements_amort-variation_bfr' }
        ]
      },
      {
        id: 'flux_investissement',
        title: 'FLUX DE TRÉSORERIE LIÉS AUX INVESTISSEMENTS',
        fields: [
          { id: 'acquisition_immob', label: 'Acquisitions d\'immobilisations', required: false },
          { id: 'cession_immob', label: 'Cessions d\'immobilisations', required: false },
          { id: 'flux_tresorerie_invest', label: 'FLUX TRÉSORERIE INVESTISSEMENT', formula: '=-acquisition_immob+cession_immob' }
        ]
      },
      {
        id: 'flux_financement',
        title: 'FLUX DE TRÉSORERIE LIÉS AU FINANCEMENT',
        fields: [
          { id: 'augmentation_capital', label: 'Augmentation de capital', required: false },
          { id: 'nouveaux_emprunts', label: 'Nouveaux emprunts', required: false },
          { id: 'remboursement_emprunts', label: 'Remboursement d\'emprunts', required: false },
          { id: 'dividendes_verses', label: 'Dividendes versés', required: false },
          { id: 'flux_tresorerie_finance', label: 'FLUX TRÉSORERIE FINANCEMENT', formula: '=augmentation_capital+nouveaux_emprunts-remboursement_emprunts-dividendes_verses' }
        ]
      },
      {
        id: 'variation_tresorerie',
        title: 'VARIATION DE TRÉSORERIE',
        fields: [
          { id: 'variation_tresorerie', label: 'VARIATION DE TRÉSORERIE', formula: '=flux_tresorerie_exploit+flux_tresorerie_invest+flux_tresorerie_finance' },
          { id: 'tresorerie_debut', label: 'Trésorerie début d\'exercice', required: true },
          { id: 'tresorerie_fin', label: 'Trésorerie fin d\'exercice', formula: '=tresorerie_debut+variation_tresorerie' }
        ]
      }
    ]
  },

  // ========== DÉCLARATIONS FISCALES ALGÉRIE (SCF) ==========

  // Déclaration TVA Algérie (G50)
  {
    documentType: 'DZ_TVA_G50',
    countryCode: 'DZ',
    accountingStandard: 'SCF',
    name: 'Déclaration TVA (G50) - Algérie',
    description: 'Déclaration mensuelle de TVA série G50',
    category: 'tax_returns',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'tva_collectee',
        title: 'TVA COLLECTÉE',
        fields: [
          { id: 'ca_taux_19', label: 'Chiffre d\'affaires HT (taux 19%)', required: true },
          { id: 'tva_19', label: 'TVA collectée (19%)', formula: '=ca_taux_19*0.19' },
          { id: 'ca_taux_9', label: 'Chiffre d\'affaires HT (taux réduit 9%)', required: false },
          { id: 'tva_9', label: 'TVA collectée (9%)', formula: '=ca_taux_9*0.09' },
          { id: 'total_tva_collectee', label: 'TOTAL TVA COLLECTÉE', formula: '=tva_19+tva_9' }
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
        id: 'tva_due',
        title: 'TVA NETTE DUE',
        fields: [
          { id: 'credit_tva_mois_precedent', label: 'Crédit de TVA du mois précédent', required: false },
          { id: 'tva_nette_due', label: 'TVA nette à payer', formula: '=total_tva_collectee-total_tva_deductible-credit_tva_mois_precedent' }
        ]
      }
    ]
  },

  // Déclaration IBS Algérie
  {
    documentType: 'DZ_IBS',
    countryCode: 'DZ',
    accountingStandard: 'SCF',
    name: 'Déclaration IBS - Algérie',
    description: 'Déclaration annuelle de l\'Impôt sur les Bénéfices des Sociétés',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'resultat_fiscal',
        title: 'RÉSULTAT FISCAL',
        fields: [
          { id: 'resultat_comptable', label: 'Résultat comptable avant impôt', required: true },
          { id: 'reintegrations', label: 'Réintégrations fiscales', required: false },
          { id: 'deductions', label: 'Déductions fiscales', required: false },
          { id: 'resultat_fiscal', label: 'RÉSULTAT FISCAL', formula: '=resultat_comptable+reintegrations-deductions' }
        ]
      },
      {
        id: 'ibs',
        title: 'IMPÔT SUR LES BÉNÉFICES',
        fields: [
          { id: 'taux_ibs', label: 'Taux IBS (26% ou 23%)', type: 'percentage', required: true },
          { id: 'ibs_du', label: 'IBS dû', formula: '=resultat_fiscal>0 ? resultat_fiscal*taux_ibs/100 : 0' },
          { id: 'acomptes_ibs', label: 'Acomptes IBS versés', required: false },
          { id: 'solde_ibs', label: 'Solde IBS', formula: '=ibs_du-acomptes_ibs' }
        ]
      }
    ]
  },

  // IRG Salaires Algérie
  {
    documentType: 'DZ_IRG_SALAIRES',
    countryCode: 'DZ',
    accountingStandard: 'SCF',
    name: 'Déclaration IRG salaires - Algérie',
    description: 'Déclaration mensuelle de l\'IRG retenu à la source sur salaires',
    category: 'social_declarations',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'salaires',
        title: 'MASSE SALARIALE',
        fields: [
          { id: 'salaires_bruts', label: 'Salaires bruts', accounts: ['641'], debitCredit: 'DEBIT' },
          { id: 'irg_retenu', label: 'IRG retenu à la source', required: true },
          { id: 'cotisations_sociales', label: 'Cotisations sociales (CNAS)', required: false }
        ]
      }
    ]
  },

  // Bilan fiscal Algérie (série G)
  {
    documentType: 'DZ_BILAN_FISCAL',
    countryCode: 'DZ',
    accountingStandard: 'SCF',
    name: 'Bilan fiscal (série G) - Algérie',
    description: 'Liasse fiscale série G - Bilan fiscal',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'tableau_resultat',
        title: 'TABLEAU DE DÉTERMINATION DU RÉSULTAT FISCAL',
        fields: [
          { id: 'resultat_comptable', label: 'Résultat comptable', required: true },
          { id: 'reintegrations_diverses', label: 'Réintégrations diverses', required: false },
          { id: 'deductions_diverses', label: 'Déductions diverses', required: false },
          { id: 'resultat_fiscal', label: 'Résultat fiscal', formula: '=resultat_comptable+reintegrations_diverses-deductions_diverses' },
          { id: 'deficits_reportables', label: 'Déficits reportables', required: false },
          { id: 'resultat_fiscal_net', label: 'Résultat fiscal net', formula: '=resultat_fiscal-deficits_reportables' }
        ]
      }
    ]
  },

  // ========== DÉCLARATIONS FISCALES TUNISIE (PCM) ==========

  // Déclaration TVA Tunisie
  {
    documentType: 'TN_TVA',
    countryCode: 'TN',
    accountingStandard: 'PCM',
    name: 'Déclaration TVA - Tunisie',
    description: 'Déclaration mensuelle de TVA en Tunisie',
    category: 'tax_returns',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'tva_collectee',
        title: 'TVA COLLECTÉE',
        fields: [
          { id: 'ca_taux_19', label: 'Chiffre d\'affaires HT (taux 19%)', required: true },
          { id: 'tva_19', label: 'TVA collectée (19%)', formula: '=ca_taux_19*0.19' },
          { id: 'ca_taux_13', label: 'Chiffre d\'affaires HT (taux 13%)', required: false },
          { id: 'tva_13', label: 'TVA collectée (13%)', formula: '=ca_taux_13*0.13' },
          { id: 'ca_taux_7', label: 'Chiffre d\'affaires HT (taux réduit 7%)', required: false },
          { id: 'tva_7', label: 'TVA collectée (7%)', formula: '=ca_taux_7*0.07' },
          { id: 'total_tva_collectee', label: 'TOTAL TVA COLLECTÉE', formula: '=tva_19+tva_13+tva_7' }
        ]
      },
      {
        id: 'tva_deductible',
        title: 'TVA DÉDUCTIBLE',
        fields: [
          { id: 'tva_equipements', label: 'TVA sur équipements', required: false },
          { id: 'tva_autres_achats', label: 'TVA sur autres achats', required: false },
          { id: 'total_tva_deductible', label: 'TOTAL TVA DÉDUCTIBLE', formula: '=tva_equipements+tva_autres_achats' }
        ]
      },
      {
        id: 'tva_due',
        title: 'TVA NETTE',
        fields: [
          { id: 'report_credit_tva', label: 'Report crédit de TVA', required: false },
          { id: 'tva_nette_due', label: 'TVA nette à payer', formula: '=total_tva_collectee-total_tva_deductible-report_credit_tva' }
        ]
      }
    ]
  },

  // Déclaration IS Tunisie
  {
    documentType: 'TN_IS',
    countryCode: 'TN',
    accountingStandard: 'PCM',
    name: 'Déclaration IS - Tunisie',
    description: 'Déclaration annuelle de l\'Impôt sur les Sociétés',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'benefice_imposable',
        title: 'BÉNÉFICE IMPOSABLE',
        fields: [
          { id: 'resultat_comptable', label: 'Résultat comptable', required: true },
          { id: 'reintegrations', label: 'Réintégrations', required: false },
          { id: 'deductions', label: 'Déductions', required: false },
          { id: 'benefice_imposable', label: 'BÉNÉFICE IMPOSABLE', formula: '=resultat_comptable+reintegrations-deductions' }
        ]
      },
      {
        id: 'impot_societes',
        title: 'IMPÔT SUR LES SOCIÉTÉS',
        fields: [
          { id: 'taux_is', label: 'Taux IS (15% ou 25%)', type: 'percentage', required: true },
          { id: 'is_du', label: 'IS dû', formula: '=benefice_imposable*taux_is/100' },
          { id: 'acomptes_provisionnels', label: 'Acomptes provisionnels', required: false },
          { id: 'solde_is', label: 'Solde IS', formula: '=is_du-acomptes_provisionnels' }
        ]
      }
    ]
  },

  // Déclaration employeur Tunisie
  {
    documentType: 'TN_RETENUE_SOURCE',
    countryCode: 'TN',
    accountingStandard: 'PCM',
    name: 'Déclaration employeur - Tunisie',
    description: 'Déclaration mensuelle des retenues à la source sur salaires',
    category: 'social_declarations',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'retenues',
        title: 'RETENUES À LA SOURCE',
        fields: [
          { id: 'salaires_bruts', label: 'Salaires bruts', accounts: ['641'], debitCredit: 'DEBIT' },
          { id: 'retenue_source_irpp', label: 'Retenue à la source IRPP', required: true },
          { id: 'cotisations_cnss', label: 'Cotisations CNSS', required: false },
          { id: 'contribution_foprolos', label: 'FOPROLOS (1%)', formula: '=salaires_bruts*0.01' }
        ]
      }
    ]
  },

  // TFP Tunisie
  {
    documentType: 'TN_TFP',
    countryCode: 'TN',
    accountingStandard: 'PCM',
    name: 'TFP - Tunisie',
    description: 'Taxe de Formation Professionnelle',
    category: 'social_declarations',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'tfp',
        title: 'TAXE DE FORMATION PROFESSIONNELLE',
        fields: [
          { id: 'masse_salariale', label: 'Masse salariale brute', accounts: ['641'], debitCredit: 'DEBIT' },
          { id: 'taux_tfp', label: 'Taux TFP (2%)', type: 'percentage', required: true },
          { id: 'tfp_due', label: 'TFP due', formula: '=masse_salariale*taux_tfp/100' }
        ]
      }
    ]
  },

  // ========== DÉCLARATIONS FISCALES MAROC (PCM) ==========

  // Déclaration TVA Maroc
  {
    documentType: 'MA_TVA',
    countryCode: 'MA',
    accountingStandard: 'PCM',
    name: 'Déclaration TVA - Maroc',
    description: 'Déclaration mensuelle de TVA au Maroc',
    category: 'tax_returns',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'tva_collectee',
        title: 'TVA COLLECTÉE',
        fields: [
          { id: 'ca_taux_20', label: 'Chiffre d\'affaires HT (taux normal 20%)', required: true },
          { id: 'tva_20', label: 'TVA collectée (20%)', formula: '=ca_taux_20*0.20' },
          { id: 'ca_taux_14', label: 'Chiffre d\'affaires HT (taux 14%)', required: false },
          { id: 'tva_14', label: 'TVA collectée (14%)', formula: '=ca_taux_14*0.14' },
          { id: 'ca_taux_10', label: 'Chiffre d\'affaires HT (taux réduit 10%)', required: false },
          { id: 'tva_10', label: 'TVA collectée (10%)', formula: '=ca_taux_10*0.10' },
          { id: 'ca_taux_7', label: 'Chiffre d\'affaires HT (taux réduit 7%)', required: false },
          { id: 'tva_7', label: 'TVA collectée (7%)', formula: '=ca_taux_7*0.07' },
          { id: 'total_tva_collectee', label: 'TOTAL TVA COLLECTÉE', formula: '=tva_20+tva_14+tva_10+tva_7' }
        ]
      },
      {
        id: 'tva_recuperable',
        title: 'TVA RÉCUPÉRABLE',
        fields: [
          { id: 'tva_immobilisations', label: 'TVA sur immobilisations', required: false },
          { id: 'tva_charges', label: 'TVA sur charges', required: false },
          { id: 'total_tva_recuperable', label: 'TOTAL TVA RÉCUPÉRABLE', formula: '=tva_immobilisations+tva_charges' }
        ]
      },
      {
        id: 'tva_due',
        title: 'TVA NETTE',
        fields: [
          { id: 'credit_tva_anterieur', label: 'Crédit de TVA antérieur', required: false },
          { id: 'tva_nette_due', label: 'TVA nette à payer', formula: '=total_tva_collectee-total_tva_recuperable-credit_tva_anterieur' }
        ]
      }
    ]
  },

  // Déclaration IS Maroc
  {
    documentType: 'MA_IS',
    countryCode: 'MA',
    accountingStandard: 'PCM',
    name: 'Déclaration IS - Maroc',
    description: 'Déclaration annuelle de l\'Impôt sur les Sociétés',
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
          { id: 'taux_is', label: 'Taux IS (20% ou 31%)', type: 'percentage', required: true },
          { id: 'is_du', label: 'IS dû (calcul normal)', formula: '=resultat_fiscal*taux_is/100' },
          { id: 'cotisation_minimale', label: 'Cotisation minimale (0,5% CA)', required: false },
          { id: 'is_final', label: 'IS à payer (max entre IS et CM)', formula: '=is_du>cotisation_minimale ? is_du : cotisation_minimale' },
          { id: 'acomptes_is', label: 'Acomptes IS versés', required: false },
          { id: 'solde_is', label: 'Solde IS', formula: '=is_final-acomptes_is' }
        ]
      }
    ]
  },

  // IR Salaires Maroc
  {
    documentType: 'MA_IR_SALAIRES',
    countryCode: 'MA',
    accountingStandard: 'PCM',
    name: 'Déclaration IR salaires - Maroc',
    description: 'Déclaration mensuelle de l\'IR retenu à la source sur salaires',
    category: 'social_declarations',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'salaires',
        title: 'MASSE SALARIALE',
        fields: [
          { id: 'salaires_bruts', label: 'Salaires bruts imposables', accounts: ['641'], debitCredit: 'DEBIT' },
          { id: 'ir_retenu', label: 'IR retenu à la source', required: true },
          { id: 'cnss', label: 'Cotisations CNSS', required: false },
          { id: 'amo', label: 'AMO (Assurance Maladie Obligatoire)', required: false }
        ]
      }
    ]
  },

  // Taxe professionnelle Maroc
  {
    documentType: 'MA_TAXE_PROFESSIONNELLE',
    countryCode: 'MA',
    accountingStandard: 'PCM',
    name: 'Taxe professionnelle - Maroc',
    description: 'Taxe professionnelle annuelle',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'taxe_professionnelle',
        title: 'TAXE PROFESSIONNELLE',
        fields: [
          { id: 'valeur_locative', label: 'Valeur locative des locaux', required: true },
          { id: 'taux_tp', label: 'Taux de la taxe professionnelle (%)', type: 'percentage', required: true },
          { id: 'taxe_due', label: 'Taxe professionnelle due', formula: '=valeur_locative*taux_tp/100' }
        ]
      }
    ]
  }
];

/**
 * Génère tous les templates Maghreb
 */
export function generateAllMaghrebTemplates(): Array<Omit<RegulatoryTemplate, 'id' | 'createdAt' | 'updatedAt'>> {
  return createTemplatesFromConfigs(MAGHREB_TEMPLATES_CONFIG);
}

/**
 * Récupère un template Maghreb par son type
 */
export function getMaghrebTemplateConfig(documentType: string): TemplateConfig | undefined {
  return MAGHREB_TEMPLATES_CONFIG.find(t => t.documentType === documentType);
}

/**
 * Liste des types de documents Maghreb disponibles
 */
export const MAGHREB_DOCUMENT_TYPES = MAGHREB_TEMPLATES_CONFIG.map(t => t.documentType);

/**
 * Récupère les templates par pays
 */
export function getMaghrebTemplatesByCountry(countryCode: string): TemplateConfig[] {
  return MAGHREB_TEMPLATES_CONFIG.filter(t =>
    t.countryCode === countryCode || t.countryCode === 'MULTI'
  );
}
