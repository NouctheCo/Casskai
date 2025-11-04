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
