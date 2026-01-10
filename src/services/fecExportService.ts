/**
 * Service d'export FEC (Fichier des Écritures Comptables)
 * Format normalisé pour l'administration fiscale française (DGFiP)
 * Utilise les fonctions RPC generate_fec_export, export_fec_to_csv, validate_fec_export
 */
import { supabase } from '../lib/supabase';
import { auditService } from './auditService';
import { logger } from '@/lib/logger';
interface FECValidation {
  is_valid: boolean;
  total_lines: number;
  total_debit: number;
  total_credit: number;
  balance_difference: number;
  period_start: string;
  period_end: string;
  errors: Array<{
    type: string;
    message: string;
    [key: string]: any;
  }>;
}
interface FECLine {
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
/**
 * Valider un export FEC avant génération
 */
export async function validateFECExport(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<FECValidation> {
  try {
    const { data, error } = await supabase.rpc('validate_fec_export', {
      p_company_id: companyId,
      p_start_date: startDate,
      p_end_date: endDate,
    });
    if (error) {
      logger.error('FecExport', 'Erreur RPC validate_fec_export:', error);
      throw error;
    }
    if (!data) {
      throw new Error('Aucune donnée retournée par la validation FEC');
    }
    return data as FECValidation;
  } catch (error) {
    logger.error('FecExport', 'Erreur validation export FEC:', error);
    throw error;
  }
}
/**
 * Générer l'export FEC au format tableau (pour affichage dans l'UI)
 */
export async function generateFECExport(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<FECLine[]> {
  try {
    const { data, error } = await supabase.rpc('generate_fec_export', {
      p_company_id: companyId,
      p_start_date: startDate,
      p_end_date: endDate,
    });
    if (error) {
      logger.error('FecExport', 'Erreur RPC generate_fec_export:', error);
      throw error;
    }
    if (!data || data.length === 0) {
      logger.warn('FecExport', 'Aucune écriture comptable trouvée pour la période');
      return [];
    }
    await auditService.logAsync({
      action: 'generate_fec_export',
      entityType: 'fec_export',
      entityId: companyId,
      metadata: {
        period_start: startDate,
        period_end: endDate,
        total_lines: data.length,
      },
    });
    return data as FECLine[];
  } catch (error) {
    logger.error('FecExport', 'Erreur génération export FEC:', error);
    throw error;
  }
}
/**
 * Générer et télécharger le fichier FEC au format CSV (pipe-separated)
 */
export async function downloadFECFile(
  companyId: string,
  startDate: string,
  endDate: string,
  companyName: string = 'Entreprise'
): Promise<void> {
  try {
    // 1. Valider l'export avant génération
    const validation = await validateFECExport(companyId, startDate, endDate);
    if (!validation.is_valid) {
      const errorMessages = validation.errors
        .map((e) => e.message)
        .join('\n');
      throw new Error(
        `Export FEC invalide:\n${errorMessages}\n\nDifférence débit/crédit: ${validation.balance_difference.toFixed(2)} €`
      );
    }
    // 2. Générer le contenu CSV
    const { data, error } = await supabase.rpc('export_fec_to_csv', {
      p_company_id: companyId,
      p_start_date: startDate,
      p_end_date: endDate,
    });
    if (error) {
      logger.error('FecExport', 'Erreur RPC export_fec_to_csv:', error);
      throw error;
    }
    if (!data) {
      throw new Error('Aucun contenu CSV généré');
    }
    // 3. Créer le nom de fichier conforme FEC
    // Format: SIRENFECAAMMJJhhmmss.txt
    const now = new Date();
    const timestamp =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');
    const sanitizedName = companyName.replace(/[^a-zA-Z0-9]/g, '');
    const fileName = `${sanitizedName}_FEC_${timestamp}.txt`;
    // 4. Déclencher le téléchargement
    const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    // 5. Log audit
    await auditService.logAsync({
      action: 'download_fec_file',
      entityType: 'fec_export',
      entityId: companyId,
      metadata: {
        period_start: startDate,
        period_end: endDate,
        file_name: fileName,
        total_lines: validation.total_lines,
        total_debit: validation.total_debit,
        total_credit: validation.total_credit,
      },
    });
    logger.debug('FecExport', `✅ Fichier FEC téléchargé: ${fileName}`);
  } catch (error) {
    logger.error('FecExport', 'Erreur téléchargement fichier FEC:', error);
    throw error;
  }
}
/**
 * Générer un aperçu rapide de l'export FEC (premières lignes)
 */
export async function previewFECExport(
  companyId: string,
  startDate: string,
  endDate: string,
  limit: number = 10
): Promise<{
  validation: FECValidation;
  preview: FECLine[];
}> {
  try {
    // Validation complète
    const validation = await validateFECExport(companyId, startDate, endDate);
    // Aperçu des premières lignes
    const allLines = await generateFECExport(companyId, startDate, endDate);
    const preview = allLines.slice(0, limit);
    return {
      validation,
      preview,
    };
  } catch (error) {
    logger.error('FecExport', 'Erreur aperçu export FEC:', error);
    throw error;
  }
}
export const fecExportService = {
  validateFECExport,
  generateFECExport,
  downloadFECFile,
  previewFECExport,
};