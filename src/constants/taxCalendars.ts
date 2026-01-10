/**
 * CassKai - Tax Calendars and Deadlines
 * PHASE 3: Integrated fiscal calendars with automatic deadline tracking
 * 
 * Manages:
 * - Tax filing deadlines
 * - Financial reporting deadlines
 * - Audit requirements
 * - Quarterly/monthly reporting schedules
 */

export interface TaxDeadline {
  id: string;
  country: string;
  taxType: string; // 'VAT', 'CIT', 'PAYROLL', 'SOCIAL', 'ANNUAL_FILING'
  description: string;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI-ANNUAL' | 'ANNUAL';
  dueDate: string; // e.g., "15th of month", "30 days after quarter end"
  daysBeforeDeadline: number; // e.g., 21
  extensions?: number; // days extension possible
  penalties?: {
    firstDay: number; // EUR/currency
    perDay: number;
    maxPenalty?: number;
  };
  documents: string[]; // required documents
  submissionMethod: 'ONLINE' | 'MAIL' | 'IN_PERSON';
  authority: string;
}

export interface FiscalCalendar {
  country: string;
  fiscalYearStart: string; // "01-01" for January 1st
  fiscalYearEnd: string; // "12-31" for December 31st
  taxFilingDeadline: number; // days after fiscal year end
  deadlines: TaxDeadline[];
}

// ============================================================================
// FRANCE - TAX CALENDAR
// ============================================================================

export const FR_TAX_CALENDAR: FiscalCalendar = {
  country: 'FR',
  fiscalYearStart: '01-01',
  fiscalYearEnd: '12-31',
  taxFilingDeadline: 150, // 5 months after FY end
  deadlines: [
    {
      id: 'FR_VAT_MONTHLY',
      country: 'FR',
      taxType: 'VAT',
      description: 'Monthly VAT Return (CA3)',
      frequency: 'MONTHLY',
      dueDate: 'by 21st of month following reporting',
      daysBeforeDeadline: 21,
      penalties: {
        firstDay: 100,
        perDay: 10,
        maxPenalty: 1000,
      },
      documents: ['vat_return', 'sales_summary', 'purchase_summary'],
      submissionMethod: 'ONLINE',
      authority: 'DGFiP',
    },
    {
      id: 'FR_ANNUAL_FILING',
      country: 'FR',
      taxType: 'ANNUAL_FILING',
      description: 'Annual Financial Statements Filing',
      frequency: 'ANNUAL',
      dueDate: 'by May 31st (5 months after FY end)',
      daysBeforeDeadline: 150,
      extensions: 30,
      penalties: {
        firstDay: 200,
        perDay: 50,
        maxPenalty: 5000,
      },
      documents: ['balance_sheet', 'income_statement', 'management_report', 'audit_report'],
      submissionMethod: 'ONLINE',
      authority: 'Registre du Commerce',
    },
    {
      id: 'FR_CIT_ANNUAL',
      country: 'FR',
      taxType: 'CIT',
      description: 'Corporate Income Tax Return',
      frequency: 'ANNUAL',
      dueDate: 'by April 15th or May 20th (depending on regime)',
      daysBeforeDeadline: 105,
      extensions: 30,
      penalties: {
        firstDay: 500,
        perDay: 100,
      },
      documents: ['tax_return_2033', 'financial_statements', 'tax_computation'],
      submissionMethod: 'ONLINE',
      authority: 'DGFiP',
    },
  ],
};

// ============================================================================
// SENEGAL - TAX CALENDAR (SYSCOHADA)
// ============================================================================

export const SN_TAX_CALENDAR: FiscalCalendar = {
  country: 'SN',
  fiscalYearStart: '01-01',
  fiscalYearEnd: '12-31',
  taxFilingDeadline: 90, // ~3 months
  deadlines: [
    {
      id: 'SN_VAT_MONTHLY',
      country: 'SN',
      taxType: 'VAT',
      description: 'Monthly VAT Return',
      frequency: 'MONTHLY',
      dueDate: 'by 20th of month following reporting',
      daysBeforeDeadline: 20,
      penalties: {
        firstDay: 5000,
        perDay: 1000,
      },
      documents: ['vat_return', 'sales_log'],
      submissionMethod: 'ONLINE',
      authority: 'DGID',
    },
    {
      id: 'SN_ANNUAL_FILING',
      country: 'SN',
      taxType: 'ANNUAL_FILING',
      description: 'Annual SYSCOHADA Financial Statements',
      frequency: 'ANNUAL',
      dueDate: 'by March 31st (3 months after FY end)',
      daysBeforeDeadline: 90,
      extensions: 30,
      penalties: {
        firstDay: 50000,
        perDay: 10000,
      },
      documents: ['balance_sheet', 'income_statement', 'notes', 'audit_report'],
      submissionMethod: 'ONLINE',
      authority: 'DGID',
    },
  ],
};

// ============================================================================
// CÔTE D'IVOIRE - TAX CALENDAR (SYSCOHADA)
// ============================================================================

