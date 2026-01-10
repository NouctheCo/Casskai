/**
 * Reports Management Tabs
 * Composant principal avec 3 onglets: Génération, Historique, Archive
 * Architecture similaire à HumanResourcesPage
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, History, Archive, BarChart3, Scale } from 'lucide-react';
import OptimizedReportsTab from '../accounting/OptimizedReportsTab';
import { ReportHistoryTab } from './ReportHistoryTab';
import { ReportArchiveTab } from './ReportArchiveTab';

interface ReportsManagementTabsProps {
  companyId: string;
}

export function ReportsManagementTabs({ companyId }: ReportsManagementTabsProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('generation');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const _refreshAll = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Rapports Financiers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Génération, historique et archivage légal des rapports comptables
          </p>
        </div>
        <div>
          <Button
            onClick={() => navigate('/reports/regulatory')}
            className="flex items-center gap-2"
          >
            <Scale className="w-4 h-4" />
            Documents Réglementaires
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="generation" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Génération</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Historique</span>
            </TabsTrigger>
            <TabsTrigger value="archive" className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              <span className="hidden sm:inline">Archive Légale</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="generation" className="space-y-4">
              <OptimizedReportsTab />
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <ReportHistoryTab
                companyId={companyId}
                refreshTrigger={refreshTrigger}
              />
            </TabsContent>

            <TabsContent value="archive" className="space-y-4">
              <ReportArchiveTab
                companyId={companyId}
                refreshTrigger={refreshTrigger}
              />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
