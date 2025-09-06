// @ts-nocheck
/**
 * E-invoice Submission Form Component
 * Form to submit invoices for e-invoicing processing
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { 
  Send, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Loader2
} from 'lucide-react';
import { 
  SubmissionOptions, 
  SubmissionResult,
  EInvoiceFormat,
  EInvoiceChannel
} from '../../types/einvoicing.types';

interface EInvoiceSubmissionFormProps {
  companyId: string;
  capabilities: {
    enabled: boolean;
    formats: EInvoiceFormat[];
    channels: EInvoiceChannel[];
    features: string[];
  } | null;
  onSubmit: (invoiceId: string, options?: SubmissionOptions) => Promise<SubmissionResult>;
}

interface InvoiceOption {
  id: string;
  invoice_number: string;
  issue_date: string;
  total_amount: number;
  third_party_name: string;
  currency: string;
}

export const EInvoiceSubmissionForm: React.FC<EInvoiceSubmissionFormProps> = ({
  companyId,
  capabilities,
  onSubmit
}) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [format, setFormat] = useState<EInvoiceFormat>('FACTURX');
  const [channel, setChannel] = useState<EInvoiceChannel>('PPF');
  const [asyncMode, setAsyncMode] = useState(true);
  const [validate, setValidate] = useState(true);
  const [archive, setArchive] = useState(true);
  
  const [invoiceOptions, setInvoiceOptions] = useState<InvoiceOption[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load available invoices
  useEffect(() => {
    const loadInvoices = async () => {
      setIsLoadingInvoices(true);
      try {
        // Mock API call to get invoices
        // In real implementation, this would call your invoices API
        const response = await fetch(`/api/invoices?company_id=${companyId}&limit=50`);
        const data = await response.json();
        
        if (data.success) {
          setInvoiceOptions(data.data || []);
        }
      } catch (err) {
        console.error('Error loading invoices:', err);
      } finally {
        setIsLoadingInvoices(false);
      }
    };

    if (companyId && capabilities?.enabled) {
      loadInvoices();
    }
  }, [companyId, capabilities?.enabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInvoiceId) {
      setError('Veuillez sélectionner une facture');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSubmissionResult(null);

    try {
      const options: SubmissionOptions = {
        format,
        channel,
        async: asyncMode,
        validate,
        archive
      };

      const result = await onSubmit(selectedInvoiceId, options);
      setSubmissionResult(result);

      if (result.success) {
        // Reset form on success
        setSelectedInvoiceId('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la soumission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedInvoice = invoiceOptions.find(inv => inv.id === selectedInvoiceId);

  if (!capabilities?.enabled) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            La facturation électronique n'est pas activée pour cette entreprise.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Soumettre une facture
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Transformez vos factures au format électronique conforme EN 16931
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invoice Selection */}
            <div className="space-y-2">
              <Label htmlFor="invoice-select">Facture à traiter *</Label>
              {isLoadingInvoices ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Chargement des factures...</span>
                </div>
              ) : (
                <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une facture" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoiceOptions.map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>
                            {invoice.invoice_number} - {invoice.third_party_name}
                          </span>
                          <Badge variant="outline">
                            {invoice.total_amount.toLocaleString('fr-FR', {
                              style: 'currency',
                              currency: invoice.currency
                            })}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Selected Invoice Preview */}
            {selectedInvoice && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Facture sélectionnée</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Numéro:</span>
                    <span className="ml-2 font-medium">{selectedInvoice.invoice_number}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <span className="ml-2">{new Date(selectedInvoice.issue_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Client:</span>
                    <span className="ml-2">{selectedInvoice.third_party_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Montant:</span>
                    <span className="ml-2 font-medium">
                      {selectedInvoice.total_amount.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: selectedInvoice.currency
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Format Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="format">Format de sortie</Label>
                <Select value={format} onValueChange={(value) => setFormat(value as EInvoiceFormat)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {capabilities.formats.map((fmt) => (
                      <SelectItem key={fmt} value={fmt}>
                        <div className="flex items-center gap-2">
                          <span>{fmt}</span>
                          {fmt === 'FACTURX' && (
                            <Badge variant="secondary" className="text-xs">Recommandé</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {format === 'FACTURX' && 'Format PDF/A-3 avec XML intégré (Factur-X 1.0.7)'}
                  {format === 'UBL' && 'Format XML UBL 2.1 (OASIS Universal Business Language)'}
                  {format === 'CII' && 'Format XML UN/CEFACT Cross Industry Invoice'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="channel">Canal de transmission</Label>
                <Select value={channel} onValueChange={(value) => setChannel(value as EInvoiceChannel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {capabilities.channels.map((ch) => (
                      <SelectItem key={ch} value={ch}>
                        <div className="flex items-center gap-2">
                          <span>{ch === 'PPF' ? 'Chorus Pro (PPF)' : ch}</span>
                          {ch === 'PPF' && (
                            <Badge variant="secondary" className="text-xs">Officiel</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {channel === 'PPF' && 'Plateforme française officielle Chorus Pro'}
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <Label>Options de traitement</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="async"
                  checked={asyncMode}
                  onCheckedChange={setAsyncMode}
                />
                <Label htmlFor="async" className="text-sm">
                  Traitement asynchrone
                </Label>
                <span className="text-xs text-muted-foreground ml-2">
                  (Recommandé pour de gros volumes)
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="validate"
                  checked={validate}
                  onCheckedChange={setValidate}
                />
                <Label htmlFor="validate" className="text-sm">
                  Validation EN 16931
                </Label>
                <span className="text-xs text-muted-foreground ml-2">
                  (Vérification de la conformité avant envoi)
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="archive"
                  checked={archive}
                  onCheckedChange={setArchive}
                />
                <Label htmlFor="archive" className="text-sm">
                  Archivage sécurisé
                </Label>
                <span className="text-xs text-muted-foreground ml-2">
                  (Conservation légale 10 ans)
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!selectedInvoiceId || isSubmitting}
                className="min-w-[150px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Soumettre
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {submissionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {submissionResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              Résultat de la soumission
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submissionResult.success ? (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Facture soumise avec succès pour traitement électronique
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {submissionResult.document_id && (
                    <div>
                      <span className="text-muted-foreground">Document ID:</span>
                      <span className="ml-2 font-mono">{submissionResult.document_id}</span>
                    </div>
                  )}
                  {submissionResult.message_id && (
                    <div>
                      <span className="text-muted-foreground">Message ID:</span>
                      <span className="ml-2 font-mono">{submissionResult.message_id}</span>
                    </div>
                  )}
                  {submissionResult.pdf_url && (
                    <div>
                      <a 
                        href={submissionResult.pdf_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Télécharger PDF
                      </a>
                    </div>
                  )}
                  {submissionResult.xml_url && (
                    <div>
                      <a 
                        href={submissionResult.xml_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Télécharger XML
                      </a>
                    </div>
                  )}
                </div>

                {submissionResult.warnings && submissionResult.warnings.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium mb-2">Avertissements:</h5>
                    <ul className="text-sm text-yellow-600 space-y-1">
                      {submissionResult.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Échec de la soumission de la facture
                  </AlertDescription>
                </Alert>
                
                {submissionResult.errors && submissionResult.errors.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2">Erreurs:</h5>
                    <ul className="text-sm text-red-600 space-y-1">
                      {submissionResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};