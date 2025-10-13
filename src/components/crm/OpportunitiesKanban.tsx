import React, { useState } from 'react';
import { Opportunity, OpportunityFormData, Client, Contact } from '../../types/crm.types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  // DollarSign, 
  Calendar, 
  User, 
  Building,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EntitySelector, type EntityOption, type EntityFormField } from '../common/EntitySelector';
import { thirdPartiesService } from '../../services/thirdPartiesService';
import { useAuth } from '../../contexts/AuthContext';
import { useHR } from '../../hooks/useHR';
import { hrService } from '../../services/hrService';

interface OpportunitiesKanbanProps {
  opportunities: Opportunity[];
  clients: Client[];
  contacts: Contact[];
  loading: boolean;
  onCreateOpportunity: (data: OpportunityFormData) => Promise<void>;
  onUpdateOpportunity: (id: string, data: Partial<OpportunityFormData>) => Promise<void>;
  onDeleteOpportunity: (id: string) => Promise<void>;
}

const OpportunitiesKanban: React.FC<OpportunitiesKanbanProps> = ({
  opportunities,
  clients,
  contacts,
  loading,
  onCreateOpportunity,
  onUpdateOpportunity,
  onDeleteOpportunity
}) => {
  const { t } = useTranslation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [_selectedStage, setSelectedStage] = useState<string>('');

  const { currentCompany } = useAuth();

  // Use HR hook to get employees and creation methods
  const { employees, createEmployee, fetchEmployees } = useHR();

  const [formData, setFormData] = useState<OpportunityFormData>({
    title: '',
    description: '',
    client_id: '',
    contact_id: '',
    stage: 'prospecting',
    value: 0,
    probability: 50,
    expected_close_date: '',
    source: '',
    assigned_to: '',
    priority: 'medium',
    tags: [],
    next_action: '',
    next_action_date: ''
  });

  const stages = [
    { key: 'prospecting', label: t('crm.stages.prospecting'), color: 'bg-blue-500' },
    { key: 'qualification', label: t('crm.stages.qualification'), color: 'bg-yellow-500' },
    { key: 'proposal', label: t('crm.stages.proposal'), color: 'bg-purple-500' },
    { key: 'negotiation', label: t('crm.stages.negotiation'), color: 'bg-orange-500' },
    { key: 'closing', label: t('crm.stages.closing'), color: 'bg-green-500' }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-3 h-3" />;
      case 'medium':
        return <Target className="w-3 h-3" />;
      case 'low':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return <Target className="w-3 h-3" />;
    }
  };

  const getOpportunitiesByStage = (stage: string) => {
    return opportunities.filter(opp => opp.stage === stage);
  };

  const getStageStats = (stage: string) => {
    const stageOpps = getOpportunitiesByStage(stage);
    const totalValue = stageOpps.reduce((sum, opp) => sum + opp.value, 0);
    return {
      count: stageOpps.length,
      value: totalValue
    };
  };

  const handleCreateOpportunity = (stage?: string) => {
    setEditingOpportunity(null);
    setSelectedStage(stage || 'prospecting');
    setFormData({
      title: '',
      description: '',
      client_id: '',
      contact_id: '',
      stage: (stage as any) || 'prospecting',
      value: 0,
      probability: 50,
      expected_close_date: '',
      source: '',
      assigned_to: '',
      priority: 'medium',
      tags: [],
      next_action: '',
      next_action_date: ''
    });
    setIsFormOpen(true);
  };

  const handleEditOpportunity = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
    setFormData({
      title: opportunity.title,
      description: opportunity.description || '',
      client_id: opportunity.client_id,
      contact_id: opportunity.contact_id || '',
      stage: opportunity.stage as any,
      value: opportunity.value,
      probability: opportunity.probability,
      expected_close_date: opportunity.expected_close_date,
      source: opportunity.source || '',
      assigned_to: opportunity.assigned_to || '',
      priority: opportunity.priority,
      tags: opportunity.tags || [],
      next_action: opportunity.next_action || '',
      next_action_date: opportunity.next_action_date || ''
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOpportunity) {
        await onUpdateOpportunity(editingOpportunity.id, formData);
      } else {
        await onCreateOpportunity(formData);
      }
      setIsFormOpen(false);
      setEditingOpportunity(null);
    } catch (error) {
      console.error('Error submitting opportunity form:', error);
    }
  };

  const handleStageChange = async (opportunityId: string, newStage: string) => {
    try {
      await onUpdateOpportunity(opportunityId, { stage: newStage as any });
    } catch (error) {
      console.error('Error updating opportunity stage:', error);
    }
  };

  const handleCreateEmployee = async (employeeData: Record<string, any>) => {
    try {
      if (!currentCompany) {
        throw new Error('No current company selected');
      }

      const success = await createEmployee({
        employee_number: employeeData.employee_number || `EMP${Date.now()}`,
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
        email: employeeData.email || '',
        phone: employeeData.phone || '',
        position: employeeData.position || '',
        department: employeeData.department || '',
        hire_date: employeeData.hire_date || new Date().toISOString().split('T')[0],
        salary: employeeData.salary || 0,
        contract_type: employeeData.contract_type || 'permanent',
        status: 'active'
      });

      if (success) {
        // Refresh employees list
        await fetchEmployees();
        return { success: true, id: 'new-employee-id' }; // We'll get the actual ID from the refreshed data
      } else {
        throw new Error('Failed to create employee');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const clientCreateFormFields: EntityFormField[] = [
    {
      name: 'company_name',
      label: t('crm.clientForm.companyName'),
      type: 'text',
      required: true,
      placeholder: t('crm.clientForm.companyNamePlaceholder')
    },
    {
      name: 'email',
      label: t('crm.clientForm.email'),
      type: 'email',
      required: false,
      placeholder: t('crm.clientForm.emailPlaceholder')
    },
    {
      name: 'phone',
      label: t('crm.clientForm.phone'),
      type: 'text',
      required: false,
      placeholder: t('crm.clientForm.phonePlaceholder')
    },
    {
      name: 'address',
      label: t('crm.clientForm.address'),
      type: 'text',
      required: false,
      placeholder: t('crm.clientForm.addressPlaceholder')
    }
  ];

  const clientOptions: EntityOption[] = clients.map(client => ({
    id: client.id,
    label: client.company_name,
    sublabel: client.website || undefined
  }));

  const handleCreateClient = async (clientData: Record<string, any>) => {
    try {
      if (!currentCompany?.id) {
        return { success: false, error: 'Aucune entreprise sélectionnée' };
      }

      const result = await thirdPartiesService.createThirdParty({
        type: 'customer',
        name: clientData.company_name,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        city: clientData.city || '',
        postal_code: clientData.postal_code || '',
        country: 'FR'
      });

      if (result) {
        // TODO: Rafraîchir la liste des clients
        // Il faudrait ajouter une fonction pour recharger les clients depuis le parent
        return { success: true, id: result.id };
      }

      return { success: false, error: 'Échec de la création du client' };
    } catch (error) {
      console.error('Error creating client:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const getClientContacts = (clientId: string) => {
    if (!clientId) return [];
    return contacts.filter(contact => contact.client_id === clientId);
  };

  const employeeCreateFormFields: EntityFormField[] = [
    {
      name: 'first_name',
      label: t('hr.employeeForm.firstName'),
      type: 'text',
      required: true,
      placeholder: t('hr.employeeForm.firstNamePlaceholder')
    },
    {
      name: 'last_name',
      label: t('hr.employeeForm.lastName'),
      type: 'text',
      required: true,
      placeholder: t('hr.employeeForm.lastNamePlaceholder')
    },
    {
      name: 'email',
      label: t('hr.employeeForm.email'),
      type: 'email',
      required: true,
      placeholder: t('hr.employeeForm.emailPlaceholder')
    },
    {
      name: 'position',
      label: t('hr.employeeForm.position'),
      type: 'text',
      required: true,
      placeholder: t('hr.employeeForm.positionPlaceholder')
    },
    {
      name: 'department',
      label: t('hr.employeeForm.department'),
      type: 'text',
      required: true,
      placeholder: t('hr.employeeForm.departmentPlaceholder')
    }
  ];

  const employeeOptions: EntityOption[] = employees.map(employee => ({
    id: employee.id,
    label: employee.full_name || `${employee.first_name} ${employee.last_name}`,
    sublabel: employee.position || undefined
  }));

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {stages.map((stage) => (
          <Card key={stage.key} className="h-96">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            {t('crm.opportunities.title')}
          </h2>
          <p className="text-gray-600 mt-1">{t('crm.opportunities.description')}</p>
        </div>
        <Button onClick={() => handleCreateOpportunity()}>
          <Plus className="w-4 h-4 mr-2" />
          {t('crm.opportunities.create')}
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 overflow-x-auto">
        {stages.map((stage) => {
          const stageOpportunities = getOpportunitiesByStage(stage.key);
          const stageStats = getStageStats(stage.key);

          return (
            <Card key={stage.key} className="min-h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    <span className="text-sm font-medium">{stage.label}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {stageStats.count}
                  </Badge>
                </CardTitle>
                <div className="text-xs text-gray-600">
                  {formatCurrency(stageStats.value)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCreateOpportunity(stage.key)}
                  className="mt-2 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {t('crm.opportunities.add')}
                </Button>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 p-3">
                {stageOpportunities.map((opportunity) => (
                  <Card 
                    key={opportunity.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
                    style={{ borderLeftColor: stage.color.replace('bg-', '#') }}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        {/* Title and Value */}
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium line-clamp-2 flex-1">
                            {opportunity.title}
                          </h4>
                          <div className="ml-2 text-right">
                            <div className="text-sm font-bold text-green-600">
                              {formatCurrency(opportunity.value)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {opportunity.probability}%
                            </div>
                          </div>
                        </div>

                        {/* Client */}
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Building className="w-3 h-3" />
                          <span className="truncate">{opportunity.client_name}</span>
                        </div>

                        {/* Contact */}
                        {opportunity.contact_name && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <User className="w-3 h-3" />
                            <span className="truncate">{opportunity.contact_name}</span>
                          </div>
                        )}

                        {/* Expected Close Date */}
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(opportunity.expected_close_date)}</span>
                        </div>

                        {/* Priority Badge */}
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={getPriorityColor(opportunity.priority)} size="sm">
                            {getPriorityIcon(opportunity.priority)}
                            <span className="ml-1">{t(`crm.priority.${opportunity.priority}`)}</span>
                          </Badge>
                        </div>

                        {/* Next Action */}
                        {opportunity.next_action && (
                          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                            <div className="font-medium">{t('crm.opportunities.nextAction')}:</div>
                            <div className="truncate">{opportunity.next_action}</div>
                            {opportunity.next_action_date && (
                              <div className="text-gray-500 mt-1">
                                {formatDate(opportunity.next_action_date)}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tags */}
                        {opportunity.tags && opportunity.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {opportunity.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                                {tag}
                              </Badge>
                            ))}
                            {opportunity.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                +{opportunity.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditOpportunity(opportunity)}
                              className="text-blue-600 hover:text-blue-700 p-1"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteOpportunity(opportunity.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <Select
                            value={opportunity.stage}
                            onValueChange={(value) => handleStageChange(opportunity.id, value)}
                          >
                            <SelectTrigger className="w-20 h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {stages.map((s) => (
                                <SelectItem key={s.key} value={s.key} className="text-xs">
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Opportunity Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOpportunity ? t('crm.opportunityForm.editTitle') : t('crm.opportunityForm.createTitle')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('crm.opportunityForm.title')} *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t('crm.opportunityForm.stage')}</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value: any) => setFormData({...formData, stage: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.key} value={stage.key}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('crm.opportunityForm.client')} *</Label>
                <EntitySelector
                  options={clientOptions}
                  value={formData.client_id}
                  onChange={(value) => setFormData({...formData, client_id: value, contact_id: ''})}
                  onCreateEntity={handleCreateClient}
                  createFormFields={clientCreateFormFields}
                  entityName={t('crm.clientForm.client')}
                  entityNamePlural={t('crm.clientForm.clients')}
                  placeholder={t('crm.opportunityForm.selectClient')}
                  canCreate={true}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('crm.opportunityForm.contact')}</Label>
                <Select
                  value={formData.contact_id}
                  onValueChange={(value) => setFormData({...formData, contact_id: value})}
                  disabled={!formData.client_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('crm.opportunityForm.selectContact')} />
                  </SelectTrigger>
                  <SelectContent>
                    {getClientContacts(formData.client_id).map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">{t('crm.opportunityForm.value')} * (€)</Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.value || ''}
                  onChange={(e) => setFormData({...formData, value: parseFloat(e.target.value) || 0})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="probability">{t('crm.opportunityForm.probability')} (%)</Label>
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) => setFormData({...formData, probability: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_close_date">{t('crm.opportunityForm.expectedCloseDate')} *</Label>
                <Input
                  id="expected_close_date"
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => setFormData({...formData, expected_close_date: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t('crm.opportunityForm.priority')}</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({...formData, priority: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('crm.priority.low')}</SelectItem>
                    <SelectItem value="medium">{t('crm.priority.medium')}</SelectItem>
                    <SelectItem value="high">{t('crm.priority.high')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">{t('crm.opportunityForm.source')}</Label>
                <Input
                  id="source"
                  value={formData.source}
                  onChange={(e) => setFormData({...formData, source: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('crm.opportunityForm.assignedTo')}</Label>
                <EntitySelector
                  options={employeeOptions}
                  value={formData.assigned_to}
                  onChange={(value) => setFormData({...formData, assigned_to: value})}
                  onCreateEntity={handleCreateEmployee}
                  createFormFields={employeeCreateFormFields}
                  entityName={t('hr.employee.entityName')}
                  entityNamePlural={t('hr.employee.entityNamePlural')}
                  placeholder={t('crm.opportunityForm.assignedToPlaceholder')}
                  canCreate={true}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('crm.opportunityForm.description')}</Label>
              <Textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="next_action">{t('crm.opportunityForm.nextAction')}</Label>
                <Input
                  id="next_action"
                  value={formData.next_action}
                  onChange={(e) => setFormData({...formData, next_action: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="next_action_date">{t('crm.opportunityForm.nextActionDate')}</Label>
                <Input
                  id="next_action_date"
                  type="date"
                  value={formData.next_action_date}
                  onChange={(e) => setFormData({...formData, next_action_date: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                {editingOpportunity ? t('common.update') : t('common.create')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OpportunitiesKanban;