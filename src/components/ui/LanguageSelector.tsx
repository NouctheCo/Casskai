import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';
import { SUPPORTED_LOCALES, changeLanguageAndDetectCountry } from '@/i18n/i18n';
import { useLocale } from '@/contexts/LocaleContext';

interface LanguageSelectorProps {
  variant?: 'select' | 'dropdown' | 'button';
  showFlag?: boolean;
  showCountry?: boolean;
  compact?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'select',
  showFlag = true,
  showCountry = false,
  compact = false,
  className = ''
}) => {
  const { i18n } = useTranslation();
  const { locale: currentLanguage, setLocale } = useLocale();

  const handleLanguageChange = async (languageCode: string) => {
    try {
      // Mettre à jour à la fois i18n et le LocaleContext
      setLocale(languageCode);
      await changeLanguageAndDetectCountry(languageCode);
    } catch (error) {
      console.error('Failed to change language:', error instanceof Error ? error.message : String(error));
    }
  };

  const getDisplayName = (locale: any, code: string) => {
    if (compact) {
      return showFlag ? locale.flag : code.toUpperCase();
    }
    
    if (showCountry && locale.country) {
      return `${showFlag ? `${locale.flag  } ` : ''}${locale.name}`;
    }
    
    return `${showFlag ? `${locale.flag  } ` : ''}${locale.name}`;
  };

  const currentLocale = SUPPORTED_LOCALES[currentLanguage as keyof typeof SUPPORTED_LOCALES] || SUPPORTED_LOCALES.fr;

  if (variant === 'select') {
    return (
      <Select value={currentLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger className={`w-auto min-w-[140px] ${className}`}>
          <SelectValue>
            <div className="flex items-center gap-2">
              {showFlag && <span>{currentLocale.flag}</span>}
              <span className={compact ? 'text-sm' : ''}>{currentLocale.name}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SUPPORTED_LOCALES).map(([code, locale]) => (
            <SelectItem key={code} value={code}>
              <div className="flex items-center gap-2">
                {showFlag && <span>{locale.flag}</span>}
                <span>{getDisplayName(locale, code)}</span>
                {code === currentLanguage && <Check className="h-4 w-4 ml-auto text-primary" />}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={compact ? 'sm' : 'default'} className={className}>
            <Globe className="h-4 w-4 mr-2" />
            {showFlag && <span className="mr-1">{currentLocale.flag}</span>}
            {!compact && <span>{currentLocale.name}</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {Object.entries(SUPPORTED_LOCALES).map(([code, locale]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => handleLanguageChange(code)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {showFlag && <span>{locale.flag}</span>}
                <span>{getDisplayName(locale, code)}</span>
              </div>
              {code === currentLanguage && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'button') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {Object.entries(SUPPORTED_LOCALES).map(([code, locale]) => (
          <Button
            key={code}
            variant={code === currentLanguage ? 'default' : 'outline'}
            size={compact ? 'sm' : 'default'}
            onClick={() => handleLanguageChange(code)}
            className="flex items-center gap-1"
          >
            {showFlag && <span>{locale.flag}</span>}
            <span className={compact ? 'text-xs' : 'text-sm'}>
              {compact ? code.split('-')[0].toUpperCase() : locale.name}
            </span>
          </Button>
        ))}
      </div>
    );
  }

  return null;
};

// Hook for easy access to current locale information
export const useCurrentLocale = () => {
  const { i18n } = useTranslation();
  const { locale: currentLanguage, setLocale } = useLocale();
  const currentLocale = SUPPORTED_LOCALES[currentLanguage as keyof typeof SUPPORTED_LOCALES] || SUPPORTED_LOCALES.fr;
  
  const changeLanguage = async (languageCode: string) => {
    try {
      setLocale(languageCode);
      await changeLanguageAndDetectCountry(languageCode);
    } catch (error) {
      console.error('Failed to change language:', error instanceof Error ? error.message : String(error));
    }
  };
  
  return {
    code: currentLanguage,
    locale: currentLocale,
    changeLanguage,
    isRTL: false, // None of our supported languages are RTL currently
    formatCurrency: (amount: number) => {
      const currency = currentLocale.currency;
      return new Intl.NumberFormat(currentLanguage, {
        style: 'currency',
        currency
      }).format(amount);
    },
    formatDate: (date: Date | string) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat(currentLanguage).format(dateObj);
    },
    formatNumber: (number: number) => {
      return new Intl.NumberFormat(currentLanguage).format(number);
    }
  };
};

// Regional language groups for better organization
export const LanguageGroups = {
  'Europe': ['fr', 'en-GB', 'es'],
  'North America': ['en', 'en-CA'],
  'West Africa': ['fr-BJ', 'fr-CI', 'fr-BF', 'fr-ML', 'fr-SN', 'fr-TG'],
} as const;

// Advanced language selector with regional grouping
export const RegionalLanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = ''
}) => {
  const { i18n } = useTranslation();
  const { locale: currentLanguage, setLocale } = useLocale();

  const handleLanguageChange = async (languageCode: string) => {
    try {
      // Mettre à jour à la fois i18n et le LocaleContext
      setLocale(languageCode);
      await changeLanguageAndDetectCountry(languageCode);
    } catch (error) {
      console.error('Failed to change language:', error instanceof Error ? error.message : String(error));
    }
  };

  const currentLocale = SUPPORTED_LOCALES[currentLanguage as keyof typeof SUPPORTED_LOCALES] || SUPPORTED_LOCALES.fr;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className}>
          <Globe className="h-4 w-4 mr-2" />
          <span className="mr-1">{currentLocale.flag}</span>
          <span>{currentLocale.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {Object.entries(LanguageGroups).map(([region, languageCodes]) => (
          <div key={region}>
            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
              {region}
            </div>
            {languageCodes.map((code) => {
              const locale = SUPPORTED_LOCALES[code];
              if (!locale) return null;
              
              return (
                <DropdownMenuItem
                  key={code}
                  onClick={() => handleLanguageChange(code)}
                  className="flex items-center justify-between pl-4"
                >
                  <div className="flex items-center gap-2">
                    <span>{locale.flag}</span>
                    <span>{locale.name}</span>
                    {locale.region === 'west-africa' && (
                      <Badge variant="secondary" className="text-xs">
                        CFA
                      </Badge>
                    )}
                  </div>
                  {code === currentLanguage && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              );
            })}
            <div className="h-px bg-border my-1" />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;