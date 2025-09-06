// @ts-nocheck
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import HRService from '@/services/hrService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  KeyRound as UsersRound, 
  PlusCircle, 
  Search, 
  ListFilter, 
  Plane, 
  FileText, 
  DollarSign,
  ArrowLeft,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Settings,
  BarChart3,
  UserCheck,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Building,
  Calculator,
  Receipt,
  CreditCard,
  PieChart,
  Activity,
  Star,
  MessageSquare,
  BookOpen,
  Network,
  Sparkles
} from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";






export default function HumanResourcesPage() {
  const { t } = useLocale();
  const { toast } = useToast();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };
  const [activeView, setActiveView] = useState('dashboard');
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeTracking, setTimeTracking] = useState([]);
  const [hrMetrics, setHrMetrics] = useState(null);
  
  // États pour le formulaire employé
  const [hireDate, setHireDate] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('Technique');
  const [salary, setSalary] = useState('');
  const [contractType, setContractType] = useState('CDI');
  const [address, setAddress] = useState('');

  // Chargement initial des données
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [employeesData, leavesData, expensesData, timeEntriesData, metricsData] = await Promise.all([
          HRService.getEmployees(),
          HRService.getLeaves(),
          HRService.getExpenses(),
          HRService.getTimeEntries(),
          HRService.getHRMetrics()
        ]);
        
        setEmployees(employeesData);
        setLeaves(leavesData);
        setExpenses(expensesData);
        setTimeTracking(timeEntriesData);
        setHrMetrics(metricsData);
      } catch (error) {
        console.error('Error loading HR data:', error);
        setError(error.message);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les données RH"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleNewEmployee = () => {
    setShowEmployeeForm(true);
  };

  const handleBackToList = () => {
    setShowEmployeeForm(false);
  };

  const handleEditEmployee = (employee) => {
    // Pré-remplir le formulaire avec les données de l'employé
    setFirstName(employee.first_name || employee.firstName || '');
    setLastName(employee.last_name || employee.lastName || '');
    setEmail(employee.email || '');
    setPhone(employee.phone || '');
    setPosition(employee.position || '');
    setDepartment(employee.department || 'Technique');
    setSalary(employee.salary?.toString() || '');
    setContractType(employee.contract_type === 'permanent' ? 'CDI' : employee.contract_type === 'temporary' ? 'CDD' : employee.contractType || 'CDI');
    setAddress(employee.address || '');
    setHireDate(employee.hire_date ? new Date(employee.hire_date) : employee.hireDate ? new Date(employee.hireDate) : null);
    setSelectedEmployee(employee);
    setShowEmployeeForm(true);
  };

  const handleEditTimeEntry = (entry) => {
    toast({
      title: "Modifier les heures",
      description: "Interface de modification des heures à implémenter"
    });
  };

  const handleClockIn = () => {
    toast({
      title: "Arrivée pointée",
      description: `Arrivée enregistrée à ${new Date().toLocaleTimeString()}`
    });
  };

  const handleClockOut = () => {
    toast({
      title: "Départ pointé",
      description: `Départ enregistré à ${new Date().toLocaleTimeString()}`
    });
  };

  const handleBreak = (type) => {
    toast({
      title: "Pause enregistrée",
      description: `Pause ${type === 'lunch' ? 'déjeuner' : 'générale'} à ${new Date().toLocaleTimeString()}`
    });
  };

  const handleProjectChange = () => {
    toast({
      title: "Changement de projet",
      description: "Interface de sélection de projet à implémenter"
    });
  };

  const handleViewOnboardingDetails = (employee) => {
    toast({
      title: "Détails onboarding",
      description: `Affichage des détails d'intégration pour ${employee.firstName} ${employee.lastName}`
    });
  };

  const handleExportReports = () => {
    toast({
      title: "Export en cours",
      description: "Génération du rapport RH en cours..."
    });
  };

  // Gestionnaires d'événements
  const handleSubmit = useCallback(async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !position.trim()) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: "Veuillez remplir tous les champs obligatoires"
      });
      return;
    }

    try {
      const employeeData = {
        employee_number: selectedEmployee?.employee_number || `EMP${Date.now().toString().slice(-6)}`,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        position: position.trim(),
        department,
        hire_date: hireDate ? hireDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        salary: parseFloat(salary) || null,
        contract_type: contractType === 'CDI' ? 'permanent' : contractType === 'CDD' ? 'temporary' : 'intern',
        status: 'active',
        address: address.trim() || null
      };

      if (selectedEmployee) {
        // Mise à jour d'un employé existant
        await HRService.updateEmployee(selectedEmployee.id, employeeData);
        toast({
          title: t('success'),
          description: 'Employé mis à jour avec succès'
        });
      } else {
        // Création d'un nouvel employé
        await HRService.createEmployee(employeeData);
        toast({
          title: t('success'),
          description: t('humanresourcespage.employe_ajoute', { defaultValue: 'Employé ajouté avec succès' })
        });
      }
      
      // Recharger les employés
      const employeesData = await HRService.getEmployees();
      setEmployees(employeesData);
      
      // Réinitialiser le formulaire
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setPosition('');
      setDepartment('Technique');
      setSalary('');
      setContractType('CDI');
      setAddress('');
      setHireDate(null);
      setSelectedEmployee(null);
      
      setShowEmployeeForm(false);
    } catch (error) {
      console.error('Error saving employee:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: selectedEmployee ? "Impossible de mettre à jour l'employé" : "Impossible de créer l'employé"
      });
    }
  }, [firstName, lastName, email, phone, position, department, hireDate, salary, contractType, address, selectedEmployee, t, toast]);

  const handleLeaveRequest = useCallback(async (leaveData) => {
    try {
      const newLeave = await HRService.createLeave({
        employee_id: leaveData.employee_id || leaveData.employeeId,
        type: leaveData.type === 'Congés payés' ? 'vacation' : 
              leaveData.type === 'Congé maladie' ? 'sick' : 
              leaveData.type === 'Congé personnel' ? 'personal' : 'other',
        start_date: leaveData.startDate,
        end_date: leaveData.endDate,
        days_count: leaveData.days,
        reason: leaveData.reason,
        status: 'pending'
      });
      
      // Recharger les congés
      const leavesData = await HRService.getLeaves();
      setLeaves(leavesData);
      
      toast({
        title: "Demande envoyée",
        description: "Votre demande de congé a été soumise"
      });
    } catch (error) {
      console.error('Error creating leave request:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de soumettre la demande de congé"
      });
    }
  }, [toast]);

  const handleExpenseSubmit = useCallback(async (expenseData) => {
    try {
      const newExpense = await HRService.createExpense({
        employee_id: expenseData.employee_id || expenseData.employeeId,
        category: expenseData.category === 'Transport' ? 'transport' : 
                 expenseData.category === 'Repas d\'affaires' ? 'meals' : 
                 expenseData.category === 'Fournitures' ? 'supplies' : 'other',
        description: expenseData.description,
        amount: parseFloat(expenseData.amount),
        currency: 'EUR',
        expense_date: expenseData.date || new Date().toISOString().split('T')[0],
        status: 'pending',
        receipt_url: expenseData.receipt_url,
        notes: expenseData.notes
      });
      
      // Recharger les notes de frais
      const expensesData = await HRService.getExpenses();
      setExpenses(expensesData);
      
      toast({
        title: "Note de frais soumise",
        description: "Votre note de frais a été enregistrée"
      });
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de soumettre la note de frais"
      });
    }
  }, [toast]);

  const handleTimeEntry = useCallback(async (timeData) => {
    try {
      const newTimeEntry = await HRService.createTimeEntry({
        employee_id: timeData.employee_id || timeData.employeeId,
        date: timeData.date || new Date().toISOString().split('T')[0],
        start_time: timeData.startTime,
        end_time: timeData.endTime,
        hours_worked: timeData.totalHours || timeData.hours_worked,
        break_time: timeData.breakTime || timeData.break_time,
        project: timeData.project,
        task: timeData.task,
        description: timeData.notes || timeData.description,
        status: 'submitted'
      });
      
      // Recharger les entrées de temps
      const timeEntriesData = await HRService.getTimeEntries();
      setTimeTracking(timeEntriesData);
      
      toast({
        title: "Heures enregistrées",
        description: "Vos heures de travail ont été sauvegardées"
      });
    } catch (error) {
      console.error('Error creating time entry:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer les heures"
      });
    }
  }, [toast]);

  const handleApproveLeave = useCallback(async (leaveId) => {
    try {
      await HRService.updateLeaveStatus(leaveId, 'approved', 'Direction');
      
      // Recharger les congés
      const leavesData = await HRService.getLeaves();
      setLeaves(leavesData);
      
      toast({
        title: "Congé approuvé",
        description: "La demande de congé a été approuvée"
      });
    } catch (error) {
      console.error('Error approving leave:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'approuver le congé"
      });
    }
  }, [toast]);

  const handleRejectLeave = useCallback(async (leaveId, reason = 'Non spécifié') => {
    try {
      await HRService.updateLeaveStatus(leaveId, 'rejected');
      
      // Recharger les congés
      const leavesData = await HRService.getLeaves();
      setLeaves(leavesData);
      
      toast({
        title: "Congé refusé",
        description: "La demande de congé a été refusée"
      });
    } catch (error) {
      console.error('Error rejecting leave:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de refuser le congé"
      });
    }
  }, [toast]);

  // Calculs pour les métriques - utiliser les données du backend quand disponibles
  const metrics = useMemo(() => {
    if (hrMetrics) {
      return {
        ...hrMetrics,
        newHiresThisMonth: hrMetrics.newHires,
        turnoverRate: 0, // À implémenter
        approvedLeaves: leaves.filter(leave => leave.status === 'approved').length
      };
    }
    
    // Fallback: calculer à partir des données locales
    const totalSalary = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
    const pendingLeaves = leaves.filter(leave => leave.status === 'pending').length;
    const pendingExpenses = expenses.filter(expense => expense.status === 'pending').length;
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    
    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(emp => emp.status === 'active').length,
      newHiresThisMonth: employees.filter(emp => {
        const hireDate = new Date(emp.hire_date);
        const currentDate = new Date();
        return hireDate.getMonth() === currentDate.getMonth() && 
               hireDate.getFullYear() === currentDate.getFullYear();
      }).length,
      turnoverRate: 0,
      avgSalary: employees.length > 0 ? totalSalary / employees.length : 0,
      totalPayroll: totalSalary,
      pendingLeaves,
      approvedLeaves: leaves.filter(leave => leave.status === 'approved').length,
      pendingExpenses,
      totalExpenses
    };
  }, [hrMetrics, employees, leaves, expenses]);

  return (
    <motion.div 
      className="space-y-8 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Enhanced Header with filters */}
      <motion.div 
        className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0"
        variants={itemVariants}
      >
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('humanResources')}
            </h1>
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-gray-600 dark:text-gray-400">
              {t('humanresourcespage.grez_votre_personnel_congs_notes_de_frais_et_paie', { defaultValue: 'Gérez votre personnel, congés, notes de frais et paie.' })}
            </p>
            <Badge variant="secondary" className="text-xs">
              En temps réel
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={handleNewEmployee}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              {t('humanresourcespage.ajouter_employe', { defaultValue: 'Ajouter Employé' })}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {showEmployeeForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('humanresourcespage.nouvel_employ', { defaultValue: 'Nouvel Employé' })}</CardTitle>
            <CardDescription>{t('humanresourcespage.ajoutez_un_nouveau_membre_votre_quipe', { defaultValue: 'Ajoutez un nouveau membre à votre équipe' })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employee-firstname">{t('humanresourcespage.prnom', { defaultValue: 'Prénom' })}</Label>
                <Input 
                  id="employee-firstname" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jean" 
                />
              </div>
              <div>
                <Label htmlFor="employee-lastname">{t('humanresourcespage.nom', { defaultValue: 'Nom' })}</Label>
                <Input 
                  id="employee-lastname" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Dupont" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employee-email">{t('humanresourcespage.email_professionnel', { defaultValue: 'Email professionnel' })}</Label>
                <Input 
                  id="employee-email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jean.dupont@entreprise.com" 
                  type="email" 
                />
              </div>
              <div>
                <Label htmlFor="employee-phone">{t('humanresourcespage.tlphone', { defaultValue: 'Téléphone' })}</Label>
                <Input 
                  id="employee-phone" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01 23 45 67 89" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employee-position">{t('humanresourcespage.poste', { defaultValue: 'Poste' })}</Label>
                <Input 
                  id="employee-position" 
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Développeur Senior" 
                />
              </div>
              <div>
                <Label htmlFor="employee-department">{t('humanresourcespage.dpartement', { defaultValue: 'Département' })}</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger id="employee-department">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technique">{t('humanresourcespage.technique', { defaultValue: 'Technique' })}</SelectItem>
                    <SelectItem value="Commercial">{t('humanresourcespage.commercial', { defaultValue: 'Commercial' })}</SelectItem>
                    <SelectItem value="Marketing">{t('humanresourcespage.marketing', { defaultValue: 'Marketing' })}</SelectItem>
                    <SelectItem value="Administration">{t('humanresourcespage.administration', { defaultValue: 'Administration' })}</SelectItem>
                    <SelectItem value="Direction">{t('humanresourcespage.direction', { defaultValue: 'Direction' })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="employee-hire-date">{t('humanresourcespage.date_dembauche', { defaultValue: 'Date d\'embauche' })}</Label>
                <DatePicker
                  value={hireDate}
                  onChange={setHireDate}
                  placeholder={t('humanresourcespage.slectionnez_une_date', { defaultValue: 'Sélectionnez une date' })}
                />
              </div>
              <div>
                <Label htmlFor="employee-salary">{t('humanresourcespage.salaire_brut_mois', { defaultValue: 'Salaire brut (€/mois)' })}</Label>
                <Input 
                  id="employee-salary" 
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="3500" 
                  type="number" 
                />
              </div>
              <div>
                <Label htmlFor="employee-contract-type">{t('humanresourcespage.type_de_contrat', { defaultValue: 'Type de contrat' })}</Label>
                <Select value={contractType} onValueChange={setContractType}>
                  <SelectTrigger id="employee-contract-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CDI">CDI</SelectItem>
                    <SelectItem value="CDD">CDD</SelectItem>
                    <SelectItem value="Stage">{t('humanresourcespage.stage', { defaultValue: 'Stage' })}</SelectItem>
                    <SelectItem value="Freelance">{t('humanresourcespage.freelance', { defaultValue: 'Freelance' })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="employee-address">{t('humanresourcespage.adresse', { defaultValue: 'Adresse' })}</Label>
              <Input 
                id="employee-address" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Rue de la Paix, 75001 Paris" 
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleBackToList} variant="outline">{t('humanresourcespage.annuler', { defaultValue: 'Annuler' })}</Button>
              <Button onClick={handleSubmit}>{t('humanresourcespage.ajouter_lemploy', { defaultValue: 'Ajouter l\'employé' })}</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
            <TabsTrigger value="employees">Employés</TabsTrigger>
            <TabsTrigger value="leaves">Congés</TabsTrigger>
            <TabsTrigger value="expenses">Frais</TabsTrigger>
            <TabsTrigger value="payroll">Paie</TabsTrigger>
            <TabsTrigger value="timetracking">Pointage</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
            <TabsTrigger value="reports">Rapports</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Tableau de bord RH avec métriques */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Employés</span>
                  </div>
                  <div className="text-2xl font-bold">{metrics.totalEmployees}</div>
                  <p className="text-xs text-muted-foreground">{metrics.activeEmployees} actifs</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Masse salariale</span>
                  </div>
                  <div className="text-2xl font-bold">€{metrics.totalPayroll.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Moy: €{Math.round(metrics.avgSalary).toLocaleString()}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Plane className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Congés</span>
                  </div>
                  <div className="text-2xl font-bold">{metrics.pendingLeaves}</div>
                  <p className="text-xs text-muted-foreground">en attente</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Receipt className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Notes de frais</span>
                  </div>
                  <div className="text-2xl font-bold">{metrics.pendingExpenses}</div>
                  <p className="text-xs text-muted-foreground">€{metrics.totalExpenses.toFixed(2)} total</p>
                </CardContent>
              </Card>
            </div>

            {/* Graphiques et statistiques */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par département</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['Technique', 'Commercial', 'Marketing', 'Administration'].map((dept) => {
                      const count = employees.filter(emp => emp.department === dept).length;
                      const percentage = employees.length > 0 ? (count / employees.length) * 100 : 0;
                      return (
                        <div key={dept} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{dept}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={percentage} className="w-20 h-2" />
                            <span className="text-sm text-muted-foreground">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Activité récente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaves.slice(-5).map((leave) => (
                      <div key={leave.id} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          leave.status === 'approved' ? 'bg-green-500' :
                          leave.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{leave.employeeName}</p>
                          <p className="text-xs text-muted-foreground">{leave.type} - {leave.days} jours</p>
                        </div>
                        <Badge variant={leave.status === 'approved' ? 'default' : leave.status === 'rejected' ? 'destructive' : 'secondary'}>
                          {leave.status === 'approved' ? 'Approuvé' : leave.status === 'rejected' ? 'Refusé' : 'En attente'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div>
                    <CardTitle>Liste des Employés</CardTitle>
                    <CardDescription>Gérez les informations de vos employés</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-auto">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="search" placeholder="Rechercher employé..." className="pl-8 w-full md:w-[250px]" />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => toast({ title: "Filtres", description: "Interface de filtres à implémenter" })}><ListFilter className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {employees.length > 0 ? (
                  <div className="space-y-4">
                    {employees.map((employee) => (
                      <motion.div
                        key={employee.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{employee.firstName} {employee.lastName}</h3>
                            <p className="text-sm text-muted-foreground">{employee.position} • {employee.department}</p>
                            <p className="text-xs text-muted-foreground">{employee.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold">€{employee.salary.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">{employee.contractType}</p>
                          </div>
                          <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                            {employee.status === 'active' ? 'Actif' : 'Inactif'}
                          </Badge>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setSelectedEmployee(employee)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleEditEmployee(employee)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UsersRound className="mx-auto h-16 w-16 text-primary/50" />
                    <p className="mt-4 text-lg text-muted-foreground">Aucun employé enregistré</p>
                    <p className="text-sm text-muted-foreground mb-4">Commencez par ajouter votre premier employé</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaves" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Plane className="text-blue-500" />
                      Gestion des Congés
                    </CardTitle>
                    <CardDescription>Demandes et validations de congés</CardDescription>
                  </div>
                  <Button onClick={() => toast({ title: "Nouvelle demande", description: "Interface à implémenter" })}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Nouvelle demande
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaves.map((leave) => (
                    <motion.div
                      key={leave.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-semibold">{leave.employeeName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {leave.type} • {leave.startDate} au {leave.endDate} ({leave.days} jours)
                            </p>
                            <p className="text-xs text-muted-foreground">{leave.reason}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={leave.status === 'approved' ? 'default' : leave.status === 'rejected' ? 'destructive' : 'secondary'}>
                          {leave.status === 'approved' ? 'Approuvé' : leave.status === 'rejected' ? 'Refusé' : 'En attente'}
                        </Badge>
                        {leave.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => handleApproveLeave(leave.id)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRejectLeave(leave.id)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="text-green-500" />
                      Notes de Frais
                    </CardTitle>
                    <CardDescription>Gestion des remboursements</CardDescription>
                  </div>
                  <Button onClick={() => toast({ title: "Nouvelle note", description: "Interface à implémenter" })}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Nouvelle note
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenses.map((expense) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-semibold">{expense.employeeName}</h3>
                            <p className="text-sm text-muted-foreground">{expense.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {expense.category} • {expense.date} • Compte: {expense.accountCode}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold">€{expense.amount.toFixed(2)}</p>
                          {expense.receipt && <Badge variant="outline" className="text-xs">Justificatif</Badge>}
                        </div>
                        <Badge variant={expense.status === 'approved' ? 'default' : expense.status === 'rejected' ? 'destructive' : 'secondary'}>
                          {expense.status === 'approved' ? 'Approuvé' : expense.status === 'rejected' ? 'Refusé' : 'En attente'}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="text-yellow-500" />
                  Calcul de Paie
                </CardTitle>
                <CardDescription>Préparation et calcul des salaires</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <h3 className="font-semibold">Salaires bruts</h3>
                          <p className="text-2xl font-bold text-green-600">€{metrics.totalPayroll.toLocaleString()}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <h3 className="font-semibold">Charges sociales</h3>
                          <p className="text-2xl font-bold text-orange-600">€{(metrics.totalPayroll * 0.42).toLocaleString()}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <h3 className="font-semibold">Coût total</h3>
                          <p className="text-2xl font-bold text-red-600">€{(metrics.totalPayroll * 1.42).toLocaleString()}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">Détail par employé</h3>
                    {employees.map((employee) => {
                      const overtimeHours = timeTracking
                        .filter(entry => entry.employeeId === employee.id)
                        .reduce((sum, entry) => sum + entry.overtime, 0);
                      const grossSalary = employee.salary;
                      const overtime = overtimeHours * (employee.salary / 151.67) * 1.25;
                      const totalGross = grossSalary + overtime;
                      const socialCharges = totalGross * 0.23;
                      const netSalary = totalGross - socialCharges;
                      
                      return (
                        <div key={employee.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{employee.firstName} {employee.lastName}</h4>
                              <p className="text-sm text-muted-foreground">{employee.position}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">Net: €{netSalary.toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground">Brut: €{totalGross.toFixed(2)}</p>
                              {overtimeHours > 0 && (
                                <p className="text-xs text-orange-600">+{overtimeHours}h sup.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timetracking" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="text-blue-500" />
                      Suivi des Heures
                    </CardTitle>
                    <CardDescription>Pointage et suivi du temps de travail</CardDescription>
                  </div>
                  <Button onClick={() => toast({ title: "Pointer", description: "Interface de pointage à implémenter" })}>
                    <Clock className="h-4 w-4 mr-2" />
                    Pointer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Statistiques hebdomadaires */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <h3 className="font-semibold text-sm">Heures cette semaine</h3>
                          <p className="text-2xl font-bold text-blue-600">
                            {timeTracking.reduce((sum, entry) => sum + entry.totalHours, 0)}h
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <h3 className="font-semibold text-sm">Heures supplémentaires</h3>
                          <p className="text-2xl font-bold text-orange-600">
                            {timeTracking.reduce((sum, entry) => sum + entry.overtime, 0)}h
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <h3 className="font-semibold text-sm">Jours travaillés</h3>
                          <p className="text-2xl font-bold text-green-600">{timeTracking.length}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <h3 className="font-semibold text-sm">Moyenne/jour</h3>
                          <p className="text-2xl font-bold text-purple-600">
                            {timeTracking.length > 0 ? 
                              (timeTracking.reduce((sum, entry) => sum + entry.totalHours, 0) / timeTracking.length).toFixed(1) 
                              : '0'
                            }h
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Entrées de temps */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Entrées récentes</h3>
                    {timeTracking.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <h4 className="font-semibold">{entry.employeeName}</h4>
                              <p className="text-sm text-muted-foreground">
                                {entry.date} • {entry.startTime} - {entry.endTime}
                              </p>
                              <p className="text-xs text-muted-foreground">{entry.project}</p>
                              {entry.notes && (
                                <p className="text-xs text-muted-foreground italic">{entry.notes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold">{entry.totalHours}h</p>
                            {entry.overtime > 0 && (
                              <Badge variant="outline" className="text-orange-600">
                                +{entry.overtime}h sup.
                              </Badge>
                            )}
                            <p className="text-sm text-muted-foreground">Pause: {entry.breakTime}min</p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleEditTimeEntry(entry)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Interface de pointage rapide */}
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Pointage rapide</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Button size="lg" className="bg-green-600 hover:bg-green-700" onClick={() => handleClockIn()}>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Pointer l'arrivée
                        </Button>
                        <Button size="lg" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleClockOut()}>
                          <XCircle className="h-5 w-5 mr-2" />
                          Pointer le départ
                        </Button>
                      </div>
                      <div className="mt-4 grid gap-2 md:grid-cols-2">
                        <Button variant="outline" size="sm" onClick={() => handleBreak('lunch')}>
                          <Clock className="h-4 w-4 mr-2" />
                          Pause déjeuner
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleProjectChange()}>
                          <Target className="h-4 w-4 mr-2" />
                          Changement projet
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="onboarding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="text-green-500" />
                  Onboarding des Nouveaux Employés
                </CardTitle>
                <CardDescription>Processus d'intégration et formation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Étapes d'onboarding */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Processus d'intégration standard</h3>
                    {[
                      { step: 1, title: "Préparation du poste", status: "completed", description: "Configuration du matériel et des accès" },
                      { step: 2, title: "Accueil et présentation", status: "completed", description: "Tour des locaux et présentation de l'équipe" },
                      { step: 3, title: "Formation initiale", status: "in_progress", description: "Formation aux outils et procédures" },
                      { step: 4, title: "Affectation projet", status: "pending", description: "Intégration dans une équipe projet" },
                      { step: 5, title: "Suivi 30 jours", status: "pending", description: "Point d'évaluation après 1 mois" }
                    ].map((item) => (
                      <motion.div
                        key={item.step}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: item.step * 0.1 }}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                          item.status === 'completed' ? 'bg-green-500' :
                          item.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
                        }`}>
                          {item.status === 'completed' ? <CheckCircle className="h-4 w-4" /> : item.step}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Badge variant={item.status === 'completed' ? 'default' : item.status === 'in_progress' ? 'secondary' : 'outline'}>
                          {item.status === 'completed' ? 'Terminé' : item.status === 'in_progress' ? 'En cours' : 'En attente'}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>

                  {/* Nouveaux employés en cours d'onboarding */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Employés en cours d'intégration</h3>
                    {employees.filter(emp => 
                      new Date(emp.hireDate) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
                    ).map((employee) => {
                      const daysAgo = Math.floor((Date.now() - new Date(employee.hireDate).getTime()) / (1000 * 60 * 60 * 24));
                      const progress = Math.min((daysAgo / 30) * 100, 100);
                      
                      return (
                        <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-medium">{employee.firstName} {employee.lastName}</h4>
                              <p className="text-sm text-muted-foreground">
                                {employee.position} • Arrivé(e) il y a {daysAgo} jour{daysAgo > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right min-w-[100px]">
                              <div className="text-sm font-medium">{Math.round(progress)}% complété</div>
                              <Progress value={progress} className="w-20 h-2" />
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleViewOnboardingDetails(employee)}>
                              Voir détails
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="text-purple-500" />
                      Reporting RH
                    </CardTitle>
                    <CardDescription>Analyses et rapports des ressources humaines</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => handleExportReports()}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Métriques principales */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Taux de rotation</p>
                            <p className="text-2xl font-bold">{metrics.turnoverRate}%</p>
                          </div>
                          <TrendingDown className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Satisfaction</p>
                            <p className="text-2xl font-bold">87%</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Absentéisme</p>
                            <p className="text-2xl font-bold">3.2%</p>
                          </div>
                          <TrendingDown className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Formation</p>
                            <p className="text-2xl font-bold">24h</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Graphiques */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Évolution des effectifs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48 flex items-end justify-center gap-2">
                          {[12, 15, 18, 22, 25, 23, 26, 28, 24, 27, 29, 32].map((value, i) => (
                            <div key={i} className="flex flex-col items-center">
                              <div 
                                className="w-6 bg-blue-500 rounded-t" 
                                style={{ height: `${(value / 32) * 100}%` }}
                              />
                              <span className="text-xs mt-1">{i + 1}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Performance par département</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {['Technique', 'Commercial', 'Marketing'].map((dept) => {
                            const avgPerf = employees
                              .filter(emp => emp.department === dept)
                              .reduce((sum, emp) => sum + emp.performance, 0) / 
                              employees.filter(emp => emp.department === dept).length || 0;
                            
                            return (
                              <div key={dept} className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm font-medium">{dept}</span>
                                  <span className="text-sm">{avgPerf.toFixed(1)}/5</span>
                                </div>
                                <Progress value={(avgPerf / 5) * 100} className="h-2" />
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Intégration comptable */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Intégration Comptable</CardTitle>
                      <CardDescription>Liaison avec le système comptable</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Charges de personnel (641)</h4>
                            <p className="text-2xl font-bold text-blue-600">€{metrics.totalPayroll.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Salaires bruts mensuels</p>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Charges sociales (645)</h4>
                            <p className="text-2xl font-bold text-orange-600">€{(metrics.totalPayroll * 0.42).toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Cotisations patronales</p>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Notes de frais (625)</h4>
                            <p className="text-2xl font-bold text-green-600">€{metrics.totalExpenses.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">Frais remboursables</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline">
                            <Upload className="h-4 w-4 mr-2" />
                            Exporter vers comptabilité
                          </Button>
                          <Button variant="outline">
                            <Settings className="h-4 w-4 mr-2" />
                            Configurer comptes
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Fonctionnalités avancées - Organigramme, Performance, etc. */}
      {!showEmployeeForm && activeView === 'dashboard' && (
        <div className="grid gap-6 md:grid-cols-3 mt-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => toast({ title: "Gestion des contrats", description: "Interface à implémenter" })}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="text-purple-500" />
                Gestion des Contrats
              </CardTitle>
              <CardDescription>Suivi des contrats et renouvellements</CardDescription>
            </CardHeader>
            <CardContent className="h-[120px] flex items-center justify-center">
              <div className="text-center">
                <div className="flex gap-2 mb-2">
                  {employees.map((_, i) => (
                    <div key={i} className="w-3 h-8 bg-purple-500 rounded animate-pulse" style={{animationDelay: `${i * 0.2}s`}} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">Cliquez pour accéder</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => toast({ title: "Évaluations de performance", description: "Interface à implémenter" })}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="text-yellow-500" />
                Évaluations
              </CardTitle>
              <CardDescription>Suivi des performances et objectifs</CardDescription>
            </CardHeader>
            <CardContent className="h-[120px] flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-lg font-bold">4.5/5</p>
                <p className="text-sm text-muted-foreground">Performance moyenne</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => toast({ title: "Organigramme", description: "Interface à implémenter" })}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="text-green-500" />
                Organigramme
              </CardTitle>
              <CardDescription>Structure hiérarchique interactive</CardDescription>
            </CardHeader>
            <CardContent className="h-[120px] flex items-center justify-center">
              <div className="text-center">
                <div className="flex flex-col items-center gap-1 mb-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full" />
                  <div className="flex gap-2">
                    <div className="w-4 h-4 bg-green-400 rounded-full" />
                    <div className="w-4 h-4 bg-green-400 rounded-full" />
                    <div className="w-4 h-4 bg-green-400 rounded-full" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Vue d'ensemble</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de détail employé */}
      {selectedEmployee && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEmployee(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {selectedEmployee.firstName.charAt(0)}{selectedEmployee.lastName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
                    <p className="text-muted-foreground">{selectedEmployee.position} • {selectedEmployee.department}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedEmployee(null)}>
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations personnelles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedEmployee.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedEmployee.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedEmployee.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Embauche: {selectedEmployee.hireDate}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations professionnelles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Salaire:</span>
                      <span className="text-sm font-medium">€{selectedEmployee.salary.toLocaleString()}/mois</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Contrat:</span>
                      <span className="text-sm font-medium">{selectedEmployee.contractType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Performance:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`h-3 w-3 ${star <= selectedEmployee.performance ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                        <span className="text-sm ml-1">{selectedEmployee.performance}/5</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Compétences:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedEmployee.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Congés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Pris cette année:</span>
                        <span className="font-medium">{selectedEmployee.leaves.taken} jours</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Restants:</span>
                        <span className="font-medium text-green-600">{selectedEmployee.leaves.remaining} jours</span>
                      </div>
                      <Progress value={(selectedEmployee.leaves.taken / selectedEmployee.leaves.total) * 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Actions rapides</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier les informations
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Envoyer un message
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Voir l'historique
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}