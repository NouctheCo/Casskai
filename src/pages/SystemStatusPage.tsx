import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Server,
  Database,
  Cloud,
  CheckCircle,
  AlertCircle,
  XCircle,
  Activity,
  Clock,
  Globe,
  Wifi
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublicNavigation } from '@/components/navigation/PublicNavigation';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  lastChecked: string;
  responseTime?: number;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  startTime: string;
  endTime?: string;
  updates: Array<{
    time: string;
    message: string;
  }>;
}

const SystemStatusPage: React.FC = () => {
  const { t } = useTranslation();
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [overallStatus, setOverallStatus] = useState<'operational' | 'degraded' | 'down'>('operational');

  useEffect(() => {
    // Simuler le chargement des statuts des services
    const mockServices: ServiceStatus[] = [
      {
        name: 'Application Web',
        status: 'operational',
        description: 'Interface utilisateur principale',
        icon: Globe,
        lastChecked: new Date().toLocaleString('fr-FR'),
        responseTime: 245
      },
      {
        name: 'API Backend',
        status: 'operational',
        description: 'Services API et authentification',
        icon: Server,
        lastChecked: new Date().toLocaleString('fr-FR'),
        responseTime: 89
      },
      {
        name: 'Base de données',
        status: 'operational',
        description: 'Stockage et récupération des données',
        icon: Database,
        lastChecked: new Date().toLocaleString('fr-FR'),
        responseTime: 12
      },
      {
        name: 'Services Cloud',
        status: 'operational',
        description: 'Infrastructure cloud et CDN',
        icon: Cloud,
        lastChecked: new Date().toLocaleString('fr-FR'),
        responseTime: 156
      },
      {
        name: 'Sécurité & SSL',
        status: 'operational',
        description: 'Certificats SSL et sécurité',
        icon: Shield,
        lastChecked: new Date().toLocaleString('fr-FR')
      }
    ];

    // Incidents récents (vide pour le moment)
    const mockIncidents: Incident[] = [];

    setServices(mockServices);
    setIncidents(mockIncidents);

    // Calculer le statut global
    const hasDownService = mockServices.some(s => s.status === 'down');
    const hasDegradedService = mockServices.some(s => s.status === 'degraded');

    if (hasDownService) {
      setOverallStatus('down');
    } else if (hasDegradedService) {
      setOverallStatus('degraded');
    } else {
      setOverallStatus('operational');
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'degraded': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'down': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'down': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational': return 'Opérationnel';
      case 'degraded': return 'Performance dégradée';
      case 'down': return 'Indisponible';
      default: return 'Inconnu';
    }
  };

  const getOverallStatusMessage = () => {
    switch (overallStatus) {
      case 'operational': return 'Tous les systèmes sont opérationnels';
      case 'degraded': return 'Certains services connaissent des performances dégradées';
      case 'down': return 'Un ou plusieurs services sont indisponibles';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <PublicNavigation variant="legal" />

      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* En-tête */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-6">
              <Activity className="w-12 h-12 text-blue-600 mr-3" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Statut du Système
              </h1>
            </div>

            {/* Statut global */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className={`inline-flex items-center px-6 py-3 rounded-full border-2 ${
                overallStatus === 'operational'
                  ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700'
                  : overallStatus === 'degraded'
                  ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700'
                  : 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-700'
              }`}
            >
              {getStatusIcon(overallStatus)}
              <span className={`ml-2 font-semibold ${
                overallStatus === 'operational' ? 'text-green-800 dark:text-green-200' :
                overallStatus === 'degraded' ? 'text-yellow-800 dark:text-yellow-200' :
                'text-red-800 dark:text-red-200'
              }`}>
                {getOverallStatusMessage()}
              </span>
            </motion.div>

            <p className="text-gray-600 dark:text-gray-400 mt-4 text-lg">
              Surveillance en temps réel de nos services CassKai
            </p>
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <Server className="w-6 h-6 mr-2 text-blue-600" />
              Services
            </h2>

            <div className="grid gap-4">
              {services.map((service, index) => {
                const IconComponent = service.icon;
                return (
                  <motion.div
                    key={service.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                              <IconComponent className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {service.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {service.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            {service.responseTime && (
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {service.responseTime}ms
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Temps de réponse
                                </div>
                              </div>
                            )}

                            <Badge className={getStatusColor(service.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(service.status)}
                                <span>{getStatusText(service.status)}</span>
                              </div>
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center mt-4 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3 mr-1" />
                          Dernière vérification: {service.lastChecked}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Incidents */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <AlertCircle className="w-6 h-6 mr-2 text-orange-600" />
              Incidents Récents
            </h2>

            {incidents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Aucun incident signalé
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Tous nos services fonctionnent normalement.
                    Les derniers incidents seront affichés ici.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <Card key={incident.id}>
                    <CardContent className="p-6">
                      {/* Contenu des incidents (si nécessaire plus tard) */}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>

          {/* Informations supplémentaires */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 text-center"
          >
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Besoin d'aide ?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Si vous rencontrez des problèmes non signalés sur cette page,
                  n'hésitez pas à nous contacter.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Badge variant="outline" className="px-4 py-2">
                    <Wifi className="w-4 h-4 mr-2" />
                    Mise à jour automatique
                  </Badge>
                  <Badge variant="outline" className="px-4 py-2">
                    <Clock className="w-4 h-4 mr-2" />
                    Vérification toutes les 2 minutes
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusPage;
