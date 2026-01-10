import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAutomation } from '@/hooks/useAutomation';
import {
  FileText,
  Mail,
  Bell,
  Zap,
  Plus,
  Clock,
  BarChart3,
  DollarSign,
  Users,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface WorkflowTemplatesProps {
  onCreateCustomTemplate?: () => void;
}

export function WorkflowTemplates({ onCreateCustomTemplate }: WorkflowTemplatesProps) {
  const { templates, templatesLoading, createFromTemplate } = useAutomation();

  const handleUseTemplate = async (templateId: string) => {
    const success = await createFromTemplate(templateId);
    if (success) {
      toast.success('Workflow créé à partir du modèle avec succès!');
    } else {
      toast.error('Erreur lors de la création du workflow');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'comptabilité':
      case 'finance':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'facturation':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'ressources humaines':
      case 'rh':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'inventaire':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'sécurité':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
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
          return <Zap key={index} className="h-4 w-4 text-gray-600 dark:text-gray-300" />;
      }
    });
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Quotidien';
      case 'weekly': return 'Hebdomadaire';
      case 'monthly': return 'Mensuel';
      case 'yearly': return 'Annuel';
      default: return frequency || 'Manuel';
    }
  };

  if (templatesLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des modèles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            Modèles de Workflows
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Utilisez ces modèles préconfigurés pour créer rapidement vos workflows d'automation
          </p>
        </div>
        <Button 
          onClick={onCreateCustomTemplate}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer un Workflow
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.template_name}</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
                  <Clock className="h-4 w-4 text-gray-500 dark:text-gray-300" />
                  <span className="text-gray-600 dark:text-gray-300">
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
                  <span className="text-gray-600 dark:text-gray-300">
                    {(template.workflow_definition?.actions?.length || 0)} action{(template.workflow_definition?.actions?.length || 0) > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Action Details */}
                <div className="space-y-2">
                  {(template.workflow_definition?.actions || []).map((action: any, index: number) => (
                    <div key={index} className="flex items-center space-x-2 text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {action.type === 'send_email' && 'Envoi d\'email automatique'}
                        {action.type === 'generate_report' && `Génération de rapport ${action.config.report_type || ''}`}
                        {action.type === 'notification' && 'Notification système'}
                        {action.type === 'update_record' && 'Mise à jour de données'}
                        {action.type === 'create_invoice' && 'Création de facture'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Usage Count */}
                {template.usage_count > 0 && (
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <TrendingUp className="h-3 w-3" />
                    <span>Utilisé {template.usage_count} fois</span>
                  </div>
                )}
              </div>

              {/* Use Template Button */}
              <Button
                onClick={() => handleUseTemplate(template.id)}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Utiliser ce modèle
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Templates Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Créer un Workflow Personnalisé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Créez vos propres workflows</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
              Configurez des workflows sur mesure adaptés à vos besoins spécifiques avec notre constructeur visuel
            </p>
            <Button 
              onClick={onCreateCustomTemplate}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Créer un Workflow Personnalisé
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Popular Use Cases */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Cas d'usage populaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Comptabilité & Finance
              </h4>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Rapports financiers mensuels automatiques</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Rappels de clôture comptable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Notifications de seuils budgétaires</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Sauvegarde automatique des données</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
                Facturation & Ventes
              </h4>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>Rappels de factures impayées</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>Génération automatique de factures</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>Notifications de nouveaux paiements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>Relances clients automatiques</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-purple-600" />
                Ressources Humaines
              </h4>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Rappels d'évaluation d'employés</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Notifications d'anniversaires</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Rapports de temps de travail</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Onboarding automatique</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-yellow-600" />
                Notifications & Alertes
              </h4>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>Alertes de stock faible</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>Notifications de maintenance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>Rappels de rendez-vous</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>Alertes de sécurité</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
