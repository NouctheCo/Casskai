import { readFileSync, writeFileSync } from 'fs';

const files = [
  'src/components/accounting/SetupWizard.tsx',
  'src/components/settings/SampleDataManager.tsx',
  'src/hooks/useAccountingImport.ts',
  'src/pages/InvoicingPage.tsx',
  'src/pages/PricingPage.tsx',
  'src/services/accountingService.ts',
  'src/services/aiAnalyticsService.ts',
  'src/services/aiAssistantService.ts',
  'src/services/aiVisualizationService.ts',
  'src/services/bankImportService.ts',
  'src/services/chartOfAccountsService.ts',
  'src/services/csvImportService.ts',
  'src/services/entryTemplatesService.ts',
  'src/services/fecImportService.ts',
  'src/services/fiscal/InternationalTaxService.ts',
  'src/services/journalsService.ts',
  'src/services/moduleManager.ts',
  'src/services/openBanking/export/AccountingExportService.ts',
  'src/services/openBanking/reconciliation/ReconciliationEngine.ts',
  'src/services/openBanking/security/EncryptionService.ts',
  'src/services/sampleData/SampleDataService.ts'
];

let totalFixed = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  const original = content;

  // Pattern 1: Typer catch (error)
  content = content.replace(/catch\s*\(\s*error\s*\)\s*\{/g, 'catch (error: unknown) {');

  // Pattern 2: error.message direct
  content = content.replace(
    /(\W)error\.message(\W)/g,
    (match, before, after) => {
      if (before.match(/[a-zA-Z_$]/) || after.match(/[a-zA-Z_$]/)) return match;
      return `${before}(error instanceof Error ? error.message : 'Une erreur est survenue')${after}`;
    }
  );

  // Pattern 3: error.stack
  content = content.replace(
    /(\W)error\.stack(\W)/g,
    '$1(error instanceof Error ? error.stack : undefined)$2'
  );

  // Pattern 4: error.name
  content = content.replace(
    /(\W)error\.name(\W)/g,
    '$1(error instanceof Error ? error.name : \'Error\')$2'
  );

  // Pattern 5: error.code (pour NodeJS errors)
  content = content.replace(
    /(\W)error\.code(\W)/g,
    '$1(error as any)?.code$2'
  );

  // Pattern 6: String(error) dans catch
  content = content.replace(
    /String\(error\)/g,
    '(error instanceof Error ? error.message : String(error))'
  );

  if (content !== original) {
    writeFileSync(file, content, 'utf8');
    console.log(`✅ ${file}`);
    totalFixed++;
  } else {
    console.log(`⏭️  ${file} (inchangé)`);
  }
}

console.log(`\n✨ ${totalFixed} fichiers corrigés`);
