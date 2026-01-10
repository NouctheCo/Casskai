/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */
/**
 * 🛡️ Dashboard Admin RGPD
 * 
 * Monitoring des activités RGPD :
 * - Métriques (exports, suppressions, temps de réponse)
 * - Logs d'audit détaillés
 * - Alertes conformité
 * 
 * ⚠️ Accès : super-admin uniquement
 */
import { useState, useEffect } from 'react';
import { Shield, Download, Trash2, Clock, AlertTriangle, CheckCircle, TrendingUp, FileText, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
interface RGPDMetrics {
  total_exports: number;
  total_deletions: number;
  avg_export_time_seconds: number;
  avg_deletion_time_seconds: number;
  exports_last_30_days: number;
  deletions_last_30_days: number;
  pending_requests: number;
}
interface RGPDLog {
  id: string;
  user_id: string;
  user_email: string;
  action_type: 'export' | 'delete' | 'consent_update';
  status: 'success' | 'error' | 'pending';
  created_at: string;
  execution_time_ms: number;
  error_message?: string;
}
export default function RGPDAdminDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<RGPDMetrics | null>(null);
  const [logs, setLogs] = useState<RGPDLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'export' | 'delete' | 'consent'>('all');
  useEffect(() => {
    loadMetrics();
    loadLogs();
  }, [filter]);
  const loadMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('rgpd_audit_summary')
        .select('*')
        .single();
      if (error) throw error;
      setMetrics(data);
    } catch (error) {
      logger.error('RGPDAdminDashboard', 'Error loading RGPD metrics:', error);
    }
  };
  const loadLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('rgpd_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (filter !== 'all') {
        query = query.eq('action_type', filter);
      }
      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      logger.error('RGPDAdminDashboard', 'Error loading RGPD logs:', error);
    } finally {
      setLoading(false);
    }
  };
  const exportLogs = () => {
    const csv = [
      ['Date', 'User Email', 'Action', 'Status', 'Temps (ms)', 'Erreur'].join(','),
      ...logs.map(log => [
        new Date(log.created_at).toLocaleString('fr-FR'),
        log.user_email,
        log.action_type,
        log.status,
        log.execution_time_ms,
        log.error_message || ''
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rgpd_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-2">
            Accès Refusé
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Vous devez être super-admin pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
              Dashboard RGPD
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Monitoring des activités de protection des données
          </p>
        </div>
        {/* Metrics Cards */}
        {metrics && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {/* Total Exports */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-1">
                {metrics.total_exports}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-2">
                Exports totaux
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                +{metrics.exports_last_30_days} derniers 30j
              </div>
            </div>
            {/* Total Deletions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-1">
                {metrics.total_deletions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-2">
                Suppressions totales
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                +{metrics.deletions_last_30_days} derniers 30j
              </div>
            </div>
            {/* Avg Export Time */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-1">
                {metrics.avg_export_time_seconds.toFixed(1)}s
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-2">
                Temps moyen export
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-300">
                Objectif RGPD: &lt; 30s
              </div>
            </div>
            {/* Pending Requests */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                {metrics.pending_requests > 0 && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                )}
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-1">
                {metrics.pending_requests}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-2">
                Requêtes en attente
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-300">
                Délai max: 30 jours
              </div>
            </div>
          </div>
        )}
        {/* Alerts Section */}
        {metrics && (metrics.pending_requests > 5 || metrics.avg_export_time_seconds > 25) && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-4 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-200 mb-1">
                  Alertes de conformité
                </h3>
                <ul className="text-sm text-orange-800 dark:text-orange-300 space-y-1">
                  {metrics.pending_requests > 5 && (
                    <li>⚠️ Plus de 5 requêtes en attente - Risque de non-conformité RGPD</li>
                  )}
                  {metrics.avg_export_time_seconds > 25 && (
                    <li>⚠️ Temps d'export proche de la limite (30s) - Optimisation recommandée</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
        {/* Filters & Export */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
                Logs d'audit ({logs.length})
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'export' | 'delete' | 'consent')}
                aria-label="Filtrer les logs d'audit"
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:text-white rounded-lg border-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes les actions</option>
                <option value="export">Exports uniquement</option>
                <option value="delete">Suppressions uniquement</option>
                <option value="consent">Consentements uniquement</option>
              </select>
              {/* Export Button */}
              <button
                onClick={exportLogs}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Exporter CSV
              </button>
            </div>
          </div>
        </div>
        {/* Logs Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 dark:text-gray-300 mt-4">Chargement des logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <Eye className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">Aucun log disponible</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wider">
                      Temps
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wider">
                      Détails
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 dark:text-white">
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {log.user_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.action_type === 'export' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : log.action_type === 'delete'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        }`}>
                          {log.action_type === 'export' ? '📥 Export' : log.action_type === 'delete' ? '🗑️ Suppression' : '✅ Consentement'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.status === 'success'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : log.status === 'error'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {log.status === 'success' ? '✓ Succès' : log.status === 'error' ? '✗ Erreur' : '⏳ En attente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {(log.execution_time_ms / 1000).toFixed(2)}s
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {log.error_message || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-300">
          <p>
            📊 Les métriques sont mises à jour en temps réel via la vue <code>rgpd_audit_summary</code>
          </p>
          <p className="mt-2">
            🔒 Accès réservé aux super-admins • Logs conservés 36 mois (obligation légale)
          </p>
        </div>
      </div>
    </div>
  );
}