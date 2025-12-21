# 💰 VALORISATION - CassKai (Décembre 2025)

## 📊 Résumé Exécutif

**CassKai** est une plateforme SaaS B2B de gestion financière et comptable complète pour PME/TPE, développée sur stack moderne (React, TypeScript, Supabase, Stripe).

### Valorisation estimée : **150 000 € - 280 000 €**

| Scénario | Valorisation | Description |
|----------|-------------|-------------|
| **État actuel (AS-IS)** | 150 000 € | Code fonctionnel mais 74 erreurs TS, modules incomplets |
| **Après corrections critiques** | 200 000 € | Bugs corrigés, modules fonctionnels |
| **Version commercialisable** | 280 000 € | Tests, doc, 10+ clients payants |

---

## 1. ANALYSE TECHNIQUE

### 1.1 Stack Technologique (Valeur : ⭐⭐⭐⭐ 4/5)

#### Frontend
- **React 18.3.1** + TypeScript 5.8.3
- **Vite 7.1.7** (build ultra-rapide)
- **Tailwind CSS 4.2.0** (design moderne)
- **Radix UI** (composants accessibles)
- **Recharts 2.16** (graphiques)

**Points forts :**
- ✅ Stack moderne et demandée
- ✅ TypeScript = maintenance facilitée
- ✅ Performance optimale (Vite + code splitting)
- ✅ UI professionnelle (Radix + Tailwind)

**Points faibles :**
- ❌ 74 erreurs TypeScript à corriger
- ❌ 174 warnings ESLint

#### Backend
- **Supabase** (PostgreSQL + Auth + Storage + Edge Functions)
- **Node.js** + PM2 (API backend)
- **Stripe** (paiements)

**Points forts :**
- ✅ Infrastructure scalable
- ✅ RLS (Row Level Security) implémenté
- ✅ Edge Functions pour logique métier sécurisée
- ✅ Intégration Stripe complète

**Points faibles :**
- ❌ Schéma DB avec colonnes manquantes
- ❌ Edge Functions partiellement testées

#### Déploiement
- **VPS dédié** (89.116.111.88)
- **Nginx** + SSL Let's Encrypt
- **Scripts de déploiement automatisés** (PowerShell + Bash)

**Valeur technique estimée : 80 000 €**
- 40 000 € - Développement frontend (6 mois × 2 devs)
- 25 000 € - Backend + DB + Auth
- 10 000 € - Intégrations (Stripe, OpenAI, etc.)
- 5 000 € - Infrastructure + déploiement

---

### 1.2 Volume de Code (Valeur : ⭐⭐⭐⭐⭐ 5/5)

```
Fichiers TypeScript/TSX : 820+
Lignes de code estimées : 150 000+ LOC
Services : 70+
Composants React : 210+
Custom Hooks : 40+
Pages : 40+
```

**Comparaison sectorielle :**
- Application SaaS moyenne : 50-80k LOC
- CassKai : 150k+ LOC = **2x la moyenne**

**Temps de développement estimé :**
- 150 000 LOC ÷ 50 LOC/jour/dev = **3000 jours/dev**
- Avec 2 développeurs = **1500 jours** = **4 ans**
- Coût dev (60€/h × 8h × 1500j) = **720 000 €**

**Valeur réelle ajustée : 100 000 €**
(Après déduction bugs, dette technique, manque tests)

---

### 1.3 Modules Fonctionnels (Valeur : ⭐⭐⭐ 3/5)

