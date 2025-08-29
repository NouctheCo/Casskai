# Tests Manuels des Workflows Critiques - MVP Phase 1

## Prérequis
- Application lancée sur http://localhost:5174
- Base de données Supabase opérationnelle
- Navigateur moderne (Chrome/Firefox)

---

## Test 1: Workflow Onboarding Complet ✓

### Objectif
Vérifier qu'un utilisateur peut s'inscrire et configurer complètement son entreprise.

### Étapes à tester:
1. **Accès page d'accueil** → http://localhost:5174
   - [ ] Page se charge sans erreur
   - [ ] Éléments UI présents et fonctionnels

2. **Processus d'inscription/connexion**
   - [ ] Clic sur "Commencer" ou "S'inscrire"
   - [ ] Formulaire d'inscription fonctionnel
   - [ ] Validation email (si nécessaire)
   - [ ] Redirection après connexion

3. **Assistant onboarding**
   - [ ] Étape 1: Informations entreprise (nom, secteur, etc.)
   - [ ] Étape 2: Configuration comptable (plan de comptes, exercice fiscal)
   - [ ] Étape 3: Préférences utilisateur
   - [ ] Finalisation et accès au dashboard

### Résultat attendu:
✅ L'utilisateur arrive sur le dashboard avec son entreprise configurée

---

## Test 2: Création Facture avec PDF ✓

### Objectif  
Créer une facture complète et générer son PDF.

### Étapes à tester:
1. **Navigation vers module Facturation**
   - [ ] Menu sidebar → Facturation accessible
   - [ ] Page factures se charge

2. **Création d'un client**
   - [ ] Bouton "Nouveau client" fonctionnel
   - [ ] Formulaire de création client
   - [ ] Sauvegarde en base de données

3. **Création de facture**
   - [ ] Bouton "Nouvelle facture"
   - [ ] Sélection du client créé
   - [ ] Ajout de lignes (produits/services)
   - [ ] Calculs automatiques (HT, TVA, TTC)
   - [ ] Sauvegarde facture

4. **Génération PDF**
   - [ ] Bouton "Générer PDF" visible
   - [ ] Clic génère et télécharge le PDF
   - [ ] PDF contient toutes les informations
   - [ ] Mise en forme correcte

### Résultat attendu:
✅ Facture créée, sauvée en DB et PDF généré avec succès

---

## Test 3: CRM Pipeline Drag & Drop ✓

### Objectif
Tester le pipeline CRM avec fonctionnalité drag & drop d'opportunités.

### Étapes à tester:
1. **Navigation vers CRM**
   - [ ] Menu sidebar → CRM & Ventes accessible
   - [ ] Page CRM se charge avec onglets

2. **Création d'opportunités**
   - [ ] Onglet "Opportunités" accessible
   - [ ] Bouton "Nouvelle opportunité"
   - [ ] Formulaire création avec sélection client
   - [ ] Création de 2-3 opportunités test

3. **Test Pipeline Drag & Drop**
   - [ ] Onglet "Pipeline" accessible
   - [ ] Affichage des colonnes par étape
   - [ ] Opportunités visibles dans colonne "Prospection"
   - [ ] Drag & drop vers "Qualification" fonctionne
   - [ ] Drag & drop vers "Proposition" fonctionne
   - [ ] Mise à jour en temps réel en base de données

4. **Statistiques pipeline**
   - [ ] Statistiques globales mises à jour
   - [ ] Calculs valeur par étape corrects
   - [ ] Taux de conversion affiché

### Résultat attendu:
✅ Pipeline drag & drop fonctionnel avec persistance en base

---

## Test 4: Import FEC avec Validation ✓

### Objectif
Tester l'import d'un fichier FEC avec validation complète.

### Étapes à tester:
1. **Navigation vers Import FEC**
   - [ ] Menu sidebar → Comptabilité
   - [ ] Onglet ou section "Import FEC" accessible

2. **Préparation fichier test FEC**
   - [ ] Créer un fichier .txt avec format FEC minimal:
   ```
   JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise
   VT|VENTES|00001|20240101|701000|VENTES MARCHANDISES|||FAC001|20240101|Vente marchandises|0.00|1000.00||||0.00|EUR
   VT|VENTES|00001|20240101|411000|CLIENTS|||FAC001|20240101|Vente marchandises|1000.00|0.00||||1000.00|EUR
   ```

3. **Test import**
   - [ ] Zone drag & drop présente
   - [ ] Glisser-déposer du fichier FEC
   - [ ] Parsing automatique du fichier
   - [ ] Affichage résumé avec statistiques
   - [ ] Validation des erreurs/warnings
   - [ ] Bouton "Importer" disponible

4. **Validation import**
   - [ ] Clic "Importer" déclenche l'import
   - [ ] Progression affichée
   - [ ] Création automatique journaux manquants
   - [ ] Création automatique comptes manquants  
   - [ ] Création écritures comptables
   - [ ] Rapport final avec statistiques

### Résultat attendu:
✅ Import FEC complet avec validation et création données en base

---

## Test 5: Navigation entre Modules ✓

### Objectif
Vérifier la navigation fluide entre tous les modules principaux.

### Étapes à tester:
1. **Dashboard → Facturation**
   - [ ] Navigation depuis dashboard
   - [ ] Page se charge sans erreur
   - [ ] Retour dashboard fonctionne

2. **Facturation → CRM** 
   - [ ] Navigation directe menu sidebar
   - [ ] État préservé entre modules
   - [ ] Aucune perte de données

3. **CRM → Comptabilité**
   - [ ] Navigation menu sidebar
   - [ ] Onglets comptabilité accessibles
   - [ ] Import FEC accessible

4. **Comptabilité → Dashboard**
   - [ ] Retour au dashboard
   - [ ] Widgets se rechargent correctement
   - [ ] Données à jour

5. **Test navigation profonde**
   - [ ] URL direct vers module spécifique
   - [ ] Bouton retour navigateur
   - [ ] Pas de perte de session

### Résultat attendu:
✅ Navigation fluide entre tous les modules sans erreur

---

## Rapport de Tests

### Tests Automatisés Réussis ✅
- [x] Structure base de données
- [x] Composants UI compilent  
- [x] Build production réussi
- [x] Services TypeScript fonctionnels

### Tests Manuels à Compléter
- [ ] Test 1: Workflow onboarding
- [ ] Test 2: Création facture + PDF
- [ ] Test 3: CRM pipeline drag & drop
- [ ] Test 4: Import FEC validation
- [ ] Test 5: Navigation modules

### Problèmes Identifiés
- Connectivité Supabase à vérifier en local
- Quelques warnings ESLint à nettoyer (non bloquant)

### Prêt pour Production?
- ✅ Fonctionnalités principales implémentées
- ✅ Architecture solide 
- ✅ Code compilable et déployable
- ⏳ Tests manuels en cours

**Status: PRÊT POUR TESTS UTILISATEUR MANUELS**