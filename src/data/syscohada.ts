// src/data/syscohada.ts
import type { AccountPlan } from '../types/accounting';

export const SYSCOHADA_PLAN: AccountPlan = {
  standard: 'SYSCOHADA',
  country: 'OHADA',
  classes: [
    {
      number: '1',
      name: 'COMPTES DE RESSOURCES DURABLES',
      type: 'equity',
      accounts: [
        {
          number: '15',
          name: 'PROVISIONS RÉGLEMENTÉES ET FONDS ASSIMILÉS',
          type: 'capitaux',
          isDebitNormal: false,
          subAccounts: [
            { number: '151', name: 'Amortissements dérogatoires', type: 'capitaux', isDebitNormal: false },
            { number: '152', name: 'Plus-values de cession à réinvestir', type: 'capitaux', isDebitNormal: false },
            { number: '153', name: 'Fonds réglementés', type: 'capitaux', isDebitNormal: false }
          ]
        },
        {
          number: '16',
          name: 'EMPRUNTS ET DETTES ASSIMILÉES',
          type: 'dettes',
          isDebitNormal: false,
          subAccounts: [
            { number: '161', name: 'Emprunts obligataires', type: 'dettes', isDebitNormal: false },
            { number: '162', name: 'Emprunts et dettes auprès des établissements de crédit', type: 'dettes', isDebitNormal: false },
            { number: '163', name: 'Avances reçues de l\'État', type: 'dettes', isDebitNormal: false },
            { number: '164', name: 'Avances reçues et comptes courants bloqués', type: 'dettes', isDebitNormal: false },
            { number: '165', name: 'Dépôts et cautionnements reçus', type: 'dettes', isDebitNormal: false },
            { number: '166', name: 'Intérêts courus', type: 'dettes', isDebitNormal: false },
            { number: '167', name: 'Emprunts et dettes assortis de conditions particulières', type: 'dettes', isDebitNormal: false },
            { number: '168', name: 'Autres emprunts et dettes assimilées', type: 'dettes', isDebitNormal: false }
          ]
        },
        {
          number: '17',
          name: 'DETTES DE FINANCEMENT DIVERSIFIÉES',
          type: 'dettes',
          isDebitNormal: false,
          subAccounts: [
            { number: '171', name: 'Dettes rattachées à des participations', type: 'dettes', isDebitNormal: false },
            { number: '172', name: 'Emprunts et dettes auprès des établissements de crédit-groupe', type: 'dettes', isDebitNormal: false },
            { number: '173', name: 'Emprunts et dettes financières diverses', type: 'dettes', isDebitNormal: false }
          ]
        },
        {
          number: '18',
          name: 'DETTES LIÉES À DES PARTICIPATIONS ET COMPTES DE LIAISON DES ÉTABLISSEMENTS',
          type: 'dettes',
          isDebitNormal: false,
          subAccounts: [
            { number: '181', name: 'Dettes liées à des participations', type: 'dettes', isDebitNormal: false },
            { number: '188', name: 'Comptes de liaison des établissements et succursales', type: 'dettes', isDebitNormal: false }
          ]
        }
      ]
    },
    {
      number: '2',
      name: 'COMPTES D\'ACTIF IMMOBILISÉ',
      type: 'asset',
      accounts: [
        {
          number: '20',
          name: 'CHARGES IMMOBILISÉES',
          type: 'immobilisations',
          isDebitNormal: true,
          subAccounts: [
            { number: '201', name: 'Frais de développement', type: 'immobilisations', isDebitNormal: true },
            { number: '202', name: 'Brevets, licences, logiciels', type: 'immobilisations', isDebitNormal: true },
            { number: '203', name: 'Fonds commercial', type: 'immobilisations', isDebitNormal: true },
            { number: '204', name: 'Droit au bail', type: 'immobilisations', isDebitNormal: true },
            { number: '205', name: 'Frais de recherche et de développement', type: 'immobilisations', isDebitNormal: true },
            { number: '208', name: 'Autres immobilisations incorporelles', type: 'immobilisations', isDebitNormal: true }
          ]
        },
        {
          number: '21',
          name: 'IMMOBILISATIONS INCORPORELLES',
          type: 'immobilisations',
          isDebitNormal: true,
          subAccounts: [
            { number: '211', name: 'Terrains', type: 'immobilisations', isDebitNormal: true },
            { number: '212', name: 'Agencements et aménagements de terrains', type: 'immobilisations', isDebitNormal: true },
            { number: '213', name: 'Constructions', type: 'immobilisations', isDebitNormal: true },
            { number: '214', name: 'Constructions sur sol d\'autrui', type: 'immobilisations', isDebitNormal: true },
            { number: '215', name: 'Installations techniques, matériel et outillage industriels', type: 'immobilisations', isDebitNormal: true },
            { number: '218', name: 'Autres immobilisations corporelles', type: 'immobilisations', isDebitNormal: true }
          ]
        },
        {
          number: '22',
          name: 'TERRAINS',
          type: 'immobilisations',
          isDebitNormal: true,
          subAccounts: [
            { number: '221', name: 'Terrains agricoles et forestiers', type: 'immobilisations', isDebitNormal: true },
            { number: '222', name: 'Terrains nus', type: 'immobilisations', isDebitNormal: true },
            { number: '223', name: 'Terrains bâtis', type: 'immobilisations', isDebitNormal: true },
            { number: '224', name: 'Travaux de mise en valeur des terrains', type: 'immobilisations', isDebitNormal: true },
            { number: '228', name: 'Autres terrains', type: 'immobilisations', isDebitNormal: true }
          ]
        },
        {
          number: '23',
          name: 'BÂTIMENTS, INSTALLATIONS TECHNIQUES ET AGENCEMENTS',
          type: 'immobilisations',
          isDebitNormal: true,
          subAccounts: [
            { number: '231', name: 'Bâtiments industriels, agricoles et commerciaux', type: 'immobilisations', isDebitNormal: true },
            { number: '232', name: 'Bâtiments administratifs et sociaux', type: 'immobilisations', isDebitNormal: true },
            { number: '233', name: 'Ouvrages d\'infrastructure', type: 'immobilisations', isDebitNormal: true },
            { number: '234', name: 'Installations techniques', type: 'immobilisations', isDebitNormal: true },
            { number: '235', name: 'Aménagements de bureaux', type: 'immobilisations', isDebitNormal: true },
            { number: '238', name: 'Autres bâtiments, installations techniques et agencements', type: 'immobilisations', isDebitNormal: true }
          ]
        },
        {
          number: '24',
          name: 'MATÉRIEL',
          type: 'immobilisations',
          isDebitNormal: true,
          subAccounts: [
            { number: '241', name: 'Matériel et outillage industriel et commercial', type: 'immobilisations', isDebitNormal: true },
            { number: '242', name: 'Matériel et outillage agricole', type: 'immobilisations', isDebitNormal: true },
            { number: '243', name: 'Matériel d\'emballage récupérable', type: 'immobilisations', isDebitNormal: true },
            { number: '244', name: 'Matériel et mobilier', type: 'immobilisations', isDebitNormal: true },
            { number: '245', name: 'Matériel de transport', type: 'immobilisations', isDebitNormal: true },
            { number: '246', name: 'Matériel et outillage de bureau', type: 'immobilisations', isDebitNormal: true },
            { number: '247', name: 'Agencements, installations et aménagements divers', type: 'immobilisations', isDebitNormal: true },
            { number: '248', name: 'Autres matériels', type: 'immobilisations', isDebitNormal: true }
          ]
        }
      ]
    },
    {
      number: '3',
      name: 'COMPTES DE STOCKS',
      type: 'asset',
      accounts: [
        {
          number: '31',
          name: 'MATIÈRES PREMIÈRES ET FOURNITURES',
          type: 'stocks',
          isDebitNormal: true,
          subAccounts: [
            { number: '311', name: 'Matières premières', type: 'stocks', isDebitNormal: true },
            { number: '312', name: 'Matières et fournitures consommables', type: 'stocks', isDebitNormal: true },
            { number: '313', name: 'Emballages', type: 'stocks', isDebitNormal: true },
            { number: '318', name: 'Autres matières premières et fournitures', type: 'stocks', isDebitNormal: true }
          ]
        },
        {
          number: '32',
          name: 'AUTRES APPROVISIONNEMENTS',
          type: 'stocks',
          isDebitNormal: true,
          subAccounts: [
            { number: '321', name: 'Matières consommables', type: 'stocks', isDebitNormal: true },
            { number: '322', name: 'Fournitures consommables', type: 'stocks', isDebitNormal: true },
            { number: '323', name: 'Emballages', type: 'stocks', isDebitNormal: true },
            { number: '328', name: 'Autres matières et fournitures', type: 'stocks', isDebitNormal: true }
          ]
        },
        {
          number: '33',
          name: 'EN-COURS DE PRODUCTION',
          type: 'stocks',
          isDebitNormal: true,
          subAccounts: [
            { number: '331', name: 'Produits en cours', type: 'stocks', isDebitNormal: true },
            { number: '332', name: 'Travaux en cours', type: 'stocks', isDebitNormal: true },
            { number: '333', name: 'Produits intermédiaires', type: 'stocks', isDebitNormal: true },
            { number: '334', name: 'Produits résiduels', type: 'stocks', isDebitNormal: true }
          ]
        },
        {
          number: '34',
          name: 'PRODUITS FABRIQUÉS',
          type: 'stocks',
          isDebitNormal: true,
          subAccounts: [
            { number: '341', name: 'Produits intermédiaires', type: 'stocks', isDebitNormal: true },
            { number: '342', name: 'Produits finis', type: 'stocks', isDebitNormal: true },
            { number: '343', name: 'Produits résiduels', type: 'stocks', isDebitNormal: true },
            { number: '344', name: 'Produits en cours de route, en consignation ou en dépôt', type: 'stocks', isDebitNormal: true },
            { number: '348', name: 'Autres produits fabriqués', type: 'stocks', isDebitNormal: true }
          ]
        },
        {
          number: '35',
          name: 'STOCKS DE MARCHANDISES',
          type: 'stocks',
          isDebitNormal: true,
          subAccounts: [
            { number: '351', name: 'Marchandises de catégorie A', type: 'stocks', isDebitNormal: true },
            { number: '352', name: 'Marchandises de catégorie B', type: 'stocks', isDebitNormal: true },
            { number: '358', name: 'Autres marchandises', type: 'stocks', isDebitNormal: true }
          ]
        }
      ]
    },
    {
      number: '4',
      name: 'COMPTES DE TIERS',
      type: 'asset',
      accounts: [
        {
          number: '40',
          name: 'FOURNISSEURS ET COMPTES RATTACHÉS',
          type: 'dettes',
          isDebitNormal: false,
          subAccounts: [
            { number: '401', name: 'Fournisseurs', type: 'dettes', isDebitNormal: false },
            { number: '402', name: 'Fournisseurs, effets à payer', type: 'dettes', isDebitNormal: false },
            { number: '403', name: 'Fournisseurs, retenues de garantie', type: 'dettes', isDebitNormal: false },
            { number: '408', name: 'Fournisseurs, factures non parvenues', type: 'dettes', isDebitNormal: false },
            { number: '409', name: 'Fournisseurs débiteurs', type: 'creances', isDebitNormal: true }
          ]
        },
        {
          number: '41',
          name: 'CLIENTS ET COMPTES RATTACHÉS',
          type: 'creances',
          isDebitNormal: true,
          subAccounts: [
            { number: '411', name: 'Clients', type: 'creances', isDebitNormal: true },
            { number: '412', name: 'Clients, effets à recevoir', type: 'creances', isDebitNormal: true },
            { number: '413', name: 'Clients douteux', type: 'creances', isDebitNormal: true },
            { number: '414', name: 'Clients, retenues de garantie', type: 'creances', isDebitNormal: true },
            { number: '418', name: 'Clients, factures à établir', type: 'creances', isDebitNormal: true },
            { number: '419', name: 'Clients créditeurs', type: 'dettes', isDebitNormal: false }
          ]
        },
        {
          number: '42',
          name: 'PERSONNEL',
          type: 'dettes',
          isDebitNormal: false,
          subAccounts: [
            { number: '421', name: 'Personnel, avances et acomptes', type: 'creances', isDebitNormal: true },
            { number: '422', name: 'Personnel, rémunérations dues', type: 'dettes', isDebitNormal: false },
            { number: '423', name: 'Personnel, oppositions', type: 'dettes', isDebitNormal: false },
            { number: '424', name: 'Personnel, œuvres sociales', type: 'dettes', isDebitNormal: false },
            { number: '428', name: 'Personnel, charges à payer et produits à recevoir', type: 'dettes', isDebitNormal: false }
          ]
        },
        {
          number: '43',
          name: 'ORGANISMES SOCIAUX',
          type: 'dettes',
          isDebitNormal: false,
          subAccounts: [
            { number: '431', name: 'Sécurité sociale', type: 'dettes', isDebitNormal: false },
            { number: '432', name: 'Caisses de retraite', type: 'dettes', isDebitNormal: false },
            { number: '433', name: 'Autres organismes sociaux', type: 'dettes', isDebitNormal: false },
            { number: '438', name: 'Organismes sociaux, charges à payer et produits à recevoir', type: 'dettes', isDebitNormal: false }
          ]
        },
        {
          number: '44',
          name: 'ÉTAT ET COLLECTIVITÉS PUBLIQUES',
          type: 'dettes',
          isDebitNormal: false,
          subAccounts: [
            { number: '441', name: 'État, subventions à recevoir', type: 'creances', isDebitNormal: true },
            { number: '442', name: 'État, impôts et taxes recouvrables sur des tiers', type: 'creances', isDebitNormal: true },
            { number: '443', name: 'État, TVA facturée', type: 'dettes', isDebitNormal: false },
            { number: '444', name: 'État, TVA due ou crédit de TVA', type: 'dettes', isDebitNormal: false },
            { number: '445', name: 'État, TVA récupérable', type: 'creances', isDebitNormal: true },
            { number: '446', name: 'État, autres impôts et taxes', type: 'dettes', isDebitNormal: false },
            { number: '447', name: 'État, impôts retenus à la source', type: 'dettes', isDebitNormal: false },
            { number: '448', name: 'État, charges à payer et produits à recevoir', type: 'dettes', isDebitNormal: false }
          ]
        }
      ]
    },
    {
      number: '5',
      name: 'COMPTES DE TRÉSORERIE',
      type: 'asset',
      accounts: [
        {
          number: '50',
          name: 'VALEURS MOBILIÈRES DE PLACEMENT',
          type: 'tresorerie',
          isDebitNormal: true,
          subAccounts: [
            { number: '501', name: 'Parts dans des entreprises liées', type: 'tresorerie', isDebitNormal: true },
            { number: '502', name: 'Actions', type: 'tresorerie', isDebitNormal: true },
            { number: '503', name: 'Obligations', type: 'tresorerie', isDebitNormal: true },
            { number: '504', name: 'Bons du Trésor et bons de caisse à court terme', type: 'tresorerie', isDebitNormal: true },
            { number: '505', name: 'Titres négociables hors région', type: 'tresorerie', isDebitNormal: true },
            { number: '506', name: 'Obligations cautionnées', type: 'tresorerie', isDebitNormal: true },
            { number: '507', name: 'Bons de souscription d\'actions', type: 'tresorerie', isDebitNormal: true },
            { number: '508', name: 'Autres valeurs mobilières de placement', type: 'tresorerie', isDebitNormal: true }
          ]
        },
        {
          number: '52',
          name: 'BANQUES',
          type: 'tresorerie',
          isDebitNormal: true,
          subAccounts: [
            { number: '521', name: 'Banques locales', type: 'tresorerie', isDebitNormal: true },
            { number: '522', name: 'Banques autres États de l\'UEMOA', type: 'tresorerie', isDebitNormal: true },
            { number: '523', name: 'Banques autres États de la CEMAC', type: 'tresorerie', isDebitNormal: true },
            { number: '524', name: 'Banques hors Afrique', type: 'tresorerie', isDebitNormal: true },
            { number: '526', name: 'Banques, intérêts courus', type: 'tresorerie', isDebitNormal: true },
            { number: '527', name: 'Banques, effets à l\'encaissement', type: 'tresorerie', isDebitNormal: true }
          ]
        },
        {
          number: '53',
          name: 'ÉTABLISSEMENTS FINANCIERS ET ASSIMILÉS',
          type: 'tresorerie',
          isDebitNormal: true,
          subAccounts: [
            { number: '531', name: 'Trésor', type: 'tresorerie', isDebitNormal: true },
            { number: '532', name: 'Chèques postaux', type: 'tresorerie', isDebitNormal: true },
            { number: '533', name: 'Établissements financiers', type: 'tresorerie', isDebitNormal: true }
          ]
        },
        {
          number: '54',
          name: 'INSTRUMENTS DE TRÉSORERIE',
          type: 'tresorerie',
          isDebitNormal: true,
          subAccounts: [
            { number: '541', name: 'Chèques à encaisser', type: 'tresorerie', isDebitNormal: true },
            { number: '542', name: 'Effets à encaisser', type: 'tresorerie', isDebitNormal: true },
            { number: '543', name: 'Effets à l\'escompte', type: 'tresorerie', isDebitNormal: true }
          ]
        },
        {
          number: '57',
          name: 'CAISSE',
          type: 'tresorerie',
          isDebitNormal: true,
          subAccounts: [
            { number: '571', name: 'Caisse siège social', type: 'tresorerie', isDebitNormal: true },
            { number: '572', name: 'Caisse succursale A', type: 'tresorerie', isDebitNormal: true },
            { number: '573', name: 'Caisse succursale B', type: 'tresorerie', isDebitNormal: true },
            { number: '574', name: 'Caisses indépendantes', type: 'tresorerie', isDebitNormal: true },
            { number: '578', name: 'Autres caisses', type: 'tresorerie', isDebitNormal: true }
          ]
        },
        {
          number: '58',
          name: 'VIREMENTS INTERNES',
          type: 'tresorerie',
          isDebitNormal: true,
          subAccounts: [
            { number: '581', name: 'Virements de fonds', type: 'tresorerie', isDebitNormal: true },
            { number: '588', name: 'Autres virements internes', type: 'tresorerie', isDebitNormal: true }
          ]
        }
      ]
    },
    {
      number: '6',
      name: 'COMPTES DE CHARGES',
      type: 'expense',
      accounts: [
        {
          number: '60',
          name: 'ACHATS ET VARIATIONS DE STOCKS',
          type: 'charges',
          isDebitNormal: true,
          subAccounts: [
            { number: '601', name: 'Achats de marchandises', type: 'charges', isDebitNormal: true },
            { number: '602', name: 'Achats de matières premières et fournitures liées', type: 'charges', isDebitNormal: true },
            { number: '603', name: 'Variations des stocks de biens achetés', type: 'charges', isDebitNormal: true },
            { number: '604', name: 'Achats stockés de matières et fournitures', type: 'charges', isDebitNormal: true },
            { number: '605', name: 'Autres achats', type: 'charges', isDebitNormal: true },
            { number: '608', name: 'Achats d\'emballages', type: 'charges', isDebitNormal: true }
          ]
        },
        {
          number: '61',
          name: 'TRANSPORTS',
          type: 'charges',
          isDebitNormal: true,
          subAccounts: [
            { number: '611', name: 'Transports sur achats', type: 'charges', isDebitNormal: true },
            { number: '612', name: 'Transports sur ventes', type: 'charges', isDebitNormal: true },
            { number: '613', name: 'Transports pour le compte de tiers', type: 'charges', isDebitNormal: true },
            { number: '614', name: 'Transports du personnel', type: 'charges', isDebitNormal: true },
            { number: '618', name: 'Autres transports', type: 'charges', isDebitNormal: true }
          ]
        },
        {
          number: '62',
          name: 'SERVICES EXTÉRIEURS A',
          type: 'charges',
          isDebitNormal: true,
          subAccounts: [
            { number: '621', name: 'Sous-traitance générale', type: 'charges', isDebitNormal: true },
            { number: '622', name: 'Locations et charges locatives', type: 'charges', isDebitNormal: true },
            { number: '623', name: 'Redevances de crédit-bail', type: 'charges', isDebitNormal: true },
            { number: '624', name: 'Entretien, réparations et maintenance', type: 'charges', isDebitNormal: true },
            { number: '625', name: 'Primes d\'assurances', type: 'charges', isDebitNormal: true },
            { number: '626', name: 'Études, recherches et documentation', type: 'charges', isDebitNormal: true },
            { number: '627', name: 'Publicité, publications et relations publiques', type: 'charges', isDebitNormal: true },
            { number: '628', name: 'Frais de télécommunications', type: 'charges', isDebitNormal: true }
          ]
        },
        {
          number: '63',
          name: 'SERVICES EXTÉRIEURS B',
          type: 'charges',
          isDebitNormal: true,
          subAccounts: [
            { number: '631', name: 'Frais bancaires', type: 'charges', isDebitNormal: true },
            { number: '632', name: 'Rémunérations d\'intermédiaires et de conseils', type: 'charges', isDebitNormal: true },
            { number: '633', name: 'Frais de formation du personnel', type: 'charges', isDebitNormal: true },
            { number: '634', name: 'Redevances pour brevets, licences, logiciels', type: 'charges', isDebitNormal: true },
            { number: '635', name: 'Cotisations', type: 'charges', isDebitNormal: true },
            { number: '637', name: 'Redevances de concessions, brevets, licences', type: 'charges', isDebitNormal: true },
            { number: '638', name: 'Autres services extérieurs', type: 'charges', isDebitNormal: true }
          ]
        },
        {
          number: '64',
          name: 'IMPÔTS ET TAXES',
          type: 'charges',
          isDebitNormal: true,
          subAccounts: [
            { number: '641', name: 'Impôts et taxes directs', type: 'charges', isDebitNormal: true },
            { number: '642', name: 'Impôts et taxes indirects', type: 'charges', isDebitNormal: true },
            { number: '645', name: 'Droits d\'enregistrement', type: 'charges', isDebitNormal: true },
            { number: '646', name: 'Droits de douane', type: 'charges', isDebitNormal: true },
            { number: '647', name: 'Pénalités et amendes fiscales', type: 'charges', isDebitNormal: true },
            { number: '648', name: 'Autres impôts et taxes', type: 'charges', isDebitNormal: true }
          ]
        },
        {
          number: '66',
          name: 'CHARGES DE PERSONNEL',
          type: 'charges',
          isDebitNormal: true,
          subAccounts: [
            { number: '661', name: 'Rémunérations directes versées au personnel national', type: 'charges', isDebitNormal: true },
            { number: '662', name: 'Rémunérations directes versées au personnel non national', type: 'charges', isDebitNormal: true },
            { number: '663', name: 'Indemnités et avantages divers', type: 'charges', isDebitNormal: true },
            { number: '664', name: 'Charges sociales sur rémunérations', type: 'charges', isDebitNormal: true },
            { number: '665', name: 'Charges sociales diverses', type: 'charges', isDebitNormal: true },
            { number: '666', name: 'Rémunérations de l\'exploitant individuel', type: 'charges', isDebitNormal: true },
            { number: '667', name: 'Rémunérations de travaux faits par l\'entreprise pour elle-même', type: 'charges', isDebitNormal: true }
          ]
        },
        {
          number: '67',
          name: 'FRAIS FINANCIERS ET CHARGES ASSIMILÉES',
          type: 'charges',
          isDebitNormal: true,
          subAccounts: [
            { number: '671', name: 'Intérêts des emprunts', type: 'charges', isDebitNormal: true },
            { number: '672', name: 'Intérêts dans loyers de crédit-bail', type: 'charges', isDebitNormal: true },
            { number: '673', name: 'Escomptes accordés', type: 'charges', isDebitNormal: true },
            { number: '674', name: 'Autres frais financiers', type: 'charges', isDebitNormal: true },
            { number: '675', name: 'Escomptes de règlement accordés', type: 'charges', isDebitNormal: true },
            { number: '676', name: 'Différences de change', type: 'charges', isDebitNormal: true },
            { number: '677', name: 'Pertes de change', type: 'charges', isDebitNormal: true },
            { number: '678', name: 'Autres charges financières', type: 'charges', isDebitNormal: true }
          ]
        },
        {
          number: '68',
          name: 'DOTATIONS AUX AMORTISSEMENTS',
          type: 'charges',
          isDebitNormal: true,
          subAccounts: [
            { number: '681', name: 'Dotations aux amortissements d\'exploitation', type: 'charges', isDebitNormal: true },
            { number: '687', name: 'Dotations aux amortissements financiers', type: 'charges', isDebitNormal: true },
            { number: '691', name: 'Dotations aux provisions d\'exploitation', type: 'charges', isDebitNormal: true },
            { number: '697', name: 'Dotations aux provisions financières', type: 'charges', isDebitNormal: true }
          ]
        }
      ]
    },
    {
      number: '7',
      name: 'COMPTES DE PRODUITS',
      type: 'revenue',
      accounts: [
        {
          number: '70',
          name: 'VENTES',
          type: 'produits',
          isDebitNormal: false,
          subAccounts: [
            { number: '701', name: 'Ventes de marchandises', type: 'produits', isDebitNormal: false },
            { number: '702', name: 'Ventes de produits finis', type: 'produits', isDebitNormal: false },
            { number: '703', name: 'Ventes de produits intermédiaires', type: 'produits', isDebitNormal: false },
            { number: '704', name: 'Ventes de produits résiduels', type: 'produits', isDebitNormal: false },
            { number: '705', name: 'Travaux facturés', type: 'produits', isDebitNormal: false },
            { number: '706', name: 'Services vendus', type: 'produits', isDebitNormal: false },
            { number: '707', name: 'Produits accessoires', type: 'produits', isDebitNormal: false },
            { number: '708', name: 'Produits des activités annexes', type: 'produits', isDebitNormal: false }
          ]
        },
        {
          number: '71',
          name: 'SUBVENTIONS D\'EXPLOITATION',
          type: 'produits',
          isDebitNormal: false,
          subAccounts: [
            { number: '711', name: 'Subventions d\'exploitation reçues de l\'État béninois', type: 'produits', isDebitNormal: false },
            { number: '712', name: 'Subventions d\'exploitation reçues des collectivités publiques', type: 'produits', isDebitNormal: false },
            { number: '713', name: 'Subventions d\'exploitation reçues des entreprises publiques', type: 'produits', isDebitNormal: false },
            { number: '714', name: 'Subventions d\'exploitation reçues des entreprises et organismes privés', type: 'produits', isDebitNormal: false },
            { number: '718', name: 'Autres subventions d\'exploitation', type: 'produits', isDebitNormal: false }
          ]
        },
        {
          number: '72',
          name: 'PRODUCTION IMMOBILISÉE',
          type: 'produits',
          isDebitNormal: false,
          subAccounts: [
            { number: '721', name: 'Immobilisations incorporelles', type: 'produits', isDebitNormal: false },
            { number: '722', name: 'Immobilisations corporelles', type: 'produits', isDebitNormal: false },
            { number: '726', name: 'Immobilisations financières', type: 'produits', isDebitNormal: false }
          ]
        },
        {
          number: '73',
          name: 'VARIATIONS DES STOCKS DE BIENS ET DE SERVICES PRODUITS',
          type: 'produits',
          isDebitNormal: false,
          subAccounts: [
            { number: '731', name: 'Variation des stocks de produits en cours', type: 'produits', isDebitNormal: false },
            { number: '732', name: 'Variation des stocks de biens produits', type: 'produits', isDebitNormal: false },
            { number: '733', name: 'Variation des stocks de services en cours', type: 'produits', isDebitNormal: false }
          ]
        },
        {
          number: '75',
          name: 'AUTRES PRODUITS',
          type: 'produits',
          isDebitNormal: false,
          subAccounts: [
            { number: '751', name: 'Redevances pour brevets, licences, marques', type: 'produits', isDebitNormal: false },
            { number: '752', name: 'Revenus des immeubles non affectés aux activités professionnelles', type: 'produits', isDebitNormal: false },
            { number: '753', name: 'Jetons de présence et rémunérations d\'administrateurs', type: 'produits', isDebitNormal: false },
            { number: '754', name: 'Ristournes perçues des coopératives', type: 'produits', isDebitNormal: false },
            { number: '758', name: 'Produits divers', type: 'produits', isDebitNormal: false }
          ]
        },
        {
          number: '77',
          name: 'REVENUS FINANCIERS ET PRODUITS ASSIMILÉS',
          type: 'produits',
          isDebitNormal: false,
          subAccounts: [
            { number: '771', name: 'Intérêts de prêts', type: 'produits', isDebitNormal: false },
            { number: '772', name: 'Revenus de participations', type: 'produits', isDebitNormal: false },
            { number: '773', name: 'Escomptes obtenus', type: 'produits', isDebitNormal: false },
            { number: '774', name: 'Revenus de valeurs mobilières de placement', type: 'produits', isDebitNormal: false },
            { number: '776', name: 'Gains de change', type: 'produits', isDebitNormal: false },
            { number: '777', name: 'Gains de change réalisés', type: 'produits', isDebitNormal: false },
            { number: '778', name: 'Autres revenus financiers', type: 'produits', isDebitNormal: false }
          ]
        },
        {
          number: '78',
          name: 'TRANSFERTS DE CHARGES',
          type: 'produits',
          isDebitNormal: false,
          subAccounts: [
            { number: '781', name: 'Transferts de charges d\'exploitation', type: 'produits', isDebitNormal: false },
            { number: '787', name: 'Transferts de charges financières', type: 'produits', isDebitNormal: false }
          ]
        },
        {
          number: '79',
          name: 'REPRISES DE PROVISIONS',
          type: 'produits',
          isDebitNormal: false,
          subAccounts: [
            { number: '791', name: 'Reprises de provisions d\'exploitation', type: 'produits', isDebitNormal: false },
            { number: '797', name: 'Reprises de provisions financières', type: 'produits', isDebitNormal: false }
          ]
        }
      ]
    }
  ]

};

// Exporte les classes principales SYSCOHADA (numéro et nom)
export const SYSCOHADA_CLASSES = SYSCOHADA_PLAN.classes.map(cls => ({
  number: cls.number,
  name: cls.name
}));

// Exporte tous les comptes et sous-comptes SYSCOHADA à plat
export const SYSCOHADA_ACCOUNTS = SYSCOHADA_PLAN.classes.flatMap(cls =>
  cls.accounts.flatMap(acc => [
    {
      number: acc.number,
      name: acc.name,
      type: acc.type,
      isDebitNormal: acc.isDebitNormal,
      classNumber: cls.number
    },
    ...(acc.subAccounts?.map(sub => ({
      number: sub.number,
      name: sub.name,
      type: sub.type,
      isDebitNormal: sub.isDebitNormal,
      classNumber: cls.number
    })) || [])
  ])
);

// Utilitaire pour filtrer les comptes d'une classe donnée
export function getSyscohadaAccountsByClass(classNumber: string) {
  return SYSCOHADA_ACCOUNTS.filter(acc => acc.classNumber === classNumber);
}
