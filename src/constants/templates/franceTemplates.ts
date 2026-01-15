/**
 * CassKai - Templates de documents réglementaires France (PCG)
 * Tous les formulaires fiscaux français officiels
 *
 * LIASSE FISCALE SIMPLIFIÉE (Régime réel simplifié):
 * - 2033-A à 2033-G (7 formulaires)
 * - 2069-RCI, 2079-FCE (2 formulaires)
 *
 * LIASSE FISCALE NORMALE (Régime réel normal):
 * - 2050 à 2059-G (18 formulaires)
 *
 * DÉCLARATIONS:
 * - CA3 (TVA mensuelle)
 * - CA12 (TVA annuelle)
 * - 2065 (IS)
 */

import type { RegulatoryTemplate } from '@/types/regulatory';

// ============================================================================
// LIASSE FISCALE SIMPLIFIÉE - Régime réel simplifié
// ============================================================================

/**
 * 2033-A-SD : Bilan simplifié
 */
export function createFrance2033A(): Omit<RegulatoryTemplate, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    documentType: 'FR_2033A',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Bilan simplifié (2033-A-SD)',
    description: 'Déclaration 2033-A : Bilan simplifié pour le régime réel simplifié d\'imposition',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    version: '1.0',
    isActive: true,

    formSchema: {
      version: '1.0',
      sections: [
        {
          id: 'actif_immobilise',
          title: 'ACTIF IMMOBILISÉ',
          description: 'Immobilisations incorporelles, corporelles et financières',
          order: 1,
          fields: [
            {
              id: 'immobilisations_incorporelles_brut',
              name: 'immobilisations_incorporelles_brut',
              label: 'Immobilisations incorporelles (brut)',
              type: 'currency',
              description: 'Comptes 20* : Frais d\'établissement, fonds commercial, logiciels, etc.',
              required: true,
              order: 1,
              autoFill: {
                source: 'accounts',
                accounts: ['20', '201', '203', '205', '206', '207', '208'],
                operation: 'SUM',
                debitCredit: 'DEBIT'
              }
            },
            {
              id: 'immobilisations_corporelles_brut',
              name: 'immobilisations_corporelles_brut',
              label: 'Immobilisations corporelles (brut)',
              type: 'currency',
              description: 'Comptes 21*, 22*, 23* : Terrains, constructions, matériel, etc.',
              required: true,
              order: 2,
              autoFill: {
                source: 'accounts',
                accounts: ['21', '211', '212', '213', '214', '215', '218', '22', '23', '231', '232', '233', '237', '238'],
                operation: 'SUM',
                debitCredit: 'DEBIT'
              }
            },
            {
              id: 'immobilisations_financieres_brut',
              name: 'immobilisations_financieres_brut',
              label: 'Immobilisations financières (brut)',
              type: 'currency',
              description: 'Comptes 26*, 27* : Participations, créances rattachées, prêts, dépôts',
              required: true,
              order: 3,
              autoFill: {
                source: 'accounts',
                accounts: ['26', '261', '266', '267', '268', '269', '27', '271', '272', '273', '274', '275', '276', '277', '279'],
                operation: 'SUM',
                debitCredit: 'DEBIT'
              }
            },
            {
              id: 'amortissements_immobilisations',
              name: 'amortissements_immobilisations',
              label: 'Amortissements des immobilisations',
              type: 'currency',
              description: 'Comptes 28* : Amortissements cumulés',
              required: true,
              order: 4,
              autoFill: {
                source: 'accounts',
                accounts: ['280', '2801', '2803', '2805', '281', '2811', '2812', '2813', '2814', '2815', '2818'],
                operation: 'SUM',
                debitCredit: 'CREDIT'
              }
            },
            {
              id: 'immobilisations_nettes',
              name: 'immobilisations_nettes',
              label: 'TOTAL IMMOBILISATIONS NETTES',
              type: 'currency',
              required: true,
              order: 5,
              calculated: true,
              calculationFormula: '=immobilisations_incorporelles_brut+immobilisations_corporelles_brut+immobilisations_financieres_brut-amortissements_immobilisations'
            }
          ]
        },
        {
          id: 'actif_circulant',
          title: 'ACTIF CIRCULANT',
          description: 'Stocks, créances et disponibilités',
          order: 2,
          fields: [
            {
              id: 'stocks_en_cours',
              name: 'stocks_en_cours',
              label: 'Stocks et en-cours',
              type: 'currency',
              description: 'Comptes 3* : Stocks de marchandises, matières premières, produits',
              required: true,
              order: 1,
              autoFill: {
                source: 'accounts',
                accounts: ['31', '32', '33', '34', '35', '37'],
                operation: 'SUM',
                debitCredit: 'DEBIT'
              }
            },
            {
              id: 'creances_clients',
              name: 'creances_clients',
              label: 'Créances clients et comptes rattachés',
              type: 'currency',
              description: 'Comptes 41* : Clients, effets à recevoir, créances douteuses',
              required: true,
              order: 2,
              autoFill: {
                source: 'accounts',
                accounts: ['411', '413', '416', '417', '418'],
                operation: 'SUM',
                debitCredit: 'DEBIT'
              }
            },
            {
              id: 'autres_creances',
              name: 'autres_creances',
              label: 'Autres créances',
              type: 'currency',
              description: 'Comptes 42*, 43*, 44*, 45*, 46*, 47*, 48* : Personnel, organismes sociaux, État, etc.',
              required: true,
              order: 3,
              autoFill: {
                source: 'accounts',
                accounts: ['42', '43', '44', '442', '443', '444', '445', '446', '447', '448', '45', '46', '47', '48', '486', '487', '488'],
                operation: 'SUM',
                debitCredit: 'DEBIT'
              }
            },
            {
              id: 'disponibilites',
              name: 'disponibilites',
              label: 'Disponibilités',
              type: 'currency',
              description: 'Comptes 5* : Banques, CCP, caisses, valeurs mobilières de placement',
              required: true,
              order: 4,
              autoFill: {
                source: 'accounts',
                accounts: ['50', '51', '512', '514', '515', '516', '517', '518', '52', '53', '54'],
                operation: 'SUM',
                debitCredit: 'DEBIT'
              }
            },
            {
              id: 'charges_constatees_avance',
              name: 'charges_constatees_avance',
              label: 'Charges constatées d\'avance',
              type: 'currency',
              description: 'Compte 486',
              required: false,
              order: 5,
              autoFill: {
                source: 'accounts',
                accounts: ['486'],
                operation: 'SUM',
                debitCredit: 'DEBIT'
              }
            },
            {
              id: 'actif_circulant_total',
              name: 'actif_circulant_total',
              label: 'TOTAL ACTIF CIRCULANT',
              type: 'currency',
              required: true,
              order: 6,
              calculated: true,
              calculationFormula: '=stocks_en_cours+creances_clients+autres_creances+disponibilites+charges_constatees_avance'
            }
          ]
        },
        {
          id: 'total_actif',
          title: 'TOTAL ACTIF',
          order: 3,
          fields: [
            {
              id: 'total_actif',
              name: 'total_actif',
              label: 'TOTAL GÉNÉRAL DE L\'ACTIF',
              type: 'currency',
              required: true,
              order: 1,
              calculated: true,
              calculationFormula: '=immobilisations_nettes+actif_circulant_total',
              format: 'currency',
              width: 'full'
            }
          ]
        },
        {
          id: 'capitaux_propres',
          title: 'CAPITAUX PROPRES',
          description: 'Capital, réserves et résultat',
          order: 4,
          fields: [
            {
              id: 'capital_social',
              name: 'capital_social',
              label: 'Capital social ou individuel',
              type: 'currency',
              description: 'Compte 101',
              required: true,
              order: 1,
              autoFill: {
                source: 'accounts',
                accounts: ['101'],
                operation: 'SUM',
                debitCredit: 'CREDIT'
              }
            },
            {
              id: 'primes_reserves',
              name: 'primes_reserves',
              label: 'Primes et réserves',
              type: 'currency',
              description: 'Comptes 104, 105, 106 : Primes d\'émission, écarts de réévaluation, réserves',
              required: true,
              order: 2,
              autoFill: {
                source: 'accounts',
                accounts: ['104', '1041', '1042', '1043', '1044', '105', '1051', '1052', '1053', '1054', '106', '1061', '1062', '1063', '1064', '1068'],
                operation: 'SUM',
                debitCredit: 'CREDIT'
              }
            },
            {
              id: 'report_nouveau',
              name: 'report_nouveau',
              label: 'Report à nouveau',
              type: 'currency',
              description: 'Compte 110 et 119',
              required: true,
              order: 3,
              autoFill: {
                source: 'accounts',
                accounts: ['110', '119'],
                operation: 'SUM',
                debitCredit: 'NET'
              }
            },
            {
              id: 'resultat_exercice',
              name: 'resultat_exercice',
              label: 'Résultat de l\'exercice (bénéfice ou perte)',
              type: 'currency',
              description: 'Résultat net de l\'exercice (ligne K du compte de résultat 2033-B)',
              required: true,
              order: 4,
              autoFill: {
                source: 'computed',
                formula: '=total_produits-total_charges'
              }
            },
            {
              id: 'subventions_investissement',
              name: 'subventions_investissement',
              label: 'Subventions d\'investissement',
              type: 'currency',
              description: 'Compte 131',
              required: false,
              order: 5,
              autoFill: {
                source: 'accounts',
                accounts: ['131'],
                operation: 'SUM',
                debitCredit: 'CREDIT'
              }
            },
            {
              id: 'provisions_reglementees',
              name: 'provisions_reglementees',
              label: 'Provisions réglementées',
              type: 'currency',
              description: 'Compte 14* : Provisions pour hausse des prix, amortissements dérogatoires, etc.',
              required: false,
              order: 6,
              autoFill: {
                source: 'accounts',
                accounts: ['14', '142', '143', '144', '145', '146', '148'],
                operation: 'SUM',
                debitCredit: 'CREDIT'
              }
            },
            {
              id: 'capitaux_propres_total',
              name: 'capitaux_propres_total',
              label: 'TOTAL CAPITAUX PROPRES',
              type: 'currency',
              required: true,
              order: 7,
              calculated: true,
              calculationFormula: '=capital_social+primes_reserves+report_nouveau+resultat_exercice+subventions_investissement+provisions_reglementees'
            }
          ]
        },
        {
          id: 'dettes',
          title: 'DETTES',
          description: 'Emprunts, fournisseurs et autres dettes',
          order: 5,
          fields: [
            {
              id: 'emprunts_dettes_financieres',
              name: 'emprunts_dettes_financieres',
              label: 'Emprunts et dettes financières',
              type: 'currency',
              description: 'Comptes 16* : Emprunts obligataires, auprès des établissements de crédit, etc.',
              required: true,
              order: 1,
              autoFill: {
                source: 'accounts',
                accounts: ['16', '161', '162', '163', '164', '165', '166', '167', '168'],
                operation: 'SUM',
                debitCredit: 'CREDIT'
              }
            },
            {
              id: 'dettes_fournisseurs',
              name: 'dettes_fournisseurs',
              label: 'Dettes fournisseurs et comptes rattachés',
              type: 'currency',
              description: 'Comptes 40* : Fournisseurs, effets à payer',
              required: true,
              order: 2,
              autoFill: {
                source: 'accounts',
                accounts: ['401', '403', '404', '405', '408'],
                operation: 'SUM',
                debitCredit: 'CREDIT'
              }
            },
            {
              id: 'dettes_fiscales_sociales',
              name: 'dettes_fiscales_sociales',
              label: 'Dettes fiscales et sociales',
              type: 'currency',
              description: 'Comptes 42*, 43*, 44* : Personnel, sécurité sociale, État',
              required: true,
              order: 3,
              autoFill: {
                source: 'accounts',
                accounts: ['42', '421', '422', '424', '425', '426', '427', '428', '43', '431', '437', '438', '44', '441', '442', '443', '444', '445', '446', '447', '448'],
                operation: 'SUM',
                debitCredit: 'CREDIT'
              }
            },
            {
              id: 'autres_dettes',
              name: 'autres_dettes',
              label: 'Autres dettes',
              type: 'currency',
              description: 'Comptes 45*, 46*, 47*, 48* : Groupe, associés, créditeurs divers',
              required: true,
              order: 4,
              autoFill: {
                source: 'accounts',
                accounts: ['45', '455', '456', '457', '458', '46', '467', '468', '47', '48', '481', '482', '484', '488'],
                operation: 'SUM',
                debitCredit: 'CREDIT'
              }
            },
            {
              id: 'produits_constates_avance',
              name: 'produits_constates_avance',
              label: 'Produits constatés d\'avance',
              type: 'currency',
              description: 'Compte 487',
              required: false,
              order: 5,
              autoFill: {
                source: 'accounts',
                accounts: ['487'],
                operation: 'SUM',
                debitCredit: 'CREDIT'
              }
            },
            {
              id: 'dettes_total',
              name: 'dettes_total',
              label: 'TOTAL DETTES',
              type: 'currency',
              required: true,
              order: 6,
              calculated: true,
              calculationFormula: '=emprunts_dettes_financieres+dettes_fournisseurs+dettes_fiscales_sociales+autres_dettes+produits_constates_avance'
            }
          ]
        },
        {
          id: 'total_passif',
          title: 'TOTAL PASSIF',
          order: 6,
          fields: [
            {
              id: 'total_passif',
              name: 'total_passif',
              label: 'TOTAL GÉNÉRAL DU PASSIF',
              type: 'currency',
              required: true,
              order: 1,
              calculated: true,
              calculationFormula: '=capitaux_propres_total+dettes_total',
              format: 'currency',
              width: 'full'
            }
          ]
        }
      ],
      validations: [
        {
          id: 'balance_actif_passif',
          type: 'global',
          rule: 'total_actif === total_passif',
          message: 'Le total de l\'actif doit être égal au total du passif',
          severity: 'error'
        }
      ]
    },

    validationRules: {
      required: ['immobilisations_incorporelles_brut', 'immobilisations_corporelles_brut', 'total_actif', 'capital_social', 'total_passif'],
      numeric: ['immobilisations_incorporelles_brut', 'immobilisations_corporelles_brut', 'stocks_en_cours', 'creances_clients', 'disponibilites', 'capital_social'],
      balanceChecks: [
        {
          leftFields: ['total_actif'],
          rightFields: ['total_passif'],
          message: 'L\'actif doit être égal au passif',
          tolerance: 1.0
        }
      ]
    },

    accountMappings: {
      immobilisations_incorporelles_brut: {
        accounts: ['20', '201', '203', '205', '206', '207', '208'],
        operation: 'SUM',
        debitCredit: 'DEBIT'
      },
      immobilisations_corporelles_brut: {
        accounts: ['21', '211', '212', '213', '214', '215', '218', '22', '23', '231', '232', '233', '237', '238'],
        operation: 'SUM',
        debitCredit: 'DEBIT'
      },
      capital_social: {
        accounts: ['101'],
        operation: 'SUM',
        debitCredit: 'CREDIT'
      }
    }
  };
}

