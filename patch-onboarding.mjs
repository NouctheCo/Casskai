#!/usr/bin/env node

/**
 * Script pour corriger le fichier OnboardingContextNew.tsx
 * Remplace l'appel RPC create_company_with_user par une logique directe
 */

import fs from 'fs';
import path from 'path';

const filePath = 'src/contexts/OnboardingContextNew.tsx';

if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Check if already patched
if (content.includes('createCompanyDirectly(user.id')) {
  console.log('✅ File already patched');
  process.exit(0);
}

// Add import if not present
if (!content.includes("import { createCompanyDirectly }")) {
  const importPosition = content.indexOf('import { devLogger }');
  if (importPosition > 0) {
    const endOfLine = content.indexOf('\n', importPosition);
    const importStatement = "import { createCompanyDirectly } from '@/helpers/createCompanyHelper';\n";
    content = content.slice(0, endOfLine + 1) + importStatement + content.slice(endOfLine + 1);
  }
}

// Remove the authedClient creation - we don't need it anymore
const authedClientStart = content.indexOf('const authedClient = session?.access_token');
if (authedClientStart > 0) {
  const authedClientEnd = content.indexOf(';', content.indexOf('persistSession: false', authedClientStart)) + 1;
  const authedClientLine = content.slice(authedClientStart, authedClientEnd);
  
  console.log('Removing authedClient creation...');
  content = content.replace(authedClientLine, '// authedClient no longer needed');
}

// Replace the RPC call
const oldRpcCode = `const { data: result, error: rpcError } = await authedClient.rpc('create_company_with_user'`;
if (content.includes(oldRpcCode)) {
  console.log('✅ Found RPC call to replace');
  
  // Find and replace the entire RPC block
  const rpcBlockStart = content.indexOf(oldRpcCode);
  const firstSuccessCheck = content.indexOf('if (rpcError)', rpcBlockStart);
  const lastSuccessCheck = content.indexOf('devLogger.info(\'✅ Company and user_companies created successfully:', rpcBlockStart);
  const blockEnd = content.indexOf(');', lastSuccessCheck) + 2;
  
  const replacement = `const { success, companyId: createdCompanyId, error: createError } = await createCompanyDirectly(user.id, companyData);

        if (!success || !createdCompanyId) {
          throw new Error(createError || 'Failed to create company');
        }

        devLogger.info('✅ Company and user_companies created successfully:', createdCompanyId)`;
  
  content = content.slice(0, rpcBlockStart) + replacement + content.slice(blockEnd);
  console.log('✅ RPC call replaced with direct creation');
} else {
  console.log('⚠️  RPC call not found - may already be patched');
}

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ File updated successfully');
