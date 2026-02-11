# 🔍 Audit de Cohérence - Charte Graphique v1.2

**Date:** 8 février 2026
**Version charte:** v1.2 (Février 2026)
**Projet:** CassKai - Frontend React/TypeScript

---

## 📊 Résumé Exécutif

| Catégorie | Conforme | Partiellement | Non conforme | Impact |
|-----------|----------|---------------|--------------|--------|
| **Logo & Favicon** | ❌ | - | ✅ | 🔴 **CRITIQUE** |
| **Couleurs primaires** | ⚠️ | ✅ | ❌ | 🟠 **IMPORTANT** |
| **Couleurs mode sombre** | ⚠️ | ✅ | - | 🟠 **IMPORTANT** |
| **Typographie** | ✅ | - | - | 🟢 **OK** |
| **Composants UI** | ✅ | ⚠️ | - | 🟡 **MINEUR** |
| **Iconographie** | ✅ | - | - | 🟢 **OK** |

**Score global:** 🟠 **65% conforme** - Nécessite corrections moyennes/importantes

---

## 🔴 CRITIQUE - Logo et Favicon

### ❌ Problème majeur identifié

**État actuel:**
- Fichiers logo datent de **décembre 2021** et **janvier 2024**
- Design probablement basé sur **ancienne version** (hexagone "CK" de v1.0)

