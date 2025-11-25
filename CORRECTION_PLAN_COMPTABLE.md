# Correction du Plan Comptable - Instructions

## 🎯 Problème
Lorsque vous cliquez sur "Initialiser le plan comptable standard", le message indique **"0 comptes standards ont été créés"** au lieu de créer les comptes.

## 🔍 Diagnostic

### Étape 1 : Diagnostiquer le problème

1. Ouvrez le **SQL Editor** dans votre dashboard Supabase
2. Copiez et collez le contenu du fichier **`diagnostic_chart_of_accounts.sql`**
3. Exécutez le script
4. Lisez attentivement les messages affichés

Le script va vérifier :
- ✅ Si la table `chart_of_accounts_templates` existe et contient des données
- ✅ Si la fonction RPC `initialize_company_chart_of_accounts` existe
- ✅ L'état de votre base de données

### Exemple de résultat attendu :

```
✅ Table chart_of_accounts_templates existe
📊 Total templates: 483
🇫🇷 Templates FR (comptes détaillés): 256
✅ Fonction initialize_company_chart_of_accounts existe
✅ Table chart_of_accounts existe
📊 Comptes existants: 0

═══════════════════════════════════════════════
           RÉSUMÉ DU DIAGNOSTIC
═══════════════════════════════════════════════
Templates FR: ✅ OK
Fonction RPC: ✅ OK
═══════════════════════════════════════════════
🎉 Tout est prêt ! Vous pouvez initialiser le plan comptable.
```

## 🛠️ Solution

### Cas 1 : La fonction RPC est manquante

Si le diagnostic indique **"❌ Fonction initialize_company_chart_of_accounts n'existe pas !"** :

1. Ouvrez le fichier **`fix_chart_of_accounts_function.sql`**
2. Copiez tout le contenu
3. Collez-le dans le **SQL Editor** de Supabase
4. Exécutez le script
5. Vous devriez voir : **"✅ Fonction créée: OUI"**

### Cas 2 : Les templates sont manquants

Si le diagnostic indique **"⚠️ PROBLÈME: Aucun template FR trouvé !"** :

1. Allez dans le dossier `supabase/migrations/`
2. Trouvez le fichier `20251107000001_populate_chart_templates_all_countries_v2.sql`
3. Ouvrez-le et copiez tout le contenu
4. Collez-le dans le **SQL Editor** de Supabase
5. Exécutez-le (⚠️ Attention : ce fichier est volumineux, l'exécution peut prendre 10-30 secondes)

### Cas 3 : Tout est OK mais ça ne fonctionne pas

Si le diagnostic indique que tout est OK mais l'initialisation retourne toujours 0 :

**Possibilités :**
1. Les comptes sont peut-être déjà créés → Vérifiez avec :
   ```sql
   SELECT COUNT(*) FROM chart_of_accounts WHERE company_id = 'VOTRE_COMPANY_ID';
   ```

2. Le `country_code` de votre entreprise n'est pas 'FR' → Vérifiez avec :
   ```sql
   SELECT country_code FROM companies WHERE id = 'VOTRE_COMPANY_ID';
   ```

## 🧪 Test final

Une fois la correction appliquée :

1. Retournez dans l'interface CassKai
2. Allez dans **Comptabilité → Plan comptable**
3. Cliquez sur **"Initialiser le plan comptable standard"**
4. Vous devriez voir : **"256 comptes standard ont été créés"** (ou un nombre similaire)

## 📋 Résumé des fichiers créés

| Fichier | Description |
|---------|-------------|
| `diagnostic_chart_of_accounts.sql` | Script de diagnostic à exécuter en premier |
| `fix_chart_of_accounts_function.sql` | Crée/recrée la fonction RPC manquante |

## ❓ Questions fréquentes

### Q : Dois-je réinitialiser ma base de données ?
**R :** Non ! Ces scripts ne touchent qu'aux fonctions et templates du plan comptable. Vos données existantes ne seront pas affectées.

### Q : Que fait exactement la fonction `initialize_company_chart_of_accounts` ?
**R :** Elle copie les comptes depuis la table `chart_of_accounts_templates` (modèles) vers la table `chart_of_accounts` pour votre entreprise spécifique.

### Q : Puis-je l'exécuter plusieurs fois ?
**R :** Oui, sans danger. La fonction vérifie si les comptes existent déjà et ne crée pas de doublons.

### Q : Combien de comptes seront créés ?
**R :** Pour le plan comptable français (FR), environ **250-260 comptes détaillés** seront créés.

## 🎉 Prochaines étapes

Une fois le plan comptable initialisé, vous pourrez :
- ✅ Créer des écritures comptables
- ✅ Générer des bilans et compte de résultat
- ✅ Exporter en FEC (Fichier des Écritures Comptables)
- ✅ Personnaliser votre plan comptable

---

**Besoin d'aide ?** Exécutez d'abord le script de diagnostic et partagez-moi les messages affichés ! 🚀
