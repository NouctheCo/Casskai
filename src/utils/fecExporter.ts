/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Générateur de fichiers FEC conformes à la norme française
 * + Export multi-format pour autres standards comptables
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
// ============ TYPES ============
export interface FecExportOptions {
  companyId: string;
  fiscalYear: number;
  startDate: string;            // Format ISO: YYYY-MM-DD
  endDate: string;              // Format ISO: YYYY-MM-DD
  journalCodes?: string[];      // Filtrer par journaux (optionnel)
  includeUnvalidated?: boolean; // Inclure écritures non validées
  format?: 'FEC' | 'SYSCOHADA' | 'IFRS' | 'SCF' | 'CSV';
  separator?: '|' | ';' | '\t' | ',';
  encoding?: 'UTF-8' | 'ISO-8859-1';
  decimalSeparator?: ',' | '.';
}
export interface FecExportResult {
  success: boolean;
  content: string;
  filename: string;
  stats: {
    totalEntries: number;
    totalLines: number;
    totalDebit: number;
    totalCredit: number;
    balance: number;
    journals: string[];
    period: { start: string; end: string };
  };
  errors: string[];
  warnings: string[];
}
export interface FECRow {
  journalcode: string;
  journallib: string;
  ecriturenum: string;
  ecrituredate: string;
  comptenum: string;
  comptelib: string;
  compauxnum: string;
  compauxlib: string;
  pieceref: string;
  piecedate: string;
  ecriturelib: string;
  debit: string;
  credit: string;
  ecriturelet: string;
  datelet: string;
  validdate: string;
  montantdevise: string;
  idevise: string;
}
// ============ FORMATAGE ============
// Nettoyer un texte pour l'export (supprimer séparateurs et retours ligne)
const cleanText = (text: string | null, maxLength: number, separator: string): string => {
  if (!text) return '';
  return text
    .replace(new RegExp(`[${separator.replace('|', '\\|')}\r\n]`, 'g'), ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, maxLength);
};
// Parser un montant depuis le format FEC (virgule décimale)
const parseFECAmount = (amountStr: string): number => {
  if (!amountStr || amountStr.trim() === '') return 0;
  const normalized = amountStr.replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};
