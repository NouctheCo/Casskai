# Checklist Accessibilité CassKai - Guide Développeur

Guide rapide pour créer des composants accessibles conformes WCAG 2.1 AA.

---

## ✅ Formulaires

### Champs de saisie (Input, Textarea, Select)

```tsx
// ✅ BON
<div>
  <Label htmlFor="email">Email *</Label>
  <Input
    id="email"
    type="email"
    value={formData.email}
    onChange={handleChange}
    aria-required="true"
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? 'email-error' : undefined}
  />
  {errors.email && (
    <p id="email-error" className="text-red-500" role="alert">
      {errors.email}
    </p>
  )}
</div>

// ❌ MAUVAIS
<Input
  placeholder="Email"
  value={formData.email}
  onChange={handleChange}
/>
```

### Checklist champs:
- [ ] `id` unique lié au `<Label htmlFor="">`
- [ ] `aria-required="true"` si champ obligatoire
- [ ] `aria-invalid={!!error}` si erreur de validation
- [ ] `aria-describedby="error-id"` pour lier message d'erreur
- [ ] Message d'erreur avec `role="alert"` et `id` unique

---

## ✅ Modales / Dialogs

### Structure de modale

```tsx
// ✅ BON (Radix Dialog - recommandé)
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Titre de la modale</DialogTitle>
    </DialogHeader>
    {/* Contenu */}
  </DialogContent>
</Dialog>

// ✅ BON (Custom modal)
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  className="fixed inset-0"
>
  <h2 id="modal-title">Titre de la modale</h2>
  <button onClick={onClose} aria-label="Fermer">
    <X />
  </button>
  {/* Contenu */}
</div>

// ❌ MAUVAIS
<div className="fixed inset-0">
  <h2>Titre</h2>
  <button onClick={onClose}><X /></button>
</div>
```

### Checklist modales:
- [ ] `role="dialog"` ou utiliser `<Dialog>` de Radix
- [ ] `aria-modal="true"`
- [ ] `aria-labelledby="title-id"` lié au titre
- [ ] Bouton fermeture avec `aria-label="Fermer"`
- [ ] Focus piégé dans la modale (Radix le fait automatiquement)
- [ ] Fermeture avec Escape (Radix le fait automatiquement)
- [ ] Focus retourné à l'élément déclencheur après fermeture

---

## ✅ Boutons et Actions

### Boutons avec icônes uniquement

```tsx
// ✅ BON
<Button onClick={handleRefresh} aria-label="Rafraîchir le tableau de bord">
  <RefreshCw className="w-4 h-4" />
</Button>

// ✅ BON (avec texte visible)
<Button onClick={handleRefresh}>
  <RefreshCw className="w-4 h-4 mr-2" />
  Rafraîchir
</Button>

// ❌ MAUVAIS
<Button onClick={handleRefresh}>
  <RefreshCw />
</Button>
```

### Checklist boutons:
- [ ] Boutons icône uniquement: `aria-label` descriptif
- [ ] Boutons désactivés: `disabled` + explication visuelle
- [ ] État loading: `aria-busy="true"` ou texte "Chargement..."
- [ ] Actions destructives: confirmation avant exécution

---

## ✅ Tableaux de Données

### Tableaux triables et filtrables

```tsx
// ✅ BON
<table>
  <thead>
    <tr>
      <th
        onClick={() => handleSort('name')}
        aria-sort={
          sortConfig?.key === 'name'
            ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
            : 'none'
        }
      >
        Nom
        {renderSortIcon('name')}
      </th>
    </tr>
  </thead>
  <tbody>
    {data.map(row => (
      <tr key={row.id}>
        <td>{row.name}</td>
      </tr>
    ))}
  </tbody>
</table>

// ❌ MAUVAIS
<div className="table">
  <div className="row">
    <div className="cell">Nom</div>
  </div>
</div>
```

