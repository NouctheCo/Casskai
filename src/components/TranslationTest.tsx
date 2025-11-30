import React from 'react';
import { useTranslation } from 'react-i18next';

const TranslationTest: React.FC = () => {
  const { t, i18n } = useTranslation();

  const testKeys = [
    'invoicing.title',
    'invoicing.subtitle',
    'invoicing.tabs.overview',
    'invoicing.tabs.invoices',
    'invoicing.tabs.quotes',
    'invoicing.tabs.clients',
    'invoicing.tabs.payments',
    'invoicing.kpis.revenue',
    'invoicing.kpis.paidInvoices',
    'invoicing.quickActions.newInvoice'
  ];

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Test des traductions - Langue actuelle: {i18n.language}</h2>
      <div className="space-y-2">
        {testKeys.map(key => (
          <div key={key} className="flex justify-between">
            <span className="font-mono text-sm">{key}:</span>
            <span className="text-blue-600">{t(key, `FALLBACK: ${key}`)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <button
          onClick={() => i18n.changeLanguage('fr')}
          className="mr-2 px-3 py-1 bg-blue-500 text-white rounded"
        >
          FR
        </button>
        <button
          onClick={() => i18n.changeLanguage('en')}
          className="mr-2 px-3 py-1 bg-green-500 text-white rounded"
        >
          EN
        </button>
        <button
          onClick={() => i18n.changeLanguage('es')}
          className="px-3 py-1 bg-red-500 text-white rounded"
        >
          ES
        </button>
      </div>
    </div>
  );
};

export default TranslationTest;