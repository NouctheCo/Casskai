/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

/**
 * 🔐 SERVICE DE CHIFFREMENT AES-256-GCM POUR ARCHIVES LÉGALES
 *
 * Conforme RGPD Article 32 - Sécurité du traitement
 * Utilisé pour chiffrer les archives conservées 7 ans (obligation légale)
 *
 * ⚠️ RÈGLES DE SÉCURITÉ:
 * - Algorithme: AES-256-GCM (standard industrie)
 * - IV unique pour chaque archive (jamais réutilisé)
 * - Clé de chiffrement stockée dans .env.local (JAMAIS dans Git)
 * - Si la clé est perdue, les données sont IRRÉCUPÉRABLES
 *
 * @example
 * ```typescript
 * // Chiffrer des données
 * const encrypted = await encryptData({ user_id: '123', email: 'user@example.com' });
 *
 * // Déchiffrer des données
 * const decrypted = await decryptData(encrypted);
 *
 * // Vérifier si des données sont chiffrées
 * const isEnc = isEncrypted(data);
 * ```
 */

import { logger } from '@/utils/logger';

/**
 * 🔑 Récupère la clé de chiffrement depuis l'environnement
 * La clé doit être une chaîne hexadécimale de 64 caractères (32 octets = 256 bits)
 */
function getEncryptionKey(): string {
  const key = import.meta.env.VITE_ARCHIVE_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'VITE_ARCHIVE_ENCRYPTION_KEY manquante dans .env.local. ' +
      'Générez une clé avec: await generateEncryptionKey()'
    );
  }

  // Vérifier le format (64 caractères hexadécimaux)
  if (!/^[0-9a-f]{64}$/i.test(key)) {
    throw new Error(
      'VITE_ARCHIVE_ENCRYPTION_KEY invalide. ' +
      'Doit être une chaîne hexadécimale de 64 caractères (256 bits).'
    );
  }

  return key;
}

/**
 * 🔧 Convertir une chaîne hexadécimale en ArrayBuffer
 */
function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}

/**
 * 🔧 Convertir un ArrayBuffer en chaîne hexadécimale
 */
function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 🔧 Convertir un ArrayBuffer en Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * 🔧 Convertir Base64 en ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * 🎲 Générer une nouvelle clé de chiffrement AES-256
 * À utiliser UNE SEULE FOIS pour générer la clé initiale
 *
 * @returns Clé hexadécimale de 64 caractères à stocker dans .env.local
 *
 * @example
 * ```typescript
 * const key = await generateEncryptionKey();
 * console.log('VITE_ARCHIVE_ENCRYPTION_KEY=' + key);
 * // Copier cette ligne dans .env.local
 * ```
 */
export async function generateEncryptionKey(): Promise<string> {
  try {
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );

    const exportedKey = await crypto.subtle.exportKey('raw', key);
    const hexKey = arrayBufferToHex(exportedKey);

    logger.info('EncryptionService: Nouvelle clé générée (à stocker dans .env.local)');
    return hexKey;
  } catch (error) {
    logger.error('EncryptionService: Erreur génération clé', error);
    throw new Error('Impossible de générer la clé de chiffrement');
  }
}

/**
 * 🔒 Chiffre des données JSON avec AES-256-GCM
 *
 * @param data - Données à chiffrer (objet ou valeur primitive)
 * @returns Chaîne chiffrée au format: iv:encryptedData (Base64)
 *
 * @example
 * ```typescript
 * const userData = { user_id: '123', email: 'user@example.com' };
 * const encrypted = await encryptData(userData);
 * // Retourne: "a1b2c3d4e5f6....:z9y8x7w6v5u4...."
 * ```
 */
