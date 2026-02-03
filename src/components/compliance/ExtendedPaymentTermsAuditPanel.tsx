/**
 * CassKai - Composant Audit Multi-Documents
 * Affiche l'audit pour factures, devis, bons de commande, avoirs
 */

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { extendedPaymentTermsAuditService, type ExtendedAuditReport } from '@/services/extendedPaymentTermsAuditService';
import { toastSuccess, toastError } from '@/lib/toast-helpers';
import { Button } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ExtendedPaymentTermsAuditPanelProps {
  companyId: string;
}

export function ExtendedPaymentTermsAuditPanel({ companyId }: ExtendedPaymentTermsAuditPanelProps) {
  const [auditReport, setAuditReport] = useState<ExtendedAuditReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');

  const runFullAudit = async () => {
    setIsLoading(true);
    try {
      const report = await extendedPaymentTermsAuditService.auditAllDocuments(companyId);
      setAuditReport(report);
      toastSuccess(`✅ Audit terminé: ${report.compliantCount}/${report.totalDocuments} conformes`);
    } catch (error) {
      toastError('Erreur lors de l\'audit');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!auditReport) return;

    const headers = [
      'Type Document',
      'Numéro',
      'Devise',
      'Conforme',
      'Problèmes',
      'Termes Corrigés',
    ];

    const rows = auditReport.findings.map((f) => [
      f.documentType,
      f.documentNumber,
      f.currency,
      f.compliant ? 'Oui' : 'Non',
      f.issues.join('; '),
      f.correctedTerms?.join('\n') || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-multi-docs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toastSuccess('CSV exporté ✓');
  };

  const chartData = auditReport
    ? [
        { name: 'Factures', compliant: auditReport.byType.invoices.compliant, nonCompliant: auditReport.byType.invoices.nonCompliant },
        { name: 'Devis', compliant: auditReport.byType.quotes.compliant, nonCompliant: auditReport.byType.quotes.nonCompliant },
        { name: 'Bons Commande', compliant: auditReport.byType.purchaseOrders.compliant, nonCompliant: auditReport.byType.purchaseOrders.nonCompliant },
        { name: 'Avoirs', compliant: auditReport.byType.creditNotes.compliant, nonCompliant: auditReport.byType.creditNotes.nonCompliant },
        { name: 'Notes Débit', compliant: auditReport.byType.debitNotes.compliant, nonCompliant: auditReport.byType.debitNotes.nonCompliant },
      ]
    : [];

  const filteredFindings = selectedType === 'all'
    ? auditReport?.findings || []
    : (auditReport?.findings || []).filter((f) => f.documentType === selectedType);

  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold">🔍 Audit Multi-Documents</h3>
          <p className="text-sm text-gray-600">Vérifiez la conformité des conditions de paiement</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runFullAudit}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Audit en cours...' : '🚀 Lancer Audit Complet'}
          </Button>
          {auditReport && (
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download size={16} /> CSV
            </Button>
          )}
        </div>
      </div>

      {auditReport && (
        <>
          {/* Statistiques générales */}
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600">Total Documents</div>
              <div className="text-2xl font-bold">{auditReport.totalDocuments}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 size={16} /> Conformes
              </div>
              <div className="text-2xl font-bold text-green-600">{auditReport.compliantCount}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-red-200">
              <div className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={16} /> Non-conformes
              </div>
              <div className="text-2xl font-bold text-red-600">{auditReport.nonCompliantCount}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600">Taux Conformité</div>
              <div className="text-2xl font-bold text-blue-600">
                {((auditReport.compliantCount / auditReport.totalDocuments) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600">Audit Date</div>
              <div className="text-sm font-mono">{new Date(auditReport.auditDate).toLocaleDateString('fr-FR')}</div>
            </div>
          </div>

          {/* Graphique par type */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold mb-4">📊 Conformité par Type</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="compliant" fill="#10b981" name="Conformes" />
                <Bar dataKey="nonCompliant" fill="#ef4444" name="Non-conformes" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Filtre par type */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold mb-3">🔎 Détails des Problèmes</h4>
            <Tabs value={selectedType} onValueChange={setSelectedType}>
              <TabsList className="grid grid-cols-6 w-full">
                <TabsTrigger value="all">Tous ({auditReport.findings.length})</TabsTrigger>
                <TabsTrigger value="invoice">Factures ({auditReport.byType.invoices.nonCompliant})</TabsTrigger>
                <TabsTrigger value="quote">Devis ({auditReport.byType.quotes.nonCompliant})</TabsTrigger>
                <TabsTrigger value="purchase_order">Bons ({auditReport.byType.purchaseOrders.nonCompliant})</TabsTrigger>
                <TabsTrigger value="credit_note">Avoirs ({auditReport.byType.creditNotes.nonCompliant})</TabsTrigger>
                <TabsTrigger value="debit_note">Notes Débit ({auditReport.byType.debitNotes.nonCompliant})</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedType} className="mt-4">
                {filteredFindings.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <CheckCircle2 className="mx-auto mb-2 text-green-600" size={32} />
                    ✅ Aucun problème détecté pour ce type de document
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredFindings.map((finding) => (
                      <div
                        key={finding.documentId}
                        className="border border-red-200 bg-red-50 p-4 rounded-lg space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold">
                              {finding.documentNumber} ({finding.documentType})
                            </div>
                            <div className="text-sm text-gray-600">Devise: {finding.currency}</div>
                          </div>
                          <div className="px-2 py-1 bg-red-200 text-red-700 rounded text-sm font-semibold">
                            ❌ Non-conforme
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-red-100 space-y-1">
                          <div className="text-sm font-semibold text-gray-700">Problèmes:</div>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {finding.issues.map((issue, i) => (
                              <li key={i}>• {issue}</li>
                            ))}
                          </ul>
                        </div>
                        {finding.correctedTerms && finding.correctedTerms.length > 0 && (
                          <div className="bg-green-50 p-3 rounded border border-green-100 space-y-1">
                            <div className="text-sm font-semibold text-green-700">✓ Termes Recommandés:</div>
                            <div className="text-sm text-green-600 space-y-1">
                              {finding.correctedTerms.map((term, i) => (
                                <div key={i}>• {term}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  );
}
