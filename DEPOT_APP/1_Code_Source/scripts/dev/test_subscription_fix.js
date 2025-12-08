#!/usr/bin/env node

/**
 * Test rapide de la méthode getCurrentSubscription corrigée
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: './.env.local' });
dotenv.config({ path: './supabase/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables d\'environnement manquantes');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testGetCurrentSubscription() {
    console.log('🧪 Test de getCurrentSubscription...\n');

    try {
        // Test avec un UUID fictif
        const userId = '00000000-0000-0000-0000-000000000000';

        const { data: subscription, error } = await supabase
            .from('subscriptions')
            .select(`
              id,
              user_id,
              plan_id,
              stripe_subscription_id,
              stripe_customer_id,
              status,
              current_period_start,
              current_period_end,
              cancel_at_period_end,
              canceled_at,
              trial_start,
              trial_end,
              created_at,
              updated_at,
              company_id,
              cancel_at,
              cancel_reason,
              metadata,
              subscription_plans (
                id,
                name,
                price,
                currency,
                interval_type,
                billing_period,
                is_trial,
                trial_days,
                stripe_price_id,
                is_active
              )
            `)
            .eq('user_id', userId)
            .in('status', ['active', 'trialing'])
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error('❌ Erreur SQL:', error.message);
            return false;
        }

        console.log('✅ Requête SQL exécutée avec succès');
        console.log('📊 Résultat:', subscription);

        if (subscription && subscription.length > 0) {
            console.log('🎉 Abonnement trouvé:', subscription[0]);
        } else {
            console.log('ℹ️ Aucun abonnement trouvé (normal pour un UUID fictif)');
        }

        return true;
    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
        return false;
    }
}

// Démarrage automatique
console.log('🚀 Test de la méthode getCurrentSubscription corrigée...\n');
testGetCurrentSubscription().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});