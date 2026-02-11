# 🔧 Guide d'Investigation: Erreurs Edge Function (RLS, 403, etc.)

**Utilisé pour résoudre:** Erreur 403 "Company not found or access denied" dans ai-assistant

---

## 📋 Quick Reference: Les 5 Pièges Courants

| Piège | Symptôme | Solution |
|-------|----------|----------|
| `.single()` sans erreur handling | 500 ou 403 silencieux | Utiliser `.maybeSingle()` |
| Token JWT vide/invalide | RLS renvoie `null` | Valider le token avant utilisation |
| RLS policy trop restrictive | Toutes requêtes retournent `null` | Vérifier `SELECT auth.uid()` |
| Pas de gestion d'erreur sur requête | Impossible diagnostiquer | Vérifier `error` field de tous les `.select()` |
| Message d'erreur générique (403) | Impossible savoir cause réelle | Ajouter `details` field avec `.message` |

---

## 🔍 Workflow de Diagnostic

### **Étape 1: Lire les logs Supabase**

```bash
# Terminal
supabase functions debug ai-assistant
```

**Chercher:**
- `[ai-assistant] User authenticated:` ← Vérifier que le user_id est présent
- `[getCompanyContext] RLS Error:` ← Vérifier le code d'erreur (42501 = permission denied)
- `[getCompanyContext] User access denied:` ← Vérifier s'il y a `user_companies` record

**Exemple log d'erreur:**
```
[getCompanyContext] RLS Error fetching user_companies: {
  "error": "permission denied for table user_companies",
  "code": "42501",
  "details": "relation \"user_companies\" does not exist"
}
```

**Signification:**
- Code 42501 = PostgreSQL permission denied error
- Table `user_companies` n'existe pas OU RLS policy bloque l'accès

---

### **Étape 2: Vérifier le JWT Token**

```sql
-- Supabase SQL Editor
-- Remplacer USER_ID par le user_id du log
SELECT 
  id, 
  email, 
  last_sign_in_at,
  created_at
FROM auth.users
WHERE id = 'a1b2c3d4-e5f6...';
```

**Chercher:**
- ✅ User existe
- ✅ `last_sign_in_at` est récent (< 1 heure)
- ✅ Pas de `email_confirmed_at` NULL (sauf si email non vérifié)

**Si user n'existe pas:**
- Vérifier que le token JWT vient bien d'un user authentifié
- Token peut être expiré ou forgé

---

### **Étape 3: Vérifier l'accès `user_companies`**

```sql
-- Supabase SQL Editor
SELECT 
  user_id, 
  company_id, 
  is_active,
  role,
  created_at
FROM user_companies
WHERE user_id = 'a1b2c3d4-e5f6...'
  AND is_active = true;
```

**Chercher:**
- ✅ Au moins 1 row
- ✅ `is_active = true`
- ✅ `company_id` correspond à celui envoyé en payload

**Si 0 rows:**
- User n'est pas lié à cette société
- Aller à l'étape 4

**Si >1 rows:**
- C'est OK (user peut avoir plusieurs sociétés)

---

### **Étape 4: Vérifier la société existe**

```sql
-- Supabase SQL Editor
SELECT 
  id, 
  name, 
  is_active, 
  status,
  owner_id,
  created_at
FROM companies
WHERE id = 'eec8ddf3-6481-4089-ba17-1e69dfe6a9cb';
```

**Chercher:**
- ✅ Company existe
- ✅ `is_active = true`
- ✅ `status = 'active'`

**Si company n'existe pas:**
- Erreur légitime 403
- Vérifier le `company_id` envoyé par le frontend

---

### **Étape 5: Tester la RLS Policy Manuellement**

```sql
-- Supabase SQL Editor
-- IMPORTANT: Exécuter AVEC le user token (pas comme admin)

-- Option A: Via CLI
supabase sql --file - <<EOF
  SET request.jwt.claims = '{"sub": "a1b2c3d4-e5f6...", "role": "authenticated"}';
  SELECT * FROM user_companies WHERE user_id = 'a1b2c3d4-e5f6...';
EOF

-- Option B: Via Supabase JS client (dans le frontend console)
const { data, error } = await supabase
  .from('user_companies')
  .select('*')
  .eq('user_id', user.id)
  .eq('is_active', true);
console.log({ data, error });
```

**Résultat attendu:**
- ✅ Retourne les rows associées au user
- ✅ Pas d'erreur 42501

**Erreur courante: "permission denied"**
- RLS policy est bloquée
- Vérifier les RLS policies:

```sql
SELECT * FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_companies';
```

Chercher une policy `SELECT` avec `USING (user_id = auth.uid())`

---

### **Étape 6: Vérifier le Payload Envoyé**

**Dans le Frontend Console (Chrome DevTools):**
```javascript
// Vérifier la requête POST
// 1. Ouvrir DevTools (F12)
// 2. Aller dans Network tab
// 3. Faire une requête IA
// 4. Chercher la requête POST vers https://.../functions/v1/ai-assistant
// 5. Vérifier le payload:

{
  "query": "...",
  "context": {
    "companyId": "eec8ddf3-6481-4089-ba17-1e69dfe6a9cb",  // ✅ Doit être présent
    "currentPage": "dashboard",
    "ui": { ... }
  }
}
```

