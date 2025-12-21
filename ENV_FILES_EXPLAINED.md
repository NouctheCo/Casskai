# Explication des Fichiers .env dans Vite/React

**Date**: 6 décembre 2025
**Status**: ✅ Configuration OpenAI correcte

---

## 📋 Votre Configuration Actuelle

Vous avez configuré `VITE_OPENAI_API_KEY` dans 3 fichiers:

1. ✅ `.env` - Configuration de base (committed dans Git)
2. ✅ `.env.local` - Configuration locale de développement
3. ✅ `.env.production` - Configuration pour le build de production

**Votre clé OpenAI**: `sk-svcacct-1hiU...` (présente dans les 3 fichiers)

---

## 🎯 Ordre de Priorité Vite

Vite charge les fichiers .env dans cet ordre de priorité (du plus prioritaire au moins prioritaire):

### Mode Development (`npm run dev`)

```
1. .env.development.local  ⬅️ Priorité MAX (local + mode)
2. .env.local              ⬅️ Haute priorité (local)
3. .env.development        ⬅️ Moyenne priorité (mode)
4. .env                    ⬅️ Priorité MIN (base)
```

### Mode Production (`npm run build`)

```
1. .env.production.local   ⬅️ Priorité MAX (local + mode)
2. .env.local              ⬅️ Haute priorité (local)
3. .env.production         ⬅️ Moyenne priorité (mode)
4. .env                    ⬅️ Priorité MIN (base)
```

### Mode Test (`npm run test`)

```
1. .env.test.local         ⬅️ Priorité MAX
2. .env.test               ⬅️ Moyenne priorité
3. .env                    ⬅️ Priorité MIN
NOTE: .env.local n'est PAS chargé en mode test !
```

---

## 🔍 Dans Votre Cas Spécifique

### Développement Local (`npm run dev`)

**Fichier utilisé**: `.env.local`

```env
VITE_OPENAI_API_KEY=sk-svcacct-1hiU...
```

**Pourquoi?**
- `.env.local` a priorité sur `.env`
- Les deux contiennent la même clé, mais `.env.local` l'emporte
- ✅ Configuration correcte

### Build Production (`npm run build`)

**Fichier utilisé**: `.env.production`

```env
VITE_OPENAI_API_KEY=sk-svcacct-1hiU...
```

**Pourquoi?**
- `.env.production` a priorité sur `.env`
- Utilisé lors du build pour production
- ✅ Configuration correcte

### Aperçu Production Local (`npm run preview`)

**Fichier utilisé**: `.env.production`

**Pourquoi?**
- `preview` utilise le mode production
- Teste le build comme s'il était déployé
- ✅ Configuration correcte

---

## 🎨 Rôle de Chaque Fichier

### `.env` (Commité dans Git)

**Rôle**: Configuration par défaut pour toute l'équipe

```env
VITE_SUPABASE_URL=https://smtdtgrymuzwvctattmx.supabase.co
VITE_OPENAI_API_KEY=sk-svcacct-1hiU...  # ⚠️ Clé visible publiquement
```

**Usage**:
- Variables communes à tous les développeurs
- ⚠️ **ATTENTION**: Ne devrait PAS contenir de vraies clés API
- Devrait contenir des valeurs de développement partagées

**Recommandation**:
❌ Supprimer la vraie clé OpenAI de ce fichier
✅ La remplacer par: `VITE_OPENAI_API_KEY=your-openai-api-key-here`

### `.env.local` (NON commité - dans .gitignore)

**Rôle**: Configuration personnelle du développeur

```env
VITE_OPENAI_API_KEY=sk-svcacct-1hiU...  # ✅ Sécurisé (pas dans Git)
```

**Usage**:
- Clés API personnelles
- Configuration locale spécifique
- ✅ **C'est ICI que vos vraies clés doivent être**

**Sécurité**: ✅ Fichier privé, jamais commité

### `.env.production` (Commité dans Git)

**Rôle**: Configuration pour le build de production

```env
VITE_OPENAI_API_KEY=sk-svcacct-1hiU...  # ⚠️ Clé visible publiquement
```

**Usage**:
- Variables utilisées lors de `npm run build`
- ⚠️ **ATTENTION**: Clé OpenAI exposée dans Git

**Recommandation**:
❌ La vraie clé ne devrait PAS être ici si le fichier est commité
✅ Utiliser des variables d'environnement CI/CD à la place

---

## 🔒 Problème de Sécurité Détecté

### ⚠️ Votre clé OpenAI est exposée dans Git

**Fichiers concernés**:
- `.env` (ligne 42)
- `.env.production` (si commité)

**Risque**:
- Votre clé API OpenAI est visible publiquement
- Quelqu'un peut l'utiliser et vous facturer
- Détection par le "secret scanner" de VSCode

**Impact**: 🔴 Élevé

