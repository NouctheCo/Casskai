# Guide d'Intégration des Traductions

## 📋 Vue d'ensemble

Ce guide explique comment intégrer les traductions anglaises et espagnoles pour:
- Module Immobilisations (Fixed Assets / Activos Fijos)
- Dashboard Opérationnel (Operational Dashboard / Panel Operacional)

**Fichier source**: `TRADUCTIONS_ASSETS_DASHBOARD.json`

---

## 🔧 Méthode 1: Intégration Manuelle (Recommandée)

### Étape 1: Ouvrir les fichiers de traduction

```bash
# Fichier anglais
src/i18n/locales/en.json

# Fichier espagnol
src/i18n/locales/es.json
```

### Étape 2: Localiser la section "assets"

Dans chaque fichier, chercher la clé `"assets"` (ou la créer si elle n'existe pas).

**Exemple en.json**:
```json
{
  "accounting": { ... },
  "assets": {
    // AJOUTER ICI LE CONTENU DE LA SECTION "ENGLISH" -> "assets"
  },
  "dashboard": { ... }
}
```

### Étape 3: Copier le contenu

1. Ouvrir `TRADUCTIONS_ASSETS_DASHBOARD.json`
2. Copier **tout le contenu** de `"ENGLISH" -> "assets"`
3. Coller dans `en.json` sous la clé `"assets"`

**Répéter pour es.json** avec le contenu de `"SPANISH" -> "assets"`

### Étape 4: Intégrer les traductions dashboard

Dans la section `"dashboard"` existante, ajouter les sous-sections:

**en.json**:
```json
"dashboard": {
  "activeClients": "Active Clients",
  // ... clés existantes ...

  "operational": {
    "title": "Operational Dashboard",
    "subtitle": "Real-time view of your financial performance"
  },
  "aiAnalysis": {
    "title": "AI Analysis & Recommendations",
    "powered": "Powered by OpenAI",
    "fallback": "Rule-based analysis",
    "keyInsights": "Key Insights",
    "recommendations": "Strategic Recommendations",
    "risks": "Risk Factors",
    "actions": "Actions to Take",
    "expectedImpact": "Expected Impact",
    "noData": "No analysis available",
    "priority": {
      "high": "Urgent",
      "medium": "Important",
      "low": "To Plan"
    }
  }
}
```

---

## 🚀 Méthode 2: Script Automatique (Avancée)

### Créer un script d'intégration

**Fichier**: `scripts/integrate-translations.js`

```javascript
const fs = require('fs');
const path = require('path');

// Charger les traductions sources
const sourceFile = path.join(__dirname, '../TRADUCTIONS_ASSETS_DASHBOARD.json');
const source = JSON.parse(fs.readFileSync(sourceFile, 'utf-8'));

// Fonction d'intégration
function integrateTranslations(lang, targetPath) {
  const target = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));

  // Intégrer assets
  const langKey = lang === 'en' ? 'ENGLISH' : 'SPANISH';
  target.assets = {
    ...(target.assets || {}),
    ...source[langKey].assets
  };

  // Intégrer dashboard
  target.dashboard = {
    ...(target.dashboard || {}),
    ...source[langKey].dashboard
  };

  // Écrire le résultat
  fs.writeFileSync(targetPath, JSON.stringify(target, null, 2), 'utf-8');
  console.log(`✅ ${lang.toUpperCase()} translations integrated successfully`);
}

// Exécuter
integrateTranslations('en', path.join(__dirname, '../src/i18n/locales/en.json'));
integrateTranslations('es', path.join(__dirname, '../src/i18n/locales/es.json'));
```

### Exécuter le script

```bash
node scripts/integrate-translations.js
```

---

## ✅ Vérification

### Tester les traductions

1. **Démarrer l'application**
   ```bash
   npm run dev
   ```

2. **Changer la langue**
   - Cliquer sur le sélecteur de langue
   - Tester: Français → English → Español

3. **Vérifier les sections**
   - Module Immobilisations
   - Dashboard Opérationnel
   - Analyse IA

### Points de contrôle

- [ ] Toutes les clés assets.* sont traduites
- [ ] Les formulaires d'ajout d'actifs sont traduits
- [ ] Le plan d'amortissement est traduit
- [ ] Le dashboard opérationnel est traduit
- [ ] L'analyse IA est traduite
- [ ] Les priorités (urgent/important/planifier) sont traduites

---

## 🐛 Dépannage

### Erreur: Clé manquante

**Symptôme**: `[i18n] Missing key: assets.form.name`

**Solution**: Vérifier que la clé existe dans le fichier de traduction

```json
"assets": {
  "form": {
    "name": "Asset Name"  // ← Cette clé doit exister
  }
}
```

### Erreur: Format JSON invalide

**Symptôme**: Application ne démarre pas après modification

**Solution**: Valider le JSON

```bash
# Installer un validateur JSON
npm install -g jsonlint

# Vérifier les fichiers
jsonlint src/i18n/locales/en.json
jsonlint src/i18n/locales/es.json
```

### Traductions non appliquées

**Solution**: Vider le cache et redémarrer

```bash
# Arrêter le serveur
Ctrl+C

# Vider le cache Vite
rm -rf node_modules/.vite

# Redémarrer
npm run dev
```

---

## 📦 Structure Finale

Après intégration, la structure des fichiers de traduction sera:

```
en.json
├── accounting: { ... }
├── assets: {                      ← NOUVEAU
│   ├── title: "Fixed Assets"
│   ├── form: { ... }
│   ├── categories: { ... }
│   ├── schedule: { ... }
│   └── ...
│   }
├── dashboard: {
│   ├── activeClients: "..."
│   ├── operational: { ... }       ← NOUVEAU
│   └── aiAnalysis: { ... }        ← NOUVEAU
│   }
└── ...

es.json
├── accounting: { ... }
├── assets: {                      ← NUEVO
│   ├── title: "Activos Fijos"
│   ├── form: { ... }
│   ├── categories: { ... }
│   ├── schedule: { ... }
│   └── ...
│   }
├── dashboard: {
│   ├── activeClients: "..."
│   ├── operational: { ... }       ← NUEVO
│   └── aiAnalysis: { ... }        ← NUEVO
│   }
└── ...
```

---

## 🎯 Checklist d'Intégration

### Avant de commencer
- [ ] Faire un backup de `en.json` et `es.json`
- [ ] S'assurer que l'application fonctionne

### Pendant l'intégration
- [ ] Copier les traductions assets dans `en.json`
- [ ] Copier les traductions assets dans `es.json`
- [ ] Copier les traductions dashboard dans `en.json`
- [ ] Copier les traductions dashboard dans `es.json`
- [ ] Valider la syntaxe JSON

### Après l'intégration
- [ ] Tester en anglais
- [ ] Tester en espagnol
- [ ] Vérifier le module Immobilisations
- [ ] Vérifier le dashboard opérationnel
- [ ] Vérifier l'analyse IA
- [ ] Commit des changements

---

## 📝 Commandes Git

```bash
# Ajouter les fichiers modifiés
git add src/i18n/locales/en.json
git add src/i18n/locales/es.json

# Commit
git commit -m "feat(i18n): Add EN/ES translations for Assets module and Operational Dashboard"

# Pousser
git push
```

---

## 💡 Conseils

1. **Faire un backup avant de modifier**
   ```bash
   cp src/i18n/locales/en.json src/i18n/locales/en.json.backup
   cp src/i18n/locales/es.json src/i18n/locales/es.json.backup
   ```

2. **Utiliser un éditeur avec support JSON**
   - VS Code (recommandé)
   - Sublime Text
   - WebStorm

3. **Tester au fur et à mesure**
   - Intégrer assets
   - Tester
   - Intégrer dashboard
   - Tester

4. **Demander une revue**
   - Anglais: Vérifier par un natif
   - Espagnol: Vérifier par un natif

---

**Bonne intégration !** 🚀