**Chercher:**
- ✅ `Authorization` header avec Bearer token
- ✅ `context.companyId` est présent (sinon auto-resolution via user_companies)
- ✅ Token est pas vide

---

## 🛠️ Outils de Debugging

### **1. Logs Supabase (Real-time)**
```bash
supabase functions debug ai-assistant --tail
```

### **2. Logs Locals (Deno)**
Les logs `console.log()` dans la fonction apparaissent dans:
```bash
supabase start  # Voir les logs dans le terminal
```

### **3. Test via curl (depuis terminal)**
```bash
# Remplacer USER_TOKEN par un vrai token
curl -X POST https://smtdtgrymuzwvctattmx.supabase.co/functions/v1/ai-assistant \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Quelles sont mes factures?",
    "context": {
      "companyId": "eec8ddf3-6481-4089-ba17-1e69dfe6a9cb"
    }
  }'
```

### **4. Test via Frontend Console**
```javascript
// Dans le browser console (Ctrl+Shift+K)
const user = await supabase.auth.getUser();
const token = (await supabase.auth.getSession()).data.session.access_token;

fetch('https://smtdtgrymuzwvctattmx.supabase.co/functions/v1/ai-assistant', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'Quelles sont mes factures?',
    context: {
      companyId: user.data.user.user_metadata?.company_id
    }
  })
})
  .then(r => r.json())
  .then(d => console.log(d));
```

---

## 🔐 Checklist: Avant de blâmer le Code

Avant de modifier le code, vérifier ces points:

- [ ] User est authentifié (`supabase.auth.getUser()` retourne un user)
- [ ] User a une entry dans `user_companies` avec `is_active=true`
- [ ] La société existe en DB avec `is_active=true` et `status='active'`
- [ ] Le JWT token n'est pas expiré
- [ ] Les RLS policies existent et sont correctes
- [ ] Le `company_id` envoyé correspond à une société existante
- [ ] Les Edge Functions ont été redéployées après les changements
- [ ] Les logs Supabase montrent les nouveaux `console.log()`

---

## 🚨 Erreurs Courantes & Solutions

### **Erreur: "permission denied for table user_companies" (code 42501)**

**Cause:** RLS policy manquante ou incorrecte

**Solution:**
```sql
-- Créer la RLS policy
CREATE POLICY "user_companies_select" ON public.user_companies
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```

---

### **Erreur: "relation user_companies does not exist"**

**Cause:** Table n'existe pas ou mal nommée

**Solution:**
1. Vérifier le nom exact: `SELECT * FROM information_schema.tables WHERE table_name = 'user_companies';`
2. Vérifier la migration a été appliquée: `supabase db list`

---

### **Erreur: JWT token invalide (401 Unauthorized)**

**Cause:** Token vide, expiré, ou pas de header Authorization

**Solution:**
1. Vérifier le header: `Authorization: Bearer <token>`
2. Vérifier token pas vide: `token.length > 50`
3. Vérifier token pas expiré: `const decoded = JSON.parse(atob(token.split('.')[1])); console.log(decoded.exp)`

---

### **Erreur: Tout fonctionne sauf les données contexte (articles, factures) sont vides**

**Cause:** RLS policies bloquent les requêtes de contexte

**Solution:**
```typescript
// Ajouter du logging pour chaque requête
const { data: invoices, error: invoicesError } = await supabase
  .from('invoices')
  .select('...')
  .eq('company_id', companyId);

if (invoicesError) {
  console.error('RLS Error fetching invoices:', {
    error: invoicesError.message,
    code: invoicesError.code,
    hint: invoicesError.hint
  });
}
```

---

## 📚 Resources

- **Supabase RLS Docs:** https://supabase.com/docs/guides/auth/row-level-security
- **JWT Token Decoder:** https://jwt.io/
- **PostgreSQL Error Codes:** https://www.postgresql.org/docs/current/errcodes-appendix.html
- **Supabase Functions Docs:** https://supabase.com/docs/guides/functions

---

## 💡 Tips & Tricks

### **Activer le debug mode complet:**
```typescript
// Dans la fonction Edge
const DEBUG = true; // ou Deno.env.get('DEBUG') === 'true'

if (DEBUG) {
  console.log('[DEBUG] Full request:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    body: body
  });
}
```

### **Tester RLS sans redéployer:**
```javascript
// Frontend console
const { data, error } = await supabase.from('user_companies').select('*');
if (error) console.log('RLS Error:', error);
else console.log('Success:', data);
```

### **Analyser les logs en temps réel:**
```bash
supabase functions debug ai-assistant --tail | grep -i "error\|warning\|rls"
```

---

## 🎯 Summary

**Pour toute erreur 403 ou RLS:**

1. ✅ Consulter les logs: `supabase functions debug ai-assistant --tail`
2. ✅ Vérifier user existe et a un token valide
3. ✅ Vérifier user_companies a une entry active
4. ✅ Vérifier la société existe
5. ✅ Tester la RLS policy manuellement
6. ✅ Vérifier le payload envoyé par le frontend
7. ✅ Redéployer la fonction si code modifié
8. ✅ Ajouter du logging détaillé dans le code

**Ne pas oublier:** Toujours vérifier les logs d'abord!
