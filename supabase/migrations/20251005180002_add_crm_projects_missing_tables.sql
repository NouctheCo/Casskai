-- =====================================================
-- CRM & PROJECTS MISSING TABLES
-- Migration: 20251005180002
-- Description: Add crm_activities, crm_quotes, project_milestones, project_budgets
-- =====================================================

-- ============================================================================
-- DROP EXISTING TABLES WITH WRONG STRUCTURE
-- ============================================================================
DROP TABLE IF EXISTS public.crm_activities CASCADE;
DROP TABLE IF EXISTS public.crm_quotes CASCADE;
DROP TABLE IF EXISTS public.crm_quote_items CASCADE;
DROP TABLE IF EXISTS public.project_milestones CASCADE;
DROP TABLE IF EXISTS public.project_budgets CASCADE;
DROP TABLE IF EXISTS public.project_expenses CASCADE;

-- ============================================================================
-- 1. CRM ACTIVITIES (Track all customer interactions)
-- ============================================================================
CREATE TABLE public.crm_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

    -- Related entities
    client_id UUID REFERENCES public.crm_clients(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,

    -- Activity details
    activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'task', 'note', 'demo', 'proposal')),
    subject TEXT NOT NULL,
    description TEXT,

    -- Scheduling
    activity_date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER,
    due_date TIMESTAMPTZ,

    -- Status
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),

    -- Outcome
    outcome TEXT CHECK (outcome IN ('successful', 'unsuccessful', 'follow_up_required', 'no_answer')),
    outcome_notes TEXT,

    -- Assignement
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Reminders
    reminder_minutes_before INTEGER,
    reminder_sent BOOLEAN DEFAULT false,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_company_id ON public.crm_activities(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_client_id ON public.crm_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact_id ON public.crm_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_opportunity_id ON public.crm_activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_assigned_to ON public.crm_activities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_activities_date ON public.crm_activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_crm_activities_status ON public.crm_activities(status, activity_date);
CREATE INDEX IF NOT EXISTS idx_crm_activities_type ON public.crm_activities(activity_type);

CREATE TRIGGER update_crm_activities_updated_at
    BEFORE UPDATE ON public.crm_activities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 2. CRM QUOTES (Sales quotations)
-- ============================================================================
CREATE TABLE public.crm_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

    -- Quote identification
    quote_number TEXT NOT NULL,
    quote_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Related entities
    client_id UUID NOT NULL REFERENCES public.crm_clients(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,

    -- Quote details
    subject TEXT NOT NULL,
    description TEXT,

    -- Validity
    valid_until DATE NOT NULL,
    expires_at TIMESTAMPTZ,

    -- Financial
    currency TEXT NOT NULL DEFAULT 'XOF',
    subtotal_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,

    -- Terms
    payment_terms TEXT,
    delivery_terms TEXT,
    terms_and_conditions TEXT,

    -- Status workflow
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted')),

    -- Conversion
    converted_to_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    converted_at TIMESTAMPTZ,

    -- Tracking
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,

    -- Assignment
    sales_rep_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Files
    pdf_url TEXT,
    attachments JSONB DEFAULT '[]',

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_quote_number_per_company UNIQUE (company_id, quote_number)
);

CREATE INDEX IF NOT EXISTS idx_crm_quotes_company_id ON public.crm_quotes(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_client_id ON public.crm_quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_opportunity_id ON public.crm_quotes(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_status ON public.crm_quotes(status, quote_date DESC);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_sales_rep ON public.crm_quotes(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_date ON public.crm_quotes(quote_date DESC);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_number ON public.crm_quotes(quote_number);

CREATE TRIGGER update_crm_quotes_updated_at
    BEFORE UPDATE ON public.crm_quotes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 3. CRM QUOTE ITEMS (Quote line items)
-- ============================================================================
CREATE TABLE public.crm_quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.crm_quotes(id) ON DELETE CASCADE,

    -- Item details
    item_type TEXT NOT NULL CHECK (item_type IN ('product', 'service', 'custom')),
    item_id UUID, -- Reference to product/service if applicable

    description TEXT NOT NULL,
    quantity DECIMAL(15,3) NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,

    -- Discount
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,

    -- Tax
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,

    -- Totals
    subtotal DECIMAL(15,2) NOT NULL,
    line_total DECIMAL(15,2) NOT NULL,

    -- Order
    line_order INTEGER NOT NULL DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_quote_items_quote_id ON public.crm_quote_items(quote_id, line_order);

-- ============================================================================
-- 4. PROJECT MILESTONES (Project phases and milestones)
-- ============================================================================
CREATE TABLE public.project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

    -- Milestone details
    name TEXT NOT NULL,
    description TEXT,
    milestone_order INTEGER NOT NULL DEFAULT 0,

    -- Dates
    start_date DATE,
    due_date DATE NOT NULL,
    completed_date DATE,

    -- Status
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'blocked', 'cancelled')),

    -- Financial
    budget_amount DECIMAL(15,2),
    actual_cost DECIMAL(15,2) DEFAULT 0,

    -- Progress
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    completion_criteria TEXT,

    -- Dependencies
    depends_on_milestone_id UUID REFERENCES public.project_milestones(id) ON DELETE SET NULL,
    blocking_reason TEXT,

    -- Deliverables
    deliverables JSONB DEFAULT '[]', -- [{ name, description, status, file_url }]

    -- Approval
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,

    -- Assignment
    responsible_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON public.project_milestones(project_id, milestone_order);
CREATE INDEX IF NOT EXISTS idx_project_milestones_company_id ON public.project_milestones(company_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON public.project_milestones(status, due_date);
CREATE INDEX IF NOT EXISTS idx_project_milestones_dates ON public.project_milestones(start_date, due_date);
CREATE INDEX IF NOT EXISTS idx_project_milestones_responsible ON public.project_milestones(responsible_user_id);

CREATE TRIGGER update_project_milestones_updated_at
    BEFORE UPDATE ON public.project_milestones
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. PROJECT BUDGETS (Budget planning and tracking)
-- ============================================================================
CREATE TABLE public.project_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

    -- Budget details
    name TEXT NOT NULL,
    description TEXT,
    budget_type TEXT NOT NULL CHECK (budget_type IN ('labor', 'materials', 'equipment', 'services', 'other')),

    -- Financial
    planned_amount DECIMAL(15,2) NOT NULL,
    actual_amount DECIMAL(15,2) DEFAULT 0,
    variance_amount DECIMAL(15,2) GENERATED ALWAYS AS (actual_amount - planned_amount) STORED,
    variance_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN planned_amount > 0 THEN ((actual_amount - planned_amount) / planned_amount * 100) ELSE 0 END
    ) STORED,

    -- Currency
    currency TEXT NOT NULL DEFAULT 'XOF',

    -- Period
    period_start DATE,
    period_end DATE,

    -- Status
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'approved', 'in_use', 'exceeded', 'completed')),

    -- Approval
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,

    -- Tracking
    last_updated_from_expenses_at TIMESTAMPTZ,

    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_budgets_project_id ON public.project_budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_project_budgets_company_id ON public.project_budgets(company_id);