| Module | État | Fonctionnalité | Valeur Marché |
|--------|------|----------------|---------------|
| **Comptabilité** | 🟠 75% | Plan comptable, écritures, FEC import/export | 25 000 € |
| **Facturation** | 🟠 80% | Devis, factures, paiements, relances | 20 000 € |
| **Banque** | 🟢 90% | Comptes, transactions, rapprochement, SEPA | 15 000 € |
| **Tiers** | 🟢 85% | Clients, fournisseurs, vieillissement | 10 000 € |
| **Budget** | 🟢 90% | Création, suivi, prévisions, charts | 12 000 € |
| **CRM** | 🟠 70% | Opportunités, pipeline, actions | 15 000 € |
| **RH/Paie** | 🔴 50% | Employés, contrats, formations (bugs critiques) | 8 000 € |
| **Immobilisations** | 🔴 40% | Actifs, amortissements (module cassé) | 6 000 € |
| **Achats** | 🟢 80% | Commandes, bons de réception | 10 000 € |
| **Projets** | 🟢 85% | Gestion projets, temps, coûts | 12 000 € |
| **Contrats** | 🟢 85% | Gestion contrats, RFA, avenants | 10 000 € |
| **Taxes** | 🟠 75% | TVA, IS, CFE, liasse fiscale | 18 000 € |
| **Rapports** | 🟠 70% | Bilan, Compte Résultat, personnalisés | 15 000 € |
| **Dashboard** | 🟠 70% | KPIs, métriques, prévisions (erreurs TS) | 10 000 € |
| **IA** | 🔴 30% | Insights, prédictions (AI cassée) | 5 000 € |
| **Automatisation** | 🟠 65% | Workflows, templates | 8 000 € |
| **Inventaire** | 🟢 85% | Stock, mouvements, valorisation | 12 000 € |
| **Documents** | 🟢 90% | Génération PDF, templates | 10 000 € |
| **Multi-entreprise** | 🟢 90% | Gestion plusieurs sociétés | 8 000 € |
| **RGPD/Audit** | 🟢 85% | Conformité, logs, exports | 10 000 € |

**Valeur totale modules : 239 000 €**

**Modules à forte valeur ajoutée :**
1. **FEC Import/Export** - Requis pour conformité fiscale française (15k€)
2. **E-Invoicing (Chorus Pro)** - Obligatoire pour marchés publics (12k€)
3. **SEPA** - Virements bancaires automatisés (10k€)
4. **Multi-currency** - International (8k€)
5. **Multi-company** - Cabinets comptables (15k€)

---

### 1.4 Intégrations (Valeur : ⭐⭐⭐⭐ 4/5)

| Intégration | État | Valeur |
|-------------|------|--------|
| **Stripe** | ✅ Complet | 15 000 € |
| **Supabase Auth** | ✅ Complet | 8 000 € |
| **SendGrid** | ✅ Installé | 5 000 € |
| **OpenAI** | 🟠 Partiel | 10 000 € |
| **PDF Generation** | ✅ Complet | 8 000 € |
| **Excel Export** | ✅ Complet | 5 000 € |
| **i18n (FR/EN/ES)** | ✅ Complet | 12 000 € |

**Valeur intégrations : 63 000 €**

---

## 2. ANALYSE COMMERCIALE

### 2.1 Marché Cible

**Segment principal : PME/TPE françaises**
- 3,9 millions d'entreprises en France
- 99% sont des PME/TPE
- Marché SaaS comptable : 2,5 milliards €/an en France

**Concurrents directs :**
| Concurrent | Prix/mois | Parts de marché | Points faibles |
|------------|-----------|-----------------|----------------|
| **Pennylane** | 49-199€ | Leader | Cher, complexe |
| **Indy** | 19-59€ | Croissance | Micro-entreprises seulement |
| **Zervant** | 8-24€ | Niche | Facturation uniquement |
| **Quickbooks** | 15-100€ | International | UI vieillotte |
| **Sage** | 30-150€ | Historique | Lourd, coûteux |

**Positionnement CassKai :**
- Prix : **29-99€/mois** (milieu de gamme)
- Cible : PME 5-50 employés
- USP : **Tout-en-un** (compta + CRM + RH + projets)

### 2.2 Modèle de Revenus

**Plans tarifaires configurés (Stripe) :**
```
STARTER   : 29€/mois (348€/an)   - 1 utilisateur, base
PRO       : 59€/mois (708€/an)   - 5 utilisateurs, avancé
ENTERPRISE: 99€/mois (1188€/an)  - Illimité, tout inclus
TRIAL     : 0€ (14 jours)
```

**Projections avec acquisition progressive :**

| Année | Clients | ARPU/mois | MRR | ARR |
|-------|---------|-----------|-----|-----|
| **An 1** | 50 | 45€ | 2 250€ | 27 000€ |
| **An 2** | 200 | 50€ | 10 000€ | 120 000€ |
| **An 3** | 500 | 55€ | 27 500€ | 330 000€ |
| **An 5** | 1500 | 60€ | 90 000€ | 1 080 000€ |

