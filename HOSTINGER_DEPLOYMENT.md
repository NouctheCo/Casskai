# Guide de Déploiement Hostinger - CassKai

## Configuration du Déploiement Automatique

### 1. Configuration GitHub Secrets

Dans votre repository GitHub, ajoutez le secret suivant :
- `HOSTINGER_FTP_PASSWORD` : Mot de passe FTP de votre compte Hostinger

**Comment ajouter un secret GitHub :**
1. Allez dans `Settings` > `Secrets and variables` > `Actions`
2. Cliquez sur `New repository secret`
3. Nom : `HOSTINGER_FTP_PASSWORD`
4. Valeur : Votre mot de passe FTP Hostinger

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

#### Sur Hostinger (cPanel) :

1. **Option 1 : Via le fichier .env (non recommandé pour la production)**
   - Uploadez un fichier `.env` dans `public_html`
   - Le fichier `.htaccess` bloquera l'accès public à ce fichier

2. **Option 2 : Variables d'environnement système (recommandé)**
   - Dans cPanel > "Environment Variables"
   - Ajoutez vos variables Supabase :
     ```
     VITE_SUPABASE_URL=https://votre-projet.supabase.co
     VITE_SUPABASE_ANON_KEY=votre_clé_anonyme
     VITE_APP_ENV=production
     ```

#### Variables nécessaires :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_ENV`
- Autres variables spécifiques à votre application

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