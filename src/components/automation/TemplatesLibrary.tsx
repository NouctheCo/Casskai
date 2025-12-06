import { Sparkles, Clock, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { createWorkflowFromTemplate } from '@/services/automationService';
import type { WorkflowTemplate } from '@/types/automation.types';

interface TemplatesLibraryProps {
  templates: WorkflowTemplate[];
  onTemplateActivated: () => void;
}

export default function TemplatesLibrary({ templates, onTemplateActivated }: TemplatesLibraryProps) {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const { user, currentCompany } = useAuth();

  const handleActivate = async (template: WorkflowTemplate) => {
    if (!currentCompany?.id || !user?.id) return;

    try {
      await createWorkflowFromTemplate(
        template.id,
        currentCompany.id,
        user.id
      );
      showToast(`Workflow "${template.name}" créé avec succès`, 'success');
      onTemplateActivated();
    } catch (_error) {
      showToast(t('automation.errors.creatingWorkflow'), 'error');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'finance':
        return '💰';
      case 'hr':
        return '👥';
      case 'crm':
        return '📈';
      default:
        return '⚡';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      finance: 'Finance',
      hr: 'Ressources Humaines',
      crm: 'Commercial',
      inventory: 'Stock',
      general: 'Général'
    };
    return labels[category] || category;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
          <div className="space-y-4">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <span className="text-3xl">{template.icon || getCategoryIcon(template.category)}</span>
                {template.popularity && template.popularity > 80 && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Populaire
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {getCategoryLabel(template.category)}
              </Badge>
              {template.time_saved_hours && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{template.time_saved_hours}h/semaine</span>
                </div>
              )}
            </div>

            {/* Actions détaillées */}
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground mb-2">
                {template.actions.length} action(s) automatisées
              </p>
              <div className="space-y-1">
                {template.actions.slice(0, 3).map((action, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{action.name || action.type}</span>
                  </div>
                ))}
                {template.actions.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{template.actions.length - 3} autre(s)
                  </p>
                )}
              </div>
            </div>

            {/* CTA */}
            <Button
              className="w-full"
              onClick={() => handleActivate(template)}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Activer ce workflow
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
