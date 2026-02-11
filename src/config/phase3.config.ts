/**
 * PHASE 3 Configuration File
 * Central configuration for all PHASE 3 services and components
 */

export const PHASE3_CONFIG = {
  // Feature flags
  PHASE3_ENABLED: true,
  VALIDATION_ENABLED: true,
  AUTOMATIC_CALCULATION_ENABLED: true,
  FORMAT_SERVICE_ENABLED: true,
  TAX_CALENDAR_ENABLED: true,

  // Service timeouts (in milliseconds)
  VALIDATION_TIMEOUT: 5000,
  CALCULATION_TIMEOUT: 3000,
  FORMAT_TIMEOUT: 2000,

  // Database configuration
  DATABASE: {
    TABLES: {
      COUNTRY_CONFIGS: 'country_workflow_configs',
      TAX_DEADLINES: 'tax_deadlines',
      CALCULATED_AUDIT: 'calculated_fields_audit',
      VALIDATION_RULES: 'validation_rules_by_country',
    },
    BATCH_SIZE: 100,
    CACHE_TTL: 3600000, // 1 hour
  },

  // Countries configuration
  COUNTRIES: {
    FR: {
      name: 'France',
      code: 'FR',
      standard: 'PCG',
      currency: 'EUR',
      language: 'fr',
      timezone: 'Europe/Paris',
      enabled: true,
    },
    SN: {
      name: 'Senegal',
      code: 'SN',
      standard: 'SYSCOHADA',
      currency: 'XOF',
      language: 'fr',
      timezone: 'Africa/Dakar',
      enabled: true,
    },
    CI: {
      name: 'Ivory Coast',
      code: 'CI',
      standard: 'SYSCOHADA',
      currency: 'XOF',
      language: 'fr',
      timezone: 'Africa/Abidjan',
      enabled: true,
    },
    CM: {
      name: 'Cameroon',
      code: 'CM',
      standard: 'SYSCOHADA',
      currency: 'XAF',
      language: 'fr',
      timezone: 'Africa/Douala',
      enabled: true,
    },
    KE: {
      name: 'Kenya',
      code: 'KE',
      standard: 'IFRS',
      currency: 'KES',
      language: 'en',
      timezone: 'Africa/Nairobi',
      enabled: true,
    },
    NG: {
      name: 'Nigeria',
      code: 'NG',
      standard: 'IFRS',
      currency: 'NGN',
      language: 'en',
      timezone: 'Africa/Lagos',
      enabled: true,
    },
    DZ: {
      name: 'Algeria',
      code: 'DZ',
      standard: 'SCF',
      currency: 'DZD',
      language: 'fr',
      timezone: 'Africa/Algiers',
      enabled: true,
    },
    TN: {
      name: 'Tunisia',
      code: 'TN',
      standard: 'SCF',
      currency: 'TND',
      language: 'fr',
      timezone: 'Africa/Tunis',
      enabled: true,
    },
    MA: {
      name: 'Morocco',
      code: 'MA',
      standard: 'PCM',
      currency: 'MAD',
      language: 'fr',
      timezone: 'Africa/Casablanca',
      enabled: true,
    },
  },

  // Validation configuration
  VALIDATION: {
    BALANCE_SHEET: {
      TOLERANCE_PERCENTAGE: 0.01, // 1% tolerance for balance
      EQUITY_RATIO_MINIMUM: 0.1, // 10% minimum equity ratio
      REQUIRED_FIELDS: [
        'total_assets',
        'total_liabilities',
        'total_equity',
      ],
    },
    INCOME_STATEMENT: {
      DEPRECIATION_RATIO_MAX: 0.15, // 15% max depreciation
      REQUIRED_FIELDS: [
        'sales_revenue',
        'cost_of_goods_sold',
        'net_income',
      ],
    },
    CASH_FLOW: {
      REQUIRED_FIELDS: [
        'operating_cash_flow',
        'investing_cash_flow',
        'financing_cash_flow',
      ],
    },
  },

  // Calculation configuration
  CALCULATION: {
    DECIMAL_PLACES: 2,
    ENABLE_CACHING: true,
    CACHE_KEY_PREFIX: 'calc_',
    AUDIT_ENABLED: true,
    TRACK_DEPENDENCIES: true,
  },

  // Format configuration
  FORMAT: {
    SUPPORTED_FORMATS: ['xml', 'csv', 'json'],
    DEFAULT_FORMAT: 'xml',
    XML: {
      VERSION: '1.0',
      ENCODING: 'UTF-8',
      PRETTY_PRINT: true,
    },
    CSV: {
      DELIMITER: ',',
      QUOTE_CHAR: '"',
      ESCAPE_CHAR: '\\',
      INCLUDE_HEADERS: true,
    },
    JSON: {
      PRETTY_PRINT: true,
      INCLUDE_METADATA: true,
      INCLUDE_FORMATTING_RULES: true,
    },
  },

  // Tax calendar configuration
  TAX_CALENDAR: {
    ENABLE_DEADLINE_ALERTS: true,
    ALERT_THRESHOLD_DAYS: 7, // Alert when deadline is within 7 days
    CALCULATION_METHOD: 'formula', // 'formula' or 'date'
    FISCAL_YEAR_DEFAULTS: {
      START_MONTH: 0, // January
      START_DAY: 1,
      END_MONTH: 11, // December
      END_DAY: 31,
    },
  },

  // Export configuration
  EXPORT: {
    INCLUDE_AUDIT_TRAIL: false,
    INCLUDE_CALCULATION_FORMULAS: false,
    MAX_FILE_SIZE_MB: 10,
    ALLOWED_MIME_TYPES: [
      'application/xml',
      'text/csv',
      'application/json',
    ],
  },

  // Logging configuration
  LOGGING: {
    ENABLED: true,
    LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
    LOG_CALCULATIONS: true,
    LOG_VALIDATIONS: true,
    LOG_EXPORTS: true,
    EXTERNAL_LOGGER: null as null | Record<string, unknown>, // Can be set to external logger instance
  },

  // Error handling
  ERROR_HANDLING: {
    THROW_ON_VALIDATION_ERROR: false, // Return errors instead of throwing
    THROW_ON_CALCULATION_ERROR: false,
    THROW_ON_FORMAT_ERROR: false,
    DEFAULT_ERROR_MESSAGE: 'An error occurred. Please try again.',
  },

  // Performance configuration
  PERFORMANCE: {
    ENABLE_PROFILING: false,
    BATCH_PROCESSING: true,
    BATCH_SIZE: 50,
    USE_WORKERS: false, // Use web workers for calculations
  },

  // Security configuration
  SECURITY: {
    REQUIRE_AUTHENTICATION: true,
    REQUIRE_AUTHORIZATION: true,
    VALIDATE_COUNTRY_CODE: true,
    SANITIZE_INPUTS: true,
    MAX_DOCUMENT_SIZE_KB: 5000,
  },

  // API configuration
  API: {
    ENDPOINTS: {
      VALIDATE: '/api/regulatory/validate',
      CALCULATE: '/api/regulatory/calculate',
      FORMAT: '/api/regulatory/format',
      DEADLINES: '/api/regulatory/deadlines',
      HEALTH: '/api/health/phase3',
    },
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  },

  // UI Configuration
  UI: {
    DARK_MODE: false,
    SHOW_LOADING_SPINNER: true,
    SHOW_VALIDATION_DETAILS: true,
    SHOW_CALCULATION_FORMULAS: false,
    EXPORT_DEFAULT_FORMAT: 'xml',
    DEADLINE_ALERT_STYLE: 'warning', // 'warning', 'danger', 'info'
  },

  // Notifications
  NOTIFICATIONS: {
    ENABLED: true,
    SHOW_SUCCESS: true,
    SHOW_WARNINGS: true,
    SHOW_ERRORS: true,
    DURATION_MS: 5000,
  },

  // Development configuration
  DEVELOPMENT: {
    DEBUG_MODE: false,
    MOCK_DATA: false,
    VERBOSE_LOGGING: false,
    SKIP_VALIDATION: false,
    SKIP_CALCULATIONS: false,
  },
};