**Hypothèses :**
- Taux de conversion trial : 10% (standard SaaS)
- Churn annuel : 25% (PME)
- CAC (Coût Acquisition Client) : 150€
- LTV (Lifetime Value) : 720€ (16 mois moyen)
- LTV/CAC ratio : 4,8 (excellent)

### 2.3 Coûts d'Exploitation Estimés

| Poste | An 1 | An 2 | An 3 |
|-------|------|------|------|
| Hébergement (VPS + Supabase) | 2 400€ | 6 000€ | 15 000€ |
| Stripe fees (2,9% + 0,25€) | 1 000€ | 4 000€ | 10 000€ |
| Support client | 0€ | 12 000€ | 30 000€ |
| Marketing | 5 000€ | 20 000€ | 50 000€ |
| Dev/maintenance | 36 000€ | 48 000€ | 72 000€ |
| **Total** | **44 400€** | **90 000€** | **177 000€** |

**Marge brute projetée :**
- An 1 : -17 400€ (investissement)
- An 2 : +30 000€ (25%)
- An 3 : +153 000€ (46%)

---

## 3. VALORISATION DÉTAILLÉE

### 3.1 Méthode 1 : Coût de Développement

```
Temps de développement : 4 ans (2 devs)
Coût horaire moyen : 60€
Heures totales : 12 000h (3000j × 8h × 2 devs)
Coût brut : 720 000€

Décote pour :
- Bugs/erreurs TS (-30%) : -216 000€
- Manque de tests (-15%) : -108 000€
- Dette technique (-10%) : -72 000€
- Documentation partielle (-5%) : -36 000€

Valeur nette : 288 000€
```

### 3.2 Méthode 2 : Revenus Futurs (DCF)

**Flux de trésorerie actualisés (taux : 20%)**

| Année | ARR | Marge nette | Cash-flow | Valeur actualisée |
|-------|-----|-------------|-----------|-------------------|
| An 1 | 27 000€ | -17 400€ | -17 400€ | -14 500€ |
| An 2 | 120 000€ | 30 000€ | 30 000€ | 20 833€ |
| An 3 | 330 000€ | 153 000€ | 153 000€ | 88 542€ |
| An 4 | 660 000€ | 330 000€ | 330 000€ | 159 375€ |
| An 5 | 1 080 000€ | 540 000€ | 540 000€ | 216 870€ |

**Valeur totale DCF : 471 120€**
**Valeur actuelle (avec risque -60%) : 188 448€**

### 3.3 Méthode 3 : Comparables Sectoriels

**Multiples de valorisation SaaS B2B (2025) :**
- ARR × 3-8 (early stage)
- ARR × 8-15 (growth stage)
- ARR × 15-30 (mature)

**CassKai - État actuel (pre-revenue) :**
- ARR projeté An 1 : 27 000€
- Multiple : 5-8× (early stage, non prouvé)
- **Valorisation : 135 000€ - 216 000€**

**CassKai - Après corrections (10 clients payants) :**
- ARR réel : 6 000€ (10 clients × 50€/mois × 12)
- Multiple : 10-15× (traction démontrée)
- **Valorisation : 60 000€ - 90 000€**
- + Valeur technologique : +120 000€
- **Total : 180 000€ - 210 000€**

### 3.4 Méthode 4 : Valeur de Marque et IP

| Élément | Valeur |
|---------|--------|
| Nom de domaine "casskai.app" | 2 000€ |
| Marque déposée (si fait) | 5 000€ |
| Base de code propriétaire | 100 000€ |
| Documentation technique | 5 000€ |
| Scripts de déploiement | 3 000€ |
| Templates documents | 5 000€ |
| **Total IP** | **120 000€** |

---

## 4. SYNTHÈSE DE VALORISATION

### 4.1 Valorisation Pondérée

| Méthode | Valeur | Poids | Contribution |
|---------|--------|-------|--------------|
| Coût de développement | 288 000€ | 30% | 86 400€ |
| DCF (actualisé) | 188 000€ | 20% | 37 600€ |
| Comparables sectoriels | 175 000€ | 30% | 52 500€ |
| Valeur IP | 120 000€ | 20% | 24 000€ |

**Valorisation moyenne : 200 500€**

