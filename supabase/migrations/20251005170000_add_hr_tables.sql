-- =====================================================
-- MIGRATION HR - Tables Resources Humaines
-- Date: 2025-10-05
-- Description: Ajout des 5 tables HR manquantes
-- =====================================================

-- =====================================================
-- 1. MODULE HR (Resources Humaines)
-- =====================================================

-- Table: hr_employees
CREATE TABLE IF NOT EXISTS public.hr_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    position TEXT NOT NULL,
    department TEXT,
    hire_date DATE NOT NULL,
    end_date DATE,
    salary DECIMAL(15,2),
    contract_type TEXT CHECK (contract_type IN ('cdi', 'cdd', 'interim', 'stage', 'apprentissage', 'freelance')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
    manager_id UUID REFERENCES public.hr_employees(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'FR',
    social_security_number TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_email_hr CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Table: hr_leaves (Congés)
CREATE TABLE IF NOT EXISTS public.hr_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('paid_vacation', 'sick_leave', 'unpaid_leave', 'maternity', 'paternity', 'rtt', 'other')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count DECIMAL(5,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    reason TEXT,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_dates CHECK (end_date >= start_date),
    CONSTRAINT positive_days CHECK (days_count > 0)
);

-- Table: hr_expenses (Frais)
CREATE TABLE IF NOT EXISTS public.hr_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('transport', 'meals', 'accommodation', 'supplies', 'training', 'client_entertainment', 'other')),
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    description TEXT NOT NULL,
    receipt_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reimbursed')),
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    reimbursed_at TIMESTAMPTZ,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Table: hr_time_tracking (Suivi temps)
CREATE TABLE IF NOT EXISTS public.hr_time_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    hours_worked DECIMAL(5,2) NOT NULL DEFAULT 0,
    break_minutes INTEGER DEFAULT 0,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    project TEXT,
    task_description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_hours CHECK (hours_worked >= 0 AND hours_worked <= 24),
    CONSTRAINT valid_overtime CHECK (overtime_hours >= 0)
);

-- Table: hr_payroll (Paies)
CREATE TABLE IF NOT EXISTS public.hr_payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    gross_salary DECIMAL(15,2) NOT NULL,
    social_charges_employee DECIMAL(15,2) DEFAULT 0,
    social_charges_employer DECIMAL(15,2) DEFAULT 0,
    net_salary DECIMAL(15,2) NOT NULL,
    tax_withholding DECIMAL(15,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'validated', 'paid')),
    payment_date DATE,
    journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    notes TEXT,
    payslip_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_period CHECK (period_end >= period_start)
);

-- =====================================================
-- 2. INDEX POUR PERFORMANCES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_hr_employees_company ON public.hr_employees(company_id);
CREATE INDEX IF NOT EXISTS idx_hr_employees_status ON public.hr_employees(status);
CREATE INDEX IF NOT EXISTS idx_hr_employees_manager ON public.hr_employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_hr_leaves_employee ON public.hr_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_leaves_status ON public.hr_leaves(status);
CREATE INDEX IF NOT EXISTS idx_hr_expenses_employee ON public.hr_expenses(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_expenses_status ON public.hr_expenses(status);
CREATE INDEX IF NOT EXISTS idx_hr_time_employee ON public.hr_time_tracking(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_time_date ON public.hr_time_tracking(work_date);
CREATE INDEX IF NOT EXISTS idx_hr_payroll_employee ON public.hr_payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_payroll_period ON public.hr_payroll(period_start, period_end);

-- =====================================================
-- 3. TRIGGERS UPDATED_AT
-- =====================================================

-- Fonction trigger générique (si elle n'existe pas déjà)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers HR
CREATE TRIGGER update_hr_employees_updated_at BEFORE UPDATE ON public.hr_employees
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_leaves_updated_at BEFORE UPDATE ON public.hr_leaves
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_expenses_updated_at BEFORE UPDATE ON public.hr_expenses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_time_updated_at BEFORE UPDATE ON public.hr_time_tracking
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_payroll_updated_at BEFORE UPDATE ON public.hr_payroll
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 4. COMMENTAIRES
-- =====================================================

COMMENT ON TABLE public.hr_employees IS 'Employés de l''entreprise';
COMMENT ON TABLE public.hr_leaves IS 'Demandes de congés des employés';
COMMENT ON TABLE public.hr_expenses IS 'Notes de frais des employés';
COMMENT ON TABLE public.hr_time_tracking IS 'Suivi du temps de travail';
COMMENT ON TABLE public.hr_payroll IS 'Fiches de paie et calculs de paie';
