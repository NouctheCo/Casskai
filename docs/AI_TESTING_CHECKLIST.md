# 🔍 Guide de Test des Fonctionnalités IA - CassKai

## Checklist de Vérification Visuelle

### ✅ Phase 1 : Analyse de Documents (Formulaire Écriture)

**Où :** Comptabilité → Écritures → Nouvelle écriture

**Ce que tu DOIS voir :**

```
┌─────────────────────────────────────────────────────────┐
│ Date          │ Journal                                  │
│ [29/01/2026]  │ [Sélectionner un journal ▼]            │
└─────────────────────────────────────────────────────────┘

┌─ ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ─┐
│ ✨ Analyse automatique par IA                            │
│                                                          │
│ Uploadez une facture ou un reçu pour pré-remplir       │
│ automatiquement l'écriture comptable.                   │
│                                                          │
│ [📤 Choisir un document (PDF, JPG, PNG)]               │
└─ ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ─┘

┌─────────────────────────────────────────────────────────┐
│ Référence (auto-générée, modifiable)                    │
│ [20260129-1967]                                         │
└─────────────────────────────────────────────────────────┘
```

**Test manuel :**
1. Clique sur "Choisir un document"
2. Sélectionne une facture PDF/image
3. Attends 3-5 secondes (spinner "Analyse en cours...")
4. ✅ Un badge apparaît avec données extraites
5. ✅ Formulaire pré-rempli automatiquement

---

### ✅ Phase 2 : Catégorisation Bancaire (Import Transactions)

**Où :** Banking → Import Transactions → Upload CSV

**Ce que tu DOIS voir :**

Après import d'un fichier CSV de transactions bancaires :

```
┌───────────────────────────────────────────────────────────────┐
│ 🏦 Transactions Importées (50)                                │
├───────────────────────────────────────────────────────────────┤
│ ℹ️ Toast : "Catégorisation IA en cours..."                    │
│ ℹ️ Toast : "Catégorisation IA complète - 45/50 catégorisées"  │
└───────────────────────────────────────────────────────────────┘

Tableau des transactions :

┌──────────┬──────────────────┬─────────┬─────────────────────────┐
│ Date     │ Description      │ Montant │ Catégorie Suggérée      │
├──────────┼──────────────────┼─────────┼─────────────────────────┤
│ 15/01/26 │ VIR EDF ENERGIE  │ -144.00 │ 🤖 606 - Énergie (92%)  │
│ 16/01/26 │ CB RESTAURANT    │  -45.00 │ 🤖 625 - Déplace (87%)  │
│ 20/01/26 │ VIR SALAIRE      │ 2500.00 │ 🤖 421 - Salaires (95%) │
└──────────┴──────────────────┴─────────┴─────────────────────────┘
                                           ↑
                                Badge avec score confiance
```

**Éléments à vérifier :**
- [ ] Badge "🤖" ou "AI" sur suggestions
- [ ] Pourcentage de confiance affiché (%)
- [ ] Couleur badge selon confiance :
  - Rouge < 70% (⚠️ Vérification recommandée)
  - Orange 70-85% (⚠️ À vérifier)
  - Vert > 85% (✅ Haute confiance)

**Test manuel :**
1. Va dans Banking → Import
2. Upload un fichier CSV avec transactions
3. Attends que l'import se termine
4. ✅ Toast "Catégorisation IA en cours..." apparaît
5. ✅ Suggestions avec scores de confiance visibles

**Fichier CSV test :**
```csv
Date,Description,Montant
2026-01-15,VIR EDF ENERGIE,-144.00
2026-01-16,CB RESTAURANT PARIS,-45.00
2026-01-20,VIR SALAIRE JANVIER,2500.00
2026-01-22,PRELEVEMENT LOYER,-800.00
```

---

### ✅ Phase 3 : Assistant IA Contextuel (Chat Flottant)

**Où :** Partout dans l'application (bouton en bas à droite)

**Ce que tu DOIS voir :**

```
                                    ┌────────────────────────┐
                                    │                        │
                                    │                        │
                                    │                        │
                                    │                        │
                                    │                        │
                                    │                        │
                                    │                        │
                                    │                        │
                                    │                        │
                                    │         [💬✨]        │ ← Bouton flottant
                                    └────────────────────────┘
                                         violet/gradient
```

**Après clic sur le bouton :**

```
┌─────────────────────────────────────────────┐
│ ✨ Assistant IA CassKai              [X]    │
├─────────────────────────────────────────────┤
│                                             │
│  ✨ CassKai AI Assistant                    │
│  Poser une question...                      │
│                                             │
│  [Si aucune entreprise sélectionnée:]      │
│  ⚠️ Aucune entreprise sélectionnée         │
│                                             │
├─────────────────────────────────────────────┤
│ [Poser une question...____________] [📤]   │
└─────────────────────────────────────────────┘
```

**Conversation exemple :**

