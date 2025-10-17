const fs = require('fs');
const path = require('path');

// Files with case declaration errors
const files = [
  'C:\\Users\\noutc\\Casskai\\src\\components\\ai\\widgets\\TaxOptimizationWidget.tsx',
  'C:\\Users\\noutc\\Casskai\\src\\services\\einvoicing\\core\\FormattingService.ts',
  'C:\\Users\\noutc\\Casskai\\src\\services\\vatCalculationService.ts',
  'C:\\Users\\noutc\\Casskai\\src\\utils\\trendCalculations.ts'
];

function fixCaseDeclarations(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let modified = false;
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Check if this is a case statement
      const caseMatch = line.match(/^(\s*)(case\s+.+:|default\s*:)\s*$/);

      if (caseMatch) {
        const indent = caseMatch[1];
        const caseLabel = caseMatch[2];

        // Look ahead to see if next line is already an opening brace
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

        if (nextLine !== '{') {
          // Find the next case/default/closing brace
          let j = i + 1;
          let depth = 0;
          let caseEnd = -1;

          while (j < lines.length) {
            const checkLine = lines[j];

            // Count braces for nested blocks
            const openBraces = (checkLine.match(/\{/g) || []).length;
            const closeBraces = (checkLine.match(/\}/g) || []).length;
            depth += openBraces - closeBraces;

            // Check if we've hit the next case, default, or end of switch
            if (depth === 0) {
              if (checkLine.trim().match(/^(case\s+.+:|default\s*:)/)) {
                caseEnd = j;
                break;
              }
              // Check for closing brace of switch at same indent level
              if (checkLine.match(new RegExp(`^${indent}\\}`))) {
                caseEnd = j;
                break;
              }
            }

            j++;
          }

          if (caseEnd > i + 1) {
            // Extract the case content
            const caseContent = lines.slice(i + 1, caseEnd);

            // Replace with wrapped version
            lines.splice(i + 1, caseEnd - i - 1,
              indent + '  {',
              ...caseContent,
              indent + '  }'
            );

            modified = true;
            i = i + caseContent.length + 3; // Skip past the case we just fixed
            continue;
          }
        }
      }

      i++;
    }

    if (modified) {
      const newContent = lines.join('\n');
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✓ Fixed case declarations in: ${path.basename(filePath)}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

console.log('Fixing case declaration errors...\n');

let fixedCount = 0;
files.forEach(file => {
  if (fs.existsSync(file)) {
    if (fixCaseDeclarations(file)) {
      fixedCount++;
    }
  } else {
    console.log(`✗ File not found: ${file}`);
  }
});

console.log(`\n✓ Fixed ${fixedCount} files`);
