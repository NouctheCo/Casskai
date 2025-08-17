/**
 * Service selection based on environment
 * Use mock services in development/demo mode, real services in production
 */

import { stripeService as realStripeService } from './stripeService';
import { stripeService as mockStripeService } from './stripeService.mock';

// Check if we should use mock services
const USE_MOCK_SERVICES = import.meta.env.VITE_USE_MOCK_SERVICES === 'true';

// Export the appropriate service
export const stripeService = USE_MOCK_SERVICES ? mockStripeService : realStripeService;

export default {
  stripe: stripeService
};