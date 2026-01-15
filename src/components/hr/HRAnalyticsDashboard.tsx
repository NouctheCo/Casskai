/**
 * Dashboard Analytics RH - KPIs et statistiques
 */

import { useState, useEffect } from 'react';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  DollarSign,
  Calendar,
  Target,
  Award,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Clock,
  Percent
} from 'lucide-react';
import { hrPerformanceService } from '@/services/hrPerformanceService';
import { hrTrainingService } from '@/services/hrTrainingService';

interface HRAnalyticsDashboardProps {
  companyId: string;
  employees: Array<{ id: string; salary?: number; hire_date?: string }>;
}

export function HRAnalyticsDashboard({ companyId, employees }: HRAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    objectives: { total: 0, completed: 0, at_risk: 0, avg_progress: 0 },
    reviews: { total: 0, avg_rating: 0 },
    feedback: { total: 0, praise: 0, constructive: 0 },
    training: {
      total_trainings: 0,
      total_sessions: 0,
      total_enrollments: 0,
      completion_rate: 0,
      active_certifications: 0,
      total_cost: 0
    }
  });

  useEffect(() => {
    loadAnalytics();
  }, [companyId]);

  const loadAnalytics = async () => {
    setLoading(true);

    // Charger toutes les données en parallèle
    const [objectivesRes, reviewsRes, feedbackRes, trainingStatsRes] = await Promise.all([
      hrPerformanceService.getObjectives(companyId),
      hrPerformanceService.getReviews(companyId),
      hrPerformanceService.getFeedback(companyId),
      hrTrainingService.getTrainingStats(companyId)
    ]);

    // Calculer les stats des objectifs
    let objectivesStats = { total: 0, completed: 0, at_risk: 0, avg_progress: 0 };
    if (objectivesRes.success && objectivesRes.data) {
      const objs = objectivesRes.data;
      objectivesStats = {
        total: objs.length,
        completed: objs.filter(o => o.status === 'completed').length,
        at_risk: objs.filter(o => o.status === 'at_risk').length,
        avg_progress: objs.length > 0
          ? Math.round(objs.reduce((sum, o) => sum + o.progress_percentage, 0) / objs.length)
          : 0
      };
    }

    // Calculer les stats des reviews
    let reviewsStats = { total: 0, avg_rating: 0 };
    if (reviewsRes.success && reviewsRes.data) {
      const reviews = reviewsRes.data;
      reviewsStats = {
        total: reviews.length,
        avg_rating: reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / reviews.length
          : 0
      };
    }

    // Calculer les stats du feedback
    let feedbackStats = { total: 0, praise: 0, constructive: 0 };
    if (feedbackRes.success && feedbackRes.data) {
      const feedbacks = feedbackRes.data;
      feedbackStats = {
        total: feedbacks.length,
        praise: feedbacks.filter(f => f.feedback_type === 'praise').length,
        constructive: feedbacks.filter(f => f.feedback_type === 'constructive').length
      };
    }

    // Stats de formation
    let trainingStats = {
      total_trainings: 0,
      total_sessions: 0,
      total_enrollments: 0,
      completion_rate: 0,
      active_certifications: 0,
      total_cost: 0
    };
    if (trainingStatsRes.success && trainingStatsRes.data) {
      trainingStats = trainingStatsRes.data;
    }

    setStats({
      objectives: objectivesStats,
      reviews: reviewsStats,
      feedback: feedbackStats,
      training: trainingStats
    });

    setLoading(false);
  };

  // Calculer les KPIs RH
  const totalEmployees = employees.length;
  const avgSalary = employees.length > 0
    ? employees.reduce((sum, e) => sum + (e.salary || 0), 0) / employees.length
    : 0;

  // Calculer le turnover (exemple simplifié)
  const currentYear = new Date().getFullYear();
  const hiredThisYear = employees.filter(e =>
    e.hire_date && new Date(e.hire_date).getFullYear() === currentYear
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Dashboard Analytics RH</h2>
        <p className="text-blue-100">
          Vue d'ensemble des KPIs et performances de vos équipes
        </p>
      </div>

      {/* KPIs Généraux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Effectif Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{totalEmployees}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {hiredThisYear} recrutés cette année
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Salaire Moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {Math.round(avgSalary).toLocaleString('fr-FR')} €
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Masse salariale: {Math.round(avgSalary * totalEmployees).toLocaleString('fr-FR')} €
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Objectifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{stats.objectives.total}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.objectives.completed} complétés • {stats.objectives.at_risk} à risque
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Note Moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.reviews.avg_rating.toFixed(1)}/5
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.reviews.total} évaluations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Objectifs & Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Objectifs & Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Progression moyenne</span>
                <span className="font-semibold text-purple-600">
                  {stats.objectives.avg_progress}%
                </span>
              </div>
              <Progress value={stats.objectives.avg_progress} className="h-3" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 p-3 rounded-lg text-center dark:bg-green-900/20">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-600">{stats.objectives.completed}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Complétés</p>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-center dark:bg-blue-900/20">
                <Clock className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-blue-600">
                  {stats.objectives.total - stats.objectives.completed - stats.objectives.at_risk}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">En cours</p>
              </div>

              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <AlertCircle className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-orange-600">{stats.objectives.at_risk}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">À risque</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Taux de réussite</p>
              <div className="flex items-center gap-2">
                <Progress
                  value={stats.objectives.total > 0
                    ? (stats.objectives.completed / stats.objectives.total) * 100
                    : 0}
                  className="flex-1 h-2"
                />
                <span className="text-sm font-semibold">
                  {stats.objectives.total > 0
                    ? Math.round((stats.objectives.completed / stats.objectives.total) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback & Engagement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              Feedback & Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg text-center dark:bg-blue-900/20">
                <p className="text-2xl font-bold text-blue-600">{stats.feedback.total}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
              </div>

              <div className="bg-green-50 p-3 rounded-lg text-center dark:bg-green-900/20">
                <p className="text-2xl font-bold text-green-600">{stats.feedback.praise}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Éloges</p>
              </div>

              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.feedback.constructive}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Constructifs</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Feedback positif</span>
                  <span className="font-semibold text-green-600">
                    {stats.feedback.total > 0
                      ? Math.round((stats.feedback.praise / stats.feedback.total) * 100)
                      : 0}%
                  </span>
                </div>
                <Progress
                  value={stats.feedback.total > 0
                    ? (stats.feedback.praise / stats.feedback.total) * 100
                    : 0}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Feedback constructif</span>
                  <span className="font-semibold text-orange-600">
                    {stats.feedback.total > 0
                      ? Math.round((stats.feedback.constructive / stats.feedback.total) * 100)
                      : 0}%
                  </span>
                </div>
                <Progress
                  value={stats.feedback.total > 0
                    ? (stats.feedback.constructive / stats.feedback.total) * 100
                    : 0}
                  className="h-2"
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Moyenne par employé</span>
                <span className="text-lg font-bold text-blue-600">
                  {totalEmployees > 0 ? (stats.feedback.total / totalEmployees).toFixed(1) : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formation & Développement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Formation & Développement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center dark:bg-blue-900/20">
              <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{stats.training.total_trainings}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Formations</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{stats.training.total_sessions}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sessions</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg text-center dark:bg-green-900/20">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{stats.training.total_enrollments}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Inscriptions</p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <Percent className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{stats.training.completion_rate}%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taux complétion</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <Award className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">{stats.training.active_certifications}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Certifications</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Investissement formation</p>
                <p className="text-2xl font-bold text-green-600">
                  <CurrencyAmount amount={stats.training.total_cost} />
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Par employé</p>
                <p className="text-xl font-bold text-blue-600">
                  {totalEmployees > 0
                    ? Math.round(stats.training.total_cost / totalEmployees).toLocaleString('fr-FR')
                    : 0} €
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Évaluations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Évaluations de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.reviews.total}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Évaluations</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    className={`text-xl ${
                      i < Math.round(stats.reviews.avg_rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Note moyenne</p>
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {totalEmployees > 0 ? Math.round((stats.reviews.total / totalEmployees) * 100) : 0}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Couverture</p>
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {totalEmployees > 0 ? (stats.reviews.total / totalEmployees).toFixed(1) : 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Par employé</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

