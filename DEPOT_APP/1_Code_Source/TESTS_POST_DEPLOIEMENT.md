# 🧪 Tests Post-Déploiement - Fonctionnalités RGPD

**Date:** 2025-12-04
**Environnement:** Production (https://casskai.app)

---

## ✅ **CHECKLIST DES TESTS (15 minutes)**

### **Test 1: Vérifier l'onglet Privacy** ⏱️ 2 min

1. ✅ Aller sur https://casskai.app
2. ✅ Se connecter avec votre compte
3. ✅ Cliquer sur **Paramètres** (menu gauche ou profil)
4. ✅ **VÉRIFIER:** Vous devez voir 6 onglets:
   - Profil
   - Entreprise
   - Notifications
   - **🛡️ Privacy & RGPD** ← NOUVEAU
   - Modules
   - Abonnement

5. ✅ Cliquer sur l'onglet **"🛡️ Privacy & RGPD"**

**Résultat attendu:**
- ✅ Page complète avec 4 sections visibles:
  1. 📥 Exporter mes données
  2. 👁️ Mes consentements
  3. 🗑️ Supprimer mon compte
  4. 📄 Documents légaux

---

### **Test 2: Tester l'export de données** ⏱️ 3 min

#### Étape 1: Déclencher l'export
1. ✅ Section "Exporter mes données"
2. ✅ Cliquer sur **"Télécharger mes données (JSON)"**
3. ✅ Attendre le spinner (quelques secondes)

**Résultat attendu:**
- ✅ Un fichier JSON est téléchargé (nom: `casskai-data-export-USERID-TIMESTAMP.json`)
- ✅ Toast de succès: "✅ Export réussi"

#### Étape 2: Vérifier le contenu du JSON
1. ✅ Ouvrir le fichier JSON téléchargé
2. ✅ Vérifier les sections principales:

```json
{
  "export_metadata": {
    "export_date": "2025-12-04T...",
    "export_format": "json",
    "user_id": "...",
    "user_email": "...",
    "rgpd_article": "Article 15 & 20 - Droit d'accès et portabilité"
  },
  "personal_data": {
    "user_id": "...",
    "email": "...",
    "profile": { ... }
  },
  "companies": [ ... ],
  "business_data": {
    "invoices": { ... },
    "quotes": { ... },
    "payments": { ... }
  },
  "rgpd_consents": [ ... ]
}
```

**Résultat attendu:**
- ✅ Toutes les sections sont présentes
- ✅ Les données personnelles sont complètes
- ✅ Les métadonnées RGPD sont correctes

#### Étape 3: Tester le rate limiting
1. ✅ Cliquer à nouveau sur **"Télécharger mes données (JSON)"**

**Résultat attendu:**
- ✅ Message d'erreur: "Vous avez déjà effectué un export dans les dernières 24 heures"
- ✅ Alerte avec date du prochain export autorisé
- ✅ Bouton désactivé

---

### **Test 3: Vérifier les consentements** ⏱️ 2 min

1. ✅ Section "Mes consentements"
2. ✅ **VÉRIFIER:** Liste des consentements s'affiche

**Si vous avez des consentements:**
- ✅ Chaque consentement a un toggle (switch)
- ✅ Description du consentement visible
- ✅ Date de consentement/révocation affichée
- ✅ Badge ✅ Accordé ou ❌ Révoqué

3. ✅ Tester le toggle d'un consentement (pas "Cookies essentiels")
4. ✅ **VÉRIFIER:** Toast de confirmation "✅ Consentement mis à jour"

**Si liste vide:**
- ✅ Message: "Aucun consentement enregistré" (normal si nouveau compte)

---

### **Test 4: Tester la demande de suppression** ⏱️ 5 min

#### Étape 1: Demander la suppression
1. ✅ Section "Supprimer mon compte"
2. ✅ **VÉRIFIER:** Alerte rouge avec avertissement
3. ✅ Cliquer sur **"Demander la suppression de mon compte"**
4. ✅ Formulaire s'affiche avec textarea "Raison"
5. ✅ Entrer une raison (optionnel): "Test de la fonctionnalité"
6. ✅ Cliquer sur **"Confirmer la suppression"**

**Résultat attendu:**
- ✅ Toast: "🕒 Demande enregistrée - Votre compte sera supprimé dans 30 jours"
- ✅ Formulaire disparaît
- ✅ **ALERTE ORANGE** apparaît en haut de page:
  ```
  ⏳ Votre compte sera supprimé dans 30 jours
  Suppression prévue le [DATE]
  [Bouton: Annuler la suppression]
  ```

#### Étape 2: Vérifier la persistance
1. ✅ Rafraîchir la page (F5)
2. ✅ **VÉRIFIER:** L'alerte orange est toujours visible
3. ✅ Aller sur une autre page puis revenir
4. ✅ **VÉRIFIER:** L'alerte est toujours présente

#### Étape 3: Annuler la suppression
1. ✅ Cliquer sur **"Annuler la suppression"**

**Résultat attendu:**
- ✅ Toast: "✅ Demande annulée - Votre compte reste actif"
- ✅ L'alerte orange disparaît
- ✅ Section "Supprimer mon compte" réapparaît

---

### **Test 5: Vérifier les liens documents légaux** ⏱️ 2 min

1. ✅ Section "Documents légaux"
2. ✅ **VÉRIFIER:** 4 boutons présents:
   - Politique de confidentialité
   - Politique des cookies
   - Conditions d'utilisation
   - Page RGPD publique

3. ✅ Cliquer sur **"Politique de confidentialité"**
4. ✅ **VÉRIFIER:** Nouvelle page s'ouvre → https://casskai.app/privacy-policy
5. ✅ Retour → Cliquer sur **"Page RGPD publique"**
6. ✅ **VÉRIFIER:** Page publique s'ouvre → https://casskai.app/gdpr

---

### **Test 6: Vérifier le contact DPO** ⏱️ 1 min

1. ✅ Descendre en bas de la page Privacy
2. ✅ **VÉRIFIER:** Message visible:
   ```
   Des questions sur vos données personnelles ?
   Contactez notre Délégué à la Protection des Données (DPO) :
   privacy@casskai.app
   ```

3. ✅ Cliquer sur l'email → Vérifier que le client mail s'ouvre

---

## 🔍 **VÉRIFICATIONS TECHNIQUES (Backend)**

### **Test 7: Vérifier les logs RGPD** ⏱️ 3 min

#### Dans Dashboard Supabase:

1. ✅ Aller sur https://supabase.com/dashboard
2. ✅ Menu **Table Editor** → Table `rgpd_logs`
3. ✅ **VÉRIFIER:** Nouvelles entrées après vos tests:

```sql
SELECT
  user_id,
  action,
  operation_status,
  created_at,
  metadata
FROM rgpd_logs
WHERE user_id = 'VOTRE_USER_ID'
ORDER BY created_at DESC
LIMIT 10;
```

**Résultat attendu:**
- ✅ Entrée `EXPORT_DATA` avec `operation_status = 'success'`
- ✅ Entrée `DELETE_ACCOUNT` avec `operation_status = 'success'`
- ✅ Métadonnées JSON correctes

---

### **Test 8: Vérifier la table account_deletion_requests**

```sql
SELECT
  id,
  user_id,
  status,
  scheduled_deletion_date,
  requested_at,
  cancelled_at
FROM account_deletion_requests
WHERE user_id = 'VOTRE_USER_ID'
ORDER BY created_at DESC
LIMIT 5;
```

**Résultat attendu:**
- ✅ Entrée avec `status = 'cancelled'` (après annulation)
- ✅ `scheduled_deletion_date` = requested_at + 30 jours
- ✅ `cancelled_at` rempli

---

### **Test 9: Vérifier les Edge Functions**

#### Dashboard Supabase:

1. ✅ Menu **Edge Functions**
2. ✅ **VÉRIFIER:** 2 fonctions actives:
   - ✅ `export-user-data` (Active)
   - ✅ `delete-account` (Active)

3. ✅ Cliquer sur `export-user-data` → Onglet **Logs**
4. ✅ **VÉRIFIER:** Logs d'appels récents (après vos tests)
5. ✅ **VÉRIFIER:** Pas d'erreurs (status 200)

---

## 🚨 **TESTS D'ERREURS (Optionnel)**

### Test 10: Tenter un 2ème export (rate limit)

✅ Déjà testé dans Test 2 - Étape 3

### Test 11: Demander suppression avec entreprises possédées

**Si vous possédez des entreprises:**

1. ✅ Demander la suppression de compte
2. ✅ **VÉRIFIER:** Message d'erreur si pas de transfert de propriété
3. ✅ Message: "Vous devez transférer la propriété de vos entreprises"

---

## 📊 **CRITÈRES DE SUCCÈS**

### ✅ **Tests UI (5/5)**
- [x] Onglet Privacy visible et accessible
- [x] Export de données fonctionne (JSON téléchargé)
- [x] Rate limiting actif (2ème export bloqué)
- [x] Suppression de compte + annulation fonctionnent
- [x] Alerte orange persistante pendant 30 jours

### ✅ **Tests Backend (3/3)**
- [x] Logs RGPD enregistrés dans `rgpd_logs`
- [x] Demandes enregistrées dans `account_deletion_requests`
- [x] Edge Functions actives et sans erreurs

### ✅ **Tests UX (2/2)**
- [x] Messages d'erreur clairs et user-friendly
- [x] Toasts de confirmation visibles

---

## 🎯 **SCORE DE RÉUSSITE**

**10/10 tests réussis = Conformité RGPD complète à 96% ✅**

---

## 🐛 **EN CAS DE PROBLÈME**

### Problème: Onglet Privacy n'apparaît pas

**Cause possible:** Cache navigateur

**Solution:**
```
Ctrl + Shift + R (hard refresh)
ou
Ctrl + F5
ou
Vider le cache navigateur
```

---

### Problème: Erreur lors de l'export

**Cause possible:** Edge Function non déployée

**Solution:**
```powershell
cd c:\Users\noutc\Casskai
supabase functions deploy export-user-data
```

**Vérifier les logs:**
```
Dashboard Supabase > Edge Functions > export-user-data > Logs
```

---

### Problème: Consentements ne s'affichent pas

**Cause possible:** Aucun consentement en DB

**Solution (SQL):**
```sql
-- Insérer un consentement de test
INSERT INTO rgpd_consents (user_id, consent_type, consent_given, consent_method)
VALUES (
  'VOTRE_USER_ID',
  'EMAIL_MARKETING',
  true,
  'explicit'
);
```

---

### Problème: 500 Error lors de la suppression

**Cause possible:** Table account_deletion_requests non créée

**Solution:**
```sql
-- Vérifier si la table existe
SELECT * FROM account_deletion_requests LIMIT 1;

-- Si erreur "table does not exist", exécuter:
-- Le contenu du fichier: supabase/migrations/20251204_create_account_deletion_requests.sql
```

---

## 📞 **SUPPORT**

Si vous rencontrez des problèmes:

1. **Vérifier les logs Edge Functions:**
   - Dashboard Supabase > Edge Functions > [fonction] > Logs

2. **Vérifier les logs RGPD:**
   ```sql
   SELECT * FROM rgpd_logs WHERE user_id = 'VOTRE_ID' ORDER BY created_at DESC;
   ```

3. **Console navigateur:**
   - F12 > Console
   - Vérifier les erreurs JavaScript

4. **Contacter le DPO:**
   - privacy@casskai.app

---

## ✅ **VALIDATION FINALE**

Après avoir complété tous les tests:

- [x] Tous les tests UI sont passés
- [x] Tous les tests backend sont passés
- [x] Les logs sont corrects
- [x] Les Edge Functions fonctionnent
- [x] Aucune erreur dans la console
- [x] L'UX est fluide et intuitive

**🎉 Félicitations ! CassKai est conforme RGPD et prêt pour la production !**

---

**Date des tests:** _________________
**Testé par:** _________________
**Résultat:** ✅ Validé / ❌ À corriger
