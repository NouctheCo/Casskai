/**
 * Security Logs Dashboard
 *
 * Centralized dashboard for viewing and analyzing security logs
 * Features:
 * - Real-time security event monitoring
 * - Filtering by type, severity, user, date
 * - Export capabilities
 * - Activity statistics
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/useToast';
import {
  Shield,
  AlertTriangle,
  Activity,
  Download,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Lock,
  Unlock,
  FileText,
  User,
  Calendar
} from 'lucide-react';
import {
  searchSecurityLogs,
  getSecurityStats,
  type SecurityLog,
  type SecurityStats
} from '@/services/securityLogService';
import { auditService } from '@/services/auditService';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';
interface SecurityLogsDashboardProps {
  companyId: string;
}
type SeverityFilter = 'all' | 'info' | 'warning' | 'error' | 'critical';
type CategoryFilter = 'all' | 'authentication' | 'export' | 'modification' | 'access' | 'admin';
// Helper functions pour mapper audit_logs → security_logs
function mapEventType(auditType: string): any {
  const map: Record<string, string> = {
    'LOGIN': 'login',
    'LOGOUT': 'logout',
    'DELETE': 'delete',
    'CREATE': 'modification',
    'UPDATE': 'modification',
    'VIEW': 'access',
    'RGPD_EXPORT': 'export'
  };
  return map[auditType] || 'access';
}

function mapCategory(auditType: string): any {
  const map: Record<string, string> = {
    'LOGIN': 'authentication',
    'LOGOUT': 'authentication',
    'RGPD_EXPORT': 'export',
    'DELETE': 'modification',
    'CREATE': 'modification',
    'UPDATE': 'modification',
    'VIEW': 'access'
  };
  return map[auditType] || 'access';
}

function mapSeverity(securityLevel: string): any {
  const map: Record<string, string> = {
    'low': 'info',
    'standard': 'info',
    'high': 'warning',
    'critical': 'critical'
  };
  return map[securityLevel] || 'info';
}

export function SecurityLogsDashboard({ companyId }: SecurityLogsDashboardProps) {
  const { showToast } = useToast();
  // State
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);
  // Load data
  useEffect(() => {
    loadData();
  }, [companyId, severityFilter, categoryFilter, startDate, endDate]);
  const loadData = async () => {
    setLoading(true);
    try {
      // Build filters
      const filters: any = { companyId };
      if (severityFilter !== 'all') {
        filters.severity = severityFilter;
      }
      if (categoryFilter !== 'all') {
        filters.category = categoryFilter;
      }
      if (startDate) {
        filters.startDate = startDate;
      }
      if (endDate) {
        filters.endDate = endDate;
      }

      // ✅ DEBUG: Log filters
      logger.info('SecurityLogsDashboard', '=== LOADING SECURITY LOGS ===', {
        companyId,
        filters,
        severityFilter,
        categoryFilter,
        startDate,
        endDate
      });

      // ✅ FIX: Utiliser audit_logs au lieu de security_logs (qui est vide)
      const auditLogs = await auditService.getCompanyLogs(companyId, {
        limit: filters.limit || 100,
        start_date: filters.startDate,
        end_date: filters.endDate
      });

      // Convertir audit_logs en format SecurityLog
      const convertedLogs: SecurityLog[] = auditLogs.map(log => ({
        id: log.id,
        company_id: log.company_id || undefined,
        event_type: mapEventType(log.event_type),
        event_category: mapCategory(log.event_type),
        severity: mapSeverity(log.security_level),
        user_email: log.user_email || undefined,
        action: log.event_type,
        description: `${log.table_name || ''} ${log.record_id || ''}`.trim() || 'Action système',
        resource_type: log.table_name || undefined,
        resource_id: log.record_id || undefined,
        success: true,
        ip_address: log.ip_address || undefined,
        created_at: log.event_timestamp
      }));

      // ✅ DEBUG: Log results
      logger.info('SecurityLogsDashboard', '=== SECURITY LOGS LOADED ===', {
        logsCount: convertedLogs.length,
        firstLog: convertedLogs[0]
      });

      setLogs(convertedLogs);
      // Stats simplifiées depuis les logs
      setStats({
        total_events: convertedLogs.length,
        by_severity: {
          info: convertedLogs.filter(l => l.severity === 'info').length,
          warning: convertedLogs.filter(l => l.severity === 'warning').length,
          error: convertedLogs.filter(l => l.severity === 'error').length,
          critical: convertedLogs.filter(l => l.severity === 'critical').length
        },
        failed_actions: 0,
        pending_reviews: 0,
        unique_users: new Set(convertedLogs.map(l => l.user_email).filter(Boolean)).size,
        most_common_events: []
      });
    } catch (error) {
      logger.error('SecurityLogsDashboard', '❌ Error loading security logs:', error);
      showToast('Erreur lors du chargement des logs', 'error');
    } finally {
      setLoading(false);
    }
  };
  // Export logs
  const handleExport = () => {
    try {
      const csv = [
        ['Date', 'Sévérité', 'Catégorie', 'Type', 'Action', 'Description', 'Utilisateur', 'IP'].join(','),
        ...logs.map(log =>
          [
            log.created_at,
            log.severity,
            log.event_category,
            log.event_type,
            log.action,
            log.description,
            log.user_email || 'N/A',
            log.ip_address || 'N/A'
          ].join(',')
        )
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-logs-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Export réussi', 'success');
    } catch (error) {
      showToast('Erreur lors de l\'export', 'error');
    }
  };
  // Severity badge
  const getSeverityBadge = (severity: string) => {
    const colors = {
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      error: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return (
      <Badge className={colors[severity as keyof typeof colors] || colors.info}>
        {severity.toUpperCase()}
      </Badge>
    );
  };
  // Category icon
  const getCategoryIcon = (category: string) => {
    const icons = {
      authentication: <Lock className="w-4 h-4" />,
      export: <Download className="w-4 h-4" />,
      modification: <FileText className="w-4 h-4" />,
      access: <Eye className="w-4 h-4" />,
      admin: <Shield className="w-4 h-4" />
    };
    return icons[category as keyof typeof icons] || <Activity className="w-4 h-4" />;
  };
  // Filtered logs
  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.description?.toLowerCase().includes(query) ||
      log.user_email?.toLowerCase().includes(query) ||
      log.action?.toLowerCase().includes(query)
    );
  });
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Events</p>
                  <p className="text-2xl font-bold">{stats.total_events}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Critical</p>
                  <p className="text-2xl font-bold text-red-600">{stats.by_severity.critical || 0}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Errors</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.by_severity.error || 0}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
                  <p className="text-2xl font-bold">{stats.unique_users}</p>
                </div>
                <User className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Security Logs</span>
            </span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {/* Search */}
            <div className="md:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {/* Severity Filter */}
            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as SeverityFilter)}>
                <SelectTrigger id="severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Category Filter */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="authentication">Authentication</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                  <SelectItem value="modification">Modification</SelectItem>
                  <SelectItem value="access">Access</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Date Range */}
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
          {/* Logs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p>Loading logs...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => setSelectedLog(log)}
                    >
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                      </TableCell>
                      <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(log.event_category)}
                          <span className="capitalize">{log.event_category}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell className="text-sm">{log.user_email || 'System'}</TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {log.description}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* Detail Panel */}
      {selectedLog && (
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Log Details</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600 dark:text-gray-400">Event Type</Label>
                <p className="font-medium">{selectedLog.event_type}</p>
              </div>
              <div>
                <Label className="text-gray-600 dark:text-gray-400">Severity</Label>
                <div className="mt-1">{getSeverityBadge(selectedLog.severity)}</div>
              </div>
              <div>
                <Label className="text-gray-600 dark:text-gray-400">User</Label>
                <p className="font-medium">{selectedLog.user_email || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-gray-600 dark:text-gray-400">IP Address</Label>
                <p className="font-mono text-sm">{selectedLog.ip_address || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-gray-600 dark:text-gray-400">Description</Label>
                <p className="mt-1">{selectedLog.description}</p>
              </div>
              {selectedLog.resource_type && (
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Resource</Label>
                  <p className="font-medium">{selectedLog.resource_type}</p>
                </div>
              )}
              {selectedLog.resource_id && (
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Resource ID</Label>
                  <p className="font-mono text-sm">{selectedLog.resource_id}</p>
                </div>
              )}
              {selectedLog.metadata && (
                <div className="col-span-2">
                  <Label className="text-gray-600 dark:text-gray-400">Metadata</Label>
                  <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}