export const CI_TAX_CALENDAR: FiscalCalendar = {
  country: 'CI',
  fiscalYearStart: '01-01',
  fiscalYearEnd: '12-31',
  taxFilingDeadline: 90,
  deadlines: [
    {
      id: 'CI_VAT_MONTHLY',
      country: 'CI',
      taxType: 'VAT',
      description: 'Monthly VAT Return',
      frequency: 'MONTHLY',
      dueDate: 'by 20th of month following reporting',
      daysBeforeDeadline: 20,
      penalties: {
        firstDay: 5000,
        perDay: 1000,
      },
      documents: ['vat_return'],
      submissionMethod: 'ONLINE',
      authority: 'DGI',
    },
  ],
};

// ============================================================================
// CAMEROON - TAX CALENDAR (SYSCOHADA)
// ============================================================================

export const CM_TAX_CALENDAR: FiscalCalendar = {
  country: 'CM',
  fiscalYearStart: '01-01',
  fiscalYearEnd: '12-31',
  taxFilingDeadline: 90,
  deadlines: [
    {
      id: 'CM_ANNUAL_FILING',
      country: 'CM',
      taxType: 'ANNUAL_FILING',
      description: 'Annual SYSCOHADA Filing',
      frequency: 'ANNUAL',
      dueDate: 'by March 31st',
      daysBeforeDeadline: 90,
      penalties: {
        firstDay: 10000,
        perDay: 2000,
      },
      documents: ['balance_sheet', 'income_statement'],
      submissionMethod: 'ONLINE',
      authority: 'DGED',
    },
  ],
};

// ============================================================================
// KENYA - TAX CALENDAR (IFRS for SMEs)
// ============================================================================

export const KE_TAX_CALENDAR: FiscalCalendar = {
  country: 'KE',
  fiscalYearStart: '01-01',
  fiscalYearEnd: '12-31',
  taxFilingDeadline: 210, // 7 months
  deadlines: [
    {
      id: 'KE_VAT_MONTHLY',
      country: 'KE',
      taxType: 'VAT',
      description: 'Monthly VAT Return',
      frequency: 'MONTHLY',
      dueDate: 'by 20th of month following reporting',
      daysBeforeDeadline: 20,
      penalties: {
        firstDay: 1000,
        perDay: 100,
      },
      documents: ['vat_return'],
      submissionMethod: 'ONLINE',
      authority: 'KRA',
    },
    {
      id: 'KE_ANNUAL_TAX_RETURN',
      country: 'KE',
      taxType: 'CIT',
      description: 'Annual Corporate Income Tax Return',
      frequency: 'ANNUAL',
      dueDate: 'by June 30th',
      daysBeforeDeadline: 210,
      extensions: 30,
      penalties: {
        firstDay: 5000,
        perDay: 1000,
      },
      documents: ['tax_return', 'financial_statements', 'tax_computation'],
      submissionMethod: 'ONLINE',
      authority: 'KRA',
    },
  ],
};

// ============================================================================
// NIGERIA - TAX CALENDAR (IFRS for SMEs)
// ============================================================================

export const NG_TAX_CALENDAR: FiscalCalendar = {
  country: 'NG',
  fiscalYearStart: '01-01',
  fiscalYearEnd: '12-31',
  taxFilingDeadline: 90, // 90 days
  deadlines: [
    {
      id: 'NG_ANNUAL_TAX_RETURN',
      country: 'NG',
      taxType: 'CIT',
      description: 'Annual Corporate Income Tax Return (eForms)',
      frequency: 'ANNUAL',
      dueDate: '90 days after FY end',
      daysBeforeDeadline: 90,
      penalties: {
        firstDay: 100000,
        perDay: 10000,
      },
      documents: ['tax_return', 'financial_statements'],
      submissionMethod: 'ONLINE',
      authority: 'FIRS',
    },
  ],
};

// ============================================================================
// ALGERIA - TAX CALENDAR (SCF)
// ============================================================================

export const DZ_TAX_CALENDAR: FiscalCalendar = {
  country: 'DZ',
  fiscalYearStart: '01-01',
  fiscalYearEnd: '12-31',
  taxFilingDeadline: 105, // ~3.5 months
  deadlines: [
    {
      id: 'DZ_ANNUAL_FILING',
      country: 'DZ',
      taxType: 'ANNUAL_FILING',
      description: 'Annual SCF Filing',
      frequency: 'ANNUAL',
      dueDate: 'by April 15th',
      daysBeforeDeadline: 105,
      penalties: {
        firstDay: 50000,
        perDay: 10000,
      },
      documents: ['balance_sheet', 'income_statement'],
      submissionMethod: 'ONLINE',
      authority: 'DGI',
    },
  ],
};

// ============================================================================
// TUNISIA - TAX CALENDAR (SCF)
// ============================================================================

export const TN_TAX_CALENDAR: FiscalCalendar = {
  country: 'TN',
  fiscalYearStart: '01-01',
  fiscalYearEnd: '12-31',
  taxFilingDeadline: 90,
  deadlines: [
    {
      id: 'TN_ANNUAL_FILING',
      country: 'TN',
      taxType: 'ANNUAL_FILING',
      description: 'Annual SCF Filing',
      frequency: 'ANNUAL',
      dueDate: 'by March 31st',
      daysBeforeDeadline: 90,
      penalties: {
        firstDay: 5000,
        perDay: 1000,
      },
      documents: ['balance_sheet', 'income_statement'],
      submissionMethod: 'ONLINE',
      authority: 'DGI',
    },
  ],
};

