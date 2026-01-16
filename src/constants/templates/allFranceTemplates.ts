/**
 * CassKai - TOUS les templates réglementaires France
 * Configurations compactes pour génération automatique
 */

import { createTemplatesFromConfigs, type TemplateConfig } from './templateFactory';
import type { RegulatoryTemplate } from '@/types/regulatory';

/**
 * TOUS LES TEMPLATES FRANCE - COMPLET
 *
 * LIASSE FISCALE SIMPLIFIÉE (6 formulaires):
 * - 2033-D, 2033-E, 2033-F, 2033-G
 * - 2069-RCI, 2079-FCE
 *
 * LIASSE FISCALE NORMALE (16 formulaires):
 * - 2050, 2051, 2052, 2053 (Bilan et compte de résultat)
 * - 2054, 2055, 2056, 2057 (Tableaux de mouvements)
 * - 2058-A, 2058-B, 2058-C (Détermination résultat fiscal)
 * - 2059-A, 2059-B, 2059-C, 2059-D, 2059-E, 2059-F, 2059-G (Annexes)
 *
 * DÉCLARATIONS TVA ET IS (3 formulaires):
 * - CA3 (TVA mensuelle), CA12 (TVA annuelle), 2065 (IS)
 *
 * TOTAL: 25 formulaires France PCG
 */

