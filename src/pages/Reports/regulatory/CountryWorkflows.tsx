/**
 * CassKai - Country Workflows Component
 * PHASE 3: UI for country-specific validations and calculations
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CountryValidationService } from '@/services/regulatory/countryValidationService';
import { CountryFormatService } from '@/services/regulatory/countryFormatService';
import { AutomaticCalculationService } from '@/services/regulatory/automaticCalculationService';
import { TaxCalendarService } from '@/constants/taxCalendars';
import { COUNTRY_WORKFLOWS } from '@/constants/countryWorkflows';
import { logger } from '@/lib/logger';
interface CountryWorkflowsProps {
  documentData: any;
  documentType: string;
  country: string;
  accountingStandard: string;
  onValidationComplete?: (result: any) => void;
}
export const CountryWorkflows: React.FC<CountryWorkflowsProps> = ({
  documentData,
  documentType,
  country,
  accountingStandard,
  onValidationComplete,
}) => {
  const { t } = useTranslation();
  const [validationResult, setValidationResult] = useState<any>(null);
  const [calculatedData, setCalculatedData] = useState<any>(null);
  const [financialRatios, setFinancialRatios] = useState<any>(null);
  const [formatRules, setFormatRules] = useState<any>(null);
  const [nextDeadline, setNextDeadline] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  // Run validations and calculations on data change
  useEffect(() => {
    if (!documentData || !country) return;
    runWorkflowAnalysis();
  }, [documentData, country, documentType]);
  const runWorkflowAnalysis = async () => {
    setLoading(true);
    try {
      // 1. Validate document
      const validation = CountryValidationService.validateDocument(
        documentData,
        documentType,
        country,
        accountingStandard
      );
      setValidationResult(validation);
      // 2. Calculate derived fields
      const calculations = AutomaticCalculationService.calculateAllDerivedFields(
        documentData,
        {
          documentType,
          country,
          accountingStandard,
          fiscalYear: documentData.fiscal_year || new Date().getFullYear(),
          fiscalPeriod: documentData.fiscal_period || 'ANNUAL',
        }
      );
      setCalculatedData(calculations.data);
      // 3. Calculate financial ratios
      const ratios = CountryValidationService.calculateFinancialRatios(
        calculations.data
      );
      setFinancialRatios(ratios);
      // 4. Get format rules
      const rules = CountryFormatService.getFormattingRules(country);
      setFormatRules(rules);
      // 5. Get next deadline
      const fiscalYearEnd = new Date(
        documentData.fiscal_year || new Date().getFullYear(),
        11,
        31
      );
      const deadline = TaxCalendarService.calculateNextDeadline(country, fiscalYearEnd);
      setNextDeadline(deadline);
      onValidationComplete?.(validation);
    } catch (error) {
      logger.error('CountryWorkflows', 'Workflow analysis error:', error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
        <span className="ml-4">{t('regulatory.loading')}</span>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Validation Results */}
      {validationResult && (
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 mr-2">
              ✓
            </span>
            {t('regulatory.validation_results')}
          </h3>
          {/* Errors */}
          {validationResult.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-red-700 mb-2">
                {t('regulatory.validation_errors')} ({validationResult.errors.length})
              </h4>
              <div className="space-y-2">
                {validationResult.errors.map((error: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm"
                  >
                    <div className="font-medium">{error.code}</div>
                    <div>{error.message}</div>
                    {error.field && <div className="text-xs mt-1">Field: {error.field}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Warnings */}
          {validationResult.warnings.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-yellow-700 mb-2">
                {t('regulatory.warnings')} ({validationResult.warnings.length})
              </h4>
              <div className="space-y-2">
                {validationResult.warnings.map((warning: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm"
                  >
                    <div className="font-medium">{warning.code}</div>
                    <div>{warning.message}</div>
                    {warning.suggestedAction && (
                      <div className="text-xs mt-1">Action: {warning.suggestedAction}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Info */}
          {validationResult.info.length > 0 && (
            <div>
              <h4 className="font-medium text-green-700 mb-2">
                {t('regulatory.info')}
              </h4>
              <div className="space-y-2">
                {validationResult.info.map((info: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm"
                  >
                    <div>{info.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Financial Ratios */}
      {financialRatios && Object.keys(financialRatios).length > 0 && (
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            {t('regulatory.financial_ratios')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(financialRatios).map(([key, ratio]: [string, any]) => (
              <div
                key={key}
                className={`p-4 rounded border-l-4 ${
                  ratio.status === 'optimal'
                    ? 'bg-green-50 border-green-500'
                    : ratio.status === 'warning'
                      ? 'bg-yellow-50 border-yellow-500'
                      : ratio.status === 'critical'
                        ? 'bg-red-50 border-red-500'
                        : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="font-medium text-sm text-gray-700 mb-1">
                  {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {typeof ratio.value === 'number'
                    ? (ratio.value * 100 > 1
                        ? ratio.value.toFixed(2)
                        : `${(ratio.value * 100).toFixed(1)  }%`
                      )
                    : ratio.value}
                </div>
                <div className="text-xs text-gray-600">{ratio.message}</div>
                <div className="mt-2">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      ratio.status === 'optimal'
                        ? 'bg-green-200 text-green-800'
                        : ratio.status === 'warning'
                          ? 'bg-yellow-200 text-yellow-800'
                          : ratio.status === 'critical'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-blue-200 text-blue-800'
                    }`}
                  >
                    {ratio.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Format Rules */}
      {formatRules && (
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            {t('regulatory.formatting_rules')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm font-medium text-gray-700 mb-2">
                {t('regulatory.number_format')}
              </div>
              <div className="text-xs space-y-1 text-gray-600">
                <div>
                  Decimal: <span className="font-mono">{formatRules.number.decimalSeparator}</span>
                </div>
                <div>
                  Thousands: <span className="font-mono">{formatRules.number.thousandsSeparator}</span>
                </div>
                <div>
                  Example: <span className="font-mono">
                    {CountryFormatService.formatNumber(1234567.89, country, true)}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm font-medium text-gray-700 mb-2">
                {t('regulatory.date_format')}
              </div>
              <div className="text-xs space-y-1 text-gray-600">
                <div>
                  Format: <span className="font-mono">{formatRules.date.format}</span>
                </div>
                <div>
                  Example: <span className="font-mono">
                    {CountryFormatService.formatDate(new Date(), country)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Next Deadline */}
      {nextDeadline && (
        <div className="border rounded-lg p-6 bg-blue-50 border-blue-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-blue-900">
            {t('regulatory.next_deadline')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-blue-700 font-medium mb-1">
                {nextDeadline.deadline.description}
              </div>
              <div className="text-2xl font-bold text-blue-900 mb-2">
                {nextDeadline.deadline.taxType}
              </div>
              <div className="text-sm text-blue-700">
                Authority: <span className="font-medium">{nextDeadline.deadline.authority}</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-blue-700 font-medium mb-1">
                {t('regulatory.due_date')}
              </div>
              <div className="text-2xl font-bold text-blue-900 mb-2">
                {CountryFormatService.formatDate(nextDeadline.dueDate, country)}
              </div>
              <div className={`text-sm font-medium ${
                nextDeadline.daysRemaining <= 7 && nextDeadline.daysRemaining > 0
                  ? 'text-red-700'
                  : 'text-blue-700'
              }`}>
                {nextDeadline.daysRemaining} days remaining
              </div>
            </div>
          </div>
          {nextDeadline.deadline.penalties && (
            <div className="mt-4 p-3 bg-blue-100 rounded text-sm text-blue-900">
              <strong>Penalties:</strong> {nextDeadline.deadline.penalties.firstDay} on first day,
              then {nextDeadline.deadline.penalties.perDay}/day
            </div>
          )}
        </div>
      )}
      {/* Export Options */}
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <h3 className="text-lg font-semibold mb-4">
          {t('regulatory.export_options')}
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() =>
              downloadExport(
                CountryFormatService.exportAsXML(calculatedData, country, documentType),
                country
              )
            }
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            Export XML
          </button>
          <button
            onClick={() =>
              downloadExport(
                CountryFormatService.exportAsCSV(calculatedData, country, documentType),
                country
              )
            }
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
          >
            Export CSV
          </button>
          <button
            onClick={() =>
              downloadExport(
                CountryFormatService.exportAsJSON(calculatedData, country, documentType),
                country
              )
            }
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-medium"
          >
            Export JSON
          </button>
        </div>
      </div>
    </div>
  );
};
/**
 * Helper function to download exported document
 */
function downloadExport(formatted: any, country: string) {
  const download = CountryFormatService.getDownloadContent(formatted);
  const element = document.createElement('a');
  element.setAttribute('href', `data:${download.mimeType};charset=utf-8,${encodeURIComponent(String(download.content))}`);
  element.setAttribute('download', download.filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
export default CountryWorkflows;