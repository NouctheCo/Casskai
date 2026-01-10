/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */
// fiscalCalendarService.ts - Service for managing fiscal calendar events and deadlines
import { getTaxConfiguration } from '../data/taxConfigurations';
import { TaxCalendarEvent } from '../types/tax.types';
import { logger } from '@/lib/logger';
export interface FiscalEvent {
  id: string;
  title: string;
  description: string;
  taxType: string;
  dueDate: Date;
  status: 'overdue' | 'due_soon' | 'upcoming' | 'completed';
  frequency: 'monthly' | 'quarterly' | 'annual' | 'one_time';
  priority: 'low' | 'medium' | 'high' | 'critical';
  countryCode: string;
  amount?: number;
  category: 'vat' | 'corporate_tax' | 'social' | 'local_tax' | 'other';
}
export interface FiscalCalendarStats {
  totalEvents: number;
  overdueEvents: number;
  dueSoonEvents: number;
  upcomingEvents: number;
  completedEvents: number;
}
/**
 * Parse deadline string like "15 mai N+1", "31 mars", "20 du mois suivant"
 * and convert it to a Date object for a given year
 */
function parseDeadline(deadlineStr: string, referenceYear: number): Date {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  // Handle relative deadlines
  if (deadlineStr.includes('mois suivant')) {
    // "20 du mois suivant" - extract day number
    const dayMatch = deadlineStr.match(/(\d+)/);
    if (dayMatch) {
      const day = parseInt(dayMatch[1]);
      const nextMonth = new Date(currentYear, currentMonth + 1, day);
      return nextMonth;
    }
  }
  // Handle "N+1" notation (year after reference)
  const isNextYear = deadlineStr.includes('N+1');
  const targetYear = isNextYear ? referenceYear + 1 : referenceYear;
  // Extract day and month
  const monthNames: Record<string, number> = {
    janvier: 0, février: 1, mars: 2, avril: 3,
    mai: 4, juin: 5, juillet: 6, août: 7,
    septembre: 8, octobre: 9, novembre: 10, décembre: 11,
    january: 0, february: 1, march: 2, april: 3,
    may: 4, june: 5, july: 6, august: 7,
    september: 8, october: 9, november: 10, december: 11
  };
  // Try to match "DD month" or "DD monthName"
  const dateMatch = deadlineStr.match(/(\d+)(?:st|nd|rd|th)?\s+(?:of\s+)?(\w+)/i);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const monthName = dateMatch[2].toLowerCase();
    const month = monthNames[monthName];
    if (month !== undefined) {
      return new Date(targetYear, month, day);
    }
  }
  // Handle "DD/MM" format
  const slashMatch = deadlineStr.match(/(\d+)\/(\d+)/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1]);
    const month = parseInt(slashMatch[2]) - 1; // 0-indexed
    return new Date(targetYear, month, day);
  }
  // Handle "end of month" or "fin du mois"
  if (deadlineStr.toLowerCase().includes('fin') || deadlineStr.toLowerCase().includes('end')) {
    const monthMatch = deadlineStr.match(/(\w+)/i);
    if (monthMatch) {
      const monthName = monthMatch[1].toLowerCase();
      const month = monthNames[monthName];
      if (month !== undefined) {
        // Last day of the month
        return new Date(targetYear, month + 1, 0);
      }
    }
  }
  // Default: return end of the reference year
  return new Date(targetYear, 11, 31);
}
/**
 * Calculate event status based on due date
 */
function calculateEventStatus(
  dueDate: Date,
  completed: boolean = false
): 'overdue' | 'due_soon' | 'upcoming' | 'completed' {
  if (completed) return 'completed';
  const now = new Date();
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 7) return 'due_soon';
  return 'upcoming';
}
/**
 * Determine priority based on tax type and status
 */
function determinePriority(
  taxType: string,
  status: string
): 'low' | 'medium' | 'high' | 'critical' {
  if (status === 'overdue') return 'critical';
  if (status === 'due_soon') return 'high';
  // Major tax types have higher priority
  if (taxType.includes('TVA') || taxType.includes('VAT') ||
      taxType.includes('IS') || taxType.includes('Corporate')) {
    return 'high';
  }
  return 'medium';
}
/**
 * Determine category based on tax type
 */