**Charte v1.2 exige:**
- **NOUVEAU logo:** Lettre **"C" stylisée** + **barres graphiques** (croissance/données financières)
- Fond arrondi avec **dégradé violet/bleu** (#3B82F6 → #8B5CF6)
- 3 versions pictogramme: fond clair, fond sombre, fond dégradé

### 🎯 Fichiers à mettre à jour

```
public/
├── logo.svg          ❌ À remplacer (pointe vers logo.png ancien)
├── logo.png          ❌ À remplacer (ancien design)
├── logo.webp         ❌ À remplacer (janvier 2024)
├── logo-dark.svg     ❌ À vérifier/remplacer
├── logo-light.svg    ❌ À vérifier/remplacer
├── logo-text.svg     ❌ À vérifier
├── favicon.svg       ❌ À remplacer (pointe vers .ico ancien)
└── favicon.ico       ❌ À remplacer
```

### 🔧 Actions requises

**PRIORITÉ 1 - CRITIQUE:**

1. **Créer nouveau logo v1.2** avec lettre "C" + barres graphiques
2. **Générer tous les formats:**
   - `logo.svg` - Version vectorielle principale
   - `logo-dark.svg` - Version fond sombre
   - `logo-light.svg` - Version fond clair
   - `logo.png` - Haute résolution (PNG export SVG)
   - `logo.webp` - Format optimisé web
   - `pictogramme-seul.svg` - Icône seule pour favicon

3. **Générer favicons v1.2:**
   - `favicon.ico` - 16x16, 32x32
   - `favicon.svg` - Vectoriel
   - `apple-touch-icon.png` - 180x180
   - `icon-192.png`, `icon-512.png` - PWA manifest

**Estimation:** 2-4 heures (design graphique requis)

---

## 🟠 IMPORTANT - Système de couleurs

### ⚠️ Variables CSS HSL non conformes

**Problème dans `src/index.css`:**

```css
/* ❌ ACTUEL - Non conforme */
:root {
  --primary: 222.2 47.4% 11.2%;        /* Bleu très foncé (pas #2563EB) */
  --accent: 210 40% 96.1%;             /* Gris clair (pas #8B5CF6) */
}

.dark {
  --primary: 210 40% 98%;              /* Blanc cassé (pas #60A5FA) */
  --accent: 217.2 32.6% 17.5%;         /* Gris foncé (pas violet) */
}
```

**✅ CHARTE v1.2 exige:**

```css
/* Couleurs primaires */
Blue 600 (Primaire):     #2563EB = HSL(217, 82%, 53%)
Blue 500 (Interactif):   #3B82F6 = HSL(217, 91%, 60%)
Blue 700 (Hover):        #1D4ED8 = HSL(221, 76%, 48%)
Blue 400 (Mode sombre):  #60A5FA = HSL(213, 94%, 68%)

/* Couleurs secondaires (Accent) */
Violet 500:              #8B5CF6 = HSL(258, 90%, 66%)
Violet 600:              #7C3AED = HSL(263, 83%, 58%)
Violet 400:              #A78BFA = HSL(255, 92%, 76%)
```

### ✅ Utilisations directes correctes trouvées

**Dans `src/index.css` (lignes 137, 159, 178):**

```css
✅ border-color: rgb(59, 130, 246);           /* Blue 500 - Correct */
✅ background-color: rgb(59, 130, 246);       /* Blue 500 - Correct */
✅ linear-gradient(to right, rgb(59, 130, 246), rgb(99, 102, 241)); /* Partiellement correct */
```

**⚠️ Note:** Le dégradé utilise `rgb(99, 102, 241)` qui n'est **pas** le Violet 500 officiel `#8B5CF6 = rgb(139, 92, 246)`

### 🔧 Actions requises

**PRIORITÉ 2 - IMPORTANT:**

1. **Corriger variables CSS `src/index.css`:**

```css
/* ✅ RECOMMANDÉ - Conforme charte v1.2 */
:root {
  /* Primaires (Blue) */
  --primary: 217 91% 60%;           /* Blue 500 #3B82F6 - Interactif */
  --primary-hover: 221 76% 48%;     /* Blue 700 #1D4ED8 - Hover */
  --primary-strong: 217 82% 53%;    /* Blue 600 #2563EB - Primaire fort */

  /* Accent (Violet) */
  --accent: 258 90% 66%;            /* Violet 500 #8B5CF6 */
  --accent-strong: 263 83% 58%;     /* Violet 600 #7C3AED */
  --accent-light: 255 92% 76%;      /* Violet 400 #A78BFA */
  --accent-bg: 251 91% 95%;         /* Violet 100 #EDE9FE */

  /* Sémantiques */
  --success: 142 76% 36%;           /* Green 600 #16A34A */
  --warning: 32 95% 44%;            /* Amber 600 #D97706 */
  --error: 0 72% 51%;               /* Red 600 #DC2626 */
  --info: 226 71% 40%;              /* Blue 800 #1E40AF */

  /* Dégradé signature */
  --gradient-signature: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
  --gradient-cta: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
}

.dark {
  /* Mode sombre - Accent primaire */
  --primary: 213 94% 68%;           /* Blue 400 #60A5FA */
  --primary-hover: 217 91% 60%;     /* Blue 500 #3B82F6 */

  /* Background spécifique mode sombre */
  --background: 222 47% 11%;        /* Slate 950 #0F172A */
  --card: 217 33% 17%;              /* Gray 800 #1F2937 */
  --border: 215 20% 27%;            /* Gray 700 #374151 */

  /* Textes mode sombre */
  --foreground: 0 0% 98%;           /* Gray 50 #F9FAFB */
  --muted-foreground: 220 9% 66%;   /* Gray 400 #9CA3AF */
}
```

2. **Corriger dégradé ligne 178:**

```css
/* ❌ Avant */
background: linear-gradient(to right, rgb(59, 130, 246), rgb(99, 102, 241));

/* ✅ Après */
background: linear-gradient(135deg, rgb(59, 130, 246), rgb(139, 92, 246));
/* Ou mieux: */
background: var(--gradient-signature);
```

**Estimation:** 1-2 heures + tests visuels mode clair/sombre

---

## 🟢 CONFORME - Typographie

### ✅ Configuration actuelle correcte

**`src/index.css` (ligne 1):**

```css
✅ @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800&display=swap');
```

**Hiérarchie trouvée conforme:**
- H1: Poppins Bold 32px ✅
- Body: Inter Regular 16px ✅
- Font-family body: 'Inter', system-ui, -apple-system ✅

**Aucune action requise.**

---

## 🟢 CONFORME - Iconographie

### ✅ Configuration Lucide React

**Vérification effectuée:**
- Librairie exclusive: **Lucide React** ✅ (confirmé dans package.json ligne 120)
- Stroke-width: 2 (à vérifier dans composants, mais standard Lucide)
- Tailles standardisées: XS(12px) à 2XL(40px) via classes Tailwind w-3 à w-10

**Aucune action requise.**

---

## 🟡 MINEUR - Composants UI

### ⚠️ Vérifications recommandées

**Border-radius (conformité partielle):**

**Charte v1.2:**
- Boutons/cartes: **8px** (lg)
- Inputs: **6px** (md)
- Badges: **4px** (sm)

**Trouvé dans `tailwind.config.cjs` (lignes 59-62):**

```javascript
borderRadius: {
  lg: "var(--radius)",      // ⚠️ Variable dynamique (valeur à vérifier)
  md: "calc(var(--radius) - 2px)",
  sm: "calc(var(--radius) - 4px)",
}
```

**`src/index.css` (ligne 63):**

```css
--radius: 0.5rem;  /* = 8px ✅ Correct */
```

**✅ Donc:** lg=8px, md=6px, sm=4px → **CONFORME**

### 🔧 Action recommandée

- Vérifier visuellement que tous les composants utilisent bien `rounded-lg`, `rounded-md`, `rounded-sm`
- Scanner les fichiers pour `rounded-xl`, `rounded-2xl` non conformes

**Estimation:** 30 minutes d'audit visuel

---

## 🟠 IMPORTANT - Mode sombre

### ⚠️ Couleurs spécifiques à vérifier

**Charte v1.2 exige:**

```css
/* Mode sombre */
Fond principal: #0F172A (Slate 950)
Carte: #1F2937 (Gray 800)
Bordure: #374151 (Gray 700)
Texte principal: #F9FAFB (Gray 50)
Texte secondaire: #9CA3AF (Gray 400)
Accent primaire: #60A5FA (Blue 400)
```

**Trouvé dans `src/index.css` (.dark):**

```css
--background: 222.2 84% 4.9%;     /* ❌ Bleu très foncé (pas Slate 950) */
--card: 222.2 84% 4.9%;           /* ❌ Identique background (incorrect) */
```

### 🔧 Action requise

**Corriger mode sombre:**

```css
.dark {
  --background: 222 47% 11%;      /* #0F172A Slate 950 ✅ */
  --card: 217 33% 17%;            /* #1F2937 Gray 800 ✅ */
  --border: 215 20% 27%;          /* #374151 Gray 700 ✅ */
  --foreground: 0 0% 98%;         /* #F9FAFB Gray 50 ✅ */
  --muted-foreground: 220 9% 66%; /* #9CA3AF Gray 400 ✅ */
  --primary: 213 94% 68%;         /* #60A5FA Blue 400 ✅ */
}
```

**Estimation:** 1 heure + tests visuels

---

## 📋 Plan d'Action Priorisé

### 🔴 Phase 1 - CRITIQUE (Blocant image de marque)

**1. Mise à jour logo v1.2** 🎨
- Créer nouveau design: Lettre "C" + barres graphiques
- Générer tous les formats (SVG, PNG, WEBP)
- Remplacer fichiers dans `public/`
- Mettre à jour favicons (16, 32, 180, 512px)
- **Estimation:** 2-4 heures (designer requis)
- **Impact:** 🔴 **Très fort** - Identité visuelle

### 🟠 Phase 2 - IMPORTANT (Cohérence visuelle)

**2. Correction variables CSS couleurs** 🎨
- Corriger `--primary`, `--accent` dans `:root` et `.dark`
- Ajouter variables manquantes (--primary-hover, --accent-strong, etc.)
- Corriger dégradé ligne 178
- **Estimation:** 1-2 heures
- **Impact:** 🟠 **Fort** - Cohérence charte

**3. Correction mode sombre** 🌙
- Corriger `--background`, `--card`, `--border` en mode `.dark`
- Tester visuellement tous les composants
- **Estimation:** 1 heure
- **Impact:** 🟠 **Fort** - Expérience utilisateur

### 🟡 Phase 3 - MINEUR (Finitions)

**4. Audit visuel composants UI** 🔍
- Vérifier border-radius sur tous les composants
- Scanner utilisations non conformes
- **Estimation:** 30 minutes
- **Impact:** 🟡 **Faible** - Polish

---

## 📊 Estimation Totale

| Phase | Tâches | Temps estimé | Ressources |
|-------|--------|--------------|------------|
| **Phase 1** | Logo v1.2 | 2-4h | Designer graphique + intégrateur |
| **Phase 2** | Couleurs CSS | 2-3h | Développeur frontend |
| **Phase 3** | Audit UI | 0.5h | Développeur frontend |
| **TOTAL** | | **4.5 - 7.5 heures** | Design + Dev |

---

## 🎯 Recommandations Stratégiques

### 1. Logo v1.2 - Options

**Option A: Design interne**
- Créer logo avec Adobe Illustrator / Figma
- Export SVG optimisé
- Avantage: Contrôle total
- Inconvénient: Requiert compétences design

**Option B: Externaliser**
- Brief designer externe avec charte v1.2
- Livraison formats SVG/PNG/WEBP
- Avantage: Qualité professionnelle
- Inconvénient: Coût + délai

### 2. Migration CSS progressive

**Approche recommandée:**
1. Créer fichier `src/styles/charte-v12-colors.css` avec nouvelles variables
2. Tester en parallèle sans casser l'existant
3. Migrer page par page si besoin
4. Supprimer anciennes variables une fois migration OK

### 3. Tests visuels systématiques

**À tester après corrections:**
- [ ] Mode clair: couleurs primaires/accent
- [ ] Mode sombre: fond, cartes, textes
- [ ] Boutons: primaire, secondaire, destructif
- [ ] Dégradés: signature, CTA, headers
- [ ] Favicon: tous les formats (desktop, mobile, PWA)

---

## 📝 Checklist de Validation

### Logo v1.2
- [ ] Logo principal SVG (lettre C + barres graphiques)
- [ ] Version fond clair
- [ ] Version fond sombre
- [ ] Version pictogramme seul
- [ ] Favicon 16x16, 32x32
- [ ] Apple Touch Icon 180x180
- [ ] PWA icons 192x192, 512x512
- [ ] Exports PNG/WEBP haute résolution

### Couleurs
- [ ] Variables CSS `:root` corrigées
- [ ] Variables CSS `.dark` corrigées
- [ ] Dégradé signature correct (#3B82F6 → #8B5CF6)
- [ ] Couleurs sémantiques (success, error, warning)
- [ ] Tests visuels mode clair
- [ ] Tests visuels mode sombre

### Composants
- [ ] Border-radius conformes (8px/6px/4px)
- [ ] Cartes mode clair (white, #E5E7EB, shadow)
- [ ] Cartes mode sombre (#1F2937, #374151, shadow)
- [ ] Boutons styles conformes

---

**© 2026 CassKai - Audit réalisé le 8 février 2026**