/**
 * 2033-B-SD : Compte de résultat simplifié
 */
export function createFrance2033B(): Omit<RegulatoryTemplate, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    documentType: 'FR_2033B',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Compte de résultat simplifié (2033-B-SD)',
    description: 'Déclaration 2033-B : Compte de résultat simplifié pour le régime réel simplifié',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    version: '1.0',
    isActive: true,

    formSchema: {
      version: '1.0',
      sections: [
        {
          id: 'produits_exploitation',
          title: 'PRODUITS D\'EXPLOITATION',
          order: 1,
          fields: [
            {
              id: 'ventes_marchandises',
              name: 'ventes_marchandises',
              label: 'Ventes de marchandises',
              type: 'currency',
              description: 'Compte 707',
              required: true,
              order: 1,
              autoFill: {
                source: 'accounts',
                accounts: ['707'],
                operation: 'SUM',
                debitCredit: 'CREDIT'
              }
            },
            {
              id: 'production_vendue',
              name: 'production_vendue',
              label: 'Production vendue (biens et services)',
              type: 'currency',
              description: 'Comptes 701, 703, 704, 706, 708',
              required: true,
              order: 2,
              autoFill: {
                source: 'accounts',
                accounts: ['701', '703', '704', '706', '708'],
                operation: 'SUM',
                debitCredit: 'CREDIT'
              }
            },
            {
              id: 'chiffre_affaires_net',
              name: 'chiffre_affaires_net',
              label: 'CHIFFRE D\'AFFAIRES NET (A)',
              type: 'currency',
              required: true,
              order: 3,
              calculated: true,
              calculationFormula: '=ventes_marchandises+production_vendue'
            },
            {
              id: 'production_stockee',
              name: 'production_stockee',
              label: 'Production stockée',
              type: 'currency',
              description: 'Compte 713',
              required: false,
              order: 4,
              autoFill: {
                source: 'accounts',
                accounts: ['713'],
                operation: 'SUM',
                debitCredit: 'NET'
              }
            },
            {
              id: 'production_immobilisee',
              name: 'production_immobilisee',
              label: 'Production immobilisée',
              type: 'currency',
              description: 'Compte 72',
              required: false,
              order: 5,
              autoFill: {
                source: 'accounts',
                accounts: ['72', '721', '722'],
                operation: 'SUM',
                debitCredit: 'CREDIT'
              }
            },
            {
              id: 'subventions_exploitation',
              name: 'subventions_exploitation',
              label: 'Subventions d\'exploitation',
              type: 'currency',
              description: 'Compte 74',
              required: false,
              order: 6,
              autoFill: {
                source: 'accounts',
                accounts: ['74'],
                operation: 'SUM',
                debitCredit: 'CREDIT'
              }
            },
            {
              id: 'autres_produits',
              name: 'autres_produits',
              label: 'Autres produits',
              type: 'currency',
              description: 'Comptes 75, 781, 791',
              required: false,
              order: 7,
              autoFill: {
                source: 'accounts',
                accounts: ['75', '751', '752', '754', '755', '758', '781', '791'],
                operation: 'SUM',
                debitCredit: 'CREDIT'
              }
            },
            {
              id: 'total_produits_exploitation',
              name: 'total_produits_exploitation',
              label: 'TOTAL DES PRODUITS D\'EXPLOITATION (B)',
              type: 'currency',
              required: true,
              order: 8,
              calculated: true,
              calculationFormula: '=chiffre_affaires_net+production_stockee+production_immobilisee+subventions_exploitation+autres_produits'
            }
          ]
        },
        {
          id: 'charges_exploitation',
          title: 'CHARGES D\'EXPLOITATION',
          order: 2,
          fields: [
            {
              id: 'achats_marchandises',
              name: 'achats_marchandises',
              label: 'Achats de marchandises',
              type: 'currency',
              description: 'Compte 607',
              required: true,
              order: 1,
              autoFill: {
                source: 'accounts',
                accounts: ['607'],
                operation: 'SUM',
                debitCredit: 'DEBIT'
              }
            },
            {
              id: 'variation_stock_marchandises',
              name: 'variation_stock_marchandises',
              label: 'Variation de stock (marchandises)',
              type: 'currency',
              description: 'Compte 6037',
              required: false,
              order: 2,
              autoFill: {
                source: 'accounts',
                accounts: ['6037'],
                operation: 'SUM',
                debitCredit: 'NET'
              }
            },
            {
              id: 'achats_matieres',
              name: 'achats_matieres',
              label: 'Achats de matières premières et autres approvisionnements',
              type: 'currency',
              description: 'Comptes 601, 602',
              required: true,
              order: 3,
              autoFill: {
                source: 'accounts',
                accounts: ['601', '602', '6031', '6032'],
                operation: 'SUM',
                debitCredit: 'DEBIT'
              }
            },
            {
              id: 'autres_achats_charges_externes',
              name: 'autres_achats_charges_externes',
              label: 'Autres achats et charges externes',
              type: 'currency',
              description: 'Comptes 604, 605, 606, 608, 61, 62',
              required: true,
              order: 4,
              autoFill: {
                source: 'accounts',
                accounts: ['604', '605', '606', '608', '61', '611', '612', '613', '614', '615', '616', '617', '618', '62', '621', '622', '623', '624', '625', '626', '627', '628'],
                operation: 'SUM',
                debitCredit: 'DEBIT'
              }
            },
            {
              id: 'impots_taxes',
              name: 'impots_taxes',
              label: 'Impôts, taxes et versements assimilés',
              type: 'currency',
              description: 'Compte 63',
              required: true,
              order: 5,
              autoFill: {
                source: 'accounts',
                accounts: ['63', '631', '633', '635', '637'],
                operation: 'SUM',
                debitCredit: 'DEBIT'
              }
            },
            {
              id: 'salaires_traitements',
              name: 'salaires_traitements',
              label: 'Salaires et traitements',
              type: 'currency',
              description: 'Compte 641',
              required: true,
              order: 6,
              autoFill: {
                source: 'accounts',
                accounts: ['641'],
                operation: 'SUM',
                debitCredit: 'DEBIT'
              }
            },
            {
              id: 'charges_sociales',
              name: 'charges_sociales',
              label: 'Charges sociales',
              type: 'currency',
              description: 'Compte 645',
              required: true,
              order: 7,
              autoFill: {
                source: 'accounts',
                accounts: ['645'],
                operation: 'SUM',
                debitCredit: 'DEBIT'
              }
            },
            {
              id: 'dotations_amortissements',
              name: 'dotations_amortissements',
              label: 'Dotations aux amortissements',
              type: 'currency',
              description: 'Compte 681',
              required: true,
              order: 8,
              autoFill: {
                source: 'accounts',
                accounts: ['681', '6811', '6812'],
                operation: 'SUM',
                debitCredit: 'DEBIT'
              }
            },
            {
              id: 'dotations_provisions',
              name: 'dotations_provisions',
              label: 'Dotations aux provisions',
              type: 'currency',
              description: 'Comptes 6815, 6816, 6817',
              required: false,
              order: 9,
              autoFill: {
                source: 'accounts',
                accounts: ['6815', '6816', '6817'],
                operation: 'SUM',
                debitCredit: 'DEBIT'
              }
            },
            {
              id: 'autres_charges',
              name: 'autres_charges',
              label: 'Autres charges',
              type: 'currency',
              description: 'Compte 65',
              required: false,
              order: 10,
              autoFill: {
                source: 'accounts',
                accounts: ['65', '651', '654', '655', '658'],
                operation: 'SUM',
                debitCredit: 'DEBIT'
              }
            },
            {
              id: 'total_charges_exploitation',
              name: 'total_charges_exploitation',
              label: 'TOTAL DES CHARGES D\'EXPLOITATION (C)',
              type: 'currency',
              required: true,
              order: 11,
              calculated: true,
              calculationFormula: '=achats_marchandises+variation_stock_marchandises+achats_matieres+autres_achats_charges_externes+impots_taxes+salaires_traitements+charges_sociales+dotations_amortissements+dotations_provisions+autres_charges'
            }
          ]
        },
        {
          id: 'resultat_exploitation',
          title: 'RÉSULTAT D\'EXPLOITATION',
          order: 3,
          fields: [
            {
              id: 'resultat_exploitation',
              name: 'resultat_exploitation',
              label: 'RÉSULTAT D\'EXPLOITATION (D = B - C)',
              type: 'currency',
              required: true,
              order: 1,
              calculated: true,
              calculationFormula: '=total_produits_exploitation-total_charges_exploitation'
            }
          ]
        },
        {
          id: 'resultat_financier',
          title: 'RÉSULTAT FINANCIER',
          order: 4,
          fields: [
            {
              id: 'produits_financiers',
              name: 'produits_financiers',
              label: 'Produits financiers',
              type: 'currency',
              description: 'Comptes 76, 786, 796',
              required: false,
              order: 1,
              autoFill: {
                source: 'accounts',
                accounts: ['76', '761', '762', '763', '764', '765', '766', '767', '768', '786', '796'],
                operation: 'SUM',
                debitCredit: 'CREDIT'
              }
            },
            {
              id: 'charges_financieres',
              name: 'charges_financieres',
              label: 'Charges financières',
              type: 'currency',
              description: 'Comptes 66, 686',
              required: false,
              order: 2,
              autoFill: {
                source: 'accounts',
                accounts: ['66', '661', '664', '665', '666', '667', '668', '686'],
                operation: 'SUM',
                debitCredit: 'DEBIT'
              }
            },
            {
              id: 'resultat_financier',
              name: 'resultat_financier',
              label: 'RÉSULTAT FINANCIER (E)',
              type: 'currency',
              required: true,
              order: 3,
              calculated: true,
              calculationFormula: '=produits_financiers-charges_financieres'
            }
          ]
        },
        {
          id: 'resultat_exceptionnel',
          title: 'RÉSULTAT EXCEPTIONNEL',
          order: 5,
          fields: [
            {
              id: 'produits_exceptionnels',
              name: 'produits_exceptionnels',
              label: 'Produits exceptionnels',
              type: 'currency',
              description: 'Comptes 77, 787, 797',
              required: false,
              order: 1,
              autoFill: {
                source: 'accounts',
                accounts: ['77', '771', '775', '777', '778', '787', '797'],
                operation: 'SUM',
                debitCredit: 'CREDIT'
              }
            },
            {
              id: 'charges_exceptionnelles',
              name: 'charges_exceptionnelles',
              label: 'Charges exceptionnelles',
              type: 'currency',
              description: 'Comptes 67, 687',
              required: false,
              order: 2,
              autoFill: {
                source: 'accounts',
                accounts: ['67', '671', '675', '678', '687'],
                operation: 'SUM',
                debitCredit: 'DEBIT'
              }
            },
            {
              id: 'resultat_exceptionnel',
              name: 'resultat_exceptionnel',
              label: 'RÉSULTAT EXCEPTIONNEL (F)',
              type: 'currency',
              required: true,
              order: 3,
              calculated: true,
              calculationFormula: '=produits_exceptionnels-charges_exceptionnelles'
            }
          ]
        },
        {
          id: 'resultat_net',
          title: 'RÉSULTAT NET',
          order: 6,
          fields: [
            {
              id: 'participation_salaries',
              name: 'participation_salaries',
              label: 'Participation des salariés',
              type: 'currency',
              description: 'Compte 691',
              required: false,
              order: 1,
              autoFill: {
                source: 'accounts',
                accounts: ['691'],
                operation: 'SUM',
                debitCredit: 'DEBIT'
              }
            },
            {
              id: 'impots_benefices',
              name: 'impots_benefices',
              label: 'Impôts sur les bénéfices',
              type: 'currency',
              description: 'Compte 695',
              required: true,
              order: 2,
              autoFill: {
                source: 'accounts',
                accounts: ['695'],
                operation: 'SUM',
                debitCredit: 'DEBIT'
              }
            },
            {
              id: 'resultat_net',
              name: 'resultat_net',
              label: 'RÉSULTAT NET (K = D + E + F - G - H - I - J)',
              type: 'currency',
              required: true,
              order: 3,
              calculated: true,
              calculationFormula: '=resultat_exploitation+resultat_financier+resultat_exceptionnel-participation_salaries-impots_benefices'
            }
          ]
        }
      ]
    },

    validationRules: {
      required: ['chiffre_affaires_net', 'total_produits_exploitation', 'total_charges_exploitation', 'resultat_exploitation', 'resultat_net'],
      numeric: ['ventes_marchandises', 'production_vendue', 'achats_marchandises', 'achats_matieres', 'salaires_traitements']
    },

    accountMappings: {
      ventes_marchandises: {
        accounts: ['707'],
        operation: 'SUM',
        debitCredit: 'CREDIT'
      },
      production_vendue: {
        accounts: ['701', '703', '704', '706', '708'],
        operation: 'SUM',
        debitCredit: 'CREDIT'
      },
      achats_marchandises: {
        accounts: ['607'],
        operation: 'SUM',
        debitCredit: 'DEBIT'
      },
      salaires_traitements: {
        accounts: ['641'],
        operation: 'SUM',
        debitCredit: 'DEBIT'
      },
      charges_sociales: {
        accounts: ['645'],
        operation: 'SUM',
        debitCredit: 'DEBIT'
      }
    }
  };
}

