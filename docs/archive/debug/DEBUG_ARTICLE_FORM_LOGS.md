# Debug Article Form - Logs de Diagnostic

**Date**: 2025-01-09
**Fichiers Modifiés**:
- `src/components/inventory/NewArticleModal.tsx`
- `src/services/articlesService.ts`

**Status**: ✅ LOGS AJOUTÉS

---

## 🎯 Objectif

Diagnostiquer pourquoi le formulaire de création d'article ne fonctionne pas en ajoutant des logs détaillés à chaque étape du processus.

---

## 🔧 Logs Ajoutés

### 1. **NewArticleModal.tsx** - Fonction `handleSubmit()`

**Fichier**: [src/components/inventory/NewArticleModal.tsx:154-230](src/components/inventory/NewArticleModal.tsx#L154-L230)

#### Logs au Début
```typescript
console.log('=== 📝 SUBMIT ARTICLE FORM ===');
console.log('Form data (raw):', formData);
console.log('Current company:', currentCompany);
```

#### Logs de Validation
```typescript
if (!currentCompany) {
  console.error('❌ No company selected');
  // ...
}

if (!formData.name.trim()) {
  console.error('❌ Article name is required');
  // ...
}

if (!formData.reference.trim()) {
  console.error('❌ Article reference is required');
  // ...
}

if (!formData.warehouse_id) {
  console.error('❌ Warehouse is required');
  // ...
}

console.log('✅ Validation passed');
```

#### Logs Avant Création
```typescript
console.log('📦 Article data to create:', articleInput);
console.log('🏢 Company ID:', currentCompany.id);
```

#### Logs de Succès/Erreur
```typescript
// Succès
console.log('✅ Article created successfully:', article);

// Erreur
console.error('❌ Error creating article:', err);
console.error('❌ Error details:', err instanceof Error ? err.message : String(err));

// Fin
console.log('=== END SUBMIT ===');
```

---

### 2. **articlesService.ts** - Fonction `createArticle()`

**Fichier**: [src/services/articlesService.ts:186-233](src/services/articlesService.ts#L186-L233)

#### Logs au Début
```typescript
console.log('🔧 [articlesService.createArticle] Called with:');
console.log('  - companyId:', companyId);
console.log('  - articleData:', articleData);
```

#### Logs de Vérification Référence
```typescript
console.log('🔍 Checking if reference already exists:', articleData.reference);
// ...
if (existingArticle) {
  console.error('❌ Reference already exists:', existingArticle.id);
  // ...
}
console.log('✅ Reference is unique');
```

#### Logs Insertion DB
```typescript
console.log('💾 Inserting article into database:', dataToInsert);

const { data, error } = await supabase
  .from('articles')
  .insert(dataToInsert)
  .select()
  .single();

console.log('📤 Database response:');
console.log('  - data:', data);
console.log('  - error:', error);
```

#### Logs d'Erreur DB
```typescript
if (error) {
  console.error('❌ Database error:', JSON.stringify(error, null, 2));
  // ...
}

console.log('✅ Article created successfully:', data.id);
```

---

## 📊 Séquence de Logs Attendue

### Cas de Succès ✅

```
=== 📝 SUBMIT ARTICLE FORM ===
Form data (raw): {
  reference: "ART-001",
  name: "Test Article",
  warehouse_id: "uuid-123",
  // ... autres champs
}
Current company: { id: "company-uuid", name: "Ma Société" }
✅ Validation passed
📦 Article data to create: {
  reference: "ART-001",
  name: "Test Article",
  // ... données transformées
}
🏢 Company ID: company-uuid

🔧 [articlesService.createArticle] Called with:
  - companyId: company-uuid
  - articleData: { ... }
🔍 Checking if reference already exists: ART-001
✅ Reference is unique
💾 Inserting article into database: {
  company_id: "company-uuid",
  reference: "ART-001",
  // ... toutes les données
  is_active: true
}
📤 Database response:
  - data: { id: "new-article-uuid", ... }
  - error: null
✅ Article created successfully: new-article-uuid

✅ Article created successfully: { id: "new-article-uuid", ... }
=== END SUBMIT ===
```

---

### Cas d'Erreur - Validation ❌

```
=== 📝 SUBMIT ARTICLE FORM ===
Form data (raw): { reference: "", name: "" }
Current company: { id: "company-uuid" }
❌ Article name is required
=== END SUBMIT ===
```

---

### Cas d'Erreur - Référence Existante ❌

```
=== 📝 SUBMIT ARTICLE FORM ===
// ... form data et validation OK ...
✅ Validation passed
📦 Article data to create: { ... }
🏢 Company ID: company-uuid

🔧 [articlesService.createArticle] Called with: ...
🔍 Checking if reference already exists: ART-001
❌ Reference already exists: existing-article-uuid

❌ Error creating article: Error: Un article avec la référence "ART-001" existe déjà
❌ Error details: Un article avec la référence "ART-001" existe déjà
=== END SUBMIT ===
```

---

### Cas d'Erreur - Base de Données ❌

```
=== 📝 SUBMIT ARTICLE FORM ===
// ... validation OK ...
✅ Validation passed
📦 Article data to create: { ... }
🏢 Company ID: company-uuid

🔧 [articlesService.createArticle] Called with: ...
🔍 Checking if reference already exists: ART-001
✅ Reference is unique
💾 Inserting article into database: { ... }
📤 Database response:
  - data: null
  - error: {
      "code": "42703",
      "message": "column \"xyz\" does not exist",
      "details": "..."
    }
❌ Database error: { ... détails complets ... }

❌ Error creating article: Error: column "xyz" does not exist
❌ Error details: column "xyz" does not exist
=== END SUBMIT ===
```

---

## 🧪 Tests à Effectuer

### Test 1: Vérifier que le formulaire s'ouvre
- [ ] Ouvrir la page Inventaire
- [ ] Cliquer sur "Nouvel article"
- [ ] Vérifier que le modal s'affiche

### Test 2: Tenter de créer un article (vide)
- [ ] Laisser le formulaire vide
- [ ] Cliquer sur "Créer l'article"
- [ ] Vérifier les logs de validation dans la console

### Test 3: Remplir le formulaire et soumettre
- [ ] Remplir tous les champs obligatoires:
  - Référence: `TEST-001`
  - Nom: `Article de Test`
  - Entrepôt: Sélectionner un entrepôt
- [ ] Cliquer sur "Créer l'article"
- [ ] **Ouvrir la console du navigateur (F12)**
- [ ] Observer la séquence complète des logs

### Test 4: Analyser les logs
Identifier à quelle étape le problème survient:
- ✅ Le formulaire se soumet-il? (`=== SUBMIT ARTICLE FORM ===`)
- ✅ Les validations passent-elles? (`✅ Validation passed`)
- ✅ Le service est-il appelé? (`🔧 [articlesService.createArticle]`)
- ✅ La vérification de référence fonctionne-t-elle? (`🔍 Checking if reference`)
- ✅ L'insertion DB est-elle tentée? (`💾 Inserting article into database`)
- ❌ Y a-t-il une erreur? (`❌ Database error`)

---

## 🔍 Problèmes Possibles à Identifier

### 1. **Le formulaire ne se soumet pas**
**Symptôme**: Aucun log `=== SUBMIT ARTICLE FORM ===`
**Causes possibles**:
- Le bouton submit n'est pas de type `submit`
- Le formulaire a un `onSubmit` qui ne fonctionne pas
- Un `preventDefault()` manque quelque part

### 2. **Validation échoue**
**Symptôme**: Log `❌` avec raison de validation
**Causes possibles**:
- Champs requis vides
- `currentCompany` est null
- `warehouse_id` n'est pas défini

### 3. **Référence déjà existante**
**Symptôme**: `❌ Reference already exists`
**Solution**: Utiliser une référence unique différente

### 4. **Erreur de base de données**
**Symptôme**: `❌ Database error` avec détails JSON
**Causes possibles**:
- Colonne manquante dans la table `articles`
- Contrainte foreign key invalide (warehouse_id, supplier_id, etc.)
- Type de données incorrect
- Permissions insuffisantes

### 5. **La relation supplier cause une erreur**
**Symptôme**: Erreur mentionnant `supplier_id` ou `suppliers`
**Cause**: Foreign key vers table `suppliers` invalide
**Solution**:
- Vérifier que `supplier_id` est bien nullable
- Ou créer un fournisseur valide avant de créer l'article

---

## 📝 Instructions de Débogage

### Étape 1: Ouvrir la Console
1. Appuyer sur **F12** (Chrome/Edge) ou **Cmd+Option+I** (Mac)
2. Aller dans l'onglet **Console**
3. Effacer les logs existants (bouton poubelle)

### Étape 2: Reproduire le Problème
1. Tenter de créer un article
2. Observer la séquence des logs en temps réel

### Étape 3: Identifier le Point de Blocage
Chercher le **dernier log de succès** (✅) avant le premier **log d'erreur** (❌)

### Étape 4: Copier les Logs
1. Clic droit dans la console
2. "Save as..." ou copier tout
3. Envoyer les logs pour analyse

---

## 🎯 Prochaines Actions Selon les Résultats

| Logs Observés | Action à Prendre |
|---------------|------------------|
| Aucun log | Vérifier que le modal s'ouvre et que le bouton Submit fonctionne |
| Logs s'arrêtent à validation | Vérifier les données du formulaire (company, warehouse, etc.) |
| Logs s'arrêtent à vérification référence | Vérifier que `getArticleByReference()` fonctionne |
| Erreur DB - colonne inexistante | Vérifier schéma table `articles` |
| Erreur DB - foreign key | Vérifier que warehouse_id/supplier_id sont valides |
| Erreur DB - permissions | Vérifier RLS policies sur table `articles` |

---

## 📚 Documents Connexes

- [FIX_ARTICLES_SERVICE_OPTIONAL_SUPPLIER.md](FIX_ARTICLES_SERVICE_OPTIONAL_SUPPLIER.md) - Fix relations supplier
- [FIX_SUBSCRIPTION_ERRORS_COMPLETE.md](FIX_SUBSCRIPTION_ERRORS_COMPLETE.md) - Fix erreurs subscription
- [AUDIT_MODULE_INVENTAIRE.md](AUDIT_MODULE_INVENTAIRE.md) - Audit complet du module

---

**Status**: ✅ **Logs de diagnostic ajoutés - Prêt pour debugging**

**Prochaine Étape**: Tester la création d'article et analyser les logs dans la console du navigateur pour identifier le problème exact.
