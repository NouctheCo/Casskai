import React from 'react';

import { motion } from 'framer-motion';

import { 

  TrendingUp, 

  BarChart3, 

  PieChart, 

  Activity,

  Table,

  Calendar,

  Bell,

  Settings,

  Gauge,

  MapPin,

  Clock,

  FileText,

  Image,

  ExternalLink,

  Users,

  CheckSquare,

  MessageCircle,

  Thermometer,

  Zap,

  Target

} from 'lucide-react';

import { WidgetLibraryItem } from '../../types/dashboard.types';

import { Card, CardContent } from '../ui/card';

import { Badge } from '../ui/badge';

import { cn } from '../../lib/utils';



// Définition de tous les widgets disponibles

export const WIDGET_LIBRARY: WidgetLibraryItem[] = [

  {

    id: 'kpi-card',

    type: 'kpi-card',

    name: 'Carte KPI',

    description: 'Affiche une métrique clé avec tendance et comparaison',

    icon: 'TrendingUp',

    category: 'analytics',

    tags: ['kpi', 'metrics', 'trend'],

    defaultSize: 'small',

    configurable: true,

    version: '1.0',

    rating: 4.8

  },

  {

    id: 'line-chart',

    type: 'line-chart',

    name: 'Graphique Linéaire',

    description: 'Graphique linéaire pour visualiser les tendances temporelles',

    icon: 'Activity',

    category: 'analytics',

    tags: ['chart', 'trends', 'time-series'],

    defaultSize: 'medium',

    configurable: true,

    version: '1.0',

    rating: 4.7

  },

  {

    id: 'bar-chart',

    type: 'bar-chart',

    name: 'Graphique en Barres',

    description: 'Graphique en barres pour comparer des catégories',

    icon: 'BarChart3',

    category: 'analytics',

    tags: ['chart', 'comparison', 'categories'],

    defaultSize: 'medium',

    configurable: true,

    version: '1.0',

    rating: 4.6

  },

  {

    id: 'pie-chart',

    type: 'pie-chart',

    name: 'Graphique Circulaire',

    description: 'Graphique circulaire pour afficher les proportions',

    icon: 'PieChart',

    category: 'analytics',

    tags: ['chart', 'proportions', 'distribution'],

    defaultSize: 'medium',

    configurable: true,

    version: '1.0',

    rating: 4.5

  },

  {

    id: 'area-chart',

    type: 'area-chart',

    name: 'Graphique en Aires',

    description: 'Graphique en aires pour visualiser des volumes cumulés',

    icon: 'Activity',

    category: 'analytics',

    tags: ['chart', 'cumulative', 'volume'],

    defaultSize: 'medium',

    configurable: true,

    version: '1.0',

    rating: 4.4

  },

  {

    id: 'data-table',

    type: 'table',

    name: 'Tableau de Données',

    description: 'Tableau avec tri, filtrage et pagination',

    icon: 'Table',

    category: 'productivity',

    tags: ['table', 'data', 'list'],

    defaultSize: 'large',

    configurable: true,

    version: '1.0',

    rating: 4.9

  },

  {

    id: 'calendar-widget',

    type: 'calendar',

    name: 'Calendrier',

    description: 'Calendrier avec événements et planification',

    icon: 'Calendar',

    category: 'productivity',

    tags: ['calendar', 'events', 'planning'],

    defaultSize: 'medium',

    configurable: true,

    version: '1.0',

    rating: 4.3

  },

  {

    id: 'notifications-center',

    type: 'notifications',

    name: 'Centre de Notifications',

    description: 'Affiche les dernières notifications et alertes',

    icon: 'Bell',

    category: 'communication',

    tags: ['notifications', 'alerts', 'updates'],

    defaultSize: 'medium',

    configurable: true,

    version: '1.0',

    rating: 4.2

  },

  {

    id: 'quick-actions',

    type: 'quick-actions',

    name: 'Actions Rapides',

    description: 'Boutons d\'actions fréquemment utilisées',

    icon: 'Zap',

    category: 'productivity',

    tags: ['actions', 'shortcuts', 'productivity'],

    defaultSize: 'small',

    configurable: true,

    version: '1.0',

    rating: 4.7

  },

  {

    id: 'progress-tracker',

    type: 'progress-tracker',

    name: 'Suivi de Progression',

    description: 'Barre de progression avec objectifs et jalons',

    icon: 'Target',

    category: 'monitoring',

    tags: ['progress', 'goals', 'tracking'],

    defaultSize: 'medium',

    configurable: true,

    version: '1.0',

    rating: 4.5

  },

  {

    id: 'gauge-widget',

    type: 'gauge',

    name: 'Jauge',

    description: 'Indicateur circulaire de performance ou niveau',

    icon: 'Gauge',

    category: 'monitoring',

    tags: ['gauge', 'performance', 'level'],

    defaultSize: 'small',

    configurable: true,

    version: '1.0',

    rating: 4.1

  },

  {

    id: 'heatmap-widget',

    type: 'heatmap',

    name: 'Carte de Chaleur',

    description: 'Visualisation de données par intensité de couleur',

    icon: 'MapPin',

    category: 'analytics',

    tags: ['heatmap', 'visualization', 'intensity'],

    defaultSize: 'large',

    configurable: true,

    version: '1.0',

    rating: 4.0

  },

  {

    id: 'timeline-widget',

    type: 'timeline',

    name: 'Timeline',

    description: 'Chronologie d\'événements ou d\'activités',

    icon: 'Clock',

    category: 'productivity',

    tags: ['timeline', 'chronology', 'events'],

    defaultSize: 'large',

    configurable: true,

    version: '1.0',

    rating: 4.4

  },

  {

    id: 'kanban-board',

    type: 'kanban',

    name: 'Tableau Kanban',

    description: 'Gestion de tâches en colonnes',

    icon: 'CheckSquare',

    category: 'productivity',

    tags: ['kanban', 'tasks', 'workflow'],

    defaultSize: 'xl',

    configurable: true,

    version: '1.0',

    rating: 4.8

  },

  {

    id: 'metrics-grid',

    type: 'metrics-grid',

    name: 'Grille de Métriques',

    description: 'Affichage compact de plusieurs KPI',

    icon: 'Settings',

    category: 'analytics',

    tags: ['metrics', 'grid', 'compact'],

    defaultSize: 'medium',

    configurable: true,

    version: '1.0',

    rating: 4.6

  },

  {

    id: 'text-widget',

    type: 'text-widget',

    name: 'Widget Texte',

    description: 'Zone de texte personnalisable avec formatage',

    icon: 'FileText',

    category: 'content',

    tags: ['text', 'content', 'notes'],

    defaultSize: 'small',

    configurable: true,

    version: '1.0',

    rating: 3.9

  },

  {

    id: 'image-widget',

    type: 'image-widget',

    name: 'Widget Image',

    description: 'Affichage d\'images avec légendes',

    icon: 'Image',

    category: 'content',

    tags: ['image', 'media', 'visual'],

    defaultSize: 'medium',

    configurable: true,

    version: '1.0',

    rating: 4.2

  },

  {

    id: 'iframe-widget',

    type: 'iframe-widget',

    name: 'Widget Iframe',

    description: 'Intégration de contenu externe via iframe',

    icon: 'ExternalLink',

    category: 'external',

    tags: ['iframe', 'external', 'integration'],

    defaultSize: 'large',

    configurable: true,

    premium: true,

    version: '1.0',

    rating: 4.3

  },

  {

    id: 'recent-activities',

    type: 'recent-activities',

    name: 'Activités Récentes',

    description: 'Liste des dernières activités et actions',

    icon: 'Users',

    category: 'communication',

    tags: ['activities', 'feed', 'updates'],

    defaultSize: 'medium',

    configurable: true,

    version: '1.0',

    rating: 4.5

  },

  {

    id: 'weather-widget',

    type: 'weather',

    name: 'Météo',

    description: 'Prévisions météorologiques et conditions actuelles',

    icon: 'Thermometer',

    category: 'external',

    tags: ['weather', 'forecast', 'climate'],

    defaultSize: 'small',

    configurable: true,

    version: '1.0',

    rating: 4.0

  }

];



