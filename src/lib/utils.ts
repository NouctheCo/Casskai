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

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - The currency code (default: 'XOF')
 * @param locale - The locale for formatting (default: 'fr-FR')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'XOF',
  locale: string = 'fr-FR'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'XOF' ? 0 : 2,
      maximumFractionDigits: currency === 'XOF' ? 0 : 2,
    }).format(amount);
  } catch (error) {
    // Fallback if currency is not supported
    return `${amount.toLocaleString(locale)} ${currency}`;
  }
}

/**
 * Format a date
 * @param date - The date to format (Date object, string, or timestamp)
 * @param format - Format type: 'short' | 'medium' | 'long' | 'full' (default: 'medium')
 * @param locale - The locale for formatting (default: 'fr-FR')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  format: 'short' | 'medium' | 'long' | 'full' = 'medium',
  locale: string = 'fr-FR'
): string {
  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const formatOptions = {
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  } as const satisfies Record<'short' | 'medium' | 'long' | 'full', Intl.DateTimeFormatOptions>;

  const options: Intl.DateTimeFormatOptions = formatOptions[format];

  return dateObj.toLocaleDateString(locale, options);
}

/**
 * Truncate a string to a maximum length
 * @param str - The string to truncate
 * @param maxLength - Maximum length (default: 50)
 * @param ellipsis - String to append when truncated (default: '...')
 * @returns Truncated string
 */
export function truncate(
  str: string,
  maxLength: number = 50,
  ellipsis: string = '...'
): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;

  const truncatedLength = maxLength - ellipsis.length;
  return str.slice(0, Math.max(0, truncatedLength)) + ellipsis;
}

/**
 * Format a number with thousands separators
 * @param num - The number to format
 * @param locale - The locale for formatting (default: 'fr-FR')
 * @returns Formatted number string
 */
export function formatNumber(
  num: number,
  locale: string = 'fr-FR'
): string {
  return num.toLocaleString(locale);
}

/**
 * Format a percentage
 * @param value - The decimal value (e.g., 0.15 for 15%)
 * @param decimals - Number of decimal places (default: 1)
 * @param locale - The locale for formatting (default: 'fr-FR')
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  decimals: number = 1,
  locale: string = 'fr-FR'
): string {
  return `${(value * 100).toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

/**
 * Format file size in human-readable format
 * @param bytes - The file size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Debounce a function
 * @param func - The function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Capitalize first letter of a string
 * @param str - The string to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate a random ID
 * @param length - Length of the ID (default: 16)
 * @returns Random ID string
 */
export function generateId(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
