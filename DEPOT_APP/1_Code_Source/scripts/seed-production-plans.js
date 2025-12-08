#!/usr/bin/env node

/**
 * Script pour ajouter les plans d'abonnement en production
 */

import { createClient } from '@supabase/supabase-js';

// Configuration production
const SUPABASE_URL = 'https://smtdtgrymuzwvctattmx.supabase.co';
// Service role key pour pouvoir bypasser RLS
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU3NjAyMywiZXhwIjoyMDcwMTUyMDIzfQ.q9t74EDnSPRc-m-hGCJNON3rN0YjB9y1D9UOdKdjOA8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const plans = [
    {
        id: 'trial',
        name: 'Essai Gratuit',
        description: 'Essai gratuit de 30 jours avec accès à tous les modules',
        price: 0,
        interval_type: 'month',
        stripe_price_id: null,
        features: {
            modules: 'all',
            users: 1,
            companies: 1,
            support: 'basic'
        },
        is_active: true
    },
    {
        id: 'starter_monthly',
        name: 'Starter Mensuel',
        description: 'Plan de démarrage avec les fonctionnalités essentielles',
        price: 29,
        interval_type: 'month',
        stripe_price_id: 'price_starter_monthly',
        features: {
            modules: 9,
            users: 2,
            companies: 1,
            support: 'standard'
        },
        is_active: true
    },
    {
        id: 'starter_yearly',
        name: 'Starter Annuel',
        description: 'Plan de démarrage avec les fonctionnalités essentielles - Facturation annuelle',
        price: 290,
        interval_type: 'year',
        stripe_price_id: 'price_starter_yearly',
        features: {
            modules: 9,
            users: 2,
            companies: 1,
            support: 'standard',
            discount: '17%'
        },
        is_active: true
    },
    {
        id: 'pro_monthly',
        name: 'Pro Mensuel',
        description: 'Plan professionnel avec fonctionnalités avancées',
        price: 69,
        interval_type: 'month',
        stripe_price_id: 'price_pro_monthly',
        features: {
            modules: 13,
            users: 5,
            companies: 3,
            support: 'priority'
        },
        is_active: true
    },
    {
        id: 'pro_yearly',
        name: 'Pro Annuel',
        description: 'Plan professionnel avec fonctionnalités avancées - Facturation annuelle',
        price: 662,
        interval_type: 'year',
        stripe_price_id: 'price_pro_yearly',
        features: {
            modules: 13,
            users: 5,
            companies: 3,
            support: 'priority',
            discount: '20%'
        },
        is_active: true
    },
    {
        id: 'enterprise_monthly',
        name: 'Enterprise Mensuel',
        description: 'Plan entreprise avec toutes les fonctionnalités',
        price: 129,
        interval_type: 'month',
        stripe_price_id: 'price_enterprise_monthly',
        features: {
            modules: 17,
            users: 'unlimited',
            companies: 'unlimited',
            support: 'premium'
        },
        is_active: true
    },
    {
        id: 'enterprise_yearly',
        name: 'Enterprise Annuel',
        description: 'Plan entreprise avec toutes les fonctionnalités - Facturation annuelle',
        price: 1238,
        interval_type: 'year',
        stripe_price_id: 'price_enterprise_yearly',
        features: {
            modules: 17,
            users: 'unlimited',
            companies: 'unlimited',
            support: 'premium',
            discount: '20%'
        },
        is_active: true
    }
];

async function seedSubscriptionPlans() {
    console.log('💰 Ajout des plans d\'abonnement en production');
    console.log('===============================================');

    try {
        for (const plan of plans) {
            console.log(`📋 Ajout du plan: ${plan.name}...`);

            const { error } = await supabase
                .from('subscription_plans')
                .upsert({
                    ...plan,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (error) {
                console.log(`❌ Erreur pour ${plan.name}:`, error.message);
            } else {
                console.log(`✅ ${plan.name} ajouté avec succès`);
            }
        }

        // Vérification finale
        console.log('\n🔍 Vérification des plans ajoutés...');
        const { data: finalPlans, error: checkError } = await supabase
            .from('subscription_plans')
            .select('*')
            .order('price', { ascending: true });

        if (checkError) {
            console.log('❌ Erreur de vérification:', checkError.message);
        } else {
            console.log(`✅ ${finalPlans.length} plans total en base:`);
            finalPlans.forEach(plan => {
                console.log(`   - ${plan.name}: ${plan.price}€/${plan.interval_type}`);
            });
        }

        console.log('\n🎉 Seed des plans d\'abonnement terminé !');

    } catch (error) {
        console.error('❌ Erreur générale:', error);
    }
}

seedSubscriptionPlans().catch(console.error);