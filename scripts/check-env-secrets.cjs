#!/usr/bin/env node

/**
 * Security script to check for potential secrets in environment files
 */

const fs = require('fs');

// Patterns that might indicate secrets
const SECRET_PATTERNS = [
  /password\s*=\s*.+/i,
  /secret\s*=\s*.+/i,
  /key\s*=\s*[a-zA-Z0-9]{20,}/,
  /token\s*=\s*[a-zA-Z0-9]{20,}/,
  /api[_-]?key\s*=\s*[a-zA-Z0-9]{10,}/i,
  /private[_-]?key\s*=\s*.+/i,
  /auth[_-]?token\s*=\s*.+/i,
  // Database URLs with embedded passwords
  /postgresql:\/\/[^:]+:[^@]+@/i,
  /mysql:\/\/[^:]+:[^@]+@/i,
  // AWS credentials
  /aws[_-]?access[_-]?key[_-]?id\s*=\s*[A-Z0-9]{20}/i,
  /aws[_-]?secret[_-]?access[_-]?key\s*=\s*[A-Za-z0-9/+=]{40}/i,
];

// Allowed patterns (these are OK even if they match above)
const ALLOWED_PATTERNS = [
  /=\s*$/,                          // Empty values
  /=\s*["']?your[_-]?/i,           // Placeholder values like "your_api_key"
  /=\s*["']?example/i,             // Example values
  /=\s*["']?test/i,                // Test values
  /=\s*["']?localhost/i,           // Local development
  /=\s*["']?changeme/i,            // Placeholder passwords
  /=\s*["']?replace[_-]?with/i,    // Replacement instructions
  /=\s*["']?\$\{.*\}/,             // Environment variable substitution
  /=\s*["']?<.*>/,                 // Placeholder brackets
];

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];

    lines.forEach((line, index) => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || line.trim() === '') {
        return;
      }

      // Check if line matches any secret pattern
      const matchesSecret = SECRET_PATTERNS.some(pattern => pattern.test(line));
      
      if (matchesSecret) {
        // Check if it's an allowed pattern
        const isAllowed = ALLOWED_PATTERNS.some(pattern => pattern.test(line));
        
        if (!isAllowed) {
          issues.push({
            line: index + 1,
            content: line.trim(),
            reason: 'Potential secret detected'
          });
        }
      }
    });

    return issues;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node check-env-secrets.js <file1> [file2] ...');
    process.exit(1);
  }

  let hasIssues = false;

  args.forEach(filePath => {
    console.log(`🔍 Checking ${filePath} for potential secrets...`);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
      return;
    }

    const issues = checkFile(filePath);
    
    if (issues.length > 0) {
      hasIssues = true;
      console.error(`❌ Found ${issues.length} potential secret(s) in ${filePath}:`);
      
      issues.forEach(issue => {
        console.error(`   Line ${issue.line}: ${issue.content}`);
        console.error(`   Reason: ${issue.reason}`);
      });
      
      console.error('\n💡 Suggestions:');
      console.error('   - Use environment variable references (e.g., ${VARIABLE_NAME})');
      console.error('   - Use placeholder values in example files');
      console.error('   - Move secrets to a secure environment or secrets manager');
      console.error('   - Add the file to .gitignore if it contains real secrets\n');
    } else {
      console.log(`✅ No secrets detected in ${filePath}`);
    }
  });

  if (hasIssues) {
    console.error('🚨 Secret detection failed! Please review the flagged content.');
    process.exit(1);
  } else {
    console.log('✅ All files passed secret detection!');
  }
}

if (require.main === module) {
  main();
}