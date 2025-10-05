/**
 * Script pour exécuter la migration des nouveaux champs de la table companies
 * À exécuter une seule fois pour mettre à jour la structure de la base de données
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration Supabase (à adapter selon vos variables d'environnement)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Clé service role requise

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✓ défini' : '✗ manquant');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓ défini' : '✗ manquant');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Début de la migration des champs companies...');
    
    // Lire le fichier SQL de migration
    const migrationPath = path.join(process.cwd(), 'src/database/migrations/add_company_extended_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Fichier de migration lu:', migrationPath);
    
    // Diviser les commandes SQL (séparées par ;)
    const sqlCommands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Nombre de commandes SQL à exécuter: ${sqlCommands.length}`);
    
    // Exécuter chaque commande
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      
      // Ignorer les commentaires
      if (command.startsWith('COMMENT ON')) {
        console.log(`⏭️  Commande ${i+1}/${sqlCommands.length}: Commentaire ignoré`);
        continue;
      }
      
      try {
        console.log(`⚡ Exécution commande ${i+1}/${sqlCommands.length}...`);
        console.log(`   ${command.substring(0, 60)}${command.length > 60 ? '...' : ''}`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          // Vérifier si c'est une erreur "colonne déjà existante" (acceptable)
          if (error.message.includes('already exists') || error.message.includes('duplicate column name')) {
            console.log(`   ⚠️  Colonne déjà existante (normal) - continuer`);
          } else {
            throw error;
          }
        } else {
          console.log(`   ✅ Commande exécutée avec succès`);
        }
        
      } catch (cmdError) {
        console.error(`   ❌ Erreur lors de l'exécution de la commande ${i+1}:`, cmdError.message);
        
        // Continuer si c'est une erreur de colonne déjà existante
        if (cmdError.message.includes('already exists') || cmdError.message.includes('duplicate')) {
          console.log('   ↳ Erreur ignorée (colonne/contrainte déjà existante)');
          continue;
        } else {
          throw cmdError;
        }
      }
    }
    
    console.log('🎉 Migration terminée avec succès !');
    
    // Vérifier que quelques colonnes ont bien été ajoutées
    console.log('🔍 Vérification des nouvelles colonnes...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'companies')
      .in('column_name', ['legal_form', 'siret', 'business_sector', 'logo_url']);
    
    if (columnsError) {
      console.warn('⚠️  Impossible de vérifier les colonnes:', columnsError.message);
    } else {
      const foundColumns = columns?.map(c => c.column_name) || [];
      console.log('✅ Colonnes vérifiées:', foundColumns.join(', '));
      
      if (foundColumns.length >= 4) {
        console.log('🎯 Migration confirmée - nouvelles colonnes détectées');
      } else {
        console.warn('⚠️  Certaines colonnes semblent manquantes');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

// Fonction alternative si rpc n'est pas disponible
async function runMigrationAlternative() {
  console.log('⚠️  Méthode RPC non disponible, utilisez l\'interface Supabase');
  console.log('📋 Copiez et exécutez le contenu de ce fichier dans l\'éditeur SQL de Supabase:');
  console.log('   src/database/migrations/add_company_extended_fields.sql');
  console.log('🌐 Dashboard Supabase → SQL Editor → New query → Coller le SQL → Run');
  
  // Lire et afficher le contenu du fichier
  try {
    const migrationPath = path.join(process.cwd(), 'src/database/migrations/add_company_extended_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log(`\n${  '='.repeat(80)}`);
    console.log('CONTENU SQL À COPIER:');
    console.log('='.repeat(80));
    console.log(migrationSQL);
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Impossible de lire le fichier de migration:', error.message);
  }
}

// Exécuter la migration
console.log('🔧 Script de migration des champs companies');
console.log('📅', new Date().toLocaleString());

runMigration().catch(() => {
  console.log('\n🔄 Tentative avec méthode alternative...');
  runMigrationAlternative();
});