# 🧪 Guide de Test Rapide - Audit Multi-Documents

Suivez ce guide pour valider que l'audit fonctionne correctement end-to-end.

---

## 🎯 Test 1: Audit Complet via Dashboard

### Étapes
1. Connectez-vous à CassKai
2. Allez à **Settings → Invoicing**
3. Cliquez sur l'onglet **"Audit Complet"** (nouveau)
4. Cliquez sur **🚀 Lancer Audit Complet**

### Résultats Attendus
- ✅ Bouton passe de "Lancer..." à "Audit en cours..."
- ✅ Graphique apparaît après quelques secondes
- ✅ Stats affichent: Total, Conformes, Non-conformes, Taux %
- ✅ Si documents non-conformes: aparecem dans les tabs

### Validation
```
Toast success: "✅ Audit terminé: X/Y conformes"
Graphique: Bars pour Factures/Devis/Bons/Avoirs/Notes
Stats: 5 boxes avec numéros
```

---

## 🎯 Test 2: Export CSV

### Étapes
1. Depuis le dashboard d'audit (après avoir lancé un audit)
2. Cliquez sur **📥 CSV** (bouton en haut à droite)

### Résultats Attendus
- ✅ Fichier `audit-multi-docs-YYYY-MM-DD.csv` téléchargé
- ✅ Headers: Type Document, Numéro, Devise, Conforme, Problèmes, Termes Corrigés
- ✅ Une ligne par document non-conforme

### Validation
```bash
# Ouvrir le CSV téléchargé
# Vérifier: colonnes présentes, données visibles
```

---

## 🎯 Test 3: Filtrage par Type

### Étapes
1. Depuis le dashboard d'audit
2. Cliquez sur les différents tabs: "Tous", "Factures", "Devis", "Bons", "Avoirs", "Notes Débit"

### Résultats Attendus
- ✅ Tab "Tous" affiche tous les problèmes
- ✅ Tab "Factures" filtre sur invoice_type = 'sale'
- ✅ Tab "Bons Commande" filtre sur invoice_type = 'purchase'
- ✅ Compteur dans chaque tab shows nombre de problèmes

### Validation
```
Selon votre base de données:
- Si 5 factures non-conformes → Tab Factures montre 5
- Si 0 devis problématiques → Tab Devis montre "Aucun problème détecté"
```

---

## 🎯 Test 4: Auto-Audit à la Création

### Étapes
1. Créez une **nouvelle facture** dans un pays/devise non-EUR (ex: XOF, USD)
2. Vérifiez les conditions de paiement
3. Enregistrez la facture

### Résultats Attendus
- ✅ Facture créée avec succès (jamais bloquée)
- ✅ Toast informatif apparaît: "⚠️ X problème(s) détecté(s)" (si problèmes)
- ✅ Ou toast "✅ Tous les documents sont conformes" (si OK)

### Validation
```
Toast notification visible 1-2 secondes après création
Facture accessible dans la liste (pas de rollback)
```

---

## 🎯 Test 5: Suggestions de Correction

### Étapes
1. Lancez l'audit complet (Test 1)
2. Cliquez sur un document non-conforme dans les tabs
3. Regardez la section verte "✓ Termes Recommandés"

### Résultats Attendus
- ✅ Document montré avec problèmes en rouge
- ✅ Suggestions affichées en vert
- ✅ Suggestions adaptées à la devise du document

### Validation
```
Pour XOF: "Conditions standard SYSCOHADA"
Pour USD: "Terms NET 30"
Pour EUR: "Condition: Payment within 30 days"
```

---

## 🎯 Test 6: Multi-Devise

### Setup
Créez 3 factures:
- **Facture 1:** EUR, conditions en français ✅ Conforme
- **Facture 2:** USD, conditions en français ❌ Non-conforme
- **Facture 3:** XOF, conditions en français ❌ Non-conforme (SYSCOHADA)

### Étapes
1. Lancez l'audit complet
2. Allez dans le tab "Factures"
3. Vérifiez que Facture 2 et 3 sont listées comme non-conformes

### Résultats Attendus
- ✅ Facture 2 problème: "Conditions de paiement non valides pour USD"
- ✅ Facture 3 problème: "Référence au BCE/SYSCOHADA manquante"
- ✅ Suggestions spécifiques à chaque devise

### Validation
```
EUR → pas de problème
USD → warning sur conditions
XOF → warning sur SYSCOHADA
```

---

## 🎯 Test 7: Types de Documents

### Setup
Créez:
- 1 facture (sale)
- 1 devis (quote)
- 1 bon de commande (purchase)
- 1 avoir (credit_note)
- 1 note de débit (debit_note)

Tous avec devise non-EUR pour maximiser les problèmes.

