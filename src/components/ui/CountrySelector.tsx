import React from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getAllSupportedCountries, getAfricanCountries, MarketPricing } from '@/services/marketPricingService';
import { useTranslation } from 'react-i18next';

interface CountrySelectorProps {
  selectedCountry: string;
  onCountryChange: (countryCode: string) => void;
  className?: string;
  showAfricanFirst?: boolean;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  selectedCountry,
  onCountryChange,
  className = "",
  showAfricanFirst = true
}) => {
  const { t } = useTranslation();
  
  const allCountries = getAllSupportedCountries();
  const africanCountries = getAfricanCountries();
  const otherCountries = allCountries.filter(country => 
    !africanCountries.some(african => african.countryCode === country.countryCode)
  );
  
  const selectedCountryData = allCountries.find(country => country.countryCode === selectedCountry);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        {t('landing.pricing.selectCountry', 'Sélectionnez votre pays')}
      </label>
      
      <Select value={selectedCountry} onValueChange={onCountryChange}>
        <SelectTrigger className="w-80 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-200">
          <SelectValue>
            <motion.div 
              className="flex items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <span className="mr-3 text-2xl">
                {selectedCountryData?.flag || '🌍'}
              </span>
              <div className="flex flex-col items-start">
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedCountryData?.countryName || 'Sélectionner un pays'}
                </span>
                {selectedCountryData && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('landing.pricing.pricesIn', 'Prix en')} {selectedCountryData.currencySymbol}
                  </span>
                )}
              </div>
            </motion.div>
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent className="max-h-80 overflow-y-auto">
          {/* Section Afrique */}
          {showAfricanFirst && africanCountries.length > 0 && (
            <>
              <div className="px-2 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700">
                🌍 Afrique
              </div>
              
              {/* Afrique de l'Ouest francophone */}
              <div className="px-2 py-1 text-xs text-gray-400">
                Afrique de l'Ouest francophone
              </div>
              {africanCountries
                .filter(country => country.region === 'west-africa' && country.language === 'fr')
                .map((country) => (
                <CountrySelectItem key={country.countryCode} country={country} />
              ))}
              
              {/* Afrique Centrale francophone */}
              <div className="px-2 py-1 text-xs text-gray-400 mt-2">
                Afrique Centrale francophone  
              </div>
              {africanCountries
                .filter(country => country.region === 'central-africa' && country.language === 'fr')
                .map((country) => (
                <CountrySelectItem key={country.countryCode} country={country} />
              ))}
              
              {/* Afrique anglophone */}
              <div className="px-2 py-1 text-xs text-gray-400 mt-2">
                Afrique anglophone
              </div>
              {africanCountries
                .filter(country => country.language === 'en')
                .map((country) => (
                <CountrySelectItem key={country.countryCode} country={country} />
              ))}
              
              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
            </>
          )}
          
          {/* Section Autres pays */}
          <div className="px-2 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            🌐 Autres pays
          </div>
          {otherCountries.map((country) => (
            <CountrySelectItem key={country.countryCode} country={country} />
          ))}
        </SelectContent>
      </Select>
      
      {/* Indication de devise */}
      {selectedCountryData && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-3"
        >
          <Badge 
            variant="secondary" 
            className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
          >
            {t('landing.pricing.pricesIn', 'Prix affichés en')} {selectedCountryData.currencySymbol}
            <span className="ml-2 opacity-60">
              ({selectedCountryData.currency})
            </span>
          </Badge>
        </motion.div>
      )}
    </div>
  );
};

// Composant pour un élément de pays dans la liste
const CountrySelectItem: React.FC<{ country: MarketPricing }> = ({ country }) => {
  return (
    <SelectItem 
      value={country.countryCode} 
      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      <motion.div 
        className="flex items-center justify-between w-full"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <div className="flex items-center">
          <span className="mr-3 text-xl">{country.flag}</span>
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-white">
              {country.countryName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {country.currency}
            </span>
          </div>
        </div>
        <Badge 
          variant="outline" 
          className="text-xs px-2 py-0.5 ml-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
        >
          {country.currencySymbol}
        </Badge>
      </motion.div>
    </SelectItem>
  );
};

export default CountrySelector;