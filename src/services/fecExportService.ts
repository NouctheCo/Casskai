/**
 * Service d'export FEC (Fichier des Écritures Comptables) - Conforme DGFiP
 * Génère les exports comptables conformes à la réglementation française
 */

import { supabase } from '@/lib/supabase';

interface FECLine {
  JournalCode: string;         // Code journal
  JournalLib: string;          // Libellé journal
  EcritureNum: string;         // Numéro d'écriture
  EcritureDate: string;        // Date d'écriture (YYYYMMDD)
  CompteNum: string;           // Numéro de compte
  CompteLib: string;           // Libellé du compte
  CompAuxNum?: string;         // Numéro de compte auxiliaire
  CompAuxLib?: string;         // Libellé compte auxiliaire
  PieceRef: string;            // Référence de la pièce
  PieceDate: string;           // Date de la pièce (YYYYMMDD)
  EcritureLib: string;         // Libellé de l'écriture
  Debit: string;               // Montant débit (0.00 si crédit)
  Credit: string;              // Montant crédit (0.00 si débit)
  EcritureLet?: string;        // Code lettrage
  DateLet?: string;            // Date de lettrage (YYYYMMDD)
  ValidDate: string;           // Date de validation (YYYYMMDD)
  Montantdevise?: string;      // Montant en devise
  Idevise?: string;            // Identifiant devise
}

interface FECExportParams {
  companyId: string;
  year: number;
  startDate: Date;
  endDate: Date;
  includeDocuments?: boolean;
  format?: 'TXT' | 'CSV';
}

interface FECExportResult {
  success: boolean;
  exportId?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  checksum?: string;
  error?: string;
  recordCount?: number;
}

export class FECExportService {
  private static instance: FECExportService;

  static getInstance(): FECExportService {
    if (!FECExportService.instance) {
      FECExportService.instance = new FECExportService();
    }
    return FECExportService.instance;
  }

