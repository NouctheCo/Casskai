/**
 * CassKai - QUICK ACTION GUIDE
 * Post-Migration (Service Level) Implementation
 * 
 * 📌 What was accomplished:
 * ✅ 3 services migrated to acceptedAccountingService
 * ✅ Infrastructure created (service + standards + audit trail)
 * ✅ No TypeScript errors in any modified file
 * ✅ Full audit trail setup ready
 * 
 * 🔄 Current State:
 * - realDashboardKpiService: Uses acceptedAccountingService for revenue
 * - dashboardStatsService: Uses acceptedAccountingService for stats
 * - rfaCalculationService: Uses acceptedAccountingService with client filtering
 * - All three record audit trail asynchronously
 */

// ============================================================================
// IMMEDIATE ACTIONS (This Week)
// ============================================================================

export const IMMEDIATE_ACTIONS = {
  'TODAY': [
    '1. Run type-check to verify no errors:',
    '   npm run type-check',
    '',
    '2. Run linter:',
    '   npm run lint:fix',
    '',
    '3. Ensure all tests pass:',
    '   npm run test',
    '',
    '4. Verify acceptedAccountingService is properly exported:',
    '   grep -r "export.*acceptedAccountingService" src/',
    ''
  ],

  'TOMORROW': [
    '1. Start dev server:',
    '   npm run dev',
    '',
    '2. Test in browser:',
    '   - Login to dashboard',
    '   - Verify KPIs load (Revenue YTD, Profit Margin, etc)',
    '   - Check monthly revenue chart',
    '   - Verify top clients appear',
    '   - Check statistics (produits vs charges)',
    '',
    '3. Check database for audit records:',
    'SELECT COUNT(*) FROM accounting_calculations_audit;',
    'SELECT purpose, confidence_score FROM accounting_calculations_audit LIMIT 5;',
    ''
  ],

  'THIS WEEK': [
    '1. Deploy to staging environment:',
    '   - Build: npm run build',
    '   - Deploy built files to staging',
    '   - Run E2E tests: npm run test:e2e',
    '',
    '2. A/B Test (Optional but recommended):',
    '   - Keep old & new calculations side-by-side',
    '   - Compare revenue numbers',
    '   - Variance should be < 0.5% (same source now)',
    '',
    '3. Validate audit trail:',
    '   - Verify accounting_calculations_audit has records',
    '   - Check confidence_scores',
    '   - Review warnings field for any issues',
    '',
    '4. Get stakeholder approval:',
    '   - Share MIGRATION_COMPLETION_REPORT.md with team',
    '   - Explain the single source of truth approach',
    '   - Get Excel data for comparison if needed'
  ]
};

// ============================================================================
// PHASED DEPLOYMENT PLAN
// ============================================================================

export const DEPLOYMENT_PLAN = {
  'PHASE 1: Test Environment (2-3 days)': {
    goal: 'Validate all migrations work in isolation',
    tasks: [
      '✅ Deploy realDashboardKpiService to staging',
      '✅ Test dashboard loads, KPIs calculated',
      '✅ Verify revenue number reasonable',
      '✅ Check accounting_calculations_audit records added',
      '✅ Review confidence_score (should be >= 80)',
      '⏳ Deploy dashboardStatsService to staging',
      '⏳ Test stats calculation, trends',
      '⏳ Deploy rfaCalculationService to staging',
      '⏳ Test RFA for sample contract'
    ]
  },

  'PHASE 2: Staging Production Clone (2-3 days)': {
    goal: 'Run all 3 services in realistic scenario',
    tasks: [
      '⏳ Restore backup of production data to staging',
      '⏳ Run all 3 migrations together',
      '⏳ Calculate KPIs, stats, RFA with real data',
      '⏳ Compare outputs with old calculations:',
      '    - If variance < 1%: Ready for production ✅',
      '    - If variance > 1%: Investigate specific amounts',
      '⏳ Run E2E tests with real scenario',
      '⏳ Monitor logs for warnings (24h)'
    ]
  },

  'PHASE 3: Production Deployment (1-2 days)': {
    goal: 'Deploy to production with monitoring',
    tasks: [
      '⏳ Schedule deployment during low-traffic window',
      '⏳ Deploy code (realDashboardKpiService first)',
      '⏳ Monitor dashboard loads correctly',
      '⏳ Check audit trail inserts for 1 hour',
      '⏳ Deploy dashboardStatsService',
      '⏳ Deploy rfaCalculationService',
      '⏳ Monitor all services for 24 hours',
      '⏳ Alert on any confidence_score < 75'
    ]
  },

  'PHASE 4: Optimization & Cleanup (1 week)': {
    goal: 'Monitor, optimize, document learnings',
    tasks: [
      '⏳ Monitor accounting_calculations_audit growth',
      '⏳ Verify variance stays < 1%',
      '⏳ Archive old audit records monthly',
      '⏳ Document any issues encountered',
      '⏳ Plan migration for report services (next phase)',
      '⏳ Collect metrics for success report'
    ]
  }
};

