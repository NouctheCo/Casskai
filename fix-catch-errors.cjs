const fs = require('fs');
const path = require('path');

/**
 * Script de correction automatique des erreurs TS18046 (catch errors)
 */

// Liste des fichiers à corriger (on les obtient depuis grep)
const filesToFix = [
  'src/services/ReportExportService.ts',
  'src/services/pdfService.ts',
  'src/services/invoicePdfService.ts',
  'src/services/reportGenerationService.ts',
  'src/services/aiReportAnalysisService.ts',
  'src/services/aiAnalysisService.ts',
  'src/services/dashboardStatsService.ts',
  'src/components/accounting/ReportsFinancialDashboard.tsx',
  'src/services/chartImageService.ts'
].map(f => path.join(process.cwd(), f));

/**
 * Correction d'un fichier
 */
function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Fichier non trouvé: ${filePath}`);
    return false;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    let modified = false;

    // Pattern 1: catch (error) -> catch (error: unknown)
    if (content.includes('catch (error)') && !content.includes('catch (error: unknown)')) {
      content = content.replace(/catch\s*\(\s*error\s*\)\s*\{/g, 'catch (error: unknown) {');
      modified = true;
    }

    // Pattern 2: error.message direct usage
    const errorMessagePattern = /(\s+)(.*?)(error\.message)/g;
    if (errorMessagePattern.test(content)) {
      content = content.replace(
        /([^.])error\.message([^a-zA-Z_])/g,
        '$1(error instanceof Error ? error.message : \'Une erreur est survenue\')$2'
      );
      modified = true;
    }

    // Pattern 3: error.stack
    if (content.includes('error.stack')) {
      content = content.replace(
        /([^.])error\.stack([^a-zA-Z_])/g,
        '$1(error instanceof Error ? error.stack : undefined)$2'
      );
      modified = true;
    }

    // Pattern 4: String(error) dans les catch
    if (content.includes('String(error)')) {
      content = content.replace(
        /String\(error\)/g,
        '(error instanceof Error ? error.message : String(error))'
      );
      modified = true;
    }

    if (modified && content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`⏭️  ${path.basename(filePath)} (déjà OK)`);
      return false;
    }
  } catch (err) {
    console.error(`❌ ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

// Main
console.log('🔧 Correction des erreurs TS18046...\n');
let fixed = 0;

filesToFix.forEach(file => {
  if (fixFile(file)) fixed++;
});

console.log(`\n✨ ${fixed} fichiers corrigés`);
