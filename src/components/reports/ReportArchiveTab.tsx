/**
 * Report Archive Tab
 * Onglet d'archivage légal des rapports (conservation 10 ans minimum)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Archive, Download, Eye, Search, AlertCircle, CheckCircle,
  Calendar, HardDrive, FileText, Shield, RefreshCw, Scale
} from 'lucide-react';
import { reportArchiveService, type ReportArchive, type ArchiveStats } from '@/services/reportArchiveService';
import { useToast } from '@/hooks/useToast';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReportArchiveTabProps {
  companyId: string;
  refreshTrigger?: number;
}

export function ReportArchiveTab({ companyId, refreshTrigger }: ReportArchiveTabProps) {
  const { showToast } = useToast();
  const [archives, setArchives] = useState<ReportArchive[]>([]);
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [fiscalYearFilter, setFiscalYearFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    loadArchives();
  }, [companyId, refreshTrigger]);

  const loadArchives = async () => {
    setLoading(true);
    try {
      const [archivesResult, statsResult] = await Promise.all([
        reportArchiveService.getArchives(companyId, {
          report_type: typeFilter !== 'all' ? typeFilter : undefined,
          fiscal_year: fiscalYearFilter !== 'all' ? parseInt(fiscalYearFilter) : undefined,
          archive_category: categoryFilter !== 'all' ? categoryFilter : undefined
        }),
        reportArchiveService.getArchiveStats(companyId)
      ]);

      if (archivesResult.success && archivesResult.data) {
        setArchives(archivesResult.data);
      }
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('Error loading archives:', error);
      showToast('Erreur lors du chargement des archives', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (archive: ReportArchive) => {
    try {
      // Logger l'accès pour traçabilité
      await reportArchiveService.logArchiveAccess(
        archive.id,
        companyId, // TODO: use actual user ID
        'download'
      );

      const result = await reportArchiveService.downloadReportFile(archive.archive_file_path);
      if (result.success && result.data) {
        const url = URL.createObjectURL(result.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${archive.report_name}_${archive.archive_reference}.${archive.file_format}`;
        link.click();
        URL.revokeObjectURL(url);
        showToast('Archive téléchargée avec succès', 'success');
      } else {
        showToast(result.error || 'Erreur lors du téléchargement', 'error');
      }
    } catch (error) {
      console.error('Error downloading archive:', error);
      showToast('Erreur lors du téléchargement', 'error');
    }
  };

  const calculateDaysUntilDestruction = (retentionUntil: string): number => {
    const today = new Date();
    const retention = new Date(retentionUntil);
    return differenceInDays(retention, today);
  };

  const getCategoryBadge = (category?: string) => {
    const config: Record<string, { label: string; color: string; icon: any }> = {
      obligatoire: { label: 'Obligatoire', color: 'bg-red-100 text-red-800', icon: Scale },
      fiscal: { label: 'Fiscal', color: 'bg-yellow-100 text-yellow-800', icon: FileText },
      audit: { label: 'Audit', color: 'bg-purple-100 text-purple-800', icon: Shield },
      historique: { label: 'Historique', color: 'bg-gray-100 text-gray-800', icon: Archive }
    };
    const { label, color, icon: Icon } = config[category || 'historique'];
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const filteredArchives = archives.filter(archive => {
    const matchesSearch = searchTerm === '' ||
      archive.report_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      archive.archive_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      archive.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || archive.report_type === typeFilter;
    const matchesFiscalYear = fiscalYearFilter === 'all' || archive.fiscal_year.toString() === fiscalYearFilter;
    const matchesCategory = categoryFilter === 'all' || archive.archive_category === categoryFilter;
    return matchesSearch && matchesType && matchesFiscalYear && matchesCategory;
  });

  const fiscalYears = Array.from(new Set(archives.map(a => a.fiscal_year))).sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Chargement des archives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">Total Archives</p>
                  <p className="text-2xl font-bold">{stats.total_archives}</p>
                </div>
                <Archive className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">Espace Utilisé</p>
                  <p className="text-2xl font-bold">{stats.total_size_mb.toFixed(2)} MB</p>
                </div>
                <HardDrive className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">Obligatoires</p>
                  <p className="text-2xl font-bold text-red-600">{stats.obligatoires}</p>
                </div>
                <Scale className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">Expire Bientôt</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.expiring_soon}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">À Détruire</p>
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-400 dark:text-gray-500">{stats.can_be_destroyed}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-gray-600 dark:text-gray-400 dark:text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Archives Légales</CardTitle>
          <CardDescription>
            Conservation réglementaire 10 ans minimum (Code de commerce Art. L123-22)
          </CardDescription>
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
                  <SelectItem key={year} value={year.toString()}>FY{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="obligatoire">Obligatoires</SelectItem>
                <SelectItem value="fiscal">Fiscaux</SelectItem>
                <SelectItem value="audit">Audit</SelectItem>
                <SelectItem value="historique">Historique</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des archives */}
      <div className="space-y-3">
        {filteredArchives.map((archive) => {
          const daysUntil = calculateDaysUntilDestruction(archive.retention_until);
          const isExpiringSoon = daysUntil < 365 && daysUntil > 0;
          const canBeDestroyed = archive.can_be_destroyed;
          const totalDays = archive.retention_years * 365;
          const elapsedDays = totalDays - daysUntil;
          const progressPercentage = Math.min(100, (elapsedDays / totalDays) * 100);

          return (
            <Card
              key={archive.id}
              className={`hover:shadow-lg transition-shadow ${
                canBeDestroyed ? 'border-red-300' : isExpiringSoon ? 'border-orange-300' : ''
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className="bg-gray-100 text-gray-800 font-mono">
                        {archive.archive_reference}
                      </Badge>
                      <h3 className="font-semibold text-lg">{archive.report_name}</h3>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {getCategoryBadge(archive.archive_category)}
                      <Badge variant="outline">
                        {reportArchiveService.getReportTypeLabel(archive.report_type)}
                      </Badge>
                      <Badge variant="outline">
                        FY{archive.fiscal_year}
                      </Badge>
                      {archive.file_size_bytes && (
                        <Badge variant="outline">
                          <HardDrive className="w-3 h-3 mr-1" />
                          {reportArchiveService.formatFileSize(archive.file_size_bytes)}
                        </Badge>
                      )}
                      {archive.importance_level && (
                        <Badge variant={archive.importance_level === 'high' ? 'default' : 'outline'}>
                          {archive.importance_level === 'high' ? 'Haute importance' : 'Importance normale'}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-1">Date du rapport</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">
                            {format(new Date(archive.report_date), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-1">Archivé le</p>
                        <div className="flex items-center gap-2">
                          <Archive className="w-4 h-4 text-purple-600" />
                          <span className="font-medium">
                            {format(new Date(archive.archived_at), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-1">Conservation</p>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{archive.retention_years} ans</span>
                        </div>
                      </div>
                    </div>

                    {/* Statut de rétention */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Conservation jusqu'au {format(new Date(archive.retention_until), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                        {canBeDestroyed ? (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Peut être détruit
                          </Badge>
                        ) : isExpiringSoon ? (
                          <Badge className="bg-orange-100 text-orange-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Expire dans {daysUntil} jours
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {daysUntil} jours restants
                          </Badge>
                        )}
                      </div>
                      {!canBeDestroyed && (
                        <Progress value={progressPercentage} className="h-2" />
                      )}
                    </div>

                    {archive.legal_requirement && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs font-medium text-blue-900 mb-1">Base légale</p>
                        <p className="text-sm text-blue-800">{archive.legal_requirement}</p>
                      </div>
                    )}

                    {archive.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{archive.notes}</p>
                      </div>
                    )}

                    {archive.tags && archive.tags.length > 0 && (
                      <div className="flex gap-1 mt-3">
                        {archive.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => handleDownload(archive)}>
                      <Download className="w-4 h-4" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredArchives.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Archive className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Aucune archive</h3>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">
              {searchTerm || typeFilter !== 'all' || fiscalYearFilter !== 'all'
                ? 'Aucune archive ne correspond à vos critères'
                : 'Les rapports approuvés seront automatiquement archivés ici'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info légale */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                Conservation légale et conformité
              </h3>
              <p className="text-blue-800 text-sm leading-relaxed mb-2">
                <strong>Code de commerce Art. L123-22 :</strong> Les documents comptables doivent être conservés pendant 10 ans.
                Les factures clients et fournisseurs pendant 10 ans. Les documents fiscaux (TVA, IS) pendant 6 ans.
              </p>
              <p className="text-blue-800 text-sm leading-relaxed">
                Tous les documents archivés dans cette section bénéficient d'une traçabilité complète
                et sont protégés contre toute modification ou suppression accidentelle.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