### Étapes
1. Lancez l'audit complet
2. Vérifiez que le graphique montre 5 types
3. Naviguez dans chaque tab

### Résultats Attendus
- ✅ Graphique: 5 barres (Factures, Devis, Bons, Avoirs, Notes)
- ✅ Chaque tab filtre correctement par type
- ✅ Compteur global increase de 5

### Validation
```
byType: {
  invoices: { checked: 1, ... },
  quotes: { checked: 1, ... },
  purchaseOrders: { checked: 1, ... },
  creditNotes: { checked: 1, ... },
  debitNotes: { checked: 1, ... }
}
```

---

## 🎯 Test 8: Conformité Résumée

### Étapes
1. Lancez l'audit complet
2. Regardez les 5 boxes en haut:
   - Total Documents
   - Conformes (vert)
   - Non-conformes (rouge)
   - Taux Conformité (bleu)
   - Audit Date

### Résultats Attendus
- ✅ Total = somme de tous les documents
- ✅ Conformes + Non-conformes = Total
- ✅ Taux = (Conformes/Total)*100%
- ✅ Date = aujourd'hui

### Validation
```
Si 150 documents total, 120 conformes:
- Total: 150
- Conformes: 120 (vert)
- Non-conformes: 30 (rouge)
- Taux: 80.0%
```

---

## 🧪 Checklist de Validation

### Code Quality
- [ ] `npm run type-check` → 0 erreurs
- [ ] `npm run lint` → 0 erreurs

### UI Tests
- [ ] Audit Panel visible dans Settings
- [ ] 3 onglets: Paramètres, Audit Conditions, **Audit Complet** (nouveau)
- [ ] Bouton "🚀 Lancer Audit Complet" cliquable
- [ ] Graphique Recharts affiche correctement

### Data Tests
- [ ] Audit détecte documents non-conformes
- [ ] Suggestions générées pour chaque problème
- [ ] Filter par type fonctionne correctement
- [ ] Export CSV valide

### Performance Tests
- [ ] Audit < 5 secondes pour 150 documents
- [ ] Toast notifications non-bloquant
- [ ] Pas de lag UI pendant audit

### Edge Cases
- [ ] Audit avec 0 documents (message "Aucun document")
- [ ] Audit avec tous conformes (stats montrent 100%)
- [ ] Audit avec tous non-conformes (stats montrent 0%)
- [ ] Devise non-supportée (fallback EUR)

---

## 📊 Exemple de Rapport Complet

Pour référence, voici un exemple de rapport attendu:

```json
{
  "companyId": "cmp_demo",
  "auditDate": "2025-01-30T15:30:00Z",
  "totalDocuments": 10,
  "compliantCount": 8,
  "nonCompliantCount": 2,
  "byType": {
    "invoices": { "checked": 5, "compliant": 4, "nonCompliant": 1 },
    "quotes": { "checked": 2, "compliant": 2, "nonCompliant": 0 },
    "purchaseOrders": { "checked": 2, "compliant": 1, "nonCompliant": 1 },
    "creditNotes": { "checked": 1, "compliant": 1, "nonCompliant": 0 },
    "debitNotes": { "checked": 0, "compliant": 0, "nonCompliant": 0 }
  },
  "findings": [
    {
      "documentType": "invoice",
      "documentNumber": "INV-001",
      "currency": "USD",
      "compliant": false,
      "issues": [
        "Conditions de paiement non valides pour USD",
        "Format de devise incorrect (€ pour USD)"
      ],
      "correctedTerms": [
        "Payment Terms: NET 30",
        "Currency: USD",
        "Late Fee: 1.5% per month"
      ]
    },
    {
      "documentType": "purchase_order",
      "documentNumber": "PO-001",
      "currency": "XOF",
      "compliant": false,
      "issues": [
        "Référence au BCE/SYSCOHADA manquante",
        "Conditions SYSCOHADA non conformes"
      ],
      "correctedTerms": [
        "Conditions standard SYSCOHADA",
        "Reference: Bilan Electronique",
        "Late Fee: 6% per year"
      ]
    }
  ],
  "summary": "Audit complet: 8/10 documents conformes. 2 à corriger."
}
```

---

## ✅ Validation Finale

Après tous les tests:

```
✅ Type checking: npm run type-check
✅ Linting: npm run lint
✅ UI tests: Tous les components visibles
✅ Data tests: Audit détecte non-conformités
✅ Performance: < 5s audit 150 docs
✅ Edge cases: Gérés sans erreurs
```

Si tous les tests passent → **Prêt pour production!** 🚀

---

**Version:** 1.0  
**Date:** 30 Janvier 2025  
**Estimated Time:** 15-30 minutes pour tous les tests
