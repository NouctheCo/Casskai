# 📚 Documentation CassKai

Index complet de la documentation.

## 🚀 Quick Start

1. **[Déploiement](deployment/DEPLOYMENT.md)** - Déployer en 1 minute
2. **[Supabase](guides/SUPABASE_SETUP.md)** - Configurer la base
3. **[Stripe](deployment/STRIPE_INTEGRATION.md)** - Activer les paiements
4. **[Sécurité](security/SECURITY_CONFIGURATION_GUIDE.md)** - Secrets et RLS

## 📂 Documentation par Catégorie

### 🚀 deployment/
- **DEPLOYMENT.md** - Guide complet VPS + Scripts
- **STRIPE_INTEGRATION.md** - Paiements et webhooks
- **DEPLOYMENT_EDGE_FUNCTIONS.md** - Supabase Edge Functions

### 📖 guides/
- **SUPABASE_SETUP.md** - Config + Troubleshooting DB
- **SUBSCRIPTION_*.md** - Système d'abonnements
- **TRIAL_SYSTEM_README.md** - Essais gratuits
- **PLANS_COMPTABLES_*.md** - Plans comptables internationaux

### 🔒 security/
- **SECURITY_CONFIGURATION_GUIDE.md** - Configuration complète
- **ACTIONS_IMMEDIATES_SECURITE.md** - Checklist 20min

### 📋 planning/ & 🗄️ archive/
- Documents de planification et historique

## 🛠️ Commandes Essentielles

```bash
# Déploiement
npm run deploy

# Supabase
supabase db push
supabase functions deploy [name]

# Tests
npm run type-check
npm test
```

## 🆘 Troubleshooting

- Déploiement → [DEPLOYMENT.md#troubleshooting](deployment/DEPLOYMENT.md)
- Supabase → [SUPABASE_SETUP.md](guides/SUPABASE_SETUP.md)
- Stripe → [STRIPE_INTEGRATION.md](deployment/STRIPE_INTEGRATION.md)

---

**Production**: https://casskai.app | **VPS**: 89.116.111.88
