/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 *
 * Service de conformité fiscale SCF/PCM
 * Couvre 3 pays du Maghreb (Maroc, Algérie, Tunisie)
 */

import { BaseFiscalService } from './BaseFiscalService';
import type {
  FiscalDeclaration,
  CountryConfig,
  ValidationResult
} from '../../types/fiscal.types';

/**
 * Configuration des 3 pays Maghreb
 */
const MAGHREB_COUNTRIES: Record<string, CountryConfig> = {
  MA: {
    name: 'Maroc',
    currency: 'MAD',
    vatRate: 20,
    vatReducedRates: [7, 10, 14],
    corporateTaxRate: 31,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '03-31',
    taxAuthority: 'Direction Générale des Impôts (DGI)',
    onlinePortal: 'https://www.tax.gov.ma'
  },
  DZ: {
    name: 'Algérie',
    currency: 'DZD',
    vatRate: 19,
    vatReducedRates: [9],
    corporateTaxRate: 26,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '04-30',
    taxAuthority: 'Direction Générale des Impôts (DGI)',
    onlinePortal: 'https://www.mfdgi.gov.dz'
  },
  TN: {
    name: 'Tunisie',
    currency: 'TND',
    vatRate: 19,
    vatReducedRates: [7, 13],
    corporateTaxRate: 25,
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '03-25',
    taxAuthority: 'Direction Générale des Impôts (DGI)',
    onlinePortal: 'https://www.impots.finances.gov.tn'
  }
};

export class SCFTaxComplianceService extends BaseFiscalService {
  constructor() {
    super('SCF');

    // Charger les configurations pays
    for (const [code, config] of Object.entries(MAGHREB_COUNTRIES)) {
      this.countryConfigs.set(code, config);
    }
  }

