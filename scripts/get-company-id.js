#!/usr/bin/env node

/**
 * Récupère un ID d'entreprise valide pour les tests
 */

import { createClient } from '@supabase/supabase-js';

// Configuration production
const SUPABASE_URL = 'https://smtdtgrymuzwvctattmx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzYwMjMsImV4cCI6MjA3MDE1MjAyM30.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getCompanyId() {
    console.log('🔍 Recherche d\'un ID d\'entreprise valide...');

    try {
        // Récupérer la première entreprise disponible
        const { data: companies, error } = await supabase
            .from('companies')
            .select('id, name')
            .limit(5);

        if (error) {
            console.log('❌ Erreur:', error.message);
            return;
        }

        if (!companies || companies.length === 0) {
            console.log('⚠️  Aucune entreprise trouvée dans la base de données.');
            console.log('   Vous devez d\'abord créer une entreprise via l\'onboarding.');
            return;
        }

        console.log('✅ Entreprises trouvées:');
        companies.forEach((company, index) => {
            console.log(`   ${index + 1}. ${company.name} (ID: ${company.id})`);
        });

        return companies[0].id;

    } catch (error) {
        console.error('❌ Erreur générale:', error);
    }
}

const companyId = await getCompanyId();
if (companyId) {
    console.log(`\n🎯 ID d'entreprise à utiliser: ${companyId}`);
    console.log('   Utilisez cet ID dans le script test-dashboard-functions.js');
}