CREATE INDEX IF NOT EXISTS idx_project_budgets_type ON public.project_budgets(budget_type);
CREATE INDEX IF NOT EXISTS idx_project_budgets_status ON public.project_budgets(status);

CREATE TRIGGER update_project_budgets_updated_at
    BEFORE UPDATE ON public.project_budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 6. PROJECT EXPENSES (Link expenses to projects and budgets)
-- ============================================================================
CREATE TABLE public.project_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    project_budget_id UUID REFERENCES public.project_budgets(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

    -- Expense details
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'XOF',
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Category
    category TEXT NOT NULL CHECK (category IN ('labor', 'materials', 'equipment', 'services', 'travel', 'other')),

    -- Tracking
    supplier_name TEXT,
    invoice_number TEXT,
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'overdue')),

    -- Approval
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,

    -- Files
    receipt_url TEXT,
    attachments JSONB DEFAULT '[]',

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_expenses_project_id ON public.project_expenses(project_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_project_expenses_budget_id ON public.project_expenses(project_budget_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_company_id ON public.project_expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_category ON public.project_expenses(category);
CREATE INDEX IF NOT EXISTS idx_project_expenses_payment_status ON public.project_expenses(payment_status);

CREATE TRIGGER update_project_expenses_updated_at
    BEFORE UPDATE ON public.project_expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Auto-generate quote number
CREATE OR REPLACE FUNCTION generate_quote_number(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_count INTEGER;
    v_year TEXT;
    v_number TEXT;
BEGIN
    SELECT COUNT(*) + 1 INTO v_count
    FROM public.crm_quotes
    WHERE company_id = p_company_id
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

    v_year := TO_CHAR(NOW(), 'YYYY');
    v_number := 'QT-' || v_year || '-' || LPAD(v_count::TEXT, 5, '0');

    RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Calculate quote totals
CREATE OR REPLACE FUNCTION calculate_quote_totals(p_quote_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_subtotal DECIMAL(15,2);
    v_discount_amount DECIMAL(15,2);
    v_tax_amount DECIMAL(15,2);
    v_total DECIMAL(15,2);
    v_quote RECORD;
BEGIN
    SELECT * INTO v_quote FROM public.crm_quotes WHERE id = p_quote_id;

    -- Calculate subtotal from items
    SELECT COALESCE(SUM(line_total), 0) INTO v_subtotal
    FROM public.crm_quote_items
    WHERE quote_id = p_quote_id;

    -- Calculate discount
    IF v_quote.discount_type = 'percentage' THEN
        v_discount_amount := v_subtotal * v_quote.discount_value / 100;
    ELSE
        v_discount_amount := v_quote.discount_value;
    END IF;

    -- Calculate tax
    SELECT COALESCE(SUM(tax_amount), 0) INTO v_tax_amount
    FROM public.crm_quote_items
    WHERE quote_id = p_quote_id;

    v_total := v_subtotal - v_discount_amount + v_tax_amount;

    RETURN jsonb_build_object(
        'subtotal', v_subtotal,
        'discount_amount', v_discount_amount,
        'tax_amount', v_tax_amount,
        'total', v_total
    );
END;
$$ LANGUAGE plpgsql;

-- Update project budget from expenses
CREATE OR REPLACE FUNCTION update_project_budget_actuals(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.project_budgets pb
    SET
        actual_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.project_expenses
            WHERE project_budget_id = pb.id
              AND payment_status = 'paid'
        ),
        last_updated_from_expenses_at = NOW()
    WHERE project_id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.crm_activities IS 'Customer interactions tracking (calls, meetings, emails, etc.)';
COMMENT ON TABLE public.crm_quotes IS 'Sales quotations sent to prospects/clients';
COMMENT ON TABLE public.crm_quote_items IS 'Line items for sales quotes';
COMMENT ON TABLE public.project_milestones IS 'Project phases and major milestones';
COMMENT ON TABLE public.project_budgets IS 'Budget planning and tracking by category';
COMMENT ON TABLE public.project_expenses IS 'Project-related expenses linked to budgets';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ CRM & Projects tables created successfully:';
    RAISE NOTICE '   CRM:';
    RAISE NOTICE '     - crm_activities (interaction tracking)';
    RAISE NOTICE '     - crm_quotes + crm_quote_items (quotations)';
    RAISE NOTICE '   PROJECTS:';
    RAISE NOTICE '     - project_milestones (phases tracking)';
    RAISE NOTICE '     - project_budgets (budget planning)';
    RAISE NOTICE '     - project_expenses (expense tracking)';
    RAISE NOTICE '';
    RAISE NOTICE '📦 Helper functions created:';
    RAISE NOTICE '     - generate_quote_number()';
    RAISE NOTICE '     - calculate_quote_totals()';
    RAISE NOTICE '     - update_project_budget_actuals()';
END $$;