  /**
   * Génère un export FEC pour une entreprise
   */
  async generateFECExport(params: FECExportParams): Promise<FECExportResult> {
    try {
      console.log('🏭 Génération export FEC...', params);

      // 1. Créer l'entrée d'export en base
      const { data: exportRecord, error: createError } = await supabase
        .from('fec_exports')
        .insert({
          company_id: params.companyId,
          requested_by: (await supabase.auth.getUser()).data.user?.id,
          export_year: params.year,
          start_date: params.startDate.toISOString().split('T')[0],
          end_date: params.endDate.toISOString().split('T')[0],
          include_documents: params.includeDocuments || false,
          status: 'processing'
        })
        .select()
        .single();

      if (createError) throw createError;

      // 2. Récupérer les données comptables
      const fecLines = await this.fetchAccountingData(params);

      // 3. Générer le fichier FEC
      const fecContent = this.generateFECContent(fecLines, params.format || 'TXT');

      // 4. Calculer les métadonnées
      const fileName = this.generateFileName(params);
      const checksum = await this.calculateChecksum(fecContent);

      // 5. Upload du fichier (simulation - en production, utiliser un service de stockage)
      const fileUrl = await this.uploadFile(fecContent, fileName);

      // 6. Mettre à jour l'enregistrement
      const { error: updateError } = await supabase
        .from('fec_exports')
        .update({
          status: 'completed',
          file_url: fileUrl,
          file_size: new Blob([fecContent]).size,
          checksum: checksum,
          generated_at: new Date().toISOString()
        })
        .eq('id', exportRecord.id);

      if (updateError) throw updateError;

      console.log('✅ Export FEC généré avec succès');

      return {
        success: true,
        exportId: exportRecord.id,
        fileUrl,
        fileName,
        fileSize: new Blob([fecContent]).size,
        checksum,
        recordCount: fecLines.length
      };

    } catch (error) {
      console.error('❌ Erreur génération FEC:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Récupère les données comptables pour l'export FEC
   */
  private async fetchAccountingData(params: FECExportParams): Promise<FECLine[]> {
    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select(`
        *,
        journals(code, name),
        journal_entry_lines(
          *,
          chart_of_accounts(account_number, account_name)
        )
      `)
      .eq('company_id', params.companyId)
      .gte('entry_date', params.startDate.toISOString().split('T')[0])
      .lte('entry_date', params.endDate.toISOString().split('T')[0])
      .eq('is_validated', true)
      .order('entry_date', { ascending: true });

    if (error) throw error;

    const fecLines: FECLine[] = [];

    entries?.forEach(entry => {
      entry.journal_entry_lines?.forEach((line: any) => {
        fecLines.push({
          JournalCode: entry.journals.code || 'VEN',
          JournalLib: entry.journals.name || 'Ventes',
          EcritureNum: entry.entry_number,
          EcritureDate: this.formatDate(entry.entry_date),
          CompteNum: line.chart_of_accounts.account_number,
          CompteLib: line.chart_of_accounts.account_name,
          PieceRef: entry.reference || entry.entry_number,
          PieceDate: this.formatDate(entry.entry_date),
          EcritureLib: line.description || entry.description,
          Debit: line.debit_amount ? this.formatAmount(line.debit_amount) : '0,00',
          Credit: line.credit_amount ? this.formatAmount(line.credit_amount) : '0,00',
          ValidDate: this.formatDate(entry.validated_at || entry.created_at)
        });
      });
    });

    return fecLines;
  }

  /**
   * Génère le contenu du fichier FEC
   */
  private generateFECContent(lines: FECLine[], format: 'TXT' | 'CSV'): string {
    const separator = format === 'CSV' ? ';' : '\t';

    // En-tête FEC réglementaire
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
      'Idevise'
    ].join(separator);

    const content = lines.map(line => [
      line.JournalCode,
      line.JournalLib,
      line.EcritureNum,
      line.EcritureDate,
      line.CompteNum,
      line.CompteLib,
      line.CompAuxNum || '',
      line.CompAuxLib || '',
      line.PieceRef,
      line.PieceDate,
      line.EcritureLib,
      line.Debit,
      line.Credit,
      line.EcritureLet || '',
      line.DateLet || '',
      line.ValidDate,
      line.Montantdevise || '',
      line.Idevise || ''
    ].join(separator)).join('\n');

    return header + '\n' + content;
  }

  /**
   * Génère le nom de fichier conforme FEC
   */
  private generateFileName(params: FECExportParams): string {
    // Format: SIRENFECAAMMJJhhmmss.txt
    // Exemple: 123456789FEC20241225143022.txt
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
                     (now.getMonth() + 1).toString().padStart(2, '0') +
                     now.getDate().toString().padStart(2, '0') +
                     now.getHours().toString().padStart(2, '0') +
                     now.getMinutes().toString().padStart(2, '0') +
                     now.getSeconds().toString().padStart(2, '0');

    const extension = params.format === 'CSV' ? 'csv' : 'txt';

    // Pour l'exemple, utiliser un SIREN fictif - en production, récupérer le vrai SIREN
    return `123456789FEC${timestamp}.${extension}`;
  }

  /**
   * Formate une date au format AAAAMMJJ
   */
  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Formate un montant au format français (virgule décimale)
   */
  private formatAmount(amount: number): string {
    return amount.toFixed(2).replace('.', ',');
  }

  /**
   * Calcule le checksum du fichier
   */
  private async calculateChecksum(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Upload du fichier (simulation)
   */
  private async uploadFile(content: string, fileName: string): Promise<string> {
    // En production, uploader vers un service de stockage sécurisé
    // Pour la démo, retourner une URL fictive
    return `https://storage.casskai.app/exports/${fileName}`;
  }

  /**
   * Récupère l'historique des exports FEC pour une entreprise
   */
  async getFECExports(companyId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('fec_exports')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Télécharge un export FEC existant
   */
  async downloadFECExport(exportId: string): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
    try {
      // Incrémenter le compteur de téléchargement
      const { data, error } = await supabase
        .from('fec_exports')
        .update({
          download_count: 1, // Simplification - en production utiliser une requête RPC
          last_downloaded_at: new Date().toISOString()
        })
        .eq('id', exportId)
        .select('file_url')
        .single();

      if (error) throw error;

      return {
        success: true,
        fileUrl: data.file_url
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur téléchargement'
      };
    }
  }

  /**
   * Valide la conformité d'un export FEC
   */
  async validateFECExport(exportId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    // Récupérer les données de l'export
    const { data: exportData } = await supabase
      .from('fec_exports')
      .select('*')
      .eq('id', exportId)
      .single();

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validations basiques
    if (!exportData?.file_url) {
      errors.push('Fichier manquant');
    }

    if (!exportData?.checksum) {
      warnings.push('Checksum manquant - intégrité non vérifiée');
    }

    // En production, ajouter d'autres validations :
    // - Vérification équilibre débit/crédit
    // - Contrôle continuité des numéros d'écriture
    // - Validation format des comptes
    // - Contrôle cohérence dates

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Export de l'instance singleton
export const fecExportService = FECExportService.getInstance();