### 4.2 Fourchette de Valorisation par Scénario

#### 🔴 Scénario Pessimiste : **150 000 €**
**État actuel - Vente immédiate "AS-IS"**
- 74 erreurs TypeScript non corrigées
- Modules HR et Assets cassés
- Aucun client payant
- Buyer doit investir 40-60h corrections
- Valeur = Code + IP uniquement

**Acheteur type :**
- Développeur solo
- Startup early-stage
- Cabinet comptable avec équipe tech

---

#### 🟡 Scénario Réaliste : **200 000 €**
**Après corrections critiques (1-2 mois)**
- ✅ Erreurs TypeScript corrigées
- ✅ Modules HR et Assets fonctionnels
- ✅ Tests basiques implémentés
- ✅ Documentation technique complète
- 🟠 0-5 clients payants
- 🟠 MRR : 0-500€

**Acheteur type :**
- Scale-up SaaS
- Fonds d'investissement early-stage
- Concurrent cherchant acqui-hire

---

#### 🟢 Scénario Optimiste : **280 000 €**
**Version commercialisable (6-12 mois)**
- ✅ Code production-ready (0 erreur TS)
- ✅ Tests automatisés (>50% coverage)
- ✅ 10-20 clients payants
- ✅ MRR : 500-1000€
- ✅ ARR projeté : 12 000-20 000€
- ✅ Traction démontrée
- ✅ Process sales établi

**Acheteur type :**
- Groupe SaaS établi
- PE (Private Equity)
- Concurrent majeur (Pennylane, Indy, etc.)

---

## 5. FACTEURS DE RISQUE

### 5.1 Risques Techniques (Impact : -30 000€)

| Risque | Probabilité | Impact | Mitigation |
|--------|------------|--------|------------|
| Bugs critiques en production | Élevée | -20k€ | Corriger 74 erreurs TS |
| Scalabilité limitée | Moyenne | -10k€ | Audit infra Supabase |
| Dette technique | Élevée | -15k€ | Refactoring progressif |
| Dépendances obsolètes | Faible | -5k€ | npm audit |

### 5.2 Risques Commerciaux (Impact : -40 000€)

| Risque | Probabilité | Impact | Mitigation |
|--------|------------|--------|------------|
| Absence de clients | Élevée | -30k€ | Acquisition 10 clients pilotes |
| Concurrence féroce | Élevée | -20k€ | Niche spécifique (cabinets) |
| Churn élevé (>40%) | Moyenne | -15k€ | Customer success |
| Réglementation (eIDAS2) | Moyenne | -10k€ | Veille réglementaire |

### 5.3 Risques Juridiques (Impact : -20 000€)

| Risque | Probabilité | Impact | Mitigation |
|--------|------------|--------|------------|
| Marque non déposée | Élevée | -10k€ | Dépôt INPI (300€) |
| RGPD non conforme | Faible | -15k€ | Audit RGPD (module présent) |
| Clauses Stripe/Supabase | Faible | -5k€ | Revue contrats |

**Total risques : -90 000€**
**Impact sur valorisation : -30% à -45%**

---

## 6. OPPORTUNITÉS D'AMÉLIORATION

### 6.1 Quick Wins (1-3 mois) - Valeur +50 000€

1. **Corriger erreurs TypeScript** (2 semaines) → +20k€
   - Fixer 74 erreurs
   - Passer ESLint en mode strict
   - Activer `noUnusedLocals`

2. **Acquérir 10 clients pilotes** (3 mois) → +30k€
   - Offre founders : 50% de réduction
   - Accompagnement onboarding gratuit
   - → ARR : 6 000€ = +60k€ de valorisation

3. **Implémenter tests critiques** (3 semaines) → +15k€
   - Services accounting, invoicing, CRM
   - E2E tests principaux flows
   - → Confiance acheteur

**Valorisation après Quick Wins : 250 000€**

---

### 6.2 Stratégies Long-Terme (6-12 mois) - Valeur +100 000€

1. **Certification Experts-Comptables** → +40k€
   - Obtenir agrément Ordre des EC
   - Partenariats cabinets comptables
   - → Accès 20 000 cabinets français

2. **Marketplace d'intégrations** → +25k€
   - API publique documentée
   - Zapier/Make.com intégration
   - App store intégrations tierces

