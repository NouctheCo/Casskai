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

import { EncryptedCredentials, AuditLog } from '../../../types/openBanking.types';

// Service de chiffrement end-to-end pour les données sensibles
export class EncryptionService {
  private static instance: EncryptionService;
  private masterKey: CryptoKey | null = null;
  private keyCache = new Map<string, CryptoKey>();
  private isInitialized = false;

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!this.instance) {
      this.instance = new EncryptionService();
    }
    return this.instance;
  }

  // Initialisation avec la clé maître
  async initialize(masterKeyMaterial: string | ArrayBuffer): Promise<void> {
    try {
      // Dériver la clé maître depuis le matériau fourni
      const keyMaterial = typeof masterKeyMaterial === 'string' 
        ? new TextEncoder().encode(masterKeyMaterial)
        : masterKeyMaterial;

      const importedKey = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        'PBKDF2',
        false,
        ['deriveKey']
      );

      // Dériver la clé AES-GCM pour le chiffrement
      this.masterKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode('CassKai-Banking-Salt'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        importedKey,
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt', 'deriveKey']
      );

      this.isInitialized = true;
      console.warn('Encryption service initialized successfully');
    } catch (error: unknown) {
      throw new Error(`Failed to initialize encryption service: ${(error instanceof Error ? error.message : 'Une erreur est survenue')}`);
    }
  }

  // Générer une nouvelle clé de chiffrement dérivée
  async generateDerivedKey(keyId: string, context: string = ''): Promise<CryptoKey> {
    if (!this.isInitialized || !this.masterKey) {
      throw new Error('Encryption service not initialized');
    }

    const cacheKey = `${keyId}-${context}`;
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey)!;
    }

    try {
      // Utiliser le keyId et le contexte comme salt
      const salt = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(`${keyId}-${context}`)
      );

      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new Uint8Array(salt),
          iterations: 10000,
          hash: 'SHA-256'
        },
        await this.exportImportMasterKey(),
        {
          name: 'AES-GCM',
          length: 256
        },
        false,
        ['encrypt', 'decrypt']
      );

      this.keyCache.set(cacheKey, derivedKey);
      return derivedKey;
    } catch (error: unknown) {
      throw new Error(`Failed to generate derived key: ${(error instanceof Error ? error.message : 'Une erreur est survenue')}`);
    }
  }

  // Chiffrer des données sensibles
  async encryptCredentials(
    userId: string,
    providerId: string,
    credentials: Record<string, any>,
    expiresAt?: Date
  ): Promise<EncryptedCredentials> {
    if (!this.isInitialized) {
      throw new Error('Encryption service not initialized');
    }

    try {
      const keyId = crypto.randomUUID();
      const derivedKey = await this.generateDerivedKey(keyId, `${userId}-${providerId}`);

      // Sérialiser les credentials
      const plaintext = JSON.stringify(credentials);
      const plaintextBuffer = new TextEncoder().encode(plaintext);

      // Générer un IV aléatoire
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Chiffrer les données
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        derivedKey,
        plaintextBuffer
      );

      // Combiner IV et données chiffrées
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      // Encoder en base64 pour le stockage
      const encryptedData = btoa(String.fromCharCode(...combined));

      const encryptedCredentials: EncryptedCredentials = {
        id: crypto.randomUUID(),
        userId,
        providerId,
        encryptedData,
        keyId,
        algorithm: 'AES-GCM-256',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt
      };

      await this.auditLog('CREDENTIALS_ENCRYPTED', userId, {
        providerId,
        keyId,
        algorithm: 'AES-GCM-256'
      });

      return encryptedCredentials;
    } catch (error: unknown) {
      await this.auditLog('CREDENTIALS_ENCRYPTION_FAILED', userId, {
        providerId,
        error: (error instanceof Error ? error.message : 'Une erreur est survenue')
      });
      throw new Error(`Failed to encrypt credentials: ${(error instanceof Error ? error.message : 'Une erreur est survenue')}`);
    }
  }

  // Déchiffrer des données sensibles
  async decryptCredentials(encryptedCredentials: EncryptedCredentials): Promise<Record<string, any>> {
    if (!this.isInitialized) {
      throw new Error('Encryption service not initialized');
    }

    try {
      // Vérifier l'expiration
      if (encryptedCredentials.expiresAt && encryptedCredentials.expiresAt < new Date()) {
        throw new Error('Encrypted credentials have expired');
      }

      const derivedKey = await this.generateDerivedKey(
        encryptedCredentials.keyId,
        `${encryptedCredentials.userId}-${encryptedCredentials.providerId}`
      );

      // Décoder depuis base64
      const combined = new Uint8Array(
        atob(encryptedCredentials.encryptedData)
          .split('')
          .map(char => char.charCodeAt(0))
      );

      // Extraire IV et données chiffrées
      const iv = combined.slice(0, 12);
      const encryptedBuffer = combined.slice(12);

      // Déchiffrer
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        derivedKey,
        encryptedBuffer
      );

      // Désérialiser
      const plaintext = new TextDecoder().decode(decryptedBuffer);
      const credentials = JSON.parse(plaintext);

      await this.auditLog('CREDENTIALS_DECRYPTED', encryptedCredentials.userId, {
        providerId: encryptedCredentials.providerId,
        keyId: encryptedCredentials.keyId
      });

      return credentials;
    } catch (error: unknown) {
      await this.auditLog('CREDENTIALS_DECRYPTION_FAILED', encryptedCredentials.userId, {
        providerId: encryptedCredentials.providerId,
        keyId: encryptedCredentials.keyId,
        error: (error instanceof Error ? error.message : 'Une erreur est survenue')
      });
      throw new Error(`Failed to decrypt credentials: ${(error instanceof Error ? error.message : 'Une erreur est survenue')}`);
    }
  }

  // Chiffrer une chaîne de caractères simple
  async encryptString(plaintext: string, context: string = 'default'): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Encryption service not initialized');
    }

    try {
      const keyId = crypto.randomUUID();
      const derivedKey = await this.generateDerivedKey(keyId, context);

      const plaintextBuffer = new TextEncoder().encode(plaintext);
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        derivedKey,
        plaintextBuffer
      );

      // Format: keyId:iv:encryptedData (tous en base64)
      const ivBase64 = btoa(String.fromCharCode(...iv));
      const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
      
      return `${keyId}:${ivBase64}:${encryptedBase64}`;
    } catch (error: unknown) {
      throw new Error(`Failed to encrypt string: ${(error instanceof Error ? error.message : 'Une erreur est survenue')}`);
    }
  }

  // Déchiffrer une chaîne de caractères simple
  async decryptString(encryptedString: string, context: string = 'default'): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Encryption service not initialized');
    }

    try {
      const parts = encryptedString.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted string format');
      }

      const [keyId, ivBase64, encryptedBase64] = parts;
      const derivedKey = await this.generateDerivedKey(keyId, context);

      const iv = new Uint8Array(
        atob(ivBase64).split('').map(char => char.charCodeAt(0))
      );
      const encryptedBuffer = new Uint8Array(
        atob(encryptedBase64).split('').map(char => char.charCodeAt(0))
      );

      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        derivedKey,
        encryptedBuffer
      );

      return new TextDecoder().decode(decryptedBuffer);
    } catch (error: unknown) {
      throw new Error(`Failed to decrypt string: ${(error instanceof Error ? error.message : 'Une erreur est survenue')}`);
    }
  }

  // Générer un hash sécurisé pour les tokens
  async hashToken(token: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(token);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = new Uint8Array(hashBuffer);
      return btoa(String.fromCharCode(...hashArray));
    } catch (error: unknown) {
      throw new Error(`Failed to hash token: ${(error instanceof Error ? error.message : 'Une erreur est survenue')}`);
    }
  }

  // Générer un token sécurisé
  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/[+/]/g, char => char === '+' ? '-' : '_')
      .replace(/=/g, '');
  }

  // Vérifier l'intégrité d'une signature HMAC
  async verifyHMACSignature(
    payload: string, 
    signature: string, 
    secret: string, 
    algorithm: 'SHA-256' | 'SHA-1' = 'SHA-256'
  ): Promise<boolean> {
    try {
      const encoder = new TextEncoder();
      const keyMaterial = encoder.encode(secret);
      
      const key = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'HMAC', hash: algorithm },
        false,
        ['verify']
      );

      const signatureBuffer = new Uint8Array(
        atob(signature.replace(/^(sha256=|sha1=)/, ''))
          .split('')
          .map(char => char.charCodeAt(0))
      );

      return await crypto.subtle.verify(
        'HMAC',
        key,
        signatureBuffer,
        encoder.encode(payload)
      );
    } catch (error: unknown) {
      console.error('HMAC verification failed:', error);
      return false;
    }
  }

  // Générer une signature HMAC
  async generateHMACSignature(
    payload: string, 
    secret: string, 
    algorithm: 'SHA-256' | 'SHA-1' = 'SHA-256'
  ): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const keyMaterial = encoder.encode(secret);
      
      const key = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'HMAC', hash: algorithm },
        false,
        ['sign']
      );

      const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(payload)
      );

      const signatureArray = new Uint8Array(signatureBuffer);
      const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
      
      return `${algorithm.toLowerCase().replace('-', '')}=${signatureBase64}`;
    } catch (error: unknown) {
      throw new Error(`Failed to generate HMAC signature: ${(error instanceof Error ? error.message : 'Une erreur est survenue')}`);
    }
  }

  // Nettoyer le cache des clés
  clearKeyCache(): void {
    this.keyCache.clear();
  }

  // Faire expirer les clés du cache
  expireKeyCache(keyPattern?: string): void {
    if (keyPattern) {
      for (const [key] of this.keyCache) {
        if (key.includes(keyPattern)) {
          this.keyCache.delete(key);
        }
      }
    } else {
      this.clearKeyCache();
    }
  }

  // Méthode utilitaire pour exporter/importer la clé maître
  private async exportImportMasterKey(): Promise<CryptoKey> {
    if (!this.masterKey) {
      throw new Error('Master key not available');
    }

    const exported = await crypto.subtle.exportKey('raw', this.masterKey);
    return await crypto.subtle.importKey(
      'raw',
      exported,
      'PBKDF2',
      false,
      ['deriveKey']
    );
  }

  // Log d'audit des opérations de chiffrement
  private async auditLog(action: string, userId: string, metadata: any): Promise<void> {
    try {
      const auditEntry: AuditLog = {
        id: crypto.randomUUID(),
        userId,
        action,
        resource: 'encryption',
        ipAddress: '127.0.0.1', // À remplacer par la vraie IP
        userAgent: navigator.userAgent || 'Unknown',
        success: true,
        metadata,
        timestamp: new Date()
      };

      // En production, sauvegarder en base de données
      console.warn('Audit log:', auditEntry);
    } catch (error: unknown) {
      console.error('Failed to create audit log:', error);
    }
  }

  // Getters
  get initialized(): boolean {
    return this.isInitialized;
  }

  // Cleanup
  dispose(): void {
    this.clearKeyCache();
    this.masterKey = null;
    this.isInitialized = false;
  }
}

