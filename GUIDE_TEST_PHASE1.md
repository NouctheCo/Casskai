# 🧪 Guide de Test - Phase 1 UX

> **Testez les modifications UX en 5 minutes**

---

## 🚀 Démarrage Rapide

```bash
npm run dev
```

Ouvrez : http://localhost:5173

---

## ✅ Checklist de Test

### 1. TaxPage (/tax) 📋

**Scénario 1 : Créer une déclaration**
- [ ] Cliquer sur "Nouvelle Déclaration"
- [ ] Remplir le formulaire
- [ ] Soumettre
- [ ] **Résultat attendu :** Toast vert "Déclaration créée avec succès" (3s)

**Scénario 2 : Exporter**
- [ ] Cliquer sur "Exporter"
- [ ] **Résultat attendu :** Toast vert "Déclarations exportées en CSV avec succès"

**Scénario 3 : Supprimer**
- [ ] Cliquer sur supprimer une déclaration
- [ ] Confirmer
- [ ] **Résultat attendu :** Toast rouge "La déclaration supprimée"

**Scénario 4 : Erreur de chargement** (simuler déconnexion)
- [ ] Désactiver Supabase
- [ ] Recharger
- [ ] **Résultat attendu :** Toast rouge "Impossible de charger les données"

---

### 2. ThirdPartiesPage (/third-parties) 👥

**Scénario 1 : Liste vide avec EmptyState**
- [ ] Supprimer tous les filtres
- [ ] Si aucun tiers
- [ ] **Résultat attendu :** 
  ```
  👤 Icon Users (grande taille)
  "Aucun tiers trouvé"
  "Aucun tiers ne correspond..."
  [Bouton "Réinitialiser les filtres"]
  ```

**Scénario 2 : Exporter tiers**
- [ ] Cliquer sur "Exporter"
- [ ] **Résultat attendu :** Toast vert "Tiers exportés en CSV avec succès"

**Scénario 3 : Voir détails**
- [ ] Cliquer sur œil (View)
- [ ] **Résultat attendu :** Toast vert "Affichage des détails de [nom]"

**Scénario 4 : Modifier tiers**
- [ ] Cliquer sur crayon (Edit)
- [ ] **Résultat attendu :** Toast bleu "Édition de [nom]"

**Scénario 5 : Supprimer tiers**
- [ ] Cliquer sur poubelle (Delete)
- [ ] Confirmer
- [ ] **Résultat attendu :** Toast rouge "Le tiers supprimé"

---

### 3. UserManagementPage (/users) 👤

**Scénario 1 : Liste vide avec EmptyState**
- [ ] Filtrer par rôle inexistant
- [ ] **Résultat attendu :** 
  ```
  👥 Icon Users (grande taille)
  "Aucun utilisateur trouvé"
  "Aucun utilisateur ne correspond..."
  [Bouton "Ajouter un utilisateur"]
  ```

**Scénario 2 : Créer utilisateur**
- [ ] Cliquer sur "Ajouter un utilisateur"
- [ ] Remplir formulaire
- [ ] Sauvegarder
- [ ] **Résultat attendu :** Toast vert "L'utilisateur créé"

**Scénario 3 : Modifier utilisateur**
- [ ] Cliquer sur Edit
- [ ] Modifier informations
- [ ] Sauvegarder
- [ ] **Résultat attendu :** Toast bleu "Informations de l'utilisateur mis à jour"

**Scénario 4 : Envoyer invitation**
- [ ] Cliquer sur "Inviter un utilisateur"
- [ ] Entrer email
- [ ] Envoyer
- [ ] **Résultat attendu :** Toast vert "Invitation envoyée à [email]"

**Scénario 5 : Supprimer utilisateur**
- [ ] Cliquer sur Delete
- [ ] Confirmer dans AlertDialog
- [ ] **Résultat attendu :** Toast rouge "L'utilisateur supprimé"

---

### 4. AccountingPage (/accounting) 📊

