# DispatchService - Distribution de Factures Électroniques

## Vue d'ensemble

Le `DispatchService` est le service central pour la distribution des factures électroniques vers les différentes plateformes de dématérialisation (PPF, PDP). Il gère la soumission, le suivi du statut de livraison et la gestion des erreurs avec retry automatique.

## Architecture

```typescript
DispatchService
├── Channel Providers
│   ├── PPFProvider (Chorus Pro)
│   ├── PDPProvider (Future)
│   └── Custom Providers
├── Document Submission
├── Status Tracking
├── Error Handling & Retry
└── Connectivity Testing
```

## Providers et Canaux Supportés

### 1. PPF (Plateforme Publique de Facturation)

```typescript
// Configuration PPF (Chorus Pro)
const ppfConfig = {
  baseUrl: 'https://chorus-pro.gouv.fr',
  credentials: {
    login: process.env.REACT_APP_CHORUS_PRO_LOGIN,
    password: process.env.REACT_APP_CHORUS_PRO_PASSWORD,
    qualification: 'PRODUCTION' // ou 'TEST'
  },
  technical: {
    syntaxVersion: '2.1',
    submissionType: 'FLUX',
    maxFileSize: 5 * 1024 * 1024, // 5 MB
    supportedFormats: ['UBL-Invoice-2.1', 'Factur-X']
  }
};
```

### 2. PDP (Plateforme de Dématérialisation Partenaire)

```typescript
// Configuration PDP (Future)
const pdpConfigs = {
  'PDP:PROVIDER_A': {
    baseUrl: 'https://api.provider-a.com',
    apiKey: process.env.REACT_APP_PDP_A_API_KEY,
    capabilities: {
      formats: ['UBL-Invoice-2.1', 'CII'],
      maxFileSize: 10 * 1024 * 1024,
      supportsCancellation: true,
      supportsStatusTracking: true
    }
  }
};
```

## Utilisation du Service

### Initialisation et Soumission

```typescript
import { DispatchService } from '@/services/einvoicing/core/DispatchService';
import { FormattingResult, EInvoiceChannel } from '@/types/einvoicing.types';

const dispatchService = new DispatchService();

// Exemple de résultat de formatage
const formattingResult: FormattingResult = {
  format: 'UBL-Invoice-2.1',
  xml_content: '<Invoice>...</Invoice>',
  pdf_content: new Uint8Array(), // PDF optionnel
  validation_status: 'valid',
  metadata: {
    invoice_number: 'INV-2024-001',
    customer_identifier: 'SIRET:12345678901234',
    total_amount: 1200.00,
    currency: 'EUR'
  }
};

// Soumettre vers Chorus Pro
try {
  const response = await dispatchService.submitDocument(
    formattingResult,
    'PPF', // Canal Chorus Pro
    'invoice-123'
  );

  if (response.success) {
    console.log('✅ Document soumis avec succès');
    console.log('ID de message:', response.message_id);
    console.log('Statut:', response.status);
    
    // Stocker l'ID pour le suivi
    localStorage.setItem(`invoice-123-message-id`, response.message_id);
  }
} catch (error) {
  if (error instanceof SubmissionError) {
    console.error('❌ Erreur de soumission:', error.message);
    console.error('Canal:', error.channel);
    console.error('Contexte:', error.context);
  }
}
```

### Suivi du Statut de Livraison

```typescript
// Vérifier le statut de livraison
const messageId = localStorage.getItem(`invoice-123-message-id`);

if (messageId) {
  const status = await dispatchService.getDeliveryStatus(messageId, 'PPF');
  
  console.log('Statut de livraison:', status.status);
  
  switch (status.status) {
    case 'submitted':
      console.log('📤 Document soumis, en attente de traitement');
      break;
      
    case 'processing':
      console.log('⚙️ Document en cours de traitement');
      break;
      
    case 'delivered':
      console.log('✅ Document livré avec succès');
      console.log('Détails:', status.details);
      break;
      
    case 'rejected':
      console.log('❌ Document rejeté');
      console.log('Raison:', status.details?.rejection_reason);
      break;
      
    case 'error':
      console.error('💥 Erreur lors du traitement');
      console.error('Erreur:', status.details?.error_message);
      break;
  }
}
```

### Annulation de Document

```typescript
// Annuler un document soumis (si supporté)
try {
  const cancelled = await dispatchService.cancelDocument(
    messageId,
    'PPF',
    'Erreur dans les données client'
  );

  if (cancelled) {
    console.log('✅ Document annulé avec succès');
  } else {
    console.log('⚠️ Annulation non supportée ou impossible');
  }
} catch (error) {
  console.error('❌ Erreur lors de l\'annulation:', error.message);
}
```

## Test de Connectivité

### Vérification des Canaux

```typescript
// Tester la connectivité d'un canal
const testResult = await dispatchService.testChannelConnectivity('PPF');

console.log('Canal disponible:', testResult.available);
if (testResult.latency) {
  console.log('Latence:', `${testResult.latency}ms`);
}
if (testResult.error) {
  console.error('Erreur de connectivité:', testResult.error);
}

// Tester tous les canaux supportés
const supportedChannels = dispatchService.getSupportedChannels();
console.log('Canaux supportés:', supportedChannels);

for (const channel of supportedChannels) {
  const result = await dispatchService.testChannelConnectivity(channel);
  console.log(`${channel}: ${result.available ? '✅' : '❌'}`);
}
```

### Capacités des Canaux

```typescript
// Obtenir les capacités d'un canal
const capabilities = await dispatchService.getChannelCapabilities('PPF');

console.log('Formats supportés:', capabilities.formats);
console.log('Taille max fichier:', `${capabilities.maxFileSize / 1024 / 1024}MB`);
console.log('Supporte annulation:', capabilities.supportsCancellation);
console.log('Suivi du statut:', capabilities.supportsStatusTracking);
console.log('Fonctionnalités:', capabilities.features);

/* Exemple de résultat:
{
  formats: ['UBL-Invoice-2.1', 'Factur-X', 'CII'],
  maxFileSize: 5242880, // 5MB
  supportsCancellation: false,
  supportsStatusTracking: true,
  features: ['batch_submission', 'webhook_notifications']
}
*/
```

## Gestion des Erreurs

### Types d'Erreurs

```typescript
import { 
  EInvoicingError, 
  SubmissionError 
} from '@/types/einvoicing.types';

// Erreur de soumission
class SubmissionError extends Error {
  constructor(
    message: string,
    public channel: EInvoiceChannel,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SubmissionError';
  }
}

// Erreur générique e-invoicing
class EInvoicingError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'EInvoicingError';
  }
}
```

### Stratégies de Gestion

```typescript
// Gestion des erreurs par type
try {
  await dispatchService.submitDocument(formattingResult, channel, documentId);
} catch (error) {
  if (error instanceof SubmissionError) {
    switch (error.message) {
      case /No provider available/:
        console.log('Canal non configuré, essayer un autre');
        // Fallback vers un autre canal
        break;
        
      case /Channel .* is not available/:
        console.log('Canal temporairement indisponible');
        // Réessayer plus tard ou utiliser un autre canal
        break;
        
      case /does not support format/:
        console.log('Format non supporté par ce canal');
        // Reformater dans un format supporté
        break;
        
      case /exceeds channel limit/:
        console.log('Document trop volumineux');
        // Compresser ou diviser le document
        break;
    }
  }
  
  if (error instanceof EInvoicingError) {
    switch (error.code) {
      case 'STATUS_CHECK_ERROR':
        console.log('Erreur lors de la vérification du statut');
        // Réessayer la vérification
        break;
        
      case 'CANCELLATION_ERROR':
        console.log('Impossible d\'annuler le document');
        // Informer l'utilisateur
        break;
        
      case 'PROVIDER_NOT_FOUND':
        console.log('Provider non trouvé');
        // Vérifier la configuration
        break;
    }
  }
}
```

### Retry Logic avec Backoff Exponentiel

```typescript
// Le service implémente automatiquement la logique de retry
const submitWithRetry = async (
  formattingResult: FormattingResult,
  channel: EInvoiceChannel,
  documentId: string,
  maxRetries: number = 3
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await dispatchService.submitDocument(formattingResult, channel, documentId);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Délai croissant: 1s, 2s, 4s, 8s...
      const delayMs = 1000 * Math.pow(2, attempt - 1);
      console.log(`⏳ Tentative ${attempt} échouée, retry dans ${delayMs}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
};
```

## Monitoring et Métriques

### Métriques de Performance

```typescript
// Le service log automatiquement les métriques
class DispatchMetrics {
  private static metrics = {
    submissions: {
      total: 0,
      successful: 0,
      failed: 0,
      byChannel: new Map<string, { success: number, failure: number }>()
    },
    performance: {
      avgLatency: 0,
      maxLatency: 0,
      minLatency: Infinity
    },
    errors: {
      byType: new Map<string, number>(),
      byChannel: new Map<string, number>()
    }
  };

  static recordSubmission(
    channel: EInvoiceChannel,
    duration: number,
    success: boolean,
    error?: Error
  ) {
    // Enregistrement des métriques
    this.metrics.submissions.total++;
    
    if (success) {
      this.metrics.submissions.successful++;
    } else {
      this.metrics.submissions.failed++;
      
      if (error) {
        const errorType = error.constructor.name;
        this.metrics.errors.byType.set(
          errorType,
          (this.metrics.errors.byType.get(errorType) || 0) + 1
        );
      }
    }

    // Métriques par canal
    const channelStats = this.metrics.submissions.byChannel.get(channel) || { success: 0, failure: 0 };
    if (success) {
      channelStats.success++;
    } else {
      channelStats.failure++;
    }
    this.metrics.submissions.byChannel.set(channel, channelStats);

    // Métriques de performance
    this.metrics.performance.avgLatency = (
      this.metrics.performance.avgLatency + duration
    ) / 2;
    this.metrics.performance.maxLatency = Math.max(
      this.metrics.performance.maxLatency,
      duration
    );
    this.metrics.performance.minLatency = Math.min(
      this.metrics.performance.minLatency,
      duration
    );
  }

  static getMetrics() {
    return this.metrics;
  }

  static getSuccessRate(): number {
    const { successful, total } = this.metrics.submissions;
    return total > 0 ? successful / total : 0;
  }
}

// Utilisation des métriques
setInterval(() => {
  const metrics = DispatchMetrics.getMetrics();
  const successRate = DispatchMetrics.getSuccessRate();
  
  console.log('📊 Métriques de dispatch:');
  console.log(`  Soumissions: ${metrics.submissions.total}`);
  console.log(`  Taux de réussite: ${(successRate * 100).toFixed(1)}%`);
  console.log(`  Latence moyenne: ${metrics.performance.avgLatency.toFixed(0)}ms`);
}, 60000); // Toutes les minutes
```

## Intégration avec l'Interface Utilisateur

### Composant de Soumission

```typescript
import React, { useState, useEffect } from 'react';
import { DispatchService } from '@/services/einvoicing/core/DispatchService';

