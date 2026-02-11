import React, { useState } from 'react';
import { CommercialAction, CommercialActionFormData, Client, Contact, Opportunity, CrmFilters } from '../../types/crm.types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { NewActionModal } from './NewActionModal';
import { 
  Activity, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Phone, 
  Mail, 
  Calendar, 
  Users, 
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  X,
  Building,
  User,
  Target
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
interface CommercialActionsProps {
  actions: CommercialAction[];
  clients?: Client[];
  contacts?: Contact[];
  opportunities?: Opportunity[];
  loading?: boolean;
  onCreateAction?: ((data: CommercialActionFormData) => Promise<void>) | (() => void);
  onUpdateAction?: (id: string, data: Partial<CommercialActionFormData>) => Promise<void>;
  onDeleteAction?: (id: string) => Promise<void>;
  onFiltersChange?: (filters: CrmFilters) => void;
  filters?: CrmFilters;
}
const CommercialActions: React.FC<CommercialActionsProps> = ({
  actions,
  clients,
  contacts,
  opportunities,
  loading,
  onCreateAction,
  onUpdateAction,
  onDeleteAction,
  onFiltersChange,
  filters
}) => {
  const { t } = useTranslation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [_editingAction, setEditingAction] = useState<CommercialAction | null>(null);

  const actionTypes = [
    { key: 'call', label: t('crm.actionTypes.call'), icon: Phone, color: 'bg-blue-100 text-blue-800' },
    { key: 'email', label: t('crm.actionTypes.email'), icon: Mail, color: 'bg-green-100 text-green-800' },
    { key: 'meeting', label: t('crm.actionTypes.meeting'), icon: Users, color: 'bg-purple-100 text-purple-800' },
    { key: 'task', label: t('crm.actionTypes.task'), icon: CheckCircle, color: 'bg-orange-100 text-orange-800' },
    { key: 'note', label: t('crm.actionTypes.note'), icon: FileText, color: 'bg-gray-100 text-gray-800' },
    { key: 'demo', label: t('crm.actionTypes.demo'), icon: Target, color: 'bg-indigo-100 text-indigo-800' },
    { key: 'proposal', label: t('crm.actionTypes.proposal'), icon: FileText, color: 'bg-yellow-100 text-yellow-800' }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getActionTypeInfo = (type: string) => {
    return actionTypes.find(t => t.key === type) || actionTypes[0];
  };

  const getStatusColor = (status: string) => {
    const colors = {
      planned: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'cancelled':
        return <XCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const isOverdue = (action: CommercialAction) => {
    return action.status === 'planned' && 
           action.due_date && 
           new Date(action.due_date) < new Date();
  };

  const handleFilterChange = (key: keyof CrmFilters, value: string) => {
    onFiltersChange?.({
      ...filters,
      [key]: value || undefined
    });
  };

  const handleCreateAction = () => {
    setEditingAction(null);
    setIsFormOpen(true);
  };

  const handleEditAction = (action: CommercialAction) => {
    setEditingAction(action);
    setIsFormOpen(true);
  };

  const handleMarkAsCompleted = async (actionId: string) => {
    try {
      await onUpdateAction?.(actionId, {
        status: 'completed',
        completed_date: new Date().toISOString()
      } as any);
    } catch (error) {
      logger.error('CommercialActions', 'Error marking action as completed:', error instanceof Error ? error.message : String(error));
    }
  };

  const hasActiveFilters = Object.values(filters || {}).some(value => value && value !== 'all');

  // Calculate stats
  const totalActions = actions.length;
  const completedActions = actions.filter(a => a.status === 'completed').length;
  const plannedActions = actions.filter(a => a.status === 'planned').length;
  const overdueActions = actions.filter(a => isOverdue(a)).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Activity className="w-6 h-6" />
            {t('crm.actions.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{t('crm.actions.description')}</p>
        </div>
        <Button onClick={handleCreateAction}>
          <Plus className="w-4 h-4 mr-2" />
          {t('crm.actions.create')}
        </Button>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('crm.actions.stats.total')}</p>
                <p className="text-2xl font-bold text-blue-600">{totalActions}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('crm.actions.stats.completed')}</p>
                <p className="text-2xl font-bold text-green-600">{completedActions}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('crm.actions.stats.planned')}</p>
                <p className="text-2xl font-bold text-yellow-600">{plannedActions}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('crm.actions.stats.overdue')}</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{overdueActions}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-300" />
              <h3 className="font-medium text-gray-900 dark:text-gray-100">{t('crm.filters.title')}</h3>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFiltersChange?.({})}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
              >
                <X className="w-4 h-4" />
                {t('crm.filters.clear')}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">{t('crm.filters.search')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <Input
                  id="search"
                  placeholder={t('crm.filters.searchActions')}
                  value={filters?.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {/* Type Filter */}
            <div className="space-y-2">
              <Label>{t('crm.filters.type')}</Label>
              <Select
                value={filters?.type || 'all'}
                onValueChange={(value) => handleFilterChange('type', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('crm.filters.allTypes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('crm.filters.allTypes')}</SelectItem>
                  {actionTypes.map((type) => (
                    <SelectItem key={type.key} value={type.key}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Status Filter */}
            <div className="space-y-2">
              <Label>{t('crm.filters.status')}</Label>
              <Select
                value={filters?.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('crm.filters.allStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('crm.filters.allStatuses')}</SelectItem>
                  <SelectItem value="planned">{t('crm.actionStatus.planned')}</SelectItem>
                  <SelectItem value="completed">{t('crm.actionStatus.completed')}</SelectItem>
                  <SelectItem value="cancelled">{t('crm.actionStatus.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Priority Filter */}
            <div className="space-y-2">
              <Label>{t('crm.filters.priority')}</Label>
              <Select
                value={filters?.priority || 'all'}
                onValueChange={(value) => handleFilterChange('priority', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('crm.filters.allPriorities')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('crm.filters.allPriorities')}</SelectItem>
                  <SelectItem value="high">{t('crm.priority.high')}</SelectItem>
                  <SelectItem value="medium">{t('crm.priority.medium')}</SelectItem>
                  <SelectItem value="low">{t('crm.priority.low')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="date_from">{t('crm.filters.dateFrom')}</Label>
              <Input
                id="date_from"
                type="date"
                value={filters?.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Actions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('crm.actionsTable.type')}</TableHead>
                  <TableHead>{t('crm.actionsTable.title')}</TableHead>
                  <TableHead>{t('crm.actionsTable.client')}</TableHead>
                  <TableHead>{t('crm.actionsTable.contact')}</TableHead>
                  <TableHead>{t('crm.actionsTable.status')}</TableHead>
                  <TableHead>{t('crm.actionsTable.priority')}</TableHead>
                  <TableHead>{t('crm.actionsTable.dueDate')}</TableHead>
                  <TableHead>{t('crm.actionsTable.assigned')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions.map((action) => {
                  const typeInfo = getActionTypeInfo(action.type);
                  const Icon = typeInfo.icon;
                  const overdue = isOverdue(action);
                  return (
                    <TableRow key={action.id} className={`hover:bg-gray-50 ${overdue ? 'bg-red-50' : ''}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-full ${typeInfo.color}`}>
                            <Icon className="w-3 h-3" />
                          </div>
                          <span className="text-sm">{typeInfo.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{action.title}</p>
                          {action.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-300 truncate max-w-xs">
                              {action.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {action.client_name && (
                          <div className="flex items-center gap-1">
                            <Building className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                            <span className="text-sm">{action.client_name}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {action.contact_name && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                            <span className="text-sm">{action.contact_name}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(action.status)}>
                          {getStatusIcon(action.status)}
                          <span className="ml-1">{t(`crm.actionStatus.${action.status}`)}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPriorityColor(action.priority)}>
                          {t(`crm.priority.${action.priority}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {action.due_date && (
                          <div className={`text-sm ${overdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(action.due_date)}
                            </div>
                            {overdue && (
                              <div className="text-xs text-red-500 mt-1">
                                {t('crm.actions.overdue')}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{action.assigned_to || '-'}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {action.status === 'planned' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsCompleted(action.id)}
                              className="text-green-600 hover:text-green-700 dark:text-green-400"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAction(action)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteAction?.(action.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* Action Form Dialog */}
      <NewActionModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        clients={clients || []}
        contacts={contacts || []}
        opportunities={opportunities || []}
        onCreateAction={async (data) => {
          try {
            await onCreateAction?.(data);
            return true;
          } catch (error) {
            logger.error('CommercialActions', 'Failed to create action:', error);
            return false;
          }
        }}
        onSuccess={() => {
          setEditingAction(null);
        }}
      />
    </div>
  );
};
export default CommercialActions;