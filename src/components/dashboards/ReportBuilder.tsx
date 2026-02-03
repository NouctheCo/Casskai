/**
 * CassKai - PHASE 4: Report Builder Component
 * Interactive tool for creating custom financial reports
 */

import React, { useState } from 'react';
import { ReportGenerationService, ReportConfig } from '@/services/reporting/reportGenerationService';
import { useToast } from '@/hooks/useToast';

interface ReportBuilderState {
  selectedTemplate: string;
  reportTitle: string;
  companyId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  selectedMetrics: string[];
  selectedCountries: string[];
  includeCharts: boolean;
  includeRatios: boolean;
  includeTrends: boolean;
  includeForecast: boolean;
  exportFormat: 'json' | 'csv' | 'pdf' | 'excel';
  isGenerating: boolean;
  error: string | null;
}

const AVAILABLE_METRICS = [
  'Revenue',
  'Net Income',
  'Gross Margin',
  'Operating Margin',
  'Current Ratio',
  'Debt to Equity',
  'ROA',
  'ROE',
  'Asset Turnover',
  'Revenue Growth',
];

const AVAILABLE_COUNTRIES = [
  'United States',
  'France',
  'Senegal',
  'Cameroon',
  'Kenya',
  'Nigeria',
  'Algeria',
  'Tunisia',
  'Morocco',
];

