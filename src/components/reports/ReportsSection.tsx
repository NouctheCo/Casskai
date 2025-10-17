import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Download
} from 'lucide-react';
import { FinancialReport, ReportFilters } from '../../types/reports.types';

interface ReportsSectionProps {
  reports: FinancialReport[];
  filteredReports: FinancialReport[];
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  onViewReport: (reportId: string) => void;
  onEditReport: (reportId: string) => void;
  onDeleteReport: (reportId: string) => void;
  onDownloadReport: (reportId: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ready': return 'bg-green-100 text-green-800';
    case 'generating': return 'bg-blue-100 text-blue-800';
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'published': return 'bg-purple-100 text-purple-800';
    case 'archived': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'balance_sheet': return 'bg-blue-100 text-blue-800';
    case 'income_statement': return 'bg-green-100 text-green-800';
    case 'cash_flow': return 'bg-purple-100 text-purple-800';
    case 'trial_balance': return 'bg-orange-100 text-orange-800';
    case 'profit_loss': return 'bg-red-100 text-red-800';
    case 'general_ledger': return 'bg-indigo-100 text-indigo-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const ReportFiltersComponent: React.FC<{
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
}> = ({ filters, onFiltersChange }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un rapport..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              title="Rechercher un rapport"
            />
          </div>
        </div>
        <Select
          value={filters.type}
          onValueChange={(value) => onFiltersChange({ ...filters, type: value })}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Type de rapport" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_types">Tous les types</SelectItem>
            <SelectItem value="balance_sheet">Bilan</SelectItem>
            <SelectItem value="income_statement">Compte de résultat</SelectItem>
            <SelectItem value="cash_flow">Flux de trésorerie</SelectItem>
            <SelectItem value="trial_balance">Balance générale</SelectItem>
            <SelectItem value="profit_loss">P&L</SelectItem>
            <SelectItem value="general_ledger">Grand livre</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.status}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_statuses">Tous les statuts</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="generating">En cours</SelectItem>
            <SelectItem value="ready">Prêt</SelectItem>
            <SelectItem value="published">Publié</SelectItem>
            <SelectItem value="archived">Archivé</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardContent>
  </Card>
);

const ReportCard: React.FC<{
  report: FinancialReport;
  onViewReport: (reportId: string) => void;
  onEditReport: (reportId: string) => void;
  onDeleteReport: (reportId: string) => void;
  onDownloadReport: (reportId: string) => void;
}> = ({ report, onViewReport, onEditReport, onDeleteReport, onDownloadReport }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">{report.name}</h3>
            <Badge className={getTypeColor(report.type)}>
              {report.type.replace('_', ' ')}
            </Badge>
            <Badge className={getStatusColor(report.status)}>
              {report.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Période: {new Date(report.period_start).toLocaleDateString('fr-FR')} - {new Date(report.period_end).toLocaleDateString('fr-FR')}</span>
            <span>Format: {report.format}</span>
            <span>Généré: {report.generated_at ? new Date(report.generated_at).toLocaleDateString('fr-FR') : 'Jamais'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onViewReport(report.id)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEditReport(report.id)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDownloadReport(report.id)}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDeleteReport(report.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Report Options */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={report.include_notes}
            readOnly
            className="h-4 w-4"
            title="Inclure notes"
          />
          <span>Inclure notes</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={report.include_charts}
            readOnly
            className="h-4 w-4"
            title="Inclure graphiques"
          />
          <span>Inclure graphiques</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={report.show_variance}
            readOnly
            className="h-4 w-4"
            title="Afficher écarts"
          />
          <span>Afficher écarts</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-600">Accès: </span>
          <Badge variant="outline">{report.access_level}</Badge>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const ReportsSection: React.FC<ReportsSectionProps> = ({
  reports,
  filteredReports,
  filters,
  onFiltersChange,
  onViewReport,
  onEditReport,
  onDeleteReport,
  onDownloadReport
}) => {
  return (
    <div className="space-y-6">
      <ReportFiltersComponent filters={filters} onFiltersChange={onFiltersChange} />

      {/* Reports Count */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {filteredReports.length} rapport{filteredReports.length !== 1 ? 's' : ''} sur {reports.length}
        </p>
      </div>

      {/* Reports List */}
      <div className="grid gap-6">
        {filteredReports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            onViewReport={onViewReport}
            onEditReport={onEditReport}
            onDeleteReport={onDeleteReport}
            onDownloadReport={onDownloadReport}
          />
        ))}
      </div>
    </div>
  );
};
