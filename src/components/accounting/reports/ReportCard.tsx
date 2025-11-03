// Report Card Component - Extracted from OptimizedReportsTab
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { Eye, Download, Clock, Zap } from 'lucide-react';

interface ReportCardProps {
  type: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  category: string;
  frequency: string;
  compliance: string;
  estimatedTime: string;
  isGenerating: boolean;
  onGenerate: () => void;
  userCanGenerate: boolean;
}

export function ReportCard({
  type,
  name,
  description,
  icon: Icon,
  color,
  category,
  frequency,
  compliance,
  estimatedTime,
  isGenerating,
  onGenerate,
  userCanGenerate
}: ReportCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    indigo: 'bg-indigo-500',
    cyan: 'bg-cyan-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    pink: 'bg-pink-500',
    teal: 'bg-teal-500'
  };

  const bgColor = colorClasses[color as keyof typeof colorClasses] || 'bg-gray-500';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bgColor} text-white`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Catégorie</span>
            <Badge variant="secondary">{category}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Fréquence</span>
            <span className="font-medium">{frequency}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Conformité</span>
            <span className="font-medium">{compliance}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Temps: {estimatedTime}</span>
          </div>
          
          <div className="pt-2 flex gap-2">
            <Button
              onClick={onGenerate}
              disabled={!userCanGenerate || isGenerating}
              className="flex-1"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Zap className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Générer
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
