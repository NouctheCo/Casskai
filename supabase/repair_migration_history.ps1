# Script pour réparer l'historique des migrations Supabase
# Marque les migrations locales-seulement comme "reverted" dans la table distant

Write-Host "🔧 Réparation de l'historique des migrations..." -ForegroundColor Cyan
Write-Host ""

$migrations = @(
  '20250104_add_missing_automation_columns_v2',
  '20250104_automation_tables',
  '20250104_automation_tables_v2',
  '20250104_fix_automation_tables',
  '20250106120000_create_asset_management_tables',
  '20250109000000_add_warehouses_rls_policies',
  '20250109000000_fix_rpc_functions_journal_entry_lines',
  '20250109000001_fix_get_account_balance_simple',
  '20250109000002_apply_all_fixes_and_update_drafts',
  '20250109000003_add_account_balance_trigger',
  '20250115000000_add_ai_usage_logs',
  '20250115000000_create_journal_entry_numbering_function',
  '20250128_automation_ai_adapted',
  '20250128_automation_ai_clean',
  '20250128_automation_and_ai',
  '20250204000000_create_articles_table',
  '20251018100000_create_user_quotas_system',
  '20251107100000_create_tax_module_tables',
  '20251107100000_create_tax_module_tables_v3_surgical',
  '20251107110000_create_forecasts_tables',
  '20251107110000_create_forecasts_tables_v2_idempotent',
  '20251107120000_create_purchases_tables',
  '20251107120000_create_purchases_tables_v2_idempotent',
  '20251107130000_create_contracts_tables',
  '20251107130000_create_contracts_tables_v2_idempotent',
  '20251107130000_create_onboarding_function',
  '20251107140000_fix_trial_to_30_days_enterprise',
  '20251107140000_fix_trial_to_30_days_enterprise_v2_idempotent',
  '20251108000000_create_reports_tables',
  '20251108000001_fix_reports_tables_schema',
  '20251108000002_fix_reports_with_company_users',
  '20251108000003_minimal_reports_tables',
  '20251108000004_fix_reports_tables_types',
  '20251108000005_add_reports_rls_policies',
  '20251109000000_add_sirh_modules',
  '20251109000001_add_sirh_rls_policies',
  '20251109000002_create_hr_documents_storage',
  '20251109000003_fix_hr_rls_policies',
  '20251109000004_add_document_templates',
  '20251109000006_create_reports_archive_system',
  '20251109000007_create_reports_storage_bucket',
  '20251109000007_fix_rls_policies_for_reports',
  '20251109000008_create_tax_archive_system',
  '20251109000009_create_tax_storage_bucket',
  '20251109000010_create_contracts_purchases_archive_systems',
  '20251110000000_seed_test_accounting_data',
  '20251110000001_seed_simple_accounting_data',
  '20251110000002_seed_accounting_data_fixed_journal_type',
  '20251110000003_seed_accounting_data_correct_schema',
  '20251110000004_seed_data_disable_trigger',
  '20251123000004_fix_rpc_exception_handling',
  '20251127000000_add_accounting_standard_to_companies',
  '20251128_bank_module_complete',
  '20251128_bank_module_FINAL',
  '20251128_budget_tables',
  '20251128_budget_tables_v2',
  '20251128_budget_tables_v3_safe',
  '20251128_categorization_rules',
  '20251128_contracts_rfa_columns',
  '20251128_hr_module_alter',
  '20251128_hr_module_complete',
  '20251128_projects_module_alter',
  '20251128_projects_module_complete',
  '20251128000003_add_auxiliary_account',
  '20251129000000_fix_users_rls_read',
  '20251129000001_add_onboarding_completed_at',
  '20251130000000_create_audit_logs',
  '20251130000001_fix_audit_logs_schema',
  '20251130000002_add_audit_logs_columns',
  '20251130000003_add_missing_chart_templates',
  '20251130000100_fix_report_functions_structure',
  '20251201000000_add_journal_entry_link_to_invoices',
  '20251201000001_create_invoice_payment_allocations',
  '20251201000002_create_vat_declaration_rpc',
  '20251201000003_create_depreciation_tables',
  '20251201000004_generate_depreciation_entries_rpc',
  '20251201000005_create_payroll_tables',
  '20251201000006_generate_payroll_entries_rpc',
  '20251201000007_create_fec_export_rpc',
  '20251202_add_budget_category_to_chart_of_accounts',
  '20251202_migrate_budget_categories_to_accounts',
  '20251203000000_fix_third_parties_rls_policies',
  '20251203000001_add_crm_fields_to_third_parties',
  '20251204_create_account_deletion_requests',
  '20251204_create_subscriptions_table',
  '20251204_create_third_parties_unified_view',
  '20251204000000_add_article_link_to_invoice_lines',
  '20251206000001_create_rgpd_tables',
  '20251206000002_fix_rgpd_tables',
  '20251206000003_add_missing_columns',
  '20251210_auto_entry_numbering',
  '20251210_check_entry_statuses',
  '20251210_check_invoices_structure',
  '20251210_check_journal_entry_lines_rls',
  '20251210_check_orphan_accounts_simple',
  '20251210_check_purchases_columns',
  '20251210_check_purchases_columns_v2',
  '20251210_cleanup_orphan_accounts',
  '20251210_cleanup_orphan_accounts_v2',
  '20251210_debug_all_rls_policies',
  '20251210_fix_journal_entry_lines_rls',
  '20251210_fix_journal_entry_lines_rls_v2',
  '20251210_fix_rls_policies',
  '20251210_fix_rls_policies_v2',
  '20251210_test_journal_entries_read',
  '20251213000000_fix_audit_logs_rls',
  '20251217_create_deletion_requests_tables',
  '20251218000000_invoice_balances_invoker',
  '20251218000001_fix_function_search_path',
  '20251218000002_move_extensions_from_public',
  '20251218000003_add_rls_policies_for_tables',
  '20251218000004_fix_rls_enable_public_tables',
  '20251220000001_fix_create_company_missing_columns',
  '20251220000002_migrate_onboarding_data_to_companies',
  '20251222_add_company_id_to_journal_entry_lines',
  '20251222_create_journal_entry_attachments',
  '20251222_verify_journal_entry_lines_migration',
  '20251227_add_invoice_legal_fields',
  '20251227_email_configurations',
  '20251228_fix_unaccent_extension',
  '20251228_recreate_create_company_with_user',
  '20251228000000_ensure_create_company_with_user_exists',
  '20251228000001_activate_unaccent_extension',
  '20251228000002_fix_normalize_company_name_workaround',
  '20251228000003_allow_user_audit_logs_without_company',
  '20260102000001_create_regulatory_documents',
  '20260102000002_seed_regulatory_templates',
  '20260102000003_cleanup_deprecated_columns',
  '20260102000003_fix_regulatory_unique_constraint',
  '20260102000003_phase3_country_workflows',
  '20260102000004_seed_regulatory_templates',
  '20260102000005_insert_all_templates',
  '20260102100000_fix_security_definer_and_rls',
  '20260102100001_fix_remaining_security_definer_views',
  '20260102100002_fix_regulatory_functions_search_path',
  '20260102100003_fix_all_function_search_paths',
  '20260102100004_fix_get_mandatory_templates_final',
  '20260103000001_accounting_security_and_legality',
  '20260103000002_accounting_period_closure',
  '20260103000003_accounting_workflow_validation',
  '20260103000004_security_logs',
  '20260110_create_fiscal_declarations',
  '20260110_multi_currency_tables',
  '20260110000000_ensure_regulatory_templates_complete',
  '20260110000001_add_template_id_to_regulatory_documents',
  '20260114020000_create_rfa_product_groups',
  '20260114130000_contracts_rfa_advanced_columns',
  '20260114134000_invoice_lines_product_identifiers',
  '20260114160000_invoice_lines_rfa_meta_backfill',
  '20260114161000_create_rfa_communications',
  '20260114170000_create_rfa_imports',
  '20260115000000_update_fec_export_separator_tab'
)

