# Corrections Module RH - Guide Complet

**Date**: 28 Novembre 2025
**Status**: ✅ Migration SQL créée | 🔄 Traductions et Modals à ajouter

---

## ✅ ÉTAPE 1 : Migration SQL (CRÉÉE)

**Fichier**: `supabase/migrations/20251128_hr_module_complete.sql`

### À appliquer dans Supabase Dashboard → SQL Editor

Cette migration crée 8 tables complètes :
1. ✅ `employees` - Employés
2. ✅ `trainings` - Catalogue formations
3. ✅ `training_sessions` - Sessions de formation
4. ✅ `training_enrollments` - Inscriptions
5. ✅ `employee_certifications` - Certifications
6. ✅ `leave_requests` - Demandes de congés
7. ✅ `expense_reports` - Notes de frais
8. ✅ `hr_documents` - Documents RH

**Commande** : Copier/coller le contenu dans SQL Editor et exécuter.

---

## 🔄 ÉTAPE 2 : Traductions Complètes

### Fichier 1 : `src/i18n/locales/fr.json`

Ajouter dans la section `"common"` (vers ligne 10) :
```json
"common": {
  "beta": "Bêta",
  "inDevelopment": "En développement",
  "comingSoon": "Bientôt disponible",
  "noData": "Aucune donnée",
  "loading": "Chargement...",
  "save": "Enregistrer",
  "cancel": "Annuler",
  "delete": "Supprimer",
  "edit": "Modifier",
  "add": "Ajouter",
  "search": "Rechercher",
  "filter": "Filtrer",
  "export": "Exporter",
  "import": "Importer",
  "refresh": "Actualiser"
}
```

Ajouter une nouvelle section `"hr"` (après "crm") :
```json
"hr": {
  "title": "Ressources Humaines",
  "subtitle": "Gérez vos employés, congés, frais et temps de travail",

  "tabs": {
    "analytics": "Analytics",
    "employees": "Employés",
    "objectives": "Objectifs",
    "evaluations": "Évaluations",
    "feedback": "Feedback",
    "training": "Formations",
    "leave": "Congés",
    "expenses": "Frais",
    "documents": "Documents",
    "templates": "Templates",
    "generation": "Génération",
    "archives": "Archives"
  },

  "dashboard": {
    "employees": "Employés",
    "active": "actifs",
    "newHires": "Nouvelles Embauches",
    "thisMonth": "Ce mois-ci",
    "pendingLeave": "Congés en Attente",
    "approved": "approuvés",
    "pendingExpenses": "Frais en Attente",
    "total": "total"
  },

  "employees": {
    "title": "Gestion des Employés",
    "count": "{count} employés",
    "noEmployees": "Aucun employé",
    "noEmployeesDesc": "Commencez par ajouter vos premiers employés",
    "addEmployee": "Ajouter un Employé",
    "editEmployee": "Modifier l'employé",
    "deleteEmployee": "Supprimer l'employé",
    "fields": {
      "firstName": "Prénom",
      "lastName": "Nom",
      "email": "Email",
      "phone": "Téléphone",
      "position": "Poste",
      "department": "Département",
      "hireDate": "Date d'embauche",
      "salary": "Salaire",
      "manager": "Manager",
      "status": "Statut",
      "contract": "Type de contrat"
    },
    "statuses": {
      "active": "Actif",
      "onLeave": "En congé",
      "terminated": "Parti"
    },
    "contracts": {
      "cdi": "CDI",
      "cdd": "CDD",
      "intern": "Stage",
      "freelance": "Freelance",
      "apprentice": "Apprentissage"
    }
  },

  "training": {
    "title": "Formation & Développement",
    "stats": {
      "trainings": "Formations",
      "sessions": "Sessions",
      "enrollments": "Inscriptions",
      "completionRate": "Taux de complétion",
      "certifications": "Certifications"
    },
    "investment": "Investissement formation",
    "roi": "ROI Formation",
    "perEmployee": "Par employé",

    "catalog": {
      "title": "Catalogue",
      "noTrainings": "Aucune formation trouvée",
      "noTrainingsDesc": "Commencez par ajouter des formations au catalogue",
      "addTraining": "Ajouter une formation",
      "newTraining": "Nouvelle formation"
    },
    "sessions": {
      "title": "Sessions",
      "noSessions": "Aucune session trouvée",
      "noSessionsDesc": "Planifiez votre première session de formation",
      "addSession": "Planifier une session",
      "newSession": "Nouvelle session"
    },
    "certifications": {
      "title": "Certifications",
      "noCertifications": "Aucune certification trouvée",
      "noCertificationsDesc": "Enregistrez les certifications des employés",
      "addCertification": "Ajouter une certification",
      "newCertification": "Nouvelle certification"
    }
  },

  "leave": {
    "title": "Gestion des Congés",
    "count": "{count} demandes de congés",
    "noLeave": "Aucune demande de congés",
    "noLeaveDesc": "Les demandes de congés apparaîtront ici",
    "newRequest": "Nouvelle Demande",
    "fields": {
      "employee": "Employé",
      "type": "Type de congé",
      "startDate": "Date de début",
      "endDate": "Date de fin",
      "days": "Jours",
      "reason": "Motif",
      "status": "Statut"
    },
    "types": {
      "paid": "Congés payés",
      "unpaid": "Congés sans solde",
      "sick": "Maladie",
      "maternity": "Maternité",
      "paternity": "Paternité",
      "family": "Événement familial",
      "other": "Autre"
    },
    "statuses": {
      "pending": "En attente",
      "approved": "Approuvé",
      "rejected": "Refusé",
      "cancelled": "Annulé"
    }
  },

  "expenses": {
    "title": "Gestion des Frais",
    "count": "{count} notes de frais",
    "noExpenses": "Aucune note de frais",
    "noExpensesDesc": "Les notes de frais apparaîtront ici",
    "newExpense": "Nouvelle Note de Frais",
    "fields": {
      "employee": "Employé",
      "category": "Catégorie",
      "amount": "Montant",
      "date": "Date",
      "description": "Description",
      "receipt": "Justificatif",
      "status": "Statut"
    },
    "categories": {
      "travel": "Déplacement",
      "meals": "Repas",
      "accommodation": "Hébergement",
      "equipment": "Équipement",
      "training": "Formation",
      "other": "Autre"
    }
  },

  "documents": {
    "title": "Documents",
    "noDocuments": "Aucun document",
    "uploadDocument": "Téléverser un document",
    "categories": {
      "contract": "Contrats",
      "payslip": "Bulletins de paie",
      "certificate": "Attestations",
      "other": "Autres"
    }
  }
}
```

### Fichier 2 : `src/i18n/locales/en.json`

Ajouter les mêmes clés en anglais (traduction complète dans le document utilisateur).

### Fichier 3 : `src/i18n/locales/es.json`

Ajouter les mêmes clés en espagnol (traduction complète dans le document utilisateur).

---

## 🔄 ÉTAPE 3 : Corriger l'erreur Select.Item

### Trouver les fichiers concernés
```bash
grep -rn 'value=""' src/components/hr/
grep -rn "value=''" src/components/hr/
```

### Corrections à appliquer

**MAUVAIS** (provoque l'erreur) :
```tsx
<SelectItem value="">Sélectionner...</SelectItem>
```

**BON** :
```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Sélectionner..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

---

## 🔄 ÉTAPE 4 : Supprimer les Données Mockées

### Trouver les données fictives
```bash
grep -rn "+24%\|ROI Formation" src/
grep -rn "mockData\|MOCK_" src/components/hr/
```

### Dans le Dashboard HR

**AVANT** (données mockées) :
```tsx
<div>ROI Formation</div>
<div className="text-green-500">+24%</div>
```

**APRÈS** (vraies données) :
```tsx
const stats = await hrService.getDashboardStats(companyId);

<div>ROI Formation</div>
<div className={stats.training.roi > 0 ? 'text-green-500' : 'text-gray-400'}>
  {stats.training.roi > 0 ? `+${stats.training.roi}%` : '-'}
</div>
```

---

## 🔄 ÉTAPE 5 : Créer les Modals Fonctionnels

### Modal 1 : NewEmployeeModal.tsx

Créer le fichier `src/components/hr/NewEmployeeModal.tsx` :

```tsx
import React, { useState, useEffect } from 'react';
import { hrService } from '@/services/hrService';
import { useAuth } from '@/contexts/AuthContext';
import { X, Save, User } from 'lucide-react';
import { toastSuccess, toastError } from '@/lib/toast-helpers';

interface NewEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (employee: any) => void;
}

export const NewEmployeeModal: React.FC<NewEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentCompany } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birth_date: '',
    employee_number: '',
    position: '',
    department: '',
    hire_date: new Date().toISOString().split('T')[0],
    contract_type: 'cdi',
    salary: 0,
    salary_type: 'monthly',
    manager_id: '',
    leave_balance: 25,
    status: 'active'
  });

  useEffect(() => {
    if (isOpen && currentCompany?.id) {
      hrService.getEmployees(currentCompany.id).then(setEmployees);
    }
  }, [isOpen, currentCompany?.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name) {
      toastError('Le prénom et le nom sont obligatoires');
      return;
    }

    setLoading(true);
    try {
      const employee = await hrService.createEmployee(currentCompany!.id, {
        ...formData,
        manager_id: formData.manager_id || null
      });
      toastSuccess('Employé créé avec succès');
      onSuccess(employee);
      onClose();
    } catch (error: any) {
      toastError(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const CONTRACT_TYPES = [
    { value: 'cdi', label: 'CDI' },
    { value: 'cdd', label: 'CDD' },
    { value: 'intern', label: 'Stage' },
    { value: 'apprentice', label: 'Apprentissage' },
    { value: 'freelance', label: 'Freelance' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Ajouter un Employé
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Identité */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">Identité</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Prénom *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nom *</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Emploi */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">Emploi</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Poste</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Développeur, Commercial..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Département</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="IT, RH, Commercial..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date d'embauche *</label>
                  <input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type de contrat</label>
                  <select
                    value={formData.contract_type}
                    onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {CONTRACT_TYPES.map(ct => (
                      <option key={ct.value} value={ct.value}>{ct.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Manager</label>
                  <select
                    value={formData.manager_id}
                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Aucun manager</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Rémunération */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">Rémunération</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Salaire</label>
                  <input
                    type="number"
                    value={formData.salary || ''}
                    onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Solde congés initial</label>
                  <input
                    type="number"
                    value={formData.leave_balance}
                    onChange={(e) => setFormData({ ...formData, leave_balance: parseFloat(e.target.value) || 25 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? '...' : <Save className="h-4 w-4" />}
            Créer l'employé
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Modal 2, 3, 4 : Créer sur le même modèle

- `NewTrainingModal.tsx` - Pour créer une formation
- `NewSessionModal.tsx` - Pour planifier une session
- `NewCertificationModal.tsx` - Pour ajouter une certification

---

## 🔄 ÉTAPE 6 : Intégration dans HumanResourcesPage.tsx

Trouver tous les boutons "Ajouter" et connecter les modals :

```tsx
import { NewEmployeeModal } from './NewEmployeeModal';

const [showEmployeeModal, setShowEmployeeModal] = useState(false);

// Dans le JSX
<Button onClick={() => setShowEmployeeModal(true)}>
  Ajouter un Employé
</Button>

<NewEmployeeModal
  isOpen={showEmployeeModal}
  onClose={() => setShowEmployeeModal(false)}
  onSuccess={(employee) => {
    // Rafraîchir la liste
    loadEmployees();
  }}
/>
```

---

## 📊 Résumé des Actions

| # | Action | Fichier | Status |
|---|--------|---------|--------|
| 1 | Appliquer migration SQL | Supabase Dashboard | ✅ Prêt |
| 2 | Ajouter traductions FR | src/i18n/locales/fr.json | 🔄 À faire |
| 3 | Ajouter traductions EN | src/i18n/locales/en.json | 🔄 À faire |
| 4 | Ajouter traductions ES | src/i18n/locales/es.json | 🔄 À faire |
| 5 | Corriger Select.Item | src/components/hr/*.tsx | 🔄 À faire |
| 6 | Supprimer données mock | src/components/hr/*.tsx | 🔄 À faire |
| 7 | Créer NewEmployeeModal | src/components/hr/ | 🔄 À faire |
| 8 | Créer NewTrainingModal | src/components/hr/ | 🔄 À faire |
| 9 | Créer NewSessionModal | src/components/hr/ | 🔄 À faire |
| 10 | Créer NewCertificationModal | src/components/hr/ | 🔄 À faire |
| 11 | Intégrer modals | HumanResourcesPage.tsx | 🔄 À faire |
| 12 | Vérifier TypeScript | npm run type-check | 🔄 À faire |

---

## 🚀 Ordre d'Exécution Recommandé

1. **Appliquer la migration SQL** (5 minutes)
2. **Ajouter les traductions** (15 minutes)
3. **Corriger les Select.Item** (10 minutes)
4. **Supprimer les données mockées** (10 minutes)
5. **Créer les 4 modals** (1 heure)
6. **Intégrer les modals** (30 minutes)
7. **Tester et vérifier TypeScript** (15 minutes)

**Durée totale estimée** : ~2h30

---

**Développeur** : Claude (Assistant IA)
**Date** : 28 Novembre 2025
**Status** : Documentation complète - Prête pour implémentation