function determineCategory(taxType: string): 'vat' | 'corporate_tax' | 'social' | 'local_tax' | 'other' {
  const typeUpper = taxType.toUpperCase();
  if (typeUpper.includes('TVA') || typeUpper.includes('VAT')) return 'vat';
  if (typeUpper.includes('IS') || typeUpper.includes('CORPORATE') ||
      typeUpper.includes('BIC') || typeUpper.includes('IBS')) return 'corporate_tax';
  if (typeUpper.includes('SOCIAL') || typeUpper.includes('CNSS') ||
      typeUpper.includes('CNPS') || typeUpper.includes('CSS') ||
      typeUpper.includes('PAYE') || typeUpper.includes('DSN')) return 'social';
  if (typeUpper.includes('CFE') || typeUpper.includes('CVAE') ||
      typeUpper.includes('PATENTE') || typeUpper.includes('TAP')) return 'local_tax';
  return 'other';
}
/**
 * Generate fiscal events for a specific year and country
 */
export function generateFiscalEvents(
  countryCode: string,
  year: number,
  completedEventIds: string[] = []
): FiscalEvent[] {
  const config = getTaxConfiguration(countryCode);
  if (!config) {
    logger.warn('FiscalCalendar', `No tax configuration found for country: ${countryCode}`);
    return [];
  }
  const events: FiscalEvent[] = [];
  const _eventIdCounter = 0;
  config.taxTypes.forEach(taxType => {
    const frequency = taxType.frequency;
    let occurrences: Date[] = [];
    switch (frequency) {
      case 'annual':
        // One occurrence per year
        occurrences = [parseDeadline(taxType.deadline, year)];
        break;
      case 'quarterly': {
        // Four occurrences per year (typical quarters: Mar, Jun, Sep, Dec)
        const quarterMonths = [2, 5, 8, 11]; // 0-indexed: March, June, September, December
        occurrences = quarterMonths.map(month => {
          const deadline = parseDeadline(taxType.deadline, year);
          return new Date(year, month, deadline.getDate());
        });
        break;
      }
      case 'monthly':
        // Twelve occurrences per year
        occurrences = Array.from({ length: 12 }, (_, i) => {
          const deadline = parseDeadline(taxType.deadline, year);
          return new Date(year, i, deadline.getDate());
        });
        break;
      case 'one_time':
        // Single occurrence
        occurrences = [parseDeadline(taxType.deadline, year)];
        break;
    }
    // Create events for each occurrence
    occurrences.forEach((dueDate, index) => {
      const eventId = `${countryCode}_${taxType.id}_${year}_${index}`;
      const completed = completedEventIds.includes(eventId);
      const status = calculateEventStatus(dueDate, completed);
      const priority = determinePriority(taxType.name, status);
      const category = determineCategory(taxType.name);
      events.push({
        id: eventId,
        title: taxType.name,
        description: taxType.description,
        taxType: taxType.id,
        dueDate,
        status,
        frequency: taxType.frequency,
        priority,
        countryCode,
        category
      });
    });
  });
  // Sort by due date
  events.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  return events;
}
/**
 * Generate fiscal events for multiple years
 */
export function generateFiscalEventsRange(
  countryCode: string,
  startYear: number,
  endYear: number,
  completedEventIds: string[] = []
): FiscalEvent[] {
  const allEvents: FiscalEvent[] = [];
  for (let year = startYear; year <= endYear; year++) {
    const yearEvents = generateFiscalEvents(countryCode, year, completedEventIds);
    allEvents.push(...yearEvents);
  }
  return allEvents;
}
/**
 * Get fiscal events for current year
 */
export function getCurrentYearFiscalEvents(
  countryCode: string,
  completedEventIds: string[] = []
): FiscalEvent[] {
  const currentYear = new Date().getFullYear();
  return generateFiscalEvents(countryCode, currentYear, completedEventIds);
}
/**
 * Get upcoming fiscal events (next N days)
 */
export function getUpcomingFiscalEvents(
  countryCode: string,
  days: number = 30,
  completedEventIds: string[] = []
): FiscalEvent[] {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const allEvents = generateFiscalEventsRange(countryCode, currentYear, nextYear, completedEventIds);
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return allEvents.filter(event => {
    return event.dueDate >= now && event.dueDate <= futureDate && event.status !== 'completed';
  });
}
/**
 * Get overdue fiscal events
 */
export function getOverdueFiscalEvents(
  countryCode: string,
  completedEventIds: string[] = []
): FiscalEvent[] {
  const currentYear = new Date().getFullYear();
  const events = generateFiscalEvents(countryCode, currentYear, completedEventIds);
  return events.filter(event => event.status === 'overdue');
}
/**
 * Calculate fiscal calendar statistics
 */
export function calculateFiscalCalendarStats(events: FiscalEvent[]): FiscalCalendarStats {
  return {
    totalEvents: events.length,
    overdueEvents: events.filter(e => e.status === 'overdue').length,
    dueSoonEvents: events.filter(e => e.status === 'due_soon').length,
    upcomingEvents: events.filter(e => e.status === 'upcoming').length,
    completedEvents: events.filter(e => e.status === 'completed').length
  };
}
/**
 * Filter fiscal events by category
 */
