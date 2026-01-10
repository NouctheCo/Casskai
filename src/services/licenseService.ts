/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */
// services/licenseService.ts
import { LicenseType, LicenseFeatures, LicenseLimits } from '../types/licensing';
import { LICENSE_PLANS } from '../data/licensePlans';
import { logger } from '@/lib/logger';
export class LicenseService {
  private static instance: LicenseService;
  private currentLicense: LicenseType | null = null;
  static getInstance(): LicenseService {
    if (!LicenseService.instance) {
      LicenseService.instance = new LicenseService();
    }
    return LicenseService.instance;
  }
  async validateLicense(licenseKey: string): Promise<boolean> {
    try {
      // Validation côté serveur du licensing
      const response = await fetch('/api/license/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey })
      });
      if (response.ok) {
        const licenseData = await response.json();
        this.currentLicense = licenseData.plan;
        return true;
      }
      return false;
    } catch (error) {
      logger.error('License', 'Erreur validation licence:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }
  getCurrentLicense(): LicenseType | null {
    return this.currentLicense;
  }
  canAccessFeature(feature: keyof LicenseFeatures): boolean {
    if (!this.currentLicense) return false;
    return this.currentLicense.features[feature];
  }
  isWithinLimit(limit: keyof LicenseLimits, currentValue: number): boolean {
    if (!this.currentLicense) return false;
    const limitValue = this.currentLicense.limits[limit];
    if (typeof limitValue === 'number') {
      return limitValue === -1 || currentValue <= limitValue;
    }
    return true;
  }
  getLicensePlans(): LicenseType[] {
    return LICENSE_PLANS;
  }
  calculatePrice(planId: string, duration: 'monthly' | 'yearly'): number {
    const plan = LICENSE_PLANS.find(p => p.id === planId);
    if (!plan) return 0;
    let price = plan.price;
    if (duration === 'yearly') {
      price = price * 12 * 0.85; // 15% de réduction annuelle
    }
    return Math.round(price);
  }
}