# Scripts de Nettoyage des Données de Test - CassKai

Ce dossier contient un ensemble de scripts pour nettoyer complètement les données de test avant d'effectuer un nouveau test d'onboarding complet dans CassKai.

## 📋 Vue d'ensemble

Lorsque vous testez le processus d'onboarding, des données sont créées dans :
- **Base de données Supabase** : entreprises, utilisateurs, comptes comptables, journaux, etc.
- **localStorage navigateur** : cache d'onboarding, configuration, tokens
- **sessionStorage** : données de session temporaires
- **Cookies** : tokens d'authentification
- **Fichiers locaux** : sessions d'authentification stockées

Ces scripts permettent de tout nettoyer pour repartir sur un environnement propre.

## 🚀 Script Principal (Recommandé)

### `reset-onboarding-test.js`
**Script maître qui orchestre tout le processus de nettoyage.**

```bash
# Utilisation basique avec confirmation
node scripts/reset-onboarding-test.js

# Simulation pour voir ce qui serait fait
node scripts/reset-onboarding-test.js --dry-run

# Nettoyage automatique sans confirmation
node scripts/reset-onboarding-test.js --force

# Nettoyage d'un utilisateur spécifique
node scripts/reset-onboarding-test.js --user-email=test@example.com

# Mode silencieux
node scripts/reset-onboarding-test.js --quiet --force
```

**Options disponibles :**
- `--dry-run` : Simule les actions sans les exécuter
- `--skip-db` : Ignore le nettoyage de la base de données
- `--skip-files` : Ignore le nettoyage des fichiers locaux
- `--user-email=x` : Nettoie seulement un utilisateur spécifique
- `--quiet` : Mode silencieux (moins de sortie)
- `--force` : Force l'exécution sans confirmation

## 🔧 Scripts Spécialisés

### `cleanup-test-data.js`
**Nettoyage avancé de la base de données Supabase.**

```bash
# Nettoyage complet avec confirmation
node scripts/cleanup-test-data.js

# Simulation
node scripts/cleanup-test-data.js --dry-run

# Nettoyage ciblé d'un utilisateur
node scripts/cleanup-test-data.js --user-email=user@test.com

# Nettoyage automatique
node scripts/cleanup-test-data.js --confirm
```

**Ce qu'il fait :**
- Supprime les entreprises de test (noms contenant "Test", "Demo", SIRET factices)
- Supprime les utilisateurs de test (@test.com, @test.example, etc.)
- Nettoie toutes les données comptables associées (journaux, comptes, écritures)
- Supprime les factures, achats, contrats de test
- Génère un script SQL de sauvegarde

### `cleanup-browser-data.js`
**Instructions pour nettoyer le navigateur.**

```bash
node scripts/cleanup-browser-data.js
```

**Ce qu'il fait :**
- Génère un fichier HTML interactif (`cleanup-browser.html`)
- Fournit les commandes JavaScript pour nettoyer localStorage/sessionStorage
- Donne les instructions pour vider le cache navigateur
- Crée un script tout-en-un à coller dans la console

### `validate-clean-state.js`
**Validation que le nettoyage a fonctionné.**

```bash
node scripts/validate-clean-state.js
```

**Ce qu'il vérifie :**
- Connexion à Supabase
- Absence de données de test en base
- Propreté des fichiers locaux
- Configuration de l'environnement
- Santé des services (Auth, Database, Storage)

## 📄 Scripts SQL

### `supabase/cleanup-test-onboarding.sql`
**Script SQL pour nettoyage direct en base.**

À utiliser dans l'éditeur SQL de Supabase :

1. Ouvrir Supabase Dashboard
2. Aller dans SQL Editor
3. Coller le script par sections
4. Exécuter étape par étape pour plus de sécurité

**Sections disponibles :**
- Vérification des données à supprimer
- Nettoyage des tables dans l'ordre (respect des contraintes FK)
- Vérification post-nettoyage
- Fonction de nettoyage automatique récurrente

## 🛠️ Configuration Requise

### Variables d'environnement
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Pour cleanup-test-data.js
```

### Dépendances Node.js
```bash
npm install @supabase/supabase-js
```

### Structure de fichiers requise
```
scripts/
├── cleanup-test-data.js
├── cleanup-browser-data.js
├── validate-clean-state.js
├── reset-onboarding-test.js
└── README-CLEANUP.md