export function filterEventsByCategory(
  events: FiscalEvent[],
  category: 'vat' | 'corporate_tax' | 'social' | 'local_tax' | 'other'
): FiscalEvent[] {
  return events.filter(event => event.category === category);
}
/**
 * Filter fiscal events by priority
 */
export function filterEventsByPriority(
  events: FiscalEvent[],
  priority: 'low' | 'medium' | 'high' | 'critical'
): FiscalEvent[] {
  return events.filter(event => event.priority === priority);
}
/**
 * Filter fiscal events by status
 */
export function filterEventsByStatus(
  events: FiscalEvent[],
  status: 'overdue' | 'due_soon' | 'upcoming' | 'completed'
): FiscalEvent[] {
  return events.filter(event => event.status === status);
}
/**
 * Get events for a specific month
 */
export function getEventsByMonth(
  events: FiscalEvent[],
  year: number,
  month: number // 0-indexed
): FiscalEvent[] {
  return events.filter(event => {
    return event.dueDate.getFullYear() === year && event.dueDate.getMonth() === month;
  });
}
/**
 * Convert fiscal event to TaxCalendarEvent (for compatibility with existing types)
 */
export function convertToTaxCalendarEvent(
  fiscalEvent: FiscalEvent,
  enterpriseId: string,
  userId: string
): TaxCalendarEvent {
  return {
    id: fiscalEvent.id,
    title: fiscalEvent.title,
    description: fiscalEvent.description,
    type: 'declaration_due',
    tax_type: fiscalEvent.taxType,
    start_date: fiscalEvent.dueDate.toISOString(),
    end_date: fiscalEvent.dueDate.toISOString(),
    all_day: true,
    status: fiscalEvent.status === 'completed' ? 'completed' :
            fiscalEvent.status === 'overdue' ? 'overdue' :
            fiscalEvent.status === 'due_soon' ? 'in_progress' : 'upcoming',
    priority: fiscalEvent.priority,
    amount: fiscalEvent.amount,
    reminders: [
      {
        days_before: 7,
        notification_sent: false
      },
      {
        days_before: 3,
        notification_sent: false
      }
    ],
    enterprise_id: enterpriseId,
    created_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
/**
 * Get fiscal year range based on country configuration
 */
export function getFiscalYearRange(countryCode: string, currentDate: Date = new Date()): {
  startDate: Date;
  endDate: Date;
} {
  const config = getTaxConfiguration(countryCode);
  if (!config) {
    // Default to calendar year
    return {
      startDate: new Date(currentDate.getFullYear(), 0, 1),
      endDate: new Date(currentDate.getFullYear(), 11, 31)
    };
  }
  // Parse fiscal year end (format: DD/MM)
  const [day, month] = config.fiscalYearEnd.split('/').map(Number);
  const fiscalYearEndMonth = month - 1; // 0-indexed
  const currentYear = currentDate.getFullYear();
  const fiscalYearEnd = new Date(currentYear, fiscalYearEndMonth, day);
  if (currentDate > fiscalYearEnd) {
    // We're in the next fiscal year
    return {
      startDate: new Date(currentYear, fiscalYearEndMonth, day + 1),
      endDate: new Date(currentYear + 1, fiscalYearEndMonth, day)
    };
  } else {
    // We're in the current fiscal year
    return {
      startDate: new Date(currentYear - 1, fiscalYearEndMonth, day + 1),
      endDate: new Date(currentYear, fiscalYearEndMonth, day)
    };
  }
}
/**
 * Export fiscal calendar to CSV
 */
export function exportFiscalCalendarToCSV(events: FiscalEvent[]): string {
  const headers = ['Date', 'Type', 'Description', 'Priority', 'Status', 'Category'];
  const rows = events.map(event => [
    event.dueDate.toLocaleDateString('fr-FR'),
    event.title,
    event.description,
    event.priority,
    event.status,
    event.category
  ]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  return csvContent;
}
/**
 * Fiscal Calendar Service - Main API
 */
export const fiscalCalendarService = {
  generateFiscalEvents,
  generateFiscalEventsRange,
  getCurrentYearFiscalEvents,
  getUpcomingFiscalEvents,
  getOverdueFiscalEvents,
  calculateFiscalCalendarStats,
  filterEventsByCategory,
  filterEventsByPriority,
  filterEventsByStatus,
  getEventsByMonth,
  convertToTaxCalendarEvent,
  getFiscalYearRange,
  exportFiscalCalendarToCSV
};
export default fiscalCalendarService;