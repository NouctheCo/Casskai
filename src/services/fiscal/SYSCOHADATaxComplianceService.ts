/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 *
 * Service de conformité fiscale SYSCOHADA
 * Couvre 17 pays de la zone OHADA
 */

import { BaseFiscalService } from './BaseFiscalService';
import type {
  FiscalDeclaration,
  CountryConfig,
  ValidationResult
} from '../../types/fiscal.types';

/**
 * Configuration des 17 pays OHADA
 */
const OHADA_COUNTRIES: Record<string, CountryConfig> = {
  BJ: {
    name: 'Bénin',
    currency: 'XOF',
    vatRate: 18,
    vatReducedRates: [],
    corporateTaxRate: 30,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '04-30',
    taxAuthority: 'Direction Générale des Impôts (DGI)',
    onlinePortal: 'https://impots.finances.bj'
  },
  BF: {
    name: 'Burkina Faso',
    currency: 'XOF',
    vatRate: 18,
    vatReducedRates: [],
    corporateTaxRate: 27.5,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '04-30',
    taxAuthority: 'Direction Générale des Impôts (DGI)',
    onlinePortal: 'https://www.impots.gov.bf'
  },
  CM: {
    name: 'Cameroun',
    currency: 'XAF',
    vatRate: 19.25,
    vatReducedRates: [],
    corporateTaxRate: 33,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '03-15',
    taxAuthority: 'Direction Générale des Impôts (DGI)',
    onlinePortal: 'https://www.impots.cm'
  },
  CF: {
    name: 'République Centrafricaine',
    currency: 'XAF',
    vatRate: 19,
    vatReducedRates: [],
    corporateTaxRate: 30,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '04-30',
    taxAuthority: 'Direction Générale des Impôts (DGI)'
  },
  KM: {
    name: 'Comores',
    currency: 'KMF',
    vatRate: 10,
    vatReducedRates: [],
    corporateTaxRate: 35,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '04-30',
    taxAuthority: 'Direction Générale des Impôts (DGI)'
  },
  CG: {
    name: 'Congo-Brazzaville',
    currency: 'XAF',
    vatRate: 18.9,
    vatReducedRates: [],
    corporateTaxRate: 30,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '04-30',
    taxAuthority: 'Direction Générale des Impôts (DGI)'
  },
  CI: {
    name: 'Côte d\'Ivoire',
    currency: 'XOF',
    vatRate: 18,
    vatReducedRates: [],
    corporateTaxRate: 25,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '04-30',
    taxAuthority: 'Direction Générale des Impôts (DGI)',
    onlinePortal: 'https://www.dgi.gouv.ci'
  },
  GA: {
    name: 'Gabon',
    currency: 'XAF',
    vatRate: 18,
    vatReducedRates: [],
    corporateTaxRate: 30,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '04-30',
    taxAuthority: 'Direction Générale des Impôts (DGI)',
    onlinePortal: 'https://www.impots.ga'
  },
  GW: {
    name: 'Guinée-Bissau',
    currency: 'XOF',
    vatRate: 15,
    vatReducedRates: [],
    corporateTaxRate: 25,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '04-30',
    taxAuthority: 'Direction Générale des Impôts (DGI)'
  },
  GQ: {
    name: 'Guinée Équatoriale',
    currency: 'XAF',
    vatRate: 15,
    vatReducedRates: [],
    corporateTaxRate: 35,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '04-30',
    taxAuthority: 'Ministerio de Hacienda'
  },
  GN: {
    name: 'Guinée',
    currency: 'GNF',
    vatRate: 18,
    vatReducedRates: [],
    corporateTaxRate: 35,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '04-30',
    taxAuthority: 'Direction Nationale des Impôts (DNI)'
  },
  ML: {
    name: 'Mali',
    currency: 'XOF',
    vatRate: 18,
    vatReducedRates: [],
    corporateTaxRate: 30,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '04-30',
    taxAuthority: 'Direction Générale des Impôts (DGI)',
    onlinePortal: 'https://www.impots.gouv.ml'
  },
  NE: {
    name: 'Niger',
    currency: 'XOF',
    vatRate: 19,
    vatReducedRates: [],
    corporateTaxRate: 30,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '04-30',
    taxAuthority: 'Direction Générale des Impôts (DGI)'
  },
  CD: {
    name: 'RD Congo',
    currency: 'CDF',
    vatRate: 16,
    vatReducedRates: [],
    corporateTaxRate: 30,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '04-30',
    taxAuthority: 'Direction Générale des Impôts (DGI)',
    onlinePortal: 'https://www.dgi.gouv.cd'
  },
  SN: {
    name: 'Sénégal',
    currency: 'XOF',
    vatRate: 18,
    vatReducedRates: [],
    corporateTaxRate: 30,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '04-30',
    taxAuthority: 'Direction Générale des Impôts et des Domaines (DGID)',
    onlinePortal: 'https://www.impotsetdomaines.gouv.sn'
  },
  TD: {
    name: 'Tchad',
    currency: 'XAF',
    vatRate: 18,
    vatReducedRates: [],
    corporateTaxRate: 35,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '04-30',
    taxAuthority: 'Direction Générale des Impôts (DGI)'
  },
  TG: {
    name: 'Togo',
    currency: 'XOF',
    vatRate: 18,
    vatReducedRates: [],
    corporateTaxRate: 27,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '04-30',
    taxAuthority: 'Office Togolais des Recettes (OTR)',
    onlinePortal: 'https://www.otr.tg'
  }
};

