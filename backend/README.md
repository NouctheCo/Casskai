# CassKai Stripe Backend

Backend API pour l'intégration Stripe de CassKai, gérant les abonnements, paiements et webhooks.

## 🚀 Installation rapide

### Prérequis
- Node.js 18+ 
- Compte Stripe (avec clés Live)
- Base Supabase configurée

### 1. Installation des dépendances
```bash
cd backend
npm install
```

### 2. Configuration environnement
Copiez `.env.example` vers `.env` et remplissez :
```bash
cp .env.example .env
```

**Variables importantes :**
```env
# Stripe (OBLIGATOIRE)
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_51RNdfcJIrDO4BeWeZWruTr8bT3bc1lBr1gc97pBcb0yIn4of2GpHhYWBh8BjSHfEetw77Sax5XzTMQLDcLUVs4rP000UI8xMgp
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Supabase (Service Role Key pour le backend)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

# URLs
FRONTEND_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com,http://localhost:5173
```

### 3. Démarrage
```bash
# Développement
npm run dev

# Production
npm start
```

## 🔧 Configuration Stripe

### 1. Créer les produits Stripe
Dans le dashboard Stripe, créez les produits correspondant aux plans :
- **Starter** : 9,99€/mois
- **Professional** : 29,99€/mois  
- **Enterprise** : 99,99€/mois

### 2. Configurer les webhooks
URL webhook : `https://your-backend-domain.com/webhook`

**Événements à surveiller :**
- `customer.subscription.created`
- `customer.subscription.updated` 
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 3. Test avec Stripe CLI (développement)
```bash
# Installer Stripe CLI
# Puis écouter les webhooks localement
stripe listen --forward-to localhost:3001/webhook

# Dans un autre terminal, démarrer le serveur
npm run dev
```

## 🌐 Déploiement

### Option 1: Railway (Recommandé)
```bash
# Installer Railway CLI
npm install -g @railway/cli

# Login et déployer
railway login
railway init
railway up
```

### Option 2: Vercel
```bash
# Installer Vercel CLI  
npm install -g vercel

# Déployer
vercel --prod
```

### Option 3: VPS/Serveur dédié
```bash
# Avec PM2
npm install -g pm2
pm2 start server.js --name casskai-stripe-backend
pm2 startup
pm2 save
```

## 📋 Endpoints disponibles

### Health Check
- `GET /health` - Vérification de l'état du serveur

### Stripe
- `POST /api/stripe/create-checkout-session` - Créer session de paiement
- `POST /api/stripe/create-portal-session` - Portail de facturation  
- `POST /api/stripe/update-subscription` - Modifier abonnement
- `POST /api/stripe/cancel-subscription` - Annuler abonnement
- `POST /webhook` - Webhooks Stripe

## 🔒 Sécurité

- Rate limiting (100 req/15min par IP)
- CORS configuré
- Helmet pour les headers de sécurité
- Validation des webhooks Stripe
- Authentification via Supabase

## 🐛 Debugging

### Logs
```bash
# Voir les logs PM2
pm2 logs casskai-stripe-backend

# Voir les logs en temps réel
pm2 logs casskai-stripe-backend --lines 100 -f
```

### Test santé
```bash
curl https://your-backend-domain.com/health
```

### Variables d'environnement
```bash
# Vérifier les variables (sans afficher les secrets)
node -e "console.log({stripe: !!process.env.STRIPE_SECRET_KEY, supabase: !!process.env.SUPABASE_URL})"
```

## 📞 Support

En cas de problème :
1. Vérifiez les logs du serveur
2. Testez les webhooks avec Stripe CLI
3. Vérifiez la connectivité Supabase
4. Consultez les logs Stripe dans le dashboard