#!/usr/bin/env node

/**
 * Script pour l'expiration automatique des essais
 *
 * Ce script peut être exécuté :
 * - Manuellement : node scripts/expire-trials.js
 * - Via cron job : 0 * * * * /usr/bin/node /path/to/scripts/expire-trials.js
 * - Via GitHub Actions ou autre CI/CD
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Créer le client Supabase avec la clé de service
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function expireTrials() {
  console.log('🔄 Vérification des essais expirés...');

  try {
    // Appeler la fonction pour expirer les essais
    const { data, error } = await supabase.rpc('expire_trials');

    if (error) {
      console.error('❌ Erreur lors de l\'expiration des essais:', error);
      return;
    }

    const expiredCount = data || 0;

    if (expiredCount > 0) {
      console.log(`✅ ${expiredCount} essai(s) expiré(s) avec succès`);

      // Récupérer les détails des essais expirés pour le logging
      const { data: expiredTrials } = await supabase
        .from('user_subscriptions')
        .select('user_id, trial_end')
        .eq('status', 'canceled')
        .eq('plan_id', 'trial')
        .gte('updated_at', new Date(Date.now() - 60000).toISOString()); // Dernière minute

      if (expiredTrials) {
        console.log('📋 Essais expirés:');
        expiredTrials.forEach(trial => {
          console.log(`   - User ${trial.user_id}: expiré le ${new Date(trial.trial_end).toLocaleDateString('fr-FR')}`);
        });
      }
    } else {
      console.log('ℹ️ Aucun essai à expirer');
    }

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

async function getTrialStatistics() {
  console.log('\n📊 Statistiques des essais:');

  try {
    const { data, error } = await supabase.rpc('get_trial_statistics');

    if (error) {
      console.error('❌ Erreur lors de la récupération des statistiques:', error);
      return;
    }

    if (data) {
      data.forEach(stat => {
        console.log(`   ${stat.metric}: ${stat.value}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur inattendue lors des statistiques:', error);
  }
}

async function getExpiringTrials() {
  console.log('\n⏰ Essais expirant bientôt (7 jours):');

  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        user_id,
        trial_end,
        subscription_plans (
          name
        )
      `)
      .eq('status', 'trialing')
      .eq('plan_id', 'trial')
      .gte('trial_end', new Date().toISOString())
      .lte('trial_end', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('trial_end', { ascending: true });

    if (error) {
      console.error('❌ Erreur lors de la récupération des essais expirants:', error);
      return;
    }

    if (data && data.length > 0) {
      data.forEach(trial => {
        const trialEnd = new Date(trial.trial_end);
        const daysRemaining = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        console.log(`   - User ${trial.user_id}: ${daysRemaining} jour(s) restant(s)`);
      });
    } else {
      console.log('   Aucun essai n\'expire dans les 7 prochains jours');
    }

  } catch (error) {
    console.error('❌ Erreur inattendue lors des essais expirants:', error);
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Démarrage du script d\'expiration des essais');
  console.log('⏰', new Date().toLocaleString('fr-FR'));

  await expireTrials();
  await getTrialStatistics();
  await getExpiringTrials();

  console.log('\n✅ Script terminé avec succès');
}

// Exécuter le script
main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});