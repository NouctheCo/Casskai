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

import { supabase } from '../lib/supabase';
import {
  TaxDeclaration,
  TaxDashboardData,
  TaxCalendarEvent,
  TaxAlert,
  TaxObligation,
  TaxServiceResponse
} from '../types/tax.types';

/**
 * Get tax dashboard data
 */
export async function getDashboardData(enterpriseId: string): Promise<TaxServiceResponse<TaxDashboardData>> {
  try {
    // Fetch declarations
    const { data: declarations, error: declError } = await supabase
      .from('tax_declarations')
      .select('*')
      .eq('company_id', enterpriseId)
      .order('created_at', { ascending: false });

    if (declError) throw declError;

    // Fetch active alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('tax_alerts')
      .select('*')
      .eq('company_id', enterpriseId)
      .eq('status', 'active');

    if (alertsError) throw alertsError;

    // Fetch upcoming obligations
    const { data: obligations, error: obligError } = await supabase
      .from('tax_calendar_events')
      .select('*')
      .eq('company_id', enterpriseId)
      .gte('start_date', new Date().toISOString().split('T')[0])
      .lte('start_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('start_date', { ascending: true })
      .limit(5);

    if (obligError) throw obligError;

    // Calculate stats
    const now = new Date();
    const pending = declarations?.filter(d => d.status === 'pending' || d.status === 'draft') || [];
    const overdue = declarations?.filter(d => d.status !== 'completed' && new Date(d.due_date) < now) || [];
    const completed = declarations?.filter(d => d.status === 'completed' || d.status === 'submitted') || [];

    const totalTax = declarations?.reduce((sum, d) => sum + (Number(d.tax_amount) || 0), 0) || 0;
    const paidTax = completed.reduce((sum, d) => sum + (Number(d.tax_amount) || 0), 0);

    // Map recent declarations to expected format
    const recentDeclarations: TaxDeclaration[] = (declarations?.slice(0, 5) || []).map(d => ({
      id: d.id,
      type: d.declaration_type as any,
      name: `${d.declaration_type} - ${d.period_type}`,
      dueDate: new Date(d.due_date),
      status: d.status as any,
      amount: Number(d.tax_amount) || 0,
      companyId: d.company_id,
      countryCode: 'FR',
      period: {
        start: new Date(d.period_start),
        end: new Date(d.period_end)
      },
      submittedDate: d.submission_date ? new Date(d.submission_date) : undefined,
      submittedBy: d.created_by
    }));

    // Map active alerts
    const activeAlerts: TaxAlert[] = (alerts || []).map(a => ({
      id: a.id,
      type: a.type as any,
      severity: a.severity as any,
      title: a.title,
      message: a.message,
      action_required: a.action_required,
      trigger_date: a.trigger_date,
      due_date: a.due_date,
      status: a.status as any,
      enterprise_id: a.company_id,
      created_at: a.created_at,
      updated_at: a.updated_at,
      declaration_id: a.declaration_id
    }));

    // Calculate dynamic compliance scores
    const totalDeclarations = declarations?.length || 0;

    // Score for declarations up-to-date (no overdue)
    const declarationsScore = totalDeclarations > 0
      ? Math.round(((totalDeclarations - overdue.length) / totalDeclarations) * 100)
      : 0;

    // Score for payments (based on paid vs total tax due)
    const paymentsScore = totalTax > 0
      ? Math.round((paidTax / totalTax) * 100)
      : 0;

    // Overall compliance score (average of factors, weighted)
    const complianceScore = totalDeclarations > 0
      ? Math.round((declarationsScore * 0.6 + paymentsScore * 0.4))
      : 0;

    // Determine status based on score thresholds
    const getStatus = (score: number): 'good' | 'warning' | 'critical' => {
      if (score >= 80) return 'good';
      if (score >= 60) return 'warning';
      return 'critical';
    };

    const dashboardData: TaxDashboardData = {
      stats: {
        total_declarations: declarations?.length || 0,
        pending_declarations: pending.length,
        overdue_declarations: overdue.length,
        total_tax_due: totalTax,
        total_tax_paid: paidTax,
        upcoming_deadlines: obligations?.length || 0,
        active_alerts: alerts?.length || 0,
        by_type: []
      },
      upcoming_obligations: (obligations || []).map(o => ({
        id: o.id,
        title: o.title,
        description: o.description,
        type: o.type as any,
        tax_type: o.tax_type,
        start_date: o.start_date,
        end_date: o.end_date,
        all_day: o.all_day,
        status: o.status as any,
        priority: o.priority as any,
        declaration_id: o.declaration_id,
        amount: o.amount ? Number(o.amount) : undefined,
        reminders: o.reminders || [],
        enterprise_id: o.company_id,
        created_by: o.created_by,
        created_at: o.created_at,
        updated_at: o.updated_at
      })),
      recent_declarations: recentDeclarations,
      active_alerts: activeAlerts,
      compliance_score: {
        current_score: complianceScore,
        max_score: 100,
        factors: [
          {
            name: 'Déclarations à jour',
            score: declarationsScore,
            max_score: 100,
            status: getStatus(declarationsScore)
          },
          {
            name: 'Paiements effectués',
            score: paymentsScore,
            max_score: 100,
            status: getStatus(paymentsScore)
          }
        ]
      }
    };

    return { data: dashboardData };
  } catch (error) {
    console.error('Error fetching tax dashboard data:', error);
    return {
      data: {} as TaxDashboardData,
      error: { message: 'Failed to fetch dashboard data' }
    };
  }
}

/**
 * Get tax declarations
 */
export async function getDeclarations(enterpriseId: string): Promise<TaxServiceResponse<TaxDeclaration[]>> {
  try {
    const { data, error } = await supabase
      .from('tax_declarations')
      .select('*')
      .eq('company_id', enterpriseId)
      .order('due_date', { ascending: false });

    if (error) throw error;

    const declarations: TaxDeclaration[] = (data || []).map(d => ({
      id: d.id,
      type: d.declaration_type as any,
      name: `${d.declaration_type} - ${d.period_type} ${d.year}${d.month ? '/' + d.month : ''}${d.quarter ? '/Q' + d.quarter : ''}`,
      dueDate: new Date(d.due_date),
      status: d.status as any,
      amount: Number(d.tax_amount) || 0,
      companyId: d.company_id,
      countryCode: 'FR',
      period: {
        start: new Date(d.period_start),
        end: new Date(d.period_end)
      },
      submittedDate: d.submission_date ? new Date(d.submission_date) : undefined,
      submittedBy: d.created_by,
      notes: d.declaration_data ? JSON.stringify(d.declaration_data) : undefined
    }));

    return { data: declarations };
  } catch (error) {
    console.error('Error fetching tax declarations:', error);
    return {
      data: [],
      error: { message: 'Failed to fetch declarations' }
    };
  }
}

/**
 * Get tax calendar events
 */
export async function getCalendarEvents(enterpriseId: string): Promise<TaxServiceResponse<TaxCalendarEvent[]>> {
  try {
    const { data, error } = await supabase
      .from('tax_calendar_events')
      .select('*')
      .eq('company_id', enterpriseId)
      .order('start_date', { ascending: true });

    if (error) throw error;

    const events: TaxCalendarEvent[] = (data || []).map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      type: e.type as any,
      tax_type: e.tax_type,
      start_date: e.start_date,
      end_date: e.end_date,
      all_day: e.all_day,
      status: e.status as any,
      priority: e.priority as any,
      declaration_id: e.declaration_id,
      amount: e.amount ? Number(e.amount) : undefined,
      reminders: e.reminders || [],
      enterprise_id: e.company_id,
      created_by: e.created_by,
      created_at: e.created_at,
      updated_at: e.updated_at
    }));

    return { data: events };
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return {
      data: [],
      error: { message: 'Failed to fetch calendar events' }
    };
  }
}

