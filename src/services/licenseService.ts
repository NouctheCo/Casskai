// @ts-nocheck
// services/licenseService.ts
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
      console.error('Erreur validation licence:', error);
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
