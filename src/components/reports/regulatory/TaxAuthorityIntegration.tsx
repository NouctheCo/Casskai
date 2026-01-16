/**
 * Composant principal pour gérer les intégrations avec les autorités fiscales
 */
import { useState, useEffect } from 'react';
import { FileText, Plus, Clock, Settings, RefreshCw } from 'lucide-react';
import { TaxAuthorityDeadline, ComplianceStatus } from '@/types/taxAuthority';
import { TaxAuthorityService } from '@/services/taxAuthorityService';
import { SubmissionsList } from './SubmissionsList';
import { DeadlinesList } from './DeadlinesList';
import { CredentialsManager } from './CredentialsManager';
import { SubmissionForm } from './SubmissionForm';
import { logger } from '@/lib/logger';
interface TaxAuthorityIntegrationProps {
  companyId: string;
}
export function TaxAuthorityIntegration({ companyId }: TaxAuthorityIntegrationProps) {
  const [activeTab, setActiveTab] = useState<'submissions' | 'deadlines' | 'credentials'>('submissions');
  const [deadlines, setDeadlines] = useState<TaxAuthorityDeadline[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    loadData();
  }, [companyId]);
  const loadData = async () => {
    setLoading(true);
    try {
      const [deadlinesData, complianceData] = await Promise.all([
        TaxAuthorityService.getDeadlines(companyId),
        TaxAuthorityService.getComplianceStatus(companyId),
      ]);
      setDeadlines(deadlinesData);
      setComplianceStatus(complianceData);
    } catch (error) {
      logger.error('TaxAuthorityIntegration', 'Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">
            Intégrations Autorités Fiscales
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez vos soumissions et deadlines fiscales
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={() => setShowSubmissionForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouvelle soumission
          </button>
        </div>
      </div>
      {/* Compliance Status Cards */}
      {complianceStatus && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total</p>
            <p className="text-2xl font-bold dark:text-white">{complianceStatus.total_deadlines}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Soumis</p>
            <p className="text-2xl font-bold dark:text-white">{complianceStatus.submitted}</p>
            <p className="text-xs text-gray-500 mt-1">{complianceStatus.submission_rate.toFixed(1)}%</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-emerald-500">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Acceptés</p>
            <p className="text-2xl font-bold dark:text-white">{complianceStatus.accepted}</p>
            <p className="text-xs text-gray-500 mt-1">{complianceStatus.acceptance_rate.toFixed(1)}%</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
            <p className="text-gray-600 dark:text-gray-400 text-sm">En attente</p>
            <p className="text-2xl font-bold dark:text-white">{complianceStatus.pending}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-red-500">
            <p className="text-gray-600 dark:text-gray-400 text-sm">En retard</p>
            <p className="text-2xl font-bold dark:text-white text-red-600">{complianceStatus.overdue}</p>
          </div>
        </div>
      )}
      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              activeTab === 'submissions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-5 h-5" />
              Soumissions
            </div>
          </button>
          <button
            onClick={() => setActiveTab('deadlines')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              activeTab === 'deadlines'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" />
              Deadlines
            </div>
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              activeTab === 'credentials'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Settings className="w-5 h-5" />
              Identifiants
            </div>
          </button>
        </div>
        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'submissions' && <SubmissionsList companyId={companyId} />}
          {activeTab === 'deadlines' && <DeadlinesList deadlines={deadlines} loading={loading} />}
          {activeTab === 'credentials' && <CredentialsManager companyId={companyId} />}
        </div>
      </div>
      {/* Submission Form Modal */}
      {showSubmissionForm && (
        <SubmissionForm
          companyId={companyId}
          onClose={() => setShowSubmissionForm(false)}
          onSuccess={() => {
            setShowSubmissionForm(false);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}
