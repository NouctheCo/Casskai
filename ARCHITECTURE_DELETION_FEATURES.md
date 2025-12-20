# 📋 Architecture technique - Suppression de compte et d'entreprise

## 🏗️ Vue d'ensemble de l'architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CompanySettings.tsx                                       │
│  ├─ Bouton "Supprimer l'entreprise"                       │
│  └─ Montre CompanyDeletionDialog                          │
│                                                             │
│  CompanyDeletionDialog.tsx                                 │
│  ├─ Step 1: Confirmation (seul owner?)                    │
│  ├─ Step 2: Raison de suppression                         │
│  └─ Step 3: Envoi de la demande                           │
│                                                             │
│  UserPrivacySettings.tsx                                   │
│  └─ Suppression de compte (existant)                      │
│                                                             │
│  Services:                                                 │
│  ├─ companyDeletionService.ts (nouvelle)                  │
│  ├─ useCompanyDeletion.ts (nouveau hook)                  │
│  └─ rgpdService.ts (existant)                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          ↕ API CALLS
┌─────────────────────────────────────────────────────────────┐
│                 EDGE FUNCTIONS (Deno)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  /delete-company                                           │
│  ├─ Vérifie l'authentification JWT                        │
│  ├─ Vérifie que l'utilisateur est owner                  │
│  ├─ Récupère tous les autres owners                      │
│  ├─ Crée company_deletion_requests                        │
│  ├─ Crée company_deletion_approvals                       │
│  └─ Retourne l'état (seul owner ou consensus requis)     │
│                                                             │
│  /approve-company-deletion                                │
│  ├─ Vérifie l'authentification                           │
│  ├─ Enregistre l'approbation/rejet                        │
│  ├─ Vérifie si tous les autres owners ont approuvé      │
│  └─ Met à jour le statut si consensus                    │
│                                                             │
│  /delete-account (existant)                               │
│  ├─ Gère la suppression de compte                         │
│  ├─ Période de grâce: 30 jours                           │
│  └─ Demande transfert si owns des companies             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          ↕ SQL
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tables:                                                   │
│  ├─ company_deletion_requests                             │
│  │  └─ Demandes de suppression d'entreprise               │
│  ├─ company_deletion_approvals                            │
│  │  └─ Approbations des propriétaires                     │
│  ├─ account_deletion_requests                             │
│  │  └─ Demandes de suppression de compte                 │
│  └─ rgpd_logs (existant)                                  │
│     └─ Logs d'audit RGPD                                 │
│                                                             │
│  Fonctions:                                                │
│  ├─ can_user_delete_account(user_id)                      │
│  │  └─ Analyse si le compte peut être supprimé            │
│  └─ get_company_deletion_approvals(request_id)            │
│     └─ Vérifie l'état des approbations                   │
│                                                             │
│  Policies RLS:                                             │
│  ├─ account_deletion_requests                             │
│  │  └─ user_id = auth.uid()                              │
│  ├─ company_deletion_requests                             │
│  │  └─ requested_by = auth.uid() OU in required_approvals │
│  └─ company_deletion_approvals                            │
│     └─ approver_id = auth.uid() OU requested_by           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flux de données - Suppression d'entreprise

### Cas 1: Seul propriétaire

```
1. Utilisateur clique "Supprimer"
   ↓
2. Frontend appelle /delete-company avec company_id
   ↓
3. Edge Function vérifie l'authentification
   ↓
4. Edge Function récupère les autres owners (= 0)
   ↓
5. Edge Function crée company_deletion_requests (status="approved")
   ↓
6. Edge Function retourne {status: "approved", can_cancel: true}
   ↓
7. Frontend montre "Demande approuvée - Suppression dans 30 jours"
   ↓
8. Utilisateur peut annuler pendant 30 jours
   ↓
9. Après 30 jours: webhook exécute la suppression réelle
```

### Cas 2: Propriétaires multiples

```
1. Utilisateur clique "Supprimer"
   ↓
2. Frontend appelle /delete-company avec company_id
   ↓
3. Edge Function vérifie l'authentification
   ↓
4. Edge Function récupère les autres owners (> 0)
   ↓
5. Edge Function crée company_deletion_requests (status="approval_pending")
   ↓
6. Edge Function crée company_deletion_approvals pour chaque owner
   ↓
7. Edge Function retourne {status: "approval_pending", other_owners_count: 2}
   ↓
8. Frontend montre "En attente d'approbation de 2 propriétaires"
   ↓
9. Les 2 autres propriétaires voient "Approbations en attente" dans le dashboard
   ↓
10. Ils cliquent pour approuver/rejeter
    ↓
11. Frontend appelle /approve-company-deletion
    ↓
12. Edge Function enregistre l'approbation
    ↓
13. Edge Function vérifie si TOUS les owners ont approuvé
    ↓
14. Si rejet: status = "cancelled"
    Si tous approuvent: status = "approved"
    ↓
15. Après 30 jours: webhook exécute la suppression réelle
```

---

## 📊 Schéma des tables