### Checklist tableaux:
- [ ] Utiliser `<table>`, `<thead>`, `<tbody>`, `<th>`, `<tr>`, `<td>`
- [ ] Colonnes triables: `aria-sort="ascending|descending|none"`
- [ ] Checkbox de sélection: `aria-label="Sélectionner la ligne X"`
- [ ] Pagination: boutons avec labels ("Première page", "Suivante"...)
- [ ] Recherche: `aria-label="Rechercher dans le tableau"`

---

## ✅ Navigation et Landmarks

### Landmarks ARIA

```tsx
// ✅ BON
<nav aria-label="Menu principal">
  <ul>
    <li><a href="/" aria-current="page">Accueil</a></li>
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</nav>

<main>
  <section aria-label="Indicateurs clés de performance">
    {/* KPIs */}
  </section>
</main>

<footer>
  {/* Footer */}
</footer>

// ❌ MAUVAIS
<div className="nav">
  <a href="/">Accueil</a>
</div>
```

### Checklist navigation:
- [ ] `<nav>` avec `aria-label` si plusieurs navigations
- [ ] Lien actif avec `aria-current="page"`
- [ ] Sections importantes avec `role="region"` + `aria-label`
- [ ] Skip links pour navigation rapide (optionnel niveau AAA)

---

## ✅ Images et Icônes

### Images informatives vs décoratives

```tsx
// ✅ Image informative
<img src="logo.png" alt="CassKai - Plateforme de gestion" />

// ✅ Icône décorative (avec texte)
<div>
  <FileText className="w-4 h-4" aria-hidden="true" />
  <span>Documents</span>
</div>

// ✅ Icône informative (sans texte)
<button aria-label="Télécharger le document">
  <Download className="w-4 h-4" />
</button>

// ❌ MAUVAIS
<img src="logo.png" />
<button><Download /></button>
```

### Checklist images:
- [ ] Images informatives: `alt` descriptif
- [ ] Images décoratives: `alt=""` ou `aria-hidden="true"`
- [ ] Icônes avec texte: `aria-hidden="true"` sur l'icône
- [ ] Icônes seules: `aria-label` sur le conteneur

---

## ✅ États de Chargement

### Loading states accessibles

```tsx
// ✅ BON
{loading ? (
  <div role="status" aria-live="polite" aria-label="Chargement en cours">
    <Loader2 className="animate-spin" aria-hidden="true" />
    <span className="sr-only">Chargement...</span>
  </div>
) : (
  <DataTable data={data} />
)}

// ❌ MAUVAIS
{loading && <Loader2 className="animate-spin" />}
```

### Checklist loading:
- [ ] Container avec `role="status"` ou `aria-live="polite"`
- [ ] Texte masqué visuellement: `className="sr-only"`
- [ ] Icône de chargement: `aria-hidden="true"`
- [ ] Message descriptif ("Chargement...", "Enregistrement...")

---

## ✅ Alertes et Notifications

### Messages de feedback

```tsx
// ✅ BON
<Alert>
  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
  <AlertDescription role="alert">
    Erreur lors de l'enregistrement. Veuillez réessayer.
  </AlertDescription>
</Alert>

// Toast notifications (déjà accessibles avec useToast)
toast({
  title: "Succès",
  description: "Facture créée avec succès",
});

// ❌ MAUVAIS
<div className="error">
  Erreur !
</div>
```

### Checklist alertes:
- [ ] Messages d'erreur: `role="alert"` (annonce immédiate)
- [ ] Messages informatifs: `aria-live="polite"` (annonce après fin de lecture)
- [ ] Icônes décoratives: `aria-hidden="true"`
- [ ] Toast/Toaster: utiliser `useToast` (déjà accessible)

---

## ✅ Contraste et Couleurs

### Vérification contraste

**Minimum WCAG 2.1 AA:**
- Texte normal: ratio 4.5:1
- Texte large (18px+ ou 14px bold): ratio 3:1
- Composants UI (bordures, icônes): ratio 3:1

