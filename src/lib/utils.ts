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

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency?: string,
  locale: string = 'fr-FR'
): string {
  let resolvedCurrency = currency;
  try {
    if (!resolvedCurrency && typeof window !== 'undefined') {
      resolvedCurrency = localStorage.getItem('casskai_current_company_currency') || undefined;
    }
  } catch (_e) {
    // ignore localStorage errors in non-browser environments
  }
  resolvedCurrency = resolvedCurrency || 'EUR';
  try {
    const isZeroDecimals = resolvedCurrency === 'XOF';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: resolvedCurrency,
      minimumFractionDigits: isZeroDecimals ? 0 : 2,
      maximumFractionDigits: isZeroDecimals ? 0 : 2,
    }).format(amount);
  } catch (_error) {
    return `${amount.toLocaleString(locale)} ${resolvedCurrency}`;
  }
}

export function formatDate(
  date: Date | string | number,
  format: 'short' | 'medium' | 'long' | 'full' = 'medium',
  locale: string = 'fr-FR'
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  const formatOptions = {
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  } as const;
  const options: Intl.DateTimeFormatOptions = formatOptions[format];
  return dateObj.toLocaleDateString(locale, options);
}

export function truncate(str: string, maxLength: number = 50, ellipsis: string = '...'): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  const truncatedLength = maxLength - ellipsis.length;
  return str.slice(0, Math.max(0, truncatedLength)) + ellipsis;
}

export function formatNumber(num: number, locale: string = 'fr-FR'): string {
  return num.toLocaleString(locale);
}

export function formatPercentage(value: number, decimals: number = 1, locale: string = 'fr-FR'): string {
  return `${(value * 100).toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
}

export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout as any);
    timeout = setTimeout(() => func(...args), wait) as unknown as NodeJS.Timeout;
  };
}

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function generateId(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatCurrencyForPDF(amount: number, currency?: string): string {
  const resolved = currency || getCurrentCompanyCurrency();
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: resolved,
    minimumFractionDigits: resolved === 'XOF' || resolved === 'XAF' ? 0 : 2,
    maximumFractionDigits: resolved === 'XOF' || resolved === 'XAF' ? 0 : 2
  }).format(amount).replace(/\u00A0/g, ' ');
}

export function getCurrentCompanyCurrency(): string {
  try {
    if (typeof window !== 'undefined') {
      const c = localStorage.getItem('casskai_current_company_currency');
      if (c) return c;
    }
  } catch (_e) {
    // ignore
  }
  return 'EUR';
}

export function getCurrencySymbol(currency?: string): string {
  const resolved = currency || getCurrentCompanyCurrency();
  try {
    const parts = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: resolved })
      .formatToParts(0);
    return parts.find(part => part.type === 'currency')?.value || resolved;
  } catch (_e) {
    return resolved;
  }
}

export function formatNumberForPDF(value: number, decimals = 2): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value).replace(/\u00A0/g, ' ');
}

