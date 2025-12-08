# Module de Facturation Électronique CassKai

## Vue d'ensemble

Le module de facturation électronique de CassKai implémente la conformité française EN 16931 avec support des formats Factur-X 1.0.7, UBL 2.1 et UN/CEFACT CII. Il permet la transmission sécurisée via Chorus Pro (PPF) et respecte toutes les exigences légales françaises.

## 🏗️ Architecture

### Structure du module

```
src/services/einvoicing/
├── core/                    # Services principaux
│   ├── FormattingService.ts     # Génération XML/PDF
│   ├── ValidationService.ts     # Validation EN 16931
│   ├── DispatchService.ts       # Transmission canaux
│   └── ArchiveService.ts        # Archivage légal
├── adapters/                # Adaptateurs
│   ├── InvoiceToEN16931Mapper.ts   # Mapping CassKai -> EN16931
│   └── ChannelProviders/           # Fournisseurs canaux
│       ├── base/ChannelProvider.ts
│       └── PPFProvider.ts          # Chorus Pro
├── utils/                   # Utilitaires
│   └── FeatureFlagService.ts      # Gestion feature flags
├── api/                     # API REST
│   ├── EInvoicingAPI.ts          # Service API
│   └── routes.ts                 # Routes Express
├── inbound/                 # Traitement entrant
│   └── InboundService.ts         # Factures fournisseurs
├── EInvoicingService.ts     # Service principal
└── index.ts                 # Point d'entrée
```

## 🔧 Installation et Configuration

### Pré-requis

- Node.js 18+
- TypeScript 5+
- Supabase configuré
- Variables d'environnement Chorus Pro

### Variables d'environnement

```env
# Chorus Pro (PPF)
PPF_CLIENT_ID=your_chorus_pro_client_id
PPF_CLIENT_SECRET=your_chorus_pro_client_secret
PPF_SANDBOX=true  # false en production

# Supabase (déjà configuré)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### Migration de la base de données

```bash
# Appliquer la migration e-invoicing
supabase migration up --file 20250108_einvoicing_module.sql
```

## 🚀 Utilisation

### Activation du module

```typescript
import { FeatureFlagService } from '@/services/einvoicing/utils/FeatureFlagService';

const featureService = new FeatureFlagService();
await featureService.enableEInvoicing('company-id');
```

### Soumission d'une facture

```typescript
import { EInvoicingService } from '@/services/einvoicing';

const einvoicingService = new EInvoicingService();

const result = await einvoicingService.submitInvoice('invoice-id', {
  format: 'FACTURX',    // FACTURX | UBL | CII
  channel: 'PPF',       // Chorus Pro
  async: true,          # Traitement asynchrone
  validate: true,       # Validation EN 16931
  archive: true         # Archivage légal
});

if (result.success) {
  console.log('Facture soumise:', result.document_id);
  console.log('PDF disponible:', result.pdf_url);
} else {
  console.error('Erreurs:', result.errors);
}
```

### Suivi du statut

```typescript
const document = await einvoicingService.getDocumentStatus('document-id');

console.log('Statut:', document?.lifecycle_status);
// DRAFT | SUBMITTED | DELIVERED | ACCEPTED | REJECTED | PAID
```

### Interface utilisateur React

```tsx
import { EInvoicingDashboard } from '@/components/einvoicing/EInvoicingDashboard';

function InvoicingPage() {
  return <EInvoicingDashboard companyId="company-id" />;
}
```

## 🔌 API REST

### Endpoints principaux

```bash
# Soumettre une facture
POST /api/v1/companies/{companyId}/einvoicing/submit
{
  "invoice_id": "invoice-123",
  "format": "FACTURX",
  "channel": "PPF",
  "async": true
}

# Lister les documents
GET /api/v1/companies/{companyId}/einvoicing/documents
?status=SUBMITTED&format=FACTURX&page=1&limit=20

# Obtenir le statut
GET /api/v1/companies/{companyId}/einvoicing/documents/{documentId}

# Statistiques
GET /api/v1/companies/{companyId}/einvoicing/statistics

