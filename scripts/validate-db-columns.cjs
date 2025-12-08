#!/usr/bin/env node
/**
 * Script de validation des colonnes DB
 * Compare les colonnes utilisées dans le code avec le schéma Supabase réel
 *
 * Usage: node scripts/validate-db-columns.js
 */

const fs = require('fs');
const path = require('path');

// Schéma de référence basé sur la vraie structure Supabase
const DB_SCHEMA = {
  invoices: {
    columns: ['id', 'company_id', 'invoice_number', 'invoice_type', 'invoice_date', 'due_date',
              'status', 'subtotal_excl_tax', 'total_tax_amount', 'total_incl_tax', 'currency',
              'third_party_id', 'customer_id', 'notes', 'created_at', 'updated_at'],
    removed: ['type', 'issue_date', 'subtotal', 'tax_amount', 'total_amount']
  },

  third_parties: {
    columns: ['id', 'company_id', 'type', 'name', 'legal_name', 'tax_id', 'is_active',
              'current_balance', 'credit_limit', 'address_line1', 'address_line2', 'city',
              'postal_code', 'country', 'email', 'phone', 'website', 'notes', 'created_at', 'updated_at'],
    removed: ['party_type', 'status', 'balance', 'address']
  },

  inventory_items: {
    columns: ['id', 'company_id', 'product_id', 'product_variant_id', 'warehouse_id',
              'location_id', 'quantity_on_hand', 'reserved_quantity', 'available_quantity',
              'unit_cost', 'last_restock_date', 'reorder_point', 'reorder_quantity',
              'created_at', 'updated_at'],
    removed: ['name', 'reference', 'sku', 'category', 'status'],
    note: 'Les infos produit (name, sku, etc.) sont dans products, pas inventory_items'
  },

  products: {
    columns: ['id', 'company_id', 'code', 'name', 'description', 'category', 'stock_unit',
              'sale_price', 'purchase_price', 'min_stock', 'max_stock', 'is_active',
              'created_at', 'updated_at'],
    removed: ['barcode'],
    note: 'barcode est dans product_variants, pas products'
  },

  product_variants: {
    columns: ['id', 'product_id', 'variant_name', 'sku', 'barcode', 'price_adjustment',
              'is_active', 'created_at', 'updated_at']
  },

  chart_of_accounts: {
    columns: ['id', 'company_id', 'account_number', 'account_name', 'account_type',
              'parent_id', 'is_active', 'created_at', 'updated_at'],
    removed: ['account_code'],
    note: 'Utiliser account_number, pas account_code'
  },

  category_account_map: {
    columns: ['id', 'company_id', 'category_id', 'account_number', 'created_at', 'updated_at'],
    removed: ['account_code']
  },

  companies: {
    columns: ['id', 'name', 'legal_name', 'siret', 'vat_number', 'owner_id', 'created_by',
              'ceo_title', 'accounting_standard', 'company_size', 'address_line1', 'address_line2',
              'city', 'postal_code', 'country', 'phone', 'email', 'website', 'fiscal_year_start',
              'default_currency', 'onboarding_completed_at', 'created_at', 'updated_at']
  },

  profiles: {
    columns: ['id', 'email', 'full_name', 'avatar_url', 'phone', 'onboarding_completed',
              'stripe_customer_id', 'created_at', 'updated_at']
  },

  user_companies: {
    columns: ['id', 'user_id', 'company_id', 'role', 'is_active', 'is_default',
              'allowed_modules', 'invited_by', 'status', 'last_activity', 'created_at', 'updated_at']
  }
};

