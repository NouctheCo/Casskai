import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hrService } from '@/services/hrService';
import {
  Employee,
  Leave,
  Expense,
  TimeEntry,
  HRMetrics
} from '@/services/hrService';

interface UseHRReturn {
  // Data
  employees: Employee[];
  leaves: Leave[];
  expenses: Expense[];
  timeEntries: TimeEntry[];
  metrics: HRMetrics | null;

  // Loading states
  loading: boolean;
  employeesLoading: boolean;
  leavesLoading: boolean;
  expensesLoading: boolean;
  metricsLoading: boolean;

  // Error state
  error: string | null;

  // Fetch functions
  fetchEmployees: (filters?: { department?: string; status?: string; search?: string }) => Promise<void>;
  fetchLeaves: (filters?: { employeeId?: string; status?: string; type?: string; year?: number }) => Promise<void>;
  fetchExpenses: (filters?: { employeeId?: string; status?: string; category?: string; month?: string }) => Promise<void>;
  fetchTimeEntries: (filters?: { employeeId?: string; date?: string; week?: string; month?: string }) => Promise<void>;
  fetchMetrics: () => Promise<void>;

  // CRUD operations
  createEmployee: (employeeData: Omit<Employee, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'full_name'>) => Promise<boolean>;
  updateEmployee: (employeeId: string, updates: Partial<Employee>) => Promise<boolean>;
  deleteEmployee: (employeeId: string) => Promise<boolean>;

  createLeave: (leaveData: Omit<Leave, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'employee_name'>) => Promise<boolean>;
  updateLeave: (leaveId: string, updates: Partial<Leave>) => Promise<boolean>;

  createExpense: (expenseData: Omit<Expense, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'employee_name'>) => Promise<boolean>;
  createTimeEntry: (timeData: Omit<TimeEntry, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'employee_name'>) => Promise<boolean>;

  // Utility
  refreshAll: () => Promise<void>;
}

export function useHR(): UseHRReturn {
  const { currentCompany } = useAuth();

  // States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [metrics, setMetrics] = useState<HRMetrics | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch functions
  const fetchEmployees = useCallback(async (filters?: { department?: string; status?: string; search?: string }) => {
    if (!currentCompany?.id) return;

    setEmployeesLoading(true);
    setError(null);

    try {
      const response = await hrService.getEmployees(currentCompany.id, filters);

      if (response.success && response.data) {
        setEmployees(response.data);
      } else {
        setError(response.error || 'Failed to fetch employees');
      }
    } catch (err) {
      setError(err instanceof Error ? (error as Error).message : 'Unknown error');
    } finally {
      setEmployeesLoading(false);
    }
  }, [currentCompany?.id]);

  const fetchLeaves = useCallback(async (filters?: { employeeId?: string; status?: string; type?: string; year?: number }) => {
    if (!currentCompany?.id) return;

    setLeavesLoading(true);
    setError(null);

    try {
      const response = await hrService.getLeaves(currentCompany.id, filters);

      if (response.success && response.data) {
        setLeaves(response.data);
      } else {
        setError(response.error || 'Failed to fetch leaves');
      }
    } catch (err) {
      setError(err instanceof Error ? (error as Error).message : 'Unknown error');
    } finally {
      setLeavesLoading(false);
    }
  }, [currentCompany?.id]);

  const fetchExpenses = useCallback(async (filters?: { employeeId?: string; status?: string; category?: string; month?: string }) => {
    if (!currentCompany?.id) return;

    setExpensesLoading(true);
    setError(null);

    try {
      const response = await hrService.getExpenses(currentCompany.id, filters);

      if (response.success && response.data) {
        setExpenses(response.data);
      } else {
        setError(response.error || 'Failed to fetch expenses');
      }
    } catch (err) {
      setError(err instanceof Error ? (error as Error).message : 'Unknown error');
    } finally {
      setExpensesLoading(false);
    }
  }, [currentCompany?.id]);

  const fetchTimeEntries = useCallback(async (filters?: { employeeId?: string; date?: string; week?: string; month?: string }) => {
    if (!currentCompany?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await hrService.getTimeEntries(currentCompany.id, filters);

      if (response.success && response.data) {
        setTimeEntries(response.data);
      } else {
        setError(response.error || 'Failed to fetch time entries');
      }
    } catch (err) {
      setError(err instanceof Error ? (error as Error).message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id]);

  const fetchMetrics = useCallback(async () => {
    if (!currentCompany?.id) return;

    setMetricsLoading(true);
    setError(null);

    try {
      const response = await hrService.getHRMetrics(currentCompany.id);

      if (response.success && response.data) {
        setMetrics(response.data);
      } else {
        setError(response.error || 'Failed to fetch HR metrics');
      }
    } catch (err) {
      setError(err instanceof Error ? (error as Error).message : 'Unknown error');
    } finally {
      setMetricsLoading(false);
    }
  }, [currentCompany?.id]);

  // CRUD operations
  const createEmployee = useCallback(async (employeeData: Omit<Employee, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'full_name'>): Promise<boolean> => {
    if (!currentCompany?.id) return false;

    try {
      const response = await hrService.createEmployee(currentCompany.id, employeeData);

      if (response.success) {
        await fetchEmployees();
        await fetchMetrics();
        return true;
      } else {
        setError(response.error || 'Failed to create employee');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? (error as Error).message : 'Unknown error');
      return false;
    }
  }, [currentCompany?.id, fetchEmployees, fetchMetrics]);

  const updateEmployee = useCallback(async (employeeId: string, updates: Partial<Employee>): Promise<boolean> => {
    try {
      const response = await hrService.updateEmployee(employeeId, updates);

      if (response.success) {
        await fetchEmployees();
        await fetchMetrics();
        return true;
      } else {
        setError(response.error || 'Failed to update employee');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? (error as Error).message : 'Unknown error');
      return false;
    }
  }, [fetchEmployees, fetchMetrics]);

  const deleteEmployee = useCallback(async (employeeId: string): Promise<boolean> => {
    try {
      const response = await hrService.deleteEmployee(employeeId);

      if (response.success) {
        await fetchEmployees();
        await fetchMetrics();
        return true;
      } else {
        setError(response.error || 'Failed to delete employee');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? (error as Error).message : 'Unknown error');
      return false;
    }
  }, [fetchEmployees, fetchMetrics]);

  const createLeave = useCallback(async (leaveData: Omit<Leave, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'employee_name'>): Promise<boolean> => {
    if (!currentCompany?.id) return false;

    try {
      const response = await hrService.createLeave(currentCompany.id, leaveData);

      if (response.success) {
        await fetchLeaves();
        await fetchMetrics();
        return true;
      } else {
        setError(response.error || 'Failed to create leave');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? (error as Error).message : 'Unknown error');
      return false;
    }
  }, [currentCompany?.id, fetchLeaves, fetchMetrics]);

  const updateLeave = useCallback(async (leaveId: string, updates: Partial<Leave>): Promise<boolean> => {
    try {
      const response = await hrService.updateLeave(leaveId, updates);

      if (response.success) {
        await fetchLeaves();
        await fetchMetrics();
        return true;
      } else {
        setError(response.error || 'Failed to update leave');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? (error as Error).message : 'Unknown error');
      return false;
    }
  }, [fetchLeaves, fetchMetrics]);

  const createExpense = useCallback(async (expenseData: Omit<Expense, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'employee_name'>): Promise<boolean> => {
    if (!currentCompany?.id) return false;

    try {
      const response = await hrService.createExpense(currentCompany.id, expenseData);

      if (response.success) {
        await fetchExpenses();
        await fetchMetrics();
        return true;
      } else {
        setError(response.error || 'Failed to create expense');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? (error as Error).message : 'Unknown error');
      return false;
    }
  }, [currentCompany?.id, fetchExpenses, fetchMetrics]);

  const createTimeEntry = useCallback(async (timeData: Omit<TimeEntry, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'employee_name'>): Promise<boolean> => {
    if (!currentCompany?.id) return false;

    try {
      const response = await hrService.createTimeEntry(currentCompany.id, timeData);

      if (response.success) {
        await fetchTimeEntries();
        return true;
      } else {
        setError(response.error || 'Failed to create time entry');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? (error as Error).message : 'Unknown error');
      return false;
    }
  }, [currentCompany?.id, fetchTimeEntries]);

  // Utility function to refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchEmployees(),
      fetchLeaves(),
      fetchExpenses(),
      fetchTimeEntries(),
      fetchMetrics()
    ]);
  }, [fetchEmployees, fetchLeaves, fetchExpenses, fetchTimeEntries, fetchMetrics]);

  // Initial data load
  useEffect(() => {
    if (currentCompany?.id) {
      fetchMetrics();
      fetchEmployees();
    }
  }, [currentCompany?.id, fetchMetrics, fetchEmployees]);

  return {
    // Data
    employees,
    leaves,
    expenses,
    timeEntries,
    metrics,

    // Loading states
    loading,
    employeesLoading,
    leavesLoading,
    expensesLoading,
    metricsLoading,

    // Error
    error,

    // Fetch functions
    fetchEmployees,
    fetchLeaves,
    fetchExpenses,
    fetchTimeEntries,
    fetchMetrics,

    // CRUD
    createEmployee,
    updateEmployee,
    deleteEmployee,
    createLeave,
    updateLeave,
    createExpense,
    createTimeEntry,

    // Utility
    refreshAll
  };
}