// Classe pour la rotation automatique des tokens
export class TokenRotationService {
  private rotationInterval: number;
  private rotationTimer: NodeJS.Timeout | null = null;

  constructor(rotationIntervalMs: number = 24 * 60 * 60 * 1000) { // 24 heures par défaut
    this.rotationInterval = rotationIntervalMs;
  }

  // Démarrer la rotation automatique
  startAutoRotation(callback: () => Promise<void>): void {
    this.stopAutoRotation();
    
    this.rotationTimer = setInterval(async () => {
      try {
        await callback();
        console.warn('Token rotation completed successfully');
      } catch (error: unknown) {
        console.error('Token rotation failed:', error);
      }
    }, this.rotationInterval);
  }

  // Arrêter la rotation automatique
  stopAutoRotation(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
  }

  // Forcer une rotation immédiate
  async forceRotation(callback: () => Promise<void>): Promise<void> {
    try {
      await callback();
      console.warn('Forced token rotation completed successfully');
    } catch (error: unknown) {
      console.error('Forced token rotation failed:', error);
      throw error;
    }
  }

  dispose(): void {
    this.stopAutoRotation();
  }
}

// Factory pour créer des services de chiffrement configurés
export class EncryptionServiceFactory {
  static async createService(config: {
    masterKey: string | ArrayBuffer;
    tokenRotationInterval?: number;
  }): Promise<{
    encryptionService: EncryptionService;
    tokenRotationService: TokenRotationService;
  }> {
    const encryptionService = EncryptionService.getInstance();
    await encryptionService.initialize(config.masterKey);

    const tokenRotationService = new TokenRotationService(config.tokenRotationInterval);

    return {
      encryptionService,
      tokenRotationService
    };
  }
}