3. **Version White-Label** → +35k€
   - Rebrandable pour cabinets
   - Multi-tenancy avancé
   - → Nouveau segment B2B2B

**Valorisation long-terme : 350 000€+**

---

## 7. SCÉNARIOS D'ACQUISITION

### 7.1 Acquéreurs Potentiels

#### Catégorie A - Concurrents Directs
**Intérêt : ⭐⭐⭐⭐⭐**
- Pennylane, Indy, Zervant
- **Motivation :** Acqui-hire, technologie, clients
- **Valorisation :** 200-300k€

#### Catégorie B - Éditeurs Logiciels Adjacents
**Intérêt : ⭐⭐⭐⭐**
- Sellsy, Axonaut, Henrri
- **Motivation :** Compléter offre compta
- **Valorisation :** 180-250k€

#### Catégorie C - Cabinets Comptables Innovants
**Intérêt : ⭐⭐⭐**
- Grands cabinets cherchant digitalisation
- **Motivation :** Outils propriétaires
- **Valorisation :** 150-200k€

#### Catégorie D - Fonds d'Investissement Tech
**Intérêt : ⭐⭐**
- Early-stage VCs (si traction)
- **Motivation :** Potentiel croissance
- **Valorisation :** 150-180k€ + earnout

---

### 7.2 Structures de Deal Recommandées

#### Option 1 - Vente Sèche (Cash)
```
Prix fixe : 200 000€
Payable à la signature
Garantie d'actif-passif : 12 mois (10%)

Avantages :
✅ Liquidité immédiate
✅ Simplicité
✅ Pas de risque futur

Inconvénients :
❌ Pas d'upside si succès
❌ Valorisation limitée
```

#### Option 2 - Cash + Earnout
```
Prix de base : 150 000€ (cash)
Earnout sur 24 mois :
- Si ARR > 50k€ en An 1 : +30k€
- Si ARR > 150k€ en An 2 : +50k€
Total potentiel : 230 000€

Avantages :
✅ Upside si croissance
✅ Alignment avec acheteur
✅ Valorisation supérieure

Inconvénients :
❌ Risque non-paiement earnout
❌ Complexité
```

#### Option 3 - Cash + Equity (Startup)
```
Prix cash : 100 000€
Equity : 5-10% du nouvel ensemble
Vesting : 4 ans avec cliff 1 an

Avantages :
✅ Upside important (si exit)
✅ Participation croissance
✅ Rôle continued

Inconvénients :
❌ Illiquide
❌ Risque échec
❌ Dilution
```

---

## 8. RECOMMANDATIONS AVANT VENTE

### 8.1 Checklist Pré-Vente (Priorité Haute)

#### Technique
- [ ] **Corriger 74 erreurs TypeScript** (2 semaines)
- [ ] **Fixer modules HR et Assets** (1 semaine)
- [ ] **Tests E2E principaux flows** (1 semaine)
- [ ] **Documentation technique complète** (1 semaine)
- [ ] **Audit sécurité (OWASP Top 10)** (3 jours)

#### Commercial
- [ ] **Acquérir 5-10 clients pilotes** (2-3 mois)
- [ ] **Définir pricing final** (1 semaine)
- [ ] **Créer sales deck** (1 semaine)
- [ ] **Testimonials clients** (ongoing)

#### Juridique
- [ ] **Déposer marque INPI** (300€, 6 mois)
- [ ] **CGU/CGV professionnelles** (avocat 1500€)
- [ ] **Audit RGPD** (consultant 2000€)
- [ ] **Clean IP ownership** (vérifier contrats dev)

#### Financier
- [ ] **Prévisions 3 ans** (Excel détaillé)
- [ ] **CAC/LTV calculés** (analytics)
- [ ] **Unit economics** (dashboard)
- [ ] **Cap table propre** (si investisseurs)

**Coût total préparation : 8 000€**
**Délai : 3-4 mois**
**Impact valorisation : +50 000€ à +80 000€**

---

### 8.2 Data Room - Documents à Préparer

#### Technique
- [ ] Codebase (GitHub access)
- [ ] Architecture diagram
- [ ] Tech stack documentation
- [ ] Dependency tree (npm ls)
- [ ] Infrastructure docs (VPS, Supabase)
- [ ] Security audit report
- [ ] Performance metrics (Lighthouse)