Write-Host "📋 $($migrations.Count) migrations à marquer comme 'reverted'" -ForegroundColor Yellow
Write-Host ""
Write-Host "Cette opération va :" -ForegroundColor Cyan
Write-Host "  1. Retirer ces migrations de la table supabase_migrations.schema_migrations" -ForegroundColor Gray
Write-Host "  2. Permettre à 'supabase db push' de fonctionner normalement" -ForegroundColor Gray
Write-Host "  3. Ne PAS modifier votre schéma de base de données" -ForegroundColor Gray
Write-Host ""

$response = Read-Host "Continuer? (Y/n)"
if ($response -eq 'n' -or $response -eq 'N') {
    Write-Host "❌ Annulé." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⏳ Exécution de la commande repair..." -ForegroundColor Cyan
Write-Host ""

# Construire la commande avec tous les arguments
$command = "supabase migration repair --linked --status reverted " + ($migrations -join ' ')

# Exécuter la commande
try {
    Invoke-Expression $command
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✅ Réparation terminée!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Test recommandé:" -ForegroundColor Yellow
    Write-Host "   > supabase db push --linked --dry-run" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "❌ Erreur lors de l'exécution:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Essayez de lancer manuellement:" -ForegroundColor Yellow
    Write-Host "   > $command" -ForegroundColor Gray
}