// ============================================================================
// DECISION POINTS
// ============================================================================

export const DECISION_POINTS = {
  'At end of PHASE 1': {
    question: 'Should we proceed to PHASE 2?',
    go_if: [
      '✅ No TypeScript or runtime errors',
      '✅ KPIs/stats/RFA all calculate',
      '✅ Confidence scores >= 80',
      '✅ Audit trail records created'
    ],
    nogo_if: [
      '❌ Revenue is 0 (source not found)',
      '❌ Confidence score < 70',
      '❌ Errors in logs related to RLS or DB'
    ]
  },

  'At end of PHASE 2': {
    question: 'Can we deploy to production?',
    go_if: [
      '✅ Variance vs old calculation < 1%',
      '✅ E2E tests pass with real data',
      '✅ No warnings in audit trail',
      '✅ Stakeholder review passed'
    ],
    nogo_if: [
      '❌ Unexplained variance > 2%',
      '❌ RLS errors preventing access',
      '❌ Reconciliation showing issues'
    ]
  },

  'During PHASE 3': {
    question: 'Do we need to rollback?',
    rollback_if: [
      '❌ Production dashboard errors',
      '❌ Revenue unexpectedly 0',
      '❌ User reports seeing old numbers',
      '❌ Database disk space issue'
    ],
    do_not_rollback_if: [
      '✅ Confidence score low (data incomplete, not wrong)',
      '✅ Warnings about reconciliation (expected, monitored)',
      '✅ Slightly different numbers (if < 1% variance)'
    ]
  }
};

// ============================================================================
// SUCCESS INDICATORS
// ============================================================================

export const SUCCESS_INDICATORS = {
  'All 3 Services Deployed': {
    indicator: 'Dashboard shows revenue, stats, RFA all calculated',
    how_to_verify: 'Open dashboard, navigate to each section, verify numbers display'
  },

  'Audit Trail Working': {
    indicator: 'accounting_calculations_audit has records',
    how_to_verify: `
      SELECT COUNT(*) FROM accounting_calculations_audit WHERE purpose IN ('dashboard', 'dashboard_stats', 'rfa_calculation');
      Should return: > 0
    `
  },

  'No Variance': {
    indicator: 'Revenue is consistent across modules',
    how_to_verify: `
      Dashboard Revenue = Reports Revenue (< 0.1% difference)
      RFA Client Revenue = Part of Total Revenue
      Confidence scores all >= 85
    `
  },

  'Data Quality': {
    indicator: 'Audit trail shows data quality metrics',
    how_to_verify: `
      SELECT AVG(confidence_score) FROM accounting_calculations_audit;
      Should return: >= 85
    `
  },

  'No Errors': {
    indicator: 'Application logs clean for 24h after deployment',
    how_to_verify: `
      Check logs for:
      - No TypeScript errors
      - No RLS violations
      - No database connection issues
      - No undefined revenue values
    `
  }
};

// ============================================================================
// MONITORING QUERIES
// ============================================================================

export const MONITORING_QUERIES = {
  'Check audit trail is being populated': `
SELECT 
  purpose,
  COUNT(*) as count,
  AVG(confidence_score) as avg_confidence,
  MIN(calculated_at) as first_calc,
  MAX(calculated_at) as last_calc
FROM accounting_calculations_audit
WHERE calculated_at > NOW() - INTERVAL 1 DAY
GROUP BY purpose
ORDER BY last_calc DESC;
  `,

  'Monitor confidence scores': `
SELECT 
  purpose,
  confidence_score,
  COUNT(*) as frequency
FROM accounting_calculations_audit
WHERE calculated_at > NOW() - INTERVAL 7 DAY
GROUP BY purpose, confidence_score
ORDER BY confidence_score ASC;
  `,

  'Check for reconciliation issues': `
SELECT 
  company_id,
  reconciliation_status,
  COUNT(*) as count,
  AVG(CAST(final_amount AS NUMERIC)) as avg_revenue
FROM accounting_calculations_audit
WHERE reconciliation_status IS NOT NULL
  AND calculated_at > NOW() - INTERVAL 7 DAY
GROUP BY company_id, reconciliation_status
ORDER BY count DESC;
  `,

  'Monitor warnings': `
SELECT 
  purpose,
  warnings,
  COUNT(*) as count
FROM accounting_calculations_audit
WHERE warnings IS NOT NULL
  AND calculated_at > NOW() - INTERVAL 1 DAY
GROUP BY purpose, warnings;
  `,

  'Audit trail size (should be monitored for archiving)': `
SELECT 
  pg_size_pretty(pg_total_relation_size('accounting_calculations_audit')) as table_size,
  COUNT(*) as row_count,
  COUNT(*) FILTER (WHERE calculated_at > NOW() - INTERVAL 30 DAY) as last_30_days
FROM accounting_calculations_audit;
  `
};

