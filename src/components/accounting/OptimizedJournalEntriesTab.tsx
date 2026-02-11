import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import AccountingRulesService from '@/services/accountingRulesService';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { journalEntriesService } from '@/services/journalEntriesService';
import { journalEntryAttachmentService } from '@/services/journalEntryAttachmentService';
import { aiDocumentAnalysisService } from '@/services/ai/documentService';
import { useAuth } from '@/contexts/AuthContext';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import JournalEntryAttachments from '@/components/accounting/JournalEntryAttachments';
import { WorkflowActions } from '@/components/accounting/WorkflowActions';
import { logger } from '@/lib/logger';
import { formatCurrency } from '@/lib/utils';
import type { JournalEntryExtracted } from '@/types/ai-document.types';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  FileText,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Zap,
  RefreshCw,
  Copy,
  Paperclip,
  Upload,
  Loader2,
  Sparkles
} from 'lucide-react';
interface EntryLine {
  account: string;
  description: string;
  debit: string;
  credit: string;
  accountLabel?: string;
}
interface EntryFormData {
  date: string;
  reference: string;
  description: string;
  lines: EntryLine[];
}
interface EntryData {
  id?: number | string;
  date: string;
  reference: string;
  description: string;
  lines?: EntryLine[];
  status?: string;
  isLocked?: boolean;
}
function useEntryFormState(entry: EntryData | null) {
  const [formData, setFormData] = useState<EntryFormData>({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    lines: [
      { account: '', description: '', debit: '', credit: '' },
      { account: '', description: '', debit: '', credit: '' }
    ]
  });
  useEffect(() => {
    if (entry) {
      setFormData({
        date: entry.date,
        reference: entry.reference,
        description: entry.description,
        lines: entry.lines || [{ account: '', description: '', debit: '', credit: '' }]
      });
    }
  }, [entry]);
  return { formData, setFormData };
}
function EntryLineForm({ line, index, updateLine, removeLine, canRemove, accounts }: {
  line: any;
  index: number;
  updateLine: (index: number, field: string, value: any) => void;
  removeLine: (index: number) => void;
  canRemove: boolean;
  accounts: any[];
}) {
  // ✅ Récupérer les infos du compte sélectionné
  const selectedAccount = accounts.find((acc: any) => acc.id === line.account);
  const accountNumber = selectedAccount?.account_number || '';
  // ✅ Valider le côté débit/crédit selon les règles comptables
  const validation = React.useMemo(() => {
    if (!accountNumber) return { valid: true };
    const debit = parseFloat(line.debit) || 0;
    const credit = parseFloat(line.credit) || 0;
    return AccountingRulesService.validateAccountSide(accountNumber, debit, credit);
  }, [accountNumber, line.debit, line.credit]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid md:grid-cols-5 gap-4 p-4 border rounded-lg"
    >
      <div className="space-y-2">
        <Label>Compte</Label>
        <Select
          value={line.account}
          onValueChange={(value) => updateLine(index, 'account', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account: any) => (
              <SelectItem key={account.id} value={account.id}>
                {account.account_number} - {account.account_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Libellé</Label>
        <Input
          placeholder="Libellé de la ligne"
          value={line.description}
          onChange={(e) => updateLine(index, 'description', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Débit</Label>
        <Input
          type="number"
          step="0.01"
          placeholder="0.00"
          value={line.debit}
          onChange={(e) => updateLine(index, 'debit', e.target.value)}
          className={validation.warning && parseFloat(line.credit) > 0 ? 'border-yellow-500' : ''}
        />
      </div>
      <div className="space-y-2">
        <Label>Crédit</Label>
        <Input
          type="number"
          step="0.01"
          placeholder="0.00"
          value={line.credit}
          onChange={(e) => updateLine(index, 'credit', e.target.value)}
          className={validation.warning && parseFloat(line.debit) > 0 ? 'border-yellow-500' : ''}
        />
      </div>
      <div className="flex items-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => removeLine(index)}
          disabled={!canRemove}
          aria-label="Supprimer la ligne"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      {/* ✅ Afficher les avertissements ou infos comptables */}
      {validation.warning && (
        <div className="md:col-span-5 text-sm text-yellow-600 dark:text-yellow-400 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{validation.warning}</span>
        </div>
      )}
      {!validation.warning && validation.info && (
        <div className="md:col-span-5 text-sm text-blue-600 dark:text-blue-400 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{validation.info}</span>
        </div>
      )}
    </motion.div>
  );
}
function EntryTotals({ totals }: { totals: { totalDebit: number; totalCredit: number; isBalanced: boolean } }) {
  return (
    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <div className="flex justify-between">
          <span className="font-medium">Total Débit:</span>
          <span className="font-mono"><CurrencyAmount amount={totals.totalDebit} /></span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Total Crédit:</span>
          <span className="font-mono"><CurrencyAmount amount={totals.totalCredit} /></span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium">Équilibre:</span>
          <div className="flex items-center space-x-2">
            {totals.isBalanced ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span className={totals.isBalanced ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {totals.isBalanced ? 'Équilibrée' : 'Non équilibrée'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
interface EntryFormDialogProps {
  open: boolean;
  onClose: () => void;
  entry?: any | null;
  onSave: (data: any) => Promise<{ success: boolean; entryId?: string; failedFiles?: File[] }>;
  accounts: any[];
  companyId: string;
}
const EntryFormDialog: React.FC<EntryFormDialogProps> = ({ open, onClose, entry = null, onSave, accounts, companyId }) => {
  const { toast } = useToast();
  const { t } = useLocale();
  const { currentCompany } = useAuth();
  const { formData, setFormData } = useEntryFormState(entry);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadFailures, setUploadFailures] = useState<File[]>([]);
  const [persistedEntryId, setPersistedEntryId] = useState<string | null>(null);
  
  // AI Analysis states
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<JournalEntryExtracted | null>(null);
  // ✅ Générer automatiquement une référence si elle n'existe pas
  const generateAutoReference = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4); // 4 derniers chiffres du timestamp
    return `${year}${month}${day}-${timestamp}`;
  };
  // ✅ FIX: Réinitialiser le formulaire SEULEMENT pour nouvelle écriture
  useEffect(() => {
    if (!entry && open) {
      // Nouveau formulaire: réinitialisation complète avec référence générée
      setFormData({
        date: new Date().toISOString().split('T')[0],
        reference: generateAutoReference(),
        description: '',
        lines: [
          { account: '', description: '', debit: '', credit: '' },
          { account: '', description: '', debit: '', credit: '' }
        ]
      });
      setSelectedFiles([]);
    }
    // ✅ Pour l'édition, on ne fait RIEN ici - useEntryFormState gère déjà
  }, [open, entry?.id]); // Dépendance sur entry.id pour éviter re-render inutiles

  const handleAIAnalysis = useCallback(async (file: File) => {
    if (!currentCompany?.id) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('ai.no_company_selected', { defaultValue: 'Aucune entreprise sélectionnée' })
      });
      return;
    }

    setAiAnalyzing(true);
    setAiSuggestion(null);

    try {
      // Appel du service d'analyse
      const result = await aiDocumentAnalysisService.analyzeDocument(
        file,
        currentCompany.id,
        'invoice'
      );

      if (!result.success || !result.data) {
        toast({
          variant: 'destructive',
          title: t('ai.analysis_failed', { defaultValue: 'Analyse échouée' }),
          description: result.error || t('ai.unable_to_analyze', { defaultValue: 'Impossible d\'analyser le document' })
        });
        return;
      }

      const extracted = result.data;
      
      // Valider et corriger les données
      const validation = aiDocumentAnalysisService.validateExtractedEntry(extracted);
      
      // Utiliser la version corrigée (avec HT/TVA/TTC recalculés si nécessaire)
      const finalExtracted = validation.corrected || extracted;
      
      if (validation.errors.length > 0) {
        toast({
          variant: 'destructive',
          title: t('ai.incomplete_data', { defaultValue: 'Données incomplètes' }),
          description: validation.errors[0]
        });
      }

      if (validation.warnings.length > 0) {
        toast({
          title: t('ai.warnings', { defaultValue: 'Avertissements' }),
          description: validation.warnings[0],
          variant: 'default'
        });
      }

      setAiSuggestion(finalExtracted);
      
      // ✅ PRÉ-REMPLIR LE FORMULAIRE avec les données extraites (corrigées)
      if (finalExtracted.entry_date) {
        setFormData(prev => ({ ...prev, date: finalExtracted.entry_date }));
      }
      
      if (finalExtracted.description) {
        setFormData(prev => ({ ...prev, description: finalExtracted.description }));
      }
      
      if (finalExtracted.reference_number) {
        setFormData(prev => ({ ...prev, reference: finalExtracted.reference_number }));
      }
      
      // ✅ PRÉ-REMPLIR LES LIGNES D'ÉCRITURE (HT, TVA, TTC)
      if (finalExtracted.lines && finalExtracted.lines.length > 0) {
        // Utiliser les comptes déjà chargés dans le state
        const newLines = finalExtracted.lines.map(line => {
          // L'IA retourne account_class (ex: "411", "707", "44571")
          // Chercher un compte dont le numéro commence par ce code
          const accountClass = (line.account_class || '').trim();
          const accountLabel = (line.account_suggestion || '').trim();
          
          // Logique de matching :
          // 1. Chercher un compte qui commence par le code de classe
          let matchingAccount = accounts.find(acc => 
            acc.account_number?.startsWith(accountClass)
          );
          
          // 2. Si pas trouvé, essayer de matcher sur les 3 premiers chiffres
          if (!matchingAccount && accountClass.length >= 2) {
            const prefix = accountClass.substring(0, 3);
            matchingAccount = accounts.find(acc => 
              acc.account_number?.startsWith(prefix)
            );
          }
          
          logger.info('[AI] Account matching', { 
            class: accountClass, 
            label: accountLabel,
            found: !!matchingAccount,
            accountNumber: matchingAccount?.account_number 
          });
          
          return {
            account: matchingAccount?.id || '', // ID du compte trouvé, vide si pas trouvé
            description: line.description || accountLabel || '',
            debit: String(Number(line.debit_amount) || 0),
            credit: String(Number(line.credit_amount) || 0),
            accountLabel: matchingAccount 
              ? `${matchingAccount.account_number} - ${matchingAccount.account_name}`
              : `[${accountClass}] ${accountLabel}` // Affiche le code et label si pas trouvé
          };
        });
        
        setFormData(prev => ({
          ...prev,
          lines: newLines
        }));
        
        logger.info('[AI] Lines prefilled', { 
          count: newLines.length, 
          lines: newLines.map(l => ({ account: l.account, debit: l.debit, credit: l.credit }))
        });
      }
      
      // ✅ Ajouter automatiquement le fichier aux pièces jointes
      setSelectedFiles(prev => {
        // Vérifier si le fichier n'est pas déjà dans la liste
        const isDuplicate = prev.some(f => 
          f.name === file.name && 
          f.size === file.size && 
          f.lastModified === file.lastModified
        );
        if (isDuplicate) return prev;
        return [...prev, file];
      });
      
      logger.debug('AI Analysis result (corrected):', finalExtracted);
      
      toast({
        title: t('ai.analysis_success', { defaultValue: '✨ Analyse réussie' }),
        description: t('ai.form_prefilled', { defaultValue: 'Le formulaire a été pré-rempli avec les données extraites' }),
        variant: 'default'
      });
      
      toast({
        title: t('ai.analysis_complete', { defaultValue: 'Analyse terminée' }),
        description: t('ai.document_added_to_attachments', { 
          defaultValue: 'Document ajouté aux pièces jointes et données extraites avec succès' 
        })
      });
    } catch (error) {
      logger.error('AI Analysis error:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: String(error)
      });
    } finally {
      setAiAnalyzing(false);
    }
  }, [currentCompany?.id, t, toast, accounts, setFormData]);

  const addLine = () => {
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, { account: '', description: '', debit: '', credit: '' }]
    }));
  };
  const removeLine = (index: number) => {
    if (formData.lines.length > 2) {
      setFormData(prev => ({
        ...prev,
        lines: prev.lines.filter((_, i) => i !== index)
      }));
    }
  };
  const updateLine = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => {
        if (i === index) {
          const updatedLine = { ...line, [field]: value };
          // Auto-fill description when account is selected
          if (field === 'account' && value) {
            const selectedAccount = accounts.find((account: any) => account.id === value);
            if (selectedAccount && !line.description) {
              updatedLine.description = selectedAccount.account_name;
            }
          }
          // ✅ RÈGLE COMPTABLE: Si on remplit le débit, on vide le crédit (et inversement)
          if (field === 'debit' && parseFloat(value) > 0) {
            updatedLine.credit = '';
          }
          if (field === 'credit' && parseFloat(value) > 0) {
            updatedLine.debit = '';
          }
          return updatedLine;
        }
        return line;
      })
    }));
  };
  const calculateTotals = () => {
    const totalDebit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const totalCredit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
    return { totalDebit, totalCredit, isBalanced: totalDebit === totalCredit };
  };
  const totals = calculateTotals();
  const handleSave = async () => {
    // Validations UX renforcées
    const filledLines = formData.lines.filter((line) => {
      const d = parseFloat(line.debit) || 0;
      const c = parseFloat(line.credit) || 0;
      return d > 0 || c > 0;
    });
    if (filledLines.length < 2) {
      toast({
        title: "Écriture incomplète",
        description: "Au moins deux lignes avec montants non nuls sont requises.",
        variant: "destructive"
      });
      return;
    }
    const missingAccount = filledLines.some((line) => !line.account);
    if (missingAccount) {
      toast({
        title: "Compte manquant",
        description: "Chaque ligne avec un montant doit avoir un compte sélectionné.",
        variant: "destructive"
      });
      return;
    }
    const invalidBothSides = filledLines.some((line) => {
      const d = parseFloat(line.debit) || 0;
      const c = parseFloat(line.credit) || 0;
      return d > 0 && c > 0;
    });
    if (invalidBothSides) {
      toast({
        title: "Ligne invalide",
        description: "Une ligne ne peut pas avoir simultanément un débit et un crédit.",
        variant: "destructive"
      });
      return;
    }
    if (!totals.isBalanced) {
      toast({
        title: "Écriture non équilibrée",
        description: "Le total des débits doit être égal au total des crédits.",
        variant: "destructive"
      });
      return;
    }
    setSaving(true);
    try {
      const result = await onSave({
        ...formData,
        totalDebit: totals.totalDebit,
        totalCredit: totals.totalCredit,
        selectedFiles
      });
      if (result.success) {
        setPersistedEntryId(result.entryId ?? null);
        const failures = result.failedFiles ?? [];
        if (failures.length > 0) {
          setUploadFailures(failures);
          // Ne pas fermer : permettre le retry inline
        } else {
          setSelectedFiles([]);
          onClose();
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'enregistrer l'écriture.";
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  const retryFailedUploads = async () => {
    if (!persistedEntryId || uploadFailures.length === 0) return;
    const remaining: File[] = [];
    for (const file of uploadFailures) {
      try {
        await journalEntryAttachmentService.uploadAttachment(persistedEntryId, companyId, file);
      } catch (_error) {
        remaining.push(file);
      }
    }
    setUploadFailures(remaining);
    if (remaining.length === 0) {
      toast({
        title: 'Pièces jointes téléversées',
        description: 'Tous les fichiers ont été téléversés avec succès.'
      });
      setSelectedFiles([]);
      onClose();
    } else {
      toast({
        title: 'Certaines pièces ont encore échoué',
        description: remaining.map(f => f.name).join(', '),
        variant: 'destructive'
      });
    }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <span>{entry ? 'Modifier l\'écriture' : 'Nouvelle écriture'}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Entry Header */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Référence (auto-générée, modifiable)</Label>
              <Input
                id="reference"
                placeholder="Générée automatiquement"
                value={formData.reference}
                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Description de l'écriture"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          {/* AI Document Analysis Section */}
          <div className="border-2 border-dashed border-primary/20 rounded-lg p-4 bg-primary/5">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-primary">
                {t('ai.automatic_analysis', { defaultValue: 'Analyse automatique par IA' })}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {t('ai.upload_document_instruction', { 
                defaultValue: 'Uploadez une facture, reçu ou justificatif (PDF, JPG, PNG, WebP). Les PDFs sont automatiquement convertis en images pour l\'analyse.' 
              })}
            </p>
            <label htmlFor="ai-upload" className="cursor-pointer">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={aiAnalyzing || !currentCompany}
                className="w-full"
                asChild
              >
                <div>
                  {aiAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('ai.analyzing', { defaultValue: 'Analyse en cours...' })}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {t('ai.choose_document', { defaultValue: 'Choisir un document (PDF, JPG, PNG, WebP)' })}
                    </>
                  )}
                </div>
              </Button>
              <input
                id="ai-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAIAnalysis(file);
                  e.target.value = ''; // Reset input
                }}
                disabled={aiAnalyzing || !currentCompany}
              />
            </label>

            {aiSuggestion && (
              <Alert className="mt-3 bg-primary/10 border-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
                <AlertDescription className="text-xs">
                  <strong>{t('ai.extracted_data', { defaultValue: 'Données extraites du document' })} :</strong><br />
                  • {aiSuggestion.raw_extraction.supplier_name || aiSuggestion.raw_extraction.customer_name || t('ai.unknown_party', { defaultValue: 'Tiers inconnu' })}<br />
                  {aiSuggestion.raw_extraction.invoice_number && (
                    <>• {t('ai.invoice', { defaultValue: 'Facture' })} {aiSuggestion.raw_extraction.invoice_number}<br /></>
                  )}
                  {aiSuggestion.raw_extraction.total_ttc && (
                    <>• {t('ai.amount_incl_tax', { defaultValue: 'Montant TTC' })} : {aiSuggestion.raw_extraction.total_ttc}€<br /></>
                  )}
                  <span className="text-primary font-medium">
                    {t('ai.confidence', { defaultValue: 'Confiance' })} : {aiSuggestion.confidence_score}%
                  </span>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Entry Lines */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Lignes d'écriture</CardTitle>
                <Button onClick={addLine} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une ligne
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.lines.map((line, index) => (
                  <EntryLineForm
                    key={index}
                    line={line}
                    index={index}
                    updateLine={updateLine}
                    removeLine={removeLine}
                    canRemove={formData.lines.length > 2}
                    accounts={accounts}
                  />
                ))}
              </div>
              {/* Totals */}
              <EntryTotals totals={totals} />
            </CardContent>
          </Card>
          {/* Pièces jointes associées */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Pièces jointes
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" title="Taille maximale par fichier">
                    Max {Math.round(journalEntryAttachmentService.getMaxFileSize() / 1024 / 1024)} Mo
                  </Badge>
                  <label
                    htmlFor="journal-entry-upload"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer hover:bg-muted"
                  >
                    <Upload className="w-4 h-4" />
                    Ajouter
                  </label>
                </div>
                <input
                  id="journal-entry-upload"
                  type="file"
                  multiple
                  className="hidden"
                  accept={(function(){
                    const types = journalEntryAttachmentService.getAllowedTypes();
                    const extSet = new Set<string>();
                    types.forEach(t => {
                      switch (t) {
                        case 'application/pdf': extSet.add('.pdf'); break;
                        case 'image/jpeg': extSet.add('.jpg'); extSet.add('.jpeg'); break;
                        case 'image/png': extSet.add('.png'); break;
                        case 'image/webp': extSet.add('.webp'); break;
                        case 'application/msword': extSet.add('.doc'); break;
                        case 'application/vnd.ms-excel': extSet.add('.xls'); break;
                        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': extSet.add('.docx'); break;
                        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': extSet.add('.xlsx'); break;
                        case 'text/plain': extSet.add('.txt'); break;
                        default: break;
                      }
                    });
                    return Array.from(extSet).join(',');
                  })()}
                  onChange={(e) => {
                    if (e.target.files) {
                      const newFiles = Array.from(e.target.files);
                      setSelectedFiles(prev => [...prev, ...newFiles]);
                      // Reset input pour permettre de re-sélectionner le même fichier
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Les fichiers sont uploadés au moment de l'enregistrement. Taille max {Math.round(journalEntryAttachmentService.getMaxFileSize() / 1024 / 1024)} Mo.
                Formats autorisés: {(function(){
                  const types = journalEntryAttachmentService.getAllowedTypes();
                  const labels = new Set<string>();
                  types.forEach(t => {
                    switch (t) {
                      case 'application/pdf': labels.add('PDF'); break;
                      case 'image/jpeg': labels.add('JPG/JPEG'); break;
                      case 'image/png': labels.add('PNG'); break;
                      case 'image/webp': labels.add('WEBP'); break;
                      case 'application/msword': labels.add('DOC'); break;
                      case 'application/vnd.ms-excel': labels.add('XLS'); break;
                      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': labels.add('DOCX'); break;
                      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': labels.add('XLSX'); break;
                      case 'text/plain': labels.add('TXT'); break;
                      default: break;
                    }
                  });
                  return Array.from(labels).join(', ');
                })()}
              </p>
              <div className="text-xs text-muted-foreground">
                Taille totale sélectionnée: {(
                  selectedFiles.reduce((s, f) => s + f.size, 0) / 1024 / 1024
                ).toFixed(2)} Mo
              </div>
              {selectedFiles.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aucun fichier sélectionné.</div>
              ) : (
                <div className="space-y-2">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <span className="truncate mr-3">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} Mo)</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}
                      >
                        Supprimer
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {/* Aperçu/gestion des PJ déjà associées (édition) */}
          {entry?.id && companyId && (
            <JournalEntryAttachments
              journalEntryId={entry.id}
              companyId={companyId}
              readOnly={false}
            />
          )}
          {/* Erreurs de téléversement et action de retry */}
          {uploadFailures.length > 0 && (
            <div className="space-y-2 mt-4">
              <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                <p className="font-medium mb-2">Certaines pièces n'ont pas été téléversées :</p>
                <div className="space-y-2">
                  {uploadFailures.map((f, idx) => (
                    <div key={`${f.name}-${idx}`} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <span className="truncate mr-3">{f.name}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          // Retirer ce fichier de la liste des échecs et des sélectionnés
                          setUploadFailures(prev => prev.filter((_, i) => i !== idx));
                          setSelectedFiles(prev => prev.filter(sf => sf !== f));
                        }}
                        title="Retirer ce fichier de la tentative"
                      >
                        Retirer
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={retryFailedUploads}>
                  Réessayer l'upload
                </Button>
                <Button size="sm" variant="outline" onClick={() => setUploadFailures([])}>
                  Ignorer pour l'instant
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!totals.isBalanced || saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            {entry ? 'Modifier' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
// Entry Preview Dialog Component
const EntryPreviewDialog = ({ open, onClose, entry }: { open: boolean; onClose: () => void; entry: any }) => {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  // Charger les pièces jointes quand le dialogue s'ouvre
  React.useEffect(() => {
    if (open && entry?.id) {
      logger.debug('OptimizedJournalEntriesTab', '[EntryPreviewDialog] Loading attachments for entry:', entry.id);
      loadAttachments();
    } else {
      setAttachments([]);
    }
  }, [open, entry?.id]);
  const loadAttachments = async () => {
    if (!entry?.id) return;
    setLoadingAttachments(true);
    try {
      logger.debug('OptimizedJournalEntriesTab', '[EntryPreviewDialog] Loading attachments for entry ID:', entry.id);
      const data = await journalEntryAttachmentService.getAttachments(entry.id);
      logger.debug('OptimizedJournalEntriesTab', '[EntryPreviewDialog] Attachments loaded:', data?.length, 'items');
      setAttachments(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error('OptimizedJournalEntriesTab', '[EntryPreviewDialog] Error loading attachments:', error);
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  };
  if (!entry) return null;
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validated':
        return <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">Validée</Badge>;
      case 'draft':
        return <Badge variant="secondary">Brouillon</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800">En attente</Badge>;
      default:
        return <Badge variant="outline">Inconnue</Badge>;
    }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-blue-500" />
            <span>Détails de l'écriture - {entry.reference}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Entry Header */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Référence</Label>
              <p className="text-lg font-semibold">{entry.reference}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Statut</Label>
              <div className="mt-1">{getStatusBadge(entry.status)}</div>
            </div>
          </div>
          {/* Entry Details */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Date</Label>
                <p className="text-base">{new Date(entry.date).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Description</Label>
                <p className="text-base">{entry.description}</p>
              </div>
            </div>
          </div>
          {/* Entry Lines */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Lignes d'écriture</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Compte</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-right">Débit</TableHead>
                    <TableHead className="text-right">Crédit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entry.lines?.map((line: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{line.accountLabel || line.account}</TableCell>
                      <TableCell>{line.description}</TableCell>
                      <TableCell className="text-right font-mono">
                        {line.debit ? formatCurrency(parseFloat(line.debit)) : ''}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {line.credit ? formatCurrency(parseFloat(line.credit)) : ''}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          {/* Attachments Section */}
          {attachments.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Pièces jointes</h3>
                <Badge variant="outline">{attachments.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {attachments.map((attachment: any) => (
                  <a
                    key={attachment.id}
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {attachment.file_name}
                      </p>
                      {attachment.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {attachment.description}
                        </p>
                      )}
                    </div>
                    <Eye className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
          {/* Loading or Empty State for Attachments */}
          {!loadingAttachments && attachments.length === 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Paperclip className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Pièces jointes</h3>
              </div>
              <div className="p-4 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucune pièce jointe</p>
              </div>
            </div>
          )}
          {loadingAttachments && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Paperclip className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Pièces jointes</h3>
              </div>
              <div className="flex items-center justify-center py-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Chargement des pièces jointes...</span>
              </div>
            </div>
          )}
          {/* Totals */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Débit</Label>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(entry.totalDebit || 0)}</p>
            </div>
            <div className="text-center">
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Crédit</Label>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(entry.totalCredit || 0)}</p>
            </div>
          </div>
          {/* Balance Status */}
          <div className="text-center">
            {entry.totalDebit === entry.totalCredit ? (
              <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Écriture équilibrée</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Écriture non équilibrée</span>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
// Entry Row Component
const EntryRow = ({ entry, onEdit, onDelete, onView, onValidate: _onValidate, onDuplicate, companyId, onRefresh }: { entry: any; onEdit: (entry: any) => void; onDelete: (entry: any) => void; onView: (entry: any) => void; onValidate: (entry: any) => void; onDuplicate: (entry: any) => void; companyId: string; onRefresh: () => void }) => {
  const [expanded, setExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Simuler un contrôle RBAC (à remplacer par vrai hook/context)
  const userCanEdit = true; // TODO: remplacer par vrai contrôle
  const userCanDelete = true;
  const userCanView = true;
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validated':
      case 'posted':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700 flex items-center space-x-1 w-fit">
            <CheckCircle className="w-3 h-3" />
            <span>Validée</span>
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="secondary" className="flex items-center space-x-1 w-fit">
            <FileText className="w-3 h-3" />
            <span>Brouillon</span>
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700 flex items-center space-x-1 w-fit">
            <AlertCircle className="w-3 h-3" />
            <span>En attente</span>
          </Badge>
        );
      default:
        return <Badge variant="outline" className="w-fit">Inconnue</Badge>;
    }
  };
  return (
    <>
      <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-900/30">
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </TableCell>
        <TableCell className="font-medium">{entry.reference}</TableCell>
        <TableCell>{new Date(entry.date).toLocaleDateString('fr-FR')}</TableCell>
        <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
        <TableCell className="text-right font-mono">
          {formatCurrency(entry.totalDebit || 0)}
        </TableCell>
        <TableCell className="text-right font-mono">
          {formatCurrency(entry.totalCredit || 0)}
        </TableCell>
        <TableCell>{getStatusBadge(entry.status)}</TableCell>
        <TableCell>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => userCanView && onView(entry)} disabled={!userCanView}>
              <Eye className="w-4 h-4" />
            </Button>
            {/* Workflow Actions - remplace le bouton Valider simple */}
            <WorkflowActions
              entryId={entry.id}
              companyId={companyId}
              currentStatus={entry.status || 'draft'}
              isLocked={entry.isLocked || false}
              onStatusChange={onRefresh}
              compact={false}
            />
            <Button variant="ghost" size="sm" onClick={() => userCanEdit && !entry.isLocked && onEdit(entry)} disabled={!userCanEdit || entry.isLocked}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => userCanEdit && onDuplicate(entry)}
              disabled={!userCanEdit}
              title="Dupliquer l'écriture"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={async () => {
              if (!userCanDelete || entry.isLocked) return;
              setIsDeleting(true);
              await new Promise(r => setTimeout(r, 600)); // Simule async
              onDelete(entry);
              setIsDeleting(false);
            }} disabled={!userCanDelete || entry.isLocked || isDeleting}>
              {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {expanded && entry.lines && (
        <TableRow>
          <TableCell colSpan={8} className="bg-gray-50 dark:bg-gray-800/30">
            <div className="p-4 space-y-2">
              <h4 className="font-medium text-sm">Détail des lignes:</h4>
              {entry.lines.map((line: any, index: number) => (
                <div key={index} className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>{line.account} - {line.description}</span>
                  <span>
                    {line.debit && `D: ${formatCurrency(parseFloat(line.debit))}`}
                    {line.credit && `C: ${formatCurrency(parseFloat(line.credit))}`}
                  </span>
                </div>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};
export default function OptimizedJournalEntriesTab() {
  const { toast } = useToast();
  const { ConfirmDialog: ConfirmDialogComponent, confirm: confirmDialog } = useConfirmDialog();
  const { currentCompany } = useAuth();
  const { loading: _hookLoading, error: _hookError, getAccountsList } = useJournalEntries(currentCompany?.id || '');
  const [entries, setEntries] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Charger les écritures réelles depuis Supabase
  useEffect(() => {
    loadEntries();
    loadAccounts();
  }, [currentCompany?.id]);
  const loadAccounts = async () => {
    if (!currentCompany?.id) return;
    try {
      const accountsList = await getAccountsList();
      setAccounts(accountsList);
    } catch (error) {
      logger.error('OptimizedJournalEntriesTab', 'Error loading accounts:', error);
    }
  };
  const loadEntries = async () => {
    if (!currentCompany?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Log that loadEntries started for this company
      try {
        logger.debug('OptimizedJournalEntriesTab', 'loadEntries starting for companyId:', currentCompany.id);
      } catch (_e) { /* ignore logging errors */ }
      const result = await journalEntriesService.getJournalEntries(currentCompany.id, {
        limit: 100,
        sortBy: 'entry_date',
        sortOrder: 'desc'
      });
      // Log the raw service result so Playwright can capture it
      try {
        const r: any = result;
        logger.debug('OptimizedJournalEntriesTab', 'getJournalEntries raw result:', r && typeof r === 'object' && r.success ? { success: r.success, rows: r.data?.data?.length ?? 0, count: r.data?.count ?? 0 } : r);
      } catch (_e) { /* ignore logging errors */ }
      if (result.success && result.data) {
        // Transformer les données Supabase en format UI
        const transformedEntries = result.data.data.map(entry => ({
          id: entry.id,
          reference: entry.entry_number || entry.reference_number || 'N/A',
          date: entry.entry_date,
          description: entry.description || '',
          totalDebit: (entry.journal_entry_lines || []).reduce((sum, item) => sum + (Number(item.debit_amount) || 0), 0),
          totalCredit: (entry.journal_entry_lines || []).reduce((sum, item) => sum + (Number(item.credit_amount) || 0), 0),
          status: entry.status || 'draft',
          isLocked: entry.is_locked || entry.status === 'posted',
          lines: (entry.journal_entry_lines || []).map(item => {
            const accountId = item.account_id || item.chart_of_accounts?.id || '';
            const accountLabel = item.chart_of_accounts
              ? `${item.chart_of_accounts.account_number || ''} - ${item.chart_of_accounts.account_name || ''}`.trim()
              : '';
            return {
              account: accountId,
              accountLabel,
              description: item.description || '',
              debit: item.debit_amount?.toString() || '',
              credit: item.credit_amount?.toString() || ''
            };
          })
        }));
        // Log for browser debugging: raw result and transformed entries
        try {
          logger.debug('OptimizedJournalEntriesTab', 'getJournalEntries result:', {
            success: result.success,
            rows: result.data?.data?.length,
            count: result.data?.count,
          });
          logger.debug('OptimizedJournalEntriesTab', 'transformedEntries length:', { count: transformedEntries.length, sample: transformedEntries.slice(0, 5) });
        } catch (_err) { /* ignore debug logging errors */ }
        setEntries(transformedEntries);
      }
    } catch (error) {
      logger.error('OptimizedJournalEntriesTab', 'Error loading entries:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les écritures",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  // Fonction de rafraîchissement manuel avec feedback
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadEntries(), loadAccounts()]);
      toast({
        title: "Données actualisées",
        description: "Les écritures ont été rechargées depuis la base de données",
      });
    } catch (error) {
      logger.error('OptimizedJournalEntriesTab', 'Error refreshing:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rafraîchir les données",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  // Mock data commenté - remplacé par vraies données
  /*const [entries, setEntries] = useState([
    {
      id: 1,
      reference: 'VTE-001',
      date: '2024-01-15',
      description: 'Facture client ABC Corp',
      totalDebit: 1200.00,
      totalCredit: 1200.00,
      status: 'validated',
      lines: []
    },
    {
      id: 2,
      reference: 'ACH-001',
      date: '2024-01-16',
      description: 'Achat matières premières',
      totalDebit: 600.00,
      totalCredit: 600.00,
      status: 'draft',
      lines: []
    }
  ]);*/
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EntryData | null>(null);
  const [previewEntry, setPreviewEntry] = useState<EntryData | null>(null);
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const handleSaveEntry = async (entryData: any): Promise<{ success: boolean; entryId?: string; failedFiles?: File[] }> => {
    logger.debug('OptimizedJournalEntriesTab', '[OptimizedJournalEntriesTab] handleSaveEntry called with:', entryData);
    if (!currentCompany?.id) {
      toast({
        title: "Erreur",
        description: "Aucune entreprise sélectionnée",
        variant: "destructive"
      });
      return { success: false };
    }
    try {
      const payload = {
        companyId: currentCompany.id,
        entryDate: entryData.date,
        description: entryData.description,
        referenceNumber: entryData.reference,
        status: 'draft', // Modification repasse toujours en brouillon
        items: entryData.lines.map((line: any) => ({
          accountId: line.account,
          description: line.description,
          debitAmount: parseFloat(line.debit) || 0,
          creditAmount: parseFloat(line.credit) || 0
        }))
      };
      const isEdit = Boolean(editingEntry?.id);
      const entryId = editingEntry?.id as string | undefined;
      const result = isEdit && entryId
        ? await journalEntriesService.updateJournalEntry(entryId, payload)
        : await journalEntriesService.createJournalEntry(payload);
      if (!result.success) {
        throw new Error('error' in result ? result.error : 'Unknown error');
      }
      const persistedEntryId = isEdit && entryId ? entryId : result.data.id;
      // Upload attachments if any were selected in the dialog
      const files: File[] = entryData.selectedFiles || [];
      if (files.length > 0) {
        const failedFiles: File[] = [];
        for (const file of files) {
          try {
            await journalEntryAttachmentService.uploadAttachment(persistedEntryId, currentCompany.id, file);
          } catch (uploadError) {
            logger.error('OptimizedJournalEntriesTab', 'Failed to upload attachment:', uploadError);
            failedFiles.push(file);
          }
        }
        if (failedFiles.length > 0) {
          return { success: true, entryId: persistedEntryId, failedFiles };
        }
      }
      toast({
        title: isEdit ? "Écriture mise à jour" : "Écriture créée",
        description: isEdit
          ? "L'écriture a été mise à jour sans créer de doublon."
          : "L'écriture a été enregistrée avec succès."
      });
      await loadEntries();
      setShowEntryForm(false);
      setEditingEntry(null);
      return { success: true, entryId: persistedEntryId };
    } catch (error) {
      logger.error('OptimizedJournalEntriesTab', '[OptimizedJournalEntriesTab] Error saving entry:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'enregistrer l'écriture",
        variant: "destructive"
      });
      return { success: false };
    }
  };
  const handleEditEntry = (entry: any) => {
    setEditingEntry(entry);
    setShowEntryForm(true);
  };
  const handleDuplicateEntry = async (entry: any) => {
    if (!currentCompany?.id) {
      toast({
        title: "Erreur",
        description: "Aucune entreprise sélectionnée",
        variant: "destructive"
      });
      return;
    }
    try {
      const payload = {
        companyId: currentCompany.id,
        entryDate: entry.date,
        description: `${entry.description || ''} (copie)`.trim(),
        referenceNumber: undefined as string | undefined, // Laissez la génération automatique créer une nouvelle référence
        status: 'draft',
        items: (entry.lines || []).map((line: any) => ({
          accountId: line.account,
          description: line.description,
          debitAmount: parseFloat(line.debit) || 0,
          creditAmount: parseFloat(line.credit) || 0
        }))
      };
      const result = await journalEntriesService.createJournalEntry(payload);
      if (!result.success) {
        throw new Error('error' in result ? result.error : 'Unknown error');
      }
      toast({
        title: "Écriture dupliquée",
        description: `Nouvelle référence générée automatiquement: ${result.data.reference_number || 'générée'}`
      });
      await loadEntries();
    } catch (error) {
      logger.error('OptimizedJournalEntriesTab', '[OptimizedJournalEntriesTab] Error duplicating entry:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "La duplication a échoué",
        variant: "destructive"
      });
    }
  };
  const handleDeleteEntry = async (entry: any) => {
    // Confirmation
    const confirmed = await confirmDialog({
      title: 'Supprimer l\'écriture',
      description: 'Êtes-vous sûr de vouloir supprimer cette écriture ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'destructive',
    });
    if (!confirmed) {
      return;
    }
    if (!currentCompany?.id) {
      toast({
        title: "Erreur",
        description: "Aucune entreprise sélectionnée",
        variant: "destructive"
      });
      return;
    }
    try {
      logger.debug('OptimizedJournalEntriesTab', '🗑️ Début suppression écriture:', entry.id);
      // ✅ SUPPRESSION RÉELLE EN BASE DE DONNÉES
      const result = await journalEntriesService.deleteJournalEntry(entry.id, currentCompany.id);
      if (result.success) {
        toast({
          title: "Écriture supprimée",
          description: "L'écriture a été supprimée définitivement de la base de données."
        });
        // ✅ RECHARGER LA LISTE DEPUIS LA BASE (pas juste filtrer localement)
        await loadEntries();
        logger.debug('OptimizedJournalEntriesTab', '✅ Écriture supprimée et liste rechargée');
      } else {
        throw new Error('Échec de la suppression');
      }
    } catch (error) {
      logger.error('OptimizedJournalEntriesTab', '❌ Erreur suppression:', error);
      toast({
        title: "Erreur de suppression",
        description: error instanceof Error ? error.message : "Impossible de supprimer l'écriture",
        variant: "destructive"
      });
    }
  };
  const handleValidateEntry = async (entry: any) => {
    if (!currentCompany?.id) {
      toast({
        title: "Erreur",
        description: "Aucune entreprise sélectionnée",
        variant: "destructive"
      });
      return;
    }
    try {
      logger.debug('OptimizedJournalEntriesTab', '✅ Validation écriture:', entry.id);
      const result = await journalEntriesService.updateJournalEntryStatus(
        entry.id,
        'posted',
        currentCompany.id
      );
      if (result.success) {
        toast({
          title: "Écriture validée",
          description: "L'écriture a été validée avec succès et est maintenant visible dans les rapports."
        });
        // Recharger la liste depuis la base
        await loadEntries();
        logger.debug('OptimizedJournalEntriesTab', '✅ Écriture validée et liste rechargée');
      } else {
        throw new Error('error' in result ? result.error : 'Échec de la validation');
      }
    } catch (error) {
      logger.error('OptimizedJournalEntriesTab', '❌ Erreur validation:', error);
      toast({
        title: "Erreur de validation",
        description: error instanceof Error ? error.message : "Impossible de valider l'écriture",
        variant: "destructive"
      });
    }
  };
  const handleViewEntry = (entry: any) => {
    setPreviewEntry(entry);
  };
  const summary = {
    totalEntries: entries.length,
    totalDebit: entries.reduce((sum, entry) => sum + entry.totalDebit, 0),
    totalCredit: entries.reduce((sum, entry) => sum + entry.totalCredit, 0),
    validatedEntries: entries.filter(e => e.status === 'validated').length
  };
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total écritures</p>
                <p className="text-2xl font-bold">{summary.totalEntries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Validées</p>
                <p className="text-2xl font-bold">{summary.validatedEntries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total débits</p>
                <p className="text-xl font-bold"><CurrencyAmount amount={summary.totalDebit} /></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total crédits</p>
                <p className="text-xl font-bold"><CurrencyAmount amount={summary.totalCredit} /></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Actions and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <span>Écritures comptables</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="validated">Validées</SelectItem>
                  <SelectItem value="draft">Brouillons</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Rafraîchir les données depuis la base de données"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={() => setShowEntryForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle écriture
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Enhanced scrollable table with fixed header */}
          <div className="rounded-md border overflow-hidden">
            {/* Fixed Header */}
            <div className="bg-white dark:bg-slate-950 sticky top-0 z-10 border-b">
              <Table>
                <TableHeader>
                  <TableRow className="border-0">
                    <TableHead className="w-12 bg-slate-50 dark:bg-slate-900"></TableHead>
                    <TableHead className="bg-slate-50 dark:bg-slate-900">Référence</TableHead>
                    <TableHead className="bg-slate-50 dark:bg-slate-900">Date</TableHead>
                    <TableHead className="bg-slate-50 dark:bg-slate-900">Description</TableHead>
                    <TableHead className="text-right bg-slate-50 dark:bg-slate-900">Débit</TableHead>
                    <TableHead className="text-right bg-slate-50 dark:bg-slate-900">Crédit</TableHead>
                    <TableHead className="bg-slate-50 dark:bg-slate-900">Statut</TableHead>
                    <TableHead className="text-right bg-slate-50 dark:bg-slate-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </div>

            {/* Scrollable Body with Position Indicator */}
            <div className="relative">
              {/* Custom Scrollable Container */}
              <div 
                className="overflow-y-auto max-h-[60vh]"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgb(156, 163, 175) rgb(241, 245, 249)',
                }}
              >
                <Table>
                  <TableBody>
                    {filteredEntries.length > 0 ? (
                      filteredEntries.map((entry) => (
                        <EntryRow
                          key={entry.id}
                          entry={entry}
                          onEdit={handleEditEntry}
                          onDelete={handleDeleteEntry}
                          onView={handleViewEntry}
                          onValidate={handleValidateEntry}
                          onDuplicate={handleDuplicateEntry}
                          companyId={currentCompany?.id || ''}
                          onRefresh={loadEntries}
                        />
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          <div className="flex flex-col items-center space-y-2">
                            <FileText className="w-8 h-8 opacity-50" />
                            <p>Aucune écriture comptable</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Scroll Position Indicator - Bottom Right */}
              {filteredEntries.length > 5 && (
                <div className="absolute bottom-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-60 hover:opacity-100 transition-opacity pointer-events-none">
                  {filteredEntries.length} entrées
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Entry Form Dialog */}
      <EntryFormDialog
        open={showEntryForm}
        onClose={() => {
          setShowEntryForm(false);
          setEditingEntry(null);
        }}
        entry={editingEntry}
        onSave={handleSaveEntry}
        accounts={accounts}
        companyId={currentCompany?.id || ''}
      />
      <EntryPreviewDialog
        open={!!previewEntry}
        onClose={() => setPreviewEntry(null)}
        entry={previewEntry}
      />
      <ConfirmDialogComponent />
    </div>
  );
}
