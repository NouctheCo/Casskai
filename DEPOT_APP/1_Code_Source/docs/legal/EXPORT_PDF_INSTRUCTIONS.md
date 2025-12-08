# 📄 Instructions Export PDF Documents Légaux

**Objectif** : Exporter les 4 documents légaux en PDF pour téléchargement utilisateurs + archives avocat.

---

## 🚀 Procédure

### 1. Lancer le serveur dev
```bash
npm run dev
```

### 2. Exporter chaque page en PDF

#### A. CGU (Conditions Générales d'Utilisation)
1. Ouvrir : `http://localhost:5173/terms-of-service`
2. Attendre chargement complet
3. **Ctrl + P** (ou Cmd + P sur Mac)
4. **Destination** : "Enregistrer au format PDF"
5. **Mise en page** :
   - Format : A4
   - Orientation : Portrait
   - Marges : Par défaut
   - En-têtes/pieds de page : Décocher
   - Graphiques d'arrière-plan : Cocher
6. Sauvegarder : `docs/legal/pdf/CGU_v2.1_CassKai.pdf`

#### B. Politique de confidentialité
1. Ouvrir : `http://localhost:5173/privacy-policy`
2. **Ctrl + P**
3. Mêmes paramètres qu'au-dessus
4. Sauvegarder : `docs/legal/pdf/Politique_Confidentialite_v2.1_CassKai.pdf`

#### C. CGV (Conditions Générales de Vente)
1. Ouvrir : `http://localhost:5173/terms-of-sale`
2. **Ctrl + P**
3. Mêmes paramètres
4. Sauvegarder : `docs/legal/pdf/CGV_v1.0_CassKai.pdf`

#### D. Politique des cookies
1. Ouvrir : `http://localhost:5173/cookie-policy`
2. **Ctrl + P**
3. Mêmes paramètres
4. Sauvegarder : `docs/legal/pdf/Politique_Cookies_v1.0_CassKai.pdf`

---

## ✅ Checklist finale

Vérifier que chaque PDF :
- [ ] Est lisible (pas de texte coupé)
- [ ] Contient toutes les sections (pas de pages manquantes)
- [ ] A un nom de fichier correct avec version
- [ ] Fait moins de 5 Mo
- [ ] Conserve les styles CSS (couleurs, typographie)

---

## 📦 Résultat attendu

Structure finale :
```
docs/legal/pdf/
├── CGU_v2.1_CassKai.pdf
├── Politique_Confidentialite_v2.1_CassKai.pdf
├── CGV_v1.0_CassKai.pdf
└── Politique_Cookies_v1.0_CassKai.pdf
```

---

## 🎯 Utilisation

**Pour les utilisateurs** :
- Téléchargement depuis page `/legal` (à créer - Tâche #4)
- Annexe contrats clients

**Pour l'avocat** :
- Archive validation juridique
- Preuve conformité RGPD

**Pour l'équipe** :
- Documentation interne
- Onboarding partenaires

---

## ⏱️ Temps estimé : 15 minutes

1 min par document × 4 = 4 min  
+ Vérifications qualité = 5 min  
+ Nommage/rangement = 3 min  
+ Buffer = 3 min  
**TOTAL : 15 minutes**
