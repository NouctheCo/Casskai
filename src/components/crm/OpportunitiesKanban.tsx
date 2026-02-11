import React, { useState } from 'react';
import { Opportunity, OpportunityFormData, Client, Contact } from '../../types/crm.types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { NewOpportunityModal } from './NewOpportunityModal';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  User, 
  Building,
  TrendingUp,
  AlertCircle,
  Target,
  CheckCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import { getCurrentCompanyCurrency } from '@/lib/utils';
interface OpportunitiesKanbanProps {
  opportunities: Opportunity[];
  clients?: Client[];
  contacts?: Contact[];
  loading?: boolean;
  onCreateOpportunity?: (data: OpportunityFormData) => Promise<boolean>;
  onUpdateOpportunity?: (id: string, data: Partial<OpportunityFormData>) => Promise<boolean>;
  onDeleteOpportunity?: (id: string) => Promise<boolean>;
}
const OpportunitiesKanban: React.FC<OpportunitiesKanbanProps> = ({
  opportunities,
  clients,
  contacts,
  loading,
  onCreateOpportunity,
  onUpdateOpportunity,
  onDeleteOpportunity
}) => {
  const { t } = useTranslation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [_selectedStage, setSelectedStage] = useState<string>('');

  const stages = [
    { key: 'prospecting', label: t('crm.stages.prospecting'), color: 'bg-blue-500' },
    { key: 'qualification', label: t('crm.stages.qualification'), color: 'bg-yellow-500' },
    { key: 'proposal', label: t('crm.stages.proposal'), color: 'bg-purple-500' },
    { key: 'negotiation', label: t('crm.stages.negotiation'), color: 'bg-orange-500' },
    { key: 'closing', label: t('crm.stages.closing'), color: 'bg-emerald-500' },
    { key: 'won', label: t('crm.stages.won'), color: 'bg-green-600' },
    { key: 'lost', label: t('crm.stages.lost'), color: 'bg-red-600' }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: getCurrentCompanyCurrency()
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStageBackgroundColor = (stageKey: string) => {
    const backgrounds = {
      'prospecting': 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500',
      'qualification': 'bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500',
      'proposal': 'bg-purple-50 dark:bg-purple-950/20 border-l-4 border-purple-500',
      'negotiation': 'bg-orange-50 dark:bg-orange-950/20 border-l-4 border-orange-500',
      'closing': 'bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500',
      'won': 'bg-green-50 dark:bg-green-950/20 border-l-4 border-green-600',
      'lost': 'bg-red-50 dark:bg-red-950/20 border-l-4 border-red-600'
    };
    return backgrounds[stageKey as keyof typeof backgrounds] || 'bg-gray-50 dark:bg-gray-950/20 border-l-4 border-gray-300';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-3 h-3" />;
      case 'medium':
        return <Target className="w-3 h-3" />;
      case 'low':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return <Target className="w-3 h-3" />;
    }
  };

  const getOpportunitiesByStage = (stage: string) => {
    return opportunities.filter(opp => opp.stage === stage);
  };

  const getStageStats = (stage: string) => {
    const stageOpps = getOpportunitiesByStage(stage);
    const totalValue = stageOpps.reduce((sum, opp) => sum + opp.value, 0);
    return {
      count: stageOpps.length,
      value: totalValue
    };
  };

  const handleCreateOpportunity = (stage?: string) => {
    setEditingOpportunity(null);
    setSelectedStage(stage || 'prospecting');
    setIsFormOpen(true);
  };

  const handleEditOpportunity = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
    setIsFormOpen(true);
  };

  const handleStageChange = async (opportunityId: string, newStage: string) => {
    try {
      await onUpdateOpportunity?.(opportunityId, { stage: newStage as any });
    } catch (error) {
      logger.error('OpportunitiesKanban', 'Error updating opportunity stage:', error instanceof Error ? error.message : String(error));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {stages.map((stage) => (
          <Card key={stage.key} className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${stage.color}`} />
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="flex gap-3 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-80 h-40 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            {t('crm.opportunities.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('crm.opportunities.description')}</p>
        </div>
        <Button onClick={() => handleCreateOpportunity()}>
          <Plus className="w-4 h-4 mr-2" />
          {t('crm.opportunities.create')}
        </Button>
      </div>
      {/* Kanban Board - Horizontal Layout */}
      <div className="space-y-6">
        {stages.map((stage) => {
          const stageOpportunities = getOpportunitiesByStage(stage.key);
          const stageStats = getStageStats(stage.key);
          return (
            <Card key={stage.key} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${stage.color}`} />
                    <span className="text-sm font-medium">{stage.label}</span>
                    <Badge variant="outline" className="text-xs ml-2">
                      {stageStats.count} | {formatCurrency(stageStats.value)}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCreateOpportunity(stage.key)}
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {t('crm.opportunities.add')}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {stageOpportunities.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">Aucune opportunité</p>
                  </div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 snap-x snap-mandatory">
                    {stageOpportunities.map((opportunity) => (
                      <div
                        key={opportunity.id}
                        className={`flex-shrink-0 w-80 ${getStageBackgroundColor(opportunity.stage)} rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow snap-start`}
                      >
                        <div className="space-y-2">
                          {/* Title and Value */}
                          <div className="flex items-start justify-between">
                            <h4 className="text-sm font-medium line-clamp-2 flex-1">
                              {opportunity.title}
                            </h4>
                            <div className="ml-2 text-right flex-shrink-0">
                              <div className="text-sm font-bold text-green-600">
                                {formatCurrency(opportunity.value)}
                              </div>
                            </div>
                          </div>

                          {/* Client */}
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <Building className="w-3 h-3" />
                            <span className="truncate">{opportunity.client_name}</span>
                          </div>

                          {/* Contact */}
                          {opportunity.contact_name && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                              <User className="w-3 h-3" />
                              <span className="truncate">{opportunity.contact_name}</span>
                            </div>
                          )}

                          {/* Dates */}
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              <span>Crue le: {formatDate(opportunity.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              <span>Cloture: {formatDate(opportunity.expected_close_date)}</span>
                            </div>
                          </div>

                          {/* Priority & Probability */}
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="outline" className={`text-xs ${getPriorityColor(opportunity.priority)}`}>
                              {getPriorityIcon(opportunity.priority)}
                              <span className="ml-1">{t(`crm.priority.${opportunity.priority}`)}</span>
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {opportunity.probability}%
                            </Badge>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditOpportunity(opportunity)}
                                className="text-blue-600 hover:text-blue-700 p-1 dark:text-blue-400 h-auto"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteOpportunity?.(opportunity.id)}
                                className="text-red-600 hover:text-red-700 p-1 dark:text-red-400 h-auto"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            <Select
                              value={opportunity.stage}
                              onValueChange={(value) => handleStageChange(opportunity.id, value)}
                            >
                              <SelectTrigger className="w-20 h-6 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {stages.map((s) => (
                                  <SelectItem key={s.key} value={s.key} className="text-xs">
                                    {s.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Opportunity Form Modal */}
      <NewOpportunityModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        clients={clients || []}
        contacts={contacts || []}
        onCreateOpportunity={onCreateOpportunity || (async () => false)}
        onUpdateOpportunity={onUpdateOpportunity}
        editingOpportunity={editingOpportunity}
        onSuccess={() => {
          setEditingOpportunity(null);
        }}
      />
    </div>
  );
};
export default OpportunitiesKanban;