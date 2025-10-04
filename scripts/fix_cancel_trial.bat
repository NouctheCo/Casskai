@echo off
curl -X POST "https://smtdtgrymuzwvctattmx.supabase.co/rest/v1/rpc/exec_sql" ^
-H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU3NjAyMywiZXhwIjoyMDcwMTUyMDIzfQ.lmr9l3Lr1AjP5b-iFNgYo_b4QOSqHTfJQxZr--vdFxA" ^
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU3NjAyMywiZXhwIjoyMDcwMTUyMDIzfQ.lmr9l3Lr1AjP5b-iFNgYo_b4QOSqHTfJQxZr--vdFxA" ^
-H "Content-Type: application/json" ^
-d "{ \"sql\": \"CREATE OR REPLACE FUNCTION cancel_trial(p_user_id UUID, p_reason TEXT DEFAULT NULL) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE trial_subscription_id UUID; BEGIN SELECT id INTO trial_subscription_id FROM subscriptions WHERE user_id = p_user_id AND status = 'trialing' AND plan_id = 'trial'; IF trial_subscription_id IS NULL THEN RETURN 'NO_ACTIVE_TRIAL'; END IF; UPDATE subscriptions SET status = 'canceled', canceled_at = NOW(), cancel_reason = p_reason, updated_at = NOW() WHERE id = trial_subscription_id; RETURN 'SUCCESS'; EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'Error canceling trial: %%', SQLERRM; END; $$;\" }"
echo.
echo Commande executee. Verifiez la reponse ci-dessus.