/**
 * Onglet Formations - Catalogue, sessions, inscriptions, certifications
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GraduationCap,
  Plus,
  Search,
  Calendar,
  Users,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { hrTrainingService } from '@/services/hrTrainingService';
import type { TrainingCatalog, TrainingSession, TrainingEnrollment, Certification } from '@/types/hr-training.types';

interface TrainingTabProps {
  companyId: string;
  employees: Array<{ id: string; first_name: string; last_name: string }>;
  currentUserId: string;
}

export function TrainingTab({ companyId, employees, currentUserId }: TrainingTabProps) {
  const [trainings, setTrainings] = useState<TrainingCatalog[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('catalog');

  useEffect(() => {
    loadAllData();
  }, [companyId]);

  const loadAllData = async () => {
    setLoading(true);
    const [trainingsRes, sessionsRes, enrollmentsRes, certificationsRes] = await Promise.all([
      hrTrainingService.getTrainingCatalog(companyId),
      hrTrainingService.getSessions(companyId),
      hrTrainingService.getEnrollments(companyId),
      hrTrainingService.getCertifications(companyId)
    ]);

    if (trainingsRes.success && trainingsRes.data) setTrainings(trainingsRes.data);
    if (sessionsRes.success && sessionsRes.data) setSessions(sessionsRes.data);
    if (enrollmentsRes.success && enrollmentsRes.data) setEnrollments(enrollmentsRes.data);
    if (certificationsRes.success && certificationsRes.data) setCertifications(certificationsRes.data);

    setLoading(false);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      technical: 'bg-blue-100 text-blue-800',
      soft_skills: 'bg-green-100 text-green-800',
      leadership: 'bg-purple-100 text-purple-800',
      compliance: 'bg-red-100 text-red-800',
      sales: 'bg-yellow-100 text-yellow-800',
      management: 'bg-indigo-100 text-indigo-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'registration_open':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTrainings = trainings.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSessions = sessions.filter(s =>
    s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCertifications = certifications.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.issuing_organization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const stats = {
    total_trainings: trainings.length,
    total_sessions: sessions.length,
    total_enrollments: enrollments.length,
    completion_rate: enrollments.length > 0
      ? Math.round((enrollments.filter(e => e.status === 'completed').length / enrollments.length) * 100)
      : 0,
    active_certifications: certifications.filter(c => {
      if (!c.expiry_date) return true;
      return new Date(c.expiry_date) > new Date();
    }).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des formations...</p>
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
              <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{stats.total_trainings}</p>
              <p className="text-sm text-gray-600">Formations</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{stats.total_sessions}</p>
              <p className="text-sm text-gray-600">Sessions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{stats.total_enrollments}</p>
              <p className="text-sm text-gray-600">Inscriptions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{stats.completion_rate}%</p>
              <p className="text-sm text-gray-600">Taux de complétion</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{stats.active_certifications}</p>
              <p className="text-sm text-gray-600">Certifications</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="catalog">Catalogue</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
        </TabsList>

        {/* Catalogue */}
        <TabsContent value="catalog" className="space-y-4">
          <div className="flex justify-end">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle formation
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTrainings.length === 0 ? (
              <Card className="col-span-2">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Aucune formation trouvée
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Commencez par ajouter des formations au catalogue
                    </p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une formation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredTrainings.map((training) => (
                <Card key={training.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getCategoryColor(training.category)}>
                            {training.category.replace('_', ' ')}
                          </Badge>
                          {training.is_mandatory && (
                            <Badge variant="destructive">Obligatoire</Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{training.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 mb-4">{training.description}</p>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{training.duration_hours}h</span>
                      </div>
                      {training.cost && (
                        <div className="text-sm font-semibold text-green-600">
                          {training.cost} {training.cost_currency}
                        </div>
                      )}
                    </div>

                    {training.prerequisites && (
                      <div className="text-xs text-gray-600 mb-2">
                        <span className="font-semibold">Prérequis: </span>
                        {training.prerequisites}
                      </div>
                    )}

                    <Button variant="outline" size="sm" className="w-full">
                      Planifier une session
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Sessions */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="flex justify-end">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle session
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredSessions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Aucune session trouvée
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Planifiez votre première session de formation
                    </p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Planifier une session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredSessions.map((session) => (
                <Card key={session.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(session.status)}>
                            {session.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{session.title || 'Session'}</CardTitle>
                        <p className="text-sm text-gray-600">
                          {new Date(session.start_date).toLocaleDateString('fr-FR')}
                          {session.end_date && ` - ${new Date(session.end_date).toLocaleDateString('fr-FR')}`}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {session.location && (
                      <p className="text-sm text-gray-700 mb-4">
                        📍 {session.location}
                      </p>
                    )}

                    {session.instructor_name && (
                      <p className="text-sm text-gray-700 mb-4">
                        👨‍🏫 Formateur: {session.instructor_name}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Inscrits</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {session.registered_count || 0}/{session.max_participants}
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Présents</p>
                        <p className="text-lg font-semibold text-green-600">
                          {session.attended_count || 0}
                        </p>
                      </div>
                    </div>

                    {session.max_participants && session.registered_count !== undefined && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Capacité</span>
                          <span className="font-semibold">
                            {Math.round((session.registered_count / session.max_participants) * 100)}%
                          </span>
                        </div>
                        <Progress
                          value={(session.registered_count / session.max_participants) * 100}
                          className="h-2"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Voir les inscrits
                      </Button>
                      <Button size="sm" className="flex-1">
                        Inscrire un employé
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Certifications */}
        <TabsContent value="certifications" className="space-y-4">
          <div className="flex justify-end">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle certification
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCertifications.length === 0 ? (
              <Card className="col-span-2">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Aucune certification trouvée
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Enregistrez les certifications des employés
                    </p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une certification
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredCertifications.map((cert) => {
                const isExpired = cert.expiry_date && new Date(cert.expiry_date) < new Date();
                const isExpiringSoon = cert.expiry_date &&
                  new Date(cert.expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

                return (
                  <Card key={cert.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {isExpired ? (
                              <Badge variant="destructive">Expirée</Badge>
                            ) : isExpiringSoon ? (
                              <Badge className="bg-orange-100 text-orange-800">
                                Expire bientôt
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg">{cert.name}</CardTitle>
                          <p className="text-sm text-gray-600">{cert.employee_name}</p>
                        </div>
                        <Award className="w-8 h-8 text-yellow-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {cert.issuing_organization && (
                        <p className="text-sm text-gray-700 mb-2">
                          Organisme: {cert.issuing_organization}
                        </p>
                      )}

                      {cert.credential_id && (
                        <p className="text-sm text-gray-700 mb-2">
                          ID: {cert.credential_id}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Obtenue: </span>
                          <span className="font-semibold">
                            {new Date(cert.issue_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {cert.expiry_date && (
                          <div>
                            <span className="text-gray-600">Expire: </span>
                            <span className={`font-semibold ${isExpired ? 'text-red-600' : ''}`}>
                              {new Date(cert.expiry_date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        )}
                      </div>

                      {cert.verification_url && (
                        <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                          Vérifier la certification →
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