export const FRANCE_TEMPLATES_CONFIG: TemplateConfig[] = [
  // ========== LIASSE FISCALE SIMPLIFIÉE ==========

  // 2033-D: Provisions et déficits reportables
  {
    documentType: 'FR_2033D',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Provisions et déficits reportables (2033-D-SD)',
    description: 'Tableau des provisions réglementées, provisions pour risques et charges, et déficits reportables',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'provisions_reglementees',
        title: 'PROVISIONS RÉGLEMENTÉES',
        fields: [
          { id: 'prov_reg_debut', label: 'Provisions réglementées début exercice', accounts: ['14', '142', '143', '144', '145', '146'], debitCredit: 'CREDIT' },
          { id: 'prov_reg_dotations', label: 'Dotations de l\'exercice', required: false },
          { id: 'prov_reg_reprises', label: 'Reprises de l\'exercice', required: false },
          { id: 'prov_reg_fin', label: 'Provisions réglementées fin exercice', formula: '=prov_reg_debut+prov_reg_dotations-prov_reg_reprises' }
        ]
      },
      {
        id: 'provisions_risques',
        title: 'PROVISIONS POUR RISQUES ET CHARGES',
        fields: [
          { id: 'prov_risques_debut', label: 'Provisions début exercice', accounts: ['15', '151', '153', '155', '156', '157', '158'], debitCredit: 'CREDIT' },
          { id: 'prov_risques_dotations', label: 'Dotations de l\'exercice', required: false },
          { id: 'prov_risques_reprises', label: 'Reprises de l\'exercice', required: false },
          { id: 'prov_risques_fin', label: 'Provisions fin exercice', formula: '=prov_risques_debut+prov_risques_dotations-prov_risques_reprises' }
        ]
      },
      {
        id: 'deficits_reportables',
        title: 'DÉFICITS REPORTABLES',
        fields: [
          { id: 'deficits_origine', label: 'Origine des déficits', type: 'text', required: false },
          { id: 'deficits_montant', label: 'Montant des déficits reportables', required: false },
          { id: 'deficits_imputes', label: 'Déficits imputés sur l\'exercice', required: false },
          { id: 'deficits_restants', label: 'Déficits restant à reporter', formula: '=deficits_montant-deficits_imputes' }
        ]
      }
    ]
  },

  // 2033-E: Détermination des effectifs et de la valeur ajoutée (CVAE)
  {
    documentType: 'FR_2033E',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Effectifs et valeur ajoutée (2033-E-SD)',
    description: 'Détermination des effectifs moyens et calcul de la valeur ajoutée pour la CVAE',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'effectifs',
        title: 'EFFECTIFS',
        fields: [
          { id: 'effectif_salaries', label: 'Nombre de salariés (équivalent temps plein)', type: 'number', required: true },
          { id: 'effectif_moyen', label: 'Effectif moyen de l\'exercice', type: 'number', formula: '=effectif_salaries' }
        ]
      },
      {
        id: 'valeur_ajoutee',
        title: 'VALEUR AJOUTÉE',
        fields: [
          { id: 'va_chiffre_affaires', label: 'Chiffre d\'affaires HT', accounts: ['70', '701', '703', '704', '706', '707', '708'], debitCredit: 'CREDIT' },
          { id: 'va_production_stockee', label: 'Production stockée', accounts: ['713'], debitCredit: 'NET' },
          { id: 'va_production_immobilisee', label: 'Production immobilisée', accounts: ['72'], debitCredit: 'CREDIT' },
          { id: 'va_subventions', label: 'Subventions d\'exploitation', accounts: ['74'], debitCredit: 'CREDIT' },
          { id: 'va_autres_produits', label: 'Autres produits de gestion courante', accounts: ['75'], debitCredit: 'CREDIT' },
          { id: 'va_achats_consommes', label: 'Achats consommés', accounts: ['60', '601', '602', '607'], debitCredit: 'DEBIT' },
          { id: 'va_services_exterieurs', label: 'Services extérieurs', accounts: ['61', '62'], debitCredit: 'DEBIT' },
          { id: 'va_impots_taxes', label: 'Impôts et taxes', accounts: ['63'], debitCredit: 'DEBIT' },
          { id: 'va_autres_charges', label: 'Autres charges de gestion courante', accounts: ['65'], debitCredit: 'DEBIT' },
          { id: 'valeur_ajoutee_totale', label: 'VALEUR AJOUTÉE PRODUITE', formula: '=va_chiffre_affaires+va_production_stockee+va_production_immobilisee+va_subventions+va_autres_produits-va_achats_consommes-va_services_exterieurs-va_impots_taxes-va_autres_charges' }
        ]
      }
    ]
  },

  // 2033-F: Composition du capital social
  {
    documentType: 'FR_2033F',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Composition du capital social (2033-F-SD)',
    description: 'Répartition du capital social entre personnes physiques et morales',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: false,
    sections: [
      {
        id: 'capital_social',
        title: 'CAPITAL SOCIAL',
        fields: [
          { id: 'capital_total', label: 'Capital social total', accounts: ['101'], debitCredit: 'CREDIT' },
          { id: 'capital_personnes_physiques', label: 'Détenu par des personnes physiques', required: false },
          { id: 'capital_personnes_morales', label: 'Détenu par des personnes morales', required: false },
          { id: 'nombre_associes', label: 'Nombre d\'associés', type: 'number', required: false }
        ]
      }
    ]
  },

  // 2033-G: Filiales et participations
  {
    documentType: 'FR_2033G',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Filiales et participations (2033-G-SD)',
    description: 'Liste des filiales et participations détenues à plus de 10%',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: false,
    sections: [
      {
        id: 'participations',
        title: 'PARTICIPATIONS',
        fields: [
          { id: 'nb_filiales', label: 'Nombre de filiales détenues', type: 'number', required: false },
          { id: 'valeur_participations', label: 'Valeur comptable des participations', accounts: ['261', '266'], debitCredit: 'DEBIT' },
          { id: 'dividendes_recus', label: 'Dividendes reçus', accounts: ['761'], debitCredit: 'CREDIT' }
        ]
      }
    ]
  },

  // 2069-RCI: Réductions et crédits d'impôt
  {
    documentType: 'FR_2069RCI',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Réductions et crédits d\'impôt (2069-RCI-SD)',
    description: 'Déclaration des réductions et crédits d\'impôt (CIR, CITS, mécénat, etc.)',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: false,
    sections: [
      {
        id: 'credit_impot_recherche',
        title: 'CRÉDIT D\'IMPÔT RECHERCHE (CIR)',
        fields: [
          { id: 'cir_depenses_recherche', label: 'Dépenses de recherche éligibles', required: false },
          { id: 'cir_taux', label: 'Taux applicable (%)', type: 'percentage', required: false },
          { id: 'cir_montant', label: 'Montant du CIR', formula: '=cir_depenses_recherche*cir_taux/100' }
        ]
      },
      {
        id: 'credit_impot_formation',
        title: 'CRÉDIT D\'IMPÔT FORMATION',
        fields: [
          { id: 'cif_heures_formation', label: 'Nombre d\'heures de formation des dirigeants', type: 'number', required: false },
          { id: 'cif_taux_horaire', label: 'Taux horaire (€)', required: false },
          { id: 'cif_montant', label: 'Montant du crédit d\'impôt formation', formula: '=cif_heures_formation*cif_taux_horaire' }
        ]
      },
      {
        id: 'mecenat',
        title: 'MÉCÉNAT',
        fields: [
          { id: 'mecenat_dons', label: 'Montant des dons éligibles', required: false },
          { id: 'mecenat_taux', label: 'Taux de réduction (%)', type: 'percentage', required: false },
          { id: 'mecenat_reduction', label: 'Réduction d\'impôt pour mécénat', formula: '=mecenat_dons*mecenat_taux/100' }
        ]
      }
    ]
  },

  // 2079-FCE: Crédit d'impôt formation des dirigeants
  {
    documentType: 'FR_2079FCE',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Crédit d\'impôt formation dirigeants (2079-FCE-SD)',
    description: 'Crédit d\'impôt pour la formation des chefs d\'entreprise',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: false,
    sections: [
      {
        id: 'formation_dirigeants',
        title: 'FORMATION DES DIRIGEANTS',
        fields: [
          { id: 'fce_nb_heures', label: 'Nombre d\'heures de formation', type: 'number', required: false },
          { id: 'fce_cout_formation', label: 'Coût de la formation (€)', required: false },
          { id: 'fce_credit_impot', label: 'Crédit d\'impôt (max 40h × taux horaire SMIC)', required: false }
        ]
      }
    ]
  },

  // ========== LIASSE FISCALE NORMALE (Régime réel normal) ==========

  // 2050: Bilan actif (régime normal)
  {
    documentType: 'FR_2050',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Bilan actif (2050-SD)',
    description: 'Bilan actif détaillé pour le régime réel normal',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'actif_immobilise_detail',
        title: 'ACTIF IMMOBILISÉ (détaillé)',
        fields: [
          { id: 'immob_incorp_brut', label: 'Immobilisations incorporelles (brut)', accounts: ['20', '201', '203', '205', '206', '207', '208'], debitCredit: 'DEBIT' },
          { id: 'immob_incorp_amort', label: 'Amortissements', accounts: ['280', '2801', '2803', '2805'], debitCredit: 'CREDIT' },
          { id: 'immob_incorp_net', label: 'Immobilisations incorporelles (net)', formula: '=immob_incorp_brut-immob_incorp_amort' },
          { id: 'terrains_brut', label: 'Terrains (brut)', accounts: ['211', '212'], debitCredit: 'DEBIT' },
          { id: 'constructions_brut', label: 'Constructions (brut)', accounts: ['213', '214', '215'], debitCredit: 'DEBIT' },
          { id: 'constructions_amort', label: 'Amortissements constructions', accounts: ['2813', '2814', '2815'], debitCredit: 'CREDIT' },
          { id: 'constructions_net', label: 'Constructions (net)', formula: '=constructions_brut-constructions_amort' },
          { id: 'materiel_brut', label: 'Installations techniques, matériel (brut)', accounts: ['22', '218', '23'], debitCredit: 'DEBIT' },
          { id: 'materiel_amort', label: 'Amortissements matériel', accounts: ['2818', '28'], debitCredit: 'CREDIT' },
          { id: 'materiel_net', label: 'Matériel (net)', formula: '=materiel_brut-materiel_amort' },
          { id: 'financieres', label: 'Immobilisations financières', accounts: ['26', '27'], debitCredit: 'DEBIT' },
          { id: 'total_actif_immob', label: 'TOTAL ACTIF IMMOBILISÉ', formula: '=immob_incorp_net+terrains_brut+constructions_net+materiel_net+financieres' }
        ]
      },
      {
        id: 'actif_circulant_detail',
        title: 'ACTIF CIRCULANT (détaillé)',
        fields: [
          { id: 'stocks', label: 'Stocks et en-cours', accounts: ['31', '32', '33', '34', '35', '37'], debitCredit: 'DEBIT' },
          { id: 'avances_acomptes_verses', label: 'Avances et acomptes versés', accounts: ['409'], debitCredit: 'DEBIT' },
          { id: 'creances_clients', label: 'Créances clients', accounts: ['411', '413', '416', '417'], debitCredit: 'DEBIT' },
          { id: 'autres_creances', label: 'Autres créances', accounts: ['42', '43', '44', '45', '46', '47', '48'], debitCredit: 'DEBIT' },
          { id: 'valeurs_mobilieres', label: 'Valeurs mobilières de placement', accounts: ['50', '508'], debitCredit: 'DEBIT' },
          { id: 'disponibilites', label: 'Disponibilités', accounts: ['51', '512', '514', '515', '53'], debitCredit: 'DEBIT' },
          { id: 'charges_constatees_avance', label: 'Charges constatées d\'avance', accounts: ['486'], debitCredit: 'DEBIT' },
          { id: 'total_actif_circulant', label: 'TOTAL ACTIF CIRCULANT', formula: '=stocks+avances_acomptes_verses+creances_clients+autres_creances+valeurs_mobilieres+disponibilites+charges_constatees_avance' }
        ]
      },
      {
        id: 'total_general_actif',
        title: 'TOTAL GÉNÉRAL',
        fields: [
          { id: 'total_actif', label: 'TOTAL GÉNÉRAL DE L\'ACTIF', formula: '=total_actif_immob+total_actif_circulant' }
        ]
      }
    ],
    balanceChecks: [
      { left: ['total_actif'], right: ['total_passif'], tolerance: 1.0 }
    ]
  },

  // 2051: Bilan passif (régime normal)
  {
    documentType: 'FR_2051',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Bilan passif (2051-SD)',
    description: 'Bilan passif détaillé pour le régime réel normal',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'capitaux_propres_detail',
        title: 'CAPITAUX PROPRES (détaillé)',
        fields: [
          { id: 'capital', label: 'Capital social ou individuel', accounts: ['101', '108'], debitCredit: 'CREDIT' },
          { id: 'primes', label: 'Primes d\'émission, de fusion, d\'apport', accounts: ['104'], debitCredit: 'CREDIT' },
          { id: 'ecarts_reevaluation', label: 'Écarts de réévaluation', accounts: ['105'], debitCredit: 'CREDIT' },
          { id: 'reserves_legale', label: 'Réserve légale', accounts: ['1061'], debitCredit: 'CREDIT' },
          { id: 'reserves_statutaires', label: 'Réserves statutaires', accounts: ['1062'], debitCredit: 'CREDIT' },
          { id: 'reserves_reglementees', label: 'Réserves réglementées', accounts: ['1063'], debitCredit: 'CREDIT' },
          { id: 'autres_reserves', label: 'Autres réserves', accounts: ['1064', '1068'], debitCredit: 'CREDIT' },
          { id: 'report_nouveau', label: 'Report à nouveau', accounts: ['110', '119'], debitCredit: 'NET' },
          { id: 'resultat_exercice', label: 'Résultat de l\'exercice', required: true },
          { id: 'subventions_invest', label: 'Subventions d\'investissement', accounts: ['131'], debitCredit: 'CREDIT' },
          { id: 'provisions_reglementees', label: 'Provisions réglementées', accounts: ['14'], debitCredit: 'CREDIT' },
          { id: 'total_capitaux_propres', label: 'TOTAL CAPITAUX PROPRES', formula: '=capital+primes+ecarts_reevaluation+reserves_legale+reserves_statutaires+reserves_reglementees+autres_reserves+report_nouveau+resultat_exercice+subventions_invest+provisions_reglementees' }
        ]
      },
      {
        id: 'provisions',
        title: 'PROVISIONS',
        fields: [
          { id: 'provisions_risques_charges', label: 'Provisions pour risques et charges', accounts: ['15'], debitCredit: 'CREDIT' }
        ]
      },
      {
        id: 'dettes_detail',
        title: 'DETTES (détaillées)',
        fields: [
          { id: 'emprunts_obligataires', label: 'Emprunts obligataires convertibles', accounts: ['161'], debitCredit: 'CREDIT' },
          { id: 'autres_emprunts_obligataires', label: 'Autres emprunts obligataires', accounts: ['163'], debitCredit: 'CREDIT' },
          { id: 'emprunts_etablissements_credit', label: 'Emprunts auprès des établissements de crédit', accounts: ['164'], debitCredit: 'CREDIT' },
          { id: 'emprunts_associes', label: 'Emprunts et dettes financières divers', accounts: ['165', '166', '167', '168'], debitCredit: 'CREDIT' },
          { id: 'avances_acomptes_recus', label: 'Avances et acomptes reçus', accounts: ['419'], debitCredit: 'CREDIT' },
          { id: 'dettes_fournisseurs', label: 'Dettes fournisseurs et comptes rattachés', accounts: ['401', '403', '404', '405', '408'], debitCredit: 'CREDIT' },
          { id: 'dettes_fiscales', label: 'Dettes fiscales et sociales', accounts: ['42', '43', '44'], debitCredit: 'CREDIT' },
          { id: 'dettes_immobilisations', label: 'Dettes sur immobilisations', accounts: ['404', '405'], debitCredit: 'CREDIT' },
          { id: 'autres_dettes', label: 'Autres dettes', accounts: ['45', '46', '47', '48'], debitCredit: 'CREDIT' },
          { id: 'produits_constates_avance', label: 'Produits constatés d\'avance', accounts: ['487'], debitCredit: 'CREDIT' },
          { id: 'total_dettes', label: 'TOTAL DETTES', formula: '=emprunts_obligataires+autres_emprunts_obligataires+emprunts_etablissements_credit+emprunts_associes+avances_acomptes_recus+dettes_fournisseurs+dettes_fiscales+dettes_immobilisations+autres_dettes+produits_constates_avance' }
        ]
      },
      {
        id: 'total_general_passif',
        title: 'TOTAL GÉNÉRAL',
        fields: [
          { id: 'total_passif', label: 'TOTAL GÉNÉRAL DU PASSIF', formula: '=total_capitaux_propres+provisions_risques_charges+total_dettes' }
        ]
      }
    ]
  },

  // 2052: Compte de résultat (charges)
  {
    documentType: 'FR_2052',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Compte de résultat - Charges (2052-SD)',
    description: 'Compte de résultat détaillé - Charges d\'exploitation, financières et exceptionnelles',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'charges_exploitation_detail',
        title: 'CHARGES D\'EXPLOITATION',
        fields: [
          { id: 'achats_marchandises', label: 'Achats de marchandises', accounts: ['607'], debitCredit: 'DEBIT' },
          { id: 'variation_stocks_march', label: 'Variation stocks marchandises', accounts: ['6037'], debitCredit: 'NET' },
          { id: 'achats_matieres', label: 'Achats matières premières', accounts: ['601', '602'], debitCredit: 'DEBIT' },
          { id: 'variation_stocks_mat', label: 'Variation stocks matières', accounts: ['6031', '6032'], debitCredit: 'NET' },
          { id: 'autres_achats', label: 'Autres achats et charges externes', accounts: ['604', '605', '606', '608', '61', '62'], debitCredit: 'DEBIT' },
          { id: 'impots_taxes', label: 'Impôts, taxes et versements assimilés', accounts: ['63'], debitCredit: 'DEBIT' },
          { id: 'remuneration_personnel', label: 'Rémunération du personnel', accounts: ['641', '644', '648'], debitCredit: 'DEBIT' },
          { id: 'charges_sociales', label: 'Charges sociales', accounts: ['645', '646', '647'], debitCredit: 'DEBIT' },
          { id: 'dotations_amortissements', label: 'Dotations amortissements', accounts: ['681'], debitCredit: 'DEBIT' },
          { id: 'dotations_provisions_exploit', label: 'Dotations provisions', accounts: ['6815', '6816', '6817'], debitCredit: 'DEBIT' },
          { id: 'autres_charges_exploit', label: 'Autres charges', accounts: ['65'], debitCredit: 'DEBIT' },
          { id: 'total_charges_exploit', label: 'TOTAL CHARGES D\'EXPLOITATION', formula: '=achats_marchandises+variation_stocks_march+achats_matieres+variation_stocks_mat+autres_achats+impots_taxes+remuneration_personnel+charges_sociales+dotations_amortissements+dotations_provisions_exploit+autres_charges_exploit' }
        ]
      },
      {
        id: 'charges_financieres_detail',
        title: 'CHARGES FINANCIÈRES',
        fields: [
          { id: 'charges_interets', label: 'Charges d\'intérêts', accounts: ['661'], debitCredit: 'DEBIT' },
          { id: 'pertes_change', label: 'Pertes de change', accounts: ['666'], debitCredit: 'DEBIT' },
          { id: 'charges_nettes_cession_vmp', label: 'Charges nettes sur cession VMP', accounts: ['667'], debitCredit: 'DEBIT' },
          { id: 'dotations_provisions_fin', label: 'Dotations provisions financières', accounts: ['686'], debitCredit: 'DEBIT' },
          { id: 'total_charges_fin', label: 'TOTAL CHARGES FINANCIÈRES', formula: '=charges_interets+pertes_change+charges_nettes_cession_vmp+dotations_provisions_fin' }
        ]
      },
      {
        id: 'charges_exceptionnelles_detail',
        title: 'CHARGES EXCEPTIONNELLES',
        fields: [
          { id: 'charges_except_gestion', label: 'Charges exceptionnelles sur opérations de gestion', accounts: ['671'], debitCredit: 'DEBIT' },
          { id: 'charges_except_capital', label: 'Charges exceptionnelles sur opérations en capital', accounts: ['675'], debitCredit: 'DEBIT' },
          { id: 'dotations_provisions_except', label: 'Dotations provisions exceptionnelles', accounts: ['687'], debitCredit: 'DEBIT' },
          { id: 'total_charges_except', label: 'TOTAL CHARGES EXCEPTIONNELLES', formula: '=charges_except_gestion+charges_except_capital+dotations_provisions_except' }
        ]
      },
      {
        id: 'total_charges',
        title: 'TOTAL GÉNÉRAL',
        fields: [
          { id: 'participation_salaries', label: 'Participation des salariés', accounts: ['691'], debitCredit: 'DEBIT' },
          { id: 'impots_benefices', label: 'Impôts sur les bénéfices', accounts: ['695'], debitCredit: 'DEBIT' },
          { id: 'total_general_charges', label: 'TOTAL GÉNÉRAL DES CHARGES', formula: '=total_charges_exploit+total_charges_fin+total_charges_except+participation_salaries+impots_benefices' }
        ]
      }
    ]
  },

  // 2053: Compte de résultat (produits)
  {
    documentType: 'FR_2053',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Compte de résultat - Produits (2053-SD)',
    description: 'Compte de résultat détaillé - Produits d\'exploitation, financiers et exceptionnels',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'produits_exploitation_detail',
        title: 'PRODUITS D\'EXPLOITATION',
        fields: [
          { id: 'ventes_marchandises', label: 'Ventes de marchandises', accounts: ['707'], debitCredit: 'CREDIT' },
          { id: 'production_vendue_biens', label: 'Production vendue (biens)', accounts: ['701'], debitCredit: 'CREDIT' },
          { id: 'production_vendue_services', label: 'Production vendue (services)', accounts: ['706', '708'], debitCredit: 'CREDIT' },
          { id: 'production_stockee', label: 'Production stockée', accounts: ['713'], debitCredit: 'NET' },
          { id: 'production_immobilisee', label: 'Production immobilisée', accounts: ['72'], debitCredit: 'CREDIT' },
          { id: 'subventions_exploitation', label: 'Subventions d\'exploitation', accounts: ['74'], debitCredit: 'CREDIT' },
          { id: 'reprises_provisions_exploit', label: 'Reprises sur provisions', accounts: ['781', '791'], debitCredit: 'CREDIT' },
          { id: 'autres_produits_exploit', label: 'Autres produits', accounts: ['75'], debitCredit: 'CREDIT' },
          { id: 'total_produits_exploit', label: 'TOTAL PRODUITS D\'EXPLOITATION', formula: '=ventes_marchandises+production_vendue_biens+production_vendue_services+production_stockee+production_immobilisee+subventions_exploitation+reprises_provisions_exploit+autres_produits_exploit' }
        ]
      },
      {
        id: 'produits_financiers_detail',
        title: 'PRODUITS FINANCIERS',
        fields: [
          { id: 'produits_participations', label: 'Produits de participations', accounts: ['761'], debitCredit: 'CREDIT' },
          { id: 'autres_interets', label: 'Autres intérêts et produits assimilés', accounts: ['762', '763', '764', '765', '766', '768'], debitCredit: 'CREDIT' },
          { id: 'gains_change', label: 'Gains de change', accounts: ['766'], debitCredit: 'CREDIT' },
          { id: 'reprises_provisions_fin', label: 'Reprises provisions financières', accounts: ['786', '796'], debitCredit: 'CREDIT' },
          { id: 'total_produits_fin', label: 'TOTAL PRODUITS FINANCIERS', formula: '=produits_participations+autres_interets+gains_change+reprises_provisions_fin' }
        ]
      },
      {
        id: 'produits_exceptionnels_detail',
        title: 'PRODUITS EXCEPTIONNELS',
        fields: [
          { id: 'produits_except_gestion', label: 'Produits exceptionnels sur opérations de gestion', accounts: ['771'], debitCredit: 'CREDIT' },
          { id: 'produits_except_capital', label: 'Produits exceptionnels sur opérations en capital', accounts: ['775', '777'], debitCredit: 'CREDIT' },
          { id: 'reprises_provisions_except', label: 'Reprises provisions exceptionnelles', accounts: ['787', '797'], debitCredit: 'CREDIT' },
          { id: 'total_produits_except', label: 'TOTAL PRODUITS EXCEPTIONNELS', formula: '=produits_except_gestion+produits_except_capital+reprises_provisions_except' }
        ]
      },
      {
        id: 'total_produits',
        title: 'TOTAL GÉNÉRAL',
        fields: [
          { id: 'total_general_produits', label: 'TOTAL GÉNÉRAL DES PRODUITS', formula: '=total_produits_exploit+total_produits_fin+total_produits_except' }
        ]
      }
    ]
  },

  // CA3: Déclaration de TVA (mensuelle)
  {
    documentType: 'FR_CA3',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Déclaration de TVA (CA3)',
    description: 'Déclaration mensuelle de TVA (régime réel normal)',
    category: 'tax_returns',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'tva_collectee',
        title: 'TVA COLLECTÉE',
        fields: [
          { id: 'ca_taux_normal', label: 'Chiffre d\'affaires HT (taux normal 20%)', required: true },
          { id: 'tva_taux_normal', label: 'TVA collectée (20%)', formula: '=ca_taux_normal*0.20' },
          { id: 'ca_taux_intermediaire', label: 'Chiffre d\'affaires HT (taux intermédiaire 10%)', required: false },
          { id: 'tva_taux_intermediaire', label: 'TVA collectée (10%)', formula: '=ca_taux_intermediaire*0.10' },
          { id: 'ca_taux_reduit', label: 'Chiffre d\'affaires HT (taux réduit 5,5%)', required: false },
          { id: 'tva_taux_reduit', label: 'TVA collectée (5,5%)', formula: '=ca_taux_reduit*0.055' },
          { id: 'ca_taux_particulier', label: 'Chiffre d\'affaires HT (taux particulier 2,1%)', required: false },
          { id: 'tva_taux_particulier', label: 'TVA collectée (2,1%)', formula: '=ca_taux_particulier*0.021' },
          { id: 'total_tva_collectee', label: 'TOTAL TVA COLLECTÉE', formula: '=tva_taux_normal+tva_taux_intermediaire+tva_taux_reduit+tva_taux_particulier' }
        ]
      },
      {
        id: 'tva_deductible',
        title: 'TVA DÉDUCTIBLE',
        fields: [
          { id: 'tva_deductible_immobilisations', label: 'TVA déductible sur immobilisations', required: false },
          { id: 'tva_deductible_biens_services', label: 'TVA déductible sur biens et services', required: false },
          { id: 'total_tva_deductible', label: 'TOTAL TVA DÉDUCTIBLE', formula: '=tva_deductible_immobilisations+tva_deductible_biens_services' }
        ]
      },
      {
        id: 'tva_nette',
        title: 'TVA NETTE',
        fields: [
          { id: 'credit_tva_anterieur', label: 'Crédit de TVA antérieur', required: false },
          { id: 'tva_due', label: 'TVA nette due', formula: '=total_tva_collectee-total_tva_deductible-credit_tva_anterieur' },
          { id: 'credit_tva_reporte', label: 'Crédit de TVA à reporter', formula: '=tva_due<0 ? -tva_due : 0' }
        ]
      }
    ]
  },

  // CA12: Déclaration de TVA (annuelle - régime simplifié)
  {
    documentType: 'FR_CA12',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Déclaration de TVA annuelle (CA12)',
    description: 'Déclaration annuelle de TVA (régime simplifié)',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'tva_collectee_annuelle',
        title: 'TVA COLLECTÉE (ANNÉE)',
        fields: [
          { id: 'ca_annuel_taux_normal', label: 'Chiffre d\'affaires annuel HT (taux normal 20%)', required: true },
          { id: 'tva_annuelle_taux_normal', label: 'TVA collectée (20%)', formula: '=ca_annuel_taux_normal*0.20' },
          { id: 'ca_annuel_taux_reduit', label: 'Chiffre d\'affaires annuel HT (autres taux)', required: false },
          { id: 'tva_annuelle_autres_taux', label: 'TVA collectée (autres taux)', required: false },
          { id: 'total_tva_collectee_annuelle', label: 'TOTAL TVA COLLECTÉE', formula: '=tva_annuelle_taux_normal+tva_annuelle_autres_taux' }
        ]
      },
      {
        id: 'tva_deductible_annuelle',
        title: 'TVA DÉDUCTIBLE (ANNÉE)',
        fields: [
          { id: 'tva_deductible_immob_annuelle', label: 'TVA déductible sur immobilisations', required: false },
          { id: 'tva_deductible_services_annuelle', label: 'TVA déductible sur biens et services', required: false },
          { id: 'total_tva_deductible_annuelle', label: 'TOTAL TVA DÉDUCTIBLE', formula: '=tva_deductible_immob_annuelle+tva_deductible_services_annuelle' }
        ]
      },
      {
        id: 'regularisation',
        title: 'RÉGULARISATION',
        fields: [
          { id: 'acomptes_verses', label: 'Acomptes versés', required: false },
          { id: 'solde_tva', label: 'Solde de TVA (à payer ou crédit)', formula: '=total_tva_collectee_annuelle-total_tva_deductible_annuelle-acomptes_verses' }
        ]
      }
    ]
  },

  // 2054: Immobilisations
  {
    documentType: 'FR_2054',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Immobilisations (2054-SD)',
    description: 'Tableau des immobilisations - mouvements de l\'exercice',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'immob_incorp',
        title: 'IMMOBILISATIONS INCORPORELLES',
        fields: [
          { id: 'incorp_debut', label: 'Valeur brute début exercice', accounts: ['20', '201', '203', '205', '206', '207', '208'], debitCredit: 'DEBIT' },
          { id: 'incorp_augmentations', label: 'Augmentations', required: false },
          { id: 'incorp_diminutions', label: 'Diminutions', required: false },
          { id: 'incorp_fin', label: 'Valeur brute fin exercice', formula: '=incorp_debut+incorp_augmentations-incorp_diminutions' }
        ]
      },
      {
        id: 'terrains',
        title: 'TERRAINS',
        fields: [
          { id: 'terrains_debut', label: 'Valeur brute début exercice', accounts: ['211', '212'], debitCredit: 'DEBIT' },
          { id: 'terrains_augmentations', label: 'Augmentations', required: false },
          { id: 'terrains_diminutions', label: 'Diminutions', required: false },
          { id: 'terrains_fin', label: 'Valeur brute fin exercice', formula: '=terrains_debut+terrains_augmentations-terrains_diminutions' }
        ]
      },
      {
        id: 'constructions',
        title: 'CONSTRUCTIONS',
        fields: [
          { id: 'constructions_debut', label: 'Valeur brute début exercice', accounts: ['213', '214', '215'], debitCredit: 'DEBIT' },
          { id: 'constructions_augmentations', label: 'Augmentations', required: false },
          { id: 'constructions_diminutions', label: 'Diminutions', required: false },
          { id: 'constructions_fin', label: 'Valeur brute fin exercice', formula: '=constructions_debut+constructions_augmentations-constructions_diminutions' }
        ]
      },
      {
        id: 'materiel',
        title: 'INSTALLATIONS TECHNIQUES, MATÉRIEL ET OUTILLAGE',
        fields: [
          { id: 'materiel_debut', label: 'Valeur brute début exercice', accounts: ['218', '22', '23'], debitCredit: 'DEBIT' },
          { id: 'materiel_augmentations', label: 'Augmentations', required: false },
          { id: 'materiel_diminutions', label: 'Diminutions', required: false },
          { id: 'materiel_fin', label: 'Valeur brute fin exercice', formula: '=materiel_debut+materiel_augmentations-materiel_diminutions' }
        ]
      },
      {
        id: 'financieres',
        title: 'IMMOBILISATIONS FINANCIÈRES',
        fields: [
          { id: 'financieres_debut', label: 'Valeur brute début exercice', accounts: ['26', '27'], debitCredit: 'DEBIT' },
          { id: 'financieres_augmentations', label: 'Augmentations', required: false },
          { id: 'financieres_diminutions', label: 'Diminutions', required: false },
          { id: 'financieres_fin', label: 'Valeur brute fin exercice', formula: '=financieres_debut+financieres_augmentations-financieres_diminutions' }
        ]
      }
    ]
  },

  // 2055: Amortissements
  {
    documentType: 'FR_2055',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Amortissements (2055-SD)',
    description: 'Tableau des amortissements',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'amort_incorp',
        title: 'AMORTISSEMENTS - IMMOBILISATIONS INCORPORELLES',
        fields: [
          { id: 'amort_incorp_debut', label: 'Amortissements cumulés début', accounts: ['280', '2801', '2803', '2805'], debitCredit: 'CREDIT' },
          { id: 'amort_incorp_dotations', label: 'Dotations de l\'exercice', required: false },
          { id: 'amort_incorp_reprises', label: 'Reprises (cessions)', required: false },
          { id: 'amort_incorp_fin', label: 'Amortissements cumulés fin', formula: '=amort_incorp_debut+amort_incorp_dotations-amort_incorp_reprises' }
        ]
      },
      {
        id: 'amort_constructions',
        title: 'AMORTISSEMENTS - CONSTRUCTIONS',
        fields: [
          { id: 'amort_const_debut', label: 'Amortissements cumulés début', accounts: ['2813', '2814', '2815'], debitCredit: 'CREDIT' },
          { id: 'amort_const_dotations', label: 'Dotations de l\'exercice', required: false },
          { id: 'amort_const_reprises', label: 'Reprises (cessions)', required: false },
          { id: 'amort_const_fin', label: 'Amortissements cumulés fin', formula: '=amort_const_debut+amort_const_dotations-amort_const_reprises' }
        ]
      },
      {
        id: 'amort_materiel',
        title: 'AMORTISSEMENTS - MATÉRIEL ET OUTILLAGE',
        fields: [
          { id: 'amort_mat_debut', label: 'Amortissements cumulés début', accounts: ['2818', '28'], debitCredit: 'CREDIT' },
          { id: 'amort_mat_dotations', label: 'Dotations de l\'exercice', required: false },
          { id: 'amort_mat_reprises', label: 'Reprises (cessions)', required: false },
          { id: 'amort_mat_fin', label: 'Amortissements cumulés fin', formula: '=amort_mat_debut+amort_mat_dotations-amort_mat_reprises' }
        ]
      }
    ]
  },

  // 2056: Provisions
  {
    documentType: 'FR_2056',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Provisions (2056-SD)',
    description: 'Tableau des provisions',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'prov_reglementees',
        title: 'PROVISIONS RÉGLEMENTÉES',
        fields: [
          { id: 'prov_reg_debut', label: 'Montant début exercice', accounts: ['14', '142', '143', '144', '145', '146'], debitCredit: 'CREDIT' },
          { id: 'prov_reg_dotations', label: 'Dotations de l\'exercice', required: false },
          { id: 'prov_reg_reprises', label: 'Reprises de l\'exercice', required: false },
          { id: 'prov_reg_fin', label: 'Montant fin exercice', formula: '=prov_reg_debut+prov_reg_dotations-prov_reg_reprises' }
        ]
      },
      {
        id: 'prov_risques',
        title: 'PROVISIONS POUR RISQUES',
        fields: [
          { id: 'prov_risques_debut', label: 'Montant début exercice', accounts: ['151', '155'], debitCredit: 'CREDIT' },
          { id: 'prov_risques_dotations', label: 'Dotations de l\'exercice', required: false },
          { id: 'prov_risques_reprises', label: 'Reprises de l\'exercice', required: false },
          { id: 'prov_risques_fin', label: 'Montant fin exercice', formula: '=prov_risques_debut+prov_risques_dotations-prov_risques_reprises' }
        ]
      },
      {
        id: 'prov_charges',
        title: 'PROVISIONS POUR CHARGES',
        fields: [
          { id: 'prov_charges_debut', label: 'Montant début exercice', accounts: ['153', '156', '157', '158'], debitCredit: 'CREDIT' },
          { id: 'prov_charges_dotations', label: 'Dotations de l\'exercice', required: false },
          { id: 'prov_charges_reprises', label: 'Reprises de l\'exercice', required: false },
          { id: 'prov_charges_fin', label: 'Montant fin exercice', formula: '=prov_charges_debut+prov_charges_dotations-prov_charges_reprises' }
        ]
      },
      {
        id: 'prov_depreciation',
        title: 'PROVISIONS POUR DÉPRÉCIATION',
        fields: [
          { id: 'prov_deprec_debut', label: 'Montant début exercice', accounts: ['29', '39', '49', '59'], debitCredit: 'CREDIT' },
          { id: 'prov_deprec_dotations', label: 'Dotations de l\'exercice', required: false },
          { id: 'prov_deprec_reprises', label: 'Reprises de l\'exercice', required: false },
          { id: 'prov_deprec_fin', label: 'Montant fin exercice', formula: '=prov_deprec_debut+prov_deprec_dotations-prov_deprec_reprises' }
        ]
      }
    ]
  },

  // 2057: État des échéances des créances et dettes
  {
    documentType: 'FR_2057',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'État des échéances (2057-SD)',
    description: 'État des échéances des créances et des dettes à la clôture de l\'exercice',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'creances_clients',
        title: 'CRÉANCES CLIENTS',
        fields: [
          { id: 'creances_clients_total', label: 'Total créances clients', accounts: ['411', '413', '416', '417'], debitCredit: 'DEBIT' },
          { id: 'creances_clients_1an', label: 'À moins d\'un an', required: false },
          { id: 'creances_clients_plus1an', label: 'À plus d\'un an', required: false }
        ]
      },
      {
        id: 'autres_creances',
        title: 'AUTRES CRÉANCES',
        fields: [
          { id: 'autres_creances_total', label: 'Total autres créances', accounts: ['42', '43', '44', '45', '46', '47', '48'], debitCredit: 'DEBIT' },
          { id: 'autres_creances_1an', label: 'À moins d\'un an', required: false },
          { id: 'autres_creances_plus1an', label: 'À plus d\'un an', required: false }
        ]
      },
      {
        id: 'dettes_financieres',
        title: 'DETTES FINANCIÈRES',
        fields: [
          { id: 'dettes_financieres_total', label: 'Total dettes financières', accounts: ['16', '17'], debitCredit: 'CREDIT' },
          { id: 'dettes_financieres_1an', label: 'À moins d\'un an', required: false },
          { id: 'dettes_financieres_plus1an', label: 'À plus d\'un an', required: false }
        ]
      },
      {
        id: 'dettes_fournisseurs',
        title: 'DETTES FOURNISSEURS',
        fields: [
          { id: 'dettes_fournisseurs_total', label: 'Total dettes fournisseurs', accounts: ['401', '403', '404', '405', '408'], debitCredit: 'CREDIT' },
          { id: 'dettes_fournisseurs_1an', label: 'À moins d\'un an', required: false },
          { id: 'dettes_fournisseurs_plus1an', label: 'À plus d\'un an', required: false }
        ]
      },
      {
        id: 'autres_dettes',
        title: 'AUTRES DETTES',
        fields: [
          { id: 'autres_dettes_total', label: 'Total autres dettes', accounts: ['42', '43', '44', '45', '46', '47', '48'], debitCredit: 'CREDIT' },
          { id: 'autres_dettes_1an', label: 'À moins d\'un an', required: false },
          { id: 'autres_dettes_plus1an', label: 'À plus d\'un an', required: false }
        ]
      }
    ]
  },

  // 2058-A: Détermination du résultat fiscal
  {
    documentType: 'FR_2058A',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Détermination résultat fiscal (2058-A-SD)',
    description: 'Détermination du résultat fiscal - Réintégrations et déductions',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'resultat_comptable',
        title: 'RÉSULTAT COMPTABLE',
        fields: [
          { id: 'resultat_compta_avant_impot', label: 'Résultat comptable de l\'exercice', required: true },
          { id: 'impot_societes', label: 'Impôt sur les sociétés', accounts: ['695'], debitCredit: 'DEBIT' },
          { id: 'resultat_avant_reint_ded', label: 'Résultat avant réintégrations/déductions', formula: '=resultat_compta_avant_impot+impot_societes' }
        ]
      },
      {
        id: 'reintegrations',
        title: 'RÉINTÉGRATIONS',
        fields: [
          { id: 'reint_amortissements_excessifs', label: 'Amortissements excédentaires', required: false },
          { id: 'reint_provisions_non_deductibles', label: 'Provisions non déductibles', required: false },
          { id: 'reint_charges_somptuaires', label: 'Charges somptuaires', required: false },
          { id: 'reint_amendes_penalites', label: 'Amendes et pénalités', required: false },
          { id: 'reint_impots_non_deductibles', label: 'Impôts non déductibles', required: false },
          { id: 'reint_autres', label: 'Autres réintégrations', required: false },
          { id: 'total_reintegrations', label: 'TOTAL RÉINTÉGRATIONS', formula: '=reint_amortissements_excessifs+reint_provisions_non_deductibles+reint_charges_somptuaires+reint_amendes_penalites+reint_impots_non_deductibles+reint_autres' }
        ]
      },
      {
        id: 'deductions',
        title: 'DÉDUCTIONS',
        fields: [
          { id: 'ded_produits_participation', label: 'Produits de participation', required: false },
          { id: 'ded_plus_values_long_terme', label: 'Plus-values à long terme', required: false },
          { id: 'ded_deficits_reportables', label: 'Déficits reportables', required: false },
          { id: 'ded_autres', label: 'Autres déductions', required: false },
          { id: 'total_deductions', label: 'TOTAL DÉDUCTIONS', formula: '=ded_produits_participation+ded_plus_values_long_terme+ded_deficits_reportables+ded_autres' }
        ]
      },
      {
        id: 'resultat_fiscal_final',
        title: 'RÉSULTAT FISCAL',
        fields: [
          { id: 'resultat_fiscal', label: 'RÉSULTAT FISCAL', formula: '=resultat_avant_reint_ded+total_reintegrations-total_deductions' },
          { id: 'deficits_imputes', label: 'Déficits antérieurs imputés', required: false },
          { id: 'resultat_fiscal_net', label: 'RÉSULTAT FISCAL NET', formula: '=resultat_fiscal-deficits_imputes' }
        ]
      }
    ]
  },

  // 2058-B: Déficits et provisions
  {
    documentType: 'FR_2058B',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Déficits et provisions (2058-B-SD)',
    description: 'Déficits reportables et provisions non déductibles',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'deficits_reportables',
        title: 'DÉFICITS REPORTABLES',
        fields: [
          { id: 'deficit_n_5', label: 'Déficit N-5', required: false },
          { id: 'deficit_n_4', label: 'Déficit N-4', required: false },
          { id: 'deficit_n_3', label: 'Déficit N-3', required: false },
          { id: 'deficit_n_2', label: 'Déficit N-2', required: false },
          { id: 'deficit_n_1', label: 'Déficit N-1', required: false },
          { id: 'total_deficits_reportables', label: 'TOTAL DÉFICITS REPORTABLES', formula: '=deficit_n_5+deficit_n_4+deficit_n_3+deficit_n_2+deficit_n_1' }
        ]
      },
      {
        id: 'provisions_non_deductibles',
        title: 'PROVISIONS NON DÉDUCTIBLES',
        fields: [
          { id: 'prov_non_ded_reglementees', label: 'Provisions réglementées', required: false },
          { id: 'prov_non_ded_autres', label: 'Autres provisions non déductibles', required: false },
          { id: 'total_prov_non_ded', label: 'TOTAL PROVISIONS NON DÉDUCTIBLES', formula: '=prov_non_ded_reglementees+prov_non_ded_autres' }
        ]
      }
    ]
  },

  // 2058-C: Tableau d'affectation du résultat
  {
    documentType: 'FR_2058C',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Affectation du résultat (2058-C-SD)',
    description: 'Tableau d\'affectation du résultat et renseignements divers',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'origine_resultat',
        title: 'ORIGINE',
        fields: [
          { id: 'report_nouveau_anterieur', label: 'Report à nouveau antérieur', required: false },
          { id: 'resultat_exercice', label: 'Résultat de l\'exercice', required: true },
          { id: 'total_a_affecter', label: 'TOTAL À AFFECTER', formula: '=report_nouveau_anterieur+resultat_exercice' }
        ]
      },
      {
        id: 'affectation',
        title: 'AFFECTATION',
        fields: [
          { id: 'dotation_reserve_legale', label: 'Dotation à la réserve légale', required: false },
          { id: 'dotation_reserves_statutaires', label: 'Dotation aux réserves statutaires', required: false },
          { id: 'dotation_autres_reserves', label: 'Dotation aux autres réserves', required: false },
          { id: 'dividendes', label: 'Dividendes', required: false },
          { id: 'report_nouveau', label: 'Report à nouveau', formula: '=total_a_affecter-dotation_reserve_legale-dotation_reserves_statutaires-dotation_autres_reserves-dividendes' }
        ]
      },
      {
        id: 'renseignements_divers',
        title: 'RENSEIGNEMENTS DIVERS',
        fields: [
          { id: 'capital_debut', label: 'Capital social début exercice', required: false },
          { id: 'capital_fin', label: 'Capital social fin exercice', accounts: ['101', '108'], debitCredit: 'CREDIT' },
          { id: 'nombre_parts_sociales', label: 'Nombre de parts sociales', type: 'number', required: false },
          { id: 'valeur_nominale', label: 'Valeur nominale des parts', required: false }
        ]
      }
    ]
  },

  // 2059-A: Détermination des plus et moins-values
  {
    documentType: 'FR_2059A',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Plus et moins-values (2059-A-SD)',
    description: 'Détermination des plus et moins-values',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: false,
    sections: [
      {
        id: 'plus_values_court_terme',
        title: 'PLUS-VALUES À COURT TERME',
        fields: [
          { id: 'pv_ct_cessions', label: 'Prix de cession', required: false },
          { id: 'pv_ct_valeur_nette', label: 'Valeur nette comptable', required: false },
          { id: 'pv_ct_montant', label: 'PLUS-VALUE CT', formula: '=pv_ct_cessions-pv_ct_valeur_nette' }
        ]
      },
      {
        id: 'plus_values_long_terme',
        title: 'PLUS-VALUES À LONG TERME',
        fields: [
          { id: 'pv_lt_cessions', label: 'Prix de cession', required: false },
          { id: 'pv_lt_valeur_nette', label: 'Valeur nette comptable', required: false },
          { id: 'pv_lt_montant', label: 'PLUS-VALUE LT', formula: '=pv_lt_cessions-pv_lt_valeur_nette' }
        ]
      },
      {
        id: 'moins_values',
        title: 'MOINS-VALUES',
        fields: [
          { id: 'mv_ct', label: 'Moins-values à court terme', required: false },
          { id: 'mv_lt', label: 'Moins-values à long terme', required: false }
        ]
      }
    ]
  },

  // 2059-B: Affectation des plus-values à court terme
  {
    documentType: 'FR_2059B',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Affectation plus-values CT (2059-B-SD)',
    description: 'Affectation des plus-values à court terme de l\'exercice',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: false,
    sections: [
      {
        id: 'plus_values_ct_exercice',
        title: 'PLUS-VALUES CT DE L\'EXERCICE',
        fields: [
          { id: 'pv_ct_total', label: 'Total plus-values CT', required: false },
          { id: 'pv_ct_imposees', label: 'Plus-values imposées', required: false },
          { id: 'pv_ct_en_report', label: 'Plus-values en report', formula: '=pv_ct_total-pv_ct_imposees' }
        ]
      }
    ]
  },

  // 2059-C: Affectation des plus-values à long terme
  {
    documentType: 'FR_2059C',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Affectation plus-values LT (2059-C-SD)',
    description: 'Suivi des plus-values à long terme en report d\'imposition',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: false,
    sections: [
      {
        id: 'plus_values_lt_exercice',
        title: 'PLUS-VALUES LT DE L\'EXERCICE',
        fields: [
          { id: 'pv_lt_total', label: 'Total plus-values LT', required: false },
          { id: 'pv_lt_imposees', label: 'Plus-values imposées (taux réduit)', required: false },
          { id: 'pv_lt_en_report', label: 'Plus-values en report', formula: '=pv_lt_total-pv_lt_imposees' }
        ]
      }
    ]
  },

  // 2059-D: Frais généraux
  {
    documentType: 'FR_2059D',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Frais généraux (2059-D-SD)',
    description: 'Relevé des frais généraux (véhicules, cadeaux, réceptions)',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: false,
    sections: [
      {
        id: 'vehicules',
        title: 'VÉHICULES ET AUTRES BIENS',
        fields: [
          { id: 'frais_vehicules', label: 'Frais de véhicules de tourisme', required: false },
          { id: 'amort_vehicules', label: 'Amortissements véhicules', required: false },
          { id: 'locations_vehicules', label: 'Locations de véhicules', required: false }
        ]
      },
      {
        id: 'cadeaux_reception',
        title: 'CADEAUX ET RÉCEPTIONS',
        fields: [
          { id: 'frais_reception', label: 'Frais de réception', required: false },
          { id: 'cadeaux_clientele', label: 'Cadeaux à la clientèle', required: false },
          { id: 'parrainages', label: 'Dépenses de parrainage', required: false }
        ]
      }
    ]
  },

  // 2059-E: Rémunérations
  {
    documentType: 'FR_2059E',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Rémunérations (2059-E-SD)',
    description: 'Relevé des rémunérations des dirigeants et des 10 plus hautes',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: false,
    sections: [
      {
        id: 'remunerations_dirigeants',
        title: 'RÉMUNÉRATIONS DES DIRIGEANTS',
        fields: [
          { id: 'remun_president', label: 'Rémunération président/gérant', required: false },
          { id: 'remun_autres_dirigeants', label: 'Rémunérations autres dirigeants', required: false },
          { id: 'total_remun_dirigeants', label: 'TOTAL RÉMUNÉRATIONS DIRIGEANTS', formula: '=remun_president+remun_autres_dirigeants' }
        ]
      },
      {
        id: 'remunerations_10_plus_hautes',
        title: '10 RÉMUNÉRATIONS LES PLUS ÉLEVÉES',
        fields: [
          { id: 'total_10_remun', label: 'Total des 10 rémunérations les plus élevées', required: false }
        ]
      }
    ]
  },

  // 2059-F: Opérations faites avec des entreprises liées
  {
    documentType: 'FR_2059F',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Entreprises liées (2059-F-SD)',
    description: 'Opérations faites avec des entreprises liées ou ayant un lien de dépendance',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: false,
    sections: [
      {
        id: 'operations_entreprises_liees',
        title: 'OPÉRATIONS AVEC ENTREPRISES LIÉES',
        fields: [
          { id: 'achats_entreprises_liees', label: 'Achats auprès d\'entreprises liées', required: false },
          { id: 'ventes_entreprises_liees', label: 'Ventes à des entreprises liées', required: false },
          { id: 'interets_verses', label: 'Intérêts versés', required: false },
          { id: 'interets_recus', label: 'Intérêts reçus', required: false },
          { id: 'redevances_versees', label: 'Redevances versées', required: false },
          { id: 'redevances_recues', label: 'Redevances reçues', required: false }
        ]
      }
    ]
  },

  // 2059-G: Filiales et participations
  {
    documentType: 'FR_2059G',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Filiales et participations (2059-G-SD)',
    description: 'Tableau des filiales et participations détenues',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: false,
    sections: [
      {
        id: 'participations_filiales',
        title: 'FILIALES ET PARTICIPATIONS',
        fields: [
          { id: 'valeur_brute_participations', label: 'Valeur brute des participations', accounts: ['261', '266'], debitCredit: 'DEBIT' },
          { id: 'provisions_depreciation', label: 'Provisions pour dépréciation', accounts: ['2961', '2966'], debitCredit: 'CREDIT' },
          { id: 'valeur_nette_participations', label: 'Valeur nette des participations', formula: '=valeur_brute_participations-provisions_depreciation' },
          { id: 'nb_filiales_france', label: 'Nombre de filiales en France', type: 'number', required: false },
          { id: 'nb_filiales_etranger', label: 'Nombre de filiales à l\'étranger', type: 'number', required: false }
        ]
      },
      {
        id: 'produits_participations',
        title: 'PRODUITS DES PARTICIPATIONS',
        fields: [
          { id: 'dividendes_filiales', label: 'Dividendes reçus des filiales', accounts: ['761'], debitCredit: 'CREDIT' },
          { id: 'quote_part_resultat', label: 'Quote-part de résultat', required: false }
        ]
      }
    ]
  },

  // 2065: Déclaration de résultat (IS)
  {
    documentType: 'FR_2065',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Déclaration de résultat (2065)',
    description: 'Déclaration de résultat pour l\'impôt sur les sociétés',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'resultat_fiscal',
        title: 'RÉSULTAT FISCAL',
        fields: [
          { id: 'resultat_comptable', label: 'Résultat comptable (bénéfice ou perte)', required: true },
          { id: 'reintegrations', label: 'Réintégrations extracomptables', required: false },
          { id: 'deductions', label: 'Déductions extracomptables', required: false },
          { id: 'resultat_fiscal', label: 'RÉSULTAT FISCAL', formula: '=resultat_comptable+reintegrations-deductions' }
        ]
      },
      {
        id: 'impot_societes',
        title: 'IMPÔT SUR LES SOCIÉTÉS',
        fields: [
          { id: 'taux_is_normal', label: 'Taux normal IS (%)', type: 'percentage', required: true },
          { id: 'impot_du', label: 'Impôt sur les sociétés dû', formula: '=resultat_fiscal>0 ? resultat_fiscal*taux_is_normal/100 : 0' },
          { id: 'credits_impot', label: 'Crédits d\'impôt et réductions', required: false },
          { id: 'acomptes_is_verses', label: 'Acomptes d\'IS versés', required: false },
          { id: 'solde_is', label: 'Solde d\'IS (à payer ou crédit)', formula: '=impot_du-credits_impot-acomptes_is_verses' }
        ]
      },
      {
        id: 'plus_values',
        title: 'PLUS-VALUES ET MOINS-VALUES',
        fields: [
          { id: 'plus_values_court_terme', label: 'Plus-values à court terme', required: false },
          { id: 'plus_values_long_terme', label: 'Plus-values à long terme', required: false },
          { id: 'moins_values_court_terme', label: 'Moins-values à court terme', required: false },
          { id: 'moins_values_long_terme', label: 'Moins-values à long terme', required: false }
        ]
      }
    ]
  }
];

/**
 * Génère tous les templates France
 */
export function generateAllFranceTemplates(): Array<Omit<RegulatoryTemplate, 'id' | 'createdAt' | 'updatedAt'>> {
  return createTemplatesFromConfigs(FRANCE_TEMPLATES_CONFIG);
}

/**
 * Récupère un template France par son type
 */
export function getFranceTemplateConfig(documentType: string): TemplateConfig | undefined {
  return FRANCE_TEMPLATES_CONFIG.find(t => t.documentType === documentType);
}

/**
 * Liste des types de documents France disponibles
 */
export const FRANCE_DOCUMENT_TYPES = FRANCE_TEMPLATES_CONFIG.map(t => t.documentType);
