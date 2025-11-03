import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useProjects } from '@/hooks/useProjects';
import { 
  KanbanSquare, 
  PlusCircle, 
  Search, 
  ListFilter, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Users,
  Calendar,
  DollarSign,
  Target,
  BarChart3,
  FileText,
  Timer,
  MessageSquare,
  Zap,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  Trash2,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Download,
  Upload,
  Settings,
  Award,
  Activity,
  Briefcase,
  Calculator,
  XCircle,
  ChevronRight,
  Star,
  MapPin,
  Phone,
  Mail,
  Building,
  Filter,
  MoreHorizontal,
  Sparkles
} from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Données mock pour les projets
const mockProjects = [
  {
    id: '1',
    name: 'Refonte Site Web E-commerce',
    description: 'Modernisation complète du site e-commerce avec nouvelle UX/UI',
    client: 'TechCorp Solutions',
    status: 'in_progress',
    priority: 'high',
    startDate: '2024-02-01',
    endDate: '2024-04-15',
    budget: 45000,
    spent: 28500,
    progress: 65,
    manager: 'Marie Dubois',
    team: ['Pierre Martin', 'Sophie Bernard', 'Alex Chen'],
    category: 'Développement',
    lastActivity: '2024-03-15T14:30:00',
    totalHours: 380,
    billableHours: 350,
    hourlyRate: 85,
    revenue: 29750,
    profit: 1250
  },
  {
    id: '2',
    name: 'Application Mobile Banking',
    description: 'Développement d\'une application mobile pour services bancaires',
    client: 'BankSecure',
    status: 'planning',
    priority: 'high',
    startDate: '2024-03-20',
    endDate: '2024-08-30',
    budget: 85000,
    spent: 5200,
    progress: 15,
    manager: 'Pierre Martin',
    team: ['Marie Dubois', 'Lucas Moreau', 'Emma Leroy'],
    category: 'Mobile',
    lastActivity: '2024-03-14T16:45:00',
    totalHours: 85,
    billableHours: 80,
    hourlyRate: 95,
    revenue: 7600,
    profit: 2400
  },
  {
    id: '3',
    name: 'Audit Sécurité Infrastructure',
    description: 'Audit complet de la sécurité informatique et recommandations',
    client: 'MegaCorp Industries',
    status: 'completed',
    priority: 'medium',
    startDate: '2024-01-10',
    endDate: '2024-02-28',
    budget: 25000,
    spent: 24800,
    progress: 100,
    manager: 'Sophie Bernard',
    team: ['Thomas Roux', 'Julie Blanc'],
    category: 'Conseil',
    lastActivity: '2024-02-28T17:00:00',
    totalHours: 320,
    billableHours: 315,
    hourlyRate: 75,
    revenue: 23625,
    profit: -1175
  },
  {
    id: '4',
    name: 'Formation Équipe DevOps',
    description: 'Programme de formation sur les pratiques DevOps et CI/CD',
    client: 'InnovateTech',
    status: 'on_hold',
    priority: 'low',
    startDate: '2024-04-01',
    endDate: '2024-05-15',
    budget: 15000,
    spent: 2100,
    progress: 25,
    manager: 'Alex Chen',
    team: ['Marie Dubois', 'Pierre Martin'],
    category: 'Formation',
    lastActivity: '2024-03-12T11:20:00',
    totalHours: 45,
    billableHours: 40,
    hourlyRate: 65,
    revenue: 2600,
    profit: 500
  }
];

// Données mock pour les tâches
const mockTasks = [
  {
    id: '1',
    project_id: '1',
    title: 'Maquettage interface utilisateur',
    description: 'Création des maquettes haute fidélité pour toutes les pages',
    status: 'completed',
    priority: 'high',
    assignee: 'Sophie Bernard',
    estimatedHours: 40,
    actualHours: 38,
    startDate: '2024-02-01',
    dueDate: '2024-02-15',
    completedDate: '2024-02-14',
    progress: 100,
    tags: ['Design', 'UX/UI'],
    dependencies: [],
    comments: 12
  },
  {
    id: '2',
    project_id: '1',
    title: 'Développement API REST',
    description: 'Implémentation des endpoints API pour le backend',
    status: 'in_progress',
    priority: 'high',
    assignee: 'Pierre Martin',
    estimatedHours: 80,
    actualHours: 52,
    startDate: '2024-02-16',
    dueDate: '2024-03-20',
    completedDate: null,
    progress: 75,
    tags: ['Backend', 'API'],
    dependencies: ['1'],
    comments: 8
  },
  {
    id: '3',
    project_id: '1',
    title: 'Intégration paiement sécurisé',
    description: 'Mise en place du système de paiement avec Stripe',
    status: 'todo',
    priority: 'medium',
    assignee: 'Alex Chen',
    estimatedHours: 25,
    actualHours: 0,
    startDate: '2024-03-21',
    dueDate: '2024-04-05',
    completedDate: null,
    progress: 0,
    tags: ['Paiement', 'Sécurité'],
    dependencies: ['2'],
    comments: 3
  },
  {
    id: '4',
    project_id: '2',
    title: 'Analyse des besoins',
    description: 'Recueil et analyse des exigences fonctionnelles',
    status: 'completed',
    priority: 'high',
    assignee: 'Marie Dubois',
    estimatedHours: 30,
    actualHours: 32,
    startDate: '2024-02-20',
    dueDate: '2024-03-05',
    completedDate: '2024-03-04',
    progress: 100,
    tags: ['Analyse', 'Spécifications'],
    dependencies: [],
    comments: 15
  },
  {
    id: '5',
    project_id: '2',
    title: 'Architecture technique',
    description: 'Définition de l\'architecture technique de l\'application',
    status: 'in_progress',
    priority: 'high',
    assignee: 'Lucas Moreau',
    estimatedHours: 45,
    actualHours: 20,
    startDate: '2024-03-06',
    dueDate: '2024-03-25',
    completedDate: null,
    progress: 45,
    tags: ['Architecture', 'Technique'],
    dependencies: ['4'],
    comments: 6
  }
];