/**
 * 2033-C-SD : Tableau des immobilisations et amortissements
 */
export function createFrance2033C(): Omit<RegulatoryTemplate, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    documentType: 'FR_2033C',
    countryCode: 'FR',
    accountingStandard: 'PCG',
    name: 'Tableau des immobilisations et amortissements (2033-C-SD)',
    description: 'Déclaration 2033-C : Détail des immobilisations, acquisitions, cessions et amortissements',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    version: '1.0',
    isActive: true,

    formSchema: {
      version: '1.0',
      sections: [
        {
          id: 'immobilisations_incorporelles',
          title: 'IMMOBILISATIONS INCORPORELLES',
          order: 1,
          fields: [
            {
              id: 'immo_incorp_debut',
              name: 'immo_incorp_debut',
              label: 'Valeur brute au début de l\'exercice',
              type: 'currency',
              required: true,
              order: 1
            },
            {
              id: 'immo_incorp_acquisitions',
              name: 'immo_incorp_acquisitions',
              label: 'Acquisitions de l\'exercice',
              type: 'currency',
              required: false,
              order: 2
            },
            {
              id: 'immo_incorp_cessions',
              name: 'immo_incorp_cessions',
              label: 'Cessions de l\'exercice',
              type: 'currency',
              required: false,
              order: 3
            },
            {
              id: 'immo_incorp_fin',
              name: 'immo_incorp_fin',
              label: 'Valeur brute à la fin de l\'exercice',
              type: 'currency',
              required: true,
              order: 4,
              calculated: true,
              calculationFormula: '=immo_incorp_debut+immo_incorp_acquisitions-immo_incorp_cessions'
            },
            {
              id: 'amort_incorp_debut',
              name: 'amort_incorp_debut',
              label: 'Amortissements début exercice',
              type: 'currency',
              required: true,
              order: 5
            },
            {
              id: 'amort_incorp_exercice',
              name: 'amort_incorp_exercice',
              label: 'Dotations de l\'exercice',
              type: 'currency',
              required: false,
              order: 6
            },
            {
              id: 'amort_incorp_reprises',
              name: 'amort_incorp_reprises',
              label: 'Amortissements sur cessions',
              type: 'currency',
              required: false,
              order: 7
            },
            {
              id: 'amort_incorp_fin',
              name: 'amort_incorp_fin',
              label: 'Amortissements fin exercice',
              type: 'currency',
              required: true,
              order: 8,
              calculated: true,
              calculationFormula: '=amort_incorp_debut+amort_incorp_exercice-amort_incorp_reprises'
            }
          ]
        },
        {
          id: 'immobilisations_corporelles',
          title: 'IMMOBILISATIONS CORPORELLES',
          order: 2,
          fields: [
            {
              id: 'immo_corp_debut',
              name: 'immo_corp_debut',
              label: 'Valeur brute au début de l\'exercice',
              type: 'currency',
              required: true,
              order: 1
            },
            {
              id: 'immo_corp_acquisitions',
              name: 'immo_corp_acquisitions',
              label: 'Acquisitions de l\'exercice',
              type: 'currency',
              required: false,
              order: 2
            },
            {
              id: 'immo_corp_cessions',
              name: 'immo_corp_cessions',
              label: 'Cessions de l\'exercice',
              type: 'currency',
              required: false,
              order: 3
            },
            {
              id: 'immo_corp_fin',
              name: 'immo_corp_fin',
              label: 'Valeur brute à la fin de l\'exercice',
              type: 'currency',
              required: true,
              order: 4,
              calculated: true,
              calculationFormula: '=immo_corp_debut+immo_corp_acquisitions-immo_corp_cessions'
            },
            {
              id: 'amort_corp_debut',
              name: 'amort_corp_debut',
              label: 'Amortissements début exercice',
              type: 'currency',
              required: true,
              order: 5
            },
            {
              id: 'amort_corp_exercice',
              name: 'amort_corp_exercice',
              label: 'Dotations de l\'exercice',
              type: 'currency',
              required: false,
              order: 6
            },
            {
              id: 'amort_corp_reprises',
              name: 'amort_corp_reprises',
              label: 'Amortissements sur cessions',
              type: 'currency',
              required: false,
              order: 7
            },
            {
              id: 'amort_corp_fin',
              name: 'amort_corp_fin',
              label: 'Amortissements fin exercice',
              type: 'currency',
              required: true,
              order: 8,
              calculated: true,
              calculationFormula: '=amort_corp_debut+amort_corp_exercice-amort_corp_reprises'
            }
          ]
        },
        {
          id: 'plus_values_moins_values',
          title: 'PLUS-VALUES ET MOINS-VALUES',
          order: 3,
          fields: [
            {
              id: 'total_cessions',
              name: 'total_cessions',
              label: 'Prix de cession des éléments d\'actif',
              type: 'currency',
              required: false,
              order: 1
            },
            {
              id: 'valeur_nette_comptable',
              name: 'valeur_nette_comptable',
              label: 'Valeur nette comptable des éléments cédés',
              type: 'currency',
              required: false,
              order: 2
            },
            {
              id: 'plus_values',
              name: 'plus_values',
              label: 'Plus-values de cession',
              type: 'currency',
              required: false,
              order: 3,
              calculated: true,
              calculationFormula: '=total_cessions>valeur_nette_comptable ? total_cessions-valeur_nette_comptable : 0'
            },
            {
              id: 'moins_values',
              name: 'moins_values',
              label: 'Moins-values de cession',
              type: 'currency',
              required: false,
              order: 4,
              calculated: true,
              calculationFormula: '=valeur_nette_comptable>total_cessions ? valeur_nette_comptable-total_cessions : 0'
            }
          ]
        }
      ]
    },

    validationRules: {
      required: ['immo_incorp_fin', 'immo_corp_fin', 'amort_incorp_fin', 'amort_corp_fin']
    }
  };
}

// Export des fonctions de création
export const FRANCE_TEMPLATE_CREATORS = {
  'FR_2033A': createFrance2033A,
  'FR_2033B': createFrance2033B,
  'FR_2033C': createFrance2033C
  // Nous ajouterons les autres templates progressivement
};

/**
 * DEPRECATED: ce fichier est un ancien générateur.
 * Utiliser plutôt `src/constants/templates/allFranceTemplates.ts`.
 */
export function generateAllFranceTemplatesLegacy(): Array<Omit<RegulatoryTemplate, 'id' | 'createdAt' | 'updatedAt'>> {
  return Object.values(FRANCE_TEMPLATE_CREATORS).map(creator => creator());
}

// Export canonique (évite d'avoir 2 implémentations divergentes)
import { generateAllFranceTemplates as generateAllFranceTemplatesCanonical } from './allFranceTemplates';

export const generateAllFranceTemplates = generateAllFranceTemplatesCanonical;
