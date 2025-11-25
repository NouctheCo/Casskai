# Fix RLS Policies Migration - Applied

**Date**: 2025-11-09
**Migration File**: `supabase/migrations/20251109000003_fix_hr_rls_policies.sql`

## Problem

The original RLS policies migration (`20251109000001_add_sirh_rls_policies.sql`) referenced a table called `company_memberships` which doesn't exist in the database. The actual table is `user_companies`.

This caused the error:
```
ERROR: 42P01: relation "company_memberships" does not exist
```

## First Attempt - CASCADE Error

Initial fix attempted to drop functions first, which caused a dependency error:
```
ERROR: 2BP01: cannot drop function user_belongs_to_company(uuid) because other objects depend on it
HINT: Use DROP ... CASCADE to drop the dependent objects too.
```

## Solution Applied

Restructured the migration to execute in this order:

### STEP 1: Drop All RLS Policies First (32 policies)
- hr_documents (4 policies)
- hr_performance_cycles (2 policies)
- hr_objectives (2 policies)
- hr_performance_reviews (3 policies)
- hr_feedback (3 policies)
- hr_training_catalog (2 policies)
- hr_training_sessions (2 policies)
- hr_training_enrollments (4 policies)
- hr_certifications (2 policies)
- hr_skills_matrix (4 policies)

### STEP 2: Drop Old Helper Functions
- `user_belongs_to_company(UUID)`
- `is_hr_manager()`
- `is_employee_manager(UUID)`

### STEP 3: Create Corrected Helper Functions
All functions now use `user_companies` table instead of `company_memberships`:

```sql
CREATE OR REPLACE FUNCTION public.user_belongs_to_company(company_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_companies  -- CORRECTED
        WHERE user_id = auth.uid()
        AND company_id = company_uuid
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### STEP 4: Recreate All RLS Policies
All 32 policies recreated with corrected helper functions.

## Changes Made

**Corrected Table References**:
- `company_memberships` → `user_companies`
- All queries now use: `WHERE uc.user_id = auth.uid() AND uc.is_active = true`

**Helper Functions Updated**:
1. `user_belongs_to_company()` - Checks `user_companies` table
2. `is_hr_manager()` - Joins `user_companies` with `companies`
3. `is_employee_manager()` - Uses employee email matching

## To Apply

Run this migration in Supabase SQL Editor or CLI:
```bash
psql -h <host> -U postgres -d postgres -f supabase/migrations/20251109000003_fix_hr_rls_policies.sql
```

Or via Supabase CLI:
```bash
supabase db push
```

## Verification

After applying, verify with:

```sql
-- Check functions exist
SELECT proname FROM pg_proc WHERE proname IN ('user_belongs_to_company', 'is_hr_manager', 'is_employee_manager');

-- Check policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename LIKE 'hr_%'
ORDER BY tablename, policyname;

-- Should return 32 policies
```

## Next Steps

After this migration is applied:
1. Apply Storage bucket migration (`20251109000002_create_hr_documents_storage.sql`)
2. Test hr_documents queries to ensure they work without errors
3. Test document upload functionality in the UI

## Status

- [x] Migration file corrected
- [ ] Migration applied to database
- [ ] RLS policies tested
- [ ] Storage bucket migration applied
- [ ] End-to-end testing completed
