# 🚀 Guide de Déploiement CassKai

## ⚠️ **IMPORTANT : Architecture de Déploiement**

**CassKai utilise une architecture VPS avec les composants suivants :**

- **VPS Principal** : `89.116.111.88` (Hostinger VPS)
- **Domaine** : `casskai.app` → DNS pointe vers le VPS
- **Frontend** : React/Vite servi par Nginx
- **Backend** : Node.js/Express avec PM2
- **Reverse Proxy** : Traefik + Nginx
- **SSL** : Let's Encrypt automatique
- **Base de données** : Supabase (externe)
- **Paiements** : Stripe Live

## 🏗️ **Architecture de Déploiement**

```
Internet → DNS (casskai.app) → VPS (89.116.111.88)
    ↓
Traefik (SSL + Routing) → Port 80/443
    ↓
Nginx Proxy Container → Port 8080 (Host)
    ↓
├── Frontend React (Nginx) → /var/www/casskai.app/public/
└── Backend API (PM2) → Port 3001
    ↓
Supabase (PostgreSQL) + Stripe
```

## 📋 **Prérequis de Déploiement**

### Serveur VPS
- **IP** : `89.116.111.88`
- **OS** : Ubuntu 24.04 LTS
- **Services** : Docker, Docker Compose, Node.js 18+, PM2, Nginx

### DNS
- `casskai.app` (A) → `89.116.111.88`
- `www.casskai.app` (A) → `89.116.111.88`

### Certificats
- SSL géré automatiquement par Let's Encrypt via Traefik

## 🚀 **Procédure de Déploiement**

### **Étape 1 : Compiler le projet**
```bash
# Depuis le dossier local du projet
npm install
npm run build
```

### **Étape 2 : Déployer le Frontend**
```bash
# Upload des fichiers compilés vers le VPS
scp -r dist/* root@89.116.111.88:/var/www/casskai.app/public/
```

### **Étape 3 : Déployer le Backend (si modifié)**
```bash
# Upload du backend
scp -r backend/* root@89.116.111.88:/var/www/casskai.app/api/

# Connecter au VPS
ssh root@89.116.111.88

# Installer les dépendances et redémarrer
cd /var/www/casskai.app/api
npm install --production
pm2 restart casskai-api
```

### **Étape 4 : Vérifications**
```bash
# Test de l'application
curl https://casskai.app/health
# Résultat attendu : {"status":"OK","stripe":true,"supabase":true}

# Test dans le navigateur
open https://casskai.app
```

## 📁 **Structure des Fichiers sur le VPS**

```
/var/www/casskai.app/
├── public/              # Frontend React (contenu de dist/)
│   ├── index.html
│   ├── assets/
│   └── ...
└── api/                 # Backend Node.js
    ├── server.js
    ├── package.json
    ├── .env
    └── node_modules/

/root/
├── docker-compose.yml   # Traefik + Nginx proxy
├── casskai-proxy.conf   # Configuration Nginx
└── .pm2/                # PM2 processes
```

## ⚙️ **Variables d'Environnement**

### Frontend (.env local)
```env
NODE_ENV=production
VITE_USE_MOCK_SERVICES=false
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_API_BASE_URL=https://casskai.app/api
VITE_SUPABASE_URL=https://smtdtgrymuzwvctattmx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
```

### Backend (.env sur VPS)
```env
# Localisation : /var/www/casskai.app/api/.env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://smtdtgrymuzwvctattmx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiI...
FRONTEND_URL=https://casskai.app
NODE_ENV=production
PORT=3001
```

## 🔧 **Commandes de Maintenance**

### Logs et Monitoring
```bash
# Logs de l'API
pm2 logs casskai-api

# Logs des conteneurs
docker compose logs traefik
docker compose logs casskai-proxy

# Status des services
pm2 status
docker compose ps
```

### Redémarrage des Services
```bash
# Redémarrer l'API
pm2 restart casskai-api

# Redémarrer le proxy
docker compose restart casskai-proxy

# Redémarrer Traefik (SSL)
docker compose restart traefik
```

## 🚨 **Dépannage**

### Problème d'accès
1. Vérifier DNS : `nslookup casskai.app`
2. Tester VPS : `curl -I http://89.116.111.88`
3. Vérifier SSL : `curl -I https://casskai.app`

### Problème API
1. Logs : `pm2 logs casskai-api`
2. Status : `pm2 status`
3. Test direct : `curl http://localhost:3001/health`

### Problème SSL
1. Logs Traefik : `docker compose logs traefik | grep -i acme`
2. Régénérer : Redémarrer Traefik

## ⚠️ **IMPORTANT - Ne PAS utiliser**

- **Hostinger hébergement partagé** : Plus utilisé
- **Autres fournisseurs** : VPS Hostinger uniquement
- **Services mock** : Production utilise les vrais services

## 👥 **Contact Technique**

- **VPS** : Hostinger VPS `89.116.111.88`
- **Domaine** : DNS configuré sur `casskai.app`
- **SSL** : Automatique via Traefik + Let's Encrypt
- **Support** : Accès SSH root au VPS requis

---

**📌 Résumé : Pour déployer CassKai, compilez local → uploadez vers VPS 89.116.111.88 → testez https://casskai.app**