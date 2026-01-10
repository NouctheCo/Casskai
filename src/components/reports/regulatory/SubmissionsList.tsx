/**
 * Composant pour afficher la liste des soumissions
 */
import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, XCircle, Eye, RefreshCw } from 'lucide-react';
import { TaxAuthoritySubmission } from '@/types/taxAuthority';
import { supabase } from '@/lib/supabase';
import { FormatterUtils } from '@/utils/taxAuthorityUtils';
import { logger } from '@/lib/logger';
interface SubmissionsListProps {
  companyId: string;
}
export function SubmissionsList({ companyId }: SubmissionsListProps) {
  const [submissions, setSubmissions] = useState<TaxAuthoritySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<TaxAuthoritySubmission | null>(null);
  useEffect(() => {
    loadSubmissions();
  }, [companyId]);
  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tax_authority_submissions')
        .select(`
          *,
          document_id (document_type, fiscal_year, fiscal_period),
          authority_id (authority_name, country_code)
        `)
        .order('submission_date', { ascending: false });
      if (!error) {
        setSubmissions(data || []);
      }
    } catch (error) {
      logger.error('SubmissionsList', 'Erreur lors du chargement des soumissions:', error);
    } finally {
      setLoading(false);
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'acknowledged':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      acknowledged: 'Reconnu',
      accepted: 'Accepté',
      rejected: 'Rejeté',
      needs_correction: 'À corriger',
      processing: 'En traitement',
    };
    return labels[status] || status;
  };
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-50 dark:bg-yellow-900/20',
      acknowledged: 'bg-blue-50 dark:bg-blue-900/20',
      accepted: 'bg-green-50 dark:bg-green-900/20',
      rejected: 'bg-red-50 dark:bg-red-900/20',
      needs_correction: 'bg-orange-50 dark:bg-orange-900/20',
      processing: 'bg-purple-50 dark:bg-purple-900/20',
    };
    return colors[status] || 'bg-gray-50 dark:bg-gray-900/20';
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-600" />
      </div>
    );
  }
  if (submissions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Aucune soumission trouvée</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {submissions.map(submission => (
        <div
          key={submission.id}
          className={`rounded-lg p-4 border border-gray-200 dark:border-gray-700 ${getStatusColor(submission.submission_status)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {getStatusIcon(submission.submission_status)}
                <h3 className="font-medium dark:text-white">
                  {submission.document_type} - {submission.fiscal_year}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {submission.submission_reference && `Référence: ${submission.submission_reference}`}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {FormatterUtils.formatDateTime(submission.submission_date)}
              </p>
              {submission.error_message && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">{submission.error_message}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-gray-700">
                {getStatusLabel(submission.submission_status)}
              </span>
              <button
                onClick={() => setSelectedSubmission(submission)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      ))}
      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold dark:text-white">Détails de la soumission</h2>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Type de document</p>
                  <p className="font-medium dark:text-white">{selectedSubmission.document_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Statut</p>
                  <p className="font-medium dark:text-white">{getStatusLabel(selectedSubmission.submission_status)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Date de soumission</p>
                  <p className="font-medium dark:text-white">{FormatterUtils.formatDate(selectedSubmission.submission_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Référence</p>
                  <p className="font-medium dark:text-white">{selectedSubmission.submission_reference || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Format</p>
                  <p className="font-medium dark:text-white">{selectedSubmission.file_format}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Taille du fichier</p>
                  <p className="font-medium dark:text-white">
                    {selectedSubmission.file_size_bytes
                      ? FormatterUtils.formatFileSize(selectedSubmission.file_size_bytes)
                      : 'N/A'}
                  </p>
                </div>
              </div>
              {selectedSubmission.error_message && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800 dark:text-red-400">Erreur</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{selectedSubmission.error_message}</p>
                </div>
              )}
              {selectedSubmission.acknowledgement_data && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-400">Accusé de réception</p>
                  <pre className="text-xs mt-2 overflow-x-auto text-blue-700 dark:text-blue-300">
                    {JSON.stringify(selectedSubmission.acknowledgement_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}