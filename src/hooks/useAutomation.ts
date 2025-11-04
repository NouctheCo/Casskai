import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { automationService, Workflow, WorkflowExecution, AutomationServiceResponse } from '@/services/automationService';

interface UseAutomationReturn {
  // Data
  workflows: Workflow[];
  activeWorkflows: Workflow[];
  inactiveWorkflows: Workflow[];
  workflowExecutions: Record<string, WorkflowExecution[]>;
  templates: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    template: Omit<Workflow, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'run_count' | 'success_count' | 'error_count'>;
  }>;

  // Loading states
  loading: boolean;
  executionsLoading: Record<string, boolean>;
  templatesLoading: boolean;

  // Error state
  error: string | null;

  // Actions
  fetchWorkflows: () => Promise<void>;
  createWorkflow: (workflowData: Omit<Workflow, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'run_count' | 'success_count' | 'error_count'>) => Promise<boolean>;
  updateWorkflow: (workflowId: string, updates: Partial<Workflow>) => Promise<boolean>;
  deleteWorkflow: (workflowId: string) => Promise<boolean>;
  toggleWorkflow: (workflowId: string, isActive: boolean) => Promise<boolean>;
  executeWorkflow: (workflowId: string) => Promise<boolean>;
  fetchWorkflowExecutions: (workflowId: string) => Promise<void>;
  fetchTemplates: () => Promise<void>;
  createFromTemplate: (templateId: string) => Promise<boolean>;

  // Statistics
  stats: {
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    successRate: number;
  };
}

export function useAutomation(): UseAutomationReturn {
  const { currentCompany } = useAuth();

  // States
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowExecutions, setWorkflowExecutions] = useState<Record<string, WorkflowExecution[]>>({});
  const [templates, setTemplates] = useState<UseAutomationReturn['templates']>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [executionsLoading, setExecutionsLoading] = useState<Record<string, boolean>>({});
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch workflows
  const fetchWorkflows = useCallback(async () => {
    if (!currentCompany?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await automationService.getWorkflows(currentCompany.id);

      if (response.success && response.data) {
        setWorkflows(response.data);
      } else {
        setError(response.error || 'Failed to fetch workflows');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id]);

  // Create workflow
  const createWorkflow = useCallback(async (workflowData: Omit<Workflow, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'run_count' | 'success_count' | 'error_count'>): Promise<boolean> => {
    if (!currentCompany?.id) return false;

    try {
      const response = await automationService.createWorkflow(currentCompany.id, workflowData);

      if (response.success) {
        await fetchWorkflows();
        return true;
      } else {
        setError(response.error || 'Failed to create workflow');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [currentCompany?.id, fetchWorkflows]);

  // Update workflow
  const updateWorkflow = useCallback(async (workflowId: string, updates: Partial<Workflow>): Promise<boolean> => {
    try {
      const response = await automationService.updateWorkflow(workflowId, updates);

      if (response.success) {
        await fetchWorkflows();
        return true;
      } else {
        setError(response.error || 'Failed to update workflow');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [fetchWorkflows]);

  // Delete workflow
  const deleteWorkflow = useCallback(async (workflowId: string): Promise<boolean> => {
    try {
      const response = await automationService.deleteWorkflow(workflowId);

      if (response.success) {
        await fetchWorkflows();
        return true;
      } else {
        setError(response.error || 'Failed to delete workflow');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [fetchWorkflows]);

  // Toggle workflow
  const toggleWorkflow = useCallback(async (workflowId: string, isActive: boolean): Promise<boolean> => {
    try {
      const response = await automationService.toggleWorkflow(workflowId, isActive);

      if (response.success) {
        await fetchWorkflows();
        return true;
      } else {
        setError(response.error || 'Failed to toggle workflow');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [fetchWorkflows]);

  // Execute workflow
  const executeWorkflow = useCallback(async (workflowId: string): Promise<boolean> => {
    try {
      const response = await automationService.executeWorkflow(workflowId);

      if (response.success) {
        await fetchWorkflows();
        await fetchWorkflowExecutions(workflowId);
        return true;
      } else {
        setError(response.error || 'Failed to execute workflow');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [fetchWorkflows]);

  // Fetch workflow executions
  const fetchWorkflowExecutions = useCallback(async (workflowId: string) => {
    setExecutionsLoading(prev => ({ ...prev, [workflowId]: true }));

    try {
      const response = await automationService.getWorkflowExecutions(workflowId);

      if (response.success && response.data) {
        setWorkflowExecutions(prev => ({
          ...prev,
          [workflowId]: response.data!
        }));
      } else {
        setError(response.error || 'Failed to fetch executions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setExecutionsLoading(prev => ({ ...prev, [workflowId]: false }));
    }
  }, []);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);

    try {
      const response = await automationService.getWorkflowTemplates();

      if (response.success && response.data) {
        setTemplates(response.data);
      } else {
        setError(response.error || 'Failed to fetch templates');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  // Create from template
  const createFromTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    if (!currentCompany?.id) return false;

    const template = templates.find(t => t.id === templateId);
    if (!template) {
      setError('Template not found');
      return false;
    }

    return await createWorkflow(template.template);
  }, [currentCompany?.id, templates, createWorkflow]);

  // Computed values
  const activeWorkflows = workflows.filter(w => w.is_active);
  const inactiveWorkflows = workflows.filter(w => !w.is_active);

  const stats = {
    totalWorkflows: workflows.length,
    activeWorkflows: activeWorkflows.length,
    totalExecutions: workflows.reduce((sum, w) => sum + w.run_count, 0),
    successRate: workflows.length > 0
      ? workflows.reduce((sum, w) => sum + (w.run_count > 0 ? w.success_count / w.run_count : 0), 0) / workflows.length * 100
      : 0
  };

  // Initial data load
  useEffect(() => {
    if (currentCompany?.id) {
      fetchWorkflows();
      fetchTemplates();
    }
  }, [currentCompany?.id, fetchWorkflows, fetchTemplates]);

  return {
    // Data
    workflows,
    activeWorkflows,
    inactiveWorkflows,
    workflowExecutions,
    templates,

    // Loading states
    loading,
    executionsLoading,
    templatesLoading,

    // Error
    error,

    // Actions
    fetchWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflow,
    executeWorkflow,
    fetchWorkflowExecutions,
    fetchTemplates,
    createFromTemplate,

    // Statistics
    stats
  };
}
