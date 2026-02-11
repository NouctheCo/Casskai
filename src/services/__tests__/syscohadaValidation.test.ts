/**
 * Tests de validation SYSCOHADA
 * Vérifie la conformité comptable OHADA (17 pays africains)
 *
 * @module syscohadaValidation.test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { syscohadaValidationService } from '../syscohadaValidationService';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Integration tests requiring a real Supabase connection with auth
// Run with: RUN_INTEGRATION_TESTS=true npx vitest run syscohadaValidation
const runIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';

describe.skipIf(!runIntegration)('SYSCOHADA Validation Service', () => {
  let testCompanyId: string;
  let testJournalId: string;

  beforeAll(async () => {
    // Créer entreprise de test SYSCOHADA
    testCompanyId = uuidv4();

    const { error: companyError } = await supabase
      .from('companies')
      .insert({
        id: testCompanyId,
        name: 'Test Company SYSCOHADA',
        accounting_standard: 'SYSCOHADA',
        fiscal_year_start: '01-01',
        fiscal_year_end: '12-31',
        currency: 'XOF' // Franc CFA (OHADA)
      });

    if (companyError) {
      console.warn('Skipping SYSCOHADA tests: no Supabase connection', companyError.message);
      return;
    }

    // Créer journal de test
    const { data: journal, error: journalError } = await supabase
      .from('journals')
      .insert({
        company_id: testCompanyId,
        code: 'OD',
        name: 'Opérations Diverses',
        type: 'general'
      })
      .select()
      .single();

    if (journalError || !journal) {
      console.warn('Skipping SYSCOHADA tests: journal creation failed', journalError?.message);
      return;
    }
    testJournalId = journal.id;
  });

  afterAll(async () => {
    // Nettoyage
    await supabase
      .from('companies')
      .delete()
      .eq('id', testCompanyId);
  });

  describe('validateChartOfAccounts', () => {
    it('doit valider un plan comptable SYSCOHADA correct (8 classes)', async () => {
      // Créer plan comptable SYSCOHADA valide
      const syscohadaAccounts = [
        // Classe 1: Ressources durables
        { account_number: '101000', account_name: 'Capital social', account_type: 'capitaux_propres' },
        { account_number: '121000', account_name: 'Résultat de l\'exercice', account_type: 'capitaux_propres' },

        // Classe 2: Actif immobilisé
        { account_number: '211000', account_name: 'Terrains', account_type: 'actif' },
        { account_number: '241000', account_name: 'Matériel', account_type: 'actif' },

        // Classe 3: Stocks (optionnel mais bon à tester)
        { account_number: '311000', account_name: 'Marchandises', account_type: 'actif' },

        // Classe 4: Tiers
        { account_number: '401000', account_name: 'Fournisseurs', account_type: 'passif' },
        { account_number: '411000', account_name: 'Clients', account_type: 'actif' },

        // Classe 5: Trésorerie
        { account_number: '521000', account_name: 'Banques', account_type: 'actif' },
        { account_number: '571000', account_name: 'Caisse', account_type: 'actif' },

        // Classe 6: Charges activités ordinaires
        { account_number: '601000', account_name: 'Achats de marchandises', account_type: 'charge' },
        { account_number: '661000', account_name: 'Charges financières', account_type: 'charge' },

        // Classe 7: Produits activités ordinaires
        { account_number: '701000', account_name: 'Ventes de marchandises', account_type: 'produit' },
        { account_number: '771000', account_name: 'Produits financiers', account_type: 'produit' },

        // Classe 8: HAO (Hors Activités Ordinaires)
        { account_number: '811000', account_name: 'Charges HAO', account_type: 'charge' },
        { account_number: '821000', account_name: 'Produits HAO', account_type: 'produit' }
      ];

      // Insérer les comptes
      await supabase
        .from('accounts')
        .insert(
          syscohadaAccounts.map(acc => ({
            company_id: testCompanyId,
            ...acc,
            is_active: true
          }))
        );

      // Valider
      const errors = await syscohadaValidationService.validateChartOfAccounts(testCompanyId);

      console.log('📊 Validation plan comptable SYSCOHADA:');
      console.log(`   Comptes créés: ${syscohadaAccounts.length}`);
      console.log(`   Erreurs détectées: ${errors.length}`);

      if (errors.length > 0) {
        console.log('   ⚠️ Erreurs:', errors);
      } else {
        console.log('   ✅ Plan comptable SYSCOHADA valide (8 classes)');
      }

      expect(errors.length).toBe(0);
    });

    it('doit détecter un compte invalide (classe 9 non autorisée)', async () => {
      // Créer compte invalide (classe 9 n'existe pas en SYSCOHADA)
      await supabase
        .from('accounts')
        .insert({
          company_id: testCompanyId,
          account_number: '901000',
          account_name: 'Compte invalide classe 9',
          account_type: 'charge',
          is_active: true
        });

      const errors = await syscohadaValidationService.validateChartOfAccounts(testCompanyId);

      console.log('📊 Détection compte classe 9 invalide:');
      console.log(`   Erreurs détectées: ${errors.length}`);

      const classe9Error = errors.find(e =>
        e.message.includes('901000') && e.message.includes('doit commencer par 1-8')
      );

      expect(classe9Error).toBeDefined();
      expect(classe9Error?.severity).toBe('error');
      console.log('   ✅ Erreur détectée: Classe 9 rejetée');
    });
  });

  describe('validateMandatoryAccounts', () => {
    it('doit vérifier la présence des 8 comptes obligatoires SYSCOHADA', async () => {
      // Les comptes ont déjà été créés dans le test précédent
      const errors = await syscohadaValidationService.validateMandatoryAccounts(testCompanyId);

      console.log('📊 Validation comptes obligatoires:');
      console.log(`   Erreurs détectées: ${errors.length}`);

      if (errors.length > 0) {
        console.log('   ⚠️ Comptes manquants:', errors.map(e => e.message));
      } else {
        console.log('   ✅ Tous les comptes obligatoires présents (101000, 121000, 401000, 411000, 521000, 571000, 601000, 701000)');
      }

      expect(errors.length).toBe(0);
    });

    it('doit détecter l\'absence du compte Capital (101000)', async () => {
      // Supprimer le compte Capital
      await supabase
        .from('accounts')
        .delete()
        .eq('company_id', testCompanyId)
        .eq('account_number', '101000');

      const errors = await syscohadaValidationService.validateMandatoryAccounts(testCompanyId);

      console.log('📊 Détection compte Capital manquant:');
      console.log(`   Erreurs détectées: ${errors.length}`);

      const capitalError = errors.find(e => e.message.includes('101000'));

      expect(capitalError).toBeDefined();
      expect(capitalError?.severity).toBe('error');
      console.log('   ✅ Erreur détectée: Compte 101000 (Capital) manquant');

      // Recréer pour les tests suivants
      await supabase
        .from('accounts')
        .insert({
          company_id: testCompanyId,
          account_number: '101000',
          account_name: 'Capital social',
          account_type: 'capitaux_propres',
          is_active: true
        });
    });
  });

  describe('validateHAO', () => {
    it('doit valider une transaction HAO correctement classée (classe 8)', async () => {
      const currentYear = new Date().getFullYear();

      // Créer écriture HAO valide (cession d'actif)
      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          company_id: testCompanyId,
          journal_id: testJournalId,
          entry_date: `${currentYear}-06-15`,
          entry_number: 'HAO-2024-001',
          description: 'Cession exceptionnelle d\'un véhicule', // Mot-clé HAO
          status: 'validated'
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Lignes HAO (classe 8)
      await supabase
        .from('journal_entry_lines')
        .insert([
          {
            journal_entry_id: entry.id,
            account_number: '521000', // Banque (encaissement)
            debit_amount: 500000, // 500k FCFA
            credit_amount: 0,
            description: 'Encaissement cession véhicule'
          },
          {
            journal_entry_id: entry.id,
            account_number: '821000', // Produit HAO (classe 8)
            debit_amount: 0,
            credit_amount: 500000,
            description: 'Plus-value sur cession'
          }
        ]);

      const errors = await syscohadaValidationService.validateHAO(testCompanyId, currentYear);

      console.log('📊 Validation transaction HAO (classe 8):');
      console.log(`   Description: "Cession exceptionnelle d\'un véhicule"`);
      console.log(`   Comptes utilisés: 521000 (Banque) + 821000 (Produit HAO)`);
      console.log(`   Erreurs détectées: ${errors.length}`);

      if (errors.length > 0) {
        console.log('   ⚠️ Erreurs:', errors);
      } else {
        console.log('   ✅ Transaction HAO correctement classée en classe 8');
      }

      expect(errors.length).toBe(0);
    });

    it('doit détecter une transaction HAO mal classée (pas en classe 8)', async () => {
      const currentYear = new Date().getFullYear();

      // Créer écriture HAO INVALIDE (utilise classe 7 au lieu de 8)
      const { data: badEntry, error: badEntryError } = await supabase
        .from('journal_entries')
        .insert({
          company_id: testCompanyId,
          journal_id: testJournalId,
          entry_date: `${currentYear}-07-20`,
          entry_number: 'HAO-2024-002',
          description: 'Plus-value exceptionnelle sur cession', // Mot-clé HAO
          status: 'validated'
        })
        .select()
        .single();

      if (badEntryError) throw badEntryError;

      // Lignes INCORRECTES (utilise 701000 au lieu de 821000)
      await supabase
        .from('journal_entry_lines')
        .insert([
          {
            journal_entry_id: badEntry.id,
            account_number: '521000',
            debit_amount: 300000,
            credit_amount: 0,
            description: 'Encaissement'
          },
          {
            journal_entry_id: badEntry.id,
            account_number: '701000', // ❌ Classe 7 (activité ordinaire) au lieu de 821000 (HAO)
            debit_amount: 0,
            credit_amount: 300000,
            description: 'Plus-value (MAL CLASSÉE)'
          }
        ]);

      const errors = await syscohadaValidationService.validateHAO(testCompanyId, currentYear);

      console.log('📊 Détection transaction HAO mal classée:');
      console.log(`   Description: "Plus-value exceptionnelle sur cession"`);
      console.log(`   Compte utilisé: 701000 (❌ Classe 7 au lieu de Classe 8)`);
      console.log(`   Erreurs détectées: ${errors.length}`);

      const haoError = errors.find(e =>
        e.message.includes('HAO-2024-002') &&
        e.message.includes('classe 8')
      );

      expect(haoError).toBeDefined();
      expect(haoError?.severity).toBe('error');
      console.log(`   ✅ Erreur détectée: ${haoError?.message}`);
    });
  });

  describe('validateBalances', () => {
    it('doit valider une balance équilibrée (Débit = Crédit)', async () => {
      const currentYear = new Date().getFullYear();

      // Créer écriture équilibrée
      const { data: balancedEntry, error: balancedError } = await supabase
        .from('journal_entries')
        .insert({
          company_id: testCompanyId,
          journal_id: testJournalId,
          entry_date: `${currentYear}-08-10`,
          entry_number: 'OD-2024-001',
          description: 'Achat fournitures équilibré',
          status: 'validated'
        })
        .select()
        .single();

      if (balancedError) throw balancedError;

      await supabase
        .from('journal_entry_lines')
        .insert([
          {
            journal_entry_id: balancedEntry.id,
            account_number: '601000', // Achats
            debit_amount: 150000,
            credit_amount: 0,
            description: 'Achats fournitures'
          },
          {
            journal_entry_id: balancedEntry.id,
            account_number: '401000', // Fournisseurs
            debit_amount: 0,
            credit_amount: 150000,
            description: 'Dette fournisseur'
          }
        ]);

      const errors = await syscohadaValidationService.validateBalances(testCompanyId, currentYear);

      console.log('📊 Validation balance équilibrée:');
      console.log(`   Débit: 150 000 FCFA | Crédit: 150 000 FCFA`);
      console.log(`   Erreurs détectées: ${errors.length}`);

      if (errors.length > 0) {
        console.log('   ⚠️ Erreurs:', errors);
      } else {
        console.log('   ✅ Balance équilibrée (Débit = Crédit)');
      }

      expect(errors.length).toBe(0);
    });

    it('doit détecter une balance déséquilibrée (Débit ≠ Crédit)', async () => {
      const currentYear = new Date().getFullYear();

      // Créer écriture DÉSÉQUILIBRÉE
      const { data: unbalancedEntry, error: unbalancedError } = await supabase
        .from('journal_entries')
        .insert({
          company_id: testCompanyId,
          journal_id: testJournalId,
          entry_date: `${currentYear}-09-15`,
          entry_number: 'OD-2024-BAD',
          description: 'Écriture déséquilibrée (test)',
          status: 'validated'
        })
        .select()
        .single();

      if (unbalancedError) throw unbalancedError;

      // Lignes DÉSÉQUILIBRÉES
      await supabase
        .from('journal_entry_lines')
        .insert([
          {
            journal_entry_id: unbalancedEntry.id,
            account_number: '601000',
            debit_amount: 200000, // 200k
            credit_amount: 0,
            description: 'Débit'
          },
          {
            journal_entry_id: unbalancedEntry.id,
            account_number: '401000',
            debit_amount: 0,
            credit_amount: 150000, // ❌ 150k (déséquilibre de 50k)
            description: 'Crédit'
          }
        ]);

      const errors = await syscohadaValidationService.validateBalances(testCompanyId, currentYear);

      console.log('📊 Détection balance déséquilibrée:');
      console.log(`   Débit: 200 000 FCFA | Crédit: 150 000 FCFA`);
      console.log(`   Déséquilibre: 50 000 FCFA`);
      console.log(`   Erreurs détectées: ${errors.length}`);

      const balanceError = errors.find(e =>
        e.message.includes('Balance non équilibrée')
      );

      expect(balanceError).toBeDefined();
      expect(balanceError?.severity).toBe('error');
      console.log(`   ✅ Erreur détectée: ${balanceError?.message}`);
    });
  });

  describe('validateTAFIRE', () => {
    it('doit valider la cohérence du TAFIRE (flux de trésorerie)', async () => {
      const currentYear = new Date().getFullYear();

      // === CONFIGURATION INITIALE ===
      // Trésorerie début d'exercice: 1 000 000 FCFA (Banque)
      const { data: tresoDebutEntry } = await supabase
        .from('journal_entries')
        .insert({
          company_id: testCompanyId,
          journal_id: testJournalId,
          entry_date: `${currentYear}-01-01`,
          entry_number: 'OD-DEBUT',
          description: 'Trésorerie ouverture',
          status: 'validated'
        })
        .select()
        .single();

      await supabase
        .from('journal_entry_lines')
        .insert([
          {
            journal_entry_id: tresoDebutEntry!.id,
            account_number: '521000', // Banque
            debit_amount: 1000000,
            credit_amount: 0
          },
          {
            journal_entry_id: tresoDebutEntry!.id,
            account_number: '101000', // Capital
            debit_amount: 0,
            credit_amount: 1000000
          }
        ]);

      // === FLUX EXPLOITATION ===
      // Vente client: +500 000 FCFA
      const { data: venteEntry } = await supabase
        .from('journal_entries')
        .insert({
          company_id: testCompanyId,
          journal_id: testJournalId,
          entry_date: `${currentYear}-06-01`,
          entry_number: 'VT-001',
          description: 'Vente marchandises',
          status: 'validated'
        })
        .select()
        .single();

      await supabase
        .from('journal_entry_lines')
        .insert([
          {
            journal_entry_id: venteEntry!.id,
            account_number: '521000', // Banque
            debit_amount: 500000,
            credit_amount: 0
          },
          {
            journal_entry_id: venteEntry!.id,
            account_number: '701000', // Ventes
            debit_amount: 0,
            credit_amount: 500000
          }
        ]);

      // Achat fournisseur: -300 000 FCFA
      const { data: achatEntry } = await supabase
        .from('journal_entries')
        .insert({
          company_id: testCompanyId,
          journal_id: testJournalId,
          entry_date: `${currentYear}-06-15`,
          entry_number: 'AC-001',
          description: 'Achat marchandises',
          status: 'validated'
        })
        .select()
        .single();

      await supabase
        .from('journal_entry_lines')
        .insert([
          {
            journal_entry_id: achatEntry!.id,
            account_number: '601000', // Achats
            debit_amount: 300000,
            credit_amount: 0
          },
          {
            journal_entry_id: achatEntry!.id,
            account_number: '521000', // Banque
            debit_amount: 0,
            credit_amount: 300000
          }
        ]);

      // Flux Exploitation = +500k - 300k = +200k

      // === FLUX INVESTISSEMENT ===
      // Achat matériel: -250 000 FCFA
      const { data: investEntry } = await supabase
        .from('journal_entries')
        .insert({
          company_id: testCompanyId,
          journal_id: testJournalId,
          entry_date: `${currentYear}-07-01`,
          entry_number: 'INV-001',
          description: 'Achat matériel informatique',
          status: 'validated'
        })
        .select()
        .single();

      await supabase
        .from('journal_entry_lines')
        .insert([
          {
            journal_entry_id: investEntry!.id,
            account_number: '241000', // Matériel
            debit_amount: 250000,
            credit_amount: 0
          },
          {
            journal_entry_id: investEntry!.id,
            account_number: '521000', // Banque
            debit_amount: 0,
            credit_amount: 250000
          }
        ]);

      // Flux Investissement = -250k

      // === FLUX FINANCEMENT ===
      // Emprunt bancaire: +400 000 FCFA
      const { data: empruntEntry } = await supabase
        .from('journal_entries')
        .insert({
          company_id: testCompanyId,
          journal_id: testJournalId,
          entry_date: `${currentYear}-08-01`,
          entry_number: 'FIN-001',
          description: 'Emprunt bancaire',
          status: 'validated'
        })
        .select()
        .single();

      await supabase
        .from('journal_entry_lines')
        .insert([
          {
            journal_entry_id: empruntEntry!.id,
            account_number: '521000', // Banque
            debit_amount: 400000,
            credit_amount: 0
          },
          {
            journal_entry_id: empruntEntry!.id,
            account_number: '161000', // Emprunts
            debit_amount: 0,
            credit_amount: 400000
          }
        ]);

      // Flux Financement = +400k

      // === VALIDATION TAFIRE ===
      // Trésorerie Fin = Trésorerie Début + Flux Exploitation + Flux Investissement + Flux Financement
      // Trésorerie Fin = 1 000 000 + 200 000 - 250 000 + 400 000 = 1 350 000 FCFA

      const errors = await syscohadaValidationService.validateTAFIRE(testCompanyId, currentYear);

      console.log('📊 Validation TAFIRE (Tableau Financier):');
      console.log(`   Trésorerie début: 1 000 000 FCFA`);
      console.log(`   + Flux Exploitation: +200 000 FCFA`);
      console.log(`   + Flux Investissement: -250 000 FCFA`);
      console.log(`   + Flux Financement: +400 000 FCFA`);
      console.log(`   = Trésorerie fin: 1 350 000 FCFA (attendu)`);
      console.log(`   Erreurs détectées: ${errors.length}`);

      if (errors.length > 0) {
        console.log('   ⚠️ Erreurs:', errors);
      } else {
        console.log('   ✅ TAFIRE cohérent (équation flux vérifiée)');
      }

      expect(errors.length).toBe(0);
    });
  });

  describe('validateCompany - Validation complète', () => {
    it('doit exécuter une validation complète SYSCOHADA', async () => {
      const currentYear = new Date().getFullYear();

      const result = await syscohadaValidationService.validateCompany(testCompanyId, currentYear);

      console.log('\n📊 VALIDATION COMPLÈTE SYSCOHADA:');
      console.log('='.repeat(60));
      console.log(`   Statut: ${result.is_valid ? '✅ VALIDE' : '❌ INVALIDE'}`);
      console.log(`   Score de conformité: ${result.compliance_score}%`);
      console.log(`   Erreurs: ${result.total_errors}`);
      console.log(`   Avertissements: ${result.total_warnings}`);
      console.log(`   Date validation: ${result.validated_at}`);
      console.log('='.repeat(60));

      if (result.errors.length > 0) {
        console.log('\n   📋 Détail des erreurs et avertissements:');
        result.errors.forEach((err, i) => {
          const icon = err.severity === 'error' ? '❌' : '⚠️';
          console.log(`   ${icon} [${err.code}] ${err.message}`);
          if (err.affected_account) {
            console.log(`      → Compte: ${err.affected_account}`);
          }
          if (err.suggestion) {
            console.log(`      💡 Suggestion: ${err.suggestion}`);
          }
        });
      }

      // Vérifier que le résultat contient toutes les propriétés attendues
      expect(result).toHaveProperty('is_valid');
      expect(result).toHaveProperty('total_errors');
      expect(result).toHaveProperty('total_warnings');
      expect(result).toHaveProperty('compliance_score');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('validated_at');
      expect(result.compliance_score).toBeGreaterThanOrEqual(0);
      expect(result.compliance_score).toBeLessThanOrEqual(100);

      console.log('\n   ✅ Validation complète SYSCOHADA exécutée avec succès');
    });
  });
});