// ============================================================================
// MOROCCO - TAX CALENDAR (PCM)
// ============================================================================

export const MA_TAX_CALENDAR: FiscalCalendar = {
  country: 'MA',
  fiscalYearStart: '01-01',
  fiscalYearEnd: '12-31',
  taxFilingDeadline: 90,
  deadlines: [
    {
      id: 'MA_ANNUAL_FILING',
      country: 'MA',
      taxType: 'ANNUAL_FILING',
      description: 'Annual PCM Filing',
      frequency: 'ANNUAL',
      dueDate: 'by March 31st',
      daysBeforeDeadline: 90,
      penalties: {
        firstDay: 10000,
        perDay: 2000,
      },
      documents: ['balance_sheet', 'income_statement'],
      submissionMethod: 'ONLINE',
      authority: 'DGI',
    },
  ],
};

// ============================================================================
// CONSOLIDATED TAX CALENDARS
// ============================================================================

export const ALL_TAX_CALENDARS: { [key: string]: FiscalCalendar } = {
  FR: FR_TAX_CALENDAR,
  SN: SN_TAX_CALENDAR,
  CI: CI_TAX_CALENDAR,
  CM: CM_TAX_CALENDAR,
  KE: KE_TAX_CALENDAR,
  NG: NG_TAX_CALENDAR,
  DZ: DZ_TAX_CALENDAR,
  TN: TN_TAX_CALENDAR,
  MA: MA_TAX_CALENDAR,
};

// ============================================================================
// TAX CALENDAR SERVICE
// ============================================================================

export class TaxCalendarService {
  /**
   * Get all deadlines for a country
   */
  static getCountryDeadlines(country: string): TaxDeadline[] {
    const calendar = ALL_TAX_CALENDARS[country];
    return calendar?.deadlines || [];
  }

  /**
   * Calculate next deadline from fiscal year end date
   */
  static calculateNextDeadline(
    country: string,
    fiscalYearEnd: Date
  ): {
    deadline: TaxDeadline;
    dueDate: Date;
    daysRemaining: number;
  } | null {
    const deadlines = this.getCountryDeadlines(country);
    if (deadlines.length === 0) return null;

    const upcomingDeadlines = deadlines
      .map(deadline => ({
        deadline,
        dueDate: this.parseDueDate(deadline.dueDate, fiscalYearEnd),
      }))
      .filter(({ dueDate }) => dueDate > new Date())
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    if (upcomingDeadlines.length === 0) return null;

    const nearest = upcomingDeadlines[0];
    const daysRemaining = Math.ceil(
      (nearest.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return {
      deadline: nearest.deadline,
      dueDate: nearest.dueDate,
      daysRemaining,
    };
  }

  /**
   * Parse due date string and calculate actual date
   */
  private static parseDueDate(dueDate: string, fiscalYearEnd: Date): Date {
    const date = new Date(fiscalYearEnd);

    if (dueDate.includes('by')) {
      if (dueDate.includes('days after')) {
        const match = dueDate.match(/(\d+)\s+days\s+after/);
        if (match) {
          date.setDate(date.getDate() + parseInt(match[1]));
        }
      } else if (dueDate.includes('th of month')) {
        const match = dueDate.match(/by\s+(\d+)th\s+of\s+month/);
        if (match) {
          const dayOfMonth = parseInt(match[1]);
          date.setDate(dayOfMonth);
        }
      } else {
        // "by May 31st", "by June 30th", etc.
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        for (let i = 0; i < monthNames.length; i++) {
          if (dueDate.includes(monthNames[i])) {
            date.setMonth(i);
            const dayMatch = dueDate.match(/(\d+)(st|nd|rd|th)/);
            if (dayMatch) {
              date.setDate(parseInt(dayMatch[1]));
            }
            break;
          }
        }
      }
    }

    return date;
  }

  /**
   * Check if deadline is approaching (warn if < 7 days)
   */
  static isDeadlineApproaching(deadline: TaxDeadline, fiscalYearEnd: Date): boolean {
    const dueDate = this.parseDueDate(deadline.dueDate, fiscalYearEnd);
    const daysRemaining = Math.ceil(
      (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysRemaining <= 7 && daysRemaining > 0;
  }

  /**
   * Get fiscal year dates for a country
   */
  static getFiscalYearDates(country: string, year: number): {
    start: Date;
    end: Date;
  } | null {
    const calendar = ALL_TAX_CALENDARS[country];
    if (!calendar) return null;

    const [startMonth, startDay] = calendar.fiscalYearStart.split('-').map(Number);
    const [endMonth, endDay] = calendar.fiscalYearEnd.split('-').map(Number);

    const start = new Date(year, startMonth - 1, startDay);
    const end = new Date(year, endMonth - 1, endDay);

    return { start, end };
  }
}
