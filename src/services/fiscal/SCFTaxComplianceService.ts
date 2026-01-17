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
 * Configuration étendue des pays Maghreb avec détails fiscaux
 */
interface MaghrebCountryConfig extends CountryConfig {
  nameFr: string;
  corporateTaxReduced?: number;
  withholdingTaxRates?: Record<string, number>;
  specificTaxes?: Record<string, number>;
  vatDeclarationFrequency: 'monthly' | 'quarterly';
  accountingStandard: string;
}

const MAGHREB_COUNTRIES: Record<string, MaghrebCountryConfig> = {
  DZ: {
    name: 'Algeria',
    nameFr: 'Algérie',
    currency: 'DZD',
    vatRate: 19,
    vatReducedRates: [9],
    corporateTaxRate: 26,
    corporateTaxReduced: 19, // Pour activités de production
    withholdingTaxRates: {
      dividendes: 15,
      interets: 10,
      redevances: 24,
      services: 24
    },
    specificTaxes: {
      tap: 2, // Taxe sur l'Activité Professionnelle
      minimumIBS: 10000 // Minimum IBS en DZD
    },
    vatDeclarationFrequency: 'monthly',
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '04-30',
    taxAuthority: 'Direction Générale des Impôts (DGI)',
    accountingStandard: 'SCF',
    onlinePortal: 'https://www.mfdgi.gov.dz'
  },
  MA: {
    name: 'Morocco',
    nameFr: 'Maroc',
    currency: 'MAD',
    vatRate: 20,
    vatReducedRates: [14, 10, 7],
    corporateTaxRate: 31,
    corporateTaxReduced: 20, // Taux réduit PME
    withholdingTaxRates: {
      dividendes: 15,
      interets: 20,
      redevances: 10,
      services: 10
    },
    specificTaxes: {
      cotisationMinimale: 3000, // Minimum IS en MAD (0.5% CA)
      isBracket1Rate: 10, // 0-300k
      isBracket1Limit: 300000,
      isBracket2Rate: 20, // 300k-1M
      isBracket2Limit: 1000000,
      isBracket3Rate: 31 // >1M
    },
    vatDeclarationFrequency: 'monthly',
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '03-31',
    taxAuthority: 'Direction Générale des Impôts (DGI)',
    accountingStandard: 'PCM',
    onlinePortal: 'https://www.tax.gov.ma'
  },
  TN: {
    name: 'Tunisia',
    nameFr: 'Tunisie',
    currency: 'TND',
    vatRate: 19,
    vatReducedRates: [13, 7],
    corporateTaxRate: 25,
    corporateTaxReduced: 15, // Taux réduit export
    withholdingTaxRates: {
      dividendes: 10,
      interets: 20,
      redevances: 15,
      services: 15
    },
    specificTaxes: {
      fodec: 1, // FODEC 1%
      tcl: 0.2, // TCL 0.2%
      minimumIS: 500 // Minimum IS en TND (0.2% CA)
    },
    vatDeclarationFrequency: 'monthly',
    fiscalYearEnd: '12-31',
    taxFilingDeadline: '03-25',
    taxAuthority: 'Direction Générale des Impôts (DGI)',
    accountingStandard: 'SCE',
    onlinePortal: 'https://www.finances.gov.tn'
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
    // ACTIF NON COURANT - Structure SCF détaillée
    const ecartAcquisition = this.getClassBalance('207', balances);
    const immobilisationsIncorporelles = this.sumAccountRange('201', '208', balances);

    const terrains = this.getClassBalance('211', balances);
    const batiments = this.getClassBalance('213', balances);
    const autresImmobCorporelles = this.sumAccountPrefix('215', balances) + this.sumAccountPrefix('218', balances);
    const immobilisationsEnConcession = this.getClassBalance('22', balances);
    const immobilisationsEnCours = this.getClassBalance('23', balances);
    const immobilisationsCorporelles = terrains + batiments + autresImmobCorporelles +
      immobilisationsEnConcession + immobilisationsEnCours;

    const titresMisEquivalence = this.sumAccountPrefix('261', balances);
    const autresParticipations = this.sumAccountPrefix('262', balances) + this.sumAccountPrefix('265', balances);
    const autresTitresImmobilises = this.sumAccountPrefix('271', balances) + this.sumAccountPrefix('272', balances);
    const pretsActifsFinanciers = this.sumAccountPrefix('274', balances) + this.sumAccountPrefix('275', balances);
    const immobilisationsFinancieres = titresMisEquivalence + autresParticipations +
      autresTitresImmobilises + pretsActifsFinanciers;

    const impotsDifferes = this.getClassBalance('133', balances);

    // Déduire amortissements et dépréciations
    const amortissements = this.sumAccountPrefix('28', balances, false);
    const depreciationsImmo = this.sumAccountPrefix('29', balances, false);

    const totalActifNonCourant = ecartAcquisition + immobilisationsIncorporelles +
      immobilisationsCorporelles + immobilisationsFinancieres + impotsDifferes -
      amortissements - depreciationsImmo;

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
    const autresDetteNonCourantes = this.getClassBalance('18', balances, false);
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
    const endDate = new Date(parseInt(year), parseInt(month), 0);

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
    const dueDate = new Date(parseInt(year), parseInt(month), dueDay);

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

  /**
   * ALGÉRIE - Génère la déclaration G50 (TVA mensuelle + TAP)
   */
  async generateG50Algeria(companyId: string, period: string): Promise<FiscalDeclaration> {
    const config = MAGHREB_COUNTRIES.DZ;
    const [year, month] = period.split('-');
    const startDate = new Date(`${year}-${month}-01`);
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = new Date(`${year}-${month}-${lastDay}`);

    const balances = await this.getAccountBalances(companyId, [], startDate, endDate);

    // Chiffre d'affaires
    const caTotal = this.sumAccountPrefix('70', balances, false);
    const caTauxNormal = caTotal * 0.85; // Estimation 85% taux normal
    const caTauxReduit = caTotal * 0.10;
    const caExonere = caTotal * 0.05;

    // TVA collectée
    const tvaCollectee19 = caTauxNormal * config.vatRate / 100;
    const tvaCollectee9 = caTauxReduit * config.vatReducedRates![0] / 100;
    const totalTvaCollectee = tvaCollectee19 + tvaCollectee9;

    // TVA déductible
    const tvaDeductibleBiens = this.sumAccountPrefix('4456', balances);
    const tvaDeductibleServices = this.sumAccountPrefix('4457', balances);
    const tvaDeductibleImmobilisations = this.sumAccountPrefix('4458', balances);
    const totalTvaDeductible = tvaDeductibleBiens + tvaDeductibleServices + tvaDeductibleImmobilisations;

    // TVA nette
    const tvaNette = totalTvaCollectee - totalTvaDeductible;
    const tvaAPayer = tvaNette > 0 ? tvaNette : 0;
    const creditTva = tvaNette < 0 ? Math.abs(tvaNette) : 0;

    // TAP (Taxe sur l'Activité Professionnelle)
    const tapTaux = config.specificTaxes!.tap;
    const tapMontant = caTotal * tapTaux / 100;

    const data = {
      periode: period,
      pays: 'DZ',
      devise: config.currency,
      // CA
      caTauxNormal,
      caTauxReduit,
      caExonere,
      caTotal,
      // TVA collectée
      tvaCollectee19,
      tvaCollectee9,
      totalTvaCollectee,
      // TVA déductible
      tvaDeductibleBiens,
      tvaDeductibleServices,
      tvaDeductibleImmobilisations,
      totalTvaDeductible,
      // Solde TVA
      tvaNette,
      tvaAPayer,
      creditTva,
      // TAP
      tapTaux,
      tapMontant,
      // Total
      totalAPayer: tvaAPayer + tapMontant,
      autorite: config.taxAuthority
    };

    const dueDate = new Date(parseInt(year), parseInt(month), 20);

    const declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'G50',
      standard: 'SCF',
      country: 'DZ',
      period,
      dueDate,
      status: 'ready',
      companyId,
      data,
      validationErrors: [],
      warnings: ['La répartition du CA par taux TVA est estimée - vérifier selon les ventes réelles']
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
   * ALGÉRIE - IBS (Impôt sur les Bénéfices des Sociétés)
   */
  async generateIBSAlgeria(companyId: string, period: string): Promise<FiscalDeclaration> {
    const config = MAGHREB_COUNTRIES.DZ;
    const [year] = period.split('-');

    // Récupérer le compte de résultat
    const compteResultat = await this.generateIncomeStatement(companyId, period, 'DZ');
    const resultatComptable = compteResultat.data.resultats.courant;
    const chiffreAffaires = compteResultat.data.produits.chiffreAffaires;

    // Réintégrations fiscales (simplifié)
    const reintegrations = {
      amendesPenalites: 0,
      chargesNonDeductibles: 0,
      amortissementsExcessifs: 0,
      provisionsNonDeductibles: 0,
      total: 0
    };

    // Déductions fiscales
    const deductions = {
      abattementsReinvestissement: 0,
      plusValuesExonerees: 0,
      dividendesRecus: 0,
      total: 0
    };

    const resultatFiscal = resultatComptable + reintegrations.total - deductions.total;

    // Taux IBS (19% production, 26% autres)
    const tauxIBS = config.corporateTaxRate; // Simplification
    const ibsBrut = Math.max(0, resultatFiscal * tauxIBS / 100);

    // Minimum d'imposition (0.5% du CA avec minimum 10,000 DZD)
    const minimumImposition = Math.max(config.specificTaxes!.minimumIBS, chiffreAffaires * 0.005);
    const ibsDu = Math.max(ibsBrut, minimumImposition);

    const data = {
      periode: period,
      pays: 'DZ',
      devise: config.currency,
      resultatComptable,
      chiffreAffaires,
      reintegrations,
      deductions,
      resultatFiscal,
      tauxIBS,
      ibsBrut,
      minimumImposition,
      ibsDu,
      acomptesVerses: 0,
      soldeAPayer: ibsDu,
      autorite: config.taxAuthority
    };

    const dueDate = new Date(parseInt(year) + 1, 3, 30); // 30 avril N+1

    const declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'IBS',
      standard: 'SCF',
      country: 'DZ',
      period,
      dueDate,
      status: 'ready',
      companyId,
      data,
      validationErrors: [],
      warnings: [
        'Vérifier les réintégrations et déductions avec un expert fiscal algérien',
        'Les acomptes IBS doivent être renseignés manuellement'
      ]
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
   * MAROC - IS avec barème progressif
   */
  async generateISMorocco(companyId: string, period: string): Promise<FiscalDeclaration> {
    const config = MAGHREB_COUNTRIES.MA;
    const [year] = period.split('-');

    // Récupérer le compte de résultat
    const compteResultat = await this.generateIncomeStatement(companyId, period, 'MA');
    const resultatComptable = compteResultat.data.resultats.courant;
    const chiffreAffaires = compteResultat.data.produits.chiffreAffaires;

    // Réintégrations
    const reintegrations = {
      amendesMajorations: 0,
      liberalites: 0,
      provisionsNonDeductibles: 0,
      chargesNonJustifiees: 0,
      total: 0
    };

    // Déductions
    const deductions = {
      abattements: 0,
      dividendes: 0,
      plusValuesExonerees: 0,
      total: 0
    };

    const resultatFiscal = resultatComptable + reintegrations.total - deductions.total;

    // Barème IS Maroc : 10% (0-300k), 20% (300k-1M), 31% (>1M)
    let isCalcule = 0;
    const bracket1Limit = config.specificTaxes!.isBracket1Limit;
    const bracket2Limit = config.specificTaxes!.isBracket2Limit;

    if (resultatFiscal <= bracket1Limit) {
      isCalcule = resultatFiscal * config.specificTaxes!.isBracket1Rate / 100;
    } else if (resultatFiscal <= bracket2Limit) {
      isCalcule = bracket1Limit * config.specificTaxes!.isBracket1Rate / 100 +
        (resultatFiscal - bracket1Limit) * config.specificTaxes!.isBracket2Rate / 100;
    } else {
      isCalcule = bracket1Limit * config.specificTaxes!.isBracket1Rate / 100 +
        (bracket2Limit - bracket1Limit) * config.specificTaxes!.isBracket2Rate / 100 +
        (resultatFiscal - bracket2Limit) * config.specificTaxes!.isBracket3Rate / 100;
    }

    // Cotisation minimale (0.5% du CA avec minimum 3000 MAD)
    const cotisationMinimale = Math.max(config.specificTaxes!.cotisationMinimale, chiffreAffaires * 0.005);
    const isDu = Math.max(isCalcule, cotisationMinimale);

    const data = {
      periode: period,
      pays: 'MA',
      devise: config.currency,
      resultatComptable,
      chiffreAffaires,
      reintegrations,
      deductions,
      resultatFiscal,
      isCalcule,
      cotisationMinimale,
      isDu,
      acomptesVerses: 0,
      soldeAPayer: isDu,
      autorite: config.taxAuthority
    };

    const dueDate = new Date(parseInt(year) + 1, 2, 31); // 31 mars N+1

    const declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'IS_MAROC',
      standard: 'SCF',
      country: 'MA',
      period,
      dueDate,
      status: 'ready',
      companyId,
      data,
      validationErrors: [],
      warnings: [
        'Vérifier les réintégrations et déductions fiscales marocaines',
        'Les acomptes IS (25% de l\'IS N-1 × 4) doivent être saisis'
      ]
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
   * TUNISIE - TVA avec FODEC et TCL
   */
  async generateTVATunisia(companyId: string, period: string): Promise<FiscalDeclaration> {
    const config = MAGHREB_COUNTRIES.TN;
    const [year, month] = period.split('-');
    const startDate = new Date(`${year}-${month}-01`);
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = new Date(`${year}-${month}-${lastDay}`);

    const balances = await this.getAccountBalances(companyId, [], startDate, endDate);

    // Chiffre d'affaires
    const caTotal = this.sumAccountPrefix('70', balances, false);
    const caTaux19 = caTotal * 0.75;
    const caTaux13 = caTotal * 0.15;
    const caTaux7 = caTotal * 0.05;
    const caExonere = caTotal * 0.05;

    // TVA collectée
    const tva19 = caTaux19 * 19 / 100;
    const tva13 = caTaux13 * 13 / 100;
    const tva7 = caTaux7 * 7 / 100;
    const totalTvaCollectee = tva19 + tva13 + tva7;

    // TVA déductible
    const tvaDeductible = this.sumAccountPrefix('4366', balances);

    // TVA nette
    const tvaNette = totalTvaCollectee - tvaDeductible;
    const tvaAPayer = tvaNette > 0 ? tvaNette : 0;
    const creditTva = tvaNette < 0 ? Math.abs(tvaNette) : 0;

    // FODEC (Fonds de Développement de la Compétitivité) - 1%
    const fodec = caTotal * config.specificTaxes!.fodec / 100;

    // TCL (Taxe sur les Établissements à Caractère Industriel) - 0.2%
    const tcl = caTotal * config.specificTaxes!.tcl / 100;

    const data = {
      periode: period,
      pays: 'TN',
      devise: config.currency,
      // CA
      caTaux19,
      caTaux13,
      caTaux7,
      caExonere,
      caTotal,
      // TVA
      tva19,
      tva13,
      tva7,
      totalTvaCollectee,
      tvaDeductible,
      tvaNette,
      tvaAPayer,
      creditTva,
      // Taxes additionnelles
      fodec,
      tcl,
      // Total
      totalAPayer: tvaAPayer + fodec + tcl,
      autorite: config.taxAuthority
    };

    const dueDate = new Date(parseInt(year), parseInt(month), 28);

    const declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'TVA_TUNISIE',
      standard: 'SCF',
      country: 'TN',
      period,
      dueDate,
      status: 'ready',
      companyId,
      data,
      validationErrors: [],
      warnings: ['La répartition du CA par taux TVA est estimée']
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