**Scénario 1 : Nouvelle écriture (plan basique)**
- [ ] Être sur plan Starter/Basique
- [ ] Cliquer sur "Nouvelle Écriture"
- [ ] **Résultat attendu :** Toast rouge "Mettez à niveau votre plan..."

**Scénario 2 : Rapports avancés (plan basique)**
- [ ] Être sur plan Starter
- [ ] Cliquer sur "Voir Rapports"
- [ ] **Résultat attendu :** Toast rouge "Les rapports avancés sont disponibles..."

**Scénario 3 : Export FEC**
- [ ] Cliquer sur "Exporter"
- [ ] **Résultat attendu :** Toast vert "Génération du fichier FEC en cours..."

---

## 🎨 Vérifications Visuelles

### Toast Helpers (nouveau système)

**Aspect :**
- ✅ Position : Bas droite
- ✅ Durée : 3 secondes
- ✅ Animations : Slide in/out fluide
- ✅ Icônes :
  - Succès : ✓ CheckCircle (vert)
  - Erreur : ✗ X (rouge)
  - Info : ⓘ Info (bleu)
  - Mise à jour : ↻ RefreshCw (bleu)
  - Suppression : 🗑️ Trash (rouge)

**Couleurs :**
```
Succès  : Fond vert, texte foncé
Erreur  : Fond rouge, texte blanc
Info    : Fond bleu, texte foncé
```

### EmptyState

**Aspect :**
- ✅ Icône : Grande taille (64px), centrée, grise
- ✅ Titre : Gras, texte-lg, centré
- ✅ Description : Texte-sm, gris, centré
- ✅ Bouton d'action : Bleu, centré

**Responsive :**
- Mobile : Icône plus petite, texte ajusté
- Desktop : Pleine taille

---

## 🐛 Tests d'Erreur

### 1. Erreur réseau
```bash
# Couper Supabase temporairement
# Recharger pages
```
- [ ] TaxPage : Toast "Impossible de charger..."
- [ ] ThirdPartiesPage : Toast "Impossible de charger les tiers"
- [ ] Aucun crash

### 2. Action sans confirmation
```bash
# Essayer delete sans confirm
```
- [ ] Modal de confirmation s'affiche
- [ ] Annuler fonctionne
- [ ] Confirmer supprime + toast

### 3. Formulaire invalide
```bash
# Soumettre formulaire vide
```
- [ ] Validation Zod bloque (si intégré)
- [ ] Sinon, toast erreur approprié

---

## 📊 Résultats Attendus

### Avant Phase 1
```
❌ Toast inconsistants (useToast hook)
❌ États vides sans action
❌ Messages verbeux
```

### Après Phase 1
```
✅ Toast uniformes (helpers)
✅ EmptyState avec actions claires
✅ Messages concis et directs
✅ +3 points UX (4.5 → 7.5)
```

---

## 🎯 Bugs Potentiels à Surveiller

### Toast Helpers
- [ ] Toasts s'empilent correctement (max 3)
- [ ] Durée respectée (3s)
- [ ] Fermeture manuelle fonctionne
- [ ] Pas de duplicate sur double-clic

### EmptyState
- [ ] Responsive sur mobile
- [ ] Bouton action cliquable
- [ ] Icône affichée
- [ ] Mode sombre compatible

### Accessibilité
- [ ] Tab navigation fonctionne
- [ ] Checkboxes aria-label lisibles
- [ ] Screen reader compatible (optionnel)

---

## 📝 Rapport de Test

**Date :** _____________

**Pages testées :**
- [ ] TaxPage
- [ ] ThirdPartiesPage
- [ ] UserManagementPage
- [ ] AccountingPage

**Bugs trouvés :** 
- _____________________________
- _____________________________

**Améliorations suggérées :**
- _____________________________
- _____________________________

**Score UX perçu :** ___/10

---

## 🚀 Commandes Utiles

```bash
# Démarrer dev
npm run dev

# Vérifier erreurs
npm run lint

# Build production
npm run build

# Preview production
npm run preview
```

---

*Temps de test : 5-10 minutes*  
*Guide généré automatiquement*