export const ReportBuilder: React.FC = () => {
  const { showToast } = useToast();
  const [state, setState] = useState<ReportBuilderState>({
    selectedTemplate: 'template_financial_overview',
    reportTitle: 'Financial Overview Report',
    companyId: 'company_001',
    dateRange: {
      start: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1),
      end: new Date(),
    },
    selectedMetrics: ['Revenue', 'Net Income', 'Current Ratio', 'ROE'],
    selectedCountries: [],
    includeCharts: true,
    includeRatios: true,
    includeTrends: true,
    includeForecast: true,
    exportFormat: 'pdf',
    isGenerating: false,
    error: null,
  });

  const templates = ReportGenerationService.getReportTemplates();

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setState(prev => ({
      ...prev,
      selectedTemplate: templateId,
      exportFormat: (template?.defaultFormat as any) || 'pdf',
    }));
  };

  const toggleMetric = (metric: string) => {
    setState(prev => ({
      ...prev,
      selectedMetrics: prev.selectedMetrics.includes(metric)
        ? prev.selectedMetrics.filter(m => m !== metric)
        : [...prev.selectedMetrics, metric],
    }));
  };

  const toggleCountry = (country: string) => {
    setState(prev => ({
      ...prev,
      selectedCountries: prev.selectedCountries.includes(country)
        ? prev.selectedCountries.filter(c => c !== country)
        : [...prev.selectedCountries, country],
    }));
  };

  const handleGenerateReport = async () => {
    try {
      setState(prev => ({ ...prev, isGenerating: true, error: null }));

      const config: ReportConfig = {
        title: state.reportTitle,
        companyId: state.companyId,
        dateRange: state.dateRange,
        countries: state.selectedCountries.length > 0 ? state.selectedCountries : undefined,
        metrics: state.selectedMetrics.length > 0 ? state.selectedMetrics : undefined,
        includeCharts: state.includeCharts,
        includeRatios: state.includeRatios,
        includeTrends: state.includeTrends,
        includeForecast: state.includeForecast,
        format: state.exportFormat,
      };

      const report = await ReportGenerationService.generateReport(config);

      // Export based on selected format
      let exportResult;
      switch (state.exportFormat) {
        case 'json':
          exportResult = ReportGenerationService.exportToJSON(report);
          downloadFile(exportResult, `${state.reportTitle}.json`, 'application/json');
          break;
        case 'csv':
          exportResult = ReportGenerationService.exportToCSV(report);
          downloadFile(exportResult, `${state.reportTitle}.csv`, 'text/csv');
          break;
        case 'pdf':
          exportResult = ReportGenerationService.exportToPDF(report);
          downloadFile(exportResult.content, exportResult.fileName, 'text/html');
          break;
        case 'excel':
          // Note: In production, use xlsx library for proper Excel export
          showToast('Export Excel requiert la librairie xlsx. Export JSON appliqué.', 'warning');
          exportResult = ReportGenerationService.exportToJSON(report);
          downloadFile(exportResult, `${state.reportTitle}.json`, 'application/json');
          break;
      }

      setState(prev => ({ ...prev, isGenerating: false }));
    } catch (_error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: 'Failed to generate report. Please try again.',
      }));
    }
  };

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const element = document.createElement('a');
    element.setAttribute('href', `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`);
    element.setAttribute('download', fileName);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const ReportPreview: React.FC = () => (
    <div className="report-preview">
      <h3>Report Preview</h3>
      <div className="preview-item">
        <span className="label">Title:</span>
        <span className="value">{state.reportTitle}</span>
      </div>
      <div className="preview-item">
        <span className="label">Period:</span>
        <span className="value">
          {state.dateRange.start.toLocaleDateString()} - {state.dateRange.end.toLocaleDateString()}
        </span>
      </div>
      <div className="preview-item">
        <span className="label">Metrics:</span>
        <span className="value">{state.selectedMetrics.length} selected</span>
      </div>
      <div className="preview-item">
        <span className="label">Sections:</span>
        <span className="value">
          {[
            state.includeCharts && 'Metrics',
            state.includeRatios && 'Ratios',
            state.includeTrends && 'Trends',
            state.includeForecast && 'Forecast',
          ]
            .filter(Boolean)
            .join(', ')}
        </span>
      </div>
      <div className="preview-item">
        <span className="label">Format:</span>
        <span className="value">{state.exportFormat.toUpperCase()}</span>
      </div>
    </div>
  );

  return (
    <div className="report-builder">
      <div className="builder-header">
        <h1>Report Builder</h1>
        <p>Create custom financial reports with your preferred metrics and layout</p>
      </div>

      <div className="builder-layout">
        {/* Configuration Panel */}
        <div className="config-panel">
          {/* Template Selection */}
          <section className="builder-section">
            <h3>Select Template</h3>
            <div className="template-options">
              {templates.map(template => (
                <label key={template.id} className="template-option">
                  <input
                    type="radio"
                    value={template.id}
                    checked={state.selectedTemplate === template.id}
                    onChange={e => handleTemplateChange(e.target.value)}
                  />
                  <div className="template-info">
                    <div className="template-name">{template.name}</div>
                    <div className="template-desc">{template.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Basic Information */}
          <section className="builder-section">
            <h3>Basic Information</h3>
            <div className="form-group">
              <label htmlFor="report-title">Report Title</label>
              <input
                id="report-title"
                type="text"
                value={state.reportTitle}
                onChange={e => setState(prev => ({ ...prev, reportTitle: e.target.value }))}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="report-company-id">Company ID</label>
              <input
                id="report-company-id"
                type="text"
                value={state.companyId}
                onChange={e => setState(prev => ({ ...prev, companyId: e.target.value }))}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="report-start-date">Start Date</label>
              <input
                id="report-start-date"
                type="date"
                value={state.dateRange.start.toISOString().split('T')[0]}
                onChange={e =>
                  setState(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: new Date(e.target.value) },
                  }))
                }
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="report-end-date">End Date</label>
              <input
                id="report-end-date"
                type="date"
                value={state.dateRange.end.toISOString().split('T')[0]}
                onChange={e =>
                  setState(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: new Date(e.target.value) },
                  }))
                }
                className="form-input"
              />
            </div>
          </section>

          {/* Export Format */}
          <section className="builder-section">
            <h3>Export Format</h3>
            <div className="format-options">
              {['json', 'csv', 'pdf', 'excel'].map(format => (
                <label key={format} className="format-option">
                  <input
                    type="radio"
                    value={format}
                    checked={state.exportFormat === format}
                    onChange={e =>
                      setState(prev => ({ ...prev, exportFormat: e.target.value as any }))
                    }
                  />
                  <span>{format.toUpperCase()}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Selection Panel */}
        <div className="selection-panel">
          {/* Metrics */}
          <section className="builder-section">
            <h3>Select Metrics</h3>
            <div className="checkbox-list">
              {AVAILABLE_METRICS.map(metric => (
                <label key={metric} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={state.selectedMetrics.includes(metric)}
                    onChange={() => toggleMetric(metric)}
                  />
                  <span>{metric}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Countries */}
          <section className="builder-section">
            <h3>Select Countries (Optional)</h3>
            <div className="checkbox-list">
              {AVAILABLE_COUNTRIES.map(country => (
                <label key={country} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={state.selectedCountries.includes(country)}
                    onChange={() => toggleCountry(country)}
                  />
                  <span>{country}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Sections */}
          <section className="builder-section">
            <h3>Report Sections</h3>
            <div className="checkbox-list">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={state.includeCharts}
                  onChange={e =>
                    setState(prev => ({ ...prev, includeCharts: e.target.checked }))
                  }
                />
                <span>📊 Financial Metrics</span>
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={state.includeRatios}
                  onChange={e =>
                    setState(prev => ({ ...prev, includeRatios: e.target.checked }))
                  }
                />
                <span>📈 Financial Ratios</span>
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={state.includeTrends}
                  onChange={e =>
                    setState(prev => ({ ...prev, includeTrends: e.target.checked }))
                  }
                />
                <span>📉 Trends Analysis</span>
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={state.includeForecast}
                  onChange={e =>
                    setState(prev => ({ ...prev, includeForecast: e.target.checked }))
                  }
                />
                <span>🔮 Forecast & Projection</span>
              </label>
            </div>
          </section>
        </div>

        {/* Preview Panel */}
        <div className="preview-panel">
          <ReportPreview />
          <button
            className="generate-btn"
            onClick={handleGenerateReport}
            disabled={state.isGenerating}
          >
            {state.isGenerating ? 'Generating Report...' : '📥 Generate & Download'}
          </button>
          {state.error && <div className="error-message">{state.error}</div>}
        </div>
      </div>

      <style>{`
        .report-builder {
          padding: 24px;
          background-color: #f8f9fa;
          min-height: 100vh;
        }

        .builder-header {
          background-color: white;
          padding: 24px;
          border-radius: 8px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .builder-header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 600;
          color: #333;
        }

        .builder-header p {
          margin: 0;
          color: #666;
          font-size: 16px;
        }

        .builder-layout {
          display: grid;
          grid-template-columns: 1fr 1fr 300px;
          gap: 24px;
        }

        .config-panel,
        .selection-panel {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow-y: auto;
          max-height: 600px;
        }

        .builder-section {
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }

        .builder-section:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .builder-section h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .form-group {
          margin-bottom: 12px;
        }

        .form-group label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #666;
          margin-bottom: 4px;
        }

        .form-input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 13px;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
        }

        .template-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .template-option {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .template-option:hover {
          border-color: #007bff;
          background-color: #f0f7ff;
        }

        .template-option input {
          margin-top: 2px;
          cursor: pointer;
        }

        .template-info {
          flex: 1;
        }

        .template-name {
          font-size: 13px;
          font-weight: 600;
          color: #333;
        }

        .template-desc {
          font-size: 11px;
          color: #999;
          margin-top: 2px;
        }

        .format-options,
        .checkbox-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .format-option,
        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13px;
        }

        .format-option input,
        .checkbox-item input {
          cursor: pointer;
        }

        .preview-panel {
          position: sticky;
          top: 24px;
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          height: fit-content;
        }

        .report-preview {
          margin-bottom: 20px;
        }

        .report-preview h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #007bff;
          padding-bottom: 8px;
        }

        .preview-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          margin-bottom: 8px;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }

        .preview-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .preview-item .label {
          color: #666;
          font-weight: 500;
        }

        .preview-item .value {
          color: #333;
          font-weight: 600;
          text-align: right;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .generate-btn {
          width: 100%;
          padding: 12px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .generate-btn:hover:not(:disabled) {
          background-color: #0056b3;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .generate-btn:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .error-message {
          margin-top: 12px;
          padding: 8px;
          background-color: #f8d7da;
          color: #721c24;
          border-radius: 4px;
          font-size: 12px;
        }

        @media (max-width: 1024px) {
          .builder-layout {
            grid-template-columns: 1fr;
          }

          .preview-panel {
            position: static;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportBuilder;
