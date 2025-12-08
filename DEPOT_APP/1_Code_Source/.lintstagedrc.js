module.exports = {
  // TypeScript and JavaScript files
  '*.{ts,tsx,js,jsx}': [
    // ESLint with auto-fix
    'eslint --fix',
    // Prettier formatting
    'prettier --write',
    // Type checking for TypeScript files
    () => 'tsc --noEmit',
    // Run tests related to changed files
    'npm run test:run -- --related --passWithNoTests',
  ],
  
  // CSS, SCSS, and style files
  '*.{css,scss,sass}': [
    'prettier --write',
  ],
  
  // JSON files
  '*.json': [
    'prettier --write',
  ],
  
  // Markdown files
  '*.md': [
    'prettier --write',
    // Optional: run markdownlint
    'markdownlint --fix',
  ],
  
  // YAML files
  '*.{yml,yaml}': [
    'prettier --write',
  ],
  
  // Package.json files (validate and format)
  'package.json': [
    'prettier --write',
    // Optional: validate package.json
    'npm pkg fix',
  ],
  
  // SVG files (optimize)
  '*.svg': [
    'svgo --multipass',
  ],
  
  // Image files (optional optimization - can be slow)
  '*.{png,jpg,jpeg}': [
    // 'imagemin-cli --plugin=imagemin-pngquant --plugin=imagemin-mozjpeg',
  ],
  
  // Configuration files
  '*.config.{js,ts}': [
    'eslint --fix',
    'prettier --write',
  ],
  
  // Environment files
  '.env*': [
    // Security check for secrets (custom script)
    'node scripts/check-env-secrets.js',
  ],
  
  // Supabase migration files
  'supabase/migrations/*.sql': [
    // SQL formatting (if you have a SQL formatter)
    // 'sql-formatter --fix',
    // Validate SQL syntax (custom script)
    'node scripts/validate-sql.js',
  ],
  
  // Docker files
  'Dockerfile*': [
    // Dockerfile linting with hadolint (if installed)
    // 'hadolint',
  ],
  
  // Shell scripts
  '*.sh': [
    // Shell script linting with shellcheck (if installed)
    // 'shellcheck',
    // Make executable
    'chmod +x',
  ],
};