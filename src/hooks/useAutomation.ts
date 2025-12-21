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

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { automationService, Workflow, WorkflowExecution, WorkflowTemplate } from '@/services/automationService';

interface UseAutomationReturn {
  // Data
  workflows: Workflow[];
  activeWorkflows: Workflow[];
  inactiveWorkflows: Workflow[];
  workflowExecutions: Record<string, WorkflowExecution[]>;
  templates: WorkflowTemplate[];

  // Loading states
  loading: boolean;
  executionsLoading: Record<string, boolean>;
  templatesLoading: boolean;

  // Error state
  error: string | null;

  // Actions
  fetchWorkflows: () => Promise<void>;
  createWorkflow: (workflowData: Omit<Workflow, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'last_run_at' | 'next_run_at' | 'created_by'>) => Promise<boolean>;
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
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);

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
      const data = await automationService.getWorkflows(currentCompany.id);
      setWorkflows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workflows');
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id]);

  // Create workflow
  const createWorkflow = useCallback(async (workflowData: Omit<Workflow, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'last_run_at' | 'next_run_at' | 'created_by'>): Promise<boolean> => {
    if (!currentCompany?.id) return false;

    try {
      await automationService.createWorkflow(currentCompany.id, workflowData);
      await fetchWorkflows();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow');
      return false;
    }
  }, [currentCompany?.id, fetchWorkflows]);

  // Update workflow
  const updateWorkflow = useCallback(async (workflowId: string, updates: Partial<Workflow>): Promise<boolean> => {
    try {
      await automationService.updateWorkflow(workflowId, updates);
      await fetchWorkflows();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workflow');
      return false;
    }
  }, [fetchWorkflows]);

  // Delete workflow
  const deleteWorkflow = useCallback(async (workflowId: string): Promise<boolean> => {
    try {
      await automationService.deleteWorkflow(workflowId);
      await fetchWorkflows();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workflow');
      return false;
    }
  }, [fetchWorkflows]);

  // Toggle workflow
  const toggleWorkflow = useCallback(async (workflowId: string, isActive: boolean): Promise<boolean> => {
    try {
      await automationService.toggleWorkflow(workflowId, isActive);
      await fetchWorkflows();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle workflow');
      return false;
    }
  }, [fetchWorkflows]);

  // Execute workflow
  const executeWorkflow = useCallback(async (workflowId: string): Promise<boolean> => {
    try {
      await automationService.executeWorkflow(workflowId);
      await fetchWorkflows();
      await fetchWorkflowExecutions(workflowId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute workflow');
      return false;
    }
  }, [fetchWorkflows]);

  // Fetch workflow executions
  const fetchWorkflowExecutions = useCallback(async (workflowId: string) => {
    setExecutionsLoading(prev => ({ ...prev, [workflowId]: true }));

    try {
      const data = await automationService.getExecutions(currentCompany?.id || '');
      // Filter executions for this specific workflow
      const workflowExecs = data.filter(exec =>
        exec.workflow_id === workflowId ||
        exec.trigger_data?.workflow_id === workflowId
      );
      setWorkflowExecutions(prev => ({
        ...prev,
        [workflowId]: workflowExecs
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch executions');
    } finally {
      setExecutionsLoading(prev => ({ ...prev, [workflowId]: false }));
    }
  }, [currentCompany?.id]);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);

    try {
      const data = await automationService.getTemplates();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  // Create from template
  const createFromTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    if (!currentCompany?.id) return false;

    try {
      await automationService.createFromTemplate(currentCompany.id, templateId);
      await fetchWorkflows();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow from template');
      return false;
    }
  }, [currentCompany?.id, fetchWorkflows]);

  // Computed values
  const activeWorkflows = workflows.filter(w => w.is_active);
  const inactiveWorkflows = workflows.filter(w => !w.is_active);

  // Calculate stats from executions instead of non-existent workflow properties
  const allExecutions = Object.values(workflowExecutions).flat();
  const stats = {
    totalWorkflows: workflows.length,
    activeWorkflows: activeWorkflows.length,
    totalExecutions: allExecutions.length,
    successRate: allExecutions.length > 0
      ? (allExecutions.filter(e => e.status === 'completed').length / allExecutions.length) * 100
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