export async function encryptData(data: any): Promise<string> {
  try {
    // 1. Récupérer la clé de chiffrement
    const keyHex = getEncryptionKey();
    const keyBuffer = hexToArrayBuffer(keyHex);

    // 2. Importer la clé
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      {
        name: 'AES-GCM',
        length: 256
      },
      false, // non extractable
      ['encrypt']
    );

    // 3. Générer un IV aléatoire unique (12 octets pour GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // 4. Sérialiser les données en JSON
    const jsonString = JSON.stringify(data);
    const dataBuffer = new TextEncoder().encode(jsonString);

    // 5. Chiffrer avec AES-256-GCM
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128 // Tag d'authentification de 128 bits
      },
      cryptoKey,
      dataBuffer
    );

    // 6. Encoder en Base64: iv:encryptedData
    const ivBase64 = arrayBufferToBase64(iv);
    const encryptedBase64 = arrayBufferToBase64(encryptedBuffer);
    const result = `${ivBase64}:${encryptedBase64}`;

    logger.info('EncryptionService: Données chiffrées avec succès', {
      dataSize: jsonString.length,
      encryptedSize: result.length
    });

    return result;

  } catch (error) {
    logger.error('EncryptionService: Erreur chiffrement', error, {
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error(`Échec du chiffrement des données: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 🔓 Déchiffre des données AES-256-GCM
 *
 * @param encryptedData - Chaîne chiffrée au format: iv:encryptedData (Base64)
 * @returns Données déchiffrées (objet JSON reconstitué)
 *
 * @example
 * ```typescript
 * const encrypted = "a1b2c3d4e5f6....:z9y8x7w6v5u4....";
 * const decrypted = await decryptData(encrypted);
 * // Retourne: { user_id: '123', email: 'user@example.com' }
 * ```
 */
export async function decryptData(encryptedData: string): Promise<any> {
  try {
    // 1. Vérifier le format
    if (!encryptedData || typeof encryptedData !== 'string') {
      throw new Error('Données chiffrées invalides (format incorrect)');
    }

    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Format de données chiffrées invalide (doit être: iv:encryptedData)');
    }

    const [ivBase64, encryptedBase64] = parts;

    // 2. Récupérer la clé de chiffrement
    const keyHex = getEncryptionKey();
    const keyBuffer = hexToArrayBuffer(keyHex);

    // 3. Importer la clé
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      {
        name: 'AES-GCM',
        length: 256
      },
      false, // non extractable
      ['decrypt']
    );

    // 4. Décoder depuis Base64
    const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
    const encryptedBuffer = base64ToArrayBuffer(encryptedBase64);

    // 5. Déchiffrer avec AES-256-GCM
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      },
      cryptoKey,
      encryptedBuffer
    );

    // 6. Désérialiser JSON
    const jsonString = new TextDecoder().decode(decryptedBuffer);
    const data = JSON.parse(jsonString);

    logger.info('EncryptionService: Données déchiffrées avec succès', {
      dataSize: jsonString.length
    });

    return data;

  } catch (error) {
    logger.error('EncryptionService: Erreur déchiffrement', error, {
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });

    // Message d'erreur plus informatif
    if (error instanceof Error && error.message.includes('operation-specific reason')) {
      throw new Error(
        'Échec du déchiffrement: la clé de chiffrement est probablement incorrecte ou les données sont corrompues'
      );
    }

    throw new Error(`Échec du déchiffrement des données: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 🔍 Vérifie si des données sont chiffrées
 *
 * @param data - Données à vérifier
 * @returns true si les données sont au format chiffré
 *
 * @example
 * ```typescript
 * isEncrypted("a1b2c3d4e5f6....:z9y8x7w6v5u4...."); // true
 * isEncrypted({ user_id: '123' }); // false
 * ```
 */
export function isEncrypted(data: any): boolean {
  if (typeof data !== 'string') {
    return false;
  }

  // Format attendu: ivBase64:encryptedBase64
  const parts = data.split(':');
  if (parts.length !== 2) {
    return false;
  }

  const [ivPart, encryptedPart] = parts;

  // Vérifier que les deux parties ressemblent à du Base64
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  return base64Regex.test(ivPart) && base64Regex.test(encryptedPart);
}

/**
 * 📦 Service d'export pour les tests et l'utilisation externe
 */
export const encryptionService = {
  generateKey: generateEncryptionKey,
  encrypt: encryptData,
  decrypt: decryptData,
  isEncrypted: isEncrypted
};

export default encryptionService;
