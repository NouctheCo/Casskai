import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Event {
  id: string;
  title: string;
  date: Date;
  type?: 'meeting' | 'deadline' | 'event';
}

interface CalendarWidgetProps {
  events?: Event[];
  compact?: boolean;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ 
  events = [], 
  compact = true 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Événements d'exemple
  const defaultEvents: Event[] = [
    { id: '1', title: 'Réunion équipe', date: new Date(), type: 'meeting' },
    { id: '2', title: 'Rapport mensuel', date: new Date(Date.now() + 86400000), type: 'deadline' },
    { id: '3', title: 'Formation', date: new Date(Date.now() + 172800000), type: 'event' }
  ];
  
  const displayEvents = events.length > 0 ? events : defaultEvents;
  
  const today = new Date();
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short'
    }).format(date);
  };
  
  const getEventTypeColor = (type?: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'deadline':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'event':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const upcomingEvents = displayEvents
    .filter(event => event.date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, compact ? 3 : 5);

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 dark:text-white">
              Prochains événements
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {upcomingEvents.length} événements
          </span>
        </div>
        
        <div className="space-y-2">
          {upcomingEvents.map((event, index) => (
            <motion.div
              key={event.id}
              className={cn(
                "flex items-center space-x-3 p-2 border rounded-lg",
                getEventTypeColor(event.type)
              )}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex-shrink-0">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                  isToday(event.date) && "bg-blue-500 text-white"
                )}>
                  {formatDate(event.date).split(' ')[0]}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {event.title}
                </p>
                <p className="text-xs opacity-75">
                  {formatDate(event.date)}
                  {isToday(event.date) && ' (Aujourd\'hui)'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        
        {displayEvents.length > upcomingEvents.length && (
          <div className="text-center">
            <button className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
              Voir tous les événements
            </button>
          </div>
        )}
      </div>
    );
  }

  // Version complète du calendrier (pour widgets plus grands)
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();
  
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <div className="space-y-4">
      {/* En-tête du calendrier */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Grille du calendrier */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
          <div key={day} className="text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}
        
        {days.map((day, index) => (
          <div
            key={index}
            className={cn(
              "h-8 flex items-center justify-center text-sm rounded",
              day ? "hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" : "",
              day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
                ? "bg-blue-500 text-white"
                : ""
            )}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarWidget;
