# 📚 Guide Utilisateur CassKai - Phase 1 (Février 2026)

**Bienvenue dans CassKai !** 🎉

Ce guide vous présente les **nouvelles fonctionnalités** de la Phase 1, conçues pour simplifier votre comptabilité quotidienne.

---

## 🆕 Nouveautés Phase 1

### ✅ Corrections majeures
- **Balances d'ouverture corrigées** : Les bilans comparatifs N vs N-1 sont désormais cohérents
- **Rapprochement bancaire opérationnel** : Matching automatique avec vos écritures comptables
- **Validation SYSCOHADA automatique** : Pour les entreprises en zone OHADA (17 pays)

### 🚀 Nouvelles fonctionnalités
- **Auto-catégorisation intelligente (IA)** : Suggestions automatiques de comptes comptables
- **Rapprochement bancaire automatique** : 80%+ de vos transactions rapprochées automatiquement
- **Validation comptable SYSCOHADA** : Score de conformité en temps réel

---

## 1️⃣ Auto-Catégorisation Intelligente (IA)

### 🤖 Qu'est-ce que c'est ?

CassKai apprend de votre historique pour **suggérer automatiquement** le bon compte comptable lorsque vous saisissez une transaction.

### 📍 Où la trouver ?

- **Lors de la saisie d'écritures comptables** (module Comptabilité)
- **Import de relevés bancaires** (module Banque)
- **Catégorisation manuelle** (onglet Catégorisation)

### 📖 Comment l'utiliser ?

#### Étape 1 : Saisir une description

Lorsque vous créez une écriture comptable, commencez par saisir la description :

```
Description : "VIR SALAIRES JANVIER 2024"
```

#### Étape 2 : Voir les suggestions

CassKai affiche automatiquement des suggestions avec un **score de confiance** :

```
✨ Suggestions IA :
┌─────────────────────────────────────────────┐
│ 641000 - Rémunérations du personnel         │
│ 🎯 Confiance: 95% | Utilisé 12 fois         │
│ ✅ Suggestion recommandée                    │
└─────────────────────────────────────────────┘
```

#### Étape 3 : Valider ou corriger

**Option A - Accepter la suggestion :**
- Cliquez sur **"Utiliser"**
- Le compte est automatiquement rempli

**Option B - Choisir un autre compte :**
- Sélectionnez manuellement le compte souhaité
- CassKai **apprendra** de votre choix pour la prochaine fois

#### Étape 4 : CassKai apprend en continu

- Chaque validation **améliore les suggestions** futures
- L'accuracy augmente progressivement (objectif 85%+)
- Les descriptions similaires obtiennent de meilleures suggestions

### 💡 Astuces

**✅ Pour de meilleures suggestions :**
- Utilisez des descriptions **claires et cohérentes** (ex: "VIR SALAIRES" au lieu de "paiement")
- Validez ou corrigez **systématiquement** les suggestions
- Attendez ~50 transactions pour voir l'IA s'améliorer

**❌ À éviter :**
- Descriptions trop vagues ("divers", "frais", "paiement")
- Changements fréquents de formulation
- Ignorer les suggestions sans donner de feedback

### 📊 Statistiques d'utilisation

Consultez vos statistiques IA dans **Paramètres > Auto-Catégorisation** :

- **Accuracy rate** : Pourcentage de suggestions acceptées
- **Suggestions totales** : Nombre de suggestions générées
- **Comptes les plus utilisés** : Top 10 des comptes suggérés
- **Gain de temps** : Estimation du temps économisé

---

## 2️⃣ Rapprochement Bancaire Automatique

### 🏦 Qu'est-ce que c'est ?

Le rapprochement bancaire **associe automatiquement** vos transactions bancaires avec vos écritures comptables.

### 📍 Où le trouver ?

**Module Banque** → **Onglet Rapprochement**

### 📖 Comment l'utiliser ?

#### Étape 1 : Importer votre relevé bancaire

```
1. Allez dans "Banque" > "Transactions"
2. Cliquez sur "Importer" (CSV/OFX/QIF)
3. Sélectionnez votre fichier relevé bancaire
4. Validez l'import
```

#### Étape 2 : Lancer le rapprochement automatique

```
1. Allez dans "Banque" > "Rapprochement"
2. Sélectionnez votre compte bancaire
3. Cliquez sur "Rapprochement Automatique"
```

**CassKai va :**
- ✅ Analyser vos transactions bancaires
- ✅ Chercher les écritures comptables correspondantes
- ✅ Calculer un **score de confiance** pour chaque correspondance
- ✅ Créer automatiquement les rapprochements (score >80%)

#### Étape 3 : Valider les suggestions (optionnel)

Pour les correspondances avec score 70-80%, CassKai demande validation :

