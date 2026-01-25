/**
 * CassKai - Country-Specific Format Service
 * PHASE 3: Export documents in country-specific formats
 * 
 * Supports:
 * - XML formats (INFOGREFFE, OHADA, etc.)
 * - PDF layouts with country-specific requirements
 * - CSV exports with proper number/date formatting
 * - Digital signature placeholders
 */

import { COUNTRY_WORKFLOWS } from '@/constants/countryWorkflows';
import { getCurrentCompanyCurrency } from '@/lib/utils';

export interface FormattedDocument {
  format: 'xml' | 'pdf' | 'csv' | 'json';
  country: string;
  content: string | Buffer;
  encoding: 'utf-8' | 'base64' | 'binary';
  mimeType: string;
  filename: string;
}

export interface NumberFormatting {
  decimalSeparator: string;
  thousandsSeparator: string;
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  decimals: number;
}

export interface DateFormatting {
  format: string;
  separator: string;
}

// ============================================================================
// COUNTRY-SPECIFIC FORMAT SERVICE
// ============================================================================

export class CountryFormatService {
  /**
   * Get formatting rules for a country
   */
  static getFormattingRules(country: string): {
    number: NumberFormatting;
    date: DateFormatting;
    currency: string;
    language: string;
  } | null {
    const workflow = COUNTRY_WORKFLOWS[country as keyof typeof COUNTRY_WORKFLOWS];
    if (!workflow) return null;

    const formats = workflow.validations.formats || {};

    const currencyCodes: { [key: string]: string } = {
      FR: 'EUR',
      SN: 'XOF',
      CI: 'XOF',
      CM: 'XAF',
      KE: 'KES',
      NG: 'NGN',
      DZ: 'DZD',
      TN: 'TND',
      MA: 'MAD',
    };

    return {
      number: {
        decimalSeparator: (formats as any).numberDecimalSeparator || '.',
        thousandsSeparator: (formats as any).numberThousandsSeparator || ',',
        currencySymbol: currencyCodes[country] || getCurrentCompanyCurrency(),
        currencyPosition: 'after',
        decimals: 2,
      },
      date: {
        format: (formats as any).dateFormat || 'DD/MM/YYYY',
        separator: '/',
      },
      currency: currencyCodes[country] || getCurrentCompanyCurrency(),
      language: (formats as any).language || 'EN',
    };
  }

  /**
   * Format a number according to country rules
   */
  static formatNumber(
    value: number,
    country: string,
    includeSymbol: boolean = false
  ): string {
    const rules = this.getFormattingRules(country);
    if (!rules) return value.toString();

    const parts = value.toFixed(rules.number.decimals).split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    // Add thousands separator
    const formattedInteger = integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      rules.number.thousandsSeparator
    );

    const formattedNumber =
      formattedInteger + rules.number.decimalSeparator + decimalPart;

    if (includeSymbol) {
      return rules.number.currencyPosition === 'before'
        ? `${rules.number.currencySymbol} ${formattedNumber}`
        : `${formattedNumber} ${rules.number.currencySymbol}`;
    }

