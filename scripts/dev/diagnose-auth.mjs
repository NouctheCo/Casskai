
import 'dotenv/config';
import { supabase, getUserCompanies } from '../src/lib/supabase.js';
import readline from 'readline';

// Helper to ask questions in the console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => {
  return new Promise(resolve => {
    // Hide password input
    if (query.toLowerCase().includes('password') || query.toLowerCase().includes('mot de passe')) {
      const originalWrite = process.stdout.write;
      process.stdout.write = () => {}; // Suppress output
      rl.question(query, (answer) => {
        process.stdout.write = originalWrite;
        process.stdout.write('\n');
        resolve(answer);
      });
    } else {
      rl.question(query, resolve);
    }
  });
};

async function diagnoseAuthFlow() {
  console.log('--- Script de Diagnostic d\'Authentification ---');

  const email = await askQuestion('Entrez votre email de test: ');
  const password = await askQuestion('Entrez votre mot de passe de test: ');

  console.log(`\nTentative de connexion avec: ${email}...`);
  const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    console.error(`\n❌ ERREUR DE CONNEXION: ${signInError.message}`);
    rl.close();
    return;
  }

  if (!user) {
    console.error('\n❌ ERREUR: Connexion réussie mais aucun utilisateur retourné.');
    rl.close();
    return;
  }

  console.log(`✅ Connexion réussie. ID Utilisateur: ${user.id}`);
  console.log('Recherche des entreprises associées...');

  try {
    // We directly use the function from the library to ensure we test the exact same logic
    const companiesData = await getUserCompanies(user.id);

    if (companiesData && companiesData.length > 0) {
      console.log('\n✅ SUCCÈS: Entreprises trouvées pour cet utilisateur:');
      companiesData.forEach(userCompany => {
        if (userCompany.companies) {
          console.log(`  - Nom: ${userCompany.companies.name}, ID: ${userCompany.companies.id}`);
        } else {
          console.log(`  - Association invalide trouvée (user_companies.id: ${userCompany.id})`);
        }
      });
      console.log('\nLe parcours d\'authentification devrait fonctionner. Si le problème persiste, il est ailleurs.');
    } else {
      console.log('\n⚠️  DIAGNOSTIC CONFIRMÉ  ⚠️');
      console.log('Aucune entreprise n\'est associée à cet utilisateur dans la base de données.');
      console.log('C\'est la raison pour laquelle vous êtes redirigé vers la page d\'onboarding.');
      console.log('ACTION REQUISE: Vérifiez la table "user_companies" dans Supabase pour cet utilisateur.');
    }
  } catch (error) {
    console.error('\n❌ ERREUR CRITIQUE lors de la récupération des entreprises:', error.message);
    console.log('Cela peut être dû à un problème de permissions (Row Level Security) sur la table "user_companies".');
  } finally {
    console.log('\nDéconnexion...');
    await supabase.auth.signOut();
    console.log('Session terminée.');
    rl.close();
  }
}

diagnoseAuthFlow();
