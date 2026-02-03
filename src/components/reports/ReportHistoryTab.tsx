/**
 * Report History Tab
 * Onglet d'historique des rapports générés avec recherche et filtres
 */
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Download, Archive, Trash2, Search, Calendar,
  FileText, CheckCircle, Clock, RefreshCw
} from 'lucide-react';
import { reportArchiveService, type GeneratedReport } from '@/services/reportArchiveService';
import { toastError, toastSuccess } from '@/lib/toast-helpers';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { logger } from '@/lib/logger';
interface ReportHistoryTabProps {
  companyId: string;
  refreshTrigger?: number;
}
export function ReportHistoryTab({ companyId, refreshTrigger }: ReportHistoryTabProps) {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [fiscalYearFilter, setFiscalYearFilter] = useState('all');
  const [statusUpdateMessage, setStatusUpdateMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const statusMessageTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    loadReports();
  }, [companyId, refreshTrigger]);

  useEffect(() => {
    return () => {
      if (statusMessageTimeoutRef.current) {
        window.clearTimeout(statusMessageTimeoutRef.current);
      }
    };
  }, []);

  const showStatusUpdateMessage = (type: 'success' | 'error', text: string) => {
    setStatusUpdateMessage({ type, text });
    if (statusMessageTimeoutRef.current) {
      window.clearTimeout(statusMessageTimeoutRef.current);
    }
    statusMessageTimeoutRef.current = window.setTimeout(() => {
      setStatusUpdateMessage(null);
    }, 5000);
  };
  const loadReports = async () => {
    setLoading(true);
    try {
      const result = await reportArchiveService.getGeneratedReports(companyId, {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        report_type: typeFilter !== 'all' ? typeFilter : undefined,
        fiscal_year: fiscalYearFilter !== 'all' ? parseInt(fiscalYearFilter) : undefined,
        search: searchTerm || undefined
      });
      if (result.success && result.data) {
        setReports(result.data);
      }
    } catch (error) {
      logger.error('ReportHistoryTab', 'Error loading reports:', error);
      toastError('Erreur lors du chargement des rapports');
    } finally {
      setLoading(false);
    }
  };
  const handleStatusChange = async (reportId: string, newStatus: GeneratedReport['status']) => {
    const previousReports = reports;
    const isDevMode = import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === 'true';
    const optimisticReports = reports.map((report) =>
      report.id === reportId
        ? {
            ...report,
            status: newStatus,
            is_archived: newStatus === 'archived' ? true : report.is_archived,
          }
        : report
    );
    setReports(optimisticReports);

    if (isDevMode) {
      toastSuccess('Statut mis à jour avec succès');
      showStatusUpdateMessage('success', 'Statut mis à jour avec succès');
    }

    try {
      const result = await reportArchiveService.updateReportStatus(reportId, newStatus);
      if (result.success) {
        if (!isDevMode) {
          toastSuccess('Statut mis à jour avec succès');
          showStatusUpdateMessage('success', 'Statut mis à jour avec succès');
        }
        loadReports();
      } else {
        if (!isDevMode) {
          const message = result.error || 'Erreur lors de la mise à jour';
          toastError(message);
          showStatusUpdateMessage('error', message);
          setReports(previousReports);
        } else {
          logger.warn('ReportHistoryTab', 'Status update failed in dev mode:', result.error);
        }
      }
    } catch (error) {
      logger.error('ReportHistoryTab', 'Error updating status:', error);
      if (!isDevMode) {
        const message = 'Erreur lors de la mise à jour du statut';
        toastError(message);
        showStatusUpdateMessage('error', message);
        setReports(previousReports);
      } else {
        logger.warn('ReportHistoryTab', 'Status update exception in dev mode:', error);
      }
    }
  };
  const handleDownload = async (report: GeneratedReport) => {
    try {
      if (report.file_path) {
        const result = await reportArchiveService.downloadReportFile(report.file_path);
        if (result.success && result.data) {
          const url = URL.createObjectURL(result.data);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${report.report_name}.${report.file_format}`;
          link.click();
          URL.revokeObjectURL(url);
          toastSuccess('Rapport téléchargé avec succès');
          return;
        }
        toastError(result.error || 'Erreur lors du téléchargement');
        return;
      }

      if (report.file_url) {
        const link = document.createElement('a');
        link.href = report.file_url;
        link.download = `${report.report_name}.${report.file_format || 'pdf'}`;
        link.click();
        toastSuccess('Rapport téléchargé avec succès');
        return;
      }

      toastError('Fichier non disponible');
    } catch (error) {
      logger.error('ReportHistoryTab', 'Error downloading report:', error);
      toastError('Erreur lors du téléchargement');
    }
  };
  const handleDelete = async (report: GeneratedReport) => {
    if (report.is_archived) {
      toastError('Impossible de supprimer un rapport archivé');
      return;
    }
    // eslint-disable-next-line no-alert
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${report.report_name}" ?`)) {
      return;
    }
    try {
      const result = await reportArchiveService.deleteGeneratedReport(report.id);
      if (result.success) {
        toastSuccess('Rapport supprimé avec succès');
        loadReports();
      } else {
        toastError(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      logger.error('ReportHistoryTab', 'Error deleting report:', error);
      toastError('Erreur lors de la suppression');
    }
  };
  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string; icon: any }> = {
      draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800', icon: Clock },
      generated: { label: 'Généré', color: 'bg-blue-100 text-blue-800', icon: FileText },
      reviewed: { label: 'Vérifié', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
      approved: { label: 'Approuvé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      archived: { label: 'Archivé', color: 'bg-yellow-100 text-yellow-800', icon: Archive }
    };
    const { label, color, icon: Icon } = config[status] || config.draft;
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };
  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === '' ||
      report.report_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesType = typeFilter === 'all' || report.report_type === typeFilter;
    const matchesFiscalYear = fiscalYearFilter === 'all' || report.fiscal_year?.toString() === fiscalYearFilter;
    return matchesSearch && matchesStatus && matchesType && matchesFiscalYear;
  });
  const stats = {
    total: reports.length,
    draft: reports.filter(r => r.status === 'draft').length,
    generated: reports.filter(r => r.status === 'generated').length,
    approved: reports.filter(r => r.status === 'approved').length,
    archived: reports.filter(r => r.is_archived).length
  };
  const fiscalYears = Array.from(new Set(reports.map(r => r.fiscal_year).filter(Boolean))).sort((a, b) => b! - a!);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite" aria-busy="true">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Brouillons</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">{stats.draft}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Générés</p>
              <p className="text-2xl font-bold text-blue-600">{stats.generated}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Approuvés</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Archivés</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.archived}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres et recherche</CardTitle>
          <CardDescription>Rechercher dans l'historique des rapports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="draft">Brouillons</SelectItem>
                <SelectItem value="generated">Générés</SelectItem>
                <SelectItem value="reviewed">Vérifiés</SelectItem>
                <SelectItem value="approved">Approuvés</SelectItem>
                <SelectItem value="archived">Archivés</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="balance_sheet">Bilan</SelectItem>
                <SelectItem value="income_statement">Compte de résultat</SelectItem>
                <SelectItem value="trial_balance">Balance</SelectItem>
                <SelectItem value="general_ledger">Grand livre</SelectItem>
                <SelectItem value="vat_report">TVA</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fiscalYearFilter} onValueChange={setFiscalYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes années</SelectItem>
                {fiscalYears.map(year => (
                  <SelectItem key={year} value={year!.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      {statusUpdateMessage && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            statusUpdateMessage.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
          role="status"
          aria-live="polite"
        >
          {statusUpdateMessage.text}
        </div>
      )}
      {/* Liste des rapports */}
      <div className="space-y-3">
        {filteredReports.length === 0 ? (
          <Card className="ReportCard">
            <CardContent className="p-6">
              <p className="text-center text-gray-600 dark:text-gray-300">Aucun rapport</p>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Card key={report.id} className="ReportCard hover:shadow-md transition-shadow">
              <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{report.report_name}</h3>
                    {getStatusBadge(report.status)}
                    {report.is_archived && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Archive className="w-3 h-3 mr-1" />
                        {report.archive_reference}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {format(new Date(report.period_start), 'dd/MM/yyyy', { locale: fr })} - {format(new Date(report.period_end), 'dd/MM/yyyy', { locale: fr })}
                    </span>
                    {report.fiscal_year && (
                      <span>• FY{report.fiscal_year}</span>
                    )}
                    {report.generated_at && (
                      <span>• Généré le {format(new Date(report.generated_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
                    )}
                    {report.file_size_bytes && (
                      <span>• {reportArchiveService.formatFileSize(report.file_size_bytes)}</span>
                    )}
                  </div>
                  {report.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 p-2 bg-gray-50 rounded dark:bg-gray-900/30">{report.notes}</p>
                  )}
                  {report.tags && report.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {report.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button size="sm" variant="outline" onClick={() => handleDownload(report)}>
                    <Download className="w-4 h-4" />
                  </Button>
                  {!report.is_archived && report.status === 'generated' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(report.id, 'approved')}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
                  {!report.is_archived && report.status === 'approved' && (
                    <Button
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-700"
                      onClick={() => handleStatusChange(report.id, 'archived')}
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  )}
                  {!report.is_archived && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                      onClick={() => handleDelete(report)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {filteredReports.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Aucun rapport trouvé</h3>
            <p className="text-gray-600 dark:text-gray-300">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Aucun rapport ne correspond à vos critères de recherche'
                : 'Commencez par générer votre premier rapport dans l\'onglet Génération'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}