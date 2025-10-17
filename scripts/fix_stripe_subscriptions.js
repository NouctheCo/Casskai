#!/usr/bin/env node

/**
 * Script de diagnostic et réparation du système d'abonnements Stripe
 * Exécute le script SQL fix_stripe_subscriptions.sql dans Supabase
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement depuis .env.local et supabase/.env
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', 'supabase', '.env') });

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Vérification des variables d\'environnement:');
console.log('   VITE_SUPABASE_URL:', supabaseUrl ? '✅ Présent' : '❌ Manquant');
console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Présent' : '❌ Manquant');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables d\'environnement manquantes:');
    console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
    console.error('\nVérifiez vos fichiers .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkTablesAndFunctions() {
    try {
        console.log('� Vérification des tables et fonctions...\n');

        // Test 1: Vérifier les tables via une requête simple
        console.log('1. Test des tables subscriptions et subscription_plans...');
        const { error: subscriptionsError } = await supabase
            .from('subscriptions')
            .select('count', { count: 'exact', head: true });

        if (subscriptionsError) {
            console.error('❌ Table subscriptions inaccessible:', subscriptionsError.message);
            return false;
        }
        console.log('✅ Table subscriptions accessible');

        const { error: plansError } = await supabase
            .from('subscription_plans')
            .select('count', { count: 'exact', head: true });

        if (plansError) {
            console.error('❌ Table subscription_plans inaccessible:', plansError.message);
            return false;
        }
        console.log('✅ Table subscription_plans accessible');

        // Test 2: Vérifier les fonctions RPC
        console.log('\n2. Test des fonctions RPC...');
        const { error: rpcError } = await supabase.rpc('get_user_subscription_status', {
            p_user_id: '00000000-0000-0000-0000-000000000000'
        });

        if (rpcError && !rpcError.message.includes('No rows found')) {
            console.error('❌ Fonction get_user_subscription_status inaccessible:', rpcError.message);
            return false;
        }
        console.log('✅ Fonction get_user_subscription_status accessible');

        // Test 3: Vérifier les données des plans
        console.log('\n3. Vérification des données des plans...');
        const { data: plans, error: plansFetchError } = await supabase
            .from('subscription_plans')
            .select('id, name, price, is_active')
            .eq('is_active', true);

        if (plansFetchError) {
            console.error('❌ Impossible de récupérer les plans:', plansFetchError.message);
            return false;
        }

        if (plans.length === 0) {
            console.error('❌ Aucun plan actif trouvé');
            return false;
        }

        console.log('✅ Plans actifs trouvés:');
        plans.forEach(plan => {
            console.log(`   - ${plan.name} (${plan.id}): ${plan.price}€`);
        });

        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error.message);
        return false;
    }
}

async function main() {
    console.log('🔧 Diagnostic du système d\'abonnements Stripe\n');

    const success = await checkTablesAndFunctions();

    if (success) {
        console.log('\n🎉 Le système d\'abonnements Stripe est opérationnel!');
        console.log('\n📋 Prochaines étapes:');
        console.log('   1. Testez le composant StripeIntegrationTest');
        console.log('   2. Vérifiez que les abonnements peuvent être récupérés');
        console.log('   3. Si le problème persiste, vérifiez les migrations Supabase');
    } else {
        console.log('\n❌ Problème détecté dans le système d\'abonnements');
        console.log('\n🔧 Solutions possibles:');
        console.log('   1. Appliquez les migrations Supabase manuellement:');
        console.log('      supabase db reset');
        console.log('   2. Ou exécutez le script SQL fix_stripe_subscriptions.sql');
        console.log('      dans l\'éditeur SQL de Supabase');
        console.log('   3. Vérifiez les permissions RLS sur les tables');
    }
}

// Démarrer automatiquement si c'est le module principal
console.log('🚀 Démarrage du script de diagnostic Stripe...\n');
main().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});

export { checkTablesAndFunctions };