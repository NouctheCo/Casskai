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
  start_time: string;
  end_time: string;
  hours_worked: number;
  break_time?: number;
  project?: string;
  task?: string;
  description?: string;
  status: 'draft' | 'submitted' | 'approved';
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface HRMetrics {
  totalEmployees: number;
  activeEmployees: number;
  newHires: number;
  pendingLeaves: number;
  pendingExpenses: number;
  totalExpensesAmount: number;
  averageHoursWorked: number;
  departmentDistribution: { [department: string]: number };
}

export class HRService {
  // Méthodes pour les employés
  static async getEmployees(companyId?: string): Promise<Employee[]> {
    try {
      const company_id = companyId || await this.getCurrentCompanyId();
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', company_id)
        .order('last_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      return this.getMockEmployees();
    }
  }

  static async createEmployee(employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'company_id'>): Promise<Employee> {
    try {
      const company_id = await this.getCurrentCompanyId();
      
      const { data, error } = await supabase
        .from('employees')
        .insert({
          ...employeeData,
          company_id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  static async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  static async deleteEmployee(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  // Méthodes pour les congés
  static async getLeaves(companyId?: string, employeeId?: string): Promise<Leave[]> {
    try {
      const company_id = companyId || await this.getCurrentCompanyId();
      
      let query = supabase
        .from('leaves')
        .select('*, employees(first_name, last_name)')
        .eq('company_id', company_id)
        .order('start_date', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map(leave => ({
        ...leave,
        employee_name: leave.employees ? `${leave.employees.first_name} ${leave.employees.last_name}` : undefined
      }));
    } catch (error) {
      console.error('Error fetching leaves:', error);
      return this.getMockLeaves();
    }
  }

  static async createLeave(leaveData: Omit<Leave, 'id' | 'created_at' | 'updated_at' | 'company_id'>): Promise<Leave> {
    try {
      const company_id = await this.getCurrentCompanyId();
      
      const { data, error } = await supabase
        .from('leaves')
        .insert({
          ...leaveData,
          company_id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating leave:', error);
      throw error;
    }
  }

  static async updateLeaveStatus(id: string, status: Leave['status'], approvedBy?: string): Promise<Leave> {
    try {
      const updates: any = { status };
      if (status === 'approved' && approvedBy) {
        updates.approved_by = approvedBy;
        updates.approved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('leaves')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating leave status:', error);
      throw error;
    }
  }

  // Méthodes pour les notes de frais
  static async getExpenses(companyId?: string, employeeId?: string): Promise<Expense[]> {
    try {
      const company_id = companyId || await this.getCurrentCompanyId();
      
      let query = supabase
        .from('expenses')
        .select('*, employees(first_name, last_name)')
        .eq('company_id', company_id)
        .order('expense_date', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map(expense => ({
        ...expense,
        employee_name: expense.employees ? `${expense.employees.first_name} ${expense.employees.last_name}` : undefined
      }));
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return this.getMockExpenses();
    }
  }

  static async createExpense(expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'company_id'>): Promise<Expense> {
    try {
      const company_id = await this.getCurrentCompanyId();
      
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expenseData,
          company_id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  // Méthodes pour le suivi du temps
  static async getTimeEntries(companyId?: string, employeeId?: string, date?: string): Promise<TimeEntry[]> {
    try {
      const company_id = companyId || await this.getCurrentCompanyId();
      
      let query = supabase
        .from('time_entries')
        .select('*, employees(first_name, last_name)')
        .eq('company_id', company_id)
        .order('date', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      if (date) {
        query = query.eq('date', date);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map(entry => ({
        ...entry,
        employee_name: entry.employees ? `${entry.employees.first_name} ${entry.employees.last_name}` : undefined
      }));
    } catch (error) {
      console.error('Error fetching time entries:', error);
      return this.getMockTimeTracking();
    }
  }

  static async createTimeEntry(entryData: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at' | 'company_id'>): Promise<TimeEntry> {
    try {
      const company_id = await this.getCurrentCompanyId();
      
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          ...entryData,
          company_id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating time entry:', error);
      throw error;
    }
  }

  // Méthodes pour les métriques RH
  static async getHRMetrics(companyId?: string): Promise<HRMetrics> {
    try {
      const company_id = companyId || await this.getCurrentCompanyId();
      
      // Récupérer les employés
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('department, status')
        .eq('company_id', company_id);

      if (employeesError) throw employeesError;

      // Récupérer les congés en attente
      const { data: pendingLeaves, error: leavesError } = await supabase
        .from('leaves')
        .select('id')
        .eq('company_id', company_id)
        .eq('status', 'pending');

      if (leavesError) throw leavesError;

      // Récupérer les notes de frais en attente
      const { data: pendingExpenses, error: expensesError } = await supabase
        .from('expenses')
        .select('id, amount')
        .eq('company_id', company_id)
        .eq('status', 'pending');

      if (expensesError) throw expensesError;

      // Calculer les métriques
      const totalEmployees = employees?.length || 0;
      const activeEmployees = employees?.filter(emp => emp.status === 'active').length || 0;
      const departmentDistribution = employees?.reduce((acc, emp) => {
        acc[emp.department] = (acc[emp.department] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number }) || {};

      const totalExpensesAmount = pendingExpenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

      return {
        totalEmployees,
        activeEmployees,
        newHires: 0, // À calculer avec une période spécifique
        pendingLeaves: pendingLeaves?.length || 0,
        pendingExpenses: pendingExpenses?.length || 0,
        totalExpensesAmount,
        averageHoursWorked: 8, // À calculer depuis les time_entries
        departmentDistribution
      };
    } catch (error) {
      console.error('Error fetching HR metrics:', error);
      return this.getMockHRMetrics();
    }
  }

  // Méthodes utilitaires
  private static async getCurrentCompanyId(): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Pour l'instant, utiliser un ID de test
      return 'current-company';
    } catch (error) {
      console.error('Error getting current company ID:', error);
      return 'current-company';
    }
  }

  // Données mock pour le fallback
  private static getMockEmployees(): Employee[] {
    return [
      {
        id: '1',
        employee_number: 'EMP001',
        first_name: 'Marie',
        last_name: 'Dubois',
        email: 'marie.dubois@company.com',
        phone: '01 23 45 67 89',
        position: 'Développeuse Senior',
        department: 'IT',
        hire_date: '2022-01-15',
        salary: 55000,
        contract_type: 'permanent',
        status: 'active',
        company_id: 'current-company',
        created_at: '2022-01-15T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        employee_number: 'EMP002',
        first_name: 'Pierre',
        last_name: 'Martin',
        email: 'pierre.martin@company.com',
        position: 'Chef de projet',
        department: 'Management',
        hire_date: '2021-03-10',
        salary: 65000,
        contract_type: 'permanent',
        status: 'active',
        company_id: 'current-company',
        created_at: '2021-03-10T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];
  }

  private static getMockLeaves(): Leave[] {
    return [
      {
        id: '1',
        employee_id: '1',
        employee_name: 'Marie Dubois',
        type: 'vacation',
        start_date: '2024-04-01',
        end_date: '2024-04-05',
        days_count: 5,
        status: 'pending',
        reason: 'Congés annuels',
        company_id: 'current-company',
        created_at: '2024-03-15T00:00:00Z',
        updated_at: '2024-03-15T00:00:00Z'
      }
    ];
  }

  private static getMockExpenses(): Expense[] {
    return [
      {
        id: '1',
        employee_id: '1',
        employee_name: 'Marie Dubois',
        category: 'travel',
        description: 'Déplacement client Lyon',
        amount: 150.50,
        currency: 'EUR',
        expense_date: '2024-03-20',
        status: 'pending',
        company_id: 'current-company',
        created_at: '2024-03-21T00:00:00Z',
        updated_at: '2024-03-21T00:00:00Z'
      }
    ];
  }

  private static getMockTimeTracking(): TimeEntry[] {
    return [
      {
        id: '1',
        employee_id: '1',
        employee_name: 'Marie Dubois',
        date: '2024-03-25',
        start_time: '09:00',
        end_time: '17:30',
        hours_worked: 8,
        break_time: 30,
        project: 'Projet CRM',
        task: 'Développement API',
        status: 'submitted',
        company_id: 'current-company',
        created_at: '2024-03-25T17:30:00Z',
        updated_at: '2024-03-25T17:30:00Z'
      }
    ];
  }

  private static getMockHRMetrics(): HRMetrics {
    return {
      totalEmployees: 12,
      activeEmployees: 11,
      newHires: 2,
      pendingLeaves: 3,
      pendingExpenses: 5,
      totalExpensesAmount: 2450.75,
      averageHoursWorked: 7.8,
      departmentDistribution: {
        'IT': 5,
        'Management': 2,
        'Sales': 3,
        'Marketing': 2
      }
    };
  }
}

export default HRService;