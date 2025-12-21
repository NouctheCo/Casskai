/**
 * 🧪 Script de test pour le chiffrement AES-256-GCM
 *
 * Usage:
 * 1. Générer une clé: node --loader ts-node/esm test-encryption.ts generate
 * 2. Tester le chiffrement: node --loader ts-node/esm test-encryption.ts test
 */

import { generateEncryptionKey, encryptData, decryptData, isEncrypted } from './src/services/encryptionService';

// Données de test
const testData = {
  user_id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test.user@example.com',
  first_name: 'Jean',
  last_name: 'Dupont',
  companies: [
    {
      id: '123',
      name: 'Ma Super Entreprise',
      role: 'owner'
    }
  ],
  created_at: '2024-01-15T10:30:00Z',
  deleted_at: '2024-11-29T14:45:00Z'
};

async function testEncryption() {
  try {
    console.log('🔐 Test du chiffrement AES-256-GCM\n');

    // 1. Vérifier la clé
    console.log('📋 Étape 1: Vérification de la clé de chiffrement');
    const key = import.meta.env.VITE_ARCHIVE_ENCRYPTION_KEY;
    if (!key) {
      console.error('❌ ERREUR: VITE_ARCHIVE_ENCRYPTION_KEY non définie');
      console.log('\n💡 Solution:');
      console.log('   1. Créer un fichier .env.local');
      console.log('   2. Générer une clé avec: node --loader ts-node/esm test-encryption.ts generate');
      console.log('   3. Copier la clé dans .env.local\n');
      return;
    }
    console.log('✅ Clé trouvée:', key.substring(0, 16) + '...' + key.substring(48, 64));
    console.log('✅ Longueur:', key.length, 'caractères (64 attendu)\n');

    // 2. Test de chiffrement
    console.log('📋 Étape 2: Chiffrement des données');
    console.log('Données originales:', JSON.stringify(testData, null, 2));

    const encrypted = await encryptData(testData);
    console.log('\n✅ Données chiffrées:', encrypted.substring(0, 50) + '...');
    console.log('✅ Longueur:', encrypted.length, 'caractères');
    console.log('✅ Format valide:', isEncrypted(encrypted) ? 'OUI' : 'NON\n');

    // 3. Test de déchiffrement
    console.log('\n📋 Étape 3: Déchiffrement des données');
    const decrypted = await decryptData(encrypted);
    console.log('✅ Données déchiffrées:', JSON.stringify(decrypted, null, 2));

    // 4. Vérification de l'intégrité
    console.log('\n📋 Étape 4: Vérification de l\'intégrité');
    const isIdentical = JSON.stringify(testData) === JSON.stringify(decrypted);
    console.log('✅ Données identiques:', isIdentical ? 'OUI' : 'NON');

    if (!isIdentical) {
      console.error('❌ ERREUR: Les données déchiffrées ne correspondent pas aux données originales');
      console.log('Original:', testData);
      console.log('Déchiffré:', decrypted);
      return;
    }

    // 5. Test avec données non chiffrées
    console.log('\n📋 Étape 5: Vérification détection données non chiffrées');
    const plainData = { test: 'value' };
    console.log('✅ isEncrypted(plainData):', isEncrypted(plainData)); // false
    console.log('✅ isEncrypted(encrypted):', isEncrypted(encrypted)); // true

    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS!\n');

  } catch (error) {
    console.error('\n❌ ERREUR PENDANT LES TESTS:', error);
    console.error('Message:', error instanceof Error ? error.message : error);
  }
}

async function generateKey() {
  try {
    console.log('🔑 Génération d\'une nouvelle clé de chiffrement AES-256-GCM\n');

    const key = await generateEncryptionKey();

    console.log('✅ Clé générée avec succès!\n');
    console.log('📋 Copiez cette ligne dans votre fichier .env.local:\n');
    console.log(`VITE_ARCHIVE_ENCRYPTION_KEY=${key}`);
    console.log('\n⚠️  IMPORTANT:');
    console.log('   - Ne JAMAIS commiter cette clé dans Git');
    console.log('   - Sauvegarder cette clé dans un gestionnaire de secrets');
    console.log('   - Si la clé est perdue, les archives chiffrées sont IRRÉCUPÉRABLES\n');

  } catch (error) {
    console.error('❌ ERREUR:', error);
  }
}

// Main
const command = process.argv[2];

if (command === 'generate') {
  generateKey();
} else if (command === 'test') {
  testEncryption();
} else {
  console.log('Usage:');
  console.log('  npm run test-encryption generate  - Générer une nouvelle clé');
  console.log('  npm run test-encryption test      - Tester le chiffrement');
}
