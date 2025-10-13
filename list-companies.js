import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function listAllCompanies() {
  try {
    console.log('🔍 Recherche de toutes les entreprises dans la base de données...');
    console.log('📊 Utilisation de la clé anon - seules les entreprises accessibles seront visibles');

    // Chercher toutes les entreprises (avec RLS activé)
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, created_at, country_code')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('❌ Erreur lors de la recherche d\'entreprises:', error.message);
      console.log('💡 Cela peut être dû aux permissions RLS - seules les entreprises de l\'utilisateur connecté sont visibles');
      return;
    }

    if (companies && companies.length > 0) {
      console.log(`✅ ${companies.length} entreprise(s) trouvée(s) avec la clé anon :`);
      console.log('');

      companies.forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}`);
        console.log(`   ID: ${company.id}`);
        console.log(`   Pays: ${company.country_code}`);
        console.log(`   Créée: ${new Date(company.created_at).toLocaleString('fr-FR')}`);
        console.log('');
      });

      // Vérifier si l'entreprise NOUTCHE CONSEIL2 est dans la liste
      const noutcheCompany = companies.find(c => c.name === 'NOUTCHE CONSEIL2');
      if (noutcheCompany) {
        console.log('🎯 Entreprise "NOUTCHE CONSEIL2" trouvée !');
        console.log('💡 Vous pouvez maintenant tester la fonction RPC avec cette entreprise');
        return noutcheCompany.id;
      } else {
        console.log('⚠️ Entreprise "NOUTCHE CONSEIL2" non visible avec la clé anon');
        console.log('💡 Cela signifie que vous devez être connecté avec le bon utilisateur pour y accéder');
      }
    } else {
      console.log('❌ Aucune entreprise trouvée avec la clé anon');
      console.log('💡 Vous devez être connecté dans l\'application pour voir vos entreprises');
    }

  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

listAllCompanies();