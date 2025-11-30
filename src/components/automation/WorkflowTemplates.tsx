import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAutomation } from '@/hooks/useAutomation';
import {
  FileText,
  Mail,
  Bell,
  Calendar,
  Zap,
  Plus,
  Clock,
  BarChart3,
  DollarSign,
  Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export function WorkflowTemplates() {
  const { templates, templatesLoading, createFromTemplate } = useAutomation();

  const handleUseTemplate = async (templateId: string) => {
    const success = await createFromTemplate(templateId);
    if (success) {
      toast.success('Workflow créé à partir du modèle');
    } else {
      toast.error('Erreur lors de la création du workflow');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'comptabilité':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'facturation':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'ressources humaines':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'inventaire':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getActionIcons = (actions: any[]) => {
    return actions.map((action, index) => {
      switch (action.type) {
        case 'send_email':
          return <Mail key={index} className="h-4 w-4 text-blue-600" />;
        case 'generate_report':
          return <FileText key={index} className="h-4 w-4 text-green-600" />;
        case 'notification':
          return <Bell key={index} className="h-4 w-4 text-yellow-600" />;
        default:
          return <Zap key={index} className="h-4 w-4 text-gray-600 dark:text-gray-400 dark:text-gray-500" />;
      }
    });
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Quotidien';
      case 'weekly': return 'Hebdomadaire';
      case 'monthly': return 'Mensuel';
      case 'yearly': return 'Annuel';
      default: return frequency;
    }
  };

  if (templatesLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">Chargement des modèles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Modèles de Workflows</h2>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
            Utilisez ces modèles préconfigurés pour créer rapidement vos workflows
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.template_name}</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400 dark:text-gray-500 mt-1">
                    {template.description}
                  </p>
                </div>
                <Badge className={getCategoryColor(template.category)} variant="secondary">
                  {template.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Details */}
              <div className="space-y-3">
                {/* Trigger Info */}
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    Déclencheur: {getFrequencyText(template.workflow_definition?.trigger_config?.frequency || '')}
                    {template.workflow_definition?.trigger_config?.time &&
                      ` à ${template.workflow_definition.trigger_config.time}`
                    }
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 text-sm">
                  <div className="flex items-center space-x-1">
                    {getActionIcons(template.workflow_definition?.actions || [])}
                  </div>
                  <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    {(template.workflow_definition?.actions?.length || 0)} action{(template.workflow_definition?.actions?.length || 0) > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Action Details */}
                <div className="space-y-2">
                  {(template.workflow_definition?.actions || []).map((action, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">
                        {action.type === 'send_email' && 'Envoi d\'email automatique'}
                        {action.type === 'generate_report' && `Génération de rapport ${action.config.report_type || ''}`}
                        {action.type === 'notification' && 'Notification système'}
                        {action.type === 'update_record' && 'Mise à jour de données'}
                        {action.type === 'create_invoice' && 'Création de facture'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Use Template Button */}
              <Button
                onClick={() => handleUseTemplate(template.id)}
                className="w-full"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Utiliser ce modèle
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Modèles Personnalisés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Créez vos propres modèles</h3>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 dark:text-gray-500 mb-4">
              Sauvegardez vos workflows favoris comme modèles pour les réutiliser facilement
            </p>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Créer un modèle personnalisé
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Popular Use Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Cas d'usage populaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Comptabilité & Finance
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
                <li>• Rapports financiers mensuels automatiques</li>
                <li>• Rappels de clôture comptable</li>
                <li>• Notifications de seuils budgétaires</li>
                <li>• Sauvegarde automatique des données</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Facturation & Ventes
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
                <li>• Rappels de factures impayées</li>
                <li>• Génération automatique de factures</li>
                <li>• Notifications de nouveaux paiements</li>
                <li>• Relances clients automatiques</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Ressources Humaines
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
                <li>• Rappels d'évaluation d'employés</li>
                <li>• Notifications d'anniversaires</li>
                <li>• Rapports de temps de travail</li>
                <li>• Onboarding automatique</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Bell className="h-5 w-5 text-yellow-600" />
                Notifications & Alertes
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
                <li>• Alertes de stock faible</li>
                <li>• Notifications de maintenance</li>
                <li>• Rappels de rendez-vous</li>
                <li>• Alertes de sécurité</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
