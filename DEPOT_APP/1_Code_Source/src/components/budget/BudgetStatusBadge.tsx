// Badge de statut pour les budgets
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Edit, Clock, CheckCircle, Target, Archive } from 'lucide-react';
import type { BudgetStatus } from '@/types/budget.types';

interface BudgetStatusBadgeProps {
  status: BudgetStatus;
  className?: string;
}

export const BudgetStatusBadge: React.FC<BudgetStatusBadgeProps> = ({ status, className = '' }) => {
  const statusConfig = {
    draft: {
      label: 'Brouillon',
      icon: Edit,
      className: 'bg-gray-100 text-gray-800 border-gray-200'
    },
    under_review: {
      label: 'En révision',
      icon: Clock,
      className: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    approved: {
      label: 'Approuvé',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    active: {
      label: 'Actif',
      icon: Target,
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    archived: {
      label: 'Archivé',
      icon: Archive,
      className: 'bg-gray-100 text-gray-500 border-gray-200'
    }
  };

  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} ${className}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};
