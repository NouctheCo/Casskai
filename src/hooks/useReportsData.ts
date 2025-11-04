// Custom hook for reports data management
import { useState, useEffect } from 'react';
import { reportGenerationService } from '@/services/reportGenerationService';
import type { FinancialReport } from '@/types/reports.types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';

export function useReportsData() {
  const { currentCompany } = useAuth();
  const { showToast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [selectedReportType, setSelectedReportType] = useState('all_types');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<FinancialReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecentReports();
  }, [currentCompany]);

  const loadRecentReports = async () => {
    if (!currentCompany?.id) return;
    
    setIsLoading(true);
    try {
      const reports = await reportGenerationService.getRecentReports(currentCompany.id);
      setRecentReports(reports);
    } catch (error) {
      showToast({
        title: 'Erreur',
        description: 'Impossible de charger les rapports récents',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async (reportType: string) => {
    if (!currentCompany?.id) return;

    setIsGenerating(reportType);
    try {
      await reportGenerationService.generateReport({
        type: reportType,
        companyId: currentCompany.id,
        period: selectedPeriod
      });

      showToast({
        title: 'Rapport généré',
        description: 'Le rapport a été généré avec succès',
        type: 'success'
      });

      await loadRecentReports();
    } catch (error) {
      showToast({
        title: 'Erreur',
        description: 'Impossible de générer le rapport',
        type: 'error'
      });
    } finally {
      setIsGenerating(null);
    }
  };

  return {
    selectedPeriod,
    setSelectedPeriod,
    selectedReportType,
    setSelectedReportType,
    isGenerating,
    recentReports,
    isLoading,
    generateReport,
    loadRecentReports
  };
}
