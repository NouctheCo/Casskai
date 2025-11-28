# 🛡️ Protection Juridique & Technique - CassKai
**Date** : 25 novembre 2025  
**Entreprise** : Noutche Conseil SAS  
**Produit** : CassKai - Plateforme SaaS Comptable

---

## 📋 ACTIONS URGENTES (Avant Beta 10 Décembre)

### ✅ FAIT
- [x] Copyright © dans code source (LICENSE MIT)
- [x] SSL/TLS (Let's Encrypt via hébergeur)
- [x] Sentry monitoring configuré
- [x] CGU/Privacy Policy/RGPD pages

### 🔴 À FAIRE IMMÉDIATEMENT

#### 1. Dépôt Marque INPI (48h max)
**Coût** : 250€  
**Lien** : https://www.inpi.fr/deposer-une-marque

**Étapes** :
1. Vérifier disponibilité : https://bases-marques.inpi.fr
   - Recherche "CassKai" + variantes
   - Vérifier classes : 9 (logiciels), 42 (SaaS), 35 (gestion)

2. Créer compte INPI : https://procedures.inpi.fr

3. Formulaire dépôt :
   - Type : Marque verbale
   - Dénomination : **CassKai**
   - Classes Nice :
     * **Classe 9** : Logiciels téléchargeables ; applications mobiles ; logiciels de gestion comptable et financière
     * **Classe 42** : Services SaaS ; hébergement de logiciels ; maintenance de logiciels comptables
   - Protection : France (extension UE après succès)

4. Paiement : 250€ CB
5. Accusé réception : ~7 jours
6. Publication BOPI : ~6 mois

**⚠️ CRITIQUE** : Déposer AVANT annonce publique Beta !

---

#### 2. Audit Sécurité npm (1h)
```bash
# Terminal 1 : Audit vulnérabilités
npm audit

# Terminal 2 : Fix automatique
npm audit fix

# Terminal 3 : Vérifier secrets exposés
npx gitguardian scan --all-history

# Terminal 4 : Scanner Snyk (optionnel)
npx snyk test
```

**Actions** :
- [ ] Exécuter `npm audit` et noter CVE critiques
- [ ] Appliquer `npm audit fix` si pas de breaking changes
- [ ] Mettre à jour manuellement packages à risque
- [ ] Vérifier `.env` pas dans Git

---

#### 3. Domaines Additionnels (30€)
**Registrar** : Gandi, OVH, Namecheap

Réserver :
- [ ] casskai.com (protection internationale)
- [ ] casskai.eu (marché européen)
- [ ] cass-kai.fr (typosquatting)

**Redirect** : Tous vers casskai.fr

---

#### 4. Cloudflare Setup (Gratuit)
**Lien** : https://dash.cloudflare.com

**Configuration** :
1. Ajouter site casskai.fr
2. Changer NS chez registrar
3. SSL/TLS : Full (strict)
4. Firewall Rules :
   - Bloquer Chine/Russie si pas de clients (optionnel)
   - Rate limit : 100 req/min par IP
5. Page Rules :
   - Cache statique : `casskai.fr/assets/*`
   - Always Online : activé

---

## 🔒 Protection Continue (Post-Beta)

### Monitoring Sécurité

#### GitHub Dependabot
- [x] Activé sur repo `NouctheCo/Casskai`
- [x] Alertes CVE automatiques
- [ ] Review PRs hebdomadaires

#### Uptime Monitoring
**Service** : UptimeRobot (gratuit)
- [ ] Monitor https://casskai.fr (HTTP 200)
- [ ] Monitor https://casskai.fr/api/health
- [ ] Alertes email + SMS

#### Sentry (Déjà configuré)
- [x] Error tracking production
- [x] Performance monitoring
- [x] Session replay
- [ ] Alertes Slack/Email sur erreurs critiques

---

## 📜 Documents Juridiques

### Copyright Notices

#### Site Web Footer
```html
<footer>
  <p>© 2025 Noutche Conseil SAS - Tous droits réservés</p>
  <p>CassKai® - Marque déposée INPI n° [À COMPLÉTER]</p>
</footer>
```

#### README.md
```markdown
## Copyright & License

© 2025 Noutche Conseil SAS. All rights reserved.

CassKai® is a registered trademark of Noutche Conseil SAS.

Licensed under the MIT License - see LICENSE file.
```

#### Package.json
```json
{
  "name": "casskai",
  "author": "Noutche Conseil SAS <contact@casskai.fr>",
  "license": "MIT",
  "copyright": "© 2025 Noutche Conseil SAS"
}
```

---

## 🔐 Sécurité Technique

### Secrets Management

**Variables d'environnement** (ne JAMAIS commit) :
```env
# .env.production (sur serveur uniquement)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc... (public OK)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... (public OK)

# Secrets backend (Supabase Edge Functions)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (PRIVÉ !)
STRIPE_SECRET_KEY=sk_live_... (PRIVÉ !)
STRIPE_WEBHOOK_SECRET=whsec_... (PRIVÉ !)
```

**Rotation planifiée** :
- [ ] Supabase keys : Tous les 6 mois
- [ ] Stripe keys : Après leak ou 1 an
- [ ] JWT secrets : Jamais (sauf compromission)

---

### OWASP Top 10 Checklist

- [x] **A01:2021 – Broken Access Control**
  - RLS Supabase activé
  - ProtectedRoute sur routes privées
  
- [x] **A02:2021 – Cryptographic Failures**
  - HTTPS strict
  - Passwords bcrypt/argon2
  
- [x] **A03:2021 – Injection**
  - Prepared statements Supabase
  - Input validation Zod
  
- [x] **A04:2021 – Insecure Design**
  - Architecture reviewed
  - Threat modeling done
  
- [x] **A05:2021 – Security Misconfiguration**
  - CORS restrictif
  - CSP headers (à améliorer)
  
- [x] **A06:2021 – Vulnerable Components**
  - npm audit régulier
  - Dependabot activé
  
- [ ] **A07:2021 – Identification/Auth Failures**
  - 2FA disponible (Supabase Auth)
  - Session timeout : 1 semaine (à réduire ?)
  
- [x] **A08:2021 – Software/Data Integrity**
  - SRI sur CDN (Plausible, Sentry)
  - Backup BDD quotidien
  
- [x] **A09:2021 – Logging Failures**
  - Sentry logging complet
  - Pas de secrets dans logs
  
- [ ] **A10:2021 – SSRF**
  - Valider URLs externes
  - Whitelist domaines API

---

## 📊 Budget Protection (Année 1)

| Poste | Coût Année 1 | Récurrent |
|-------|--------------|-----------|
| **Juridique** |
| Marque INPI France | 250€ | Non (10 ans) |
| Domaines (.fr/.com/.eu) | 45€ | 45€/an |
| Enveloppe Soleau | 15€ | Non |
| **Technique** |
| Cloudflare Free | 0€ | 0€/an |
| Sentry Developer (10k events) | 0€ | 0€/an |
| UptimeRobot (5 monitors) | 0€ | 0€/an |
| GitHub Dependabot | 0€ | 0€/an |
| Snyk (open-source) | 0€ | 0€/an |
| **Optionnel** |
| APP Dépôt code | 60€ | 60€/an |
| Cloudflare Pro | 240€ | 240€/an |
| Sentry Team | 312€ | 312€/an |
| Audit avocat IP | 800€ | Non |
| **TOTAL MINIMUM** | **310€** | **45€/an** |
| **TOTAL RECOMMANDÉ** | **1 110€** | **405€/an** |

---

## 🚨 Incidents & Réponse

### Procédure de Réponse aux Incidents

#### 1. Détection
- Alerte Sentry (erreur rate spike)
- Alerte Uptime (site down)
- Rapport utilisateur (support@casskai.com)
- CVE critique sur dépendance

#### 2. Triage (< 15 min)
- Criticité : P0 (critique), P1 (urgent), P2 (normal)
- Impact : Utilisateurs affectés
- Données exposées : Oui/Non

#### 3. Réponse
**P0 - Service Down / Data Breach** :
1. Activer mode maintenance
2. Isoler composant défaillant
3. Notification utilisateurs (email)
4. Investigation root cause
5. Hotfix production
6. Post-mortem sous 48h

**P1 - Fonctionnalité cassée** :
1. Rollback si déploiement récent
2. Fix + test staging
3. Deploy en heures creuses

**P2 - Bug mineur** :
1. Ticket dans backlog
2. Fix dans prochain sprint

#### 4. Communication
- Email users : incidents@casskai.fr
- Status page : status.casskai.fr (UptimeRobot)
- Twitter/LinkedIn si impact large

---

## 📞 Contacts d'Urgence

**Juridique** :
- INPI : 0 820 213 213
- Avocat IP : [À REMPLIR]

**Technique** :
- Supabase Support : support@supabase.com
- Cloudflare Support : support.cloudflare.com
- Stripe Support : support@stripe.com

**Équipe** :
- CEO/CTO : [Votre Téléphone]
- DPO : dpo@casskai.fr

---

## ✅ Validation Sécurité Pre-Launch

Avant Beta 10 décembre 2025 :

### Juridique
- [ ] Marque déposée INPI (accusé réception)
- [ ] Domaines .com/.eu réservés
- [ ] Copyright © ajouté footer site
- [ ] CGU/CGV/Privacy Policy validées

### Technique
- [ ] `npm audit` clean (0 vulns critiques)
- [ ] Secrets scan passed (gitguardian)
- [ ] Cloudflare WAF activé
- [ ] Backups BDD quotidiens
- [ ] Monitoring Sentry/Uptime opérationnel
- [ ] Rate limiting Edge Functions testé
- [ ] HTTPS strict + HSTS activé

### Opérationnel
- [ ] Procédure incident documentée
- [ ] Contacts urgence à jour
- [ ] Alertes configurées (email + SMS)

---

**Responsable** : [Votre Nom]  
**Dernière révision** : 25 novembre 2025  
**Prochaine révision** : Janvier 2026

---

## 📚 Ressources

- INPI : https://www.inpi.fr
- OWASP Top 10 : https://owasp.org/Top10
- Cloudflare Security : https://www.cloudflare.com/learning/security
- Snyk Advisor : https://snyk.io/advisor
- CVE Database : https://cve.mitre.org