#### Produit
- [ ] Product roadmap
- [ ] Feature list complète
- [ ] Screenshots/démos
- [ ] User flows
- [ ] Competitor analysis

#### Commercial
- [ ] Liste clients (anonymisée)
- [ ] Pricing grid
- [ ] Sales pipeline (si existant)
- [ ] Marketing materials
- [ ] CAC/LTV/Churn metrics

#### Financier
- [ ] P&L 2024-2025
- [ ] Balance sheet
- [ ] Cash-flow statement
- [ ] Projections 3 ans
- [ ] Cap table

#### Juridique
- [ ] Statuts société
- [ ] Kbis récent
- [ ] Contrats cloud (Supabase, Stripe)
- [ ] IP ownership proofs
- [ ] CGU/CGV
- [ ] Privacy policy
- [ ] RGPD compliance docs

---

## 9. CONCLUSION

### 9.1 Valorisation Finale Recommandée

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  VALORISATION CASSKAI - DÉCEMBRE 2025                   │
│                                                         │
│  Fourchette : 150 000 € - 280 000 €                    │
│                                                         │
│  Recommandation Prix de Vente :                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                         │
│        🎯  200 000 €  (Réaliste)                       │
│                                                         │
│  Avec structure :                                       │
│  • 150 000 € cash à la signature                       │
│  • 50 000 € earnout sur 24 mois                        │
│    (si ARR > 100k€)                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 9.2 Justification

**Points Forts (+) :**
- ✅ Stack moderne et scalable
- ✅ 150k+ LOC de code propriétaire
- ✅ 18 modules fonctionnels
- ✅ Intégrations complètes (Stripe, Supabase)
- ✅ Marché énorme (3,9M PME françaises)
- ✅ Infrastructure déployée et opérationnelle

**Points d'Amélioration (-) :**
- ❌ 74 erreurs TypeScript à corriger
- ❌ Modules HR et Assets non fonctionnels
- ❌ Aucun client payant actuel
- ❌ Tests limités
- ❌ Concurrence établie

**Valorisation équitable :** La fourchette 150-280k€ reflète :
1. **Valeur technologique réelle** : 4 ans de dev, stack premium
2. **Risques existants** : Bugs, absence de traction
3. **Potentiel de croissance** : Marché 2,5Mds€, multiple produits

---

### 9.3 Timeline Recommandée

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  TIMELINE OPTIMALE POUR MAXIMISER VALORISATION        │
│                                                        │
│  AUJOURD'HUI               Vente AS-IS : 150k€        │
│      │                                                 │
│      ▼                                                 │
│  + 1 MOIS                  Corrections TS : 180k€     │
│  (Quick fixes)                                         │
│      │                                                 │
│      ▼                                                 │
│  + 3 MOIS                  10 clients : 220k€         │
│  (Traction)                                            │
│      │                                                 │
│      ▼                                                 │
│  + 6 MOIS                  50 clients : 280k€+        │
│  (PMF prouvé)                                          │
│      │                                                 │
│      ▼                                                 │
│  + 12 MOIS                 500k€ - 1M€                │
│  (Scale-up)                (Multiple ARR 10-15×)      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### 9.4 Action Immédiate Suggérée

**Option A - Vente Rapide (150k€)**
- ✅ Liquidité sous 2-3 mois
- ✅ Pas d'investissement supplémentaire
- ❌ Valorisation basse

**Option B - Corrections + Vente (200k€)** ⭐ **RECOMMANDÉ**
- ✅ 1-2 mois corrections critiques
- ✅ +50k€ de valorisation
- ✅ Meilleur profil acheteur
- ⏱️ 3-4 mois total

**Option C - Build Traction (280k€+)**
- ✅ 6-12 mois croissance
- ✅ Valorisation maximale
- ❌ Risque exécution
- ❌ Investissement temps/argent

---

## 📞 CONTACT

Pour toute discussion sur l'acquisition de CassKai :

**NOUTCHE CONSEIL**
SIREN : 909 672 685
Email : contact@casskai.app
Site : https://casskai.app

---

**Document confidentiel - © NOUTCHE CONSEIL 2025**
**Dernière mise à jour : 8 Décembre 2025**
