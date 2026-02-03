# 🖼️ Vue Visuelle: Ce Que Vous Devez Voir

## 📸 Scénario: Après Hard Refresh + Navigation

### Écran 1: Page Comptabilité → Écritures
```
┌───────────────────────────────────────────────────┐
│                    COMPTABILITÉ                    │
│                                                    │
│  [◀ Retour]     [Écritures comptables]            │
│                                                    │
│  Écritures comptables                             │
│  Retrouvez toutes les écritures enregistrées      │
│                                                    │
│  [+ Nouvelle écriture] [Exporter] [...]           │
│                                                    │
│  ┌────────────────────────────────────────┐       │
│  │ Journal  │ Date │ Libellé │ Total │    │       │
│  ├────────────────────────────────────────┤       │
│  │ Ventes   │ 2025 │ ...     │ 1500€ │ ... │       │
│  │ Achats   │ 2025 │ ...     │ 2300€ │ ... │       │
│  └────────────────────────────────────────┘       │
└───────────────────────────────────────────────────┘
          ↓
   [Cliquer ici]
```

### Écran 2: Formulaire Nouvelle Écriture

```
┌─────────────────────────────────────────────┐
│  ← Comptabilité                             │
│                                             │
│  📝 Nouvelle écriture                       │
│                                             │
│  Date de l'écriture: [_____]                │
│  Journal: [▼ Sélectionner un journal]       │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ✨ Analyse automatique par IA        │   │ ← ICI!
│  │                                     │   │
│  │ Uploadez une facture ou un reçu    │   │
│  │ pour pré-remplir automatiquement   │   │
│  │ l'écriture comptable.              │   │
│  │                                     │   │
│  │ [📁 Choisir un document]            │   │
│  │     (PDF, JPG, PNG)                 │   │
│  │                                     │   │
│  │ [ALERTE BLEUE SI RÉSULTATS]         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Numéro de référence: [_____]              │
│  Compte: [_____]                           │
│  ...                                        │
│                                             │
│           [Enregistrer] [Annuler]          │
└─────────────────────────────────────────────┘
```

---

## 🎬 Interaction: Upload Document

### Avant Upload
```
✨ Analyse automatique par IA
├─ Description du processus
└─ [📁 Choisir un document]
```

### Pendant Upload (Loading)
```
✨ Analyse automatique par IA
├─ Description du processus
└─ [⏳ Analyse en cours...]    ← Spinner/Loading
```

### Après Upload (Résultats)
```
✨ Analyse automatique par IA
├─ Description du processus
└─ [📁 Choisir un document]

ⓘ ALERTE BLEUE:
├─ Données extraites du document:
├─ • Fournisseur: Dupont & Cie
├─ • Facture #: INV-2025-0145
├─ • Montant TTC: 1,250.50€
├─ Confiance: 92%
└─ [Utiliser ces données]
```

---

## 🎨 Couleurs & Style

### Section IA Styling
```css
Bordure: 2px dashed #3b82f6 (bleu)
Fond: rgba(59, 130, 246, 0.05) (bleu très léger)
Padding: 1rem
Border-radius: 0.5rem
```

### Alert Bleue (Résultats)
```css
Fond: rgba(59, 130, 246, 0.1)
Bordure: 1px solid rgba(59, 130, 246, 0.2)
Texte: gris foncé + bleu pour titre
```

### Icônes
```
Icône ✨ (Sparkles) = Analyse IA
Icône 📁 (Upload) = Choisir fichier
Icône ⏳ (Loader) = En cours...
Icône ⓘ (Info) = Alerte résultats
```

---

## 📍 Localisation dans le Formulaire

```
┌────────────────────────────────────┐
│ Nouvelle écriture                  │
├────────────────────────────────────┤
│                                    │
│ [Date de l'écriture]               │
│                                    │
│ [Journal]     [Département]        │
│                                    │
│ ╔════════════════════════════════╗ │
│ ║ ✨ Analyse automatique par IA   ║ │  ← POSITION
│ ║                                ║ │
│ ║ [Bouton Upload]                ║ │
│ ║                                ║ │
│ ║ [Résultats si upload]          ║ │
│ ╚════════════════════════════════╝ │
│                                    │
│ [Numéro de référence]              │
│                                    │
│ [Autres champs...]                 │
│                                    │
│ [Tableau des lignes]               │
│                                    │
│ [Boutons: Enregistrer/Annuler]    │
└────────────────────────────────────┘
```

---

## 📱 Responsive Design

### Desktop (>1024px)
```
Section IA: Largeur 100% du formulaire
Upload button: Largeur 100%
Alert: Largeur 100% - padding
```

### Tablet (768-1024px)
```
Section IA: Largeur 90%
Upload button: Largeur 90%
Alert: Largeur 90% - padding
```

### Mobile (<768px)
```
Section IA: Largeur 100% - margin
Upload button: Largeur 100%
Alert: Largeur 100% - padding
Stack verticalement
```

---

## ⌨️ Interactions Clavier

| Key | Action |
|-----|--------|
| **Tab** | Navigate to "Choose document" button |
| **Enter** | Activate file chooser |
| **Esc** | Close file dialog |
| **Enter** | Confirm file selection |

---

## 🌍 Traductions Visibles

### Français (FR)
```
✨ Analyse automatique par IA
   Uploadez une facture ou un reçu pour pré-remplir...
   [📁 Choisir un document (PDF, JPG, PNG)]
   ⏳ Analyse en cours...
   📊 Données extraites du document:
   • Tiers inconnu
   • Facture #123
   • Montant TTC: 1000€
   🎯 Confiance: 85%
```

### English (EN)
```
✨ Automatic AI Analysis
   Upload an invoice or receipt to auto-fill...
   [📁 Choose a document (PDF, JPG, PNG)]
   ⏳ Analyzing...
   📊 Extracted data:
   • Unknown party
   • Invoice #123
   • Amount incl. tax: 1000€
   🎯 Confidence: 85%
```

### Español (ES)
```
✨ Análisis automático de IA
   Cargue una factura o recibo para rellenar...
   [📁 Elegir un documento (PDF, JPG, PNG)]
   ⏳ Analizando...
   📊 Datos extraídos:
   • Parte desconocida
   • Factura #123
   • Monto inc. impuestos: 1000€
   🎯 Confianza: 85%
```

---

## 🔔 Notifications (Toast)

### Succès
```
✅ Écriture pré-remplie avec 92% de confiance
[Undo] [Close]
```

### Erreur
```
❌ Une erreur est survenue lors de l'analyse
[Retry] [Close]
```

### Info
```
ℹ️ Analyse en cours...
[Close]
```

---

## 🎯 Checklist Visuelle

Après hard refresh, vous devriez voir:

- [ ] Page charge sans erreurs
- [ ] Section "Analyse automatique par IA" visible
- [ ] Icône ✨ affichée
- [ ] Bouton "[📁 Choisir un document]" visible et cliquable
- [ ] Texte descriptif visible
- [ ] Upload fonctionne
- [ ] Loader/spinner pendant l'analyse
- [ ] Alerte bleue apparaît après analyse
- [ ] Données extraites affichées correctement
- [ ] Score de confiance visible

---

**Généré:** 2025-01-29  
**Status:** Ceci est ce que vous DEVEZ voir!