// Patterns dangereux à chercher
// NOTE: Le pattern .eq('type' peut générer des faux positifs dans les fichiers
// qui utilisent plusieurs tables (ex: invoices + payments). La validation vérifie
// si from('invoices') existe dans le fichier, mais ne peut pas déterminer à quelle
// table appartient chaque .eq('type'. Vérifier manuellement les cas suspects.
const DANGEROUS_PATTERNS = [
  { pattern: /\.select\([^)]*inventory_categories/g, message: 'Table inventory_categories n\'existe pas' },
  { pattern: /\.eq\('account_code'/g, message: 'Utiliser account_number, pas account_code' },
  { pattern: /\.eq\('type'/g, table: 'invoices', message: 'Pour invoices, utiliser invoice_type au lieu de type dans .eq()' },
  { pattern: /products\.barcode/g, message: 'barcode est dans product_variants, pas products' },
];

// Fichiers à scanner
const SCAN_PATHS = [
  'src/services',
  'src/hooks',
  'src/components',
  'src/pages'
];

let errors = [];
let warnings = [];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.relative(process.cwd(), filePath);

  // Chercher les patterns dangereux
  DANGEROUS_PATTERNS.forEach(({ pattern, message, table }) => {
    const matches = content.match(pattern);
    if (matches) {
      // Si le pattern a une table spécifique, vérifier qu'on est bien sur cette table
      if (table && !content.includes(`from('${table}')`)) {
        return; // Skip si pas la bonne table
      }

      errors.push({
        file: fileName,
        issue: message,
        matches: matches.length,
        severity: 'ERROR'
      });
    }
  });

  // Chercher les colonnes supprimées
  Object.entries(DB_SCHEMA).forEach(([tableName, schema]) => {
    if (schema.removed) {
      schema.removed.forEach(removedCol => {
        // Pattern pour détecter l'utilisation de colonnes supprimées
        const colPattern = new RegExp(`['"]${removedCol}['"]|\\b${removedCol}\\s*:`, 'g');
        const matches = content.match(colPattern);

        if (matches && content.includes(`from('${tableName}')`)) {
          warnings.push({
            file: fileName,
            table: tableName,
            issue: `Colonne supprimée '${removedCol}' potentiellement utilisée`,
            matches: matches.length,
            severity: 'WARNING'
          });
        }
      });
    }
  });
}

function scanDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  entries.forEach(entry => {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      scanFile(fullPath);
    }
  });
}

console.log('🔍 Validation des colonnes DB...\n');

// Scanner tous les chemins
SCAN_PATHS.forEach(scanPath => {
  const fullPath = path.join(process.cwd(), scanPath);
  if (fs.existsSync(fullPath)) {
    console.log(`Scanning ${scanPath}...`);
    scanDirectory(fullPath);
  }
});

// Afficher les résultats
console.log('\n' + '='.repeat(80));
console.log('RAPPORT DE VALIDATION');
console.log('='.repeat(80) + '\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ Aucun problème détecté ! Toutes les colonnes DB sont correctes.\n');
  process.exit(0);
}

if (errors.length > 0) {
  console.log(`❌ ERREURS CRITIQUES (${errors.length}):\n`);
  errors.forEach((error, idx) => {
    console.log(`${idx + 1}. ${error.file}`);
    console.log(`   ${error.issue}`);
    console.log(`   Occurrences: ${error.matches}\n`);
  });
}

if (warnings.length > 0) {
  console.log(`⚠️  AVERTISSEMENTS (${warnings.length}):\n`);
  warnings.forEach((warning, idx) => {
    console.log(`${idx + 1}. ${warning.file}`);
    console.log(`   Table: ${warning.table}`);
    console.log(`   ${warning.issue}`);
    console.log(`   Occurrences: ${warning.matches}\n`);
  });
}

console.log('='.repeat(80));
console.log('\n📋 SCHÉMA DE RÉFÉRENCE:\n');

Object.entries(DB_SCHEMA).forEach(([table, schema]) => {
  console.log(`${table}:`);
  console.log(`  Colonnes valides: ${schema.columns.join(', ')}`);
  if (schema.removed) {
    console.log(`  ❌ Colonnes supprimées: ${schema.removed.join(', ')}`);
  }
  if (schema.note) {
    console.log(`  ℹ️  ${schema.note}`);
  }
  console.log('');
});

process.exit(errors.length > 0 ? 1 : 0);
