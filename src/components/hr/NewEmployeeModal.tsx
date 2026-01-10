import React, { useState, useEffect } from 'react';
import { hrService, Employee } from '@/services/hrService';
import { useAuth } from '@/contexts/AuthContext';
import { X, Save, User } from 'lucide-react';
import { toastSuccess, toastError } from '@/lib/toast-helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { logger } from '@/lib/logger';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
interface NewEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (employee: Employee) => void;
}
export const NewEmployeeModal: React.FC<NewEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentCompany } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
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
      loadData();
    }
  }, [isOpen, currentCompany?.id]);
  const loadData = async () => {
    if (!currentCompany?.id) return;
    try {
      // Charger les employés existants pour le manager
      const response = await hrService.getEmployees(currentCompany.id);
      if (response.success && response.data) {
        setEmployees(response.data);
        // Extraire les départements existants
        const depts = [...new Set(response.data.map(e => e.department).filter(Boolean))] as string[];
        setDepartments(depts);
      }
    } catch (error) {
      logger.error('NewEmployeeModal', 'Erreur chargement données:', error);
    }
  };
  if (!isOpen) return null;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name) {
      toastError('Le prénom et le nom sont obligatoires');
      return;
    }
    if (!currentCompany?.id) {
      toastError('Entreprise non définie');
      return;
    }
    setLoading(true);
    try {
      const response = await hrService.createEmployee(currentCompany.id, {
        ...formData,
        manager_id: formData.manager_id || undefined,
        contract_type: formData.contract_type as 'permanent' | 'temporary' | 'intern' | 'freelance',
        status: formData.status as 'active' | 'inactive' | 'on_leave'
      });
      if (response.success && response.data) {
        toastSuccess('Employé créé avec succès');
        onSuccess(response.data);
        onClose();
      } else {
        toastError(response.error || 'Erreur lors de la création');
        setLoading(false);
        return;
      }
      // Reset form
      setFormData({
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Ajouter un Employé
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors dark:bg-gray-900/50"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Identité */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
                Identité
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom *</Label>
                  <Input
                    id="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom *</Label>
                  <Input
                    id="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Date de naissance</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee_number">Matricule</Label>
                  <Input
                    id="employee_number"
                    type="text"
                    value={formData.employee_number}
                    onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                    placeholder="EMP-001"
                  />
                </div>
              </div>
            </div>
            {/* Emploi */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
                Emploi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Poste</Label>
                  <Input
                    id="position"
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Développeur, Commercial..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Département</Label>
                  <Input
                    id="department"
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="IT, RH, Commercial..."
                    list="departments"
                  />
                  <datalist id="departments">
                    {departments.map(d => <option key={d} value={d} />)}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hire_date">Date d'embauche *</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract_type">Type de contrat</Label>
                  <Select
                    value={formData.contract_type}
                    onValueChange={(value) => setFormData({ ...formData, contract_type: value })}
                  >
                    <SelectTrigger id="contract_type">
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_TYPES.map(ct => (
                        <SelectItem key={ct.value} value={ct.value}>
                          {ct.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager_id">Manager</Label>
                  <Select
                    value={formData.manager_id || undefined}
                    onValueChange={(value) => setFormData({ ...formData, manager_id: value })}
                  >
                    <SelectTrigger id="manager_id">
                      <SelectValue placeholder="Aucun manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {/* Rémunération */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
                Rémunération
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary">Salaire</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={formData.salary || ''}
                    onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary_type">Type de salaire</Label>
                  <Select
                    value={formData.salary_type}
                    onValueChange={(value) => setFormData({ ...formData, salary_type: value })}
                  >
                    <SelectTrigger id="salary_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                      <SelectItem value="annual">Annuel</SelectItem>
                      <SelectItem value="hourly">Horaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leave_balance">Solde congés initial</Label>
                  <Input
                    id="leave_balance"
                    type="number"
                    value={formData.leave_balance}
                    onChange={(e) => setFormData({ ...formData, leave_balance: parseFloat(e.target.value) || 25 })}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t shrink-0">
          <Button variant="outline" onClick={onClose} type="button">
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Créer l'employé
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};