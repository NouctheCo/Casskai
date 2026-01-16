/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 *
 * Factory pour les services fiscaux africains
 * Instancie le service approprié selon le standard comptable
 */

import { BaseFiscalService } from './BaseFiscalService';
import { SYSCOHADATaxComplianceService } from './SYSCOHADATaxComplianceService';
import { IFRSTaxComplianceService } from './IFRSTaxComplianceService';
import { SCFTaxComplianceService } from './SCFTaxComplianceService';
import type { FiscalStandard } from '../../types/fiscal.types';

/**
 * Mapping des pays vers leur standard comptable
 */
export const COUNTRY_TO_STANDARD: Record<string, FiscalStandard> = {
  // SYSCOHADA - 17 pays OHADA
  BJ: 'SYSCOHADA', // Bénin
  BF: 'SYSCOHADA', // Burkina Faso
  CM: 'SYSCOHADA', // Cameroun
  CF: 'SYSCOHADA', // République Centrafricaine
  KM: 'SYSCOHADA', // Comores
  CG: 'SYSCOHADA', // Congo-Brazzaville
  CI: 'SYSCOHADA', // Côte d'Ivoire
  GA: 'SYSCOHADA', // Gabon
  GW: 'SYSCOHADA', // Guinée-Bissau
  GQ: 'SYSCOHADA', // Guinée Équatoriale
  GN: 'SYSCOHADA', // Guinée
  ML: 'SYSCOHADA', // Mali
  NE: 'SYSCOHADA', // Niger
  CD: 'SYSCOHADA', // RD Congo
  SN: 'SYSCOHADA', // Sénégal
  TD: 'SYSCOHADA', // Tchad
  TG: 'SYSCOHADA', // Togo

  // IFRS - 4 pays anglophones
  NG: 'IFRS', // Nigeria
  KE: 'IFRS', // Kenya
  GH: 'IFRS', // Ghana
  ZA: 'IFRS', // South Africa

  // SCF/PCM - 3 pays Maghreb
  MA: 'SCF', // Maroc
  DZ: 'SCF', // Algérie
  TN: 'SCF', // Tunisie

  // Europe (pour compatibilité)
  FR: 'PCG', // France
  BE: 'PCG'  // Belgique
};

/**
 * Cache des instances de services pour éviter de les recréer
 */
const serviceCache = new Map<FiscalStandard, BaseFiscalService>();

/**
 * Factory pour obtenir le service fiscal approprié
 */
export class FiscalServiceFactory {
  /**
   * Obtient le service fiscal pour un standard donné
   */
  static getService(standard: FiscalStandard): BaseFiscalService {
    // Vérifier le cache
    if (serviceCache.has(standard)) {
      return serviceCache.get(standard)!;
    }

    // Créer une nouvelle instance
    let service: BaseFiscalService;

    switch (standard) {
      case 'SYSCOHADA':
        service = new SYSCOHADATaxComplianceService();
        break;

      case 'IFRS':
        service = new IFRSTaxComplianceService();
        break;

      case 'SCF':
        service = new SCFTaxComplianceService();
        break;

      case 'PCG':
        // Pour le PCG français, on pourrait créer un service dédié
        // Pour l'instant, on utilise SCF qui est similaire
        service = new SCFTaxComplianceService();
        break;

      default:
        throw new Error(`Standard comptable non supporté: ${standard}`);
    }

    // Mettre en cache
    serviceCache.set(standard, service);

    return service;
  }

  /**
   * Obtient le service fiscal pour un pays donné
   */
  static getServiceForCountry(countryCode: string): BaseFiscalService {
    const standard = COUNTRY_TO_STANDARD[countryCode];

    if (!standard) {
      throw new Error(`Pays non supporté: ${countryCode}`);
    }

    return this.getService(standard);
  }

  /**
   * Vérifie si un pays est supporté
   */
  static isCountrySupported(countryCode: string): boolean {
    return countryCode in COUNTRY_TO_STANDARD;
  }

  /**
   * Obtient le standard comptable pour un pays
   */
  static getStandardForCountry(countryCode: string): FiscalStandard | null {
    return COUNTRY_TO_STANDARD[countryCode] || null;
  }

  /**
   * Obtient la liste de tous les pays supportés
   */
  static getSupportedCountries(): string[] {
    return Object.keys(COUNTRY_TO_STANDARD);
  }

  /**
   * Obtient la liste des pays par standard
   */
  static getCountriesByStandard(standard: FiscalStandard): string[] {
    return Object.entries(COUNTRY_TO_STANDARD)
      .filter(([_, std]) => std === standard)
      .map(([country, _]) => country);
  }

  /**
   * Vide le cache des services (utile pour les tests)
   */
  static clearCache(): void {
    serviceCache.clear();
  }
}

/**
 * Fonction utilitaire pour générer rapidement une déclaration
 */
export async function generateFiscalDeclaration(
  type: 'balance_sheet' | 'income_statement' | 'vat' | 'corporate_tax',
  companyId: string,
  period: string,
  country: string
) {
  const service = FiscalServiceFactory.getServiceForCountry(country);

  switch (type) {
    case 'balance_sheet':
      return await service.generateBalanceSheet(companyId, period, country);

    case 'income_statement':
      return await service.generateIncomeStatement(companyId, period, country);

    case 'vat':
      return await service.generateVATDeclaration(companyId, period, country);

    case 'corporate_tax':
      return await service.generateCorporateTaxDeclaration(companyId, period, country);

    default:
      throw new Error(`Type de déclaration non supporté: ${type}`);
  }
}

/**
 * Fonction utilitaire pour lister les déclarations d'une entreprise
 */
export async function listCompanyDeclarations(
  companyId: string,
  country: string,
  _filters?: {
    type?: string;
    status?: string;
    year?: number;
  }
) {
  const service = FiscalServiceFactory.getServiceForCountry(country);

  void companyId;
  void service;

  // Utiliser la méthode protégée via une méthode publique
  // Note: Il faudrait ajouter une méthode publique dans BaseFiscalService
  // Pour l'instant, on retourne une erreur
  throw new Error('listCompanyDeclarations nécessite une méthode publique dans BaseFiscalService');
}
