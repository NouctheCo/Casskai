import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  FileText,
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar as CalendarIcon,
  Clock,
  Download,
  RefreshCw,
  Filter,
  Search,
  AlertCircle,
  CheckCircle2,
  Play,
  Pause,
  Eye,
  Settings,
  BookOpen,
  PieChart,
  LineChart,
  BarChart,
  Calculator,
  Building2
} from 'lucide-react';
import { format, addDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useReports } from '@/hooks/useReports';
import { Report, ReportParameters, ReportExecution } from '@/domain/reports/entities/Report';

interface DateRange {
  from: Date;
  to: Date;
}

const reportIcons = {
  'balance_sheet': Building2,
  'income_statement': TrendingUp,
  'cash_flow': DollarSign,
  'trial_balance': Calculator,
  'aged_receivables': FileText,
  'vat_return': BookOpen,
  'financial_ratios': PieChart
};

const complexityColors = {
  'simple': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'complex': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

const statusColors = {
  'draft': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  'generating': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'failed': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

export const EnhancedReportsPage: React.FC = () => {
  const { currentCompany } = useAuth();
  const {
    reportDefinitions,
    executions,
    currentExecution,
    loading,
    generating,
    error,
    loadReports,
    loadReportsByCategory,
    generateReport,
    getReportExecutions,
    estimateGeneration,
    clearError
  } = useReports(currentCompany?.id || '');

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(subMonths(new Date(), 1))
  });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showGenerationModal, setShowGenerationModal] = useState(false);

  // Computed values
  const filteredReports = useMemo(() => {
    let filtered = reportDefinitions;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(report => report.metadata.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(report =>
        report.metadata.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.metadata.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered;
  }, [reportDefinitions, selectedCategory, searchQuery]);

  const categories = useMemo(() => {
    const cats = new Set(reportDefinitions.map(r => r.metadata.category));
    return Array.from(cats);
  }, [reportDefinitions]);

  // Handlers
  const handleGenerateReport = async (report: Report) => {
    if (!currentCompany) return;

    const parameters: ReportParameters = {
      dateFrom: dateRange.from,
      dateTo: dateRange.to,
      companyId: currentCompany.id,
      currency: 'EUR',
      includeComparisons: true,
      previousPeriod: true
    };

    try {
      await generateReport(report.metadata.id, parameters);
      setShowGenerationModal(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Failed to generate report:', errorMsg);
    }
  };

  const handleEstimateGeneration = async (report: Report) => {
    if (!currentCompany) return;

    const parameters: ReportParameters = {
      dateFrom: dateRange.from,
      dateTo: dateRange.to,
      companyId: currentCompany.id
    };

    try {
      const estimation = await estimateGeneration(report.metadata.id, parameters);
      console.log('Generation estimate:', estimation);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Failed to estimate generation:', errorMsg);
    }
  };

  // Quick date range presets
  const datePresets = [
    { label: 'Mois dernier', getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
    { label: 'Trimestre dernier', getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
    { label: 'Année dernière', getValue: () => ({ from: subMonths(new Date(), 12), to: new Date() }) },
    { label: '30 derniers jours', getValue: () => ({ from: addDays(new Date(), -30), to: new Date() }) }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Rapports Financiers
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-3xl mx-auto">
            Générez des rapports financiers professionnels avec des analyses approfondies et des recommandations stratégiques
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher un rapport..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date Range */}
                <div className="flex space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(dateRange.from, "dd MMM", { locale: fr })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(dateRange.to, "dd MMM", { locale: fr })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Quick Presets */}
                <div className="flex space-x-2">
                  {datePresets.map(preset => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      onClick={() => setDateRange(preset.getValue())}
                      className="text-xs"
                    >
                      {preset.label.split(' ')[0]}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 dark:text-red-200">{error}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={clearError}>
                  ×
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reports Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredReports.map((report, index) => {
            const IconComponent = reportIcons[report.metadata.id as keyof typeof reportIcons] || FileText;

            return (
              <motion.div
                key={report.metadata.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                            {report.metadata.name}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {report.metadata.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={complexityColors[report.metadata.complexity]} variant="secondary">
                        {report.metadata.complexity}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-1">
                      {report.metadata.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{report.metadata.estimatedDuration}s</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BarChart className="w-4 h-4" />
                        <span>{report.metadata.frequency}</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowGenerationModal(true);
                        }}
                        disabled={generating}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Générer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEstimateGeneration(report)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Current Execution Status */}
        <AnimatePresence>
          {currentExecution && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed bottom-6 right-6 w-96"
            >
              <Card className="shadow-2xl border-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Génération en cours</CardTitle>
                    <Badge className={statusColors[currentExecution.status]}>
                      {currentExecution.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Progress value={currentExecution.progress} className="h-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        {currentExecution.progress}% terminé
                      </span>
                      <div className="flex items-center space-x-1 text-slate-500">
                        {currentExecution.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : currentExecution.status === 'failed' ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <p className="mt-2 text-slate-600 dark:text-slate-400">Chargement des rapports...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Aucun rapport trouvé
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Essayez de modifier vos critères de recherche ou de filtrage
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedReportsPage;