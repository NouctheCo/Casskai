// Service RH moderne intégré avec Supabase
import { supabase } from '@/lib/supabase';

// Types pour les ressources humaines
export interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  hire_date: string;
  salary?: number;
  contract_type: 'permanent' | 'temporary' | 'intern' | 'freelance';
  status: 'active' | 'inactive' | 'on_leave';
  manager_id?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  company_id: string;
  created_at: string;
  updated_at: string;
  full_name?: string;
}

export interface Leave {
  id: string;
  employee_id: string;
  employee_name?: string;
  type: 'vacation' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'other';
  start_date: string;
  end_date: string;
  days_count: number;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  employee_id: string;
  employee_name?: string;
  category: 'travel' | 'meals' | 'transport' | 'supplies' | 'training' | 'other';
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
  receipt_url?: string;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  employee_id: string;
  employee_name?: string;
  date: string;
  hours: number;
  overtime_hours?: number;
  description?: string;
  project_id?: string;
  task_id?: string;
  status: 'draft' | 'submitted' | 'approved';
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface HRMetrics {
  total_employees: number;
  active_employees: number;
  new_hires_this_month: number;
  pending_leaves: number;
  approved_leaves: number;
  pending_expenses: number;
  total_expense_amount: number;
  average_salary: number;
  turnover_rate: number;
  departments: Array<{
    name: string;
    count: number;
  }>;
}

export interface HRServiceResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
}

export class HRService {
  private static instance: HRService;

  private constructor() {}

  static getInstance(): HRService {
    if (!this.instance) {
      this.instance = new HRService();
    }
    return this.instance;
  }

  // EMPLOYEES

