// @ts-nocheck
import React from 'react';
import { Languages, Globe, Check } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

const LANGUAGE_DATA = {
  'fr': { flag: '🇫🇷', region: 'Europe', currency: 'EUR' },
  'fr-BJ': { flag: '🇧🇯', region: 'West Africa', currency: 'XOF' },
  'fr-CI': { flag: '🇨🇮', region: 'West Africa', currency: 'XOF' },
  'fr-BF': { flag: '🇧🇫', region: 'West Africa', currency: 'XOF' },
  'fr-ML': { flag: '🇲🇱', region: 'West Africa', currency: 'XOF' },
  'fr-SN': { flag: '🇸🇳', region: 'West Africa', currency: 'XOF' },
  'fr-TG': { flag: '🇹🇬', region: 'West Africa', currency: 'XOF' },
  'en': { flag: '🇺🇸', region: 'North America', currency: 'USD' },
  'en-GB': { flag: '🇬🇧', region: 'Europe', currency: 'GBP' },
  'en-CA': { flag: '🇨🇦', region: 'North America', currency: 'CAD' },
  'es': { flag: '🇪🇸', region: 'Europe', currency: 'EUR' }
} as const;

type LanguageCode = keyof typeof LANGUAGE_DATA;

interface LanguageInfo {
  code: string;
  name: string;
  nameKey: string;
  flag: string;
  region: string;
  currency: string;
}

interface LanguageToggleProps {
  variant?: 'icon' | 'button';
  showLabel?: boolean;
  className?: string;
}

export function LanguageToggle({ variant = 'icon', showLabel = false, className = '' }: LanguageToggleProps) {
  const { setLocale, t, supportedLocales, locale: currentLocale } = useLocale();

  const groupedLocales = supportedLocales.reduce<Record<string, LanguageInfo[]>>((groups, lang) => {
    const langCode = lang.code as LanguageCode;
    const langData = LANGUAGE_DATA[langCode] || { region: 'Other', flag: '🏳️', currency: 'XXX' };
    const region = langData.region;
    if (!groups[region]) {
      groups[region] = [];
    }
    groups[region].push({ ...lang, ...langData });
    return groups;
  }, {});

  const currentLangData = LANGUAGE_DATA[currentLocale as LanguageCode] || {};
  const currentLangInfo = supportedLocales.find(lang => lang.code === currentLocale);

  if (variant === 'button' && showLabel) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={`flex items-center gap-2 ${className}`}>
            <Globe className="h-4 w-4" />
            {currentLangData.flag && <span>{currentLangData.flag}</span>}
            <span className="hidden sm:inline">{currentLangInfo?.name || 'Language'}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {Object.entries(groupedLocales).map(([region, languages]) => (
            <div key={region}>
              <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold">
                {region}
              </DropdownMenuLabel>
              {languages.map((lang) => (
                <DropdownMenuItem 
                  key={lang.code} 
                  onClick={() => setLocale(lang.code)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {lang.flag && <span>{lang.flag}</span>}
                    <span>{lang.name}</span>
                    {lang.region === 'West Africa' && (
                      <Badge variant="secondary" className="text-xs">
                        CFA
                      </Badge>
                    )}
                  </div>
                  {currentLocale === lang.code && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default icon variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className={className}>
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t('language', { defaultValue: 'Language' })}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {Object.entries(groupedLocales).map(([region, languages]) => (
          <div key={region}>
            <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold">
              {region}
            </DropdownMenuLabel>
            {languages.map((lang) => (
              <DropdownMenuItem 
                key={lang.code} 
                onClick={() => setLocale(lang.code)}
                className="flex items-center justify-between"
                disabled={currentLocale === lang.code}
              >
                <div className="flex items-center gap-2">
                  {lang.flag && <span>{lang.flag}</span>}
                  <span>{lang.name}</span>
                  {lang.region === 'West Africa' && (
                    <Badge variant="secondary" className="text-xs">
                      CFA
                    </Badge>
                  )}
                </div>
                {currentLocale === lang.code && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}