-- =====================================================
-- CRM & PROJECTS RLS POLICIES
-- Migration: 20251005180003
-- Description: Row Level Security for crm_activities, crm_quotes, project_milestones, project_budgets
-- =====================================================

-- ============================================================================
-- 1. CRM ACTIVITIES RLS
-- ============================================================================

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company CRM activities"
    ON public.crm_activities
    FOR SELECT
    USING (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can create CRM activities for their company"
    ON public.crm_activities
    FOR INSERT
    WITH CHECK (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can update CRM activities for their company"
    ON public.crm_activities
    FOR UPDATE
    USING (public.user_has_access_to_company(company_id))
    WITH CHECK (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can delete CRM activities for their company"
    ON public.crm_activities
    FOR DELETE
    USING (public.user_has_access_to_company(company_id));

-- ============================================================================
-- 2. CRM QUOTES RLS
-- ============================================================================

ALTER TABLE public.crm_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company CRM quotes"
    ON public.crm_quotes
    FOR SELECT
    USING (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can create CRM quotes for their company"
    ON public.crm_quotes
    FOR INSERT
    WITH CHECK (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can update CRM quotes for their company"
    ON public.crm_quotes
    FOR UPDATE
    USING (public.user_has_access_to_company(company_id))
    WITH CHECK (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can delete CRM quotes for their company"
    ON public.crm_quotes
    FOR DELETE
    USING (public.user_has_access_to_company(company_id));

-- ============================================================================
-- 3. CRM QUOTE ITEMS RLS
-- ============================================================================

ALTER TABLE public.crm_quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quote items for company quotes"
    ON public.crm_quote_items
    FOR SELECT
    USING (
        quote_id IN (
            SELECT id FROM public.crm_quotes
            WHERE public.user_has_access_to_company(company_id)
        )
    );

CREATE POLICY "Users can create quote items for company quotes"
    ON public.crm_quote_items
    FOR INSERT
    WITH CHECK (
        quote_id IN (
            SELECT id FROM public.crm_quotes
            WHERE public.user_has_access_to_company(company_id)
        )
    );

CREATE POLICY "Users can update quote items for company quotes"
    ON public.crm_quote_items
    FOR UPDATE
    USING (
        quote_id IN (
            SELECT id FROM public.crm_quotes
            WHERE public.user_has_access_to_company(company_id)
        )
    )
    WITH CHECK (
        quote_id IN (
            SELECT id FROM public.crm_quotes
            WHERE public.user_has_access_to_company(company_id)
        )
    );

CREATE POLICY "Users can delete quote items for company quotes"
    ON public.crm_quote_items
    FOR DELETE
    USING (
        quote_id IN (
            SELECT id FROM public.crm_quotes
            WHERE public.user_has_access_to_company(company_id)
        )
    );

-- ============================================================================
-- 4. PROJECT MILESTONES RLS
-- ============================================================================

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company project milestones"
    ON public.project_milestones
    FOR SELECT
    USING (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can create project milestones for their company"
    ON public.project_milestones
    FOR INSERT
    WITH CHECK (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can update project milestones for their company"
    ON public.project_milestones
    FOR UPDATE
    USING (public.user_has_access_to_company(company_id))
    WITH CHECK (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can delete project milestones for their company"
    ON public.project_milestones
    FOR DELETE
    USING (public.user_has_access_to_company(company_id));

-- ============================================================================
-- 5. PROJECT BUDGETS RLS
-- ============================================================================

ALTER TABLE public.project_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company project budgets"
    ON public.project_budgets
    FOR SELECT
    USING (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can create project budgets for their company"
    ON public.project_budgets
    FOR INSERT
    WITH CHECK (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can update project budgets for their company"
    ON public.project_budgets
    FOR UPDATE
    USING (public.user_has_access_to_company(company_id))
    WITH CHECK (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can delete project budgets for their company"
    ON public.project_budgets
    FOR DELETE
    USING (public.user_has_access_to_company(company_id));

-- ============================================================================
-- 6. PROJECT EXPENSES RLS
-- ============================================================================

ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company project expenses"
    ON public.project_expenses
    FOR SELECT
    USING (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can create project expenses for their company"
    ON public.project_expenses
    FOR INSERT
    WITH CHECK (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can update project expenses for their company"
    ON public.project_expenses
    FOR UPDATE
    USING (public.user_has_access_to_company(company_id))
    WITH CHECK (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can delete project expenses for their company"
    ON public.project_expenses
    FOR DELETE
    USING (public.user_has_access_to_company(company_id));

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies created successfully for:';
    RAISE NOTICE '   - crm_activities';
    RAISE NOTICE '   - crm_quotes + crm_quote_items';
    RAISE NOTICE '   - project_milestones';
    RAISE NOTICE '   - project_budgets';
    RAISE NOTICE '   - project_expenses';
END $$;
