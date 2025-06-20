import { useLocale } from '@/contexts/LocaleContext';
    import { useAuth } from '@/contexts/AuthContext'; // To get company's default currency/locale

    // Helper to map simple locale codes to more specific ones for Intl if needed
    const getExtendedLocale = (locale) => {
      const map = {
        en: 'en-US',
        fr: 'fr-FR',
        es: 'es-ES',
        // Add more as needed
      };
      return map[locale] || locale; 
    };

    export const useLocaleFormatter = () => {
      const { locale: currentLocaleContext } = useLocale();
      const { currentEnterpriseId, userCompanies } = useAuth();

      const getCompanyPreferences = () => {
        if (currentEnterpriseId && userCompanies?.length > 0) {
          const currentCompany = userCompanies.find(c => c.id === currentEnterpriseId);
          if (currentCompany) {
            return {
              locale: currentCompany.default_locale || currentLocaleContext,
              currency: currentCompany.default_currency || 'USD', // Default to USD if not set
              timezone: currentCompany.timezone // This would be used for date formatting if needed
            };
          }
        }
        // Fallback if no company selected or no specific preferences
        return {
          locale: currentLocaleContext,
          currency: 'USD', // Global fallback currency
          timezone: undefined
        };
      };
      
      const companyPrefs = getCompanyPreferences();
      const displayLocale = getExtendedLocale(companyPrefs.locale);

      const formatDate = (date, options) => {
        if (!date) return '';
        const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
        const defaultOptions = {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          ...options,
        };
        if (companyPrefs.timezone && !options?.timeZone) {
          defaultOptions.timeZone = companyPrefs.timezone;
        }
        try {
          return new Intl.DateTimeFormat(displayLocale, defaultOptions).format(dateObj);
        } catch (e) {
          console.warn(`Error formatting date with locale ${displayLocale}:`, e);
          return new Intl.DateTimeFormat(getExtendedLocale('en'), defaultOptions).format(dateObj); // Fallback to en-US
        }
      };

      const formatTime = (date, options) => {
        if (!date) return '';
        const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
        const defaultOptions = {
          hour: '2-digit',
          minute: '2-digit',
          ...options,
        };
         if (companyPrefs.timezone && !options?.timeZone) {
          defaultOptions.timeZone = companyPrefs.timezone;
        }
        try {
          return new Intl.DateTimeFormat(displayLocale, defaultOptions).format(dateObj);
        } catch (e) {
          console.warn(`Error formatting time with locale ${displayLocale}:`, e);
          return new Intl.DateTimeFormat(getExtendedLocale('en'), defaultOptions).format(dateObj);
        }
      };

      const formatNumber = (number, options) => {
        if (typeof number !== 'number') return '';
        const defaultOptions = {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          ...options,
        };
        try {
          return new Intl.NumberFormat(displayLocale, defaultOptions).format(number);
        } catch (e) {
          console.warn(`Error formatting number with locale ${displayLocale}:`, e);
          return new Intl.NumberFormat(getExtendedLocale('en'), defaultOptions).format(number);
        }
      };

      const formatCurrency = (amount, currencyCode, options) => {
        if (typeof amount !== 'number') return '';
        const targetCurrency = currencyCode || companyPrefs.currency;
        const defaultOptions = {
          style: 'currency',
          currency: targetCurrency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          ...options,
        };
        try {
          return new Intl.NumberFormat(displayLocale, defaultOptions).format(amount);
        } catch (e) {
          console.warn(`Error formatting currency ${targetCurrency} with locale ${displayLocale}:`, e);
          // Fallback to USD and en-US locale
          return new Intl.NumberFormat(getExtendedLocale('en'), { ...defaultOptions, currency: 'USD' }).format(amount);
        }
      };

      return { formatDate, formatTime, formatNumber, formatCurrency, companyLocale: companyPrefs.locale, companyCurrency: companyPrefs.currency, companyTimezone: companyPrefs.timezone };
    };