const InvoiceSubmissionPanel = ({ invoice, formattingResult }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [availableChannels, setAvailableChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('PPF');

  const dispatchService = new DispatchService();

  useEffect(() => {
    loadAvailableChannels();
  }, []);

  const loadAvailableChannels = async () => {
    const channels = dispatchService.getSupportedChannels();
    const channelStatus = await Promise.all(
      channels.map(async (channel) => {
        const test = await dispatchService.testChannelConnectivity(channel);
        return {
          channel,
          available: test.available,
          latency: test.latency,
          error: test.error
        };
      })
    );
    
    setAvailableChannels(channelStatus);
  };

  const handleSubmit = async () => {
    if (!formattingResult || !selectedChannel) return;

    setIsSubmitting(true);
    setSubmissionStatus({ status: 'submitting', message: 'Soumission en cours...' });

    try {
      const response = await dispatchService.submitDocument(
        formattingResult,
        selectedChannel,
        invoice.id
      );

      if (response.success) {
        setSubmissionStatus({
          status: 'submitted',
          message: 'Document soumis avec succès',
          messageId: response.message_id
        });

        // Commencer le suivi du statut
        startStatusTracking(response.message_id);
      }
    } catch (error) {
      setSubmissionStatus({
        status: 'error',
        message: `Erreur: ${error.message}`,
        error: error
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startStatusTracking = (messageId) => {
    const trackStatus = async () => {
      try {
        const status = await dispatchService.getDeliveryStatus(messageId, selectedChannel);
        
        setSubmissionStatus(prevStatus => ({
          ...prevStatus,
          deliveryStatus: status.status,
          statusDetails: status.details
        }));

        // Continuer le suivi si pas encore finalisé
        if (!['delivered', 'rejected', 'error'].includes(status.status)) {
          setTimeout(trackStatus, 30000); // Vérifier toutes les 30s
        }
      } catch (error) {
        console.error('Erreur suivi statut:', error);
      }
    };

    // Commencer le suivi après 10s
    setTimeout(trackStatus, 10000);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitting': return '⏳';
      case 'submitted': return '📤';
      case 'delivered': return '✅';
      case 'rejected': return '❌';
      case 'error': return '💥';
      default: return '❓';
    }
  };

  const getChannelName = (channel) => {
    switch (channel) {
      case 'PPF': return 'Chorus Pro (PPF)';
      case 'PDP:PROVIDER_A': return 'Provider A (PDP)';
      default: return channel;
    }
  };

  return (
    <div className="invoice-submission-panel">
      <h3>Soumission Facture Électronique</h3>
      
      {/* Sélection du canal */}
      <div className="channel-selection">
        <label>Canal de soumission:</label>
        <select 
          value={selectedChannel} 
          onChange={(e) => setSelectedChannel(e.target.value)}
          disabled={isSubmitting}
        >
          {availableChannels.map(({ channel, available, latency, error }) => (
            <option key={channel} value={channel} disabled={!available}>
              {getChannelName(channel)} 
              {available ? ` (${latency}ms)` : ` (indisponible: ${error})`}
            </option>
          ))}
        </select>
      </div>

      {/* Informations du document */}
      <div className="document-info">
        <p><strong>Facture:</strong> {invoice.number}</p>
        <p><strong>Format:</strong> {formattingResult?.format}</p>
        <p><strong>Taille:</strong> {Math.round(formattingResult?.xml_content?.length / 1024)}KB</p>
      </div>

      {/* Bouton de soumission */}
      <button 
        onClick={handleSubmit}
        disabled={isSubmitting || !formattingResult}
        className="submit-button"
      >
        {isSubmitting ? 'Soumission...' : 'Soumettre'}
      </button>

      {/* Statut de soumission */}
      {submissionStatus && (
        <div className={`submission-status status-${submissionStatus.status}`}>
          <div className="status-header">
            {getStatusIcon(submissionStatus.status)} {submissionStatus.message}
          </div>
          
          {submissionStatus.messageId && (
            <div className="message-id">
              <strong>ID de message:</strong> {submissionStatus.messageId}
            </div>
          )}

          {submissionStatus.deliveryStatus && (
            <div className="delivery-status">
              <strong>Statut de livraison:</strong> {submissionStatus.deliveryStatus}
              {submissionStatus.statusDetails && (
                <pre>{JSON.stringify(submissionStatus.statusDetails, null, 2)}</pre>
              )}
            </div>
          )}

          {submissionStatus.error && (
            <div className="error-details">
              <strong>Détails de l'erreur:</strong>
              <pre>{submissionStatus.error.message}</pre>
            </div>
          )}
        </div>
      )}

      {/* Historique des soumissions */}
      <div className="submission-history">
        <h4>Historique</h4>
        {/* Afficher l'historique des soumissions précédentes */}
      </div>
    </div>
  );
};

export default InvoiceSubmissionPanel;
```

## Configuration et Déploiement

### Variables d'Environnement

```bash
# Configuration Chorus Pro
REACT_APP_CHORUS_PRO_LOGIN=your-chorus-login
REACT_APP_CHORUS_PRO_PASSWORD=your-chorus-password
REACT_APP_CHORUS_PRO_QUALIFICATION=PRODUCTION # ou TEST

# Configuration PDP (Future)
REACT_APP_PDP_A_API_KEY=your-pdp-a-api-key
REACT_APP_PDP_B_API_KEY=your-pdp-b-api-key

# Configuration générale
REACT_APP_EINVOICE_MAX_FILE_SIZE=5242880 # 5MB
REACT_APP_EINVOICE_RETRY_ATTEMPTS=3
REACT_APP_EINVOICE_TIMEOUT=30000 # 30s
```

### Configuration de Production

```typescript
const productionConfig = {
  retryAttempts: 3,
  timeoutMs: 30000,
  monitoring: {
    enabled: true,
    metricsInterval: 60000,
    alertThresholds: {
      errorRate: 0.05, // 5%
      avgLatency: 5000 // 5s
    }
  },
  channels: {
    PPF: {
      priority: 1,
      fallback: ['PDP:PROVIDER_A']
    },
    'PDP:PROVIDER_A': {
      priority: 2,
      fallback: ['PPF']
    }
  }
};
```

## Bonnes Pratiques

### 1. Gestion des Erreurs Resilientes

```typescript
// Stratégie de fallback entre canaux
const submitWithFallback = async (formattingResult, documentId) => {
  const channels = ['PPF', 'PDP:PROVIDER_A', 'PDP:PROVIDER_B'];
  
  for (const channel of channels) {
    try {
      const result = await dispatchService.submitDocument(
        formattingResult, 
        channel, 
        documentId
      );
      
      console.log(`✅ Soumission réussie via ${channel}`);
      return result;
    } catch (error) {
      console.warn(`❌ Échec sur ${channel}:`, error.message);
      
      if (channel === channels[channels.length - 1]) {
        throw new Error('Tous les canaux ont échoué');
      }
    }
  }
};
```

### 2. Cache et Optimisation

```typescript
// Cache des statuts pour éviter les appels répétés
const statusCache = new Map();

const getCachedStatus = async (messageId, channel) => {
  const cacheKey = `${messageId}-${channel}`;
  const cached = statusCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 60000) { // Cache 1 minute
    return cached.status;
  }
  
  const status = await dispatchService.getDeliveryStatus(messageId, channel);
  statusCache.set(cacheKey, {
    status,
    timestamp: Date.now()
  });
  
  return status;
};
```

### 3. Monitoring Proactif

```typescript
// Surveillance proactive de la santé des canaux
const healthMonitor = {
  async checkAllChannels() {
    const channels = dispatchService.getSupportedChannels();
    const results = await Promise.all(
      channels.map(async (channel) => {
        const test = await dispatchService.testChannelConnectivity(channel);
        return { channel, ...test };
      })
    );
    
    const unhealthyChannels = results.filter(r => !r.available);
    if (unhealthyChannels.length > 0) {
      console.warn('⚠️ Canaux indisponibles:', unhealthyChannels);
      // Envoyer une alerte
    }
    
    return results;
  },
  
  startMonitoring(intervalMs = 300000) { // 5 minutes
    setInterval(() => {
      this.checkAllChannels();
    }, intervalMs);
  }
};

// Démarrer le monitoring en production
if (import.meta.env.PROD) {
  healthMonitor.startMonitoring();
}
```

Le DispatchService offre une infrastructure robuste et extensible pour la distribution des factures électroniques, avec une gestion complète des erreurs et un monitoring intégré.