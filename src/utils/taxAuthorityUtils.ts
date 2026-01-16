/**
 * Utilitaires de cryptage/décryptage pour les credentials
 */
// Note: En production, utiliser une vraie librairie de crypto (crypto-js, tweetnacl, etc.)
// Ceci est une implémentation basique pour la démo
import { logger } from '@/lib/logger';

export class CredentialEncryption {
  /**
   * Chiffre une chaîne (implémentation basique)
   * À remplacer par une vraie implémentation en production
   */
  static encrypt(plaintext: string, _key?: string): string {
    // Pour la démo, on utilise juste base64
    // En production: utiliser AES-256-GCM ou similaire
    return btoa(plaintext);
  }
  /**
   * Déchiffre une chaîne
   */
  static decrypt(ciphertext: string, _key?: string): string {
    try {
      return atob(ciphertext);
    } catch (_error) {
      throw new Error('Erreur lors du déchiffrement');
    }
  }
  /**
   * Genère une clé de chiffrement
   */
  static generateKey(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  /**
   * Hash une chaîne (SHA-256)
   */
  static async hash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  /**
   * Génère un hash de fichier
   */
  static async hashFile(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
/**
 * Utilitaires de retry avec backoff exponentiel
 */
export class RetryManager {
  static async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 5,
    initialDelayMs: number = 300,
    maxDelayMs: number = 30000
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = initialDelayMs;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries) {
          // Backoff exponentiel avec jitter
          const jitter = Math.random() * 0.1 * delay;
          const actualDelay = Math.min(delay + jitter, maxDelayMs);
          logger.debug('TaxAuthority', `Tentative ${attempt + 1} échouée. Nouvelle tentative dans ${Math.round(actualDelay)}ms`);
          await new Promise(resolve => setTimeout(resolve, actualDelay));
          delay = Math.min(delay * 2, maxDelayMs);
        }
      }
    }
    throw lastError || new Error('Impossible de compléter l\'opération après plusieurs tentatives');
  }
}
/**
 * Validateurs pour les soumissions
 */
export class SubmissionValidator {
  static validateFileSize(fileSize: number, maxSize: number): { valid: boolean; error?: string } {
    if (fileSize > maxSize) {
      return {
        valid: false,
        error: `La taille du fichier (${(fileSize / 1024 / 1024).toFixed(2)}MB) dépasse la limite (${(maxSize / 1024 / 1024).toFixed(2)}MB)`,
      };
    }
    return { valid: true };
  }
  static validateFileFormat(format: string, supportedFormats: string[]): { valid: boolean; error?: string } {
    if (!supportedFormats.includes(format)) {
      return {
        valid: false,
        error: `Format ${format} non supporté. Formats acceptés: ${supportedFormats.join(', ')}`,
      };
    }
    return { valid: true };
  }
  static validateTaxId(taxId: string, countryCode: string): { valid: boolean; error?: string } {
    const patterns: Record<string, RegExp> = {
      FR: /^[0-9]{14}$/, // SIREN
      SN: /^[A-Z]{2}[0-9]{8}$/, // NIF Sénégal
      KE: /^[A-Z]{2}[0-9]{8}[A-Z]$/, // PIN Kenya
      NG: /^[0-9]{12}$/, // TIN Nigeria
      DZ: /^[0-9]{10}$/, // NIF Algérie
      MA: /^[A-Z]{2}[0-9]{7}[A-Z]{3}$/, // NIF Maroc
    };
    const pattern = patterns[countryCode];
    if (!pattern) {
      return { valid: true }; // Pas de validation si pays inconnu
    }
    if (!pattern.test(taxId)) {
      return {
        valid: false,
        error: `Format d'identifiant fiscal invalide pour ${countryCode}`,
      };
    }
    return { valid: true };
  }
  static validateEmail(email: string): { valid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        valid: false,
        error: 'Format d\'email invalide',
      };
    }
    return { valid: true };
  }
  static validateUrl(url: string): { valid: boolean; error?: string } {
    try {
      new URL(url);
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'URL invalide',
      };
    }
  }
}
/**
 * Formateurs pour les dates et montants
 */
export class FormatterUtils {
  static formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR');
  }
  static formatDateTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleString('fr-FR');
  }
  static formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
    }).format(amount);
  }
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100  } ${  sizes[i]}`;
  }
  static formatPercentage(value: number, decimals: number = 2): string {
    return (`${value.toFixed(decimals)  }%`);
  }
}
/**
 * Utilitaires de rapport d'erreur
 */
export class ErrorFormatter {
  static formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return (error as any).message;
    }
    return 'Erreur inconnue';
  }
  static getErrorType(error: unknown): string {
    if (error instanceof TypeError) return 'TypeError';
    if (error instanceof ReferenceError) return 'ReferenceError';
    if (error instanceof SyntaxError) return 'SyntaxError';
    if (error instanceof Error) return error.name;
    return 'Unknown';
  }
  static createErrorReport(error: unknown, context?: Record<string, any>): Record<string, any> {
    return {
      type: this.getErrorType(error),
      message: this.formatError(error),
      timestamp: new Date().toISOString(),
      context,
    };
  }
}
