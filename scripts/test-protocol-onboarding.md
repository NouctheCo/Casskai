# 🧪 PROTOCOLE DE TEST - ONBOARDING COMPLET

## 📋 PRÉPARATION

### ✅ État Validé
- Base de données propre confirmée
- Application déployée sur https://casskai.app
- Variables d'environnement correctement configurées

### 🛠️ Setup Test
1. **Ouvrir navigateur en mode incognito/privé**
2. **Vider tout cache/localStorage** (F12 > Application > Storage > Clear all)
3. **Préparer email de test**: `test-onboarding-$(date +%s)@test.com`

## 🎯 ÉTAPES DE TEST

### **ÉTAPE 1: Inscription & Connexion**
1. **Aller sur**: https://casskai.app
2. **Cliquer** sur "S'inscrire" ou "Créer un compte"
3. **Utiliser email**: `test-modules-demo@test.com`
4. **Mot de passe**: `TestPassword123!`
5. **Vérifier**: Email de confirmation reçu et compte activé

**✅ Attendu**: Redirection automatique vers `/onboarding`

### **ÉTAPE 2: Étapes Onboarding**

#### **Step 1 - Welcome**
- **Vérifier**: Page welcome s'affiche
- **Action**: Cliquer "Suivant"

#### **Step 2 - Features (CRITIQUE)**
- **Vérifier**: Liste des modules disponibles s'affiche
- **Modules à sélectionner**:
  - ✅ CRM & Ventes
  - ✅ RH Light  
  - ✅ Gestion de Projets
  - ✅ Marketplace
- **Action**: Cocher ces 4 modules
- **Vérifier**: Compteur "4 modules sélectionnés"
- **Action**: Cliquer "Suivant"

#### **Step 3 - Preferences**
- **Action**: Choisir préférences (langue, devise, etc.)
- **Action**: Cliquer "Suivant"

#### **Step 4 - Company**
- **Données entreprise**:
  - Nom: "Test Company Demo"
  - Pays: France
  - Secteur: Technologie
  - SIRET: 12345678901234
- **Action**: Remplir et cliquer "Suivant"

#### **Step 5 - Complete (CRITIQUE)**
- **Vérifier**: Animation de configuration
- **Observer console** (F12): Logs de progression
- **Attendre**: "Configuration terminée !"
- **Action**: Cliquer "Commencer avec CassKai"

**✅ Attendu**: Redirection vers `/dashboard`

### **ÉTAPE 3: Vérification Dashboard & Modules**

#### **Sidebar - Modules Core (toujours visibles)**
- ✅ Tableau de bord
- ✅ Comptabilité 
- ✅ Banques
- ✅ Tiers
- ✅ Rapports

#### **Sidebar - Modules Premium (sélectionnés)**
- ✅ **CRM & Ventes** (badge Premium, bleu)
  - Dashboard CRM
  - Contacts
  - Pipeline  
  - Devis
  - Affaires
- ✅ **RH Light** (badge Premium, vert)
  - Dashboard RH
  - Employés
  - Congés
  - Notes de frais
  - Paie
- ✅ **Projets** (badge Premium, violet)
  - Dashboard Projets
  - Liste des projets
  - Timetracking
  - Rapports projets
- ✅ **Marketplace** (badge Nouveau, orange)
  - Découvrir
  - Mes extensions
  - Publier

### **ÉTAPE 4: Test Navigation Modules**

#### **Test CRM**
1. **Cliquer**: "CRM & Ventes" dans sidebar
2. **Vérifier**: Page CRM se charge
3. **Tester**: Navigation sous-pages (Contacts, Pipeline)
4. **Vérifier**: Aucune erreur console

#### **Test RH**  
1. **Cliquer**: "RH Light" dans sidebar
2. **Vérifier**: Page RH se charge
3. **Tester**: Navigation (Employés, Congés)

#### **Test Projets**
1. **Cliquer**: "Projets" dans sidebar
2. **Vérifier**: Page Projets se charge
3. **Tester**: Navigation (Liste, Timetracking)

### **ÉTAPE 5: Vérification Mode Essai**

#### **Indicator Essai**
- **Chercher**: Notification/badge mode essai
- **Vérifier**: "Essai gratuit - X jours restants"
- **Localisation attendue**: Header ou sidebar

#### **Fonctionnalités Complètes**
- **Vérifier**: Tous modules fonctionnent sans limitation
- **Tester**: Création données dans chaque module
- **Confirmer**: Aucune restriction "premium"

## 🔍 POINTS DE VALIDATION CRITIQUES

### ❌ **Erreurs à Surveiller**
- Console JavaScript vide (aucune erreur rouge)
- Pas d'erreur "useModules must be used within ModulesProvider"
- Pas d'erreur UUID "default"
- Navigation fluide entre modules

### ✅ **Critères de Succès**
1. **Onboarding complet** sans erreur
2. **4 modules sélectionnés** visibles en sidebar
3. **Navigation fonctionnelle** dans chaque module
4. **Mode essai actif** sur tous modules
5. **Persistance** après rechargement page

## 📊 LOGS À SURVEILLER

### **Console Logs Attendus**
```
[ModulesProviderWrapper] En attente d'un tenantId valide...
[ModulesProvider] Chargement des modules depuis Supabase...
[ModulesProvider] Modules actifs depuis la base: {crm: true, hr: true, projects: true, marketplace: true}
[ModulesProvider] Modules chargés depuis Supabase avec succès
```

### **Erreurs à Éviter**
```
❌ useModules must be used within a ModulesProvider
❌ invalid input syntax for type uuid: 'default'
❌ tenantId invalide pour l'initialisation
```

## 🐛 DÉPANNAGE

### **Si modules n'apparaissent pas**
1. Vérifier console pour erreurs
2. Vérifier Base Supabase: table `companies`, colonne `active_modules`
3. Forcer rechargement modules: `window.dispatchEvent(new CustomEvent('reload-user-modules'))`

### **Si erreur ModulesProvider**
1. Vérifier AuthContext.currentEnterpriseId n'est pas "default"
2. Vider localStorage complètement
3. Recommencer onboarding

## ✅ RÉSULTAT ATTENDU FINAL

Un nouveau client peut :
- ✅ S'inscrire et faire l'onboarding complet
- ✅ Sélectionner ses modules préférés
- ✅ Voir ces modules dans la sidebar avec badges appropriés  
- ✅ Naviguer dans chaque module sélectionné
- ✅ Utiliser toutes fonctionnalités en mode essai
- ✅ Conserver l'état après rechargement navigateur

**🎯 MISSION RÉUSSIE si tous ces points sont validés !**