    return formattedNumber;
  }

  /**
   * Format a date according to country rules
   */
  static formatDate(date: Date, country: string): string {
    const rules = this.getFormattingRules(country);
    if (!rules) return date.toISOString().split('T')[0];

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    if (rules.date.format === 'DD/MM/YYYY') {
      return `${day}${rules.date.separator}${month}${rules.date.separator}${year}`;
    } else if (rules.date.format === 'MM/DD/YYYY') {
      return `${month}${rules.date.separator}${day}${rules.date.separator}${year}`;
    } else {
      return `${year}${rules.date.separator}${month}${rules.date.separator}${day}`;
    }
  }

  /**
   * Export document as XML (for tax authorities)
   */
  static exportAsXML(
    documentData: any,
    country: string,
    documentType: string
  ): FormattedDocument {
    let xmlContent = '';

    if (country === 'FR') {
      xmlContent = this.generateFRXML(documentData, documentType);
    } else if (['SN', 'CI', 'CM'].includes(country)) {
      xmlContent = this.generateOHADAXML(documentData, country, documentType);
    } else if (['KE', 'NG'].includes(country)) {
      xmlContent = this.generateIFRSXML(documentData, country, documentType);
    } else {
      xmlContent = this.generateGenericXML(documentData, country, documentType);
    }

    const filename = `${documentType}_${country}_${new Date().toISOString().split('T')[0]}.xml`;

    return {
      format: 'xml',
      country,
      content: xmlContent,
      encoding: 'utf-8',
      mimeType: 'application/xml',
      filename,
    };
  }

  /**
   * Generate France-specific XML (INFOGREFFE format)
   */
  private static generateFRXML(documentData: any, documentType: string): string {
    const timestamp = new Date().toISOString();
    const docId = `FR-${documentType}-${Date.now()}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<Document>
  <Header>
    <DocumentID>${docId}</DocumentID>
    <DocumentType>${documentType}</DocumentType>
    <Country>FR</Country>
    <TaxAuthority>DGFiP</TaxAuthority>
    <StandardFormat>INFOGREFFE-2024</StandardFormat>
    <CreatedAt>${timestamp}</CreatedAt>
  </Header>
  <Content>
    <FiscalYear>${documentData.fiscal_year || new Date().getFullYear()}</FiscalYear>
    <FiscalPeriod>${documentData.fiscal_period || 'ANNUAL'}</FiscalPeriod>
    <Data>
      ${this.documentDataToXml(documentData)}
    </Data>
  </Content>
  <Signature>
    <SignatureField>_______________________</SignatureField>
    <DateField>${this.formatDate(new Date(), 'FR')}</DateField>
  </Signature>
</Document>`;
  }

  /**
   * Generate OHADA XML (for SYSCOHADA countries)
   */
  private static generateOHADAXML(
    documentData: any,
    country: string,
    documentType: string
  ): string {
    const timestamp = new Date().toISOString();
    const docId = `OHADA-${country}-${documentType}-${Date.now()}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<OHADADocument>
  <Header>
    <DocumentID>${docId}</DocumentID>
    <DocumentType>${documentType}</DocumentType>
    <CountryCode>${country}</CountryCode>
    <Standard>SYSCOHADA</Standard>
    <CreatedAt>${timestamp}</CreatedAt>
  </Header>
  <Content>
    <FiscalYear>${documentData.fiscal_year || new Date().getFullYear()}</FiscalYear>
    <FiscalPeriod>${documentData.fiscal_period || 'ANNUAL'}</FiscalPeriod>
    <Data>
      ${this.documentDataToXml(documentData)}
    </Data>
  </Content>
  <DigitalSignature>
    <CertificatePlaceholder>_______________________</CertificatePlaceholder>
    <DateSigned>${this.formatDate(new Date(), country)}</DateSigned>
  </DigitalSignature>
</OHADADocument>`;
  }

  /**
   * Generate IFRS XML format
   */
  private static generateIFRSXML(
    documentData: any,
    country: string,
    documentType: string
  ): string {
    const timestamp = new Date().toISOString();
    const docId = `IFRS-${country}-${documentType}-${Date.now()}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<IFRSDocument>
  <Header>
    <DocumentID>${docId}</DocumentID>
    <DocumentType>${documentType}</DocumentType>
    <CountryCode>${country}</CountryCode>
    <Standard>IFRS for SMEs</Standard>
    <CreatedAt>${timestamp}</CreatedAt>
  </Header>
  <Content>
    <ReportingPeriod>
      <FiscalYear>${documentData.fiscal_year || new Date().getFullYear()}</FiscalYear>
      <FiscalPeriod>${documentData.fiscal_period || 'ANNUAL'}</FiscalPeriod>
    </ReportingPeriod>
    <Data>
      ${this.documentDataToXml(documentData)}
    </Data>
  </Content>
  <Audit>
    <AuditorSignature>_______________________</AuditorSignature>
    <AuditDate>${this.formatDate(new Date(), country)}</AuditDate>
  </Audit>
</IFRSDocument>`;
  }

  /**
   * Generate generic XML for other countries
   */
  private static generateGenericXML(
    documentData: any,
    country: string,
    documentType: string
  ): string {
    const timestamp = new Date().toISOString();
    const docId = `${country}-${documentType}-${Date.now()}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<RegulatoryDocument>
  <Header>
    <DocumentID>${docId}</DocumentID>
    <DocumentType>${documentType}</DocumentType>
    <Country>${country}</Country>
    <CreatedAt>${timestamp}</CreatedAt>
  </Header>
  <Content>
    <FiscalYear>${documentData.fiscal_year || new Date().getFullYear()}</FiscalYear>
    <FiscalPeriod>${documentData.fiscal_period || 'ANNUAL'}</FiscalPeriod>
    <Data>
      ${this.documentDataToXml(documentData)}
    </Data>
  </Content>
</RegulatoryDocument>`;
  }

  /**
   * Convert document data to XML elements
   */
  private static documentDataToXml(data: any, depth: number = 1): string {
    const indent = '  '.repeat(depth);
    let xml = '';

    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) continue;

      if (typeof value === 'object' && !Array.isArray(value)) {
        xml += `${indent}<${key}>\n`;
        xml += this.documentDataToXml(value, depth + 1);
        xml += `${indent}</${key}>\n`;
      } else if (Array.isArray(value)) {
        xml += `${indent}<${key}>\n`;
        for (const item of value) {
          xml += `${indent}  <Item>${this.escapeXml(String(item))}</Item>\n`;
        }
        xml += `${indent}</${key}>\n`;
      } else {
        xml += `${indent}<${key}>${this.escapeXml(String(value))}</${key}>\n`;
      }
    }

    return xml;
  }

  /**
   * Escape XML special characters
   */
  private static escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Export document as CSV
   */
  static exportAsCSV(
    documentData: any,
    country: string,
    documentType: string
  ): FormattedDocument {
    const rows: string[] = [];
    const rules = this.getFormattingRules(country);

    // Header
    rows.push('Field,Value,Unit');

    // Data
    for (const [key, value] of Object.entries(documentData)) {
      if (value === null || value === undefined) continue;

      let formattedValue: string;
      if (typeof value === 'number') {
        formattedValue = this.formatNumber(value, country);
      } else {
        formattedValue = String(value);
      }

      rows.push(`"${key}","${formattedValue}","${rules?.currency || 'EUR'}"`);
    }

    const csvContent = rows.join('\n');
    const filename = `${documentType}_${country}_${new Date().toISOString().split('T')[0]}.csv`;

    return {
      format: 'csv',
      country,
      content: csvContent,
      encoding: 'utf-8',
      mimeType: 'text/csv',
      filename,
    };
  }

  /**
   * Export document as JSON (for internal use)
   */
  static exportAsJSON(
    documentData: any,
    country: string,
    documentType: string
  ): FormattedDocument {
    const exportData = {
      metadata: {
        documentType,
        country,
        createdAt: new Date().toISOString(),
        formatVersion: '1.0',
      },
      formattingRules: this.getFormattingRules(country),
      data: documentData,
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const filename = `${documentType}_${country}_${new Date().toISOString().split('T')[0]}.json`;

    return {
      format: 'json',
      country,
      content: jsonContent,
      encoding: 'utf-8',
      mimeType: 'application/json',
      filename,
    };
  }

  /**
   * Get file content for download
   */
  static getDownloadContent(
    formatted: FormattedDocument
  ): { content: string | Buffer; filename: string; mimeType: string } {
    return {
      content: formatted.content,
      filename: formatted.filename,
      mimeType: formatted.mimeType,
    };
  }
}
