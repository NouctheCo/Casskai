#!/usr/bin/env node

/**
 * Script pour réinitialiser complètement les données utilisateur
 */

import { createClient } from '@supabase/supabase-js';

// Configuration production
const SUPABASE_URL = 'https://smtdtgrymuzwvctattmx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzYwMjMsImV4cCI6MjA3MDE1MjAyM30.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// UUID de l'utilisateur
const USER_ID = '037f1306-e41d-40e4-97ba-6d2d8d319e86';

async function resetUserData() {
    console.log('🧹 Nettoyage complet des données utilisateur');
    console.log('===========================================');
    console.log(`UUID Utilisateur: ${USER_ID}`);

    try {
        // 1. Vérifier les données actuelles
        console.log('\n🔍 État actuel des données...');

        // Entreprises
        const { data: companies } = await supabase
            .from('companies')
            .select('*');

        console.log(`📊 Entreprises trouvées: ${companies?.length || 0}`);
        companies?.forEach((c, i) => {
            console.log(`   ${i+1}. ${c.name} (owner: ${c.owner_id || 'AUCUN'})`);
        });

        // Liens user_companies
        const { data: userCompanies } = await supabase
            .from('user_companies')
            .select('*');

        console.log(`🔗 Liens user_companies: ${userCompanies?.length || 0}`);
        userCompanies?.forEach((uc, i) => {
            console.log(`   ${i+1}. User ${uc.user_id} -> Company ${uc.company_id}`);
        });

        // 2. Nettoyer Supabase
        console.log('\n🗑️ Nettoyage Supabase...');

        // Supprimer les liens user_companies
        if (userCompanies && userCompanies.length > 0) {
            const { error: deleteLinksError } = await supabase
                .from('user_companies')
                .delete()
                .neq('id', 'never-match'); // Supprimer tous

            if (deleteLinksError) {
                console.log('❌ Erreur suppression liens:', deleteLinksError.message);
            } else {
                console.log(`✅ ${userCompanies.length} liens user_companies supprimés`);
            }
        }

        // Supprimer les entreprises
        if (companies && companies.length > 0) {
            const { error: deleteCompaniesError } = await supabase
                .from('companies')
                .delete()
                .neq('id', 'never-match'); // Supprimer toutes

            if (deleteCompaniesError) {
                console.log('❌ Erreur suppression entreprises:', deleteCompaniesError.message);
            } else {
                console.log(`✅ ${companies.length} entreprises supprimées`);
            }
        }

        // 3. Nettoyer localStorage (instructions)
        console.log('\n🧹 Nettoyage du cache local requis...');
        console.log('Pour nettoyer complètement, exécutez dans la console du navigateur:');
        console.log('');
        console.log('localStorage.removeItem("casskai_enterprises");');
        console.log('localStorage.removeItem("casskai_current_enterprise");');
        console.log('localStorage.removeItem("supabase.auth.token");');
        console.log('localStorage.clear(); // ou plus radical');
        console.log('location.reload();');
        console.log('');

        // 4. Vérification finale
        console.log('\n✅ Vérification post-nettoyage...');

        const { data: finalCompanies } = await supabase
            .from('companies')
            .select('*');

        const { data: finalLinks } = await supabase
            .from('user_companies')
            .select('*');

        console.log(`📊 Entreprises restantes: ${finalCompanies?.length || 0}`);
        console.log(`🔗 Liens restants: ${finalLinks?.length || 0}`);

        if ((finalCompanies?.length || 0) === 0 && (finalLinks?.length || 0) === 0) {
            console.log('\n🎉 NETTOYAGE RÉUSSI !');
            console.log('📋 Prochaines étapes:');
            console.log('1. Nettoyer le localStorage (commandes ci-dessus)');
            console.log('2. Actualiser la page');
            console.log('3. Recommencer l\'onboarding');
        } else {
            console.log('\n⚠️  Nettoyage partiel. Quelques données persistent.');
        }

    } catch (error) {
        console.error('❌ Erreur générale:', error);
    }
}

resetUserData().catch(console.error);