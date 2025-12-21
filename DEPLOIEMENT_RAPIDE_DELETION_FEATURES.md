# 🚀 GUIDE RAPIDE - Déployer aujourd'hui

## ⚡ 5 étapes pour déployer en 30 minutes

### Étape 1: Exécuter la migration SQL (5 min)

1. Allez à https://app.supabase.com
2. Sélectionnez votre projet
3. Cliquez sur "SQL Editor"
4. Créez une nouvelle requête
5. Copiez/collez le contenu de ce fichier :
   ```
   supabase/migrations/20251217_create_deletion_requests_tables.sql
   ```
6. Cliquez sur "Run"
7. Attendez la confirmation ✅

### Étape 2: Vérifier les tables (2 min)

Exécutez ce script PowerShell :

```powershell
cd c:\Users\noutc\Casskai
$env:SUPABASE_SERVICE_KEY='<votre-clé-service>'
node scripts/check-supabase-deletion-tables.cjs
```

Résultat attendu : Toutes les tables en ✅

### Étape 3: Déployer les Edge Functions (10 min)

Depuis le terminal du projet :

```bash
# Déployer delete-company
supabase functions deploy delete-company

# Vérifier
supabase functions logs delete-company --limit 20

# Déployer approve-company-deletion
supabase functions deploy approve-company-deletion

# Vérifier
supabase functions logs approve-company-deletion --limit 20
```

### Étape 4: Relancer le frontend (3 min)

```bash
# Si le serveur est déjà lancé, arrêtez-le (Ctrl+C)
# Puis relancez
npm run dev
```

### Étape 5: Tester rapidement (10 min)

1. Connectez-vous dans l'app
2. Allez dans **Settings** (⚙️)
3. Cliquez sur l'onglet **Entreprise**
4. Scroll vers le bas
5. Cliquez sur le bouton rouge **"Supprimer l'entreprise"**
6. Vérifiez que le dialog s'affiche correctement

---

## ✅ Checklist post-déploiement

- [ ] Tables créées dans Supabase
- [ ] Script check retourne tous les ✅
- [ ] Edge Functions déployées et en ligne
- [ ] Frontend relancé
- [ ] Bouton suppression apparaît
- [ ] Dialog de suppression fonctionne
- [ ] Demande crée sans erreur

---

## 🆘 Erreurs courantes et solutions

### ❌ "Table account_deletion_requests n'existe pas"
**Solution:** Vous avez oublié de créer les tables. Ré-exécutez l'étape 1.

### ❌ "Edge Function returns 404"
**Solution:** La fonction n'est pas déployée. Vérifiez avec `supabase functions list`

### ❌ "SUPABASE_SERVICE_KEY non définie"
**Solution:** Récupérez la clé depuis Supabase Settings > API > Service Role Key

### ❌ "Le dialog de suppression ne s'affiche pas"
**Solution:** Relancez le serveur frontend avec `npm run dev`

---

## 📊 Vérifier en SQL

Pour s'assurer que tout est en place :

```sql
-- 1. Vérifier les tables
SELECT COUNT(*) as tables_created FROM information_schema.tables 
WHERE table_name IN ('account_deletion_requests', 'company_deletion_requests', 'company_deletion_approvals')
AND table_schema = 'public';

-- Résultat attendu: 3

-- 2. Vérifier les fonctions
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('can_user_delete_account', 'get_company_deletion_approvals')
AND routine_schema = 'public';

-- Résultat attendu: 2 lignes

-- 3. Voir une demande de test
SELECT * FROM company_deletion_requests LIMIT 1;

-- Résultat attendu: peut être vide (normal si pas encore de demande)
```

---

## 🎬 Tester la suppression

### Scénario 1: Suppression simple (seul propriétaire)
1. Allez dans Settings > Entreprise
2. Cliquez "Supprimer l'entreprise"
3. Le dialog doit dire "Seul propriétaire - Demande approuvée"
4. Remplissez la raison (optionnel)
5. Cliquez "Confirmer la suppression"
6. Vous devez voir le toast ✅ "Demande créée"

### Scénario 2: Suppression avec approbation (si plusieurs owners)
1. Invitez un autre utilisateur comme propriétaire
2. Allez dans Settings > Entreprise
3. Cliquez "Supprimer l'entreprise"
4. Le dialog doit montrer l'autre propriétaire
5. Cliquez "Confirmer la suppression"
6. Connectez-vous avec l'autre compte
7. Allez dans Dashboard et cherchez les "Approbations en attente"
8. Approuvez ou rejetez

---

## 🔐 Sécurité - Points à vérifier

- [ ] Les tables ont les policies RLS activées
- [ ] Les Edge Functions requièrent un JWT valide
- [ ] Chaque utilisateur ne voit que ses propres demandes
- [ ] Un propriétaire ne peut pas supprimer seul (si autres co-owners)

---

## 📞 Besoin d'aide?

Si ça n'avance pas :
1. Vérifiez les logs Supabase : https://app.supabase.com > Functions > Logs
2. Vérifiez le navigateur : Ouvrez DevTools (F12) > Console > Cherchez les erreurs
3. Vérifiez la base de données : Sql Editor > Vérifiez les requêtes

---

**Temps estimé total: 30 minutes ⏱️**
