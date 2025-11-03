const fs = require('fs');
const path = require('path');

const srcPath = './src';
let totalFiles = 0;
let correctedFiles = 0;

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

      // Find catch blocks that declare error but use err
      if (content.includes('catch (error)') || content.includes('catch (_err)')) {
        // Replace all standalone 'err' with 'error instanceof Error ? error.message : String(error)'
        content = content.replace(/\berr\b(?!or[A-Za-z])/g, 'errorMsg');

        // Now make sure we have the errorMsg extraction at the start of catch block
        content = content.replace(
          /catch \(error\)\s*\{([\s\S]*?)(?=\n\s*(?:finally|\}|const|let|var|function|if|return|try|async))/g,
          (match) => {
            if (!match.includes('const errorMsg')) {
              return match.replace(
                /catch \(error\) \{/,
                `catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);`
              );
            }
            return match;
          }
        );

        if (content !== originalContent) {
          fs.writeFileSync(filePath, content, 'utf-8');
          correctedFiles++;
          console.log(`Fixed: ${filePath}`);
        }
      }
    }
  });
}

console.log('Processing files...\n');
walkDir(srcPath);

console.log(`\n--- Summary ---`);
console.log(`Total files processed: ${totalFiles}`);
console.log(`Files corrected: ${correctedFiles}`);
