import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/contexts/LocaleContext';
import { countries, currencies } from '@/lib/formData';

const CompanyFormSection = ({
  companyName,
  setCompanyName,
  companyCountry,
  setCompanyCountry,
  companyCurrency,
  setCompanyCurrency,
  isLoading
}) => {
  const { t } = useLocale();

  return (
    <div className="space-y-4">
      <hr className="my-4 border-border" />
      <h2 className="text-lg font-semibold text-foreground">
        {t('companyInformationTitle', { defaultValue: 'Company Information' })}
      </h2>

      <div>
        <Label htmlFor="companyName">
          {t('companyNameLabel', { defaultValue: 'Company Name' })}
        </Label>
        <Input
          id="companyName"
          type="text"
          placeholder={t('companyNamePlaceholder', { defaultValue: 'e.g. Financia SAS' })}
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="companyCountry">
          {t('companyCountryLabel', { defaultValue: 'Country' })}
        </Label>
        <select
          id="companyCountry"
          value={companyCountry}
          onChange={(e) => setCompanyCountry(e.target.value)}
          required
          disabled={isLoading}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {countries.map(({ code, name }) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="companyCurrency">
          {t('companyCurrencyLabel', { defaultValue: 'Currency' })}
        </Label>
        <select
          id="companyCurrency"
          value={companyCurrency}
          onChange={(e) => setCompanyCurrency(e.target.value)}
          required
          disabled={isLoading}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {currencies.map(({ code, name }) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default CompanyFormSection;