/**
 * Helper function to get country config
 */
export function getCountryConfig(countryCode: string) {
  return PHASE3_CONFIG.COUNTRIES[countryCode as keyof typeof PHASE3_CONFIG.COUNTRIES];
}

/**
 * Helper function to check if a country is enabled
 */
export function isCountryEnabled(countryCode: string): boolean {
  const config = getCountryConfig(countryCode);
  return config?.enabled || false;
}

/**
 * Helper function to get all enabled countries
 */
export function getEnabledCountries() {
  return Object.entries(PHASE3_CONFIG.COUNTRIES)
    .filter(([, config]) => config.enabled)
    .map(([, config]) => ({ ...config }));
}

/**
 * Helper function to get country name
 */
export function getCountryName(countryCode: string): string | null {
  return getCountryConfig(countryCode)?.name || null;
}

/**
 * Helper function to get country currency
 */
export function getCountryCurrency(countryCode: string): string | null {
  return getCountryConfig(countryCode)?.currency || null;
}

/**
 * Helper function to get country language
 */
export function getCountryLanguage(countryCode: string): string | null {
  return getCountryConfig(countryCode)?.language || null;
}

/**
 * Helper function to get supported format by country
 */
export function getSupportedFormatsForCountry(_countryCode: string) {
  // Some countries might have specific format requirements
  // This can be extended for country-specific formats
  return PHASE3_CONFIG.FORMAT.SUPPORTED_FORMATS;
}

/**
 * Helper function to get validation rules for country
 */
export function getValidationRulesForCountry(countryCode: string, documentType: string) {
  // This would typically fetch from database or constants
  // Placeholder for now
  return PHASE3_CONFIG.VALIDATION[documentType as keyof typeof PHASE3_CONFIG.VALIDATION];
}

/**
 * Helper function to check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof PHASE3_CONFIG): boolean {
  const value = PHASE3_CONFIG[feature];
  return value === true || (typeof value === 'object' && value !== null);
}

/**
 * Helper function to update configuration at runtime
 */
export function updateConfig(key: string, value: any) {
  const keys = key.split('.');
  let obj = PHASE3_CONFIG as any;
  
  for (let i = 0; i < keys.length - 1; i++) {
    obj = obj[keys[i]];
  }
  
  obj[keys[keys.length - 1]] = value;
}

/**
 * Helper function to get configuration value
 */
export function getConfigValue(key: string, defaultValue?: any): any {
  const keys = key.split('.');
  let obj = PHASE3_CONFIG as any;
  
  for (const k of keys) {
    if (obj && typeof obj === 'object' && k in obj) {
      obj = obj[k];
    } else {
      return defaultValue;
    }
  }
  
  return obj;
}

export default PHASE3_CONFIG;
