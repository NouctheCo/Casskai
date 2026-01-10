/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toastError, toastSuccess } from '@/lib/toast-helpers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useProjects } from '@/hooks/useProjects';
import { 
  KanbanSquare, 
  PlusCircle, 
  Search, 
  CheckCircle2, 
  Clock,
  Users,
  DollarSign,
  Target,
  BarChart3,
  FileText,
  Timer,
  TrendingUp,
  Eye,
  Edit,
  PlayCircle,
  PauseCircle,
  Download,
  Activity,
  Briefcase,
  Calculator,
  XCircle,
  Star,
  Filter,
  Sparkles
} from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { motion } from 'framer-motion';
import { DatePicker } from '@/components/ui/date-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { projectTasksService, type ProjectTaskWithDetails } from '@/services/projectTasksService';
import { TaskFormModal } from '@/components/projects/TaskFormModal';
import NewClientModal from '@/components/projects/NewClientModal';
import { EmployeeFormModal } from '@/components/hr/EmployeeFormModal';
import { timesheetsService, type TimesheetWithDetails } from '@/services/timesheetsService';
import TimesheetFormModal from '@/components/projects/TimesheetFormModal';
import { projectResourcesService, type ProjectResourceWithDetails } from '@/services/projectResourcesService';
import ResourceAllocationModal from '@/components/projects/ResourceAllocationModal';
import type { Project } from '@/services/projectsService';
import { logger } from '@/lib/logger';
// Les données sont chargées depuis le service projectsService via useProjects hook
export default function ProjectsPage() {
  const { t } = useLocale();
  const { currentCompany } = useAuth();
  const navigate = useNavigate();
  // Hook pour la gestion des projets
  const {
    projects,
    tasks,
    timeEntries,
    metrics: _metrics,
    categories: _categories,
    managers: _managers,
    loading: _projectsLoading,
    error: _error,
    createProject,
    updateProject,
    deleteProject: _deleteProject,
    refreshAll: _refreshAll,
    activeProjects,
    completedProjects,
    totalBudget,
    totalRevenue,
    averageProgress
  } = useProjects();
  // State pour les resources (employees)
  const [resources, setResources] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [_loadingResources, setLoadingResources] = useState(false);
  // State pour les tâches
  const [allTasks, setAllTasks] = useState<ProjectTaskWithDetails[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  // State pour les timesheets
  const [allTimesheets, setAllTimesheets] = useState<TimesheetWithDetails[]>([]);
  const [timesheetsLoading, setTimesheetsLoading] = useState(false);
  const [timesheetFilter, setTimesheetFilter] = useState<string>('all');
  const [isTimesheetModalOpen, setIsTimesheetModalOpen] = useState(false);
  // State pour les ressources
  const [allResources, setAllResources] = useState<ProjectResourceWithDetails[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  // State pour les modales de création
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState(false);
  // Charger les employees et clients depuis Supabase
  useEffect(() => {
    const loadEmployeesAndClients = async () => {
      if (!currentCompany?.id) return;
      setLoadingResources(true);
      try {
        const [employeesResponse, clientsResponse] = await Promise.all([
          supabase
            .from('employees')
            .select('*')
            .eq('company_id', currentCompany.id)
            .eq('status', 'active'),
          supabase
            .from('tiers')
            .select('*')
            .eq('company_id', currentCompany.id)
            .eq('type', 'client')
        ]);
        if (employeesResponse.error) throw employeesResponse.error;
        if (clientsResponse.error) throw clientsResponse.error;
        // Transformer les employees en format resources
        const employeesAsResources = (employeesResponse.data || []).map(emp => ({
          id: emp.id,
          name: `${emp.first_name} ${emp.last_name}`,
          role: emp.position || 'Employee',
          email: emp.email,
          skills: emp.skills || [],
          availability: 80, // Valeur par défaut
          hourlyRate: emp.hourly_rate || 0,
          currentProjects: [], // À calculer depuis les time entries
          totalHours: 0, // À calculer
          billableHours: 0 // À calculer
        }));
        // Formater les clients
        const clientsFormatted = (clientsResponse.data || []).map(client => ({
          id: client.id,
          name: client.name || client.company_name || 'Client sans nom',
          email: client.email,
          siret: client.siret
        }));
        setResources(employeesAsResources);
        setClients(clientsFormatted);
      } catch (error) {
        logger.error('Projects', 'Error loading employees and clients:', error);
      } finally {
        setLoadingResources(false);
      }
    };
    loadEmployeesAndClients();
  }, [currentCompany?.id]);
  // Charger toutes les tâches
  const loadAllTasks = useCallback(async () => {
    if (!currentCompany?.id) return;
    setTasksLoading(true);
    try {
      const tasksData = await projectTasksService.getTasks(currentCompany.id, {
        status: taskFilter !== 'all' ? taskFilter : undefined
      });
      setAllTasks(tasksData);
    } catch (error) {
      logger.error('Projects', 'Error loading tasks:', error);
      // Don't show error toast - empty task list is normal for new projects
      setAllTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, [currentCompany?.id, taskFilter]);
  useEffect(() => {
    loadAllTasks();
  }, [loadAllTasks]);
  // Charger tous les timesheets
  const loadAllTimesheets = useCallback(async () => {
    if (!currentCompany?.id) return;
    setTimesheetsLoading(true);
    try {
      const timesheetsData = await timesheetsService.getTimesheets(currentCompany.id, {
        status: timesheetFilter !== 'all' ? timesheetFilter : undefined
      });
      setAllTimesheets(timesheetsData);
    } catch (error) {
      logger.error('Projects', 'Error loading timesheets:', error);
      // Don't show error toast - empty timesheet list is normal for new projects
      setAllTimesheets([]);
    } finally {
      setTimesheetsLoading(false);
    }
  }, [currentCompany?.id, timesheetFilter]);
  useEffect(() => {
    loadAllTimesheets();
  }, [loadAllTimesheets]);
  // Charger les ressources
  const loadAllResources = useCallback(async () => {
    if (!currentCompany?.id) return;
    setResourcesLoading(true);
    try {
      const resourcesData = await projectResourcesService.getResources(currentCompany.id);
      setAllResources(resourcesData);
    } catch (error) {
      logger.error('Projects', 'Error loading resources:', error);
      // Don't show error toast - empty resource list is normal for new projects
      setAllResources([]);
    } finally {
      setResourcesLoading(false);
    }
  }, [currentCompany?.id]);
  useEffect(() => {
    loadAllResources();
  }, [loadAllResources]);
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
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  // États pour le formulaire projet
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
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
      toastSuccess(t('projects.errors.requiredFields'));
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
        toastSuccess(t('projects.success.projectCreated'));
        setShowProjectForm(false);
      }
    } catch (error) {
      logger.error('Projects', 'Error creating project:', error instanceof Error ? error.message : String(error));
      toastSuccess(t('projects.errors.creatingProject'));
    }
  }, [projectName, projectClient, projectDescription, projectBudget, projectManager, projectStatus, startDate, endDate, createProject]);
  const handleTaskStatusChange = useCallback(async (taskId: string, newStatus: string) => {
    try {
      await projectTasksService.updateTaskStatus(taskId, newStatus as any);
      toastSuccess(t('projects.success.taskStatusChanged'));
      await loadAllTasks();
    } catch (_error) {
      toastError(t('projects.errors.updatingTask'));
    }
  }, [loadAllTasks]);
  const handleTimesheetCreated = useCallback(async () => {
    toastSuccess(t('projects.success.timesheetCreated'));
    await loadAllTimesheets();
  }, [loadAllTimesheets]);
  const handleResourceAllocated = useCallback(async () => {
    toastSuccess(t('projects.success.resourceAllocated'));
    await loadAllResources();
  }, [loadAllResources]);
  const handleTaskCreated = useCallback(async (_taskId: string) => {
    toastSuccess(t('projects.success.taskCreated'));
    await loadAllTasks();
    setIsTaskModalOpen(false);
  }, [loadAllTasks]);
  const _handleProjectStatusChange = useCallback(async (projectId: string, newStatus: string) => {
    try {
      const success = await updateProject(projectId, { status: newStatus as Project['status'] });
      if (success) {
        toastSuccess(t('projects.success.projectStatusChanged'));
      }
    } catch (_error) {
      toastSuccess(t('projects.errors.updatingProject'));
    }
  }, [updateProject]);
  // Métriques calculées provenant du hook
  const computedMetrics = useMemo(() => {
    // Calcul du respect des délais (projets terminés à temps)
    const projectsWithDates = completedProjects.filter(p => p.endDate);
    const projectsOnTime = projectsWithDates.filter(p => {
      if (!p.endDate) return false;
      const actualEndDate = new Date(p.updated_at || p.created_at);
      const plannedEndDate = new Date(p.endDate);
      return actualEndDate <= plannedEndDate;
    });
    const onTimeRate = projectsWithDates.length > 0 ? (projectsOnTime.length / projectsWithDates.length) * 100 : 0;
    // Calcul de l'efficacité équipe (heures facturables / heures totales)
    const totalBillableHours = projects.reduce((sum, p) => sum + (p.billableHours || 0), 0);
    const totalHours = projects.reduce((sum, p) => sum + (p.totalHours || 0), 0);
    const teamEfficiency = totalHours > 0 ? (totalBillableHours / totalHours) * 100 : 0;
    return {
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      completedProjects: completedProjects.length,
      onHoldProjects: projects.filter(p => p.status === 'on_hold').length,
      totalRevenue,
      totalBudget,
      totalSpent: projects.reduce((sum, project) => sum + (project.spent || 0), 0),
      averageProgress,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - projects.reduce((sum, p) => sum + (p.spent || 0), 0)) / totalRevenue) * 100 : 0,
      onTimeRate,
      teamEfficiency
    };
  }, [projects, activeProjects, completedProjects, totalRevenue, totalBudget, averageProgress]);
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
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
                <Select value={projectClient} onValueChange={(value) => {
                  if (value === '__new__') {
                    setIsNewClientModalOpen(true);
                  } else {
                    setProjectClient(value);
                  }
                }}>
                  <SelectTrigger id="projectClient">
                    <SelectValue placeholder={t('projectspage.slectionner_un_client', { defaultValue: 'Sélectionner un client' })} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__new__">
                      <div className="flex items-center text-blue-600 font-medium">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Créer un nouveau client
                      </div>
                    </SelectItem>
                    {clients.length > 0 && <div className="border-t my-1"></div>}
                    {clients.length === 0 ? (
                      <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                        Aucun client. Créez-en un depuis le module CRM ou ci-dessus.
                      </div>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.name}>
                          {client.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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
                <Select value={projectManager} onValueChange={(value) => {
                  if (value === '__new__') {
                    setIsNewEmployeeModalOpen(true);
                  } else {
                    setProjectManager(value);
                  }
                }}>
                  <SelectTrigger id="projectManager">
                    <SelectValue placeholder={t('projectspage.slectionner_un_responsable', { defaultValue: 'Sélectionner un responsable' })} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__new__">
                      <div className="flex items-center text-blue-600 font-medium">
                        <Users className="w-4 h-4 mr-2" />
                        Créer un nouvel employé
                      </div>
                    </SelectItem>
                    {resources.length > 0 && <div className="border-t my-1"></div>}
                    {resources.length === 0 ? (
                      <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                        Aucun employé. Créez-en un depuis le module RH ou ci-dessus.
                      </div>
                    ) : (
                      resources.map((resource) => (
                        <SelectItem key={resource.id} value={resource.name}>
                          {resource.name} - {resource.role}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="projectStatus" className="text-sm font-medium">{t('projectspage.statut', { defaultValue: 'Statut' })}</label>
                <select 
                  id="projectStatus" 
                  value={projectStatus}
                  onChange={(e) => setProjectStatus(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white dark:bg-gray-800 dark:bg-gray-900 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option>{t('projectspage.en_prparation', { defaultValue: 'En préparation' })}</option>
                  <option>{t('projectspage.en_cours', { defaultValue: t('projectspage.status.inProgress') })}</option>
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
            <TabsTrigger value="dashboard">{t("projectspage.tabs.dashboard")}</TabsTrigger>
            <TabsTrigger value="projects">{t("projectspage.tabs.projects")}</TabsTrigger>
            <TabsTrigger value="tasks">{t("projectspage.tabs.tasks")}</TabsTrigger>
            <TabsTrigger value="resources">{t("projectspage.tabs.resources")}</TabsTrigger>
            <TabsTrigger value="timeEntries">{t("projectspage.tabs.time")}</TabsTrigger>
            <TabsTrigger value="billing">{t("projectspage.tabs.billing")}</TabsTrigger>
            <TabsTrigger value="gantt">{t("projectspage.tabs.gantt")}</TabsTrigger>
            <TabsTrigger value="reports">{t("projectspage.tabs.reports")}</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="space-y-6">
            {/* Tableau de bord avec métriques */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{t("projectspage.metrics.totalProjects")}</span>
                  </div>
                  <div className="text-2xl font-bold">{computedMetrics.totalProjects}</div>
                  <p className="text-xs text-muted-foreground">{computedMetrics.activeProjects} actifs</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">{t("projectspage.metrics.revenue")}</span>
                  </div>
                  <div className="text-2xl font-bold">€{computedMetrics.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Marge: {computedMetrics.profitMargin.toFixed(1)}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">{t("projectspage.metrics.progress")}</span>
                  </div>
                  <div className="text-2xl font-bold">{computedMetrics.averageProgress.toFixed(0)}%</div>
                  <p className="text-xs text-muted-foreground">Moyenne projets</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Calculator className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">{t("projectspage.metrics.budgetUsed")}</span>
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
                      { status: t('projectspage.status.inProgress'), count: computedMetrics.activeProjects, color: 'bg-blue-500' },
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
                          {project.status === 'in_progress' ? t('projectspage.status.inProgress') :
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
                    <Button variant="outline" size="icon" aria-label="Filtrer les projets"><Filter className="h-4 w-4" aria-hidden="true" /></Button>
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
                            {project.status === 'in_progress' ? t('projectspage.status.inProgress') :
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
                  <Button onClick={() => setIsTaskModalOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Nouvelle tâche
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Filtres de tâches */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant={taskFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTaskFilter('all')}
                    >
                      Toutes
                    </Button>
                    <Button
                      variant={taskFilter === 'in_progress' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTaskFilter('in_progress')}
                    >
                      En cours
                    </Button>
                    <Button
                      variant={taskFilter === 'todo' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTaskFilter('todo')}
                    >
                      À faire
                    </Button>
                    <Button
                      variant={taskFilter === 'done' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTaskFilter('done')}
                    >
                      Terminées
                    </Button>
                  </div>
                  {/* Liste des tâches */}
                  {tasksLoading ? (
                    <div className="text-center py-8">Chargement des tâches...</div>
                  ) : allTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Aucune tâche à afficher</div>
                  ) : allTasks.map((task) => {
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
                            task.status === 'done' ? 'bg-green-500' :
                            task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-500'
                          }`}>
                            {task.status === 'done' ? <CheckCircle2 className="h-5 w-5" /> :
                             task.status === 'in_progress' ? <PlayCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                          </div>
                          <div>
                            <h3 className="font-semibold">{task.name}</h3>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{project?.name}</Badge>
                              <span className="text-xs text-muted-foreground">{task.assigned_to_name}</span>
                              <span className="text-xs text-muted-foreground">• {task.end_date}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <Progress value={task.progress} className="w-16 h-2" />
                            <span className="text-sm">{task.progress}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{task.estimated_hours || 0}h estimées</p>
                          <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'} className="text-xs mt-1">
                            {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTaskStatusChange(task.id, task.status === 'done' ? 'in_progress' : 'done')}
                          >
                            {task.status === 'done' ? <PauseCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
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
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="text-green-500" />
                      Allocation des Ressources
                    </CardTitle>
                    <CardDescription>Gestion de l'équipe et planification</CardDescription>
                  </div>
                  <Button onClick={() => setIsResourceModalOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Allouer une ressource
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {resourcesLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Chargement des ressources...</p>
                  </div>
                ) : allResources.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Aucune ressource allouée</p>
                    <p className="text-sm text-muted-foreground mt-2">Cliquez sur "Allouer une ressource" pour commencer</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allResources.map((resource) => (
                      <motion.div
                        key={resource.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {(resource.user_name || resource.user_email || 'U').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold">{resource.user_name || resource.user_email || 'Utilisateur'}</h3>
                            <p className="text-sm text-muted-foreground">{resource.role || 'Rôle non défini'}</p>
                            <p className="text-xs text-muted-foreground">{resource.user_email}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {resource.project_name || 'Projet inconnu'}
                              </Badge>
                              {resource.start_date && (
                                <Badge variant="outline" className="text-xs">
                                  Du {new Date(resource.start_date).toLocaleDateString('fr-FR')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">Allocation</span>
                            <Progress value={resource.allocation_percentage} className="w-20 h-2" />
                            <span className="text-sm">{resource.allocation_percentage}%</span>
                          </div>
                          {resource.hourly_rate && (
                            <p className="text-sm font-medium">€{resource.hourly_rate}/h</p>
                          )}
                          {resource.end_date && (
                            <p className="text-xs text-muted-foreground">
                              Fin: {new Date(resource.end_date).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="timeEntries" className="space-y-6">
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
                  <Button onClick={() => setIsTimesheetModalOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Nouvelle entrée
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filtres par statut */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    variant={timesheetFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimesheetFilter('all')}
                  >
                    Toutes
                  </Button>
                  <Button
                    variant={timesheetFilter === 'draft' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimesheetFilter('draft')}
                  >
                    Brouillon
                  </Button>
                  <Button
                    variant={timesheetFilter === 'submitted' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimesheetFilter('submitted')}
                  >
                    Soumises
                  </Button>
                  <Button
                    variant={timesheetFilter === 'approved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimesheetFilter('approved')}
                  >
                    Approuvées
                  </Button>
                  <Button
                    variant={timesheetFilter === 'rejected' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimesheetFilter('rejected')}
                  >
                    Rejetées
                  </Button>
                  <Button
                    variant={timesheetFilter === 'invoiced' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimesheetFilter('invoiced')}
                  >
                    Facturées
                  </Button>
                </div>
                <div className="space-y-4">
                  {timesheetsLoading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Chargement des timesheets...</p>
                    </div>
                  ) : allTimesheets.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Aucun timesheet à afficher</p>
                    </div>
                  ) : (
                    allTimesheets.map((timesheet) => {
                      // Obtenir le badge de statut
                      const getStatusBadge = (status: string) => {
                        switch (status) {
                          case 'approved':
                            return <Badge variant="default" className="bg-green-500">Approuvé</Badge>;
                          case 'rejected':
                            return <Badge variant="destructive">Rejeté</Badge>;
                          case 'submitted':
                            return <Badge variant="secondary">Soumis</Badge>;
                          case 'invoiced':
                            return <Badge variant="default" className="bg-blue-500">Facturé</Badge>;
                          case 'draft': default:
                            return <Badge variant="outline">Brouillon</Badge>;
                        }
                      };
                      return (
                        <motion.div
                          key={timesheet.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${
                              timesheet.status === 'approved' ? 'bg-green-500' :
                              timesheet.status === 'rejected' ? 'bg-red-500' :
                              timesheet.status === 'invoiced' ? 'bg-blue-500' :
                              'bg-orange-500'
                            }`}>
                              <Timer className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{timesheet.user_name || timesheet.user_email || 'Utilisateur'}</h3>
                              <p className="text-sm text-muted-foreground">{timesheet.description || 'Aucune description'}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {timesheet.project_name && (
                                  <Badge variant="outline" className="text-xs">{timesheet.project_name}</Badge>
                                )}
                                {timesheet.task_name && (
                                  <Badge variant="outline" className="text-xs">{timesheet.task_name}</Badge>
                                )}
                                {timesheet.is_billable && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Facturable</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{timesheet.hours}h</p>
                            <p className="text-sm text-muted-foreground">{new Date(timesheet.date).toLocaleDateString('fr-FR')}</p>
                            <p className="text-xs font-medium text-green-600">€{timesheet.amount.toFixed(2)}</p>
                          </div>
                          {getStatusBadge(timesheet.status)}
                        </motion.div>
                      );
                    })
                  )}
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
                  <Button onClick={() => navigate('/invoicing')}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Créer une facture
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
                            {timeEntries.reduce((sum, ts) => sum + (ts.billable ? ts.hours : 0), 0)}h
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
                            €{timeEntries.length > 0 ? (timeEntries.reduce((sum, ts) => sum + (ts.hourlyRate || 0), 0) / timeEntries.length).toFixed(0) : '0'}
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
                      const projectTimesheets = timeEntries.filter(ts => ts.project_id === project.id);
                      const _totalBillable = projectTimesheets.reduce((sum, ts) => sum + (ts.billable ? ts.hours : 0) * (ts.hourlyRate || 0), 0);
                      return (
                        <div key={project.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold">{project.name}</h4>
                              <p className="text-sm text-muted-foreground">{project.client}</p>
                            </div>
                            <Badge variant={project.status === 'completed' ? 'default' : 'outline'}>
                              {project.status === 'completed' ? 'Facturable' : t('projectspage.status.inProgress')}
                            </Badge>
                          </div>
                          <div className="grid gap-4 md:grid-cols-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Heures facturées</p>
                              <p className="font-semibold">{project.billableHours}h</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Revenus générés</p>
                              <p className="font-semibold text-green-600">€{(project.revenue ?? 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Marge bénéficiaire</p>
                              <p className={`font-semibold ${(project.profit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                €{(project.profit ?? 0).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Taux de marge</p>
                              <p className={`font-semibold ${(project.profit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {(project.revenue ?? 0) > 0 ? (((project.profit ?? 0) / (project.revenue ?? 1)) * 100).toFixed(1) : '0'}%
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
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="text-indigo-500" />
                      Diagramme de Gantt
                    </CardTitle>
                    <CardDescription>Planification visuelle des projets - {new Date().getFullYear()}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Aucun projet à afficher</p>
                    <p className="text-sm text-muted-foreground mt-2">Créez un projet pour visualiser le planning</p>
                  </div>
                ) : (
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
                          {projects
                            .filter(project => project.startDate && project.endDate)
                            .map((project) => {
                            const startMonth = new Date(project.startDate).getMonth();
                            const endMonth = new Date(project.endDate).getMonth();
                            const currentYear = new Date().getFullYear();
                            const projectStartYear = new Date(project.startDate).getFullYear();
                            const projectEndYear = new Date(project.endDate).getFullYear();
                            // Skip projects not in current year
                            if (projectStartYear > currentYear || projectEndYear < currentYear) {
                              return null;
                            }
                            return (
                              <div key={project.id} className="flex items-center gap-4">
                                <div className="w-48 text-sm font-medium truncate" title={project.name}>
                                  {project.name}
                                </div>
                                <div className="flex-1 grid grid-cols-12 gap-1">
                                  {Array.from({ length: 12 }, (_, i) => {
                                    const isInRange = i >= startMonth && i <= endMonth;
                                    const progressInMonth = isInRange ? project.progress : 0;
                                    return (
                                      <div key={i} className="h-6 bg-gray-100 rounded relative overflow-hidden dark:bg-gray-800/50">
                                        {isInRange && (
                                          <div
                                            className={`h-full rounded ${
                                              project.status === 'completed' ? 'bg-green-500' :
                                              project.status === 'in_progress' ? 'bg-blue-500' :
                                              project.status === 'on_hold' ? 'bg-orange-500' : 'bg-gray-400'
                                            }`}
                                            style={{ width: `${Math.min(100, progressInMonth)}%` }}
                                            title={`${project.name}: ${project.progress}%`}
                                          />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="w-16 text-xs text-right">
                                  <span className="font-medium">{project.progress}%</span>
                                  <br />
                                  <span className="text-muted-foreground text-[10px]">
                                    {new Date(project.startDate).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })} - {new Date(project.endDate).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                            );
                          }).filter(Boolean)}
                        </div>
                      </div>
                    </div>
                    {/* Légende */}
                    <div className="flex items-center gap-6 text-sm pt-4 border-t">
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
                )}
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
                            <p className="text-2xl font-bold">
                              {computedMetrics.completedProjects > 0 ? `${computedMetrics.onTimeRate.toFixed(0)}%` : 'N/A'}
                            </p>
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
                            <p className="text-2xl font-bold">
                              {projects.length > 0 ? `${computedMetrics.teamEfficiency.toFixed(0)}%` : 'N/A'}
                            </p>
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
                            <p className="text-2xl font-bold">
                              {projects.length > 0 ? 'N/A' : 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Données à venir</p>
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
                        <CardTitle className="text-lg">Évolution des revenus (6 derniers mois)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48 flex items-end justify-center gap-2">
                          {(() => {
                            // Calculer les revenus des 6 derniers mois
                            const now = new Date();
                            const monthsData = Array.from({ length: 6 }, (_, i) => {
                              const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
                              const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
                              const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
                              const revenue = projects
                                .filter(p => {
                                  if (!p.created_at) return false;
                                  const projectDate = new Date(p.created_at);
                                  return projectDate >= monthStart && projectDate <= monthEnd;
                                })
                                .reduce((sum, p) => sum + (p.revenue || 0), 0);
                              return {
                                month: monthDate.toLocaleDateString('fr-FR', { month: 'short' }),
                                revenue
                              };
                            });
                            const maxRevenue = Math.max(...monthsData.map(m => m.revenue), 1);
                            if (monthsData.every(m => m.revenue === 0)) {
                              return (
                                <div className="flex items-center justify-center h-full w-full text-muted-foreground text-sm">
                                  Aucune donnée de revenus disponible
                                </div>
                              );
                            }
                            return monthsData.map((data, i) => (
                              <div key={i} className="flex flex-col items-center">
                                <div
                                  className="w-8 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                                  style={{ height: `${data.revenue > 0 ? (data.revenue / maxRevenue) * 150 : 2}px` }}
                                />
                                <span className="text-xs mt-1">{data.month}</span>
                              </div>
                            ));
                          })()}
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
                            .reduce((acc: Array<{ client: string; revenue: number; projects: number }>, project) => {
                              const existing = acc.find(item => item.client === project.client);
                              if (existing) {
                                existing.revenue += (project.revenue || 0);
                                existing.projects += 1;
                              } else {
                                acc.push({ client: project.client, revenue: project.revenue || 0, projects: 1 });
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
                          const efficiency = (project.totalHours ?? 0) > 0 ? ((project.billableHours ?? 0) / (project.totalHours ?? 1)) * 100 : 0;
                          const budgetUsage = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
                          return (
                            <div key={project.id} className="p-4 border rounded-lg">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h4 className="font-semibold">{project.name}</h4>
                                  <p className="text-sm text-muted-foreground">{project.client} • {project.category}</p>
                                </div>
                                <Badge variant={project.status === 'completed' ? 'default' : 'outline'}>
                                  {project.status === 'completed' ? 'Terminé' : t('projectspage.status.inProgress')}
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
                                  <p className={`font-semibold ${(project.profit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {(project.revenue ?? 0) > 0 ? (((project.profit ?? 0) / (project.revenue ?? 1)) * 100).toFixed(1) : '0'}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Revenus</p>
                                  <p className="font-semibold text-green-600">€{(project.revenue ?? 0).toLocaleString()}</p>
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
            className="bg-white dark:bg-gray-800 dark:bg-gray-900 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
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
                        {selectedProject.status === 'in_progress' ? t('projectspage.status.inProgress') :
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
                      <span className="text-sm font-medium text-green-600">€{(selectedProject.revenue ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Profit:</span>
                      <span className={`text-sm font-medium ${(selectedProject.profit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        €{(selectedProject.profit ?? 0).toLocaleString()}
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
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold dark:bg-blue-900/20">
                          {selectedProject.manager.split(' ').map(n => n.charAt(0)).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{selectedProject.manager}</p>
                          <p className="text-xs text-muted-foreground">Chef de projet</p>
                        </div>
                      </div>
                      {selectedProject.team.map((member, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold dark:bg-gray-900/30">
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
      {/* New Client Modal */}
      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onSuccess={async (clientId) => {
          const { data } = await supabase.from('tiers').select('*').eq('company_id', currentCompany!.id).eq('type', 'client');
          const clientsFormatted = (data || []).map(client => ({
            id: client.id,
            name: client.name || client.company_name || 'Client sans nom',
            email: client.email,
            siret: client.siret
          }));
          setClients(clientsFormatted);
          const newClient = clientsFormatted.find(c => c.id === clientId);
          if (newClient) setProjectClient(newClient.name);
          toastSuccess('Client créé avec succès');
        }}
      />
      {/* New Employee Modal */}
      <EmployeeFormModal
        isOpen={isNewEmployeeModalOpen}
        onClose={() => setIsNewEmployeeModalOpen(false)}
        onSubmit={async (employeeData) => {
          try {
            const { data, error } = await supabase.from('employees').insert({
              ...employeeData,
              company_id: currentCompany!.id,
              status: 'active'
            }).select().single();
            if (error) throw error;
            const { data: employeesData } = await supabase.from('employees').select('*').eq('company_id', currentCompany!.id).eq('status', 'active');
            const employeesAsResources = (employeesData || []).map(emp => ({
              id: emp.id,
              name: `${emp.first_name} ${emp.last_name}`,
              role: emp.position || 'Employee',
              email: emp.email,
              skills: emp.skills || [],
              availability: 80,
              hourlyRate: emp.hourly_rate || 0,
              currentProjects: [],
              totalHours: 0,
              billableHours: 0
            }));
            setResources(employeesAsResources);
            if (data) setProjectManager(`${data.first_name} ${data.last_name}`);
            toastSuccess('Employé créé avec succès');
            return true;
          } catch (error) {
            logger.error('Projects', 'Error creating employee:', error);
            toastError('Erreur lors de la création de l\'employé');
            return false;
          }
        }}
      />
      {/* Task Modal */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={async (taskData: any) => {
          try {
            const task = await projectTasksService.createTask({
              project_id: taskData.project_id,
              name: taskData.title,
              description: taskData.description,
              start_date: taskData.startDate ? taskData.startDate.toISOString().split('T')[0] : undefined,
              end_date: taskData.dueDate ? taskData.dueDate.toISOString().split('T')[0] : undefined,
              estimated_hours: taskData.estimatedHours ? parseFloat(taskData.estimatedHours) : undefined,
              status: taskData.status || 'todo',
              priority: taskData.priority || 'medium',
              progress: taskData.progress || 0,
              assigned_to: taskData.assignee || undefined
            });
            await handleTaskCreated(task.id);
          } catch (error) {
            logger.error('Projects', 'Error creating task:', error);
            toastError(t('projects.errors.creatingTask'));
            throw error;
          }
        }}
        projects={projects.map(p => ({ id: p.id, name: p.name }))}
        employees={resources.map(r => ({ id: r.id, name: r.name }))}
      />
      {/* Timesheet Modal */}
      <TimesheetFormModal
        isOpen={isTimesheetModalOpen}
        onClose={() => setIsTimesheetModalOpen(false)}
        onSuccess={handleTimesheetCreated}
        projects={projects.map(p => ({ id: p.id, name: p.name }))}
      />
      {/* Resource Allocation Modal */}
      <ResourceAllocationModal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        onSuccess={handleResourceAllocated}
        projects={projects.map(p => ({ id: p.id, name: p.name }))}
        users={resources.map(r => ({ id: r.id, email: r.email, name: r.full_name }))}
      />
    </motion.div>
  );
}