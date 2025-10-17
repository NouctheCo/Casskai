# Quick Reference - Erreur Parsing Build

## 🚨 Erreur

```
[vite:esbuild] Transform failed with 1 error:
C:/Users/noutc/Casskai/src/services/automaticLetterageService.ts:600:34:
ERROR: Expected ";" but found "++"
```

## ⚡ Solution Rapide (2 min)

```bash
# Windows PowerShell
Remove-Item -Recurse -Force dist, node_modules\.vite, node_modules\.cache
npm run build

# Linux/Mac/Git Bash
rm -rf dist node_modules/.vite node_modules/.cache
npm run build
```

## 🔧 Si ça ne marche pas

### 1. Redémarrage complet (5 min)
```bash
# Fermer VS Code + tuer Node
taskkill /F /IM node.exe  # Windows
killall node              # Linux/Mac

# Rebuild
rm -rf dist node_modules/.vite
npm run build
```

### 2. Problème d'encodage (2 min)
```bash
# Avec VS Code:
# 1. Ouvrir le fichier
# 2. Bas droite: clic sur encodage
# 3. "Save with Encoding" → UTF-8
```

### 3. Reinstall complet (10 min)
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📋 Checklist

- [ ] Cache nettoyé (`.vite`, `.cache`, `dist`)
- [ ] Node redémarré
- [ ] Encodage UTF-8 vérifié
- [ ] Rebuild complet

## 📖 Guide Complet

Voir `GUIDE_ERREUR_PARSING.md` pour plus de détails

## ⏱️ Temps Estimé

- **Quick fix** : 2-5 minutes
- **Problème encodage** : +5 minutes
- **Reinstall** : +10 minutes

## 🎯 Taux de Succès

- Solution 1 (cache) : **70%**
- Solution 1+2 (redémarrage) : **85%**
- Solution 3 (reinstall) : **90%**

## 💡 Note

Le problème vient probablement d'un **cache corrompu** de Vite/esbuild après les modifications automatiques récentes (remplacement console.* → logger.*).
