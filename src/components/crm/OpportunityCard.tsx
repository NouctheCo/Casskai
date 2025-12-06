import React from 'react';

import { motion } from 'framer-motion';

import { useSortable } from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';

import { Card, CardContent } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import type { Opportunity } from '@/types/crm.types';

import {

  Euro,

  Building,

  Target,

  AlertCircle,

  TrendingUp,

  Edit,

  Eye,

  GripVertical,

  User,

  Calendar

} from 'lucide-react';



interface OpportunityCardProps {

  opportunity: Opportunity;

  isDragging?: boolean;

  onEdit?: (opportunity: Opportunity) => void;

  onView?: (opportunity: Opportunity) => void;

}



export const OpportunityCard: React.FC<OpportunityCardProps> = ({

  opportunity,

  isDragging: _isDragging = false,

  onEdit,

  onView,

}) => {

  const {

    attributes,

    listeners,

    setNodeRef,

    transform,

    transition,

    isDragging: isSortableDragging,

  } = useSortable({

    id: opportunity.id,

  });



  const style = {

    transform: CSS.Transform.toString(transform),

    transition,

  };



  // Couleur de priorité

  const getPriorityColor = (priority?: string) => {

    switch (priority) {

      case 'high': return 'border-red-500 bg-red-50';

      case 'medium': return 'border-yellow-500 bg-yellow-50';

      case 'low': return 'border-green-500 bg-green-50';

      default: return 'border-gray-300 bg-white';

    }

  };



  // Icône de priorité

  const getPriorityIcon = (priority?: string) => {

    switch (priority) {

      case 'high': return <AlertCircle className="w-3 h-3 text-red-500" />;

      case 'medium': return <Target className="w-3 h-3 text-yellow-500" />;

      case 'low': return <TrendingUp className="w-3 h-3 text-green-500" />;

      default: return null;

    }

  };



  // Badge de priorité

  const getPriorityBadge = (priority?: string) => {

    if (!priority) return null;

    

    const colors = {

      high: 'bg-red-100 text-red-800',

      medium: 'bg-yellow-100 text-yellow-800',

      low: 'bg-green-100 text-green-800',

    };



    const labels = {

      high: 'Haute',

      medium: 'Moyenne',

      low: 'Faible',

    };



    return (

      <Badge className={`text-xs ${colors[priority as keyof typeof colors]}`}>

        {labels[priority as keyof typeof labels]}

      </Badge>

    );

  };



  // Formatage de la devise

  const formatCurrency = (amount: number) => {

    return new Intl.NumberFormat('fr-FR', {

      style: 'currency',

      currency: 'EUR',

      minimumFractionDigits: 0,

    }).format(amount);

  };



  // Calcul des jours jusqu'à la date de clôture

  const getDaysUntilClose = (date?: string) => {

    if (!date) return null;

    const closeDate = new Date(date);

    const today = new Date();

    const diffTime = closeDate.getTime() - today.getTime();

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;

  };



  const daysUntilClose = getDaysUntilClose(opportunity.expected_close_date);



  return (

    <motion.div

      ref={setNodeRef}

      style={style}

      initial={{ opacity: 0, scale: 0.95 }}

      animate={{ opacity: 1, scale: 1 }}

      exit={{ opacity: 0, scale: 0.95 }}

      whileHover={{ scale: 1.02 }}

      className={`mb-3 ${isSortableDragging ? 'z-50' : ''}`}

      {...attributes}

    >

      <Card 

        className={`

          cursor-grab active:cursor-grabbing transition-all duration-200

          ${getPriorityColor(opportunity.priority)}

          ${isSortableDragging ? 'shadow-2xl rotate-3 scale-105' : 'shadow-sm hover:shadow-md'}

          border-l-4

        `}

      >

        <CardContent className="p-4">

          {/* Header avec drag handle */}

          <div className="flex items-start justify-between mb-3">

            <div className="flex-1 min-w-0">

              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 dark:text-white truncate">

                {opportunity.title}

              </h3>

              {opportunity.description && (

                <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-300 mt-1 line-clamp-2">

                  {opportunity.description}

                </p>

              )}

            </div>

            <div className="flex items-center space-x-1 ml-2">

              {getPriorityIcon(opportunity.priority)}

              <div {...listeners} className="p-1 hover:bg-gray-100 rounded cursor-grab dark:bg-gray-900/50">

                <GripVertical className="w-3 h-3 text-gray-400 dark:text-gray-500" />

              </div>

            </div>

          </div>



          {/* Informations principales */}

          <div className="space-y-2">

            {/* Valeur et probabilité */}

            <div className="flex items-center justify-between">

              <div className="flex items-center space-x-1">

                <Euro className="w-3 h-3 text-green-600" />

                <span className="text-sm font-medium text-green-600">

                  {formatCurrency(opportunity.value)}

                </span>

              </div>

              <Badge variant="outline" className="text-xs">

                {opportunity.probability}% de chance

              </Badge>

            </div>



            {/* Client */}

            {opportunity.client_id && (

              <div className="flex items-center space-x-1">

                <Building className="w-3 h-3 text-gray-400 dark:text-gray-500" />

                <span className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-300 truncate">

                  Client ID: {opportunity.client_id}

                </span>

              </div>

            )}



            {/* Contact */}

            {opportunity.contact_id && (

              <div className="flex items-center space-x-1">

                <User className="w-3 h-3 text-gray-400 dark:text-gray-500" />

                <span className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-300 truncate">

                  Contact ID: {opportunity.contact_id}

                </span>

              </div>

            )}



            {/* Date de clôture prévue */}

            {opportunity.expected_close_date && (

              <div className="flex items-center justify-between">

                <div className="flex items-center space-x-1">

                  <Calendar className="w-3 h-3 text-gray-400 dark:text-gray-500" />

                  <span className="text-xs text-gray-600 dark:text-gray-300 dark:text-gray-300">

                    {new Date(opportunity.expected_close_date).toLocaleDateString('fr-FR')}

                  </span>

                </div>

                {daysUntilClose !== null && (

                  <Badge 

                    variant="outline" 

                    className={`text-xs ${

                      daysUntilClose < 0 

                        ? 'text-red-600 border-red-300' 

                        : daysUntilClose <= 7 

                          ? 'text-orange-600 border-orange-300'

                          : 'text-gray-600 border-gray-300'

                    }`}

                  >

                    {daysUntilClose < 0 

                      ? `${Math.abs(daysUntilClose)}j de retard`

                      : daysUntilClose === 0

                        ? 'Aujourd\'hui'

                        : `${daysUntilClose}j restants`

                    }

                  </Badge>

                )}

              </div>

            )}

          </div>



          {/* Tags */}

          {opportunity.tags && opportunity.tags.length > 0 && (

            <div className="mt-3 flex flex-wrap gap-1">

              {opportunity.tags.slice(0, 3).map((tag, index) => (

                <Badge key={index} variant="secondary" className="text-xs">

                  {tag}

                </Badge>

              ))}

              {opportunity.tags.length > 3 && (

                <Badge variant="secondary" className="text-xs">

                  +{opportunity.tags.length - 3}

                </Badge>

              )}

            </div>

          )}



          {/* Priorité et actions */}

          <div className="mt-3 flex items-center justify-between">

            <div className="flex items-center space-x-1">

              {getPriorityBadge(opportunity.priority)}

            </div>

            

            <div className="flex items-center space-x-1">

              {onView && (

                <Button 

                  variant="ghost" 

                  size="sm" 

                  onClick={() => onView(opportunity)}

                  className="h-6 w-6 p-0"

                >

                  <Eye className="w-3 h-3" />

                </Button>

              )}

              {onEdit && (

                <Button 

                  variant="ghost" 

                  size="sm" 

                  onClick={() => onEdit(opportunity)}

                  className="h-6 w-6 p-0"

                >

                  <Edit className="w-3 h-3" />

                </Button>

              )}

            </div>

          </div>



          {/* Prochaine action */}

          {opportunity.next_action && (

            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">

              <div className="flex items-center space-x-1">

                <Target className="w-3 h-3 text-blue-600" />

                <span className="font-medium text-blue-600">Prochaine action:</span>

              </div>

              <p className="text-blue-700 dark:text-blue-300 mt-1">

                {opportunity.next_action}

              </p>

              {opportunity.next_action_date && (

                <p className="text-blue-600 text-xs mt-1">

                  Date: {new Date(opportunity.next_action_date).toLocaleDateString('fr-FR')}

                </p>

              )}

            </div>

          )}

        </CardContent>

      </Card>

    </motion.div>

  );

};



export default OpportunityCard;
