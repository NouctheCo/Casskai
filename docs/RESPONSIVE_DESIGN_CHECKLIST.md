# 📱 Responsive Design Checklist - CassKai

## ✅ Pages Déjà Optimisées (Mobile-First)

### Pages Publiques
- ✅ **LandingPage.tsx** - Utilise Tailwind responsive classes (sm:, md:, lg:, xl:)
  - Grid responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  - Flex responsive: `flex-col lg:flex-row`
  - Padding responsive: `p-4 md:p-8`
  
- ✅ **FAQPage.tsx** - Searchbar + accordéons mobile-friendly
  - Catégories horizontally scrollables sur mobile
  - Questions en full-width sur petits écrans
  
- ✅ **RoadmapPage.tsx** - Timeline adaptative
  - Cards responsive: `grid-cols-1 md:grid-cols-2`
  - Filtres sticky sur mobile
  
- ✅ **LegalPage.tsx** - Documents grid adaptative
  - Grid: `md:grid-cols-2` (1 colonne sur mobile, 2 sur desktop)
  
- ✅ **PricingPage.tsx** - Plans en colonnes empilées sur mobile
  - Toggle mensuel/annuel centré
  - Cards full-width sur mobile

### Pages Application
- ✅ **DashboardPage.tsx** - KPIs en grille responsive
  - Graphiques empilés sur mobile
  - Sidebar collapsible (MainLayout)
  
- ⚠️ **AccountingPage.tsx** - Tables larges problématiques sur mobile
  - **TODO**: Ajouter scroll horizontal ou mode tableau simplifié
  - **TODO**: Boutons d'action en menu kebab sur mobile
  
- ⚠️ **InvoicingPage.tsx** - Formulaires multi-colonnes
  - **TODO**: Vérifier que les champs passent en full-width sur mobile
  - **TODO**: Simplifier navigation entre sections
  
- ✅ **ReportsPage.tsx** - Graphiques responsive via Recharts
  - ResponsiveContainer wraps charts automatiquement
  
- ✅ **SettingsPage.tsx** - Tabs horizontaux sur desktop, dropdown sur mobile

## 🎯 Tests Responsive Recommandés

### Breakpoints Tailwind utilisés
```css
sm: 640px   /* Phones landscape, small tablets */
md: 768px   /* Tablets portrait */
lg: 1024px  /* Tablets landscape, laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### Devices à Tester
1. **Mobile Portrait** (375x667) - iPhone SE
2. **Mobile Landscape** (667x375)
3. **Tablet Portrait** (768x1024) - iPad
4. **Tablet Landscape** (1024x768)
5. **Desktop** (1920x1080)

### Chrome DevTools - Tester avec:
```
- iPhone 12 Pro (390x844)
- iPad Air (820x1180)
- Samsung Galaxy S20 (360x800)
- Surface Pro 7 (912x1368)
```

## 🔧 Patterns Responsive Utilisés

### 1. Navigation Mobile
```tsx
{/* MainLayout.tsx - Sidebar responsive */}
<div className="lg:hidden">
  {/* Mobile hamburger menu */}
</div>
<div className="hidden lg:block">
  {/* Desktop sidebar */}
</div>
```

### 2. Tables Responsive
```tsx
{/* Option 1: Horizontal scroll */}
<div className="overflow-x-auto">
  <table className="min-w-full">...</table>
</div>

{/* Option 2: Card layout sur mobile */}
<div className="block md:hidden">
  {/* Cards empilées */}
</div>
<div className="hidden md:block">
  {/* Table classique */}
</div>
```

### 3. Forms Multi-colonnes
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <input /> {/* Full-width mobile, half-width desktop */}
  <input />
</div>
```

### 4. Text Sizing
```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  {/* Progressive text sizing */}
</h1>
```

## ⚠️ Actions Prioritaires

### Corrections Urgentes
1. **AccountingPage** - Tables débordent sur mobile
   - Solution: Implémenter `<ResponsiveTable>` avec scroll horizontal
   - Alternative: Mode "cards" sur mobile avec infos essentielles
   
2. **InvoicingPage** - Formulaire création facture
   - Vérifier que tous les champs passent en 1 colonne sur mobile
   - Tester la saisie clavier sur mobile (zoom automatique évité)

3. **Touches tactiles** - Zones cliquables
   - Minimum 44x44px pour touch targets (règle iOS)
   - Espacer les boutons d'action sur mobile

### Améliorations UX Mobile
1. **Pull-to-refresh** - Sur listes (invoices, accounting entries)
2. **Swipe actions** - Sur cartes (delete, edit)
3. **Bottom sheets** - Pour formulaires/filtres sur mobile
4. **Sticky headers** - Dans tables longues
5. **Infinite scroll** - Au lieu de pagination sur mobile

## 📊 Tests de Performance Mobile

### Lighthouse Mobile Score Targets
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 95
- **SEO**: > 95

### Métriques Critiques Mobile
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Tests Réseau
- **3G Lent** (750Kbps, 150ms RTT)
- **3G Rapide** (1.5Mbps, 75ms RTT)
- **4G** (10Mbps, 30ms RTT)

## ✅ Checklist Validation

Avant lancement Beta, tester:
- [ ] Landing page fluide sur iPhone & Android
- [ ] FAQ searchable et lisible sur mobile
- [ ] Pricing page: boutons cliquables facilement
- [ ] Dashboard: KPIs visibles sans scroll horizontal
- [ ] Factures: création/édition possible sur tablette
- [ ] Comptabilité: consultation écritures sur mobile
- [ ] Reports: graphiques zoomables/panables sur touch
- [ ] Settings: tous les formulaires accessibles

## 🎨 Design System Mobile

### Spacing Mobile
```css
p-4   /* 16px padding (mobile default) */
p-6   /* 24px padding (tablet) */
p-8   /* 32px padding (desktop) */
```

### Typography Mobile
```css
text-sm   /* 14px (mobile body) */
text-base /* 16px (mobile headings, desktop body) */
text-lg   /* 18px (mobile large, desktop normal) */
text-xl   /* 20px (mobile hero, desktop headings) */
```

### Touch Targets
```css
min-h-[44px] min-w-[44px]  /* iOS Human Interface Guidelines */
min-h-[48px] min-w-[48px]  /* Material Design (Android) */
```

## 📝 Notes de Développement

### Framer Motion - Animations Responsive
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ 
    duration: window.innerWidth < 768 ? 0.2 : 0.5 
  }}
>
  {/* Animations plus rapides sur mobile */}
</motion.div>
```

### Tailwind - Custom Breakpoints
Si besoin de breakpoints custom:
```js
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'xs': '475px',
      ...defaultTheme.screens,
    }
  }
}
```

---

**Dernière mise à jour**: 25 novembre 2025  
**Status**: ✅ 90% des pages optimisées, 2 pages à corriger avant Beta
