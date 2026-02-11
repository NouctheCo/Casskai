# 🚨 Guide de déblocage - Rate Limit Auth Supabase

## Problème rencontré
- **Erreur**: `email rate limit exceeded` (erreur 429)
- **Cause**: Trop de tentatives d'inscription/connexion en peu de temps
- **Impact**: L'utilisateur ne peut pas se réinscrire

---

## ✅ Solutions (par ordre de préférence)

### Solution 1: Attendre l'expiration du rate limit ⏱️
**La plus simple et recommandée**

- **Durée**: 1 heure (généralement)
- **Action**: Demander à l'utilisateur de réessayer dans 60 minutes
- **Avantage**: Aucune manipulation nécessaire

---

### Solution 2: Augmenter les limites dans Supabase Dashboard 🎛️

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Authentication** → **Rate Limits**
4. Augmentez temporairement les limites pour `/auth/v1/signup`
5. Attendez quelques minutes
6. L'utilisateur peut réessayer

**Limites par défaut** (à ajuster si nécessaire):
```
/auth/v1/signup: 30 requêtes / heure par email
/auth/v1/token: 30 requêtes / heure par IP
```

---

### Solution 3: Nettoyage complet de l'utilisateur 🧹

**Si l'utilisateur doit être réinscrit immédiatement ET que le rate limit persiste**

#### Étapes:

1. **Ouvrir Supabase SQL Editor**
   - Dashboard → SQL Editor → New Query

2. **Exécuter le script de nettoyage**
   - Ouvrir: `supabase/migrations/ADMIN_CLEANUP_USER.sql`
   - **⚠️ IMPORTANT**: Remplacer `user@example.com` par l'email réel
   - Exécuter le script

3. **Attendre 5-10 minutes**
   - Laisser les caches Supabase se rafraîchir

4. **L'utilisateur peut se réinscrire**

---

### Solution 4: Utiliser l'Admin API Supabase 🔧

**Pour débloquer programmatiquement** (nécessite service_role key)

```javascript
// Dans backend/server.js ou via Postman
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // ⚠️ Service role key (secret!)
);

// Supprimer l'utilisateur
await supabaseAdmin.auth.admin.deleteUser('user-uuid-here');

// Ou supprimer par email
const { data: users } = await supabaseAdmin.auth.admin.listUsers();
const user = users.find(u => u.email === 'user@example.com');
if (user) {
  await supabaseAdmin.auth.admin.deleteUser(user.id);
}
```

---

## 🛡️ Prévention future

### 1. Implémenter un message d'erreur informatif

Dans votre code frontend (`src/components/Auth/SignUpForm.tsx` ou similaire):

```tsx
// Gérer l'erreur 429 spécifiquement
catch (error) {
  if (error?.status === 429 || error?.message?.includes('rate limit')) {
    toastError(
      'Trop de tentatives. Veuillez réessayer dans 1 heure.',
      { duration: 10000 }
    );
  } else {
    toastError('Erreur lors de l\'inscription');
  }
}
```

### 2. Ajouter un délai avant de permettre la réinscription

```tsx
// Stocker la dernière tentative dans localStorage
const lastSignupAttempt = localStorage.getItem('lastSignupAttempt');
const now = Date.now();
const oneHour = 60 * 60 * 1000;

if (lastSignupAttempt && (now - parseInt(lastSignupAttempt)) < oneHour) {
  toastError('Veuillez attendre avant de réessayer');
  return;
}

localStorage.setItem('lastSignupAttempt', now.toString());
```

### 3. Désactiver le bouton d'inscription temporairement

```tsx
const [isRateLimited, setIsRateLimited] = useState(false);

// Après une erreur 429
if (error?.status === 429) {
  setIsRateLimited(true);
  setTimeout(() => setIsRateLimited(false), 60 * 60 * 1000); // 1 heure
}

<Button disabled={isRateLimited || isLoading}>
  {isRateLimited ? 'Veuillez attendre (1h)' : 'S\'inscrire'}
</Button>
```

---

## 📊 Diagnostics

### Vérifier si l'utilisateur existe encore

```sql
-- Dans Supabase SQL Editor
SELECT id, email, created_at, confirmed_at, deleted_at
FROM auth.users
WHERE email = 'user@example.com';

-- Vérifier le profil
SELECT id, email, role, company_id
FROM user_profiles
WHERE email = 'user@example.com';
```

### Voir les tentatives récentes

```sql
-- Logs d'audit (si activés)
SELECT *
FROM audit_logs
WHERE details->>'email' = 'user@example.com'
ORDER BY created_at DESC
LIMIT 10;
```

---

## ⚠️ Notes importantes

1. **Service Role Key**: Ne jamais exposer cette clé côté client
2. **Suppression**: Le script SQL supprime TOUTES les données de l'utilisateur (irréversible)
3. **Rate Limits**: Ils protègent contre les abus, ne les désactivez pas complètement
4. **Cache**: Après suppression, attendre 5-10 minutes avant réinscription

---

## 🆘 En cas de blocage persistant

Si après toutes ces solutions le problème persiste:

1. Vérifier les logs Supabase: Dashboard → Logs → Auth Logs
2. Contacter le support Supabase avec:
   - L'email de l'utilisateur
   - Le timestamp de l'erreur
   - Les logs d'erreur complets
3. Vérifier les firewall/proxy qui pourraient bloquer les requêtes

---

**Recommandation immédiate pour votre cas:**
- ✅ **Solution 1 (Attendre 1h)** si pas urgent
- ✅ **Solution 3 (Script SQL)** si besoin immédiat + attendre 10 minutes avant réinscription
