# 🚀 Étapes de Déploiement CassKai - Guide Interactif

## 📋 Méthode Recommandée : Interface Web Netlify

Suivez ces étapes pour déployer CassKai facilement :

### 🌐 Option 1: Déploiement via Interface Web (Recommandé)

1. **Allez sur [netlify.com](https://netlify.com)**
2. **Connectez-vous à votre compte**
3. **Cliquez "New site from Git"**
4. **Connectez votre repository GitHub/GitLab**
5. **Configuration du build :**
   - **Branch to deploy** : `main`
   - **Build command** : `npm run build:production`
   - **Publish directory** : `dist`

6. **Avant de déployer, configurez les variables d'environnement :**

**Site Settings → Environment Variables :**
```env
NODE_VERSION=18
VITE_SUPABASE_URL=https://[VOTRE-PROJECT].supabase.co
VITE_SUPABASE_ANON_KEY=[VOTRE-ANON-KEY]
VITE_APP_NAME=CassKai
VITE_NODE_ENV=production
```

7. **Cliquez "Deploy site"**

---

### 🖥️ Option 2: Déploiement via CLI (Avancé)

**Si vous préférez la ligne de commande :**

#### Étape 1: Créer le site
```bash
# Dans le dossier CassKai
netlify sites:create --name casskai-production
```

#### Étape 2: Lier le dossier au site
```bash
netlify link
```

#### Étape 3: Configurer les variables d'environnement
```bash
netlify env:set NODE_VERSION "18"
netlify env:set VITE_SUPABASE_URL "https://[VOTRE-PROJECT].supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "[VOTRE-ANON-KEY]"
netlify env:set VITE_APP_NAME "CassKai"
netlify env:set VITE_NODE_ENV "production"
```

#### Étape 4: Déployer
```bash
npm run build:production
netlify deploy --prod --dir=dist
```

---

## 📋 Variables Supabase à Configurer

**Remplacez ces valeurs par vos vraies données Supabase :**

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Où les trouver dans Supabase :**
1. Allez dans votre projet Supabase
2. Settings → API
3. Copiez "Project URL" et "anon public"

---

## ✅ Après le Déploiement

### 1. Mettre à jour Supabase avec l'URL Netlify

1. **Dans Supabase : Authentication → Settings**
2. **Site URL** : `https://votre-site.netlify.app`
3. **Additional Redirect URLs** : 
   ```
   https://votre-site.netlify.app/auth/callback
   https://votre-site.netlify.app/**
   ```

### 2. Tests Post-Déploiement

- [ ] ✅ Site accessible via HTTPS
- [ ] 🔐 Test inscription/connexion
- [ ] 🏢 Test création d'entreprise
- [ ] 📊 Test navigation modules
- [ ] 💾 Test sauvegarde données

---

## 🎯 Résultat Final

**Votre CassKai sera disponible sur :**
`https://votre-site.netlify.app`

**Avec toutes les fonctionnalités :**
- ✅ Authentification Supabase
- ✅ Gestion multi-entreprise
- ✅ Tous les modules comptables
- ✅ Import FEC
- ✅ Génération de rapports
- ✅ HTTPS automatique
- ✅ Performance optimisée

---

**🚀 Prêt pour des milliers d'utilisateurs !**