```
┌─────────────────────────────────────────────┐
│ ✨ Assistant IA CassKai         [Effacer][X]│
├─────────────────────────────────────────────┤
│                                             │
│ Quelle est ma trésorerie ?          [User] │
│ ┌─────────────────────────────────────────┐ │
│ │ D'après tes données, votre trésorerie   │ │
│ │ actuelle est de 12 450€.                │ │
│ │                                         │ │
│ │ Détails :                               │ │
│ │ • Actifs : 45 300€                      │ │
│ │ • Résultat net : +3 200€                │ │
│ │ • Créances en attente : 8 500€          │ │
│ │                                         │ │
│ │ [📊 Voir tableau de bord]               │ │
│ │ [💰 Voir trésorerie]                    │ │
│ │                                         │ │
│ │ 💡 "Analyse ma trésorerie sur 30j"     │ │
│ │ 💡 "Voir mes factures impayées"        │ │
│ └─────────────────────────────────────────┘ │
│                              20:45    [Bot] │
│                                             │
├─────────────────────────────────────────────┤
│ [Poser une question...____________] [📤]   │
└─────────────────────────────────────────────┘
```

**Test manuel :**
1. Clique sur bouton violet flottant (bas-droite)
2. Fenêtre chat s'ouvre
3. Tape : "Quelle est ma trésorerie ?"
4. ✅ Réponse avec montants réels de ton entreprise
5. ✅ Boutons d'action cliquables (navigation)
6. ✅ Suggestions (pills cliquables)

**Questions de test suggérées :**
- "Quelle est ma trésorerie ?"
- "Comment enregistrer une facture EDF ?"
- "Où trouver mes paramètres de TVA ?"
- "Analyse mes dépenses sur 30 jours"

---

## 🚨 Si tu ne vois PAS ces éléments :

### Diagnostic étape par étape

#### 1. Vérifier le serveur dev

```bash
# Terminal - vérifier que Vite tourne
npm run dev
# Doit afficher : Local: http://localhost:5173/
```

#### 2. Vérifier la console navigateur

1. Ouvre F12 (DevTools)
2. Onglet Console
3. Cherche des erreurs rouges

**Erreurs fréquentes :**
- ❌ `aiDocumentAnalysisService is not defined`
  → Fichier service manquant ou import cassé
- ❌ `Cannot read property 'automatic_analysis' of undefined`
  → Traductions i18n manquantes
- ❌ `Module not found: @/types/ai-document.types`
  → Types TypeScript manquants

#### 3. Vérifier les fichiers créés

```bash
# Commandes PowerShell pour vérifier
Test-Path "src/services/aiDocumentAnalysisService.ts"  # Doit être True
Test-Path "src/types/ai-document.types.ts"             # Doit être True
Test-Path "src/components/ai/AIAssistantChat.tsx"      # Doit être True
```

#### 4. Forcer un rebuild complet

```bash
# Arrêter serveur, nettoyer cache, rebuild
npm run dev  # Ctrl+C pour stopper
rm -rf node_modules/.vite  # Windows: Remove-Item -Recurse -Force node_modules/.vite
npm run dev
```

#### 5. Hard refresh navigateur

- **Chrome/Edge :** Ctrl + Shift + R
- **Firefox :** Ctrl + F5
- Ou vider cache : F12 → Network → Disable cache (cocher)

---

## 📝 Checklist Finale

Après rechargement complet, vérifie :

### Phase 1 - Analyse Documents
- [ ] Section visible entre "Journal" et "Référence"
- [ ] Bouton "Choisir un document" présent
- [ ] Icône Sparkles (✨) visible
- [ ] Texte "Analyse automatique par IA"
- [ ] Bordure pointillée autour de la section

### Phase 2 - Catégorisation Bancaire
- [ ] Page Banking/Import existe
- [ ] Upload CSV fonctionne
- [ ] Toast "Catégorisation IA" apparaît
- [ ] Badges confiance sur transactions
- [ ] Pourcentages affichés (ex: 92%)

### Phase 3 - Assistant IA
- [ ] Bouton flottant visible (bas-droite)
- [ ] Couleur violet/gradient
- [ ] Icône message + sparkles
- [ ] Clic ouvre fenêtre chat
- [ ] Input "Poser une question..."
- [ ] Réponses contextuelles (montants réels)

---

## 🆘 En Dernier Recours

Si RIEN ne fonctionne après tout ça :

1. **Envoie-moi 3 screenshots :**
   - Formulaire écriture complet
   - Page Banking/Import
   - Console navigateur (F12 → Console)

2. **Copie/colle la sortie de :**
```bash
Get-ChildItem -Path "src/services" -Filter "*ai*.ts" | Select-Object Name
Get-ChildItem -Path "src/components/ai" -Filter "*.tsx" | Select-Object Name
Get-ChildItem -Path "src/types" -Filter "*ai*.ts" | Select-Object Name
```

3. **Vérifie le git status :**
```bash
git status
# Tous les fichiers AI doivent être "modified" ou "new file"
```

---

**Dernière mise à jour :** 2026-01-29 20:55  
**Version :** 1.0.0  
**Support :** dev@casskai.app
