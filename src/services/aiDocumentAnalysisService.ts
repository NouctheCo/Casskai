/**
 * CassKai - Service d'analyse de documents par IA
 * Gère l'upload, l'analyse et la validation des documents comptables
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type {
  DocumentAnalysisResult,
  JournalEntryExtracted,
  JournalEntryLine,
  DocumentType,
} from '@/types/ai-document.types';

// Configuration du worker PDF.js avec le fichier local
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

class AIDocumentAnalysisService {
  /**
   * Convertit un PDF en image PNG (première page)
   * @param file Fichier PDF à convertir
   * @returns Blob de l'image PNG générée
   */
  private async convertPdfToImage(file: File): Promise<Blob> {
    try {
      logger.info('[AI] Converting PDF to image...', { fileName: file.name });

      // Lire le fichier PDF comme ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Charger le document PDF
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDocument = await loadingTask.promise;

      // Récupérer la première page
      const page = await pdfDocument.getPage(1);

      // Définir le scale pour une résolution optimale (2x = 144 DPI)
      const scale = 2.0;
      const viewport = page.getViewport({ scale });

      // Créer un canvas pour le rendu
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Rendre la page sur le canvas
      const renderContext = {
        canvasContext: context,
        canvas,
        viewport,
      };

      await page.render(renderContext).promise;

      // Convertir le canvas en Blob PNG
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          'image/png',
          0.95 // Qualité PNG (95%)
        );
      });

      logger.info('[AI] PDF converted to image', {
        originalSize: file.size,
        imageSize: blob.size,
        dimensions: `${canvas.width}x${canvas.height}`,
      });

      return blob;
    } catch (error) {
      logger.error('[AI] PDF conversion failed', error);
      throw new Error('Échec de la conversion du PDF en image');
    }
  }

  /**
   * Convertit un fichier en base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extraire la partie base64 (après data:*;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Analyse un document uploadé et retourne une écriture comptable pré-remplie
   */
  async analyzeDocument(
    file: File,
    companyId: string,
    documentType: DocumentType = 'invoice'
  ): Promise<DocumentAnalysisResult> {
    try {
      // 1. Valider le fichier
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // 2. Convertir le fichier (PDF → Image si nécessaire)
      let fileToAnalyze: File = file;
      let mimeType = file.type;

      if (file.type === 'application/pdf') {
        logger.info('[AI] PDF detected, converting to image...', { fileName: file.name });
        const imageBlob = await this.convertPdfToImage(file);
        // Créer un nouveau File à partir du Blob image
        fileToAnalyze = new File(
          [imageBlob],
          file.name.replace('.pdf', '.png'),
          { type: 'image/png' }
        );
        mimeType = 'image/png';
        logger.info('[AI] PDF converted successfully', { newFileName: fileToAnalyze.name });
      }

      // 3. Convertir le fichier en base64
      const base64Data = await this.fileToBase64(fileToAnalyze);

      // 4. Appeler la Edge Function avec base64
      const { data, error } = await supabase.functions.invoke('ai-document-analysis', {
        body: {
          document_base64: base64Data,
          document_type: documentType,
          company_id: companyId,
          expected_format: 'journal_entry',
          mime_type: mimeType
        }
      });

      if (error) {
        logger.error('AIDocumentAnalysis', 'Edge Function error:', error);
        // Fallback message utilisable
        if (error instanceof Error && error.message.includes('CORS')) {
          return {
            success: false,
            error: 'Erreur de configuration du service IA. Veuillez réessayer ou contacter le support.'
          };
        }
        throw error;
      }

      // 4. Valider la réponse
      const validationResult = this.validateExtractedEntry(data);

      return { 
        success: true, 
        data: {
          ...data,
          validation_errors: validationResult.errors,
          validation_warnings: validationResult.warnings
        }
      };

    } catch (error) {
      logger.error('AIDocumentAnalysis', 'Analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Service d\'analyse indisponible temporairement'
      };
    }
  }

  /**
   * Analyse à partir d'une image en base64 (pour mobile/camera)
   */
  async analyzeFromBase64(
    base64Image: string,
    companyId: string,
    documentType: DocumentType = 'receipt'
  ): Promise<DocumentAnalysisResult> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-document-analysis', {
        body: {
          document_base64: base64Image,
          document_type: documentType,
          company_id: companyId,
          expected_format: 'journal_entry'
        }
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      logger.error('AIDocumentAnalysis', 'Base64 analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Valide un fichier avant upload
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10 MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Fichier trop volumineux (max 10MB)'
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Format non supporté. Formats acceptés : PDF, JPG, PNG, WebP'
      };
    }

    return { valid: true };
  }

  /**
   * Valide et corrige les données extraites avant insertion
   */
  validateExtractedEntry(extracted: JournalEntryExtracted): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    corrected?: JournalEntryExtracted;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!extracted || !extracted.lines) {
      errors.push('Invalid extracted data structure');
      return { valid: false, errors, warnings };
    }

    // Vérifier équilibre débit/crédit
    const totalDebit = extracted.lines.reduce((s, l) => s + (l.debit_amount || 0), 0);
    const totalCredit = extracted.lines.reduce((s, l) => s + (l.credit_amount || 0), 0);
    const diff = Math.abs(totalDebit - totalCredit);

    if (diff > 0.01) {
      errors.push(`Unbalanced entry: Debit ${totalDebit.toFixed(2)} ≠ Credit ${totalCredit.toFixed(2)} (diff: ${diff.toFixed(2)})`);
    }

    // Vérifier dates valides
    if (!extracted.entry_date || isNaN(Date.parse(extracted.entry_date))) {
      errors.push('Invalid entry date');
    }

    // Vérifier au moins 2 lignes
    if (extracted.lines.length < 2) {
      errors.push('Minimum 2 lines required for a valid journal entry');
    }

    // Vérifier que toutes les lignes ont un compte
    const linesWithoutAccount = extracted.lines.filter(l => !l.account_suggestion && !l.account_class);
    if (linesWithoutAccount.length > 0) {
      errors.push(`${linesWithoutAccount.length} line(s) without account suggestion`);
    }

    // Warnings selon confidence score
    if (extracted.confidence_score < 70) {
      warnings.push(`Low confidence score (${extracted.confidence_score}%) - Manual verification recommended`);
    } else if (extracted.confidence_score < 85) {
      warnings.push(`Medium confidence score (${extracted.confidence_score}%) - Please review carefully`);
    }

    // Vérifier montants cohérents avec raw_extraction
    if (extracted.raw_extraction?.total_ttc) {
      const extractedTotal = Math.max(totalDebit, totalCredit);
      const diff = Math.abs(extractedTotal - extracted.raw_extraction.total_ttc);
      
      if (diff > 0.5) {
        warnings.push(`Amount mismatch: Entry total ${extractedTotal.toFixed(2)} vs Document total ${extracted.raw_extraction.total_ttc.toFixed(2)}`);
      }
    }

    // ✅ AUTO-CORRECTION : Recalculer HT, TVA, TTC s'ils ne s'ajoutent pas
    const corrected = JSON.parse(JSON.stringify(extracted));
    const rawExt = corrected.raw_extraction;
    
    if (rawExt && (rawExt.total_ht || rawExt.vat_amount || rawExt.total_ttc)) {
      const ht = Number(rawExt.total_ht) || 0;
      const va = Number(rawExt.vat_amount) || 0;
      const tt = Number(rawExt.total_ttc) || 0;
      
      // Vérifier HT + TVA = TTC
      const sum = Math.round((ht + va) * 100) / 100;
      const shouldBe = Math.round(tt * 100) / 100;
      
      if (ht && va && Math.abs(sum - shouldBe) > 0.01) {
        // Recalculer: si HT et VA sont présents, recalculer TTC
        corrected.raw_extraction.total_ttc = sum;
        
        // Mettre à jour les lignes d'écriture si facture d'achat
        if (corrected.lines && corrected.lines.length >= 2) {
          // Chercher la ligne de TVA pour mettre à jour son montant
          const tvaLine = corrected.lines.find((l: JournalEntryLine) => l.account_class?.toString().startsWith('445') || l.account_class?.toString().startsWith('44'));
          if (tvaLine) {
            tvaLine.debit_amount = va;
            tvaLine.credit_amount = 0;
          }
          // Chercher la ligne de fournisseurs/clients et mettre à jour TTC
          const creditorLine = corrected.lines.find((l: JournalEntryLine) => l.account_class?.toString().startsWith('40') || l.account_class?.toString().startsWith('41'));
          if (creditorLine && creditorLine.credit_amount === 0) {
            creditorLine.credit_amount = sum;
          }
        }
        
        warnings.push(`Auto-corrected: HT ${ht.toFixed(2)} + TVA ${va.toFixed(2)} = TTC ${sum.toFixed(2)} (was ${shouldBe.toFixed(2)})`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      corrected
    };
  }

  /**
   * Trouve un compte dans le plan comptable par classe ou numéro
   */
  async findAccountByClass(
    companyId: string,
    accountClass: string,
    accountNumber?: string
  ): Promise<{ id: string; account_number: string; account_name: string } | null> {
    try {
      let query = supabase
        .from('chart_of_accounts')
        .select('id, account_number, account_name')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (accountNumber) {
        // Recherche exacte par numéro
        query = query.eq('account_number', accountNumber);
      } else {
        // Recherche par classe (premiers chiffres)
        query = query.like('account_number', `${accountClass}%`);
      }

      const { data } = await query.limit(1).maybeSingle();

      return data || null;
    } catch (error) {
      logger.error('AIDocumentAnalysis', 'Account lookup error:', error);
      return null;
    }
  }

  /**
   * Convertit les lignes extraites en format JournalEntryForm
   */
  async mapToFormFormat(
    extracted: JournalEntryExtracted,
    companyId: string,
    currency: string
  ): Promise<{
    entryDate: Date;
    description: string;
    referenceNumber: string;
    items: Array<{
      accountId: string;
      debitAmount: number;
      creditAmount: number;
      description: string;
      currency: string;
    }>;
  } | null> {
    try {
      const items = [];

      for (const line of extracted.lines) {
        // Trouver le compte correspondant
        const account = await this.findAccountByClass(
          companyId,
          line.account_class
        );

        if (!account) {
          logger.warn('AIDocumentAnalysis', `Account not found for class ${line.account_class}`);
          continue;
        }

        items.push({
          accountId: account.id,
          debitAmount: line.debit_amount || 0,
          creditAmount: line.credit_amount || 0,
          description: line.description || '',
          currency
        });
      }

      if (items.length < 2) {
        logger.error('AIDocumentAnalysis', 'Not enough valid lines after mapping');
        return null;
      }

      return {
        entryDate: new Date(extracted.entry_date),
        description: extracted.description,
        referenceNumber: extracted.reference_number,
        items
      };
    } catch (error) {
      logger.error('AIDocumentAnalysis', 'Mapping error:', error);
      return null;
    }
  }
}

export const aiDocumentAnalysisService = new AIDocumentAnalysisService();