const iconMap = {

  TrendingUp,

  BarChart3,

  PieChart,

  Activity,

  Table,

  Calendar,

  Bell,

  Settings,

  Gauge,

  MapPin,

  Clock,

  FileText,

  Image,

  ExternalLink,

  Users,

  CheckSquare,

  MessageCircle,

  Thermometer,

  Zap,

  Target

};



interface WidgetLibraryProps {

  onAddWidget?: (widget: WidgetLibraryItem) => void;

  selectedCategory?: string;

  searchQuery?: string;

  showPremiumOnly?: boolean;

}



export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({

  onAddWidget,

  selectedCategory = 'all',

  searchQuery = '',

  showPremiumOnly = false

}) => {

  const filteredWidgets = WIDGET_LIBRARY.filter(widget => {

    // Filter by category

    if (selectedCategory !== 'all' && widget.category !== selectedCategory) {

      return false;

    }



    // Filter by search query

    if (searchQuery && !widget.name.toLowerCase().includes(searchQuery.toLowerCase()) &&

        !widget.description.toLowerCase().includes(searchQuery.toLowerCase()) &&

        !widget.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {

      return false;

    }



    // Filter by premium status

    if (showPremiumOnly && !widget.premium) {

      return false;

    }



    return true;

  });



  const getCategoryColor = (category: string): string => {

    const colors: Record<string, string> = {

      analytics: 'bg-blue-100 text-blue-800',

      finance: 'bg-green-100 text-green-800',

      productivity: 'bg-purple-100 text-purple-800',

      communication: 'bg-orange-100 text-orange-800',

      monitoring: 'bg-red-100 text-red-800',

      content: 'bg-gray-100 text-gray-800',

      external: 'bg-indigo-100 text-indigo-800'

    };

    return colors[category] || colors.content;

  };



  const getSizeInfo = (size: string): string => {

    const sizeInfo: Record<string, string> = {

      small: '2×2',

      medium: '4×3',

      large: '6×4',

      xl: '8×5'

    };

    return sizeInfo[size] || '4×3';

  };



  return (

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

      {filteredWidgets.map((widget, index) => {

        const IconComponent = iconMap[widget.icon as keyof typeof iconMap] || Settings;

        

        return (

          <motion.div

            key={widget.id}

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            transition={{ delay: index * 0.05, duration: 0.3 }}

          >

            <Card 

              className={cn(

                "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",

                "border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-600"

              )}

              onClick={() => onAddWidget?.(widget)}

            >

              <CardContent className="p-4">

                <div className="space-y-3">

                  {/* Header */}

                  <div className="flex items-start justify-between">

                    <div className="flex items-center space-x-3">

                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">

                        <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400 dark:text-gray-400" />

                      </div>

                      <div className="flex-1 min-w-0">

                        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 dark:text-white truncate">

                          {widget.name}

                        </h3>

                        <div className="flex items-center space-x-2 mt-1">

                          <Badge 

                            variant="secondary" 

                            className={cn("text-xs px-2 py-0.5", getCategoryColor(widget.category))}

                          >

                            {widget.category}

                          </Badge>

                          {widget.premium && (

                            <Badge className="text-xs px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white">

                              Premium

                            </Badge>

                          )}

                        </div>

                      </div>

                    </div>

                    

                    <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">

                      {getSizeInfo(widget.defaultSize)}

                    </div>

                  </div>



                  {/* Description */}

                  <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-400 line-clamp-2">

                    {widget.description}

                  </p>



                  {/* Tags */}

                  <div className="flex flex-wrap gap-1">

                    {widget.tags.slice(0, 3).map(tag => (

                      <span

                        key={tag}

                        className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 dark:text-gray-400 rounded-full"

                      >

                        {tag}

                      </span>

                    ))}

                    {widget.tags.length > 3 && (

                      <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">

                        +{widget.tags.length - 3}

                      </span>

                    )}

                  </div>



                  {/* Footer */}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">

                    <div className="flex items-center space-x-1">

                      {[...Array(5)].map((_, i) => (

                        <div

                          key={i}

                          className={cn(

                            "w-2 h-2 rounded-full",

                            i < Math.floor(widget.rating || 0) 

                              ? "bg-yellow-400" 

                              : "bg-gray-200 dark:bg-gray-700"

                          )}

                        />

                      ))}

                      <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 ml-1">

                        {widget.rating?.toFixed(1)}

                      </span>

                    </div>

                    

                    <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">

                      v{widget.version}

                    </div>

                  </div>

                </div>

              </CardContent>

            </Card>

          </motion.div>

        );

      })}

    </div>

  );

};



// Widget Categories pour les filtres

export const WIDGET_CATEGORIES = [

  { id: 'all', name: 'Tous', icon: Settings },

  { id: 'analytics', name: 'Analytics', icon: BarChart3 },

  { id: 'finance', name: 'Finance', icon: TrendingUp },

  { id: 'productivity', name: 'Productivité', icon: CheckSquare },

  { id: 'communication', name: 'Communication', icon: MessageCircle },

  { id: 'monitoring', name: 'Monitoring', icon: Activity },

  { id: 'content', name: 'Contenu', icon: FileText },

  { id: 'external', name: 'Externe', icon: ExternalLink }

];