  /**
   * Génère le Bilan SCF (Système Comptable Financier)
   */
  async generateBalanceSheet(
    companyId: string,
    period: string,
    country: string
  ): Promise<FiscalDeclaration> {
    const [year] = period.split('-');
    const endDate = new Date(`${year}-12-31`);
    const startDate = new Date(`${year}-01-01`);

    // Récupérer tous les comptes (classes 1-5)
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

    // ACTIF - Structure SCF/PCM

    // ACTIF NON COURANT
    const immobilisationsIncorporelles = this.getClassBalance('20', balances);
    const immobilisationsCorporelles =
      this.getClassBalance('21', balances) + // Terrains
      this.getClassBalance('22', balances) + // Constructions
      this.getClassBalance('23', balances) + // Installations techniques
      this.getClassBalance('24', balances);  // Matériel

    const immobilisationsEnCours = this.getClassBalance('23', balances);
    const immobilisationsFinancieres = this.getClassBalance('26', balances) + this.getClassBalance('27', balances);
    const impotsDifferes = this.getClassBalance('13', balances);

    const totalActifNonCourant =
      immobilisationsIncorporelles +
      immobilisationsCorporelles +
      immobilisationsEnCours +
      immobilisationsFinancieres +
      impotsDifferes;

    // ACTIF COURANT
    const stocks =
      this.getClassBalance('30', balances) + // Marchandises
      this.getClassBalance('31', balances) + // Matières premières
      this.getClassBalance('32', balances) + // Autres approvisionnements
      this.getClassBalance('33', balances) + // Produits en cours
      this.getClassBalance('35', balances);  // Produits finis

    const creances =
      this.getClassBalance('40', balances) + // Fournisseurs débiteurs
      this.getClassBalance('41', balances) + // Clients
      this.getClassBalance('42', balances) + // Personnel
      this.getClassBalance('43', balances) + // Sécurité sociale
      this.getClassBalance('44', balances) + // État
      this.getClassBalance('46', balances);  // Associés

    const autresActifsCourants = this.getClassBalance('47', balances) + this.getClassBalance('48', balances);

    const disponibilites =
      this.getClassBalance('50', balances) + // Valeurs mobilières
      this.getClassBalance('51', balances) + // Banques
      this.getClassBalance('53', balances);  // Caisse

    const totalActifCourant = stocks + creances + autresActifsCourants + disponibilites;

    const totalActif = totalActifNonCourant + totalActifCourant;

    // PASSIF - Structure SCF/PCM

    // CAPITAUX PROPRES
    const capital = this.getClassBalance('101', balances);
    const primes = this.getClassBalance('104', balances);
    const ecartReevaluation = this.getClassBalance('105', balances);
    const reserves =
      this.getClassBalance('106', balances) + // Réserve légale
      this.getClassBalance('11', balances);   // Report à nouveau
    const resultat = this.getClassBalance('12', balances);
    const subventions = this.getClassBalance('13', balances);

    const totalCapitauxPropres = capital + primes + ecartReevaluation + reserves + resultat + subventions;

    // PASSIF NON COURANT
    const empruntsEtDettesFinancieres = this.getClassBalance('16', balances) + this.getClassBalance('17', balances);
    const impotsDifferesPassif = this.getClassBalance('13', balances, false);
    const autresDetteNonCourantes = this.getClassBalance('18', balances);
    const provisions = this.getClassBalance('15', balances);

    const totalPassifNonCourant =
      empruntsEtDettesFinancieres +
      impotsDifferesPassif +
      autresDetteNonCourantes +
      provisions;

    // PASSIF COURANT
    const fournisseurs = this.getClassBalance('40', balances, false);
    const dettesPersonnel = this.getClassBalance('42', balances, false);
    const dettesSecuriteSociale = this.getClassBalance('43', balances, false);
    const dettesEtat = this.getClassBalance('44', balances, false);
    const autresDettesCourantes = this.getClassBalance('46', balances, false) + this.getClassBalance('47', balances, false);
    const tresoreriePassif = this.getClassBalance('52', balances, false);

    const totalPassifCourant =
      fournisseurs +
      dettesPersonnel +
      dettesSecuriteSociale +
      dettesEtat +
      autresDettesCourantes +
      tresoreriePassif;

    const totalPassif = totalCapitauxPropres + totalPassifNonCourant + totalPassifCourant;

    // Validation de l'équation comptable
    const validation = this.validateBalanceEquation(totalActif, totalPassif, 0);

    const countryConfig = this.getCountryConfig(country);
    const dueDate = new Date(`${parseInt(year) + 1}-${countryConfig?.taxFilingDeadline || '03-31'}`);

    const bilanData = {
      periode: period,
      pays: country,
      devise: countryConfig?.currency || 'MAD',
      actif: {
        nonCourant: {
          immobilisationsIncorporelles,
          immobilisationsCorporelles,
          immobilisationsEnCours,
          immobilisationsFinancieres,
          impotsDifferes,
          total: totalActifNonCourant
        },
        courant: {
          stocks,
          creances,
          autresActifsCourants,
          disponibilites,
          total: totalActifCourant
        },
        total: totalActif
      },
      passif: {
        capitauxPropres: {
          capital,
          primes,
          ecartReevaluation,
          reserves,
          resultat,
          subventions,
          total: totalCapitauxPropres
        },
        nonCourant: {
          empruntsEtDettesFinancieres,
          impotsDifferesPassif,
          autresDetteNonCourantes,
          provisions,
          total: totalPassifNonCourant
        },
        courant: {
          fournisseurs,
          dettesPersonnel,
          dettesSecuriteSociale,
          dettesEtat,
          autresDettesCourantes,
          tresoreriePassif,
          total: totalPassifCourant
        },
        total: totalPassif
      }
    };

    const declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'BILAN_SCF',
      standard: 'SCF',
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
   * Génère le Compte de Résultat SCF
   */
  async generateIncomeStatement(
    companyId: string,
    period: string,
    country: string
  ): Promise<FiscalDeclaration> {
    const [year] = period.split('-');
    const endDate = new Date(`${year}-12-31`);
    const startDate = new Date(`${year}-01-01`);

    // Récupérer les comptes de classes 6 et 7
    const allAccounts: string[] = [];
    for (let i = 6; i <= 7; i++) {
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
    const achatsConsommes =
      this.getClassBalance('60', balances) + // Achats
      this.getClassBalance('603', balances); // Variation stocks

    const servicesExterieurs =
      this.getClassBalance('61', balances) + // Services extérieurs
      this.getClassBalance('62', balances);  // Autres services

    const valeursComptables = this.getClassBalance('65', balances);
    const chargesPersonnel = this.getClassBalance('63', balances);
    const impotsTaxes = this.getClassBalance('64', balances);
    const autresCharges = this.getClassBalance('65', balances);
    const chargesFinancieres = this.getClassBalance('66', balances);
    const dotationsAmortissements = this.getClassBalance('68', balances);

    const totalCharges =
      achatsConsommes +
      servicesExterieurs +
      valeursComptables +
      chargesPersonnel +
      impotsTaxes +
      autresCharges +
      chargesFinancieres +
      dotationsAmortissements;

    // PRODUITS (Classe 7)
    const ventesMarc = this.getClassBalance('70', balances);
    const production =
      this.getClassBalance('71', balances) + // Production vendue
      this.getClassBalance('72', balances) + // Production stockée
      this.getClassBalance('73', balances);  // Production immobilisée

    const chiffreAffaires = ventesMarc + this.getClassBalance('71', balances);

    const subventionsExploitation = this.getClassBalance('74', balances);
    const autresProduits = this.getClassBalance('75', balances);
    const produitsFinanciers = this.getClassBalance('76', balances);
    const reprises = this.getClassBalance('78', balances);

    const totalProduits =
      chiffreAffaires +
      production +
      subventionsExploitation +
      autresProduits +
      produitsFinanciers +
      reprises;

    // RÉSULTATS
    const resultatExploitation =
      (ventesMarc + production + subventionsExploitation + autresProduits) -
      (achatsConsommes + servicesExterieurs + chargesPersonnel + impotsTaxes + autresCharges + dotationsAmortissements);

    const resultatFinancier = produitsFinanciers - chargesFinancieres;
    const resultatCourant = resultatExploitation + resultatFinancier;

    // Impôt sur les bénéfices
    const countryConfig = this.getCountryConfig(country);
    const impotSocietes = resultatCourant > 0 ? resultatCourant * (countryConfig!.corporateTaxRate / 100) : 0;

    const resultatNet = resultatCourant - impotSocietes;

    // Validation
    const validation = this.validateIncomeStatement(totalProduits, totalCharges + impotSocietes, resultatNet);

    const dueDate = new Date(`${parseInt(year) + 1}-${countryConfig?.taxFilingDeadline || '03-31'}`);

    const compteResultatData = {
      periode: period,
      pays: country,
      devise: countryConfig?.currency || 'MAD',
      produits: {
        chiffreAffaires,
        production,
        subventionsExploitation,
        autresProduits,
        produitsFinanciers,
        reprises,
        total: totalProduits
      },
      charges: {
        achatsConsommes,
        servicesExterieurs,
        valeursComptables,
        chargesPersonnel,
        impotsTaxes,
        autresCharges,
        chargesFinancieres,
        dotationsAmortissements,
        total: totalCharges
      },
      resultats: {
        exploitation: resultatExploitation,
        financier: resultatFinancier,
        courant: resultatCourant,
        impotSocietes,
        net: resultatNet
      }
    };

    const declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'COMPTE_RESULTAT_SCF',
      standard: 'SCF',
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
   * Génère le Tableau des Flux de Trésorerie SCF
   */
  async generateCashFlowStatement(
    companyId: string,
    period: string,
    country: string
  ): Promise<FiscalDeclaration> {
    // Le Tableau des Flux nécessite de comparer deux périodes
    const [year] = period.split('-');
    const countryConfig = this.getCountryConfig(country);
    const dueDate = new Date(`${parseInt(year) + 1}-${countryConfig?.taxFilingDeadline || '03-31'}`);

    const fluxTresorerieData = {
      periode: period,
      pays: country,
      devise: countryConfig?.currency || 'MAD',
      note: 'Le Tableau des Flux de Trésorerie complet nécessite les données des exercices N et N-1',
      fluxActivitesExploitation: {
        resultatNet: 0,
        ajustements: 0,
        variationBFR: 0,
        total: 0
      },
      fluxActivitesInvestissement: {
        acquisitions: 0,
        cessions: 0,
        total: 0
      },
      fluxActivitesFinancement: {
        augmentationCapital: 0,
        emprunts: 0,
        dividendes: 0,
        total: 0
      },
      variationTresorerie: 0,
      tresorerieDebut: 0,
      tresorerieFin: 0
    };

    const declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'FLUX_TRESORERIE_SCF',
      standard: 'SCF',
      country,
      period,
      dueDate,
      status: 'draft',
      companyId,
      data: fluxTresorerieData,
      validationErrors: [],
      warnings: ['Le Tableau des Flux de Trésorerie nécessite une implémentation complète avec comparaison N/N-1']
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
    const endDate = new Date(year, parseInt(month), 0);

    // Récupérer les comptes de TVA (classe 44)
    const vatAccounts: string[] = [];
    for (let i = 445; i <= 449; i++) {
      vatAccounts.push(i.toString());
    }

    const balances = await this.getAccountBalances(
      companyId,
      vatAccounts,
      startDate,
      endDate
    );

    const countryConfig = this.getCountryConfig(country);
    const vatRate = countryConfig?.vatRate || 19;

    // TVA collectée
    const tvaCollectee = Math.abs(this.getClassBalance('4455', balances, false));

    // TVA déductible
    const tvaRecuperableImmobilisations = this.getClassBalance('4456', balances);
    const tvaRecuperableCharges = this.getClassBalance('4458', balances);
    const tvaDeductible = tvaRecuperableImmobilisations + tvaRecuperableCharges;

    // TVA nette
    const tvaNette = tvaCollectee - tvaDeductible;
    const tvaAPayer = tvaNette > 0 ? tvaNette : 0;
    const creditTVA = tvaNette < 0 ? Math.abs(tvaNette) : 0;

    // Deadline varies by country (20-25 of next month)
    const dueDay = country === 'TN' ? 25 : country === 'MA' ? 20 : 20;
    const dueDate = new Date(year, parseInt(month), dueDay);

    const tvaData = {
      periode: period,
      pays: country,
      devise: countryConfig?.currency || 'MAD',
      taux: vatRate,
      tauxReduits: countryConfig?.vatReducedRates || [],
      tvaCollectee,
      tvaDeductible: {
        immobilisations: tvaRecuperableImmobilisations,
        charges: tvaRecuperableCharges,
        total: tvaDeductible
      },
      tvaNette,
      tvaAPayer,
      creditTVA
    };

    const declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'TVA_DECLARATION',
      standard: 'SCF',
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
    // Récupérer le compte de résultat
    const compteResultat = await this.generateIncomeStatement(companyId, period, country);

    const countryConfig = this.getCountryConfig(country);
    const corporateTaxRate = countryConfig?.corporateTaxRate || 26;

    const resultatNet = compteResultat.data.resultats.courant;
    const resultatFiscal = resultatNet; // Simplification

    const impotSocietes = resultatFiscal > 0 ? resultatFiscal * (corporateTaxRate / 100) : 0;

    const [year] = period.split('-');
    const dueDate = new Date(`${parseInt(year) + 1}-${countryConfig?.taxFilingDeadline || '03-31'}`);

    const isData = {
      periode: period,
      pays: country,
      devise: countryConfig?.currency || 'MAD',
      taux: corporateTaxRate,
      resultatComptable: resultatNet,
      reintegrations: 0,
      deductions: 0,
      resultatFiscal,
      impotCalcule: impotSocietes,
      credits: 0,
      impotsVersesAvances: 0,
      soldeAPayer: impotSocietes
    };

    const declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'IMPOT_SOCIETES',
      standard: 'SCF',
      country,
      period,
      dueDate,
      status: 'ready',
      companyId,
      data: isData,
      validationErrors: [],
      warnings: resultatFiscal < 0 ? ['Déficit fiscal reportable'] : []
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