export class SYSCOHADATaxComplianceService extends BaseFiscalService {
  constructor() {
    super('SYSCOHADA');

    // Charger les configurations pays
    for (const [code, config] of Object.entries(OHADA_COUNTRIES)) {
      this.countryConfigs.set(code, config);
    }
  }

  /**
   * Génère le Bilan SYSCOHADA (Système Normal)
   */
  async generateBalanceSheet(
    companyId: string,
    period: string,
    country: string
  ): Promise<FiscalDeclaration> {
    const [year] = period.split('-');
    const endDate = new Date(`${year}-12-31`);
    const startDate = new Date(`${year}-01-01`);

    // Récupérer tous les comptes nécessaires
    const allAccounts: string[] = [];
    for (let i = 1; i <= 5; i++) {
      for (let j = 0; j <= 9; j++) {
        for (let k = 0; k <= 9; k++) {
          allAccounts.push(`${i}${j}${k}`);
        }
      }
    }

    const balances = await this.getAccountBalances(
      companyId,
      allAccounts,
      startDate,
      endDate
    );

    // ACTIF - Structure SYSCOHADA

    // Classe 2: ACTIF IMMOBILISÉ
    const chargesImmobilisees = this.getClassBalance('20', balances); // 20x
    const immobilisationsIncorporelles = this.getClassBalance('21', balances); // 21x
    const terrains = this.getClassBalance('22', balances); // 22x
    const batiments = this.getClassBalance('23', balances); // 23x
    const materielOutillage = this.getClassBalance('24', balances); // 24x
    const materielTransport = this.getClassBalance('245', balances); // 245
    const immobilisationsFinancieres = this.getClassBalance('26', balances) + this.getClassBalance('27', balances); // 26x + 27x

    const totalActifImmobilise =
      chargesImmobilisees +
      immobilisationsIncorporelles +
      terrains +
      batiments +
      materielOutillage +
      materielTransport +
      immobilisationsFinancieres;

    // Classe 3: ACTIF CIRCULANT HAO (Hors Activités Ordinaires)
    const actifCirculantHAO = this.getClassBalance('3', balances);

    // Classe 4: STOCKS
    const marchandises = this.getClassBalance('31', balances); // 31x
    const matieresPremieresEtFournitures = this.getClassBalance('32', balances); // 32x
    const autresApprovisionnements = this.getClassBalance('33', balances); // 33x
    const produitsEnCours = this.getClassBalance('34', balances); // 34x
    const produitsFinis = this.getClassBalance('36', balances); // 36x

    const totalStocks =
      marchandises +
      matieresPremieresEtFournitures +
      autresApprovisionnements +
      produitsEnCours +
      produitsFinis;

    // Classe 4: CRÉANCES ET EMPLOIS ASSIMILÉS
    const fournisseursAvancesAcomptes = this.getClassBalance('409', balances); // 409
    const clients = this.getClassBalance('411', balances); // 411
    const autresCreances =
      this.getClassBalance('42', balances) + // Personnel
      this.getClassBalance('43', balances) + // Organismes sociaux
      this.getClassBalance('44', balances) + // État
      this.getClassBalance('46', balances) + // Associés
      this.getClassBalance('47', balances);  // Débiteurs divers

    const totalCreances = fournisseursAvancesAcomptes + clients + autresCreances;

    // Classe 5: TRÉSORERIE ACTIF
    const titresPlacement = this.getClassBalance('50', balances); // 50x
    const valeursEncaisser = this.getClassBalance('51', balances); // 51x
    const banques = this.getClassBalance('52', balances); // 52x
    const caisse = this.getClassBalance('57', balances); // 57x

    const totalTresorerieActif = titresPlacement + valeursEncaisser + banques + caisse;

    const totalActifCirculant = actifCirculantHAO + totalStocks + totalCreances + totalTresorerieActif;

    const totalActif = totalActifImmobilise + totalActifCirculant;

    // PASSIF - Structure SYSCOHADA

    // Classe 1: CAPITAUX PROPRES ET RESSOURCES ASSIMILÉES
    const capital = this.getClassBalance('101', balances); // Capital social
    const actionnairesCapitalNonAppele = this.getClassBalance('109', balances); // À déduire
    const primes = this.getClassBalance('104', balances) + this.getClassBalance('105', balances);
    const ecartReevaluation = this.getClassBalance('106', balances);
    const reserves =
      this.getClassBalance('111', balances) + // Réserve légale
      this.getClassBalance('112', balances) + // Réserves statutaires
      this.getClassBalance('118', balances);  // Autres réserves
    const reportANouveau = this.getClassBalance('12', balances);
    const resultatNetExercice = this.getClassBalance('13', balances);
    const subventionsInvestissement = this.getClassBalance('14', balances);
    const provisionsReglementes = this.getClassBalance('15', balances);

    const totalCapitauxPropres =
      capital -
      actionnairesCapitalNonAppele +
      primes +
      ecartReevaluation +
      reserves +
      reportANouveau +
      resultatNetExercice +
      subventionsInvestissement +
      provisionsReglementes;

    // Classe 1: DETTES FINANCIÈRES ET RESSOURCES ASSIMILÉES
    const empruntsObligations = this.getClassBalance('16', balances);
    const empruntsAutresEtablissementsCredits = this.getClassBalance('17', balances);
    const dettesFinancieresDiverses = this.getClassBalance('18', balances);

    const totalDettesFinancieres =
      empruntsObligations +
      empruntsAutresEtablissementsCredits +
      dettesFinancieresDiverses;

    const totalRessourcesStables = totalCapitauxPropres + totalDettesFinancieres;

    // Classe 4 et 5: PASSIF CIRCULANT
    const clientsAvancesAcomptesRecus = this.getClassBalance('419', balances);
    const fournisseurs = this.getClassBalance('40', balances);
    const dettesPersonnel = this.getClassBalance('42', balances);
    const dettesOrganismesSociaux = this.getClassBalance('43', balances);
    const dettesEtat = this.getClassBalance('44', balances);
    const dettesAssocies = this.getClassBalance('46', balances);
    const autresDettes = this.getClassBalance('47', balances);

    const totalDettesCirculantes =
      clientsAvancesAcomptesRecus +
      fournisseurs +
      dettesPersonnel +
      dettesOrganismesSociaux +
      dettesEtat +
      dettesAssocies +
      autresDettes;

    // Classe 5: TRÉSORERIE PASSIF
    const banquesDecouvert = this.getClassBalance('52', balances, false); // Créditeur
    const etablissementsCreditsCT = this.getClassBalance('56', balances);

    const totalTresoreriePassif = banquesDecouvert + etablissementsCreditsCT;

    const passifCirculantHAO = this.getClassBalance('48', balances);

    const totalPassifCirculant = totalDettesCirculantes + totalTresoreriePassif + passifCirculantHAO;

    const totalPassif = totalRessourcesStables + totalPassifCirculant;

    // Validation de l'équation comptable
    const validation = this.validateBalanceEquation(totalActif, totalPassif, 0);

    const countryConfig = this.getCountryConfig(country);
    const dueDate = new Date(`${parseInt(year) + 1}-${countryConfig?.taxFilingDeadline || '04-30'}`);

    const bilanData = {
      periode: period,
      pays: country,
      devise: countryConfig?.currency || 'XOF',
      actif: {
        immobilise: {
          chargesImmobilisees,
          immobilisationsIncorporelles,
          terrains,
          batiments,
          materielOutillage,
          materielTransport,
          immobilisationsFinancieres,
          total: totalActifImmobilise
        },
        circulant: {
          actifCirculantHAO,
          stocks: {
            marchandises,
            matieresPremieresEtFournitures,
            autresApprovisionnements,
            produitsEnCours,
            produitsFinis,
            total: totalStocks
          },
          creances: {
            fournisseursAvancesAcomptes,
            clients,
            autresCreances,
            total: totalCreances
          },
          tresorerie: {
            titresPlacement,
            valeursEncaisser,
            banques,
            caisse,
            total: totalTresorerieActif
          },
          total: totalActifCirculant
        },
        total: totalActif
      },
      passif: {
        ressourcesStables: {
          capitauxPropres: {
            capital,
            actionnairesCapitalNonAppele,
            primes,
            ecartReevaluation,
            reserves,
            reportANouveau,
            resultatNetExercice,
            subventionsInvestissement,
            provisionsReglementes,
            total: totalCapitauxPropres
          },
          dettesFinancieres: {
            empruntsObligations,
            empruntsAutresEtablissementsCredits,
            dettesFinancieresDiverses,
            total: totalDettesFinancieres
          },
          total: totalRessourcesStables
        },
        circulant: {
          passifCirculantHAO,
          dettes: {
            clientsAvancesAcomptesRecus,
            fournisseurs,
            dettesPersonnel,
            dettesOrganismesSociaux,
            dettesEtat,
            dettesAssocies,
            autresDettes,
            total: totalDettesCirculantes
          },
          tresorerie: {
            banquesDecouvert,
            etablissementsCreditsCT,
            total: totalTresoreriePassif
          },
          total: totalPassifCirculant
        },
        total: totalPassif
      }
    };

    const declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'BILAN_SYSCOHADA',
      standard: 'SYSCOHADA',
      country,
      period,
      dueDate,
      status: validation.isValid ? 'ready' : 'draft',
      companyId,
      data: bilanData,
      validationErrors: validation.errors,
      warnings: validation.warnings
    };

