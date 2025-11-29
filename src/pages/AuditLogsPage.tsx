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

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { auditService } from '@/services/auditService';
import type { AuditAction, SecurityLevel } from '@/services/auditService';
import { Shield, Calendar, User, Database, Filter, Download, RefreshCw, AlertTriangle } from 'lucide-react';

interface AuditLog {
  id: string;
  event_type: AuditAction;
  table_name: string | null;
  record_id: string | null;
  user_id: string | null;
  user_email: string | null;
  company_id: string | null;
  old_values: any;
  new_values: any;
  changed_fields: string[] | null;
  security_level: SecurityLevel;
  compliance_tags: string[];
  ip_address: string | null;
  user_agent: string | null;
  event_timestamp: string;
}

export const AuditLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentCompany, user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [filters, setFilters] = useState({
    event_type: '',
    table_name: '',
    security_level: '',
    user_id: '',
    start_date: '',
    end_date: '',
    limit: 100
  });

  const [showFilters, setShowFilters] = useState(false);

  // Charger les logs
  const loadLogs = async () => {
    if (!currentCompany?.id) return;

    try {
      setLoading(true);
      setError(null);

      const options: any = {
        limit: filters.limit || 100
      };

      if (filters.event_type) options.event_type = filters.event_type;
      if (filters.table_name) options.table_name = filters.table_name;
      if (filters.security_level) options.security_level = filters.security_level;
      if (filters.user_id) options.user_id = filters.user_id;
      if (filters.start_date) options.start_date = filters.start_date;
      if (filters.end_date) options.end_date = filters.end_date;

      const data = await auditService.getCompanyLogs(currentCompany.id, options);
      setLogs(data || []);
    } catch (err) {
      console.error('Erreur chargement logs:', err);
      setError(t('auditLogs.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [currentCompany?.id]);

  // Export CSV
  const exportToCSV = () => {
    if (logs.length === 0) return;

    const headers = ['Date', 'Action', 'Table', 'Utilisateur', 'Niveau', 'Détails'];
    const rows = logs.map(log => [
      new Date(log.event_timestamp).toLocaleString('fr-FR'),
      log.event_type,
      log.table_name || '-',
      log.user_email || log.user_id || '-',
      log.security_level,
      JSON.stringify(log.new_values || log.old_values || {})
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-logs-${currentCompany?.name}-${Date.now()}.csv`;
    link.click();
  };

  // Badge de niveau de sécurité
  const SecurityBadge: React.FC<{ level: SecurityLevel }> = ({ level }) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700',
      standard: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[level]}`}>
        {level.toUpperCase()}
      </span>
    );
  };

  // Badge d'action
  const ActionBadge: React.FC<{ action: AuditAction }> = ({ action }) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-700',
      UPDATE: 'bg-blue-100 text-blue-700',
      DELETE: 'bg-red-100 text-red-700',
      VIEW: 'bg-gray-100 text-gray-700',
      LOGIN: 'bg-purple-100 text-purple-700',
      LOGOUT: 'bg-purple-100 text-purple-700',
      RGPD_EXPORT: 'bg-yellow-100 text-yellow-700',
      RGPD_DELETE_ACCOUNT: 'bg-red-100 text-red-700'
    };

    const color = colors[action] || 'bg-gray-100 text-gray-700';

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
        {action}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">{t('auditLogs.loginRequired')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              {t('auditLogs.title')}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('auditLogs.subtitle', { company: currentCompany?.name || t('common.yourCompany', 'votre entreprise') })}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <Filter size={16} />
              {t('auditLogs.filters')}
            </button>
            <button
              type="button"
              onClick={loadLogs}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {t('auditLogs.refresh')}
            </button>
            <button
              type="button"
              onClick={exportToCSV}
              disabled={logs.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Download size={16} />
              {t('auditLogs.exportCsv')}
            </button>
          </div>
        </div>

        {/* Filtres */}
        {showFilters && (
          <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">{t('auditLogs.searchFilters')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auditLogs.filterLabels.actionType')}
                </label>
                <select
                  value={filters.event_type}
                  onChange={(e) => setFilters({ ...filters, event_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  title={t('auditLogs.filterLabels.actionType')}
                >
                  <option value="">{t('auditLogs.filterLabels.all')}</option>
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                  <option value="LOGIN">LOGIN</option>
                  <option value="LOGOUT">LOGOUT</option>
                  <option value="RGPD_EXPORT">RGPD_EXPORT</option>
                  <option value="RGPD_DELETE_ACCOUNT">RGPD_DELETE_ACCOUNT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auditLogs.filterLabels.table')}
                </label>
                <input
                  type="text"
                  value={filters.table_name}
                  onChange={(e) => setFilters({ ...filters, table_name: e.target.value })}
                  placeholder={t('auditLogs.filterLabels.tablePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  title={t('auditLogs.filterLabels.table')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auditLogs.filterLabels.securityLevel')}
                </label>
                <select
                  value={filters.security_level}
                  onChange={(e) => setFilters({ ...filters, security_level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  title={t('auditLogs.filterLabels.securityLevel')}
                >
                  <option value="">{t('auditLogs.filterLabels.all')}</option>
                  <option value="low">{t('auditLogs.securityLevels.low')}</option>
                  <option value="standard">{t('auditLogs.securityLevels.standard')}</option>
                  <option value="high">{t('auditLogs.securityLevels.high')}</option>
                  <option value="critical">{t('auditLogs.securityLevels.critical')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auditLogs.filterLabels.startDate')}
                </label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  title={t('auditLogs.filterLabels.startDate')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auditLogs.filterLabels.endDate')}
                </label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  title={t('auditLogs.filterLabels.endDate')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auditLogs.filterLabels.limit')}
                </label>
                <select
                  value={filters.limit}
                  onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  title={t('auditLogs.filterLabels.limit')}
                >
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="500">500</option>
                  <option value="1000">1000</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={loadLogs}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {t('auditLogs.applyFilters')}
            </button>
          </div>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">{t('auditLogs.error')}</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('auditLogs.stats.total')}</p>
              <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
            </div>
            <Database className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('auditLogs.stats.critical')}</p>
              <p className="text-2xl font-bold text-red-600">
                {logs.filter(l => l.security_level === 'critical' || l.security_level === 'high').length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('auditLogs.stats.uniqueUsers')}</p>
              <p className="text-2xl font-bold text-purple-600">
                {new Set(logs.map(l => l.user_id).filter(Boolean)).size}
              </p>
            </div>
            <User className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('auditLogs.stats.today')}</p>
              <p className="text-2xl font-bold text-green-600">
                {logs.filter(l => {
                  const logDate = new Date(l.event_timestamp);
                  const today = new Date();
                  return logDate.toDateString() === today.toDateString();
                }).length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Table des logs */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{t('auditLogs.noLogs')}</p>
            <p className="text-sm text-gray-400 mt-2">
              {t('auditLogs.noLogsDesc')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('auditLogs.columns.datetime')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('auditLogs.columns.action')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('auditLogs.columns.table')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('auditLogs.columns.user')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('auditLogs.columns.level')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('auditLogs.columns.details')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.event_timestamp).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ActionBadge action={log.event_type} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.table_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {log.user_email || log.user_id?.substring(0, 8) || t('auditLogs.detailsPanel.system')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SecurityBadge level={log.security_level} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                      <details className="cursor-pointer">
                        <summary className="text-blue-600 hover:text-blue-800">
                          {t('auditLogs.columns.viewDetails')}
                        </summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                          {log.changed_fields && log.changed_fields.length > 0 && (
                            <div className="mb-2">
                              <strong>{t('auditLogs.detailsPanel.changedFields')}</strong> {log.changed_fields.join(', ')}
                            </div>
                          )}
                          {log.old_values && (
                            <div className="mb-2">
                              <strong>{t('auditLogs.detailsPanel.oldValues')}</strong>
                              <pre className="text-xs mt-1 overflow-x-auto">
                                {JSON.stringify(log.old_values, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.new_values && (
                            <div>
                              <strong>{t('auditLogs.detailsPanel.newValues')}</strong>
                              <pre className="text-xs mt-1 overflow-x-auto">
                                {JSON.stringify(log.new_values, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.ip_address && (
                            <div className="mt-2 text-xs text-gray-500">
                              {t('auditLogs.detailsPanel.ip')} {log.ip_address}
                            </div>
                          )}
                          {log.compliance_tags && log.compliance_tags.length > 0 && (
                            <div className="mt-2">
                              <strong className="text-xs">{t('auditLogs.detailsPanel.compliance')}</strong>
                              <div className="flex gap-1 mt-1">
                                {log.compliance_tags.map((tag, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note de conformité */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          📋 {t('auditLogs.compliance.title')}
        </h3>
        <p className="text-sm text-blue-700">
          {t('auditLogs.compliance.description')}
        </p>
      </div>
    </div>
  );
};

export default AuditLogsPage;
