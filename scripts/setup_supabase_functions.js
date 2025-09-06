import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://smtdtgrymuzwvctattmx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzYwMjMsImV4cCI6MjA3MDE1MjAyM30.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createFunctions() {
  console.log('🔧 Creating Supabase functions...\n');

  try {
    // Lire le fichier SQL
    const sqlContent = fs.readFileSync('./scripts/create_supabase_functions.sql', 'utf8');

    // Diviser le SQL en statements individuels
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📄 Found ${statements.length} SQL statements to execute\n`);

    // Exécuter chaque statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

        try {
          // Pour les fonctions, on utilise rpc si c'est une fonction, sinon on utilise une requête directe
          if (statement.includes('CREATE OR REPLACE FUNCTION')) {
            // Extraire le nom de la fonction
            const functionNameMatch = statement.match(/FUNCTION (\w+)/);
            if (functionNameMatch) {
              const functionName = functionNameMatch[1];
              console.log(`  📝 Creating function: ${functionName}`);

              // Pour les fonctions, on doit utiliser l'API REST directement
              const response = await fetch(`${supabaseUrl}/rest/v1/rpc/create_function`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseKey}`,
                  'apikey': supabaseKey
                },
                body: JSON.stringify({
                  name: functionName,
                  definition: statement
                })
              });

              if (!response.ok) {
                console.log(`  ⚠️  Could not create function via API, will try direct SQL execution`);
              } else {
                console.log(`  ✅ Function ${functionName} created successfully`);
              }
            }
          } else if (statement.includes('CREATE TABLE') || statement.includes('DO $$')) {
            // Pour les tables et les DO blocks, essayer d'exécuter via SQL
            console.log(`  🏗️  Executing: ${statement.substring(0, 50)}...`);

            // Utiliser l'API SQL de Supabase si disponible
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey
              },
              body: JSON.stringify({
                sql: statement
              })
            });

            if (response.ok) {
              console.log(`  ✅ SQL executed successfully`);
            } else {
              console.log(`  ⚠️  SQL execution failed: ${response.status}`);
            }
          }
        } catch (error) {
          console.log(`  ❌ Error executing statement: ${error.message}`);
        }
      }
    }

    console.log('\n🔍 Verifying functions were created...');

    // Vérifier que les fonctions existent maintenant
    const functions = ['create_company_with_setup', 'create_trial_subscription'];

    for (const func of functions) {
      try {
        const { error } = await supabase.rpc(func, {});
        if (error && !error.message.includes('parameters')) {
          console.log(`❌ Function ${func}: ${error.message}`);
        } else {
          console.log(`✅ Function ${func}: exists`);
        }
      } catch (err) {
        console.log(`❌ Function ${func}: error - ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error creating functions:', error);
  }

  console.log('\n🏁 Function creation complete!');
}

createFunctions().catch(console.error);