// Formater un montant (virgule ou point décimal)
const formatAmount = (amountStr: string, decimalSep: string = ','): string => {
  const amount = parseFECAmount(amountStr);
  const formatted = amount.toFixed(2);
  return decimalSep === ',' ? formatted.replace('.', ',') : formatted;
};
// ============ RÉCUPÉRATION DES DONNÉES ============
const fetchFECData = async (options: FecExportOptions): Promise<FECRow[]> => {
  // Utiliser la fonction RPC existante pour récupérer les données au format FEC
  const { data, error } = await supabase.rpc('generate_fec_export', {
    p_company_id: options.companyId,
    p_start_date: options.startDate,
    p_end_date: options.endDate,
  });
  if (error) {
    logger.error('FecExporter', 'Erreur récupération données FEC:', error);
    throw new Error(`Erreur récupération données FEC: ${error.message}`);
  }
  if (!data || data.length === 0) return [];
  return data as FECRow[];
};
// Récupérer les infos de l'entreprise (SIREN pour le nom du fichier FEC)
const fetchCompanyInfo = async (companyId: string): Promise<{ siren: string; name: string; currency: string }> => {
  const { data, error } = await supabase
    .from('companies')
    .select('siret, name, default_currency')
    .eq('id', companyId)
    .single();
  if (error) throw new Error(`Erreur récupération entreprise: ${error.message}`);
  // SIREN = 9 premiers chiffres du SIRET
  const siren = data.siret ? data.siret.replace(/\s/g, '').substring(0, 9).padEnd(9, '0') : '000000000';
  return {
    siren,
    name: data.name || 'Entreprise',
    currency: data.default_currency || 'EUR'
  };
};
// ============ GÉNÉRATEURS PAR FORMAT ============
// Format FEC (France - PCG)
const generateFECContent = (
  entries: FECRow[],
  options: FecExportOptions
): string => {
  const sep = options.separator || '|';
  const decSep = options.decimalSeparator || ',';
  // En-tête FEC officiel (18 colonnes)
  const header = [
    'JournalCode',
    'JournalLib',
    'EcritureNum',
    'EcritureDate',
    'CompteNum',
    'CompteLib',
    'CompAuxNum',
    'CompAuxLib',
    'PieceRef',
    'PieceDate',
    'EcritureLib',
    'Debit',
    'Credit',
    'EcritureLet',
    'DateLet',
    'ValidDate',
    'Montantdevise',
    'Idevise',
  ].join(sep);
  const lines = entries.map(entry => [
    cleanText(entry.journalcode, 10, sep),
    cleanText(entry.journallib, 100, sep),
    cleanText(entry.ecriturenum, 20, sep),
    entry.ecrituredate,
    cleanText(entry.comptenum, 20, sep),
    cleanText(entry.comptelib, 100, sep),
    cleanText(entry.compauxnum, 20, sep),
    cleanText(entry.compauxlib, 100, sep),
    cleanText(entry.pieceref, 50, sep),
    entry.piecedate,
    cleanText(entry.ecriturelib, 200, sep),
    formatAmount(entry.debit, decSep),
    formatAmount(entry.credit, decSep),
    cleanText(entry.ecriturelet, 10, sep),
    entry.datelet,
    entry.validdate,
    formatAmount(entry.montantdevise, decSep),
    cleanText(entry.idevise, 3, sep),
  ].join(sep));
  return [header, ...lines].join('\n');
};
// Format SYSCOHADA (Afrique OHADA - XOF/XAF)
const generateSYSCOHADAContent = (
  entries: FECRow[],
  options: FecExportOptions
): string => {
  const sep = options.separator || ';';
  const decSep = options.decimalSeparator || ',';
  const header = [
    'NumCompte',
    'IntituleCompte',
    'CodeJournal',
    'LibelleJournal',
    'NumPiece',
    'DatePiece',
    'Libelle',
    'Debit',
    'Credit',
    'Devise',
    'DateValidation',
  ].join(sep);
  const lines = entries.map(entry => [
    cleanText(entry.comptenum, 20, sep),
    cleanText(entry.comptelib, 100, sep),
    cleanText(entry.journalcode, 10, sep),
    cleanText(entry.journallib, 100, sep),
    cleanText(entry.pieceref, 50, sep),
    entry.piecedate,
    cleanText(entry.ecriturelib, 200, sep),
    formatAmount(entry.debit, decSep),
    formatAmount(entry.credit, decSep),
    cleanText(entry.idevise || 'XOF', 3, sep),
    entry.validdate,
  ].join(sep));
  return [header, ...lines].join('\n');
};
// Format SCF (Maghreb - MAD/DZD/TND)
const generateSCFContent = (
  entries: FECRow[],
  options: FecExportOptions
): string => {
  const sep = options.separator || '|';
  const decSep = options.decimalSeparator || ',';
  const header = [
    'CodeJournal',
    'LibelleJournal',
    'NumeroEcriture',
    'DateEcriture',
    'NumeroCompte',
    'LibelleCompte',
    'Reference',
    'Libelle',
    'Debit',
    'Credit',
    'DateValidation',
  ].join(sep);
  const lines = entries.map(entry => [
    cleanText(entry.journalcode, 10, sep),
    cleanText(entry.journallib, 100, sep),
    cleanText(entry.ecriturenum, 20, sep),
    entry.ecrituredate,
    cleanText(entry.comptenum, 20, sep),
    cleanText(entry.comptelib, 100, sep),
    cleanText(entry.pieceref, 50, sep),
    cleanText(entry.ecriturelib, 200, sep),
    formatAmount(entry.debit, decSep),
    formatAmount(entry.credit, decSep),
    entry.validdate,
  ].join(sep));
  return [header, ...lines].join('\n');
};
// Format IFRS / CSV international
const generateIFRSContent = (
  entries: FECRow[],
  options: FecExportOptions
): string => {
  const sep = options.separator || ',';
  const decSep = options.decimalSeparator || '.';
  const header = [
    'AccountCode',
    'AccountName',
    'JournalCode',
    'JournalName',
    'EntryNumber',
    'TransactionDate',
    'Reference',
    'Description',
    'Debit',
    'Credit',
    'Currency',
    'ValidationDate',
  ].join(sep);
  const lines = entries.map(entry => {
    // Échapper pour CSV si nécessaire
    const escapeCSV = (text: string): string => {
      if (text.includes(sep) || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };
    // Convertir date YYYYMMDD en YYYY-MM-DD
    const formatDateISO = (dateStr: string): string => {
      if (dateStr.length === 8) {
        return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
      }
      return dateStr;
    };
    return [
      entry.comptenum,
      escapeCSV(entry.comptelib),
      entry.journalcode,
      escapeCSV(entry.journallib),
      entry.ecriturenum,
      formatDateISO(entry.ecrituredate),
      entry.pieceref || '',
      escapeCSV(entry.ecriturelib),
      formatAmount(entry.debit, decSep),
      formatAmount(entry.credit, decSep),
      entry.idevise || 'EUR',
      formatDateISO(entry.validdate),
    ].join(sep);
  });
  return [header, ...lines].join('\n');
};
// ============ EXPORT PRINCIPAL ============
export const exportAccountingFile = async (options: FecExportOptions): Promise<FecExportResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  try {
    // Récupérer les infos entreprise
    const company = await fetchCompanyInfo(options.companyId);
    // Récupérer les écritures au format FEC
    const entries = await fetchFECData(options);
    if (entries.length === 0) {
      return {
        success: false,
        content: '',
        filename: '',
        stats: {
          totalEntries: 0,
          totalLines: 0,
          totalDebit: 0,
          totalCredit: 0,
          balance: 0,
          journals: [],
          period: { start: options.startDate, end: options.endDate },
        },
        errors: ['Aucune écriture trouvée pour la période sélectionnée'],
        warnings: [],
      };
    }
    // Calculer les statistiques
    const totalDebit = entries.reduce((sum, e) => sum + parseFECAmount(e.debit), 0);
    const totalCredit = entries.reduce((sum, e) => sum + parseFECAmount(e.credit), 0);
    const balance = Math.round((totalDebit - totalCredit) * 100) / 100;
    const journals = [...new Set(entries.map(e => e.journalcode))];
    const entryNumbers = [...new Set(entries.map(e => e.ecriturenum))];
    // Avertissements
    if (Math.abs(balance) > 0.01) {
      warnings.push(`⚠️ Déséquilibre détecté: ${balance.toFixed(2)} (Débit: ${totalDebit.toFixed(2)}, Crédit: ${totalCredit.toFixed(2)})`);
    }
    // Générer le contenu selon le format
    let content: string;
    let extension: string;
    switch (options.format) {
      case 'SYSCOHADA':
        content = generateSYSCOHADAContent(entries, options);
        extension = 'txt';
        break;
      case 'SCF':
        content = generateSCFContent(entries, options);
        extension = 'txt';
        break;
      case 'IFRS':
      case 'CSV':
        content = generateIFRSContent(entries, options);
        extension = 'csv';
        break;
      case 'FEC':
      default:
        content = generateFECContent(entries, options);
        extension = 'txt';
        break;
    }
    // Nom du fichier
    const endDateFormatted = options.endDate.replace(/-/g, '');
    let filename: string;
    if (options.format === 'FEC' || !options.format) {
      // Nom FEC officiel: SIRENFECYYYYMMDD.txt
      filename = `${company.siren}FEC${endDateFormatted}.txt`;
    } else {
      filename = `Export_${options.format}_${company.siren}_${endDateFormatted}.${extension}`;
    }
    return {
      success: true,
      content,
      filename,
      stats: {
        totalEntries: entryNumbers.length,
        totalLines: entries.length,
        totalDebit: Math.round(totalDebit * 100) / 100,
        totalCredit: Math.round(totalCredit * 100) / 100,
        balance,
        journals,
        period: { start: options.startDate, end: options.endDate },
      },
      errors,
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      filename: '',
      stats: {
        totalEntries: 0,
        totalLines: 0,
        totalDebit: 0,
        totalCredit: 0,
        balance: 0,
        journals: [],
        period: { start: options.startDate, end: options.endDate },
      },
      errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
      warnings,
    };
  }
};
// ============ TÉLÉCHARGEMENT ============
export const downloadExportFile = (
  result: FecExportResult,
  encoding: 'UTF-8' | 'ISO-8859-1' = 'UTF-8'
): void => {
  if (!result.success || !result.content) return;
  let blob: Blob;
  if (encoding === 'UTF-8') {
    // UTF-8 avec BOM pour compatibilité Excel
    const BOM = '\uFEFF';
    blob = new Blob([BOM + result.content], { type: 'text/plain;charset=UTF-8' });
  } else {
    // ISO-8859-1 pour vieux logiciels
    blob = new Blob([result.content], { type: 'text/plain;charset=ISO-8859-1' });
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
export default exportAccountingFile;