# Scripts CassKai

## 📋 Liste des Scripts

### `validate-db-columns.cjs`

**Description:** Script de validation automatique des colonnes de base de données Supabase.

**Usage:**
```bash
npm run validate:db
```

**Ce qu'il fait:**
- ✅ Scanne tous les fichiers TypeScript dans `src/`
- ✅ Détecte les colonnes DB supprimées ou inexistantes
- ✅ Identifie les tables inexistantes (ex: `inventory_categories`)
- ✅ Affiche un rapport détaillé avec erreurs critiques et avertissements
- ✅ Compare avec le schéma Supabase de référence

**Sortie:**
- Exit code 0 : Aucun problème
- Exit code 1 : Erreurs critiques détectées

**Exemple de sortie:**
```
🔍 Validation des colonnes DB...

❌ ERREURS CRITIQUES (2):
1. src/services/inventoryService.ts
   Table inventory_categories n'existe pas

⚠️  AVERTISSEMENTS (5):
1. src/services/crmService.ts
   Colonne 'status' potentiellement utilisée
```

**Intégration CI/CD:**
```yaml
- name: Validate DB Schema
  run: npm run validate:db
```

**Documentation complète:** Voir [DB-SCHEMA-VALIDATION.md](../docs/DB-SCHEMA-VALIDATION.md)

---

## 🚀 Scripts de Déploiement

### PowerShell (Windows)
```bash
.\deploy-vps.ps1              # Build + déploiement complet
.\deploy-vps.ps1 -SkipBuild   # Déploiement sans build
```

### Bash (Linux/Mac/Git Bash)
```bash
./deploy-vps.sh              # Build + déploiement complet
./deploy-vps.sh --skip-build # Déploiement sans build
```

---

## 📝 Ajouter un Nouveau Script

1. Créer le fichier dans `scripts/`
2. Pour Node.js : utiliser l'extension `.cjs` (CommonJS) ou `.mjs` (ES Module)
3. Ajouter la commande dans `package.json`:
```json
{
  "scripts": {
    "mon-script": "node scripts/mon-script.cjs"
  }
}
```
4. Documenter ici dans ce README

---

## 🛠️ Maintenance

- **Auteur:** NOUTCHE CONSEIL
- **Dernière mise à jour:** 2025-12-07
- **Contact:** contact@casskai.app