# Webhook (Chorus Pro)
POST /api/v1/einvoicing/webhooks/status
{
  "message_id": "msg-123",
  "status": "DELIVERED",
  "reason": "Successfully delivered"
}
```

## 📋 Formats supportés

### Factur-X 1.0.7
- Format Franco-Allemand officiel
- PDF/A-3 avec XML intégré (UN/CEFACT CII)
- Compatible EDI et lecture humaine

### UBL 2.1 (Universal Business Language)
- Standard OASIS international
- Format XML pur
- Interopérabilité européenne

### UN/CEFACT CII (Cross Industry Invoice)
- Standard UN/ECE
- Utilisé dans Factur-X
- Format XML structuré

## 🛡️ Conformité

### EN 16931 (Norme européenne)
- ✅ Validation complète des 157 règles métier
- ✅ Données obligatoires et optionnelles
- ✅ Calculs de totaux et TVA
- ✅ Formats de dates et devises
- ✅ Parties (vendeur/acheteur)

### Conformité française
- ✅ Obligation légale 2024-2026
- ✅ Transmission Chorus Pro (PPF)
- ✅ Archivage légal 10 ans
- ✅ SIRET et TVA français
- ✅ Audit trail complet

## 🔐 Sécurité

### Authentification
- OAuth2 pour Chorus Pro
- JWT pour API interne
- Certificats TLS obligatoires

### Protection des données
- Chiffrement en transit et au repos
- RLS (Row Level Security) Supabase
- Logs d'audit immutables
- Hachage SHA-256 des documents

### Feature Flags
- Activation/désactivation par entreprise
- Pas d'impact sur l'existant
- Rollback sécurisé possible

## 🧪 Tests

### Exécution des tests

```bash
# Tests du module e-invoicing uniquement
npm test -- --config jest.einvoicing.config.js

# Tests avec couverture
npm run test:coverage:einvoicing

# Tests end-to-end
npm run test:e2e:einvoicing
```

### Types de tests

- **Unit Tests** : Services core, validation, formatage
- **Integration Tests** : API endpoints, base de données
- **End-to-End** : Workflow complet de soumission

### Couverture requise
- Core Services : 90% minimum
- API : 85% minimum
- Global : 80% minimum

## 📊 Monitoring

### Métriques disponibles

```typescript
// Statistiques par entreprise
const stats = await api.getStatistics(companyId);

console.log(`
Taux de succès: ${stats.success_rate}%
Documents traités: ${stats.total_documents}
Par statut: ${JSON.stringify(stats.by_status)}
Activité récente: ${stats.recent_activity}
`);
```

### Audit et logging

Tous les événements sont loggés dans `einv_audit_logs` :
- Soumissions de documents
- Changements de statut
- Erreurs et rejets
- Accès aux archives

## 🚨 Dépannage

### Erreurs courantes

**Feature désactivée**
```
Error: E-invoicing feature 'einvoicing_v1' is not enabled
Solution: Activer le feature flag via les paramètres
```

**Validation EN 16931 échoue**
```
Error: Invoice number is mandatory (BT-1-01)
Solution: Vérifier les données obligatoires de la facture
```

**Chorus Pro inaccessible**
```
Error: PPF submission failed: 401 Unauthorized
Solution: Vérifier les credentials PPF dans les variables d'environnement
```

### Logs et diagnostics

```bash
# Logs en temps réel
tail -f logs/einvoicing.log

# Vérifier la connectivité Chorus Pro
curl -H "Authorization: Bearer $PPF_TOKEN" \
     https://sandbox-choruspro.gouv.fr/api/ping

# Tester la validation
npm run test:validation -- invoice-123
```

## 🛣️ Roadmap

### Version 1.1 (Q2 2024)
- [ ] Support PDP (Plateformes de Dématérialisation Partenaires)
- [ ] Import automatique factures fournisseurs
- [ ] Templates de factures EN 16931
- [ ] Connecteurs ERP tiers

### Version 1.2 (Q3 2024)
- [ ] IA détection anomalies
- [ ] Workflow approbation
- [ ] Signature électronique
- [ ] Export comptable automatisé

## 📞 Support

- **Documentation** : `/docs/einvoicing/`
- **Email** : support-einvoicing@casskai.com
- **Issues** : GitHub Issues avec label `e-invoicing`
- **Slack** : #einvoicing-support

## 📄 Licence

Module propriétaire CassKai - Tous droits réservés

---

**⚠️ Important** : Ce module respecte la réglementation française sur la facturation électronique. Toute modification doit maintenir la conformité EN 16931.