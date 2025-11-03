const fs = require('fs');
const path = require('path');

const srcPath = './src';
let totalFiles = 0;
let correctedFiles = 0;
let catchBlocksFixed = 0;

function walkDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      totalFiles++;

      let content = fs.readFileSync(filePath, 'utf-8');
      const originalContent = content;

      // Find all catch blocks with _error pattern and fix them
      const catchPattern = /catch\s*\(_(?:error|err|_?)\)\s*\{/g;
      const matches = content.match(catchPattern) || [];

      if (matches.length > 0) {
        // Replace catch (_error) with catch (error)
        content = content.replace(catchPattern, 'catch (error) {');

        // Check if error variable is used and add instanceof check if needed
        if (content.includes('console.error') || content.includes('throw error')) {
          // For each catch block, ensure error is properly handled
          content = content.replace(
            /catch \(error\) \{([\s\S]*?)(?=\n\s*(?:finally|\}|const|let|var|function|if|return))/g,
            (match) => {
              // Check if already has error message extraction
              if (!match.includes('error instanceof Error')) {
                return match.replace(
                  /console\.error\((.*?)error([,\)])/g,
                  `console.error($1error instanceof Error ? error.message : String(error)$2`
                );
              }
              return match;
            }
          );
        }

        if (content !== originalContent) {
          fs.writeFileSync(filePath, content, 'utf-8');
          correctedFiles++;
          catchBlocksFixed += matches.length;
          console.log(`Fixed: ${filePath}`);
        }
      }
    }
  });
}

console.log('Starting fix for catch blocks...\n');
walkDir(srcPath);

console.log(`\n--- Summary ---`);
console.log(`Total files processed: ${totalFiles}`);
console.log(`Files corrected: ${correctedFiles}`);
console.log(`Catch blocks fixed: ${catchBlocksFixed}`);
