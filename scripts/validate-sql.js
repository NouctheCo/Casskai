#!/usr/bin/env node

/**
 * Basic SQL validation script for Supabase migrations
 */

const fs = require('fs');
const path = require('path');

// Common SQL validation patterns
const VALIDATION_RULES = [
  {
    name: 'No DROP DATABASE',
    pattern: /drop\s+database/i,
    error: 'DROP DATABASE statements are not allowed in migrations'
  },
  {
    name: 'No TRUNCATE without WHERE',
    pattern: /truncate\s+table/i,
    warning: 'TRUNCATE statements should be used carefully'
  },
  {
    name: 'Foreign key constraints',
    pattern: /add\s+constraint.*foreign\s+key/i,
    info: 'Foreign key constraint detected - ensure referential integrity'
  },
  {
    name: 'Index creation',
    pattern: /create\s+(?:unique\s+)?index/i,
    info: 'Index creation detected - consider performance impact'
  },
  {
    name: 'RLS policies',
    pattern: /create\s+policy/i,
    info: 'RLS policy detected - ensure security rules are correct'
  },
  {
    name: 'Data modification in DDL',
    pattern: /(?:insert|update|delete)\s+(?:into\s+|from\s+)/i,
    warning: 'Data modification in migration - consider data consistency'
  }
];

// Required patterns for Supabase migrations
const REQUIRED_PATTERNS = [
  {
    name: 'Migration header comment',
    pattern: /^--\s*.*migration/i,
    required: false
  }
];

function validateSQL(content, filename) {
  const lines = content.split('\n');
  const issues = [];
  const info = [];
  const warnings = [];

  // Check for dangerous patterns
  VALIDATION_RULES.forEach(rule => {
    if (rule.pattern.test(content)) {
      const issue = {
        file: filename,
        rule: rule.name,
        message: rule.error || rule.warning || rule.info,
        type: rule.error ? 'error' : rule.warning ? 'warning' : 'info'
      };

      switch (issue.type) {
        case 'error':
          issues.push(issue);
          break;
        case 'warning':
          warnings.push(issue);
          break;
        case 'info':
          info.push(issue);
          break;
      }
    }
  });

  // Check for SQL syntax basics
  const statements = content.split(';').filter(stmt => stmt.trim());
  
  statements.forEach((statement, index) => {
    const trimmed = statement.trim();
    if (!trimmed) return;

    // Check for unmatched parentheses
    const openParens = (trimmed.match(/\(/g) || []).length;
    const closeParens = (trimmed.match(/\)/g) || []).length;
    
    if (openParens !== closeParens) {
      issues.push({
        file: filename,
        rule: 'Syntax check',
        message: `Statement ${index + 1}: Unmatched parentheses`,
        type: 'error'
      });
    }

    // Check for unmatched quotes
    const singleQuotes = (trimmed.match(/'/g) || []).length;
    const doubleQuotes = (trimmed.match(/"/g) || []).length;
    
    if (singleQuotes % 2 !== 0) {
      issues.push({
        file: filename,
        rule: 'Syntax check',
        message: `Statement ${index + 1}: Unmatched single quotes`,
        type: 'error'
      });
    }
    
    if (doubleQuotes % 2 !== 0) {
      issues.push({
        file: filename,
        rule: 'Syntax check',
        message: `Statement ${index + 1}: Unmatched double quotes`,
        type: 'error'
      });
    }

    // Check for common SQL injection patterns (even in migrations)
    const suspiciousPatterns = [
      /;.*drop/i,
      /union.*select/i,
      /'\s*or\s*'1'\s*=\s*'1/i
    ];

    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(trimmed)) {
        warnings.push({
          file: filename,
          rule: 'Security check',
          message: `Statement ${index + 1}: Suspicious SQL pattern detected`,
          type: 'warning'
        });
      }
    });
  });

  // Check file naming convention for Supabase
  const basename = path.basename(filename);
  if (!/^\d{14}_.*\.sql$/.test(basename)) {
    warnings.push({
      file: filename,
      rule: 'File naming',
      message: 'Migration file should follow format: YYYYMMDDHHMMSS_description.sql',
      type: 'warning'
    });
  }

  return { issues, warnings, info };
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node validate-sql.js <file1> [file2] ...');
    process.exit(1);
  }

  let hasErrors = false;
  let totalWarnings = 0;
  let totalInfo = 0;

  args.forEach(filePath => {
    console.log(`🔍 Validating SQL file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      hasErrors = true;
      return;
    }

    if (!filePath.endsWith('.sql')) {
      console.warn(`⚠️  File is not a SQL file: ${filePath}`);
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { issues, warnings, info } = validateSQL(content, filePath);

      if (issues.length > 0) {
        hasErrors = true;
        console.error(`❌ Found ${issues.length} error(s):`);
        issues.forEach(issue => {
          console.error(`   ${issue.rule}: ${issue.message}`);
        });
      }

      if (warnings.length > 0) {
        totalWarnings += warnings.length;
        console.warn(`⚠️  Found ${warnings.length} warning(s):`);
        warnings.forEach(warning => {
          console.warn(`   ${warning.rule}: ${warning.message}`);
        });
      }

      if (info.length > 0) {
        totalInfo += info.length;
        console.info(`ℹ️  Found ${info.length} info item(s):`);
        info.forEach(item => {
          console.info(`   ${item.rule}: ${item.message}`);
        });
      }

      if (issues.length === 0 && warnings.length === 0 && info.length === 0) {
        console.log(`✅ SQL file is valid: ${filePath}`);
      }

    } catch (error) {
      console.error(`❌ Error reading file ${filePath}:`, error.message);
      hasErrors = true;
    }
  });

  console.log('\n📊 Summary:');
  console.log(`   Files processed: ${args.length}`);
  console.log(`   Total warnings: ${totalWarnings}`);
  console.log(`   Total info: ${totalInfo}`);

  if (hasErrors) {
    console.error('\n🚨 SQL validation failed! Please fix the errors above.');
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.warn('\n⚠️  SQL validation completed with warnings.');
    process.exit(0); // Don't fail on warnings
  } else {
    console.log('\n✅ All SQL files passed validation!');
  }
}

if (require.main === module) {
  main();
}