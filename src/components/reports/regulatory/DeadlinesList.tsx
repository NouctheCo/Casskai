/**
 * Composant pour afficher les deadlines
 */

import { AlertTriangle, Calendar, CheckCircle } from 'lucide-react';
import { TaxAuthorityDeadline } from '@/types/taxAuthority';
import { FormatterUtils } from '@/utils/taxAuthorityUtils';

interface DeadlinesListProps {
  deadlines: TaxAuthorityDeadline[];
  loading: boolean;
}

export function DeadlinesList({ deadlines, loading }: DeadlinesListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
      </div>
    );
  }

  if (deadlines.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Aucune deadline trouvée</p>
      </div>
    );
  }

  const isOverdue = (deadline: TaxAuthorityDeadline) => {
    return !deadline.is_submitted && new Date(deadline.submission_deadline) < new Date();
  };

  const isUpcoming = (deadline: TaxAuthorityDeadline) => {
    const daysUntil = Math.ceil(
      (new Date(deadline.submission_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return !deadline.is_submitted && daysUntil <= 30 && daysUntil > 0;
  };

  const getDaysUntil = (deadline: string) => {
    const daysUntil = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil;
  };

  const sortedDeadlines = [...deadlines].sort((a, b) => {
    return new Date(a.submission_deadline).getTime() - new Date(b.submission_deadline).getTime();
  });

  return (
    <div className="space-y-4">
      {sortedDeadlines.map(deadline => {
        const overdue = isOverdue(deadline);
        const upcoming = isUpcoming(deadline);
        const daysUntil = getDaysUntil(deadline.submission_deadline);

        return (
          <div
            key={deadline.id}
            className={`rounded-lg p-4 border-l-4 ${
              deadline.is_submitted
                ? 'bg-green-50 dark:bg-green-900/20 border-l-green-500'
                : overdue
                  ? 'bg-red-50 dark:bg-red-900/20 border-l-red-500'
                  : upcoming
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-yellow-500'
                    : 'bg-gray-50 dark:bg-gray-900/20 border-l-gray-500'
            } border border-gray-200 dark:border-gray-700`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {deadline.is_submitted ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : overdue ? (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Calendar className="w-5 h-5 text-gray-600" />
                  )}
                  <h3 className="font-medium dark:text-white">
                    {deadline.document_type} - {deadline.fiscal_year}
                  </h3>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Deadline</p>
                    <p className="font-medium dark:text-white">{FormatterUtils.formatDate(deadline.submission_deadline)}</p>
                  </div>

                  {!deadline.is_submitted && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Jours restants</p>
                      <p className={`font-medium ${daysUntil < 0 ? 'text-red-600' : 'dark:text-white'}`}>
                        {daysUntil > 0 ? `${daysUntil} jour(s)` : `${Math.abs(daysUntil)} jour(s) en retard`}
                      </p>
                    </div>
                  )}

                  {deadline.is_submitted && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Soumis le</p>
                      <p className="font-medium dark:text-white">
                        {deadline.submission_date ? FormatterUtils.formatDate(deadline.submission_date) : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="ml-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    deadline.is_submitted
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                      : deadline.is_accepted
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                        : overdue
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                          : upcoming
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300'
                  }`}
                >
                  {deadline.is_submitted ? 'Soumis' : deadline.is_accepted ? 'Accepté' : overdue ? 'En retard' : 'En attente'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
