import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { crmService } from '@/services/crmService';
import type { Opportunity, OpportunityStage } from '@/types/crm.types';
import {
  Euro,
  Calendar,
  User,
  Plus,
  Target,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';
import { OpportunityCard } from './OpportunityCard';

interface OpportunityPipelineProps {
  enterpriseId: string;
  onCreateOpportunity: () => void;
}

const PIPELINE_STAGES: { 
  id: OpportunityStage; 
  label: string; 
  color: string; 
  bgColor: string; 
}[] = [
  { id: 'prospecting', label: 'Prospection', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  { id: 'qualification', label: 'Qualification', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { id: 'proposal', label: 'Proposition', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { id: 'negotiation', label: 'Négociation', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { id: 'closing', label: 'Finalisation', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { id: 'won', label: 'Gagné', color: 'text-green-600', bgColor: 'bg-green-100' },
  { id: 'lost', label: 'Perdu', color: 'text-red-600', bgColor: 'bg-red-100' },
];

export const OpportunityPipeline: React.FC<OpportunityPipelineProps> = ({
  enterpriseId,
  onCreateOpportunity,
}) => {
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedOpportunity, setDraggedOpportunity] = useState<Opportunity | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Charger les opportunités
  useEffect(() => {
    loadOpportunities();
  }, [enterpriseId]);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const response = await crmService.getOpportunities(enterpriseId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      setOpportunities(response.data);
    } catch (error) {
      console.error('Error loading opportunities:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les opportunités",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Grouper les opportunités par étape
  const opportunitiesByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.id] = opportunities.filter(opp => opp.stage === stage.id);
    return acc;
  }, {} as Record<OpportunityStage, Opportunity[]>);

  // Calculer les statistiques pour chaque étape
  const getStageStats = (stageId: OpportunityStage) => {
    const stageOpportunities = opportunitiesByStage[stageId] || [];
    const totalValue = stageOpportunities.reduce((sum, opp) => sum + opp.value, 0);
    const count = stageOpportunities.length;
    return { count, totalValue };
  };

  // Gestion du drag start
  const handleDragStart = (event: DragStartEvent) => {
    const opportunity = opportunities.find(opp => opp.id === event.active.id);
    setDraggedOpportunity(opportunity || null);
  };

  // Gestion du drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedOpportunity(null);

    if (!over) return;

    const opportunityId = active.id as string;
    const newStage = over.id as OpportunityStage;
    
    const opportunity = opportunities.find(opp => opp.id === opportunityId);
    if (!opportunity || opportunity.stage === newStage) return;

    try {
      // Optimistic update
      setOpportunities(prev => 
        prev.map(opp => 
          opp.id === opportunityId 
            ? { ...opp, stage: newStage, updated_at: new Date().toISOString() }
            : opp
        )
      );

      // Update in service
      const response = await crmService.updateOpportunity(opportunityId, { stage: newStage });
      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Opportunité mise à jour",
        description: `Déplacée vers "${PIPELINE_STAGES.find(s => s.id === newStage)?.label}"`,
      });

    } catch (error) {
      console.error('Error updating opportunity:', error);
      // Revert optimistic update
      await loadOpportunities();
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'opportunité",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Chargement du pipeline...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pipeline des Ventes</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Glissez-déposez les opportunités entre les étapes
          </p>
        </div>
        <Button onClick={onCreateOpportunity} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle opportunité
        </Button>
      </div>

      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total opportunités
                </p>
                <p className="text-2xl font-bold">{opportunities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Euro className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Valeur totale
                </p>
                <p className="text-xl font-bold">
                  {opportunities.reduce((sum, opp) => sum + opp.value, 0).toLocaleString()} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Taux de conversion
                </p>
                <p className="text-xl font-bold">
                  {opportunities.length > 0 
                    ? Math.round((getStageStats('won').count / opportunities.length) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  En cours
                </p>
                <p className="text-2xl font-bold">
                  {opportunities.filter(opp => !['won', 'lost'].includes(opp.stage)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 min-h-[600px]">
          {PIPELINE_STAGES.map((stage) => {
            const stageOpportunities = opportunitiesByStage[stage.id] || [];
            const stats = getStageStats(stage.id);

            return (
              <motion.div
                key={stage.id}
                className="flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Stage Header */}
                <Card className="mb-4">
                  <CardHeader 
                    className={`p-3 ${stage.bgColor} droppable-area`}
                    id={stage.id}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-sm font-medium ${stage.color}`}>
                        {stage.label}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {stats.count}
                      </Badge>
                    </div>
                    {stats.totalValue > 0 && (
                      <p className={`text-xs ${stage.color} opacity-80`}>
                        {stats.totalValue.toLocaleString()} €
                      </p>
                    )}
                  </CardHeader>
                </Card>

                {/* Droppable Area */}
                <SortableContext 
                  items={stageOpportunities.map(opp => opp.id)}
                  strategy={verticalListSortingStrategy}
                  id={stage.id}
                >
                  <div 
                    className="flex-1 min-h-[400px] p-2 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30"
                    data-stage={stage.id}
                  >
                    <AnimatePresence>
                      {stageOpportunities.map((opportunity) => (
                        <OpportunityCard
                          key={opportunity.id}
                          opportunity={opportunity}
                          isDragging={draggedOpportunity?.id === opportunity.id}
                        />
                      ))}
                    </AnimatePresence>

                    {stageOpportunities.length === 0 && (
                      <div className="flex items-center justify-center h-32 text-gray-400">
                        <div className="text-center">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Aucune opportunité</p>
                        </div>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </motion.div>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
};

export default OpportunityPipeline;