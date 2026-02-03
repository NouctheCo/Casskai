/**
 * CassKai - Composant d'Audit des Conditions de Paiement
 */

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { paymentTermsAuditService, AuditReport } from '@/services/paymentTermsAuditService';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

export function PaymentTermsAuditPanel() {
  const { currentCompany } = useAuth();
  const [auditReport, setAuditReport] = useState<{
    invoices: AuditReport;
    quotes: AuditReport;
    combined: AuditReport;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!currentCompany) {
    return <div>Veuillez sélectionner une entreprise</div>;
  }

  const runAudit = async () => {
    setLoading(true);
    try {
      const result = await paymentTermsAuditService.auditCompanyPaymentTerms(
        currentCompany.id
      );
      setAuditReport(result);
      toast.success('✅ Audit terminé');
      logger.info('PaymentTermsAudit', 'Audit result:', result);
    } catch (error) {
      logger.error('PaymentTermsAudit', 'Audit error:', error);
      toast.error('Erreur lors de l\'audit');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!auditReport) return;

    const report = auditReport.combined;
    const csv =
      `Type,Numéro,Devise,Conforme,Problèmes\n${report.findings
        .map(
          (f) =>
            `${f.documentType},"${f.documentNumber}","${f.currency}","${f.compliant ? 'OUI' : 'NON'}","${f.issues.join('; ')}"`
        )
        .join('\n')}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-conditions-paiement-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Audit des Conditions de Paiement
          </CardTitle>
          <CardDescription>
            Vérifiez la conformité des conditions légales sur vos factures et devis selon la devise
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Cet audit vérifie que vos conditions de paiement:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>Correspondent à la devise utilisée (EUR, XOF, XAF, MAD, TND, GBP, CHF, USD, CAD)</li>
            <li>Ne contiennent pas de conditions françaises sur des devises étrangères</li>
            <li>Ne contiennent pas de montants en € sur d'autres devises</li>
            <li>Respectent la législation du pays correspondant</li>
          </ul>
          <Button onClick={runAudit} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Audit en cours...
              </>
            ) : (
              'Lancer l\'audit'
            )}
          </Button>
        </CardContent>
      </Card>

      {auditReport && (
        <>
          {/* Résumé global */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Résultats de l'Audit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Documents vérifiés</p>
                  <p className="text-2xl font-bold">
                    {auditReport.combined.documentsChecked}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Conformes</p>
                  <p className="text-2xl font-bold text-green-600">
                    {auditReport.combined.compliantCount}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-950 p-4 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">À corriger</p>
                  <p className="text-2xl font-bold text-red-600">
                    {auditReport.combined.nonCompliantCount}
                  </p>
                </div>
              </div>

              {/* Détail par type */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="border rounded p-3">
                  <h4 className="font-semibold text-sm mb-2">Factures</h4>
                  <p className="text-2xl font-bold">
                    {auditReport.invoices.compliantCount}/{auditReport.invoices.documentsChecked}
                  </p>
                  <p className="text-xs text-gray-500">
                    {auditReport.invoices.nonCompliantCount} non-conformes
                  </p>
                </div>
                <div className="border rounded p-3">
                  <h4 className="font-semibold text-sm mb-2">Devis</h4>
                  <p className="text-2xl font-bold">
                    {auditReport.quotes.compliantCount}/{auditReport.quotes.documentsChecked}
                  </p>
                  <p className="text-xs text-gray-500">
                    {auditReport.quotes.nonCompliantCount} non-conformes
                  </p>
                </div>
              </div>

              <Button
                onClick={exportReport}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter le rapport (CSV)
              </Button>
            </CardContent>
          </Card>

          {/* Détails des non-conformités */}
          {auditReport.combined.findings.length > 0 && (
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader className="bg-red-50 dark:bg-red-950/30">
                <CardTitle className="text-red-700 dark:text-red-300">
                  ⚠️ Éléments à corriger ({auditReport.combined.findings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {auditReport.combined.findings.map((finding, idx) => (
                  <div
                    key={idx}
                    className="border border-red-200 dark:border-red-900 rounded-lg p-4 bg-red-50 dark:bg-red-950/20"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {finding.documentType === 'invoice' ? '📄 Facture' : '📋 Devis'}
                        </Badge>
                        <p className="font-semibold">{finding.documentNumber}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Devise: <span className="font-mono">{finding.currency}</span>
                        </p>
                      </div>
                      <Badge
                        variant="destructive"
                      >
                        À corriger
                      </Badge>
                    </div>

                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Problèmes détectés:
                      </p>
                      <ul className="space-y-1">
                        {finding.issues.map((issue, i) => (
                          <li key={i} className="text-sm text-red-700 dark:text-red-300">
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {finding.correctedTerms && (
                      <div className="mt-3 p-3 bg-white dark:bg-gray-950 rounded border border-green-200 dark:border-green-900">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-2">
                          ✅ Conditions suggérées:
                        </p>
                        <ul className="space-y-1">
                          {finding.correctedTerms.map((term, i) => (
                            <li key={i} className="text-xs text-gray-600 dark:text-gray-400">
                              • {term}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {auditReport.combined.findings.length === 0 && (
            <Card className="border-green-200 dark:border-green-900">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-6 w-6" />
                  <p>✅ Tous les documents sont conformes!</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
