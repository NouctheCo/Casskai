/**
 * Onglet Évaluations de Performance 360°
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardCheck,
  Plus,
  Search,
  Star,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';
import { hrPerformanceService } from '@/services/hrPerformanceService';
import { ReviewFormModal } from './ReviewFormModal';
import type { PerformanceReview } from '@/types/hr-performance.types';

interface PerformanceReviewsTabProps {
  companyId: string;
  employees: Array<{ id: string; first_name: string; last_name: string; email?: string }>;
  currentUserId: string;
}

export function PerformanceReviewsTab({
  companyId,
  employees,
  currentUserId: _currentUserId
}: PerformanceReviewsTabProps) {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [viewingReview, setViewingReview] = useState<PerformanceReview | null>(null);

  useEffect(() => {
    loadReviews();
  }, [companyId]);

  const loadReviews = async () => {
    setLoading(true);
    const response = await hrPerformanceService.getReviews(companyId);
    if (response.success && response.data) {
      setReviews(response.data);
    }
    setLoading(false);
  };

  const handleCreateReview = async (formData: any) => {
    const response = await hrPerformanceService.createReview(companyId, formData);
    if (response.success) {
      await loadReviews();
      setShowModal(false);
      return true;
    }
    return false;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      self: 'Auto-évaluation',
      manager: 'Manager',
      peer: 'Pair',
      '360': '360°',
      probation: 'Période d\'essai',
      mid_year: 'Mi-année',
      annual: 'Annuelle'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'acknowledged':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'submitted':
        return <Clock className="w-4 h-4" />;
      default:
        return <ClipboardCheck className="w-4 h-4" />;
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch =
      review.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || review.review_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: reviews.length,
    draft: reviews.filter(r => r.status === 'draft').length,
    submitted: reviews.filter(r => r.status === 'submitted').length,
    completed: reviews.filter(r => r.status === 'completed').length,
    avg_rating: reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / reviews.length).toFixed(1)
      : '0'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Chargement des évaluations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
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
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">{stats.draft}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Brouillons</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Soumises</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Complétées</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <p className="text-2xl font-bold text-yellow-600">{stats.avg_rating}</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Note moyenne</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <Input
                placeholder="Rechercher un employé ou évaluateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">Tous les types</option>
              <option value="self">Auto-évaluation</option>
              <option value="manager">Manager</option>
              <option value="peer">Pair</option>
              <option value="360">360°</option>
              <option value="probation">Période d'essai</option>
              <option value="mid_year">Mi-année</option>
              <option value="annual">Annuelle</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="submitted">Soumise</option>
              <option value="completed">Complétée</option>
              <option value="acknowledged">Reconnue</option>
            </select>

            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle évaluation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des évaluations */}
      <div className="grid grid-cols-1 gap-4">
        {filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Aucune évaluation trouvée
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Commencez par créer votre première évaluation'}
                </p>
                {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
                  <Button onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une évaluation
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredReviews.map((review) => (
            <Card key={review.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{getTypeLabel(review.review_type)}</Badge>
                      <Badge className={`${getStatusColor(review.status)} flex items-center gap-1`}>
                        {getStatusIcon(review.status)}
                        {review.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">
                      Évaluation de {review.employee_name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Par {review.reviewer_name} • {new Date(review.review_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {review.overall_rating && (
                    <div className="flex items-center gap-1">
                      {getRatingStars(review.overall_rating)}
                      <span className="ml-2 font-semibold">{review.overall_rating}/5</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {/* Period */}
                {review.review_date && (
                  <div className="bg-gray-50 p-3 rounded-lg mb-4 dark:bg-gray-900/30">
                    <p className="text-sm font-semibold mb-1">Période évaluée</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{new Date(review.review_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}

                {/* Ratings par compétence */}
                {review.competencies_ratings && Object.keys(review.competencies_ratings).length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold mb-2">Compétences</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(review.competencies_ratings).map(([comp, rating]) => (
                        <div key={comp} className="flex items-center justify-between bg-gray-50 p-2 rounded dark:bg-gray-900/30">
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{comp}</span>
                          <div className="flex items-center gap-1">
                            {getRatingStars(rating as unknown as number)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Objectifs */}
                {review.goals_total && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg dark:bg-blue-900/20">
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">Objectifs atteints</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {review.goals_achieved}/{review.goals_total}
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg dark:bg-green-900/20">
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">Taux de réussite</p>
                      <p className="text-lg font-semibold text-green-600">
                        {Math.round((review.goals_achieved / review.goals_total) * 100)}%
                      </p>
                    </div>
                  </div>
                )}

                {/* Recommandations RH */}
                {(review.promotion_recommended || review.raise_recommended || review.pip_required) && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {review.promotion_recommended && (
                      <Badge className="bg-purple-100 text-purple-800">
                        <Award className="w-3 h-3 mr-1" />
                        Promotion recommandée
                      </Badge>
                    )}
                    {review.raise_recommended && (
                      <Badge className="bg-green-100 text-green-800">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Augmentation recommandée
                      </Badge>
                    )}
                    {review.pip_required && (
                      <Badge className="bg-orange-100 text-orange-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        PIP requis
                      </Badge>
                    )}
                  </div>
                )}

                {/* Commentaires (aperçu) */}
                {review.strengths && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">Points forts</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{review.strengths}</p>
                  </div>
                )}

                {review.areas_for_improvement && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">Axes d'amélioration</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{review.areas_for_improvement}</p>
                  </div>
                )}

                {/* Bouton voir détails */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingReview(review)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Voir les détails
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <ReviewFormModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedReview(null);
          }}
          onSubmit={handleCreateReview}
          employees={employees}
          review={selectedReview}
        />
      )}

      {/* Modal de visualisation détaillée */}
      {viewingReview && (
        <ReviewDetailModal
          review={viewingReview}
          onClose={() => setViewingReview(null)}
        />
      )}
    </div>
  );
}

// Modal de détails d'évaluation
function ReviewDetailModal({ review, onClose }: { review: PerformanceReview; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Détails de l'évaluation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-2">
              Évaluation de {review.employee_name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Par {review.reviewer_name} • {new Date(review.review_date).toLocaleDateString('fr-FR')}
            </p>
          </div>

          {/* Ratings */}
          {review.overall_rating && (
            <div>
              <h4 className="font-semibold mb-2">Note globale</h4>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 ${
                      i < review.overall_rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="text-xl font-bold ml-2">{review.overall_rating}/5</span>
              </div>
            </div>
          )}

          {/* Strengths */}
          {review.strengths && (
            <div>
              <h4 className="font-semibold mb-2 text-green-700 dark:text-green-400">Points forts</h4>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{review.strengths}</p>
            </div>
          )}

          {/* Areas for improvement */}
          {review.areas_for_improvement && (
            <div>
              <h4 className="font-semibold mb-2 text-orange-700 dark:text-orange-400">Axes d'amélioration</h4>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{review.areas_for_improvement}</p>
            </div>
          )}

          {/* Development plan */}
          {review.development_plan && (
            <div>
              <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-400">Plan de développement</h4>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{review.development_plan}</p>
            </div>
          )}

          {/* Comments */}
          {review.manager_comments && (
            <div>
              <h4 className="font-semibold mb-2">Commentaires de l'évaluateur</h4>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{review.manager_comments}</p>
            </div>
          )}

          {review.employee_comments && (
            <div>
              <h4 className="font-semibold mb-2">Commentaires de l'employé</h4>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{review.employee_comments}</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t dark:bg-gray-900/30">
          <Button onClick={onClose} className="w-full">
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