// Données mock pour les timesheets
const mockTimesheets = [
  {
    id: '1',
    project_id: '1',
    task_id: '2',
    user_id: 'user-pierre',
    user_name: 'Pierre Martin',
    date: '2024-03-15',
    hours: 7.5,
    billable: true,
    billableHours: 7.5,
    description: 'Développement endpoints API utilisateurs et produits',
    task: 'Développement API REST',
    hourlyRate: 85,
    approved: true
  },
  {
    id: '2',
    project_id: '1',
    task_id: '1',
    user_id: 'user-sophie',
    user_name: 'Sophie Bernard',
    date: '2024-03-14',
    hours: 7,
    billable: true,
    billableHours: 7,
    description: 'Finalisation maquettes et préparation livrables',
    task: 'Maquettage interface utilisateur',
    hourlyRate: 75,
    approved: true
  },
  {
    id: '3',
    project_id: '2',
    task_id: '5',
    user_id: 'user-lucas',
    user_name: 'Lucas Moreau',
    date: '2024-03-15',
    hours: 7,
    billable: true,
    billableHours: 6.5,
    description: 'Conception architecture microservices',
    task: 'Architecture technique',
    hourlyRate: 90,
    approved: false
  }
];

// Données mock pour les ressources
const mockResources = [
  {
    id: '1',
    name: 'Marie Dubois',
    role: 'Chef de Projet',
    email: 'marie.dubois@casskai.com',
    hourlyRate: 85,
    availability: 85, // pourcentage
    skills: ['Gestion de projet', 'Agile', 'Scrum'],
    currentProjects: ['1', '2'],
    totalHours: 160,
    billableHours: 152
  },
  {
    id: '2',
    name: 'Pierre Martin',
    role: 'Développeur Senior',
    email: 'pierre.martin@casskai.com',
    hourlyRate: 85,
    availability: 95,
    skills: ['React', 'Node.js', 'TypeScript'],
    currentProjects: ['1', '4'],
    totalHours: 168,
    billableHours: 165
  },
  {
    id: '3',
    name: 'Sophie Bernard',
    role: 'Designer UX/UI',
    email: 'sophie.bernard@casskai.com',
    hourlyRate: 75,
    availability: 75,
    skills: ['Figma', 'Adobe Suite', 'Prototypage'],
    currentProjects: ['1', '3'],
    totalHours: 140,
    billableHours: 138
  }
];

// Métriques des projets
const mockProjectMetrics = {
  totalProjects: 4,
  activeProjects: 2,
  completedProjects: 1,
  onHoldProjects: 1,
  totalRevenue: 63575,
  totalBudget: 170000,
  totalSpent: 60600,
  profitMargin: 4.7,
  averageProgress: 51.25,
  overdueProjects: 0
};