---

## ✅ Solution Recommandée

### 1. Nettoyer .env (fichier commité)

**Avant**:
```env
# .env
VITE_OPENAI_API_KEY=sk-svcacct-1hiU...
```

**Après**:
```env
# .env
# OpenAI API Key (REQUIS pour l'analyse IA)
# Configuration dans .env.local pour le développement
VITE_OPENAI_API_KEY=your-openai-api-key-here
```

### 2. Garder la vraie clé dans .env.local

```env
# .env.local (PAS dans Git)
VITE_OPENAI_API_KEY=sk-svcacct-1hiU...
```

✅ Ce fichier est déjà dans .gitignore

### 3. Production: Utiliser des Variables d'Environnement

#### Option A: Variables VPS

Lors du déploiement sur votre VPS, définir la variable:

```bash
# Sur le VPS
export VITE_OPENAI_API_KEY="sk-svcacct-1hiU..."
npm run build
```

#### Option B: Fichier .env.production.local sur le serveur

```bash
# Sur le VPS: créer .env.production.local
echo "VITE_OPENAI_API_KEY=sk-svcacct-1hiU..." > .env.production.local
npm run build
```

#### Option C: GitHub Actions Secrets (si utilisé)

```yaml
# .github/workflows/deploy.yml
env:
  VITE_OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

---

## 📝 Actions à Faire Maintenant

### Immédiat (Critique - Sécurité)

1. **Éditer .env**
   ```bash
   # Remplacer la vraie clé par un placeholder
   ```

2. **Éditer .env.production** (si ce fichier est commité)
   ```bash
   # Remplacer la vraie clé par un placeholder
   ```

3. **Vérifier .gitignore**
   ```bash
   cat .gitignore | grep ".env.local"
   # Devrait afficher: .env*.local
   ```

4. **Retirer la clé de l'historique Git** (optionnel mais recommandé)
   ```bash
   # Si la clé était déjà commitée, elle reste dans l'historique
   # Nécessite un nettoyage avec BFG Repo-Cleaner ou git-filter-repo
   ```

5. **Régénérer la clé OpenAI** (fortement recommandé)
   - Aller sur platform.openai.com
   - Révoquer l'ancienne clé exposée
   - Créer une nouvelle clé
   - L'ajouter uniquement dans .env.local

### Court Terme

6. **Configurer la clé sur le VPS**
   ```bash
   # Via SSH sur le VPS
   echo "VITE_OPENAI_API_KEY=nouvelle-cle" >> /var/www/casskai.app/.env.production.local
   ```

7. **Mettre à jour le script de déploiement**
   ```powershell
   # deploy-vps.ps1 - Ne pas copier .env.production
   # Utiliser .env.production.local créé manuellement sur le serveur
   ```

---

## 🛡️ Bonnes Pratiques

### ✅ À Faire

1. **Vraies clés API**: Toujours dans `.env.local` ou `.env.production.local`
2. **Fichiers versionnés**: Seulement des placeholders ou exemples
3. **Production**: Variables d'environnement du serveur
4. **Documentation**: Documenter les variables requises dans README

### ❌ À Ne PAS Faire

1. ❌ Commiter des vraies clés API dans Git
2. ❌ Utiliser le même fichier pour dev et prod
3. ❌ Partager .env.local dans le repo
4. ❌ Exposer des clés VITE_* publiquement (elles sont dans le bundle client)

---

## 📊 Résumé de Votre Configuration

| Fichier | Commité | Utilisé Quand | Votre Clé | Recommandation |
|---------|---------|---------------|-----------|----------------|
| `.env` | ✅ Oui | Dev + Prod (base) | ✅ Présente | ❌ Supprimer la vraie clé |
| `.env.local` | ❌ Non | Dev (priorité) | ✅ Présente | ✅ Parfait, garder |
| `.env.production` | ⚠️ Oui? | Build prod | ✅ Présente | ❌ Supprimer la vraie clé |

**État actuel**: ⚠️ Clé exposée dans fichiers versionnés

**État après nettoyage**: ✅ Clé sécurisée uniquement en local

---

## 🎯 Vérification Finale

Après avoir nettoyé, vérifier que tout fonctionne:

```bash
# Development
npm run dev
# L'analyse IA devrait fonctionner (utilise .env.local)

# Build local
npm run build
npm run preview
# L'analyse IA devrait afficher le fallback (pas de clé dans .env.production)

# Sur VPS après déploiement
# L'analyse IA devrait fonctionner (utilise .env.production.local du serveur)
```

---

## 📚 Documentation Officielle

- [Vite Env Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Vite Env Files Priority](https://vitejs.dev/guide/env-and-mode.html#env-files)

---

**Créé le**: 6 décembre 2025
**Mise à jour**: Après intégration OpenAI
**Status**: ✅ Explications complètes
