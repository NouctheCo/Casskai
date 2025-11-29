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

/**
 * Service selection based on environment
 * Use mock services in development/demo mode, real services in production
 */

import { stripeService as realStripeService } from './stripeService';
import { CleanupService } from './cleanupService';

// Check if we should use mock services
// const USE_MOCK_SERVICES = import.meta.env.VITE_USE_MOCK_SERVICES === 'true';

// Export the appropriate service
export const stripeService = realStripeService;
export { CleanupService };

export default {
  stripe: stripeService,
  cleanup: CleanupService
};
