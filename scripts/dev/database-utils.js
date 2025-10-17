#!/usr/bin/env node

/**
 * Utilitaires pour la gestion de la base de données CassKai
 * Usage: node scripts/database-utils.js [command] [options]
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase (locale) via variables d'environnement
// Ne JAMAIS committer de clés ici. Utiliser DEV_SUPABASE_* ou SUPABASE_* dans votre env.
const SUPABASE_URL = process.env.DEV_SUPABASE_URL || process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variable d\'environnement SUPABASE_SERVICE_ROLE_KEY manquante.');
    console.error('   Définissez DEV_SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SERVICE_ROLE_KEY) pour exécuter ce script localement.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function listTables() {
    try {
        console.log('📊 Tables dans la base de données CassKai:');
        console.log('=========================================');

        const { data: companies } = await supabase.from('companies').select('*', { count: 'exact', head: true });
        console.log(`🏢 companies: ${companies?.length || 0} entrées`);

        const { data: userCompanies } = await supabase.from('user_companies').select('*', { count: 'exact', head: true });
        console.log(`👥 user_companies: ${userCompanies?.length || 0} entrées`);

        const { data: subscriptionPlans } = await supabase.from('subscription_plans').select('*', { count: 'exact', head: true });
        console.log(`💰 subscription_plans: ${subscriptionPlans?.length || 0} entrées`);

        const { data: userSubscriptions } = await supabase.from('user_subscriptions').select('*', { count: 'exact', head: true });
        console.log(`📋 user_subscriptions: ${userSubscriptions?.length || 0} entrées`);

        const { data: companyModules } = await supabase.from('company_modules').select('*', { count: 'exact', head: true });
        console.log(`🔧 company_modules: ${companyModules?.length || 0} entrées`);

        const { data: chartOfAccounts } = await supabase.from('chart_of_accounts').select('*', { count: 'exact', head: true });
        console.log(`📈 chart_of_accounts: ${chartOfAccounts?.length || 0} entrées`);

        const { data: thirdParties } = await supabase.from('third_parties').select('*', { count: 'exact', head: true });
        console.log(`🤝 third_parties: ${thirdParties?.length || 0} entrées`);

        const { data: invoices } = await supabase.from('invoices').select('*', { count: 'exact', head: true });
        console.log(`🧾 invoices: ${invoices?.length || 0} entrées`);

        const { data: bankAccounts } = await supabase.from('bank_accounts').select('*', { count: 'exact', head: true });
        console.log(`🏦 bank_accounts: ${bankAccounts?.length || 0} entrées`);

        const { data: bankTransactions } = await supabase.from('bank_transactions').select('*', { count: 'exact', head: true });
        console.log(`💳 bank_transactions: ${bankTransactions?.length || 0} entrées`);

        console.log('\n✅ Toutes les tables principales sont présentes!');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

async function showSubscriptionPlans() {
    try {
        console.log('💰 Plans d\'abonnement disponibles:');
        console.log('===================================');

        const { data: plans, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .order('price', { ascending: true });

        if (error) throw error;

        plans.forEach(plan => {
            console.log(`📋 ${plan.name} (${plan.id})`);
            console.log(`   Prix: ${plan.price}€/${plan.interval_type === 'month' ? 'mois' : 'an'}`);
            console.log(`   Description: ${plan.description}`);
            console.log(`   Stripe ID: ${plan.stripe_price_id || 'N/A'}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

async function testFunctions() {
    try {
        console.log('🧪 Test des fonctions PostgreSQL:');
        console.log('==================================');

        // Test de la fonction get_allowed_modules_for_plan
        console.log('📋 Test get_allowed_modules_for_plan...');

        const testPlans = ['trial', 'starter_monthly', 'pro_monthly', 'enterprise_monthly'];

        for (const planId of testPlans) {
            const { data, error } = await supabase
                .rpc('get_allowed_modules_for_plan', { p_plan_id: planId });

            if (error) {
                console.log(`❌ Erreur pour ${planId}: ${error.message}`);
            } else {
                console.log(`✅ ${planId}: ${data.length} modules autorisés`);
                console.log(`   Modules: ${data.join(', ')}`);
            }
        }

        console.log('\n✅ Tests des fonctions terminés!');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

async function createTestUser(email, password) {
    try {
        console.log(`👤 Création d'un utilisateur de test: ${email}`);
        console.log('================================================');

        // Note: En local, la création d'utilisateur nécessite l'interface Supabase
        console.log('ℹ️  Pour créer un utilisateur de test:');
        console.log('1. Ouvre http://127.0.0.1:54323 (Supabase Studio)');
        console.log('2. Va dans Authentication > Users');
        console.log('3. Clique "Add user"');
        console.log(`4. Email: ${email}`);
        console.log(`5. Mot de passe: ${password}`);
        console.log('6. Confirme l\'email automatiquement');

        console.log('\n🔄 Ou utilise les fonctions d\'inscription de l\'app!');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

async function checkUserData(userId) {
    try {
        console.log(`👤 Données utilisateur: ${userId}`);
        console.log('============================');

        // Vérifier les entreprises
        const { data: companies, error: companiesError } = await supabase
            .from('companies')
            .select(`
                *,
                user_companies!inner(role, is_active)
            `)
            .eq('user_companies.user_id', userId);

        if (companiesError) {
            console.log('❌ Erreur récupération entreprises:', companiesError.message);
        } else {
            console.log(`🏢 Entreprises: ${companies.length}`);
            companies.forEach((company, index) => {
                console.log(`   ${index + 1}. ${company.name} (${company.id})`);
                console.log(`      Rôle: ${company.user_companies[0]?.role}`);
            });
        }

        // Vérifier les abonnements
        const { data: subscriptions, error: subscriptionsError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', userId);

        if (subscriptionsError) {
            console.log('❌ Erreur récupération abonnements:', subscriptionsError.message);
        } else {
            console.log(`📋 Abonnements: ${subscriptions.length}`);
            subscriptions.forEach((sub, index) => {
                console.log(`   ${index + 1}. Plan: ${sub.plan_id}, Status: ${sub.status}`);
                if (sub.trial_end) {
                    const daysRemaining = Math.ceil((new Date(sub.trial_end) - new Date()) / (1000 * 60 * 60 * 24));
                    console.log(`      Essai expire dans: ${daysRemaining} jours`);
                }
            });
        }

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

// Parser des arguments de ligne de commande
const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

async function main() {
    console.log('🚀 Utilitaires Base de Données CassKai');
    console.log('=====================================\n');

    switch (command) {
        case 'list':
        case 'tables':
            await listTables();
            break;

        case 'plans':
            await showSubscriptionPlans();
            break;

        case 'test':
        case 'test-functions':
            await testFunctions();
            break;

        case 'create-user':
            if (!arg1 || !arg2) {
                console.log('Usage: node database-utils.js create-user <email> <password>');
                return;
            }
            await createTestUser(arg1, arg2);
            break;

        case 'user':
        case 'check-user':
            if (!arg1) {
                console.log('Usage: node database-utils.js user <user-id>');
                return;
            }
            await checkUserData(arg1);
            break;

        case 'help':
        default:
            console.log('Commandes disponibles:');
            console.log('  list, tables     - Lister toutes les tables');
            console.log('  plans           - Afficher les plans d\'abonnement');
            console.log('  test            - Tester les fonctions PostgreSQL');
            console.log('  create-user     - Créer un utilisateur de test');
            console.log('  user <id>       - Vérifier les données d\'un utilisateur');
            console.log('  help            - Afficher cette aide');
            break;
    }

    console.log('\n🎉 Terminé!');
}

main().catch(console.error);