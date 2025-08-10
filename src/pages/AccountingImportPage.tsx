import React from 'react';
import { AccountingImportExport } from '../components/accounting/AccountingImportExport';
import { useConfig } from '../hooks/useConfig';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/ui/use-toast';

const AccountingImportPage: React.FC = () => {
  const { t } = useTranslation();
  const { config } = useConfig();
  const { toast } = useToast();
  
  const companyId = config?.currentCompany?.id;

  if (!companyId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t('common.noCompanySelected')}
          </h2>
          <p className="text-gray-600">
            Veuillez sélectionner une entreprise pour accéder aux fonctionnalités d'import.
          </p>
        </div>
      </div>
    );
  }

  const handleImportComplete = (result: any) => {
    toast({
      title: t('messages.importSuccess'),
      description: `${result.validRows} écritures importées avec succès`,
      variant: 'default'
    });
  };

  const handleError = (error: string) => {
    toast({
      title: t('common.error'),
      description: error,
      variant: 'destructive'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AccountingImportExport
        companyId={companyId}
        onImportComplete={handleImportComplete}
        onError={handleError}
      />
    </div>
  );
};

export default AccountingImportPage;