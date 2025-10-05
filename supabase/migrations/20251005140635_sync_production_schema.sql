

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE SCHEMA IF NOT EXISTS "public";
SET search_path TO public;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."analyze_budget_variances"("p_company_id" "uuid", "p_budget_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result JSON;
    v_budget_data RECORD;
    v_actual_revenue DECIMAL(15,2) := 0;
    v_actual_expenses DECIMAL(15,2) := 0;
    v_variance_analysis JSON;
BEGIN
    -- Récupération du budget
    SELECT * INTO v_budget_data
    FROM budgets
    WHERE id = p_budget_id AND company_id = p_company_id;

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Budget non trouvé');
    END IF;

    -- Calcul des réalisés sur la période du budget
    SELECT COALESCE(SUM(total_incl_tax), 0)
    INTO v_actual_revenue
    FROM invoices
    WHERE company_id = p_company_id
      AND invoice_date BETWEEN v_budget_data.start_date AND v_budget_data.end_date
      AND status = 'paid';

    SELECT COALESCE(SUM(jel.debit_amount), 0)
    INTO v_actual_expenses
    FROM journal_entry_lines jel
    JOIN journal_entries je ON je.id = jel.journal_entry_id
    JOIN chart_of_accounts coa ON coa.id = jel.account_id
    WHERE je.company_id = p_company_id
      AND je.entry_date BETWEEN v_budget_data.start_date AND v_budget_data.end_date
      AND coa.account_type = 'expense';

    -- Analyse des écarts
    v_variance_analysis := json_build_object(
        'revenue_variance', json_build_object(
            'budgeted', v_budget_data.total_revenue,
            'actual', v_actual_revenue,
            'variance', v_actual_revenue - v_budget_data.total_revenue,
            'variance_percent', CASE
                WHEN v_budget_data.total_revenue > 0 THEN
                    ((v_actual_revenue - v_budget_data.total_revenue) / v_budget_data.total_revenue * 100)
                ELSE 0
            END,
            'status', CASE
                WHEN v_actual_revenue >= v_budget_data.total_revenue * 0.95 THEN 'favorable'
                WHEN v_actual_revenue >= v_budget_data.total_revenue * 0.85 THEN 'attention'
                ELSE 'défavorable'
            END
        ),
        'expense_variance', json_build_object(
            'budgeted', v_budget_data.total_expenses,
            'actual', v_actual_expenses,
            'variance', v_actual_expenses - v_budget_data.total_expenses,
            'variance_percent', CASE
                WHEN v_budget_data.total_expenses > 0 THEN
                    ((v_actual_expenses - v_budget_data.total_expenses) / v_budget_data.total_expenses * 100)
                ELSE 0
            END,
            'status', CASE
                WHEN v_actual_expenses <= v_budget_data.total_expenses * 1.05 THEN 'favorable'
                WHEN v_actual_expenses <= v_budget_data.total_expenses * 1.15 THEN 'attention'
                ELSE 'défavorable'
            END
        ),
        'net_result_variance', json_build_object(
            'budgeted', v_budget_data.net_result,
            'actual', v_actual_revenue - v_actual_expenses,
            'variance', (v_actual_revenue - v_actual_expenses) - v_budget_data.net_result
        )
    );

    v_result := json_build_object(
        'budget_id', p_budget_id,
        'budget_name', v_budget_data.name,
        'period', json_build_object(
            'start_date', v_budget_data.start_date,
            'end_date', v_budget_data.end_date
        ),
        'variance_analysis', v_variance_analysis,
        'recommendations', CASE
            WHEN (v_actual_revenue - v_actual_expenses) >= v_budget_data.net_result * 0.95 THEN
                json_build_array('Objectifs atteints', 'Maintenir la performance')
            ELSE
                json_build_array('Écarts significatifs détectés', 'Plan d''action recommandé')
        END
    );

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."analyze_budget_variances"("p_company_id" "uuid", "p_budget_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."analyze_budget_variances"("p_company_id" "uuid", "p_budget_id" "uuid") IS 'Analyse les écarts entre budget et réalisé';



CREATE OR REPLACE FUNCTION "public"."analyze_data_quality"() RETURNS TABLE("metric_name" "text", "metric_value" numeric, "percentage" numeric, "details" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT
            COUNT(*) as total_companies,
            COUNT(*) FILTER (WHERE name IS NOT NULL AND LENGTH(TRIM(name)) > 0) as has_name,
            COUNT(*) FILTER (WHERE siret IS NOT NULL) as has_siret,
            COUNT(*) FILTER (WHERE COALESCE(status, 'active') = 'active') as active_companies,
            AVG(COALESCE(data_quality_score, 0)) as avg_quality_score
        FROM companies
        WHERE COALESCE(status, 'active') != 'merged'
    )
    SELECT
        'Total Companies'::TEXT,
        total_companies::NUMERIC,
        100::NUMERIC,
        json_build_object('count', total_companies)::JSONB
    FROM stats
    UNION ALL
    SELECT
        'Companies with Name'::TEXT,
        has_name::NUMERIC,
        CASE WHEN total_companies > 0 THEN (has_name::NUMERIC / total_companies * 100) ELSE 0 END,
        json_build_object('count', has_name, 'total', total_companies)::JSONB
    FROM stats
    UNION ALL
    SELECT
        'Companies with SIRET'::TEXT,
        has_siret::NUMERIC,
        CASE WHEN total_companies > 0 THEN (has_siret::NUMERIC / total_companies * 100) ELSE 0 END,
        json_build_object('count', has_siret, 'total', total_companies)::JSONB
    FROM stats;
END;
$$;


ALTER FUNCTION "public"."analyze_data_quality"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."analyze_training_trends"("p_company_id" "uuid", "p_months_back" integer DEFAULT 12) RETURNS TABLE("training_category" "text", "total_trainings" integer, "total_cost" numeric, "avg_completion_rate" numeric, "avg_score" numeric, "roi_estimate" numeric, "trend_direction" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH training_stats AS (
        SELECT
            tr.training_category,
            COUNT(*) as total_trainings,
            SUM(tr.cost) as total_cost,
            AVG(tr.completion_percentage) as avg_completion_rate,
            AVG(tr.score) as avg_score,
            AVG(tr.roi_estimated) as roi_estimate,
            COUNT(*) FILTER (WHERE tr.start_date >= CURRENT_DATE - INTERVAL '3 months') as recent_count,
            COUNT(*) FILTER (WHERE tr.start_date < CURRENT_DATE - INTERVAL '3 months' AND tr.start_date >= CURRENT_DATE - (p_months_back || ' months')::INTERVAL) as older_count
        FROM training_records tr
        WHERE tr.company_id = p_company_id
        AND tr.start_date >= CURRENT_DATE - (p_months_back || ' months')::INTERVAL
        GROUP BY tr.training_category
    )
    SELECT
        ts.training_category,
        ts.total_trainings,
        COALESCE(ts.total_cost, 0),
        ts.avg_completion_rate,
        ts.avg_score,
        COALESCE(ts.roi_estimate, 0),
        CASE
            WHEN ts.recent_count > ts.older_count THEN 'increasing'
            WHEN ts.recent_count < ts.older_count THEN 'decreasing'
            ELSE 'stable'
        END as trend_direction
    FROM training_stats ts
    ORDER BY ts.total_trainings DESC;
END;
$$;


ALTER FUNCTION "public"."analyze_training_trends"("p_company_id" "uuid", "p_months_back" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_trigger_function"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    company_id UUID;
    audit_data JSONB;
BEGIN
    -- Gestion spéciale pour la table companies
    IF TG_TABLE_NAME = 'companies' THEN
        -- Pour companies, company_id = id de l'entreprise
        company_id := COALESCE(NEW.id, OLD.id);
    ELSE
        -- Pour toutes les autres tables, utiliser company_id
        IF TG_OP = 'DELETE' THEN
            company_id := OLD.company_id;
        ELSE
            company_id := NEW.company_id;
        END IF;
    END IF;

    -- Construction des données d'audit
    audit_data := jsonb_build_object(
        'operation', TG_OP,
        'table_name', TG_TABLE_NAME,
        'user_id', current_setting('app.current_user_id', true),
        'timestamp', NOW()
    );

    -- Ajouter les données selon l'opération
    IF TG_OP = 'DELETE' THEN
        audit_data := audit_data || jsonb_build_object('old_data', row_to_json(OLD));
    ELSE
        audit_data := audit_data || jsonb_build_object('new_data', row_to_json(NEW));
        IF TG_OP = 'UPDATE' THEN
            audit_data := audit_data || jsonb_build_object('old_data', row_to_json(OLD));
        END IF;
    END IF;

    -- Tentative d'insertion dans les logs d'audit (si la table existe)
    BEGIN
        INSERT INTO audit_logs (
            company_id,
            table_name,
            operation,
            audit_data,
            created_at
        ) VALUES (
            company_id,
            TG_TABLE_NAME,
            TG_OP,
            audit_data,
            NOW()
        );
    EXCEPTION
        WHEN undefined_table THEN
            -- Table audit_logs n'existe pas, ignorer silencieusement
            NULL;
        WHEN undefined_column THEN
            -- Colonne manquante, ignorer silencieusement
            NULL;
        WHEN others THEN
            -- Autres erreurs d'audit, ne pas bloquer l'opération principale
            RAISE WARNING 'Audit failed for table %: %', TG_TABLE_NAME, SQLERRM;
    END;

    -- Retourner la ligne appropriée
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION "public"."audit_trigger_function"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_populate_budget_categories"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_country_code TEXT;
BEGIN
  -- Déterminer le pays de l'entreprise (à adapter selon votre structure)
  SELECT COALESCE(country_code, 'FR')
  INTO v_country_code
  FROM companies
  WHERE id = NEW.company_id;

  -- Créer les catégories automatiquement
  PERFORM initialize_budget_category_mappings(
    NEW.company_id,
    NEW.id,
    v_country_code
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_populate_budget_categories"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."auto_populate_budget_categories"() IS 'Trigger optionnel pour créer automatiquement les catégories standards lors de la création d''un budget';



CREATE OR REPLACE FUNCTION "public"."calculate_automatic_rfa"("p_contract_id" "uuid", "p_period_start" "date", "p_period_end" "date", "p_turnover_amount" numeric) RETURNS TABLE("rfa_amount" numeric, "rfa_percentage" numeric, "calculation_details" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_contract contracts%ROWTYPE;
    v_rfa_amount DECIMAL(15,2) := 0;
    v_rfa_percentage DECIMAL(5,2) := 0;
    v_details JSONB := '{"tiers": []}';
    v_tier JSONB;
    v_remaining_amount DECIMAL(15,2);
    v_tier_amount DECIMAL(15,2);
    v_tier_rfa DECIMAL(15,2);
BEGIN
    -- Récupérer le contrat
    SELECT * INTO v_contract FROM contracts WHERE id = p_contract_id;

    IF NOT FOUND OR NOT v_contract.has_rfa THEN
        RETURN QUERY SELECT 0::DECIMAL(15,2), 0::DECIMAL(5,2), '{}'::JSONB;
        RETURN;
    END IF;

    -- Calcul selon le type
    IF v_contract.rfa_calculation_type = 'fixed_percent' THEN
        v_rfa_percentage := v_contract.rfa_base_percentage;
        v_rfa_amount := p_turnover_amount * v_rfa_percentage / 100;
        v_details := jsonb_build_object(
            'method', 'fixed_percent',
            'rate', v_rfa_percentage,
            'base_amount', p_turnover_amount
        );

    ELSIF v_contract.rfa_calculation_type = 'progressive' AND v_contract.rfa_tiers IS NOT NULL THEN
        v_remaining_amount := p_turnover_amount;

        -- Parcourir les paliers
        FOR v_tier IN SELECT * FROM jsonb_array_elements(v_contract.rfa_tiers)
        LOOP
            IF v_remaining_amount <= 0 THEN EXIT; END IF;

            -- Calculer le montant pour ce palier
            IF (v_tier ->> 'max_amount')::DECIMAL IS NULL THEN
                v_tier_amount := v_remaining_amount;
            ELSE
                v_tier_amount := LEAST(v_remaining_amount,
                                     (v_tier ->> 'max_amount')::DECIMAL - (v_tier ->> 'min_amount')::DECIMAL);
            END IF;

            v_tier_rfa := v_tier_amount * (v_tier ->> 'rate')::DECIMAL / 100;
            v_rfa_amount := v_rfa_amount + v_tier_rfa;

            -- Ajouter aux détails
            v_details := jsonb_set(
                v_details,
                '{tiers}',
                (v_details -> 'tiers') || jsonb_build_object(
                    'min_amount', v_tier ->> 'min_amount',
                    'max_amount', v_tier ->> 'max_amount',
                    'rate', v_tier ->> 'rate',
                    'tier_amount', v_tier_amount,
                    'tier_rfa', v_tier_rfa
                )
            );

            v_remaining_amount := v_remaining_amount - v_tier_amount;
        END LOOP;

        v_rfa_percentage := CASE WHEN p_turnover_amount > 0 THEN (v_rfa_amount / p_turnover_amount * 100) ELSE 0 END;
    END IF;

    RETURN QUERY SELECT v_rfa_amount, v_rfa_percentage, v_details;
END;
$$;


ALTER FUNCTION "public"."calculate_automatic_rfa"("p_contract_id" "uuid", "p_period_start" "date", "p_period_end" "date", "p_turnover_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_employee_engagement_score"("p_company_id" "uuid") RETURNS TABLE("employee_id" "uuid", "engagement_score" numeric, "factors" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id as employee_id,
        (
            COALESCE(perf.avg_rating, 3.0) * 0.3 +
            COALESCE(training.completion_rate, 0.5) * 20 * 0.2 +
            CASE WHEN disc.recent_actions > 0 THEN 1.0 ELSE 5.0 END * 0.1 +
            COALESCE(skills.avg_score, 3.0) * 0.2 +
            CASE WHEN cp.recent_progression > 0 THEN 5.0 ELSE 3.0 END * 0.2
        )::DECIMAL(3,1) as engagement_score,
        jsonb_build_object(
            'performance_rating', COALESCE(perf.avg_rating, 3.0),
            'training_completion', COALESCE(training.completion_rate, 0.5),
            'disciplinary_score', CASE WHEN disc.recent_actions > 0 THEN 1.0 ELSE 5.0 END,
            'skills_average', COALESCE(skills.avg_score, 3.0),
            'career_progression', CASE WHEN cp.recent_progression > 0 THEN 'recent' ELSE 'none' END
        ) as factors
    FROM employees e
    LEFT JOIN (
        SELECT employee_id, AVG(overall_rating) as avg_rating
        FROM performance_reviews
        WHERE company_id = p_company_id AND review_date >= CURRENT_DATE - INTERVAL '2 years'
        GROUP BY employee_id
    ) perf ON e.id = perf.employee_id
    LEFT JOIN (
        SELECT employee_id,
               AVG(completion_percentage) / 100.0 as completion_rate
        FROM training_records
        WHERE company_id = p_company_id AND start_date >= CURRENT_DATE - INTERVAL '1 year'
        GROUP BY employee_id
    ) training ON e.id = training.employee_id
    LEFT JOIN (
        SELECT employee_id, COUNT(*) as recent_actions
        FROM disciplinary_actions
        WHERE company_id = p_company_id AND action_date >= CURRENT_DATE - INTERVAL '1 year'
        GROUP BY employee_id
    ) disc ON e.id = disc.employee_id
    LEFT JOIN (
        SELECT employee_id, AVG(current_score) as avg_score
        FROM skill_assessments
        WHERE company_id = p_company_id AND assessment_date >= CURRENT_DATE - INTERVAL '1 year'
        GROUP BY employee_id
    ) skills ON e.id = skills.employee_id
    LEFT JOIN (
        SELECT employee_id, COUNT(*) as recent_progression
        FROM career_progression
        WHERE company_id = p_company_id AND effective_date >= CURRENT_DATE - INTERVAL '2 years'
        AND progression_type IN ('promotion', 'lateral_move')
        GROUP BY employee_id
    ) cp ON e.id = cp.employee_id
    WHERE e.company_id = p_company_id;
END;
$$;


ALTER FUNCTION "public"."calculate_employee_engagement_score"("p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_financial_health_score"("p_company_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result JSON;
    v_liquidity_ratio DECIMAL(10,2) := 0;
    v_profitability_ratio DECIMAL(10,2) := 0;
    v_cash_balance DECIMAL(15,2) := 0;
    v_monthly_expenses DECIMAL(15,2) := 0;
    v_monthly_revenue DECIMAL(15,2) := 0;
    v_overall_score INTEGER := 0;
    v_liquidity_score INTEGER := 0;
    v_profitability_score INTEGER := 0;
    v_efficiency_score INTEGER := 0;
    v_growth_score INTEGER := 0;
    v_risk_score INTEGER := 0;
BEGIN
    -- Position de trésorerie
    SELECT COALESCE(SUM(current_balance), 0)
    INTO v_cash_balance
    FROM bank_accounts
    WHERE company_id = p_company_id AND is_active = true;

    -- Dépenses mensuelles moyennes
    SELECT COALESCE(AVG(monthly_expenses), 0)
    FROM (
        SELECT DATE_TRUNC('month', je.entry_date) as month,
               SUM(jel.debit_amount) as monthly_expenses
        FROM journal_entry_lines jel
        JOIN journal_entries je ON je.id = jel.journal_entry_id
        JOIN chart_of_accounts coa ON coa.id = jel.account_id
        WHERE je.company_id = p_company_id
          AND coa.account_type = 'expense'
          AND je.entry_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', je.entry_date)
    ) t
    INTO v_monthly_expenses;

    -- CA mensuel moyen
    SELECT COALESCE(AVG(monthly_revenue), 0)
    FROM (
        SELECT DATE_TRUNC('month', invoice_date) as month,
               SUM(total_incl_tax) as monthly_revenue
        FROM invoices
        WHERE company_id = p_company_id
          AND status = 'paid'
          AND invoice_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', invoice_date)
    ) t
    INTO v_monthly_revenue;

    -- Calcul des scores
    -- Score de liquidité (0-100)
    IF v_monthly_expenses > 0 THEN
        v_liquidity_ratio := v_cash_balance / v_monthly_expenses;
        v_liquidity_score := LEAST(100, GREATEST(0, (v_liquidity_ratio * 20)::INTEGER));
    ELSE
        v_liquidity_score := 50;
    END IF;

    -- Score de profitabilité (0-100)
    IF v_monthly_revenue > 0 THEN
        v_profitability_ratio := (v_monthly_revenue - v_monthly_expenses) / v_monthly_revenue;
        v_profitability_score := LEAST(100, GREATEST(0, (50 + v_profitability_ratio * 100)::INTEGER));
    ELSE
        v_profitability_score := 0;
    END IF;

    -- Scores par défaut pour les autres catégories
    v_efficiency_score := 75;
    v_growth_score := 65;
    v_risk_score := CASE
        WHEN v_liquidity_score >= 80 THEN 85
        WHEN v_liquidity_score >= 60 THEN 70
        WHEN v_liquidity_score >= 40 THEN 55
        ELSE 30
    END;

    -- Score global
    v_overall_score := (v_liquidity_score + v_profitability_score + v_efficiency_score + v_growth_score + v_risk_score) / 5;

    v_result := json_build_object(
        'overall_score', v_overall_score,
        'liquidity_score', v_liquidity_score,
        'profitability_score', v_profitability_score,
        'efficiency_score', v_efficiency_score,
        'growth_score', v_growth_score,
        'risk_score', v_risk_score,
        'sustainability_score', (v_overall_score + v_risk_score) / 2,
        'recommendations', CASE
            WHEN v_overall_score >= 80 THEN json_build_array('Excellente santé financière', 'Continuez sur cette voie')
            WHEN v_overall_score >= 60 THEN json_build_array('Bonne santé financière', 'Quelques améliorations possibles')
            WHEN v_overall_score >= 40 THEN json_build_array('Santé financière correcte', 'Surveillance recommandée')
            ELSE json_build_array('Attention requise', 'Plan d''action urgent à mettre en place')
        END,
        'critical_alerts', CASE
            WHEN v_liquidity_score < 30 THEN json_build_array('Risque de liquidité élevé')
            WHEN v_profitability_score < 30 THEN json_build_array('Rentabilité critique')
            ELSE json_build_array()
        END
    );

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."calculate_financial_health_score"("p_company_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_financial_health_score"("p_company_id" "uuid") IS 'Calcule le score de santé financière d''une entreprise';



CREATE OR REPLACE FUNCTION "public"."calculate_project_progress"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Mettre à jour la progression du projet basée sur les tâches
    UPDATE projects
    SET progress = (
        SELECT COALESCE(AVG(progress), 0)
        FROM project_tasks
        WHERE project_id = NEW.project_id
        AND status != 'cancelled'
    )
    WHERE id = NEW.project_id;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_project_progress"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_purchase_totals"("p_purchase_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_subtotal DECIMAL(15,2) := 0;
    v_tax_amount DECIMAL(15,2) := 0;
    v_total DECIMAL(15,2) := 0;
    v_purchase_discount DECIMAL(5,2) := 0;
    v_discount_amount DECIMAL(15,2) := 0;
BEGIN
    -- Obtenir la remise de la commande
    SELECT COALESCE(discount_rate, 0) INTO v_purchase_discount
    FROM purchases WHERE id = p_purchase_id;

    -- Calculer le sous-total des lignes
    SELECT COALESCE(SUM(line_total), 0) INTO v_subtotal
    FROM purchase_items
    WHERE purchase_id = p_purchase_id;

    -- Calculer la remise sur le sous-total
    v_discount_amount := ROUND(v_subtotal * v_purchase_discount / 100, 2);

    -- Calculer le montant après remise
    v_subtotal := v_subtotal - v_discount_amount;

    -- Calculer la TVA sur le montant après remise
    SELECT COALESCE(SUM(
        ROUND((line_total * (1 - v_purchase_discount/100)) * tax_rate / 100, 2)
    ), 0) INTO v_tax_amount
    FROM purchase_items
    WHERE purchase_id = p_purchase_id;

    -- Total final
    v_total := v_subtotal + v_tax_amount;

    RETURN jsonb_build_object(
        'subtotal_amount', v_subtotal,
        'tax_amount', v_tax_amount,
        'discount_amount', v_discount_amount,
        'total_amount', v_total
    );
END;
$$;


ALTER FUNCTION "public"."calculate_purchase_totals"("p_purchase_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_feature"("p_user_id" "uuid", "p_feature_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_subscription RECORD;
  v_limit INTEGER;
  v_current_usage INTEGER;
BEGIN
  SELECT s.*, sp.features
  INTO v_subscription
  FROM subscriptions s
  JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF NOT (v_subscription.features ? p_feature_name) THEN
    RETURN FALSE;
  END IF;

  SELECT limit_value, current_usage
  INTO v_limit, v_current_usage
  FROM usage_tracking
  WHERE user_id = p_user_id
    AND feature_name = p_feature_name;

  IF v_limit IS NULL OR v_limit = -1 THEN
    RETURN TRUE;
  END IF;

  RETURN COALESCE(v_current_usage, 0) < v_limit;
END;
$$;


ALTER FUNCTION "public"."can_access_feature"("p_user_id" "uuid", "p_feature_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_create_trial"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    existing_subscription_count INTEGER;
BEGIN
    -- Vérifier s'il n'y a pas déjà un essai ou un abonnement actif
    SELECT COUNT(*)
    INTO existing_subscription_count
    FROM subscriptions
    WHERE user_id = p_user_id
    AND status IN ('active', 'trialing');

    -- Un utilisateur peut créer un essai s'il n'a pas d'abonnement actif
    RETURN existing_subscription_count = 0;
END;
$$;


ALTER FUNCTION "public"."can_create_trial"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_create_trial"("p_user_id" "uuid") IS 'Vérifie si un utilisateur peut créer un abonnement d''essai';



CREATE OR REPLACE FUNCTION "public"."can_user_delete_account"("p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_companies_as_sole_owner JSONB := '[]';
    v_result JSON;
    company_record RECORD;
BEGIN
    -- Trouver les entreprises où l'utilisateur est le seul propriétaire
    FOR company_record IN
        SELECT c.id, c.name,
               COUNT(uc2.user_id) FILTER (WHERE uc2.role = 'owner') as owner_count
        FROM companies c
        JOIN user_companies uc ON c.id = uc.company_id
        LEFT JOIN user_companies uc2 ON c.id = uc2.company_id AND uc2.role = 'owner' AND uc2.is_active = true
        WHERE uc.user_id = p_user_id AND uc.role = 'owner' AND uc.is_active = true
        GROUP BY c.id, c.name
        HAVING COUNT(uc2.user_id) FILTER (WHERE uc2.role = 'owner') = 1
    LOOP
        v_companies_as_sole_owner := v_companies_as_sole_owner || jsonb_build_object(
            'company_id', company_record.id,
            'company_name', company_record.name,
            'owner_count', company_record.owner_count
        );
    END LOOP;

    v_result := json_build_object(
        'can_delete', jsonb_array_length(v_companies_as_sole_owner) = 0,
        'companies_as_sole_owner', v_companies_as_sole_owner,
        'requires_ownership_transfer', jsonb_array_length(v_companies_as_sole_owner) > 0,
        'message', CASE
            WHEN jsonb_array_length(v_companies_as_sole_owner) = 0
            THEN 'Account can be deleted safely'
            ELSE 'Ownership transfer required for ' || jsonb_array_length(v_companies_as_sole_owner) || ' companies'
        END
    );

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."can_user_delete_account"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_user_delete_account"("p_user_id" "uuid") IS 'Vérifie si un utilisateur peut supprimer son compte sans impact sur les entreprises';



CREATE OR REPLACE FUNCTION "public"."cancel_subscription"("p_user_id" "uuid", "p_subscription_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE subscriptions
  SET
    cancel_at_period_end = TRUE,
    updated_at = now()
  WHERE id = p_subscription_id
    AND user_id = p_user_id
    AND status IN ('active', 'trialing');

  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."cancel_subscription"("p_user_id" "uuid", "p_subscription_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_trial"("p_user_id" "uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    trial_subscription_id UUID;
BEGIN
    -- Trouver l'abonnement d'essai actif
    SELECT id INTO trial_subscription_id
    FROM subscriptions
    WHERE user_id = p_user_id
    AND status = 'trialing';

    IF trial_subscription_id IS NULL THEN
        RETURN 'NO_ACTIVE_TRIAL';
    END IF;

    -- Annuler l'abonnement
    UPDATE subscriptions
    SET
        status = 'canceled',
        canceled_at = NOW(),
        cancel_reason = p_reason,
        updated_at = NOW()
    WHERE id = trial_subscription_id;

    RETURN 'SUCCESS';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error canceling trial: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."cancel_trial"("p_user_id" "uuid", "p_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cancel_trial"("p_user_id" "uuid", "p_reason" "text") IS 'Annule un abonnement d''essai';



CREATE OR REPLACE FUNCTION "public"."check_index_usage"() RETURNS TABLE("table_name" "text", "index_name" "text", "index_size" "text", "scans" bigint, "tuples_read" bigint, "tuples_fetched" bigint, "efficiency" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname || '.' || tablename as table_name,
        indexrelname as index_name,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched,
        CASE
            WHEN idx_scan = 0 THEN '❌ UNUSED'
            WHEN idx_scan < 100 THEN '⚠️ LOW USAGE'
            WHEN idx_tup_read > idx_tup_fetch * 10 THEN '⚠️ INEFFICIENT'
            ELSE '✅ EFFICIENT'
        END as efficiency
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    AND tablename IN ('customers', 'suppliers', 'invoices', 'purchases',
                      'subscriptions', 'crm_clients', 'crm_opportunities', 'crm_activities')
    ORDER BY idx_scan DESC;
END;
$$;


ALTER FUNCTION "public"."check_index_usage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_rls_health"() RETURNS TABLE("table_name" "text", "rls_enabled" boolean, "policy_count" integer, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.tablename::text,
        t.rowsecurity,
        COALESCE(p.policy_count, 0)::integer,
        CASE
            WHEN NOT t.rowsecurity THEN '🚨 RLS DISABLED'
            WHEN COALESCE(p.policy_count, 0) = 0 THEN '⚠️ NO POLICIES'
            WHEN COALESCE(p.policy_count, 0) < 4 THEN '⚠️ INCOMPLETE POLICIES'
            ELSE '✅ HEALTHY'
        END::text
    FROM pg_tables t
    LEFT JOIN (
        SELECT schemaname, tablename, COUNT(*) as policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY schemaname, tablename
    ) p ON t.schemaname = p.schemaname AND t.tablename = p.tablename
    WHERE t.schemaname = 'public'
    AND t.tablename IN ('customers', 'suppliers', 'invoices', 'purchases',
                        'subscriptions', 'crm_clients', 'crm_opportunities', 'crm_activities')
    ORDER BY t.tablename;
END;
$$;


ALTER FUNCTION "public"."check_rls_health"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_stock_alerts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_alert_exists BOOLEAN;
BEGIN
    -- Vérifier stock faible
    IF NEW.quantity_on_hand <= NEW.minimum_stock AND NEW.minimum_stock > 0 THEN
        -- Vérifier si une alerte existe déjà
        SELECT EXISTS (
            SELECT 1 FROM stock_alerts
            WHERE product_id = NEW.product_id
            AND warehouse_id = NEW.warehouse_id
            AND alert_type = 'low_stock'
            AND is_active = true
        ) INTO v_alert_exists;

        IF NOT v_alert_exists THEN
            INSERT INTO stock_alerts (
                product_id, warehouse_id, company_id,
                alert_type, severity, current_stock, threshold_stock
            ) VALUES (
                NEW.product_id, NEW.warehouse_id, NEW.company_id,
                'low_stock',
                CASE WHEN NEW.quantity_on_hand = 0 THEN 'critical' ELSE 'high' END,
                NEW.quantity_on_hand, NEW.minimum_stock
            );
        END IF;
    END IF;

    -- Vérifier rupture de stock
    IF NEW.quantity_on_hand = 0 THEN
        SELECT EXISTS (
            SELECT 1 FROM stock_alerts
            WHERE product_id = NEW.product_id
            AND warehouse_id = NEW.warehouse_id
            AND alert_type = 'out_of_stock'
            AND is_active = true
        ) INTO v_alert_exists;

        IF NOT v_alert_exists THEN
            INSERT INTO stock_alerts (
                product_id, warehouse_id, company_id,
                alert_type, severity, current_stock, threshold_stock
            ) VALUES (
                NEW.product_id, NEW.warehouse_id, NEW.company_id,
                'out_of_stock', 'critical', 0, 0
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_stock_alerts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_user_permission"("p_user_id" "uuid", "p_company_id" "uuid", "p_resource" "text", "p_action" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_perm RECORD;
    has_permission BOOLEAN := false;
BEGIN
    -- Récupérer les permissions utilisateur
    SELECT * INTO user_perm
    FROM user_permissions
    WHERE user_id = p_user_id
    AND company_id = p_company_id
    AND is_active = true
    AND (valid_until IS NULL OR valid_until > NOW());

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Vérifier les permissions dans le JSON
    SELECT COALESCE(
        (user_perm.permissions->>p_resource)::JSONB ? p_action,
        user_perm.role = 'owner',
        false
    ) INTO has_permission;

    -- Logger l'événement de vérification de permission
    PERFORM log_audit_event(
        'PERMISSION_CHECK',
        'user_permissions',
        user_perm.id::TEXT,
        jsonb_build_object('resource', p_resource, 'action', p_action, 'result', has_permission),
        NULL,
        p_user_id,
        p_company_id,
        'high'
    );

    RETURN has_permission;
END;
$$;


ALTER FUNCTION "public"."check_user_permission"("p_user_id" "uuid", "p_company_id" "uuid", "p_resource" "text", "p_action" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clean_expired_report_cache"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM report_cache WHERE expires_at < NOW();
END;
$$;


ALTER FUNCTION "public"."clean_expired_report_cache"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."convert_trial_to_paid"("p_user_id" "uuid", "p_new_plan_id" "text", "p_stripe_subscription_id" "text" DEFAULT NULL::"text", "p_stripe_customer_id" "text" DEFAULT NULL::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    trial_subscription_id UUID;
    plan_exists BOOLEAN;
BEGIN
    -- Vérifier que le plan existe
    SELECT EXISTS(SELECT 1 FROM subscription_plans WHERE id = p_new_plan_id)
    INTO plan_exists;

    IF NOT plan_exists THEN
        RETURN 'PLAN_NOT_FOUND';
    END IF;

    -- Trouver l'abonnement d'essai actif
    SELECT id INTO trial_subscription_id
    FROM subscriptions
    WHERE user_id = p_user_id
    AND status = 'trialing';

    IF trial_subscription_id IS NULL THEN
        RETURN 'NO_ACTIVE_TRIAL';
    END IF;

    -- Mettre à jour l'abonnement
    UPDATE subscriptions
    SET
        plan_id = p_new_plan_id,
        status = 'active',
        stripe_subscription_id = p_stripe_subscription_id,
        stripe_customer_id = p_stripe_customer_id,
        trial_end = NULL,
        updated_at = NOW()
    WHERE id = trial_subscription_id;

    RETURN 'SUCCESS';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error converting trial to paid: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."convert_trial_to_paid"("p_user_id" "uuid", "p_new_plan_id" "text", "p_stripe_subscription_id" "text", "p_stripe_customer_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."convert_trial_to_paid"("p_user_id" "uuid", "p_new_plan_id" "text", "p_stripe_subscription_id" "text", "p_stripe_customer_id" "text") IS 'Convertit un essai en abonnement payant';



CREATE OR REPLACE FUNCTION "public"."create_audit_trail"("p_table_name" "text", "p_record_id" "text", "p_action" "text", "p_old_values" "jsonb" DEFAULT NULL::"jsonb", "p_new_values" "jsonb" DEFAULT NULL::"jsonb", "p_company_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO audit_logs (
        table_name, record_id, event_type,
        old_values, new_values, company_id, created_at
    )
    VALUES (
        p_table_name, p_record_id, p_action,
        p_old_values, p_new_values, p_company_id, NOW()
    )
    RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$;


ALTER FUNCTION "public"."create_audit_trail"("p_table_name" "text", "p_record_id" "text", "p_action" "text", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_basic_accounts"("p_company_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_count INTEGER := 0;
    basic_accounts TEXT[][] := ARRAY[
        ['101000', 'Capital social', 'equity', '1'],
        ['120000', 'Résultat de l''exercice', 'equity', '1'],
        ['401000', 'Fournisseurs', 'liability', '4'],
        ['411000', 'Clients', 'asset', '4'],
        ['445660', 'TVA déductible', 'asset', '4'],
        ['445710', 'TVA collectée', 'liability', '4'],
        ['512000', 'Banque', 'asset', '5'],
        ['530000', 'Caisse', 'asset', '5'],
        ['601000', 'Achats', 'expense', '6'],
        ['701000', 'Ventes', 'revenue', '7']
    ];
    account_data TEXT[];
BEGIN
    FOREACH account_data SLICE 1 IN ARRAY basic_accounts
    LOOP
        INSERT INTO accounts (
            company_id,
            account_number,
            account_name,
            account_type,
            account_class,
            normal_balance
        ) VALUES (
            p_company_id,
            account_data[1],
            account_data[2],
            account_data[3],
            account_data[4]::INTEGER,
            CASE
                WHEN account_data[3] IN ('asset', 'expense') THEN 'debit'
                ELSE 'credit'
            END
        ) ON CONFLICT (company_id, account_number) DO NOTHING;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."create_basic_accounts"("p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_budget_with_standard_categories"("p_company_id" "uuid", "p_budget_year" integer, "p_budget_name" "text", "p_country_code" "text" DEFAULT 'FR'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_budget_id UUID;
  v_categories_count INTEGER;
BEGIN
  -- Créer le budget
  INSERT INTO budgets (
    company_id,
    budget_year,
    name,
    description,
    version,
    status,
    start_date,
    end_date
  )
  VALUES (
    p_company_id,
    p_budget_year,
    p_budget_name,
    'Budget avec catégories standards ' || p_country_code,
    1,
    'draft',
    make_date(p_budget_year, 1, 1),
    make_date(p_budget_year, 12, 31)
  )
  RETURNING id INTO v_budget_id;

  -- Initialiser les catégories et mappings
  v_categories_count := initialize_budget_category_mappings(
    p_company_id,
    v_budget_id,
    p_country_code
  );

  -- Log du nombre de catégories créées
  RAISE NOTICE 'Budget créé avec % catégories standards', v_categories_count;

  RETURN v_budget_id;
END;
$$;


ALTER FUNCTION "public"."create_budget_with_standard_categories"("p_company_id" "uuid", "p_budget_year" integer, "p_budget_name" "text", "p_country_code" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_budget_with_standard_categories"("p_company_id" "uuid", "p_budget_year" integer, "p_budget_name" "text", "p_country_code" "text") IS 'Crée un nouveau budget avec toutes les catégories standards pré-configurées';



CREATE OR REPLACE FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text" DEFAULT 'info'::"text", "p_category" "text" DEFAULT 'general'::"text", "p_link" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb", "p_expires_in_days" integer DEFAULT NULL::integer) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_notification_id UUID;
  v_preferences RECORD;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id);

    SELECT * INTO v_preferences
    FROM notification_preferences
    WHERE user_id = p_user_id;
  END IF;

  IF NOT v_preferences.in_app_enabled THEN
    RETURN NULL;
  END IF;

  IF (p_category = 'system' AND NOT v_preferences.system_notifications) OR
     (p_category = 'billing' AND NOT v_preferences.billing_notifications) OR
     (p_category = 'feature' AND NOT v_preferences.feature_notifications) OR
     (p_category = 'security' AND NOT v_preferences.security_notifications) OR
     (p_category = 'general' AND NOT v_preferences.general_notifications) THEN
    RETURN NULL;
  END IF;

  IF p_expires_in_days IS NOT NULL THEN
    v_expires_at := now() + (p_expires_in_days || ' days')::INTERVAL;
  END IF;

  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    category,
    link,
    metadata,
    expires_at
  )
  VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_category,
    p_link,
    p_metadata,
    v_expires_at
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;


ALTER FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_category" "text", "p_link" "text", "p_metadata" "jsonb", "p_expires_in_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_onboarding_session"("p_company_id" "uuid", "p_user_id" "uuid", "p_initial_data" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_session_token TEXT;
BEGIN
    -- Générer token unique
    v_session_token := gen_random_uuid()::text;

    -- Créer la session
    INSERT INTO onboarding_sessions (
        company_id,
        user_id,
        session_token,
        initial_data
    ) VALUES (
        p_company_id,
        p_user_id,
        v_session_token,
        p_initial_data
    );

    RETURN v_session_token;
END;
$$;


ALTER FUNCTION "public"."create_onboarding_session"("p_company_id" "uuid", "p_user_id" "uuid", "p_initial_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_trial_subscription"("p_user_id" "uuid", "p_company_id" "uuid" DEFAULT NULL::"uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_existing_subscription UUID;
  v_trial_plan_id TEXT := 'trial';
  v_trial_days INTEGER := 14;
  v_new_subscription_id UUID;
BEGIN
  SELECT id INTO v_existing_subscription
  FROM subscriptions
  WHERE user_id = p_user_id
    AND status IN ('active', 'trialing', 'past_due');

  IF FOUND THEN
    RETURN 'ALREADY_EXISTS';
  END IF;

  INSERT INTO subscriptions (
    user_id,
    company_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    trial_end
  )
  VALUES (
    p_user_id,
    p_company_id,
    v_trial_plan_id,
    'trialing',
    now(),
    now() + INTERVAL '1 year',
    now() + (v_trial_days || ' days')::INTERVAL
  )
  RETURNING id INTO v_new_subscription_id;

  RETURN v_new_subscription_id::TEXT;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur création abonnement essai: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."create_trial_subscription"("p_user_id" "uuid", "p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."daily_security_report"() RETURNS TABLE("report_line" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    rls_issues integer;
    unused_indexes integer;
    total_tables integer;
BEGIN
    -- Compter les problèmes RLS
    SELECT COUNT(*) INTO rls_issues
    FROM public.check_rls_health()
    WHERE status NOT LIKE '✅%';

    -- Compter les index inutilisés
    SELECT COUNT(*) INTO unused_indexes
    FROM public.check_index_usage()
    WHERE efficiency = '❌ UNUSED';

    -- Total des tables surveillées
    SELECT 9 INTO total_tables;

    RETURN QUERY VALUES
        ('============================================'),
        ('CASSKAI - RAPPORT SÉCURITÉ QUOTIDIEN'),
        ('============================================'),
        ('Date: ' || CURRENT_DATE::text),
        ('Tables surveillées: ' || total_tables::text || '/9'),
        ('Problèmes RLS: ' || rls_issues::text),
        ('Index inutilisés: ' || unused_indexes::text),
        (''),
        ('DÉTAIL RLS:'),
        ('============================================');

    -- Ajouter les détails RLS
    RETURN QUERY
    SELECT table_name || ': ' || status
    FROM public.check_rls_health();

    RETURN QUERY VALUES
        (''),
        ('PERFORMANCE INDEX:'),
        ('============================================');

    -- Ajouter les détails des index
    RETURN QUERY
    SELECT index_name || ' (' || table_name || '): ' || efficiency || ' - ' || scans::text || ' scans'
    FROM public.check_index_usage()
    WHERE efficiency != '✅ EFFICIENT'
    ORDER BY scans DESC;

    RETURN QUERY VALUES
        (''),
        ('============================================'),
        (CASE
            WHEN rls_issues = 0 AND unused_indexes < 3 THEN 'STATUT: 🟢 SYSTÈME SAIN'
            WHEN rls_issues > 0 THEN 'STATUT: 🔴 ACTION REQUISE (RLS)'
            ELSE 'STATUT: 🟡 OPTIMISATION RECOMMANDÉE'
        END);

END;
$$;


ALTER FUNCTION "public"."daily_security_report"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_client"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    DELETE FROM crm_clients WHERE id = OLD.id;
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."delete_client"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_client_from_view"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    DELETE FROM crm_clients WHERE id = OLD.id;
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."delete_client_from_view"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_commercial_action"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    DELETE FROM crm_activities WHERE id = OLD.id;
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."delete_commercial_action"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_opportunity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    DELETE FROM crm_opportunities WHERE id = OLD.id;
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."delete_opportunity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."detect_suspicious_access"() RETURNS TABLE("event_time" timestamp without time zone, "user_id" "uuid", "table_accessed" "text", "operation" "text", "row_count" bigint, "risk_level" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Cette fonction nécessiterait des logs d'audit activés
    -- Pour l'instant, retourne une structure vide
    RETURN QUERY
    SELECT
        NOW()::timestamp,
        auth.uid(),
        'example_table'::text,
        'SELECT'::text,
        0::bigint,
        '✅ NO SUSPICIOUS ACTIVITY'::text
    LIMIT 0;
END;
$$;


ALTER FUNCTION "public"."detect_suspicious_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."detect_suspicious_activity"() RETURNS TABLE("user_id" "uuid", "suspicious_events" integer, "risk_score" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        se.user_id,
        COUNT(*)::INTEGER as suspicious_events,
        CASE
            WHEN COUNT(*) > 10 THEN 100
            WHEN COUNT(*) > 5 THEN 75
            WHEN COUNT(*) > 2 THEN 50
            ELSE 25
        END::INTEGER as risk_score
    FROM security_events se
    WHERE se.event_timestamp >= NOW() - INTERVAL '1 hour'
    AND se.severity_level IN ('critical', 'warning')
    GROUP BY se.user_id
    HAVING COUNT(*) >= 2
    ORDER BY suspicious_events DESC;
END;
$$;


ALTER FUNCTION "public"."detect_suspicious_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enable_company_feature"("p_company_id" "uuid", "p_feature_name" "text", "p_configuration" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("success" boolean, "message" "text", "feature_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_feature_record RECORD;
    v_feature_id UUID;
    v_user_plan TEXT := 'free'; -- À adapter selon votre logique de plan
BEGIN
    -- Vérifier que la feature existe et est active
    SELECT * INTO v_feature_record
    FROM available_features
    WHERE feature_name = p_feature_name
    AND is_active = true;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Feature not found or inactive', NULL;
        RETURN;
    END IF;

    -- Vérifier les prérequis de plan
    IF v_feature_record.requires_plan != 'free' AND v_user_plan = 'free' THEN
        RETURN QUERY SELECT false, 'Requires premium plan', NULL;
        RETURN;
    END IF;

    -- Vérifier si la feature est déjà activée
    SELECT id INTO v_feature_id
    FROM company_features
    WHERE company_id = p_company_id
    AND feature_name = p_feature_name;

    IF FOUND THEN
        -- Mettre à jour la feature existante
        UPDATE company_features SET
            is_enabled = true,
            configuration = p_configuration,
            updated_at = NOW()
        WHERE id = v_feature_id;

        RETURN QUERY SELECT true, 'Feature updated successfully', v_feature_id;
    ELSE
        -- Créer une nouvelle feature
        INSERT INTO company_features (
            company_id,
            feature_name,
            feature_category,
            is_enabled,
            configuration,
            license_tier,
            usage_limit,
            reset_period
        ) VALUES (
            p_company_id,
            p_feature_name,
            v_feature_record.category,
            true,
            p_configuration,
            v_feature_record.requires_plan,
            v_feature_record.default_usage_limit,
            v_feature_record.default_reset_period
        )
        RETURNING id INTO v_feature_id;

        RETURN QUERY SELECT true, 'Feature enabled successfully', v_feature_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."enable_company_feature"("p_company_id" "uuid", "p_feature_name" "text", "p_configuration" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enable_company_module_advanced"("p_company_id" "uuid", "p_module_key" "text", "p_custom_settings" "jsonb" DEFAULT '{}'::"jsonb", "p_access_level" "text" DEFAULT 'standard'::"text", "p_user_limit" integer DEFAULT NULL::integer, "p_storage_quota_gb" integer DEFAULT 10) RETURNS TABLE("success" boolean, "message" "text", "module_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_module_id UUID;
    v_catalog_record RECORD;
BEGIN
    -- Vérifier que le module existe dans le catalogue
    SELECT * INTO v_catalog_record
    FROM module_catalog
    WHERE module_key = p_module_key
    AND is_active = true;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Module not found in catalog', NULL;
        RETURN;
    END IF;

    -- Vérifier s'il existe déjà
    SELECT id INTO v_module_id
    FROM company_modules
    WHERE company_id = p_company_id
    AND module_key = p_module_key;

    IF FOUND THEN
        -- Mettre à jour le module existant
        UPDATE company_modules SET
            is_enabled = true,
            custom_settings = p_custom_settings,
            access_level = p_access_level,
            user_limit = p_user_limit,
            storage_quota_gb = p_storage_quota_gb,
            updated_at = NOW()
        WHERE id = v_module_id;

        RETURN QUERY SELECT true, 'Module updated successfully', v_module_id;
    ELSE
        -- Créer un nouveau module avec configuration avancée
        INSERT INTO company_modules (
            company_id,
            module_key,
            module_name,
            is_enabled,
            custom_settings,
            access_level,
            license_type,
            user_limit,
            storage_quota_gb,
            display_order
        ) VALUES (
            p_company_id,
            p_module_key,
            v_catalog_record.display_name_fr,
            true,
            p_custom_settings,
            p_access_level,
            v_catalog_record.requires_plan,
            p_user_limit,
            p_storage_quota_gb,
            v_catalog_record.sort_order
        )
        RETURNING id INTO v_module_id;

        RETURN QUERY SELECT true, 'Module enabled successfully', v_module_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."enable_company_module_advanced"("p_company_id" "uuid", "p_module_key" "text", "p_custom_settings" "jsonb", "p_access_level" "text", "p_user_limit" integer, "p_storage_quota_gb" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."encrypt_sensitive_data"("p_data" "text", "p_key_name" "text" DEFAULT 'default_data_key'::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    -- Récupérer la clé de chiffrement
    SELECT encrypted_key INTO encryption_key
    FROM encryption_keys
    WHERE key_name = p_key_name AND status = 'active';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Encryption key not found or inactive: %', p_key_name;
    END IF;

    -- Incrémenter le compteur d'usage
    UPDATE encryption_keys
    SET usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE key_name = p_key_name;

    -- Retourner la donnée chiffrée (simulation - en production, utiliser une vraie clé)
    RETURN encode(digest(p_data || encryption_key, 'sha256'), 'base64');
END;
$$;


ALTER FUNCTION "public"."encrypt_sensitive_data"("p_data" "text", "p_key_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_old_invitations"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE company_invitations
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at < NOW();
END;
$$;


ALTER FUNCTION "public"."expire_old_invitations"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."expire_old_invitations"() IS 'Expire automatiquement les invitations anciennes';



CREATE OR REPLACE FUNCTION "public"."expire_trials"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Mettre à jour les essais expirés
    WITH expired_trials AS (
        UPDATE subscriptions
        SET
            status = 'expired',
            updated_at = NOW()
        WHERE status = 'trialing'
        AND trial_end < NOW()
        RETURNING id
    )
    SELECT COUNT(*) INTO expired_count FROM expired_trials;

    RETURN expired_count;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error expiring trials: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."expire_trials"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."expire_trials"() IS 'Expire automatiquement les essais arrivés à échéance';



CREATE OR REPLACE FUNCTION "public"."generate_balance_sheet"("company_id_param" "uuid", "end_date_param" "date") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
    WITH account_balances AS (
        -- Calculer les soldes de chaque compte jusqu'à la date donnée
        SELECT
            a.id,
            a.account_number,
            a.name,
            a.type,
            a.class,
            COALESCE(SUM(jei.debit_amount - jei.credit_amount), 0) as balance
        FROM accounts a
        LEFT JOIN journal_entry_items jei ON jei.account_id = a.id
        LEFT JOIN journal_entries je ON je.id = jei.journal_entry_id
        WHERE a.company_id = company_id_param
          AND a.is_active = true
          AND je.status = 'posted'
          AND je.entry_date <= end_date_param
        GROUP BY a.id, a.account_number, a.name, a.type, a.class
    ),
    balance_sheet_data AS (
        SELECT
            -- ACTIF CIRCULANT
            SUM(CASE WHEN ab.type = 'asset' AND ab.class BETWEEN 1 AND 5 AND ab.account_number LIKE '512%' THEN ab.balance ELSE 0 END) as cash_and_equivalents,
            SUM(CASE WHEN ab.type = 'asset' AND ab.class BETWEEN 1 AND 5 AND ab.account_number LIKE '411%' THEN ab.balance ELSE 0 END) as accounts_receivable,
            SUM(CASE WHEN ab.type = 'asset' AND ab.class BETWEEN 1 AND 5 AND ab.account_number LIKE '3%' THEN ab.balance ELSE 0 END) as inventory,
            SUM(CASE WHEN ab.type = 'asset' AND ab.class BETWEEN 1 AND 5 AND ab.account_number LIKE '486%' THEN ab.balance ELSE 0 END) as prepaid_expenses,
            SUM(CASE WHEN ab.type = 'asset' AND ab.class BETWEEN 1 AND 5 AND ab.account_number NOT LIKE '512%' AND ab.account_number NOT LIKE '411%' AND ab.account_number NOT LIKE '3%' AND ab.account_number NOT LIKE '486%' THEN ab.balance ELSE 0 END) as other_current_assets,

            -- ACTIF IMMOBILISÉ
            SUM(CASE WHEN ab.type = 'asset' AND ab.class BETWEEN 2 AND 3 AND ab.account_number LIKE '21%' THEN ab.balance ELSE 0 END) as property_plant_equipment,
            SUM(CASE WHEN ab.type = 'asset' AND ab.class BETWEEN 2 AND 3 AND ab.account_number LIKE '20%' THEN ab.balance ELSE 0 END) as intangible_assets,
            SUM(CASE WHEN ab.type = 'asset' AND ab.class BETWEEN 2 AND 3 AND ab.account_number LIKE '25%' THEN ab.balance ELSE 0 END) as investments,
            SUM(CASE WHEN ab.type = 'asset' AND ab.class BETWEEN 2 AND 3 AND ab.account_number NOT LIKE '21%' AND ab.account_number NOT LIKE '20%' AND ab.account_number NOT LIKE '25%' THEN ab.balance ELSE 0 END) as other_non_current_assets,

            -- PASSIF CIRCULANT
            SUM(CASE WHEN ab.type = 'liability' AND ab.class BETWEEN 1 AND 5 AND ab.account_number LIKE '401%' THEN ab.balance ELSE 0 END) as accounts_payable,
            SUM(CASE WHEN ab.type = 'liability' AND ab.class BETWEEN 1 AND 5 AND ab.account_number LIKE '16%' THEN ab.balance ELSE 0 END) as short_term_debt,
            SUM(CASE WHEN ab.type = 'liability' AND ab.class BETWEEN 1 AND 5 AND ab.account_number LIKE '42%' THEN ab.balance ELSE 0 END) as accrued_expenses,
            SUM(CASE WHEN ab.type = 'liability' AND ab.class BETWEEN 1 AND 5 AND ab.account_number NOT LIKE '401%' AND ab.account_number NOT LIKE '16%' AND ab.account_number NOT LIKE '42%' THEN ab.balance ELSE 0 END) as other_current_liabilities,

            -- PASSIF NON COURANT
            SUM(CASE WHEN ab.type = 'liability' AND ab.class BETWEEN 2 AND 3 THEN ab.balance ELSE 0 END) as long_term_debt,

            -- CAPITAUX PROPRES
            SUM(CASE WHEN ab.type = 'equity' THEN ab.balance ELSE 0 END) as equity
        FROM account_balances ab
    )
    SELECT jsonb_build_object(
        'assets', jsonb_build_object(
            'current_assets', jsonb_build_object(
                'cash_and_equivalents', cash_and_equivalents,
                'accounts_receivable', accounts_receivable,
                'inventory', inventory,
                'prepaid_expenses', prepaid_expenses,
                'other_current_assets', other_current_assets,
                'total_current_assets', (cash_and_equivalents + accounts_receivable + inventory + prepaid_expenses + other_current_assets)
            ),
            'non_current_assets', jsonb_build_object(
                'property_plant_equipment', property_plant_equipment,
                'intangible_assets', intangible_assets,
                'investments', investments,
                'other_non_current_assets', other_non_current_assets,
                'total_non_current_assets', (property_plant_equipment + intangible_assets + investments + other_non_current_assets)
            ),
            'total_assets', (cash_and_equivalents + accounts_receivable + inventory + prepaid_expenses + other_current_assets + property_plant_equipment + intangible_assets + investments + other_non_current_assets)
        ),
        'liabilities', jsonb_build_object(
            'current_liabilities', jsonb_build_object(
                'accounts_payable', accounts_payable,
                'short_term_debt', short_term_debt,
                'accrued_expenses', accrued_expenses,
                'other_current_liabilities', other_current_liabilities,
                'total_current_liabilities', (accounts_payable + short_term_debt + accrued_expenses + other_current_liabilities)
            ),
            'non_current_liabilities', jsonb_build_object(
                'long_term_debt', long_term_debt,
                'total_non_current_liabilities', long_term_debt
            ),
            'equity', jsonb_build_object(
                'equity', equity,
                'total_equity', equity
            ),
            'total_liabilities_and_equity', (accounts_payable + short_term_debt + accrued_expenses + other_current_liabilities + long_term_debt + equity)
        )
    ) as balance_sheet
    FROM balance_sheet_data;
$$;


ALTER FUNCTION "public"."generate_balance_sheet"("company_id_param" "uuid", "end_date_param" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_cash_flow_forecast"("p_company_id" "uuid", "p_months_ahead" integer DEFAULT 12) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result JSON;
    v_monthly_data JSON[];
    v_current_balance DECIMAL(15,2) := 0;
    v_avg_monthly_income DECIMAL(15,2) := 0;
    v_avg_monthly_expenses DECIMAL(15,2) := 0;
    v_month_date DATE;
    v_projected_balance DECIMAL(15,2);
    i INTEGER;
BEGIN
    -- Position actuelle
    SELECT COALESCE(SUM(current_balance), 0)
    INTO v_current_balance
    FROM bank_accounts
    WHERE company_id = p_company_id AND is_active = true;

    -- Revenus mensuels moyens (6 derniers mois)
    SELECT COALESCE(AVG(monthly_revenue), 0)
    FROM (
        SELECT SUM(total_incl_tax) as monthly_revenue
        FROM invoices
        WHERE company_id = p_company_id
          AND status = 'paid'
          AND invoice_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', invoice_date)
    ) t
    INTO v_avg_monthly_income;

    -- Dépenses mensuelles moyennes (6 derniers mois)
    SELECT COALESCE(AVG(monthly_expenses), 0)
    FROM (
        SELECT SUM(jel.debit_amount) as monthly_expenses
        FROM journal_entry_lines jel
        JOIN journal_entries je ON je.id = jel.journal_entry_id
        JOIN chart_of_accounts coa ON coa.id = jel.account_id
        WHERE je.company_id = p_company_id
          AND coa.account_type = 'expense'
          AND je.entry_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', je.entry_date)
    ) t
    INTO v_avg_monthly_expenses;

    -- Génération des prévisions
    v_monthly_data := ARRAY[]::JSON[];
    v_projected_balance := v_current_balance;

    FOR i IN 1..p_months_ahead LOOP
        v_month_date := DATE_TRUNC('month', CURRENT_DATE) + (i || ' months')::INTERVAL;
        v_projected_balance := v_projected_balance + v_avg_monthly_income - v_avg_monthly_expenses;

        v_monthly_data := v_monthly_data || json_build_object(
            'month', TO_CHAR(v_month_date, 'YYYY-MM'),
            'projected_income', v_avg_monthly_income,
            'projected_expenses', v_avg_monthly_expenses,
            'net_cash_flow', v_avg_monthly_income - v_avg_monthly_expenses,
            'projected_balance', v_projected_balance,
            'confidence_level', CASE
                WHEN i <= 3 THEN 85
                WHEN i <= 6 THEN 70
                ELSE 55
            END
        );
    END LOOP;

    v_result := array_to_json(v_monthly_data);

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."generate_cash_flow_forecast"("p_company_id" "uuid", "p_months_ahead" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_cash_flow_forecast"("p_company_id" "uuid", "p_months_ahead" integer) IS 'Génère des prévisions de trésorerie sur N mois';



CREATE OR REPLACE FUNCTION "public"."generate_cash_flow_statement"("company_id_param" "uuid", "start_date_param" "date", "end_date_param" "date") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
    WITH cash_flow_data AS (
        SELECT
            -- FLUX DE TRÉSORERIE D'EXPLOITATION
            SUM(CASE WHEN account_number LIKE '512%' AND jei.debit_amount > 0 THEN jei.debit_amount ELSE 0 END) -
            SUM(CASE WHEN account_number LIKE '512%' AND jei.credit_amount > 0 THEN jei.credit_amount ELSE 0 END) as operating_cash_flow,

            -- FLUX DE TRÉSORERIE D'INVESTISSEMENT
            SUM(CASE WHEN account_number LIKE '21%' AND jei.debit_amount > 0 THEN jei.debit_amount ELSE 0 END) -
            SUM(CASE WHEN account_number LIKE '21%' AND jei.credit_amount > 0 THEN jei.credit_amount ELSE 0 END) as investing_cash_flow,

            -- FLUX DE TRÉSORERIE DE FINANCEMENT
            SUM(CASE WHEN account_number LIKE '101%' AND jei.debit_amount > 0 THEN jei.debit_amount ELSE 0 END) -
            SUM(CASE WHEN account_number LIKE '101%' AND jei.credit_amount > 0 THEN jei.credit_amount ELSE 0 END) as financing_cash_flow
        FROM journal_entry_items jei
        JOIN journal_entries je ON je.id = jei.journal_entry_id
        JOIN accounts a ON a.id = jei.account_id
        WHERE a.company_id = company_id_param
          AND je.status = 'posted'
          AND je.entry_date BETWEEN start_date_param AND end_date_param
    )
    SELECT jsonb_build_object(
        'operating_activities', jsonb_build_object(
            'net_cash_from_operating_activities', operating_cash_flow
        ),
        'investing_activities', jsonb_build_object(
            'net_cash_from_investing_activities', investing_cash_flow
        ),
        'financing_activities', jsonb_build_object(
            'net_cash_from_financing_activities', financing_cash_flow
        ),
        'net_cash_flow', (operating_cash_flow + investing_cash_flow + financing_cash_flow)
    ) as cash_flow_statement
    FROM cash_flow_data;
$$;


ALTER FUNCTION "public"."generate_cash_flow_statement"("company_id_param" "uuid", "start_date_param" "date", "end_date_param" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_compliance_report"("p_company_id" "uuid", "p_report_type" "text", "p_period_start" "date", "p_period_end" "date") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    report_id UUID;
    audit_count INTEGER;
    security_events_count INTEGER;
    report_data JSONB;
BEGIN
    -- Compter les événements d'audit
    SELECT COUNT(*) INTO audit_count
    FROM audit_logs
    WHERE company_id = p_company_id
    AND event_timestamp BETWEEN p_period_start AND p_period_end;

    -- Compter les événements de sécurité
    SELECT COUNT(*) INTO security_events_count
    FROM security_events
    WHERE company_id = p_company_id
    AND event_timestamp BETWEEN p_period_start AND p_period_end;

    -- Construire les données du rapport
    report_data := jsonb_build_object(
        'audit_events', audit_count,
        'security_events', security_events_count,
        'period', jsonb_build_object(
            'start', p_period_start,
            'end', p_period_end
        ),
        'generated_at', NOW()
    );

    -- Créer le rapport
    INSERT INTO compliance_reports (
        report_type, report_name, company_id,
        period_start, period_end,
        report_data, total_records_analyzed,
        generated_by
    ) VALUES (
        p_report_type,
        CONCAT(p_report_type, ' - ', p_period_start, ' to ', p_period_end),
        p_company_id,
        p_period_start, p_period_end,
        report_data, audit_count + security_events_count,
        auth.uid()
    ) RETURNING id INTO report_id;

    RETURN report_id;
END;
$$;


ALTER FUNCTION "public"."generate_compliance_report"("p_company_id" "uuid", "p_report_type" "text", "p_period_start" "date", "p_period_end" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_income_statement"("company_id_param" "uuid", "start_date_param" "date", "end_date_param" "date") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
    WITH account_balances AS (
        SELECT
            a.id,
            a.account_number,
            a.name,
            a.type,
            a.class,
            COALESCE(SUM(jei.debit_amount - jei.credit_amount), 0) as balance
        FROM accounts a
        LEFT JOIN journal_entry_items jei ON jei.account_id = a.id
        LEFT JOIN journal_entries je ON je.id = jei.journal_entry_id
        WHERE a.company_id = company_id_param
          AND a.is_active = true
          AND je.status = 'posted'
          AND je.entry_date BETWEEN start_date_param AND end_date_param
        GROUP BY a.id, a.account_number, a.name, a.type, a.class
    ),
    income_statement_data AS (
        SELECT
            -- PRODUITS D'EXPLOITATION
            SUM(CASE WHEN ab.type = 'revenue' AND ab.account_number LIKE '70%' THEN ab.balance ELSE 0 END) as sales_revenue,
            SUM(CASE WHEN ab.type = 'revenue' AND ab.account_number LIKE '71%' THEN ab.balance ELSE 0 END) as service_revenue,
            SUM(CASE WHEN ab.type = 'revenue' AND ab.account_number NOT LIKE '70%' AND ab.account_number NOT LIKE '71%' THEN ab.balance ELSE 0 END) as other_revenue,

            -- CHARGES D'EXPLOITATION
            SUM(CASE WHEN ab.type = 'expense' AND ab.account_number LIKE '60%' THEN ab.balance ELSE 0 END) as purchases,
            SUM(CASE WHEN ab.type = 'expense' AND ab.account_number LIKE '61%' THEN ab.balance ELSE 0 END) as external_services,
            SUM(CASE WHEN ab.type = 'expense' AND ab.account_number LIKE '62%' THEN ab.balance ELSE 0 END) as personnel_expenses,
            SUM(CASE WHEN ab.type = 'expense' AND ab.account_number LIKE '63%' THEN ab.balance ELSE 0 END) as other_expenses,

            -- RÉSULTAT D'EXPLOITATION
            SUM(CASE WHEN ab.type = 'revenue' THEN ab.balance ELSE 0 END) - SUM(CASE WHEN ab.type = 'expense' THEN ab.balance ELSE 0 END) as operating_profit
        FROM account_balances ab
    )
    SELECT jsonb_build_object(
        'revenue', jsonb_build_object(
            'sales_revenue', sales_revenue,
            'service_revenue', service_revenue,
            'other_revenue', other_revenue,
            'total_revenue', (sales_revenue + service_revenue + other_revenue)
        ),
        'expenses', jsonb_build_object(
            'purchases', purchases,
            'external_services', external_services,
            'personnel_expenses', personnel_expenses,
            'other_expenses', other_expenses,
            'total_expenses', (purchases + external_services + personnel_expenses + other_expenses)
        ),
        'profit', jsonb_build_object(
            'operating_profit', operating_profit,
            'net_profit', operating_profit
        )
    ) as income_statement
    FROM income_statement_data;
$$;


ALTER FUNCTION "public"."generate_income_statement"("company_id_param" "uuid", "start_date_param" "date", "end_date_param" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invoice_number_custom"("p_company_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_year TEXT;
    v_sequence INTEGER;
    v_invoice_number TEXT;
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

    -- Récupérer le prochain numéro de séquence pour l'année
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(invoice_number FROM position('-' IN invoice_number) + 1) AS INTEGER
        )
    ), 0) + 1
    INTO v_sequence
    FROM invoices
    WHERE company_id = p_company_id
        AND invoice_number LIKE 'FAC' || v_year || '-%';

    v_invoice_number := 'FAC' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');

    RETURN v_invoice_number;
END;
$$;


ALTER FUNCTION "public"."generate_invoice_number_custom"("p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_purchase_number"("p_company_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_year TEXT := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    v_sequence INTEGER;
    v_number TEXT;
BEGIN
    -- Obtenir le prochain numéro de séquence pour l'année
    SELECT COALESCE(MAX(CAST(SUBSTRING(purchase_number FROM 'ACH' || v_year || '-(\d+)') AS INTEGER)), 0) + 1
    INTO v_sequence
    FROM purchases
    WHERE company_id = p_company_id
    AND purchase_number LIKE 'ACH' || v_year || '-%';

    -- Générer le numéro formaté
    v_number := 'ACH' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');

    RETURN v_number;
END;
$$;


ALTER FUNCTION "public"."generate_purchase_number"("p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_quote_number"("p_company_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_year TEXT;
    v_sequence INTEGER;
    v_quote_number TEXT;
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

    -- Récupérer le prochain numéro de séquence pour l'année
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(quote_number FROM position('-' IN quote_number) + 1) AS INTEGER
        )
    ), 0) + 1
    INTO v_sequence
    FROM quotes
    WHERE company_id = p_company_id
        AND quote_number LIKE 'DEV' || v_year || '-%';

    v_quote_number := 'DEV' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');

    RETURN v_quote_number;
END;
$$;


ALTER FUNCTION "public"."generate_quote_number"("p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_sales_report"("p_company_id" "uuid", "p_start_date" "date", "p_end_date" "date") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'period', jsonb_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date
        ),
        'total_sales', COALESCE(SUM(total_amount), 0),
        'invoice_count', COUNT(*),
        'status', 'completed',
        'generated_at', NOW()
    )
    INTO v_result
    FROM invoices
    WHERE company_id = p_company_id
    AND invoice_date BETWEEN p_start_date AND p_end_date;

    RETURN COALESCE(v_result, '{"error": "No data found"}'::jsonb);
END;
$$;


ALTER FUNCTION "public"."generate_sales_report"("p_company_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_trial_balance"("company_id_param" "uuid", "end_date_param" "date") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
    SELECT jsonb_agg(
        jsonb_build_object(
            'account_number', account_number,
            'account_name', account_name,
            'debit_balance', debit_balance,
            'credit_balance', credit_balance,
            'net_balance', net_balance
        )
        ORDER BY account_number
    ) as trial_balance
    FROM (
        SELECT
            a.account_number,
            a.name as account_name,
            COALESCE(balances.debit_sum, 0) as debit_balance,
            COALESCE(balances.credit_sum, 0) as credit_balance,
            COALESCE(balances.debit_sum, 0) - COALESCE(balances.credit_sum, 0) as net_balance
        FROM accounts a
        LEFT JOIN (
            SELECT
                account_id,
                SUM(debit_amount) as debit_sum,
                SUM(credit_amount) as credit_sum
            FROM journal_entry_items jei
            JOIN journal_entries je ON je.id = jei.journal_entry_id
            WHERE je.company_id = company_id_param
              AND je.status = 'posted'
              AND je.entry_date <= end_date_param
            GROUP BY account_id
        ) balances ON balances.account_id = a.id
        WHERE a.company_id = company_id_param
          AND a.is_active = true
        ORDER BY a.account_number
    ) ordered_accounts;
$$;


ALTER FUNCTION "public"."generate_trial_balance"("company_id_param" "uuid", "end_date_param" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_account_balance_simple"("p_account_id" "uuid", "p_date" "date" DEFAULT CURRENT_DATE) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_balance DECIMAL := 0;
    v_account_type TEXT;
    v_total_debit DECIMAL := 0;
    v_total_credit DECIMAL := 0;
BEGIN
    -- Récupérer le type de compte
    SELECT account_type INTO v_account_type
    FROM accounts WHERE id = p_account_id;

    -- Calculer les totaux
    SELECT
        COALESCE(SUM(debit_amount), 0),
        COALESCE(SUM(credit_amount), 0)
    INTO v_total_debit, v_total_credit
    FROM journal_entry_lines jel
    JOIN journal_entries je ON je.id = jel.journal_entry_id
    WHERE jel.account_id = p_account_id
        AND je.entry_date <= p_date;

    -- Calculer le solde selon le type de compte
    IF v_account_type IN ('asset', 'expense') THEN
        v_balance := v_total_debit - v_total_credit;
    ELSE
        v_balance := v_total_credit - v_total_debit;
    END IF;

    RETURN v_balance;
END;
$$;


ALTER FUNCTION "public"."get_account_balance_simple"("p_account_id" "uuid", "p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_stock_alerts"("p_company_id" "uuid", "p_warehouse_id" "uuid" DEFAULT NULL::"uuid", "p_limit" integer DEFAULT 50) RETURNS TABLE("alert_id" "uuid", "product_name" "text", "warehouse_name" "text", "alert_type" "text", "severity" "text", "current_stock" numeric, "threshold_stock" numeric, "triggered_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        sa.id as alert_id,
        p.name as product_name,
        w.name as warehouse_name,
        sa.alert_type,
        sa.severity,
        sa.current_stock,
        sa.threshold_stock,
        sa.triggered_at
    FROM stock_alerts sa
    JOIN products p ON p.id = sa.product_id
    JOIN warehouses w ON w.id = sa.warehouse_id
    WHERE sa.company_id = p_company_id
    AND sa.is_active = true
    AND sa.is_acknowledged = false
    AND (p_warehouse_id IS NULL OR sa.warehouse_id = p_warehouse_id)
    ORDER BY
        CASE sa.severity
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        sa.triggered_at DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_active_stock_alerts"("p_company_id" "uuid", "p_warehouse_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_allowed_modules_for_plan"("p_plan_id" "text") RETURNS "text"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN CASE
        WHEN p_plan_id = 'trial' THEN ARRAY[
            -- Tous les modules disponibles pendant l'essai
            'dashboard', 'settings', 'users', 'security',
            'accounting', 'invoicing', 'banking', 'purchases', 'thirdParties',
            'reports', 'budget', 'humanResources', 'tax', 'contracts',
            'salesCrm', 'inventory', 'projects', 'onboarding'
        ]
        WHEN p_plan_id IN ('starter_monthly', 'starter_yearly') THEN ARRAY[
            -- Plan Starter : modules de base
            'dashboard', 'settings', 'users', 'security',
            'accounting', 'invoicing', 'banking', 'purchases', 'thirdParties'
        ]
        WHEN p_plan_id IN ('pro_monthly', 'pro_yearly') THEN ARRAY[
            -- Plan Pro : Starter + modules avancés
            'dashboard', 'settings', 'users', 'security',
            'accounting', 'invoicing', 'banking', 'purchases', 'thirdParties',
            'reports', 'budget', 'humanResources', 'tax'
        ]
        WHEN p_plan_id IN ('enterprise_monthly', 'enterprise_yearly') THEN ARRAY[
            -- Plan Enterprise : Pro + modules entreprise
            'dashboard', 'settings', 'users', 'security',
            'accounting', 'invoicing', 'banking', 'purchases', 'thirdParties',
            'reports', 'budget', 'humanResources', 'tax',
            'salesCrm', 'inventory', 'projects', 'contracts'
        ]
        WHEN p_plan_id = 'free' THEN ARRAY[
            -- Plan gratuit (limité)
            'dashboard', 'settings', 'users', 'security',
            'accounting', 'invoicing'
        ]
        ELSE ARRAY['dashboard', 'settings'] -- Plan de base limité
    END;
END;
$$;


ALTER FUNCTION "public"."get_allowed_modules_for_plan"("p_plan_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_allowed_modules_for_plan"("p_plan_id" "text") IS 'Retourne la liste des modules autorisés pour un plan d''abonnement donné - Synchronisé avec le frontend';



CREATE OR REPLACE FUNCTION "public"."get_balance_sheet_data"("p_company_id" "uuid", "p_date_from" "date", "p_date_to" "date") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSON;
    assets_data JSON;
    liabilities_data JSON;
    equity_data JSON;
BEGIN
    -- Calculate Assets from journal entries directly
    WITH asset_calculations AS (
        SELECT
            CASE
                WHEN LEFT(je.account_code, 1) = '5' THEN 'cash_and_equivalents'
                WHEN LEFT(je.account_code, 2) = '41' THEN 'accounts_receivable'
                WHEN LEFT(je.account_code, 1) = '3' THEN 'inventory'
                WHEN LEFT(je.account_code, 3) IN ('486', '487') THEN 'prepaid_expenses'
                WHEN LEFT(je.account_code, 1) = '2' AND LEFT(je.account_code, 2) IN ('20', '21') THEN 'intangible_assets'
                WHEN LEFT(je.account_code, 1) = '2' THEN 'fixed_assets'
                WHEN LEFT(je.account_code, 2) IN ('26', '27') THEN 'investments'
                ELSE 'other'
            END AS asset_type,
            COALESCE(SUM(je.debit_amount - je.credit_amount), 0) AS balance
        FROM journal_entries je
        INNER JOIN accounts a ON je.account_code = a.account_number AND a.company_id = p_company_id
        WHERE je.company_id = p_company_id
          AND je.date BETWEEN p_date_from AND p_date_to
          AND a.type = 'asset'
          AND a.is_active = true
        GROUP BY asset_type
    ),
    current_assets AS (
        SELECT
            COALESCE(json_object_agg(asset_type, balance) FILTER (WHERE asset_type IN ('cash_and_equivalents', 'accounts_receivable', 'inventory', 'prepaid_expenses')), '{}'::json) AS current,
            COALESCE(SUM(balance) FILTER (WHERE asset_type IN ('cash_and_equivalents', 'accounts_receivable', 'inventory', 'prepaid_expenses')), 0) AS current_total
        FROM asset_calculations
    ),
    non_current_assets AS (
        SELECT
            COALESCE(json_object_agg(asset_type, balance) FILTER (WHERE asset_type IN ('fixed_assets', 'intangible_assets', 'investments', 'other')), '{}'::json) AS non_current,
            COALESCE(SUM(balance) FILTER (WHERE asset_type IN ('fixed_assets', 'intangible_assets', 'investments', 'other')), 0) AS non_current_total
        FROM asset_calculations
    )
    SELECT json_build_object(
        'current', ca.current,
        'nonCurrent', nca.non_current,
        'total', ca.current_total + nca.non_current_total
    ) INTO assets_data
    FROM current_assets ca, non_current_assets nca;

    -- Calculate Liabilities from journal entries directly
    WITH liability_calculations AS (
        SELECT
            CASE
                WHEN LEFT(je.account_code, 2) = '40' THEN 'accounts_payable'
                WHEN LEFT(je.account_code, 2) IN ('42', '43') THEN 'accrued_expenses'
                WHEN LEFT(je.account_code, 3) = '512' THEN 'short_term_debt'
                WHEN LEFT(je.account_code, 2) IN ('16', '17') THEN 'long_term_debt'
                WHEN LEFT(je.account_code, 3) = '487' THEN 'deferred_revenue'
                ELSE 'other'
            END AS liability_type,
            COALESCE(SUM(je.credit_amount - je.debit_amount), 0) AS balance
        FROM journal_entries je
        INNER JOIN accounts a ON je.account_code = a.account_number AND a.company_id = p_company_id
        WHERE je.company_id = p_company_id
          AND je.date BETWEEN p_date_from AND p_date_to
          AND a.type = 'liability'
          AND a.is_active = true
        GROUP BY liability_type
    ),
    current_liabilities AS (
        SELECT
            COALESCE(json_object_agg(liability_type, balance) FILTER (WHERE liability_type IN ('accounts_payable', 'accrued_expenses', 'short_term_debt', 'deferred_revenue')), '{}'::json) AS current,
            COALESCE(SUM(balance) FILTER (WHERE liability_type IN ('accounts_payable', 'accrued_expenses', 'short_term_debt', 'deferred_revenue')), 0) AS current_total
        FROM liability_calculations
    ),
    non_current_liabilities AS (
        SELECT
            COALESCE(json_object_agg(liability_type, balance) FILTER (WHERE liability_type IN ('long_term_debt', 'other')), '{}'::json) AS non_current,
            COALESCE(SUM(balance) FILTER (WHERE liability_type IN ('long_term_debt', 'other')), 0) AS non_current_total
        FROM liability_calculations
    )
    SELECT json_build_object(
        'current', cl.current,
        'nonCurrent', ncl.non_current,
        'total', cl.current_total + ncl.non_current_total
    ) INTO liabilities_data
    FROM current_liabilities cl, non_current_liabilities ncl;

    -- Calculate Equity from journal entries directly
    WITH equity_calculations AS (
        SELECT
            CASE
                WHEN LEFT(je.account_code, 3) = '101' THEN 'share_capital'
                WHEN LEFT(je.account_code, 2) = '11' THEN 'retained_earnings'
                WHEN LEFT(je.account_code, 2) = '12' THEN 'current_year_result'
                ELSE 'other'
            END AS equity_type,
            COALESCE(SUM(je.credit_amount - je.debit_amount), 0) AS balance
        FROM journal_entries je
        INNER JOIN accounts a ON je.account_code = a.account_number AND a.company_id = p_company_id
        WHERE je.company_id = p_company_id
          AND je.date BETWEEN p_date_from AND p_date_to
          AND a.type = 'equity'
          AND a.is_active = true
        GROUP BY equity_type
    )
    SELECT json_build_object(
        'share_capital', COALESCE(SUM(balance) FILTER (WHERE equity_type = 'share_capital'), 0),
        'retained_earnings', COALESCE(SUM(balance) FILTER (WHERE equity_type = 'retained_earnings'), 0),
        'current_year_result', COALESCE(SUM(balance) FILTER (WHERE equity_type = 'current_year_result'), 0),
        'total', COALESCE(SUM(balance), 0)
    ) INTO equity_data
    FROM equity_calculations;

    -- Build final result
    result := json_build_object(
        'assets', assets_data,
        'liabilities', liabilities_data,
        'equity', equity_data
    );

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_balance_sheet_data"("p_company_id" "uuid", "p_date_from" "date", "p_date_to" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_budget_forecast"("p_company_id" "uuid", "p_budget_id" "uuid", "p_as_of_date" "date", "p_mode" "text" DEFAULT 'prorata'::"text") RETURNS TABLE("year" integer, "month" integer, "category_id" "uuid", "category_code" "text", "category_name" "text", "category_type" "text", "amount_actual" numeric, "amount_budget" numeric, "amount_forecast" numeric, "variance_amount" numeric, "variance_percentage" numeric)
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_current_year INTEGER;
  v_current_month INTEGER;
  v_current_day INTEGER;
  v_days_in_month INTEGER;
  v_prorata_factor NUMERIC;
BEGIN
  -- Extraire date components
  v_current_year := EXTRACT(YEAR FROM p_as_of_date)::INTEGER;
  v_current_month := EXTRACT(MONTH FROM p_as_of_date)::INTEGER;
  v_current_day := EXTRACT(DAY FROM p_as_of_date)::INTEGER;
  v_days_in_month := EXTRACT(DAY FROM (DATE_TRUNC('MONTH', p_as_of_date) + INTERVAL '1 month - 1 day'))::INTEGER;
  v_prorata_factor := v_current_day::NUMERIC / v_days_in_month::NUMERIC;

  RETURN QUERY
  WITH
  -- Réels jusqu'au mois M-1
  actuals AS (
    SELECT
      v.year,
      v.month,
      v.category_id,
      SUM(v.amount_actual) AS amount_actual
    FROM v_actuals_by_category v
    WHERE v.company_id = p_company_id
      AND (v.year < v_current_year OR (v.year = v_current_year AND v.month < v_current_month))
    GROUP BY 1, 2, 3
  ),
  -- Budget complet de l'année
  budget AS (
    SELECT
      vb.year,
      vb.month,
      vb.category_id,
      vb.category_code,
      vb.category_name,
      vb.category_type,
      SUM(vb.amount_budget) AS amount_budget
    FROM v_budget_by_category_monthly vb
    WHERE vb.company_id = p_company_id
      AND vb.budget_id = p_budget_id
      AND vb.year = v_current_year
    GROUP BY 1, 2, 3, 4, 5, 6
  ),
  -- Grille de tous les mois/catégories
  grid AS (
    SELECT DISTINCT
      b.year,
      b.month,
      b.category_id,
      b.category_code,
      b.category_name,
      b.category_type
    FROM budget b
    UNION
    SELECT DISTINCT
      a.year,
      a.month,
      a.category_id,
      b.category_code,
      b.category_name,
      b.category_type
    FROM actuals a
    LEFT JOIN budget b ON b.category_id = a.category_id AND b.month = 1
  )
  SELECT
    g.year,
    g.month,
    g.category_id,
    g.category_code,
    g.category_name,
    g.category_type,
    COALESCE(a.amount_actual, 0) AS amount_actual,
    COALESCE(b.amount_budget, 0) AS amount_budget,
    -- Calcul du forecast selon la période
    CASE
      -- Mois passés complets: réel
      WHEN (g.year < v_current_year OR (g.year = v_current_year AND g.month < v_current_month))
        THEN COALESCE(a.amount_actual, 0)
      -- Mois courant: prorata du budget
      WHEN (g.year = v_current_year AND g.month = v_current_month)
        THEN CASE
          WHEN p_mode = 'prorata' THEN COALESCE(b.amount_budget, 0) * v_prorata_factor
          ELSE COALESCE(b.amount_budget, 0) * v_prorata_factor
        END
      -- Mois futurs: budget plein
      ELSE COALESCE(b.amount_budget, 0)
    END AS amount_forecast,
    -- Écart forecast vs budget
    CASE
      WHEN (g.year < v_current_year OR (g.year = v_current_year AND g.month < v_current_month))
        THEN COALESCE(a.amount_actual, 0) - COALESCE(b.amount_budget, 0)
      WHEN (g.year = v_current_year AND g.month = v_current_month)
        THEN (COALESCE(b.amount_budget, 0) * v_prorata_factor) - COALESCE(b.amount_budget, 0)
      ELSE 0
    END AS variance_amount,
    -- Variance en pourcentage
    CASE
      WHEN COALESCE(b.amount_budget, 0) = 0 THEN 0
      ELSE (
        CASE
          WHEN (g.year < v_current_year OR (g.year = v_current_year AND g.month < v_current_month))
            THEN (COALESCE(a.amount_actual, 0) - COALESCE(b.amount_budget, 0)) / COALESCE(b.amount_budget, 1) * 100
          ELSE 0
        END
      )
    END AS variance_percentage
  FROM grid g
  LEFT JOIN actuals a ON a.year = g.year AND a.month = g.month AND a.category_id = g.category_id
  LEFT JOIN budget b ON b.year = g.year AND b.month = g.month AND b.category_id = g.category_id
  ORDER BY g.year, g.month, g.category_type DESC, g.category_code;
END;
$$;


ALTER FUNCTION "public"."get_budget_forecast"("p_company_id" "uuid", "p_budget_id" "uuid", "p_as_of_date" "date", "p_mode" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_budget_forecast"("p_company_id" "uuid", "p_budget_id" "uuid", "p_as_of_date" "date", "p_mode" "text") IS 'Fonction principale de calcul du forecast budgétaire avec prorata';



CREATE OR REPLACE FUNCTION "public"."get_budget_forecast_kpi"("p_company_id" "uuid", "p_budget_id" "uuid", "p_as_of_date" "date") RETURNS TABLE("total_actual_ytd" numeric, "total_budget_annual" numeric, "total_forecast_eoy" numeric, "variance_vs_budget" numeric, "variance_percentage" numeric, "absorption_rate" numeric)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  WITH forecast_data AS (
    SELECT * FROM get_budget_forecast(p_company_id, p_budget_id, p_as_of_date, 'prorata')
  )
  SELECT
    SUM(CASE WHEN month < EXTRACT(MONTH FROM p_as_of_date) THEN amount_actual ELSE 0 END) AS total_actual_ytd,
    SUM(amount_budget) AS total_budget_annual,
    SUM(amount_forecast) AS total_forecast_eoy,
    SUM(amount_forecast) - SUM(amount_budget) AS variance_vs_budget,
    CASE
      WHEN SUM(amount_budget) = 0 THEN 0
      ELSE (SUM(amount_forecast) - SUM(amount_budget)) / SUM(amount_budget) * 100
    END AS variance_percentage,
    CASE
      WHEN SUM(amount_budget) = 0 THEN 0
      ELSE SUM(CASE WHEN month < EXTRACT(MONTH FROM p_as_of_date) THEN amount_actual ELSE 0 END) / SUM(amount_budget) * 100
    END AS absorption_rate
  FROM forecast_data;
END;
$$;


ALTER FUNCTION "public"."get_budget_forecast_kpi"("p_company_id" "uuid", "p_budget_id" "uuid", "p_as_of_date" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_budget_forecast_kpi"("p_company_id" "uuid", "p_budget_id" "uuid", "p_as_of_date" "date") IS 'KPI synthétiques du forecast (YTD, EOY, écarts)';



CREATE OR REPLACE FUNCTION "public"."get_cash_flow_data"("p_company_id" "uuid", "p_date_from" "date", "p_date_to" "date") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSON;
    operating_activities JSON;
    investing_activities JSON;
    financing_activities JSON;
    net_cash_change NUMERIC;
    beginning_cash NUMERIC;
    ending_cash NUMERIC;
    net_income_val NUMERIC;
BEGIN
    -- Get net income for operating activities base
    SELECT (get_income_statement_data(p_company_id, p_date_from, p_date_to)->>'net_income')::NUMERIC
    INTO net_income_val;

    -- Calculate operating activities (simplifié)
    WITH operating_data AS (
        SELECT
            COALESCE(net_income_val, 0) as net_income,
            -- Depreciation from expenses
            COALESCE(SUM(je.debit_amount - je.credit_amount) FILTER (WHERE LEFT(je.account_code, 3) = '681'), 0) as depreciation,
            -- Working capital changes (approximation)
            COALESCE(SUM(
                CASE
                    WHEN LEFT(je.account_code, 2) = '41' THEN je.credit_amount - je.debit_amount  -- AR decrease
                    WHEN LEFT(je.account_code, 1) = '3' THEN je.credit_amount - je.debit_amount   -- Inventory decrease
                    WHEN LEFT(je.account_code, 2) = '40' THEN je.debit_amount - je.credit_amount  -- AP increase
                    ELSE 0
                END
            ), 0) as working_capital_changes
        FROM journal_entries je
        WHERE je.company_id = p_company_id
          AND je.date BETWEEN p_date_from AND p_date_to
    )
    SELECT json_build_object(
        'net_income', net_income,
        'depreciation', depreciation,
        'working_capital_changes', working_capital_changes,
        'other_adjustments', 0,
        'total', net_income + depreciation + working_capital_changes
    ) INTO operating_activities
    FROM operating_data;

    -- Calculate investing activities (simplifié)
    WITH investing_data AS (
        SELECT
            -- Capital expenditures (purchases of fixed assets)
            -COALESCE(SUM(je.debit_amount - je.credit_amount) FILTER (WHERE LEFT(je.account_code, 1) = '2'), 0) as capex,
            -- Investments
            COALESCE(SUM(je.credit_amount - je.debit_amount) FILTER (WHERE LEFT(je.account_code, 2) IN ('26', '27')), 0) as investments
        FROM journal_entries je
        WHERE je.company_id = p_company_id
          AND je.date BETWEEN p_date_from AND p_date_to
    )
    SELECT json_build_object(
        'capital_expenditures', capex,
        'acquisitions', 0,
        'asset_sales', 0,
        'investments', investments,
        'total', capex + investments
    ) INTO investing_activities
    FROM investing_data;

    -- Calculate financing activities (simplifié)
    WITH financing_data AS (
        SELECT
            -- Debt changes
            COALESCE(SUM(je.debit_amount - je.credit_amount) FILTER (WHERE LEFT(je.account_code, 2) IN ('16', '17') OR je.account_code LIKE '512%'), 0) as debt_changes,
            -- Equity changes
            COALESCE(SUM(je.debit_amount - je.credit_amount) FILTER (WHERE LEFT(je.account_code, 3) = '101'), 0) as equity_changes
        FROM journal_entries je
        WHERE je.company_id = p_company_id
          AND je.date BETWEEN p_date_from AND p_date_to
    )
    SELECT json_build_object(
        'debt_changes', debt_changes,
        'equity_changes', equity_changes,
        'dividends', 0,
        'other', 0,
        'total', debt_changes + equity_changes
    ) INTO financing_activities
    FROM financing_data;

    -- Calculate net cash change and positions
    SELECT
        (operating_activities->>'total')::NUMERIC +
        (investing_activities->>'total')::NUMERIC +
        (financing_activities->>'total')::NUMERIC
    INTO net_cash_change;

    -- Get beginning cash (simplifié)
    SELECT COALESCE(
        SUM(je.debit_amount - je.credit_amount) FILTER (WHERE LEFT(je.account_code, 1) = '5' AND je.date < p_date_from), 0
    ) INTO beginning_cash
    FROM journal_entries je
    WHERE je.company_id = p_company_id;

    ending_cash := COALESCE(beginning_cash, 0) + COALESCE(net_cash_change, 0);

    -- Build final result
    result := json_build_object(
        'operating_activities', operating_activities,
        'investing_activities', investing_activities,
        'financing_activities', financing_activities,
        'net_cash_change', net_cash_change,
        'beginning_cash', beginning_cash,
        'ending_cash', ending_cash
    );

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_cash_flow_data"("p_company_id" "uuid", "p_date_from" "date", "p_date_to" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_company_ai_summary"("p_company_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'active_alerts', (
            SELECT COUNT(*) FROM smart_alerts
            WHERE company_id = p_company_id
            AND is_read = FALSE
            AND is_dismissed = FALSE
        ),
        'recent_insights', (
            SELECT COUNT(*) FROM ai_insights
            WHERE company_id = p_company_id
            AND status = 'active'
            AND created_at > NOW() - INTERVAL '30 days'
        ),
        'tax_optimizations', (
            SELECT COUNT(*) FROM tax_optimizations
            WHERE company_id = p_company_id
            AND status IN ('suggested', 'in_progress')
        ),
        'anomalies_this_month', (
            SELECT COUNT(*) FROM anomaly_detections
            WHERE company_id = p_company_id
            AND status IN ('open', 'investigating')
            AND detected_at > NOW() - INTERVAL '30 days'
        ),
        'ai_interactions_this_week', (
            SELECT COUNT(*) FROM ai_interactions
            WHERE company_id = p_company_id
            AND timestamp > NOW() - INTERVAL '7 days'
        )
    ) INTO result;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_company_ai_summary"("p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_company_features_detailed"("p_company_id" "uuid") RETURNS TABLE("feature_name" "text", "display_name_fr" "text", "category" "text", "is_enabled" boolean, "configuration" "jsonb", "current_usage" integer, "usage_limit" integer, "expires_at" timestamp with time zone, "is_expired" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        cf.feature_name,
        COALESCE(af.display_name_fr, cf.feature_name),
        COALESCE(cf.feature_category, af.category),
        cf.is_enabled,
        cf.configuration,
        cf.current_usage,
        cf.usage_limit,
        cf.expires_at,
        (cf.expires_at IS NOT NULL AND cf.expires_at < NOW()) as is_expired
    FROM company_features cf
    LEFT JOIN available_features af ON cf.feature_name = af.feature_name
    WHERE cf.company_id = p_company_id
    ORDER BY af.sort_order NULLS LAST, cf.feature_name;
END;
$$;


ALTER FUNCTION "public"."get_company_features_detailed"("p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_company_modules_config"("p_company_id" "uuid") RETURNS TABLE("module_key" "text", "display_name" "text", "is_enabled" boolean, "configuration" "jsonb", "access_level" "text", "usage_stats" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        cm.module_key,
        COALESCE(cm.custom_name, mc.display_name_fr, cm.module_name),
        cm.is_enabled,
        cm.custom_settings,
        cm.access_level,
        jsonb_build_object(
            'usage_count', cm.usage_count,
            'last_used_at', cm.last_used_at,
            'activated_at', cm.activated_at,
            'storage_used_gb', 0, -- À implémenter selon vos besoins
            'users_count', 0 -- À implémenter selon vos besoins
        )
    FROM company_modules cm
    LEFT JOIN module_catalog mc ON cm.module_key = mc.module_key
    WHERE cm.company_id = p_company_id
    AND cm.is_enabled = true
    ORDER BY cm.module_priority DESC, cm.display_order;
END;
$$;


ALTER FUNCTION "public"."get_company_modules_config"("p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_complete_company_profile"("p_company_id" "uuid") RETURNS TABLE("id" "uuid", "name" "text", "legal_name" "text", "siret" "text", "sector" "text", "industry_type" "text", "company_size" "text", "ceo_name" "text", "ceo_title" "text", "share_capital" numeric, "registration_date" "date", "timezone" "text", "data_quality_score" integer, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.name,
        c.legal_name,
        c.siret,
        c.sector,
        c.industry_type,
        c.company_size,
        c.ceo_name,
        c.ceo_title,
        c.share_capital,
        c.registration_date,
        c.timezone,
        c.data_quality_score,
        c.status
    FROM companies c
    WHERE c.id = p_company_id;
END;
$$;


ALTER FUNCTION "public"."get_complete_company_profile"("p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_country_config"("country_code_param" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    country_config JSONB;
BEGIN
    SELECT jsonb_build_object(
        'country', row_to_json(c),
        'tax_rates', COALESCE(
            (SELECT jsonb_agg(row_to_json(t))
             FROM tax_rates_catalog t
             WHERE t.country_code = c.code AND t.is_active = true),
            '[]'::jsonb
        ),
        'timezones', COALESCE(
            (SELECT jsonb_agg(row_to_json(tz))
             FROM timezones_catalog tz
             WHERE c.timezone = tz.timezone_name),
            '[]'::jsonb
        )
    ) INTO country_config
    FROM countries_catalog c
    WHERE c.code = country_code_param AND c.is_active = true;

    RETURN COALESCE(country_config, '{}'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_country_config"("country_code_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_crm_stats_real"("company_uuid" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_clients', (
      SELECT COUNT(*) FROM third_parties
      WHERE company_id = company_uuid AND client_type IN ('customer', 'prospect')
    ),
    'total_opportunities', (
      SELECT COUNT(*) FROM crm_opportunities
      WHERE company_id = company_uuid
    ),
    'won_opportunities', (
      SELECT COUNT(*) FROM crm_opportunities
      WHERE company_id = company_uuid AND status = 'won'
    ),
    'lost_opportunities', (
      SELECT COUNT(*) FROM crm_opportunities
      WHERE company_id = company_uuid AND status = 'lost'
    ),
    'pending_opportunities', (
      SELECT COUNT(*) FROM crm_opportunities
      WHERE company_id = company_uuid AND status NOT IN ('won', 'lost')
    ),
    'total_revenue', (
      SELECT COALESCE(SUM(value), 0) FROM crm_opportunities
      WHERE company_id = company_uuid AND status = 'won'
    ),
    'pipeline_value', (
      SELECT COALESCE(SUM(value), 0) FROM crm_opportunities
      WHERE company_id = company_uuid AND status NOT IN ('won', 'lost')
    ),
    'avg_deal_size', (
      SELECT COALESCE(AVG(value), 0) FROM crm_opportunities
      WHERE company_id = company_uuid AND status = 'won'
    ),
    'conversion_rate', (
      SELECT
        CASE
          WHEN COUNT(*) > 0 THEN
            ROUND(
              (COUNT(*) FILTER (WHERE status = 'won')::decimal / COUNT(*)) * 100,
              2
            )
          ELSE 0
        END
      FROM crm_opportunities
      WHERE company_id = company_uuid AND status IN ('won', 'lost')
    )
  ) INTO result;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_crm_stats_real"("company_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_enterprise_dashboard_data"("p_company_id" "uuid", "p_period" "text" DEFAULT 'current_month'::"text", "p_start_date" "date" DEFAULT NULL::"date", "p_end_date" "date" DEFAULT NULL::"date", "p_comparison_period" "text" DEFAULT 'previous_month'::"text", "p_include_forecasts" boolean DEFAULT true, "p_include_benchmarks" boolean DEFAULT false, "p_currency" "text" DEFAULT 'EUR'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result JSON;
    v_start_date DATE;
    v_end_date DATE;
    v_prev_start_date DATE;
    v_prev_end_date DATE;
    v_total_revenue DECIMAL(15,2) := 0;
    v_total_expenses DECIMAL(15,2) := 0;
    v_cash_position DECIMAL(15,2) := 0;
    v_revenue_growth DECIMAL(5,2) := 0;
    v_profit_margin DECIMAL(5,2) := 0;
BEGIN
    -- Calcul des dates de période
    IF p_start_date IS NULL THEN
        CASE p_period
            WHEN 'current_month' THEN
                v_start_date := DATE_TRUNC('month', CURRENT_DATE);
                v_end_date := v_start_date + INTERVAL '1 month' - INTERVAL '1 day';
            WHEN 'current_quarter' THEN
                v_start_date := DATE_TRUNC('quarter', CURRENT_DATE);
                v_end_date := v_start_date + INTERVAL '3 months' - INTERVAL '1 day';
            WHEN 'current_year' THEN
                v_start_date := DATE_TRUNC('year', CURRENT_DATE);
                v_end_date := v_start_date + INTERVAL '1 year' - INTERVAL '1 day';
            ELSE
                v_start_date := DATE_TRUNC('month', CURRENT_DATE);
                v_end_date := v_start_date + INTERVAL '1 month' - INTERVAL '1 day';
        END CASE;
    ELSE
        v_start_date := p_start_date;
        v_end_date := p_end_date;
    END IF;

    -- Calcul des dates de période de comparaison
    CASE p_comparison_period
        WHEN 'previous_month' THEN
            v_prev_start_date := v_start_date - INTERVAL '1 month';
            v_prev_end_date := v_end_date - INTERVAL '1 month';
        WHEN 'previous_year' THEN
            v_prev_start_date := v_start_date - INTERVAL '1 year';
            v_prev_end_date := v_end_date - INTERVAL '1 year';
        ELSE
            v_prev_start_date := v_start_date - INTERVAL '1 month';
            v_prev_end_date := v_end_date - INTERVAL '1 month';
    END CASE;

    -- Calcul du chiffre d'affaires
    SELECT COALESCE(SUM(total_incl_tax), 0)
    INTO v_total_revenue
    FROM invoices
    WHERE company_id = p_company_id
      AND invoice_date BETWEEN v_start_date AND v_end_date
      AND status = 'paid';

    -- Calcul des dépenses (comptes de charges)
    SELECT COALESCE(SUM(jel.debit_amount), 0)
    INTO v_total_expenses
    FROM journal_entry_lines jel
    JOIN journal_entries je ON je.id = jel.journal_entry_id
    JOIN chart_of_accounts coa ON coa.id = jel.account_id
    WHERE je.company_id = p_company_id
      AND je.entry_date BETWEEN v_start_date AND v_end_date
      AND coa.account_type = 'expense';

    -- Position de trésorerie
    SELECT COALESCE(SUM(current_balance), 0)
    INTO v_cash_position
    FROM bank_accounts
    WHERE company_id = p_company_id
      AND is_active = true;

    -- Calcul de la marge
    IF v_total_revenue > 0 THEN
        v_profit_margin := ((v_total_revenue - v_total_expenses) / v_total_revenue) * 100;
    END IF;

    -- Construction du résultat JSON
    v_result := json_build_object(
        'executive_summary', json_build_object(
            'revenue_ytd', v_total_revenue,
            'revenue_growth', v_revenue_growth,
            'profit_margin', v_profit_margin,
            'cash_runway_days', 90, -- Valeur par défaut
            'customer_satisfaction', 85, -- Valeur par défaut
            'market_position', 'Croissance',
            'key_achievements', json_build_array(
                'Objectifs de CA atteints',
                'Nouvelle intégration bancaire',
                'Optimisation des processus'
            ),
            'strategic_priorities', json_build_array(
                'Développement commercial',
                'Digitalisation',
                'Optimisation des coûts'
            )
        ),
        'key_metrics', json_build_array(
            json_build_object(
                'id', 'revenue',
                'title', 'Chiffre d''affaires',
                'current_value', v_total_revenue,
                'unit', 'currency',
                'trend_percentage', v_revenue_growth,
                'color', 'green',
                'category', 'financial'
            ),
            json_build_object(
                'id', 'expenses',
                'title', 'Dépenses',
                'current_value', v_total_expenses,
                'unit', 'currency',
                'color', 'red',
                'category', 'financial'
            ),
            json_build_object(
                'id', 'cash_position',
                'title', 'Position de trésorerie',
                'current_value', v_cash_position,
                'unit', 'currency',
                'color', 'blue',
                'category', 'financial'
            ),
            json_build_object(
                'id', 'profit_margin',
                'title', 'Marge bénéficiaire',
                'current_value', v_profit_margin,
                'unit', 'percentage',
                'color', CASE WHEN v_profit_margin >= 0 THEN 'green' ELSE 'red' END,
                'category', 'financial'
            )
        ),
        'charts', json_build_array(
            json_build_object(
                'id', 'revenue_trend',
                'title', 'Évolution du CA',
                'type', 'line',
                'data', json_build_array()
            ),
            json_build_object(
                'id', 'expense_breakdown',
                'title', 'Répartition des dépenses',
                'type', 'pie',
                'data', json_build_array()
            )
        ),
        'financial_health', json_build_object(
            'overall_score', 75,
            'liquidity_score', 80,
            'profitability_score', 70,
            'efficiency_score', 75,
            'growth_score', 65,
            'risk_score', 60
        ),
        'cash_flow_forecast', json_build_array(),
        'budget_comparison', json_build_array(),
        'period_comparisons', json_build_array(),
        'alerts', json_build_array(),
        'operational_kpis', json_build_array(),
        'profitability_analysis', json_build_object()
    );

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_enterprise_dashboard_data"("p_company_id" "uuid", "p_period" "text", "p_start_date" "date", "p_end_date" "date", "p_comparison_period" "text", "p_include_forecasts" boolean, "p_include_benchmarks" boolean, "p_currency" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_enterprise_dashboard_data"("p_company_id" "uuid", "p_period" "text", "p_start_date" "date", "p_end_date" "date", "p_comparison_period" "text", "p_include_forecasts" boolean, "p_include_benchmarks" boolean, "p_currency" "text") IS 'Fonction principale pour récupérer toutes les données du dashboard enterprise';



CREATE OR REPLACE FUNCTION "public"."get_financial_ratios"("p_company_id" "uuid", "p_date_from" "date", "p_date_to" "date") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSON;
    balance_sheet_data JSON;
    income_statement_data JSON;
BEGIN
    -- Get balance sheet and income statement data
    SELECT get_balance_sheet_data(p_company_id, p_date_from, p_date_to) INTO balance_sheet_data;
    SELECT get_income_statement_data(p_company_id, p_date_from, p_date_to) INTO income_statement_data;

    -- Calculate ratios
    WITH financial_metrics AS (
        SELECT
            -- Balance sheet values
            COALESCE((balance_sheet_data->'assets'->>'total')::NUMERIC, 0) AS total_assets,
            COALESCE((balance_sheet_data->'liabilities'->>'total')::NUMERIC, 0) AS total_liabilities,
            COALESCE((balance_sheet_data->'equity'->>'total')::NUMERIC, 0) AS total_equity,

            -- Income statement values
            COALESCE((income_statement_data->'revenue'->>'total')::NUMERIC, 0) AS total_revenue,
            COALESCE((income_statement_data->'margins'->>'gross_margin')::NUMERIC, 0) AS gross_margin,
            COALESCE((income_statement_data->'margins'->>'operating_margin')::NUMERIC, 0) AS operating_margin,
            COALESCE((income_statement_data->>'net_income')::NUMERIC, 0) AS net_income
    )
    SELECT json_build_object(
        'liquidity', json_build_object(
            'current_ratio', CASE WHEN total_liabilities > 0 THEN total_assets / total_liabilities ELSE NULL END,
            'quick_ratio', CASE WHEN total_liabilities > 0 THEN (total_assets * 0.7) / total_liabilities ELSE NULL END,
            'cash_ratio', CASE WHEN total_liabilities > 0 THEN (total_assets * 0.1) / total_liabilities ELSE NULL END
        ),
        'profitability', json_build_object(
            'gross_margin', CASE WHEN total_revenue > 0 THEN (gross_margin / total_revenue) * 100 ELSE NULL END,
            'operating_margin', CASE WHEN total_revenue > 0 THEN (operating_margin / total_revenue) * 100 ELSE NULL END,
            'net_margin', CASE WHEN total_revenue > 0 THEN (net_income / total_revenue) * 100 ELSE NULL END,
            'roa', CASE WHEN total_assets > 0 THEN (net_income / total_assets) * 100 ELSE NULL END,
            'roe', CASE WHEN total_equity > 0 THEN (net_income / total_equity) * 100 ELSE NULL END
        ),
        'leverage', json_build_object(
            'debt_to_equity', CASE WHEN total_equity > 0 THEN total_liabilities / total_equity ELSE NULL END,
            'debt_to_assets', CASE WHEN total_assets > 0 THEN total_liabilities / total_assets ELSE NULL END,
            'interest_coverage', NULL
        ),
        'efficiency', json_build_object(
            'asset_turnover', CASE WHEN total_assets > 0 THEN total_revenue / total_assets ELSE NULL END,
            'inventory_turnover', NULL,
            'receivables_turnover', NULL
        )
    ) INTO result
    FROM financial_metrics;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_financial_ratios"("p_company_id" "uuid", "p_date_from" "date", "p_date_to" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_fiscal_template_by_country"("p_country_code" "text") RETURNS TABLE("country_name" "text", "accounting_standard" "text", "default_currency" "text", "fiscal_year_end" "text", "vat_config" "jsonb", "tax_accounts" "jsonb", "compliance" "jsonb", "payroll_taxes" "jsonb", "depreciation" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        fct.country_name,
        fct.accounting_standard,
        fct.default_currency,
        fct.fiscal_year_end,
        fct.default_vat_config,
        fct.default_tax_accounts,
        fct.compliance_requirements,
        fct.payroll_tax_config,
        fct.depreciation_rates
    FROM fiscal_country_templates fct
    WHERE fct.country_code = p_country_code
    AND fct.is_active = TRUE;
END;
$$;


ALTER FUNCTION "public"."get_fiscal_template_by_country"("p_country_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_income_statement_data"("p_company_id" "uuid", "p_date_from" "date", "p_date_to" "date") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSON;
    revenue_data JSON;
    expenses_data JSON;
    margins_data JSON;
    net_income_value NUMERIC;
BEGIN
    -- Calculate Revenue from journal entries directly
    WITH revenue_calculations AS (
        SELECT
            CASE
                WHEN LEFT(je.account_code, 2) IN ('70', '71', '72', '74') THEN 'operating_revenue'
                WHEN LEFT(je.account_code, 2) IN ('75', '76', '77') THEN 'other_revenue'
                ELSE 'other'
            END AS revenue_type,
            COALESCE(SUM(je.credit_amount - je.debit_amount), 0) AS balance
        FROM journal_entries je
        INNER JOIN accounts a ON je.account_code = a.account_number AND a.company_id = p_company_id
        WHERE je.company_id = p_company_id
          AND je.date BETWEEN p_date_from AND p_date_to
          AND a.type = 'revenue'
          AND a.is_active = true
        GROUP BY revenue_type
    )
    SELECT json_build_object(
        'operating_revenue', COALESCE(SUM(balance) FILTER (WHERE revenue_type = 'operating_revenue'), 0),
        'other_revenue', COALESCE(SUM(balance) FILTER (WHERE revenue_type = 'other_revenue'), 0),
        'total', COALESCE(SUM(balance), 0)
    ) INTO revenue_data
    FROM revenue_calculations;

    -- Calculate Expenses from journal entries directly
    WITH expense_calculations AS (
        SELECT
            CASE
                WHEN LEFT(je.account_code, 2) = '60' THEN 'cost_of_goods_sold'
                WHEN LEFT(je.account_code, 2) IN ('61', '62', '63', '64', '65') THEN 'operating_expenses'
                WHEN LEFT(je.account_code, 3) = '681' THEN 'depreciation'
                WHEN LEFT(je.account_code, 2) = '66' THEN 'interest_expense'
                WHEN LEFT(je.account_code, 3) = '695' THEN 'tax_expense'
                WHEN LEFT(je.account_code, 2) = '67' THEN 'other_expenses'
                ELSE 'other'
            END AS expense_type,
            COALESCE(SUM(je.debit_amount - je.credit_amount), 0) AS balance
        FROM journal_entries je
        INNER JOIN accounts a ON je.account_code = a.account_number AND a.company_id = p_company_id
        WHERE je.company_id = p_company_id
          AND je.date BETWEEN p_date_from AND p_date_to
          AND a.type = 'expense'
          AND a.is_active = true
        GROUP BY expense_type
    )
    SELECT json_build_object(
        'cost_of_goods_sold', COALESCE(SUM(balance) FILTER (WHERE expense_type = 'cost_of_goods_sold'), 0),
        'operating_expenses', COALESCE(SUM(balance) FILTER (WHERE expense_type = 'operating_expenses'), 0),
        'depreciation', COALESCE(SUM(balance) FILTER (WHERE expense_type = 'depreciation'), 0),
        'interest_expense', COALESCE(SUM(balance) FILTER (WHERE expense_type = 'interest_expense'), 0),
        'tax_expense', COALESCE(SUM(balance) FILTER (WHERE expense_type = 'tax_expense'), 0),
        'other_expenses', COALESCE(SUM(balance) FILTER (WHERE expense_type = 'other_expenses'), 0),
        'total', COALESCE(SUM(balance), 0)
    ) INTO expenses_data
    FROM expense_calculations;

    -- Calculate margins and net income
    WITH financial_metrics AS (
        SELECT
            (revenue_data->>'total')::NUMERIC AS total_revenue,
            (expenses_data->>'cost_of_goods_sold')::NUMERIC AS cogs,
            (expenses_data->>'operating_expenses')::NUMERIC AS opex,
            (expenses_data->>'depreciation')::NUMERIC AS depreciation,
            (expenses_data->>'interest_expense')::NUMERIC AS interest,
            (expenses_data->>'tax_expense')::NUMERIC AS tax,
            (expenses_data->>'other_expenses')::NUMERIC AS other_exp,
            (expenses_data->>'total')::NUMERIC AS total_expenses
    )
    SELECT
        json_build_object(
            'gross_margin', total_revenue - cogs,
            'operating_margin', total_revenue - cogs - opex - depreciation,
            'net_margin', total_revenue - total_expenses
        ),
        total_revenue - total_expenses
    INTO margins_data, net_income_value
    FROM financial_metrics;

    -- Build final result
    result := json_build_object(
        'revenue', revenue_data,
        'expenses', expenses_data,
        'margins', margins_data,
        'net_income', net_income_value
    );

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_income_statement_data"("p_company_id" "uuid", "p_date_from" "date", "p_date_to" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_onboarding_stats"("p_company_id" "uuid" DEFAULT NULL::"uuid", "p_days_back" integer DEFAULT 30) RETURNS TABLE("total_sessions" bigint, "completed_sessions" bigint, "abandoned_sessions" bigint, "avg_completion_time_minutes" numeric, "completion_rate_pct" numeric, "most_problematic_step" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH session_stats AS (
        SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE final_status = 'completed') as completed,
            COUNT(*) FILTER (WHERE final_status = 'abandoned') as abandoned,
            AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) as avg_completion_minutes
        FROM onboarding_sessions os
        WHERE (p_company_id IS NULL OR os.company_id = p_company_id)
        AND os.started_at >= CURRENT_DATE - INTERVAL '1 day' * p_days_back
    ),
    step_problems AS (
        SELECT
            step_name,
            COUNT(*) FILTER (WHERE completion_status IN ('error', 'abandoned')) as problem_count
        FROM onboarding_history oh
        WHERE (p_company_id IS NULL OR oh.company_id = p_company_id)
        AND oh.completion_time >= CURRENT_DATE - INTERVAL '1 day' * p_days_back
        GROUP BY step_name
        ORDER BY problem_count DESC
        LIMIT 1
    )
    SELECT
        ss.total,
        ss.completed,
        ss.abandoned,
        ROUND(ss.avg_completion_minutes, 2),
        CASE WHEN ss.total > 0 THEN ROUND(ss.completed::numeric / ss.total * 100, 2) ELSE 0 END,
        sp.step_name
    FROM session_stats ss
    CROSS JOIN step_problems sp;
END;
$$;


ALTER FUNCTION "public"."get_onboarding_stats"("p_company_id" "uuid", "p_days_back" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "full_name" "text",
    "first_name" "text",
    "last_name" "text",
    "email" "text" NOT NULL,
    "phone" "text",
    "avatar_url" "text",
    "date_of_birth" "date",
    "gender" "text",
    "language_preference" "text" DEFAULT 'fr'::"text",
    "timezone" "text" DEFAULT 'Europe/Paris'::"text",
    "theme_preference" "text" DEFAULT 'light'::"text",
    "job_title" "text",
    "department" "text",
    "manager_id" "uuid",
    "hire_date" "date",
    "employment_type" "text" DEFAULT 'full_time'::"text",
    "is_active" boolean DEFAULT true,
    "last_login_at" timestamp with time zone,
    "profile_completion_percentage" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "bio" "text",
    "website" "text",
    "linkedin" "text",
    "twitter" "text",
    "language" "text" DEFAULT 'fr'::"text",
    CONSTRAINT "user_profiles_employment_type_check" CHECK (("employment_type" = ANY (ARRAY['full_time'::"text", 'part_time'::"text", 'contractor'::"text", 'intern'::"text", 'consultant'::"text"]))),
    CONSTRAINT "user_profiles_gender_check" CHECK (("gender" = ANY (ARRAY['male'::"text", 'female'::"text", 'other'::"text", 'prefer_not_to_say'::"text"]))),
    CONSTRAINT "user_profiles_theme_preference_check" CHECK (("theme_preference" = ANY (ARRAY['light'::"text", 'dark'::"text", 'auto'::"text"])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_user_profile"("p_user_id" "uuid") RETURNS "public"."user_profiles"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_profile user_profiles;
BEGIN
  -- Essayer de récupérer le profil existant
  SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;

  -- Si le profil n'existe pas, le créer avec les données de auth.users
  IF NOT FOUND THEN
    INSERT INTO user_profiles (user_id, first_name, last_name)
    SELECT
      id,
      COALESCE(raw_user_meta_data->>'first_name', ''),
      COALESCE(raw_user_meta_data->>'last_name', '')
    FROM auth.users
    WHERE id = p_user_id
    RETURNING * INTO v_profile;
  END IF;

  RETURN v_profile;
END;
$$;


ALTER FUNCTION "public"."get_or_create_user_profile"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_performance_comparison"("p_company_id" "uuid", "p_period" "text" DEFAULT 'current_month'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result JSON;
    v_current_revenue DECIMAL(15,2) := 0;
    v_previous_revenue DECIMAL(15,2) := 0;
    v_budget_revenue DECIMAL(15,2) := 0;
    v_current_expenses DECIMAL(15,2) := 0;
    v_previous_expenses DECIMAL(15,2) := 0;
    v_budget_expenses DECIMAL(15,2) := 0;
    v_start_date DATE;
    v_end_date DATE;
    v_prev_start DATE;
    v_prev_end DATE;
BEGIN
    -- Détermination des périodes
    CASE p_period
        WHEN 'current_month' THEN
            v_start_date := DATE_TRUNC('month', CURRENT_DATE);
            v_end_date := v_start_date + INTERVAL '1 month' - INTERVAL '1 day';
            v_prev_start := v_start_date - INTERVAL '1 month';
            v_prev_end := v_end_date - INTERVAL '1 month';
        WHEN 'current_quarter' THEN
            v_start_date := DATE_TRUNC('quarter', CURRENT_DATE);
            v_end_date := v_start_date + INTERVAL '3 months' - INTERVAL '1 day';
            v_prev_start := v_start_date - INTERVAL '3 months';
            v_prev_end := v_end_date - INTERVAL '3 months';
        ELSE
            v_start_date := DATE_TRUNC('month', CURRENT_DATE);
            v_end_date := v_start_date + INTERVAL '1 month' - INTERVAL '1 day';
            v_prev_start := v_start_date - INTERVAL '1 month';
            v_prev_end := v_end_date - INTERVAL '1 month';
    END CASE;

    -- Revenus période courante
    SELECT COALESCE(SUM(total_incl_tax), 0)
    INTO v_current_revenue
    FROM invoices
    WHERE company_id = p_company_id
      AND invoice_date BETWEEN v_start_date AND v_end_date
      AND status = 'paid';

    -- Revenus période précédente
    SELECT COALESCE(SUM(total_incl_tax), 0)
    INTO v_previous_revenue
    FROM invoices
    WHERE company_id = p_company_id
      AND invoice_date BETWEEN v_prev_start AND v_prev_end
      AND status = 'paid';

    -- Dépenses période courante
    SELECT COALESCE(SUM(jel.debit_amount), 0)
    INTO v_current_expenses
    FROM journal_entry_lines jel
    JOIN journal_entries je ON je.id = jel.journal_entry_id
    JOIN chart_of_accounts coa ON coa.id = jel.account_id
    WHERE je.company_id = p_company_id
      AND je.entry_date BETWEEN v_start_date AND v_end_date
      AND coa.account_type = 'expense';

    -- Dépenses période précédente
    SELECT COALESCE(SUM(jel.debit_amount), 0)
    INTO v_previous_expenses
    FROM journal_entry_lines jel
    JOIN journal_entries je ON je.id = jel.journal_entry_id
    JOIN chart_of_accounts coa ON coa.id = jel.account_id
    WHERE je.company_id = p_company_id
      AND je.entry_date BETWEEN v_prev_start AND v_prev_end
      AND coa.account_type = 'expense';

    -- Budget (valeurs par défaut si pas de budget)
    v_budget_revenue := v_current_revenue * 1.1; -- +10% objectif
    v_budget_expenses := v_previous_expenses * 0.95; -- -5% objectif

    v_result := json_build_object(
        'period', p_period,
        'revenue_comparison', json_build_object(
            'current', v_current_revenue,
            'previous', v_previous_revenue,
            'budget', v_budget_revenue,
            'vs_previous_percent', CASE
                WHEN v_previous_revenue > 0 THEN ((v_current_revenue - v_previous_revenue) / v_previous_revenue * 100)
                ELSE 0
            END,
            'vs_budget_percent', CASE
                WHEN v_budget_revenue > 0 THEN ((v_current_revenue - v_budget_revenue) / v_budget_revenue * 100)
                ELSE 0
            END
        ),
        'expense_comparison', json_build_object(
            'current', v_current_expenses,
            'previous', v_previous_expenses,
            'budget', v_budget_expenses,
            'vs_previous_percent', CASE
                WHEN v_previous_expenses > 0 THEN ((v_current_expenses - v_previous_expenses) / v_previous_expenses * 100)
                ELSE 0
            END,
            'vs_budget_percent', CASE
                WHEN v_budget_expenses > 0 THEN ((v_current_expenses - v_budget_expenses) / v_budget_expenses * 100)
                ELSE 0
            END
        ),
        'profitability_comparison', json_build_object(
            'current_margin', CASE
                WHEN v_current_revenue > 0 THEN ((v_current_revenue - v_current_expenses) / v_current_revenue * 100)
                ELSE 0
            END,
            'previous_margin', CASE
                WHEN v_previous_revenue > 0 THEN ((v_previous_revenue - v_previous_expenses) / v_previous_revenue * 100)
                ELSE 0
            END
        )
    );

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_performance_comparison"("p_company_id" "uuid", "p_period" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_performance_comparison"("p_company_id" "uuid", "p_period" "text") IS 'Compare les performances actuelles vs antérieures et budget';



CREATE OR REPLACE FUNCTION "public"."get_product_stock_summary"("p_product_id" "uuid", "p_warehouse_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT JSONB_BUILD_OBJECT(
        'total_on_hand', COALESCE(SUM(ii.quantity_on_hand), 0),
        'total_reserved', COALESCE(SUM(ii.reserved_quantity), 0),
        'total_available', COALESCE(SUM(ii.available_quantity), 0),
        'total_value', COALESCE(SUM(ii.total_value), 0),
        'locations_count', COUNT(*),
        'warehouses', JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'warehouse_id', w.id,
                'warehouse_name', w.name,
                'quantity_on_hand', ii.quantity_on_hand,
                'available_quantity', ii.available_quantity,
                'value', ii.total_value
            )
        )
    ) INTO v_result
    FROM inventory_items ii
    JOIN warehouses w ON w.id = ii.warehouse_id
    WHERE ii.product_id = p_product_id
    AND (p_warehouse_id IS NULL OR ii.warehouse_id = p_warehouse_id);

    RETURN COALESCE(v_result, '{
        "total_on_hand": 0,
        "total_reserved": 0,
        "total_available": 0,
        "total_value": 0,
        "locations_count": 0,
        "warehouses": []
    }'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_product_stock_summary"("p_product_id" "uuid", "p_warehouse_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_purchase_analytics_simple"("p_company_id" "uuid", "p_start_date" "date" DEFAULT NULL::"date", "p_end_date" "date" DEFAULT NULL::"date") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_start_date DATE := COALESCE(p_start_date, DATE_TRUNC('month', CURRENT_DATE)::DATE);
    v_end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
    v_total_purchases INTEGER;
    v_total_amount DECIMAL;
    v_pending_amount DECIMAL;
    v_top_suppliers JSONB;
BEGIN
    -- Statistiques générales
    SELECT COUNT(*), COALESCE(SUM(total_amount), 0)
    INTO v_total_purchases, v_total_amount
    FROM purchases
    WHERE company_id = p_company_id
    AND purchase_date BETWEEN v_start_date AND v_end_date
    AND status != 'cancelled';

    -- Montant en attente de paiement
    SELECT COALESCE(SUM(total_amount), 0) INTO v_pending_amount
    FROM purchases
    WHERE company_id = p_company_id
    AND payment_status IN ('pending', 'partial');

    -- Top 5 fournisseurs
    SELECT JSONB_AGG(
        JSONB_BUILD_OBJECT(
            'supplier_name', s.name,
            'total_amount', sub.total_amount,
            'purchase_count', sub.purchase_count
        )
    ) INTO v_top_suppliers
    FROM (
        SELECT
            p.supplier_id,
            SUM(p.total_amount) as total_amount,
            COUNT(*) as purchase_count
        FROM purchases p
        WHERE p.company_id = p_company_id
        AND p.purchase_date BETWEEN v_start_date AND v_end_date
        AND p.status != 'cancelled'
        GROUP BY p.supplier_id
        ORDER BY total_amount DESC
        LIMIT 5
    ) sub
    JOIN suppliers s ON s.id = sub.supplier_id;

    RETURN JSONB_BUILD_OBJECT(
        'period', JSONB_BUILD_OBJECT('start_date', v_start_date, 'end_date', v_end_date),
        'total_purchases', v_total_purchases,
        'total_amount', v_total_amount,
        'pending_amount', v_pending_amount,
        'top_suppliers', COALESCE(v_top_suppliers, '[]'::jsonb)
    );
END;
$$;


ALTER FUNCTION "public"."get_purchase_analytics_simple"("p_company_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_realtime_metrics"("p_company_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_metrics JSON;
    v_today_revenue DECIMAL(15,2) := 0;
    v_month_revenue DECIMAL(15,2) := 0;
    v_pending_invoices INTEGER := 0;
    v_overdue_invoices INTEGER := 0;
BEGIN
    -- CA du jour
    SELECT COALESCE(SUM(total_incl_tax), 0)
    INTO v_today_revenue
    FROM invoices
    WHERE company_id = p_company_id
      AND DATE(invoice_date) = CURRENT_DATE
      AND status = 'paid';

    -- CA du mois
    SELECT COALESCE(SUM(total_incl_tax), 0)
    INTO v_month_revenue
    FROM invoices
    WHERE company_id = p_company_id
      AND DATE_TRUNC('month', invoice_date) = DATE_TRUNC('month', CURRENT_DATE)
      AND status = 'paid';

    -- Factures en attente
    SELECT COUNT(*)
    INTO v_pending_invoices
    FROM invoices
    WHERE company_id = p_company_id
      AND status = 'pending';

    -- Factures en retard
    SELECT COUNT(*)
    INTO v_overdue_invoices
    FROM invoices
    WHERE company_id = p_company_id
      AND status = 'overdue'
      AND due_date < CURRENT_DATE;

    v_metrics := json_build_array(
        json_build_object(
            'id', 'daily_revenue',
            'title', 'CA du jour',
            'current_value', v_today_revenue,
            'unit', 'currency',
            'color', 'green',
            'category', 'financial'
        ),
        json_build_object(
            'id', 'monthly_revenue',
            'title', 'CA mensuel',
            'current_value', v_month_revenue,
            'unit', 'currency',
            'color', 'blue',
            'category', 'financial'
        ),
        json_build_object(
            'id', 'pending_invoices',
            'title', 'Factures en attente',
            'current_value', v_pending_invoices,
            'unit', 'number',
            'color', 'orange',
            'category', 'operational'
        ),
        json_build_object(
            'id', 'overdue_invoices',
            'title', 'Factures en retard',
            'current_value', v_overdue_invoices,
            'unit', 'number',
            'color', 'red',
            'category', 'risk'
        )
    );

    RETURN v_metrics;
END;
$$;


ALTER FUNCTION "public"."get_realtime_metrics"("p_company_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_realtime_metrics"("p_company_id" "uuid") IS 'Récupère les métriques en temps réel pour une entreprise';



CREATE OR REPLACE FUNCTION "public"."get_recommended_company_sizes"("sector_code_param" "text") RETURNS TABLE("size_code" "text", "size_name" "text", "category" "text", "recommended_plan" "text", "description" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        cs.size_code,
        cs.size_name,
        cs.category,
        cs.recommended_plan,
        cs.description
    FROM company_sizes_catalog cs
    WHERE cs.is_active = true
    AND EXISTS (
        SELECT 1 FROM sectors_catalog s
        WHERE s.sector_code = sector_code_param
        AND cs.size_code = ANY(s.typical_size_ranges)
    )
    ORDER BY cs.priority_order;
END;
$$;


ALTER FUNCTION "public"."get_recommended_company_sizes"("sector_code_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_supplier_balance_simple"("p_supplier_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_total_purchases DECIMAL := 0;
    v_total_payments DECIMAL := 0;
    v_balance DECIMAL := 0;
BEGIN
    -- Total des achats
    SELECT COALESCE(SUM(total_amount), 0) INTO v_total_purchases
    FROM purchases
    WHERE supplier_id = p_supplier_id
    AND status != 'cancelled';

    -- Total des paiements
    SELECT COALESCE(SUM(amount), 0) INTO v_total_payments
    FROM supplier_payments
    WHERE supplier_id = p_supplier_id
    AND status = 'completed';

    -- Solde = Achats - Paiements
    v_balance := v_total_purchases - v_total_payments;

    RETURN v_balance;
END;
$$;


ALTER FUNCTION "public"."get_supplier_balance_simple"("p_supplier_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_third_parties_stats"("p_company_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_total_customers INTEGER;
    v_total_suppliers INTEGER;
    v_active_customers INTEGER;
    v_active_suppliers INTEGER;
    v_customers_balance DECIMAL;
    v_suppliers_balance DECIMAL;
BEGIN
    -- Compter les clients
    SELECT COUNT(*), COUNT(*) FILTER (WHERE is_active = true)
    INTO v_total_customers, v_active_customers
    FROM customers
    WHERE company_id = p_company_id;

    -- Compter les fournisseurs
    SELECT COUNT(*), COUNT(*) FILTER (WHERE is_active = true)
    INTO v_total_suppliers, v_active_suppliers
    FROM suppliers
    WHERE company_id = p_company_id;

    -- Solde clients (créances)
    SELECT COALESCE(SUM(balance), 0) INTO v_customers_balance
    FROM unified_third_parties_view
    WHERE company_id = p_company_id
    AND party_type = 'customer';

    -- Solde fournisseurs (dettes)
    SELECT COALESCE(SUM(balance), 0) INTO v_suppliers_balance
    FROM unified_third_parties_view
    WHERE company_id = p_company_id
    AND party_type = 'supplier';

    RETURN JSONB_BUILD_OBJECT(
        'customers', JSONB_BUILD_OBJECT(
            'total', v_total_customers,
            'active', v_active_customers,
            'balance', v_customers_balance
        ),
        'suppliers', JSONB_BUILD_OBJECT(
            'total', v_total_suppliers,
            'active', v_active_suppliers,
            'balance', v_suppliers_balance
        ),
        'totals', JSONB_BUILD_OBJECT(
            'total_parties', v_total_customers + v_total_suppliers,
            'active_parties', v_active_customers + v_active_suppliers,
            'net_balance', v_customers_balance - v_suppliers_balance
        )
    );
END;
$$;


ALTER FUNCTION "public"."get_third_parties_stats"("p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_third_party_details"("p_party_type" "text", "p_party_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_party JSONB;
    v_contacts JSONB;
    v_addresses JSONB;
    v_documents JSONB;
BEGIN
    -- Récupérer les infos principales depuis la vue unifiée
    SELECT row_to_json(utp.*)::JSONB INTO v_party
    FROM unified_third_parties_view utp
    WHERE utp.party_type = p_party_type
    AND utp.id = p_party_id;

    -- Récupérer les contacts
    IF p_party_type = 'customer' THEN
        SELECT COALESCE(JSONB_AGG(row_to_json(c.*)), '[]'::jsonb) INTO v_contacts
        FROM contacts c
        WHERE c.customer_id = p_party_id AND c.is_active = true;

        SELECT COALESCE(JSONB_AGG(row_to_json(a.*)), '[]'::jsonb) INTO v_addresses
        FROM third_party_addresses a
        WHERE a.customer_id = p_party_id AND a.is_active = true;

        SELECT COALESCE(JSONB_AGG(row_to_json(d.*)), '[]'::jsonb) INTO v_documents
        FROM third_party_documents d
        WHERE d.customer_id = p_party_id AND d.is_active = true;
    ELSE
        SELECT COALESCE(JSONB_AGG(row_to_json(c.*)), '[]'::jsonb) INTO v_contacts
        FROM contacts c
        WHERE c.supplier_id = p_party_id AND c.is_active = true;

        SELECT COALESCE(JSONB_AGG(row_to_json(a.*)), '[]'::jsonb) INTO v_addresses
        FROM third_party_addresses a
        WHERE a.supplier_id = p_party_id AND a.is_active = true;

        SELECT COALESCE(JSONB_AGG(row_to_json(d.*)), '[]'::jsonb) INTO v_documents
        FROM third_party_documents d
        WHERE d.supplier_id = p_party_id AND d.is_active = true;
    END IF;

    RETURN JSONB_BUILD_OBJECT(
        'party', v_party,
        'contacts', v_contacts,
        'addresses', v_addresses,
        'documents', v_documents
    );
END;
$$;


ALTER FUNCTION "public"."get_third_party_details"("p_party_type" "text", "p_party_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_trial_statistics"() RETURNS TABLE("metric" "text", "value" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 'active_trials'::TEXT, COUNT(*)::INTEGER
    FROM subscriptions
    WHERE status = 'trialing'

    UNION ALL

    SELECT 'expired_trials'::TEXT, COUNT(*)::INTEGER
    FROM subscriptions
    WHERE status = 'expired'

    UNION ALL

    SELECT 'converted_trials'::TEXT, COUNT(*)::INTEGER
    FROM subscriptions
    WHERE status = 'active' AND trial_start IS NOT NULL;
END;
$$;


ALTER FUNCTION "public"."get_trial_statistics"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_trial_statistics"() IS 'Obtient des statistiques sur les abonnements d''essai';



CREATE OR REPLACE FUNCTION "public"."get_unmapped_journal_entries"("p_company_id" "uuid", "p_year" integer) RETURNS TABLE("account_code" "text", "total_amount" numeric, "entry_count" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT
    jel.account_number AS account_code,
    SUM(jel.debit_amount - jel.credit_amount) AS total_amount,
    COUNT(DISTINCT jel.id) AS entry_count
  FROM journal_entries je
  JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
  WHERE je.company_id = p_company_id
    AND EXTRACT(YEAR FROM je.entry_date) = p_year
    AND je.status = 'posted'
    AND NOT EXISTS (
      SELECT 1 FROM category_account_map cam
      WHERE cam.company_id = je.company_id
        AND cam.account_code = jel.account_number
    )
  GROUP BY jel.account_number
  ORDER BY ABS(SUM(jel.debit_amount - jel.credit_amount)) DESC;
$$;


ALTER FUNCTION "public"."get_unmapped_journal_entries"("p_company_id" "uuid", "p_year" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_unmapped_journal_entries"("p_company_id" "uuid", "p_year" integer) IS 'Détection des écritures comptables sans mapping budgétaire';



CREATE OR REPLACE FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM notifications
  WHERE user_id = p_user_id
    AND is_read = FALSE
    AND (expires_at IS NULL OR expires_at > now());

  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_notifications"("user_uuid" "uuid" DEFAULT "auth"."uid"()) RETURNS TABLE("email_new_transactions" boolean, "email_weekly_reports" boolean, "email_system_updates" boolean, "email_marketing" boolean, "email_invoices" boolean, "email_payments" boolean, "email_reminders" boolean, "push_new_transactions" boolean, "push_alerts" boolean, "push_reminders" boolean, "push_system_updates" boolean, "notification_frequency" "text", "quiet_hours_enabled" boolean, "quiet_hours_start" time without time zone, "quiet_hours_end" time without time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    un.email_new_transactions,
    un.email_weekly_reports,
    un.email_system_updates,
    un.email_marketing,
    un.email_invoices,
    un.email_payments,
    un.email_reminders,
    un.push_new_transactions,
    un.push_alerts,
    un.push_reminders,
    un.push_system_updates,
    un.notification_frequency,
    un.quiet_hours_enabled,
    un.quiet_hours_start,
    un.quiet_hours_end
  FROM user_notifications un
  WHERE un.user_id = user_uuid;
END;
$$;


ALTER FUNCTION "public"."get_user_notifications"("user_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_notifications"("user_uuid" "uuid") IS 'Récupère les paramètres de notifications d''un utilisateur';



CREATE OR REPLACE FUNCTION "public"."get_user_preferences_with_fallback"("p_user_id" "uuid", "p_company_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("email_notifications" boolean, "push_notifications" boolean, "language" "text", "currency" "text", "timezone" "text", "date_format" "text", "theme" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(up.email_notifications, true),
        COALESCE(up.push_notifications, true),
        COALESCE(up.language, 'fr'),
        COALESCE(up.currency, 'EUR'),
        COALESCE(up.timezone, 'Europe/Paris'),
        COALESCE(up.date_format, 'DD/MM/YYYY'),
        COALESCE(up.theme, 'light')
    FROM user_preferences up
    WHERE up.user_id = p_user_id
    AND (p_company_id IS NULL OR up.company_id = p_company_id)
    ORDER BY up.updated_at DESC
    LIMIT 1;

    -- Si pas de préférences trouvées, retourner les valeurs par défaut
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT true, true, 'fr'::TEXT, 'EUR'::TEXT, 'Europe/Paris'::TEXT, 'DD/MM/YYYY'::TEXT, 'light'::TEXT;
    END IF;
END;
$$;


ALTER FUNCTION "public"."get_user_preferences_with_fallback"("p_user_id" "uuid", "p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_subscription_status"("p_user_id" "uuid") RETURNS TABLE("subscription_id" "uuid", "plan_id" "text", "status" "text", "current_period_start" timestamp with time zone, "current_period_end" timestamp with time zone, "trial_start" timestamp with time zone, "trial_end" timestamp with time zone, "is_trial" boolean, "days_remaining" integer, "plan_name" "text", "plan_price" numeric, "plan_currency" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id as subscription_id,
        s.plan_id,
        s.status,
        s.current_period_start,
        s.current_period_end,
        s.trial_start,
        s.trial_end,
        (s.status = 'trialing') as is_trial,
        CASE
            WHEN s.status = 'trialing' AND s.trial_end IS NOT NULL
            THEN GREATEST(0, (s.trial_end::date - CURRENT_DATE))
            ELSE 0
        END as days_remaining,
        sp.name as plan_name,
        sp.price as plan_price,
        sp.currency as plan_currency
    FROM subscriptions s
    LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing')
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_user_subscription_status"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_subscription_status"("p_user_id" "uuid") IS 'Obtient le statut complet d''abonnement d''un utilisateur';



CREATE OR REPLACE FUNCTION "public"."get_user_trial_info"("p_user_id" "uuid") RETURNS TABLE("subscription_id" "uuid", "plan_id" "text", "status" "text", "trial_start" timestamp with time zone, "trial_end" timestamp with time zone, "days_remaining" integer, "is_expired" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id as subscription_id,
        s.plan_id,
        s.status,
        s.trial_start,
        s.trial_end,
        CASE
            WHEN s.trial_end IS NOT NULL
            THEN GREATEST(0, (s.trial_end::date - CURRENT_DATE))
            ELSE 0
        END as days_remaining,
        CASE
            WHEN s.trial_end IS NOT NULL
            THEN (s.trial_end < NOW())
            ELSE false
        END as is_expired
    FROM subscriptions s
    WHERE s.user_id = p_user_id
    AND s.status = 'trialing'
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_user_trial_info"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_trial_info"("p_user_id" "uuid") IS 'Obtient les informations détaillées d''essai d''un utilisateur';



CREATE OR REPLACE FUNCTION "public"."get_user_usage_limits"("p_user_id" "uuid") RETURNS TABLE("feature_name" "text", "current_usage" integer, "limit_value" integer, "percentage_used" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    ut.feature_name,
    COALESCE(ut.current_usage, 0) AS current_usage,
    ut.limit_value,
    CASE
      WHEN ut.limit_value IS NULL OR ut.limit_value = -1 THEN 0
      WHEN ut.limit_value = 0 THEN 100
      ELSE ROUND((COALESCE(ut.current_usage, 0)::NUMERIC / ut.limit_value::NUMERIC) * 100, 2)
    END AS percentage_used
  FROM usage_tracking ut
  WHERE ut.user_id = p_user_id
  ORDER BY ut.feature_name;
END;
$$;


ALTER FUNCTION "public"."get_user_usage_limits"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."identify_potential_duplicates"() RETURNS TABLE("normalized_name" "text", "company_count" bigint, "company_names" "text"[], "company_ids" "uuid"[])
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        normalize_company_name_safe(c.name) as norm_name,
        COUNT(*)::BIGINT as company_count,
        array_agg(c.name ORDER BY c.created_at) as company_names,
        array_agg(c.id ORDER BY c.created_at) as company_ids
    FROM companies c
    WHERE c.name IS NOT NULL
    AND COALESCE(c.status, 'active') = 'active'
    AND normalize_company_name_safe(c.name) IS NOT NULL
    GROUP BY normalize_company_name_safe(c.name)
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC;
END;
$$;


ALTER FUNCTION "public"."identify_potential_duplicates"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_feature_usage"("p_user_id" "uuid", "p_feature_name" "text", "p_increment" integer DEFAULT 1) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO usage_tracking (user_id, feature_name, current_usage, last_reset_at)
  VALUES (p_user_id, p_feature_name, p_increment, now())
  ON CONFLICT (user_id, feature_name)
  DO UPDATE SET
    current_usage = usage_tracking.current_usage + p_increment,
    updated_at = now();

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."increment_feature_usage"("p_user_id" "uuid", "p_feature_name" "text", "p_increment" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."init_default_user_preferences"("p_user_id" "uuid", "p_company_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_pref_id UUID;
BEGIN
    INSERT INTO user_preferences (
        user_id,
        company_id,
        email_notifications,
        push_notifications,
        language,
        currency,
        timezone,
        date_format,
        theme
    ) VALUES (
        p_user_id,
        p_company_id,
        true,
        true,
        'fr',
        'EUR',
        'Europe/Paris',
        'DD/MM/YYYY',
        'light'
    )
    ON CONFLICT (user_id, company_id) DO UPDATE SET
        updated_at = NOW()
    RETURNING id INTO v_pref_id;

    RETURN v_pref_id;
END;
$$;


ALTER FUNCTION "public"."init_default_user_preferences"("p_user_id" "uuid", "p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_budget_category_mappings"("p_company_id" "uuid", "p_budget_id" "uuid", "p_country_code" "text" DEFAULT 'FR'::"text") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_count INTEGER := 0;
  v_category_record RECORD;
BEGIN
  -- Créer les catégories budgétaires depuis les templates
  FOR v_category_record IN (
    SELECT * FROM budget_category_templates
    WHERE country_code = p_country_code
      AND is_active = true
    ORDER BY display_order
  ) LOOP
    -- Insérer la catégorie budgétaire
    INSERT INTO budget_categories (
      budget_id,
      company_id,
      category,
      subcategory,
      category_type,
      driver_type,
      account_codes,
      annual_amount,
      monthly_amounts
    )
    VALUES (
      p_budget_id,
      p_company_id,
      v_category_record.category,
      v_category_record.subcategory,
      v_category_record.category_type,
      v_category_record.driver_type,
      v_category_record.default_account_numbers,
      0, -- À saisir par l'utilisateur
      ARRAY[0,0,0,0,0,0,0,0,0,0,0,0] -- 12 mois à 0
    )
    ON CONFLICT (budget_id, category, COALESCE(subcategory, '')) DO NOTHING;

    v_count := v_count + 1;

    -- Créer les mappings dans category_account_map
    IF v_category_record.default_account_numbers IS NOT NULL THEN
      INSERT INTO category_account_map (company_id, category_id, account_code)
      SELECT
        p_company_id,
        bc.id,
        unnest(v_category_record.default_account_numbers)
      FROM budget_categories bc
      WHERE bc.budget_id = p_budget_id
        AND bc.category = v_category_record.category
        AND COALESCE(bc.subcategory, '') = COALESCE(v_category_record.subcategory, '')
      ON CONFLICT (company_id, category_id, account_code) DO NOTHING;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."initialize_budget_category_mappings"("p_company_id" "uuid", "p_budget_id" "uuid", "p_country_code" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."initialize_budget_category_mappings"("p_company_id" "uuid", "p_budget_id" "uuid", "p_country_code" "text") IS 'Initialise les catégories budgétaires et leurs mappings comptables pour un budget';



CREATE OR REPLACE FUNCTION "public"."initialize_company_chart_of_accounts"("p_company_id" "uuid", "p_country_code" "text" DEFAULT 'FR'::"text") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Copier les comptes du template vers la table chart_of_accounts de l'entreprise
  INSERT INTO chart_of_accounts (
    company_id,
    account_number,
    name,
    type,
    class,
    description,
    is_active
  )
  SELECT
    p_company_id,
    t.account_number,
    t.account_name,
    t.account_type,
    t.class,
    t.description,
    true
  FROM chart_of_accounts_templates t
  WHERE t.country_code = p_country_code
    AND t.is_detail_account = true -- Uniquement les comptes de détail
    AND NOT EXISTS (
      SELECT 1 FROM chart_of_accounts c
      WHERE c.company_id = p_company_id
        AND c.account_number = t.account_number
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."initialize_company_chart_of_accounts"("p_company_id" "uuid", "p_country_code" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."initialize_company_chart_of_accounts"("p_company_id" "uuid", "p_country_code" "text") IS 'Initialise le plan comptable d''une entreprise en copiant les comptes standards du pays';



CREATE OR REPLACE FUNCTION "public"."insert_client"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO crm_clients (
        id, company_id, name, type, status, primary_contact_name,
        primary_contact_email, primary_contact_phone, industry, website,
        total_value, tier, health_score
    ) VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        NEW.company_id,
        NEW.name,
        COALESCE(NEW.type, 'company'),
        COALESCE(NEW.status, 'active'),
        NEW.contact_name,
        NEW.email,
        NEW.phone,
        NEW.industry,
        NEW.website,
        COALESCE(NEW.total_value, 0.00),
        COALESCE(NEW.tier, 'standard'),
        COALESCE(NEW.health_score, 50)
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."insert_client"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_client_from_view"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO crm_clients (
        company_id, name, type, status, primary_contact_name,
        primary_contact_email, primary_contact_phone, industry, website
    ) VALUES (
        NEW.company_id, NEW.name, NEW.type, NEW.status, NEW.contact_name,
        NEW.email, NEW.phone, NEW.industry, NEW.website
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."insert_client_from_view"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_commercial_action"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO crm_activities (
        id, company_id, subject, description, type, status,
        due_date, priority, opportunity_id, client_id, lead_id, assigned_to
    ) VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        NEW.company_id,
        NEW.title,
        NEW.description,
        COALESCE(NEW.type, 'followup'),
        COALESCE(NEW.status, 'planned'),
        NEW.due_date,
        COALESCE(NEW.priority, 'medium'),
        NEW.opportunity_id,
        NEW.client_id,
        NEW.lead_id,
        NEW.assigned_to
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."insert_commercial_action"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_opportunity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO crm_opportunities (
        id, company_id, title, description, value, probability,
        expected_close_date, status, source, client_id, owner_id,
        stage_id, pipeline_id
    ) VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        NEW.company_id,
        NEW.title,
        NEW.description,
        COALESCE(NEW.value, 0.00),
        COALESCE(NEW.probability, 50.00),
        NEW.close_date,
        COALESCE(NEW.status, 'open'),
        NEW.source,
        NEW.client_id,
        NEW.assigned_to,
        NEW.stage_id,
        NEW.pipeline_id
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."insert_opportunity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_module_allowed_for_plan"("p_module_name" "text", "p_plan_id" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN p_module_name = ANY(get_allowed_modules_for_plan(p_plan_id));
END;
$$;


ALTER FUNCTION "public"."is_module_allowed_for_plan"("p_module_name" "text", "p_plan_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_module_allowed_for_plan"("p_module_name" "text", "p_plan_id" "text") IS 'Vérifie si un module spécifique est autorisé pour un plan donné';



CREATE OR REPLACE FUNCTION "public"."log_audit_event"("p_event_type" "text", "p_table_name" "text" DEFAULT NULL::"text", "p_record_id" "text" DEFAULT NULL::"text", "p_old_values" "jsonb" DEFAULT NULL::"jsonb", "p_new_values" "jsonb" DEFAULT NULL::"jsonb", "p_user_id" "uuid" DEFAULT NULL::"uuid", "p_company_id" "uuid" DEFAULT NULL::"uuid", "p_security_level" "text" DEFAULT 'standard'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    audit_id UUID;
    user_info RECORD;
    integrity_data TEXT;
BEGIN
    -- Récupérer les infos utilisateur si disponibles
    IF p_user_id IS NOT NULL THEN
        SELECT email INTO user_info FROM auth.users WHERE id = p_user_id;
    END IF;

    -- Créer le hash d'intégrité
    integrity_data := CONCAT(p_event_type, p_table_name, p_record_id,
                            COALESCE(p_old_values::TEXT, ''),
                            COALESCE(p_new_values::TEXT, ''),
                            NOW()::TEXT);

    INSERT INTO audit_logs (
        event_type, table_name, record_id,
        old_values, new_values,
        user_id, user_email, company_id,
        security_level,
        ip_address, user_agent,
        integrity_hash,
        changed_fields
    ) VALUES (
        p_event_type, p_table_name, p_record_id,
        p_old_values, p_new_values,
        p_user_id, user_info.email, p_company_id,
        p_security_level,
        inet_client_addr(), current_setting('request.headers', true)::JSONB->>'user-agent',
        encode(digest(integrity_data, 'sha256'), 'hex'),
        CASE
            WHEN p_old_values IS NOT NULL AND p_new_values IS NOT NULL
            THEN (SELECT array_agg(key) FROM jsonb_each_text(p_new_values) WHERE value != COALESCE((p_old_values->>key), ''))
            ELSE NULL
        END
    ) RETURNING id INTO audit_id;

    RETURN audit_id;
END;
$$;


ALTER FUNCTION "public"."log_audit_event"("p_event_type" "text", "p_table_name" "text", "p_record_id" "text", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_user_id" "uuid", "p_company_id" "uuid", "p_security_level" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_onboarding_step"("p_company_id" "uuid", "p_user_id" "uuid", "p_step_name" "text", "p_step_order" integer, "p_step_data" "jsonb" DEFAULT '{}'::"jsonb", "p_completion_status" "text" DEFAULT 'completed'::"text", "p_time_spent_seconds" integer DEFAULT 0, "p_session_id" "text" DEFAULT NULL::"text", "p_validation_errors" "jsonb" DEFAULT '[]'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_history_id UUID;
    v_user_agent TEXT;
    v_ip_address INET;
BEGIN
    -- Récupérer contexte de la requête si possible
    BEGIN
        v_user_agent := current_setting('request.headers', true)::json->>'user-agent';
        v_ip_address := inet(current_setting('request.headers', true)::json->>'x-forwarded-for');
    EXCEPTION WHEN OTHERS THEN
        -- Ignorer les erreurs de contexte
        NULL;
    END;

    -- Insérer l'étape
    INSERT INTO onboarding_history (
        company_id,
        user_id,
        step_name,
        step_order,
        step_data,
        completion_status,
        time_spent_seconds,
        session_id,
        validation_errors,
        user_agent,
        ip_address
    ) VALUES (
        p_company_id,
        p_user_id,
        p_step_name,
        p_step_order,
        p_step_data,
        p_completion_status,
        p_time_spent_seconds,
        p_session_id,
        p_validation_errors,
        v_user_agent,
        v_ip_address
    )
    RETURNING id INTO v_history_id;

    RETURN v_history_id;
END;
$$;


ALTER FUNCTION "public"."log_onboarding_step"("p_company_id" "uuid", "p_user_id" "uuid", "p_step_name" "text", "p_step_order" integer, "p_step_data" "jsonb", "p_completion_status" "text", "p_time_spent_seconds" integer, "p_session_id" "text", "p_validation_errors" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_security_event"("p_event_type" "text", "p_description" "text", "p_company_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO security_events (event_type, description, company_id, created_at)
    VALUES (p_event_type, p_description, p_company_id, NOW())
    RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$$;


ALTER FUNCTION "public"."log_security_event"("p_event_type" "text", "p_description" "text", "p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_as_read"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET
    is_read = TRUE,
    read_at = now()
  WHERE user_id = p_user_id
    AND is_read = FALSE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."mark_all_notifications_as_read"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_notification_as_read"("p_notification_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE notifications
  SET
    is_read = TRUE,
    read_at = now()
  WHERE id = p_notification_id
    AND user_id = p_user_id
    AND is_read = FALSE;

  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."mark_notification_as_read"("p_notification_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_company_name_safe"("company_name" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $_$
BEGIN
    IF company_name IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN UPPER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                UNACCENT(TRIM(company_name)),
                '[^A-Z0-9]', '', 'g'
            ),
            '(SARL|SAS|SASU|EURL|SA|SCI|SCOP)$', '', 'g'
        )
    );
END;
$_$;


ALTER FUNCTION "public"."normalize_company_name_safe"("company_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reactivate_subscription"("p_user_id" "uuid", "p_subscription_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE subscriptions
  SET
    cancel_at_period_end = FALSE,
    updated_at = now()
  WHERE id = p_subscription_id
    AND user_id = p_user_id
    AND status IN ('active', 'trialing')
    AND cancel_at_period_end = TRUE;

  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."reactivate_subscription"("p_user_id" "uuid", "p_subscription_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_stock_movement_complete"("p_product_id" "uuid", "p_warehouse_id" "uuid", "p_quantity" numeric, "p_movement_type" "text", "p_unit_cost" numeric DEFAULT 0, "p_reference_type" "text" DEFAULT NULL::"text", "p_reference_id" "uuid" DEFAULT NULL::"uuid", "p_notes" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_direction TEXT;
    v_movement_id UUID;
    v_current_stock DECIMAL;
    v_new_stock DECIMAL;
BEGIN
    -- Déterminer la direction
    v_direction := CASE
        WHEN p_movement_type LIKE '%_in' THEN 'in'
        WHEN p_movement_type LIKE '%_out' THEN 'out'
        ELSE 'in'
    END;

    -- Obtenir le stock actuel
    SELECT COALESCE(SUM(quantity_on_hand), 0) INTO v_current_stock
    FROM inventory_items
    WHERE product_id = p_product_id AND warehouse_id = p_warehouse_id;

    -- Calculer le nouveau stock
    IF v_direction = 'in' THEN
        v_new_stock := v_current_stock + p_quantity;
    ELSE
        v_new_stock := v_current_stock - p_quantity;

        -- Vérifier que le stock ne devient pas négatif
        IF v_new_stock < 0 THEN
            RAISE EXCEPTION 'Stock insuffisant. Stock actuel: %, Quantité demandée: %', v_current_stock, p_quantity;
        END IF;
    END IF;

    -- Enregistrer le mouvement
    INSERT INTO inventory_movements (
        product_id, warehouse_id, movement_type, direction,
        quantity, unit_cost, reference_type, reference_id, notes
    ) VALUES (
        p_product_id, p_warehouse_id, p_movement_type, v_direction,
        p_quantity, p_unit_cost, p_reference_type, p_reference_id, p_notes
    ) RETURNING id INTO v_movement_id;

    -- Mettre à jour le stock
    INSERT INTO inventory_items (product_id, warehouse_id, quantity_on_hand, unit_cost, last_movement_date)
    VALUES (p_product_id, p_warehouse_id, v_new_stock, p_unit_cost, NOW())
    ON CONFLICT (product_id, product_variant_id, warehouse_id, location_id)
    DO UPDATE SET
        quantity_on_hand = v_new_stock,
        unit_cost = COALESCE(p_unit_cost, inventory_items.unit_cost),
        last_movement_date = NOW(),
        updated_at = NOW();

    RETURN JSONB_BUILD_OBJECT(
        'movement_id', v_movement_id,
        'previous_stock', v_current_stock,
        'new_stock', v_new_stock,
        'quantity_moved', p_quantity,
        'direction', v_direction
    );
END;
$$;


ALTER FUNCTION "public"."record_stock_movement_complete"("p_product_id" "uuid", "p_warehouse_id" "uuid", "p_quantity" numeric, "p_movement_type" "text", "p_unit_cost" numeric, "p_reference_type" "text", "p_reference_id" "uuid", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_feature_usage_if_needed"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Vérifier s'il faut réinitialiser le compteur d'usage
    IF NEW.reset_period != 'never' AND NEW.last_reset_date IS NOT NULL THEN
        DECLARE
            reset_interval INTERVAL;
        BEGIN
            reset_interval := CASE NEW.reset_period
                WHEN 'daily' THEN '1 day'::INTERVAL
                WHEN 'weekly' THEN '7 days'::INTERVAL
                WHEN 'monthly' THEN '1 month'::INTERVAL
                WHEN 'yearly' THEN '1 year'::INTERVAL
                ELSE NULL
            END;

            IF reset_interval IS NOT NULL AND
               NEW.last_reset_date + reset_interval <= NOW() THEN
                NEW.current_usage = 0;
                NEW.last_reset_date = NOW();
            END IF;
        END;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."reset_feature_usage_if_needed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_user_notifications"("p_email_new_transactions" boolean DEFAULT true, "p_email_weekly_reports" boolean DEFAULT true, "p_email_system_updates" boolean DEFAULT false, "p_email_marketing" boolean DEFAULT false, "p_email_invoices" boolean DEFAULT true, "p_email_payments" boolean DEFAULT true, "p_email_reminders" boolean DEFAULT true, "p_push_new_transactions" boolean DEFAULT false, "p_push_alerts" boolean DEFAULT true, "p_push_reminders" boolean DEFAULT true, "p_push_system_updates" boolean DEFAULT false, "p_notification_frequency" "text" DEFAULT 'daily'::"text", "p_quiet_hours_enabled" boolean DEFAULT false, "p_quiet_hours_start" time without time zone DEFAULT '22:00:00'::time without time zone, "p_quiet_hours_end" time without time zone DEFAULT '08:00:00'::time without time zone) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_uuid UUID := auth.uid();
BEGIN
  -- Validation des paramètres
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  IF p_notification_frequency NOT IN ('immediate', 'daily', 'weekly') THEN
    RAISE EXCEPTION 'Fréquence de notification invalide';
  END IF;

  -- Upsert des paramètres
  INSERT INTO user_notifications (
    user_id,
    email_new_transactions,
    email_weekly_reports,
    email_system_updates,
    email_marketing,
    email_invoices,
    email_payments,
    email_reminders,
    push_new_transactions,
    push_alerts,
    push_reminders,
    push_system_updates,
    notification_frequency,
    quiet_hours_enabled,
    quiet_hours_start,
    quiet_hours_end
  ) VALUES (
    user_uuid,
    p_email_new_transactions,
    p_email_weekly_reports,
    p_email_system_updates,
    p_email_marketing,
    p_email_invoices,
    p_email_payments,
    p_email_reminders,
    p_push_new_transactions,
    p_push_alerts,
    p_push_reminders,
    p_push_system_updates,
    p_notification_frequency,
    p_quiet_hours_enabled,
    p_quiet_hours_start,
    p_quiet_hours_end
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    email_new_transactions = EXCLUDED.email_new_transactions,
    email_weekly_reports = EXCLUDED.email_weekly_reports,
    email_system_updates = EXCLUDED.email_system_updates,
    email_marketing = EXCLUDED.email_marketing,
    email_invoices = EXCLUDED.email_invoices,
    email_payments = EXCLUDED.email_payments,
    email_reminders = EXCLUDED.email_reminders,
    push_new_transactions = EXCLUDED.push_new_transactions,
    push_alerts = EXCLUDED.push_alerts,
    push_reminders = EXCLUDED.push_reminders,
    push_system_updates = EXCLUDED.push_system_updates,
    notification_frequency = EXCLUDED.notification_frequency,
    quiet_hours_enabled = EXCLUDED.quiet_hours_enabled,
    quiet_hours_start = EXCLUDED.quiet_hours_start,
    quiet_hours_end = EXCLUDED.quiet_hours_end,
    updated_at = now();

  RETURN true;
END;
$$;


ALTER FUNCTION "public"."save_user_notifications"("p_email_new_transactions" boolean, "p_email_weekly_reports" boolean, "p_email_system_updates" boolean, "p_email_marketing" boolean, "p_email_invoices" boolean, "p_email_payments" boolean, "p_email_reminders" boolean, "p_push_new_transactions" boolean, "p_push_alerts" boolean, "p_push_reminders" boolean, "p_push_system_updates" boolean, "p_notification_frequency" "text", "p_quiet_hours_enabled" boolean, "p_quiet_hours_start" time without time zone, "p_quiet_hours_end" time without time zone) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."save_user_notifications"("p_email_new_transactions" boolean, "p_email_weekly_reports" boolean, "p_email_system_updates" boolean, "p_email_marketing" boolean, "p_email_invoices" boolean, "p_email_payments" boolean, "p_email_reminders" boolean, "p_push_new_transactions" boolean, "p_push_alerts" boolean, "p_push_reminders" boolean, "p_push_system_updates" boolean, "p_notification_frequency" "text", "p_quiet_hours_enabled" boolean, "p_quiet_hours_start" time without time zone, "p_quiet_hours_end" time without time zone) IS 'Sauvegarde les paramètres de notifications d''un utilisateur';



CREATE OR REPLACE FUNCTION "public"."search_companies_intelligent"("p_search_term" "text", "p_limit" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "name" "text", "legal_name" "text", "siret" "text", "similarity_score" numeric, "data_quality_score" integer, "status" "text")
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    normalized_search TEXT;
BEGIN
    normalized_search := normalize_company_name_safe(p_search_term);

    RETURN QUERY
    SELECT
        c.id,
        c.name,
        c.legal_name,
        c.siret,
        (
            CASE
                WHEN c.name ILIKE '%' || p_search_term || '%' THEN 90
                WHEN c.normalized_name = normalized_search THEN 85
                WHEN c.legal_name ILIKE '%' || p_search_term || '%' THEN 80
                WHEN c.siret LIKE '%' || REGEXP_REPLACE(p_search_term, '[^0-9]', '', 'g') || '%' THEN 75
                ELSE 50
            END +
            (COALESCE(c.data_quality_score, 0)::decimal / 100 * 10)
        )::DECIMAL(5,2) as sim_score,
        COALESCE(c.data_quality_score, 0),
        COALESCE(c.status, 'active')
    FROM companies c
    WHERE COALESCE(c.status, 'active') IN ('active', 'inactive')
    AND (
        c.name ILIKE '%' || p_search_term || '%'
        OR c.legal_name ILIKE '%' || p_search_term || '%'
        OR c.siret LIKE '%' || REGEXP_REPLACE(p_search_term, '[^0-9]', '', 'g') || '%'
        OR c.normalized_name = normalized_search
    )
    ORDER BY sim_score DESC, COALESCE(c.data_quality_score, 0) DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."search_companies_intelligent"("p_search_term" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_sectors"("search_term" "text" DEFAULT NULL::"text", "limit_param" integer DEFAULT 20) RETURNS TABLE("sector_code" "text", "sector_name" "text", "category" "text", "description" "text", "common_modules" "text"[], "typical_size_ranges" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.sector_code,
        s.sector_name,
        s.category,
        s.description,
        s.common_modules,
        s.typical_size_ranges
    FROM sectors_catalog s
    WHERE s.is_active = true
    AND (
        search_term IS NULL
        OR s.sector_name ILIKE '%' || search_term || '%'
        OR s.description ILIKE '%' || search_term || '%'
        OR search_term = ANY(s.keywords)
    )
    ORDER BY s.priority_order, s.sector_name
    LIMIT limit_param;
END;
$$;


ALTER FUNCTION "public"."search_sectors"("search_term" "text", "limit_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_unified_third_parties"("p_company_id" "uuid", "p_search_term" "text" DEFAULT NULL::"text", "p_party_type" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 50) RETURNS TABLE("party_type" "text", "id" "uuid", "party_number" "text", "name" "text", "email" "text", "phone" "text", "total_amount" numeric, "balance" numeric, "is_active" boolean)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        utp.party_type,
        utp.id,
        utp.party_number,
        utp.name,
        utp.email,
        utp.phone,
        utp.total_amount,
        utp.balance,
        utp.is_active
    FROM unified_third_parties_view utp
    WHERE utp.company_id = p_company_id
    AND (p_party_type IS NULL OR utp.party_type = p_party_type)
    AND (
        p_search_term IS NULL OR
        utp.name ILIKE '%' || p_search_term || '%' OR
        utp.email ILIKE '%' || p_search_term || '%' OR
        utp.party_number ILIKE '%' || p_search_term || '%' OR
        COALESCE(utp.company_name, '') ILIKE '%' || p_search_term || '%'
    )
    ORDER BY utp.name
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."search_unified_third_parties"("p_company_id" "uuid", "p_search_term" "text", "p_party_type" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_companies_created_by"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Si owner_id change et created_by est NULL, définir created_by = owner_id
    IF NEW.owner_id IS NOT NULL AND OLD.created_by IS NULL THEN
        NEW.created_by = NEW.owner_id;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_companies_created_by"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transfer_company_ownership"("p_company_id" "uuid", "p_from_user_id" "uuid", "p_to_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Vérifier que from_user est propriétaire
    IF NOT EXISTS (
        SELECT 1 FROM user_companies
        WHERE company_id = p_company_id
        AND user_id = p_from_user_id
        AND role = 'owner'
        AND is_active = true
    ) THEN
        RETURN json_build_object('success', false, 'error', 'User is not owner of this company');
    END IF;

    -- Vérifier que to_user a accès à l'entreprise
    IF NOT EXISTS (
        SELECT 1 FROM user_companies
        WHERE company_id = p_company_id
        AND user_id = p_to_user_id
        AND is_active = true
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Target user does not have access to this company');
    END IF;

    -- Effectuer le transfert
    UPDATE user_companies
    SET role = 'owner', updated_at = NOW()
    WHERE company_id = p_company_id AND user_id = p_to_user_id;

    -- Rétrograder l'ancien propriétaire en admin
    UPDATE user_companies
    SET role = 'admin', updated_at = NOW()
    WHERE company_id = p_company_id AND user_id = p_from_user_id;

    -- Log de l'activité
    INSERT INTO user_activity_log (user_id, company_id, action, details)
    VALUES (
        p_from_user_id,
        p_company_id,
        'transfer_ownership',
        json_build_object('transferred_to', p_to_user_id, 'timestamp', NOW())
    );

    RETURN json_build_object('success', true, 'message', 'Ownership transferred successfully');
END;
$$;


ALTER FUNCTION "public"."transfer_company_ownership"("p_company_id" "uuid", "p_from_user_id" "uuid", "p_to_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."transfer_company_ownership"("p_company_id" "uuid", "p_from_user_id" "uuid", "p_to_user_id" "uuid") IS 'Transfère la propriété d''une entreprise entre utilisateurs';



CREATE OR REPLACE FUNCTION "public"."trigger_bank_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_bank_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_contract_billing_updated"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_contract_billing_updated"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_contract_kpis_updated"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_contract_kpis_updated"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_contract_renewals_updated"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_contract_renewals_updated"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_contract_terminations_updated"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_contract_terminations_updated"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_contracts_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_contracts_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_hr_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_hr_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_project_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    IF TG_TABLE_NAME IN ('project_tasks', 'project_members', 'project_timesheets', 'project_categories', 'project_templates', 'project_phases', 'project_milestones', 'task_comments', 'task_attachments', 'project_discussions', 'project_resources', 'resource_allocations', 'project_schedules', 'project_budgets', 'project_expenses', 'project_billing_rates', 'task_checklists') THEN
        NEW.updated_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_project_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_quote_totals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM update_quote_totals(OLD.quote_id);
        RETURN OLD;
    ELSE
        PERFORM update_quote_totals(NEW.quote_id);
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION "public"."trigger_update_quote_totals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_account_balance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Mettre à jour le solde du compte
        UPDATE chart_of_accounts
        SET
            current_balance = current_balance + NEW.credit_amount - NEW.debit_amount,
            balance_credit = balance_credit + NEW.credit_amount,
            balance_debit = balance_debit + NEW.debit_amount,
            updated_at = NOW()
        WHERE id = NEW.account_id;

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Annuler l'effet de la ligne supprimée
        UPDATE chart_of_accounts
        SET
            current_balance = current_balance - OLD.credit_amount + OLD.debit_amount,
            balance_credit = balance_credit - OLD.credit_amount,
            balance_debit = balance_debit - OLD.debit_amount,
            updated_at = NOW()
        WHERE id = OLD.account_id;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_account_balance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_ai_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_ai_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_budget_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_budget_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_client"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE crm_clients SET
        name = NEW.name,
        type = COALESCE(NEW.type, type),
        status = COALESCE(NEW.status, status),
        primary_contact_name = NEW.contact_name,
        primary_contact_email = NEW.email,
        primary_contact_phone = NEW.phone,
        industry = NEW.industry,
        website = NEW.website,
        total_value = COALESCE(NEW.total_value, total_value),
        tier = COALESCE(NEW.tier, tier),
        health_score = COALESCE(NEW.health_score, health_score),
        updated_at = NOW()
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_client"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_client_from_view"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE crm_clients SET
        name = NEW.name,
        type = NEW.type,
        status = NEW.status,
        primary_contact_name = NEW.contact_name,
        primary_contact_email = NEW.email,
        primary_contact_phone = NEW.phone,
        industry = NEW.industry,
        website = NEW.website,
        updated_at = NOW()
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_client_from_view"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_commercial_action"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE crm_activities SET
        subject = NEW.title,
        description = NEW.description,
        type = COALESCE(NEW.type, type),
        status = COALESCE(NEW.status, status),
        due_date = NEW.due_date,
        priority = COALESCE(NEW.priority, priority),
        opportunity_id = NEW.opportunity_id,
        client_id = NEW.client_id,
        lead_id = NEW.lead_id,
        assigned_to = NEW.assigned_to,
        outcome = NEW.outcome,
        updated_at = NOW()
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_commercial_action"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_companies_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_companies_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_company_features_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_modified_by = auth.uid();

    -- Ajouter à l'historique des modifications
    NEW.modification_history = COALESCE(OLD.modification_history, '[]'::jsonb) ||
        jsonb_build_object(
            'timestamp', NOW(),
            'user_id', auth.uid(),
            'action', TG_OP,
            'changes', CASE
                WHEN TG_OP = 'UPDATE' THEN
                    jsonb_build_object(
                        'is_enabled', jsonb_build_object('from', OLD.is_enabled, 'to', NEW.is_enabled),
                        'configuration', jsonb_build_object('from', OLD.configuration, 'to', NEW.configuration)
                    )
                ELSE jsonb_build_object('created', true)
            END
        );

    -- Gérer les timestamps d'activation/désactivation
    IF TG_OP = 'UPDATE' THEN
        IF OLD.is_enabled = false AND NEW.is_enabled = true THEN
            NEW.enabled_at = NOW();
            NEW.enabled_by = auth.uid();
            NEW.disabled_at = NULL;
            NEW.disabled_by = NULL;
            NEW.disable_reason = NULL;
        ELSIF OLD.is_enabled = true AND NEW.is_enabled = false THEN
            NEW.disabled_at = NOW();
            NEW.disabled_by = auth.uid();
        END IF;
    ELSIF TG_OP = 'INSERT' AND NEW.is_enabled = true THEN
        NEW.enabled_at = NOW();
        NEW.enabled_by = auth.uid();
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_company_features_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_company_governance_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Normalisation nom (existant)
    NEW.normalized_name := normalize_company_name_safe(NEW.name);

    -- Business key (existant)
    IF NEW.business_key IS NULL THEN
        NEW.business_key := COALESCE(NEW.siret, NEW.siren, 'BK_' || NEW.id::text);
    END IF;

    -- ========================================
    -- SCORE DE QUALITÉ ÉTENDU AVEC NOUVEAUX CHAMPS
    -- ========================================
    NEW.data_quality_score := (
        -- Champs existants (75 points max)
        CASE WHEN NEW.name IS NOT NULL AND LENGTH(TRIM(NEW.name)) > 0 THEN 25 ELSE 0 END +
        CASE WHEN NEW.siret IS NOT NULL AND LENGTH(REGEXP_REPLACE(NEW.siret, '[^0-9]', '', 'g')) = 14 THEN 20 ELSE 0 END +
        CASE WHEN NEW.postal_code IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.city IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.legal_name IS NOT NULL THEN 10 ELSE 0 END +

        -- Nouveaux champs CompanyStep (25 points max)
        CASE WHEN NEW.ceo_name IS NOT NULL AND LENGTH(TRIM(NEW.ceo_name)) > 0 THEN 8 ELSE 0 END +
        CASE WHEN NEW.sector IS NOT NULL THEN 7 ELSE 0 END +
        CASE WHEN NEW.industry_type IS NOT NULL THEN 5 ELSE 0 END +
        CASE WHEN NEW.company_size IS NOT NULL THEN 3 ELSE 0 END +
        CASE WHEN NEW.registration_date IS NOT NULL THEN 2 ELSE 0 END
    );

    -- Dates (existant)
    NEW.last_validation_date := NOW();
    NEW.updated_at := NOW();

    -- Status par défaut (existant)
    IF NEW.status IS NULL THEN
        NEW.status := 'active';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_company_governance_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_company_governance_manual"("p_company_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    company_rec RECORD;
BEGIN
    SELECT * INTO company_rec FROM companies WHERE id = p_company_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    UPDATE companies
    SET
        normalized_name = normalize_company_name_safe(name),
        business_key = COALESCE(siret, siren, 'BK_' || id::text),
        data_quality_score = (
            CASE WHEN name IS NOT NULL AND LENGTH(TRIM(name)) > 0 THEN 30 ELSE 0 END +
            CASE WHEN siret IS NOT NULL AND LENGTH(REGEXP_REPLACE(siret, '[^0-9]', '', 'g')) = 14 THEN 25 ELSE 0 END +
            CASE WHEN postal_code IS NOT NULL THEN 15 ELSE 0 END +
            CASE WHEN city IS NOT NULL THEN 15 ELSE 0 END +
            CASE WHEN legal_name IS NOT NULL THEN 15 ELSE 0 END
        ),
        last_validation_date = NOW(),
        status = COALESCE(status, 'active'),
        is_active = COALESCE(is_active, true),
        updated_at = NOW()
    WHERE id = p_company_id;

    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."update_company_governance_manual"("p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_company_modules_metadata"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();

    -- Gérer l'activation automatique
    IF TG_OP = 'UPDATE' AND OLD.is_enabled = false AND NEW.is_enabled = true THEN
        NEW.activated_at = NOW();
        NEW.activated_by = auth.uid();
    END IF;

    -- Mise à jour usage_count si applicable
    IF TG_OP = 'UPDATE' AND NEW.last_used_at > COALESCE(OLD.last_used_at, '1970-01-01'::timestamptz) THEN
        NEW.usage_count = COALESCE(OLD.usage_count, 0) + 1;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_company_modules_metadata"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_crm_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_crm_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_fiscal_settings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_fiscal_settings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_journal_entry_totals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN
        UPDATE journal_entries
        SET
            total_debit = (
                SELECT COALESCE(SUM(debit_amount), 0)
                FROM journal_entry_lines
                WHERE journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id)
            ),
            total_credit = (
                SELECT COALESCE(SUM(credit_amount), 0)
                FROM journal_entry_lines
                WHERE journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id)
            ),
            updated_at = NOW()
        WHERE id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_journal_entry_totals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_notification_preferences_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_notification_preferences_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_onboarding_session_progress"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_session_record RECORD;
    v_completed_count INTEGER;
BEGIN
    -- Chercher la session correspondante si session_id fourni
    IF NEW.session_id IS NOT NULL THEN
        SELECT * INTO v_session_record
        FROM onboarding_sessions
        WHERE session_token = NEW.session_id
        AND company_id = NEW.company_id
        AND user_id = NEW.user_id;

        IF FOUND THEN
            -- Compter les étapes complétées
            SELECT COUNT(*) INTO v_completed_count
            FROM onboarding_history
            WHERE session_id = NEW.session_id
            AND completion_status = 'completed';

            -- Mettre à jour la session
            UPDATE onboarding_sessions SET
                completed_steps = v_completed_count,
                current_step = CASE
                    WHEN NEW.completion_status = 'completed' AND NEW.step_name = 'complete' THEN 'complete'
                    WHEN NEW.completion_status = 'completed' THEN NEW.step_name
                    ELSE current_step
                END,
                final_status = CASE
                    WHEN NEW.step_name = 'complete' AND NEW.completion_status = 'completed' THEN 'completed'
                    WHEN NEW.completion_status = 'error' THEN 'error'
                    WHEN NEW.completion_status = 'abandoned' THEN 'abandoned'
                    ELSE 'in_progress'
                END,
                completed_at = CASE
                    WHEN NEW.step_name = 'complete' AND NEW.completion_status = 'completed' THEN NOW()
                    ELSE completed_at
                END,
                updated_at = NOW()
            WHERE id = v_session_record.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_onboarding_session_progress"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_onboarding_sessions_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_onboarding_sessions_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_opportunity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE crm_opportunities SET
        title = NEW.title,
        description = NEW.description,
        value = COALESCE(NEW.value, value),
        probability = COALESCE(NEW.probability, probability),
        expected_close_date = NEW.close_date,
        status = COALESCE(NEW.status, status),
        source = NEW.source,
        client_id = NEW.client_id,
        owner_id = NEW.assigned_to,
        stage_id = NEW.stage_id,
        pipeline_id = NEW.pipeline_id,
        updated_at = NOW()
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_opportunity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_purchase_totals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Mettre à jour les totaux de la commande
    UPDATE purchases
    SET
        subtotal_amount = (calc.totals->>'subtotal_amount')::DECIMAL,
        tax_amount = (calc.totals->>'tax_amount')::DECIMAL,
        discount_amount = (calc.totals->>'discount_amount')::DECIMAL,
        total_amount = (calc.totals->>'total_amount')::DECIMAL,
        updated_at = NOW()
    FROM (
        SELECT calculate_purchase_totals(COALESCE(NEW.purchase_id, OLD.purchase_id)) as totals
    ) calc
    WHERE id = COALESCE(NEW.purchase_id, OLD.purchase_id);

    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_purchase_totals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_quote_totals"("p_quote_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_subtotal DECIMAL(15,2);
    v_tax_amount DECIMAL(15,2);
    v_total DECIMAL(15,2);
BEGIN
    -- Calculer les totaux depuis les lignes
    SELECT
        COALESCE(SUM(line_total), 0),
        COALESCE(SUM(line_total * tax_rate / 100), 0)
    INTO v_subtotal, v_tax_amount
    FROM quote_items
    WHERE quote_id = p_quote_id;

    v_total := v_subtotal + v_tax_amount;

    -- Mettre à jour le devis
    UPDATE quotes
    SET
        subtotal_amount = v_subtotal,
        tax_amount = v_tax_amount,
        total_amount = v_total,
        updated_at = NOW()
    WHERE id = p_quote_id;
END;
$$;


ALTER FUNCTION "public"."update_quote_totals"("p_quote_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_referentials_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_referentials_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_settings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_settings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_stripe_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_stripe_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_subscription_plans_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_subscription_plans_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_subscriptions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_subscriptions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_timestamp_facturation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_timestamp_facturation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_companies_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_companies_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_last_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE user_companies
    SET last_activity = NOW()
    WHERE user_id = NEW.user_id AND company_id = NEW.company_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_last_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_notifications_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_notifications_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_preferences_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_preferences_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_profiles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_profiles_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_users_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_users_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_company_step_data"("p_name" "text", "p_sector" "text" DEFAULT NULL::"text", "p_company_size" "text" DEFAULT NULL::"text", "p_share_capital" numeric DEFAULT NULL::numeric, "p_ceo_name" "text" DEFAULT NULL::"text", "p_timezone" "text" DEFAULT NULL::"text") RETURNS TABLE("is_valid" boolean, "errors" "text"[], "warnings" "text"[], "quality_score" integer)
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    v_errors TEXT[] := '{}';
    v_warnings TEXT[] := '{}';
    v_score INTEGER := 0;
BEGIN
    -- Validation obligatoire: nom
    IF p_name IS NULL OR LENGTH(TRIM(p_name)) < 2 THEN
        v_errors := array_append(v_errors, 'Le nom de l''entreprise est requis (minimum 2 caractères)');
    ELSE
        v_score := v_score + 25;
    END IF;

    -- Validation optionnelle avec warnings
    IF p_sector IS NOT NULL THEN
        v_score := v_score + 7;
    ELSE
        v_warnings := array_append(v_warnings, 'Secteur d''activité non renseigné');
    END IF;

    IF p_company_size IS NOT NULL THEN
        IF p_company_size NOT IN ('startup', 'small', 'medium', 'large', 'enterprise') THEN
            v_errors := array_append(v_errors, 'Taille d''entreprise invalide');
        ELSE
            v_score := v_score + 3;
        END IF;
    END IF;

    IF p_share_capital IS NOT NULL THEN
        IF p_share_capital < 0 THEN
            v_errors := array_append(v_errors, 'Le capital social ne peut pas être négatif');
        ELSE
            v_score := v_score + 5;
        END IF;
    END IF;

    IF p_ceo_name IS NOT NULL AND LENGTH(TRIM(p_ceo_name)) > 0 THEN
        v_score := v_score + 8;
    END IF;

    IF p_timezone IS NOT NULL AND p_timezone !~ '^[A-Za-z_]+/[A-Za-z_]+$' THEN
        v_errors := array_append(v_errors, 'Format de timezone invalide');
    END IF;

    RETURN QUERY
    SELECT
        array_length(v_errors, 1) IS NULL,
        v_errors,
        v_warnings,
        v_score;
END;
$_$;


ALTER FUNCTION "public"."validate_company_step_data"("p_name" "text", "p_sector" "text", "p_company_size" "text", "p_share_capital" numeric, "p_ceo_name" "text", "p_timezone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_user_preferences"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    -- Validation timezone
    IF NEW.timezone IS NOT NULL AND NEW.timezone !~ '^[A-Za-z_]+/[A-Za-z_]+$' THEN
        RAISE EXCEPTION 'Invalid timezone format: %', NEW.timezone;
    END IF;

    -- Validation currency (format ISO)
    IF NEW.currency IS NOT NULL AND LENGTH(NEW.currency) != 3 THEN
        RAISE EXCEPTION 'Currency must be 3 characters ISO code: %', NEW.currency;
    END IF;

    -- Validation fiscal_year_start format
    IF NEW.fiscal_year_start IS NOT NULL AND NEW.fiscal_year_start !~ '^[0-9]{2}/[0-9]{2}$' THEN
        RAISE EXCEPTION 'Fiscal year start must be in DD/MM format: %', NEW.fiscal_year_start;
    END IF;

    RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."validate_user_preferences"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."accounting_periods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "is_closed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."accounting_periods" OWNER TO "postgres";


COMMENT ON TABLE "public"."accounting_periods" IS 'Exercices comptables de l''entreprise';



CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "account_number" "text" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "class" integer NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "currency" "text" DEFAULT 'EUR'::"text",
    "balance" numeric(15,2) DEFAULT 0,
    "imported_from_fec" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "accounts_type_check" CHECK (("type" = ANY (ARRAY['asset'::"text", 'liability'::"text", 'equity'::"text", 'revenue'::"text", 'expense'::"text"])))
);


ALTER TABLE "public"."accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'EUR'::"text" NOT NULL,
    "interval_type" "text" NOT NULL,
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "max_users" integer,
    "max_clients" integer,
    "storage_limit" "text",
    "support_level" "text" DEFAULT 'basic'::"text",
    "stripe_price_id" "text",
    "stripe_product_id" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "billing_period" "text" DEFAULT 'monthly'::"text" NOT NULL,
    "is_trial" boolean DEFAULT false,
    "trial_days" integer DEFAULT 0,
    "limits_per_month" "jsonb" DEFAULT '{}'::"jsonb",
    "sort_order" integer DEFAULT 0,
    CONSTRAINT "subscription_plans_interval_type_check" CHECK (("interval_type" = ANY (ARRAY['month'::"text", 'year'::"text"]))),
    CONSTRAINT "valid_billing_period" CHECK (("billing_period" = ANY (ARRAY['monthly'::"text", 'yearly'::"text", 'one_time'::"text"])))
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


COMMENT ON TABLE "public"."subscription_plans" IS 'Plans d''abonnement disponibles avec tarification et fonctionnalités';



COMMENT ON COLUMN "public"."subscription_plans"."features" IS 'Fonctionnalités incluses au format JSON';



COMMENT ON COLUMN "public"."subscription_plans"."limits_per_month" IS 'Limites mensuelles au format JSON';



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_id" "text" NOT NULL,
    "stripe_subscription_id" "text",
    "stripe_customer_id" "text",
    "status" "text" DEFAULT 'incomplete'::"text" NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false,
    "canceled_at" timestamp with time zone,
    "trial_start" timestamp with time zone,
    "trial_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid",
    "cancel_at" timestamp with time zone,
    "cancel_reason" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "subscriptions_status_check" CHECK (("status" = ANY (ARRAY['incomplete'::"text", 'incomplete_expired'::"text", 'trialing'::"text", 'active'::"text", 'past_due'::"text", 'cancelled'::"text", 'unpaid'::"text", 'expired'::"text", 'unknown'::"text"]))),
    CONSTRAINT "valid_status" CHECK (("status" = ANY (ARRAY['active'::"text", 'canceled'::"text", 'past_due'::"text", 'unpaid'::"text", 'incomplete'::"text", 'trialing'::"text", 'expired'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."subscriptions" IS 'Abonnements actifs des utilisateurs avec période et statut';



COMMENT ON COLUMN "public"."subscriptions"."status" IS 'Statut: active, canceled, past_due, unpaid, incomplete, trialing, expired, inactive';



COMMENT ON COLUMN "public"."subscriptions"."trial_start" IS 'Début de la période d''essai';



COMMENT ON COLUMN "public"."subscriptions"."trial_end" IS 'Fin de la période d''essai';



CREATE OR REPLACE VIEW "public"."active_subscriptions" AS
 SELECT "s"."id",
    "s"."user_id",
    "s"."plan_id",
    "s"."stripe_subscription_id",
    "s"."stripe_customer_id",
    "s"."status",
    "s"."current_period_start",
    "s"."current_period_end",
    "s"."cancel_at_period_end",
    "s"."canceled_at",
    "s"."trial_start",
    "s"."trial_end",
    "s"."created_at",
    "s"."updated_at",
    "sp"."name" AS "plan_name",
    "sp"."description" AS "plan_description",
    "sp"."price" AS "plan_price",
    "sp"."currency" AS "plan_currency",
    "sp"."billing_period" AS "plan_billing_period",
    "sp"."features" AS "plan_features",
    "sp"."is_trial" AS "plan_is_trial"
   FROM ("public"."subscriptions" "s"
     JOIN "public"."subscription_plans" "sp" ON (("s"."plan_id" = "sp"."id")))
  WHERE ("s"."status" = ANY (ARRAY['active'::"text", 'trialing'::"text"]));


ALTER VIEW "public"."active_subscriptions" OWNER TO "postgres";


COMMENT ON VIEW "public"."active_subscriptions" IS 'Vue sécurisée des abonnements actifs - SECURITY INVOKER par défaut';



CREATE TABLE IF NOT EXISTS "public"."ai_insights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "insight_type" "text" NOT NULL,
    "category" "text" NOT NULL,
    "priority" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "detailed_analysis" "text",
    "source_data" "jsonb" DEFAULT '{}'::"jsonb",
    "related_transactions" "jsonb" DEFAULT '[]'::"jsonb",
    "affected_accounts" "jsonb" DEFAULT '[]'::"jsonb",
    "confidence_score" numeric(3,2) DEFAULT 0.0,
    "impact_score" numeric(3,2) DEFAULT 0.0,
    "model_version" "text" DEFAULT 'v1.0'::"text",
    "suggested_actions" "jsonb" DEFAULT '[]'::"jsonb",
    "implementation_difficulty" "text",
    "estimated_time_to_implement" "text",
    "status" "text" DEFAULT 'active'::"text",
    "implemented_at" timestamp with time zone,
    "implemented_by" "uuid",
    "user_rating" integer,
    "user_feedback" "text",
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_insights_implementation_difficulty_check" CHECK (("implementation_difficulty" = ANY (ARRAY['easy'::"text", 'medium'::"text", 'hard'::"text"]))),
    CONSTRAINT "ai_insights_insight_type_check" CHECK (("insight_type" = ANY (ARRAY['recommendation'::"text", 'alert'::"text", 'prediction'::"text", 'analysis'::"text", 'optimization'::"text"]))),
    CONSTRAINT "ai_insights_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "ai_insights_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'implemented'::"text", 'dismissed'::"text", 'expired'::"text"]))),
    CONSTRAINT "ai_insights_user_rating_check" CHECK ((("user_rating" >= 1) AND ("user_rating" <= 5)))
);


ALTER TABLE "public"."ai_insights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "query" "text" NOT NULL,
    "response" "text" NOT NULL,
    "context_type" "text" DEFAULT 'general'::"text",
    "model_used" "text" DEFAULT 'gpt-4-turbo-preview'::"text",
    "tokens_used" integer DEFAULT 0,
    "confidence_score" numeric(3,2) DEFAULT 0.0,
    "response_time_ms" integer DEFAULT 0,
    "sources" "jsonb" DEFAULT '[]'::"jsonb",
    "suggestions" "jsonb" DEFAULT '[]'::"jsonb",
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "feedback_rating" integer,
    "feedback_comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_interactions_context_type_check" CHECK (("context_type" = ANY (ARRAY['dashboard'::"text", 'accounting'::"text", 'invoicing'::"text", 'reports'::"text", 'general'::"text"]))),
    CONSTRAINT "ai_interactions_feedback_rating_check" CHECK ((("feedback_rating" >= 1) AND ("feedback_rating" <= 5)))
);


ALTER TABLE "public"."ai_interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_performance_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "model_id" "text" NOT NULL,
    "model_version" "text" NOT NULL,
    "metric_type" "text" NOT NULL,
    "metric_value" numeric(10,4) NOT NULL,
    "sample_size" integer DEFAULT 0,
    "measurement_date" "date" NOT NULL,
    "measurement_period" "text",
    "additional_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_performance_metrics_metric_type_check" CHECK (("metric_type" = ANY (ARRAY['accuracy'::"text", 'precision'::"text", 'recall'::"text", 'f1_score'::"text", 'latency'::"text", 'usage'::"text"])))
);


ALTER TABLE "public"."ai_performance_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."alert_configurations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "alert_name" "text" NOT NULL,
    "alert_type" "text" NOT NULL,
    "conditions" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "severity" "text" DEFAULT 'medium'::"text",
    "notification_channels" "text"[] DEFAULT '{}'::"text"[],
    "escalation_rules" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "last_triggered" timestamp with time zone,
    "trigger_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "alert_configurations_alert_type_check" CHECK (("alert_type" = ANY (ARRAY['system'::"text", 'business'::"text", 'security'::"text", 'performance'::"text", 'user_activity'::"text"]))),
    CONSTRAINT "alert_configurations_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."alert_configurations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytical_distributions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "journal_entry_line_id" "uuid" NOT NULL,
    "cost_center_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "percentage" numeric(5,2) DEFAULT 100 NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytical_distributions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."anomaly_detections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "source_table" "text" NOT NULL,
    "source_record_id" "uuid",
    "anomaly_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "severity" "text" NOT NULL,
    "detection_model" "text" DEFAULT 'anomaly-detector-v1'::"text",
    "confidence_score" numeric(3,2) DEFAULT 0.0,
    "anomaly_score" numeric(5,2) DEFAULT 0.0,
    "affected_data" "jsonb" DEFAULT '{}'::"jsonb",
    "normal_range" "jsonb" DEFAULT '{}'::"jsonb",
    "detected_value" "jsonb" DEFAULT '{}'::"jsonb",
    "possible_causes" "jsonb" DEFAULT '[]'::"jsonb",
    "suggested_actions" "jsonb" DEFAULT '[]'::"jsonb",
    "risk_assessment" "text",
    "status" "text" DEFAULT 'open'::"text",
    "resolution_notes" "text",
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "detected_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "anomaly_detections_anomaly_type_check" CHECK (("anomaly_type" = ANY (ARRAY['outlier'::"text", 'pattern'::"text", 'trend'::"text", 'timing'::"text", 'duplicate'::"text"]))),
    CONSTRAINT "anomaly_detections_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "anomaly_detections_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'investigating'::"text", 'resolved'::"text", 'false_positive'::"text"])))
);


ALTER TABLE "public"."anomaly_detections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_configurations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "api_name" "text" NOT NULL,
    "endpoint_base_url" "text" NOT NULL,
    "authentication_type" "text" DEFAULT 'api_key'::"text" NOT NULL,
    "credentials" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "headers" "jsonb" DEFAULT '{}'::"jsonb",
    "rate_limit_per_minute" integer DEFAULT 100,
    "timeout_seconds" integer DEFAULT 30,
    "retry_config" "jsonb" DEFAULT '{"max_retries": 3, "delay_seconds": 5}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "last_successful_call" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "api_configurations_authentication_type_check" CHECK (("authentication_type" = ANY (ARRAY['api_key'::"text", 'oauth2'::"text", 'basic_auth'::"text", 'bearer_token'::"text", 'jwt'::"text"])))
);


ALTER TABLE "public"."api_configurations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "attendance_date" "date" NOT NULL,
    "clock_in" time without time zone,
    "clock_out" time without time zone,
    "status" "text" DEFAULT 'present'::"text",
    "is_holiday" boolean DEFAULT false,
    "is_weekend" boolean DEFAULT false,
    "location" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "attendance_status_check" CHECK (("status" = ANY (ARRAY['present'::"text", 'absent'::"text", 'late'::"text", 'early_departure'::"text", 'half_day'::"text", 'sick'::"text", 'vacation'::"text"])))
);


ALTER TABLE "public"."attendance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "table_name" "text",
    "record_id" "text",
    "user_id" "uuid",
    "user_email" "text",
    "company_id" "uuid",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "changed_fields" "text"[],
    "ip_address" "inet",
    "user_agent" "text",
    "session_id" "text",
    "request_id" "text",
    "security_level" "text" DEFAULT 'standard'::"text",
    "compliance_tags" "text"[],
    "retention_period" integer DEFAULT 2555,
    "country_code" "text",
    "region" "text",
    "timezone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "event_timestamp" timestamp with time zone DEFAULT "now"(),
    "integrity_hash" "text",
    "is_sensitive" boolean DEFAULT false,
    "is_encrypted" boolean DEFAULT false,
    "classification" "text" DEFAULT 'public'::"text"
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "rule_name" "text" NOT NULL,
    "trigger_event" "text" NOT NULL,
    "conditions" "jsonb" DEFAULT '{}'::"jsonb",
    "actions" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "priority" integer DEFAULT 5,
    "execution_count" integer DEFAULT 0,
    "last_executed" timestamp with time zone,
    "error_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "automation_rules_priority_check" CHECK ((("priority" >= 1) AND ("priority" <= 10)))
);


ALTER TABLE "public"."automation_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."available_features" (
    "feature_name" "text" NOT NULL,
    "display_name_fr" "text" NOT NULL,
    "display_name_en" "text",
    "description_fr" "text",
    "description_en" "text",
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "subcategory" "text",
    "default_enabled" boolean DEFAULT false,
    "enterprise_only" boolean DEFAULT false,
    "requires_subscription" boolean DEFAULT false,
    "icon_name" "text",
    "icon_color" "text",
    "sort_order" integer DEFAULT 0,
    "default_usage_limit" integer,
    "default_reset_period" "text" DEFAULT 'monthly'::"text",
    "requires_plan" "text" DEFAULT 'free'::"text",
    "requires_features" "text"[] DEFAULT '{}'::"text"[],
    "conflicts_with" "text"[] DEFAULT '{}'::"text"[],
    "is_active" boolean DEFAULT true,
    "is_beta" boolean DEFAULT false,
    "release_date" "date",
    "deprecation_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "available_features_category_check" CHECK (("category" = ANY (ARRAY['analytics'::"text", 'enterprise'::"text", 'integration'::"text", 'reporting'::"text", 'security'::"text", 'compliance'::"text", 'data'::"text", 'mobile'::"text", 'general'::"text"])))
);


ALTER TABLE "public"."available_features" OWNER TO "postgres";


COMMENT ON TABLE "public"."available_features" IS 'Catalogue des features disponibles dans le système';



CREATE TABLE IF NOT EXISTS "public"."backup_configurations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "config_name" "text" NOT NULL,
    "backup_type" "text" NOT NULL,
    "schedule_expression" "text",
    "retention_days" integer DEFAULT 30,
    "storage_location" "text" NOT NULL,
    "encryption_enabled" boolean DEFAULT true,
    "compression_enabled" boolean DEFAULT true,
    "include_patterns" "text"[] DEFAULT '{}'::"text"[],
    "exclude_patterns" "text"[] DEFAULT '{}'::"text"[],
    "is_active" boolean DEFAULT true,
    "last_backup" timestamp with time zone,
    "next_backup" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "backup_configurations_backup_type_check" CHECK (("backup_type" = ANY (ARRAY['full'::"text", 'incremental'::"text", 'differential'::"text", 'continuous'::"text"])))
);


ALTER TABLE "public"."backup_configurations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "bank_name" "text" NOT NULL,
    "account_name" "text" NOT NULL,
    "account_number" "text" NOT NULL,
    "iban" "text",
    "bic" "text",
    "account_type" "text" DEFAULT 'checking'::"text",
    "currency" "text" DEFAULT 'EUR'::"text",
    "initial_balance" numeric(15,2) DEFAULT 0,
    "current_balance" numeric(15,2) DEFAULT 0,
    "authorized_overdraft" numeric(15,2) DEFAULT 0,
    "accounting_account_id" "uuid",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "bank_accounts_account_type_check" CHECK (("account_type" = ANY (ARRAY['checking'::"text", 'savings'::"text", 'business'::"text", 'credit_line'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."bank_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_alert_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "rule_name" "text" NOT NULL,
    "rule_description" "text",
    "alert_type" "text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "trigger_conditions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "applies_to" "text" DEFAULT 'all'::"text" NOT NULL,
    "account_filters" "text"[] DEFAULT '{}'::"text"[],
    "category_filters" "text"[] DEFAULT '{}'::"text"[],
    "notification_channels" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "cooldown_minutes" integer DEFAULT 60,
    "require_acknowledgment" boolean DEFAULT false,
    "auto_resolve" boolean DEFAULT false,
    "auto_resolve_conditions" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "trigger_count" integer DEFAULT 0,
    "last_triggered_at" timestamp with time zone,
    "false_positive_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."bank_alert_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "user_id" "uuid",
    "connection_id" "uuid",
    "action" "text" NOT NULL,
    "action_category" "text" NOT NULL,
    "resource_type" "text",
    "resource_id" "text",
    "success" boolean DEFAULT true NOT NULL,
    "error_code" "text",
    "error_message" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "session_id" "text",
    "request_id" "text",
    "event_data" "jsonb" DEFAULT '{}'::"jsonb",
    "sensitive_data_accessed" boolean DEFAULT false,
    "risk_level" "text" DEFAULT 'low'::"text",
    "requires_review" boolean DEFAULT false,
    "country_code" "text",
    "city" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_auth_flows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "connection_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "flow_type" "text" DEFAULT 'psd2'::"text" NOT NULL,
    "status" "text" DEFAULT 'initiated'::"text" NOT NULL,
    "auth_url" "text",
    "redirect_uri" "text",
    "state_token" "text",
    "code_verifier" "text",
    "sca_method" "text",
    "sca_status" "text" DEFAULT 'not_required'::"text",
    "challenge_data" "jsonb" DEFAULT '{}'::"jsonb",
    "consent_id" "text",
    "consent_url" "text",
    "permissions_requested" "jsonb" DEFAULT '[]'::"jsonb",
    "error_code" "text",
    "error_message" "text",
    "retry_count" integer DEFAULT 0,
    "max_retries" integer DEFAULT 3,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:15:00'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."bank_auth_flows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_balance_forecasts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "bank_account_id" "uuid" NOT NULL,
    "forecast_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "forecast_horizon_days" integer DEFAULT 30 NOT NULL,
    "forecast_method" "text" DEFAULT 'linear'::"text" NOT NULL,
    "base_balance" numeric(15,2) NOT NULL,
    "base_date" "date" NOT NULL,
    "daily_forecasts" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "recurring_inflows" "jsonb" DEFAULT '[]'::"jsonb",
    "recurring_outflows" "jsonb" DEFAULT '[]'::"jsonb",
    "overall_confidence" numeric(5,2) DEFAULT 0.00,
    "accuracy_last_period" numeric(5,2) DEFAULT 0.00,
    "predicted_low_balance_date" "date",
    "predicted_low_balance_amount" numeric(15,2),
    "cash_shortage_risk" boolean DEFAULT false,
    "optimistic_scenario" "jsonb" DEFAULT '{}'::"jsonb",
    "pessimistic_scenario" "jsonb" DEFAULT '{}'::"jsonb",
    "most_likely_scenario" "jsonb" DEFAULT '{}'::"jsonb",
    "forecast_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "model_parameters" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_balance_forecasts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_cash_flow_analysis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "bank_account_id" "uuid" NOT NULL,
    "analysis_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "analysis_period" "text" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "opening_balance" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "closing_balance" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "average_balance" numeric(15,2) DEFAULT 0.00,
    "min_balance" numeric(15,2) DEFAULT 0.00,
    "max_balance" numeric(15,2) DEFAULT 0.00,
    "total_inflows" numeric(15,2) DEFAULT 0.00,
    "total_outflows" numeric(15,2) DEFAULT 0.00,
    "net_cash_flow" numeric(15,2) DEFAULT 0.00,
    "operating_cash_flow" numeric(15,2) DEFAULT 0.00,
    "investing_cash_flow" numeric(15,2) DEFAULT 0.00,
    "financing_cash_flow" numeric(15,2) DEFAULT 0.00,
    "transaction_count" integer DEFAULT 0,
    "inflow_transaction_count" integer DEFAULT 0,
    "outflow_transaction_count" integer DEFAULT 0,
    "cash_flow_by_category" "jsonb" DEFAULT '{}'::"jsonb",
    "top_expenses" "jsonb" DEFAULT '[]'::"jsonb",
    "top_revenues" "jsonb" DEFAULT '[]'::"jsonb",
    "cash_flow_volatility" numeric(10,6) DEFAULT 0.00,
    "burn_rate" numeric(15,2) DEFAULT 0.00,
    "runway_days" integer,
    "analysis_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_cash_flow_analysis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_categorization_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "priority" integer DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "conditions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "target_category" "text" NOT NULL,
    "target_subcategory" "text",
    "target_account_code" "text",
    "use_ml_enhancement" boolean DEFAULT false,
    "ml_confidence_threshold" numeric(5,2) DEFAULT 80.00,
    "applications_count" integer DEFAULT 0,
    "accuracy_rate" numeric(5,2) DEFAULT 0.00,
    "last_applied_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."bank_categorization_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider_id" "text" NOT NULL,
    "provider_name" "text" NOT NULL,
    "provider_connection_id" "text" NOT NULL,
    "bank_id" "text" NOT NULL,
    "bank_name" "text" NOT NULL,
    "bank_logo" "text",
    "bank_country" "text" DEFAULT 'FR'::"text",
    "bank_bic" "text",
    "status" "text" DEFAULT 'connecting'::"text" NOT NULL,
    "error_code" "text",
    "error_message" "text",
    "access_token" "text",
    "refresh_token" "text",
    "token_expires_at" timestamp with time zone,
    "consent_id" "text",
    "consent_status" "text" DEFAULT 'valid'::"text",
    "consent_expires_at" timestamp with time zone,
    "consent_permissions" "jsonb" DEFAULT '[]'::"jsonb",
    "last_sync" timestamp with time zone,
    "next_sync" timestamp with time zone,
    "sync_frequency_hours" integer DEFAULT 24,
    "auto_sync_enabled" boolean DEFAULT true,
    "connection_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "provider_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."bank_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_consents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "connection_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "consent_id" "text" NOT NULL,
    "consent_type" "text" DEFAULT 'aisp'::"text" NOT NULL,
    "status" "text" DEFAULT 'awaiting_authorization'::"text" NOT NULL,
    "permissions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "accounts_scope" "text" DEFAULT 'all'::"text",
    "selected_accounts" "text"[] DEFAULT '{}'::"text"[],
    "valid_until" timestamp with time zone NOT NULL,
    "created_at_bank" timestamp with time zone,
    "last_action_date" timestamp with time zone,
    "max_frequency_per_day" integer DEFAULT 4,
    "access_count_today" integer DEFAULT 0,
    "last_access_date" "date" DEFAULT CURRENT_DATE,
    "revoked_at" timestamp with time zone,
    "revoked_by" "text",
    "revocation_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_consents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_dashboards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "dashboard_name" "text" NOT NULL,
    "description" "text",
    "layout_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "widgets" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "filters" "jsonb" DEFAULT '{}'::"jsonb",
    "refresh_interval_minutes" integer DEFAULT 15,
    "is_public" boolean DEFAULT false,
    "allowed_users" "uuid"[] DEFAULT '{}'::"uuid"[],
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "custom_kpis" "jsonb" DEFAULT '[]'::"jsonb",
    "custom_charts" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "is_default" boolean DEFAULT false,
    "dashboard_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "last_viewed_at" timestamp with time zone,
    "view_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."bank_dashboards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_encrypted_credentials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "connection_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "encrypted_data" "text" NOT NULL,
    "encryption_algorithm" "text" DEFAULT 'AES-256-GCM'::"text" NOT NULL,
    "key_id" "text" NOT NULL,
    "initialization_vector" "text" NOT NULL,
    "key_rotation_version" integer DEFAULT 1,
    "key_derivation_salt" "text",
    "data_type" "text" NOT NULL,
    "data_version" integer DEFAULT 1,
    "expires_at" timestamp with time zone,
    "access_count" integer DEFAULT 0,
    "last_accessed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_encrypted_credentials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_export_formats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text",
    "target_software" "text" NOT NULL,
    "software_version" "text",
    "file_format" "text" NOT NULL,
    "file_extension" "text" NOT NULL,
    "export_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "field_mappings" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "validation_rules" "jsonb" DEFAULT '[]'::"jsonb",
    "default_filters" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "is_system_format" boolean DEFAULT false,
    "usage_count" integer DEFAULT 0,
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."bank_export_formats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_export_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "export_format_id" "uuid" NOT NULL,
    "job_name" "text",
    "export_parameters" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "date_range_start" "date" NOT NULL,
    "date_range_end" "date" NOT NULL,
    "account_filters" "text"[] DEFAULT '{}'::"text"[],
    "category_filters" "text"[] DEFAULT '{}'::"text"[],
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "progress_percentage" numeric(5,2) DEFAULT 0.00,
    "current_step" "text",
    "output_file_path" "text",
    "output_file_size" integer,
    "records_exported" integer DEFAULT 0,
    "error_message" "text",
    "error_details" "jsonb" DEFAULT '{}'::"jsonb",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "processing_duration_ms" integer,
    "job_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."bank_export_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_field_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "export_format_id" "uuid" NOT NULL,
    "source_field" "text" NOT NULL,
    "target_field" "text" NOT NULL,
    "field_order" integer DEFAULT 1,
    "transformation_type" "text",
    "transformation_config" "jsonb" DEFAULT '{}'::"jsonb",
    "is_required" boolean DEFAULT false,
    "default_value" "text",
    "validation_pattern" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_field_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_merchant_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "merchant_name" "text" NOT NULL,
    "normalized_name" "text" NOT NULL,
    "merchant_id" "text",
    "brand_name" "text",
    "category" "text",
    "subcategory" "text",
    "mcc_code" "text",
    "industry" "text",
    "website" "text",
    "phone" "text",
    "email" "text",
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "postal_code" "text",
    "country" "text" DEFAULT 'FR'::"text",
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "logo_url" "text",
    "primary_color" "text",
    "data_source" "text" DEFAULT 'internal'::"text",
    "data_confidence" numeric(5,2) DEFAULT 100.00,
    "transaction_count" integer DEFAULT 0,
    "last_seen_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_merchant_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "alert_rule_id" "uuid",
    "notification_type" "text" NOT NULL,
    "severity" "text" DEFAULT 'info'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "related_entity_type" "text",
    "related_entity_id" "uuid",
    "status" "text" DEFAULT 'unread'::"text" NOT NULL,
    "read_at" timestamp with time zone,
    "acknowledged_at" timestamp with time zone,
    "acknowledged_by" "uuid",
    "channels_sent" "jsonb" DEFAULT '[]'::"jsonb",
    "delivery_status" "jsonb" DEFAULT '{}'::"jsonb",
    "expires_at" timestamp with time zone,
    "auto_delete" boolean DEFAULT true,
    "available_actions" "jsonb" DEFAULT '[]'::"jsonb",
    "action_taken" "text",
    "action_taken_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_providers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "logo" "text",
    "website" "text",
    "base_url" "text" NOT NULL,
    "api_version" "text",
    "auth_type" "text" NOT NULL,
    "supports_psd2" boolean DEFAULT false,
    "supports_webhooks" boolean DEFAULT false,
    "supports_sca" boolean DEFAULT false,
    "supports_payment_initiation" boolean DEFAULT false,
    "supported_countries" "text"[] DEFAULT '{}'::"text"[],
    "supported_banks_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "is_sandbox" boolean DEFAULT false,
    "rate_limit_requests" integer DEFAULT 100,
    "rate_limit_window_hours" integer DEFAULT 1,
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_providers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_reconciliation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "bank_account_id" "uuid" NOT NULL,
    "bank_transaction_id" "uuid" NOT NULL,
    "accounting_entry_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "match_type" "text" DEFAULT 'automatic'::"text",
    "confidence_score" numeric(5,2) DEFAULT 0.00,
    "match_criteria" "jsonb" DEFAULT '[]'::"jsonb",
    "discrepancies" "jsonb" DEFAULT '{}'::"jsonb",
    "validated" boolean DEFAULT false,
    "validated_by" "uuid",
    "validated_at" timestamp with time zone,
    "notes" "text",
    "internal_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_reconciliation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_reconciliation_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "bank_transaction_id" "uuid",
    "accounting_entry_id" "uuid",
    "reconciliation_id" "uuid",
    "action" "text" NOT NULL,
    "action_type" "text" DEFAULT 'user'::"text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "previous_state" "jsonb" DEFAULT '{}'::"jsonb",
    "new_state" "jsonb" DEFAULT '{}'::"jsonb",
    "user_id" "uuid",
    "session_id" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_reconciliation_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_reconciliation_matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "bank_transaction_id" "uuid" NOT NULL,
    "rule_id" "uuid",
    "suggested_accounting_entry_id" "uuid",
    "match_type" "text" NOT NULL,
    "confidence_score" numeric(5,2) DEFAULT 0.00 NOT NULL,
    "match_criteria" "jsonb" DEFAULT '[]'::"jsonb",
    "score_breakdown" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'suggested'::"text" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "review_notes" "text",
    "system_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_reconciliation_matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_reconciliation_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "priority" integer DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "conditions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "actions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "auto_apply" boolean DEFAULT true,
    "requires_review" boolean DEFAULT false,
    "match_count" integer DEFAULT 0,
    "success_rate" numeric(5,2) DEFAULT 0.00,
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."bank_reconciliation_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_sca_methods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "connection_id" "uuid" NOT NULL,
    "auth_flow_id" "uuid",
    "method_type" "text" NOT NULL,
    "method_name" "text" NOT NULL,
    "method_description" "text",
    "is_available" boolean DEFAULT true,
    "is_preferred" boolean DEFAULT false,
    "priority" integer DEFAULT 1,
    "challenge_format" "text",
    "challenge_length" integer,
    "method_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_used_at" timestamp with time zone
);


ALTER TABLE "public"."bank_sca_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_spending_patterns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "bank_account_id" "uuid",
    "analysis_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "analysis_period" "text" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "pattern_type" "text" NOT NULL,
    "pattern_category" "text" NOT NULL,
    "pattern_description" "text" NOT NULL,
    "pattern_value" "text",
    "frequency" "text",
    "average_amount" numeric(15,2) DEFAULT 0.00,
    "total_amount" numeric(15,2) DEFAULT 0.00,
    "transaction_count" integer DEFAULT 0,
    "confidence_score" numeric(5,2) DEFAULT 0.00,
    "volatility" numeric(10,6) DEFAULT 0.00,
    "trend_direction" "text",
    "growth_rate" numeric(10,6) DEFAULT 0.00,
    "vs_previous_period" numeric(15,2) DEFAULT 0.00,
    "vs_same_period_last_year" numeric(15,2) DEFAULT 0.00,
    "representative_transactions" "jsonb" DEFAULT '[]'::"jsonb",
    "pattern_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "is_anomaly" boolean DEFAULT false,
    "risk_level" "text" DEFAULT 'low'::"text",
    "requires_attention" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_spending_patterns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_supported_banks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "bank_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "country" "text" DEFAULT 'FR'::"text" NOT NULL,
    "bic" "text",
    "logo" "text",
    "website" "text",
    "login_type" "text" DEFAULT 'oauth2'::"text" NOT NULL,
    "supports_business_accounts" boolean DEFAULT false,
    "supports_psd2" boolean DEFAULT false,
    "supports_accounts" boolean DEFAULT true,
    "supports_transactions" boolean DEFAULT true,
    "supports_balance" boolean DEFAULT true,
    "supports_payment_initiation" boolean DEFAULT false,
    "supports_webhooks" boolean DEFAULT false,
    "supports_real_time" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "maintenance_mode" boolean DEFAULT false,
    "bank_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_supported_banks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_sync_statistics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "connection_id" "uuid" NOT NULL,
    "sync_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "sync_type" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "status" "text" DEFAULT 'completed'::"text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "duration_ms" integer,
    "accounts_synced" integer DEFAULT 0,
    "transactions_added" integer DEFAULT 0,
    "transactions_updated" integer DEFAULT 0,
    "transactions_failed" integer DEFAULT 0,
    "error_count" integer DEFAULT 0,
    "error_details" "jsonb" DEFAULT '[]'::"jsonb",
    "api_calls_made" integer DEFAULT 0,
    "rate_limit_hits" integer DEFAULT 0,
    "sync_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_sync_statistics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_token_rotation_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "connection_id" "uuid" NOT NULL,
    "rotation_reason" "text" NOT NULL,
    "old_token_hash" "text" NOT NULL,
    "new_token_hash" "text" NOT NULL,
    "success" boolean DEFAULT true NOT NULL,
    "error_code" "text",
    "error_message" "text",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "duration_ms" integer,
    "triggered_by" "text" DEFAULT 'system'::"text",
    "provider_response" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_token_rotation_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_transaction_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "parent_category_id" "uuid",
    "name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text",
    "level" integer DEFAULT 1,
    "full_path" "text",
    "color" "text" DEFAULT '#3B82F6'::"text",
    "icon" "text",
    "default_account_code" "text",
    "debit_account" "text",
    "credit_account" "text",
    "is_active" boolean DEFAULT true,
    "is_system" boolean DEFAULT false,
    "transaction_count" integer DEFAULT 0,
    "total_amount" numeric(15,2) DEFAULT 0.00,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_transaction_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bank_account_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "journal_entry_id" "uuid",
    "transaction_date" "date" NOT NULL,
    "value_date" "date",
    "amount" numeric(15,2) NOT NULL,
    "currency" "text" DEFAULT 'EUR'::"text",
    "description" "text" NOT NULL,
    "reference" "text",
    "category" "text",
    "is_reconciled" boolean DEFAULT false,
    "reconciliation_date" "date",
    "bank_reference" "text",
    "import_date" timestamp with time zone,
    "import_source" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_validation_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "export_format_id" "uuid" NOT NULL,
    "rule_name" "text" NOT NULL,
    "rule_description" "text",
    "field_name" "text" NOT NULL,
    "validation_type" "text" NOT NULL,
    "validation_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "error_message" "text" NOT NULL,
    "warning_message" "text",
    "is_blocking" boolean DEFAULT true,
    "severity" "text" DEFAULT 'error'::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_validation_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_webhook_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "connection_id" "uuid",
    "webhook_url" "text" NOT NULL,
    "secret_token" "text" NOT NULL,
    "subscribed_events" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "max_retries" integer DEFAULT 3,
    "retry_delay_seconds" integer DEFAULT 30,
    "timeout_seconds" integer DEFAULT 30,
    "is_active" boolean DEFAULT true,
    "last_event_at" timestamp with time zone,
    "last_success_at" timestamp with time zone,
    "last_error_at" timestamp with time zone,
    "consecutive_failures" integer DEFAULT 0,
    "total_events_received" integer DEFAULT 0,
    "total_events_processed" integer DEFAULT 0,
    "total_events_failed" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_webhook_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_webhook_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "webhook_config_id" "uuid" NOT NULL,
    "connection_id" "uuid",
    "event_id" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "event_source" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "signature" "text",
    "status" "text" DEFAULT 'received'::"text" NOT NULL,
    "processed_at" timestamp with time zone,
    "retry_count" integer DEFAULT 0,
    "error_message" "text",
    "error_details" "jsonb" DEFAULT '{}'::"jsonb",
    "processing_results" "jsonb" DEFAULT '{}'::"jsonb",
    "entities_created" integer DEFAULT 0,
    "entities_updated" integer DEFAULT 0,
    "received_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processing_started_at" timestamp with time zone,
    "processing_completed_at" timestamp with time zone,
    "processing_duration_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_webhook_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."benefits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "is_mandatory" boolean DEFAULT false,
    "requires_employee_contribution" boolean DEFAULT false,
    "eligibility_criteria" "jsonb" DEFAULT '{}'::"jsonb",
    "eligible_positions" "text"[],
    "eligible_departments" "text"[],
    "company_cost_monthly" numeric(15,2),
    "employee_cost_monthly" numeric(15,2),
    "currency" "text" DEFAULT 'EUR'::"text",
    "max_amount_per_year" numeric(15,2),
    "usage_limit_per_year" integer,
    "provider_name" "text",
    "provider_contact" "text",
    "provider_contract_start" "date",
    "provider_contract_end" "date",
    "benefit_value" numeric(15,2),
    "tax_treatment" "text" DEFAULT 'taxable'::"text",
    "social_charges_applicable" boolean DEFAULT true,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "benefits_category_check" CHECK (("category" = ANY (ARRAY['health'::"text", 'retirement'::"text", 'vacation'::"text", 'perks'::"text", 'insurance'::"text", 'transport'::"text", 'meal'::"text", 'technology'::"text", 'wellness'::"text"]))),
    CONSTRAINT "benefits_tax_treatment_check" CHECK (("tax_treatment" = ANY (ARRAY['taxable'::"text", 'non_taxable'::"text", 'partially_taxable'::"text"])))
);


ALTER TABLE "public"."benefits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budget_approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "budget_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "approver_id" "uuid" NOT NULL,
    "approval_level" integer DEFAULT 1 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "comments" "text",
    "conditions" "text",
    "approved_at" timestamp with time zone,
    "deadline" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "budget_approvals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'delegated'::"text"])))
);


ALTER TABLE "public"."budget_approvals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budget_assumptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "budget_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "key" "text" NOT NULL,
    "description" "text" NOT NULL,
    "value_numeric" numeric(15,4),
    "value_text" "text",
    "unit" "text",
    "category" "text" NOT NULL,
    "impact_description" "text",
    "confidence_level" integer DEFAULT 50,
    "source" "text",
    "sensitivity_high" numeric(15,4),
    "sensitivity_low" numeric(15,4),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "budget_assumptions_confidence_level_check" CHECK ((("confidence_level" >= 0) AND ("confidence_level" <= 100)))
);


ALTER TABLE "public"."budget_assumptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budget_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "budget_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size" integer NOT NULL,
    "file_type" "text" NOT NULL,
    "mime_type" "text",
    "description" "text",
    "is_confidential" boolean DEFAULT false,
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    "uploaded_by" "uuid" NOT NULL
);


ALTER TABLE "public"."budget_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budget_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "budget_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "subcategory" "text",
    "category_type" "text" DEFAULT 'expense'::"text" NOT NULL,
    "account_codes" "text"[] DEFAULT '{}'::"text"[],
    "annual_amount" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "monthly_amounts" numeric(15,2)[] DEFAULT ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "growth_rate" numeric(8,4),
    "driver_type" "text" DEFAULT 'fixed'::"text" NOT NULL,
    "base_value" numeric(15,2),
    "variable_rate" numeric(8,4),
    "formula" "text",
    "notes" "text",
    "responsible_person" "text",
    "approval_status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "budget_categories_approval_status_check" CHECK (("approval_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"]))),
    CONSTRAINT "budget_categories_category_type_check" CHECK (("category_type" = ANY (ARRAY['revenue'::"text", 'expense'::"text", 'capex'::"text"]))),
    CONSTRAINT "budget_categories_driver_type_check" CHECK (("driver_type" = ANY (ARRAY['fixed'::"text", 'variable'::"text", 'step'::"text", 'formula'::"text"])))
);


ALTER TABLE "public"."budget_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budget_category_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "country_code" "text" NOT NULL,
    "category" "text" NOT NULL,
    "subcategory" "text",
    "category_type" "text" NOT NULL,
    "driver_type" "text" DEFAULT 'manual'::"text" NOT NULL,
    "default_account_numbers" "text"[],
    "display_order" integer,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "budget_category_templates_category_type_check" CHECK (("category_type" = ANY (ARRAY['revenue'::"text", 'expense'::"text", 'capex'::"text"])))
);


ALTER TABLE "public"."budget_category_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budget_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "budget_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "parent_comment_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "comment_type" "text" DEFAULT 'general'::"text",
    "is_internal" boolean DEFAULT true,
    "is_resolved" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid" NOT NULL,
    CONSTRAINT "budget_comments_comment_type_check" CHECK (("comment_type" = ANY (ARRAY['general'::"text", 'question'::"text", 'suggestion'::"text", 'approval'::"text", 'rejection'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."budget_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budget_forecasts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "budget_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "forecast_type" "text" NOT NULL,
    "forecast_method" "text" NOT NULL,
    "forecast_horizon" integer NOT NULL,
    "base_period_start" "date" NOT NULL,
    "base_period_end" "date" NOT NULL,
    "forecasted_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "confidence_intervals" "jsonb" DEFAULT '{}'::"jsonb",
    "methodology_notes" "text",
    "accuracy_score" numeric(5,2),
    "mae" numeric(15,2),
    "mape" numeric(8,4),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "budget_forecasts_forecast_method_check" CHECK (("forecast_method" = ANY (ARRAY['linear'::"text", 'seasonal'::"text", 'regression'::"text", 'ai_ml'::"text"]))),
    CONSTRAINT "budget_forecasts_forecast_type_check" CHECK (("forecast_type" = ANY (ARRAY['rolling'::"text", 'full_year'::"text", 'scenario'::"text", 'trend'::"text"])))
);


ALTER TABLE "public"."budget_forecasts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budget_lines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "budget_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "january" numeric(15,2) DEFAULT 0,
    "february" numeric(15,2) DEFAULT 0,
    "march" numeric(15,2) DEFAULT 0,
    "april" numeric(15,2) DEFAULT 0,
    "may" numeric(15,2) DEFAULT 0,
    "june" numeric(15,2) DEFAULT 0,
    "july" numeric(15,2) DEFAULT 0,
    "august" numeric(15,2) DEFAULT 0,
    "september" numeric(15,2) DEFAULT 0,
    "october" numeric(15,2) DEFAULT 0,
    "november" numeric(15,2) DEFAULT 0,
    "december" numeric(15,2) DEFAULT 0,
    "total_amount" numeric(15,2) DEFAULT 0,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."budget_lines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budget_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "budget_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "notification_type" "text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text",
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "action_url" "text",
    "is_read" boolean DEFAULT false,
    "is_sent" boolean DEFAULT false,
    "send_at" timestamp with time zone DEFAULT "now"(),
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "budget_notifications_notification_type_check" CHECK (("notification_type" = ANY (ARRAY['approval_required'::"text", 'approved'::"text", 'rejected'::"text", 'deadline_approaching'::"text", 'variance_threshold'::"text", 'forecast_updated'::"text", 'consolidation_ready'::"text"]))),
    CONSTRAINT "budget_notifications_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"])))
);


ALTER TABLE "public"."budget_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budget_scenarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "budget_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "scenario_type" "text" DEFAULT 'custom'::"text",
    "probability" numeric(5,2) DEFAULT 50.00,
    "revenue_adjustment" numeric(8,4) DEFAULT 0.0000,
    "expense_adjustment" numeric(8,4) DEFAULT 0.0000,
    "growth_factor" numeric(8,4) DEFAULT 1.0000,
    "scenario_assumptions" "jsonb" DEFAULT '{}'::"jsonb",
    "calculated_revenue" numeric(15,2),
    "calculated_expenses" numeric(15,2),
    "calculated_profit" numeric(15,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "budget_scenarios_probability_check" CHECK ((("probability" >= (0)::numeric) AND ("probability" <= (100)::numeric))),
    CONSTRAINT "budget_scenarios_scenario_type_check" CHECK (("scenario_type" = ANY (ARRAY['pessimistic'::"text", 'realistic'::"text", 'optimistic'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."budget_scenarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budget_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "industry" "text",
    "company_size" "text",
    "template_type" "text" DEFAULT 'standard'::"text",
    "is_default" boolean DEFAULT false,
    "is_public" boolean DEFAULT false,
    "version" "text" DEFAULT '1.0'::"text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "budget_templates_company_size_check" CHECK (("company_size" = ANY (ARRAY['small'::"text", 'medium'::"text", 'large'::"text", 'enterprise'::"text"]))),
    CONSTRAINT "budget_templates_template_type_check" CHECK (("template_type" = ANY (ARRAY['standard'::"text", 'industry'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."budget_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budget_variance_analysis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "budget_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "analysis_period" "text" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "budget_amount" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "actual_amount" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "variance_amount" numeric(15,2) GENERATED ALWAYS AS (("actual_amount" - "budget_amount")) STORED,
    "variance_percentage" numeric(8,4) GENERATED ALWAYS AS (
CASE
    WHEN ("budget_amount" <> (0)::numeric) THEN ((("actual_amount" - "budget_amount") / "budget_amount") * (100)::numeric)
    ELSE (0)::numeric
END) STORED,
    "ytd_budget" numeric(15,2) DEFAULT 0.00,
    "ytd_actual" numeric(15,2) DEFAULT 0.00,
    "ytd_variance_amount" numeric(15,2) GENERATED ALWAYS AS (("ytd_actual" - "ytd_budget")) STORED,
    "ytd_variance_percentage" numeric(8,4) GENERATED ALWAYS AS (
CASE
    WHEN ("ytd_budget" <> (0)::numeric) THEN ((("ytd_actual" - "ytd_budget") / "ytd_budget") * (100)::numeric)
    ELSE (0)::numeric
END) STORED,
    "trend" "text" DEFAULT 'neutral'::"text",
    "explanation" "text",
    "corrective_actions" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "analyzed_by" "uuid",
    CONSTRAINT "budget_variance_analysis_trend_check" CHECK (("trend" = ANY (ARRAY['favorable'::"text", 'unfavorable'::"text", 'neutral'::"text"])))
);


ALTER TABLE "public"."budget_variance_analysis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budgets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "budget_year" integer NOT NULL,
    "version" integer DEFAULT 1,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "total_revenue" numeric(15,2) DEFAULT 0,
    "total_expenses" numeric(15,2) DEFAULT 0,
    "net_result" numeric(15,2) DEFAULT 0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "budgets_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'closed'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."budgets" OWNER TO "postgres";


COMMENT ON TABLE "public"."budgets" IS 'Budgets prévisionnels';



CREATE TABLE IF NOT EXISTS "public"."cache_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "cache_name" "text" NOT NULL,
    "cache_type" "text" NOT NULL,
    "ttl_seconds" integer DEFAULT 3600,
    "max_size_mb" integer DEFAULT 100,
    "eviction_policy" "text" DEFAULT 'lru'::"text",
    "compression_enabled" boolean DEFAULT false,
    "is_enabled" boolean DEFAULT true,
    "hit_rate_threshold" numeric(5,2) DEFAULT 80.00,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid",
    CONSTRAINT "cache_settings_cache_type_check" CHECK (("cache_type" = ANY (ARRAY['memory'::"text", 'redis'::"text", 'database'::"text", 'file'::"text", 'cdn'::"text"]))),
    CONSTRAINT "cache_settings_eviction_policy_check" CHECK (("eviction_policy" = ANY (ARRAY['lru'::"text", 'fifo'::"text", 'random'::"text"])))
);


ALTER TABLE "public"."cache_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."career_progression" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "from_position_id" "uuid",
    "to_position_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "progression_type" "text" NOT NULL,
    "effective_date" "date" NOT NULL,
    "announcement_date" "date",
    "reason" "text",
    "performance_rating" numeric(3,1),
    "approved_by" "uuid" NOT NULL,
    "hr_approved_by" "uuid",
    "previous_salary" numeric(15,2),
    "new_salary" numeric(15,2),
    "salary_increase_percentage" numeric(5,2) GENERATED ALWAYS AS (
CASE
    WHEN ("previous_salary" > (0)::numeric) THEN ((("new_salary" - "previous_salary") / "previous_salary") * (100)::numeric)
    ELSE (0)::numeric
END) STORED,
    "probation_period_months" integer DEFAULT 0,
    "training_required" boolean DEFAULT false,
    "training_completion_deadline" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "career_progression_new_salary_check" CHECK (("new_salary" >= (0)::numeric)),
    CONSTRAINT "career_progression_previous_salary_check" CHECK (("previous_salary" >= (0)::numeric)),
    CONSTRAINT "career_progression_progression_type_check" CHECK (("progression_type" = ANY (ARRAY['promotion'::"text", 'lateral_move'::"text", 'demotion'::"text", 'transfer'::"text", 'return_from_leave'::"text"])))
);


ALTER TABLE "public"."career_progression" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cash_flow_predictions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "prediction_date" "date" NOT NULL,
    "prediction_month" "text" NOT NULL,
    "predicted_income" numeric(15,2) DEFAULT 0,
    "predicted_expenses" numeric(15,2) DEFAULT 0,
    "predicted_balance" numeric(15,2) DEFAULT 0,
    "actual_income" numeric(15,2),
    "actual_expenses" numeric(15,2),
    "actual_balance" numeric(15,2),
    "confidence_score" numeric(3,2) DEFAULT 0.0,
    "model_used" "text" DEFAULT 'cashflow-predictor-v1'::"text",
    "prediction_factors" "jsonb" DEFAULT '[]'::"jsonb",
    "trend_direction" "text",
    "variance_from_actual" numeric(15,2),
    "historical_data_points" integer DEFAULT 0,
    "seasonality_factor" numeric(3,2) DEFAULT 0.0,
    "trend_factor" numeric(3,2) DEFAULT 0.0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "cash_flow_predictions_trend_direction_check" CHECK (("trend_direction" = ANY (ARRAY['up'::"text", 'down'::"text", 'stable'::"text"])))
);


ALTER TABLE "public"."cash_flow_predictions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."category_account_map" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "account_code" "text" NOT NULL,
    "analytic_tag_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."category_account_map" OWNER TO "postgres";


COMMENT ON TABLE "public"."category_account_map" IS 'Mapping entre catégories budget et comptes comptables';



CREATE TABLE IF NOT EXISTS "public"."chart_of_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "account_number" "text" NOT NULL,
    "account_name" "text" NOT NULL,
    "account_type" "text" NOT NULL,
    "parent_account_id" "uuid",
    "level" integer DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "balance_debit" numeric(15,2) DEFAULT 0,
    "balance_credit" numeric(15,2) DEFAULT 0,
    "current_balance" numeric(15,2) DEFAULT 0,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chart_of_accounts_account_type_check" CHECK (("account_type" = ANY (ARRAY['asset'::"text", 'liability'::"text", 'equity'::"text", 'revenue'::"text", 'expense'::"text"])))
);


ALTER TABLE "public"."chart_of_accounts" OWNER TO "postgres";


COMMENT ON TABLE "public"."chart_of_accounts" IS 'Plan comptable complet avec soldes en temps réel';



CREATE TABLE IF NOT EXISTS "public"."chart_of_accounts_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "country_code" "text" NOT NULL,
    "account_number" "text" NOT NULL,
    "account_name" "text" NOT NULL,
    "account_type" "text" NOT NULL,
    "class" integer NOT NULL,
    "parent_account_number" "text",
    "level" integer NOT NULL,
    "is_detail_account" boolean DEFAULT true,
    "description" "text",
    "budget_category_mapping" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chart_of_accounts_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."chart_of_accounts_templates" IS 'Référentiel des plans comptables standards par pays - SYSCOHADA, Ghana, Nigeria, US GAAP, UK GAAP';



CREATE TABLE IF NOT EXISTS "public"."crm_clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "account_manager_id" "uuid",
    "converted_from_lead_id" "uuid",
    "name" "text" NOT NULL,
    "type" "text" DEFAULT 'company'::"text",
    "status" "text" DEFAULT 'active'::"text",
    "primary_contact_name" "text",
    "primary_contact_email" "text",
    "primary_contact_phone" "text",
    "industry" "text",
    "company_size" "text",
    "annual_revenue" numeric(15,2),
    "website" "text",
    "billing_address" "jsonb" DEFAULT '{}'::"jsonb",
    "shipping_address" "jsonb" DEFAULT '{}'::"jsonb",
    "tier" "text" DEFAULT 'standard'::"text",
    "segment" "text",
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "total_value" numeric(15,2) DEFAULT 0.00,
    "lifetime_value" numeric(15,2) DEFAULT 0.00,
    "last_purchase_date" timestamp with time zone,
    "acquisition_cost" numeric(15,2) DEFAULT 0.00,
    "health_score" integer DEFAULT 50,
    "churn_risk" "text" DEFAULT 'low'::"text",
    "satisfaction_rating" numeric(3,2),
    "parent_client_id" "uuid",
    "is_key_account" boolean DEFAULT false,
    "preferred_payment_terms" "text" DEFAULT '30_days'::"text",
    "preferred_contact_method" "text" DEFAULT 'email'::"text",
    "special_terms" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."crm_clients" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."clients" AS
 SELECT "id",
    "company_id",
    "name",
    "type",
    "status",
    "primary_contact_name" AS "contact_name",
    "primary_contact_email" AS "email",
    "primary_contact_phone" AS "phone",
    "industry",
    "website",
    "total_value",
    "tier",
    "health_score",
    "created_at",
    "updated_at"
   FROM "public"."crm_clients";


ALTER VIEW "public"."clients" OWNER TO "postgres";


COMMENT ON VIEW "public"."clients" IS 'Vue sécurisée des clients CRM - SECURITY INVOKER avec triggers modifiables';



CREATE TABLE IF NOT EXISTS "public"."crm_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "opportunity_id" "uuid",
    "client_id" "uuid",
    "lead_id" "uuid",
    "contact_id" "uuid",
    "assigned_to" "uuid",
    "type" "text" NOT NULL,
    "category" "text",
    "subject" "text" NOT NULL,
    "description" "text",
    "due_date" timestamp with time zone,
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "all_day" boolean DEFAULT false,
    "status" "text" DEFAULT 'planned'::"text",
    "priority" "text" DEFAULT 'medium'::"text",
    "outcome" "text",
    "outcome_notes" "text",
    "next_action_required" boolean DEFAULT false,
    "next_action_date" timestamp with time zone,
    "direction" "text",
    "communication_channel" "text",
    "recording_url" "text",
    "duration_minutes" integer,
    "response_time_hours" numeric(8,2),
    "is_automated" boolean DEFAULT false,
    "trigger_event" "text",
    "template_used" "text",
    "external_id" "text",
    "external_source" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."crm_activities" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."commercial_actions" AS
 SELECT "id",
    "company_id",
    "subject" AS "title",
    "description",
    "type",
    "status",
    "due_date",
    "priority",
    "opportunity_id",
    "client_id",
    "lead_id",
    "assigned_to",
    "outcome",
    "created_at",
    "updated_at"
   FROM "public"."crm_activities";


ALTER VIEW "public"."commercial_actions" OWNER TO "postgres";


COMMENT ON VIEW "public"."commercial_actions" IS 'Vue sécurisée des actions commerciales - SECURITY INVOKER par défaut';



CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "country" "text" DEFAULT 'FR'::"text",
    "default_currency" "text" DEFAULT 'EUR'::"text",
    "default_locale" "text" DEFAULT 'fr-FR'::"text",
    "timezone" "text" DEFAULT 'Europe/Paris'::"text",
    "owner_id" "uuid",
    "legal_form" "text",
    "registration_number" "text",
    "tax_number" "text",
    "address" "text",
    "city" "text",
    "postal_code" "text",
    "phone" "text",
    "email" "text",
    "website" "text",
    "sector" "text",
    "is_active" boolean DEFAULT true,
    "active_modules" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "siret" "text",
    "siren" "text",
    "legal_name" "text",
    "normalized_name" "text",
    "business_key" "text",
    "country_code" "text" DEFAULT 'FR'::"text",
    "data_quality_score" integer DEFAULT 100,
    "status" "text" DEFAULT 'active'::"text",
    "merged_into_company_id" "uuid",
    "last_validation_date" timestamp with time zone,
    "share_capital" numeric(15,2),
    "ceo_name" "text",
    "ceo_title" "text" DEFAULT 'CEO'::"text",
    "industry_type" "text",
    "company_size" "text",
    "registration_date" "date",
    "fiscal_year_start" "text" DEFAULT '01-01'::"text",
    "created_by" "uuid",
    "is_personal" boolean DEFAULT false,
    "accounting_method" "text" DEFAULT 'accrual'::"text",
    "fiscal_year_type" "text" DEFAULT 'calendar'::"text",
    "fiscal_year_start_month" integer DEFAULT 1,
    "fiscal_year_start_day" integer DEFAULT 1,
    "activity_sector" "text",
    "employee_count" "text",
    "logo" "text",
    "vat_number" "text",
    "description" "text",
    CONSTRAINT "companies_ceo_title_valid" CHECK ((("ceo_title" = ANY (ARRAY['CEO'::"text", 'Président'::"text", 'Directeur Général'::"text", 'Gérant'::"text", 'Fondateur'::"text", 'PDG'::"text"])) OR ("ceo_title" IS NULL))),
    CONSTRAINT "companies_company_size_valid" CHECK ((("company_size" = ANY (ARRAY['startup'::"text", 'small'::"text", 'medium'::"text", 'large'::"text", 'enterprise'::"text"])) OR ("company_size" IS NULL))),
    CONSTRAINT "companies_quality_score_check" CHECK ((("data_quality_score" >= 0) AND ("data_quality_score" <= 100))),
    CONSTRAINT "companies_share_capital_positive" CHECK ((("share_capital" IS NULL) OR ("share_capital" >= (0)::numeric))),
    CONSTRAINT "companies_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'merged'::"text", 'duplicate'::"text", 'pending_validation'::"text"]))),
    CONSTRAINT "companies_timezone_valid" CHECK ((("timezone" ~ '^[A-Za-z_]+/[A-Za-z_]+$'::"text") OR ("timezone" IS NULL)))
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


COMMENT ON TABLE "public"."companies" IS 'Table des entreprises avec gestion multi-utilisateur';



COMMENT ON COLUMN "public"."companies"."timezone" IS 'Fuseau horaire entreprise (format: Continent/Ville) - CompanyProfile.timezone';



COMMENT ON COLUMN "public"."companies"."owner_id" IS 'Propriétaire principal de l''entreprise (nullable pour flexibilité)';



COMMENT ON COLUMN "public"."companies"."sector" IS 'Secteur d''activité - CompanyProfile.sector';



COMMENT ON COLUMN "public"."companies"."share_capital" IS 'Capital social en euros - CompanyProfile.shareCapital';



COMMENT ON COLUMN "public"."companies"."ceo_name" IS 'Nom du dirigeant principal - CompanyProfile.ceoName';



COMMENT ON COLUMN "public"."companies"."ceo_title" IS 'Titre du dirigeant (CEO, PDG, etc.) - CompanyProfile.ceoTitle';



COMMENT ON COLUMN "public"."companies"."industry_type" IS 'Type d''industrie - CompanyProfile.industryType';



COMMENT ON COLUMN "public"."companies"."company_size" IS 'Taille entreprise (startup, small, medium, large, enterprise) - CompanyProfile.companySize';



COMMENT ON COLUMN "public"."companies"."registration_date" IS 'Date d''immatriculation - CompanyProfile.registrationDate';



COMMENT ON COLUMN "public"."companies"."created_by" IS 'Utilisateur qui a créé l''entreprise (généralement = owner_id)';



COMMENT ON COLUMN "public"."companies"."accounting_method" IS 'Méthode comptable: accrual (engagement) ou cash (trésorerie)';



COMMENT ON COLUMN "public"."companies"."vat_number" IS 'Numéro de TVA intracommunautaire';



COMMENT ON COLUMN "public"."companies"."description" IS 'Description de l''activité de l''entreprise';



CREATE TABLE IF NOT EXISTS "public"."company_deletion_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"(),
    "required_approvals" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "received_approvals" "jsonb" DEFAULT '[]'::"jsonb",
    "scheduled_deletion_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval) NOT NULL,
    "export_requested" boolean DEFAULT true,
    "export_generated_at" timestamp with time zone,
    "export_download_url" "text",
    "legal_archive_created" boolean DEFAULT false,
    "legal_archive_location" "text",
    "status" "text" DEFAULT 'pending_approval'::"text",
    "processed_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "cancellation_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "company_deletion_requests_status_check" CHECK (("status" = ANY (ARRAY['pending_approval'::"text", 'approved'::"text", 'processing'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."company_deletion_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."company_deletion_requests" IS 'Demandes de suppression d''entreprise avec consensus';



CREATE TABLE IF NOT EXISTS "public"."company_duplicates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "primary_company_id" "uuid" NOT NULL,
    "duplicate_company_id" "uuid" NOT NULL,
    "similarity_score" numeric(5,2) DEFAULT 0 NOT NULL,
    "detection_method" "text" DEFAULT 'manual'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "resolved_by" "uuid",
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "company_duplicates_detection_method_check" CHECK (("detection_method" = ANY (ARRAY['exact_match'::"text", 'phonetic'::"text", 'fuzzy'::"text", 'manual'::"text", 'ai_analysis'::"text"]))),
    CONSTRAINT "company_duplicates_similarity_score_check" CHECK ((("similarity_score" >= (0)::numeric) AND ("similarity_score" <= (100)::numeric))),
    CONSTRAINT "company_duplicates_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed_duplicate'::"text", 'false_positive'::"text", 'merged'::"text", 'ignored'::"text"])))
);


ALTER TABLE "public"."company_duplicates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_features" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "feature_name" "text" NOT NULL,
    "feature_category" "text" DEFAULT 'general'::"text",
    "is_enabled" boolean DEFAULT false,
    "configuration" "jsonb" DEFAULT '{}'::"jsonb",
    "usage_limit" integer,
    "current_usage" integer DEFAULT 0,
    "reset_period" "text" DEFAULT 'monthly'::"text",
    "last_reset_date" timestamp with time zone DEFAULT "now"(),
    "license_tier" "text" DEFAULT 'free'::"text",
    "expires_at" timestamp with time zone,
    "auto_renew" boolean DEFAULT true,
    "required_features" "text"[] DEFAULT '{}'::"text"[],
    "conflicting_features" "text"[] DEFAULT '{}'::"text"[],
    "minimum_plan" "text" DEFAULT 'free'::"text",
    "enabled_at" timestamp with time zone,
    "enabled_by" "uuid",
    "disabled_at" timestamp with time zone,
    "disabled_by" "uuid",
    "disable_reason" "text",
    "last_modified_by" "uuid",
    "modification_history" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "company_features_check" CHECK ((("enabled_at" IS NULL) OR ("disabled_at" IS NULL) OR ("disabled_at" > "enabled_at"))),
    CONSTRAINT "company_features_current_usage_check" CHECK (("current_usage" >= 0)),
    CONSTRAINT "company_features_expires_at_check" CHECK ((("expires_at" IS NULL) OR ("expires_at" > "now"()))),
    CONSTRAINT "company_features_feature_category_check" CHECK (("feature_category" = ANY (ARRAY['analytics'::"text", 'enterprise'::"text", 'integration'::"text", 'reporting'::"text", 'security'::"text", 'compliance'::"text", 'data'::"text", 'mobile'::"text", 'general'::"text"]))),
    CONSTRAINT "company_features_license_tier_check" CHECK (("license_tier" = ANY (ARRAY['free'::"text", 'basic'::"text", 'premium'::"text", 'enterprise'::"text"]))),
    CONSTRAINT "company_features_minimum_plan_check" CHECK (("minimum_plan" = ANY (ARRAY['free'::"text", 'basic'::"text", 'premium'::"text", 'enterprise'::"text"]))),
    CONSTRAINT "company_features_reset_period_check" CHECK (("reset_period" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'monthly'::"text", 'yearly'::"text", 'never'::"text"]))),
    CONSTRAINT "company_features_usage_limit_check" CHECK ((("usage_limit" IS NULL) OR ("usage_limit" > 0)))
);


ALTER TABLE "public"."company_features" OWNER TO "postgres";


COMMENT ON TABLE "public"."company_features" IS 'Features activées par entreprise - Système complet identifié dans audit FeaturesStep';



COMMENT ON COLUMN "public"."company_features"."feature_name" IS 'Nom technique de la feature';



COMMENT ON COLUMN "public"."company_features"."configuration" IS 'Configuration JSON spécifique à l''entreprise';



COMMENT ON COLUMN "public"."company_features"."current_usage" IS 'Usage actuel de la feature (pour quotas)';



COMMENT ON COLUMN "public"."company_features"."modification_history" IS 'Historique JSON des modifications pour audit';



CREATE TABLE IF NOT EXISTS "public"."company_fiscal_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "country_code" "text" NOT NULL,
    "accounting_standard" "text" NOT NULL,
    "fiscal_year_end" "text" DEFAULT '31/12'::"text" NOT NULL,
    "default_currency" "text" NOT NULL,
    "vat_standard_rate" numeric(5,2) DEFAULT 0 NOT NULL,
    "vat_reduced_rate" numeric(5,2) DEFAULT 0,
    "vat_zero_rate" numeric(5,2) DEFAULT 0,
    "vat_exempt_available" boolean DEFAULT false,
    "vat_collected_account" "text",
    "vat_deductible_account" "text",
    "corporate_tax_account" "text",
    "payroll_tax_account" "text",
    "social_contributions_account" "text",
    "monthly_vat_return" boolean DEFAULT false,
    "quarterly_tax_return" boolean DEFAULT false,
    "annual_financial_statements" boolean DEFAULT true,
    "audit_required" boolean DEFAULT false,
    "minimum_capital" numeric(15,2),
    "income_tax_rate" numeric(5,2) DEFAULT 0,
    "social_security_rate" numeric(5,2) DEFAULT 0,
    "employer_contribution_rate" numeric(5,2) DEFAULT 0,
    "pension_rate" numeric(5,2) DEFAULT 0,
    "building_depreciation_rate" numeric(5,2) DEFAULT 4,
    "equipment_depreciation_rate" numeric(5,2) DEFAULT 10,
    "vehicle_depreciation_rate" numeric(5,2) DEFAULT 20,
    "software_depreciation_rate" numeric(5,2) DEFAULT 33.33,
    "custom_tax_rules" "jsonb" DEFAULT '{}'::"jsonb",
    "regional_tax_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "configuration_date" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "company_fiscal_settings_accounting_standard_check" CHECK (("accounting_standard" = ANY (ARRAY['PCG'::"text", 'SYSCOHADA'::"text", 'IFRS'::"text", 'US_GAAP'::"text"])))
);


ALTER TABLE "public"."company_fiscal_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "invited_by" "uuid" NOT NULL,
    "invited_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "invitation_token" "uuid" DEFAULT "gen_random_uuid"(),
    "status" "text" DEFAULT 'pending'::"text",
    "accepted_at" timestamp with time zone,
    "rejected_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "company_invitations_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'accountant'::"text", 'user'::"text", 'readonly'::"text"]))),
    CONSTRAINT "company_invitations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."company_invitations" OWNER TO "postgres";


COMMENT ON TABLE "public"."company_invitations" IS 'Invitations pour rejoindre une entreprise';



CREATE TABLE IF NOT EXISTS "public"."company_merges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "master_company_id" "uuid" NOT NULL,
    "merged_company_id" "uuid" NOT NULL,
    "merge_reason" "text" DEFAULT 'Duplicate merge'::"text" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "executed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "company_merges_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'executed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."company_merges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_modules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "module_key" "text" NOT NULL,
    "module_name" "text" NOT NULL,
    "is_enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "module_priority" integer DEFAULT 0,
    "custom_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "access_level" "text" DEFAULT 'standard'::"text",
    "license_type" "text" DEFAULT 'basic'::"text",
    "expires_at" timestamp with time zone,
    "user_limit" integer,
    "storage_quota_gb" integer DEFAULT 10,
    "display_order" integer DEFAULT 0,
    "custom_name" "text",
    "custom_description" "text",
    "custom_color" "text",
    "custom_icon" "text",
    "is_visible" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "activated_by" "uuid",
    "activated_at" timestamp with time zone,
    "last_used_at" timestamp with time zone,
    "usage_count" integer DEFAULT 0,
    CONSTRAINT "company_modules_access_level_check" CHECK (("access_level" = ANY (ARRAY['basic'::"text", 'standard'::"text", 'advanced'::"text", 'expert'::"text"]))),
    CONSTRAINT "company_modules_license_type_check" CHECK (("license_type" = ANY (ARRAY['free'::"text", 'basic'::"text", 'premium'::"text", 'enterprise'::"text"]))),
    CONSTRAINT "company_modules_module_priority_check" CHECK ((("module_priority" >= 0) AND ("module_priority" <= 100))),
    CONSTRAINT "company_modules_storage_quota_gb_check" CHECK (("storage_quota_gb" > 0)),
    CONSTRAINT "company_modules_usage_count_check" CHECK (("usage_count" >= 0)),
    CONSTRAINT "company_modules_user_limit_check" CHECK ((("user_limit" IS NULL) OR ("user_limit" > 0)))
);


ALTER TABLE "public"."company_modules" OWNER TO "postgres";


COMMENT ON COLUMN "public"."company_modules"."module_priority" IS 'Priorité d''affichage (0-100, plus élevé = plus prioritaire)';



COMMENT ON COLUMN "public"."company_modules"."custom_settings" IS 'Configuration JSON personnalisée pour ce module';



COMMENT ON COLUMN "public"."company_modules"."access_level" IS 'Niveau d''accès : basic, standard, advanced, expert';



COMMENT ON COLUMN "public"."company_modules"."license_type" IS 'Type de licence : free, basic, premium, enterprise';



COMMENT ON COLUMN "public"."company_modules"."user_limit" IS 'Nombre maximum d''utilisateurs autorisés sur ce module';



COMMENT ON COLUMN "public"."company_modules"."storage_quota_gb" IS 'Quota de stockage alloué en Go';



CREATE TABLE IF NOT EXISTS "public"."company_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "company_name" "text" NOT NULL,
    "default_currency" "text" DEFAULT 'EUR'::"text" NOT NULL,
    "fiscal_year_start" integer DEFAULT 1,
    "business_type" "text" DEFAULT 'services'::"text",
    "timezone" "text" DEFAULT 'Europe/Paris'::"text",
    "date_format" "text" DEFAULT 'DD/MM/YYYY'::"text",
    "number_format" "jsonb" DEFAULT '{"decimal": ",", "precision": 2, "thousands": " "}'::"jsonb",
    "address" "jsonb" DEFAULT '{}'::"jsonb",
    "contact_info" "jsonb" DEFAULT '{}'::"jsonb",
    "business_hours" "jsonb" DEFAULT '{"monday": {"end": "18:00", "start": "09:00", "enabled": true}}'::"jsonb",
    "company_logo_url" "text",
    "website_url" "text",
    "tax_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid",
    CONSTRAINT "company_settings_business_type_check" CHECK (("business_type" = ANY (ARRAY['services'::"text", 'retail'::"text", 'manufacturing'::"text", 'technology'::"text", 'consulting'::"text", 'healthcare'::"text"]))),
    CONSTRAINT "company_settings_fiscal_year_start_check" CHECK ((("fiscal_year_start" >= 1) AND ("fiscal_year_start" <= 12)))
);


ALTER TABLE "public"."company_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_sizes_catalog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "size_code" "text" NOT NULL,
    "size_name" "text" NOT NULL,
    "size_name_english" "text",
    "employee_min" integer,
    "employee_max" integer,
    "revenue_min_eur" numeric(15,2),
    "revenue_max_eur" numeric(15,2),
    "category" "text" NOT NULL,
    "eu_classification" boolean DEFAULT false,
    "default_modules" "text"[],
    "recommended_plan" "text",
    "storage_quota_gb" integer DEFAULT 10,
    "user_limit" integer,
    "description" "text",
    "criteria_description" "text",
    "examples" "text"[],
    "is_active" boolean DEFAULT true,
    "priority_order" integer DEFAULT 100,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."company_sizes_catalog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "left_at" timestamp with time zone,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "is_owner" boolean DEFAULT false,
    "is_admin" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "company_users_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'suspended'::"text", 'pending_approval'::"text", 'terminated'::"text"])))
);


ALTER TABLE "public"."company_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compliance_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "report_type" "text" NOT NULL,
    "report_name" "text" NOT NULL,
    "company_id" "uuid",
    "generated_by" "uuid" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "report_data" "jsonb" NOT NULL,
    "executive_summary" "text",
    "findings" "text"[],
    "recommendations" "text"[],
    "total_records_analyzed" bigint,
    "issues_found" integer DEFAULT 0,
    "critical_issues" integer DEFAULT 0,
    "status" "text" DEFAULT 'draft'::"text",
    "version" integer DEFAULT 1,
    "recipients" "text"[],
    "shared_externally" boolean DEFAULT false,
    "generated_at" timestamp with time zone DEFAULT "now"(),
    "approved_at" timestamp with time zone,
    "approved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."compliance_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."configuration_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text" DEFAULT 'Cog'::"text",
    "parent_id" "uuid",
    "sort_order" integer DEFAULT 0,
    "is_system" boolean DEFAULT false,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."configuration_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "supplier_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "job_title" "text",
    "department" "text",
    "email" "text",
    "phone" "text",
    "mobile" "text",
    "is_primary" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "contact_belongs_to_one_party" CHECK (((("customer_id" IS NOT NULL) AND ("supplier_id" IS NULL)) OR (("customer_id" IS NULL) AND ("supplier_id" IS NOT NULL))))
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "alert_type" "text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text",
    "severity" "text" DEFAULT 'info'::"text",
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "description" "text",
    "trigger_date" timestamp with time zone DEFAULT "now"(),
    "due_date" "date",
    "resolved_date" timestamp with time zone,
    "status" "text" DEFAULT 'active'::"text",
    "auto_generated" boolean DEFAULT true,
    "action_required" boolean DEFAULT false,
    "action_description" "text",
    "assigned_to" "uuid",
    "recurrence_rule" "text",
    "snooze_until" timestamp with time zone,
    "max_occurrences" integer,
    "occurrence_count" integer DEFAULT 0,
    "email_sent" boolean DEFAULT false,
    "sms_sent" boolean DEFAULT false,
    "in_app_sent" boolean DEFAULT false,
    "slack_sent" boolean DEFAULT false,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "related_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "acknowledged_by" "uuid",
    "resolved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "contract_alerts_alert_type_check" CHECK (("alert_type" = ANY (ARRAY['expiry'::"text", 'renewal'::"text", 'milestone'::"text", 'payment'::"text", 'review'::"text", 'compliance'::"text", 'approval'::"text", 'signature'::"text"]))),
    CONSTRAINT "contract_alerts_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "contract_alerts_severity_check" CHECK (("severity" = ANY (ARRAY['info'::"text", 'warning'::"text", 'error'::"text", 'critical'::"text"]))),
    CONSTRAINT "contract_alerts_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'acknowledged'::"text", 'resolved'::"text", 'dismissed'::"text", 'snoozed'::"text"])))
);


ALTER TABLE "public"."contract_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_amendments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "amendment_number" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "amendment_type" "text" NOT NULL,
    "reason" "text",
    "amendment_date" "date" DEFAULT CURRENT_DATE,
    "effective_date" "date" NOT NULL,
    "expiry_date" "date",
    "changes_summary" "text" NOT NULL,
    "old_values" "jsonb" DEFAULT '{}'::"jsonb",
    "new_values" "jsonb" DEFAULT '{}'::"jsonb",
    "value_change" numeric(15,2) DEFAULT 0,
    "currency" "text" DEFAULT 'EUR'::"text",
    "status" "text" DEFAULT 'draft'::"text",
    "approval_required" boolean DEFAULT true,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejection_reason" "text",
    "document_path" "text",
    "signed_document_path" "text",
    "client_signed" boolean DEFAULT false,
    "client_signature_date" timestamp with time zone,
    "company_signed" boolean DEFAULT false,
    "company_signature_date" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "contract_amendments_amendment_type_check" CHECK (("amendment_type" = ANY (ARRAY['extension'::"text", 'modification'::"text", 'termination'::"text", 'renewal'::"text", 'value_change'::"text", 'scope_change'::"text"]))),
    CONSTRAINT "contract_amendments_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'pending_approval'::"text", 'approved'::"text", 'rejected'::"text", 'executed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."contract_amendments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_id" "uuid",
    "amendment_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "approval_step" integer NOT NULL,
    "step_name" "text" NOT NULL,
    "approver_id" "uuid" NOT NULL,
    "approver_role" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "decision_date" timestamp with time zone,
    "comments" "text",
    "conditions" "text",
    "is_mandatory" boolean DEFAULT true,
    "can_delegate" boolean DEFAULT false,
    "delegated_to" "uuid",
    "approval_threshold" numeric(15,2),
    "business_rules" "jsonb" DEFAULT '{}'::"jsonb",
    "notified_at" timestamp with time zone,
    "reminder_sent_at" timestamp with time zone,
    "escalated_at" timestamp with time zone,
    "escalated_to" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_approval_target" CHECK (((("contract_id" IS NOT NULL) AND ("amendment_id" IS NULL)) OR (("contract_id" IS NULL) AND ("amendment_id" IS NOT NULL)))),
    CONSTRAINT "contract_approvals_approval_step_check" CHECK (("approval_step" > 0)),
    CONSTRAINT "contract_approvals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'skipped'::"text", 'delegated'::"text"])))
);


ALTER TABLE "public"."contract_approvals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_billing" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "invoice_number" "text",
    "billing_reference" "text" NOT NULL,
    "billing_period_start" "date" NOT NULL,
    "billing_period_end" "date" NOT NULL,
    "base_amount" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "adjustments" numeric(15,2) DEFAULT 0.00,
    "penalties" numeric(15,2) DEFAULT 0.00,
    "bonuses" numeric(15,2) DEFAULT 0.00,
    "total_amount" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "billing_frequency" "text" DEFAULT 'monthly'::"text",
    "billing_type" "text" NOT NULL,
    "billing_currency" "text" DEFAULT 'EUR'::"text",
    "billing_details" "jsonb" DEFAULT '{}'::"jsonb",
    "calculation_method" "text",
    "usage_data" "jsonb" DEFAULT '{}'::"jsonb",
    "milestone_achieved" boolean DEFAULT false,
    "billing_status" "text" DEFAULT 'draft'::"text",
    "invoice_date" "date",
    "due_date" "date",
    "paid_date" "date",
    "paid_amount" numeric(15,2) DEFAULT 0.00,
    "is_recurring" boolean DEFAULT false,
    "next_billing_date" "date",
    "auto_generate" boolean DEFAULT false,
    "billing_template_id" "uuid",
    "rfa_applicable" boolean DEFAULT false,
    "rfa_amount" numeric(15,2) DEFAULT 0.00,
    "rfa_calculation_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."contract_billing" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_clauses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "clause_type" "text" NOT NULL,
    "clause_category" "text",
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "order_position" integer DEFAULT 0,
    "is_mandatory" boolean DEFAULT false,
    "is_negotiable" boolean DEFAULT true,
    "risk_level" "text" DEFAULT 'low'::"text",
    "original_content" "text",
    "negotiated_content" "text",
    "negotiation_status" "text" DEFAULT 'not_started'::"text",
    "conditions" "jsonb" DEFAULT '{}'::"jsonb",
    "legal_references" "text"[],
    "legal_approved" boolean DEFAULT false,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "contract_clauses_clause_type_check" CHECK (("clause_type" = ANY (ARRAY['payment'::"text", 'delivery'::"text", 'warranty'::"text", 'liability'::"text", 'termination'::"text", 'confidentiality'::"text", 'sla'::"text", 'penalty'::"text", 'intellectual_property'::"text"]))),
    CONSTRAINT "contract_clauses_negotiation_status_check" CHECK (("negotiation_status" = ANY (ARRAY['not_started'::"text", 'in_progress'::"text", 'agreed'::"text", 'disputed'::"text", 'final'::"text"]))),
    CONSTRAINT "contract_clauses_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"])))
);


ALTER TABLE "public"."contract_clauses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "document_type" "text" NOT NULL,
    "document_category" "text",
    "document_name" "text" NOT NULL,
    "document_number" "text",
    "version" "text" DEFAULT '1.0'::"text",
    "description" "text",
    "file_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size" integer,
    "mime_type" "text",
    "file_hash" "text",
    "document_date" "date" DEFAULT CURRENT_DATE,
    "expiry_date" "date",
    "last_modified" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'active'::"text",
    "is_signed" boolean DEFAULT false,
    "requires_signature" boolean DEFAULT false,
    "signature_status" "text" DEFAULT 'not_required'::"text",
    "is_confidential" boolean DEFAULT false,
    "access_level" "text" DEFAULT 'standard'::"text",
    "encryption_required" boolean DEFAULT false,
    "tags" "text"[],
    "keywords" "text"[],
    "language" "text" DEFAULT 'fr'::"text",
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "contract_documents_access_level_check" CHECK (("access_level" = ANY (ARRAY['public'::"text", 'standard'::"text", 'confidential'::"text", 'restricted'::"text"]))),
    CONSTRAINT "contract_documents_document_type_check" CHECK (("document_type" = ANY (ARRAY['main_contract'::"text", 'amendment'::"text", 'annex'::"text", 'certificate'::"text", 'proof'::"text", 'correspondence'::"text", 'invoice'::"text", 'receipt'::"text"]))),
    CONSTRAINT "contract_documents_file_size_check" CHECK (("file_size" >= 0)),
    CONSTRAINT "contract_documents_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'archived'::"text", 'superseded'::"text", 'invalid'::"text"])))
);


ALTER TABLE "public"."contract_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_kpi_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "kpi_name" "text" NOT NULL,
    "kpi_type" "text" NOT NULL,
    "kpi_category" "text",
    "measurement_period" "text" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "target_value" numeric(15,3),
    "actual_value" numeric(15,3),
    "unit" "text",
    "performance_percentage" numeric(5,2) GENERATED ALWAYS AS (
CASE
    WHEN ("target_value" > (0)::numeric) THEN (("actual_value" / "target_value") * (100)::numeric)
    ELSE NULL::numeric
END) STORED,
    "status" "text" DEFAULT 'on_track'::"text",
    "warning_threshold" numeric(15,3),
    "critical_threshold" numeric(15,3),
    "bonus_threshold" numeric(15,3),
    "impact_description" "text",
    "corrective_actions" "text"[],
    "responsible_party" "uuid",
    "verified" boolean DEFAULT false,
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "measured_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "contract_kpi_tracking_actual_value_check" CHECK (("actual_value" >= (0)::numeric)),
    CONSTRAINT "contract_kpi_tracking_kpi_type_check" CHECK (("kpi_type" = ANY (ARRAY['financial'::"text", 'operational'::"text", 'quality'::"text", 'time'::"text", 'satisfaction'::"text", 'compliance'::"text"]))),
    CONSTRAINT "contract_kpi_tracking_status_check" CHECK (("status" = ANY (ARRAY['on_track'::"text", 'at_risk'::"text", 'behind'::"text", 'exceeding'::"text", 'not_measured'::"text"])))
);


ALTER TABLE "public"."contract_kpi_tracking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_kpis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "measurement_period_start" "date" NOT NULL,
    "measurement_period_end" "date" NOT NULL,
    "measurement_type" "text" DEFAULT 'monthly'::"text",
    "revenue_generated" numeric(15,2) DEFAULT 0.00,
    "costs_incurred" numeric(15,2) DEFAULT 0.00,
    "profit_margin" numeric(5,2) DEFAULT 0.00,
    "profitability_score" numeric(3,2) DEFAULT 0.00,
    "sla_compliance_rate" numeric(5,2) DEFAULT 0.00,
    "quality_score" numeric(3,2) DEFAULT 0.00,
    "customer_satisfaction" numeric(3,2) DEFAULT 0.00,
    "delivery_performance" numeric(5,2) DEFAULT 0.00,
    "milestones_completed" integer DEFAULT 0,
    "milestones_total" integer DEFAULT 0,
    "completion_rate" numeric(5,2) DEFAULT 0.00,
    "average_response_time_hours" numeric(8,2) DEFAULT 0.00,
    "risk_incidents" integer DEFAULT 0,
    "penalties_applied" numeric(15,2) DEFAULT 0.00,
    "contract_amendments" integer DEFAULT 0,
    "escalations" integer DEFAULT 0,
    "overall_performance_score" numeric(3,2) DEFAULT 0.00,
    "contract_health_status" "text" DEFAULT 'healthy'::"text",
    "trend" "text" DEFAULT 'stable'::"text",
    "detailed_metrics" "jsonb" DEFAULT '{}'::"jsonb",
    "benchmarks" "jsonb" DEFAULT '{}'::"jsonb",
    "targets" "jsonb" DEFAULT '{}'::"jsonb",
    "alert_thresholds" "jsonb" DEFAULT '{}'::"jsonb",
    "alerts_triggered" integer DEFAULT 0,
    "performance_notes" "text",
    "recommendations" "text",
    "action_items" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."contract_kpis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_milestones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "milestone_name" "text" NOT NULL,
    "description" "text",
    "milestone_type" "text" DEFAULT 'delivery'::"text",
    "planned_date" "date" NOT NULL,
    "actual_date" "date",
    "deadline_date" "date",
    "status" "text" DEFAULT 'pending'::"text",
    "completion_percentage" integer DEFAULT 0,
    "milestone_value" numeric(15,2),
    "currency" "text" DEFAULT 'EUR'::"text",
    "invoice_required" boolean DEFAULT false,
    "invoiced" boolean DEFAULT false,
    "deliverables" "text"[],
    "acceptance_criteria" "text"[],
    "quality_requirements" "text",
    "responsible_party_id" "uuid",
    "external_contact" "text",
    "requires_approval" boolean DEFAULT false,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "contract_milestones_completion_percentage_check" CHECK ((("completion_percentage" >= 0) AND ("completion_percentage" <= 100))),
    CONSTRAINT "contract_milestones_milestone_type_check" CHECK (("milestone_type" = ANY (ARRAY['delivery'::"text", 'payment'::"text", 'review'::"text", 'approval'::"text", 'renewal'::"text", 'termination'::"text"]))),
    CONSTRAINT "contract_milestones_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'delayed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."contract_milestones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_parties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "party_type" "text" NOT NULL,
    "party_role" "text",
    "customer_id" "uuid",
    "supplier_id" "uuid",
    "employee_id" "uuid",
    "party_name" "text",
    "legal_entity_name" "text",
    "contact_person" "text",
    "email" "text",
    "phone" "text",
    "address" "text",
    "signing_required" boolean DEFAULT true,
    "signed" boolean DEFAULT false,
    "signature_date" timestamp with time zone,
    "signature_method" "text" DEFAULT 'physical'::"text",
    "responsibilities" "text"[],
    "obligations" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "contract_parties_party_type_check" CHECK (("party_type" = ANY (ARRAY['client'::"text", 'supplier'::"text", 'partner'::"text", 'guarantor'::"text", 'witness'::"text", 'internal'::"text"]))),
    CONSTRAINT "contract_parties_signature_method_check" CHECK (("signature_method" = ANY (ARRAY['physical'::"text", 'electronic'::"text", 'digital'::"text"])))
);


ALTER TABLE "public"."contract_parties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_renewals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "renewal_type" "text" DEFAULT 'automatic'::"text" NOT NULL,
    "original_end_date" "date" NOT NULL,
    "new_end_date" "date" NOT NULL,
    "renewal_period_months" integer DEFAULT 12,
    "auto_renewal_enabled" boolean DEFAULT true,
    "renewal_notice_days" integer DEFAULT 30,
    "renewal_conditions" "jsonb" DEFAULT '{}'::"jsonb",
    "contract_value_change" numeric(15,2) DEFAULT 0.00,
    "new_contract_value" numeric(15,2),
    "terms_changes" "text",
    "amendment_required" boolean DEFAULT false,
    "status" "text" DEFAULT 'pending'::"text",
    "approved_by" "uuid",
    "approved_date" timestamp with time zone,
    "notification_sent" boolean DEFAULT false,
    "notification_sent_date" timestamp with time zone,
    "reminder_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."contract_renewals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "version" "text" DEFAULT '1.0'::"text",
    "description" "text",
    "contract_type_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "template_content" "text" NOT NULL,
    "variables" "jsonb" DEFAULT '{}'::"jsonb",
    "clauses" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "is_default" boolean DEFAULT false,
    "language" "text" DEFAULT 'fr'::"text",
    "legal_approved" boolean DEFAULT false,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contract_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_terminations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "termination_type" "text" NOT NULL,
    "termination_reason" "text" NOT NULL,
    "termination_date" "date" NOT NULL,
    "effective_date" "date",
    "notice_period_days" integer DEFAULT 30,
    "notice_given_date" "date",
    "early_termination" boolean DEFAULT false,
    "penalty_applicable" boolean DEFAULT false,
    "penalty_amount" numeric(15,2) DEFAULT 0.00,
    "termination_letter_path" "text",
    "supporting_documents" "jsonb" DEFAULT '[]'::"jsonb",
    "legal_review_required" boolean DEFAULT false,
    "legal_review_status" "text" DEFAULT 'not_required'::"text",
    "outstanding_obligations" "jsonb" DEFAULT '{}'::"jsonb",
    "final_payment_due" numeric(15,2) DEFAULT 0.00,
    "refund_due" numeric(15,2) DEFAULT 0.00,
    "settlement_terms" "text",
    "initiated_by" "uuid",
    "approved_by" "uuid",
    "approved_date" timestamp with time zone,
    "status" "text" DEFAULT 'draft'::"text",
    "asset_return_required" boolean DEFAULT false,
    "asset_return_status" "text" DEFAULT 'not_applicable'::"text",
    "confidentiality_maintained" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."contract_terminations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "category" "text" DEFAULT 'commercial'::"text",
    "is_active" boolean DEFAULT true,
    "requires_approval" boolean DEFAULT true,
    "requires_legal_review" boolean DEFAULT false,
    "auto_renewal" boolean DEFAULT false,
    "default_template_id" "uuid",
    "mandatory_clauses" "text"[],
    "optional_clauses" "text"[],
    "default_duration_months" integer,
    "max_duration_months" integer,
    "min_duration_months" integer,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "contract_types_category_check" CHECK (("category" = ANY (ARRAY['commercial'::"text", 'legal'::"text", 'service'::"text", 'partnership'::"text", 'employment'::"text", 'supply'::"text", 'licensing'::"text"])))
);


ALTER TABLE "public"."contract_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contracts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_number" "text" NOT NULL,
    "contract_name" "text" NOT NULL,
    "description" "text",
    "contract_type_id" "uuid" NOT NULL,
    "template_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "supplier_id" "uuid",
    "internal_contact_id" "uuid",
    "creation_date" "date" DEFAULT CURRENT_DATE,
    "signature_date" "date",
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "notice_period_days" integer DEFAULT 30,
    "status" "text" DEFAULT 'draft'::"text",
    "approval_status" "text" DEFAULT 'pending'::"text",
    "priority" "text" DEFAULT 'medium'::"text",
    "contract_value" numeric(15,2),
    "currency" "text" DEFAULT 'EUR'::"text",
    "payment_terms" "text",
    "payment_frequency" "text" DEFAULT 'monthly'::"text",
    "has_rfa" boolean DEFAULT false,
    "rfa_calculation_type" "text" DEFAULT 'progressive'::"text",
    "rfa_base_percentage" numeric(5,2) DEFAULT 0,
    "rfa_tiers" "jsonb" DEFAULT '[]'::"jsonb",
    "auto_renewal" boolean DEFAULT false,
    "renewal_notice_days" integer DEFAULT 30,
    "renewal_terms" "text",
    "terms_and_conditions" "text",
    "special_clauses" "text"[],
    "deliverables" "text"[],
    "kpis" "jsonb" DEFAULT '{}'::"jsonb",
    "main_document_path" "text",
    "signed_document_path" "text",
    "electronic_signature" boolean DEFAULT false,
    "signature_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "approval_workflow" "jsonb" DEFAULT '[]'::"jsonb",
    "legal_review_required" boolean DEFAULT false,
    "legal_review_status" "text" DEFAULT 'not_required'::"text",
    "legal_review_by" "uuid",
    "legal_review_date" timestamp with time zone,
    "legal_review_notes" "text",
    "performance_score" numeric(3,2),
    "risk_level" "text" DEFAULT 'low'::"text",
    "profitability_rating" "text" DEFAULT 'medium'::"text",
    "alert_before_expiry_days" integer DEFAULT 90,
    "last_alert_sent" timestamp with time zone,
    "next_review_date" "date",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "contracts_approval_status_check" CHECK (("approval_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"]))),
    CONSTRAINT "contracts_contract_value_check" CHECK (("contract_value" >= (0)::numeric)),
    CONSTRAINT "contracts_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "contracts_rfa_calculation_type_check" CHECK (("rfa_calculation_type" = ANY (ARRAY['fixed_percent'::"text", 'fixed_amount'::"text", 'progressive'::"text"]))),
    CONSTRAINT "contracts_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "contracts_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'in_review'::"text", 'approved'::"text", 'signed'::"text", 'active'::"text", 'expired'::"text", 'terminated'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."contracts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cost_centers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "parent_id" "uuid",
    "budget_amount" numeric(15,2) DEFAULT 0,
    "actual_amount" numeric(15,2) DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cost_centers" OWNER TO "postgres";


COMMENT ON TABLE "public"."cost_centers" IS 'Centres de coûts analytiques';



CREATE TABLE IF NOT EXISTS "public"."countries_catalog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "name_english" "text",
    "name_native" "text",
    "currency_code" "text" NOT NULL,
    "currency_name" "text" NOT NULL,
    "currency_symbol" "text" NOT NULL,
    "currency_decimal_places" integer DEFAULT 2,
    "timezone" "text" NOT NULL,
    "fiscal_year_start" "text" DEFAULT '01-01'::"text",
    "accounting_standard" "text" NOT NULL,
    "accounting_standard_name" "text",
    "region" "text",
    "subregion" "text",
    "capital" "text",
    "population" bigint,
    "area_km2" numeric,
    "default_language" "text" DEFAULT 'fr'::"text",
    "date_format" "text" DEFAULT 'DD/MM/YYYY'::"text",
    "number_format" "text" DEFAULT 'FR'::"text",
    "is_active" boolean DEFAULT true,
    "is_supported" boolean DEFAULT true,
    "priority_order" integer DEFAULT 100,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."countries_catalog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "client_name" "text",
    "contact_id" "uuid",
    "contact_name" "text",
    "opportunity_id" "uuid",
    "opportunity_title" "text",
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'planned'::"text" NOT NULL,
    "due_date" timestamp with time zone,
    "completed_date" timestamp with time zone,
    "assigned_to" "text",
    "priority" "text" DEFAULT 'medium'::"text",
    "outcome" "text",
    "follow_up_required" boolean DEFAULT false,
    "follow_up_date" "date",
    "duration_minutes" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "crm_actions_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "crm_actions_status_check" CHECK (("status" = ANY (ARRAY['planned'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "crm_actions_type_check" CHECK (("type" = ANY (ARRAY['call'::"text", 'email'::"text", 'meeting'::"text", 'demo'::"text", 'proposal'::"text", 'follow_up'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."crm_actions" OWNER TO "postgres";


COMMENT ON TABLE "public"."crm_actions" IS 'Actions commerciales CRM avec RLS activé';



CREATE TABLE IF NOT EXISTS "public"."crm_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "opportunity_id" "uuid",
    "lead_id" "uuid",
    "activity_id" "uuid",
    "note_id" "uuid",
    "filename" "text" NOT NULL,
    "original_filename" "text" NOT NULL,
    "file_size_bytes" integer,
    "mime_type" "text",
    "file_extension" "text",
    "file_path" "text" NOT NULL,
    "storage_provider" "text" DEFAULT 'local'::"text",
    "document_type" "text",
    "is_confidential" boolean DEFAULT false,
    "version" integer DEFAULT 1,
    "parent_file_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."crm_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "type" "text" DEFAULT 'email'::"text",
    "status" "text" DEFAULT 'draft'::"text",
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "budget" numeric(15,2) DEFAULT 0.00,
    "cost" numeric(15,2) DEFAULT 0.00,
    "sent_count" integer DEFAULT 0,
    "delivered_count" integer DEFAULT 0,
    "opened_count" integer DEFAULT 0,
    "clicked_count" integer DEFAULT 0,
    "responded_count" integer DEFAULT 0,
    "leads_generated" integer DEFAULT 0,
    "opportunities_created" integer DEFAULT 0,
    "target_audience" "jsonb" DEFAULT '{}'::"jsonb",
    "message_template" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."crm_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "position" "text",
    "notes" "text",
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."crm_contacts" OWNER TO "postgres";


COMMENT ON TABLE "public"."crm_contacts" IS 'Contacts CRM avec RLS activé';



CREATE TABLE IF NOT EXISTS "public"."crm_entity_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."crm_entity_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "source_id" "uuid",
    "assigned_to" "uuid",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "job_title" "text",
    "company_name" "text",
    "company_website" "text",
    "company_size" "text",
    "industry" "text",
    "country" "text",
    "city" "text",
    "postal_code" "text",
    "address" "text",
    "lead_score" integer DEFAULT 0,
    "qualification_status" "text" DEFAULT 'new'::"text",
    "interest_level" "text" DEFAULT 'unknown'::"text",
    "budget_range" "text",
    "decision_timeframe" "text",
    "source_details" "jsonb" DEFAULT '{}'::"jsonb",
    "utm_data" "jsonb" DEFAULT '{}'::"jsonb",
    "initial_notes" "text",
    "status" "text" DEFAULT 'new'::"text",
    "converted_to_client_id" "uuid",
    "converted_to_opportunity_id" "uuid",
    "lost_reason" "text",
    "last_contact_date" timestamp with time zone,
    "last_contact_type" "text",
    "next_follow_up_date" timestamp with time zone,
    "contact_attempts" integer DEFAULT 0,
    "preferred_contact_method" "text" DEFAULT 'email'::"text",
    "communication_preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "opted_out" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."crm_leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "opportunity_id" "uuid",
    "lead_id" "uuid",
    "activity_id" "uuid",
    "title" "text",
    "content" "text" NOT NULL,
    "note_type" "text" DEFAULT 'general'::"text",
    "is_private" boolean DEFAULT false,
    "is_pinned" boolean DEFAULT false,
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "mentioned_users" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."crm_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_opportunities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "pipeline_id" "uuid" NOT NULL,
    "stage_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "lead_id" "uuid",
    "owner_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "value" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "probability" numeric(5,2) DEFAULT 50.00,
    "weighted_value" numeric(15,2) GENERATED ALWAYS AS ((("value" * "probability") / (100)::numeric)) STORED,
    "expected_close_date" "date",
    "actual_close_date" "date",
    "created_date" "date" DEFAULT CURRENT_DATE,
    "products_services" "jsonb" DEFAULT '[]'::"jsonb",
    "solution_category" "text",
    "competitors" "jsonb" DEFAULT '[]'::"jsonb",
    "decision_criteria" "jsonb" DEFAULT '[]'::"jsonb",
    "decision_makers" "jsonb" DEFAULT '[]'::"jsonb",
    "sales_process" "text" DEFAULT 'standard'::"text",
    "next_steps" "text",
    "obstacles" "text",
    "source" "text",
    "type" "text" DEFAULT 'new_business'::"text",
    "priority" "text" DEFAULT 'medium'::"text",
    "status" "text" DEFAULT 'open'::"text",
    "won_reason" "text",
    "lost_reason" "text",
    "lost_to_competitor" "text",
    "days_in_pipeline" integer DEFAULT 0,
    "stage_history" "jsonb" DEFAULT '[]'::"jsonb",
    "engagement_score" integer DEFAULT 0,
    "forecast_category" "text" DEFAULT 'pipeline'::"text",
    "recurring_revenue_monthly" numeric(15,2) DEFAULT 0.00,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."crm_opportunities" OWNER TO "postgres";


COMMENT ON TABLE "public"."crm_opportunities" IS 'Opportunités CRM avec RLS activé';



CREATE TABLE IF NOT EXISTS "public"."crm_pipelines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#3B82F6'::"text",
    "icon" "text" DEFAULT 'target'::"text",
    "is_default" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "stages_count" integer DEFAULT 0,
    "auto_progress_rules" "jsonb" DEFAULT '{}'::"jsonb",
    "probability_model" "text" DEFAULT 'linear'::"text",
    "deal_rotation" boolean DEFAULT false,
    "conversion_rate" numeric(5,2) DEFAULT 0.00,
    "average_deal_size" numeric(15,2) DEFAULT 0.00,
    "average_cycle_days" integer DEFAULT 0,
    "visibility" "text" DEFAULT 'company'::"text",
    "accessible_by" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."crm_pipelines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "category" "text",
    "description" "text",
    "attribution_model" "text" DEFAULT 'first_touch'::"text",
    "cost_per_lead" numeric(10,2) DEFAULT 0.00,
    "utm_source" "text",
    "utm_medium" "text",
    "utm_campaign" "text",
    "tracking_code" "text",
    "is_active" boolean DEFAULT true,
    "leads_generated" integer DEFAULT 0,
    "conversion_rate" numeric(5,2) DEFAULT 0.00,
    "cost_per_acquisition" numeric(10,2) DEFAULT 0.00,
    "roi" numeric(8,2) DEFAULT 0.00,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."crm_sources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_stages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pipeline_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#10B981'::"text",
    "stage_order" integer NOT NULL,
    "is_closed_won" boolean DEFAULT false,
    "is_closed_lost" boolean DEFAULT false,
    "default_probability" numeric(5,2) DEFAULT 50.00,
    "min_probability" numeric(5,2) DEFAULT 0.00,
    "max_probability" numeric(5,2) DEFAULT 100.00,
    "auto_actions" "jsonb" DEFAULT '[]'::"jsonb",
    "required_fields" "jsonb" DEFAULT '[]'::"jsonb",
    "validation_rules" "jsonb" DEFAULT '{}'::"jsonb",
    "conversion_rate" numeric(5,2) DEFAULT 0.00,
    "average_time_days" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."crm_stages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" DEFAULT '#3B82F6'::"text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."crm_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "assigned_to" "uuid",
    "created_by" "uuid",
    "opportunity_id" "uuid",
    "client_id" "uuid",
    "lead_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "task_type" "text" DEFAULT 'followup'::"text",
    "category" "text",
    "priority" "text" DEFAULT 'medium'::"text",
    "due_date" timestamp with time zone,
    "reminder_date" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text",
    "completion_percentage" integer DEFAULT 0,
    "completed_at" timestamp with time zone,
    "completion_notes" "text",
    "outcome" "text",
    "is_recurring" boolean DEFAULT false,
    "recurrence_pattern" "text",
    "recurrence_data" "jsonb" DEFAULT '{}'::"jsonb",
    "estimated_duration_minutes" integer,
    "actual_duration_minutes" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."crm_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."currencies_catalog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "currency_code" "text" NOT NULL,
    "currency_name" "text" NOT NULL,
    "currency_symbol" "text" NOT NULL,
    "currency_symbol_native" "text",
    "decimal_places" integer DEFAULT 2,
    "decimal_separator" "text" DEFAULT ','::"text",
    "thousands_separator" "text" DEFAULT ' '::"text",
    "country_codes" "text"[],
    "is_crypto" boolean DEFAULT false,
    "is_major" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "exchange_rate_source" "text",
    "last_rate_update" timestamp with time zone,
    "description" "text",
    "priority_order" integer DEFAULT 100,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."currencies_catalog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_number" "text" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "company_name" "text",
    "tax_number" "text",
    "registration_number" "text",
    "billing_address_line1" "text",
    "billing_address_line2" "text",
    "billing_city" "text",
    "billing_postal_code" "text",
    "billing_country" "text" DEFAULT 'FR'::"text",
    "shipping_address_line1" "text",
    "shipping_address_line2" "text",
    "shipping_city" "text",
    "shipping_postal_code" "text",
    "shipping_country" "text" DEFAULT 'FR'::"text",
    "customer_type" "text" DEFAULT 'individual'::"text",
    "payment_terms" integer DEFAULT 30,
    "credit_limit" numeric(15,2) DEFAULT 0,
    "discount_rate" numeric(5,2) DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "notes" "text",
    "tags" "text"[],
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "valid_credit_limit" CHECK (("credit_limit" >= (0)::numeric)),
    CONSTRAINT "valid_customer_type" CHECK (("customer_type" = ANY (ARRAY['individual'::"text", 'business'::"text"]))),
    CONSTRAINT "valid_discount_rate" CHECK ((("discount_rate" >= (0)::numeric) AND ("discount_rate" <= (100)::numeric))),
    CONSTRAINT "valid_payment_terms" CHECK (("payment_terms" > 0))
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."data_classification" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "column_name" "text",
    "record_id" "text",
    "classification_level" "text" NOT NULL,
    "data_category" "text" NOT NULL,
    "gdpr_category" "text",
    "retention_period" integer,
    "legal_basis" "text",
    "anonymization_rules" "jsonb" DEFAULT '{}'::"jsonb",
    "encryption_required" boolean DEFAULT false,
    "access_restrictions" "jsonb" DEFAULT '{}'::"jsonb",
    "data_residency" "text"[],
    "cross_border_transfer_allowed" boolean DEFAULT false,
    "classified_by" "uuid",
    "classified_at" timestamp with time zone DEFAULT "now"(),
    "last_reviewed_at" timestamp with time zone DEFAULT "now"(),
    "review_due_at" timestamp with time zone DEFAULT ("now"() + '1 year'::interval),
    "justification" "text",
    "related_policies" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."data_classification" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."data_governance_audit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "user_id" "uuid",
    "performed_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "data_governance_audit_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['company'::"text", 'user'::"text", 'merge'::"text", 'duplicate'::"text"])))
);


ALTER TABLE "public"."data_governance_audit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."data_retention_policies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "policy_name" "text" NOT NULL,
    "data_category" "text" NOT NULL,
    "retention_period_days" integer NOT NULL,
    "deletion_method" "text" DEFAULT 'soft_delete'::"text",
    "conditions" "jsonb" DEFAULT '{}'::"jsonb",
    "exceptions" "jsonb" DEFAULT '{}'::"jsonb",
    "compliance_requirements" "text"[] DEFAULT '{}'::"text"[],
    "is_active" boolean DEFAULT true,
    "last_executed" timestamp with time zone,
    "next_execution" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "data_retention_policies_deletion_method_check" CHECK (("deletion_method" = ANY (ARRAY['soft_delete'::"text", 'hard_delete'::"text", 'archive'::"text", 'anonymize'::"text"])))
);


ALTER TABLE "public"."data_retention_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "parent_department_id" "uuid",
    "department_level" integer DEFAULT 1,
    "manager_id" "uuid",
    "is_active" boolean DEFAULT true,
    "budget_allocated" numeric(15,2) DEFAULT 0,
    "location" "text",
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."departments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."disciplinary_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "issued_by" "uuid" NOT NULL,
    "hr_representative" "uuid",
    "company_id" "uuid" NOT NULL,
    "action_type" "text" NOT NULL,
    "severity_level" "text" DEFAULT 'low'::"text",
    "incident_date" "date" NOT NULL,
    "incident_description" "text" NOT NULL,
    "policy_violated" "text",
    "witness_statements" "text",
    "action_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "action_description" "text" NOT NULL,
    "suspension_start_date" "date",
    "suspension_end_date" "date",
    "is_paid_suspension" boolean DEFAULT false,
    "conditions_for_improvement" "text",
    "review_period_months" integer,
    "next_review_date" "date",
    "employee_acknowledgment_date" "date",
    "employee_response" "text",
    "employee_agrees" boolean,
    "status" "text" DEFAULT 'active'::"text",
    "appeal_date" "date",
    "appeal_outcome" "text",
    "affects_probation" boolean DEFAULT false,
    "affects_promotion_eligibility" boolean DEFAULT false,
    "retention_period_years" integer DEFAULT 2,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "disciplinary_actions_action_type_check" CHECK (("action_type" = ANY (ARRAY['verbal_warning'::"text", 'written_warning'::"text", 'final_warning'::"text", 'suspension'::"text", 'demotion'::"text", 'termination'::"text"]))),
    CONSTRAINT "disciplinary_actions_severity_level_check" CHECK (("severity_level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "disciplinary_actions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'appealed'::"text", 'overturned'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."disciplinary_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_benefits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "benefit_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "enrollment_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "effective_date" "date" NOT NULL,
    "end_date" "date",
    "custom_amount" numeric(15,2),
    "employee_contribution" numeric(15,2) DEFAULT 0,
    "usage_count" integer DEFAULT 0,
    "status" "text" DEFAULT 'active'::"text",
    "suspension_reason" "text",
    "beneficiaries" "jsonb" DEFAULT '[]'::"jsonb",
    "enrolled_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "employee_benefits_employee_contribution_check" CHECK (("employee_contribution" >= (0)::numeric)),
    CONSTRAINT "employee_benefits_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'suspended'::"text", 'cancelled'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."employee_benefits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_contracts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "position_id" "uuid" NOT NULL,
    "department_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "contract_number" "text" NOT NULL,
    "contract_type" "text" DEFAULT 'permanent'::"text" NOT NULL,
    "employment_status" "text" DEFAULT 'active'::"text",
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "probation_end_date" "date",
    "base_salary" numeric(15,2) NOT NULL,
    "salary_frequency" "text" DEFAULT 'monthly'::"text",
    "currency" "text" DEFAULT 'EUR'::"text",
    "working_hours_per_week" numeric(5,2) DEFAULT 35,
    "is_full_time" boolean DEFAULT true,
    "benefits_eligible" boolean DEFAULT true,
    "vacation_days_per_year" integer DEFAULT 25,
    "sick_days_per_year" integer DEFAULT 10,
    "is_current" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "employee_contracts_base_salary_check" CHECK (("base_salary" >= (0)::numeric)),
    CONSTRAINT "employee_contracts_contract_type_check" CHECK (("contract_type" = ANY (ARRAY['permanent'::"text", 'temporary'::"text", 'freelance'::"text", 'internship'::"text", 'consultant'::"text"]))),
    CONSTRAINT "employee_contracts_employment_status_check" CHECK (("employment_status" = ANY (ARRAY['active'::"text", 'terminated'::"text", 'suspended'::"text", 'on_leave'::"text", 'notice_period'::"text"]))),
    CONSTRAINT "employee_contracts_working_hours_per_week_check" CHECK (("working_hours_per_week" > (0)::numeric))
);


ALTER TABLE "public"."employee_contracts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "document_type" "text" NOT NULL,
    "document_name" "text" NOT NULL,
    "file_path" "text",
    "file_size" integer,
    "mime_type" "text",
    "issue_date" "date",
    "expiry_date" "date",
    "is_confidential" boolean DEFAULT true,
    "is_required" boolean DEFAULT false,
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "employee_documents_document_type_check" CHECK (("document_type" = ANY (ARRAY['contract'::"text", 'id_copy'::"text", 'diploma'::"text", 'certificate'::"text", 'performance_review'::"text", 'disciplinary'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."employee_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_surveys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "survey_type" "text" DEFAULT 'satisfaction'::"text",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "is_anonymous" boolean DEFAULT true,
    "is_mandatory" boolean DEFAULT false,
    "target_audience" "text" DEFAULT 'all'::"text",
    "target_departments" "text"[],
    "target_positions" "text"[],
    "target_employee_ids" "uuid"[],
    "questions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "total_invitations" integer DEFAULT 0,
    "total_responses" integer DEFAULT 0,
    "response_rate" numeric(5,2) GENERATED ALWAYS AS (
CASE
    WHEN ("total_invitations" > 0) THEN ((("total_responses")::numeric / ("total_invitations")::numeric) * (100)::numeric)
    ELSE (0)::numeric
END) STORED,
    "company_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "employee_surveys_check" CHECK (("end_date" >= "start_date")),
    CONSTRAINT "employee_surveys_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'closed'::"text", 'archived'::"text"]))),
    CONSTRAINT "employee_surveys_survey_type_check" CHECK (("survey_type" = ANY (ARRAY['satisfaction'::"text", 'engagement'::"text", 'exit'::"text", 'pulse'::"text", 'culture'::"text", '360_feedback'::"text"])))
);


ALTER TABLE "public"."employee_surveys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "employee_number" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "postal_code" "text",
    "country" "text" DEFAULT 'FR'::"text",
    "job_title" "text",
    "department" "text",
    "manager_id" "uuid",
    "hire_date" "date",
    "end_date" "date",
    "base_salary" numeric(12,2),
    "salary_currency" "text" DEFAULT 'EUR'::"text",
    "salary_period" "text" DEFAULT 'monthly'::"text",
    "employment_type" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "employees_employment_type_check" CHECK (("employment_type" = ANY (ARRAY['full_time'::"text", 'part_time'::"text", 'contractor'::"text", 'intern'::"text"]))),
    CONSTRAINT "employees_salary_period_check" CHECK (("salary_period" = ANY (ARRAY['hourly'::"text", 'daily'::"text", 'weekly'::"text", 'monthly'::"text", 'yearly'::"text"])))
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


COMMENT ON TABLE "public"."employees" IS 'Employés et ressources humaines';



CREATE TABLE IF NOT EXISTS "public"."encryption_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key_name" "text" NOT NULL,
    "key_type" "text" NOT NULL,
    "encrypted_key" "text" NOT NULL,
    "key_hash" "text" NOT NULL,
    "algorithm" "text" DEFAULT 'AES-256'::"text" NOT NULL,
    "key_size" integer DEFAULT 256 NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "created_by" "uuid" NOT NULL,
    "rotation_period" integer DEFAULT 90,
    "last_rotated_at" timestamp with time zone DEFAULT "now"(),
    "next_rotation_at" timestamp with time zone DEFAULT ("now"() + '90 days'::interval),
    "usage_count" bigint DEFAULT 0,
    "last_used_at" timestamp with time zone,
    "access_log" "jsonb" DEFAULT '[]'::"jsonb",
    "compromised_at" timestamp with time zone,
    "revoked_at" timestamp with time zone,
    "revoked_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."encryption_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature_flags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "flag_name" "text" NOT NULL,
    "description" "text",
    "is_enabled" boolean DEFAULT false,
    "target_audience" "text" DEFAULT 'all'::"text",
    "rollout_percentage" integer DEFAULT 0,
    "conditions" "jsonb" DEFAULT '{}'::"jsonb",
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "feature_flags_rollout_percentage_check" CHECK ((("rollout_percentage" >= 0) AND ("rollout_percentage" <= 100))),
    CONSTRAINT "feature_flags_target_audience_check" CHECK (("target_audience" = ANY (ARRAY['all'::"text", 'admins'::"text", 'managers'::"text", 'users'::"text", 'beta_users'::"text", 'specific_users'::"text"])))
);


ALTER TABLE "public"."feature_flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature_usage_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "user_id" "uuid",
    "feature_name" "text" NOT NULL,
    "usage_count" integer DEFAULT 1,
    "last_used" timestamp with time zone DEFAULT "now"(),
    "session_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feature_usage_tracking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fec_exports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "export_year" integer NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "include_documents" boolean DEFAULT false,
    "status" "text" DEFAULT 'pending'::"text",
    "file_url" "text",
    "file_size" bigint,
    "checksum" "text",
    "generated_at" timestamp with time zone,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval),
    "download_count" integer DEFAULT 0,
    "last_downloaded_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "fec_exports_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."fec_exports" OWNER TO "postgres";


COMMENT ON TABLE "public"."fec_exports" IS 'Exports FEC générés pour les entreprises';



CREATE TABLE IF NOT EXISTS "public"."financial_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "format" "text" DEFAULT 'detailed'::"text",
    "period_start" "date",
    "period_end" "date",
    "status" "text" DEFAULT 'draft'::"text",
    "file_url" "text",
    "file_format" "text",
    "file_size" integer,
    "generated_at" timestamp with time zone,
    "generated_by" "uuid",
    "currency" "text" DEFAULT 'EUR'::"text",
    "include_notes" boolean DEFAULT false,
    "include_charts" boolean DEFAULT false,
    "show_variance" boolean DEFAULT false,
    "access_level" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."financial_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fiscal_country_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "country_code" "text" NOT NULL,
    "country_name" "text" NOT NULL,
    "accounting_standard" "text" NOT NULL,
    "default_currency" "text" NOT NULL,
    "fiscal_year_end" "text" DEFAULT '31/12'::"text" NOT NULL,
    "default_vat_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "default_tax_accounts" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "compliance_requirements" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "payroll_tax_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "depreciation_rates" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fiscal_country_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."fiscal_country_templates" IS 'SÉCURISÉ: Lecture publique, modification admin seulement';



CREATE TABLE IF NOT EXISTS "public"."inventory_adjustments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "product_variant_id" "uuid",
    "warehouse_id" "uuid" NOT NULL,
    "location_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "adjustment_type" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "quantity_before" numeric(15,3) NOT NULL,
    "quantity_after" numeric(15,3) NOT NULL,
    "quantity_adjusted" numeric(15,3) GENERATED ALWAYS AS (("quantity_after" - "quantity_before")) STORED,
    "unit_cost" numeric(15,2) DEFAULT 0,
    "value_impact" numeric(15,2) GENERATED ALWAYS AS ((("quantity_after" - "quantity_before") * "unit_cost")) STORED,
    "notes" "text",
    "adjustment_reference" "text",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "different_quantities" CHECK (("quantity_before" <> "quantity_after")),
    CONSTRAINT "valid_adjustment_type" CHECK (("adjustment_type" = ANY (ARRAY['physical_count'::"text", 'damage'::"text", 'theft'::"text", 'expired'::"text", 'found'::"text", 'correction'::"text"]))),
    CONSTRAINT "valid_status" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."inventory_adjustments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "product_variant_id" "uuid",
    "warehouse_id" "uuid" NOT NULL,
    "location_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "quantity_on_hand" numeric(15,3) DEFAULT 0 NOT NULL,
    "reserved_quantity" numeric(15,3) DEFAULT 0,
    "available_quantity" numeric(15,3) GENERATED ALWAYS AS (("quantity_on_hand" - "reserved_quantity")) STORED,
    "minimum_stock" numeric(15,3) DEFAULT 0,
    "maximum_stock" numeric(15,3),
    "reorder_point" numeric(15,3) DEFAULT 0,
    "reorder_quantity" numeric(15,3) DEFAULT 0,
    "unit_cost" numeric(15,2) DEFAULT 0,
    "total_value" numeric(15,2) GENERATED ALWAYS AS (("quantity_on_hand" * "unit_cost")) STORED,
    "last_movement_date" timestamp with time zone,
    "last_count_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_quantities" CHECK ((("quantity_on_hand" >= (0)::numeric) AND ("reserved_quantity" >= (0)::numeric) AND ("reserved_quantity" <= "quantity_on_hand")))
);


ALTER TABLE "public"."inventory_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "warehouse_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "aisle" "text",
    "bay" "text",
    "level" "text",
    "bin" "text",
    "is_active" boolean DEFAULT true,
    "max_capacity" numeric(15,3),
    "current_capacity" numeric(15,3) DEFAULT 0,
    "accepts_all_products" boolean DEFAULT true,
    "restricted_to_categories" "uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inventory_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "product_variant_id" "uuid",
    "warehouse_id" "uuid" NOT NULL,
    "location_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "movement_type" "text" NOT NULL,
    "direction" "text" NOT NULL,
    "quantity" numeric(15,3) NOT NULL,
    "unit_cost" numeric(15,2) DEFAULT 0,
    "total_cost" numeric(15,2) GENERATED ALWAYS AS (("quantity" * "unit_cost")) STORED,
    "reference_type" "text",
    "reference_id" "uuid",
    "reference_number" "text",
    "notes" "text",
    "batch_number" "text",
    "expiry_date" "date",
    "serial_number" "text",
    "created_by" "uuid",
    "movement_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "positive_quantity" CHECK (("quantity" > (0)::numeric)),
    CONSTRAINT "valid_direction" CHECK (("direction" = ANY (ARRAY['in'::"text", 'out'::"text"]))),
    CONSTRAINT "valid_movement_type" CHECK (("movement_type" = ANY (ARRAY['purchase_in'::"text", 'sale_out'::"text", 'return_in'::"text", 'return_out'::"text", 'transfer_in'::"text", 'transfer_out'::"text", 'adjustment_in'::"text", 'adjustment_out'::"text", 'production_in'::"text", 'production_out'::"text", 'damage_out'::"text", 'theft_out'::"text"])))
);


ALTER TABLE "public"."inventory_movements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "quote_item_id" "uuid",
    "item_type" "text" DEFAULT 'service'::"text",
    "name" "text" NOT NULL,
    "description" "text",
    "sku" "text",
    "quantity" numeric(10,3) DEFAULT 1,
    "unit_price" numeric(15,2) NOT NULL,
    "discount_rate" numeric(5,2) DEFAULT 0,
    "tax_rate" numeric(5,2) DEFAULT 20.0,
    "line_total" numeric(15,2) GENERATED ALWAYS AS ((("quantity" * "unit_price") * ((1)::numeric - ("discount_rate" / (100)::numeric)))) STORED,
    "line_order" integer DEFAULT 1,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_discount_rate_inv" CHECK ((("discount_rate" >= (0)::numeric) AND ("discount_rate" <= (100)::numeric))),
    CONSTRAINT "valid_item_type_inv" CHECK (("item_type" = ANY (ARRAY['service'::"text", 'product'::"text"]))),
    CONSTRAINT "valid_quantity_inv" CHECK (("quantity" > (0)::numeric)),
    CONSTRAINT "valid_tax_rate_inv" CHECK ((("tax_rate" >= (0)::numeric) AND ("tax_rate" <= (100)::numeric))),
    CONSTRAINT "valid_unit_price_inv" CHECK (("unit_price" >= (0)::numeric))
);


ALTER TABLE "public"."invoice_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice_lines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "description" "text" NOT NULL,
    "quantity" numeric(10,3) DEFAULT 1 NOT NULL,
    "unit_price" numeric(12,2) DEFAULT 0 NOT NULL,
    "discount_percent" numeric(5,2) DEFAULT 0,
    "discount_amount" numeric(12,2) DEFAULT 0,
    "tax_rate" numeric(5,2) DEFAULT 0,
    "tax_amount" numeric(12,2) DEFAULT 0,
    "line_total_excl_tax" numeric(15,2) DEFAULT 0 NOT NULL,
    "line_total_incl_tax" numeric(15,2) DEFAULT 0 NOT NULL,
    "account_id" "uuid",
    "line_order" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invoice_lines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "template_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "is_default" boolean DEFAULT false,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."invoice_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "third_party_id" "uuid" NOT NULL,
    "journal_entry_id" "uuid",
    "invoice_number" "text" NOT NULL,
    "invoice_type" "text" NOT NULL,
    "invoice_date" "date" NOT NULL,
    "due_date" "date" NOT NULL,
    "payment_date" "date",
    "subtotal_excl_tax" numeric(15,2) DEFAULT 0 NOT NULL,
    "total_tax_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "total_incl_tax" numeric(15,2) DEFAULT 0 NOT NULL,
    "paid_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "remaining_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "currency" "text" DEFAULT 'EUR'::"text",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "customer_id" "uuid",
    "quote_id" "uuid",
    "title" "text",
    "subtotal_amount" numeric(15,2) DEFAULT 0,
    "tax_amount" numeric(15,2) DEFAULT 0,
    "discount_amount" numeric(15,2) DEFAULT 0,
    "total_amount" numeric(15,2) DEFAULT 0,
    "tax_rate" numeric(5,2) DEFAULT 20.0,
    "payment_terms" integer DEFAULT 30,
    "internal_notes" "text",
    "sent_at" timestamp with time zone,
    "paid_at" timestamp with time zone,
    CONSTRAINT "invoices_invoice_type_check" CHECK (("invoice_type" = ANY (ARRAY['sale'::"text", 'purchase'::"text", 'credit_note'::"text", 'debit_note'::"text"]))),
    CONSTRAINT "invoices_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'paid'::"text", 'partial'::"text", 'overdue'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "valid_invoice_status" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'viewed'::"text", 'paid'::"text", 'overdue'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


COMMENT ON TABLE "public"."invoices" IS 'Factures de vente et d''achat';



CREATE TABLE IF NOT EXISTS "public"."invoices_stripe" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_invoice_id" "text" NOT NULL,
    "stripe_subscription_id" "text",
    "stripe_customer_id" "text",
    "amount_paid" integer NOT NULL,
    "currency" "text" DEFAULT 'eur'::"text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "invoice_url" "text",
    "invoice_pdf" "text",
    "period_start" timestamp with time zone,
    "period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invoices_stripe" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."journal_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "journal_id" "uuid" NOT NULL,
    "entry_date" "date" NOT NULL,
    "description" "text" NOT NULL,
    "reference_number" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "imported_from_fec" boolean DEFAULT false,
    "fec_journal_code" "text",
    "fec_entry_num" "text",
    "original_fec_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "accounting_period_id" "uuid"
);


ALTER TABLE "public"."journal_entries" OWNER TO "postgres";


COMMENT ON TABLE "public"."journal_entries" IS 'Écritures comptables avec validation';



CREATE TABLE IF NOT EXISTS "public"."journal_entry_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "journal_entry_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "debit_amount" numeric(15,2) DEFAULT 0,
    "credit_amount" numeric(15,2) DEFAULT 0,
    "currency" "text" DEFAULT 'EUR'::"text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."journal_entry_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."journal_entry_lines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "journal_entry_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "debit_amount" numeric(15,2) DEFAULT 0,
    "credit_amount" numeric(15,2) DEFAULT 0,
    "line_order" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "account_number" "text",
    "account_name" "text"
);


ALTER TABLE "public"."journal_entry_lines" OWNER TO "postgres";


COMMENT ON TABLE "public"."journal_entry_lines" IS 'Lignes des écritures comptables';



CREATE TABLE IF NOT EXISTS "public"."journals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "imported_from_fec" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."journals" OWNER TO "postgres";


COMMENT ON TABLE "public"."journals" IS 'Journaux comptables (ventes, achats, banque, etc.)';



CREATE TABLE IF NOT EXISTS "public"."languages_catalog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "language_code" "text" NOT NULL,
    "language_name" "text" NOT NULL,
    "language_name_native" "text",
    "country_codes" "text"[],
    "is_rtl" boolean DEFAULT false,
    "date_format" "text" DEFAULT 'DD/MM/YYYY'::"text",
    "time_format" "text" DEFAULT 'HH:mm'::"text",
    "number_format" "text" DEFAULT 'FR'::"text",
    "is_active" boolean DEFAULT true,
    "is_supported" boolean DEFAULT true,
    "completion_percentage" integer DEFAULT 100,
    "priority_order" integer DEFAULT 100,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."languages_catalog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leave_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "leave_type_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "days_requested" numeric(4,1) NOT NULL,
    "reason" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejection_reason" "text",
    "request_date" "date" DEFAULT CURRENT_DATE,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "leave_requests_check" CHECK (("end_date" >= "start_date")),
    CONSTRAINT "leave_requests_days_requested_check" CHECK (("days_requested" > (0)::numeric)),
    CONSTRAINT "leave_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."leave_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leave_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "is_paid" boolean DEFAULT true,
    "is_active" boolean DEFAULT true,
    "requires_approval" boolean DEFAULT true,
    "max_days_per_year" integer,
    "max_consecutive_days" integer,
    "min_notice_days" integer DEFAULT 1,
    "color" "text" DEFAULT '#3B82F6'::"text",
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."leave_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."legal_archives" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "original_name" "text" NOT NULL,
    "archived_data" "jsonb" NOT NULL,
    "fec_export_url" "text",
    "documents_archive_url" "text",
    "archived_at" timestamp with time zone DEFAULT "now"(),
    "archive_expires_at" timestamp with time zone DEFAULT ("now"() + '7 years'::interval) NOT NULL,
    "legal_basis" "text" DEFAULT 'Code de commerce - Conservation 7 ans'::"text",
    "is_encrypted" boolean DEFAULT true,
    "encryption_key_id" "uuid",
    "access_log" "jsonb" DEFAULT '[]'::"jsonb",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "legal_archives_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['user'::"text", 'company'::"text"]))),
    CONSTRAINT "legal_archives_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'expired'::"text", 'destroyed'::"text"])))
);


ALTER TABLE "public"."legal_archives" OWNER TO "postgres";


COMMENT ON TABLE "public"."legal_archives" IS 'Archives légales des données supprimées (conservation 7 ans)';



CREATE TABLE IF NOT EXISTS "public"."login_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "ip_address" "inet" NOT NULL,
    "user_agent" "text",
    "attempt_type" "text" NOT NULL,
    "failure_reason" "text",
    "mfa_required" boolean DEFAULT false,
    "mfa_success" boolean,
    "device_fingerprint" "text",
    "location" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "login_attempts_attempt_type_check" CHECK (("attempt_type" = ANY (ARRAY['success'::"text", 'failure'::"text", 'blocked'::"text"])))
);


ALTER TABLE "public"."login_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."module_catalog" (
    "module_key" "text" NOT NULL,
    "display_name_fr" "text" NOT NULL,
    "display_name_en" "text",
    "description_fr" "text",
    "description_en" "text",
    "category" "text" DEFAULT 'business'::"text",
    "subcategory" "text",
    "default_enabled" boolean DEFAULT false,
    "is_core_module" boolean DEFAULT false,
    "requires_subscription" boolean DEFAULT false,
    "icon_name" "text" DEFAULT 'Package'::"text",
    "icon_color" "text" DEFAULT '#6366f1'::"text",
    "sort_order" integer DEFAULT 0,
    "default_user_limit" integer,
    "default_storage_gb" integer DEFAULT 10,
    "default_access_level" "text" DEFAULT 'standard'::"text",
    "requires_plan" "text" DEFAULT 'free'::"text",
    "requires_modules" "text"[] DEFAULT '{}'::"text"[],
    "conflicts_with" "text"[] DEFAULT '{}'::"text"[],
    "is_active" boolean DEFAULT true,
    "is_beta" boolean DEFAULT false,
    "release_date" "date",
    "deprecation_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "module_catalog_category_check" CHECK (("category" = ANY (ARRAY['core'::"text", 'business'::"text", 'finance'::"text", 'analytics'::"text", 'integration'::"text", 'specialized'::"text"])))
);


ALTER TABLE "public"."module_catalog" OWNER TO "postgres";


COMMENT ON TABLE "public"."module_catalog" IS 'Catalogue des modules disponibles dans le système CassKai';



CREATE TABLE IF NOT EXISTS "public"."module_configurations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "module_name" "text" NOT NULL,
    "is_enabled" boolean DEFAULT true,
    "configuration" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "license_info" "jsonb" DEFAULT '{}'::"jsonb",
    "usage_limits" "jsonb" DEFAULT '{}'::"jsonb",
    "last_accessed" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."module_configurations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_channels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "channel_name" "text" NOT NULL,
    "channel_type" "text" NOT NULL,
    "configuration" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_default" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "rate_limit_per_hour" integer DEFAULT 100,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "notification_channels_channel_type_check" CHECK (("channel_type" = ANY (ARRAY['email'::"text", 'sms'::"text", 'push'::"text", 'slack'::"text", 'teams'::"text", 'webhook'::"text"])))
);


ALTER TABLE "public"."notification_channels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "notification_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "status" "text" DEFAULT 'sent'::"text",
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "read_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "notification_history_status_check" CHECK (("status" = ANY (ARRAY['sent'::"text", 'delivered'::"text", 'read'::"text", 'failed'::"text"]))),
    CONSTRAINT "valid_notification_type" CHECK (("notification_type" = ANY (ARRAY['email'::"text", 'push'::"text", 'in_app'::"text"])))
);


ALTER TABLE "public"."notification_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."notification_history" IS 'Historique des notifications envoyées aux utilisateurs';



CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email_enabled" boolean DEFAULT true,
    "push_enabled" boolean DEFAULT true,
    "in_app_enabled" boolean DEFAULT true,
    "system_notifications" boolean DEFAULT true,
    "billing_notifications" boolean DEFAULT true,
    "feature_notifications" boolean DEFAULT true,
    "security_notifications" boolean DEFAULT true,
    "general_notifications" boolean DEFAULT true,
    "email_frequency" "text" DEFAULT 'instant'::"text",
    "quiet_hours_enabled" boolean DEFAULT false,
    "quiet_hours_start" time without time zone,
    "quiet_hours_end" time without time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notification_preferences_email_frequency_check" CHECK (("email_frequency" = ANY (ARRAY['instant'::"text", 'daily'::"text", 'weekly'::"text", 'never'::"text"])))
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "template_name" "text" NOT NULL,
    "template_type" "text" NOT NULL,
    "event_trigger" "text" NOT NULL,
    "subject_template" "text",
    "body_template" "text" NOT NULL,
    "variables" "jsonb" DEFAULT '{}'::"jsonb",
    "conditions" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "notification_templates_template_type_check" CHECK (("template_type" = ANY (ARRAY['email'::"text", 'sms'::"text", 'push'::"text", 'in_app'::"text", 'webhook'::"text", 'slack'::"text"])))
);


ALTER TABLE "public"."notification_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" NOT NULL,
    "category" "text",
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "link" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    CONSTRAINT "notifications_category_check" CHECK (("category" = ANY (ARRAY['system'::"text", 'billing'::"text", 'feature'::"text", 'security'::"text", 'general'::"text"]))),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['info'::"text", 'success'::"text", 'warning'::"text", 'error'::"text"]))),
    CONSTRAINT "valid_link" CHECK ((("link" IS NULL) OR ("link" ~ '^/'::"text")))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."oauth_providers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "provider_name" "text" NOT NULL,
    "client_id" "text" NOT NULL,
    "client_secret" "text" NOT NULL,
    "authorization_url" "text" NOT NULL,
    "token_url" "text" NOT NULL,
    "scope" "text" DEFAULT 'read'::"text",
    "redirect_uri" "text" NOT NULL,
    "is_enabled" boolean DEFAULT true,
    "configuration" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."oauth_providers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "step_name" "text" NOT NULL,
    "step_order" integer NOT NULL,
    "step_data" "jsonb" DEFAULT '{}'::"jsonb",
    "completion_status" "text" DEFAULT 'completed'::"text",
    "completion_time" timestamp with time zone DEFAULT "now"(),
    "validation_errors" "jsonb" DEFAULT '[]'::"jsonb",
    "validation_warnings" "jsonb" DEFAULT '[]'::"jsonb",
    "retry_count" integer DEFAULT 0,
    "time_spent_seconds" integer DEFAULT 0,
    "session_id" "text",
    "user_agent" "text",
    "ip_address" "inet",
    "browser_info" "jsonb" DEFAULT '{}'::"jsonb",
    "screen_resolution" "text",
    "device_type" "text" DEFAULT 'desktop'::"text",
    "page_load_time_ms" integer,
    "api_calls_count" integer DEFAULT 0,
    "api_errors_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "onboarding_history_completion_status_check" CHECK (("completion_status" = ANY (ARRAY['started'::"text", 'in_progress'::"text", 'completed'::"text", 'skipped'::"text", 'error'::"text", 'abandoned'::"text"]))),
    CONSTRAINT "onboarding_history_device_type_check" CHECK (("device_type" = ANY (ARRAY['desktop'::"text", 'tablet'::"text", 'mobile'::"text", 'unknown'::"text"]))),
    CONSTRAINT "onboarding_history_retry_count_check" CHECK (("retry_count" >= 0)),
    CONSTRAINT "onboarding_history_step_name_check" CHECK (("step_name" = ANY (ARRAY['welcome'::"text", 'company'::"text", 'modules'::"text", 'preferences'::"text", 'features'::"text", 'complete'::"text"]))),
    CONSTRAINT "onboarding_history_step_order_check" CHECK ((("step_order" >= 1) AND ("step_order" <= 10))),
    CONSTRAINT "onboarding_history_time_spent_seconds_check" CHECK (("time_spent_seconds" >= 0))
);


ALTER TABLE "public"."onboarding_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."onboarding_history" IS 'Historique complet des étapes d''onboarding - traçabilité manquante dans CompleteStep';



COMMENT ON COLUMN "public"."onboarding_history"."step_name" IS 'Nom de l''étape: welcome, company, modules, preferences, features, complete';



COMMENT ON COLUMN "public"."onboarding_history"."step_data" IS 'Données JSON de l''étape pour debugging et analytics';



COMMENT ON COLUMN "public"."onboarding_history"."completion_status" IS 'Statut: started, in_progress, completed, skipped, error, abandoned';



COMMENT ON COLUMN "public"."onboarding_history"."validation_errors" IS 'Erreurs de validation JSON pour debugging';



COMMENT ON COLUMN "public"."onboarding_history"."time_spent_seconds" IS 'Temps passé sur l''étape en secondes';



COMMENT ON COLUMN "public"."onboarding_history"."session_id" IS 'ID de session pour regrouper les étapes';



CREATE TABLE IF NOT EXISTS "public"."onboarding_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_token" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "abandoned_at" timestamp with time zone,
    "total_steps" integer DEFAULT 6,
    "completed_steps" integer DEFAULT 0,
    "current_step" "text" DEFAULT 'welcome'::"text",
    "final_status" "text" DEFAULT 'in_progress'::"text",
    "initial_data" "jsonb" DEFAULT '{}'::"jsonb",
    "final_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_draft" boolean DEFAULT false,
    "draft_data" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "onboarding_sessions_final_status_check" CHECK (("final_status" = ANY (ARRAY['in_progress'::"text", 'completed'::"text", 'abandoned'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."onboarding_sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."onboarding_sessions" IS 'Sessions complètes d''onboarding pour analytics et reprise';



CREATE OR REPLACE VIEW "public"."opportunities" AS
 SELECT "id",
    "company_id",
    "title",
    "description",
    "value",
    "probability",
    "expected_close_date" AS "close_date",
    "status",
    "source",
    "client_id",
    "owner_id" AS "assigned_to",
    "stage_id",
    "pipeline_id",
    "created_at",
    "updated_at"
   FROM "public"."crm_opportunities";


ALTER VIEW "public"."opportunities" OWNER TO "postgres";


COMMENT ON VIEW "public"."opportunities" IS 'Vue sécurisée des opportunités - SECURITY INVOKER par défaut';



CREATE TABLE IF NOT EXISTS "public"."password_policies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "policy_name" "text" DEFAULT 'default'::"text" NOT NULL,
    "min_length" integer DEFAULT 8,
    "require_uppercase" boolean DEFAULT true,
    "require_lowercase" boolean DEFAULT true,
    "require_numbers" boolean DEFAULT true,
    "require_special_chars" boolean DEFAULT true,
    "max_age_days" integer DEFAULT 90,
    "history_count" integer DEFAULT 5,
    "lockout_attempts" integer DEFAULT 5,
    "lockout_duration_minutes" integer DEFAULT 30,
    "complexity_rules" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "password_policies_min_length_check" CHECK (("min_length" >= 4))
);


ALTER TABLE "public"."password_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "is_default" boolean DEFAULT false,
    "requires_reference" boolean DEFAULT false,
    "instructions" "text",
    "bank_details" "jsonb",
    "company_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "payment_method_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "payment_number" "text",
    "reference" "text",
    "amount" numeric(15,2) NOT NULL,
    "currency" "text" DEFAULT 'EUR'::"text",
    "payment_date" "date" DEFAULT CURRENT_DATE,
    "received_date" "date",
    "status" "text" DEFAULT 'pending'::"text",
    "notes" "text",
    "bank_reference" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "valid_payment_amount" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "valid_payment_status" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "pay_period_start" "date" NOT NULL,
    "pay_period_end" "date" NOT NULL,
    "pay_date" "date" NOT NULL,
    "payroll_number" "text" NOT NULL,
    "gross_salary" numeric(15,2) DEFAULT 0 NOT NULL,
    "net_salary" numeric(15,2) DEFAULT 0 NOT NULL,
    "regular_hours" numeric(6,2) DEFAULT 0,
    "overtime_hours" numeric(6,2) DEFAULT 0,
    "status" "text" DEFAULT 'draft'::"text",
    "currency" "text" DEFAULT 'EUR'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "processed_by" "uuid",
    CONSTRAINT "payroll_check" CHECK (("pay_period_end" >= "pay_period_start")),
    CONSTRAINT "payroll_gross_salary_check" CHECK (("gross_salary" >= (0)::numeric)),
    CONSTRAINT "payroll_net_salary_check" CHECK (("net_salary" >= (0)::numeric)),
    CONSTRAINT "payroll_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'approved'::"text", 'paid'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."payroll" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payroll_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "item_type" "text" NOT NULL,
    "item_code" "text" NOT NULL,
    "item_name" "text" NOT NULL,
    "description" "text",
    "calculation_base" numeric(15,2) DEFAULT 0,
    "rate" numeric(8,4),
    "amount" numeric(15,2) NOT NULL,
    "is_taxable" boolean DEFAULT true,
    "is_social_security_base" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payroll_items_amount_check" CHECK (("amount" IS NOT NULL)),
    CONSTRAINT "payroll_items_item_type_check" CHECK (("item_type" = ANY (ARRAY['salary'::"text", 'bonus'::"text", 'deduction'::"text", 'tax'::"text", 'social_charge'::"text", 'allowance'::"text"])))
);


ALTER TABLE "public"."payroll_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."performance_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "manager_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "review_period_start" "date" NOT NULL,
    "review_period_end" "date" NOT NULL,
    "review_date" "date" DEFAULT CURRENT_DATE,
    "review_type" "text" DEFAULT 'annual'::"text",
    "status" "text" DEFAULT 'draft'::"text",
    "overall_rating" numeric(3,1),
    "overall_comments" "text",
    "goals_achieved" "text"[],
    "goals_not_achieved" "text"[],
    "new_goals" "text"[],
    "competencies_scores" "jsonb" DEFAULT '{}'::"jsonb",
    "strengths" "text"[],
    "areas_for_improvement" "text"[],
    "development_plan" "text",
    "training_recommendations" "text"[],
    "career_aspirations" "text",
    "employee_signature_date" timestamp with time zone,
    "reviewer_signature_date" timestamp with time zone,
    "manager_approval_date" timestamp with time zone,
    "is_visible_to_employee" boolean DEFAULT true,
    "next_review_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "performance_reviews_check" CHECK (("review_period_end" >= "review_period_start")),
    CONSTRAINT "performance_reviews_overall_rating_check" CHECK ((("overall_rating" >= (0)::numeric) AND ("overall_rating" <= (5)::numeric))),
    CONSTRAINT "performance_reviews_review_type_check" CHECK (("review_type" = ANY (ARRAY['annual'::"text", 'mid_year'::"text", 'probation'::"text", 'project_based'::"text", 'exit'::"text"]))),
    CONSTRAINT "performance_reviews_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'in_progress'::"text", 'completed'::"text", 'approved'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."performance_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."performance_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "setting_name" "text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "setting_value" "jsonb" NOT NULL,
    "description" "text",
    "recommended_value" "jsonb",
    "impact_level" "text" DEFAULT 'medium'::"text",
    "requires_restart" boolean DEFAULT false,
    "last_optimized" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid",
    CONSTRAINT "performance_settings_impact_level_check" CHECK (("impact_level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"])))
);


ALTER TABLE "public"."performance_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "resource" "text" NOT NULL,
    "action" "text" NOT NULL,
    "conditions" "jsonb" DEFAULT '{}'::"jsonb",
    "is_system" boolean DEFAULT false,
    "category" "text" DEFAULT 'general'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "department_id" "uuid" NOT NULL,
    "reports_to_position_id" "uuid",
    "salary_min" numeric(15,2),
    "salary_max" numeric(15,2),
    "salary_currency" "text" DEFAULT 'EUR'::"text",
    "employment_type" "text" DEFAULT 'full_time'::"text",
    "level_grade" "text",
    "requires_travel" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "max_headcount" integer DEFAULT 1,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "positions_check" CHECK (("salary_max" >= "salary_min")),
    CONSTRAINT "positions_employment_type_check" CHECK (("employment_type" = ANY (ARRAY['full_time'::"text", 'part_time'::"text", 'contract'::"text", 'intern'::"text", 'freelance'::"text"]))),
    CONSTRAINT "positions_salary_min_check" CHECK (("salary_min" >= (0)::numeric))
);


ALTER TABLE "public"."positions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "parent_category_id" "uuid",
    "category_path" "text",
    "level" integer DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "default_unit" "text" DEFAULT 'pièce'::"text",
    "requires_serial_number" boolean DEFAULT false,
    "requires_expiry_date" boolean DEFAULT false,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_variants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "variant_name" "text" NOT NULL,
    "sku" "text" NOT NULL,
    "barcode" "text",
    "size" "text",
    "color" "text",
    "material" "text",
    "style" "text",
    "custom_attributes" "jsonb",
    "variant_price" numeric(15,2),
    "variant_cost" numeric(15,2),
    "weight" numeric(10,3),
    "dimensions" "jsonb",
    "is_active" boolean DEFAULT true,
    "track_inventory" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_variants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "type" "text" NOT NULL,
    "category" "text",
    "sale_price" numeric(12,2) DEFAULT 0,
    "purchase_price" numeric(12,2) DEFAULT 0,
    "cost_price" numeric(12,2) DEFAULT 0,
    "is_stockable" boolean DEFAULT false,
    "current_stock" numeric(10,3) DEFAULT 0,
    "minimum_stock" numeric(10,3) DEFAULT 0,
    "stock_unit" "text" DEFAULT 'unit'::"text",
    "sales_account_id" "uuid",
    "purchase_account_id" "uuid",
    "stock_account_id" "uuid",
    "sale_tax_rate" numeric(5,2) DEFAULT 20,
    "purchase_tax_rate" numeric(5,2) DEFAULT 20,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "products_type_check" CHECK (("type" = ANY (ARRAY['product'::"text", 'service'::"text", 'bundle'::"text"])))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON TABLE "public"."products" IS 'Catalogue produits et services';



CREATE TABLE IF NOT EXISTS "public"."project_baselines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "baseline_name" "text" NOT NULL,
    "description" "text",
    "baseline_date" "date" NOT NULL,
    "baseline_start_date" "date" NOT NULL,
    "baseline_end_date" "date" NOT NULL,
    "baseline_duration_days" integer NOT NULL,
    "baseline_cost" numeric(15,2) DEFAULT 0.00,
    "baseline_hours" numeric(8,2) DEFAULT 0.00,
    "tasks_snapshot" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "resources_snapshot" "jsonb" DEFAULT '[]'::"jsonb",
    "milestones_snapshot" "jsonb" DEFAULT '[]'::"jsonb",
    "is_current_baseline" boolean DEFAULT false,
    "is_approved" boolean DEFAULT false,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."project_baselines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_billing_rates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "employee_id" "uuid",
    "role_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "hourly_rate" numeric(8,2) NOT NULL,
    "overtime_rate" numeric(8,2),
    "weekend_rate" numeric(8,2),
    "holiday_rate" numeric(8,2),
    "effective_from" "date" NOT NULL,
    "effective_until" "date",
    "is_billable" boolean DEFAULT true,
    "markup_percentage" numeric(5,2) DEFAULT 0.00,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."project_billing_rates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_budgets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "phase_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "budget_category" "text" NOT NULL,
    "category_name" "text" NOT NULL,
    "description" "text",
    "estimated_amount" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "committed_amount" numeric(15,2) DEFAULT 0.00,
    "actual_amount" numeric(15,2) DEFAULT 0.00,
    "budget_period_start" "date",
    "budget_period_end" "date",
    "approval_required" boolean DEFAULT false,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "variance_threshold_percentage" numeric(5,2) DEFAULT 10.00,
    "alert_when_exceeded" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."project_budgets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "parent_category_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#3B82F6'::"text",
    "icon" "text",
    "level" integer DEFAULT 1,
    "sort_order" integer DEFAULT 0,
    "default_budget" numeric(15,2),
    "default_duration_days" integer,
    "default_hourly_rate" numeric(8,2),
    "default_statuses" "jsonb" DEFAULT '[]'::"jsonb",
    "default_task_types" "jsonb" DEFAULT '[]'::"jsonb",
    "template_config" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."project_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_discussions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "content_type" "text" DEFAULT 'text'::"text",
    "category" "text" DEFAULT 'general'::"text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "is_pinned" boolean DEFAULT false,
    "is_locked" boolean DEFAULT false,
    "is_resolved" boolean DEFAULT false,
    "participants" "uuid"[] DEFAULT '{}'::"uuid"[],
    "watchers" "uuid"[] DEFAULT '{}'::"uuid"[],
    "reply_count" integer DEFAULT 0,
    "view_count" integer DEFAULT 0,
    "last_activity_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."project_discussions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "task_id" "uuid",
    "budget_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "expense_name" "text" NOT NULL,
    "description" "text",
    "expense_date" "date" NOT NULL,
    "expense_category" "text" NOT NULL,
    "expense_type" "text" DEFAULT 'actual'::"text",
    "amount" numeric(15,2) NOT NULL,
    "tax_amount" numeric(15,2) DEFAULT 0.00,
    "total_amount" numeric(15,2) NOT NULL,
    "currency" "text" DEFAULT 'EUR'::"text",
    "vendor_name" "text",
    "vendor_id" "uuid",
    "invoice_number" "text",
    "receipt_number" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "approval_required" boolean DEFAULT true,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "receipt_file_path" "text",
    "supporting_documents" "jsonb" DEFAULT '[]'::"jsonb",
    "reimbursable" boolean DEFAULT false,
    "reimbursed" boolean DEFAULT false,
    "reimbursed_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."project_expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_forecasts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "forecast_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "forecast_horizon_days" integer DEFAULT 90 NOT NULL,
    "forecast_method" "text" DEFAULT 'earned_value'::"text" NOT NULL,
    "forecasted_completion_date" "date",
    "forecasted_duration_days" integer,
    "schedule_variance_days" integer DEFAULT 0,
    "confidence_interval_days" integer DEFAULT 7,
    "forecasted_final_cost" numeric(15,2),
    "cost_variance" numeric(15,2) DEFAULT 0.00,
    "cost_at_completion" numeric(15,2),
    "estimate_to_complete" numeric(15,2),
    "forecasted_total_hours" numeric(8,2),
    "remaining_effort_hours" numeric(8,2),
    "peak_resource_demand" integer,
    "resource_bottlenecks" "jsonb" DEFAULT '[]'::"jsonb",
    "risk_factors" "jsonb" DEFAULT '[]'::"jsonb",
    "mitigation_strategies" "jsonb" DEFAULT '[]'::"jsonb",
    "probability_success" numeric(5,2) DEFAULT 50.00,
    "optimistic_scenario" "jsonb" DEFAULT '{}'::"jsonb",
    "pessimistic_scenario" "jsonb" DEFAULT '{}'::"jsonb",
    "most_likely_scenario" "jsonb" DEFAULT '{}'::"jsonb",
    "forecast_accuracy" numeric(5,2) DEFAULT 0.00,
    "data_completeness" numeric(5,2) DEFAULT 100.00,
    "model_confidence" numeric(5,2) DEFAULT 75.00,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "model_version" "text" DEFAULT '1.0'::"text",
    "calculated_by" "uuid"
);


ALTER TABLE "public"."project_forecasts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_gantt_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "task_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "duration_days" numeric(8,2) NOT NULL,
    "progress_percentage" numeric(5,2) DEFAULT 0.00,
    "critical_path" boolean DEFAULT false,
    "bar_style" "jsonb" DEFAULT '{}'::"jsonb",
    "earliest_start" "date",
    "latest_finish" "date",
    "slack_days" numeric(8,2) DEFAULT 0.00,
    "calculated_start" "date",
    "calculated_end" "date",
    "schedule_variance_days" numeric(8,2) DEFAULT 0.00,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_calculated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_gantt_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_kpis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "measurement_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "measurement_period" "text" DEFAULT 'daily'::"text",
    "planned_hours" numeric(8,2) DEFAULT 0.00,
    "actual_hours" numeric(8,2) DEFAULT 0.00,
    "remaining_hours" numeric(8,2) DEFAULT 0.00,
    "schedule_performance_index" numeric(8,4) DEFAULT 1.0000,
    "planned_cost" numeric(15,2) DEFAULT 0.00,
    "actual_cost" numeric(15,2) DEFAULT 0.00,
    "remaining_budget" numeric(15,2) DEFAULT 0.00,
    "cost_performance_index" numeric(8,4) DEFAULT 1.0000,
    "planned_progress" numeric(5,2) DEFAULT 0.00,
    "actual_progress" numeric(5,2) DEFAULT 0.00,
    "earned_value" numeric(15,2) DEFAULT 0.00,
    "tasks_completed" integer DEFAULT 0,
    "tasks_overdue" integer DEFAULT 0,
    "defects_found" integer DEFAULT 0,
    "rework_hours" numeric(8,2) DEFAULT 0.00,
    "team_utilization" numeric(5,2) DEFAULT 0.00,
    "resource_conflicts" integer DEFAULT 0,
    "overtime_hours" numeric(8,2) DEFAULT 0.00,
    "overall_health_score" numeric(5,2) DEFAULT 100.00,
    "risk_score" numeric(5,2) DEFAULT 0.00,
    "customer_satisfaction" numeric(3,2) DEFAULT 5.00,
    "estimated_completion_date" "date",
    "estimated_final_cost" numeric(15,2),
    "probability_on_time" numeric(5,2) DEFAULT 50.00,
    "probability_on_budget" numeric(5,2) DEFAULT 50.00,
    "calculation_method" "text" DEFAULT 'earned_value'::"text",
    "data_quality_score" numeric(5,2) DEFAULT 100.00,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "calculated_by" "text" DEFAULT 'system'::"text"
);


ALTER TABLE "public"."project_kpis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "role_id" "uuid",
    "allocation_percentage" numeric(5,2) DEFAULT 100.00,
    "hourly_rate" numeric(8,2),
    "total_budget" numeric(15,2),
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "can_edit_project" boolean DEFAULT false,
    "can_edit_tasks" boolean DEFAULT false,
    "can_manage_team" boolean DEFAULT false,
    "can_view_budget" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."project_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_milestones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "phase_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "target_date" "date" NOT NULL,
    "actual_date" "date",
    "status" "text" DEFAULT 'pending'::"text",
    "is_critical" boolean DEFAULT false,
    "deliverables" "jsonb" DEFAULT '[]'::"jsonb",
    "criteria" "jsonb" DEFAULT '[]'::"jsonb",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."project_milestones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "notification_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "related_entity_type" "text",
    "related_entity_id" "uuid",
    "priority" "text" DEFAULT 'normal'::"text",
    "send_email" boolean DEFAULT true,
    "send_push" boolean DEFAULT true,
    "status" "text" DEFAULT 'pending'::"text",
    "sent_at" timestamp with time zone,
    "read_at" timestamp with time zone,
    "dismissed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."project_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_phases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "phase_number" integer NOT NULL,
    "start_date" "date",
    "end_date" "date",
    "estimated_hours" numeric(8,2) DEFAULT 0.00,
    "actual_hours" numeric(8,2) DEFAULT 0.00,
    "estimated_budget" numeric(15,2) DEFAULT 0.00,
    "actual_budget" numeric(15,2) DEFAULT 0.00,
    "status" "text" DEFAULT 'not_started'::"text",
    "progress" integer DEFAULT 0,
    "is_milestone" boolean DEFAULT false,
    "is_critical" boolean DEFAULT false,
    "deliverables" "jsonb" DEFAULT '[]'::"jsonb",
    "depends_on_phases" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "project_phases_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100)))
);


ALTER TABLE "public"."project_phases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "resource_type" "text" NOT NULL,
    "resource_name" "text" NOT NULL,
    "description" "text",
    "unit_cost" numeric(15,2) DEFAULT 0.00,
    "cost_unit" "text" DEFAULT 'hour'::"text",
    "total_available" numeric(8,2),
    "total_allocated" numeric(8,2) DEFAULT 0.00,
    "available_from" "date",
    "available_until" "date",
    "specifications" "jsonb" DEFAULT '{}'::"jsonb",
    "constraints" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."project_resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "permissions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "default_hourly_rate" numeric(8,2),
    "requires_approval" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "is_system" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "schedule_name" "text" DEFAULT 'Main Schedule'::"text",
    "work_days" integer[] DEFAULT '{1,2,3,4,5}'::integer[],
    "work_hours_per_day" numeric(4,2) DEFAULT 8.00,
    "start_time" time without time zone DEFAULT '09:00:00'::time without time zone,
    "end_time" time without time zone DEFAULT '17:00:00'::time without time zone,
    "holidays" "jsonb" DEFAULT '[]'::"jsonb",
    "special_work_days" "jsonb" DEFAULT '[]'::"jsonb",
    "auto_schedule" boolean DEFAULT true,
    "schedule_forward" boolean DEFAULT true,
    "baseline_locked" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."project_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_statuses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#3B82F6'::"text" NOT NULL,
    "icon" "text",
    "is_initial" boolean DEFAULT false,
    "is_final" boolean DEFAULT false,
    "is_cancelled" boolean DEFAULT false,
    "allows_time_tracking" boolean DEFAULT true,
    "next_statuses" "uuid"[] DEFAULT '{}'::"uuid"[],
    "required_permissions" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "is_system" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_statuses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "parent_task_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "task_number" "text",
    "status" "text" DEFAULT 'todo'::"text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "type_id" "uuid",
    "start_date" "date",
    "due_date" "date",
    "estimated_hours" numeric(8,2) DEFAULT 0.00,
    "actual_hours" numeric(8,2) DEFAULT 0.00,
    "progress" integer DEFAULT 0,
    "assigned_to" "uuid",
    "assigned_date" timestamp with time zone,
    "depends_on" "uuid"[] DEFAULT '{}'::"uuid"[],
    "constraint_type" "text" DEFAULT 'finish_to_start'::"text",
    "lag_days" integer DEFAULT 0,
    "estimated_cost" numeric(15,2) DEFAULT 0.00,
    "actual_cost" numeric(15,2) DEFAULT 0.00,
    "hourly_rate" numeric(8,2),
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "custom_fields" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "project_tasks_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100)))
);


ALTER TABLE "public"."project_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "version" "text" DEFAULT '1.0'::"text",
    "estimated_duration_days" integer,
    "estimated_budget" numeric(15,2),
    "estimated_hours" numeric(8,2),
    "phases" "jsonb" DEFAULT '[]'::"jsonb",
    "tasks" "jsonb" DEFAULT '[]'::"jsonb",
    "milestones" "jsonb" DEFAULT '[]'::"jsonb",
    "resources" "jsonb" DEFAULT '[]'::"jsonb",
    "default_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "required_roles" "jsonb" DEFAULT '[]'::"jsonb",
    "dependencies" "jsonb" DEFAULT '[]'::"jsonb",
    "usage_count" integer DEFAULT 0,
    "last_used_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "is_public" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."project_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_timesheets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "task_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "work_date" "date" NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "break_duration_minutes" integer DEFAULT 0,
    "hours_worked" numeric(8,2) NOT NULL,
    "billable_hours" numeric(8,2) DEFAULT 0.00,
    "overtime_hours" numeric(8,2) DEFAULT 0.00,
    "hourly_rate" numeric(8,2),
    "total_amount" numeric(15,2),
    "description" "text",
    "activity_type" "text" DEFAULT 'development'::"text",
    "status" "text" DEFAULT 'draft'::"text",
    "submitted_at" timestamp with time zone,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejection_reason" "text",
    "is_billable" boolean DEFAULT true,
    "invoice_id" "uuid",
    "billed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."project_timesheets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "project_number" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "start_date" "date",
    "end_date" "date",
    "actual_end_date" "date",
    "budget_amount" numeric(15,2) DEFAULT 0,
    "actual_cost" numeric(15,2) DEFAULT 0,
    "invoiced_amount" numeric(15,2) DEFAULT 0,
    "customer_id" "uuid",
    "manager_id" "uuid",
    "status" "text" DEFAULT 'planning'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "projects_status_check" CHECK (("status" = ANY (ARRAY['planning'::"text", 'active'::"text", 'on_hold'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


COMMENT ON TABLE "public"."projects" IS 'Gestion de projets';



CREATE TABLE IF NOT EXISTS "public"."purchase_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "item_name" "text" NOT NULL,
    "item_description" "text",
    "item_type" "text" DEFAULT 'product'::"text",
    "quantity" numeric(10,3) DEFAULT 1 NOT NULL,
    "unit_price" numeric(15,2) NOT NULL,
    "discount_rate" numeric(5,2) DEFAULT 0,
    "tax_rate" numeric(5,2) DEFAULT 20,
    "line_total" numeric(15,2) GENERATED ALWAYS AS ("round"((("quantity" * "unit_price") * ((1)::numeric - ("discount_rate" / (100)::numeric))), 2)) STORED,
    "sku" "text",
    "supplier_reference" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_discount_rate_item_purch" CHECK ((("discount_rate" >= (0)::numeric) AND ("discount_rate" <= (100)::numeric))),
    CONSTRAINT "valid_item_type_purch" CHECK (("item_type" = ANY (ARRAY['service'::"text", 'product'::"text"]))),
    CONSTRAINT "valid_quantity_purch" CHECK (("quantity" > (0)::numeric)),
    CONSTRAINT "valid_tax_rate_item_purch" CHECK ((("tax_rate" >= (0)::numeric) AND ("tax_rate" <= (100)::numeric))),
    CONSTRAINT "valid_unit_price_purch" CHECK (("unit_price" >= (0)::numeric))
);


ALTER TABLE "public"."purchase_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_id" "uuid",
    "supplier_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "order_number" "text" NOT NULL,
    "order_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "requested_delivery_date" "date",
    "confirmed_delivery_date" "date",
    "status" "text" DEFAULT 'pending'::"text",
    "total_amount" numeric(15,2) DEFAULT 0,
    "currency" "text" DEFAULT 'EUR'::"text",
    "notes" "text",
    "delivery_instructions" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_po_status" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'delivered'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."purchase_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_receipts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_id" "uuid",
    "purchase_order_id" "uuid",
    "supplier_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "receipt_number" "text" NOT NULL,
    "receipt_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "status" "text" DEFAULT 'partial'::"text",
    "notes" "text",
    "received_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_receipt_status" CHECK (("status" = ANY (ARRAY['partial'::"text", 'complete'::"text", 'damaged'::"text"])))
);


ALTER TABLE "public"."purchase_receipts" OWNER TO "postgres";


COMMENT ON TABLE "public"."purchase_receipts" IS 'SÉCURISÉ: RLS activé, accès par entreprise';



CREATE TABLE IF NOT EXISTS "public"."purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "supplier_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "purchase_number" "text" NOT NULL,
    "purchase_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "due_date" "date",
    "delivery_date" "date",
    "subtotal_amount" numeric(15,2) DEFAULT 0,
    "tax_amount" numeric(15,2) DEFAULT 0,
    "discount_amount" numeric(15,2) DEFAULT 0,
    "total_amount" numeric(15,2) DEFAULT 0,
    "currency" "text" DEFAULT 'EUR'::"text",
    "tax_rate" numeric(5,2) DEFAULT 20,
    "discount_rate" numeric(5,2) DEFAULT 0,
    "status" "text" DEFAULT 'draft'::"text",
    "payment_status" "text" DEFAULT 'pending'::"text",
    "notes" "text",
    "internal_notes" "text",
    "sent_at" timestamp with time zone,
    "received_at" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_amounts" CHECK ((("subtotal_amount" >= (0)::numeric) AND ("tax_amount" >= (0)::numeric) AND ("discount_amount" >= (0)::numeric) AND ("total_amount" >= (0)::numeric))),
    CONSTRAINT "valid_discount_rate_purch" CHECK ((("discount_rate" >= (0)::numeric) AND ("discount_rate" <= (100)::numeric))),
    CONSTRAINT "valid_payment_status" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'partial'::"text", 'paid'::"text", 'overdue'::"text"]))),
    CONSTRAINT "valid_purchase_status" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'confirmed'::"text", 'delivered'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "valid_tax_rate" CHECK ((("tax_rate" >= (0)::numeric) AND ("tax_rate" <= (100)::numeric)))
);


ALTER TABLE "public"."purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quote_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quote_id" "uuid" NOT NULL,
    "item_type" "text" DEFAULT 'service'::"text",
    "name" "text" NOT NULL,
    "description" "text",
    "sku" "text",
    "quantity" numeric(10,3) DEFAULT 1,
    "unit_price" numeric(15,2) NOT NULL,
    "discount_rate" numeric(5,2) DEFAULT 0,
    "tax_rate" numeric(5,2) DEFAULT 20.0,
    "line_total" numeric(15,2) GENERATED ALWAYS AS ((("quantity" * "unit_price") * ((1)::numeric - ("discount_rate" / (100)::numeric)))) STORED,
    "line_order" integer DEFAULT 1,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_discount_rate" CHECK ((("discount_rate" >= (0)::numeric) AND ("discount_rate" <= (100)::numeric))),
    CONSTRAINT "valid_item_type" CHECK (("item_type" = ANY (ARRAY['service'::"text", 'product'::"text"]))),
    CONSTRAINT "valid_quantity" CHECK (("quantity" > (0)::numeric)),
    CONSTRAINT "valid_tax_rate" CHECK ((("tax_rate" >= (0)::numeric) AND ("tax_rate" <= (100)::numeric))),
    CONSTRAINT "valid_unit_price" CHECK (("unit_price" >= (0)::numeric))
);


ALTER TABLE "public"."quote_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quotes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quote_number" "text" NOT NULL,
    "title" "text",
    "description" "text",
    "customer_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "quote_date" "date" DEFAULT CURRENT_DATE,
    "valid_until" "date",
    "subtotal_amount" numeric(15,2) DEFAULT 0,
    "tax_amount" numeric(15,2) DEFAULT 0,
    "discount_amount" numeric(15,2) DEFAULT 0,
    "total_amount" numeric(15,2) DEFAULT 0,
    "status" "text" DEFAULT 'draft'::"text",
    "sent_at" timestamp with time zone,
    "viewed_at" timestamp with time zone,
    "accepted_at" timestamp with time zone,
    "rejected_at" timestamp with time zone,
    "currency" "text" DEFAULT 'EUR'::"text",
    "tax_rate" numeric(5,2) DEFAULT 20.0,
    "payment_terms" integer DEFAULT 30,
    "notes" "text",
    "internal_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "valid_quote_amounts" CHECK ((("subtotal_amount" >= (0)::numeric) AND ("tax_amount" >= (0)::numeric) AND ("total_amount" >= (0)::numeric))),
    CONSTRAINT "valid_quote_status" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'accepted'::"text", 'rejected'::"text", 'expired'::"text"]))),
    CONSTRAINT "valid_tax_rate" CHECK ((("tax_rate" >= (0)::numeric) AND ("tax_rate" <= (100)::numeric)))
);


ALTER TABLE "public"."quotes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."report_cache" (
    "id" integer NOT NULL,
    "cache_key" "text" NOT NULL,
    "report_id" "text" NOT NULL,
    "company_id" "uuid",
    "result" "jsonb" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."report_cache" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."report_cache_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."report_cache_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."report_cache_id_seq" OWNED BY "public"."report_cache"."id";



CREATE TABLE IF NOT EXISTS "public"."report_executions" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "report_id" "text" NOT NULL,
    "company_id" "uuid",
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "parameters" "jsonb" NOT NULL,
    "result" "jsonb",
    "error" "text",
    "progress" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "report_executions_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100))),
    CONSTRAINT "report_executions_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'generating'::"text", 'completed'::"text", 'failed'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."report_executions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."report_templates" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "frequency" "text" NOT NULL,
    "complexity" "text" NOT NULL,
    "estimated_duration" integer DEFAULT 30 NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "report_templates_complexity_check" CHECK (("complexity" = ANY (ARRAY['simple'::"text", 'medium'::"text", 'complex'::"text"])))
);


ALTER TABLE "public"."report_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resource_allocations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "task_id" "uuid",
    "resource_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "quantity_allocated" numeric(8,2) NOT NULL,
    "allocation_percentage" numeric(5,2) DEFAULT 100.00,
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "unit_cost" numeric(15,2),
    "total_cost" numeric(15,2),
    "status" "text" DEFAULT 'planned'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."resource_allocations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rfa_calculations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "calculation_period" "text" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "turnover_amount" numeric(15,2) NOT NULL,
    "base_amount" numeric(15,2),
    "currency" "text" DEFAULT 'EUR'::"text",
    "rfa_percentage" numeric(5,2),
    "rfa_amount" numeric(15,2) NOT NULL,
    "calculation_method" "text" DEFAULT 'progressive'::"text",
    "calculation_details" "jsonb" DEFAULT '{}'::"jsonb",
    "adjustments" "jsonb" DEFAULT '[]'::"jsonb",
    "bonuses" "jsonb" DEFAULT '[]'::"jsonb",
    "status" "text" DEFAULT 'calculated'::"text",
    "validated_by" "uuid",
    "validated_at" timestamp with time zone,
    "dispute_reason" "text",
    "invoice_id" "uuid",
    "invoiced" boolean DEFAULT false,
    "invoice_date" "date",
    "payment_due_date" "date",
    "paid" boolean DEFAULT false,
    "payment_date" "date",
    "reference_documents" "text"[],
    "calculation_notes" "text",
    "calculated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "rfa_calculations_calculation_method_check" CHECK (("calculation_method" = ANY (ARRAY['progressive'::"text", 'fixed'::"text", 'custom'::"text"]))),
    CONSTRAINT "rfa_calculations_rfa_amount_check" CHECK (("rfa_amount" >= (0)::numeric)),
    CONSTRAINT "rfa_calculations_rfa_percentage_check" CHECK ((("rfa_percentage" >= (0)::numeric) AND ("rfa_percentage" <= (100)::numeric))),
    CONSTRAINT "rfa_calculations_status_check" CHECK (("status" = ANY (ARRAY['calculated'::"text", 'validated'::"text", 'disputed'::"text", 'paid'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "rfa_calculations_turnover_amount_check" CHECK (("turnover_amount" >= (0)::numeric))
);


ALTER TABLE "public"."rfa_calculations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"(),
    "granted_by" "uuid"
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "is_system" boolean DEFAULT false,
    "is_default" boolean DEFAULT false,
    "level" integer DEFAULT 0,
    "permissions_count" integer DEFAULT 0,
    "color" "text" DEFAULT '#6B7280'::"text",
    "icon" "text" DEFAULT 'User'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sectors_catalog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sector_code" "text" NOT NULL,
    "sector_name" "text" NOT NULL,
    "sector_name_english" "text",
    "category" "text" NOT NULL,
    "subcategory" "text",
    "parent_sector_code" "text",
    "typical_size_ranges" "text"[],
    "common_modules" "text"[],
    "regulatory_requirements" "text"[],
    "description" "text",
    "keywords" "text"[],
    "is_active" boolean DEFAULT true,
    "priority_order" integer DEFAULT 100,
    "company_count" integer DEFAULT 0,
    "last_usage_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sectors_catalog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_configurations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "config_name" "text" NOT NULL,
    "config_type" "text" NOT NULL,
    "configuration" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_enforced" boolean DEFAULT true,
    "compliance_standard" "text",
    "last_reviewed" timestamp with time zone,
    "review_frequency_days" integer DEFAULT 90,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid",
    CONSTRAINT "security_configurations_config_type_check" CHECK (("config_type" = ANY (ARRAY['password_policy'::"text", 'session_policy'::"text", 'access_control'::"text", 'encryption'::"text", 'audit'::"text"])))
);


ALTER TABLE "public"."security_configurations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_category" "text" NOT NULL,
    "severity_level" "text" NOT NULL,
    "event_code" "text" NOT NULL,
    "user_id" "uuid",
    "session_id" "text",
    "company_id" "uuid",
    "event_description" "text" NOT NULL,
    "event_details" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "request_path" "text",
    "request_method" "text",
    "response_status" integer,
    "country_code" "text",
    "region" "text",
    "city" "text",
    "impact_assessment" "text",
    "response_actions" "text"[],
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "correlation_id" "text",
    "related_events" "uuid"[],
    "event_timestamp" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "alert_sent" boolean DEFAULT false,
    "alert_recipients" "text"[],
    "is_false_positive" boolean DEFAULT false,
    "requires_investigation" boolean DEFAULT false
);


ALTER TABLE "public"."security_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."serial_numbers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "product_variant_id" "uuid",
    "warehouse_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "serial_number" "text" NOT NULL,
    "batch_number" "text",
    "lot_number" "text",
    "status" "text" DEFAULT 'available'::"text",
    "manufacture_date" "date",
    "expiry_date" "date",
    "received_date" "date",
    "sold_date" "date",
    "supplier_id" "uuid",
    "customer_id" "uuid",
    "purchase_reference" "text",
    "sale_reference" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_serial_status" CHECK (("status" = ANY (ARRAY['available'::"text", 'reserved'::"text", 'sold'::"text", 'returned'::"text", 'damaged'::"text", 'recalled'::"text"])))
);


ALTER TABLE "public"."serial_numbers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "service_type" "text" DEFAULT 'api'::"text",
    "is_active" boolean DEFAULT true,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "rate_limits" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "expires_at" timestamp with time zone,
    "last_used" timestamp with time zone,
    CONSTRAINT "service_accounts_service_type_check" CHECK (("service_type" = ANY (ARRAY['api'::"text", 'integration'::"text", 'webhook'::"text", 'cron'::"text"])))
);


ALTER TABLE "public"."service_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."skill_assessments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "assessor_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "skill_name" "text" NOT NULL,
    "skill_category" "text",
    "skill_level" "text" NOT NULL,
    "current_score" numeric(3,1) NOT NULL,
    "target_score" numeric(3,1),
    "assessment_method" "text" DEFAULT 'manager_review'::"text",
    "assessment_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "evidence_provided" "text",
    "certification_reference" "text",
    "validation_date" "date",
    "validated_by" "uuid",
    "improvement_plan" "text",
    "recommended_actions" "text"[],
    "target_achievement_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "skill_assessments_assessment_method_check" CHECK (("assessment_method" = ANY (ARRAY['self_assessment'::"text", 'manager_review'::"text", 'peer_review'::"text", 'test'::"text", 'certification'::"text", '360_feedback'::"text"]))),
    CONSTRAINT "skill_assessments_current_score_check" CHECK ((("current_score" >= (0)::numeric) AND ("current_score" <= (5)::numeric))),
    CONSTRAINT "skill_assessments_skill_level_check" CHECK (("skill_level" = ANY (ARRAY['beginner'::"text", 'intermediate'::"text", 'advanced'::"text", 'expert'::"text"]))),
    CONSTRAINT "skill_assessments_target_score_check" CHECK ((("target_score" >= (0)::numeric) AND ("target_score" <= (5)::numeric)))
);


ALTER TABLE "public"."skill_assessments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."smart_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "alert_type" "text" NOT NULL,
    "severity" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "data_source" "text",
    "alert_data" "jsonb" DEFAULT '{}'::"jsonb",
    "suggested_actions" "jsonb" DEFAULT '[]'::"jsonb",
    "ai_model_used" "text" DEFAULT 'casskai-ai'::"text",
    "confidence_score" numeric(3,2) DEFAULT 0.0,
    "is_read" boolean DEFAULT false,
    "is_dismissed" boolean DEFAULT false,
    "auto_resolve" boolean DEFAULT false,
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "expires_at" timestamp with time zone,
    "triggered_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "smart_alerts_alert_type_check" CHECK (("alert_type" = ANY (ARRAY['anomaly'::"text", 'threshold'::"text", 'trend'::"text", 'opportunity'::"text", 'risk'::"text"]))),
    CONSTRAINT "smart_alerts_severity_check" CHECK (("severity" = ANY (ARRAY['info'::"text", 'warning'::"text", 'error'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."smart_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "product_variant_id" "uuid",
    "warehouse_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "alert_type" "text" NOT NULL,
    "severity" "text" DEFAULT 'medium'::"text" NOT NULL,
    "current_stock" numeric(15,3) NOT NULL,
    "threshold_stock" numeric(15,3) NOT NULL,
    "is_active" boolean DEFAULT true,
    "is_acknowledged" boolean DEFAULT false,
    "acknowledged_by" "uuid",
    "acknowledged_at" timestamp with time zone,
    "triggered_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_alert_type" CHECK (("alert_type" = ANY (ARRAY['low_stock'::"text", 'out_of_stock'::"text", 'overstock'::"text", 'expiring_soon'::"text"]))),
    CONSTRAINT "valid_severity" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."stock_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_customer_id" "text" NOT NULL,
    "customer_email" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stripe_customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supplier_contact_persons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "supplier_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "job_title" "text",
    "department" "text",
    "email" "text",
    "phone" "text",
    "mobile" "text",
    "is_primary" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."supplier_contact_persons" OWNER TO "postgres";


COMMENT ON TABLE "public"."supplier_contact_persons" IS 'SÉCURISÉ: RLS activé, accès par entreprise via supplier';



CREATE TABLE IF NOT EXISTS "public"."supplier_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_id" "uuid" NOT NULL,
    "supplier_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "payment_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "currency" "text" DEFAULT 'EUR'::"text",
    "payment_method" "text" DEFAULT 'bank_transfer'::"text",
    "reference" "text",
    "bank_reference" "text",
    "status" "text" DEFAULT 'completed'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_payment_amount_supp" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "valid_payment_method_supp" CHECK (("payment_method" = ANY (ARRAY['bank_transfer'::"text", 'check'::"text", 'cash'::"text", 'card'::"text", 'other'::"text"]))),
    CONSTRAINT "valid_payment_status_supp" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."supplier_payments" OWNER TO "postgres";


COMMENT ON TABLE "public"."supplier_payments" IS 'SÉCURISÉ: RLS activé, accès par entreprise';



CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "supplier_number" "text" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "company_name" "text",
    "tax_number" "text",
    "registration_number" "text",
    "billing_address_line1" "text",
    "billing_address_line2" "text",
    "billing_city" "text",
    "billing_postal_code" "text",
    "billing_country" "text" DEFAULT 'FR'::"text",
    "shipping_address_line1" "text",
    "shipping_address_line2" "text",
    "shipping_city" "text",
    "shipping_postal_code" "text",
    "shipping_country" "text" DEFAULT 'FR'::"text",
    "supplier_type" "text" DEFAULT 'company'::"text",
    "payment_terms" integer DEFAULT 30,
    "currency" "text" DEFAULT 'EUR'::"text",
    "discount_rate" numeric(5,2) DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "account_balance" numeric(15,2) DEFAULT 0,
    "notes" "text",
    "internal_notes" "text",
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_discount_rate" CHECK ((("discount_rate" >= (0)::numeric) AND ("discount_rate" <= (100)::numeric))),
    CONSTRAINT "valid_payment_terms" CHECK ((("payment_terms" > 0) AND ("payment_terms" <= 365))),
    CONSTRAINT "valid_supplier_type" CHECK (("supplier_type" = ANY (ARRAY['company'::"text", 'individual'::"text"])))
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."survey_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "survey_id" "uuid" NOT NULL,
    "employee_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "responses" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "response_date" timestamp with time zone DEFAULT "now"(),
    "completion_time_minutes" integer,
    "ip_address" "inet",
    "user_agent" "text",
    "is_complete" boolean DEFAULT false,
    "completion_percentage" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."survey_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_configurations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "config_key" "text" NOT NULL,
    "config_value" "jsonb" NOT NULL,
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "description" "text",
    "data_type" "text" DEFAULT 'string'::"text" NOT NULL,
    "is_encrypted" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "requires_restart" boolean DEFAULT false,
    "validation_rules" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "system_configurations_data_type_check" CHECK (("data_type" = ANY (ARRAY['string'::"text", 'number'::"text", 'boolean'::"text", 'json'::"text", 'array'::"text"])))
);


ALTER TABLE "public"."system_configurations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "original_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size" bigint NOT NULL,
    "mime_type" "text" NOT NULL,
    "description" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "version" integer DEFAULT 1,
    "is_latest_version" boolean DEFAULT true,
    "is_public" boolean DEFAULT false,
    "download_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "uploaded_by" "uuid" NOT NULL
);


ALTER TABLE "public"."task_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_checklists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "item_text" "text" NOT NULL,
    "item_order" integer DEFAULT 1 NOT NULL,
    "is_completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "completed_by" "uuid",
    "is_required" boolean DEFAULT false,
    "blocks_task_completion" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."task_checklists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "parent_comment_id" "uuid",
    "content" "text" NOT NULL,
    "content_type" "text" DEFAULT 'text'::"text",
    "is_internal" boolean DEFAULT false,
    "is_system" boolean DEFAULT false,
    "mention_users" "uuid"[] DEFAULT '{}'::"uuid"[],
    "is_edited" boolean DEFAULT false,
    "is_deleted" boolean DEFAULT false,
    "reactions" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."task_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_dependencies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "predecessor_task_id" "uuid" NOT NULL,
    "successor_task_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "dependency_type" "text" DEFAULT 'finish_to_start'::"text" NOT NULL,
    "lag_days" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."task_dependencies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_statuses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#3B82F6'::"text" NOT NULL,
    "icon" "text",
    "is_initial" boolean DEFAULT false,
    "is_final" boolean DEFAULT false,
    "is_cancelled" boolean DEFAULT false,
    "stops_time_tracking" boolean DEFAULT false,
    "progress_percentage" integer DEFAULT 0,
    "auto_complete_subtasks" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."task_statuses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#6B7280'::"text" NOT NULL,
    "icon" "text",
    "default_estimated_hours" numeric(8,2) DEFAULT 8.00,
    "default_hourly_rate" numeric(8,2),
    "requires_approval" boolean DEFAULT false,
    "default_status" "text" DEFAULT 'todo'::"text",
    "allowed_statuses" "text"[] DEFAULT '{todo,in_progress,review,done}'::"text"[],
    "is_active" boolean DEFAULT true,
    "is_system" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."task_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tax_declarations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "declaration_type" "text" NOT NULL,
    "period_type" "text" NOT NULL,
    "year" integer NOT NULL,
    "month" integer,
    "quarter" integer,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "due_date" "date" NOT NULL,
    "submission_date" "date",
    "tax_base" numeric(15,2) DEFAULT 0,
    "tax_amount" numeric(15,2) DEFAULT 0,
    "status" "text" DEFAULT 'draft'::"text",
    "declaration_data" "jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tax_declarations_period_type_check" CHECK (("period_type" = ANY (ARRAY['monthly'::"text", 'quarterly'::"text", 'yearly'::"text"]))),
    CONSTRAINT "tax_declarations_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'submitted'::"text", 'accepted'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."tax_declarations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tax_optimizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "optimization_type" "text" NOT NULL,
    "category" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "detailed_explanation" "text",
    "legal_basis" "text",
    "potential_savings" numeric(15,2) DEFAULT 0 NOT NULL,
    "savings_type" "text",
    "risk_level" "text",
    "complexity" "text",
    "effort_required" "text",
    "estimated_time" "text",
    "requirements" "jsonb" DEFAULT '[]'::"jsonb",
    "implementation_steps" "jsonb" DEFAULT '[]'::"jsonb",
    "deadline" "date",
    "optimal_timing" "text",
    "status" "text" DEFAULT 'suggested'::"text" NOT NULL,
    "implemented_at" timestamp with time zone,
    "implemented_by" "uuid",
    "actual_savings" numeric(15,2),
    "ai_confidence" numeric(3,2) DEFAULT 0.0,
    "validated_by_expert" boolean DEFAULT false,
    "expert_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tax_optimizations_complexity_check" CHECK (("complexity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "tax_optimizations_effort_required_check" CHECK (("effort_required" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "tax_optimizations_optimization_type_check" CHECK (("optimization_type" = ANY (ARRAY['deduction'::"text", 'credit'::"text", 'timing'::"text", 'structure'::"text", 'planning'::"text"]))),
    CONSTRAINT "tax_optimizations_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "tax_optimizations_savings_type_check" CHECK (("savings_type" = ANY (ARRAY['immediate'::"text", 'annual'::"text", 'one_time'::"text"]))),
    CONSTRAINT "tax_optimizations_status_check" CHECK (("status" = ANY (ARRAY['suggested'::"text", 'in_progress'::"text", 'completed'::"text", 'dismissed'::"text", 'implemented'::"text"])))
);


ALTER TABLE "public"."tax_optimizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tax_rates_catalog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "country_code" "text" NOT NULL,
    "tax_name" "text" NOT NULL,
    "tax_type" "text" NOT NULL,
    "tax_rate" numeric(5,3) NOT NULL,
    "is_default" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "min_threshold" numeric(15,2),
    "max_threshold" numeric(15,2),
    "valid_from" "date" DEFAULT CURRENT_DATE,
    "valid_until" "date",
    "description" "text",
    "application_rules" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tax_rates_catalog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."third_parties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "legal_name" "text",
    "siret" "text",
    "vat_number" "text",
    "email" "text",
    "phone" "text",
    "mobile" "text",
    "website" "text",
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "postal_code" "text",
    "country" "text" DEFAULT 'FR'::"text",
    "payment_terms" integer DEFAULT 30,
    "discount_percent" numeric(5,2) DEFAULT 0,
    "credit_limit" numeric(15,2),
    "customer_account_id" "uuid",
    "supplier_account_id" "uuid",
    "current_balance" numeric(15,2) DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "client_type" "text" DEFAULT 'prospect'::"text",
    CONSTRAINT "third_parties_client_type_check" CHECK (("client_type" = ANY (ARRAY['customer'::"text", 'prospect'::"text", 'supplier'::"text", 'partner'::"text"]))),
    CONSTRAINT "third_parties_type_check" CHECK (("type" = ANY (ARRAY['customer'::"text", 'supplier'::"text", 'both'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."third_parties" OWNER TO "postgres";


COMMENT ON TABLE "public"."third_parties" IS 'Clients, fournisseurs et autres tiers';



CREATE TABLE IF NOT EXISTS "public"."third_party_addresses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "supplier_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "address_type" "text" DEFAULT 'other'::"text" NOT NULL,
    "address_label" "text",
    "address_line1" "text" NOT NULL,
    "address_line2" "text",
    "city" "text" NOT NULL,
    "postal_code" "text" NOT NULL,
    "country" "text" DEFAULT 'FR'::"text",
    "is_default" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "address_belongs_to_one_party" CHECK (((("customer_id" IS NOT NULL) AND ("supplier_id" IS NULL)) OR (("customer_id" IS NULL) AND ("supplier_id" IS NOT NULL)))),
    CONSTRAINT "valid_address_type" CHECK (("address_type" = ANY (ARRAY['billing'::"text", 'shipping'::"text", 'office'::"text", 'warehouse'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."third_party_addresses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."third_party_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#3B82F6'::"text",
    "is_active" boolean DEFAULT true,
    "is_default" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "applies_to_customers" boolean DEFAULT true,
    "applies_to_suppliers" boolean DEFAULT true,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."third_party_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."third_party_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "supplier_id" "uuid",
    "company_id" "uuid" NOT NULL,
    "document_name" "text" NOT NULL,
    "document_type" "text" NOT NULL,
    "file_path" "text",
    "file_size" integer,
    "mime_type" "text",
    "description" "text",
    "expiry_date" "date",
    "is_confidential" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "document_belongs_to_one_party" CHECK (((("customer_id" IS NOT NULL) AND ("supplier_id" IS NULL)) OR (("customer_id" IS NULL) AND ("supplier_id" IS NOT NULL)))),
    CONSTRAINT "valid_document_type" CHECK (("document_type" = ANY (ARRAY['contract'::"text", 'certificate'::"text", 'tax_form'::"text", 'identity'::"text", 'insurance'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."third_party_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."time_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "work_date" "date" NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "break_duration_minutes" integer DEFAULT 0,
    "total_hours" numeric(4,2) GENERATED ALWAYS AS (
CASE
    WHEN (("start_time" IS NOT NULL) AND ("end_time" IS NOT NULL)) THEN ((EXTRACT(epoch FROM ("end_time" - "start_time")) / (3600)::numeric) - (("break_duration_minutes")::numeric / (60)::numeric))
    ELSE (0)::numeric
END) STORED,
    "entry_type" "text" DEFAULT 'manual'::"text",
    "location" "text",
    "coordinates" "jsonb",
    "is_approved" boolean DEFAULT false,
    "approved_by" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "time_tracking_break_duration_minutes_check" CHECK (("break_duration_minutes" >= 0)),
    CONSTRAINT "time_tracking_entry_type_check" CHECK (("entry_type" = ANY (ARRAY['manual'::"text", 'clock_in'::"text", 'clock_out'::"text", 'automatic'::"text"])))
);


ALTER TABLE "public"."time_tracking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."timezones_catalog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "timezone_name" "text" NOT NULL,
    "timezone_display" "text" NOT NULL,
    "timezone_code" "text",
    "utc_offset_minutes" integer NOT NULL,
    "dst_offset_minutes" integer,
    "dst_start_rule" "text",
    "dst_end_rule" "text",
    "continent" "text",
    "country_codes" "text"[],
    "major_cities" "text"[],
    "is_active" boolean DEFAULT true,
    "is_popular" boolean DEFAULT false,
    "priority_order" integer DEFAULT 100,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."timezones_catalog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."training_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "training_title" "text" NOT NULL,
    "training_provider" "text",
    "training_category" "text",
    "training_type" "text" DEFAULT 'external'::"text",
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "duration_hours" numeric(6,2),
    "cost" numeric(15,2) DEFAULT 0,
    "currency" "text" DEFAULT 'EUR'::"text",
    "budget_approved_by" "uuid",
    "status" "text" DEFAULT 'planned'::"text",
    "completion_percentage" integer DEFAULT 0,
    "score" numeric(5,2),
    "max_score" numeric(5,2),
    "passed" boolean,
    "certificate_number" "text",
    "certificate_expiry_date" "date",
    "certificate_path" "text",
    "skills_acquired" "text"[],
    "competency_improvement" "jsonb" DEFAULT '{}'::"jsonb",
    "business_impact" "text",
    "roi_estimated" numeric(15,2),
    "employee_feedback" "text",
    "employee_rating" integer,
    "trainer_feedback" "text",
    "manager_feedback" "text",
    "is_mandatory" boolean DEFAULT false,
    "renewal_required" boolean DEFAULT false,
    "renewal_frequency_months" integer,
    "next_due_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "training_records_completion_percentage_check" CHECK ((("completion_percentage" >= 0) AND ("completion_percentage" <= 100))),
    CONSTRAINT "training_records_employee_rating_check" CHECK ((("employee_rating" >= 1) AND ("employee_rating" <= 5))),
    CONSTRAINT "training_records_status_check" CHECK (("status" = ANY (ARRAY['planned'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text", 'expired'::"text"]))),
    CONSTRAINT "training_records_training_type_check" CHECK (("training_type" = ANY (ARRAY['internal'::"text", 'external'::"text", 'online'::"text", 'on_job'::"text", 'conference'::"text", 'workshop'::"text"])))
);


ALTER TABLE "public"."training_records" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."unified_third_parties_view" AS
 SELECT 'customer'::"text" AS "party_type",
    "c"."id",
    "c"."company_id",
    "c"."customer_number" AS "party_number",
    "c"."name",
    "c"."email",
    "c"."phone",
    "c"."company_name",
    "c"."tax_number",
    "c"."billing_address_line1" AS "primary_address_line1",
    "c"."billing_city" AS "primary_city",
    "c"."billing_postal_code" AS "primary_postal_code",
    "c"."billing_country" AS "primary_country",
    "c"."payment_terms",
    'EUR'::"text" AS "currency",
    NULL::numeric AS "discount_rate",
    "c"."is_active",
    "c"."notes",
    COALESCE("client_stats"."total_amount", (0)::numeric) AS "total_amount",
    COALESCE("client_stats"."transaction_count", (0)::bigint) AS "transaction_count",
    COALESCE("client_stats"."balance", (0)::numeric) AS "balance",
    "c"."created_at",
    "c"."updated_at"
   FROM ("public"."customers" "c"
     LEFT JOIN ( SELECT "i"."customer_id",
            "sum"("i"."total_amount") AS "total_amount",
            "count"(*) AS "transaction_count",
            "sum"(
                CASE
                    WHEN ("i"."status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'viewed'::"text"])) THEN "i"."total_amount"
                    ELSE (0)::numeric
                END) AS "balance"
           FROM "public"."invoices" "i"
          WHERE ("i"."status" <> 'cancelled'::"text")
          GROUP BY "i"."customer_id") "client_stats" ON (("c"."id" = "client_stats"."customer_id")))
UNION ALL
 SELECT 'supplier'::"text" AS "party_type",
    "s"."id",
    "s"."company_id",
    "s"."supplier_number" AS "party_number",
    "s"."name",
    "s"."email",
    "s"."phone",
    "s"."company_name",
    "s"."tax_number",
    "s"."billing_address_line1" AS "primary_address_line1",
    "s"."billing_city" AS "primary_city",
    "s"."billing_postal_code" AS "primary_postal_code",
    "s"."billing_country" AS "primary_country",
    "s"."payment_terms",
    "s"."currency",
    "s"."discount_rate",
    "s"."is_active",
    "s"."notes",
    COALESCE("supplier_stats"."total_amount", (0)::numeric) AS "total_amount",
    COALESCE("supplier_stats"."transaction_count", (0)::bigint) AS "transaction_count",
    COALESCE("supplier_stats"."balance", (0)::numeric) AS "balance",
    "s"."created_at",
    "s"."updated_at"
   FROM ("public"."suppliers" "s"
     LEFT JOIN ( SELECT "p"."supplier_id",
            "sum"("p"."total_amount") AS "total_amount",
            "count"(*) AS "transaction_count",
            "sum"(
                CASE
                    WHEN ("p"."status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'confirmed'::"text"])) THEN "p"."total_amount"
                    ELSE (0)::numeric
                END) AS "balance"
           FROM "public"."purchases" "p"
          WHERE ("p"."status" <> 'cancelled'::"text")
          GROUP BY "p"."supplier_id") "supplier_stats" ON (("s"."id" = "supplier_stats"."supplier_id")));


ALTER VIEW "public"."unified_third_parties_view" OWNER TO "postgres";


COMMENT ON VIEW "public"."unified_third_parties_view" IS 'Vue sécurisée unifiée tiers - SECURITY INVOKER avec statistiques';



CREATE TABLE IF NOT EXISTS "public"."usage_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "feature_name" "text" NOT NULL,
    "current_usage" integer DEFAULT 0,
    "limit_value" integer,
    "last_reset_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."usage_tracking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "resource_type" "text",
    "resource_id" "uuid",
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "performed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_activity_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_activity_log" IS 'Journal d''activité des utilisateurs pour audit';



CREATE TABLE IF NOT EXISTS "public"."user_activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "company_id" "uuid",
    "activity_type" "text" NOT NULL,
    "resource_type" "text",
    "resource_id" "uuid",
    "action" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "session_id" "uuid",
    "risk_score" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_activity_logs_activity_type_check" CHECK (("activity_type" = ANY (ARRAY['login'::"text", 'logout'::"text", 'password_change'::"text", 'profile_update'::"text", 'permission_grant'::"text", 'permission_revoke'::"text", 'resource_access'::"text", 'data_export'::"text", 'admin_action'::"text"]))),
    CONSTRAINT "user_activity_logs_risk_score_check" CHECK ((("risk_score" >= 0) AND ("risk_score" <= 100)))
);


ALTER TABLE "public"."user_activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'viewer'::"text" NOT NULL,
    "is_default" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "invited_by" "uuid",
    "invited_at" timestamp with time zone,
    "last_activity" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'active'::"text",
    CONSTRAINT "user_companies_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'accountant'::"text", 'user'::"text", 'readonly'::"text"]))),
    CONSTRAINT "user_companies_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'pending'::"text", 'suspended'::"text"])))
);


ALTER TABLE "public"."user_companies" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_companies" IS 'Relations utilisateurs-entreprises avec rôles';



COMMENT ON COLUMN "public"."user_companies"."role" IS 'Rôle de l''utilisateur dans l''entreprise (owner, admin, user, viewer)';



COMMENT ON COLUMN "public"."user_companies"."is_default" IS 'Indique si c''est l''entreprise par défaut pour cet utilisateur';



COMMENT ON COLUMN "public"."user_companies"."permissions" IS 'Permissions spécifiques JSON: {"read": ["module1"], "write": ["module2"]}';



COMMENT ON COLUMN "public"."user_companies"."invited_by" IS 'Utilisateur qui a invité ce membre';



COMMENT ON COLUMN "public"."user_companies"."status" IS 'Statut du membre dans l''entreprise';



CREATE TABLE IF NOT EXISTS "public"."user_deletion_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"(),
    "scheduled_deletion_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval) NOT NULL,
    "reason" "text",
    "companies_to_transfer" "jsonb" DEFAULT '[]'::"jsonb",
    "export_requested" boolean DEFAULT true,
    "export_generated_at" timestamp with time zone,
    "export_download_url" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "processed_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "cancellation_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_deletion_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."user_deletion_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_deletion_requests" IS 'Demandes de suppression de compte utilisateur avec période de grâce';



CREATE TABLE IF NOT EXISTS "public"."user_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email_new_transactions" boolean DEFAULT true,
    "email_weekly_reports" boolean DEFAULT true,
    "email_system_updates" boolean DEFAULT false,
    "email_marketing" boolean DEFAULT false,
    "email_invoices" boolean DEFAULT true,
    "email_payments" boolean DEFAULT true,
    "email_reminders" boolean DEFAULT true,
    "push_new_transactions" boolean DEFAULT false,
    "push_alerts" boolean DEFAULT true,
    "push_reminders" boolean DEFAULT true,
    "push_system_updates" boolean DEFAULT false,
    "notification_frequency" "text" DEFAULT 'daily'::"text",
    "quiet_hours_enabled" boolean DEFAULT false,
    "quiet_hours_start" time without time zone DEFAULT '22:00:00'::time without time zone,
    "quiet_hours_end" time without time zone DEFAULT '08:00:00'::time without time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_notifications_notification_frequency_check" CHECK (("notification_frequency" = ANY (ARRAY['immediate'::"text", 'daily'::"text", 'weekly'::"text"]))),
    CONSTRAINT "valid_quiet_hours" CHECK ((("quiet_hours_enabled" = false) OR (("quiet_hours_start" IS NOT NULL) AND ("quiet_hours_end" IS NOT NULL))))
);


ALTER TABLE "public"."user_notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_notifications" IS 'Préférences de notifications pour chaque utilisateur';



CREATE TABLE IF NOT EXISTS "public"."user_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "resource_scopes" "text"[],
    "ip_restrictions" "cidr"[],
    "time_restrictions" "jsonb",
    "valid_from" timestamp with time zone DEFAULT "now"(),
    "valid_until" timestamp with time zone,
    "granted_by" "uuid",
    "granted_at" timestamp with time zone DEFAULT "now"(),
    "last_used_at" timestamp with time zone,
    "usage_count" integer DEFAULT 0,
    "description" "text",
    "conditions" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "email_notifications" boolean DEFAULT true,
    "push_notifications" boolean DEFAULT true,
    "sms_notifications" boolean DEFAULT false,
    "notification_frequency" "text" DEFAULT 'immediate'::"text",
    "language" "text" DEFAULT 'fr'::"text",
    "currency" "text" DEFAULT 'EUR'::"text",
    "date_format" "text" DEFAULT 'DD/MM/YYYY'::"text",
    "number_format" "text" DEFAULT 'FR'::"text",
    "timezone" "text" DEFAULT 'Europe/Paris'::"text",
    "fiscal_year_start" "text" DEFAULT '01/01'::"text",
    "default_payment_terms" integer DEFAULT 30,
    "auto_backup" boolean DEFAULT true,
    "theme" "text" DEFAULT 'light'::"text",
    "compact_view" boolean DEFAULT false,
    "show_tooltips" boolean DEFAULT true,
    "auto_save" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_preferences_date_format_check" CHECK (("date_format" = ANY (ARRAY['DD/MM/YYYY'::"text", 'MM/DD/YYYY'::"text", 'YYYY-MM-DD'::"text"]))),
    CONSTRAINT "user_preferences_default_payment_terms_check" CHECK ((("default_payment_terms" >= 0) AND ("default_payment_terms" <= 365))),
    CONSTRAINT "user_preferences_fiscal_year_start_check" CHECK (("fiscal_year_start" ~ '^[0-9]{2}/[0-9]{2}$'::"text")),
    CONSTRAINT "user_preferences_language_check" CHECK (("language" = ANY (ARRAY['fr'::"text", 'en'::"text", 'es'::"text", 'de'::"text", 'it'::"text", 'pt'::"text"]))),
    CONSTRAINT "user_preferences_notification_frequency_check" CHECK (("notification_frequency" = ANY (ARRAY['immediate'::"text", 'daily'::"text", 'weekly'::"text", 'monthly'::"text"]))),
    CONSTRAINT "user_preferences_number_format_check" CHECK (("number_format" = ANY (ARRAY['FR'::"text", 'EN'::"text", 'DE'::"text", 'ES'::"text"]))),
    CONSTRAINT "user_preferences_theme_check" CHECK (("theme" = ANY (ARRAY['light'::"text", 'dark'::"text", 'auto'::"text"])))
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_preferences" IS 'Préférences utilisateur complètes - collectées par PreferencesStep mais jamais sauvegardées avant cette migration CRITIQUE';



COMMENT ON COLUMN "public"."user_preferences"."user_id" IS 'Référence utilisateur - OBLIGATOIRE';



COMMENT ON COLUMN "public"."user_preferences"."company_id" IS 'Référence entreprise - OPTIONNEL (préférences globales si NULL)';



COMMENT ON COLUMN "public"."user_preferences"."notification_frequency" IS 'Fréquence notifications: immediate, daily, weekly, monthly';



COMMENT ON COLUMN "public"."user_preferences"."language" IS 'Langue interface: fr, en, es, de, it, pt';



COMMENT ON COLUMN "public"."user_preferences"."date_format" IS 'Format date: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD';



COMMENT ON COLUMN "public"."user_preferences"."fiscal_year_start" IS 'Début année fiscale: format DD/MM (ex: 01/01, 01/04)';



CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_token" "text" NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "device_type" "text",
    "device_fingerprint" "text",
    "location" "jsonb",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "last_activity" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "logout_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_id" "text",
    "status" "text" DEFAULT 'trialing'::"text" NOT NULL,
    "trial_start" timestamp with time zone,
    "trial_end" timestamp with time zone,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "stripe_subscription_id" "text",
    "stripe_customer_id" "text",
    "cancel_at_period_end" boolean DEFAULT false,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_subscriptions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_actuals_monthly" AS
 SELECT "je"."company_id",
    (EXTRACT(year FROM "je"."entry_date"))::integer AS "year",
    (EXTRACT(month FROM "je"."entry_date"))::integer AS "month",
    "jel"."account_number",
    "sum"(("jel"."debit_amount" - "jel"."credit_amount")) AS "amount_base"
   FROM ("public"."journal_entries" "je"
     JOIN "public"."journal_entry_lines" "jel" ON (("jel"."journal_entry_id" = "je"."id")))
  WHERE ("je"."status" = 'posted'::"text")
  GROUP BY "je"."company_id", ((EXTRACT(year FROM "je"."entry_date"))::integer), ((EXTRACT(month FROM "je"."entry_date"))::integer), "jel"."account_number";


ALTER VIEW "public"."v_actuals_monthly" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_actuals_by_category" AS
 SELECT "a"."company_id",
    "a"."year",
    "a"."month",
    "cam"."category_id",
    "sum"("a"."amount_base") AS "amount_actual"
   FROM ("public"."v_actuals_monthly" "a"
     JOIN "public"."category_account_map" "cam" ON ((("cam"."company_id" = "a"."company_id") AND ("cam"."account_code" = "a"."account_number"))))
  GROUP BY "a"."company_id", "a"."year", "a"."month", "cam"."category_id";


ALTER VIEW "public"."v_actuals_by_category" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_budget_by_category_monthly" AS
 SELECT "bc"."company_id",
    "bc"."budget_id",
    "b"."budget_year" AS "year",
    1 AS "month",
    "bc"."id" AS "category_id",
    "bc"."category" AS "category_code",
    "bc"."category" AS "category_name",
    "bc"."category_type",
    "bc"."monthly_amounts"[1] AS "amount_budget"
   FROM ("public"."budget_categories" "bc"
     JOIN "public"."budgets" "b" ON (("b"."id" = "bc"."budget_id")))
  WHERE (("bc"."monthly_amounts" IS NOT NULL) AND ("array_length"("bc"."monthly_amounts", 1) >= 1))
UNION ALL
 SELECT "bc"."company_id",
    "bc"."budget_id",
    "b"."budget_year" AS "year",
    2 AS "month",
    "bc"."id" AS "category_id",
    "bc"."category" AS "category_code",
    "bc"."category" AS "category_name",
    "bc"."category_type",
    "bc"."monthly_amounts"[2] AS "amount_budget"
   FROM ("public"."budget_categories" "bc"
     JOIN "public"."budgets" "b" ON (("b"."id" = "bc"."budget_id")))
  WHERE (("bc"."monthly_amounts" IS NOT NULL) AND ("array_length"("bc"."monthly_amounts", 1) >= 2))
UNION ALL
 SELECT "bc"."company_id",
    "bc"."budget_id",
    "b"."budget_year" AS "year",
    3 AS "month",
    "bc"."id" AS "category_id",
    "bc"."category" AS "category_code",
    "bc"."category" AS "category_name",
    "bc"."category_type",
    "bc"."monthly_amounts"[3] AS "amount_budget"
   FROM ("public"."budget_categories" "bc"
     JOIN "public"."budgets" "b" ON (("b"."id" = "bc"."budget_id")))
  WHERE (("bc"."monthly_amounts" IS NOT NULL) AND ("array_length"("bc"."monthly_amounts", 1) >= 3))
UNION ALL
 SELECT "bc"."company_id",
    "bc"."budget_id",
    "b"."budget_year" AS "year",
    4 AS "month",
    "bc"."id" AS "category_id",
    "bc"."category" AS "category_code",
    "bc"."category" AS "category_name",
    "bc"."category_type",
    "bc"."monthly_amounts"[4] AS "amount_budget"
   FROM ("public"."budget_categories" "bc"
     JOIN "public"."budgets" "b" ON (("b"."id" = "bc"."budget_id")))
  WHERE (("bc"."monthly_amounts" IS NOT NULL) AND ("array_length"("bc"."monthly_amounts", 1) >= 4))
UNION ALL
 SELECT "bc"."company_id",
    "bc"."budget_id",
    "b"."budget_year" AS "year",
    5 AS "month",
    "bc"."id" AS "category_id",
    "bc"."category" AS "category_code",
    "bc"."category" AS "category_name",
    "bc"."category_type",
    "bc"."monthly_amounts"[5] AS "amount_budget"
   FROM ("public"."budget_categories" "bc"
     JOIN "public"."budgets" "b" ON (("b"."id" = "bc"."budget_id")))
  WHERE (("bc"."monthly_amounts" IS NOT NULL) AND ("array_length"("bc"."monthly_amounts", 1) >= 5))
UNION ALL
 SELECT "bc"."company_id",
    "bc"."budget_id",
    "b"."budget_year" AS "year",
    6 AS "month",
    "bc"."id" AS "category_id",
    "bc"."category" AS "category_code",
    "bc"."category" AS "category_name",
    "bc"."category_type",
    "bc"."monthly_amounts"[6] AS "amount_budget"
   FROM ("public"."budget_categories" "bc"
     JOIN "public"."budgets" "b" ON (("b"."id" = "bc"."budget_id")))
  WHERE (("bc"."monthly_amounts" IS NOT NULL) AND ("array_length"("bc"."monthly_amounts", 1) >= 6))
UNION ALL
 SELECT "bc"."company_id",
    "bc"."budget_id",
    "b"."budget_year" AS "year",
    7 AS "month",
    "bc"."id" AS "category_id",
    "bc"."category" AS "category_code",
    "bc"."category" AS "category_name",
    "bc"."category_type",
    "bc"."monthly_amounts"[7] AS "amount_budget"
   FROM ("public"."budget_categories" "bc"
     JOIN "public"."budgets" "b" ON (("b"."id" = "bc"."budget_id")))
  WHERE (("bc"."monthly_amounts" IS NOT NULL) AND ("array_length"("bc"."monthly_amounts", 1) >= 7))
UNION ALL
 SELECT "bc"."company_id",
    "bc"."budget_id",
    "b"."budget_year" AS "year",
    8 AS "month",
    "bc"."id" AS "category_id",
    "bc"."category" AS "category_code",
    "bc"."category" AS "category_name",
    "bc"."category_type",
    "bc"."monthly_amounts"[8] AS "amount_budget"
   FROM ("public"."budget_categories" "bc"
     JOIN "public"."budgets" "b" ON (("b"."id" = "bc"."budget_id")))
  WHERE (("bc"."monthly_amounts" IS NOT NULL) AND ("array_length"("bc"."monthly_amounts", 1) >= 8))
UNION ALL
 SELECT "bc"."company_id",
    "bc"."budget_id",
    "b"."budget_year" AS "year",
    9 AS "month",
    "bc"."id" AS "category_id",
    "bc"."category" AS "category_code",
    "bc"."category" AS "category_name",
    "bc"."category_type",
    "bc"."monthly_amounts"[9] AS "amount_budget"
   FROM ("public"."budget_categories" "bc"
     JOIN "public"."budgets" "b" ON (("b"."id" = "bc"."budget_id")))
  WHERE (("bc"."monthly_amounts" IS NOT NULL) AND ("array_length"("bc"."monthly_amounts", 1) >= 9))
UNION ALL
 SELECT "bc"."company_id",
    "bc"."budget_id",
    "b"."budget_year" AS "year",
    10 AS "month",
    "bc"."id" AS "category_id",
    "bc"."category" AS "category_code",
    "bc"."category" AS "category_name",
    "bc"."category_type",
    "bc"."monthly_amounts"[10] AS "amount_budget"
   FROM ("public"."budget_categories" "bc"
     JOIN "public"."budgets" "b" ON (("b"."id" = "bc"."budget_id")))
  WHERE (("bc"."monthly_amounts" IS NOT NULL) AND ("array_length"("bc"."monthly_amounts", 1) >= 10))
UNION ALL
 SELECT "bc"."company_id",
    "bc"."budget_id",
    "b"."budget_year" AS "year",
    11 AS "month",
    "bc"."id" AS "category_id",
    "bc"."category" AS "category_code",
    "bc"."category" AS "category_name",
    "bc"."category_type",
    "bc"."monthly_amounts"[11] AS "amount_budget"
   FROM ("public"."budget_categories" "bc"
     JOIN "public"."budgets" "b" ON (("b"."id" = "bc"."budget_id")))
  WHERE (("bc"."monthly_amounts" IS NOT NULL) AND ("array_length"("bc"."monthly_amounts", 1) >= 11))
UNION ALL
 SELECT "bc"."company_id",
    "bc"."budget_id",
    "b"."budget_year" AS "year",
    12 AS "month",
    "bc"."id" AS "category_id",
    "bc"."category" AS "category_code",
    "bc"."category" AS "category_name",
    "bc"."category_type",
    "bc"."monthly_amounts"[12] AS "amount_budget"
   FROM ("public"."budget_categories" "bc"
     JOIN "public"."budgets" "b" ON (("b"."id" = "bc"."budget_id")))
  WHERE (("bc"."monthly_amounts" IS NOT NULL) AND ("array_length"("bc"."monthly_amounts", 1) >= 12));


ALTER VIEW "public"."v_budget_by_category_monthly" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."warehouses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "postal_code" "text",
    "country" "text" DEFAULT 'FR'::"text",
    "is_active" boolean DEFAULT true,
    "is_default" boolean DEFAULT false,
    "warehouse_type" "text" DEFAULT 'physical'::"text",
    "contact_person" "text",
    "contact_email" "text",
    "contact_phone" "text",
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_warehouse_type" CHECK (("warehouse_type" = ANY (ARRAY['physical'::"text", 'virtual'::"text", 'consignment'::"text", 'transit'::"text"])))
);


ALTER TABLE "public"."warehouses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "name" "text" NOT NULL,
    "webhook_url" "text" NOT NULL,
    "events" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "headers" "jsonb" DEFAULT '{}'::"jsonb",
    "secret_token" "text",
    "is_active" boolean DEFAULT true,
    "ssl_verification" boolean DEFAULT true,
    "retry_config" "jsonb" DEFAULT '{"max_retries": 3, "retry_delay": 300}'::"jsonb",
    "last_triggered" timestamp with time zone,
    "success_count" integer DEFAULT 0,
    "failure_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."webhook_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_executions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "template_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "trigger_data" "jsonb" DEFAULT '{}'::"jsonb",
    "execution_log" "jsonb" DEFAULT '[]'::"jsonb",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "error_message" "text",
    CONSTRAINT "workflow_executions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'running'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."workflow_executions" OWNER TO "postgres";


COMMENT ON TABLE "public"."workflow_executions" IS 'Exécutions des workflows automatisés';



CREATE TABLE IF NOT EXISTS "public"."workflow_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "template_name" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "workflow_definition" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "input_schema" "jsonb" DEFAULT '{}'::"jsonb",
    "output_schema" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "is_system" boolean DEFAULT false,
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."workflow_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."workflow_templates" IS 'Templates d\automatisation pour les workflows';



ALTER TABLE ONLY "public"."report_cache" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."report_cache_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."accounting_periods"
    ADD CONSTRAINT "accounting_periods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_company_id_account_number_key" UNIQUE ("company_id", "account_number");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_insights"
    ADD CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_interactions"
    ADD CONSTRAINT "ai_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_performance_metrics"
    ADD CONSTRAINT "ai_performance_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."alert_configurations"
    ADD CONSTRAINT "alert_configurations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytical_distributions"
    ADD CONSTRAINT "analytical_distributions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."anomaly_detections"
    ADD CONSTRAINT "anomaly_detections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_configurations"
    ADD CONSTRAINT "api_configurations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_employee_id_attendance_date_key" UNIQUE ("employee_id", "attendance_date");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_rules"
    ADD CONSTRAINT "automation_rules_company_id_rule_name_key" UNIQUE ("company_id", "rule_name");



ALTER TABLE ONLY "public"."automation_rules"
    ADD CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."available_features"
    ADD CONSTRAINT "available_features_pkey" PRIMARY KEY ("feature_name");



ALTER TABLE ONLY "public"."backup_configurations"
    ADD CONSTRAINT "backup_configurations_company_id_config_name_key" UNIQUE ("company_id", "config_name");



ALTER TABLE ONLY "public"."backup_configurations"
    ADD CONSTRAINT "backup_configurations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_accounts"
    ADD CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_alert_rules"
    ADD CONSTRAINT "bank_alert_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_audit_logs"
    ADD CONSTRAINT "bank_audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_auth_flows"
    ADD CONSTRAINT "bank_auth_flows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_balance_forecasts"
    ADD CONSTRAINT "bank_balance_forecasts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_cash_flow_analysis"
    ADD CONSTRAINT "bank_cash_flow_analysis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_categorization_rules"
    ADD CONSTRAINT "bank_categorization_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_connections"
    ADD CONSTRAINT "bank_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_consents"
    ADD CONSTRAINT "bank_consents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_dashboards"
    ADD CONSTRAINT "bank_dashboards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_encrypted_credentials"
    ADD CONSTRAINT "bank_encrypted_credentials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_export_formats"
    ADD CONSTRAINT "bank_export_formats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_export_jobs"
    ADD CONSTRAINT "bank_export_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_field_mappings"
    ADD CONSTRAINT "bank_field_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_merchant_data"
    ADD CONSTRAINT "bank_merchant_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_notifications"
    ADD CONSTRAINT "bank_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_providers"
    ADD CONSTRAINT "bank_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_providers"
    ADD CONSTRAINT "bank_providers_provider_id_key" UNIQUE ("provider_id");



ALTER TABLE ONLY "public"."bank_reconciliation_log"
    ADD CONSTRAINT "bank_reconciliation_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_reconciliation_matches"
    ADD CONSTRAINT "bank_reconciliation_matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_reconciliation"
    ADD CONSTRAINT "bank_reconciliation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_reconciliation_rules"
    ADD CONSTRAINT "bank_reconciliation_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_sca_methods"
    ADD CONSTRAINT "bank_sca_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_spending_patterns"
    ADD CONSTRAINT "bank_spending_patterns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_supported_banks"
    ADD CONSTRAINT "bank_supported_banks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_sync_statistics"
    ADD CONSTRAINT "bank_sync_statistics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_token_rotation_log"
    ADD CONSTRAINT "bank_token_rotation_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_transaction_categories"
    ADD CONSTRAINT "bank_transaction_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_transactions"
    ADD CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_validation_rules"
    ADD CONSTRAINT "bank_validation_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_webhook_configs"
    ADD CONSTRAINT "bank_webhook_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_webhook_events"
    ADD CONSTRAINT "bank_webhook_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."benefits"
    ADD CONSTRAINT "benefits_company_id_code_key" UNIQUE ("company_id", "code");



ALTER TABLE ONLY "public"."benefits"
    ADD CONSTRAINT "benefits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budget_approvals"
    ADD CONSTRAINT "budget_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budget_assumptions"
    ADD CONSTRAINT "budget_assumptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budget_attachments"
    ADD CONSTRAINT "budget_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budget_categories"
    ADD CONSTRAINT "budget_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budget_category_templates"
    ADD CONSTRAINT "budget_category_templates_country_code_category_subcategory_key" UNIQUE ("country_code", "category", "subcategory");



ALTER TABLE ONLY "public"."budget_category_templates"
    ADD CONSTRAINT "budget_category_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budget_comments"
    ADD CONSTRAINT "budget_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budget_forecasts"
    ADD CONSTRAINT "budget_forecasts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budget_lines"
    ADD CONSTRAINT "budget_lines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budget_notifications"
    ADD CONSTRAINT "budget_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budget_scenarios"
    ADD CONSTRAINT "budget_scenarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budget_templates"
    ADD CONSTRAINT "budget_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budget_variance_analysis"
    ADD CONSTRAINT "budget_variance_analysis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cache_settings"
    ADD CONSTRAINT "cache_settings_company_id_cache_name_key" UNIQUE ("company_id", "cache_name");



ALTER TABLE ONLY "public"."cache_settings"
    ADD CONSTRAINT "cache_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."career_progression"
    ADD CONSTRAINT "career_progression_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cash_flow_predictions"
    ADD CONSTRAINT "cash_flow_predictions_company_id_prediction_month_key" UNIQUE ("company_id", "prediction_month");



ALTER TABLE ONLY "public"."cash_flow_predictions"
    ADD CONSTRAINT "cash_flow_predictions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."category_account_map"
    ADD CONSTRAINT "category_account_map_company_id_category_id_account_code_key" UNIQUE ("company_id", "category_id", "account_code");



ALTER TABLE ONLY "public"."category_account_map"
    ADD CONSTRAINT "category_account_map_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chart_of_accounts"
    ADD CONSTRAINT "chart_of_accounts_company_id_account_number_key" UNIQUE ("company_id", "account_number");



ALTER TABLE ONLY "public"."chart_of_accounts"
    ADD CONSTRAINT "chart_of_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chart_of_accounts_templates"
    ADD CONSTRAINT "chart_of_accounts_templates_country_code_account_number_key" UNIQUE ("country_code", "account_number");



ALTER TABLE ONLY "public"."chart_of_accounts_templates"
    ADD CONSTRAINT "chart_of_accounts_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_deletion_requests"
    ADD CONSTRAINT "company_deletion_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_duplicates"
    ADD CONSTRAINT "company_duplicates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_duplicates"
    ADD CONSTRAINT "company_duplicates_primary_company_id_duplicate_company_id_key" UNIQUE ("primary_company_id", "duplicate_company_id");



ALTER TABLE ONLY "public"."company_features"
    ADD CONSTRAINT "company_features_company_id_feature_name_key" UNIQUE ("company_id", "feature_name");



ALTER TABLE ONLY "public"."company_features"
    ADD CONSTRAINT "company_features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_fiscal_settings"
    ADD CONSTRAINT "company_fiscal_settings_company_id_key" UNIQUE ("company_id");



ALTER TABLE ONLY "public"."company_fiscal_settings"
    ADD CONSTRAINT "company_fiscal_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_invitations"
    ADD CONSTRAINT "company_invitations_company_id_email_status_key" UNIQUE ("company_id", "email", "status");



ALTER TABLE ONLY "public"."company_invitations"
    ADD CONSTRAINT "company_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_merges"
    ADD CONSTRAINT "company_merges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_modules"
    ADD CONSTRAINT "company_modules_company_id_module_key_key" UNIQUE ("company_id", "module_key");



ALTER TABLE ONLY "public"."company_modules"
    ADD CONSTRAINT "company_modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_settings"
    ADD CONSTRAINT "company_settings_company_id_key" UNIQUE ("company_id");



ALTER TABLE ONLY "public"."company_settings"
    ADD CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_sizes_catalog"
    ADD CONSTRAINT "company_sizes_catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_sizes_catalog"
    ADD CONSTRAINT "company_sizes_catalog_size_code_key" UNIQUE ("size_code");



ALTER TABLE ONLY "public"."company_users"
    ADD CONSTRAINT "company_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_users"
    ADD CONSTRAINT "company_users_user_id_company_id_key" UNIQUE ("user_id", "company_id");



ALTER TABLE ONLY "public"."compliance_reports"
    ADD CONSTRAINT "compliance_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."configuration_categories"
    ADD CONSTRAINT "configuration_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_alerts"
    ADD CONSTRAINT "contract_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_amendments"
    ADD CONSTRAINT "contract_amendments_contract_id_amendment_number_key" UNIQUE ("contract_id", "amendment_number");



ALTER TABLE ONLY "public"."contract_amendments"
    ADD CONSTRAINT "contract_amendments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_approvals"
    ADD CONSTRAINT "contract_approvals_contract_id_amendment_id_approval_step_key" UNIQUE ("contract_id", "amendment_id", "approval_step");



ALTER TABLE ONLY "public"."contract_approvals"
    ADD CONSTRAINT "contract_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_billing"
    ADD CONSTRAINT "contract_billing_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_clauses"
    ADD CONSTRAINT "contract_clauses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_documents"
    ADD CONSTRAINT "contract_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_kpi_tracking"
    ADD CONSTRAINT "contract_kpi_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_kpis"
    ADD CONSTRAINT "contract_kpis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_milestones"
    ADD CONSTRAINT "contract_milestones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_parties"
    ADD CONSTRAINT "contract_parties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_renewals"
    ADD CONSTRAINT "contract_renewals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_templates"
    ADD CONSTRAINT "contract_templates_company_id_contract_type_id_version_key" UNIQUE ("company_id", "contract_type_id", "version");



ALTER TABLE ONLY "public"."contract_templates"
    ADD CONSTRAINT "contract_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_terminations"
    ADD CONSTRAINT "contract_terminations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_types"
    ADD CONSTRAINT "contract_types_company_id_code_key" UNIQUE ("company_id", "code");



ALTER TABLE ONLY "public"."contract_types"
    ADD CONSTRAINT "contract_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_company_id_contract_number_key" UNIQUE ("company_id", "contract_number");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cost_centers"
    ADD CONSTRAINT "cost_centers_company_id_code_key" UNIQUE ("company_id", "code");



ALTER TABLE ONLY "public"."cost_centers"
    ADD CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."countries_catalog"
    ADD CONSTRAINT "countries_catalog_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."countries_catalog"
    ADD CONSTRAINT "countries_catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_actions"
    ADD CONSTRAINT "crm_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_activities"
    ADD CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_attachments"
    ADD CONSTRAINT "crm_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_campaigns"
    ADD CONSTRAINT "crm_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_clients"
    ADD CONSTRAINT "crm_clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_contacts"
    ADD CONSTRAINT "crm_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_entity_tags"
    ADD CONSTRAINT "crm_entity_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_leads"
    ADD CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_notes"
    ADD CONSTRAINT "crm_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_opportunities"
    ADD CONSTRAINT "crm_opportunities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_pipelines"
    ADD CONSTRAINT "crm_pipelines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_sources"
    ADD CONSTRAINT "crm_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_stages"
    ADD CONSTRAINT "crm_stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_tags"
    ADD CONSTRAINT "crm_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_tasks"
    ADD CONSTRAINT "crm_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."currencies_catalog"
    ADD CONSTRAINT "currencies_catalog_currency_code_key" UNIQUE ("currency_code");



ALTER TABLE ONLY "public"."currencies_catalog"
    ADD CONSTRAINT "currencies_catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_company_id_customer_number_key" UNIQUE ("company_id", "customer_number");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."data_classification"
    ADD CONSTRAINT "data_classification_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."data_classification"
    ADD CONSTRAINT "data_classification_table_name_column_name_record_id_key" UNIQUE ("table_name", "column_name", "record_id");



ALTER TABLE ONLY "public"."data_governance_audit"
    ADD CONSTRAINT "data_governance_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."data_retention_policies"
    ADD CONSTRAINT "data_retention_policies_company_id_policy_name_key" UNIQUE ("company_id", "policy_name");



ALTER TABLE ONLY "public"."data_retention_policies"
    ADD CONSTRAINT "data_retention_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_company_id_code_key" UNIQUE ("company_id", "code");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."disciplinary_actions"
    ADD CONSTRAINT "disciplinary_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_benefits"
    ADD CONSTRAINT "employee_benefits_employee_id_benefit_id_key" UNIQUE ("employee_id", "benefit_id");



ALTER TABLE ONLY "public"."employee_benefits"
    ADD CONSTRAINT "employee_benefits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_contracts"
    ADD CONSTRAINT "employee_contracts_company_id_contract_number_key" UNIQUE ("company_id", "contract_number");



ALTER TABLE ONLY "public"."employee_contracts"
    ADD CONSTRAINT "employee_contracts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_documents"
    ADD CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_surveys"
    ADD CONSTRAINT "employee_surveys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_company_id_employee_number_key" UNIQUE ("company_id", "employee_number");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."encryption_keys"
    ADD CONSTRAINT "encryption_keys_key_name_key" UNIQUE ("key_name");



ALTER TABLE ONLY "public"."encryption_keys"
    ADD CONSTRAINT "encryption_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_company_id_flag_name_key" UNIQUE ("company_id", "flag_name");



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature_usage_tracking"
    ADD CONSTRAINT "feature_usage_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fec_exports"
    ADD CONSTRAINT "fec_exports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_reports"
    ADD CONSTRAINT "financial_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fiscal_country_templates"
    ADD CONSTRAINT "fiscal_country_templates_country_code_key" UNIQUE ("country_code");



ALTER TABLE ONLY "public"."fiscal_country_templates"
    ADD CONSTRAINT "fiscal_country_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_adjustments"
    ADD CONSTRAINT "inventory_adjustments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_product_id_product_variant_id_warehouse_id__key" UNIQUE ("product_id", "product_variant_id", "warehouse_id", "location_id");



ALTER TABLE ONLY "public"."inventory_locations"
    ADD CONSTRAINT "inventory_locations_company_id_warehouse_id_code_key" UNIQUE ("company_id", "warehouse_id", "code");



ALTER TABLE ONLY "public"."inventory_locations"
    ADD CONSTRAINT "inventory_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_lines"
    ADD CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_templates"
    ADD CONSTRAINT "invoice_templates_company_id_name_key" UNIQUE ("company_id", "name");



ALTER TABLE ONLY "public"."invoice_templates"
    ADD CONSTRAINT "invoice_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_company_id_invoice_number_key" UNIQUE ("company_id", "invoice_number");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices_stripe"
    ADD CONSTRAINT "invoices_stripe_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices_stripe"
    ADD CONSTRAINT "invoices_stripe_stripe_invoice_id_key" UNIQUE ("stripe_invoice_id");



ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."journal_entry_items"
    ADD CONSTRAINT "journal_entry_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."journal_entry_lines"
    ADD CONSTRAINT "journal_entry_lines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."journals"
    ADD CONSTRAINT "journals_company_id_code_key" UNIQUE ("company_id", "code");



ALTER TABLE ONLY "public"."journals"
    ADD CONSTRAINT "journals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."languages_catalog"
    ADD CONSTRAINT "languages_catalog_language_code_key" UNIQUE ("language_code");



ALTER TABLE ONLY "public"."languages_catalog"
    ADD CONSTRAINT "languages_catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leave_types"
    ADD CONSTRAINT "leave_types_company_id_code_key" UNIQUE ("company_id", "code");



ALTER TABLE ONLY "public"."leave_types"
    ADD CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legal_archives"
    ADD CONSTRAINT "legal_archives_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."login_attempts"
    ADD CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."module_catalog"
    ADD CONSTRAINT "module_catalog_pkey" PRIMARY KEY ("module_key");



ALTER TABLE ONLY "public"."module_configurations"
    ADD CONSTRAINT "module_configurations_company_id_module_name_key" UNIQUE ("company_id", "module_name");



ALTER TABLE ONLY "public"."module_configurations"
    ADD CONSTRAINT "module_configurations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_channels"
    ADD CONSTRAINT "notification_channels_company_id_channel_name_key" UNIQUE ("company_id", "channel_name");



ALTER TABLE ONLY "public"."notification_channels"
    ADD CONSTRAINT "notification_channels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_history"
    ADD CONSTRAINT "notification_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_company_id_template_name_key" UNIQUE ("company_id", "template_name");



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."oauth_providers"
    ADD CONSTRAINT "oauth_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_history"
    ADD CONSTRAINT "onboarding_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_sessions"
    ADD CONSTRAINT "onboarding_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_sessions"
    ADD CONSTRAINT "onboarding_sessions_session_token_key" UNIQUE ("session_token");



ALTER TABLE ONLY "public"."password_policies"
    ADD CONSTRAINT "password_policies_company_id_policy_name_key" UNIQUE ("company_id", "policy_name");



ALTER TABLE ONLY "public"."password_policies"
    ADD CONSTRAINT "password_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll"
    ADD CONSTRAINT "payroll_company_id_payroll_number_key" UNIQUE ("company_id", "payroll_number");



ALTER TABLE ONLY "public"."payroll_items"
    ADD CONSTRAINT "payroll_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll"
    ADD CONSTRAINT "payroll_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."performance_reviews"
    ADD CONSTRAINT "performance_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."performance_settings"
    ADD CONSTRAINT "performance_settings_company_id_setting_name_key" UNIQUE ("company_id", "setting_name");



ALTER TABLE ONLY "public"."performance_settings"
    ADD CONSTRAINT "performance_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."positions"
    ADD CONSTRAINT "positions_company_id_code_key" UNIQUE ("company_id", "code");



ALTER TABLE ONLY "public"."positions"
    ADD CONSTRAINT "positions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_company_id_code_key" UNIQUE ("company_id", "code");



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_company_id_sku_key" UNIQUE ("company_id", "sku");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_company_id_code_key" UNIQUE ("company_id", "code");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_baselines"
    ADD CONSTRAINT "project_baselines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_billing_rates"
    ADD CONSTRAINT "project_billing_rates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_budgets"
    ADD CONSTRAINT "project_budgets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_categories"
    ADD CONSTRAINT "project_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_discussions"
    ADD CONSTRAINT "project_discussions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_expenses"
    ADD CONSTRAINT "project_expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_forecasts"
    ADD CONSTRAINT "project_forecasts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_gantt_data"
    ADD CONSTRAINT "project_gantt_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_kpis"
    ADD CONSTRAINT "project_kpis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_project_id_employee_id_key" UNIQUE ("project_id", "employee_id");



ALTER TABLE ONLY "public"."project_milestones"
    ADD CONSTRAINT "project_milestones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_notifications"
    ADD CONSTRAINT "project_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_phases"
    ADD CONSTRAINT "project_phases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_phases"
    ADD CONSTRAINT "project_phases_project_id_phase_number_key" UNIQUE ("project_id", "phase_number");



ALTER TABLE ONLY "public"."project_resources"
    ADD CONSTRAINT "project_resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_roles"
    ADD CONSTRAINT "project_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_schedules"
    ADD CONSTRAINT "project_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_statuses"
    ADD CONSTRAINT "project_statuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_tasks"
    ADD CONSTRAINT "project_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_templates"
    ADD CONSTRAINT "project_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_timesheets"
    ADD CONSTRAINT "project_timesheets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_company_id_project_number_key" UNIQUE ("company_id", "project_number");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_items"
    ADD CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_company_id_order_number_key" UNIQUE ("company_id", "order_number");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_receipts"
    ADD CONSTRAINT "purchase_receipts_company_id_receipt_number_key" UNIQUE ("company_id", "receipt_number");



ALTER TABLE ONLY "public"."purchase_receipts"
    ADD CONSTRAINT "purchase_receipts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_company_id_purchase_number_key" UNIQUE ("company_id", "purchase_number");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quote_items"
    ADD CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_company_id_quote_number_key" UNIQUE ("company_id", "quote_number");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_cache"
    ADD CONSTRAINT "report_cache_cache_key_key" UNIQUE ("cache_key");



ALTER TABLE ONLY "public"."report_cache"
    ADD CONSTRAINT "report_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_executions"
    ADD CONSTRAINT "report_executions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_templates"
    ADD CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resource_allocations"
    ADD CONSTRAINT "resource_allocations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rfa_calculations"
    ADD CONSTRAINT "rfa_calculations_contract_id_calculation_period_key" UNIQUE ("contract_id", "calculation_period");



ALTER TABLE ONLY "public"."rfa_calculations"
    ADD CONSTRAINT "rfa_calculations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_permission_id_key" UNIQUE ("role_id", "permission_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sectors_catalog"
    ADD CONSTRAINT "sectors_catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sectors_catalog"
    ADD CONSTRAINT "sectors_catalog_sector_code_key" UNIQUE ("sector_code");



ALTER TABLE ONLY "public"."security_configurations"
    ADD CONSTRAINT "security_configurations_company_id_config_name_key" UNIQUE ("company_id", "config_name");



ALTER TABLE ONLY "public"."security_configurations"
    ADD CONSTRAINT "security_configurations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."serial_numbers"
    ADD CONSTRAINT "serial_numbers_company_id_serial_number_key" UNIQUE ("company_id", "serial_number");



ALTER TABLE ONLY "public"."serial_numbers"
    ADD CONSTRAINT "serial_numbers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_accounts"
    ADD CONSTRAINT "service_accounts_company_id_name_key" UNIQUE ("company_id", "name");



ALTER TABLE ONLY "public"."service_accounts"
    ADD CONSTRAINT "service_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."skill_assessments"
    ADD CONSTRAINT "skill_assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."smart_alerts"
    ADD CONSTRAINT "smart_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_alerts"
    ADD CONSTRAINT "stock_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."supplier_contact_persons"
    ADD CONSTRAINT "supplier_contact_persons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supplier_payments"
    ADD CONSTRAINT "supplier_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_company_id_supplier_number_key" UNIQUE ("company_id", "supplier_number");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_configurations"
    ADD CONSTRAINT "system_configurations_company_id_config_key_key" UNIQUE ("company_id", "config_key");



ALTER TABLE ONLY "public"."system_configurations"
    ADD CONSTRAINT "system_configurations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_attachments"
    ADD CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_checklists"
    ADD CONSTRAINT "task_checklists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_checklists"
    ADD CONSTRAINT "task_checklists_task_id_item_order_key" UNIQUE ("task_id", "item_order");



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_dependencies"
    ADD CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_dependencies"
    ADD CONSTRAINT "task_dependencies_predecessor_task_id_successor_task_id_key" UNIQUE ("predecessor_task_id", "successor_task_id");



ALTER TABLE ONLY "public"."task_statuses"
    ADD CONSTRAINT "task_statuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_types"
    ADD CONSTRAINT "task_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tax_declarations"
    ADD CONSTRAINT "tax_declarations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tax_optimizations"
    ADD CONSTRAINT "tax_optimizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tax_rates_catalog"
    ADD CONSTRAINT "tax_rates_catalog_country_code_tax_name_valid_from_key" UNIQUE ("country_code", "tax_name", "valid_from");



ALTER TABLE ONLY "public"."tax_rates_catalog"
    ADD CONSTRAINT "tax_rates_catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."third_parties"
    ADD CONSTRAINT "third_parties_company_id_code_key" UNIQUE ("company_id", "code");



ALTER TABLE ONLY "public"."third_parties"
    ADD CONSTRAINT "third_parties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."third_party_addresses"
    ADD CONSTRAINT "third_party_addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."third_party_categories"
    ADD CONSTRAINT "third_party_categories_company_id_code_key" UNIQUE ("company_id", "code");



ALTER TABLE ONLY "public"."third_party_categories"
    ADD CONSTRAINT "third_party_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."third_party_documents"
    ADD CONSTRAINT "third_party_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."time_tracking"
    ADD CONSTRAINT "time_tracking_employee_id_work_date_key" UNIQUE ("employee_id", "work_date");



ALTER TABLE ONLY "public"."time_tracking"
    ADD CONSTRAINT "time_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."timezones_catalog"
    ADD CONSTRAINT "timezones_catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."timezones_catalog"
    ADD CONSTRAINT "timezones_catalog_timezone_name_key" UNIQUE ("timezone_name");



ALTER TABLE ONLY "public"."training_records"
    ADD CONSTRAINT "training_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usage_tracking"
    ADD CONSTRAINT "usage_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usage_tracking"
    ADD CONSTRAINT "usage_tracking_user_id_feature_name_key" UNIQUE ("user_id", "feature_name");



ALTER TABLE ONLY "public"."user_activity_log"
    ADD CONSTRAINT "user_activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_activity_logs"
    ADD CONSTRAINT "user_activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_companies"
    ADD CONSTRAINT "user_companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_companies"
    ADD CONSTRAINT "user_companies_user_id_company_id_key" UNIQUE ("user_id", "company_id");



ALTER TABLE ONLY "public"."user_deletion_requests"
    ADD CONSTRAINT "user_deletion_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_deletion_requests"
    ADD CONSTRAINT "user_deletion_requests_user_id_status_key" UNIQUE ("user_id", "status");



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_user_id_company_id_key" UNIQUE ("user_id", "company_id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_company_id_key" UNIQUE ("user_id", "company_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_session_token_key" UNIQUE ("session_token");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."warehouses"
    ADD CONSTRAINT "warehouses_company_id_code_key" UNIQUE ("company_id", "code");



ALTER TABLE ONLY "public"."warehouses"
    ADD CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_settings"
    ADD CONSTRAINT "webhook_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_executions"
    ADD CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_templates"
    ADD CONSTRAINT "workflow_templates_company_id_template_name_key" UNIQUE ("company_id", "template_name");



ALTER TABLE ONLY "public"."workflow_templates"
    ADD CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_accounts_company" ON "public"."accounts" USING "btree" ("company_id") WHERE ("company_id" IS NOT NULL);



CREATE INDEX "idx_accounts_company_id" ON "public"."accounts" USING "btree" ("company_id");



CREATE INDEX "idx_accounts_type" ON "public"."accounts" USING "btree" ("type");



CREATE INDEX "idx_activity_company" ON "public"."user_activity_log" USING "btree" ("company_id");



CREATE INDEX "idx_activity_user_company" ON "public"."user_activity_log" USING "btree" ("user_id", "company_id");



CREATE INDEX "idx_ai_insights_company" ON "public"."ai_insights" USING "btree" ("company_id");



CREATE INDEX "idx_ai_insights_priority" ON "public"."ai_insights" USING "btree" ("priority");



CREATE INDEX "idx_ai_insights_status" ON "public"."ai_insights" USING "btree" ("status");



CREATE INDEX "idx_ai_insights_type" ON "public"."ai_insights" USING "btree" ("insight_type");



CREATE INDEX "idx_ai_interactions_company_user" ON "public"."ai_interactions" USING "btree" ("company_id", "user_id");



CREATE INDEX "idx_ai_interactions_context" ON "public"."ai_interactions" USING "btree" ("context_type");



CREATE INDEX "idx_ai_interactions_timestamp" ON "public"."ai_interactions" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_ai_performance_date" ON "public"."ai_performance_metrics" USING "btree" ("measurement_date" DESC);



CREATE INDEX "idx_ai_performance_model" ON "public"."ai_performance_metrics" USING "btree" ("model_id", "model_version");



CREATE INDEX "idx_alert_configurations_active" ON "public"."alert_configurations" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_alert_configurations_company" ON "public"."alert_configurations" USING "btree" ("company_id");



CREATE INDEX "idx_anomaly_detections_company" ON "public"."anomaly_detections" USING "btree" ("company_id");



CREATE INDEX "idx_anomaly_detections_detected" ON "public"."anomaly_detections" USING "btree" ("detected_at" DESC);



CREATE INDEX "idx_anomaly_detections_severity" ON "public"."anomaly_detections" USING "btree" ("severity");



CREATE INDEX "idx_anomaly_detections_status" ON "public"."anomaly_detections" USING "btree" ("status");



CREATE INDEX "idx_api_configurations_company" ON "public"."api_configurations" USING "btree" ("company_id");



CREATE INDEX "idx_attendance_company_id" ON "public"."attendance" USING "btree" ("company_id");



CREATE INDEX "idx_attendance_date" ON "public"."attendance" USING "btree" ("attendance_date");



CREATE INDEX "idx_attendance_employee" ON "public"."attendance" USING "btree" ("employee_id");



CREATE INDEX "idx_attendance_employee_date" ON "public"."attendance" USING "btree" ("employee_id", "attendance_date");



CREATE INDEX "idx_attendance_status" ON "public"."attendance" USING "btree" ("company_id", "status");



CREATE INDEX "idx_audit_logs_compliance" ON "public"."audit_logs" USING "gin" ("compliance_tags");



CREATE INDEX "idx_audit_logs_event_type" ON "public"."audit_logs" USING "btree" ("event_type");



CREATE INDEX "idx_audit_logs_security_level" ON "public"."audit_logs" USING "btree" ("security_level");



CREATE INDEX "idx_audit_logs_table_record" ON "public"."audit_logs" USING "btree" ("table_name", "record_id");



CREATE INDEX "idx_audit_logs_timestamp" ON "public"."audit_logs" USING "btree" ("event_timestamp" DESC);



CREATE INDEX "idx_audit_logs_user_company" ON "public"."audit_logs" USING "btree" ("user_id", "company_id");



CREATE INDEX "idx_automation_rules_active" ON "public"."automation_rules" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_automation_rules_company" ON "public"."automation_rules" USING "btree" ("company_id");



CREATE INDEX "idx_available_features_category" ON "public"."available_features" USING "btree" ("category", "sort_order") WHERE ("is_active" = true);



CREATE INDEX "idx_available_features_plan" ON "public"."available_features" USING "btree" ("requires_plan", "enterprise_only");



CREATE INDEX "idx_bank_audit_logs_action" ON "public"."bank_audit_logs" USING "btree" ("action");



CREATE INDEX "idx_bank_audit_logs_company" ON "public"."bank_audit_logs" USING "btree" ("company_id");



CREATE INDEX "idx_bank_audit_logs_created" ON "public"."bank_audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_bank_audit_logs_risk" ON "public"."bank_audit_logs" USING "btree" ("risk_level");



CREATE INDEX "idx_bank_audit_logs_user" ON "public"."bank_audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_bank_auth_flows_connection" ON "public"."bank_auth_flows" USING "btree" ("connection_id");



CREATE INDEX "idx_bank_auth_flows_expires" ON "public"."bank_auth_flows" USING "btree" ("expires_at");



CREATE INDEX "idx_bank_auth_flows_status" ON "public"."bank_auth_flows" USING "btree" ("status");



CREATE INDEX "idx_bank_cash_flow_account" ON "public"."bank_cash_flow_analysis" USING "btree" ("bank_account_id");



CREATE INDEX "idx_bank_cash_flow_company" ON "public"."bank_cash_flow_analysis" USING "btree" ("company_id");



CREATE INDEX "idx_bank_cash_flow_date" ON "public"."bank_cash_flow_analysis" USING "btree" ("analysis_date" DESC);



CREATE INDEX "idx_bank_cash_flow_period" ON "public"."bank_cash_flow_analysis" USING "btree" ("period_start", "period_end");



CREATE INDEX "idx_bank_categorization_rules_active" ON "public"."bank_categorization_rules" USING "btree" ("is_active");



CREATE INDEX "idx_bank_categorization_rules_company" ON "public"."bank_categorization_rules" USING "btree" ("company_id");



CREATE INDEX "idx_bank_categorization_rules_priority" ON "public"."bank_categorization_rules" USING "btree" ("priority" DESC);



CREATE INDEX "idx_bank_connections_company" ON "public"."bank_connections" USING "btree" ("company_id");



CREATE INDEX "idx_bank_connections_consent" ON "public"."bank_connections" USING "btree" ("consent_expires_at");



CREATE INDEX "idx_bank_connections_provider" ON "public"."bank_connections" USING "btree" ("provider_id");



CREATE INDEX "idx_bank_connections_status" ON "public"."bank_connections" USING "btree" ("status");



CREATE INDEX "idx_bank_connections_sync" ON "public"."bank_connections" USING "btree" ("last_sync", "next_sync");



CREATE INDEX "idx_bank_connections_user" ON "public"."bank_connections" USING "btree" ("user_id");



CREATE INDEX "idx_bank_export_jobs_company" ON "public"."bank_export_jobs" USING "btree" ("company_id");



CREATE INDEX "idx_bank_export_jobs_created" ON "public"."bank_export_jobs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_bank_export_jobs_format" ON "public"."bank_export_jobs" USING "btree" ("export_format_id");



CREATE INDEX "idx_bank_export_jobs_status" ON "public"."bank_export_jobs" USING "btree" ("status");



CREATE INDEX "idx_bank_merchant_data_category" ON "public"."bank_merchant_data" USING "btree" ("category");



CREATE INDEX "idx_bank_merchant_data_mcc" ON "public"."bank_merchant_data" USING "btree" ("mcc_code");



CREATE INDEX "idx_bank_merchant_data_name" ON "public"."bank_merchant_data" USING "btree" ("normalized_name");



CREATE INDEX "idx_bank_notifications_company" ON "public"."bank_notifications" USING "btree" ("company_id");



CREATE INDEX "idx_bank_notifications_created" ON "public"."bank_notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_bank_notifications_severity" ON "public"."bank_notifications" USING "btree" ("severity");



CREATE INDEX "idx_bank_notifications_status" ON "public"."bank_notifications" USING "btree" ("status");



CREATE INDEX "idx_bank_notifications_user" ON "public"."bank_notifications" USING "btree" ("user_id");



CREATE INDEX "idx_bank_providers_active" ON "public"."bank_providers" USING "btree" ("is_active");



CREATE INDEX "idx_bank_providers_id" ON "public"."bank_providers" USING "btree" ("provider_id");



CREATE INDEX "idx_bank_providers_type" ON "public"."bank_providers" USING "btree" ("type");



CREATE INDEX "idx_bank_reconciliation_account" ON "public"."bank_reconciliation" USING "btree" ("bank_account_id");



CREATE INDEX "idx_bank_reconciliation_company" ON "public"."bank_reconciliation" USING "btree" ("company_id");



CREATE INDEX "idx_bank_reconciliation_confidence" ON "public"."bank_reconciliation" USING "btree" ("confidence_score");



CREATE INDEX "idx_bank_reconciliation_rules_active" ON "public"."bank_reconciliation_rules" USING "btree" ("is_active");



CREATE INDEX "idx_bank_reconciliation_rules_company" ON "public"."bank_reconciliation_rules" USING "btree" ("company_id");



CREATE INDEX "idx_bank_reconciliation_rules_priority" ON "public"."bank_reconciliation_rules" USING "btree" ("priority" DESC);



CREATE INDEX "idx_bank_reconciliation_status" ON "public"."bank_reconciliation" USING "btree" ("status");



CREATE INDEX "idx_bank_reconciliation_transaction" ON "public"."bank_reconciliation" USING "btree" ("bank_transaction_id");



CREATE INDEX "idx_bank_supported_banks_active" ON "public"."bank_supported_banks" USING "btree" ("is_active");



CREATE INDEX "idx_bank_supported_banks_country" ON "public"."bank_supported_banks" USING "btree" ("country");



CREATE INDEX "idx_bank_supported_banks_provider" ON "public"."bank_supported_banks" USING "btree" ("provider_id");



CREATE INDEX "idx_bank_transaction_categories_company" ON "public"."bank_transaction_categories" USING "btree" ("company_id");



CREATE INDEX "idx_bank_transaction_categories_level" ON "public"."bank_transaction_categories" USING "btree" ("level");



CREATE INDEX "idx_bank_transaction_categories_parent" ON "public"."bank_transaction_categories" USING "btree" ("parent_category_id");



CREATE INDEX "idx_bank_transactions_account_date" ON "public"."bank_transactions" USING "btree" ("bank_account_id", "transaction_date");



CREATE INDEX "idx_bank_transactions_reconciled" ON "public"."bank_transactions" USING "btree" ("is_reconciled");



CREATE INDEX "idx_bank_webhook_events_config" ON "public"."bank_webhook_events" USING "btree" ("webhook_config_id");



CREATE INDEX "idx_bank_webhook_events_received" ON "public"."bank_webhook_events" USING "btree" ("received_at" DESC);



CREATE INDEX "idx_bank_webhook_events_status" ON "public"."bank_webhook_events" USING "btree" ("status");



CREATE INDEX "idx_bank_webhook_events_type" ON "public"."bank_webhook_events" USING "btree" ("event_type");



CREATE INDEX "idx_benefits_active" ON "public"."benefits" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_benefits_category" ON "public"."benefits" USING "btree" ("company_id", "category");



CREATE INDEX "idx_benefits_company_id" ON "public"."benefits" USING "btree" ("company_id");



CREATE INDEX "idx_benefits_provider" ON "public"."benefits" USING "btree" ("provider_name");



CREATE INDEX "idx_budget_approvals_approver" ON "public"."budget_approvals" USING "btree" ("approver_id");



CREATE INDEX "idx_budget_approvals_budget" ON "public"."budget_approvals" USING "btree" ("budget_id");



CREATE INDEX "idx_budget_assumptions_budget" ON "public"."budget_assumptions" USING "btree" ("budget_id");



CREATE INDEX "idx_budget_assumptions_company" ON "public"."budget_assumptions" USING "btree" ("company_id");



CREATE INDEX "idx_budget_attachments_budget" ON "public"."budget_attachments" USING "btree" ("budget_id");



CREATE INDEX "idx_budget_categories_budget" ON "public"."budget_categories" USING "btree" ("budget_id");



CREATE INDEX "idx_budget_categories_company" ON "public"."budget_categories" USING "btree" ("company_id");



CREATE INDEX "idx_budget_categories_type" ON "public"."budget_categories" USING "btree" ("category_type");



CREATE INDEX "idx_budget_category_templates_country" ON "public"."budget_category_templates" USING "btree" ("country_code");



CREATE INDEX "idx_budget_category_templates_type" ON "public"."budget_category_templates" USING "btree" ("country_code", "category_type");



CREATE INDEX "idx_budget_comments_budget" ON "public"."budget_comments" USING "btree" ("budget_id");



CREATE INDEX "idx_budget_forecasts_budget" ON "public"."budget_forecasts" USING "btree" ("budget_id");



CREATE INDEX "idx_budget_notifications_user" ON "public"."budget_notifications" USING "btree" ("user_id");



CREATE INDEX "idx_budget_scenarios_budget" ON "public"."budget_scenarios" USING "btree" ("budget_id");



CREATE INDEX "idx_budget_variance_budget" ON "public"."budget_variance_analysis" USING "btree" ("budget_id");



CREATE INDEX "idx_career_progression_company_id" ON "public"."career_progression" USING "btree" ("company_id");



CREATE INDEX "idx_career_progression_date" ON "public"."career_progression" USING "btree" ("effective_date");



CREATE INDEX "idx_career_progression_employee" ON "public"."career_progression" USING "btree" ("employee_id");



CREATE INDEX "idx_career_progression_positions" ON "public"."career_progression" USING "btree" ("from_position_id", "to_position_id");



CREATE INDEX "idx_career_progression_type" ON "public"."career_progression" USING "btree" ("progression_type");



CREATE INDEX "idx_cash_flow_predictions_company" ON "public"."cash_flow_predictions" USING "btree" ("company_id");



CREATE INDEX "idx_cash_flow_predictions_date" ON "public"."cash_flow_predictions" USING "btree" ("prediction_date" DESC);



CREATE INDEX "idx_cash_flow_predictions_month" ON "public"."cash_flow_predictions" USING "btree" ("prediction_month");



CREATE INDEX "idx_category_account_map_company" ON "public"."category_account_map" USING "btree" ("company_id", "account_code");



CREATE INDEX "idx_chart_of_accounts_company_number" ON "public"."chart_of_accounts" USING "btree" ("company_id", "account_number");



CREATE INDEX "idx_chart_of_accounts_type" ON "public"."chart_of_accounts" USING "btree" ("account_type");



CREATE INDEX "idx_chart_templates_class" ON "public"."chart_of_accounts_templates" USING "btree" ("country_code", "class");



CREATE INDEX "idx_chart_templates_country" ON "public"."chart_of_accounts_templates" USING "btree" ("country_code");



CREATE INDEX "idx_companies_business_key" ON "public"."companies" USING "btree" ("business_key");



CREATE INDEX "idx_companies_business_profile" ON "public"."companies" USING "btree" ("sector", "company_size", "industry_type") WHERE (("sector" IS NOT NULL) AND ("company_size" IS NOT NULL));



CREATE INDEX "idx_companies_ceo" ON "public"."companies" USING "btree" ("ceo_name") WHERE ("ceo_name" IS NOT NULL);



CREATE INDEX "idx_companies_created_by" ON "public"."companies" USING "btree" ("created_by");



CREATE INDEX "idx_companies_normalized_name" ON "public"."companies" USING "btree" ("normalized_name") WHERE ("normalized_name" IS NOT NULL);



CREATE INDEX "idx_companies_owner_id" ON "public"."companies" USING "btree" ("owner_id");



CREATE INDEX "idx_companies_quality_score" ON "public"."companies" USING "btree" ("data_quality_score");



CREATE INDEX "idx_companies_sector" ON "public"."companies" USING "btree" ("sector") WHERE ("sector" IS NOT NULL);



CREATE INDEX "idx_companies_size" ON "public"."companies" USING "btree" ("company_size") WHERE ("company_size" IS NOT NULL);



CREATE INDEX "idx_companies_status_active" ON "public"."companies" USING "btree" ("status") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_companies_vat_number" ON "public"."companies" USING "btree" ("vat_number");



CREATE INDEX "idx_company_duplicates_status" ON "public"."company_duplicates" USING "btree" ("status");



CREATE INDEX "idx_company_features_category" ON "public"."company_features" USING "btree" ("feature_category", "is_enabled");



CREATE INDEX "idx_company_features_company_id" ON "public"."company_features" USING "btree" ("company_id");



CREATE INDEX "idx_company_features_enabled" ON "public"."company_features" USING "btree" ("company_id", "is_enabled") WHERE ("is_enabled" = true);



CREATE INDEX "idx_company_features_expiry" ON "public"."company_features" USING "btree" ("expires_at") WHERE ("expires_at" IS NOT NULL);



CREATE INDEX "idx_company_features_license" ON "public"."company_features" USING "btree" ("license_tier", "expires_at");



CREATE INDEX "idx_company_features_usage" ON "public"."company_features" USING "btree" ("feature_name", "current_usage", "usage_limit") WHERE ("usage_limit" IS NOT NULL);



CREATE INDEX "idx_company_fiscal_settings_active" ON "public"."company_fiscal_settings" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_company_fiscal_settings_company" ON "public"."company_fiscal_settings" USING "btree" ("company_id");



CREATE INDEX "idx_company_fiscal_settings_country" ON "public"."company_fiscal_settings" USING "btree" ("country_code");



CREATE INDEX "idx_company_fiscal_settings_standard" ON "public"."company_fiscal_settings" USING "btree" ("accounting_standard");



CREATE INDEX "idx_company_invitations_company" ON "public"."company_invitations" USING "btree" ("company_id");



CREATE INDEX "idx_company_invitations_email" ON "public"."company_invitations" USING "btree" ("email");



CREATE INDEX "idx_company_invitations_status" ON "public"."company_invitations" USING "btree" ("status");



CREATE INDEX "idx_company_invitations_token" ON "public"."company_invitations" USING "btree" ("invitation_token");



CREATE INDEX "idx_company_merges_status" ON "public"."company_merges" USING "btree" ("status");



CREATE INDEX "idx_company_modules_license" ON "public"."company_modules" USING "btree" ("license_type", "expires_at");



CREATE INDEX "idx_company_modules_priority" ON "public"."company_modules" USING "btree" ("company_id", "module_priority" DESC, "display_order");



CREATE INDEX "idx_company_modules_usage" ON "public"."company_modules" USING "btree" ("company_id", "last_used_at" DESC) WHERE ("is_enabled" = true);



CREATE INDEX "idx_company_modules_visibility" ON "public"."company_modules" USING "btree" ("company_id", "is_visible", "display_order") WHERE ("is_enabled" = true);



CREATE INDEX "idx_company_settings_company" ON "public"."company_settings" USING "btree" ("company_id");



CREATE INDEX "idx_company_sizes_category" ON "public"."company_sizes_catalog" USING "btree" ("category");



CREATE INDEX "idx_company_sizes_code" ON "public"."company_sizes_catalog" USING "btree" ("size_code");



CREATE INDEX "idx_company_users_company" ON "public"."company_users" USING "btree" ("company_id");



CREATE INDEX "idx_company_users_compound" ON "public"."company_users" USING "btree" ("company_id", "status", "is_admin");



CREATE INDEX "idx_company_users_role" ON "public"."company_users" USING "btree" ("role");



CREATE INDEX "idx_company_users_user" ON "public"."company_users" USING "btree" ("user_id");



CREATE INDEX "idx_compliance_reports_company" ON "public"."compliance_reports" USING "btree" ("company_id", "generated_at" DESC);



CREATE INDEX "idx_compliance_reports_status" ON "public"."compliance_reports" USING "btree" ("status");



CREATE INDEX "idx_compliance_reports_type" ON "public"."compliance_reports" USING "btree" ("report_type");



CREATE INDEX "idx_configuration_categories_company" ON "public"."configuration_categories" USING "btree" ("company_id");



CREATE INDEX "idx_contacts_company" ON "public"."contacts" USING "btree" ("company_id");



CREATE INDEX "idx_contacts_customer" ON "public"."contacts" USING "btree" ("customer_id") WHERE ("customer_id" IS NOT NULL);



CREATE INDEX "idx_contacts_email" ON "public"."contacts" USING "btree" ("email") WHERE ("email" IS NOT NULL);



CREATE INDEX "idx_contacts_primary" ON "public"."contacts" USING "btree" ("is_primary") WHERE ("is_primary" = true);



CREATE INDEX "idx_contacts_supplier" ON "public"."contacts" USING "btree" ("supplier_id") WHERE ("supplier_id" IS NOT NULL);



CREATE INDEX "idx_contract_alerts_assigned" ON "public"."contract_alerts" USING "btree" ("assigned_to") WHERE ("assigned_to" IS NOT NULL);



CREATE INDEX "idx_contract_alerts_company_id" ON "public"."contract_alerts" USING "btree" ("company_id");



CREATE INDEX "idx_contract_alerts_contract" ON "public"."contract_alerts" USING "btree" ("contract_id");



CREATE INDEX "idx_contract_alerts_due_date" ON "public"."contract_alerts" USING "btree" ("due_date") WHERE ("due_date" IS NOT NULL);



CREATE INDEX "idx_contract_alerts_priority" ON "public"."contract_alerts" USING "btree" ("priority");



CREATE INDEX "idx_contract_alerts_status" ON "public"."contract_alerts" USING "btree" ("status");



CREATE INDEX "idx_contract_alerts_type" ON "public"."contract_alerts" USING "btree" ("alert_type");



CREATE INDEX "idx_contract_amendments_company_id" ON "public"."contract_amendments" USING "btree" ("company_id");



CREATE INDEX "idx_contract_amendments_contract" ON "public"."contract_amendments" USING "btree" ("contract_id");



CREATE INDEX "idx_contract_amendments_dates" ON "public"."contract_amendments" USING "btree" ("amendment_date", "effective_date");



CREATE INDEX "idx_contract_amendments_status" ON "public"."contract_amendments" USING "btree" ("status");



CREATE INDEX "idx_contract_approvals_amendment" ON "public"."contract_approvals" USING "btree" ("amendment_id") WHERE ("amendment_id" IS NOT NULL);



CREATE INDEX "idx_contract_approvals_approver" ON "public"."contract_approvals" USING "btree" ("approver_id");



CREATE INDEX "idx_contract_approvals_company_id" ON "public"."contract_approvals" USING "btree" ("company_id");



CREATE INDEX "idx_contract_approvals_contract" ON "public"."contract_approvals" USING "btree" ("contract_id");



CREATE INDEX "idx_contract_approvals_status" ON "public"."contract_approvals" USING "btree" ("status");



CREATE INDEX "idx_contract_billing_company_id" ON "public"."contract_billing" USING "btree" ("company_id");



CREATE INDEX "idx_contract_billing_contract_id" ON "public"."contract_billing" USING "btree" ("contract_id");



CREATE INDEX "idx_contract_billing_date" ON "public"."contract_billing" USING "btree" ("billing_period_start");



CREATE INDEX "idx_contract_billing_due" ON "public"."contract_billing" USING "btree" ("due_date");



CREATE INDEX "idx_contract_billing_recurring" ON "public"."contract_billing" USING "btree" ("is_recurring", "next_billing_date");



CREATE INDEX "idx_contract_billing_rfa" ON "public"."contract_billing" USING "btree" ("rfa_applicable");



CREATE INDEX "idx_contract_billing_status" ON "public"."contract_billing" USING "btree" ("billing_status");



CREATE INDEX "idx_contract_clauses_company_id" ON "public"."contract_clauses" USING "btree" ("company_id");



CREATE INDEX "idx_contract_clauses_contract" ON "public"."contract_clauses" USING "btree" ("contract_id");



CREATE INDEX "idx_contract_clauses_mandatory" ON "public"."contract_clauses" USING "btree" ("is_mandatory");



CREATE INDEX "idx_contract_clauses_type" ON "public"."contract_clauses" USING "btree" ("clause_type");



CREATE INDEX "idx_contract_documents_company_id" ON "public"."contract_documents" USING "btree" ("company_id");



CREATE INDEX "idx_contract_documents_contract" ON "public"."contract_documents" USING "btree" ("contract_id");



CREATE INDEX "idx_contract_documents_status" ON "public"."contract_documents" USING "btree" ("status");



CREATE INDEX "idx_contract_documents_type" ON "public"."contract_documents" USING "btree" ("document_type");



CREATE INDEX "idx_contract_kpi_tracking_company_id" ON "public"."contract_kpi_tracking" USING "btree" ("company_id");



CREATE INDEX "idx_contract_kpi_tracking_contract" ON "public"."contract_kpi_tracking" USING "btree" ("contract_id");



CREATE INDEX "idx_contract_kpi_tracking_kpi" ON "public"."contract_kpi_tracking" USING "btree" ("kpi_name", "kpi_type");



CREATE INDEX "idx_contract_kpi_tracking_period" ON "public"."contract_kpi_tracking" USING "btree" ("period_start", "period_end");



CREATE INDEX "idx_contract_kpi_tracking_status" ON "public"."contract_kpi_tracking" USING "btree" ("status");



CREATE INDEX "idx_contract_kpis_company_id" ON "public"."contract_kpis" USING "btree" ("company_id");



CREATE INDEX "idx_contract_kpis_contract_id" ON "public"."contract_kpis" USING "btree" ("contract_id");



CREATE INDEX "idx_contract_kpis_health" ON "public"."contract_kpis" USING "btree" ("contract_health_status");



CREATE INDEX "idx_contract_kpis_performance" ON "public"."contract_kpis" USING "btree" ("overall_performance_score");



CREATE INDEX "idx_contract_kpis_period" ON "public"."contract_kpis" USING "btree" ("measurement_period_start", "measurement_period_end");



CREATE INDEX "idx_contract_milestones_company_id" ON "public"."contract_milestones" USING "btree" ("company_id");



CREATE INDEX "idx_contract_milestones_contract" ON "public"."contract_milestones" USING "btree" ("contract_id");



CREATE INDEX "idx_contract_milestones_dates" ON "public"."contract_milestones" USING "btree" ("planned_date", "actual_date");



CREATE INDEX "idx_contract_milestones_responsible" ON "public"."contract_milestones" USING "btree" ("responsible_party_id");



CREATE INDEX "idx_contract_milestones_status" ON "public"."contract_milestones" USING "btree" ("status");



CREATE INDEX "idx_contract_parties_company_id" ON "public"."contract_parties" USING "btree" ("company_id");



CREATE INDEX "idx_contract_parties_contract" ON "public"."contract_parties" USING "btree" ("contract_id");



CREATE INDEX "idx_contract_parties_signing" ON "public"."contract_parties" USING "btree" ("signing_required", "signed");



CREATE INDEX "idx_contract_parties_type" ON "public"."contract_parties" USING "btree" ("party_type");



CREATE INDEX "idx_contract_renewals_auto" ON "public"."contract_renewals" USING "btree" ("auto_renewal_enabled");



CREATE INDEX "idx_contract_renewals_company_id" ON "public"."contract_renewals" USING "btree" ("company_id");



CREATE INDEX "idx_contract_renewals_contract_id" ON "public"."contract_renewals" USING "btree" ("contract_id");



CREATE INDEX "idx_contract_renewals_end_date" ON "public"."contract_renewals" USING "btree" ("new_end_date");



CREATE INDEX "idx_contract_renewals_status" ON "public"."contract_renewals" USING "btree" ("status");



CREATE INDEX "idx_contract_templates_active" ON "public"."contract_templates" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_contract_templates_company_id" ON "public"."contract_templates" USING "btree" ("company_id");



CREATE INDEX "idx_contract_templates_type" ON "public"."contract_templates" USING "btree" ("contract_type_id");



CREATE INDEX "idx_contract_terminations_company_id" ON "public"."contract_terminations" USING "btree" ("company_id");



CREATE INDEX "idx_contract_terminations_contract_id" ON "public"."contract_terminations" USING "btree" ("contract_id");



CREATE INDEX "idx_contract_terminations_date" ON "public"."contract_terminations" USING "btree" ("termination_date");



CREATE INDEX "idx_contract_terminations_status" ON "public"."contract_terminations" USING "btree" ("status");



CREATE INDEX "idx_contract_terminations_type" ON "public"."contract_terminations" USING "btree" ("termination_type");



CREATE INDEX "idx_contract_types_active" ON "public"."contract_types" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_contract_types_category" ON "public"."contract_types" USING "btree" ("category");



CREATE INDEX "idx_contract_types_company_id" ON "public"."contract_types" USING "btree" ("company_id");



CREATE INDEX "idx_contracts_client" ON "public"."contracts" USING "btree" ("client_id");



CREATE INDEX "idx_contracts_company_id" ON "public"."contracts" USING "btree" ("company_id");



CREATE INDEX "idx_contracts_dates" ON "public"."contracts" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_contracts_priority" ON "public"."contracts" USING "btree" ("priority");



CREATE INDEX "idx_contracts_rfa" ON "public"."contracts" USING "btree" ("company_id", "has_rfa");



CREATE INDEX "idx_contracts_search" ON "public"."contracts" USING "gin" ("to_tsvector"('"french"'::"regconfig", (("contract_name" || ' '::"text") || COALESCE("description", ''::"text"))));



CREATE INDEX "idx_contracts_signature_date" ON "public"."contracts" USING "btree" ("signature_date");



CREATE INDEX "idx_contracts_status" ON "public"."contracts" USING "btree" ("company_id", "status");



CREATE INDEX "idx_contracts_supplier" ON "public"."contracts" USING "btree" ("supplier_id");



CREATE INDEX "idx_contracts_type" ON "public"."contracts" USING "btree" ("contract_type_id");



CREATE INDEX "idx_contracts_value" ON "public"."contracts" USING "btree" ("contract_value");



CREATE INDEX "idx_countries_active" ON "public"."countries_catalog" USING "btree" ("is_active");



CREATE INDEX "idx_countries_code" ON "public"."countries_catalog" USING "btree" ("code");



CREATE INDEX "idx_countries_priority" ON "public"."countries_catalog" USING "btree" ("priority_order");



CREATE INDEX "idx_crm_activities_assigned" ON "public"."crm_activities" USING "btree" ("assigned_to");



CREATE INDEX "idx_crm_activities_client" ON "public"."crm_activities" USING "btree" ("client_id");



CREATE INDEX "idx_crm_activities_company" ON "public"."crm_activities" USING "btree" ("company_id");



CREATE INDEX "idx_crm_activities_created" ON "public"."crm_activities" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_crm_activities_due_date" ON "public"."crm_activities" USING "btree" ("due_date");



CREATE INDEX "idx_crm_activities_opportunity" ON "public"."crm_activities" USING "btree" ("opportunity_id");



CREATE INDEX "idx_crm_activities_status" ON "public"."crm_activities" USING "btree" ("status");



CREATE INDEX "idx_crm_activities_type" ON "public"."crm_activities" USING "btree" ("type");



CREATE INDEX "idx_crm_campaigns_company" ON "public"."crm_campaigns" USING "btree" ("company_id");



CREATE INDEX "idx_crm_campaigns_dates" ON "public"."crm_campaigns" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_crm_campaigns_status" ON "public"."crm_campaigns" USING "btree" ("status");



CREATE INDEX "idx_crm_clients_company" ON "public"."crm_clients" USING "btree" ("company_id");



CREATE INDEX "idx_crm_clients_health" ON "public"."crm_clients" USING "btree" ("health_score");



CREATE INDEX "idx_crm_clients_manager" ON "public"."crm_clients" USING "btree" ("account_manager_id");



CREATE INDEX "idx_crm_clients_search" ON "public"."crm_clients" USING "gin" ("to_tsvector"('"french"'::"regconfig", (((("name" || ' '::"text") || COALESCE("primary_contact_name", ''::"text")) || ' '::"text") || COALESCE("primary_contact_email", ''::"text"))));



CREATE INDEX "idx_crm_clients_status" ON "public"."crm_clients" USING "btree" ("status");



CREATE INDEX "idx_crm_clients_tier" ON "public"."crm_clients" USING "btree" ("tier");



CREATE INDEX "idx_crm_clients_value" ON "public"."crm_clients" USING "btree" ("total_value" DESC);



CREATE INDEX "idx_crm_entity_tags_company" ON "public"."crm_entity_tags" USING "btree" ("company_id");



CREATE INDEX "idx_crm_entity_tags_entity" ON "public"."crm_entity_tags" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_crm_entity_tags_tag" ON "public"."crm_entity_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_crm_leads_assigned" ON "public"."crm_leads" USING "btree" ("assigned_to");



CREATE INDEX "idx_crm_leads_company" ON "public"."crm_leads" USING "btree" ("company_id");



CREATE INDEX "idx_crm_leads_created" ON "public"."crm_leads" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_crm_leads_email" ON "public"."crm_leads" USING "btree" ("email");



CREATE INDEX "idx_crm_leads_score" ON "public"."crm_leads" USING "btree" ("lead_score" DESC);



CREATE INDEX "idx_crm_leads_search" ON "public"."crm_leads" USING "gin" ("to_tsvector"('"french"'::"regconfig", (((((("first_name" || ' '::"text") || "last_name") || ' '::"text") || COALESCE("company_name", ''::"text")) || ' '::"text") || COALESCE("email", ''::"text"))));



CREATE INDEX "idx_crm_leads_source" ON "public"."crm_leads" USING "btree" ("source_id");



CREATE INDEX "idx_crm_leads_status" ON "public"."crm_leads" USING "btree" ("status");



CREATE INDEX "idx_crm_notes_client" ON "public"."crm_notes" USING "btree" ("client_id");



CREATE INDEX "idx_crm_notes_company" ON "public"."crm_notes" USING "btree" ("company_id");



CREATE INDEX "idx_crm_notes_created" ON "public"."crm_notes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_crm_notes_opportunity" ON "public"."crm_notes" USING "btree" ("opportunity_id");



CREATE INDEX "idx_crm_notes_pinned" ON "public"."crm_notes" USING "btree" ("is_pinned") WHERE ("is_pinned" = true);



CREATE INDEX "idx_crm_opportunities_client" ON "public"."crm_opportunities" USING "btree" ("client_id");



CREATE INDEX "idx_crm_opportunities_client_id" ON "public"."crm_opportunities" USING "btree" ("client_id");



CREATE INDEX "idx_crm_opportunities_close_date" ON "public"."crm_opportunities" USING "btree" ("expected_close_date");



CREATE INDEX "idx_crm_opportunities_company" ON "public"."crm_opportunities" USING "btree" ("company_id");



CREATE INDEX "idx_crm_opportunities_company_id" ON "public"."crm_opportunities" USING "btree" ("company_id");



CREATE INDEX "idx_crm_opportunities_expected_close_date" ON "public"."crm_opportunities" USING "btree" ("expected_close_date");



CREATE INDEX "idx_crm_opportunities_owner" ON "public"."crm_opportunities" USING "btree" ("owner_id");



CREATE INDEX "idx_crm_opportunities_pipeline" ON "public"."crm_opportunities" USING "btree" ("pipeline_id");



CREATE INDEX "idx_crm_opportunities_search" ON "public"."crm_opportunities" USING "gin" ("to_tsvector"('"french"'::"regconfig", (("title" || ' '::"text") || COALESCE("description", ''::"text"))));



CREATE INDEX "idx_crm_opportunities_stage" ON "public"."crm_opportunities" USING "btree" ("stage_id");



CREATE INDEX "idx_crm_opportunities_status" ON "public"."crm_opportunities" USING "btree" ("status");



CREATE INDEX "idx_crm_opportunities_value" ON "public"."crm_opportunities" USING "btree" ("value" DESC);



CREATE INDEX "idx_crm_opportunities_weighted" ON "public"."crm_opportunities" USING "btree" ("weighted_value" DESC);



CREATE INDEX "idx_crm_pipelines_active" ON "public"."crm_pipelines" USING "btree" ("is_active", "is_default");



CREATE INDEX "idx_crm_pipelines_company" ON "public"."crm_pipelines" USING "btree" ("company_id");



CREATE INDEX "idx_crm_sources_active" ON "public"."crm_sources" USING "btree" ("is_active");



CREATE INDEX "idx_crm_sources_company" ON "public"."crm_sources" USING "btree" ("company_id");



CREATE INDEX "idx_crm_sources_type" ON "public"."crm_sources" USING "btree" ("type");



CREATE INDEX "idx_crm_stages_order" ON "public"."crm_stages" USING "btree" ("pipeline_id", "stage_order");



CREATE INDEX "idx_crm_stages_pipeline" ON "public"."crm_stages" USING "btree" ("pipeline_id");



CREATE INDEX "idx_crm_tags_company" ON "public"."crm_tags" USING "btree" ("company_id");



CREATE INDEX "idx_crm_tags_name" ON "public"."crm_tags" USING "btree" ("company_id", "name");



CREATE INDEX "idx_crm_tasks_assigned" ON "public"."crm_tasks" USING "btree" ("assigned_to");



CREATE INDEX "idx_crm_tasks_company" ON "public"."crm_tasks" USING "btree" ("company_id");



CREATE INDEX "idx_crm_tasks_due_date" ON "public"."crm_tasks" USING "btree" ("due_date");



CREATE INDEX "idx_crm_tasks_priority" ON "public"."crm_tasks" USING "btree" ("priority");



CREATE INDEX "idx_crm_tasks_status" ON "public"."crm_tasks" USING "btree" ("status");



CREATE INDEX "idx_currencies_active" ON "public"."currencies_catalog" USING "btree" ("is_active");



CREATE INDEX "idx_currencies_code" ON "public"."currencies_catalog" USING "btree" ("currency_code");



CREATE INDEX "idx_currencies_major" ON "public"."currencies_catalog" USING "btree" ("is_major");



CREATE INDEX "idx_customers_active" ON "public"."customers" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_customers_company" ON "public"."customers" USING "btree" ("company_id");



CREATE INDEX "idx_customers_company_id" ON "public"."customers" USING "btree" ("company_id");



CREATE INDEX "idx_customers_email" ON "public"."customers" USING "btree" ("email");



CREATE INDEX "idx_customers_number" ON "public"."customers" USING "btree" ("customer_number");



CREATE INDEX "idx_customers_search" ON "public"."customers" USING "gin" (((((("name" || ' '::"text") || COALESCE("email", ''::"text")) || ' '::"text") || COALESCE("company_name", ''::"text"))) "public"."gin_trgm_ops");



CREATE INDEX "idx_data_classification_category" ON "public"."data_classification" USING "btree" ("data_category");



CREATE INDEX "idx_data_classification_level" ON "public"."data_classification" USING "btree" ("classification_level");



CREATE INDEX "idx_data_classification_review" ON "public"."data_classification" USING "btree" ("review_due_at");



CREATE INDEX "idx_data_classification_table" ON "public"."data_classification" USING "btree" ("table_name");



CREATE INDEX "idx_departments_active" ON "public"."departments" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_departments_company_id" ON "public"."departments" USING "btree" ("company_id");



CREATE INDEX "idx_departments_manager" ON "public"."departments" USING "btree" ("manager_id");



CREATE INDEX "idx_departments_parent" ON "public"."departments" USING "btree" ("parent_department_id");



CREATE INDEX "idx_disciplinary_actions_company_id" ON "public"."disciplinary_actions" USING "btree" ("company_id");



CREATE INDEX "idx_disciplinary_actions_dates" ON "public"."disciplinary_actions" USING "btree" ("incident_date", "action_date");



CREATE INDEX "idx_disciplinary_actions_employee" ON "public"."disciplinary_actions" USING "btree" ("employee_id");



CREATE INDEX "idx_disciplinary_actions_status" ON "public"."disciplinary_actions" USING "btree" ("company_id", "status");



CREATE INDEX "idx_disciplinary_actions_type" ON "public"."disciplinary_actions" USING "btree" ("action_type", "severity_level");



CREATE INDEX "idx_employee_benefits_benefit" ON "public"."employee_benefits" USING "btree" ("benefit_id");



CREATE INDEX "idx_employee_benefits_company_id" ON "public"."employee_benefits" USING "btree" ("company_id");



CREATE INDEX "idx_employee_benefits_effective" ON "public"."employee_benefits" USING "btree" ("effective_date", "end_date");



CREATE INDEX "idx_employee_benefits_employee" ON "public"."employee_benefits" USING "btree" ("employee_id");



CREATE INDEX "idx_employee_benefits_status" ON "public"."employee_benefits" USING "btree" ("company_id", "status");



CREATE INDEX "idx_employee_contracts_company_id" ON "public"."employee_contracts" USING "btree" ("company_id");



CREATE INDEX "idx_employee_contracts_current" ON "public"."employee_contracts" USING "btree" ("company_id", "is_current");



CREATE INDEX "idx_employee_contracts_dates" ON "public"."employee_contracts" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_employee_contracts_department" ON "public"."employee_contracts" USING "btree" ("department_id");



CREATE INDEX "idx_employee_contracts_employee" ON "public"."employee_contracts" USING "btree" ("employee_id");



CREATE INDEX "idx_employee_contracts_position" ON "public"."employee_contracts" USING "btree" ("position_id");



CREATE INDEX "idx_employee_contracts_status" ON "public"."employee_contracts" USING "btree" ("employment_status");



CREATE INDEX "idx_employee_documents_company_id" ON "public"."employee_documents" USING "btree" ("company_id");



CREATE INDEX "idx_employee_documents_employee" ON "public"."employee_documents" USING "btree" ("employee_id");



CREATE INDEX "idx_employee_documents_expiry" ON "public"."employee_documents" USING "btree" ("expiry_date") WHERE ("expiry_date" IS NOT NULL);



CREATE INDEX "idx_employee_documents_type" ON "public"."employee_documents" USING "btree" ("document_type");



CREATE INDEX "idx_employee_surveys_company_id" ON "public"."employee_surveys" USING "btree" ("company_id");



CREATE INDEX "idx_employee_surveys_created_by" ON "public"."employee_surveys" USING "btree" ("created_by");



CREATE INDEX "idx_employee_surveys_dates" ON "public"."employee_surveys" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_employee_surveys_status" ON "public"."employee_surveys" USING "btree" ("company_id", "status");



CREATE INDEX "idx_employee_surveys_type" ON "public"."employee_surveys" USING "btree" ("survey_type");



CREATE INDEX "idx_encryption_keys_name" ON "public"."encryption_keys" USING "btree" ("key_name");



CREATE INDEX "idx_encryption_keys_rotation" ON "public"."encryption_keys" USING "btree" ("next_rotation_at");



CREATE INDEX "idx_encryption_keys_status" ON "public"."encryption_keys" USING "btree" ("status");



CREATE INDEX "idx_feature_flags_audience" ON "public"."feature_flags" USING "btree" ("company_id", "target_audience", "is_enabled");



CREATE INDEX "idx_feature_flags_company" ON "public"."feature_flags" USING "btree" ("company_id");



CREATE INDEX "idx_feature_flags_enabled" ON "public"."feature_flags" USING "btree" ("is_enabled") WHERE ("is_enabled" = true);



CREATE INDEX "idx_feature_usage_compound" ON "public"."feature_usage_tracking" USING "btree" ("company_id", "feature_name", "last_used");



CREATE INDEX "idx_feature_usage_tracking_company" ON "public"."feature_usage_tracking" USING "btree" ("company_id");



CREATE INDEX "idx_feature_usage_tracking_feature" ON "public"."feature_usage_tracking" USING "btree" ("feature_name");



CREATE INDEX "idx_financial_reports_company_id" ON "public"."financial_reports" USING "btree" ("company_id");



CREATE INDEX "idx_fiscal_templates_active" ON "public"."fiscal_country_templates" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_fiscal_templates_country" ON "public"."fiscal_country_templates" USING "btree" ("country_code");



CREATE INDEX "idx_inventory_items_company" ON "public"."inventory_items" USING "btree" ("company_id");



CREATE INDEX "idx_inventory_items_location" ON "public"."inventory_items" USING "btree" ("location_id") WHERE ("location_id" IS NOT NULL);



CREATE INDEX "idx_inventory_items_low_stock" ON "public"."inventory_items" USING "btree" ("minimum_stock", "quantity_on_hand") WHERE ("quantity_on_hand" <= "minimum_stock");



CREATE INDEX "idx_inventory_items_product" ON "public"."inventory_items" USING "btree" ("product_id");



CREATE INDEX "idx_inventory_items_variant" ON "public"."inventory_items" USING "btree" ("product_variant_id") WHERE ("product_variant_id" IS NOT NULL);



CREATE INDEX "idx_inventory_items_warehouse" ON "public"."inventory_items" USING "btree" ("warehouse_id");



CREATE INDEX "idx_inventory_locations_active" ON "public"."inventory_locations" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_inventory_locations_company" ON "public"."inventory_locations" USING "btree" ("company_id");



CREATE INDEX "idx_inventory_locations_warehouse" ON "public"."inventory_locations" USING "btree" ("warehouse_id");



CREATE INDEX "idx_inventory_movements_company" ON "public"."inventory_movements" USING "btree" ("company_id");



CREATE INDEX "idx_inventory_movements_date" ON "public"."inventory_movements" USING "btree" ("movement_date" DESC);



CREATE INDEX "idx_inventory_movements_product" ON "public"."inventory_movements" USING "btree" ("product_id");



CREATE INDEX "idx_inventory_movements_reference" ON "public"."inventory_movements" USING "btree" ("reference_type", "reference_id") WHERE ("reference_id" IS NOT NULL);



CREATE INDEX "idx_inventory_movements_type" ON "public"."inventory_movements" USING "btree" ("movement_type");



CREATE INDEX "idx_inventory_movements_warehouse" ON "public"."inventory_movements" USING "btree" ("warehouse_id");



CREATE INDEX "idx_invoices_company" ON "public"."invoices" USING "btree" ("company_id");



CREATE INDEX "idx_invoices_company_customer" ON "public"."invoices" USING "btree" ("company_id", "customer_id");



CREATE INDEX "idx_invoices_company_date" ON "public"."invoices" USING "btree" ("company_id", "invoice_date");



CREATE INDEX "idx_invoices_customer" ON "public"."invoices" USING "btree" ("customer_id") WHERE ("customer_id" IS NOT NULL);



CREATE INDEX "idx_invoices_date" ON "public"."invoices" USING "btree" ("invoice_date") WHERE ("invoice_date" IS NOT NULL);



CREATE INDEX "idx_invoices_number" ON "public"."invoices" USING "btree" ("invoice_number") WHERE ("invoice_number" IS NOT NULL);



CREATE INDEX "idx_invoices_status" ON "public"."invoices" USING "btree" ("status");



CREATE INDEX "idx_invoices_stripe_status" ON "public"."invoices_stripe" USING "btree" ("status");



CREATE INDEX "idx_invoices_stripe_stripe_invoice_id" ON "public"."invoices_stripe" USING "btree" ("stripe_invoice_id");



CREATE INDEX "idx_invoices_stripe_user_id" ON "public"."invoices_stripe" USING "btree" ("user_id");



CREATE INDEX "idx_invoices_third_party" ON "public"."invoices" USING "btree" ("third_party_id");



CREATE INDEX "idx_journal_entries_company_date" ON "public"."journal_entries" USING "btree" ("company_id", "entry_date");



CREATE INDEX "idx_journal_entries_company_id" ON "public"."journal_entries" USING "btree" ("company_id");



CREATE INDEX "idx_journal_entries_date" ON "public"."journal_entries" USING "btree" ("entry_date");



CREATE INDEX "idx_journal_entries_journal" ON "public"."journal_entries" USING "btree" ("journal_id");



CREATE INDEX "idx_journal_entries_period" ON "public"."journal_entries" USING "btree" ("accounting_period_id");



CREATE INDEX "idx_journal_entries_status" ON "public"."journal_entries" USING "btree" ("status");



CREATE INDEX "idx_journal_entry_items_account_id" ON "public"."journal_entry_items" USING "btree" ("account_id");



CREATE INDEX "idx_journal_entry_items_entry_id" ON "public"."journal_entry_items" USING "btree" ("journal_entry_id");



CREATE INDEX "idx_journal_entry_lines_account" ON "public"."journal_entry_lines" USING "btree" ("account_id");



CREATE INDEX "idx_journal_entry_lines_entry" ON "public"."journal_entry_lines" USING "btree" ("journal_entry_id");



CREATE INDEX "idx_journals_company_id" ON "public"."journals" USING "btree" ("company_id");



CREATE INDEX "idx_languages_code" ON "public"."languages_catalog" USING "btree" ("language_code");



CREATE INDEX "idx_languages_supported" ON "public"."languages_catalog" USING "btree" ("is_supported");



CREATE INDEX "idx_leave_requests_approved_by" ON "public"."leave_requests" USING "btree" ("approved_by");



CREATE INDEX "idx_leave_requests_company_id" ON "public"."leave_requests" USING "btree" ("company_id");



CREATE INDEX "idx_leave_requests_dates" ON "public"."leave_requests" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_leave_requests_employee" ON "public"."leave_requests" USING "btree" ("employee_id");



CREATE INDEX "idx_leave_requests_status" ON "public"."leave_requests" USING "btree" ("company_id", "status");



CREATE INDEX "idx_leave_requests_type" ON "public"."leave_requests" USING "btree" ("leave_type_id");



CREATE INDEX "idx_leave_types_active" ON "public"."leave_types" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_leave_types_company_id" ON "public"."leave_types" USING "btree" ("company_id");



CREATE INDEX "idx_legal_archives_entity" ON "public"."legal_archives" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_legal_archives_expires" ON "public"."legal_archives" USING "btree" ("archive_expires_at");



CREATE INDEX "idx_login_attempts_created" ON "public"."login_attempts" USING "btree" ("created_at");



CREATE INDEX "idx_login_attempts_email" ON "public"."login_attempts" USING "btree" ("email");



CREATE INDEX "idx_login_attempts_ip" ON "public"."login_attempts" USING "btree" ("ip_address");



CREATE INDEX "idx_module_catalog_category" ON "public"."module_catalog" USING "btree" ("category", "sort_order") WHERE ("is_active" = true);



CREATE INDEX "idx_module_configurations_company" ON "public"."module_configurations" USING "btree" ("company_id");



CREATE INDEX "idx_notification_history_sent_at" ON "public"."notification_history" USING "btree" ("sent_at" DESC);



CREATE INDEX "idx_notification_history_status" ON "public"."notification_history" USING "btree" ("status");



CREATE INDEX "idx_notification_history_type" ON "public"."notification_history" USING "btree" ("notification_type");



CREATE INDEX "idx_notification_history_user_id" ON "public"."notification_history" USING "btree" ("user_id");



CREATE INDEX "idx_notification_preferences_user_id" ON "public"."notification_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_notification_templates_company" ON "public"."notification_templates" USING "btree" ("company_id");



CREATE INDEX "idx_notification_templates_trigger" ON "public"."notification_templates" USING "btree" ("event_trigger");



CREATE INDEX "idx_notifications_category" ON "public"."notifications" USING "btree" ("category");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_is_read" ON "public"."notifications" USING "btree" ("is_read");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_onboarding_history_company_analytics" ON "public"."onboarding_history" USING "btree" ("company_id", "step_name", "completion_status");



CREATE INDEX "idx_onboarding_history_session" ON "public"."onboarding_history" USING "btree" ("session_id", "step_order") WHERE ("session_id" IS NOT NULL);



CREATE INDEX "idx_onboarding_history_step" ON "public"."onboarding_history" USING "btree" ("step_name", "completion_status");



CREATE INDEX "idx_onboarding_history_timeline" ON "public"."onboarding_history" USING "btree" ("completion_time" DESC);



CREATE INDEX "idx_onboarding_history_user_company" ON "public"."onboarding_history" USING "btree" ("user_id", "company_id");



CREATE INDEX "idx_onboarding_sessions_company" ON "public"."onboarding_sessions" USING "btree" ("company_id", "final_status");



CREATE INDEX "idx_onboarding_sessions_timeline" ON "public"."onboarding_sessions" USING "btree" ("started_at" DESC);



CREATE INDEX "idx_payments_company" ON "public"."payments" USING "btree" ("company_id");



CREATE INDEX "idx_payments_customer" ON "public"."payments" USING "btree" ("customer_id");



CREATE INDEX "idx_payments_date" ON "public"."payments" USING "btree" ("payment_date");



CREATE INDEX "idx_payments_invoice" ON "public"."payments" USING "btree" ("invoice_id");



CREATE INDEX "idx_payments_status" ON "public"."payments" USING "btree" ("status");



CREATE INDEX "idx_payroll_company_id" ON "public"."payroll" USING "btree" ("company_id");



CREATE INDEX "idx_payroll_contract" ON "public"."payroll" USING "btree" ("contract_id");



CREATE INDEX "idx_payroll_employee" ON "public"."payroll" USING "btree" ("employee_id");



CREATE INDEX "idx_payroll_items_payroll" ON "public"."payroll_items" USING "btree" ("payroll_id");



CREATE INDEX "idx_payroll_items_type" ON "public"."payroll_items" USING "btree" ("item_type");



CREATE INDEX "idx_payroll_pay_date" ON "public"."payroll" USING "btree" ("pay_date");



CREATE INDEX "idx_payroll_period" ON "public"."payroll" USING "btree" ("pay_period_start", "pay_period_end");



CREATE INDEX "idx_payroll_status" ON "public"."payroll" USING "btree" ("company_id", "status");



CREATE INDEX "idx_performance_reviews_company_id" ON "public"."performance_reviews" USING "btree" ("company_id");



CREATE INDEX "idx_performance_reviews_employee" ON "public"."performance_reviews" USING "btree" ("employee_id");



CREATE INDEX "idx_performance_reviews_next_review" ON "public"."performance_reviews" USING "btree" ("next_review_date") WHERE ("next_review_date" IS NOT NULL);



CREATE INDEX "idx_performance_reviews_period" ON "public"."performance_reviews" USING "btree" ("review_period_start", "review_period_end");



CREATE INDEX "idx_performance_reviews_reviewer" ON "public"."performance_reviews" USING "btree" ("reviewer_id");



CREATE INDEX "idx_performance_reviews_status" ON "public"."performance_reviews" USING "btree" ("company_id", "status");



CREATE INDEX "idx_permissions_company" ON "public"."permissions" USING "btree" ("company_id");



CREATE INDEX "idx_permissions_resource" ON "public"."permissions" USING "btree" ("resource", "action");



CREATE INDEX "idx_positions_active" ON "public"."positions" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_positions_company_id" ON "public"."positions" USING "btree" ("company_id");



CREATE INDEX "idx_positions_department" ON "public"."positions" USING "btree" ("department_id");



CREATE INDEX "idx_positions_reports_to" ON "public"."positions" USING "btree" ("reports_to_position_id");



CREATE INDEX "idx_product_categories_active" ON "public"."product_categories" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_product_categories_company" ON "public"."product_categories" USING "btree" ("company_id");



CREATE INDEX "idx_product_categories_parent" ON "public"."product_categories" USING "btree" ("parent_category_id") WHERE ("parent_category_id" IS NOT NULL);



CREATE INDEX "idx_product_variants_active" ON "public"."product_variants" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_product_variants_company" ON "public"."product_variants" USING "btree" ("company_id");



CREATE INDEX "idx_product_variants_product" ON "public"."product_variants" USING "btree" ("product_id");



CREATE INDEX "idx_product_variants_sku" ON "public"."product_variants" USING "btree" ("sku");



CREATE INDEX "idx_project_categories_active" ON "public"."project_categories" USING "btree" ("is_active");



CREATE INDEX "idx_project_categories_company" ON "public"."project_categories" USING "btree" ("company_id");



CREATE INDEX "idx_project_categories_parent" ON "public"."project_categories" USING "btree" ("parent_category_id");



CREATE INDEX "idx_project_gantt_critical" ON "public"."project_gantt_data" USING "btree" ("critical_path");



CREATE INDEX "idx_project_gantt_dates" ON "public"."project_gantt_data" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_project_gantt_project" ON "public"."project_gantt_data" USING "btree" ("project_id");



CREATE INDEX "idx_project_gantt_task" ON "public"."project_gantt_data" USING "btree" ("task_id");



CREATE INDEX "idx_project_kpis_date" ON "public"."project_kpis" USING "btree" ("measurement_date" DESC);



CREATE INDEX "idx_project_kpis_period" ON "public"."project_kpis" USING "btree" ("measurement_period");



CREATE INDEX "idx_project_kpis_project" ON "public"."project_kpis" USING "btree" ("project_id");



CREATE INDEX "idx_project_members_active" ON "public"."project_members" USING "btree" ("is_active");



CREATE INDEX "idx_project_members_employee" ON "public"."project_members" USING "btree" ("employee_id");



CREATE INDEX "idx_project_members_project" ON "public"."project_members" USING "btree" ("project_id");



CREATE INDEX "idx_project_members_role" ON "public"."project_members" USING "btree" ("role");



CREATE INDEX "idx_project_tasks_assigned" ON "public"."project_tasks" USING "btree" ("assigned_to");



CREATE INDEX "idx_project_tasks_company" ON "public"."project_tasks" USING "btree" ("company_id");



CREATE INDEX "idx_project_tasks_due_date" ON "public"."project_tasks" USING "btree" ("due_date");



CREATE INDEX "idx_project_tasks_parent" ON "public"."project_tasks" USING "btree" ("parent_task_id");



CREATE INDEX "idx_project_tasks_project" ON "public"."project_tasks" USING "btree" ("project_id");



CREATE INDEX "idx_project_tasks_status" ON "public"."project_tasks" USING "btree" ("status");



CREATE INDEX "idx_project_templates_active" ON "public"."project_templates" USING "btree" ("is_active");



CREATE INDEX "idx_project_templates_category" ON "public"."project_templates" USING "btree" ("category_id");



CREATE INDEX "idx_project_templates_company" ON "public"."project_templates" USING "btree" ("company_id");



CREATE INDEX "idx_project_timesheets_billable" ON "public"."project_timesheets" USING "btree" ("is_billable");



CREATE INDEX "idx_project_timesheets_date" ON "public"."project_timesheets" USING "btree" ("work_date");



CREATE INDEX "idx_project_timesheets_employee" ON "public"."project_timesheets" USING "btree" ("employee_id");



CREATE INDEX "idx_project_timesheets_project" ON "public"."project_timesheets" USING "btree" ("project_id");



CREATE INDEX "idx_project_timesheets_status" ON "public"."project_timesheets" USING "btree" ("status");



CREATE INDEX "idx_project_timesheets_task" ON "public"."project_timesheets" USING "btree" ("task_id");



CREATE INDEX "idx_purchase_items_company" ON "public"."purchase_items" USING "btree" ("company_id");



CREATE INDEX "idx_purchase_items_purchase" ON "public"."purchase_items" USING "btree" ("purchase_id");



CREATE INDEX "idx_purchase_items_sku" ON "public"."purchase_items" USING "btree" ("sku") WHERE ("sku" IS NOT NULL);



CREATE INDEX "idx_purchase_orders_company" ON "public"."purchase_orders" USING "btree" ("company_id");



CREATE INDEX "idx_purchase_orders_purchase" ON "public"."purchase_orders" USING "btree" ("purchase_id");



CREATE INDEX "idx_purchase_orders_status" ON "public"."purchase_orders" USING "btree" ("status");



CREATE INDEX "idx_purchase_orders_supplier" ON "public"."purchase_orders" USING "btree" ("supplier_id");



CREATE INDEX "idx_purchase_receipts_company" ON "public"."purchase_receipts" USING "btree" ("company_id");



CREATE INDEX "idx_purchase_receipts_date" ON "public"."purchase_receipts" USING "btree" ("receipt_date" DESC);



CREATE INDEX "idx_purchase_receipts_supplier" ON "public"."purchase_receipts" USING "btree" ("supplier_id");



CREATE INDEX "idx_purchases_company" ON "public"."purchases" USING "btree" ("company_id");



CREATE INDEX "idx_purchases_company_supplier" ON "public"."purchases" USING "btree" ("company_id", "supplier_id");



CREATE INDEX "idx_purchases_date" ON "public"."purchases" USING "btree" ("purchase_date" DESC);



CREATE INDEX "idx_purchases_due_date" ON "public"."purchases" USING "btree" ("due_date");



CREATE INDEX "idx_purchases_number" ON "public"."purchases" USING "btree" ("purchase_number");



CREATE INDEX "idx_purchases_payment_status" ON "public"."purchases" USING "btree" ("payment_status");



CREATE INDEX "idx_purchases_status" ON "public"."purchases" USING "btree" ("status");



CREATE INDEX "idx_purchases_supplier" ON "public"."purchases" USING "btree" ("supplier_id");



CREATE INDEX "idx_quotes_company" ON "public"."quotes" USING "btree" ("company_id");



CREATE INDEX "idx_quotes_customer" ON "public"."quotes" USING "btree" ("customer_id");



CREATE INDEX "idx_quotes_date" ON "public"."quotes" USING "btree" ("quote_date");



CREATE INDEX "idx_quotes_number" ON "public"."quotes" USING "btree" ("quote_number");



CREATE INDEX "idx_quotes_status" ON "public"."quotes" USING "btree" ("status");



CREATE INDEX "idx_report_cache_cache_key" ON "public"."report_cache" USING "btree" ("cache_key");



CREATE INDEX "idx_report_cache_company_id" ON "public"."report_cache" USING "btree" ("company_id");



CREATE INDEX "idx_report_cache_expires_at" ON "public"."report_cache" USING "btree" ("expires_at");



CREATE INDEX "idx_report_executions_company_id" ON "public"."report_executions" USING "btree" ("company_id");



CREATE INDEX "idx_report_executions_created_at" ON "public"."report_executions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_report_executions_report_id" ON "public"."report_executions" USING "btree" ("report_id");



CREATE INDEX "idx_report_executions_status" ON "public"."report_executions" USING "btree" ("status");



CREATE INDEX "idx_rfa_calculations_amount" ON "public"."rfa_calculations" USING "btree" ("rfa_amount");



CREATE INDEX "idx_rfa_calculations_company_id" ON "public"."rfa_calculations" USING "btree" ("company_id");



CREATE INDEX "idx_rfa_calculations_contract" ON "public"."rfa_calculations" USING "btree" ("contract_id");



CREATE INDEX "idx_rfa_calculations_invoice" ON "public"."rfa_calculations" USING "btree" ("invoice_id") WHERE ("invoice_id" IS NOT NULL);



CREATE INDEX "idx_rfa_calculations_period" ON "public"."rfa_calculations" USING "btree" ("period_start", "period_end");



CREATE INDEX "idx_rfa_calculations_status" ON "public"."rfa_calculations" USING "btree" ("status");



CREATE INDEX "idx_role_permissions_permission" ON "public"."role_permissions" USING "btree" ("permission_id");



CREATE INDEX "idx_role_permissions_role" ON "public"."role_permissions" USING "btree" ("role_id");



CREATE INDEX "idx_roles_company" ON "public"."roles" USING "btree" ("company_id");



CREATE INDEX "idx_sectors_active" ON "public"."sectors_catalog" USING "btree" ("is_active");



CREATE INDEX "idx_sectors_category" ON "public"."sectors_catalog" USING "btree" ("category");



CREATE INDEX "idx_sectors_code" ON "public"."sectors_catalog" USING "btree" ("sector_code");



CREATE INDEX "idx_security_configurations_company" ON "public"."security_configurations" USING "btree" ("company_id");



CREATE INDEX "idx_security_events_category" ON "public"."security_events" USING "btree" ("event_category");



CREATE INDEX "idx_security_events_correlation" ON "public"."security_events" USING "btree" ("correlation_id");



CREATE INDEX "idx_security_events_ip" ON "public"."security_events" USING "btree" ("ip_address");



CREATE INDEX "idx_security_events_severity" ON "public"."security_events" USING "btree" ("severity_level", "event_timestamp" DESC);



CREATE INDEX "idx_security_events_user" ON "public"."security_events" USING "btree" ("user_id", "event_timestamp" DESC);



CREATE INDEX "idx_serial_numbers_company" ON "public"."serial_numbers" USING "btree" ("company_id");



CREATE INDEX "idx_serial_numbers_product" ON "public"."serial_numbers" USING "btree" ("product_id");



CREATE INDEX "idx_serial_numbers_serial" ON "public"."serial_numbers" USING "btree" ("serial_number");



CREATE INDEX "idx_serial_numbers_status" ON "public"."serial_numbers" USING "btree" ("status");



CREATE INDEX "idx_service_accounts_company" ON "public"."service_accounts" USING "btree" ("company_id");



CREATE INDEX "idx_skill_assessments_company_id" ON "public"."skill_assessments" USING "btree" ("company_id");



CREATE INDEX "idx_skill_assessments_date" ON "public"."skill_assessments" USING "btree" ("assessment_date");



CREATE INDEX "idx_skill_assessments_employee" ON "public"."skill_assessments" USING "btree" ("employee_id");



CREATE INDEX "idx_skill_assessments_scores" ON "public"."skill_assessments" USING "btree" ("current_score", "target_score");



CREATE INDEX "idx_skill_assessments_skill" ON "public"."skill_assessments" USING "btree" ("skill_name", "skill_category");



CREATE INDEX "idx_smart_alerts_company" ON "public"."smart_alerts" USING "btree" ("company_id");



CREATE INDEX "idx_smart_alerts_severity" ON "public"."smart_alerts" USING "btree" ("severity");



CREATE INDEX "idx_smart_alerts_triggered" ON "public"."smart_alerts" USING "btree" ("triggered_at" DESC);



CREATE INDEX "idx_smart_alerts_unread" ON "public"."smart_alerts" USING "btree" ("company_id") WHERE (("is_read" = false) AND ("is_dismissed" = false));



CREATE INDEX "idx_stock_alerts_active" ON "public"."stock_alerts" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_stock_alerts_company" ON "public"."stock_alerts" USING "btree" ("company_id");



CREATE INDEX "idx_stock_alerts_product" ON "public"."stock_alerts" USING "btree" ("product_id");



CREATE INDEX "idx_stock_alerts_severity" ON "public"."stock_alerts" USING "btree" ("severity");



CREATE INDEX "idx_stock_alerts_type" ON "public"."stock_alerts" USING "btree" ("alert_type");



CREATE INDEX "idx_stock_alerts_warehouse" ON "public"."stock_alerts" USING "btree" ("warehouse_id");



CREATE INDEX "idx_stripe_customers_stripe_id" ON "public"."stripe_customers" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_stripe_customers_user_id" ON "public"."stripe_customers" USING "btree" ("user_id");



CREATE INDEX "idx_subscription_plans_is_active" ON "public"."subscription_plans" USING "btree" ("is_active");



CREATE INDEX "idx_subscriptions_company_id" ON "public"."subscriptions" USING "btree" ("company_id");



CREATE INDEX "idx_subscriptions_period" ON "public"."subscriptions" USING "btree" ("current_period_end") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_subscriptions_plan_id" ON "public"."subscriptions" USING "btree" ("plan_id");



CREATE INDEX "idx_subscriptions_status" ON "public"."subscriptions" USING "btree" ("status");



CREATE INDEX "idx_subscriptions_stripe_customer_id" ON "public"."subscriptions" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_subscriptions_stripe_id" ON "public"."subscriptions" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_subscriptions_stripe_subscription_id" ON "public"."subscriptions" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_subscriptions_trial_end" ON "public"."subscriptions" USING "btree" ("trial_end");



CREATE INDEX "idx_subscriptions_user_id" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_supplier_contacts_primary" ON "public"."supplier_contact_persons" USING "btree" ("is_primary") WHERE ("is_primary" = true);



CREATE INDEX "idx_supplier_contacts_supplier" ON "public"."supplier_contact_persons" USING "btree" ("supplier_id");



CREATE INDEX "idx_supplier_payments_company" ON "public"."supplier_payments" USING "btree" ("company_id");



CREATE INDEX "idx_supplier_payments_date" ON "public"."supplier_payments" USING "btree" ("payment_date" DESC);



CREATE INDEX "idx_supplier_payments_purchase" ON "public"."supplier_payments" USING "btree" ("purchase_id");



CREATE INDEX "idx_supplier_payments_supplier" ON "public"."supplier_payments" USING "btree" ("supplier_id");



CREATE INDEX "idx_suppliers_active" ON "public"."suppliers" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_suppliers_company" ON "public"."suppliers" USING "btree" ("company_id");



CREATE INDEX "idx_suppliers_company_id" ON "public"."suppliers" USING "btree" ("company_id");



CREATE INDEX "idx_suppliers_name" ON "public"."suppliers" USING "btree" ("name");



CREATE INDEX "idx_suppliers_number" ON "public"."suppliers" USING "btree" ("supplier_number");



CREATE INDEX "idx_suppliers_search" ON "public"."suppliers" USING "gin" ("to_tsvector"('"french"'::"regconfig", (((("name" || ' '::"text") || COALESCE("company_name", ''::"text")) || ' '::"text") || COALESCE("email", ''::"text"))));



CREATE INDEX "idx_survey_responses_company" ON "public"."survey_responses" USING "btree" ("company_id");



CREATE INDEX "idx_survey_responses_complete" ON "public"."survey_responses" USING "btree" ("survey_id", "is_complete");



CREATE INDEX "idx_survey_responses_date" ON "public"."survey_responses" USING "btree" ("response_date");



CREATE INDEX "idx_survey_responses_employee" ON "public"."survey_responses" USING "btree" ("employee_id") WHERE ("employee_id" IS NOT NULL);



CREATE INDEX "idx_survey_responses_survey" ON "public"."survey_responses" USING "btree" ("survey_id");



CREATE INDEX "idx_system_configurations_category" ON "public"."system_configurations" USING "btree" ("category");



CREATE INDEX "idx_system_configurations_company" ON "public"."system_configurations" USING "btree" ("company_id");



CREATE INDEX "idx_system_configurations_search" ON "public"."system_configurations" USING "gin" ("to_tsvector"('"french"'::"regconfig", (("config_key" || ' '::"text") || COALESCE("description", ''::"text"))));



CREATE INDEX "idx_task_dependencies_predecessor" ON "public"."task_dependencies" USING "btree" ("predecessor_task_id");



CREATE INDEX "idx_task_dependencies_project" ON "public"."task_dependencies" USING "btree" ("project_id");



CREATE INDEX "idx_task_dependencies_successor" ON "public"."task_dependencies" USING "btree" ("successor_task_id");



CREATE INDEX "idx_tax_optimizations_company" ON "public"."tax_optimizations" USING "btree" ("company_id");



CREATE INDEX "idx_tax_optimizations_deadline" ON "public"."tax_optimizations" USING "btree" ("deadline") WHERE ("deadline" IS NOT NULL);



CREATE INDEX "idx_tax_optimizations_status" ON "public"."tax_optimizations" USING "btree" ("status");



CREATE INDEX "idx_tax_rates_active" ON "public"."tax_rates_catalog" USING "btree" ("is_active");



CREATE INDEX "idx_tax_rates_country" ON "public"."tax_rates_catalog" USING "btree" ("country_code");



CREATE INDEX "idx_tax_rates_default" ON "public"."tax_rates_catalog" USING "btree" ("country_code", "is_default");



CREATE INDEX "idx_third_parties_client_type" ON "public"."third_parties" USING "btree" ("client_type");



CREATE INDEX "idx_third_parties_code" ON "public"."third_parties" USING "btree" ("company_id", "code");



CREATE INDEX "idx_third_parties_company_id" ON "public"."third_parties" USING "btree" ("company_id");



CREATE INDEX "idx_third_parties_company_type" ON "public"."third_parties" USING "btree" ("company_id", "type");



CREATE INDEX "idx_third_parties_type" ON "public"."third_parties" USING "btree" ("type");



CREATE INDEX "idx_third_party_categories_active" ON "public"."third_party_categories" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_third_party_categories_code" ON "public"."third_party_categories" USING "btree" ("code");



CREATE INDEX "idx_third_party_categories_company" ON "public"."third_party_categories" USING "btree" ("company_id");



CREATE INDEX "idx_time_tracking_approved" ON "public"."time_tracking" USING "btree" ("company_id", "is_approved");



CREATE INDEX "idx_time_tracking_company_id" ON "public"."time_tracking" USING "btree" ("company_id");



CREATE INDEX "idx_time_tracking_date" ON "public"."time_tracking" USING "btree" ("work_date");



CREATE INDEX "idx_time_tracking_employee" ON "public"."time_tracking" USING "btree" ("employee_id");



CREATE INDEX "idx_time_tracking_employee_date" ON "public"."time_tracking" USING "btree" ("employee_id", "work_date");



CREATE INDEX "idx_timezones_name" ON "public"."timezones_catalog" USING "btree" ("timezone_name");



CREATE INDEX "idx_timezones_popular" ON "public"."timezones_catalog" USING "btree" ("is_popular");



CREATE INDEX "idx_tp_addresses_company" ON "public"."third_party_addresses" USING "btree" ("company_id");



CREATE INDEX "idx_tp_addresses_customer" ON "public"."third_party_addresses" USING "btree" ("customer_id") WHERE ("customer_id" IS NOT NULL);



CREATE INDEX "idx_tp_addresses_default" ON "public"."third_party_addresses" USING "btree" ("is_default") WHERE ("is_default" = true);



CREATE INDEX "idx_tp_addresses_supplier" ON "public"."third_party_addresses" USING "btree" ("supplier_id") WHERE ("supplier_id" IS NOT NULL);



CREATE INDEX "idx_tp_addresses_type" ON "public"."third_party_addresses" USING "btree" ("address_type");



CREATE INDEX "idx_tp_documents_company" ON "public"."third_party_documents" USING "btree" ("company_id");



CREATE INDEX "idx_tp_documents_customer" ON "public"."third_party_documents" USING "btree" ("customer_id") WHERE ("customer_id" IS NOT NULL);



CREATE INDEX "idx_tp_documents_expiry" ON "public"."third_party_documents" USING "btree" ("expiry_date") WHERE ("expiry_date" IS NOT NULL);



CREATE INDEX "idx_tp_documents_supplier" ON "public"."third_party_documents" USING "btree" ("supplier_id") WHERE ("supplier_id" IS NOT NULL);



CREATE INDEX "idx_tp_documents_type" ON "public"."third_party_documents" USING "btree" ("document_type");



CREATE INDEX "idx_training_records_category" ON "public"."training_records" USING "btree" ("training_category");



CREATE INDEX "idx_training_records_company_id" ON "public"."training_records" USING "btree" ("company_id");



CREATE INDEX "idx_training_records_dates" ON "public"."training_records" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_training_records_due" ON "public"."training_records" USING "btree" ("next_due_date") WHERE ("next_due_date" IS NOT NULL);



CREATE INDEX "idx_training_records_employee" ON "public"."training_records" USING "btree" ("employee_id");



CREATE INDEX "idx_training_records_mandatory" ON "public"."training_records" USING "btree" ("company_id", "is_mandatory");



CREATE INDEX "idx_training_records_status" ON "public"."training_records" USING "btree" ("company_id", "status");



CREATE INDEX "idx_usage_tracking_feature" ON "public"."usage_tracking" USING "btree" ("feature_name");



CREATE INDEX "idx_usage_tracking_user_id" ON "public"."usage_tracking" USING "btree" ("user_id");



CREATE INDEX "idx_user_activity_compound" ON "public"."user_activity_logs" USING "btree" ("user_id", "activity_type", "created_at");



CREATE INDEX "idx_user_activity_logs_company" ON "public"."user_activity_logs" USING "btree" ("company_id");



CREATE INDEX "idx_user_activity_logs_created" ON "public"."user_activity_logs" USING "btree" ("created_at");



CREATE INDEX "idx_user_activity_logs_user" ON "public"."user_activity_logs" USING "btree" ("user_id");



CREATE INDEX "idx_user_companies_company_id" ON "public"."user_companies" USING "btree" ("company_id");



CREATE INDEX "idx_user_companies_is_default" ON "public"."user_companies" USING "btree" ("is_default");



CREATE INDEX "idx_user_companies_user_id" ON "public"."user_companies" USING "btree" ("user_id");



CREATE INDEX "idx_user_notifications_frequency" ON "public"."user_notifications" USING "btree" ("notification_frequency");



CREATE INDEX "idx_user_notifications_user_id" ON "public"."user_notifications" USING "btree" ("user_id");



CREATE INDEX "idx_user_permissions_active" ON "public"."user_permissions" USING "btree" ("is_active", "valid_until");



CREATE INDEX "idx_user_permissions_role" ON "public"."user_permissions" USING "btree" ("role");



CREATE INDEX "idx_user_permissions_scopes" ON "public"."user_permissions" USING "gin" ("resource_scopes");



CREATE INDEX "idx_user_permissions_user_company" ON "public"."user_permissions" USING "btree" ("user_id", "company_id");



CREATE INDEX "idx_user_preferences_active" ON "public"."user_preferences" USING "btree" ("user_id", "updated_at" DESC) WHERE ("company_id" IS NOT NULL);



CREATE INDEX "idx_user_preferences_company" ON "public"."user_preferences" USING "btree" ("company_id") WHERE ("company_id" IS NOT NULL);



CREATE INDEX "idx_user_preferences_user" ON "public"."user_preferences" USING "btree" ("user_id") WHERE ("company_id" IS NOT NULL);



CREATE INDEX "idx_user_preferences_user_company" ON "public"."user_preferences" USING "btree" ("user_id", "company_id");



CREATE INDEX "idx_user_profiles_active" ON "public"."user_profiles" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_user_profiles_email" ON "public"."user_profiles" USING "btree" ("email");



CREATE INDEX "idx_user_profiles_search" ON "public"."user_profiles" USING "gin" ("to_tsvector"('"french"'::"regconfig", (("full_name" || ' '::"text") || COALESCE("email", ''::"text"))));



CREATE INDEX "idx_user_profiles_user" ON "public"."user_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_user_id" ON "public"."user_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_user_sessions_active" ON "public"."user_sessions" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_user_sessions_user" ON "public"."user_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_user_subscriptions_status" ON "public"."user_subscriptions" USING "btree" ("status");



CREATE INDEX "idx_user_subscriptions_user_id" ON "public"."user_subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_warehouses_active" ON "public"."warehouses" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_warehouses_company" ON "public"."warehouses" USING "btree" ("company_id");



CREATE INDEX "idx_warehouses_default" ON "public"."warehouses" USING "btree" ("is_default") WHERE ("is_default" = true);



CREATE INDEX "idx_webhook_settings_company" ON "public"."webhook_settings" USING "btree" ("company_id");



CREATE INDEX "idx_workflow_executions_company_id" ON "public"."workflow_executions" USING "btree" ("company_id");



CREATE INDEX "idx_workflow_executions_status" ON "public"."workflow_executions" USING "btree" ("status");



CREATE INDEX "idx_workflow_templates_company" ON "public"."workflow_templates" USING "btree" ("company_id");



CREATE INDEX "idx_workflow_templates_company_id" ON "public"."workflow_templates" USING "btree" ("company_id");



CREATE OR REPLACE TRIGGER "audit_companies_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_company_features_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."company_features" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_company_modules_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."company_modules" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_user_preferences_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "companies_updated_at_trigger" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_companies_updated_at"();



CREATE OR REPLACE TRIGGER "subscription_plans_updated_at_trigger" BEFORE UPDATE ON "public"."subscription_plans" FOR EACH ROW EXECUTE FUNCTION "public"."update_subscription_plans_updated_at"();



CREATE OR REPLACE TRIGGER "subscriptions_updated_at_trigger" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_subscriptions_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_accounts_updated" BEFORE UPDATE ON "public"."accounts" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_ai_insights_updated" BEFORE UPDATE ON "public"."ai_insights" FOR EACH ROW EXECUTE FUNCTION "public"."update_ai_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_alert_configurations_updated" BEFORE UPDATE ON "public"."alert_configurations" FOR EACH ROW EXECUTE FUNCTION "public"."update_settings_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_anomaly_detections_updated" BEFORE UPDATE ON "public"."anomaly_detections" FOR EACH ROW EXECUTE FUNCTION "public"."update_ai_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_api_configurations_updated" BEFORE UPDATE ON "public"."api_configurations" FOR EACH ROW EXECUTE FUNCTION "public"."update_settings_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_attendance_updated" BEFORE UPDATE ON "public"."attendance" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_hr_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_automation_rules_updated" BEFORE UPDATE ON "public"."automation_rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_settings_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_backup_configurations_updated" BEFORE UPDATE ON "public"."backup_configurations" FOR EACH ROW EXECUTE FUNCTION "public"."update_settings_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_bank_categorization_rules_updated" BEFORE UPDATE ON "public"."bank_categorization_rules" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_bank_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_bank_connections_updated" BEFORE UPDATE ON "public"."bank_connections" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_bank_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_bank_dashboards_updated" BEFORE UPDATE ON "public"."bank_dashboards" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_bank_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_bank_export_formats_updated" BEFORE UPDATE ON "public"."bank_export_formats" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_bank_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_bank_export_jobs_updated" BEFORE UPDATE ON "public"."bank_export_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_bank_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_bank_reconciliation_rules_updated" BEFORE UPDATE ON "public"."bank_reconciliation_rules" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_bank_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_bank_reconciliation_updated" BEFORE UPDATE ON "public"."bank_reconciliation" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_bank_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_benefits_updated" BEFORE UPDATE ON "public"."benefits" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_hr_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_budget_approvals_updated" BEFORE UPDATE ON "public"."budget_approvals" FOR EACH ROW EXECUTE FUNCTION "public"."update_budget_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_budget_assumptions_updated" BEFORE UPDATE ON "public"."budget_assumptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_budget_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_budget_categories_updated" BEFORE UPDATE ON "public"."budget_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_budget_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_budget_comments_updated" BEFORE UPDATE ON "public"."budget_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_budget_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_budget_forecasts_updated" BEFORE UPDATE ON "public"."budget_forecasts" FOR EACH ROW EXECUTE FUNCTION "public"."update_budget_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_budget_scenarios_updated" BEFORE UPDATE ON "public"."budget_scenarios" FOR EACH ROW EXECUTE FUNCTION "public"."update_budget_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_budget_templates_updated" BEFORE UPDATE ON "public"."budget_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_budget_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_budget_variance_updated" BEFORE UPDATE ON "public"."budget_variance_analysis" FOR EACH ROW EXECUTE FUNCTION "public"."update_budget_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_cache_settings_updated" BEFORE UPDATE ON "public"."cache_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_settings_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_career_progression_updated" BEFORE UPDATE ON "public"."career_progression" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_hr_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_cash_flow_predictions_updated" BEFORE UPDATE ON "public"."cash_flow_predictions" FOR EACH ROW EXECUTE FUNCTION "public"."update_ai_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_check_stock_alerts" AFTER INSERT OR UPDATE OF "quantity_on_hand" ON "public"."inventory_items" FOR EACH ROW EXECUTE FUNCTION "public"."check_stock_alerts"();



CREATE OR REPLACE TRIGGER "trigger_company_features_updated_at" BEFORE INSERT OR UPDATE ON "public"."company_features" FOR EACH ROW EXECUTE FUNCTION "public"."update_company_features_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_company_governance" BEFORE INSERT OR UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_company_governance_fields"();



CREATE OR REPLACE TRIGGER "trigger_company_modules_metadata" BEFORE UPDATE ON "public"."company_modules" FOR EACH ROW EXECUTE FUNCTION "public"."update_company_modules_metadata"();



CREATE OR REPLACE TRIGGER "trigger_company_settings_updated" BEFORE UPDATE ON "public"."company_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_settings_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_company_sizes_updated_at" BEFORE UPDATE ON "public"."company_sizes_catalog" FOR EACH ROW EXECUTE FUNCTION "public"."update_referentials_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_company_users_updated" BEFORE UPDATE ON "public"."company_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_users_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_contacts_updated" BEFORE UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_contract_amendments_updated" BEFORE UPDATE ON "public"."contract_amendments" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_contracts_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_contract_billing_updated" BEFORE UPDATE ON "public"."contract_billing" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_contract_billing_updated"();



CREATE OR REPLACE TRIGGER "trigger_contract_clauses_updated" BEFORE UPDATE ON "public"."contract_clauses" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_contracts_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_contract_kpis_updated" BEFORE UPDATE ON "public"."contract_kpis" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_contract_kpis_updated"();



CREATE OR REPLACE TRIGGER "trigger_contract_milestones_updated" BEFORE UPDATE ON "public"."contract_milestones" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_contracts_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_contract_parties_updated" BEFORE UPDATE ON "public"."contract_parties" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_contracts_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_contract_renewals_updated" BEFORE UPDATE ON "public"."contract_renewals" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_contract_renewals_updated"();



CREATE OR REPLACE TRIGGER "trigger_contract_templates_updated" BEFORE UPDATE ON "public"."contract_templates" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_contracts_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_contract_terminations_updated" BEFORE UPDATE ON "public"."contract_terminations" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_contract_terminations_updated"();



CREATE OR REPLACE TRIGGER "trigger_contract_types_updated" BEFORE UPDATE ON "public"."contract_types" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_contracts_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_contracts_updated" BEFORE UPDATE ON "public"."contracts" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_contracts_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_countries_updated_at" BEFORE UPDATE ON "public"."countries_catalog" FOR EACH ROW EXECUTE FUNCTION "public"."update_referentials_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_activities_updated" BEFORE UPDATE ON "public"."crm_activities" FOR EACH ROW EXECUTE FUNCTION "public"."update_crm_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_campaigns_updated" BEFORE UPDATE ON "public"."crm_campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."update_crm_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_clients_updated" BEFORE UPDATE ON "public"."crm_clients" FOR EACH ROW EXECUTE FUNCTION "public"."update_crm_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_leads_updated" BEFORE UPDATE ON "public"."crm_leads" FOR EACH ROW EXECUTE FUNCTION "public"."update_crm_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_notes_updated" BEFORE UPDATE ON "public"."crm_notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_crm_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_opportunities_updated" BEFORE UPDATE ON "public"."crm_opportunities" FOR EACH ROW EXECUTE FUNCTION "public"."update_crm_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_pipelines_updated" BEFORE UPDATE ON "public"."crm_pipelines" FOR EACH ROW EXECUTE FUNCTION "public"."update_crm_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_tasks_updated" BEFORE UPDATE ON "public"."crm_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_crm_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_customers_updated" BEFORE UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp_facturation"();



CREATE OR REPLACE TRIGGER "trigger_data_retention_policies_updated" BEFORE UPDATE ON "public"."data_retention_policies" FOR EACH ROW EXECUTE FUNCTION "public"."update_settings_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_delete_clients" INSTEAD OF DELETE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."delete_client_from_view"();



CREATE OR REPLACE TRIGGER "trigger_departments_updated" BEFORE UPDATE ON "public"."departments" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_hr_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_disciplinary_actions_updated" BEFORE UPDATE ON "public"."disciplinary_actions" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_hr_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_employee_benefits_updated" BEFORE UPDATE ON "public"."employee_benefits" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_hr_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_employee_contracts_updated" BEFORE UPDATE ON "public"."employee_contracts" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_hr_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_employee_surveys_updated" BEFORE UPDATE ON "public"."employee_surveys" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_hr_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_feature_flags_updated" BEFORE UPDATE ON "public"."feature_flags" FOR EACH ROW EXECUTE FUNCTION "public"."update_settings_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_fiscal_settings_updated" BEFORE UPDATE ON "public"."company_fiscal_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_fiscal_settings_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_insert_clients" INSTEAD OF INSERT ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."insert_client_from_view"();



CREATE OR REPLACE TRIGGER "trigger_leave_requests_updated" BEFORE UPDATE ON "public"."leave_requests" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_hr_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_module_configurations_updated" BEFORE UPDATE ON "public"."module_configurations" FOR EACH ROW EXECUTE FUNCTION "public"."update_settings_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_notification_channels_updated" BEFORE UPDATE ON "public"."notification_channels" FOR EACH ROW EXECUTE FUNCTION "public"."update_settings_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_notification_templates_updated" BEFORE UPDATE ON "public"."notification_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_settings_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_oauth_providers_updated" BEFORE UPDATE ON "public"."oauth_providers" FOR EACH ROW EXECUTE FUNCTION "public"."update_settings_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_onboarding_sessions_updated_at" BEFORE UPDATE ON "public"."onboarding_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_onboarding_sessions_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_password_policies_updated" BEFORE UPDATE ON "public"."password_policies" FOR EACH ROW EXECUTE FUNCTION "public"."update_settings_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_performance_reviews_updated" BEFORE UPDATE ON "public"."performance_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_hr_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_performance_settings_updated" BEFORE UPDATE ON "public"."performance_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_settings_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_positions_updated" BEFORE UPDATE ON "public"."positions" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_hr_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_project_categories_updated" BEFORE UPDATE ON "public"."project_categories" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_project_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_project_discussions_updated" BEFORE UPDATE ON "public"."project_discussions" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_project_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_project_members_updated" BEFORE UPDATE ON "public"."project_members" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_project_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_project_tasks_updated" BEFORE UPDATE ON "public"."project_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_project_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_project_templates_updated" BEFORE UPDATE ON "public"."project_templates" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_project_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_project_timesheets_updated" BEFORE UPDATE ON "public"."project_timesheets" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_project_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_purchase_items_totals" AFTER INSERT OR DELETE OR UPDATE ON "public"."purchase_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_purchase_totals"();



CREATE OR REPLACE TRIGGER "trigger_purchases_updated" BEFORE UPDATE ON "public"."purchases" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_quote_items_totals" AFTER INSERT OR DELETE OR UPDATE ON "public"."quote_items" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_quote_totals"();



CREATE OR REPLACE TRIGGER "trigger_quotes_updated" BEFORE UPDATE ON "public"."quotes" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp_facturation"();



CREATE OR REPLACE TRIGGER "trigger_recalculate_project_progress" AFTER INSERT OR DELETE OR UPDATE ON "public"."project_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_project_progress"();



CREATE OR REPLACE TRIGGER "trigger_reset_feature_usage" BEFORE UPDATE ON "public"."company_features" FOR EACH ROW EXECUTE FUNCTION "public"."reset_feature_usage_if_needed"();



CREATE OR REPLACE TRIGGER "trigger_rfa_calculations_updated" BEFORE UPDATE ON "public"."rfa_calculations" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_contracts_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_roles_updated" BEFORE UPDATE ON "public"."roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_users_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_sectors_updated_at" BEFORE UPDATE ON "public"."sectors_catalog" FOR EACH ROW EXECUTE FUNCTION "public"."update_referentials_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_security_configurations_updated" BEFORE UPDATE ON "public"."security_configurations" FOR EACH ROW EXECUTE FUNCTION "public"."update_settings_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_service_accounts_updated" BEFORE UPDATE ON "public"."service_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."update_users_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_skill_assessments_updated" BEFORE UPDATE ON "public"."skill_assessments" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_hr_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_smart_alerts_updated" BEFORE UPDATE ON "public"."smart_alerts" FOR EACH ROW EXECUTE FUNCTION "public"."update_ai_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_stripe_customers_updated" BEFORE UPDATE ON "public"."stripe_customers" FOR EACH ROW EXECUTE FUNCTION "public"."update_stripe_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_subscriptions_updated" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_stripe_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_suppliers_updated" BEFORE UPDATE ON "public"."suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_sync_companies_created_by" BEFORE INSERT OR UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."sync_companies_created_by"();



CREATE OR REPLACE TRIGGER "trigger_system_configurations_updated" BEFORE UPDATE ON "public"."system_configurations" FOR EACH ROW EXECUTE FUNCTION "public"."update_settings_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_task_comments_updated" BEFORE UPDATE ON "public"."task_comments" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_project_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_tax_optimizations_updated" BEFORE UPDATE ON "public"."tax_optimizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_ai_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_third_party_categories_updated" BEFORE UPDATE ON "public"."third_party_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_time_tracking_updated" BEFORE UPDATE ON "public"."time_tracking" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_hr_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_training_records_updated" BEFORE UPDATE ON "public"."training_records" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_hr_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_account_balance" AFTER INSERT OR DELETE OR UPDATE ON "public"."journal_entry_lines" FOR EACH ROW EXECUTE FUNCTION "public"."update_account_balance"();



CREATE OR REPLACE TRIGGER "trigger_update_clients" INSTEAD OF UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."update_client_from_view"();



CREATE OR REPLACE TRIGGER "trigger_update_journal_entry_totals" AFTER INSERT OR DELETE OR UPDATE ON "public"."journal_entry_lines" FOR EACH ROW EXECUTE FUNCTION "public"."update_journal_entry_totals"();



CREATE OR REPLACE TRIGGER "trigger_update_last_activity" AFTER INSERT ON "public"."user_activity_log" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_last_activity"();



CREATE OR REPLACE TRIGGER "trigger_update_notification_preferences_updated_at" BEFORE UPDATE ON "public"."notification_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_notification_preferences_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_onboarding_session_progress" AFTER INSERT OR UPDATE ON "public"."onboarding_history" FOR EACH ROW EXECUTE FUNCTION "public"."update_onboarding_session_progress"();



CREATE OR REPLACE TRIGGER "trigger_update_user_notifications_updated_at" BEFORE UPDATE ON "public"."user_notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_notifications_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_profiles_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_user_preferences_updated_at" BEFORE UPDATE ON "public"."user_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_preferences_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_user_profiles_updated" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_users_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_validate_user_preferences" BEFORE INSERT OR UPDATE ON "public"."user_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."validate_user_preferences"();



CREATE OR REPLACE TRIGGER "trigger_webhook_settings_updated" BEFORE UPDATE ON "public"."webhook_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_settings_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_workflow_templates_updated" BEFORE UPDATE ON "public"."workflow_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_settings_updated_at"();



CREATE OR REPLACE TRIGGER "update_crm_actions_updated_at" BEFORE UPDATE ON "public"."crm_actions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_crm_contacts_updated_at" BEFORE UPDATE ON "public"."crm_contacts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_crm_opportunities_updated_at" BEFORE UPDATE ON "public"."crm_opportunities" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_report_templates_updated_at" BEFORE UPDATE ON "public"."report_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "user_companies_updated_at_trigger" BEFORE UPDATE ON "public"."user_companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_companies_updated_at"();



ALTER TABLE ONLY "public"."accounting_periods"
    ADD CONSTRAINT "accounting_periods_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_insights"
    ADD CONSTRAINT "ai_insights_implemented_by_fkey" FOREIGN KEY ("implemented_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_insights"
    ADD CONSTRAINT "ai_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_interactions"
    ADD CONSTRAINT "ai_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."alert_configurations"
    ADD CONSTRAINT "alert_configurations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."alert_configurations"
    ADD CONSTRAINT "alert_configurations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."analytical_distributions"
    ADD CONSTRAINT "analytical_distributions_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "public"."cost_centers"("id");



ALTER TABLE ONLY "public"."analytical_distributions"
    ADD CONSTRAINT "analytical_distributions_journal_entry_line_id_fkey" FOREIGN KEY ("journal_entry_line_id") REFERENCES "public"."journal_entry_lines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytical_distributions"
    ADD CONSTRAINT "analytical_distributions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."anomaly_detections"
    ADD CONSTRAINT "anomaly_detections_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."api_configurations"
    ADD CONSTRAINT "api_configurations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."api_configurations"
    ADD CONSTRAINT "api_configurations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."automation_rules"
    ADD CONSTRAINT "automation_rules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_rules"
    ADD CONSTRAINT "automation_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."backup_configurations"
    ADD CONSTRAINT "backup_configurations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."backup_configurations"
    ADD CONSTRAINT "backup_configurations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bank_accounts"
    ADD CONSTRAINT "bank_accounts_accounting_account_id_fkey" FOREIGN KEY ("accounting_account_id") REFERENCES "public"."chart_of_accounts"("id");



ALTER TABLE ONLY "public"."bank_accounts"
    ADD CONSTRAINT "bank_accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_alert_rules"
    ADD CONSTRAINT "bank_alert_rules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_alert_rules"
    ADD CONSTRAINT "bank_alert_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bank_audit_logs"
    ADD CONSTRAINT "bank_audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bank_audit_logs"
    ADD CONSTRAINT "bank_audit_logs_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."bank_connections"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bank_audit_logs"
    ADD CONSTRAINT "bank_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bank_auth_flows"
    ADD CONSTRAINT "bank_auth_flows_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_auth_flows"
    ADD CONSTRAINT "bank_auth_flows_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."bank_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_balance_forecasts"
    ADD CONSTRAINT "bank_balance_forecasts_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_balance_forecasts"
    ADD CONSTRAINT "bank_balance_forecasts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_cash_flow_analysis"
    ADD CONSTRAINT "bank_cash_flow_analysis_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_cash_flow_analysis"
    ADD CONSTRAINT "bank_cash_flow_analysis_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_categorization_rules"
    ADD CONSTRAINT "bank_categorization_rules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_categorization_rules"
    ADD CONSTRAINT "bank_categorization_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bank_connections"
    ADD CONSTRAINT "bank_connections_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_connections"
    ADD CONSTRAINT "bank_connections_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bank_connections"
    ADD CONSTRAINT "bank_connections_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bank_connections"
    ADD CONSTRAINT "bank_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_consents"
    ADD CONSTRAINT "bank_consents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_consents"
    ADD CONSTRAINT "bank_consents_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."bank_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_dashboards"
    ADD CONSTRAINT "bank_dashboards_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_dashboards"
    ADD CONSTRAINT "bank_dashboards_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bank_dashboards"
    ADD CONSTRAINT "bank_dashboards_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bank_encrypted_credentials"
    ADD CONSTRAINT "bank_encrypted_credentials_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."bank_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_encrypted_credentials"
    ADD CONSTRAINT "bank_encrypted_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_export_formats"
    ADD CONSTRAINT "bank_export_formats_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_export_formats"
    ADD CONSTRAINT "bank_export_formats_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bank_export_jobs"
    ADD CONSTRAINT "bank_export_jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_export_jobs"
    ADD CONSTRAINT "bank_export_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bank_export_jobs"
    ADD CONSTRAINT "bank_export_jobs_export_format_id_fkey" FOREIGN KEY ("export_format_id") REFERENCES "public"."bank_export_formats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_field_mappings"
    ADD CONSTRAINT "bank_field_mappings_export_format_id_fkey" FOREIGN KEY ("export_format_id") REFERENCES "public"."bank_export_formats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_notifications"
    ADD CONSTRAINT "bank_notifications_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bank_notifications"
    ADD CONSTRAINT "bank_notifications_alert_rule_id_fkey" FOREIGN KEY ("alert_rule_id") REFERENCES "public"."bank_alert_rules"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bank_notifications"
    ADD CONSTRAINT "bank_notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_notifications"
    ADD CONSTRAINT "bank_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_reconciliation"
    ADD CONSTRAINT "bank_reconciliation_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_reconciliation"
    ADD CONSTRAINT "bank_reconciliation_bank_transaction_id_fkey" FOREIGN KEY ("bank_transaction_id") REFERENCES "public"."bank_transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_reconciliation"
    ADD CONSTRAINT "bank_reconciliation_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_reconciliation_log"
    ADD CONSTRAINT "bank_reconciliation_log_bank_transaction_id_fkey" FOREIGN KEY ("bank_transaction_id") REFERENCES "public"."bank_transactions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bank_reconciliation_log"
    ADD CONSTRAINT "bank_reconciliation_log_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_reconciliation_log"
    ADD CONSTRAINT "bank_reconciliation_log_reconciliation_id_fkey" FOREIGN KEY ("reconciliation_id") REFERENCES "public"."bank_reconciliation"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bank_reconciliation_log"
    ADD CONSTRAINT "bank_reconciliation_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bank_reconciliation_matches"
    ADD CONSTRAINT "bank_reconciliation_matches_bank_transaction_id_fkey" FOREIGN KEY ("bank_transaction_id") REFERENCES "public"."bank_transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_reconciliation_matches"
    ADD CONSTRAINT "bank_reconciliation_matches_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_reconciliation_matches"
    ADD CONSTRAINT "bank_reconciliation_matches_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bank_reconciliation_matches"
    ADD CONSTRAINT "bank_reconciliation_matches_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "public"."bank_reconciliation_rules"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bank_reconciliation_rules"
    ADD CONSTRAINT "bank_reconciliation_rules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_reconciliation_rules"
    ADD CONSTRAINT "bank_reconciliation_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bank_reconciliation"
    ADD CONSTRAINT "bank_reconciliation_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bank_sca_methods"
    ADD CONSTRAINT "bank_sca_methods_auth_flow_id_fkey" FOREIGN KEY ("auth_flow_id") REFERENCES "public"."bank_auth_flows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_sca_methods"
    ADD CONSTRAINT "bank_sca_methods_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."bank_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_spending_patterns"
    ADD CONSTRAINT "bank_spending_patterns_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_spending_patterns"
    ADD CONSTRAINT "bank_spending_patterns_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_supported_banks"
    ADD CONSTRAINT "bank_supported_banks_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."bank_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_sync_statistics"
    ADD CONSTRAINT "bank_sync_statistics_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_sync_statistics"
    ADD CONSTRAINT "bank_sync_statistics_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."bank_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_token_rotation_log"
    ADD CONSTRAINT "bank_token_rotation_log_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."bank_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_transaction_categories"
    ADD CONSTRAINT "bank_transaction_categories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_transaction_categories"
    ADD CONSTRAINT "bank_transaction_categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "public"."bank_transaction_categories"("id");



ALTER TABLE ONLY "public"."bank_transactions"
    ADD CONSTRAINT "bank_transactions_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_transactions"
    ADD CONSTRAINT "bank_transactions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_transactions"
    ADD CONSTRAINT "bank_transactions_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id");



ALTER TABLE ONLY "public"."bank_validation_rules"
    ADD CONSTRAINT "bank_validation_rules_export_format_id_fkey" FOREIGN KEY ("export_format_id") REFERENCES "public"."bank_export_formats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_webhook_configs"
    ADD CONSTRAINT "bank_webhook_configs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_webhook_configs"
    ADD CONSTRAINT "bank_webhook_configs_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."bank_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_webhook_configs"
    ADD CONSTRAINT "bank_webhook_configs_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."bank_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_webhook_events"
    ADD CONSTRAINT "bank_webhook_events_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."bank_connections"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bank_webhook_events"
    ADD CONSTRAINT "bank_webhook_events_webhook_config_id_fkey" FOREIGN KEY ("webhook_config_id") REFERENCES "public"."bank_webhook_configs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."benefits"
    ADD CONSTRAINT "benefits_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_approvals"
    ADD CONSTRAINT "budget_approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."budget_approvals"
    ADD CONSTRAINT "budget_approvals_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_approvals"
    ADD CONSTRAINT "budget_approvals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_assumptions"
    ADD CONSTRAINT "budget_assumptions_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_assumptions"
    ADD CONSTRAINT "budget_assumptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_assumptions"
    ADD CONSTRAINT "budget_assumptions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."budget_attachments"
    ADD CONSTRAINT "budget_attachments_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_attachments"
    ADD CONSTRAINT "budget_attachments_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."budget_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_attachments"
    ADD CONSTRAINT "budget_attachments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_attachments"
    ADD CONSTRAINT "budget_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."budget_categories"
    ADD CONSTRAINT "budget_categories_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_categories"
    ADD CONSTRAINT "budget_categories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_categories"
    ADD CONSTRAINT "budget_categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."budget_comments"
    ADD CONSTRAINT "budget_comments_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_comments"
    ADD CONSTRAINT "budget_comments_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."budget_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_comments"
    ADD CONSTRAINT "budget_comments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_comments"
    ADD CONSTRAINT "budget_comments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."budget_comments"
    ADD CONSTRAINT "budget_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."budget_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_forecasts"
    ADD CONSTRAINT "budget_forecasts_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_forecasts"
    ADD CONSTRAINT "budget_forecasts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_forecasts"
    ADD CONSTRAINT "budget_forecasts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."budget_lines"
    ADD CONSTRAINT "budget_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id");



ALTER TABLE ONLY "public"."budget_lines"
    ADD CONSTRAINT "budget_lines_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_notifications"
    ADD CONSTRAINT "budget_notifications_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_notifications"
    ADD CONSTRAINT "budget_notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_notifications"
    ADD CONSTRAINT "budget_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."budget_scenarios"
    ADD CONSTRAINT "budget_scenarios_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_scenarios"
    ADD CONSTRAINT "budget_scenarios_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_scenarios"
    ADD CONSTRAINT "budget_scenarios_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."budget_templates"
    ADD CONSTRAINT "budget_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_templates"
    ADD CONSTRAINT "budget_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."budget_variance_analysis"
    ADD CONSTRAINT "budget_variance_analysis_analyzed_by_fkey" FOREIGN KEY ("analyzed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."budget_variance_analysis"
    ADD CONSTRAINT "budget_variance_analysis_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_variance_analysis"
    ADD CONSTRAINT "budget_variance_analysis_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."budget_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_variance_analysis"
    ADD CONSTRAINT "budget_variance_analysis_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."cache_settings"
    ADD CONSTRAINT "cache_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cache_settings"
    ADD CONSTRAINT "cache_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."career_progression"
    ADD CONSTRAINT "career_progression_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."career_progression"
    ADD CONSTRAINT "career_progression_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."career_progression"
    ADD CONSTRAINT "career_progression_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."career_progression"
    ADD CONSTRAINT "career_progression_from_position_id_fkey" FOREIGN KEY ("from_position_id") REFERENCES "public"."positions"("id");



ALTER TABLE ONLY "public"."career_progression"
    ADD CONSTRAINT "career_progression_hr_approved_by_fkey" FOREIGN KEY ("hr_approved_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."career_progression"
    ADD CONSTRAINT "career_progression_to_position_id_fkey" FOREIGN KEY ("to_position_id") REFERENCES "public"."positions"("id");



ALTER TABLE ONLY "public"."category_account_map"
    ADD CONSTRAINT "category_account_map_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."budget_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."category_account_map"
    ADD CONSTRAINT "category_account_map_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chart_of_accounts"
    ADD CONSTRAINT "chart_of_accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chart_of_accounts"
    ADD CONSTRAINT "chart_of_accounts_parent_account_id_fkey" FOREIGN KEY ("parent_account_id") REFERENCES "public"."chart_of_accounts"("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_merged_into_company_id_fkey" FOREIGN KEY ("merged_into_company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."company_deletion_requests"
    ADD CONSTRAINT "company_deletion_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_deletion_requests"
    ADD CONSTRAINT "company_deletion_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."company_duplicates"
    ADD CONSTRAINT "company_duplicates_duplicate_company_id_fkey" FOREIGN KEY ("duplicate_company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_duplicates"
    ADD CONSTRAINT "company_duplicates_primary_company_id_fkey" FOREIGN KEY ("primary_company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_duplicates"
    ADD CONSTRAINT "company_duplicates_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."company_features"
    ADD CONSTRAINT "company_features_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_features"
    ADD CONSTRAINT "company_features_disabled_by_fkey" FOREIGN KEY ("disabled_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."company_features"
    ADD CONSTRAINT "company_features_enabled_by_fkey" FOREIGN KEY ("enabled_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."company_features"
    ADD CONSTRAINT "company_features_last_modified_by_fkey" FOREIGN KEY ("last_modified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."company_fiscal_settings"
    ADD CONSTRAINT "company_fiscal_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_invitations"
    ADD CONSTRAINT "company_invitations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_invitations"
    ADD CONSTRAINT "company_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."company_merges"
    ADD CONSTRAINT "company_merges_master_company_id_fkey" FOREIGN KEY ("master_company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."company_merges"
    ADD CONSTRAINT "company_merges_merged_company_id_fkey" FOREIGN KEY ("merged_company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."company_merges"
    ADD CONSTRAINT "company_merges_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."company_modules"
    ADD CONSTRAINT "company_modules_activated_by_fkey" FOREIGN KEY ("activated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."company_modules"
    ADD CONSTRAINT "company_modules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_settings"
    ADD CONSTRAINT "company_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_settings"
    ADD CONSTRAINT "company_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."company_users"
    ADD CONSTRAINT "company_users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_users"
    ADD CONSTRAINT "company_users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."company_users"
    ADD CONSTRAINT "company_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_reports"
    ADD CONSTRAINT "compliance_reports_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."compliance_reports"
    ADD CONSTRAINT "compliance_reports_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_reports"
    ADD CONSTRAINT "compliance_reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."configuration_categories"
    ADD CONSTRAINT "configuration_categories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."configuration_categories"
    ADD CONSTRAINT "configuration_categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."configuration_categories"
    ADD CONSTRAINT "configuration_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."configuration_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_alerts"
    ADD CONSTRAINT "contract_alerts_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_alerts"
    ADD CONSTRAINT "contract_alerts_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_alerts"
    ADD CONSTRAINT "contract_alerts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_alerts"
    ADD CONSTRAINT "contract_alerts_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_alerts"
    ADD CONSTRAINT "contract_alerts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_alerts"
    ADD CONSTRAINT "contract_alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_amendments"
    ADD CONSTRAINT "contract_amendments_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_amendments"
    ADD CONSTRAINT "contract_amendments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_amendments"
    ADD CONSTRAINT "contract_amendments_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_amendments"
    ADD CONSTRAINT "contract_amendments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_approvals"
    ADD CONSTRAINT "contract_approvals_amendment_id_fkey" FOREIGN KEY ("amendment_id") REFERENCES "public"."contract_amendments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_approvals"
    ADD CONSTRAINT "contract_approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_approvals"
    ADD CONSTRAINT "contract_approvals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_approvals"
    ADD CONSTRAINT "contract_approvals_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_approvals"
    ADD CONSTRAINT "contract_approvals_delegated_to_fkey" FOREIGN KEY ("delegated_to") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_approvals"
    ADD CONSTRAINT "contract_approvals_escalated_to_fkey" FOREIGN KEY ("escalated_to") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_billing"
    ADD CONSTRAINT "contract_billing_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_billing"
    ADD CONSTRAINT "contract_billing_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_billing"
    ADD CONSTRAINT "contract_billing_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."contract_billing"
    ADD CONSTRAINT "contract_billing_rfa_calculation_id_fkey" FOREIGN KEY ("rfa_calculation_id") REFERENCES "public"."rfa_calculations"("id");



ALTER TABLE ONLY "public"."contract_billing"
    ADD CONSTRAINT "contract_billing_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."contract_clauses"
    ADD CONSTRAINT "contract_clauses_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_clauses"
    ADD CONSTRAINT "contract_clauses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_clauses"
    ADD CONSTRAINT "contract_clauses_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_documents"
    ADD CONSTRAINT "contract_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_documents"
    ADD CONSTRAINT "contract_documents_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_documents"
    ADD CONSTRAINT "contract_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_kpi_tracking"
    ADD CONSTRAINT "contract_kpi_tracking_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_kpi_tracking"
    ADD CONSTRAINT "contract_kpi_tracking_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_kpi_tracking"
    ADD CONSTRAINT "contract_kpi_tracking_measured_by_fkey" FOREIGN KEY ("measured_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_kpi_tracking"
    ADD CONSTRAINT "contract_kpi_tracking_responsible_party_fkey" FOREIGN KEY ("responsible_party") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_kpi_tracking"
    ADD CONSTRAINT "contract_kpi_tracking_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_kpis"
    ADD CONSTRAINT "contract_kpis_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_kpis"
    ADD CONSTRAINT "contract_kpis_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_kpis"
    ADD CONSTRAINT "contract_kpis_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."contract_kpis"
    ADD CONSTRAINT "contract_kpis_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."contract_milestones"
    ADD CONSTRAINT "contract_milestones_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_milestones"
    ADD CONSTRAINT "contract_milestones_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_milestones"
    ADD CONSTRAINT "contract_milestones_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_milestones"
    ADD CONSTRAINT "contract_milestones_responsible_party_id_fkey" FOREIGN KEY ("responsible_party_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_parties"
    ADD CONSTRAINT "contract_parties_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_parties"
    ADD CONSTRAINT "contract_parties_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_parties"
    ADD CONSTRAINT "contract_parties_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."contract_parties"
    ADD CONSTRAINT "contract_parties_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_parties"
    ADD CONSTRAINT "contract_parties_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."contract_renewals"
    ADD CONSTRAINT "contract_renewals_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_renewals"
    ADD CONSTRAINT "contract_renewals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_renewals"
    ADD CONSTRAINT "contract_renewals_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_renewals"
    ADD CONSTRAINT "contract_renewals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."contract_renewals"
    ADD CONSTRAINT "contract_renewals_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."contract_templates"
    ADD CONSTRAINT "contract_templates_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_templates"
    ADD CONSTRAINT "contract_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_templates"
    ADD CONSTRAINT "contract_templates_contract_type_id_fkey" FOREIGN KEY ("contract_type_id") REFERENCES "public"."contract_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_templates"
    ADD CONSTRAINT "contract_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_terminations"
    ADD CONSTRAINT "contract_terminations_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_terminations"
    ADD CONSTRAINT "contract_terminations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_terminations"
    ADD CONSTRAINT "contract_terminations_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_terminations"
    ADD CONSTRAINT "contract_terminations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."contract_terminations"
    ADD CONSTRAINT "contract_terminations_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contract_terminations"
    ADD CONSTRAINT "contract_terminations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."contract_types"
    ADD CONSTRAINT "contract_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_contract_type_id_fkey" FOREIGN KEY ("contract_type_id") REFERENCES "public"."contract_types"("id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_internal_contact_id_fkey" FOREIGN KEY ("internal_contact_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_legal_review_by_fkey" FOREIGN KEY ("legal_review_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."contract_templates"("id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."cost_centers"
    ADD CONSTRAINT "cost_centers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cost_centers"
    ADD CONSTRAINT "cost_centers_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."cost_centers"("id");



ALTER TABLE ONLY "public"."crm_actions"
    ADD CONSTRAINT "crm_actions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."third_parties"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_actions"
    ADD CONSTRAINT "crm_actions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_actions"
    ADD CONSTRAINT "crm_actions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."crm_contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_actions"
    ADD CONSTRAINT "crm_actions_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."crm_opportunities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_activities"
    ADD CONSTRAINT "crm_activities_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."crm_activities"
    ADD CONSTRAINT "crm_activities_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."crm_clients"("id");



ALTER TABLE ONLY "public"."crm_activities"
    ADD CONSTRAINT "crm_activities_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_activities"
    ADD CONSTRAINT "crm_activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id");



ALTER TABLE ONLY "public"."crm_activities"
    ADD CONSTRAINT "crm_activities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_activities"
    ADD CONSTRAINT "crm_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."crm_leads"("id");



ALTER TABLE ONLY "public"."crm_activities"
    ADD CONSTRAINT "crm_activities_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."crm_opportunities"("id");



ALTER TABLE ONLY "public"."crm_activities"
    ADD CONSTRAINT "crm_activities_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_attachments"
    ADD CONSTRAINT "crm_attachments_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."crm_activities"("id");



ALTER TABLE ONLY "public"."crm_attachments"
    ADD CONSTRAINT "crm_attachments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."crm_clients"("id");



ALTER TABLE ONLY "public"."crm_attachments"
    ADD CONSTRAINT "crm_attachments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_attachments"
    ADD CONSTRAINT "crm_attachments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_attachments"
    ADD CONSTRAINT "crm_attachments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."crm_leads"("id");



ALTER TABLE ONLY "public"."crm_attachments"
    ADD CONSTRAINT "crm_attachments_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."crm_notes"("id");



ALTER TABLE ONLY "public"."crm_attachments"
    ADD CONSTRAINT "crm_attachments_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."crm_opportunities"("id");



ALTER TABLE ONLY "public"."crm_attachments"
    ADD CONSTRAINT "crm_attachments_parent_file_id_fkey" FOREIGN KEY ("parent_file_id") REFERENCES "public"."crm_attachments"("id");



ALTER TABLE ONLY "public"."crm_campaigns"
    ADD CONSTRAINT "crm_campaigns_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_campaigns"
    ADD CONSTRAINT "crm_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_clients"
    ADD CONSTRAINT "crm_clients_account_manager_id_fkey" FOREIGN KEY ("account_manager_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."crm_clients"
    ADD CONSTRAINT "crm_clients_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_clients"
    ADD CONSTRAINT "crm_clients_converted_from_lead_id_fkey" FOREIGN KEY ("converted_from_lead_id") REFERENCES "public"."crm_leads"("id");



ALTER TABLE ONLY "public"."crm_clients"
    ADD CONSTRAINT "crm_clients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_clients"
    ADD CONSTRAINT "crm_clients_parent_client_id_fkey" FOREIGN KEY ("parent_client_id") REFERENCES "public"."crm_clients"("id");



ALTER TABLE ONLY "public"."crm_clients"
    ADD CONSTRAINT "crm_clients_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_contacts"
    ADD CONSTRAINT "crm_contacts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."third_parties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_contacts"
    ADD CONSTRAINT "crm_contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_entity_tags"
    ADD CONSTRAINT "crm_entity_tags_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_entity_tags"
    ADD CONSTRAINT "crm_entity_tags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_entity_tags"
    ADD CONSTRAINT "crm_entity_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."crm_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_leads"
    ADD CONSTRAINT "crm_leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."crm_leads"
    ADD CONSTRAINT "crm_leads_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_leads"
    ADD CONSTRAINT "crm_leads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_leads"
    ADD CONSTRAINT "crm_leads_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."crm_sources"("id");



ALTER TABLE ONLY "public"."crm_leads"
    ADD CONSTRAINT "crm_leads_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_notes"
    ADD CONSTRAINT "crm_notes_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."crm_activities"("id");



ALTER TABLE ONLY "public"."crm_notes"
    ADD CONSTRAINT "crm_notes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."crm_clients"("id");



ALTER TABLE ONLY "public"."crm_notes"
    ADD CONSTRAINT "crm_notes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_notes"
    ADD CONSTRAINT "crm_notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_notes"
    ADD CONSTRAINT "crm_notes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."crm_leads"("id");



ALTER TABLE ONLY "public"."crm_notes"
    ADD CONSTRAINT "crm_notes_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."crm_opportunities"("id");



ALTER TABLE ONLY "public"."crm_notes"
    ADD CONSTRAINT "crm_notes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_opportunities"
    ADD CONSTRAINT "crm_opportunities_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."crm_clients"("id");



ALTER TABLE ONLY "public"."crm_opportunities"
    ADD CONSTRAINT "crm_opportunities_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_opportunities"
    ADD CONSTRAINT "crm_opportunities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_opportunities"
    ADD CONSTRAINT "crm_opportunities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."crm_leads"("id");



ALTER TABLE ONLY "public"."crm_opportunities"
    ADD CONSTRAINT "crm_opportunities_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."crm_opportunities"
    ADD CONSTRAINT "crm_opportunities_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."crm_pipelines"("id");



ALTER TABLE ONLY "public"."crm_opportunities"
    ADD CONSTRAINT "crm_opportunities_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."crm_stages"("id");



ALTER TABLE ONLY "public"."crm_opportunities"
    ADD CONSTRAINT "crm_opportunities_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_pipelines"
    ADD CONSTRAINT "crm_pipelines_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_pipelines"
    ADD CONSTRAINT "crm_pipelines_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_pipelines"
    ADD CONSTRAINT "crm_pipelines_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_sources"
    ADD CONSTRAINT "crm_sources_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_stages"
    ADD CONSTRAINT "crm_stages_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_stages"
    ADD CONSTRAINT "crm_stages_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."crm_pipelines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_tags"
    ADD CONSTRAINT "crm_tags_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_tasks"
    ADD CONSTRAINT "crm_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."crm_tasks"
    ADD CONSTRAINT "crm_tasks_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."crm_clients"("id");



ALTER TABLE ONLY "public"."crm_tasks"
    ADD CONSTRAINT "crm_tasks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_tasks"
    ADD CONSTRAINT "crm_tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_tasks"
    ADD CONSTRAINT "crm_tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."crm_leads"("id");



ALTER TABLE ONLY "public"."crm_tasks"
    ADD CONSTRAINT "crm_tasks_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."crm_opportunities"("id");



ALTER TABLE ONLY "public"."crm_tasks"
    ADD CONSTRAINT "crm_tasks_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."data_classification"
    ADD CONSTRAINT "data_classification_classified_by_fkey" FOREIGN KEY ("classified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."data_governance_audit"
    ADD CONSTRAINT "data_governance_audit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."data_retention_policies"
    ADD CONSTRAINT "data_retention_policies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."data_retention_policies"
    ADD CONSTRAINT "data_retention_policies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_parent_department_id_fkey" FOREIGN KEY ("parent_department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."disciplinary_actions"
    ADD CONSTRAINT "disciplinary_actions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."disciplinary_actions"
    ADD CONSTRAINT "disciplinary_actions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."disciplinary_actions"
    ADD CONSTRAINT "disciplinary_actions_hr_representative_fkey" FOREIGN KEY ("hr_representative") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."disciplinary_actions"
    ADD CONSTRAINT "disciplinary_actions_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."employee_benefits"
    ADD CONSTRAINT "employee_benefits_benefit_id_fkey" FOREIGN KEY ("benefit_id") REFERENCES "public"."benefits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_benefits"
    ADD CONSTRAINT "employee_benefits_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_benefits"
    ADD CONSTRAINT "employee_benefits_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_benefits"
    ADD CONSTRAINT "employee_benefits_enrolled_by_fkey" FOREIGN KEY ("enrolled_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."employee_contracts"
    ADD CONSTRAINT "employee_contracts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_contracts"
    ADD CONSTRAINT "employee_contracts_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."employee_contracts"
    ADD CONSTRAINT "employee_contracts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_contracts"
    ADD CONSTRAINT "employee_contracts_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id");



ALTER TABLE ONLY "public"."employee_documents"
    ADD CONSTRAINT "employee_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_documents"
    ADD CONSTRAINT "employee_documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_documents"
    ADD CONSTRAINT "employee_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."employee_surveys"
    ADD CONSTRAINT "employee_surveys_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_surveys"
    ADD CONSTRAINT "employee_surveys_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."encryption_keys"
    ADD CONSTRAINT "encryption_keys_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."encryption_keys"
    ADD CONSTRAINT "encryption_keys_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."feature_usage_tracking"
    ADD CONSTRAINT "feature_usage_tracking_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feature_usage_tracking"
    ADD CONSTRAINT "feature_usage_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fec_exports"
    ADD CONSTRAINT "fec_exports_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fec_exports"
    ADD CONSTRAINT "fec_exports_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."financial_reports"
    ADD CONSTRAINT "financial_reports_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_reports"
    ADD CONSTRAINT "financial_reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."inventory_adjustments"
    ADD CONSTRAINT "inventory_adjustments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_adjustments"
    ADD CONSTRAINT "inventory_adjustments_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory_adjustments"
    ADD CONSTRAINT "inventory_adjustments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_adjustments"
    ADD CONSTRAINT "inventory_adjustments_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_adjustments"
    ADD CONSTRAINT "inventory_adjustments_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_locations"
    ADD CONSTRAINT "inventory_locations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_locations"
    ADD CONSTRAINT "inventory_locations_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_quote_item_id_fkey" FOREIGN KEY ("quote_item_id") REFERENCES "public"."quote_items"("id");



ALTER TABLE ONLY "public"."invoice_lines"
    ADD CONSTRAINT "invoice_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id");



ALTER TABLE ONLY "public"."invoice_lines"
    ADD CONSTRAINT "invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_lines"
    ADD CONSTRAINT "invoice_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."invoice_templates"
    ADD CONSTRAINT "invoice_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_templates"
    ADD CONSTRAINT "invoice_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id");



ALTER TABLE ONLY "public"."invoices_stripe"
    ADD CONSTRAINT "invoices_stripe_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_third_party_id_fkey" FOREIGN KEY ("third_party_id") REFERENCES "public"."third_parties"("id");



ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_accounting_period_id_fkey" FOREIGN KEY ("accounting_period_id") REFERENCES "public"."accounting_periods"("id");



ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "public"."journals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."journal_entry_items"
    ADD CONSTRAINT "journal_entry_items_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."journal_entry_items"
    ADD CONSTRAINT "journal_entry_items_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."journal_entry_items"
    ADD CONSTRAINT "journal_entry_items_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."journal_entry_lines"
    ADD CONSTRAINT "journal_entry_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id");



ALTER TABLE ONLY "public"."journal_entry_lines"
    ADD CONSTRAINT "journal_entry_lines_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."journals"
    ADD CONSTRAINT "journals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id");



ALTER TABLE ONLY "public"."leave_types"
    ADD CONSTRAINT "leave_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."module_configurations"
    ADD CONSTRAINT "module_configurations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."module_configurations"
    ADD CONSTRAINT "module_configurations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."notification_channels"
    ADD CONSTRAINT "notification_channels_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_channels"
    ADD CONSTRAINT "notification_channels_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."notification_history"
    ADD CONSTRAINT "notification_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."oauth_providers"
    ADD CONSTRAINT "oauth_providers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."oauth_providers"
    ADD CONSTRAINT "oauth_providers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."onboarding_history"
    ADD CONSTRAINT "onboarding_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."onboarding_history"
    ADD CONSTRAINT "onboarding_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."onboarding_sessions"
    ADD CONSTRAINT "onboarding_sessions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."onboarding_sessions"
    ADD CONSTRAINT "onboarding_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."password_policies"
    ADD CONSTRAINT "password_policies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."password_policies"
    ADD CONSTRAINT "password_policies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id");



ALTER TABLE ONLY "public"."payroll"
    ADD CONSTRAINT "payroll_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payroll"
    ADD CONSTRAINT "payroll_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."employee_contracts"("id");



ALTER TABLE ONLY "public"."payroll"
    ADD CONSTRAINT "payroll_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payroll_items"
    ADD CONSTRAINT "payroll_items_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payroll_items"
    ADD CONSTRAINT "payroll_items_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "public"."payroll"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payroll"
    ADD CONSTRAINT "payroll_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."performance_reviews"
    ADD CONSTRAINT "performance_reviews_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."performance_reviews"
    ADD CONSTRAINT "performance_reviews_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."performance_reviews"
    ADD CONSTRAINT "performance_reviews_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."performance_reviews"
    ADD CONSTRAINT "performance_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."performance_settings"
    ADD CONSTRAINT "performance_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."performance_settings"
    ADD CONSTRAINT "performance_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."positions"
    ADD CONSTRAINT "positions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."positions"
    ADD CONSTRAINT "positions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."positions"
    ADD CONSTRAINT "positions_reports_to_position_id_fkey" FOREIGN KEY ("reports_to_position_id") REFERENCES "public"."positions"("id");



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "public"."product_categories"("id");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_purchase_account_id_fkey" FOREIGN KEY ("purchase_account_id") REFERENCES "public"."chart_of_accounts"("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_sales_account_id_fkey" FOREIGN KEY ("sales_account_id") REFERENCES "public"."chart_of_accounts"("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_stock_account_id_fkey" FOREIGN KEY ("stock_account_id") REFERENCES "public"."chart_of_accounts"("id");



ALTER TABLE ONLY "public"."project_baselines"
    ADD CONSTRAINT "project_baselines_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."project_baselines"
    ADD CONSTRAINT "project_baselines_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_baselines"
    ADD CONSTRAINT "project_baselines_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_baselines"
    ADD CONSTRAINT "project_baselines_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_billing_rates"
    ADD CONSTRAINT "project_billing_rates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_billing_rates"
    ADD CONSTRAINT "project_billing_rates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_billing_rates"
    ADD CONSTRAINT "project_billing_rates_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_billing_rates"
    ADD CONSTRAINT "project_billing_rates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_billing_rates"
    ADD CONSTRAINT "project_billing_rates_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."project_roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_budgets"
    ADD CONSTRAINT "project_budgets_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."project_budgets"
    ADD CONSTRAINT "project_budgets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_budgets"
    ADD CONSTRAINT "project_budgets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_budgets"
    ADD CONSTRAINT "project_budgets_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."project_phases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_budgets"
    ADD CONSTRAINT "project_budgets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_categories"
    ADD CONSTRAINT "project_categories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_categories"
    ADD CONSTRAINT "project_categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_categories"
    ADD CONSTRAINT "project_categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "public"."project_categories"("id");



ALTER TABLE ONLY "public"."project_discussions"
    ADD CONSTRAINT "project_discussions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_discussions"
    ADD CONSTRAINT "project_discussions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_discussions"
    ADD CONSTRAINT "project_discussions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_expenses"
    ADD CONSTRAINT "project_expenses_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."project_expenses"
    ADD CONSTRAINT "project_expenses_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "public"."project_budgets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_expenses"
    ADD CONSTRAINT "project_expenses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_expenses"
    ADD CONSTRAINT "project_expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_expenses"
    ADD CONSTRAINT "project_expenses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_expenses"
    ADD CONSTRAINT "project_expenses_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_forecasts"
    ADD CONSTRAINT "project_forecasts_calculated_by_fkey" FOREIGN KEY ("calculated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_forecasts"
    ADD CONSTRAINT "project_forecasts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_forecasts"
    ADD CONSTRAINT "project_forecasts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_gantt_data"
    ADD CONSTRAINT "project_gantt_data_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_gantt_data"
    ADD CONSTRAINT "project_gantt_data_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_gantt_data"
    ADD CONSTRAINT "project_gantt_data_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_kpis"
    ADD CONSTRAINT "project_kpis_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_kpis"
    ADD CONSTRAINT "project_kpis_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."project_roles"("id");



ALTER TABLE ONLY "public"."project_milestones"
    ADD CONSTRAINT "project_milestones_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."project_milestones"
    ADD CONSTRAINT "project_milestones_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_milestones"
    ADD CONSTRAINT "project_milestones_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_milestones"
    ADD CONSTRAINT "project_milestones_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."project_phases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_milestones"
    ADD CONSTRAINT "project_milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_notifications"
    ADD CONSTRAINT "project_notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_notifications"
    ADD CONSTRAINT "project_notifications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_notifications"
    ADD CONSTRAINT "project_notifications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_notifications"
    ADD CONSTRAINT "project_notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_phases"
    ADD CONSTRAINT "project_phases_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_phases"
    ADD CONSTRAINT "project_phases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_phases"
    ADD CONSTRAINT "project_phases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_resources"
    ADD CONSTRAINT "project_resources_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_resources"
    ADD CONSTRAINT "project_resources_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_resources"
    ADD CONSTRAINT "project_resources_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_roles"
    ADD CONSTRAINT "project_roles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_schedules"
    ADD CONSTRAINT "project_schedules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_schedules"
    ADD CONSTRAINT "project_schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_schedules"
    ADD CONSTRAINT "project_schedules_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_statuses"
    ADD CONSTRAINT "project_statuses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_tasks"
    ADD CONSTRAINT "project_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."project_tasks"
    ADD CONSTRAINT "project_tasks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_tasks"
    ADD CONSTRAINT "project_tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_tasks"
    ADD CONSTRAINT "project_tasks_parent_task_id_fkey" FOREIGN KEY ("parent_task_id") REFERENCES "public"."project_tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_tasks"
    ADD CONSTRAINT "project_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_tasks"
    ADD CONSTRAINT "project_tasks_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "public"."task_types"("id");



ALTER TABLE ONLY "public"."project_tasks"
    ADD CONSTRAINT "project_tasks_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_templates"
    ADD CONSTRAINT "project_templates_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."project_categories"("id");



ALTER TABLE ONLY "public"."project_templates"
    ADD CONSTRAINT "project_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_templates"
    ADD CONSTRAINT "project_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_timesheets"
    ADD CONSTRAINT "project_timesheets_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."project_timesheets"
    ADD CONSTRAINT "project_timesheets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_timesheets"
    ADD CONSTRAINT "project_timesheets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_timesheets"
    ADD CONSTRAINT "project_timesheets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_timesheets"
    ADD CONSTRAINT "project_timesheets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_timesheets"
    ADD CONSTRAINT "project_timesheets_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."third_parties"("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."purchase_items"
    ADD CONSTRAINT "purchase_items_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_items"
    ADD CONSTRAINT "purchase_items_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."purchase_receipts"
    ADD CONSTRAINT "purchase_receipts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_receipts"
    ADD CONSTRAINT "purchase_receipts_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_receipts"
    ADD CONSTRAINT "purchase_receipts_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_receipts"
    ADD CONSTRAINT "purchase_receipts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."quote_items"
    ADD CONSTRAINT "quote_items_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."resource_allocations"
    ADD CONSTRAINT "resource_allocations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resource_allocations"
    ADD CONSTRAINT "resource_allocations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."resource_allocations"
    ADD CONSTRAINT "resource_allocations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resource_allocations"
    ADD CONSTRAINT "resource_allocations_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."project_resources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resource_allocations"
    ADD CONSTRAINT "resource_allocations_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rfa_calculations"
    ADD CONSTRAINT "rfa_calculations_calculated_by_fkey" FOREIGN KEY ("calculated_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."rfa_calculations"
    ADD CONSTRAINT "rfa_calculations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rfa_calculations"
    ADD CONSTRAINT "rfa_calculations_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rfa_calculations"
    ADD CONSTRAINT "rfa_calculations_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id");



ALTER TABLE ONLY "public"."rfa_calculations"
    ADD CONSTRAINT "rfa_calculations_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."sectors_catalog"
    ADD CONSTRAINT "sectors_catalog_parent_sector_code_fkey" FOREIGN KEY ("parent_sector_code") REFERENCES "public"."sectors_catalog"("sector_code");



ALTER TABLE ONLY "public"."security_configurations"
    ADD CONSTRAINT "security_configurations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."security_configurations"
    ADD CONSTRAINT "security_configurations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."serial_numbers"
    ADD CONSTRAINT "serial_numbers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."serial_numbers"
    ADD CONSTRAINT "serial_numbers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."serial_numbers"
    ADD CONSTRAINT "serial_numbers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."serial_numbers"
    ADD CONSTRAINT "serial_numbers_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."serial_numbers"
    ADD CONSTRAINT "serial_numbers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."serial_numbers"
    ADD CONSTRAINT "serial_numbers_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_accounts"
    ADD CONSTRAINT "service_accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_accounts"
    ADD CONSTRAINT "service_accounts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."skill_assessments"
    ADD CONSTRAINT "skill_assessments_assessor_id_fkey" FOREIGN KEY ("assessor_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."skill_assessments"
    ADD CONSTRAINT "skill_assessments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."skill_assessments"
    ADD CONSTRAINT "skill_assessments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."skill_assessments"
    ADD CONSTRAINT "skill_assessments_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."smart_alerts"
    ADD CONSTRAINT "smart_alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."smart_alerts"
    ADD CONSTRAINT "smart_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stock_alerts"
    ADD CONSTRAINT "stock_alerts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_alerts"
    ADD CONSTRAINT "stock_alerts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_alerts"
    ADD CONSTRAINT "stock_alerts_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_alerts"
    ADD CONSTRAINT "stock_alerts_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."supplier_contact_persons"
    ADD CONSTRAINT "supplier_contact_persons_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."supplier_contact_persons"
    ADD CONSTRAINT "supplier_contact_persons_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."supplier_payments"
    ADD CONSTRAINT "supplier_payments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."supplier_payments"
    ADD CONSTRAINT "supplier_payments_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."supplier_payments"
    ADD CONSTRAINT "supplier_payments_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "public"."employee_surveys"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_configurations"
    ADD CONSTRAINT "system_configurations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_configurations"
    ADD CONSTRAINT "system_configurations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."task_attachments"
    ADD CONSTRAINT "task_attachments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_attachments"
    ADD CONSTRAINT "task_attachments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_attachments"
    ADD CONSTRAINT "task_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_attachments"
    ADD CONSTRAINT "task_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."task_checklists"
    ADD CONSTRAINT "task_checklists_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_checklists"
    ADD CONSTRAINT "task_checklists_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."task_checklists"
    ADD CONSTRAINT "task_checklists_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."task_checklists"
    ADD CONSTRAINT "task_checklists_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_checklists"
    ADD CONSTRAINT "task_checklists_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."task_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_dependencies"
    ADD CONSTRAINT "task_dependencies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."task_dependencies"
    ADD CONSTRAINT "task_dependencies_predecessor_task_id_fkey" FOREIGN KEY ("predecessor_task_id") REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_dependencies"
    ADD CONSTRAINT "task_dependencies_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_dependencies"
    ADD CONSTRAINT "task_dependencies_successor_task_id_fkey" FOREIGN KEY ("successor_task_id") REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_statuses"
    ADD CONSTRAINT "task_statuses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_types"
    ADD CONSTRAINT "task_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tax_declarations"
    ADD CONSTRAINT "tax_declarations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tax_declarations"
    ADD CONSTRAINT "tax_declarations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tax_optimizations"
    ADD CONSTRAINT "tax_optimizations_implemented_by_fkey" FOREIGN KEY ("implemented_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tax_optimizations"
    ADD CONSTRAINT "tax_optimizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tax_rates_catalog"
    ADD CONSTRAINT "tax_rates_catalog_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "public"."countries_catalog"("code");



ALTER TABLE ONLY "public"."third_parties"
    ADD CONSTRAINT "third_parties_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."third_parties"
    ADD CONSTRAINT "third_parties_customer_account_id_fkey" FOREIGN KEY ("customer_account_id") REFERENCES "public"."chart_of_accounts"("id");



ALTER TABLE ONLY "public"."third_parties"
    ADD CONSTRAINT "third_parties_supplier_account_id_fkey" FOREIGN KEY ("supplier_account_id") REFERENCES "public"."chart_of_accounts"("id");



ALTER TABLE ONLY "public"."third_party_addresses"
    ADD CONSTRAINT "third_party_addresses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."third_party_addresses"
    ADD CONSTRAINT "third_party_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."third_party_addresses"
    ADD CONSTRAINT "third_party_addresses_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."third_party_categories"
    ADD CONSTRAINT "third_party_categories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."third_party_documents"
    ADD CONSTRAINT "third_party_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."third_party_documents"
    ADD CONSTRAINT "third_party_documents_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."third_party_documents"
    ADD CONSTRAINT "third_party_documents_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."time_tracking"
    ADD CONSTRAINT "time_tracking_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."time_tracking"
    ADD CONSTRAINT "time_tracking_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."time_tracking"
    ADD CONSTRAINT "time_tracking_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_records"
    ADD CONSTRAINT "training_records_budget_approved_by_fkey" FOREIGN KEY ("budget_approved_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."training_records"
    ADD CONSTRAINT "training_records_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_records"
    ADD CONSTRAINT "training_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usage_tracking"
    ADD CONSTRAINT "usage_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_activity_log"
    ADD CONSTRAINT "user_activity_log_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_activity_log"
    ADD CONSTRAINT "user_activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_activity_logs"
    ADD CONSTRAINT "user_activity_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_activity_logs"
    ADD CONSTRAINT "user_activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_companies"
    ADD CONSTRAINT "user_companies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_companies"
    ADD CONSTRAINT "user_companies_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_companies"
    ADD CONSTRAINT "user_companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_deletion_requests"
    ADD CONSTRAINT "user_deletion_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."warehouses"
    ADD CONSTRAINT "warehouses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webhook_settings"
    ADD CONSTRAINT "webhook_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webhook_settings"
    ADD CONSTRAINT "webhook_settings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."workflow_executions"
    ADD CONSTRAINT "workflow_executions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_executions"
    ADD CONSTRAINT "workflow_executions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."workflow_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_templates"
    ADD CONSTRAINT "workflow_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_templates"
    ADD CONSTRAINT "workflow_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



CREATE POLICY "AI performance metrics are company-scoped" ON "public"."ai_performance_metrics" USING ((("company_id" IS NULL) OR ("company_id" IN ( SELECT "uc"."company_id"
   FROM "public"."user_companies" "uc"
  WHERE (("uc"."user_id" = "auth"."uid"()) AND ("uc"."is_active" = true))))));



CREATE POLICY "Admins can view audit logs" ON "public"."audit_logs" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."user_permissions" "up"
  WHERE (("up"."user_id" = "auth"."uid"()) AND ("up"."company_id" = "audit_logs"."company_id") AND ("up"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])) AND ("up"."is_active" = true)))) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "Anyone can view available features" ON "public"."available_features" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Authenticated users can create companies" ON "public"."companies" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can read report templates" ON "public"."report_templates" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view module catalog" ON "public"."module_catalog" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Bank providers read access" ON "public"."bank_providers" FOR SELECT USING (true);



CREATE POLICY "Bank supported banks read access" ON "public"."bank_supported_banks" FOR SELECT USING (true);



CREATE POLICY "Budget templates access" ON "public"."budget_templates" FOR SELECT USING ((("company_id" IS NULL) OR ("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Budget templates delete" ON "public"."budget_templates" FOR DELETE USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Budget templates modify" ON "public"."budget_templates" FOR INSERT WITH CHECK (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Budget templates update" ON "public"."budget_templates" FOR UPDATE USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "CRM actions access" ON "public"."crm_actions" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "CRM contacts access" ON "public"."crm_contacts" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Company access" ON "public"."attendance" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."benefits" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."career_progression" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."contract_alerts" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."contract_amendments" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."contract_approvals" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."contract_clauses" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."contract_documents" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."contract_kpi_tracking" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."contract_milestones" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."contract_parties" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."contract_templates" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."contract_types" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."contracts" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."departments" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."disciplinary_actions" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."employee_benefits" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."employee_contracts" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."employee_documents" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."employee_surveys" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."inventory_adjustments" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company access" ON "public"."inventory_items" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company access" ON "public"."inventory_locations" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company access" ON "public"."inventory_movements" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company access" ON "public"."leave_requests" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."leave_types" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."payroll" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."payroll_items" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."performance_reviews" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."positions" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."product_categories" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company access" ON "public"."product_variants" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company access" ON "public"."rfa_calculations" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."serial_numbers" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company access" ON "public"."skill_assessments" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."stock_alerts" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company access" ON "public"."survey_responses" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."time_tracking" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."training_records" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE (("companies"."id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") OR ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Company access" ON "public"."warehouses" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company accounts access" ON "public"."accounts" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company admins can manage features" ON "public"."company_features" USING ((EXISTS ( SELECT 1
   FROM "public"."user_companies" "uc"
  WHERE (("uc"."user_id" = "auth"."uid"()) AND ("uc"."company_id" = "company_features"."company_id") AND ("uc"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])) AND ("uc"."is_active" = true)))));



CREATE POLICY "Company admins can manage modules" ON "public"."company_modules" USING ((EXISTS ( SELECT 1
   FROM "public"."user_companies" "uc"
  WHERE (("uc"."user_id" = "auth"."uid"()) AND ("uc"."company_id" = "company_modules"."company_id") AND ("uc"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])) AND ("uc"."is_active" = true)))));



CREATE POLICY "Company admins can view onboarding history" ON "public"."onboarding_history" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_companies" "uc"
  WHERE (("uc"."user_id" = "auth"."uid"()) AND ("uc"."company_id" = "onboarding_history"."company_id") AND ("uc"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])) AND ("uc"."is_active" = true)))));



CREATE POLICY "Company admins can view preferences" ON "public"."user_preferences" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_companies" "uc"
  WHERE (("uc"."user_id" = "auth"."uid"()) AND ("uc"."company_id" = "user_preferences"."company_id") AND ("uc"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])) AND ("uc"."is_active" = true)))));



CREATE POLICY "Company alert configurations access" ON "public"."alert_configurations" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company api configurations access" ON "public"."api_configurations" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company attachments access" ON "public"."crm_attachments" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company automation rules access" ON "public"."automation_rules" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company backup configurations access" ON "public"."backup_configurations" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company bank analytics access" ON "public"."bank_cash_flow_analysis" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company bank categories access" ON "public"."bank_transaction_categories" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company bank connections access" ON "public"."bank_connections" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company bank dashboards access" ON "public"."bank_dashboards" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company bank notifications access" ON "public"."bank_notifications" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company bank reconciliation access" ON "public"."bank_reconciliation" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company bank rules access" ON "public"."bank_reconciliation_rules" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company billing access" ON "public"."contract_billing" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company budget approvals access" ON "public"."budget_approvals" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company budget assumptions access" ON "public"."budget_assumptions" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company budget attachments access" ON "public"."budget_attachments" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company budget categories access" ON "public"."budget_categories" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company budget comments access" ON "public"."budget_comments" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company budget forecasts access" ON "public"."budget_forecasts" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company budget scenarios access" ON "public"."budget_scenarios" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company budget variance access" ON "public"."budget_variance_analysis" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company cache settings access" ON "public"."cache_settings" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company campaigns access" ON "public"."crm_campaigns" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company configuration categories access" ON "public"."configuration_categories" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company contacts access" ON "public"."contacts" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company data retention policies access" ON "public"."data_retention_policies" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company entity tags access" ON "public"."crm_entity_tags" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company feature flags access" ON "public"."feature_flags" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company feature usage tracking access" ON "public"."feature_usage_tracking" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company invoice items access" ON "public"."invoice_items" USING (("invoice_id" IN ( SELECT "invoices"."id"
   FROM "public"."invoices"
  WHERE ("invoices"."company_id" IN ( SELECT "companies"."id"
           FROM "public"."companies"
          WHERE ("companies"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Company kpis access" ON "public"."contract_kpis" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company leads access" ON "public"."crm_leads" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company members can view features" ON "public"."company_features" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_companies" "uc"
  WHERE (("uc"."user_id" = "auth"."uid"()) AND ("uc"."company_id" = "company_features"."company_id") AND ("uc"."is_active" = true)))));



CREATE POLICY "Company members can view modules" ON "public"."company_modules" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_companies" "uc"
  WHERE (("uc"."user_id" = "auth"."uid"()) AND ("uc"."company_id" = "company_modules"."company_id") AND ("uc"."is_active" = true)))));



CREATE POLICY "Company module configurations access" ON "public"."module_configurations" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company notes access" ON "public"."crm_notes" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company notification channels access" ON "public"."notification_channels" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company notification templates access" ON "public"."notification_templates" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company oauth providers access" ON "public"."oauth_providers" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company owners can manage permissions" ON "public"."user_permissions" USING ((EXISTS ( SELECT 1
   FROM "public"."user_permissions" "up"
  WHERE (("up"."user_id" = "auth"."uid"()) AND ("up"."company_id" = "user_permissions"."company_id") AND ("up"."role" = 'owner'::"text") AND ("up"."is_active" = true)))));



CREATE POLICY "Company owners can update their companies" ON "public"."companies" FOR UPDATE USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Company owners can view company activity" ON "public"."user_activity_log" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE (("user_companies"."user_id" = "auth"."uid"()) AND ("user_companies"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])) AND ("user_companies"."is_active" = true)))));



CREATE POLICY "Company password policies access" ON "public"."password_policies" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company payments access" ON "public"."payments" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company performance settings access" ON "public"."performance_settings" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company permissions access" ON "public"."permissions" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company pipelines access" ON "public"."crm_pipelines" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company project budgets access" ON "public"."project_budgets" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company project categories access" ON "public"."project_categories" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company project kpis access" ON "public"."project_kpis" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company project members access" ON "public"."project_members" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company project tasks access" ON "public"."project_tasks" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company project timesheets access" ON "public"."project_timesheets" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company purchase items access" ON "public"."purchase_items" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company quote items access" ON "public"."quote_items" USING (("quote_id" IN ( SELECT "quotes"."id"
   FROM "public"."quotes"
  WHERE ("quotes"."company_id" IN ( SELECT "companies"."id"
           FROM "public"."companies"
          WHERE ("companies"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Company quotes access" ON "public"."quotes" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company renewals access" ON "public"."contract_renewals" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company roles access" ON "public"."roles" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company security configurations access" ON "public"."security_configurations" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company service accounts access" ON "public"."service_accounts" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company settings access" ON "public"."company_settings" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company sources access" ON "public"."crm_sources" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company stages access" ON "public"."crm_stages" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company system configurations access" ON "public"."system_configurations" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company tags access" ON "public"."crm_tags" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company tasks access" ON "public"."crm_tasks" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company terminations access" ON "public"."contract_terminations" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company third party addresses access" ON "public"."third_party_addresses" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company third party categories access" ON "public"."third_party_categories" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company third party documents access" ON "public"."third_party_documents" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company user activity logs access" ON "public"."user_activity_logs" FOR SELECT USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company users access" ON "public"."company_users" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company users can access their data" ON "public"."accounting_periods" USING ((EXISTS ( SELECT 1
   FROM "public"."user_companies"
  WHERE (("user_companies"."company_id" = "accounting_periods"."company_id") AND ("user_companies"."user_id" = "auth"."uid"())))));



CREATE POLICY "Company users can access their data" ON "public"."analytical_distributions" USING ((EXISTS ( SELECT 1
   FROM ("public"."journal_entry_lines" "jel"
     JOIN "public"."journal_entries" "je" ON (("je"."id" = "jel"."journal_entry_id")))
  WHERE (("jel"."id" = "analytical_distributions"."journal_entry_line_id") AND (EXISTS ( SELECT 1
           FROM "public"."user_companies"
          WHERE (("user_companies"."company_id" = "je"."company_id") AND ("user_companies"."user_id" = "auth"."uid"()))))))));



CREATE POLICY "Company users can access their data" ON "public"."bank_accounts" USING ((EXISTS ( SELECT 1
   FROM "public"."user_companies"
  WHERE (("user_companies"."company_id" = "bank_accounts"."company_id") AND ("user_companies"."user_id" = "auth"."uid"())))));



CREATE POLICY "Company users can access their data" ON "public"."bank_transactions" USING ((EXISTS ( SELECT 1
   FROM "public"."user_companies"
  WHERE (("user_companies"."company_id" = "bank_transactions"."company_id") AND ("user_companies"."user_id" = "auth"."uid"())))));



CREATE POLICY "Company users can access their data" ON "public"."budget_lines" USING ((EXISTS ( SELECT 1
   FROM "public"."budgets"
  WHERE (("budgets"."id" = "budget_lines"."budget_id") AND (EXISTS ( SELECT 1
           FROM "public"."user_companies"
          WHERE (("user_companies"."company_id" = "budgets"."company_id") AND ("user_companies"."user_id" = "auth"."uid"()))))))));



CREATE POLICY "Company users can access their data" ON "public"."budgets" USING ((EXISTS ( SELECT 1
   FROM "public"."user_companies"
  WHERE (("user_companies"."company_id" = "budgets"."company_id") AND ("user_companies"."user_id" = "auth"."uid"())))));



CREATE POLICY "Company users can access their data" ON "public"."chart_of_accounts" USING ((EXISTS ( SELECT 1
   FROM "public"."user_companies"
  WHERE (("user_companies"."company_id" = "chart_of_accounts"."company_id") AND ("user_companies"."user_id" = "auth"."uid"())))));



CREATE POLICY "Company users can access their data" ON "public"."cost_centers" USING ((EXISTS ( SELECT 1
   FROM "public"."user_companies"
  WHERE (("user_companies"."company_id" = "cost_centers"."company_id") AND ("user_companies"."user_id" = "auth"."uid"())))));



CREATE POLICY "Company users can access their data" ON "public"."employees" USING ((EXISTS ( SELECT 1
   FROM "public"."user_companies"
  WHERE (("user_companies"."company_id" = "employees"."company_id") AND ("user_companies"."user_id" = "auth"."uid"())))));



CREATE POLICY "Company users can access their data" ON "public"."invoice_lines" USING ((EXISTS ( SELECT 1
   FROM "public"."invoices"
  WHERE (("invoices"."id" = "invoice_lines"."invoice_id") AND (EXISTS ( SELECT 1
           FROM "public"."user_companies"
          WHERE (("user_companies"."company_id" = "invoices"."company_id") AND ("user_companies"."user_id" = "auth"."uid"()))))))));



CREATE POLICY "Company users can access their data" ON "public"."journal_entries" USING ((EXISTS ( SELECT 1
   FROM "public"."user_companies"
  WHERE (("user_companies"."company_id" = "journal_entries"."company_id") AND ("user_companies"."user_id" = "auth"."uid"())))));



CREATE POLICY "Company users can access their data" ON "public"."journal_entry_lines" USING ((EXISTS ( SELECT 1
   FROM "public"."journal_entries"
  WHERE (("journal_entries"."id" = "journal_entry_lines"."journal_entry_id") AND (EXISTS ( SELECT 1
           FROM "public"."user_companies"
          WHERE (("user_companies"."company_id" = "journal_entries"."company_id") AND ("user_companies"."user_id" = "auth"."uid"()))))))));



CREATE POLICY "Company users can access their data" ON "public"."journals" USING ((EXISTS ( SELECT 1
   FROM "public"."user_companies"
  WHERE (("user_companies"."company_id" = "journals"."company_id") AND ("user_companies"."user_id" = "auth"."uid"())))));



CREATE POLICY "Company users can access their data" ON "public"."products" USING ((EXISTS ( SELECT 1
   FROM "public"."user_companies"
  WHERE (("user_companies"."company_id" = "products"."company_id") AND ("user_companies"."user_id" = "auth"."uid"())))));



CREATE POLICY "Company users can access their data" ON "public"."projects" USING ((EXISTS ( SELECT 1
   FROM "public"."user_companies"
  WHERE (("user_companies"."company_id" = "projects"."company_id") AND ("user_companies"."user_id" = "auth"."uid"())))));



CREATE POLICY "Company users can access their data" ON "public"."tax_declarations" USING ((EXISTS ( SELECT 1
   FROM "public"."user_companies"
  WHERE (("user_companies"."company_id" = "tax_declarations"."company_id") AND ("user_companies"."user_id" = "auth"."uid"())))));



CREATE POLICY "Company users can access their data" ON "public"."third_parties" USING ((EXISTS ( SELECT 1
   FROM "public"."user_companies"
  WHERE (("user_companies"."company_id" = "third_parties"."company_id") AND ("user_companies"."user_id" = "auth"."uid"())))));



CREATE POLICY "Company webhook settings access" ON "public"."webhook_settings" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Company workflow templates access" ON "public"."workflow_templates" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Encryption keys super admin only" ON "public"."encryption_keys" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_app_meta_data" ->> 'role'::"text") = 'super_admin'::"text")))));



CREATE POLICY "Fiscal templates admin delete" ON "public"."fiscal_country_templates" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Fiscal templates admin insert" ON "public"."fiscal_country_templates" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Fiscal templates admin update" ON "public"."fiscal_country_templates" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Fiscal templates read access" ON "public"."fiscal_country_templates" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Login attempts access (system only)" ON "public"."login_attempts" FOR SELECT USING (false);



CREATE POLICY "Only superadmins can manage available features" ON "public"."available_features" USING ((EXISTS ( SELECT 1
   FROM "auth"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND (("u"."raw_user_meta_data" ->> 'role'::"text") = 'superadmin'::"text")))));



CREATE POLICY "Only superadmins can manage module catalog" ON "public"."module_catalog" USING ((EXISTS ( SELECT 1
   FROM "auth"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND (("u"."raw_user_meta_data" ->> 'role'::"text") = 'superadmin'::"text")))));



CREATE POLICY "Owners can delete their companies" ON "public"."companies" FOR DELETE TO "authenticated" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Owners can update their companies" ON "public"."companies" FOR UPDATE TO "authenticated" USING ((("owner_id" = "auth"."uid"()) OR ("id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE (("user_companies"."user_id" = "auth"."uid"()) AND ("user_companies"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))));



CREATE POLICY "Payment methods company access" ON "public"."payment_methods" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Project roles read access" ON "public"."project_roles" FOR SELECT USING ((("is_system" = true) OR ("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Project statuses read access" ON "public"."project_statuses" FOR SELECT USING ((("is_system" = true) OR ("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Public read access to company sizes" ON "public"."company_sizes_catalog" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public read access to countries" ON "public"."countries_catalog" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public read access to currencies" ON "public"."currencies_catalog" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public read access to languages" ON "public"."languages_catalog" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public read access to sectors" ON "public"."sectors_catalog" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public read access to tax rates" ON "public"."tax_rates_catalog" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public read access to timezones" ON "public"."timezones_catalog" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Purchase receipts company access" ON "public"."purchase_receipts" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Role permissions access" ON "public"."role_permissions" USING ((( SELECT "roles"."company_id"
   FROM "public"."roles"
  WHERE ("roles"."id" = "role_permissions"."role_id")) IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Security admins can view events" ON "public"."security_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_permissions" "up"
  WHERE (("up"."user_id" = "auth"."uid"()) AND ("up"."company_id" = "security_events"."company_id") AND ("up"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])) AND (("up"."permissions" -> 'security'::"text") ? 'read'::"text")))));



CREATE POLICY "Service role can manage all invoices" ON "public"."invoices_stripe" TO "service_role" USING (true);



CREATE POLICY "Supplier contacts company access" ON "public"."supplier_contact_persons" USING (("supplier_id" IN ( SELECT "third_parties"."id"
   FROM "public"."third_parties"
  WHERE ("third_parties"."company_id" IN ( SELECT "user_companies"."company_id"
           FROM "public"."user_companies"
          WHERE ("user_companies"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Supplier payments company access" ON "public"."supplier_payments" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Task types read access" ON "public"."task_types" FOR SELECT USING ((("is_system" = true) OR ("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "User audit logs access" ON "public"."bank_audit_logs" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "User budget notifications access" ON "public"."budget_notifications" USING ((("user_id" = "auth"."uid"()) AND ("company_id" IN ( SELECT "companies"."id"
   FROM "public"."companies"
  WHERE ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "User encrypted credentials access" ON "public"."bank_encrypted_credentials" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can access FEC exports for their companies" ON "public"."fec_exports" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE (("user_companies"."user_id" = "auth"."uid"()) AND ("user_companies"."is_active" = true)))));



CREATE POLICY "Users can access their companies" ON "public"."companies" USING ((("owner_id" = "auth"."uid"()) OR ("id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE (("user_companies"."user_id" = "auth"."uid"()) AND ("user_companies"."is_active" = true))))));



COMMENT ON POLICY "Users can access their companies" ON "public"."companies" IS 'Permet l''accès aux entreprises via owner_id ou via user_companies';



CREATE POLICY "Users can access their company report cache" ON "public"."report_cache" USING (true);



CREATE POLICY "Users can access their company report executions" ON "public"."report_executions" USING (true);



CREATE POLICY "Users can create companies" ON "public"."companies" FOR INSERT TO "authenticated" WITH CHECK ((("owner_id" = "auth"."uid"()) OR ("owner_id" IS NULL)));



CREATE POLICY "Users can delete own notifications" ON "public"."notifications" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own notifications" ON "public"."user_notifications" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own profile" ON "public"."user_profiles" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert accounts for their companies" ON "public"."accounts" FOR INSERT WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert companies" ON "public"."companies" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can insert own notifications" ON "public"."user_notifications" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own onboarding history" ON "public"."onboarding_history" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own preferences" ON "public"."notification_preferences" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."user_profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage AI data for their companies" ON "public"."ai_interactions" USING (("company_id" IN ( SELECT "uc"."company_id"
   FROM "public"."user_companies" "uc"
  WHERE (("uc"."user_id" = "auth"."uid"()) AND ("uc"."is_active" = true)))));



CREATE POLICY "Users can manage duplicates" ON "public"."company_duplicates" USING ((EXISTS ( SELECT 1
   FROM "public"."user_companies" "uc"
  WHERE (("uc"."user_id" = "auth"."uid"()) AND ("uc"."is_active" = true) AND ("uc"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])) AND (("uc"."company_id" = "company_duplicates"."primary_company_id") OR ("uc"."company_id" = "company_duplicates"."duplicate_company_id"))))));



CREATE POLICY "Users can manage insights for their companies" ON "public"."ai_insights" USING (("company_id" IN ( SELECT "uc"."company_id"
   FROM "public"."user_companies" "uc"
  WHERE (("uc"."user_id" = "auth"."uid"()) AND ("uc"."is_active" = true)))));



CREATE POLICY "Users can manage invitations for their companies" ON "public"."company_invitations" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE (("user_companies"."user_id" = "auth"."uid"()) AND ("user_companies"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])) AND ("user_companies"."is_active" = true)))));



CREATE POLICY "Users can manage own onboarding sessions" ON "public"."onboarding_sessions" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own preferences" ON "public"."user_preferences" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage tax optimizations for their companies" ON "public"."tax_optimizations" USING (("company_id" IN ( SELECT "uc"."company_id"
   FROM "public"."user_companies" "uc"
  WHERE (("uc"."user_id" = "auth"."uid"()) AND ("uc"."is_active" = true)))));



CREATE POLICY "Users can manage their company fiscal settings" ON "public"."company_fiscal_settings" USING (("company_id" IN ( SELECT "uc"."company_id"
   FROM "public"."user_companies" "uc"
  WHERE (("uc"."user_id" = "auth"."uid"()) AND ("uc"."is_active" = true)))));



CREATE POLICY "Users can manage their own deletion requests" ON "public"."user_deletion_requests" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own stripe customer data" ON "public"."stripe_customers" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can read own notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own preferences" ON "public"."notification_preferences" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own profile" ON "public"."user_profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own usage" ON "public"."usage_tracking" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update accounts of their companies" ON "public"."accounts" FOR UPDATE USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update companies they own or manage" ON "public"."companies" FOR UPDATE USING ((("owner_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."user_companies"
  WHERE (("user_companies"."company_id" = "companies"."id") AND ("user_companies"."user_id" = "auth"."uid"()) AND ("user_companies"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])) AND ("user_companies"."is_active" = true))))));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own notifications" ON "public"."user_notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own preferences" ON "public"."notification_preferences" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."user_profiles" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view accounts of their companies" ON "public"."accounts" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view anomalies for their companies" ON "public"."anomaly_detections" USING (("company_id" IN ( SELECT "uc"."company_id"
   FROM "public"."user_companies" "uc"
  WHERE (("uc"."user_id" = "auth"."uid"()) AND ("uc"."is_active" = true)))));



CREATE POLICY "Users can view companies they belong to" ON "public"."companies" FOR SELECT USING (("id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view companies they own" ON "public"."companies" FOR SELECT USING ((("owner_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."user_companies"
  WHERE (("user_companies"."company_id" = "companies"."id") AND ("user_companies"."user_id" = "auth"."uid"()) AND ("user_companies"."is_active" = true))))));



CREATE POLICY "Users can view own notification history" ON "public"."notification_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own notifications" ON "public"."user_notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own onboarding history" ON "public"."onboarding_history" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view predictions for their companies" ON "public"."cash_flow_predictions" USING (("company_id" IN ( SELECT "uc"."company_id"
   FROM "public"."user_companies" "uc"
  WHERE (("uc"."user_id" = "auth"."uid"()) AND ("uc"."is_active" = true)))));



CREATE POLICY "Users can view smart alerts for their companies" ON "public"."smart_alerts" USING (("company_id" IN ( SELECT "uc"."company_id"
   FROM "public"."user_companies" "uc"
  WHERE (("uc"."user_id" = "auth"."uid"()) AND ("uc"."is_active" = true)))));



CREATE POLICY "Users can view their companies" ON "public"."companies" FOR SELECT TO "authenticated" USING ((("owner_id" = "auth"."uid"()) OR ("id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own activity" ON "public"."user_activity_log" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own invoices" ON "public"."invoices_stripe" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own profile" ON "public"."user_profiles" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their permissions" ON "public"."user_permissions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their sessions" ON "public"."user_sessions" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Workflow executions company access" ON "public"."workflow_executions" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Workflow templates company access" ON "public"."workflow_templates" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."accounting_periods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_performance_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."alert_configurations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytical_distributions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."anomaly_detections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_configurations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."automation_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."available_features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."backup_configurations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_alert_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_auth_flows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_balance_forecasts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_cash_flow_analysis" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_categorization_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_consents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_dashboards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_encrypted_credentials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_export_formats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_export_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_field_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_merchant_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_reconciliation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_reconciliation_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_reconciliation_matches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_reconciliation_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_sca_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_spending_patterns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_supported_banks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_sync_statistics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_token_rotation_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_transaction_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_validation_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_webhook_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_webhook_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."benefits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budget_approvals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budget_assumptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budget_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budget_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budget_category_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "budget_category_templates_admin_only" ON "public"."budget_category_templates" USING (false);



CREATE POLICY "budget_category_templates_select_all" ON "public"."budget_category_templates" FOR SELECT USING (true);



ALTER TABLE "public"."budget_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budget_forecasts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budget_lines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budget_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budget_scenarios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budget_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budget_variance_analysis" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budgets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cache_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."career_progression" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cash_flow_predictions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."category_account_map" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "category_account_map_policy" ON "public"."category_account_map" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."chart_of_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chart_of_accounts_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chart_templates_admin_only" ON "public"."chart_of_accounts_templates" USING (false);



CREATE POLICY "chart_templates_select_all" ON "public"."chart_of_accounts_templates" FOR SELECT USING (true);



ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "companies_delete" ON "public"."companies" FOR DELETE TO "authenticated" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "companies_insert" ON "public"."companies" FOR INSERT TO "authenticated" WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "companies_select" ON "public"."companies" FOR SELECT TO "authenticated" USING ((("owner_id" = "auth"."uid"()) OR ("id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"())))));



CREATE POLICY "companies_update" ON "public"."companies" FOR UPDATE TO "authenticated" USING ((("owner_id" = "auth"."uid"()) OR ("id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE (("user_companies"."user_id" = "auth"."uid"()) AND ("user_companies"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))))) WITH CHECK ((("owner_id" = "auth"."uid"()) OR ("id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE (("user_companies"."user_id" = "auth"."uid"()) AND ("user_companies"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"])))))));



ALTER TABLE "public"."company_deletion_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_duplicates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_fiscal_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_merges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_sizes_catalog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compliance_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."configuration_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_amendments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_approvals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_billing" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_clauses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_kpi_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_kpis" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_milestones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_parties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_renewals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_terminations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contracts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cost_centers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."countries_catalog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_activities_delete" ON "public"."crm_activities" FOR DELETE TO "authenticated" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "crm_activities_insert" ON "public"."crm_activities" FOR INSERT TO "authenticated" WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "crm_activities_select" ON "public"."crm_activities" FOR SELECT TO "authenticated" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "crm_activities_update" ON "public"."crm_activities" FOR UPDATE TO "authenticated" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"())))) WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."crm_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_clients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_clients_delete" ON "public"."crm_clients" FOR DELETE TO "authenticated" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "crm_clients_insert" ON "public"."crm_clients" FOR INSERT TO "authenticated" WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "crm_clients_select" ON "public"."crm_clients" FOR SELECT TO "authenticated" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "crm_clients_update" ON "public"."crm_clients" FOR UPDATE TO "authenticated" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"())))) WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."crm_contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_entity_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_opportunities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_opportunities_delete" ON "public"."crm_opportunities" FOR DELETE TO "authenticated" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "crm_opportunities_insert" ON "public"."crm_opportunities" FOR INSERT TO "authenticated" WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "crm_opportunities_select" ON "public"."crm_opportunities" FOR SELECT TO "authenticated" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "crm_opportunities_update" ON "public"."crm_opportunities" FOR UPDATE TO "authenticated" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"())))) WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."crm_pipelines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_sources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_stages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."currencies_catalog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "customers_delete" ON "public"."customers" FOR DELETE TO "authenticated" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "customers_insert" ON "public"."customers" FOR INSERT TO "authenticated" WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "customers_select" ON "public"."customers" FOR SELECT TO "authenticated" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "customers_update" ON "public"."customers" FOR UPDATE TO "authenticated" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"())))) WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."data_classification" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."data_governance_audit" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."data_retention_policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."departments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."disciplinary_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_benefits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_contracts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_surveys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."encryption_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feature_flags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feature_usage_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fec_exports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."financial_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fiscal_country_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_adjustments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_movements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice_lines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invoices_delete" ON "public"."invoices" FOR DELETE TO "authenticated" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "invoices_insert" ON "public"."invoices" FOR INSERT TO "authenticated" WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "invoices_select" ON "public"."invoices" FOR SELECT TO "authenticated" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."invoices_stripe" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invoices_update" ON "public"."invoices" FOR UPDATE TO "authenticated" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"())))) WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."journal_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."journal_entry_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."journal_entry_lines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."journals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."languages_catalog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leave_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leave_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."legal_archives" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."login_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."module_catalog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."module_configurations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_channels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."oauth_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."onboarding_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."onboarding_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."password_policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payroll" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payroll_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."performance_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."performance_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."positions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_variants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_baselines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_billing_rates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_budgets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_discussions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_forecasts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_gantt_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_kpis" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_milestones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_phases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_resources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_statuses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_timesheets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_receipts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "purchases_delete" ON "public"."purchases" FOR DELETE TO "authenticated" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "purchases_insert" ON "public"."purchases" FOR INSERT TO "authenticated" WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "purchases_select" ON "public"."purchases" FOR SELECT TO "authenticated" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "purchases_update" ON "public"."purchases" FOR UPDATE TO "authenticated" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"())))) WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."quote_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."report_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."report_executions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."report_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resource_allocations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rfa_calculations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sectors_catalog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_configurations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."serial_numbers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."skill_assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."smart_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stock_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscription_plans_delete" ON "public"."subscription_plans" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ((("users"."raw_app_meta_data" ->> 'role'::"text") = 'super_admin'::"text") OR (("users"."email")::"text" ~~ '%@casskai.%'::"text"))))));



CREATE POLICY "subscription_plans_insert" ON "public"."subscription_plans" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ((("users"."raw_app_meta_data" ->> 'role'::"text") = 'super_admin'::"text") OR (("users"."email")::"text" ~~ '%@casskai.%'::"text"))))));



CREATE POLICY "subscription_plans_select" ON "public"."subscription_plans" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "subscription_plans_update" ON "public"."subscription_plans" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ((("users"."raw_app_meta_data" ->> 'role'::"text") = 'super_admin'::"text") OR (("users"."email")::"text" ~~ '%@casskai.%'::"text")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ((("users"."raw_app_meta_data" ->> 'role'::"text") = 'super_admin'::"text") OR (("users"."email")::"text" ~~ '%@casskai.%'::"text"))))));



ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscriptions_delete" ON "public"."subscriptions" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."user_companies" "uc"
  WHERE (("uc"."user_id" = "auth"."uid"()) AND ("uc"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"])))))));



CREATE POLICY "subscriptions_insert" ON "public"."subscriptions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "subscriptions_select" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."user_companies" "uc"
  WHERE (("uc"."user_id" = "auth"."uid"()) AND ("uc"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"])))))));



CREATE POLICY "subscriptions_update" ON "public"."subscriptions" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."user_companies" "uc"
  WHERE (("uc"."user_id" = "auth"."uid"()) AND ("uc"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))))) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."supplier_contact_persons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supplier_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."suppliers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "suppliers_delete" ON "public"."suppliers" FOR DELETE TO "authenticated" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "suppliers_insert" ON "public"."suppliers" FOR INSERT TO "authenticated" WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "suppliers_select" ON "public"."suppliers" FOR SELECT TO "authenticated" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "suppliers_update" ON "public"."suppliers" FOR UPDATE TO "authenticated" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"())))) WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "public"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."survey_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_configurations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_checklists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_dependencies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_statuses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tax_declarations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tax_optimizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tax_rates_catalog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."third_parties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."third_party_addresses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."third_party_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."third_party_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."time_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."timezones_catalog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."training_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usage_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_activity_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_activity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_companies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_companies_delete" ON "public"."user_companies" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_companies_insert" ON "public"."user_companies" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "user_companies_select" ON "public"."user_companies" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_companies_update" ON "public"."user_companies" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_deletion_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."warehouses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_executions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_templates" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."analyze_budget_variances"("p_company_id" "uuid", "p_budget_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."analyze_budget_variances"("p_company_id" "uuid", "p_budget_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."analyze_budget_variances"("p_company_id" "uuid", "p_budget_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."analyze_data_quality"() TO "anon";
GRANT ALL ON FUNCTION "public"."analyze_data_quality"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."analyze_data_quality"() TO "service_role";



GRANT ALL ON FUNCTION "public"."analyze_training_trends"("p_company_id" "uuid", "p_months_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."analyze_training_trends"("p_company_id" "uuid", "p_months_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."analyze_training_trends"("p_company_id" "uuid", "p_months_back" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_trigger_function"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_trigger_function"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_trigger_function"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_populate_budget_categories"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_populate_budget_categories"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_populate_budget_categories"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_automatic_rfa"("p_contract_id" "uuid", "p_period_start" "date", "p_period_end" "date", "p_turnover_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_automatic_rfa"("p_contract_id" "uuid", "p_period_start" "date", "p_period_end" "date", "p_turnover_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_automatic_rfa"("p_contract_id" "uuid", "p_period_start" "date", "p_period_end" "date", "p_turnover_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_employee_engagement_score"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_employee_engagement_score"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_employee_engagement_score"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_financial_health_score"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_financial_health_score"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_financial_health_score"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_project_progress"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_project_progress"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_project_progress"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_purchase_totals"("p_purchase_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_purchase_totals"("p_purchase_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_purchase_totals"("p_purchase_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_feature"("p_user_id" "uuid", "p_feature_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_feature"("p_user_id" "uuid", "p_feature_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_feature"("p_user_id" "uuid", "p_feature_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_create_trial"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_create_trial"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_create_trial"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_user_delete_account"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_user_delete_account"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_user_delete_account"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_subscription"("p_user_id" "uuid", "p_subscription_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_subscription"("p_user_id" "uuid", "p_subscription_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_subscription"("p_user_id" "uuid", "p_subscription_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_trial"("p_user_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_trial"("p_user_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_trial"("p_user_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_index_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_index_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_index_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_rls_health"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_rls_health"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_rls_health"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_stock_alerts"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_stock_alerts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_stock_alerts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_permission"("p_user_id" "uuid", "p_company_id" "uuid", "p_resource" "text", "p_action" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_permission"("p_user_id" "uuid", "p_company_id" "uuid", "p_resource" "text", "p_action" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_permission"("p_user_id" "uuid", "p_company_id" "uuid", "p_resource" "text", "p_action" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."clean_expired_report_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."clean_expired_report_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clean_expired_report_cache"() TO "service_role";



GRANT ALL ON FUNCTION "public"."convert_trial_to_paid"("p_user_id" "uuid", "p_new_plan_id" "text", "p_stripe_subscription_id" "text", "p_stripe_customer_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."convert_trial_to_paid"("p_user_id" "uuid", "p_new_plan_id" "text", "p_stripe_subscription_id" "text", "p_stripe_customer_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."convert_trial_to_paid"("p_user_id" "uuid", "p_new_plan_id" "text", "p_stripe_subscription_id" "text", "p_stripe_customer_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_audit_trail"("p_table_name" "text", "p_record_id" "text", "p_action" "text", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_audit_trail"("p_table_name" "text", "p_record_id" "text", "p_action" "text", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_audit_trail"("p_table_name" "text", "p_record_id" "text", "p_action" "text", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_basic_accounts"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_basic_accounts"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_basic_accounts"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_budget_with_standard_categories"("p_company_id" "uuid", "p_budget_year" integer, "p_budget_name" "text", "p_country_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_budget_with_standard_categories"("p_company_id" "uuid", "p_budget_year" integer, "p_budget_name" "text", "p_country_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_budget_with_standard_categories"("p_company_id" "uuid", "p_budget_year" integer, "p_budget_name" "text", "p_country_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_category" "text", "p_link" "text", "p_metadata" "jsonb", "p_expires_in_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_category" "text", "p_link" "text", "p_metadata" "jsonb", "p_expires_in_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_category" "text", "p_link" "text", "p_metadata" "jsonb", "p_expires_in_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_onboarding_session"("p_company_id" "uuid", "p_user_id" "uuid", "p_initial_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_onboarding_session"("p_company_id" "uuid", "p_user_id" "uuid", "p_initial_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_onboarding_session"("p_company_id" "uuid", "p_user_id" "uuid", "p_initial_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_trial_subscription"("p_user_id" "uuid", "p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_trial_subscription"("p_user_id" "uuid", "p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_trial_subscription"("p_user_id" "uuid", "p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."daily_security_report"() TO "anon";
GRANT ALL ON FUNCTION "public"."daily_security_report"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."daily_security_report"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_client"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_client"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_client"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_client_from_view"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_client_from_view"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_client_from_view"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_commercial_action"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_commercial_action"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_commercial_action"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_opportunity"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_opportunity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_opportunity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."detect_suspicious_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."detect_suspicious_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."detect_suspicious_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."detect_suspicious_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."detect_suspicious_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."detect_suspicious_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enable_company_feature"("p_company_id" "uuid", "p_feature_name" "text", "p_configuration" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."enable_company_feature"("p_company_id" "uuid", "p_feature_name" "text", "p_configuration" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."enable_company_feature"("p_company_id" "uuid", "p_feature_name" "text", "p_configuration" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."enable_company_module_advanced"("p_company_id" "uuid", "p_module_key" "text", "p_custom_settings" "jsonb", "p_access_level" "text", "p_user_limit" integer, "p_storage_quota_gb" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."enable_company_module_advanced"("p_company_id" "uuid", "p_module_key" "text", "p_custom_settings" "jsonb", "p_access_level" "text", "p_user_limit" integer, "p_storage_quota_gb" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."enable_company_module_advanced"("p_company_id" "uuid", "p_module_key" "text", "p_custom_settings" "jsonb", "p_access_level" "text", "p_user_limit" integer, "p_storage_quota_gb" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."encrypt_sensitive_data"("p_data" "text", "p_key_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."encrypt_sensitive_data"("p_data" "text", "p_key_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."encrypt_sensitive_data"("p_data" "text", "p_key_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_old_invitations"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_old_invitations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_old_invitations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_trials"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_trials"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_trials"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_balance_sheet"("company_id_param" "uuid", "end_date_param" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_balance_sheet"("company_id_param" "uuid", "end_date_param" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_balance_sheet"("company_id_param" "uuid", "end_date_param" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_cash_flow_forecast"("p_company_id" "uuid", "p_months_ahead" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_cash_flow_forecast"("p_company_id" "uuid", "p_months_ahead" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_cash_flow_forecast"("p_company_id" "uuid", "p_months_ahead" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_cash_flow_statement"("company_id_param" "uuid", "start_date_param" "date", "end_date_param" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_cash_flow_statement"("company_id_param" "uuid", "start_date_param" "date", "end_date_param" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_cash_flow_statement"("company_id_param" "uuid", "start_date_param" "date", "end_date_param" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_compliance_report"("p_company_id" "uuid", "p_report_type" "text", "p_period_start" "date", "p_period_end" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_compliance_report"("p_company_id" "uuid", "p_report_type" "text", "p_period_start" "date", "p_period_end" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_compliance_report"("p_company_id" "uuid", "p_report_type" "text", "p_period_start" "date", "p_period_end" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_income_statement"("company_id_param" "uuid", "start_date_param" "date", "end_date_param" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_income_statement"("company_id_param" "uuid", "start_date_param" "date", "end_date_param" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_income_statement"("company_id_param" "uuid", "start_date_param" "date", "end_date_param" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invoice_number_custom"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invoice_number_custom"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invoice_number_custom"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_purchase_number"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_purchase_number"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_purchase_number"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_quote_number"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_quote_number"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_quote_number"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_sales_report"("p_company_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_sales_report"("p_company_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_sales_report"("p_company_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_trial_balance"("company_id_param" "uuid", "end_date_param" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_trial_balance"("company_id_param" "uuid", "end_date_param" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_trial_balance"("company_id_param" "uuid", "end_date_param" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_account_balance_simple"("p_account_id" "uuid", "p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_account_balance_simple"("p_account_id" "uuid", "p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_account_balance_simple"("p_account_id" "uuid", "p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_stock_alerts"("p_company_id" "uuid", "p_warehouse_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_stock_alerts"("p_company_id" "uuid", "p_warehouse_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_stock_alerts"("p_company_id" "uuid", "p_warehouse_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_allowed_modules_for_plan"("p_plan_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_allowed_modules_for_plan"("p_plan_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_allowed_modules_for_plan"("p_plan_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_balance_sheet_data"("p_company_id" "uuid", "p_date_from" "date", "p_date_to" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_balance_sheet_data"("p_company_id" "uuid", "p_date_from" "date", "p_date_to" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_balance_sheet_data"("p_company_id" "uuid", "p_date_from" "date", "p_date_to" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_budget_forecast"("p_company_id" "uuid", "p_budget_id" "uuid", "p_as_of_date" "date", "p_mode" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_budget_forecast"("p_company_id" "uuid", "p_budget_id" "uuid", "p_as_of_date" "date", "p_mode" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_budget_forecast"("p_company_id" "uuid", "p_budget_id" "uuid", "p_as_of_date" "date", "p_mode" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_budget_forecast_kpi"("p_company_id" "uuid", "p_budget_id" "uuid", "p_as_of_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_budget_forecast_kpi"("p_company_id" "uuid", "p_budget_id" "uuid", "p_as_of_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_budget_forecast_kpi"("p_company_id" "uuid", "p_budget_id" "uuid", "p_as_of_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_cash_flow_data"("p_company_id" "uuid", "p_date_from" "date", "p_date_to" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_cash_flow_data"("p_company_id" "uuid", "p_date_from" "date", "p_date_to" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_cash_flow_data"("p_company_id" "uuid", "p_date_from" "date", "p_date_to" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_company_ai_summary"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_company_ai_summary"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_company_ai_summary"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_company_features_detailed"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_company_features_detailed"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_company_features_detailed"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_company_modules_config"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_company_modules_config"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_company_modules_config"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_complete_company_profile"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_complete_company_profile"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_complete_company_profile"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_country_config"("country_code_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_country_config"("country_code_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_country_config"("country_code_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_crm_stats_real"("company_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_crm_stats_real"("company_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_crm_stats_real"("company_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_enterprise_dashboard_data"("p_company_id" "uuid", "p_period" "text", "p_start_date" "date", "p_end_date" "date", "p_comparison_period" "text", "p_include_forecasts" boolean, "p_include_benchmarks" boolean, "p_currency" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_enterprise_dashboard_data"("p_company_id" "uuid", "p_period" "text", "p_start_date" "date", "p_end_date" "date", "p_comparison_period" "text", "p_include_forecasts" boolean, "p_include_benchmarks" boolean, "p_currency" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_enterprise_dashboard_data"("p_company_id" "uuid", "p_period" "text", "p_start_date" "date", "p_end_date" "date", "p_comparison_period" "text", "p_include_forecasts" boolean, "p_include_benchmarks" boolean, "p_currency" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_financial_ratios"("p_company_id" "uuid", "p_date_from" "date", "p_date_to" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_financial_ratios"("p_company_id" "uuid", "p_date_from" "date", "p_date_to" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_financial_ratios"("p_company_id" "uuid", "p_date_from" "date", "p_date_to" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_fiscal_template_by_country"("p_country_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_fiscal_template_by_country"("p_country_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_fiscal_template_by_country"("p_country_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_income_statement_data"("p_company_id" "uuid", "p_date_from" "date", "p_date_to" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_income_statement_data"("p_company_id" "uuid", "p_date_from" "date", "p_date_to" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_income_statement_data"("p_company_id" "uuid", "p_date_from" "date", "p_date_to" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_onboarding_stats"("p_company_id" "uuid", "p_days_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_onboarding_stats"("p_company_id" "uuid", "p_days_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_onboarding_stats"("p_company_id" "uuid", "p_days_back" integer) TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_user_profile"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_user_profile"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_user_profile"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_performance_comparison"("p_company_id" "uuid", "p_period" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_performance_comparison"("p_company_id" "uuid", "p_period" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_performance_comparison"("p_company_id" "uuid", "p_period" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_product_stock_summary"("p_product_id" "uuid", "p_warehouse_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_product_stock_summary"("p_product_id" "uuid", "p_warehouse_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_product_stock_summary"("p_product_id" "uuid", "p_warehouse_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_purchase_analytics_simple"("p_company_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_purchase_analytics_simple"("p_company_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_purchase_analytics_simple"("p_company_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_realtime_metrics"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_realtime_metrics"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_realtime_metrics"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recommended_company_sizes"("sector_code_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_recommended_company_sizes"("sector_code_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recommended_company_sizes"("sector_code_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_supplier_balance_simple"("p_supplier_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_supplier_balance_simple"("p_supplier_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_supplier_balance_simple"("p_supplier_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_third_parties_stats"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_third_parties_stats"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_third_parties_stats"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_third_party_details"("p_party_type" "text", "p_party_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_third_party_details"("p_party_type" "text", "p_party_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_third_party_details"("p_party_type" "text", "p_party_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_trial_statistics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_trial_statistics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_trial_statistics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unmapped_journal_entries"("p_company_id" "uuid", "p_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_unmapped_journal_entries"("p_company_id" "uuid", "p_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unmapped_journal_entries"("p_company_id" "uuid", "p_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_notifications"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_notifications"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_notifications"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_preferences_with_fallback"("p_user_id" "uuid", "p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_preferences_with_fallback"("p_user_id" "uuid", "p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_preferences_with_fallback"("p_user_id" "uuid", "p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_subscription_status"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_subscription_status"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_subscription_status"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_trial_info"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_trial_info"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_trial_info"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_usage_limits"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_usage_limits"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_usage_limits"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."identify_potential_duplicates"() TO "anon";
GRANT ALL ON FUNCTION "public"."identify_potential_duplicates"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."identify_potential_duplicates"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_feature_usage"("p_user_id" "uuid", "p_feature_name" "text", "p_increment" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_feature_usage"("p_user_id" "uuid", "p_feature_name" "text", "p_increment" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_feature_usage"("p_user_id" "uuid", "p_feature_name" "text", "p_increment" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."init_default_user_preferences"("p_user_id" "uuid", "p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."init_default_user_preferences"("p_user_id" "uuid", "p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."init_default_user_preferences"("p_user_id" "uuid", "p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_budget_category_mappings"("p_company_id" "uuid", "p_budget_id" "uuid", "p_country_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_budget_category_mappings"("p_company_id" "uuid", "p_budget_id" "uuid", "p_country_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_budget_category_mappings"("p_company_id" "uuid", "p_budget_id" "uuid", "p_country_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_company_chart_of_accounts"("p_company_id" "uuid", "p_country_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_company_chart_of_accounts"("p_company_id" "uuid", "p_country_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_company_chart_of_accounts"("p_company_id" "uuid", "p_country_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_client"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_client"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_client"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_client_from_view"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_client_from_view"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_client_from_view"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_commercial_action"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_commercial_action"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_commercial_action"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_opportunity"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_opportunity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_opportunity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_module_allowed_for_plan"("p_module_name" "text", "p_plan_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_module_allowed_for_plan"("p_module_name" "text", "p_plan_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_module_allowed_for_plan"("p_module_name" "text", "p_plan_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_audit_event"("p_event_type" "text", "p_table_name" "text", "p_record_id" "text", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_user_id" "uuid", "p_company_id" "uuid", "p_security_level" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_audit_event"("p_event_type" "text", "p_table_name" "text", "p_record_id" "text", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_user_id" "uuid", "p_company_id" "uuid", "p_security_level" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_audit_event"("p_event_type" "text", "p_table_name" "text", "p_record_id" "text", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_user_id" "uuid", "p_company_id" "uuid", "p_security_level" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_onboarding_step"("p_company_id" "uuid", "p_user_id" "uuid", "p_step_name" "text", "p_step_order" integer, "p_step_data" "jsonb", "p_completion_status" "text", "p_time_spent_seconds" integer, "p_session_id" "text", "p_validation_errors" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_onboarding_step"("p_company_id" "uuid", "p_user_id" "uuid", "p_step_name" "text", "p_step_order" integer, "p_step_data" "jsonb", "p_completion_status" "text", "p_time_spent_seconds" integer, "p_session_id" "text", "p_validation_errors" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_onboarding_step"("p_company_id" "uuid", "p_user_id" "uuid", "p_step_name" "text", "p_step_order" integer, "p_step_data" "jsonb", "p_completion_status" "text", "p_time_spent_seconds" integer, "p_session_id" "text", "p_validation_errors" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_security_event"("p_event_type" "text", "p_description" "text", "p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."log_security_event"("p_event_type" "text", "p_description" "text", "p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_security_event"("p_event_type" "text", "p_description" "text", "p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_notification_as_read"("p_notification_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_notification_as_read"("p_notification_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notification_as_read"("p_notification_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."normalize_company_name_safe"("company_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_company_name_safe"("company_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_company_name_safe"("company_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reactivate_subscription"("p_user_id" "uuid", "p_subscription_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reactivate_subscription"("p_user_id" "uuid", "p_subscription_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reactivate_subscription"("p_user_id" "uuid", "p_subscription_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_stock_movement_complete"("p_product_id" "uuid", "p_warehouse_id" "uuid", "p_quantity" numeric, "p_movement_type" "text", "p_unit_cost" numeric, "p_reference_type" "text", "p_reference_id" "uuid", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."record_stock_movement_complete"("p_product_id" "uuid", "p_warehouse_id" "uuid", "p_quantity" numeric, "p_movement_type" "text", "p_unit_cost" numeric, "p_reference_type" "text", "p_reference_id" "uuid", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_stock_movement_complete"("p_product_id" "uuid", "p_warehouse_id" "uuid", "p_quantity" numeric, "p_movement_type" "text", "p_unit_cost" numeric, "p_reference_type" "text", "p_reference_id" "uuid", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_feature_usage_if_needed"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_feature_usage_if_needed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_feature_usage_if_needed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."save_user_notifications"("p_email_new_transactions" boolean, "p_email_weekly_reports" boolean, "p_email_system_updates" boolean, "p_email_marketing" boolean, "p_email_invoices" boolean, "p_email_payments" boolean, "p_email_reminders" boolean, "p_push_new_transactions" boolean, "p_push_alerts" boolean, "p_push_reminders" boolean, "p_push_system_updates" boolean, "p_notification_frequency" "text", "p_quiet_hours_enabled" boolean, "p_quiet_hours_start" time without time zone, "p_quiet_hours_end" time without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."save_user_notifications"("p_email_new_transactions" boolean, "p_email_weekly_reports" boolean, "p_email_system_updates" boolean, "p_email_marketing" boolean, "p_email_invoices" boolean, "p_email_payments" boolean, "p_email_reminders" boolean, "p_push_new_transactions" boolean, "p_push_alerts" boolean, "p_push_reminders" boolean, "p_push_system_updates" boolean, "p_notification_frequency" "text", "p_quiet_hours_enabled" boolean, "p_quiet_hours_start" time without time zone, "p_quiet_hours_end" time without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_user_notifications"("p_email_new_transactions" boolean, "p_email_weekly_reports" boolean, "p_email_system_updates" boolean, "p_email_marketing" boolean, "p_email_invoices" boolean, "p_email_payments" boolean, "p_email_reminders" boolean, "p_push_new_transactions" boolean, "p_push_alerts" boolean, "p_push_reminders" boolean, "p_push_system_updates" boolean, "p_notification_frequency" "text", "p_quiet_hours_enabled" boolean, "p_quiet_hours_start" time without time zone, "p_quiet_hours_end" time without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_companies_intelligent"("p_search_term" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_companies_intelligent"("p_search_term" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_companies_intelligent"("p_search_term" "text", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_sectors"("search_term" "text", "limit_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_sectors"("search_term" "text", "limit_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_sectors"("search_term" "text", "limit_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_unified_third_parties"("p_company_id" "uuid", "p_search_term" "text", "p_party_type" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_unified_third_parties"("p_company_id" "uuid", "p_search_term" "text", "p_party_type" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_unified_third_parties"("p_company_id" "uuid", "p_search_term" "text", "p_party_type" "text", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_companies_created_by"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_companies_created_by"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_companies_created_by"() TO "service_role";



GRANT ALL ON FUNCTION "public"."transfer_company_ownership"("p_company_id" "uuid", "p_from_user_id" "uuid", "p_to_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."transfer_company_ownership"("p_company_id" "uuid", "p_from_user_id" "uuid", "p_to_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."transfer_company_ownership"("p_company_id" "uuid", "p_from_user_id" "uuid", "p_to_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_bank_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_bank_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_bank_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_contract_billing_updated"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_contract_billing_updated"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_contract_billing_updated"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_contract_kpis_updated"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_contract_kpis_updated"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_contract_kpis_updated"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_contract_renewals_updated"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_contract_renewals_updated"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_contract_renewals_updated"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_contract_terminations_updated"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_contract_terminations_updated"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_contract_terminations_updated"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_contracts_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_contracts_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_contracts_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_hr_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_hr_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_hr_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_project_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_project_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_project_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_quote_totals"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_quote_totals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_quote_totals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_account_balance"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_account_balance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_account_balance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_ai_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_ai_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_ai_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_budget_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_budget_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_budget_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_client"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_client"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_client"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_client_from_view"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_client_from_view"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_client_from_view"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_commercial_action"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_commercial_action"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_commercial_action"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_companies_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_companies_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_companies_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_company_features_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_company_features_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_company_features_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_company_governance_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_company_governance_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_company_governance_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_company_governance_manual"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_company_governance_manual"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_company_governance_manual"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_company_modules_metadata"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_company_modules_metadata"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_company_modules_metadata"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_crm_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_crm_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_crm_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_fiscal_settings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_fiscal_settings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_fiscal_settings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_journal_entry_totals"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_journal_entry_totals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_journal_entry_totals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_notification_preferences_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_notification_preferences_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_notification_preferences_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_onboarding_session_progress"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_onboarding_session_progress"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_onboarding_session_progress"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_onboarding_sessions_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_onboarding_sessions_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_onboarding_sessions_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_opportunity"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_opportunity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_opportunity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_purchase_totals"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_purchase_totals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_purchase_totals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_quote_totals"("p_quote_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_quote_totals"("p_quote_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_quote_totals"("p_quote_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_referentials_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_referentials_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_referentials_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_settings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_settings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_settings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_stripe_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_stripe_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_stripe_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_subscription_plans_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_subscription_plans_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_subscription_plans_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_subscriptions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_subscriptions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_subscriptions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_timestamp_facturation"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_timestamp_facturation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_timestamp_facturation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_companies_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_companies_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_companies_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_last_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_last_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_last_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_notifications_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_notifications_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_notifications_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_preferences_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_preferences_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_preferences_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_profiles_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_profiles_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_profiles_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_users_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_users_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_users_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_company_step_data"("p_name" "text", "p_sector" "text", "p_company_size" "text", "p_share_capital" numeric, "p_ceo_name" "text", "p_timezone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_company_step_data"("p_name" "text", "p_sector" "text", "p_company_size" "text", "p_share_capital" numeric, "p_ceo_name" "text", "p_timezone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_company_step_data"("p_name" "text", "p_sector" "text", "p_company_size" "text", "p_share_capital" numeric, "p_ceo_name" "text", "p_timezone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_user_preferences"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_user_preferences"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_user_preferences"() TO "service_role";



GRANT ALL ON TABLE "public"."accounting_periods" TO "anon";
GRANT ALL ON TABLE "public"."accounting_periods" TO "authenticated";
GRANT ALL ON TABLE "public"."accounting_periods" TO "service_role";



GRANT ALL ON TABLE "public"."accounts" TO "anon";
GRANT ALL ON TABLE "public"."accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_plans" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plans" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."active_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."active_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."active_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."ai_insights" TO "anon";
GRANT ALL ON TABLE "public"."ai_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_insights" TO "service_role";



GRANT ALL ON TABLE "public"."ai_interactions" TO "anon";
GRANT ALL ON TABLE "public"."ai_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_interactions" TO "service_role";



GRANT ALL ON TABLE "public"."ai_performance_metrics" TO "anon";
GRANT ALL ON TABLE "public"."ai_performance_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_performance_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."alert_configurations" TO "anon";
GRANT ALL ON TABLE "public"."alert_configurations" TO "authenticated";
GRANT ALL ON TABLE "public"."alert_configurations" TO "service_role";



GRANT ALL ON TABLE "public"."analytical_distributions" TO "anon";
GRANT ALL ON TABLE "public"."analytical_distributions" TO "authenticated";
GRANT ALL ON TABLE "public"."analytical_distributions" TO "service_role";



GRANT ALL ON TABLE "public"."anomaly_detections" TO "anon";
GRANT ALL ON TABLE "public"."anomaly_detections" TO "authenticated";
GRANT ALL ON TABLE "public"."anomaly_detections" TO "service_role";



GRANT ALL ON TABLE "public"."api_configurations" TO "anon";
GRANT ALL ON TABLE "public"."api_configurations" TO "authenticated";
GRANT ALL ON TABLE "public"."api_configurations" TO "service_role";



GRANT ALL ON TABLE "public"."attendance" TO "anon";
GRANT ALL ON TABLE "public"."attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."automation_rules" TO "anon";
GRANT ALL ON TABLE "public"."automation_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_rules" TO "service_role";



GRANT ALL ON TABLE "public"."available_features" TO "anon";
GRANT ALL ON TABLE "public"."available_features" TO "authenticated";
GRANT ALL ON TABLE "public"."available_features" TO "service_role";



GRANT ALL ON TABLE "public"."backup_configurations" TO "anon";
GRANT ALL ON TABLE "public"."backup_configurations" TO "authenticated";
GRANT ALL ON TABLE "public"."backup_configurations" TO "service_role";



GRANT ALL ON TABLE "public"."bank_accounts" TO "anon";
GRANT ALL ON TABLE "public"."bank_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."bank_alert_rules" TO "anon";
GRANT ALL ON TABLE "public"."bank_alert_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_alert_rules" TO "service_role";



GRANT ALL ON TABLE "public"."bank_audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."bank_audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."bank_auth_flows" TO "anon";
GRANT ALL ON TABLE "public"."bank_auth_flows" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_auth_flows" TO "service_role";



GRANT ALL ON TABLE "public"."bank_balance_forecasts" TO "anon";
GRANT ALL ON TABLE "public"."bank_balance_forecasts" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_balance_forecasts" TO "service_role";



GRANT ALL ON TABLE "public"."bank_cash_flow_analysis" TO "anon";
GRANT ALL ON TABLE "public"."bank_cash_flow_analysis" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_cash_flow_analysis" TO "service_role";



GRANT ALL ON TABLE "public"."bank_categorization_rules" TO "anon";
GRANT ALL ON TABLE "public"."bank_categorization_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_categorization_rules" TO "service_role";



GRANT ALL ON TABLE "public"."bank_connections" TO "anon";
GRANT ALL ON TABLE "public"."bank_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_connections" TO "service_role";



GRANT ALL ON TABLE "public"."bank_consents" TO "anon";
GRANT ALL ON TABLE "public"."bank_consents" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_consents" TO "service_role";



GRANT ALL ON TABLE "public"."bank_dashboards" TO "anon";
GRANT ALL ON TABLE "public"."bank_dashboards" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_dashboards" TO "service_role";



GRANT ALL ON TABLE "public"."bank_encrypted_credentials" TO "anon";
GRANT ALL ON TABLE "public"."bank_encrypted_credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_encrypted_credentials" TO "service_role";



GRANT ALL ON TABLE "public"."bank_export_formats" TO "anon";
GRANT ALL ON TABLE "public"."bank_export_formats" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_export_formats" TO "service_role";



GRANT ALL ON TABLE "public"."bank_export_jobs" TO "anon";
GRANT ALL ON TABLE "public"."bank_export_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_export_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."bank_field_mappings" TO "anon";
GRANT ALL ON TABLE "public"."bank_field_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_field_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."bank_merchant_data" TO "anon";
GRANT ALL ON TABLE "public"."bank_merchant_data" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_merchant_data" TO "service_role";



GRANT ALL ON TABLE "public"."bank_notifications" TO "anon";
GRANT ALL ON TABLE "public"."bank_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."bank_providers" TO "anon";
GRANT ALL ON TABLE "public"."bank_providers" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_providers" TO "service_role";



GRANT ALL ON TABLE "public"."bank_reconciliation" TO "anon";
GRANT ALL ON TABLE "public"."bank_reconciliation" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_reconciliation" TO "service_role";



GRANT ALL ON TABLE "public"."bank_reconciliation_log" TO "anon";
GRANT ALL ON TABLE "public"."bank_reconciliation_log" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_reconciliation_log" TO "service_role";



GRANT ALL ON TABLE "public"."bank_reconciliation_matches" TO "anon";
GRANT ALL ON TABLE "public"."bank_reconciliation_matches" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_reconciliation_matches" TO "service_role";



GRANT ALL ON TABLE "public"."bank_reconciliation_rules" TO "anon";
GRANT ALL ON TABLE "public"."bank_reconciliation_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_reconciliation_rules" TO "service_role";



GRANT ALL ON TABLE "public"."bank_sca_methods" TO "anon";
GRANT ALL ON TABLE "public"."bank_sca_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_sca_methods" TO "service_role";



GRANT ALL ON TABLE "public"."bank_spending_patterns" TO "anon";
GRANT ALL ON TABLE "public"."bank_spending_patterns" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_spending_patterns" TO "service_role";



GRANT ALL ON TABLE "public"."bank_supported_banks" TO "anon";
GRANT ALL ON TABLE "public"."bank_supported_banks" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_supported_banks" TO "service_role";



GRANT ALL ON TABLE "public"."bank_sync_statistics" TO "anon";
GRANT ALL ON TABLE "public"."bank_sync_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_sync_statistics" TO "service_role";



GRANT ALL ON TABLE "public"."bank_token_rotation_log" TO "anon";
GRANT ALL ON TABLE "public"."bank_token_rotation_log" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_token_rotation_log" TO "service_role";



GRANT ALL ON TABLE "public"."bank_transaction_categories" TO "anon";
GRANT ALL ON TABLE "public"."bank_transaction_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_transaction_categories" TO "service_role";



GRANT ALL ON TABLE "public"."bank_transactions" TO "anon";
GRANT ALL ON TABLE "public"."bank_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."bank_validation_rules" TO "anon";
GRANT ALL ON TABLE "public"."bank_validation_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_validation_rules" TO "service_role";



GRANT ALL ON TABLE "public"."bank_webhook_configs" TO "anon";
GRANT ALL ON TABLE "public"."bank_webhook_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_webhook_configs" TO "service_role";



GRANT ALL ON TABLE "public"."bank_webhook_events" TO "anon";
GRANT ALL ON TABLE "public"."bank_webhook_events" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_webhook_events" TO "service_role";



GRANT ALL ON TABLE "public"."benefits" TO "anon";
GRANT ALL ON TABLE "public"."benefits" TO "authenticated";
GRANT ALL ON TABLE "public"."benefits" TO "service_role";



GRANT ALL ON TABLE "public"."budget_approvals" TO "anon";
GRANT ALL ON TABLE "public"."budget_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."budget_approvals" TO "service_role";



GRANT ALL ON TABLE "public"."budget_assumptions" TO "anon";
GRANT ALL ON TABLE "public"."budget_assumptions" TO "authenticated";
GRANT ALL ON TABLE "public"."budget_assumptions" TO "service_role";



GRANT ALL ON TABLE "public"."budget_attachments" TO "anon";
GRANT ALL ON TABLE "public"."budget_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."budget_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."budget_categories" TO "anon";
GRANT ALL ON TABLE "public"."budget_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."budget_categories" TO "service_role";



GRANT ALL ON TABLE "public"."budget_category_templates" TO "anon";
GRANT ALL ON TABLE "public"."budget_category_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."budget_category_templates" TO "service_role";



GRANT ALL ON TABLE "public"."budget_comments" TO "anon";
GRANT ALL ON TABLE "public"."budget_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."budget_comments" TO "service_role";



GRANT ALL ON TABLE "public"."budget_forecasts" TO "anon";
GRANT ALL ON TABLE "public"."budget_forecasts" TO "authenticated";
GRANT ALL ON TABLE "public"."budget_forecasts" TO "service_role";



GRANT ALL ON TABLE "public"."budget_lines" TO "anon";
GRANT ALL ON TABLE "public"."budget_lines" TO "authenticated";
GRANT ALL ON TABLE "public"."budget_lines" TO "service_role";



GRANT ALL ON TABLE "public"."budget_notifications" TO "anon";
GRANT ALL ON TABLE "public"."budget_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."budget_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."budget_scenarios" TO "anon";
GRANT ALL ON TABLE "public"."budget_scenarios" TO "authenticated";
GRANT ALL ON TABLE "public"."budget_scenarios" TO "service_role";



GRANT ALL ON TABLE "public"."budget_templates" TO "anon";
GRANT ALL ON TABLE "public"."budget_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."budget_templates" TO "service_role";



GRANT ALL ON TABLE "public"."budget_variance_analysis" TO "anon";
GRANT ALL ON TABLE "public"."budget_variance_analysis" TO "authenticated";
GRANT ALL ON TABLE "public"."budget_variance_analysis" TO "service_role";



GRANT ALL ON TABLE "public"."budgets" TO "anon";
GRANT ALL ON TABLE "public"."budgets" TO "authenticated";
GRANT ALL ON TABLE "public"."budgets" TO "service_role";



GRANT ALL ON TABLE "public"."cache_settings" TO "anon";
GRANT ALL ON TABLE "public"."cache_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."cache_settings" TO "service_role";



GRANT ALL ON TABLE "public"."career_progression" TO "anon";
GRANT ALL ON TABLE "public"."career_progression" TO "authenticated";
GRANT ALL ON TABLE "public"."career_progression" TO "service_role";



GRANT ALL ON TABLE "public"."cash_flow_predictions" TO "anon";
GRANT ALL ON TABLE "public"."cash_flow_predictions" TO "authenticated";
GRANT ALL ON TABLE "public"."cash_flow_predictions" TO "service_role";



GRANT ALL ON TABLE "public"."category_account_map" TO "anon";
GRANT ALL ON TABLE "public"."category_account_map" TO "authenticated";
GRANT ALL ON TABLE "public"."category_account_map" TO "service_role";



GRANT ALL ON TABLE "public"."chart_of_accounts" TO "anon";
GRANT ALL ON TABLE "public"."chart_of_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."chart_of_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."chart_of_accounts_templates" TO "anon";
GRANT ALL ON TABLE "public"."chart_of_accounts_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."chart_of_accounts_templates" TO "service_role";



GRANT ALL ON TABLE "public"."crm_clients" TO "anon";
GRANT ALL ON TABLE "public"."crm_clients" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_clients" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."crm_activities" TO "anon";
GRANT ALL ON TABLE "public"."crm_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_activities" TO "service_role";



GRANT ALL ON TABLE "public"."commercial_actions" TO "anon";
GRANT ALL ON TABLE "public"."commercial_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."commercial_actions" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."company_deletion_requests" TO "anon";
GRANT ALL ON TABLE "public"."company_deletion_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."company_deletion_requests" TO "service_role";



GRANT ALL ON TABLE "public"."company_duplicates" TO "anon";
GRANT ALL ON TABLE "public"."company_duplicates" TO "authenticated";
GRANT ALL ON TABLE "public"."company_duplicates" TO "service_role";



GRANT ALL ON TABLE "public"."company_features" TO "anon";
GRANT ALL ON TABLE "public"."company_features" TO "authenticated";
GRANT ALL ON TABLE "public"."company_features" TO "service_role";



GRANT ALL ON TABLE "public"."company_fiscal_settings" TO "anon";
GRANT ALL ON TABLE "public"."company_fiscal_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."company_fiscal_settings" TO "service_role";



GRANT ALL ON TABLE "public"."company_invitations" TO "anon";
GRANT ALL ON TABLE "public"."company_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."company_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."company_merges" TO "anon";
GRANT ALL ON TABLE "public"."company_merges" TO "authenticated";
GRANT ALL ON TABLE "public"."company_merges" TO "service_role";



GRANT ALL ON TABLE "public"."company_modules" TO "anon";
GRANT ALL ON TABLE "public"."company_modules" TO "authenticated";
GRANT ALL ON TABLE "public"."company_modules" TO "service_role";



GRANT ALL ON TABLE "public"."company_settings" TO "anon";
GRANT ALL ON TABLE "public"."company_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."company_settings" TO "service_role";



GRANT ALL ON TABLE "public"."company_sizes_catalog" TO "anon";
GRANT ALL ON TABLE "public"."company_sizes_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."company_sizes_catalog" TO "service_role";



GRANT ALL ON TABLE "public"."company_users" TO "anon";
GRANT ALL ON TABLE "public"."company_users" TO "authenticated";
GRANT ALL ON TABLE "public"."company_users" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_reports" TO "anon";
GRANT ALL ON TABLE "public"."compliance_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_reports" TO "service_role";



GRANT ALL ON TABLE "public"."configuration_categories" TO "anon";
GRANT ALL ON TABLE "public"."configuration_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."configuration_categories" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."contract_alerts" TO "anon";
GRANT ALL ON TABLE "public"."contract_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."contract_amendments" TO "anon";
GRANT ALL ON TABLE "public"."contract_amendments" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_amendments" TO "service_role";



GRANT ALL ON TABLE "public"."contract_approvals" TO "anon";
GRANT ALL ON TABLE "public"."contract_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_approvals" TO "service_role";



GRANT ALL ON TABLE "public"."contract_billing" TO "anon";
GRANT ALL ON TABLE "public"."contract_billing" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_billing" TO "service_role";



GRANT ALL ON TABLE "public"."contract_clauses" TO "anon";
GRANT ALL ON TABLE "public"."contract_clauses" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_clauses" TO "service_role";



GRANT ALL ON TABLE "public"."contract_documents" TO "anon";
GRANT ALL ON TABLE "public"."contract_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_documents" TO "service_role";



GRANT ALL ON TABLE "public"."contract_kpi_tracking" TO "anon";
GRANT ALL ON TABLE "public"."contract_kpi_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_kpi_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."contract_kpis" TO "anon";
GRANT ALL ON TABLE "public"."contract_kpis" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_kpis" TO "service_role";



GRANT ALL ON TABLE "public"."contract_milestones" TO "anon";
GRANT ALL ON TABLE "public"."contract_milestones" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_milestones" TO "service_role";



GRANT ALL ON TABLE "public"."contract_parties" TO "anon";
GRANT ALL ON TABLE "public"."contract_parties" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_parties" TO "service_role";



GRANT ALL ON TABLE "public"."contract_renewals" TO "anon";
GRANT ALL ON TABLE "public"."contract_renewals" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_renewals" TO "service_role";



GRANT ALL ON TABLE "public"."contract_templates" TO "anon";
GRANT ALL ON TABLE "public"."contract_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_templates" TO "service_role";



GRANT ALL ON TABLE "public"."contract_terminations" TO "anon";
GRANT ALL ON TABLE "public"."contract_terminations" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_terminations" TO "service_role";



GRANT ALL ON TABLE "public"."contract_types" TO "anon";
GRANT ALL ON TABLE "public"."contract_types" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_types" TO "service_role";



GRANT ALL ON TABLE "public"."contracts" TO "anon";
GRANT ALL ON TABLE "public"."contracts" TO "authenticated";
GRANT ALL ON TABLE "public"."contracts" TO "service_role";



GRANT ALL ON TABLE "public"."cost_centers" TO "anon";
GRANT ALL ON TABLE "public"."cost_centers" TO "authenticated";
GRANT ALL ON TABLE "public"."cost_centers" TO "service_role";



GRANT ALL ON TABLE "public"."countries_catalog" TO "anon";
GRANT ALL ON TABLE "public"."countries_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."countries_catalog" TO "service_role";



GRANT ALL ON TABLE "public"."crm_actions" TO "anon";
GRANT ALL ON TABLE "public"."crm_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_actions" TO "service_role";



GRANT ALL ON TABLE "public"."crm_attachments" TO "anon";
GRANT ALL ON TABLE "public"."crm_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."crm_campaigns" TO "anon";
GRANT ALL ON TABLE "public"."crm_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."crm_contacts" TO "anon";
GRANT ALL ON TABLE "public"."crm_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."crm_entity_tags" TO "anon";
GRANT ALL ON TABLE "public"."crm_entity_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_entity_tags" TO "service_role";



GRANT ALL ON TABLE "public"."crm_leads" TO "anon";
GRANT ALL ON TABLE "public"."crm_leads" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_leads" TO "service_role";



GRANT ALL ON TABLE "public"."crm_notes" TO "anon";
GRANT ALL ON TABLE "public"."crm_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_notes" TO "service_role";



GRANT ALL ON TABLE "public"."crm_opportunities" TO "anon";
GRANT ALL ON TABLE "public"."crm_opportunities" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_opportunities" TO "service_role";



GRANT ALL ON TABLE "public"."crm_pipelines" TO "anon";
GRANT ALL ON TABLE "public"."crm_pipelines" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_pipelines" TO "service_role";



GRANT ALL ON TABLE "public"."crm_sources" TO "anon";
GRANT ALL ON TABLE "public"."crm_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_sources" TO "service_role";



GRANT ALL ON TABLE "public"."crm_stages" TO "anon";
GRANT ALL ON TABLE "public"."crm_stages" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_stages" TO "service_role";



GRANT ALL ON TABLE "public"."crm_tags" TO "anon";
GRANT ALL ON TABLE "public"."crm_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_tags" TO "service_role";



GRANT ALL ON TABLE "public"."crm_tasks" TO "anon";
GRANT ALL ON TABLE "public"."crm_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."currencies_catalog" TO "anon";
GRANT ALL ON TABLE "public"."currencies_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."currencies_catalog" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."data_classification" TO "anon";
GRANT ALL ON TABLE "public"."data_classification" TO "authenticated";
GRANT ALL ON TABLE "public"."data_classification" TO "service_role";



GRANT ALL ON TABLE "public"."data_governance_audit" TO "anon";
GRANT ALL ON TABLE "public"."data_governance_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."data_governance_audit" TO "service_role";



GRANT ALL ON TABLE "public"."data_retention_policies" TO "anon";
GRANT ALL ON TABLE "public"."data_retention_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."data_retention_policies" TO "service_role";



GRANT ALL ON TABLE "public"."departments" TO "anon";
GRANT ALL ON TABLE "public"."departments" TO "authenticated";
GRANT ALL ON TABLE "public"."departments" TO "service_role";



GRANT ALL ON TABLE "public"."disciplinary_actions" TO "anon";
GRANT ALL ON TABLE "public"."disciplinary_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."disciplinary_actions" TO "service_role";



GRANT ALL ON TABLE "public"."employee_benefits" TO "anon";
GRANT ALL ON TABLE "public"."employee_benefits" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_benefits" TO "service_role";



GRANT ALL ON TABLE "public"."employee_contracts" TO "anon";
GRANT ALL ON TABLE "public"."employee_contracts" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_contracts" TO "service_role";



GRANT ALL ON TABLE "public"."employee_documents" TO "anon";
GRANT ALL ON TABLE "public"."employee_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_documents" TO "service_role";



GRANT ALL ON TABLE "public"."employee_surveys" TO "anon";
GRANT ALL ON TABLE "public"."employee_surveys" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_surveys" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."encryption_keys" TO "anon";
GRANT ALL ON TABLE "public"."encryption_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."encryption_keys" TO "service_role";



GRANT ALL ON TABLE "public"."feature_flags" TO "anon";
GRANT ALL ON TABLE "public"."feature_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_flags" TO "service_role";



GRANT ALL ON TABLE "public"."feature_usage_tracking" TO "anon";
GRANT ALL ON TABLE "public"."feature_usage_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_usage_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."fec_exports" TO "anon";
GRANT ALL ON TABLE "public"."fec_exports" TO "authenticated";
GRANT ALL ON TABLE "public"."fec_exports" TO "service_role";



GRANT ALL ON TABLE "public"."financial_reports" TO "anon";
GRANT ALL ON TABLE "public"."financial_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_reports" TO "service_role";



GRANT ALL ON TABLE "public"."fiscal_country_templates" TO "anon";
GRANT ALL ON TABLE "public"."fiscal_country_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."fiscal_country_templates" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_adjustments" TO "anon";
GRANT ALL ON TABLE "public"."inventory_adjustments" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_adjustments" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_items" TO "anon";
GRANT ALL ON TABLE "public"."inventory_items" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_items" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_locations" TO "anon";
GRANT ALL ON TABLE "public"."inventory_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_locations" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_movements" TO "anon";
GRANT ALL ON TABLE "public"."inventory_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_movements" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_items" TO "anon";
GRANT ALL ON TABLE "public"."invoice_items" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_items" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_lines" TO "anon";
GRANT ALL ON TABLE "public"."invoice_lines" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_lines" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_templates" TO "anon";
GRANT ALL ON TABLE "public"."invoice_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_templates" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."invoices_stripe" TO "anon";
GRANT ALL ON TABLE "public"."invoices_stripe" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices_stripe" TO "service_role";



GRANT ALL ON TABLE "public"."journal_entries" TO "anon";
GRANT ALL ON TABLE "public"."journal_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."journal_entries" TO "service_role";



GRANT ALL ON TABLE "public"."journal_entry_items" TO "anon";
GRANT ALL ON TABLE "public"."journal_entry_items" TO "authenticated";
GRANT ALL ON TABLE "public"."journal_entry_items" TO "service_role";



GRANT ALL ON TABLE "public"."journal_entry_lines" TO "anon";
GRANT ALL ON TABLE "public"."journal_entry_lines" TO "authenticated";
GRANT ALL ON TABLE "public"."journal_entry_lines" TO "service_role";



GRANT ALL ON TABLE "public"."journals" TO "anon";
GRANT ALL ON TABLE "public"."journals" TO "authenticated";
GRANT ALL ON TABLE "public"."journals" TO "service_role";



GRANT ALL ON TABLE "public"."languages_catalog" TO "anon";
GRANT ALL ON TABLE "public"."languages_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."languages_catalog" TO "service_role";



GRANT ALL ON TABLE "public"."leave_requests" TO "anon";
GRANT ALL ON TABLE "public"."leave_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."leave_requests" TO "service_role";



GRANT ALL ON TABLE "public"."leave_types" TO "anon";
GRANT ALL ON TABLE "public"."leave_types" TO "authenticated";
GRANT ALL ON TABLE "public"."leave_types" TO "service_role";



GRANT ALL ON TABLE "public"."legal_archives" TO "anon";
GRANT ALL ON TABLE "public"."legal_archives" TO "authenticated";
GRANT ALL ON TABLE "public"."legal_archives" TO "service_role";



GRANT ALL ON TABLE "public"."login_attempts" TO "anon";
GRANT ALL ON TABLE "public"."login_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."login_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."module_catalog" TO "anon";
GRANT ALL ON TABLE "public"."module_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."module_catalog" TO "service_role";



GRANT ALL ON TABLE "public"."module_configurations" TO "anon";
GRANT ALL ON TABLE "public"."module_configurations" TO "authenticated";
GRANT ALL ON TABLE "public"."module_configurations" TO "service_role";



GRANT ALL ON TABLE "public"."notification_channels" TO "anon";
GRANT ALL ON TABLE "public"."notification_channels" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_channels" TO "service_role";



GRANT ALL ON TABLE "public"."notification_history" TO "anon";
GRANT ALL ON TABLE "public"."notification_history" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_history" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."notification_templates" TO "anon";
GRANT ALL ON TABLE "public"."notification_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_templates" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."oauth_providers" TO "anon";
GRANT ALL ON TABLE "public"."oauth_providers" TO "authenticated";
GRANT ALL ON TABLE "public"."oauth_providers" TO "service_role";



GRANT ALL ON TABLE "public"."onboarding_history" TO "anon";
GRANT ALL ON TABLE "public"."onboarding_history" TO "authenticated";
GRANT ALL ON TABLE "public"."onboarding_history" TO "service_role";



GRANT ALL ON TABLE "public"."onboarding_sessions" TO "anon";
GRANT ALL ON TABLE "public"."onboarding_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."onboarding_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."opportunities" TO "anon";
GRANT ALL ON TABLE "public"."opportunities" TO "authenticated";
GRANT ALL ON TABLE "public"."opportunities" TO "service_role";



GRANT ALL ON TABLE "public"."password_policies" TO "anon";
GRANT ALL ON TABLE "public"."password_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."password_policies" TO "service_role";



GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."payroll" TO "anon";
GRANT ALL ON TABLE "public"."payroll" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll" TO "service_role";



GRANT ALL ON TABLE "public"."payroll_items" TO "anon";
GRANT ALL ON TABLE "public"."payroll_items" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll_items" TO "service_role";



GRANT ALL ON TABLE "public"."performance_reviews" TO "anon";
GRANT ALL ON TABLE "public"."performance_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."performance_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."performance_settings" TO "anon";
GRANT ALL ON TABLE "public"."performance_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."performance_settings" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."positions" TO "anon";
GRANT ALL ON TABLE "public"."positions" TO "authenticated";
GRANT ALL ON TABLE "public"."positions" TO "service_role";



GRANT ALL ON TABLE "public"."product_categories" TO "anon";
GRANT ALL ON TABLE "public"."product_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."product_categories" TO "service_role";



GRANT ALL ON TABLE "public"."product_variants" TO "anon";
GRANT ALL ON TABLE "public"."product_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."product_variants" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."project_baselines" TO "anon";
GRANT ALL ON TABLE "public"."project_baselines" TO "authenticated";
GRANT ALL ON TABLE "public"."project_baselines" TO "service_role";



GRANT ALL ON TABLE "public"."project_billing_rates" TO "anon";
GRANT ALL ON TABLE "public"."project_billing_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."project_billing_rates" TO "service_role";



GRANT ALL ON TABLE "public"."project_budgets" TO "anon";
GRANT ALL ON TABLE "public"."project_budgets" TO "authenticated";
GRANT ALL ON TABLE "public"."project_budgets" TO "service_role";



GRANT ALL ON TABLE "public"."project_categories" TO "anon";
GRANT ALL ON TABLE "public"."project_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."project_categories" TO "service_role";



GRANT ALL ON TABLE "public"."project_discussions" TO "anon";
GRANT ALL ON TABLE "public"."project_discussions" TO "authenticated";
GRANT ALL ON TABLE "public"."project_discussions" TO "service_role";



GRANT ALL ON TABLE "public"."project_expenses" TO "anon";
GRANT ALL ON TABLE "public"."project_expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."project_expenses" TO "service_role";



GRANT ALL ON TABLE "public"."project_forecasts" TO "anon";
GRANT ALL ON TABLE "public"."project_forecasts" TO "authenticated";
GRANT ALL ON TABLE "public"."project_forecasts" TO "service_role";



GRANT ALL ON TABLE "public"."project_gantt_data" TO "anon";
GRANT ALL ON TABLE "public"."project_gantt_data" TO "authenticated";
GRANT ALL ON TABLE "public"."project_gantt_data" TO "service_role";



GRANT ALL ON TABLE "public"."project_kpis" TO "anon";
GRANT ALL ON TABLE "public"."project_kpis" TO "authenticated";
GRANT ALL ON TABLE "public"."project_kpis" TO "service_role";



GRANT ALL ON TABLE "public"."project_members" TO "anon";
GRANT ALL ON TABLE "public"."project_members" TO "authenticated";
GRANT ALL ON TABLE "public"."project_members" TO "service_role";



GRANT ALL ON TABLE "public"."project_milestones" TO "anon";
GRANT ALL ON TABLE "public"."project_milestones" TO "authenticated";
GRANT ALL ON TABLE "public"."project_milestones" TO "service_role";



GRANT ALL ON TABLE "public"."project_notifications" TO "anon";
GRANT ALL ON TABLE "public"."project_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."project_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."project_phases" TO "anon";
GRANT ALL ON TABLE "public"."project_phases" TO "authenticated";
GRANT ALL ON TABLE "public"."project_phases" TO "service_role";



GRANT ALL ON TABLE "public"."project_resources" TO "anon";
GRANT ALL ON TABLE "public"."project_resources" TO "authenticated";
GRANT ALL ON TABLE "public"."project_resources" TO "service_role";



GRANT ALL ON TABLE "public"."project_roles" TO "anon";
GRANT ALL ON TABLE "public"."project_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."project_roles" TO "service_role";



GRANT ALL ON TABLE "public"."project_schedules" TO "anon";
GRANT ALL ON TABLE "public"."project_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."project_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."project_statuses" TO "anon";
GRANT ALL ON TABLE "public"."project_statuses" TO "authenticated";
GRANT ALL ON TABLE "public"."project_statuses" TO "service_role";



GRANT ALL ON TABLE "public"."project_tasks" TO "anon";
GRANT ALL ON TABLE "public"."project_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."project_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."project_templates" TO "anon";
GRANT ALL ON TABLE "public"."project_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."project_templates" TO "service_role";



GRANT ALL ON TABLE "public"."project_timesheets" TO "anon";
GRANT ALL ON TABLE "public"."project_timesheets" TO "authenticated";
GRANT ALL ON TABLE "public"."project_timesheets" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_items" TO "anon";
GRANT ALL ON TABLE "public"."purchase_items" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_items" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_orders" TO "anon";
GRANT ALL ON TABLE "public"."purchase_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_orders" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_receipts" TO "anon";
GRANT ALL ON TABLE "public"."purchase_receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_receipts" TO "service_role";



GRANT ALL ON TABLE "public"."purchases" TO "anon";
GRANT ALL ON TABLE "public"."purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases" TO "service_role";



GRANT ALL ON TABLE "public"."quote_items" TO "anon";
GRANT ALL ON TABLE "public"."quote_items" TO "authenticated";
GRANT ALL ON TABLE "public"."quote_items" TO "service_role";



GRANT ALL ON TABLE "public"."quotes" TO "anon";
GRANT ALL ON TABLE "public"."quotes" TO "authenticated";
GRANT ALL ON TABLE "public"."quotes" TO "service_role";



GRANT ALL ON TABLE "public"."report_cache" TO "anon";
GRANT ALL ON TABLE "public"."report_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."report_cache" TO "service_role";



GRANT ALL ON SEQUENCE "public"."report_cache_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."report_cache_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."report_cache_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."report_executions" TO "anon";
GRANT ALL ON TABLE "public"."report_executions" TO "authenticated";
GRANT ALL ON TABLE "public"."report_executions" TO "service_role";



GRANT ALL ON TABLE "public"."report_templates" TO "anon";
GRANT ALL ON TABLE "public"."report_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."report_templates" TO "service_role";



GRANT ALL ON TABLE "public"."resource_allocations" TO "anon";
GRANT ALL ON TABLE "public"."resource_allocations" TO "authenticated";
GRANT ALL ON TABLE "public"."resource_allocations" TO "service_role";



GRANT ALL ON TABLE "public"."rfa_calculations" TO "anon";
GRANT ALL ON TABLE "public"."rfa_calculations" TO "authenticated";
GRANT ALL ON TABLE "public"."rfa_calculations" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."sectors_catalog" TO "anon";
GRANT ALL ON TABLE "public"."sectors_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."sectors_catalog" TO "service_role";



GRANT ALL ON TABLE "public"."security_configurations" TO "anon";
GRANT ALL ON TABLE "public"."security_configurations" TO "authenticated";
GRANT ALL ON TABLE "public"."security_configurations" TO "service_role";



GRANT ALL ON TABLE "public"."security_events" TO "anon";
GRANT ALL ON TABLE "public"."security_events" TO "authenticated";
GRANT ALL ON TABLE "public"."security_events" TO "service_role";



GRANT ALL ON TABLE "public"."serial_numbers" TO "anon";
GRANT ALL ON TABLE "public"."serial_numbers" TO "authenticated";
GRANT ALL ON TABLE "public"."serial_numbers" TO "service_role";



GRANT ALL ON TABLE "public"."service_accounts" TO "anon";
GRANT ALL ON TABLE "public"."service_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."service_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."skill_assessments" TO "anon";
GRANT ALL ON TABLE "public"."skill_assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."skill_assessments" TO "service_role";



GRANT ALL ON TABLE "public"."smart_alerts" TO "anon";
GRANT ALL ON TABLE "public"."smart_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."smart_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."stock_alerts" TO "anon";
GRANT ALL ON TABLE "public"."stock_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_customers" TO "anon";
GRANT ALL ON TABLE "public"."stripe_customers" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_customers" TO "service_role";



GRANT ALL ON TABLE "public"."supplier_contact_persons" TO "anon";
GRANT ALL ON TABLE "public"."supplier_contact_persons" TO "authenticated";
GRANT ALL ON TABLE "public"."supplier_contact_persons" TO "service_role";



GRANT ALL ON TABLE "public"."supplier_payments" TO "anon";
GRANT ALL ON TABLE "public"."supplier_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."supplier_payments" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."survey_responses" TO "anon";
GRANT ALL ON TABLE "public"."survey_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_responses" TO "service_role";



GRANT ALL ON TABLE "public"."system_configurations" TO "anon";
GRANT ALL ON TABLE "public"."system_configurations" TO "authenticated";
GRANT ALL ON TABLE "public"."system_configurations" TO "service_role";



GRANT ALL ON TABLE "public"."task_attachments" TO "anon";
GRANT ALL ON TABLE "public"."task_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."task_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."task_checklists" TO "anon";
GRANT ALL ON TABLE "public"."task_checklists" TO "authenticated";
GRANT ALL ON TABLE "public"."task_checklists" TO "service_role";



GRANT ALL ON TABLE "public"."task_comments" TO "anon";
GRANT ALL ON TABLE "public"."task_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."task_comments" TO "service_role";



GRANT ALL ON TABLE "public"."task_dependencies" TO "anon";
GRANT ALL ON TABLE "public"."task_dependencies" TO "authenticated";
GRANT ALL ON TABLE "public"."task_dependencies" TO "service_role";



GRANT ALL ON TABLE "public"."task_statuses" TO "anon";
GRANT ALL ON TABLE "public"."task_statuses" TO "authenticated";
GRANT ALL ON TABLE "public"."task_statuses" TO "service_role";



GRANT ALL ON TABLE "public"."task_types" TO "anon";
GRANT ALL ON TABLE "public"."task_types" TO "authenticated";
GRANT ALL ON TABLE "public"."task_types" TO "service_role";



GRANT ALL ON TABLE "public"."tax_declarations" TO "anon";
GRANT ALL ON TABLE "public"."tax_declarations" TO "authenticated";
GRANT ALL ON TABLE "public"."tax_declarations" TO "service_role";



GRANT ALL ON TABLE "public"."tax_optimizations" TO "anon";
GRANT ALL ON TABLE "public"."tax_optimizations" TO "authenticated";
GRANT ALL ON TABLE "public"."tax_optimizations" TO "service_role";



GRANT ALL ON TABLE "public"."tax_rates_catalog" TO "anon";
GRANT ALL ON TABLE "public"."tax_rates_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."tax_rates_catalog" TO "service_role";



GRANT ALL ON TABLE "public"."third_parties" TO "anon";
GRANT ALL ON TABLE "public"."third_parties" TO "authenticated";
GRANT ALL ON TABLE "public"."third_parties" TO "service_role";



GRANT ALL ON TABLE "public"."third_party_addresses" TO "anon";
GRANT ALL ON TABLE "public"."third_party_addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."third_party_addresses" TO "service_role";



GRANT ALL ON TABLE "public"."third_party_categories" TO "anon";
GRANT ALL ON TABLE "public"."third_party_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."third_party_categories" TO "service_role";



GRANT ALL ON TABLE "public"."third_party_documents" TO "anon";
GRANT ALL ON TABLE "public"."third_party_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."third_party_documents" TO "service_role";



GRANT ALL ON TABLE "public"."time_tracking" TO "anon";
GRANT ALL ON TABLE "public"."time_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."time_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."timezones_catalog" TO "anon";
GRANT ALL ON TABLE "public"."timezones_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."timezones_catalog" TO "service_role";



GRANT ALL ON TABLE "public"."training_records" TO "anon";
GRANT ALL ON TABLE "public"."training_records" TO "authenticated";
GRANT ALL ON TABLE "public"."training_records" TO "service_role";



GRANT ALL ON TABLE "public"."unified_third_parties_view" TO "anon";
GRANT ALL ON TABLE "public"."unified_third_parties_view" TO "authenticated";
GRANT ALL ON TABLE "public"."unified_third_parties_view" TO "service_role";



GRANT ALL ON TABLE "public"."usage_tracking" TO "anon";
GRANT ALL ON TABLE "public"."usage_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."user_activity_log" TO "anon";
GRANT ALL ON TABLE "public"."user_activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."user_activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."user_activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."user_companies" TO "anon";
GRANT ALL ON TABLE "public"."user_companies" TO "authenticated";
GRANT ALL ON TABLE "public"."user_companies" TO "service_role";



GRANT ALL ON TABLE "public"."user_deletion_requests" TO "anon";
GRANT ALL ON TABLE "public"."user_deletion_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."user_deletion_requests" TO "service_role";



GRANT ALL ON TABLE "public"."user_notifications" TO "anon";
GRANT ALL ON TABLE "public"."user_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."user_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."user_permissions" TO "anon";
GRANT ALL ON TABLE "public"."user_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_sessions" TO "anon";
GRANT ALL ON TABLE "public"."user_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."user_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."v_actuals_monthly" TO "anon";
GRANT ALL ON TABLE "public"."v_actuals_monthly" TO "authenticated";
GRANT ALL ON TABLE "public"."v_actuals_monthly" TO "service_role";



GRANT ALL ON TABLE "public"."v_actuals_by_category" TO "anon";
GRANT ALL ON TABLE "public"."v_actuals_by_category" TO "authenticated";
GRANT ALL ON TABLE "public"."v_actuals_by_category" TO "service_role";



GRANT ALL ON TABLE "public"."v_budget_by_category_monthly" TO "anon";
GRANT ALL ON TABLE "public"."v_budget_by_category_monthly" TO "authenticated";
GRANT ALL ON TABLE "public"."v_budget_by_category_monthly" TO "service_role";



GRANT ALL ON TABLE "public"."warehouses" TO "anon";
GRANT ALL ON TABLE "public"."warehouses" TO "authenticated";
GRANT ALL ON TABLE "public"."warehouses" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_settings" TO "anon";
GRANT ALL ON TABLE "public"."webhook_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_settings" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_executions" TO "anon";
GRANT ALL ON TABLE "public"."workflow_executions" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_executions" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_templates" TO "anon";
GRANT ALL ON TABLE "public"."workflow_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_templates" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;