  async getEmployees(companyId: string, filters?: {
    department?: string;
    status?: string;
    search?: string;
  }): Promise<HRServiceResponse<Employee[]>> {
    try {
      let query = supabase
        .from('hr_employees')
        .select('*')
        .eq('company_id', companyId);

      // Apply filters
      if (filters?.department) {
        query = query.eq('department', filters.department);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching employees:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }

      // Enrich data with computed fields
      const enrichedEmployees = (data || []).map(emp => ({
        ...emp,
        full_name: `${emp.first_name} ${emp.last_name}`
      }));

      return {
        success: true,
        data: enrichedEmployees as Employee[]
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error in getEmployees:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createEmployee(companyId: string, employeeData: Omit<Employee, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Promise<HRServiceResponse<Employee>> {
    try {
      const { data, error } = await supabase
        .from('hr_employees')
        .insert({
          ...employeeData,
          company_id: companyId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating employee:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }

      return {
        success: true,
        data: {
          ...data,
          full_name: `${data.first_name} ${data.last_name}`
        } as Employee
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error in createEmployee:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<HRServiceResponse<Employee>> {
    try {
      const { data, error } = await supabase
        .from('hr_employees')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId)
        .select()
        .single();

      if (error) {
        console.error('Error updating employee:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }

      return {
        success: true,
        data: {
          ...data,
          full_name: `${data.first_name} ${data.last_name}`
        } as Employee
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error in updateEmployee:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deleteEmployee(employeeId: string): Promise<HRServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('hr_employees')
        .delete()
        .eq('id', employeeId);

      if (error) {
        console.error('Error deleting employee:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }

      return {
        success: true,
        data: true
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error in deleteEmployee:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // LEAVES

  async getLeaves(companyId: string, filters?: {
    employeeId?: string;
    status?: string;
    type?: string;
    year?: number;
  }): Promise<HRServiceResponse<Leave[]>> {
    try {
      let query = supabase
        .from('hr_leaves')
        .select(`
          *,
          employee:hr_employees(first_name, last_name)
        `)
        .eq('company_id', companyId);

      // Apply filters
      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.year) {
        const startOfYear = `${filters.year}-01-01`;
        const endOfYear = `${filters.year}-12-31`;
        query = query.gte('start_date', startOfYear).lte('start_date', endOfYear);
      }

      const { data, error } = await query.order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching leaves:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }

      // Enrich with employee names
      const enrichedLeaves = (data || []).map(leave => ({
        ...leave,
        employee_name: leave.employee ? `${leave.employee.first_name} ${leave.employee.last_name}` : 'N/A'
      }));

      return {
        success: true,
        data: enrichedLeaves as Leave[]
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error in getLeaves:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createLeave(companyId: string, leaveData: Omit<Leave, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'employee_name'>): Promise<HRServiceResponse<Leave>> {
    try {
      const { data, error } = await supabase
        .from('hr_leaves')
        .insert({
          ...leaveData,
          company_id: companyId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating leave:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as Leave
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error in createLeave:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async updateLeave(leaveId: string, updates: Partial<Leave>): Promise<HRServiceResponse<Leave>> {
    try {
      const { data, error } = await supabase
        .from('hr_leaves')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', leaveId)
        .select()
        .single();

      if (error) {
        console.error('Error updating leave:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as Leave
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error in updateLeave:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // EXPENSES

  async getExpenses(companyId: string, filters?: {
    employeeId?: string;
    status?: string;
    category?: string;
    month?: string;
  }): Promise<HRServiceResponse<Expense[]>> {
    try {
      let query = supabase
        .from('hr_expenses')
        .select(`
          *,
          employee:hr_employees(first_name, last_name)
        `)
        .eq('company_id', companyId);

      // Apply filters
      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.month) {
        query = query.gte('expense_date', `${filters.month}-01`);
        // Calculate last day of month
        const date = new Date(`${filters.month}-01`);
        date.setMonth(date.getMonth() + 1, 0);
        query = query.lte('expense_date', date.toISOString().split('T')[0]);
      }

      const { data, error } = await query.order('expense_date', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }

      // Enrich with employee names
      const enrichedExpenses = (data || []).map(expense => ({
        ...expense,
        employee_name: expense.employee ? `${expense.employee.first_name} ${expense.employee.last_name}` : 'N/A'
      }));

      return {
        success: true,
        data: enrichedExpenses as Expense[]
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error in getExpenses:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createExpense(companyId: string, expenseData: Omit<Expense, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'employee_name'>): Promise<HRServiceResponse<Expense>> {
    try {
      const { data, error } = await supabase
        .from('hr_expenses')
        .insert({
          ...expenseData,
          company_id: companyId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating expense:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as Expense
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error in createExpense:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // TIME TRACKING

  async getTimeEntries(companyId: string, filters?: {
    employeeId?: string;
    date?: string;
    week?: string;
    month?: string;
  }): Promise<HRServiceResponse<TimeEntry[]>> {
    try {
      let query = supabase
        .from('hr_time_entries')
        .select(`
          *,
          employee:hr_employees(first_name, last_name)
        `)
        .eq('company_id', companyId);

      // Apply filters
      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }
      if (filters?.date) {
        query = query.eq('date', filters.date);
      }
      if (filters?.week) {
        // Week filter logic can be added here
      }
      if (filters?.month) {
        query = query.gte('date', `${filters.month}-01`);
        const date = new Date(`${filters.month}-01`);
        date.setMonth(date.getMonth() + 1, 0);
        query = query.lte('date', date.toISOString().split('T')[0]);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) {
        console.error('Error fetching time entries:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }

      // Enrich with employee names
      const enrichedEntries = (data || []).map(entry => ({
        ...entry,
        employee_name: entry.employee ? `${entry.employee.first_name} ${entry.employee.last_name}` : 'N/A'
      }));

      return {
        success: true,
        data: enrichedEntries as TimeEntry[]
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error in getTimeEntries:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createTimeEntry(companyId: string, timeData: Omit<TimeEntry, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'employee_name'>): Promise<HRServiceResponse<TimeEntry>> {
    try {
      const { data, error } = await supabase
        .from('hr_time_entries')
        .insert({
          ...timeData,
          company_id: companyId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating time entry:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as TimeEntry
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error in createTimeEntry:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // METRICS & ANALYTICS

  async getHRMetrics(companyId: string): Promise<HRServiceResponse<HRMetrics>> {
    try {
      // Execute parallel queries for better performance
      const [employeesResult, leavesResult, expensesResult] = await Promise.all([
        supabase.from('hr_employees').select('id, status, department, salary, hire_date').eq('company_id', companyId),
        supabase.from('hr_leaves').select('id, status').eq('company_id', companyId),
        supabase.from('hr_expenses').select('amount, status').eq('company_id', companyId)
      ]);

      if (employeesResult.error || leavesResult.error || expensesResult.error) {
        throw new Error('Error fetching HR metrics data');
      }

      const employees = employeesResult.data || [];
      const leaves = leavesResult.data || [];
      const expenses = expensesResult.data || [];

      // Calculate metrics
      const activeEmployees = employees.filter(e => e.status === 'active');
      const thisMonth = new Date().toISOString().slice(0, 7);
      const newHiresThisMonth = employees.filter(e => e.hire_date?.startsWith(thisMonth)).length;

      const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
      const approvedLeaves = leaves.filter(l => l.status === 'approved').length;

      const pendingExpenses = expenses.filter(e => e.status === 'pending').length;
      const totalExpenseAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      const salaries = employees.filter(e => e.salary && e.salary > 0).map(e => e.salary);
      const averageSalary = salaries.length > 0 ? salaries.reduce((sum, s) => sum + s, 0) / salaries.length : 0;

      // Department distribution
      const departmentCounts = employees.reduce((acc, emp) => {
        const dept = emp.department || 'Non assigné';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const departments = Object.entries(departmentCounts).map(([name, count]) => ({
        name,
        count
      }));

      const metrics: HRMetrics = {
        total_employees: employees.length,
        active_employees: activeEmployees.length,
        new_hires_this_month: newHiresThisMonth,
        pending_leaves: pendingLeaves,
        approved_leaves: approvedLeaves,
        pending_expenses: pendingExpenses,
        total_expense_amount: totalExpenseAmount,
        average_salary: averageSalary,
        turnover_rate: 0, // Can be calculated with historical data
        departments
      };

      return {
        success: true,
        data: metrics
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error in getHRMetrics:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const hrService = HRService.getInstance();