```
🔍 Correspondance potentielle détectée :

Transaction bancaire :              Écriture comptable :
┌─────────────────────────────┐    ┌─────────────────────────────┐
│ 15/01/2024                  │    │ 14/01/2024                  │
│ VIR CLIENT ABC SARL         │    │ Facture ABC-2024-001        │
│ +2 500,00 €                 │    │ +2 500,00 €                 │
└─────────────────────────────┘    └─────────────────────────────┘

🎯 Confiance: 78% (Montant exact + Date proche)

[Valider]  [Ignorer]
```

Cliquez sur **"Valider"** pour créer le rapprochement.

#### Étape 4 : Rapprocher manuellement le reste

Pour les transactions sans correspondance automatique :

```
1. Cliquez sur la transaction bancaire
2. Sélectionnez l'écriture comptable correspondante
3. Cliquez sur "Rapprocher"
```

### 💡 Astuces

**✅ Pour de meilleurs résultats :**
- Saisissez vos **écritures comptables AVANT** d'importer le relevé
- Utilisez des **références cohérentes** (numéro facture, client)
- Lancez le rapprochement **régulièrement** (toutes les semaines)

**❌ À éviter :**
- Importer le relevé sans avoir saisi les écritures
- Descriptions bancaires différentes des écritures comptables
- Attendre la fin du mois pour rapprocher (plus difficile)

### 📊 Statistiques de rapprochement

Le dashboard affiche en temps réel :

```
📊 Statistiques de Rapprochement
┌──────────────────────────────────────────┐
│ Total transactions:        150           │
│ Rapprochées:              128 (85%)      │
│ En attente:                22 (15%)      │
│                                          │
│ Solde banque:         +25 430,00 €       │
│ Solde comptable:      +25 430,00 €       │
│ Écart:                     0,00 € ✅      │
└──────────────────────────────────────────┘
```

---

## 3️⃣ Validation SYSCOHADA Automatique

### 🌍 Qu'est-ce que c'est ?

Pour les entreprises en **zone OHADA** (17 pays africains), CassKai valide automatiquement la conformité SYSCOHADA de votre comptabilité.

### 📍 Pays couverts

- 🇨🇮 Côte d'Ivoire
- 🇧🇯 Bénin
- 🇸🇳 Sénégal
- 🇧🇫 Burkina Faso
- 🇹🇬 Togo
- 🇲🇱 Mali
- 🇳🇪 Niger
- 🇨🇲 Cameroun
- 🇬🇦 Gabon
- 🇨🇬 Congo
- 🇨🇩 RD Congo
- 🇨🇫 Centrafrique
- 🇹🇩 Tchad
- 🇬🇶 Guinée Équatoriale
- 🇬🇼 Guinée-Bissau
- 🇬🇳 Guinée
- 🇰🇲 Comores

### 📖 Comment l'utiliser ?

#### Étape 1 : Activer la validation

```
1. Allez dans "Paramètres" > "Comptabilité"
2. Sélectionnez "SYSCOHADA" comme norme comptable
3. Cochez "Validation automatique activée"
4. Sauvegardez
```

#### Étape 2 : Consulter le score de conformité

Le dashboard affiche votre **score SYSCOHADA** en temps réel :

```
🏆 Score de Conformité SYSCOHADA: 92/100

✅ Plan comptable conforme (8 classes)
✅ Séparation HAO correcte (comptes 8x)
⚠️  2 avertissements mineurs
❌ 0 erreur critique
```

#### Étape 3 : Corriger les erreurs détectées

Cliquez sur **"Voir détails"** pour afficher les erreurs :

```
⚠️ Avertissement - Code: HAO_NOT_IN_CLASS_8
┌────────────────────────────────────────────────────────┐
│ Écriture: JE-2024-015                                  │
│ Description: "Cession matériel ancien"                 │
│                                                        │
│ ❌ Problème:                                           │
│ Écriture semble être Hors Activités Ordinaires (HAO)  │
│ mais n'utilise pas la classe 8                         │
│                                                        │
│ ✅ Suggestion:                                         │
│ Utiliser comptes 82x (Produits HAO) au lieu de 7x     │
│                                                        │
│ 📘 Référence: SYSCOHADA art. 51 - HAO                 │
└────────────────────────────────────────────────────────┘

[Corriger l'écriture]  [Ignorer]
```

### 💡 Astuces

**✅ Bonnes pratiques SYSCOHADA :**
- Respecter les **8 classes** du plan comptable
- Séparer clairement les **HAO** (classe 8) des activités ordinaires
- Vérifier régulièrement le **TAFIRE** (Tableau de flux de trésorerie)
- Maintenir l'équilibre **Débit = Crédit**

**❌ À éviter :**
- Mélanger comptes HAO (8x) avec comptes ordinaires (6x, 7x)
- Oublier les comptes obligatoires (Capital, Banques, Caisse)
- Créer des comptes hors nomenclature SYSCOHADA

### 📊 Rapports SYSCOHADA

CassKai génère automatiquement les rapports réglementaires :

- **Bilan SYSCOHADA** (Actif / Passif)
- **Compte de Résultat** (Charges / Produits + HAO)
- **TAFIRE** (Tableau de flux de trésorerie)