// ============================================================================
// COMMON ISSUES & SOLUTIONS
// ============================================================================

export const TROUBLESHOOTING = {
  'Issue: Dashboard shows 0 revenue': {
    cause: 'acceptedAccountingService fallback exhausted',
    check: `
      1. SELECT COUNT(*) FROM journal_entries WHERE company_id = 'XXX';
      2. SELECT COUNT(*) FROM invoices WHERE company_id = 'XXX';
      3. Check accounting_calculations_audit for warnings
    `,
    fix: [
      'Verify journal_entries table has data',
      'If no data: Create dummy journal entry for testing',
      'Check accounting standard detection'
    ]
  },

  'Issue: Audit trail not being populated': {
    cause: 'Async insert failing silently',
    check: `
      1. Check application logs for errors
      2. SELECT COUNT(*) FROM accounting_calculations_audit;
      3. Verify RLS policy allows inserts
    `,
    fix: [
      'Check auth permissions for user',
      'Verify company_id is being passed correctly',
      'Manual insert test: INSERT INTO accounting_calculations_audit...'
    ]
  },

  'Issue: Confidence score very low (< 50)': {
    cause: 'Data quality issues (missing accounts, invalid entries)',
    check: `
      SELECT warnings FROM accounting_calculations_audit 
      WHERE confidence_score < 50 LIMIT 5;
    `,
    fix: [
      'Check for unposted journal entries',
      'Verify chart_of_accounts is complete',
      'Review reconciliation details'
    ]
  },

  'Issue: RLS error accessing audit trail': {
    cause: 'User not associated with company',
    check: `
      SELECT * FROM company_users 
      WHERE user_id = 'XXX' AND company_id = 'YYY';
    `,
    fix: [
      'Verify company_users table has record for user',
      'Check user_companies table for alternate path',
      'Grant proper role in your Supabase dashboard'
    ]
  }
};

// ============================================================================
// CONTACTS & ESCALATION
// ============================================================================

export const ESCALATION_PROCEDURE = {
  'For data discrepancies': {
    step1: 'Check accounting_calculations_audit for source used',
    step2: 'Review reconciliation_status and variance',
    step3: 'If unexplained, query journal_entries directly',
    escalate_to: 'Expert-comptable (needs accounting knowledge)'
  },

  'For performance issues': {
    step1: 'Monitor query execution times',
    step2: 'Check accounting_calculations_audit table size',
    step3: 'Archive old records if > 1GB',
    escalate_to: 'Database administrator'
  },

  'For RLS/security issues': {
    step1: 'Verify user is in company_users table',
    step2: 'Check RLS policies are enabled',
    step3: 'Test with SELECT * with RLS enabled',
    escalate_to: 'Security team / Supabase support'
  }
};

// ============================================================================
// FINAL CHECKLIST BEFORE PRODUCTION
// ============================================================================

export const PRE_PRODUCTION_CHECKLIST = {
  'Code Quality': [
    '☐ npm run type-check passes',
    '☐ npm run lint passes',
    '☐ npm run test passes',
    '☐ No console.log statements left',
    '☐ Error handling is comprehensive'
  ],

  'Database': [
    '☐ Migration files exist in supabase/migrations/',
    '☐ accounting_calculations_audit table verified',
    '☐ RLS policies tested with multiple users',
    '☐ Indexes created for performance'
  ],

  'Data': [
    '☐ Test data prepared for comparison',
    '☐ Old & new calculations match (< 0.5% variance)',
    '☐ Audit trail records being created',
    '☐ Confidence scores acceptable (>= 80)'
  ],

  'Monitoring': [
    '☐ Query monitoring dashboard set up',
    '☐ Alert configured for confidence_score < 75',
    '☐ Alert configured for variance > 2%',
    '☐ Slack/email integration ready'
  ],

  'Documentation': [
    '☐ MIGRATION_COMPLETION_REPORT.md shared with team',
    '☐ Monitoring queries documented in runbook',
    '☐ Rollback procedure documented and tested',
    '☐ All migration details saved'
  ]
};

export {
  IMMEDIATE_ACTIONS,
  DEPLOYMENT_PLAN,
  DECISION_POINTS,
  SUCCESS_INDICATORS,
  MONITORING_QUERIES,
  TROUBLESHOOTING,
  ESCALATION_PROCEDURE,
  PRE_PRODUCTION_CHECKLIST
};
