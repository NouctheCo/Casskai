// FiscalCalendarTab.tsx - Interactive Fiscal Calendar Component

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  Filter,
  Download,
  TrendingUp
} from 'lucide-react';
import { fiscalCalendarService, FiscalEvent } from '@/services/fiscalCalendarService';
import { motion } from 'framer-motion';

interface FiscalCalendarTabProps {
  countryCode: string;
  enterpriseId: string;
  completedEventIds?: string[];
}

export const FiscalCalendarTab: React.FC<FiscalCalendarTabProps> = ({
  countryCode,
  enterpriseId,
  completedEventIds = []
}) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'month' | 'year'>('year');

  // Generate fiscal events for the selected year
  const fiscalEvents = useMemo(() => {
    return fiscalCalendarService.generateFiscalEvents(
      countryCode,
      selectedYear,
      completedEventIds
    );
  }, [countryCode, selectedYear, completedEventIds]);

  // Calculate statistics
  const stats = useMemo(() => {
    return fiscalCalendarService.calculateFiscalCalendarStats(fiscalEvents);
  }, [fiscalEvents]);

  // Filter events based on selections
  const filteredEvents = useMemo(() => {
    let events = [...fiscalEvents];

    // Filter by month
    if (selectedMonth !== 'all') {
      events = fiscalCalendarService.getEventsByMonth(events, selectedYear, selectedMonth);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      events = fiscalCalendarService.filterEventsByCategory(
        events,
        selectedCategory as any
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      events = fiscalCalendarService.filterEventsByStatus(
        events,
        selectedStatus as any
      );
    }

    return events;
  }, [fiscalEvents, selectedMonth, selectedCategory, selectedStatus, selectedYear]);

  // Group events by month for year view
  const eventsByMonth = useMemo(() => {
    const grouped: Record<number, FiscalEvent[]> = {};
    for (let month = 0; month < 12; month++) {
      grouped[month] = fiscalCalendarService.getEventsByMonth(
        filteredEvents,
        selectedYear,
        month
      );
    }
    return grouped;
  }, [filteredEvents, selectedYear]);

  const handlePreviousYear = () => {
    setSelectedYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(prev => prev + 1);
  };

  const handleExportCalendar = () => {
    const csv = fiscalCalendarService.exportFiscalCalendarToCSV(filteredEvents);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendrier_fiscal_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'bg-red-100 text-red-800 border-red-300';
      case 'due_soon': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue': return <AlertCircle className="h-4 w-4" />;
      case 'due_soon': return <Clock className="h-4 w-4" />;
      case 'upcoming': return <TrendingUp className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      vat: 'TVA',
      corporate_tax: 'IS',
      social: 'Social',
      local_tax: 'Taxes locales',
      other: 'Autre'
    };
    return labels[category] || category;
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total</p>
                <p className="text-2xl font-bold">{stats.totalEvents}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">En retard</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdueEvents}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">À venir bientôt</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.dueSoonEvents}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Prochains</p>
                <p className="text-2xl font-bold text-blue-600">{stats.upcomingEvents}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Complétés</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedEvents}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousYear}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-2xl font-bold">{selectedYear}</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextYear}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(val === 'all' ? 'all' : parseInt(val))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Mois" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="vat">TVA</SelectItem>
                  <SelectItem value="corporate_tax">IS</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="local_tax">Taxes locales</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="overdue">En retard</SelectItem>
                  <SelectItem value="due_soon">Bientôt</SelectItem>
                  <SelectItem value="upcoming">Prochains</SelectItem>
                  <SelectItem value="completed">Complétés</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCalendar}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Year View: Events grouped by month */}
          {viewMode === 'year' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {monthNames.map((monthName, monthIndex) => {
                const monthEvents = eventsByMonth[monthIndex] || [];
                const hasOverdue = monthEvents.some(e => e.status === 'overdue');
                const hasDueSoon = monthEvents.some(e => e.status === 'due_soon');

                return (
                  <motion.div
                    key={monthIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: monthIndex * 0.05 }}
                  >
                    <Card className={`border-2 ${
                      hasOverdue ? 'border-red-300 bg-red-50' :
                      hasDueSoon ? 'border-yellow-300 bg-yellow-50' :
                      'border-gray-200'
                    }`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{monthName}</CardTitle>
                          <Badge variant="secondary">{monthEvents.length}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {monthEvents.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-300 italic">Aucune échéance</p>
                          ) : (
                            monthEvents.map(event => (
                              <div
                                key={event.id}
                                className={`p-2 rounded-lg border ${getStatusColor(event.status)}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                      {getStatusIcon(event.status)}
                                      <p className="text-xs font-semibold truncate">
                                        {event.title}
                                      </p>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                      {event.dueDate.toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'short'
                                      })}
                                    </p>
                                  </div>
                                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(event.priority)}`}></div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* List View: All filtered events */}
          {viewMode === 'month' && (
            <div className="space-y-3">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Aucune échéance trouvée
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Aucune échéance ne correspond aux filtres sélectionnés.
                  </p>
                </div>
              ) : (
                filteredEvents.map(event => (
                  <Card key={event.id} className={`border-l-4 ${
                    event.status === 'overdue' ? 'border-l-red-500' :
                    event.status === 'due_soon' ? 'border-l-yellow-500' :
                    event.status === 'completed' ? 'border-l-green-500' :
                    'border-l-blue-500'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(event.status)}
                            <h3 className="font-semibold text-lg">{event.title}</h3>
                            <Badge className={getStatusColor(event.status)}>
                              {event.status}
                            </Badge>
                            <Badge variant="outline">
                              {getCategoryLabel(event.category)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {event.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              <span>
                                Échéance: {event.dueDate.toLocaleDateString('fr-FR', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Fréquence:</span>
                              <span className="capitalize">{event.frequency}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={`${getPriorityColor(event.priority)} text-white`}>
                            {event.priority}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toggle View Mode */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => setViewMode(viewMode === 'year' ? 'month' : 'year')}
        >
          {viewMode === 'year' ? 'Vue Liste' : 'Vue Annuelle'}
        </Button>
      </div>
    </div>
  );
};

export default FiscalCalendarTab;
