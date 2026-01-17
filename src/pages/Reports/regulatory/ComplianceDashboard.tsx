/**
 * CassKai - Compliance Dashboard
 * Real-time compliance monitoring and filing deadlines
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUpcomingDeadlines,
  getDocumentStatistics,
  getFilingStatusSummary,
  checkCompliance,
} from '@/services/regulatory/complianceService';
import type {
  UpcomingDeadline,
  DocumentStatistics,
} from '@/types/regulatory';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  FileText,
} from 'lucide-react';
interface ComplianceAlert {
  type: 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
}
export default function ComplianceDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<DocumentStatistics | null>(null);
  const [filingStatus, setFilingStatus] = useState<any>(null);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  useEffect(() => {
    loadComplianceData();
  }, []);
  const loadComplianceData = async () => {
    try {
      setLoading(true);
      // Get company ID from current user
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_company_id')
        .eq('id', user?.id)
        .single();
      if (!profile?.current_company_id) {
        setAlerts([
          {
            type: 'error',
            message: 'No company selected',
            timestamp: new Date().toISOString(),
          },
        ]);
        return;
      }
      const companyId = profile.current_company_id;
      // Load all compliance data in parallel
      const [stats, filing, deadlines, complianceCheck] = await Promise.all([
        getDocumentStatistics(companyId),
        getFilingStatusSummary(companyId),
        getUpcomingDeadlines(companyId, 90),
        checkCompliance(companyId),
      ]);
      setStatistics(stats);
      setFilingStatus(filing);
      setUpcomingDeadlines(deadlines);
      // Determine risk level based on filings
      if (filing.overdue > 0) {
        setRiskLevel('high');
      } else if (deadlines.filter((d) => d.daysUntilDeadline <= 7).length > 0) {
        setRiskLevel('medium');
      } else {
        setRiskLevel('low');
      }
      // Set alerts from compliance check
      const newAlerts: ComplianceAlert[] = [];
      if (complianceCheck.violations.length === 0) {
        newAlerts.push({
          type: 'success',
          message: '✅ All compliance requirements are met',
          timestamp: new Date().toISOString(),
        });
      } else {
        for (const violation of complianceCheck.violations) {
          newAlerts.push({
            type: violation.severity === 'critical' ? 'error' : 'warning',
            message: violation.description,
            timestamp: new Date().toISOString(),
          });
        }
      }
      setAlerts(newAlerts);
    } catch (error) {
      logger.error('ComplianceDashboard', 'Error loading compliance data:', error);
      setAlerts([
        {
          type: 'error',
          message: 'Error loading compliance data',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  // ========== RENDER COMPONENTS ==========
  const RiskBadge = ({ level }: { level: 'low' | 'medium' | 'high' }) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    const labels = {
      low: '✅ Low Risk',
      medium: '⚠️ Medium Risk',
      high: '🚨 High Risk',
    };
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${colors[level]}`}>
        {labels[level]}
      </span>
    );
  };
  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color,
  }: {
    icon: React.ElementType;
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
  }) => {
    const IconComponent = Icon as React.ComponentType<{ size?: number; color?: string; className?: string }>;
    return (
      <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderColor: color }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
            {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
          </div>
          <IconComponent size={32} color={color} className="opacity-20" />
        </div>
      </div>
    );
  };
  const DeadlineItem = ({ deadline }: { deadline: UpcomingDeadline }) => {
    const daysText = deadline.daysUntilDeadline === 0 ? 'Today' : `${deadline.daysUntilDeadline} days`;
    const isUrgent = deadline.daysUntilDeadline <= 7;
    return (
      <div
        className={`flex items-center justify-between p-4 border-l-4 ${
          isUrgent ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50'
        }`}
      >
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{deadline.documentName}</h4>
          <p className="text-sm text-gray-600 mt-1">
            {deadline.country} • {deadline.description}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${isUrgent ? 'text-red-600' : 'text-blue-600'}`}>
            {daysText}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(deadline.deadline).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Clock size={48} className="text-blue-600" />
          </div>
          <p className="text-gray-600">Loading compliance data...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Compliance Dashboard</h1>
          <p className="text-gray-600">Real-time monitoring of regulatory requirements and filing deadlines</p>
        </div>
        {/* Risk Level Banner */}
        <div className="mb-8 bg-white rounded-lg shadow p-6 border-t-4 border-indigo-600">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Compliance Status</h2>
              <p className="text-gray-600">Current risk assessment and filing status</p>
            </div>
            <RiskBadge level={riskLevel} />
          </div>
        </div>
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8 space-y-4">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg flex items-center gap-3 ${
                  alert.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : alert.type === 'warning'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {alert.type === 'success' ? (
                  <CheckCircle size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        )}
        {/* Statistics Grid */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatCard
              icon={FileText}
              title="Total Documents"
              value={statistics.totalDocuments ?? 0}
              color="#3B82F6"
            />
            <StatCard
              icon={CheckCircle}
              title="Completed"
              value={statistics.completed ?? 0}
              subtitle="Ready to submit"
              color="#10B981"
            />
            <StatCard
              icon={Clock}
              title="Pending"
              value={statistics.draft ?? 0}
              subtitle="In progress"
              color="#F59E0B"
            />
            <StatCard
              icon={TrendingUp}
              title="Submitted"
              value={statistics.submitted ?? 0}
              subtitle="Awaiting validation"
              color="#8B5CF6"
            />
            <StatCard
              icon={AlertCircle}
              title="By Standard"
              value={Object.keys(statistics.byStandard ?? {}).length}
              subtitle="Active standards"
              color="#EF4444"
            />
          </div>
        )}
        {/* Filing Status Cards */}
        {filingStatus && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 border-l-4 border-green-500 rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={20} className="text-green-600" />
                <h3 className="font-semibold text-gray-900">On Time</h3>
              </div>
              <p className="text-3xl font-bold text-green-600">{filingStatus.onTime}</p>
              <p className="text-sm text-gray-600 mt-2">Submissions within timeline</p>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={20} className="text-yellow-600" />
                <h3 className="font-semibold text-gray-900">Upcoming</h3>
              </div>
              <p className="text-3xl font-bold text-yellow-600">{filingStatus.upcoming}</p>
              <p className="text-sm text-gray-600 mt-2">Due within 90 days</p>
            </div>
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={20} className="text-red-600" />
                <h3 className="font-semibold text-gray-900">Overdue</h3>
              </div>
              <p className="text-3xl font-bold text-red-600">{filingStatus.overdue}</p>
              <p className="text-sm text-gray-600 mt-2">Immediate action required</p>
            </div>
          </div>
        )}
        {/* Upcoming Deadlines */}
        {upcomingDeadlines.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center gap-2">
                <Calendar size={24} className="text-white" />
                <h2 className="text-2xl font-bold text-white">Upcoming Deadlines (Next 90 Days)</h2>
              </div>
            </div>
            <div className="divide-y">
              {upcomingDeadlines.slice(0, 10).map((deadline, index) => (
                <DeadlineItem key={index} deadline={deadline} />
              ))}
            </div>
            {upcomingDeadlines.length > 10 && (
              <div className="px-6 py-4 bg-gray-50 border-t">
                <button className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                  View all {upcomingDeadlines.length} deadlines →
                </button>
              </div>
            )}
          </div>
        )}
        {/* Empty State */}
        {upcomingDeadlines.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">All Clear!</h3>
            <p className="text-gray-600">No filing deadlines in the next 90 days</p>
          </div>
        )}
      </div>
    </div>
  );
}
