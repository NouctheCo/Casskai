/**
 * Onglet Objectifs/OKR - Gestion des objectifs individuels et d'équipe
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  Plus,
  Search,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Pencil
} from 'lucide-react';
import { hrPerformanceService } from '@/services/hrPerformanceService';
import { ObjectiveFormModal } from './ObjectiveFormModal';
import type { Objective } from '@/types/hr-performance.types';

interface ObjectivesTabProps {
  companyId: string;
  employees: Array<{ id: string; first_name: string; last_name: string }>;
  currentUserId: string;
}

export function ObjectivesTab({ companyId, employees, currentUserId: _currentUserId }: ObjectivesTabProps) {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);

  useEffect(() => {
    loadObjectives();
  }, [companyId]);

  const loadObjectives = async () => {
    setLoading(true);
    const response = await hrPerformanceService.getObjectives(companyId);
    if (response.success && response.data) {
      setObjectives(response.data);
    }
    setLoading(false);
  };

  const handleCreateObjective = async (formData: any) => {
    const response = await hrPerformanceService.createObjective(companyId, formData);
    if (response.success) {
      await loadObjectives();
      setShowModal(false);
      setSelectedObjective(null);
      return true;
    }
    return false;
  };

  const handleUpdateObjective = async (formData: any) => {
    if (!selectedObjective) return false;
    const response = await hrPerformanceService.updateObjective(selectedObjective.id, formData);
    if (response.success) {
      await loadObjectives();
      setShowModal(false);
      setSelectedObjective(null);
      return true;
    }
    return false;
  };

  const _handleUpdateProgress = async (objectiveId: string, currentValue: number, progressPercentage: number) => {
    const response = await hrPerformanceService.updateObjectiveProgress(
      objectiveId,
      currentValue,
      progressPercentage
    );
    if (response.success) {
      await loadObjectives();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'exceeded':
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'at_risk':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <Target className="w-4 h-4 text-gray-600 dark:text-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'exceeded':
        return 'bg-purple-100 text-purple-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'at_risk':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      okr: 'OKR',
      smart: 'SMART',
      kpi: 'KPI',
      project: 'Projet'
    };
    return labels[type] || type;
  };

  const filteredObjectives = objectives.filter(obj => {
    const matchesSearch = obj.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         obj.employee_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || obj.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calcul des statistiques
  const stats = {
    total: objectives.length,
    completed: objectives.filter(o => o.status === 'completed').length,
    in_progress: objectives.filter(o => o.status === 'in_progress').length,
    at_risk: objectives.filter(o => o.status === 'at_risk').length,
    avg_progress: objectives.length > 0
      ? Math.round(objectives.reduce((sum, o) => sum + o.progress_percentage, 0) / objectives.length)
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Chargement des objectifs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">En cours</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Complétés</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.at_risk}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">À risque</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.avg_progress}%</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Progression moy.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche et filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <Input
                placeholder="Rechercher un objectif ou un employé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
              >
                <option value="all">Tous les statuts</option>
                <option value="not_started">Non démarré</option>
                <option value="in_progress">En cours</option>
                <option value="at_risk">À risque</option>
                <option value="completed">Complété</option>
                <option value="exceeded">Dépassé</option>
                <option value="cancelled">Annulé</option>
              </select>

              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvel objectif
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des objectifs */}
      <div className="grid grid-cols-1 gap-4">
        {filteredObjectives.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Aucun objectif trouvé
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Commencez par créer votre premier objectif'}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un objectif
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredObjectives.map((objective) => (
            <Card key={objective.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(objective.type ?? '')}
                      </Badge>
                      <Badge className={`${getStatusColor(objective.status)} text-xs flex items-center gap-1`}>
                        {getStatusIcon(objective.status)}
                        {objective.status.replace('_', ' ')}
                      </Badge>
                      {objective.weight && (
                        <Badge variant="secondary" className="text-xs">
                          Poids: {objective.weight}%
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg mb-1">{objective.title}</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{objective.employee_name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedObjective(objective);
                      setShowModal(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {objective.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{objective.description}</p>
                )}

                {/* Barre de progression */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-300">Progression</span>
                    <span className="font-semibold text-blue-600">
                      {objective.progress_percentage}%
                    </span>
                  </div>
                  <Progress value={objective.progress_percentage} className="h-2" />
                </div>

                {/* Valeurs cible et actuelle */}
                {objective.target_value !== null && objective.current_value !== null && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-900/30">
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">Valeur actuelle</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {objective.current_value} {objective.unit || ''}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-900/30">
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">Objectif</p>
                      <p className="text-lg font-semibold text-green-600">
                        {objective.target_value} {objective.unit || ''}
                      </p>
                    </div>
                  </div>
                )}

                {/* Key Results (OKR) */}
                {objective.type === 'okr' && objective.key_results && objective.key_results.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-semibold mb-2">Key Results:</p>
                    <div className="space-y-2">
                      {objective.key_results.map((kr: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 p-2 rounded text-sm dark:bg-gray-900/30">
                          <div className="flex justify-between mb-1">
                            <span>{kr.title}</span>
                            <span className="font-semibold">
                              {kr.current}/{kr.target} {kr.unit}
                            </span>
                          </div>
                          <Progress
                            value={(kr.current / kr.target) * 100}
                            className="h-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-300 mt-4 pt-4 border-t">
                  <span>Début: {new Date(objective.start_date).toLocaleDateString('fr-FR')}</span>
                  <span>Échéance: {new Date(objective.due_date).toLocaleDateString('fr-FR')}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de création/édition */}
      {showModal && (
        <ObjectiveFormModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedObjective(null);
          }}
          onSubmit={selectedObjective ? handleUpdateObjective : handleCreateObjective}
          employees={employees}
          objective={selectedObjective}
        />
      )}
    </div>
  );
}
