import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://smtdtgrymuzwvctattmx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU3NjAyMywiZXhwIjoyMDcwMTUyMDIzfQ.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployRolesTable() {
  try {
    console.log('🚀 Déploiement de la table roles...');

    const sqlContent = fs.readFileSync('./supabase/migrations/20250905_create_roles_table.sql', 'utf8');

    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      console.error('❌ Erreur lors du déploiement:', error.message);
    } else {
      console.log('✅ Table roles déployée avec succès');
    }

    // Vérifier que la table existe
    console.log('🔍 Vérification de la table roles...');
  const { data: _data, error: checkError } = await supabase
      .from('roles')
      .select('name')
      .limit(1);

    if (checkError) {
      console.log('❌ Table roles non trouvée:', checkError.message);
    } else {
      console.log('✅ Table roles existe et est accessible');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

deployRolesTable();
