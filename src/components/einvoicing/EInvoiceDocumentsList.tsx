/**
 * E-invoice Documents List Component
 * Display and manage e-invoicing documents with status tracking
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  FileText, 
  RefreshCw, 
  Download, 
  Eye, 
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Send
} from 'lucide-react';
import { logger } from '@/lib/logger';
import {
  EInvDocument, 
  EInvoiceLifecycleStatus, 
  EInvoiceFormat
} from '../../types/einvoicing.types';
interface EInvoiceDocumentsListProps {
  companyId: string;
  documents: EInvDocument[];
  onRefresh: () => Promise<void>;
}
const statusConfig = {
  DRAFT: { 
    label: 'Brouillon', 
    color: 'bg-gray-100 text-gray-800',
    icon: FileText 
  },
  SUBMITTED: { 
    label: 'Soumis', 
    color: 'bg-blue-100 text-blue-800',
    icon: Send 
  },
  DELIVERED: { 
    label: 'Livré', 
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle 
  },
  ACCEPTED: { 
    label: 'Accepté', 
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle 
  },
  REJECTED: { 
    label: 'Rejeté', 
    color: 'bg-red-100 text-red-800',
    icon: XCircle 
  },
  PAID: { 
    label: 'Payé', 
    color: 'bg-purple-100 text-purple-800',
    icon: CheckCircle 
  }
};
const formatLabels = {
  FACTURX: 'Factur-X',
  UBL: 'UBL 2.1',
  CII: 'UN/CEFACT CII'
};
const channelLabels = {
  PPF: 'Chorus Pro'
};
export const EInvoiceDocumentsList: React.FC<EInvoiceDocumentsListProps> = ({
  companyId: _companyId,
  documents,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EInvoiceLifecycleStatus | 'all'>('all');
  const [formatFilter, setFormatFilter] = useState<EInvoiceFormat | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.message_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.lifecycle_status === statusFilter;
    const matchesFormat = formatFilter === 'all' || doc.format === formatFilter;
    return matchesSearch && matchesStatus && matchesFormat;
  });
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };
  const getStatusIcon = (status: EInvoiceLifecycleStatus) => {
    const config = statusConfig[status];
    const IconComponent = config.icon;
    return <IconComponent className="h-4 w-4" />;
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents E-invoicing
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par ID ou Message ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as EInvoiceLifecycleStatus | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={formatFilter} onValueChange={(value) => setFormatFilter(value as EInvoiceFormat | 'all')}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous formats</SelectItem>
                {Object.entries(formatLabels).map(([format, label]) => (
                  <SelectItem key={format} value={format}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Documents Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead>Mis à jour</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FileText className="h-8 w-8" />
                        <p>Aucun document trouvé</p>
                        {searchTerm || statusFilter !== 'all' || formatFilter !== 'all' ? (
                          <p className="text-sm">Essayez de modifier les filtres</p>
                        ) : (
                          <p className="text-sm">Commencez par soumettre une facture</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium font-mono text-sm">{document.id.substring(0, 8)}...</p>
                          {document.message_id && (
                            <p className="text-xs text-muted-foreground">
                              MSG: {document.message_id}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={statusConfig[document.lifecycle_status].color}
                        >
                          {getStatusIcon(document.lifecycle_status)}
                          <span className="ml-1">
                            {statusConfig[document.lifecycle_status].label}
                          </span>
                        </Badge>
                        {document.lifecycle_reason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {document.lifecycle_reason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatLabels[document.format] || document.format}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {channelLabels[document.channel as keyof typeof channelLabels] || document.channel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDate(document.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDate(document.updated_at)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {document.pdf_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a
                                href={document.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Télécharger PDF"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {document.xml_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a
                                href={document.xml_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Télécharger XML"
                              >
                                <FileText className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Open document details modal or navigate to details page
                              logger.debug('EInvoiceDocumentsList', 'View document details:', document.id);
                            }}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Summary */}
          {filteredDocuments.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Affichage de {filteredDocuments.length} document(s) sur {documents.length}
              </div>
              <div className="flex gap-4">
                {Object.entries(statusConfig).map(([status, _config]) => {
                  const count = filteredDocuments.filter(doc => doc.lifecycle_status === status).length;
                  return count > 0 ? (
                    <div key={status} className="flex items-center gap-1">
                      {getStatusIcon(status as EInvoiceLifecycleStatus)}
                      <span>{count}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start">
              <Download className="h-4 w-4 mr-2" />
              Exporter la liste
            </Button>
            <Button variant="outline" className="justify-start">
              <RefreshCw className="h-4 w-4 mr-2" />
              Synchroniser les statuts
            </Button>
            <Button variant="outline" className="justify-start">
              <Filter className="h-4 w-4 mr-2" />
              Filtres avancés
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};