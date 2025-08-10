# Guide de Déploiement Hostinger - CassKai

## Configuration du Déploiement Automatique

### 1. Configuration GitHub Secrets

Dans votre repository GitHub, ajoutez les secrets suivants :
- `HOSTINGER_FTP_PASSWORD` : Mot de passe FTP de votre compte Hostinger
- `VITE_SUPABASE_URL` : URL de votre projet Supabase
- `VITE_SUPABASE_ANON_KEY` : Clé anonyme Supabase
- `VITE_STRIPE_PUBLISHABLE_KEY` : Clé publique Stripe (optionnel)

**Comment ajouter un secret GitHub :**
1. Allez dans `Settings` > `Secrets and variables` > `Actions`
2. Cliquez sur `New repository secret`
3. Ajoutez chaque variable une par une

### 2. Informations FTP Hostinger

- **Serveur FTP :** ftp://82.25.113.130
- **Nom d'utilisateur :** u657259520.casskai.app
- **Port :** 21
- **Dossier cible :** public_html

### 3. Configuration du Domaine

1. Dans cPanel Hostinger, allez dans "Domains"
2. Pointez `casskai.app` vers le dossier `public_html`
3. Assurez-vous que le SSL est activé

### 4. Variables d'Environnement

**⚠️ Important : Hébergement Mutualisé PHP**

Comme vous êtes sur un hébergement mutualisé PHP (et non Node.js), les variables d'environnement doivent être injectées **avant le build**, pas sur le serveur.

#### Configuration Automatique :

Le workflow GitHub Actions crée automatiquement le fichier `.env` avec les valeurs des GitHub Secrets :
- `VITE_SUPABASE_URL` → Depuis GitHub Secrets
- `VITE_SUPABASE_ANON_KEY` → Depuis GitHub Secrets  
- `VITE_STRIPE_PUBLISHABLE_KEY` → Depuis GitHub Secrets
- Variables fixes : `VITE_APP_URL=https://casskai.app`, etc.

#### Variables nécessaires dans GitHub Secrets :
- `VITE_SUPABASE_URL` (ex: https://smtdtgrymuzwvctattmx.supabase.co)
- `VITE_SUPABASE_ANON_KEY` (votre clé Supabase anonyme)
- `VITE_STRIPE_PUBLISHABLE_KEY` (optionnel, pour Stripe)

### 5. Déploiement

Le déploiement est automatique à chaque push sur la branche `main` :

1. **Build automatique :** `npm run build`
2. **Upload FTP :** Le contenu de `dist/` est uploadé vers `public_html/`
3. **Configuration .htaccess :** Gestion des routes React Router

### 6. Déploiement Manuel

Si vous voulez déclencher un déploiement manuellement :
1. Allez dans l'onglet "Actions" de votre repository GitHub
2. Sélectionnez "Deploy to Hostinger"
3. Cliquez sur "Run workflow"

### 7. Vérifications Post-Déploiement

Après le déploiement, vérifiez :
- [ ] L'application se charge sur casskai.app
- [ ] Les routes React fonctionnent (pas d'erreur 404)
- [ ] La connexion Supabase fonctionne
- [ ] Les headers de sécurité sont présents
- [ ] Le cache des assets statiques fonctionne

### 8. Troubleshooting

#### Problème de routes React
- Vérifiez que le fichier `.htaccess` est présent dans `public_html`
- Assurez-vous que mod_rewrite est activé sur le serveur

#### Problème de connexion Supabase
- Vérifiez que les variables d'environnement sont correctement définies
- Testez la connectivité depuis l'interface Hostinger

#### Erreurs de build
- Consultez les logs dans l'onglet "Actions" de GitHub
- Vérifiez que toutes les dépendances sont installées

### 9. Structure des Fichiers

```
public_html/
├── index.html
├── .htaccess
├── assets/
│   ├── css/
│   └── js/
└── [autres fichiers du build]
```

### 10. Performance et Cache

Le fichier `.htaccess` configure automatiquement :
- Cache des assets statiques (1 an)
- Headers de sécurité
- Compression (si supportée par le serveur)

Pour optimiser les performances :
- Activez la compression GZIP dans cPanel
- Configurez Cloudflare si disponible
- Optimisez les images avant le build