### company_deletion_requests
```sql
{
  id: UUID PRIMARY KEY,
  company_id: UUID FOREIGN KEY,
  requested_by: UUID FOREIGN KEY (auth.users),
  
  status: 'pending' | 'approval_pending' | 'approved' | 'processing' | 'completed' | 'cancelled',
  
  required_approvals: JSONB = [
    { user_id: UUID, email: string, role: 'owner' },
    ...
  ],
  
  received_approvals: JSONB = {
    'user_id-1': true,
    'user_id-2': false,
    ...
  },
  
  export_requested: boolean,
  export_generated_at: timestamp,
  export_download_url: string,
  
  legal_archive_created: boolean,
  legal_archive_location: string,
  
  requested_at: timestamp,
  scheduled_deletion_at: timestamp (requested_at + 30 days),
  processed_at: timestamp,
  cancelled_at: timestamp,
  
  cancellation_reason: string,
  ip_address: inet,
  user_agent: string,
  metadata: JSONB,
  
  created_at: timestamp,
  updated_at: timestamp
}
```

### company_deletion_approvals
```sql
{
  id: UUID PRIMARY KEY,
  deletion_request_id: UUID FOREIGN KEY,
  approver_id: UUID FOREIGN KEY (auth.users),
  
  approved: boolean,
  approval_reason: string,
  
  created_at: timestamp,
  approved_at: timestamp,
  
  ip_address: inet,
  user_agent: string
}
```

---

## 🔐 Sécurité - Mesures de protection

### Authentification
- ✅ JWT obligatoire dans Authorization header
- ✅ Vérification avec `supabase.auth.getUser(token)`
- ✅ ID utilisateur extrait du token

### Autorisation
- ✅ Seul un propriétaire peut demander la suppression
- ✅ Les propriétaires invités doivent approuver
- ✅ Un rejet annule tout

### Intégrité des données
- ✅ Contrainte UNIQUE: un seul pending par entreprise
- ✅ Contrainte UNIQUE: un seul approval par approver par demande
- ✅ Suppression en cascade des approvals si demande supprimée

### Audit
- ✅ IP address enregistrée
- ✅ User-Agent enregistré
- ✅ Timestamp de toutes les actions
- ✅ Logs dans rgpd_logs pour RGPD compliance

---

## 🚀 Points d'extension

### Phase 2 - Export FEC
```typescript
// Dans delete-company Edge Function
if (requestData.export_requested) {
  // Appeler fonction pour générer export FEC
  const fecExport = await generateFecExport(company_id);
  // Uploader dans storage
  // Sauvegarder URL dans company_deletion_requests
}
```

### Phase 3 - Suppression réelle
```typescript
// Webhook/Cron job après 30 jours
// SELECT * FROM company_deletion_requests 
// WHERE status = 'approved' AND scheduled_deletion_at <= NOW()
// Pour chaque demande:
// 1. Supprimer les données non légales
// 2. Anonymiser les données légales (comptabilité)
// 3. Archiver dans legal_archive
// 4. Mettre à jour status = 'completed'
```

### Phase 4 - Notifications
```typescript
// Email aux propriétaires
// Email à l'approver pour demande approbation
// Email de confirmation après suppression
// Utiliser send-email Edge Function existante
```

---

## 🧪 Cas de test

### Test 1: Suppression simple
- [ ] User = only owner
- [ ] Clique supprimer
- [ ] Dialog montre "Seul propriétaire"
- [ ] Valide la raison
- [ ] Voir toast "Demande créée"
- [ ] Vérifier DB: status = 'approved'

### Test 2: Suppression avec consensus
- [ ] User A = owner
- [ ] Inviter User B = owner
- [ ] User A clique supprimer
- [ ] Dialog montre User B
- [ ] Valide la raison
- [ ] Vérifier DB: status = 'approval_pending'
- [ ] User B voit demande
- [ ] User B approuve
- [ ] Vérifier DB: status = 'approved'

### Test 3: Rejet
- [ ] Même setup que Test 2
- [ ] User B clique rejeter
- [ ] Vérifier DB: status = 'cancelled'
- [ ] User A voit demande annulée

### Test 4: Annulation avant approbation
- [ ] User A créé demande
- [ ] Status = 'approval_pending'
- [ ] User A clique annuler
- [ ] Vérifier DB: status = 'cancelled'

---

## 📈 Performance

- Requêtes simples: `<10ms`
- Récupération propriétaires: `<50ms`
- Création demande + approvals: `<200ms`
- Vérification consensus: `<100ms`

---

## 🐛 Gestion des erreurs

### Frontend
```typescript
// Erreurs gérées dans companyDeletionService
if (!user) throw new Error('Utilisateur non authentifié');
if (error) return { success: false, error: error.message };
if (data.error) return { success: false, error: data.error };
```

### Backend (Edge Functions)
```typescript
// Erreurs HTTP
401: "Non autorisé" (JWT invalide)
403: "Vous n'êtes pas propriétaire" (pas d'accès)
409: "Une demande existe déjà" (déjà en cours)
400: "company_id manquant" (paramètres invalides)
500: "Erreur serveur" (exception)
```

---

**Architecture complète et documentée ✅**
