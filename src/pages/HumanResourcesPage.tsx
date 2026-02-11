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

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useHR } from '@/hooks/useHR';
import { useHRPayroll } from '@/hooks/useHRPayroll';
import { useAuth } from '@/contexts/AuthContext';
import { toastError, toastSuccess } from '@/lib/toast-helpers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BetaBadge } from '@/components/ui/BetaBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmployeeFormModal } from '@/components/hr/EmployeeFormModal';
import { LeaveFormModal } from '@/components/hr/LeaveFormModal';
import { ExpenseFormModal } from '@/components/hr/ExpenseFormModal';
import { DocumentsManagementTab } from '@/components/hr/DocumentsManagementTab';
import { DocumentUploadModal } from '@/components/hr/DocumentUploadModal';
import { ObjectivesTab } from '@/components/hr/ObjectivesTab';
import { PerformanceReviewsTab } from '@/components/hr/PerformanceReviewsTab';
import { FeedbackTab } from '@/components/hr/FeedbackTab';
import { TrainingTab } from '@/components/hr/TrainingTab';
import { HRAnalyticsDashboard } from '@/components/hr/HRAnalyticsDashboard';
import { DocumentTemplatesTab } from '@/components/hr/DocumentTemplatesTab';
import { DocumentGenerationTab } from '@/components/hr/DocumentGenerationTab';
import { DocumentArchiveTab } from '@/components/hr/DocumentArchiveTab';
import { hrDocumentsService } from '@/services/hrDocumentsService';
import {
  Users, Plus,
  UserPlus,
  Calendar,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Target,
  CheckCircle,
  XCircle,
  Download,
  FileText,
  MessageSquare,
  ClipboardCheck,
  GraduationCap,
  BarChart3,
  FileSignature,
  Archive,
  FilePlus,
  Pencil
} from 'lucide-react';
import type { Employee, Leave, Expense } from '@/services/hrService';
import { ComponentErrorBoundary } from '@/components/ComponentErrorBoundary';

