/**
 * Anomaly Detection Dashboard
 *
 * Dashboard de détection et gestion des anomalies comptables.
 * Affiche les anomalies détectées avec filtres, statistiques et actions.
 */
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import {
  detectAllAnomalies,
  getAnomalyStats,
  type Anomaly,
  type AnomalySeverity,
  type AnomalyType,
} from '@/services/accounting/anomalyDetectionService';
interface AnomalyDetectionDashboardProps {
  companyId: string;
  periodId: string;
}
const SEVERITY_COLORS: Record<AnomalySeverity, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};
const SEVERITY_ICONS: Record<AnomalySeverity, React.ReactNode> = {
  critical: <AlertTriangle className="h-4 w-4" />,
  high: <AlertCircle className="h-4 w-4" />,
  medium: <Info className="h-4 w-4" />,
  low: <Info className="h-4 w-4" />,
};
const TYPE_LABELS: Record<AnomalyType, string> = {
  suspicious_amount: 'Montant suspect',
  inactive_account: 'Compte inactif',
  unbalanced_ratio: 'Ratio déséquilibré',
  overdue_lettrage: 'Lettrage en retard',
  vat_discrepancy: 'Écart TVA',
  duplicate_entry: 'Doublon',
  unusual_journal: 'Journal inhabituel',
  high_amount: 'Montant élevé',
  weekend_entry: 'Saisie weekend',
};
export function AnomalyDetectionDashboard({
  companyId,
  periodId,
}: AnomalyDetectionDashboardProps) {
  const { showToast } = useToast();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [filteredAnomalies, setFilteredAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  // Filtres
  const [severityFilter, setSeverityFilter] = useState<AnomalySeverity | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<AnomalyType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('open');
  const loadAnomalies = async () => {
    setLoading(true);
    try {
      const detected = await detectAllAnomalies(companyId, periodId);
      setAnomalies(detected);
      setFilteredAnomalies(detected.filter(a => a.status === 'open'));
      const statistics = await getAnomalyStats(detected);
      setStats(statistics);
      showToast(`Analyse terminée: ${detected.length} anomalie(s) détectée(s)`, 'success');
    } catch (error) {
      logger.error('AnomalyDetectionDashboard', 'Error detecting anomalies:', error);
      showToast('Erreur: Impossible de détecter les anomalies', 'error');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadAnomalies();
  }, [companyId, periodId]);
  useEffect(() => {
    let filtered = anomalies;
    if (severityFilter !== 'all') {
      filtered = filtered.filter(a => a.severity === severityFilter);
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(a => a.type === typeFilter);
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }
    setFilteredAnomalies(filtered);
  }, [severityFilter, typeFilter, statusFilter, anomalies]);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Détection d'Anomalies</h2>
          <p className="text-sm text-muted-foreground">
            Analyse intelligente des écritures comptables
          </p>
        </div>
        <Button onClick={loadAnomalies} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analyse en cours...' : 'Relancer l\'analyse'}
        </Button>
      </div>
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critiques</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.by_severity.critical + stats.by_severity.high}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ouvertes</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.by_status.open}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Résolues</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.by_status.resolved}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </Card>
        </div>
      )}
      {/* Filtres */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Sévérité</label>
              <Select value={severityFilter} onValueChange={(v: any) => setSeverityFilter(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Type</label>
              <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="suspicious_amount">Montant suspect</SelectItem>
                  <SelectItem value="duplicate_entry">Doublon</SelectItem>
                  <SelectItem value="overdue_lettrage">Lettrage retard</SelectItem>
                  <SelectItem value="inactive_account">Compte inactif</SelectItem>
                  <SelectItem value="weekend_entry">Saisie weekend</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Statut</label>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="open">Ouverts</SelectItem>
                  <SelectItem value="resolved">Résolus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>
      {/* Liste des anomalies */}
      <div className="space-y-3">
        {filteredAnomalies.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune anomalie détectée</h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter === 'open'
                ? 'Toutes les anomalies ont été résolues ou aucune anomalie n\'a été trouvée.'
                : 'Aucune anomalie ne correspond aux filtres sélectionnés.'}
            </p>
          </Card>
        ) : (
          filteredAnomalies.map(anomaly => (
            <Card key={anomaly.id} className="p-4">
              <div className="flex items-start gap-4">
                {/* Icône sévérité */}
                <div className={`p-2 rounded-lg ${SEVERITY_COLORS[anomaly.severity]}`}>
                  {SEVERITY_ICONS[anomaly.severity]}
                </div>
                {/* Contenu */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{anomaly.title}</h3>
                      <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={SEVERITY_COLORS[anomaly.severity]}>
                        {anomaly.severity}
                      </Badge>
                      <Badge variant="outline">
                        {TYPE_LABELS[anomaly.type]}
                      </Badge>
                    </div>
                  </div>
                  {/* Détails */}
                  {anomaly.account_number && (
                    <div className="text-sm mb-2">
                      <span className="font-medium">Compte:</span>{' '}
                      <span className="font-mono">{anomaly.account_number}</span>
                    </div>
                  )}
                  {anomaly.amount && (
                    <div className="text-sm mb-2">
                      <span className="font-medium">Montant:</span>{' '}
                      <span className="font-mono">{anomaly.amount.toFixed(2)} €</span>
                    </div>
                  )}
                  {/* Action suggérée */}
                  {anomaly.suggested_action && (
                    <div className="bg-muted p-3 rounded-lg text-sm mt-3">
                      <span className="font-medium">Action suggérée:</span> {anomaly.suggested_action}
                    </div>
                  )}
                  {/* Boutons d'action */}
                  <div className="flex gap-2 mt-4">
                    {anomaly.journal_entry_id && (
                      <Button variant="outline" size="sm">
                        Voir l'écriture
                      </Button>
                    )}
                    {anomaly.status === 'open' && (
                      <>
                        <Button variant="outline" size="sm" className="text-green-600">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Marquer résolu
                        </Button>
                        <Button variant="outline" size="sm" className="text-gray-600">
                          <XCircle className="mr-2 h-4 w-4" />
                          Faux positif
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}