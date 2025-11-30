/**
 * Onglet Feedback - Feedback continu 360°
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Plus,
  Search,
  ThumbsUp,
  AlertCircle,
  Lightbulb,
  Award,
  Heart
} from 'lucide-react';
import { hrPerformanceService } from '@/services/hrPerformanceService';
import { FeedbackFormModal } from './FeedbackFormModal';
import type { Feedback } from '@/types/hr-performance.types';

interface FeedbackTabProps {
  companyId: string;
  employees: Array<{ id: string; first_name: string; last_name: string }>;
  currentUserId: string;
}

export function FeedbackTab({ companyId, employees, currentUserId }: FeedbackTabProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadFeedbacks();
  }, [companyId]);

  const loadFeedbacks = async () => {
    setLoading(true);
    const response = await hrPerformanceService.getFeedback(companyId);
    if (response.success && response.data) {
      setFeedbacks(response.data);
    }
    setLoading(false);
  };

  const handleCreateFeedback = async (formData: any) => {
    const response = await hrPerformanceService.createFeedback(companyId, formData);
    if (response.success) {
      await loadFeedbacks();
      setShowModal(false);
      return true;
    }
    return false;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'praise':
        return <ThumbsUp className="w-4 h-4 text-green-600" />;
      case 'constructive':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'suggestion':
        return <Lightbulb className="w-4 h-4 text-yellow-600" />;
      case 'recognition':
        return <Award className="w-4 h-4 text-purple-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      praise: 'Éloge',
      constructive: 'Constructif',
      suggestion: 'Suggestion',
      concern: 'Préoccupation',
      recognition: 'Reconnaissance',
      request: 'Demande'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'praise':
      case 'recognition':
        return 'bg-green-100 text-green-800';
      case 'constructive':
      case 'concern':
        return 'bg-orange-100 text-orange-800';
      case 'suggestion':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredFeedbacks = feedbacks.filter(fb => {
    const matchesSearch =
      fb.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fb.from_employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fb.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || fb.feedback_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: feedbacks.length,
    praise: feedbacks.filter(f => f.feedback_type === 'praise').length,
    constructive: feedbacks.filter(f => f.feedback_type === 'constructive').length,
    recognition: feedbacks.filter(f => f.feedback_type === 'recognition').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Chargement du feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Total</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.praise}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Éloges</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.constructive}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Constructifs</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.recognition}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Reconnaissances</p>
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
                placeholder="Rechercher..."
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
              <option value="praise">Éloge</option>
              <option value="constructive">Constructif</option>
              <option value="suggestion">Suggestion</option>
              <option value="concern">Préoccupation</option>
              <option value="recognition">Reconnaissance</option>
              <option value="request">Demande</option>
            </select>

            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau feedback
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des feedbacks */}
      <div className="grid grid-cols-1 gap-4">
        {filteredFeedbacks.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Aucun feedback trouvé
                </h3>
                <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-4">
                  {searchTerm || typeFilter !== 'all'
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Commencez par donner votre premier feedback'}
                </p>
                {!searchTerm && typeFilter === 'all' && (
                  <Button onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Donner un feedback
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredFeedbacks.map((feedback) => (
            <Card key={feedback.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${getTypeColor(feedback.feedback_type)} flex items-center gap-1`}>
                        {getTypeIcon(feedback.feedback_type)}
                        {getTypeLabel(feedback.feedback_type)}
                      </Badge>
                      {feedback.is_anonymous && (
                        <Badge variant="outline" className="text-xs">
                          Anonyme
                        </Badge>
                      )}
                      {feedback.is_private && (
                        <Badge variant="outline" className="text-xs">
                          Privé
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">
                      Pour: {feedback.employee_name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
                      De: {feedback.is_anonymous ? 'Anonyme' : feedback.from_employee_name}
                      {' • '}
                      {new Date(feedback.feedback_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{feedback.content}</p>
                </div>

                {feedback.response && (
                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="text-sm font-semibold text-blue-700 mb-1">Réponse:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{feedback.response}</p>
                    {feedback.response_date && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(feedback.response_date).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <FeedbackFormModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateFeedback}
          employees={employees}
        />
      )}
    </div>
  );
}
