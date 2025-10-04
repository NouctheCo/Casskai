import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useHR } from '@/hooks/useHR';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  UserPlus,
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Award,
  Target,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function HumanResourcesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { currentCompany } = useAuth();

  // Use the new HR hook
  const {
    employees,
    leaves,
    expenses,
    timeEntries,
    metrics,
    loading,
    employeesLoading,
    leavesLoading,
    expensesLoading,
    metricsLoading,
    error,
    fetchEmployees,
    fetchLeaves,
    fetchExpenses,
    fetchMetrics,
    refreshAll
  } = useHR();

  // State management
  const [activeTab, setActiveTab] = useState('dashboard');

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

  // Show error if no company
  if (!currentCompany) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Aucune entreprise sélectionnée. Veuillez sélectionner une entreprise pour accéder aux RH.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600" />
            Ressources Humaines
          </h1>
          <p className="text-muted-foreground">
            Gérez vos employés, congés, frais et temps de travail
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            <Sparkles className="w-3 h-3 mr-1" />
            Intégré Supabase
          </Badge>
        </div>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Metrics Cards */}
      {metrics && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Employés</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.total_employees}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.active_employees} actifs
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nouvelles Embauches</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.new_hires_this_month}</div>
                <p className="text-xs text-muted-foreground">
                  Ce mois-ci
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Congés en Attente</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.pending_leaves}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.approved_leaves} approuvés
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Frais en Attente</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.pending_expenses}</div>
                <p className="text-xs text-muted-foreground">
                  {(metrics.total_expense_amount || 0).toLocaleString()} € total
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Employés ({employees.length})
            </TabsTrigger>
            <TabsTrigger value="leaves" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Congés ({leaves.length})
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Frais ({expenses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <motion.div variants={itemVariants}>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Departments Distribution */}
                {metrics?.departments && metrics.departments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Répartition par Département</CardTitle>
                      <CardDescription>
                        Distribution des employés par département
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {metrics.departments.map((dept, index) => (
                        <div key={dept.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{dept.name}</span>
                            <span className="text-sm text-muted-foreground">{dept.count}</span>
                          </div>
                          <Progress
                            value={(dept.count / metrics.total_employees) * 100}
                            className="h-2"
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Statistiques Rapides</CardTitle>
                    <CardDescription>
                      Aperçu des métriques RH importantes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Salaire moyen</span>
                      </div>
                      <span className="text-sm font-medium">
                        {(metrics?.average_salary || 0).toLocaleString()} €
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Taux de rotation</span>
                      </div>
                      <span className="text-sm font-medium">
                        {metrics?.turnover_rate || 0}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Employés actifs</span>
                      </div>
                      <span className="text-sm font-medium">
                        {metrics?.active_employees || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Gestion des Employés</CardTitle>
                  <CardDescription>
                    {employeesLoading ? 'Chargement...' : `${employees.length} employés`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {employeesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Chargement des employés...</span>
                      </div>
                    </div>
                  ) : employees.length > 0 ? (
                    <div className="space-y-4">
                      {employees.slice(0, 5).map((employee) => (
                        <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <p className="font-medium">{employee.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {employee.position} • {employee.department}
                            </p>
                          </div>
                          <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                            {employee.status}
                          </Badge>
                        </div>
                      ))}

                      {employees.length > 5 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Et {employees.length - 5} autres employés...
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">Aucun employé</h3>
                          <p className="text-sm text-muted-foreground">
                            Commencez par ajouter vos premiers employés
                          </p>
                        </div>
                        <Button>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Ajouter un Employé
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="leaves" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Gestion des Congés</CardTitle>
                  <CardDescription>
                    {leavesLoading ? 'Chargement...' : `${leaves.length} demandes de congés`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {leavesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Chargement des congés...</span>
                      </div>
                    </div>
                  ) : leaves.length > 0 ? (
                    <div className="space-y-4">
                      {leaves.slice(0, 5).map((leave) => (
                        <div key={leave.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <p className="font-medium">{leave.employee_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {leave.type} • {leave.days_count} jours
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Du {new Date(leave.start_date).toLocaleDateString()} au {new Date(leave.end_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant={
                              leave.status === 'approved' ? 'default' :
                              leave.status === 'pending' ? 'secondary' :
                              'destructive'
                            }
                          >
                            {leave.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {leave.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                            {leave.status}
                          </Badge>
                        </div>
                      ))}

                      {leaves.length > 5 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Et {leaves.length - 5} autres demandes...
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <Calendar className="w-12 h-12 mx-auto text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">Aucune demande de congés</h3>
                          <p className="text-sm text-muted-foreground">
                            Les demandes de congés apparaîtront ici
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Gestion des Frais</CardTitle>
                  <CardDescription>
                    {expensesLoading ? 'Chargement...' : `${expenses.length} notes de frais`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {expensesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Chargement des frais...</span>
                      </div>
                    </div>
                  ) : expenses.length > 0 ? (
                    <div className="space-y-4">
                      {expenses.slice(0, 5).map((expense) => (
                        <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <p className="font-medium">{expense.employee_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {expense.category} • {expense.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(expense.expense_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{expense.amount} {expense.currency}</p>
                            <Badge
                              variant={
                                expense.status === 'approved' ? 'default' :
                                expense.status === 'pending' ? 'secondary' :
                                expense.status === 'reimbursed' ? 'outline' :
                                'destructive'
                              }
                            >
                              {expense.status}
                            </Badge>
                          </div>
                        </div>
                      ))}

                      {expenses.length > 5 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Et {expenses.length - 5} autres frais...
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <DollarSign className="w-12 h-12 mx-auto text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">Aucune note de frais</h3>
                          <p className="text-sm text-muted-foreground">
                            Les notes de frais apparaîtront ici
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}