export default function ProjectsPage() {
  const { t } = useLocale();
  const { toast } = useToast();

  // Hook pour la gestion des projets
  const {
    projects,
    tasks,
    timeEntries,
    metrics,
    categories,
    managers,
    loading: projectsLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refreshAll,
    activeProjects,
    completedProjects,
    totalBudget,
    totalRevenue,
    averageProgress
  } = useProjects();

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

  // Mock des resources temporaire pour éviter l'erreur
  const resources = [
    {
      id: '1',
      name: 'Marie Dubois',
      role: 'Chef de Projet',
      email: 'marie.dubois@casskai.app',
      skills: ['Project Management', 'Agile', 'Scrum'],
      availability: 85,
      hourlyRate: 75,
      currentProjects: ['1', '2'], // Projets actifs
      totalHours: 160,
      billableHours: 152
    },
    {
      id: '2',
      name: 'Pierre Martin',
      role: 'Développeur Full Stack',
      email: 'pierre.martin@casskai.app',
      skills: ['React', 'Node.js', 'TypeScript'],
      availability: 92,
      hourlyRate: 65,
      currentProjects: ['1'], // Projets actifs
      totalHours: 168,
      billableHours: 165
    },
    {
      id: '3',
      name: 'Sophie Bernard',
      role: 'Designer UX/UI',
      email: 'sophie.bernard@casskai.app',
      skills: ['Figma', 'Adobe XD', 'User Research'],
      availability: 78,
      hourlyRate: 60,
      currentProjects: ['1', '3'], // Projets actifs
      totalHours: 140,
      billableHours: 138
    }
  ];

  // Mock des timesheets temporaire pour éviter l'erreur
  const timesheets = [
    {
      id: '1',
      project_id: '1',
      task_id: '1',
      user_id: 'user-1',
      user_name: 'Marie Dubois',
      date: '2024-03-15',
      hours: 8,
      billable: true,
      billableHours: 8,
      hourlyRate: 75,
      description: 'Développement front-end',
      task: 'UI Implementation',
      approved: true
    },
    {
      id: '2',
      project_id: '1',
      task_id: '2',
      user_id: 'user-2',
      user_name: 'Pierre Martin',
      date: '2024-03-15',
      hours: 7.5,
      billable: true,
      billableHours: 7.5,
      hourlyRate: 65,
      description: 'API Development',
      task: 'Backend Integration',
      approved: true
    },
    {
      id: '3',
      project_id: '2',
      task_id: '3',
      user_id: 'user-3',
      user_name: 'Sophie Bernard',
      date: '2024-03-14',
      hours: 6,
      billable: true,
      billableHours: 6,
      hourlyRate: 60,
      description: 'Design System',
      task: 'UX Research',
      approved: false
    }
  ];

  const [activeView, setActiveView] = useState('dashboard');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // États pour le formulaire projet
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [projectClient, setProjectClient] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectBudget, setProjectBudget] = useState('');
  const [projectManager, setProjectManager] = useState('');
  const [projectStatus, setProjectStatus] = useState('planning');

  // Gestionnaires d'événements
  const handleNewProject = () => {
    setShowProjectForm(true);
  };

  const handleBackToList = () => {
    setShowProjectForm(false);
  };

  const handleSubmitProject = useCallback(async () => {
    if (!projectName.trim() || !projectClient.trim() || !projectBudget) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires"
      });
      return;
    }

    try {
      const projectData = {
        name: projectName.trim(),
        description: projectDescription.trim(),
        client: projectClient.trim(),
        status: projectStatus as 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
        startDate: startDate ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: endDate ? endDate.toISOString().split('T')[0] : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        budget: parseFloat(projectBudget),
        spent: 0,
        progress: 0,
        manager: projectManager.trim() || 'Non assigné',
        team: [],
        category: 'Général',
        lastActivity: new Date().toISOString(),
        totalHours: 0,
        billableHours: 0,
        hourlyRate: 75,
        revenue: 0
      };

      const success = await createProject(projectData);

      if (success) {
        // Réinitialiser le formulaire
        setProjectName('');
        setProjectClient('');
        setProjectDescription('');
        setProjectBudget('');
        setProjectManager('');
        setProjectStatus('planning');
        setStartDate(null);
        setEndDate(null);

        toast({
          title: "Succès",
          description: "Projet créé avec succès"
        });
        setShowProjectForm(false);
      }
    } catch (error) {
      console.error('Error creating project:', error instanceof Error ? error.message : String(error));
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer le projet"
      });
    }
  }, [projectName, projectClient, projectDescription, projectBudget, projectManager, projectStatus, startDate, endDate, toast, createProject]);

  const handleTaskStatusChange = useCallback(async (taskId, newStatus) => {
    try {
      // Cette fonction sera implémentée dans le hook plus tard
      toast({
        title: "Information",
        description: "Fonction de mise à jour des tâches à implémenter"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche"
      });
    }
  }, [toast]);

  const handleProjectStatusChange = useCallback(async (projectId, newStatus) => {
    try {
      const success = await updateProject(projectId, { status: newStatus });

      if (success) {
        toast({
          title: "Projet mis à jour",
          description: "Le statut du projet a été modifié"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le projet"
      });
    }
  }, [toast, updateProject]);

  // Métriques calculées provenant du hook
  const computedMetrics = useMemo(() => ({
    totalProjects: projects.length,
    activeProjects: activeProjects.length,
    completedProjects: completedProjects.length,
    onHoldProjects: projects.filter(p => p.status === 'on_hold').length,
    totalRevenue,
    totalBudget,
    totalSpent: projects.reduce((sum, project) => sum + (project.spent || 0), 0),
    averageProgress,
    profitMargin: totalRevenue > 0 ? ((totalRevenue - projects.reduce((sum, p) => sum + (p.spent || 0), 0)) / totalRevenue) * 100 : 0
  }), [projects, activeProjects, completedProjects, totalRevenue, totalBudget, averageProgress]);

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
              {t('projects')}
            </h1>
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-gray-600 dark:text-gray-400">
              {t('projectspage.suivez_vos_projets_internes_et_clients', { defaultValue: 'Suivez vos projets internes et clients.' })}
            </p>
            <Badge variant="secondary" className="text-xs">
              En temps réel
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={handleNewProject}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              {t('projectspage.nouveau_projet', { defaultValue: 'Nouveau Projet' })}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {showProjectForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('projectspage.nouveau_projet', { defaultValue: 'Nouveau Projet' })}</CardTitle>
            <CardDescription>{t('projectspage.crez_un_nouveau_projet', { defaultValue: 'Créez un nouveau projet' })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="projectName" className="text-sm font-medium">{t('projectspage.nom_du_projet', { defaultValue: 'Nom du projet' })}</label>
                <Input 
                  id="projectName" 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder={t('projectspage.refonte_site_web_client_abc', { defaultValue: 'Refonte site web client ABC' })} 
                />
              </div>
              <div>
                <label htmlFor="projectClient" className="text-sm font-medium">{t('projectspage.client', { defaultValue: 'Client' })}</label>
                <Input 
                  id="projectClient" 
                  value={projectClient}
                  onChange={(e) => setProjectClient(e.target.value)}
                  placeholder={t('projectspage.slectionner_un_client', { defaultValue: 'Sélectionner un client' })} 
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="projectDescription" className="text-sm font-medium">{t('projectspage.description', { defaultValue: 'Description' })}</label>
              <textarea
                id="projectDescription"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                rows={3}
                placeholder={`${t('projectspage.description', { defaultValue: 'Description' })  } détaillée du projet`}
              ></textarea>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="projectStartDate" className="text-sm font-medium">{t('projectspage.date_de_dbut', { defaultValue: 'Date de début' })}</label>
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder={t('projectspage.slectionnez_une_date', { defaultValue: 'Sélectionnez une date' })}
                  className=""
                />
              </div>
              <div>
                <label htmlFor="projectEndDate" className="text-sm font-medium">{t('projectspage.date_de_fin_prvue', { defaultValue: 'Date de fin prévue' })}</label>
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  placeholder={t('projectspage.slectionnez_une_date', { defaultValue: 'Sélectionnez une date' })}
                  className=""
                />
              </div>
              <div>
                <label htmlFor="projectBudget" className="text-sm font-medium">{t('projectspage.budget_', { defaultValue: 'Budget (€)' })}</label>
                <Input 
                  id="projectBudget" 
                  value={projectBudget}
                  onChange={(e) => setProjectBudget(e.target.value)}
                  placeholder="25000" 
                  type="number" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="projectManager" className="text-sm font-medium">{t('projectspage.chef_de_projet', { defaultValue: 'Chef de projet' })}</label>
                <Input 
                  id="projectManager" 
                  value={projectManager}
                  onChange={(e) => setProjectManager(e.target.value)}
                  placeholder={t('projectspage.slectionner_un_responsable', { defaultValue: 'Sélectionner un responsable' })} 
                />
              </div>
              <div>
                <label htmlFor="projectStatus" className="text-sm font-medium">{t('projectspage.statut', { defaultValue: 'Statut' })}</label>
                <select 
                  id="projectStatus" 
                  value={projectStatus}
                  onChange={(e) => setProjectStatus(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white dark:bg-gray-900 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option>{t('projectspage.en_prparation', { defaultValue: 'En préparation' })}</option>
                  <option>{t('projectspage.en_cours', { defaultValue: 'En cours' })}</option>
                  <option>{t('projectspage.en_pause', { defaultValue: 'En pause' })}</option>
                  <option>{t('projectspage.termin', { defaultValue: 'Terminé' })}</option>
                  <option>{t('projectspage.annul', { defaultValue: 'Annulé' })}</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleBackToList} variant="outline">{t('projectspage.annuler', { defaultValue: 'Annuler' })}</Button>
              <Button onClick={handleSubmitProject}>{t('projectspage.crer_le_projet', { defaultValue: 'Créer le projet' })}</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
            <TabsTrigger value="projects">Projets</TabsTrigger>
            <TabsTrigger value="tasks">Tâches</TabsTrigger>
            <TabsTrigger value="resources">Ressources</TabsTrigger>
            <TabsTrigger value="timesheets">Temps</TabsTrigger>
            <TabsTrigger value="billing">Facturation</TabsTrigger>
            <TabsTrigger value="gantt">Gantt</TabsTrigger>
            <TabsTrigger value="reports">Rapports</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Tableau de bord avec métriques */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Projets total</span>
                  </div>
                  <div className="text-2xl font-bold">{computedMetrics.totalProjects}</div>
                  <p className="text-xs text-muted-foreground">{computedMetrics.activeProjects} actifs</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Revenus</span>
                  </div>
                  <div className="text-2xl font-bold">€{computedMetrics.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Marge: {computedMetrics.profitMargin.toFixed(1)}%</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Progression</span>
                  </div>
                  <div className="text-2xl font-bold">{computedMetrics.averageProgress.toFixed(0)}%</div>
                  <p className="text-xs text-muted-foreground">Moyenne projets</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Calculator className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Budget utilisé</span>
                  </div>
                  <div className="text-2xl font-bold">{((computedMetrics.totalSpent / computedMetrics.totalBudget) * 100).toFixed(0)}%</div>
                  <p className="text-xs text-muted-foreground">€{computedMetrics.totalSpent.toLocaleString()} / €{computedMetrics.totalBudget.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Graphiques et projets récents */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Projets par statut</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { status: 'En cours', count: computedMetrics.activeProjects, color: 'bg-blue-500' },
                      { status: 'Terminés', count: computedMetrics.completedProjects, color: 'bg-green-500' },
                      { status: 'En pause', count: computedMetrics.onHoldProjects, color: 'bg-orange-500' },
                      { status: 'Planifiés', count: projects.filter(p => p.status === 'planning').length, color: 'bg-gray-500' }
                    ].map((item) => {
                      const percentage = computedMetrics.totalProjects > 0 ? (item.count / computedMetrics.totalProjects) * 100 : 0;
                      return (
                        <div key={item.status} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.status}</span>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                            <Progress value={percentage} className="w-20 h-2" />
                            <span className="text-sm text-muted-foreground">{item.count}</span>
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
                    {(projects || []).slice(0, 4).map((project) => (
                      <div key={project.id} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          project.status === 'in_progress' ? 'bg-blue-500' :
                          project.status === 'completed' ? 'bg-green-500' :
                          project.status === 'on_hold' ? 'bg-orange-500' : 'bg-gray-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{project.name}</p>
                          <p className="text-xs text-muted-foreground">{project.client} • {project.progress}%</p>
                        </div>
                        <Badge variant={project.status === 'in_progress' ? 'default' : project.status === 'completed' ? 'secondary' : 'outline'}>
                          {project.status === 'in_progress' ? 'En cours' :
                           project.status === 'completed' ? 'Terminé' :
                           project.status === 'on_hold' ? 'Pause' : 'Planifié'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tâches prioritaires */}
            <Card>
              <CardHeader>
                <CardTitle>Tâches prioritaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.filter(task => task.priority === 'high' && task.status !== 'completed').slice(0, 5).map((task) => {
                    const project = projects.find(p => p.id === task.project_id);
                    return (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                            task.status === 'in_progress' ? 'bg-blue-500' :
                            task.status === 'todo' ? 'bg-gray-500' : 'bg-green-500'
                          }`}>
                            {task.status === 'in_progress' ? <PlayCircle className="h-4 w-4" /> :
                             task.status === 'todo' ? <Clock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                          </div>
                          <div>
                            <h4 className="font-medium">{task.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {project?.name} • {task.assignee} • {task.dueDate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={task.progress} className="w-16 h-2" />
                          <span className="text-sm text-muted-foreground">{task.progress}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div>
                    <CardTitle>Liste des Projets</CardTitle>
                    <CardDescription>Gestion de tous vos projets</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-auto">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="search" placeholder="Rechercher projet..." className="pl-8 w-full md:w-[250px]" />
                    </div>
                    <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {projects.length > 0 ? (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedProject(project)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold ${
                            project.status === 'in_progress' ? 'bg-blue-500' :
                            project.status === 'completed' ? 'bg-green-500' :
                            project.status === 'on_hold' ? 'bg-orange-500' : 'bg-gray-500'
                          }`}>
                            <Briefcase className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{project.name}</h3>
                            <p className="text-sm text-muted-foreground">{project.client} • {project.category}</p>
                            <p className="text-xs text-muted-foreground">Chef de projet: {project.manager}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <Progress value={project.progress} className="w-20 h-2" />
                            <span className="text-sm font-medium">{project.progress}%</span>
                          </div>
                          <p className="text-sm font-medium">€{project.budget.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Budget total</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={project.status === 'in_progress' ? 'default' : project.status === 'completed' ? 'secondary' : 'outline'}>
                            {project.status === 'in_progress' ? 'En cours' :
                             project.status === 'completed' ? 'Terminé' :
                             project.status === 'on_hold' ? 'Pause' : 'Planifié'}
                          </Badge>
                          <Badge variant={project.priority === 'high' ? 'destructive' : project.priority === 'medium' ? 'secondary' : 'outline'}>
                            {project.priority === 'high' ? 'Haute' : project.priority === 'medium' ? 'Moyenne' : 'Basse'}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <KanbanSquare className="mx-auto h-16 w-16 text-primary/50" />
                    <p className="mt-4 text-lg text-muted-foreground">Aucun projet pour le moment</p>
                    <p className="text-sm text-muted-foreground mb-4">Commencez par créer votre premier projet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="text-blue-500" />
                      Gestion des Tâches
                    </CardTitle>
                    <CardDescription>Vue d'ensemble de toutes les tâches</CardDescription>
                  </div>
                  <Button onClick={() => toast({ title: "Nouvelle tâche", description: "Interface à implémenter" })}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Nouvelle tâche
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Filtres de tâches */}
                  <div className="flex gap-2 mb-4">
                    <Button variant="outline" size="sm">Toutes</Button>
                    <Button variant="outline" size="sm">En cours</Button>
                    <Button variant="outline" size="sm">À faire</Button>
                    <Button variant="outline" size="sm">Terminées</Button>
                  </div>

                  {/* Liste des tâches */}
                  {tasks.map((task) => {
                    const project = projects.find(p => p.id === task.project_id);
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${
                            task.status === 'completed' ? 'bg-green-500' :
                            task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-500'
                          }`}>
                            {task.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> :
                             task.status === 'in_progress' ? <PlayCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                          </div>
                          <div>
                            <h3 className="font-semibold">{task.title}</h3>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{project?.name}</Badge>
                              <span className="text-xs text-muted-foreground">{task.assignee}</span>
                              <span className="text-xs text-muted-foreground">• {task.dueDate}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <Progress value={task.progress} className="w-16 h-2" />
                            <span className="text-sm">{task.progress}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{task.actualHours}h / {task.estimatedHours}h</p>
                          <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'} className="text-xs mt-1">
                            {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleTaskStatusChange(task.id, task.status === 'completed' ? 'in_progress' : 'completed')}
                          >
                            {task.status === 'completed' ? <PauseCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="text-green-500" />
                  Allocation des Ressources
                </CardTitle>
                <CardDescription>Gestion de l'équipe et planification</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resources.map((resource) => (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {resource.name.split(' ').map(n => n.charAt(0)).join('')}
                        </div>
                        <div>
                          <h3 className="font-semibold">{resource.name}</h3>
                          <p className="text-sm text-muted-foreground">{resource.role}</p>
                          <p className="text-xs text-muted-foreground">{resource.email}</p>
                          <div className="flex gap-1 mt-1">
                            {resource.skills.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">Disponibilité</span>
                          <Progress value={resource.availability} className="w-20 h-2" />
                          <span className="text-sm">{resource.availability}%</span>
                        </div>
                        <p className="text-sm font-medium">€{resource.hourlyRate}/h</p>
                        <p className="text-xs text-muted-foreground">{resource.billableHours}h facturable</p>
                        <p className="text-xs text-muted-foreground">{resource.currentProjects.length} projet(s)</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timesheets" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Timer className="text-orange-500" />
                      Suivi des Temps
                    </CardTitle>
                    <CardDescription>Timesheets et suivi des heures</CardDescription>
                  </div>
                  <Button onClick={() => toast({ title: "Nouvelle entrée", description: "Interface à implémenter" })}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Nouvelle entrée
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timesheets.map((timesheet) => {
                    const project = projects.find(p => p.id === timesheet.project_id);
                    const task = tasks.find(t => t.id === timesheet.task_id);
                    return (
                      <motion.div
                        key={timesheet.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${
                            timesheet.approved ? 'bg-green-500' : 'bg-orange-500'
                          }`}>
                            <Timer className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{timesheet.user_name}</h3>
                            <p className="text-sm text-muted-foreground">{timesheet.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{project?.name}</Badge>
                              <Badge variant="outline" className="text-xs">{task?.title}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{timesheet.hours}h</p>
                          <p className="text-sm text-muted-foreground">{timesheet.date}</p>
                          <p className="text-xs font-medium text-green-600">€{((timesheet.hourlyRate || 0) * timesheet.hours).toFixed(2)}</p>
                        </div>
                        <Badge variant={timesheet.approved ? 'default' : 'secondary'}>
                          {timesheet.approved ? 'Approuvé' : 'En attente'}
                        </Badge>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="text-purple-500" />
                      Facturation par Projet
                    </CardTitle>
                    <CardDescription>Gestion des factures et revenus</CardDescription>
                  </div>
                  <Button onClick={() => toast({ title: "Nouvelle facture", description: "Interface à implémenter" })}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Générer facture
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Résumé financier */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <h3 className="font-semibold">Revenus totaux</h3>
                          <p className="text-2xl font-bold text-green-600">€{computedMetrics.totalRevenue.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Facturable</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <h3 className="font-semibold">Heures facturables</h3>
                          <p className="text-2xl font-bold text-blue-600">
                            {timesheets.reduce((sum, ts) => sum + ts.billableHours, 0)}h
                          </p>
                          <p className="text-sm text-muted-foreground">Ce mois</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <h3 className="font-semibold">Taux moyen</h3>
                          <p className="text-2xl font-bold text-purple-600">
                            €{(timesheets.reduce((sum, ts) => sum + ts.hourlyRate, 0) / timesheets.length).toFixed(0)}
                          </p>
                          <p className="text-sm text-muted-foreground">Par heure</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Détail par projet */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Facturation par projet</h3>
                    {projects.map((project) => {
                      const projectTimesheets = timesheets.filter(ts => ts.project_id === project.id);
                      const totalBillable = projectTimesheets.reduce((sum, ts) => sum + ts.billableHours * ts.hourlyRate, 0);
                      return (
                        <div key={project.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold">{project.name}</h4>
                              <p className="text-sm text-muted-foreground">{project.client}</p>
                            </div>
                            <Badge variant={project.status === 'completed' ? 'default' : 'outline'}>
                              {project.status === 'completed' ? 'Facturable' : 'En cours'}
                            </Badge>
                          </div>
                          
                          <div className="grid gap-4 md:grid-cols-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Heures facturées</p>
                              <p className="font-semibold">{project.billableHours}h</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Revenus générés</p>
                              <p className="font-semibold text-green-600">€{project.revenue.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Marge bénéficiaire</p>
                              <p className={`font-semibold ${project.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                €{project.profit.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Taux de marge</p>
                              <p className={`font-semibold ${project.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {project.revenue > 0 ? ((project.profit / project.revenue) * 100).toFixed(1) : '0'}%
                              </p>
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
          <TabsContent value="gantt" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="text-indigo-500" />
                  Diagramme de Gantt
                </CardTitle>
                <CardDescription>Planification visuelle des projets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Ligne de temps */}
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      {/* En-tête avec dates */}
                      <div className="grid grid-cols-12 gap-1 mb-4 text-xs text-center font-medium">
                        {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((month, i) => (
                          <div key={i} className="p-2 bg-muted rounded">{month}</div>
                        ))}
                      </div>
                      
                      {/* Barres de progression pour chaque projet */}
                      <div className="space-y-3">
                        {projects.map((project, index) => {
                          const startMonth = new Date(project.startDate).getMonth();
                          const endMonth = new Date(project.endDate).getMonth();
                          const duration = Math.max(1, endMonth - startMonth + 1);
                          
                          return (
                            <div key={project.id} className="flex items-center gap-4">
                              <div className="w-48 text-sm font-medium truncate">{project.name}</div>
                              <div className="flex-1 grid grid-cols-12 gap-1">
                                {Array.from({ length: 12 }, (_, i) => {
                                  const isInRange = i >= startMonth && i <= endMonth;
                                  const progressInMonth = isInRange ? project.progress : 0;
                                  
                                  return (
                                    <div key={i} className="h-6 bg-gray-100 rounded relative overflow-hidden">
                                      {isInRange && (
                                        <div 
                                          className={`h-full rounded ${
                                            project.status === 'completed' ? 'bg-green-500' :
                                            project.status === 'in_progress' ? 'bg-blue-500' :
                                            project.status === 'on_hold' ? 'bg-orange-500' : 'bg-gray-400'
                                          }`}
                                          style={{ width: `${Math.min(100, progressInMonth)}%` }}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="w-12 text-xs text-muted-foreground">{project.progress}%</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Légende */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded" />
                      <span>En cours</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded" />
                      <span>Terminé</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-500 rounded" />
                      <span>En pause</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-400 rounded" />
                      <span>Planifié</span>
                    </div>
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
                      <Activity className="text-green-500" />
                      Rapports de Performance
                    </CardTitle>
                    <CardDescription>Analyses et statistiques des projets</CardDescription>
                  </div>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Métriques de performance */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Rentabilité moyenne</p>
                            <p className="text-2xl font-bold">{computedMetrics.profitMargin.toFixed(1)}%</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Respect des délais</p>
                            <p className="text-2xl font-bold">87%</p>
                          </div>
                          <Target className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Efficacité équipe</p>
                            <p className="text-2xl font-bold">92%</p>
                          </div>
                          <Users className="h-8 w-8 text-purple-500" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Satisfaction client</p>
                            <p className="text-2xl font-bold">4.8/5</p>
                          </div>
                          <Star className="h-8 w-8 text-yellow-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Graphiques de performance */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Évolution des revenus</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48 flex items-end justify-center gap-2">
                          {[12000, 18000, 15000, 25000, 30000, 28000].map((value, i) => (
                            <div key={i} className="flex flex-col items-center">
                              <div 
                                className="w-8 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t" 
                                style={{ height: `${(value / 35000) * 150}px` }}
                              />
                              <span className="text-xs mt-1">M{i + 1}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Répartition par client</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {projects
                            .reduce((acc, project) => {
                              const existing = acc.find(item => item.client === project.client);
                              if (existing) {
                                existing.revenue += project.revenue;
                                existing.projects += 1;
                              } else {
                                acc.push({ client: project.client, revenue: project.revenue, projects: 1 });
                              }
                              return acc;
                            }, [])
                            .sort((a, b) => b.revenue - a.revenue)
                            .map((client) => {
                              const percentage = (client.revenue / computedMetrics.totalRevenue) * 100;
                              return (
                                <div key={client.client} className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm font-medium">{client.client}</span>
                                    <span className="text-sm">€{client.revenue.toLocaleString()}</span>
                                  </div>
                                  <Progress value={percentage} className="h-2" />
                                  <p className="text-xs text-muted-foreground">{client.projects} projet(s) • {percentage.toFixed(1)}%</p>
                                </div>
                              );
                            })
                          }
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Analyse détaillée par projet */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Performance détaillée</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {projects.map((project) => {
                          const efficiency = project.totalHours > 0 ? (project.billableHours / project.totalHours) * 100 : 0;
                          const budgetUsage = (project.spent / project.budget) * 100;
                          
                          return (
                            <div key={project.id} className="p-4 border rounded-lg">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h4 className="font-semibold">{project.name}</h4>
                                  <p className="text-sm text-muted-foreground">{project.client} • {project.category}</p>
                                </div>
                                <Badge variant={project.status === 'completed' ? 'default' : 'outline'}>
                                  {project.status === 'completed' ? 'Terminé' : 'En cours'}
                                </Badge>
                              </div>
                              
                              <div className="grid gap-4 md:grid-cols-5">
                                <div>
                                  <p className="text-sm text-muted-foreground">Progression</p>
                                  <p className="font-semibold">{project.progress}%</p>
                                  <Progress value={project.progress} className="w-full h-1 mt-1" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Budget utilisé</p>
                                  <p className="font-semibold">{budgetUsage.toFixed(0)}%</p>
                                  <Progress value={budgetUsage} className="w-full h-1 mt-1" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Efficacité</p>
                                  <p className="font-semibold">{efficiency.toFixed(0)}%</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Rentabilité</p>
                                  <p className={`font-semibold ${project.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {project.revenue > 0 ? ((project.profit / project.revenue) * 100).toFixed(1) : '0'}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Revenus</p>
                                  <p className="font-semibold text-green-600">€{project.revenue.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Modal de détail projet */}
      {selectedProject && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedProject(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl ${
                    selectedProject.status === 'in_progress' ? 'bg-blue-500' :
                    selectedProject.status === 'completed' ? 'bg-green-500' :
                    selectedProject.status === 'on_hold' ? 'bg-orange-500' : 'bg-gray-500'
                  }`}>
                    <Briefcase className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedProject.name}</h2>
                    <p className="text-muted-foreground">{selectedProject.client} • {selectedProject.category}</p>
                    <p className="text-sm text-muted-foreground">Chef de projet: {selectedProject.manager}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedProject(null)}>
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations générales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Description:</span>
                      <span className="text-sm max-w-[200px] text-right">{selectedProject.description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Date de début:</span>
                      <span className="text-sm">{selectedProject.startDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Date de fin:</span>
                      <span className="text-sm">{selectedProject.endDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Priorité:</span>
                      <Badge variant={selectedProject.priority === 'high' ? 'destructive' : selectedProject.priority === 'medium' ? 'secondary' : 'outline'}>
                        {selectedProject.priority === 'high' ? 'Haute' : selectedProject.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Statut:</span>
                      <Badge variant={selectedProject.status === 'in_progress' ? 'default' : selectedProject.status === 'completed' ? 'secondary' : 'outline'}>
                        {selectedProject.status === 'in_progress' ? 'En cours' :
                         selectedProject.status === 'completed' ? 'Terminé' :
                         selectedProject.status === 'on_hold' ? 'Pause' : 'Planifié'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Budget et finances</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Budget total:</span>
                      <span className="text-sm font-medium">€{selectedProject.budget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Dépensé:</span>
                      <span className="text-sm font-medium">€{selectedProject.spent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Revenus:</span>
                      <span className="text-sm font-medium text-green-600">€{selectedProject.revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Profit:</span>
                      <span className={`text-sm font-medium ${selectedProject.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        €{selectedProject.profit.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Progression:</span>
                        <span className="text-sm">{selectedProject.progress}%</span>
                      </div>
                      <Progress value={selectedProject.progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Équipe</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {selectedProject.manager.split(' ').map(n => n.charAt(0)).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{selectedProject.manager}</p>
                          <p className="text-xs text-muted-foreground">Chef de projet</p>
                        </div>
                      </div>
                      {selectedProject.team.map((member, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {member.split(' ').map(n => n.charAt(0)).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{member}</p>
                            <p className="text-xs text-muted-foreground">Équipier</p>
                          </div>
                        </div>
                      ))}
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
                      Modifier le projet
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Gérer l'équipe
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Générer facture
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Rapport détaillé
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