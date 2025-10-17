-- =====================================================
-- RLS POLICIES HR - Sécurité des Tables HR
-- Date: 2025-10-05
-- Description: Policies Row Level Security pour les tables HR
-- =====================================================

-- =====================================================
-- 1. ACTIVATION RLS SUR TOUTES LES TABLES HR
-- =====================================================

ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_time_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_payroll ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. FONCTION HELPER (si elle n'existe pas déjà)
-- =====================================================

CREATE OR REPLACE FUNCTION public.user_has_access_to_company(company_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_companies
        WHERE user_id = auth.uid()
        AND company_id = company_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. POLICIES HR - hr_employees
-- =====================================================

CREATE POLICY "Users can view employees of their companies"
    ON public.hr_employees FOR SELECT
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can create employees in their companies"
    ON public.hr_employees FOR INSERT
    WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "Users can update employees of their companies"
    ON public.hr_employees FOR UPDATE
    USING (user_has_access_to_company(company_id))
    WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "Users can delete employees of their companies"
    ON public.hr_employees FOR DELETE
    USING (user_has_access_to_company(company_id));

-- =====================================================
-- 4. POLICIES HR - hr_leaves
-- =====================================================

CREATE POLICY "Users can view leaves of their companies"
    ON public.hr_leaves FOR SELECT
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can create leaves in their companies"
    ON public.hr_leaves FOR INSERT
    WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "Users can update leaves of their companies"
    ON public.hr_leaves FOR UPDATE
    USING (user_has_access_to_company(company_id))
    WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "Users can delete leaves of their companies"
    ON public.hr_leaves FOR DELETE
    USING (user_has_access_to_company(company_id));

-- =====================================================
-- 5. POLICIES HR - hr_expenses
-- =====================================================

CREATE POLICY "Users can view expenses of their companies"
    ON public.hr_expenses FOR SELECT
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can create expenses in their companies"
    ON public.hr_expenses FOR INSERT
    WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "Users can update expenses of their companies"
    ON public.hr_expenses FOR UPDATE
    USING (user_has_access_to_company(company_id))
    WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "Users can delete expenses of their companies"
    ON public.hr_expenses FOR DELETE
    USING (user_has_access_to_company(company_id));

-- =====================================================
-- 6. POLICIES HR - hr_time_tracking
-- =====================================================

CREATE POLICY "Users can view time tracking of their companies"
    ON public.hr_time_tracking FOR SELECT
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can create time tracking in their companies"
    ON public.hr_time_tracking FOR INSERT
    WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "Users can update time tracking of their companies"
    ON public.hr_time_tracking FOR UPDATE
    USING (user_has_access_to_company(company_id))
    WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "Users can delete time tracking of their companies"
    ON public.hr_time_tracking FOR DELETE
    USING (user_has_access_to_company(company_id));

-- =====================================================
-- 7. POLICIES HR - hr_payroll
-- =====================================================

CREATE POLICY "Users can view payroll of their companies"
    ON public.hr_payroll FOR SELECT
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can create payroll in their companies"
    ON public.hr_payroll FOR INSERT
    WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "Users can update payroll of their companies"
    ON public.hr_payroll FOR UPDATE
    USING (user_has_access_to_company(company_id))
    WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "Users can delete payroll of their companies"
    ON public.hr_payroll FOR DELETE
    USING (user_has_access_to_company(company_id));

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_employees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_leaves TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_time_tracking TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_payroll TO authenticated;

-- =====================================================
-- 9. COMMENTAIRES
-- =====================================================

COMMENT ON POLICY "Users can view employees of their companies" ON public.hr_employees IS
    'Utilisateurs authentifiés peuvent voir les employés de leurs entreprises';

COMMENT ON FUNCTION public.user_has_access_to_company IS
    'Fonction helper pour vérifier si l''utilisateur a accès à une entreprise donnée';