    const id = await this.saveFiscalDeclaration(declaration);

    return {
      ...declaration,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Génère le Compte de Résultat SYSCOHADA
   */
  async generateIncomeStatement(
    companyId: string,
    period: string,
    country: string
  ): Promise<FiscalDeclaration> {
    const [year] = period.split('-');
    const endDate = new Date(`${year}-12-31`);
    const startDate = new Date(`${year}-01-01`);

    // Récupérer les comptes de classes 6, 7 et 8
    const allAccounts: string[] = [];
    for (let i = 6; i <= 8; i++) {
      for (let j = 0; j <= 9; j++) {
        for (let k = 0; k <= 9; k++) {
          allAccounts.push(`${i}${j}${k}`);
        }
      }
    }

    const balances = await this.getAccountBalances(
      companyId,
      allAccounts,
      startDate,
      endDate
    );

    // CHARGES (Classe 6)
    const achatsMarc = this.getClassBalance('601', balances); // Achats de marchandises
    const variationStockMarc = this.getClassBalance('6031', balances); // Variation stocks marchandises
    const achatsMatieresPremieres = this.getClassBalance('602', balances);
    const variationStockMP = this.getClassBalance('6032', balances);
    const autresAchats = this.getClassBalance('604', balances) + this.getClassBalance('605', balances) + this.getClassBalance('608', balances);

    const totalAchatsConsommes =
      achatsMarc + variationStockMarc +
      achatsMatieresPremieres + variationStockMP +
      autresAchats;

    const transports = this.getClassBalance('61', balances);
    const servicesExterieurs =
      this.getClassBalance('62', balances) + // Services extérieurs A
      this.getClassBalance('63', balances);  // Services extérieurs B
    const impotsTaxes = this.getClassBalance('64', balances);
    const autresCharges = this.getClassBalance('65', balances);
    const chargesPersonnel = this.getClassBalance('66', balances);
    const chargesFinancieres = this.getClassBalance('67', balances);
    const dotationsAmortissements = this.getClassBalance('681', balances);
    const dotationsProvisions = this.getClassBalance('691', balances);

    const totalChargesExploitation =
      totalAchatsConsommes +
      transports +
      servicesExterieurs +
      impotsTaxes +
      autresCharges +
      chargesPersonnel +
      dotationsAmortissements +
      dotationsProvisions;

    // PRODUITS (Classe 7)
    const ventesMarc = this.getClassBalance('701', balances);
    const ventesProduitsFinis = this.getClassBalance('702', balances);
    const travaux = this.getClassBalance('704', balances);
    const prestationsServices = this.getClassBalance('706', balances);
    const produitsFabriques = this.getClassBalance('72', balances);
    const variationStocksProduits = this.getClassBalance('73', balances);
    const subventionsExploitation = this.getClassBalance('74', balances);
    const autresProduitsExploitation = this.getClassBalance('75', balances);
    const reprisesDAmortissements = this.getClassBalance('781', balances);
    const reprisesProvisions = this.getClassBalance('791', balances);
    const produitsFinanciers = this.getClassBalance('77', balances);

    const chiffreAffaires =
      ventesMarc +
      ventesProduitsFinis +
      travaux +
      prestationsServices;

    const totalProduitsExploitation =
      chiffreAffaires +
      produitsFabriques +
      variationStocksProduits +
      subventionsExploitation +
      autresProduitsExploitation +
      reprisesDAmortissements +
      reprisesProvisions;

    // RÉSULTATS
    const resultatExploitation = totalProduitsExploitation - totalChargesExploitation;
    const resultatFinancier = produitsFinanciers - chargesFinancieres;

    // Classe 8: HAO (Hors Activités Ordinaires)
    const chargesHAO = this.getClassBalance('83', balances) + this.getClassBalance('84', balances) + this.getClassBalance('85', balances);
    const produitsHAO = this.getClassBalance('82', balances);
    const resultatHAO = produitsHAO - chargesHAO;

    // Participation et impôts
    const participationSalaries = this.getClassBalance('87', balances);
    const impotsSurResultats = this.getClassBalance('89', balances);

    const resultatNet =
      resultatExploitation +
      resultatFinancier +
      resultatHAO -
      participationSalaries -
      impotsSurResultats;

    // Validation
    const validation = this.validateIncomeStatement(
      totalProduitsExploitation + produitsFinanciers + produitsHAO,
      totalChargesExploitation + chargesFinancieres + chargesHAO + participationSalaries + impotsSurResultats,
      resultatNet
    );

    const countryConfig = this.getCountryConfig(country);
    const dueDate = new Date(`${parseInt(year) + 1}-${countryConfig?.taxFilingDeadline || '04-30'}`);

    const compteResultatData = {
      periode: period,
      pays: country,
      devise: countryConfig?.currency || 'XOF',
      charges: {
        exploitation: {
          achatsConsommes: {
            achatsMarc,
            variationStockMarc,
            achatsMatieresPremieres,
            variationStockMP,
            autresAchats,
            total: totalAchatsConsommes
          },
          transports,
          servicesExterieurs,
          impotsTaxes,
          autresCharges,
          chargesPersonnel,
          dotationsAmortissements,
          dotationsProvisions,
          total: totalChargesExploitation
        },
        financieres: chargesFinancieres,
        hao: chargesHAO,
        participation: participationSalaries,
        impots: impotsSurResultats,
        total: totalChargesExploitation + chargesFinancieres + chargesHAO + participationSalaries + impotsSurResultats
      },
      produits: {
        exploitation: {
          chiffreAffaires: {
            ventesMarc,
            ventesProduitsFinis,
            travaux,
            prestationsServices,
            total: chiffreAffaires
          },
          produitsFabriques,
          variationStocksProduits,
          subventionsExploitation,
          autresProduitsExploitation,
          reprisesDAmortissements,
          reprisesProvisions,
          total: totalProduitsExploitation
        },
        financiers: produitsFinanciers,
        hao: produitsHAO,
        total: totalProduitsExploitation + produitsFinanciers + produitsHAO
      },
      resultats: {
        exploitation: resultatExploitation,
        financier: resultatFinancier,
        courant: resultatExploitation + resultatFinancier,
        hao: resultatHAO,
        avant_impot: resultatExploitation + resultatFinancier + resultatHAO - participationSalaries,
        net: resultatNet
      }
    };

    const declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'COMPTE_RESULTAT_SYSCOHADA',
      standard: 'SYSCOHADA',
      country,
      period,
      dueDate,
      status: validation.isValid ? 'ready' : 'draft',
      companyId,
      data: compteResultatData,
      validationErrors: validation.errors,
      warnings: validation.warnings
    };

    const id = await this.saveFiscalDeclaration(declaration);

    return {
      ...declaration,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Génère le TAFIRE (Tableau Financier des Ressources et Emplois)
   */
  async generateTAFIRE(
    companyId: string,
    period: string,
    country: string
  ): Promise<FiscalDeclaration> {
    // Le TAFIRE nécessite de comparer deux exercices (N et N-1)
    const [year] = period.split('-');
    const currentYearEnd = new Date(`${year}-12-31`);
    const previousYearEnd = new Date(`${parseInt(year) - 1}-12-31`);

    // Pour simplifier, on génère un TAFIRE basique
    // Une implémentation complète nécessiterait de récupérer les bilans N et N-1

    const countryConfig = this.getCountryConfig(country);
    const dueDate = new Date(`${parseInt(year) + 1}-${countryConfig?.taxFilingDeadline || '04-30'}`);

    const tafireData = {
      periode: period,
      pays: country,
      devise: countryConfig?.currency || 'XOF',
      note: 'Le TAFIRE complet nécessite les données des exercices N et N-1',
      emplois: {
        investissements: 0,
        augmentationBFR: 0,
        remboursementsEmprunts: 0,
        dividendes: 0,
        total: 0
      },
      ressources: {
        capaciteAutofinancement: 0,
        cessions: 0,
        augmentationCapital: 0,
        nouveauxEmprunts: 0,
        diminutionBFR: 0,
        total: 0
      },
      variationTresorerie: 0
    };

    const declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'TAFIRE_SYSCOHADA',
      standard: 'SYSCOHADA',
      country,
      period,
      dueDate,
      status: 'draft',
      companyId,
      data: tafireData,
      validationErrors: [],
      warnings: ['Le TAFIRE nécessite une implémentation complète avec comparaison N/N-1']
    };

    const id = await this.saveFiscalDeclaration(declaration);

    return {
      ...declaration,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Génère la déclaration de TVA
   */
  async generateVATDeclaration(
    companyId: string,
    period: string,
    country: string
  ): Promise<FiscalDeclaration> {
    const [year, month] = period.split('-');
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(parseInt(year), parseInt(month), 0); // Dernier jour du mois

    // Récupérer les comptes de TVA (classe 44)
    const vatAccounts: string[] = [];
    for (let i = 440; i <= 449; i++) {
      vatAccounts.push(i.toString());
    }

    const balances = await this.getAccountBalances(
      companyId,
      vatAccounts,
      startDate,
      endDate
    );

    const countryConfig = this.getCountryConfig(country);
    const vatRate = countryConfig?.vatRate || 18;

    // TVA collectée (créditeur)
    const tvaCollectee = Math.abs(this.getClassBalance('4431', balances, false));

    // TVA déductible (débiteur)
    const tvaDeductibleImmobilisations = this.getClassBalance('4452', balances);
    const tvaDeductibleCharges = this.getClassBalance('4456', balances);
    const tvaDeductible = tvaDeductibleImmobilisations + tvaDeductibleCharges;

    // TVA à payer ou crédit
    const tvaNette = tvaCollectee - tvaDeductible;
    const tvaAPayer = tvaNette > 0 ? tvaNette : 0;
    const creditTVA = tvaNette < 0 ? Math.abs(tvaNette) : 0;

    const dueDate = new Date(parseInt(year), parseInt(month), 20); // 20 du mois suivant

    const tvaData = {
      periode: period,
      pays: country,
      devise: countryConfig?.currency || 'XOF',
      taux: vatRate,
      tvaCollectee,
      tvaDeductible: {
        immobilisations: tvaDeductibleImmobilisations,
        charges: tvaDeductibleCharges,
        total: tvaDeductible
      },
      tvaNette,
      tvaAPayer,
      creditTVA
    };

    const declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'TVA_DECLARATION',
      standard: 'SYSCOHADA',
      country,
      period,
      dueDate,
      status: 'ready',
      companyId,
      data: tvaData,
      validationErrors: [],
      warnings: creditTVA > 0 ? ['Crédit de TVA à reporter'] : []
    };

    const id = await this.saveFiscalDeclaration(declaration);

    return {
      ...declaration,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Génère la déclaration d'impôt sur les sociétés
   */
  async generateCorporateTaxDeclaration(
    companyId: string,
    period: string,
    country: string
  ): Promise<FiscalDeclaration> {
    // Récupérer le compte de résultat pour calculer l'IS
    const compteResultat = await this.generateIncomeStatement(companyId, period, country);

    const countryConfig = this.getCountryConfig(country);
    const corporateTaxRate = countryConfig?.corporateTaxRate || 30;

    const resultatNet = compteResultat.data.resultats.net;
    const resultatFiscal = resultatNet; // Simplification (sans retraitements)

    const impotSurSocietes = resultatFiscal > 0 ? resultatFiscal * (corporateTaxRate / 100) : 0;

    const [year] = period.split('-');
    const dueDate = new Date(`${parseInt(year) + 1}-${countryConfig?.taxFilingDeadline || '04-30'}`);

    const isData = {
      periode: period,
      pays: country,
      devise: countryConfig?.currency || 'XOF',
      taux: corporateTaxRate,
      resultatComptable: resultatNet,
      reintegrations: 0,
      deductions: 0,
      resultatFiscal,
      impotCalcule: impotSurSocietes,
      credits: 0,
      impotAPayer: impotSurSocietes
    };

    const declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'IMPOT_SOCIETES',
      standard: 'SYSCOHADA',
      country,
      period,
      dueDate,
      status: 'ready',
      companyId,
      data: isData,
      validationErrors: [],
      warnings: resultatFiscal < 0 ? ['Résultat fiscal déficitaire'] : []
    };

    const id = await this.saveFiscalDeclaration(declaration);

    return {
      ...declaration,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Génère la DSF (Déclaration Statistique et Fiscale)
   */
  async generateDSF(
    companyId: string,
    period: string,
    country: string
  ): Promise<FiscalDeclaration> {
    // La DSF comprend tous les états financiers
    const bilan = await this.generateBalanceSheet(companyId, period, country);
    const compteResultat = await this.generateIncomeStatement(companyId, period, country);
    const tafire = await this.generateTAFIRE(companyId, period, country);

    const [year] = period.split('-');
    const countryConfig = this.getCountryConfig(country);
    const dueDate = new Date(`${parseInt(year) + 1}-${countryConfig?.taxFilingDeadline || '04-30'}`);

    const dsfData = {
      periode: period,
      pays: country,
      devise: countryConfig?.currency || 'XOF',
      bilan: bilan.data,
      compteResultat: compteResultat.data,
      tafire: tafire.data
    };

    const validation: ValidationResult = {
      isValid: bilan.validationErrors.length === 0 && compteResultat.validationErrors.length === 0,
      errors: [...bilan.validationErrors, ...compteResultat.validationErrors],
      warnings: [...bilan.warnings, ...compteResultat.warnings, ...tafire.warnings]
    };

    const declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'DSF_COMPLETE',
      standard: 'SYSCOHADA',
      country,
      period,
      dueDate,
      status: validation.isValid ? 'ready' : 'draft',
      companyId,
      data: dsfData,
      validationErrors: validation.errors,
      warnings: validation.warnings
    };

    const id = await this.saveFiscalDeclaration(declaration);

    return {
      ...declaration,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
