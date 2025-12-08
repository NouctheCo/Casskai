/**
 * Document Archive Tab
 * Gestion des archives légales des documents RH
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Archive, Search, Eye, Download, AlertCircle,
  Calendar, HardDrive, FileText, User, Clock, CheckCircle
} from 'lucide-react';
import { hrDocumentTemplatesService } from '@/services/hrDocumentTemplatesService';
import type { DocumentArchive, ArchiveStats, ArchiveType } from '@/types/hr-document-templates.types';

interface DocumentArchiveTabProps {
  companyId: string;
}

export function DocumentArchiveTab({ companyId }: DocumentArchiveTabProps) {
  const [archives, setArchives] = useState<DocumentArchive[]>([]);
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadArchives();
  }, [companyId]);

  const loadArchives = async () => {
    setLoading(true);
    const [archivesRes, statsRes] = await Promise.all([
      hrDocumentTemplatesService.getArchives(companyId),
      hrDocumentTemplatesService.getArchiveStats(companyId)
    ]);

    if (archivesRes.success && archivesRes.data) {
      setArchives(archivesRes.data);
    }
    if (statsRes.success && statsRes.data) {
      setStats(statsRes.data);
    }
    setLoading(false);
  };

  const filteredArchives = archives.filter(archive => {
    const matchesSearch = archive.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         archive.archive_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         archive.employee_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || archive.archive_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getArchiveTypeColor = (type: ArchiveType) => {
    switch (type) {
      case 'contract': return 'bg-blue-100 text-blue-800';
      case 'amendment': return 'bg-purple-100 text-purple-800';
      case 'termination': return 'bg-red-100 text-red-800';
      case 'certificate': return 'bg-green-100 text-green-800';
      case 'letter': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getArchiveTypeLabel = (type: ArchiveType) => {
    const labels: Record<ArchiveType, string> = {
      contract: 'Contrat',
      amendment: 'Avenant',
      termination: 'Rupture',
      certificate: 'Certificat',
      letter: 'Courrier',
      other: 'Autre'
    };
    return labels[type] || type;
  };

  const calculateDaysUntilDestruction = (retentionUntil: string) => {
    const today = new Date();
    const retention = new Date(retentionUntil);
    const diff = Math.ceil((retention.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Chargement des archives...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Documents</p>
                  <p className="text-2xl font-bold">{stats.total_documents}</p>
                </div>
                <Archive className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Espace Utilisé</p>
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Contrats</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.by_type.contract || 0}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Expire Bientôt</p>
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">À Détruire</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.can_be_destroyed}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Archives de Documents</CardTitle>
              <CardDescription>Gestion légale des archives RH</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <Input
                placeholder="Rechercher une archive..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">Tous types</option>
              <option value="contract">Contrats</option>
              <option value="amendment">Avenants</option>
              <option value="termination">Ruptures</option>
              <option value="certificate">Certificats</option>
              <option value="letter">Courriers</option>
              <option value="other">Autres</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Archives List */}
      <div className="space-y-3">
        {filteredArchives.map((archive) => {
          const daysUntil = calculateDaysUntilDestruction(archive.retention_until);
          const isExpiringSoon = daysUntil < 365 && daysUntil > 0;
          const canBeDestroyed = archive.can_be_destroyed;

          return (
            <Card key={archive.id} className={`hover:shadow-lg transition-shadow ${canBeDestroyed ? 'border-red-300' : isExpiringSoon ? 'border-orange-300' : ''}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className="bg-gray-100 text-gray-800 font-mono dark:text-gray-100 dark:bg-gray-900/50">
                        {archive.archive_reference}
                      </Badge>
                      <h3 className="font-semibold text-lg">{archive.document_name}</h3>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getArchiveTypeColor(archive.archive_type)}>
                        {getArchiveTypeLabel(archive.archive_type)}
                      </Badge>
                      {archive.employee_name && (
                        <Badge variant="outline">
                          <User className="w-3 h-3 mr-1" />
                          {archive.employee_name}
                        </Badge>
                      )}
                      {archive.file_size_bytes && (
                        <Badge variant="outline">
                          <HardDrive className="w-3 h-3 mr-1" />
                          {formatBytes(archive.file_size_bytes)}
                        </Badge>
                      )}
                      {archive.tags && archive.tags.length > 0 && archive.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-300 mb-1">Date du document</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">
                            {new Date(archive.document_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-600 dark:text-gray-300 mb-1">Archivé le</p>
                        <div className="flex items-center gap-2">
                          <Archive className="w-4 h-4 text-purple-600" />
                          <span className="font-medium">
                            {new Date(archive.archived_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-600 dark:text-gray-300 mb-1">Conservation</p>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{archive.retention_years} ans</span>
                        </div>
                      </div>
                    </div>

                    {/* Retention Status */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg dark:bg-gray-900/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Conservation jusqu'au {new Date(archive.retention_until).toLocaleDateString('fr-FR')}
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
                        <Progress
                          value={Math.min(100, ((archive.retention_years * 365 - daysUntil) / (archive.retention_years * 365)) * 100)}
                          className="h-2"
                        />
                      )}
                    </div>

                    {archive.notes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                        <p className="text-sm text-gray-700 dark:text-gray-200">{archive.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button size="sm" variant="outline" className="gap-1">
                      <Eye className="w-4 h-4" />
                      Voir
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1">
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
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Aucune archive</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Les documents signés seront automatiquement archivés ici
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