export default function HumanResourcesPage() {
  const { t } = useTranslation();
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
    metricsLoading: _metricsLoading,
    error,
    fetchEmployees: _fetchEmployees,
    fetchLeaves: _fetchLeaves,
    fetchExpenses: _fetchExpenses,
    fetchMetrics: _fetchMetrics,
    refreshAll,
    createEmployee,
    updateEmployee,
    createLeave,
    updateLeave,
    createExpense,
    updateExpense
  } = useHR();

  // Use payroll and export hook
  const {
    exportEmployeesToCSV,
    exportEmployeesToExcel,
    exportLeavesToCSV,
    exportExpensesToCSV,
    exportTimeEntriesToCSV: _exportTimeEntriesToCSV
  } = useHRPayroll({
    employees,
    leaves,
    expenses,
    timeEntries
  });

  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  // Modal states
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  // Selected entities for editing
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

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

  // Handler for document upload
  const handleDocumentUpload = async (formData: any) => {
    if (!currentCompany?.id) return false;

    const response = await hrDocumentsService.uploadDocument(
      currentCompany.id,
      currentCompany.owner_id ?? '',
      formData
    );

    if (response.success) {
      toastSuccess(t('hr.page.documentUploadSuccess'));
      return true;
    } else {
      toastError(response.error || t('hr.page.documentUploadError'));
      return false;
    }
  };

  // Show error if no company
  if (!currentCompany) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('hr.page.noCompanySelected')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <ComponentErrorBoundary componentName="HumanResourcesPage">
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
            {t('hr.title')}
            <BetaBadge variant="secondary" />
          </h1>
          <p className="text-muted-foreground">
            {t('hr.page.subtitle')}
            <Badge variant="outline" className="ml-2 text-xs">
              {t('common.inDevelopment', 'En développement')}
            </Badge>
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
            {t('common.refresh')}
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            <Sparkles className="w-3 h-3 mr-1" />
            {t('hr.page.integratedSupabase')}
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
                <CardTitle className="text-sm font-medium">{t('hr.kpi.employees')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.total_employees}</div>
                <p className="text-xs text-muted-foreground">
                  {t('hr.kpi.activeCount', { count: metrics.active_employees })}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('hr.kpi.newHires')}</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.new_hires_this_month}</div>
                <p className="text-xs text-muted-foreground">
                  {t('hr.kpi.thisMonth')}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('hr.kpi.pendingLeaves')}</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.pending_leaves}</div>
                <p className="text-xs text-muted-foreground">
                  {t('hr.kpi.approvedCount', { count: metrics.approved_leaves })}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('hr.kpi.pendingExpenses')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.pending_expenses}</div>
                <p className="text-xs text-muted-foreground">
                  {t('hr.kpi.totalAmount', { amount: (metrics.total_expense_amount || 0).toLocaleString() })}
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
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden lg:inline">{t('hr.tabs.analytics')}</span>
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden lg:inline">{t('hr.tabs.employees')}</span>
            </TabsTrigger>
            <TabsTrigger value="objectives" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden lg:inline">{t('hr.tabs.objectives')}</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              <span className="hidden lg:inline">{t('hr.tabs.reviews')}</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden lg:inline">{t('hr.tabs.feedback')}</span>
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden lg:inline">{t('hr.tabs.training')}</span>
            </TabsTrigger>
            <TabsTrigger value="leaves" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden lg:inline">{t('hr.tabs.leaves')}</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden lg:inline">{t('hr.tabs.expenses')}</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden lg:inline">{t('hr.tabs.documents')}</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileSignature className="w-4 h-4" />
              <span className="hidden lg:inline">{t('hr.tabs.templates')}</span>
            </TabsTrigger>
            <TabsTrigger value="generation" className="flex items-center gap-2">
              <FilePlus className="w-4 h-4" />
              <span className="hidden lg:inline">{t('hr.tabs.generation')}</span>
            </TabsTrigger>
            <TabsTrigger value="archives" className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              <span className="hidden lg:inline">{t('hr.tabs.archives')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <motion.div variants={itemVariants}>
              {currentCompany?.id && (
                <HRAnalyticsDashboard
                  companyId={currentCompany.id}
                  employees={employees}
                />
              )}
            </motion.div>
          </TabsContent>

          {/* Objectifs Tab */}
          <TabsContent value="objectives">
            {currentCompany?.id && (
              <ObjectivesTab
                companyId={currentCompany.id}
                employees={employees}
                currentUserId={currentCompany.owner_id || ''}
              />
            )}
          </TabsContent>

          {/* Performance Reviews Tab */}
          <TabsContent value="reviews">
            {currentCompany?.id && (
              <PerformanceReviewsTab
                companyId={currentCompany.id}
                employees={employees}
                currentUserId={currentCompany.owner_id || ''}
              />
            )}
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback">
            {currentCompany?.id && (
              <FeedbackTab
                companyId={currentCompany.id}
                employees={employees}
                currentUserId={currentCompany.owner_id || ''}
              />
            )}
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training">
            {currentCompany?.id && (
              <TrainingTab
                companyId={currentCompany.id}
                employees={employees}
                currentUserId={currentCompany.owner_id || ''}
              />
            )}
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t('hr.employeesSection.title')}</CardTitle>
                      <CardDescription>
                        {employeesLoading ? t('common.loading') : t('hr.employeesSection.countLabel', { count: employees.length })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {employees.length > 0 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={exportEmployeesToCSV}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            CSV
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={exportEmployeesToExcel}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Excel
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        onClick={() => setShowEmployeeModal(true)}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        {t('hr.employeesSection.add')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {employeesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>{t('hr.employeesSection.loading')}</span>
                      </div>
                    </div>
                  ) : employees.length > 0 ? (
                    <div className="space-y-4">
                      {employees.map((employee) => (
                        <div
                          key={employee.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowEmployeeModal(true);
                          }}
                        >
                          <div className="space-y-1">
                            <p className="font-medium">{employee.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {employee.position} • {employee.department}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEmployee(employee);
                                setShowEmployeeModal(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                              {employee.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">{t('hr.employeesSection.empty')}</h3>
                          <p className="text-sm text-muted-foreground">
                            {t('hr.employeesSection.emptyDescription')}
                          </p>
                        </div>
                        <Button onClick={() => setShowEmployeeModal(true)}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          {t('hr.employeesSection.addEmployee')}
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t('hr.leavesSection.title')}</CardTitle>
                      <CardDescription>
                        {leavesLoading ? t('common.loading') : t('hr.leavesSection.countLabel', { count: leaves.length })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {leaves.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportLeavesToCSV}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {t('hr.leavesSection.exportCsv')}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => setShowLeaveModal(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('hr.leavesSection.newRequest')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {leavesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>{t('hr.leavesSection.loading')}</span>
                      </div>
                    </div>
                  ) : leaves.length > 0 ? (
                    <div className="space-y-4">
                      {leaves.map((leave) => (
                        <div
                          key={leave.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedLeave(leave);
                            setShowLeaveModal(true);
                          }}
                        >
                          <div className="space-y-1">
                            <p className="font-medium">{leave.employee_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {leave.leave_type} • {t('hr.leavesSection.days', { count: leave.days_count })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t('hr.leavesSection.dateRange', { start: new Date(leave.start_date).toLocaleDateString(), end: new Date(leave.end_date).toLocaleDateString() })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLeave(leave);
                                setShowLeaveModal(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
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
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <Calendar className="w-12 h-12 mx-auto text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">{t('hr.leavesSection.empty')}</h3>
                          <p className="text-sm text-muted-foreground">
                            {t('hr.leavesSection.emptyDescription')}
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t('hr.expensesSection.title')}</CardTitle>
                      <CardDescription>
                        {expensesLoading ? t('common.loading') : t('hr.expensesSection.countLabel', { count: expenses.length })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {expenses.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportExpensesToCSV}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {t('hr.expensesSection.exportCsv')}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => setShowExpenseModal(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('hr.expensesSection.newExpense')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {expensesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>{t('hr.expensesSection.loading')}</span>
                      </div>
                    </div>
                  ) : expenses.length > 0 ? (
                    <div className="space-y-4">
                      {expenses.map((expense) => (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedExpense(expense);
                            setShowExpenseModal(true);
                          }}
                        >
                          <div className="space-y-1">
                            <p className="font-medium">{expense.employee_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {expense.category} • {expense.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(expense.expense_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedExpense(expense);
                                setShowExpenseModal(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
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
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <DollarSign className="w-12 h-12 mx-auto text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">{t('hr.expensesSection.empty')}</h3>
                          <p className="text-sm text-muted-foreground">
                            {t('hr.expensesSection.emptyDescription')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            {currentCompany?.id && (
              <DocumentsManagementTab
                companyId={currentCompany.id}
                currentUserId={currentCompany.owner_id || ''}
                employees={employees}
              />
            )}
          </TabsContent>

          {/* Document Templates Tab */}
          <TabsContent value="templates">
            {currentCompany?.id && (
              <DocumentTemplatesTab companyId={currentCompany.id} />
            )}
          </TabsContent>

          {/* Document Generation Tab */}
          <TabsContent value="generation">
            {currentCompany?.id && (
              <DocumentGenerationTab
                companyId={currentCompany.id}
                employees={employees}
              />
            )}
          </TabsContent>

          {/* Document Archive Tab */}
          <TabsContent value="archives">
            {currentCompany?.id && (
              <DocumentArchiveTab companyId={currentCompany.id} />
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
      </div>

      {/* Real Form Modals */}
      <EmployeeFormModal
        isOpen={showEmployeeModal}
        onClose={() => {
          setShowEmployeeModal(false);
          setSelectedEmployee(null);
        }}
        onSubmit={async (data) => {
          if (selectedEmployee) {
            return updateEmployee(selectedEmployee.id, data);
          }
          return createEmployee(data);
        }}
        employee={selectedEmployee}
      />

      <LeaveFormModal
        isOpen={showLeaveModal}
        onClose={() => {
          setShowLeaveModal(false);
          setSelectedLeave(null);
        }}
        onSubmit={async (data) => {
          if (selectedLeave) {
            return updateLeave(selectedLeave.id, data as any);
          }
          return createLeave(data);
        }}
        employees={employees}
        leave={selectedLeave}
      />

      <ExpenseFormModal
        isOpen={showExpenseModal}
        onClose={() => {
          setShowExpenseModal(false);
          setSelectedExpense(null);
        }}
        onSubmit={async (data) => {
          if (selectedExpense) {
            return updateExpense(selectedExpense.id, data as any);
          }
          return createExpense(data);
        }}
        employees={employees}
        expense={selectedExpense}
      />

      <DocumentUploadModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onSubmit={handleDocumentUpload}
        employees={employees}
      />
    </ComponentErrorBoundary>
  );
}
