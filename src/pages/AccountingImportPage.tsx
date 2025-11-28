import React from 'react';

import { AccountingImportExport } from '../components/accounting/AccountingImportExport';

import { useConfig } from '../hooks/useConfig';

import { useTranslation } from 'react-i18next';

import { toastSuccess, toastError } from '@/lib/toast-helpers';

import { PageContainer } from '../components/ui/PageContainer';



const AccountingImportPage: React.FC = () => {

  const { t } = useTranslation();

  const { config } = useConfig();

  

  const companyId = (config as any)?.currentCompany?.id;



  if (!companyId) {

    return (

      <div className="flex items-center justify-center h-64">

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

    toastSuccess(`${result.validRows} écritures importées avec succès`);

  };



  const handleError = (error: string) => {

    toastError(error);

  };



  return (

    <PageContainer variant="default">

      <AccountingImportExport

        companyId={companyId}

        onImportComplete={handleImportComplete}

        onError={handleError}

      />

    </PageContainer>

  );

};



export default AccountingImportPage;