Allez dans **Comptabilité** → **Rapports** → **Norme SYSCOHADA**

---

## 4️⃣ Bilans Comparatifs Cohérents

### 🔧 Qu'est-ce qui a été corrigé ?

**Problème avant :** Les balances d'ouverture (N) ne correspondaient pas aux balances de clôture (N-1).

**Solution Phase 1 :** Rollforward comptable correct garanti.

### 📖 Comment vérifier ?

#### Étape 1 : Générer un bilan comparatif

```
1. Allez dans "Comptabilité" > "Rapports"
2. Sélectionnez "Bilan Comparatif"
3. Choisissez l'exercice (ex: 2024)
4. Cliquez sur "Générer"
```

#### Étape 2 : Vérifier la cohérence

Le bilan affiche maintenant **N** et **N-1** de façon cohérente :

```
BILAN AU 31/12/2024

Compte          | Net N    | Net N-1   | Variation
────────────────┼──────────┼───────────┼──────────
512000 Banques  | 28 450 € | 25 000 €  | +3 450 € ✅
411000 Clients  | 15 230 € | 12 500 €  | +2 730 € ✅

✅ Opening Balance (N) = Closing Balance (N-1)
✅ Rollforward correct garanti
```

### 💡 Impact métier

**Avant (bug) :**
- ❌ Bilans incohérents
- ❌ KPIs faussés (DSO, BFR)
- ❌ Variation trésorerie incorrecte

**Après (corrigé) :**
- ✅ Bilans cohérents multi-exercices
- ✅ KPIs fiables
- ✅ Conformité audit (IFAC, SOX)

---

## 🆘 Support et Aide

### 📧 Contact

- **Email** : support@casskai.app
- **Téléphone** : +33 (0)1 XX XX XX XX
- **Chat en ligne** : Disponible 24/7 dans l'application

### 📚 Ressources

- **Base de connaissances** : https://casskai.app/docs
- **Tutoriels vidéo** : https://casskai.app/videos
- **Webinaires mensuels** : Inscription sur casskai.app/webinaires

### 🐛 Signaler un bug

Si vous rencontrez un problème :

```
1. Cliquez sur "?" en bas à droite
2. Sélectionnez "Signaler un bug"
3. Décrivez le problème et ajoutez une capture d'écran
4. Notre équipe vous répondra sous 24h
```

---

## 🎓 Formation

### Webinaire de lancement Phase 1

**📅 Date :** 15 février 2026 à 14h00 (GMT+1)
**⏱️ Durée :** 30 minutes
**🎤 Animateur :** Aldric Afannou, Fondateur CassKai

**Au programme :**
- Démonstration auto-catégorisation IA
- Workflow rapprochement bancaire complet
- Validation SYSCOHADA en pratique
- Questions / Réponses

**📝 Inscription gratuite :** [lien webinaire]

### Certification CassKai Expert

Devenez **Expert CassKai Certifié** en suivant notre formation :

- **Module 1** : Comptabilité PCG/SYSCOHADA (4h)
- **Module 2** : Rapprochement bancaire avancé (2h)
- **Module 3** : Optimisation trésorerie & BFR (3h)
- **Module 4** : Reporting et analyse IA (2h)

**💰 Prix :** 299 € HT | **🎓 Certification officielle incluse**

---

## 📊 Feuille de route Phase 2 (Mars-Mai 2026)

**Prochaines fonctionnalités :**

### Phase 2 (P1) - High-Impact
- 📱 **Mobile PWA** (application mobile)
- 🔍 **Rapports interactifs** avec drill-down
- ⚡ **Dashboard temps réel** (Supabase Realtime)
- ⌨️ **Shortcuts clavier** et autocomplete

### Phase 3 (P2) - Strategic
- 🏢 **Consolidation IFRS** automatique
- 📈 **TAFIRE SYSCOHADA** automatique
- 🌍 **Moteur fiscal OHADA** (17 pays)
- 🔒 **Audit trail SOX-compliant**

**Suivez notre roadmap publique :** [roadmap.casskai.app]

---

## ✨ Changelog Phase 1

### Version 1.5.0 (Février 2026)

**🆕 Nouveautés :**
- ✅ Auto-catégorisation IA (GPT-4)
- ✅ Rapprochement bancaire automatique (RPC Supabase)
- ✅ Validation SYSCOHADA automatique
- ✅ Correction bug opening balance (rollforward)

**🔧 Améliorations :**
- Performance génération rapports (+60%)
- UX formulaires écritures comptables
- Dashboard statistiques temps réel
- Support multi-devises amélioré

**🐛 Corrections :**
- Balances d'ouverture incohérentes (CORRIGÉ)
- Doublons dans calcul DSO (CORRIGÉ)
- Export FEC avec caractères spéciaux (CORRIGÉ)

---

**© 2025 NOUTCHE CONSEIL - CassKai Platform**
**Tous droits réservés**

Version du document : 1.0 (Février 2026)