supabase/
└── cleanup-test-onboarding.sql
```

## 📊 Patterns de Données de Test Détectés

### Entreprises de test
- Noms : `Test %`, `%Test%`, `Demo %`, `%Demo%`, `Entreprise de test%`
- SIRET : `12345678901234`, `00000000000000`, `11111111111111`

### Utilisateurs de test
- Emails : `%@test.com`, `%@test.example`, `%@demo.com`, `%+test@%`

### Données localStorage
- Clés : `casskai_*`, `supabase.*`, `sb-*`

### Cookies
- Noms : `sb-access-token`, `sb-refresh-token`, `casskai-session`

## 🔄 Workflow Recommandé

### Pour un Test d'Onboarding Complet

1. **Préparation**
   ```bash
   # Vérifier l'état actuel
   node scripts/validate-clean-state.js
   ```

2. **Nettoyage Complet**
   ```bash
   # Réinitialisation complète (recommandé)
   node scripts/reset-onboarding-test.js
   
   # Ou étape par étape
   node scripts/cleanup-test-data.js --confirm
   node scripts/cleanup-browser-data.js
   ```

3. **Actions Navigateur**
   - Ouvrir le fichier `scripts/cleanup-browser.html`
   - Cliquer sur "Nettoyer les Données CassKai"
   - Ou exécuter manuellement dans la console :
   ```javascript
   Object.keys(localStorage)
     .filter(key => key.startsWith('casskai_') || key.startsWith('supabase.'))
     .forEach(key => localStorage.removeItem(key));
   sessionStorage.clear();
   ```

4. **Validation**
   ```bash
   node scripts/validate-clean-state.js
   ```

5. **Redémarrage**
   ```bash
   # Redémarrer le serveur de dev
   npm run dev
   ```

6. **Test**
   - Ouvrir l'application dans un nouvel onglet
   - Vérifier l'accès à la page d'accueil
   - Commencer l'onboarding

### Pour un Nettoyage Ciblé

Si vous voulez nettoyer seulement un utilisateur de test spécifique :

```bash
node scripts/reset-onboarding-test.js --user-email=test@example.com
```

## 🐛 Dépannage

### Erreur "Variables d'environnement manquantes"
Vérifiez votre fichier `.env` :
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Erreur "Impossible de se connecter à Supabase"
1. Vérifiez que votre projet Supabase est démarré
2. Vérifiez les URLs et clés dans `.env`
3. Testez la connexion manuellement dans le navigateur

### "Certaines données de test subsistent"
1. Exécutez le script SQL directement dans Supabase
2. Vérifiez les patterns de détection dans les scripts
3. Ajustez les conditions si nécessaire

### Application "bloquée" après nettoyage
1. Videz complètement le cache navigateur (Ctrl+Shift+Delete)
2. Testez en navigation privée
3. Redémarrez le serveur de développement
4. Vérifiez les logs de la console navigateur

## 📝 Logs et Rapports

### Logs de fonctionnement
Tous les scripts génèrent des logs détaillés indiquant :
- ✅ Opérations réussies
- ⚠️  Avertissements
- ❌ Erreurs

### Rapports générés
- `reset-report-*.json` : Rapport détaillé de la réinitialisation
- `cleanup-test-data-*.sql` : Script SQL de sauvegarde des suppressions
- `cleanup-browser.html` : Interface interactive de nettoyage navigateur

## 🔒 Sécurité et Bonnes Pratiques

### ⚠️ Avertissements Importants
- **JAMAIS en production** : Ces scripts sont uniquement pour le développement/test
- **Sauvegarde recommandée** : Les suppressions sont définitives
- **Test en dry-run** : Toujours tester avec `--dry-run` d'abord

### Bonnes Pratiques
1. Toujours utiliser `--dry-run` pour voir ce qui sera supprimé
2. Sauvegarder les données importantes avant nettoyage
3. Tester le nettoyage sur un utilisateur spécifique d'abord
4. Valider l'état après nettoyage avec `validate-clean-state.js`
5. Documenter les modifications de patterns de détection

## 🚀 Développement et Personnalisation

### Ajouter de nouveaux patterns de détection
Modifiez la section `TEST_PATTERNS` dans `cleanup-test-data.js` :

```javascript
TEST_PATTERNS: {
  enterprises: [
    'Test %',
    '%Test%', 
    'VotreNouveauPattern%'
  ],
  users: [
    '%@test.com',
    '%@votre-domaine-test.com'
  ]
}
```

### Ajouter de nouvelles tables à nettoyer
Modifiez `CLEANUP_ORDER` dans l'ordre inverse des dépendances :

```javascript
CLEANUP_ORDER: [
  'nouvelle_table_dependante',
  'journal_entry_items',
  'journal_entries',
  // ... reste de la liste
]
```

### Personnaliser la validation
Ajoutez de nouveaux checks dans `validate-clean-state.js` :

```javascript
const checks = [
  {
    name: 'Ma nouvelle vérification',
    table: 'ma_table',
    condition: 'ma_condition SQL'
  }
];
```

---

💡 **Conseil** : Gardez ce README à jour quand vous modifiez les scripts ou ajoutez de nouveaux patterns de test.