**Outils de vérification:**
- Chrome DevTools > Lighthouse
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- axe DevTools (extension Chrome)

### Checklist couleurs:
- [ ] Texte gris clair sur blanc: éviter `text-gray-300`
- [ ] Ne pas transmettre info uniquement par couleur (ajouter icône/texte)
- [ ] Tester en mode sombre (dark mode)
- [ ] Vérifier bordures de focus visibles (anneaux bleus)

---

## ✅ Accessibilité Clavier

### Navigation au clavier

**Raccourcis essentiels:**
- `Tab` / `Shift+Tab`: navigation entre éléments focusables
- `Enter` / `Space`: activer bouton/lien
- `Escape`: fermer modale/dropdown
- `Arrow keys`: navigation dans listes/menus

### Checklist clavier:
- [ ] Tous les éléments interactifs accessibles via Tab
- [ ] Ordre de tabulation logique (gauche→droite, haut→bas)
- [ ] Focus visible (anneaux bleus Tailwind)
- [ ] Modales piègent le focus (Radix Dialog le fait)
- [ ] Dropdowns fermables avec Escape

---

## ✅ Tests d'Accessibilité

### Tests manuels rapides

```bash
# 1. Navigation clavier uniquement (sans souris)
# - Parcourir toute l'interface avec Tab
# - Activer actions avec Enter/Space
# - Fermer modales avec Escape

# 2. Zoom 200%
# - Ctrl/Cmd + molette jusqu'à 200%
# - Vérifier pas de perte de fonctionnalité
# - Pas de défilement horizontal

# 3. Lecteur d'écran (Windows)
# Télécharger NVDA: https://www.nvaccess.org/
# - Lancer NVDA
# - Parcourir avec flèches
# - Vérifier annonces cohérentes
```

### Tests automatisés

```bash
# axe DevTools (recommandé)
npm install --save-dev @axe-core/playwright

# Lighthouse CI
npm run build
npx lighthouse http://localhost:5173 --view

# Pa11y CI
npm install --save-dev pa11y-ci
npx pa11y-ci http://localhost:5173
```

---

## 📚 Ressources Utiles

### Documentation
- **WCAG 2.1 Quick Reference:** https://www.w3.org/WAI/WCAG21/quickref/
- **WAI-ARIA Practices:** https://www.w3.org/WAI/ARIA/apg/
- **Radix UI Primitives:** https://www.radix-ui.com/primitives (accessible by design)
- **Tailwind CSS Accessibility:** https://tailwindcss.com/docs/screen-readers

### Outils
- **axe DevTools:** https://www.deque.com/axe/devtools/
- **NVDA (lecteur d'écran):** https://www.nvaccess.org/
- **WAVE (audit visuel):** https://wave.webaim.org/
- **Contrast Checker:** https://webaim.org/resources/contrastchecker/

### Communauté
- **A11y Project:** https://www.a11yproject.com/
- **WebAIM:** https://webaim.org/
- **Discord Accessibility:** https://discord.gg/web-a11y

---

## 🚀 Quick Start

**Pour un nouveau composant:**

1. **Utiliser composants UI de base** (déjà accessibles):
   ```tsx
   import { Button, Input, Label, Dialog } from '@/components/ui';
   ```

2. **Ajouter labels explicites**:
   ```tsx
   <Label htmlFor="email">Email *</Label>
   <Input id="email" aria-required="true" />
   ```

3. **Gérer les erreurs**:
   ```tsx
   {error && <p role="alert">{error}</p>}
   ```

4. **Tester au clavier**:
   - Navigation complète sans souris
   - Focus visible partout

5. **Vérifier avec axe DevTools**:
   - F12 > onglet axe DevTools
   - Scan de la page
   - Corriger violations critiques

---

**© 2025 Noutche Conseil SAS - Tous droits réservés**