/**
 * Get tax alerts
 */
export async function getAlerts(enterpriseId: string): Promise<TaxServiceResponse<TaxAlert[]>> {
  try {
    const { data, error } = await supabase
      .from('tax_alerts')
      .select('*')
      .eq('company_id', enterpriseId)
      .in('status', ['active', 'acknowledged'])
      .order('trigger_date', { ascending: false });

    if (error) throw error;

    const alerts: TaxAlert[] = (data || []).map(a => ({
      id: a.id,
      type: a.type as any,
      severity: a.severity as any,
      title: a.title,
      message: a.message,
      action_required: a.action_required,
      trigger_date: a.trigger_date,
      due_date: a.due_date,
      auto_resolve_date: a.auto_resolve_date,
      status: a.status as any,
      acknowledged_by: a.acknowledged_by,
      acknowledged_at: a.acknowledged_at,
      resolved_by: a.resolved_by,
      resolved_at: a.resolved_at,
      declaration_id: a.declaration_id,
      enterprise_id: a.company_id,
      created_at: a.created_at,
      updated_at: a.updated_at
    }));

    return { data: alerts };
  } catch (error) {
    console.error('Error fetching tax alerts:', error);
    return {
      data: [],
      error: { message: 'Failed to fetch alerts' }
    };
  }
}

/**
 * Get tax obligations
 */
export async function getObligations(enterpriseId: string): Promise<TaxServiceResponse<TaxObligation[]>> {
  try {
    const { data, error } = await supabase
      .from('tax_obligations')
      .select('*')
      .eq('company_id', enterpriseId)
      .eq('is_active', true)
      .order('next_due_date', { ascending: true });

    if (error) throw error;

    const obligations: TaxObligation[] = (data || []).map(o => ({
      id: o.id,
      tax_type_id: o.tax_type_id,
      tax_type_name: o.tax_type_name,
      enterprise_id: o.company_id,
      frequency: o.frequency as any,
      due_day: o.due_day,
      advance_notice_days: o.advance_notice_days,
      next_due_date: o.next_due_date,
      next_declaration_id: o.next_declaration_id,
      is_active: o.is_active,
      auto_generate: o.auto_generate,
      requires_approval: o.requires_approval,
      email_notifications: o.email_notifications,
      notification_emails: o.notification_emails || [],
      created_at: o.created_at,
      updated_at: o.updated_at
    }));

    return { data: obligations };
  } catch (error) {
    console.error('Error fetching tax obligations:', error);
    return {
      data: [],
      error: { message: 'Failed to fetch obligations' }
    };
  }
}
