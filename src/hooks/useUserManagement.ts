import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  role: UserRole;
  department?: string;
  position?: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
  companyId: string;
  phoneNumber?: string;
  invitedBy?: string | null;
}

export interface UserRole {
  id: string;
  name: string;
  level: number;
  permissions: string[];
}

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  position?: string;
  phoneNumber?: string;
  companyId: string;
  invitedBy?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  department?: string;
  position?: string;
  phoneNumber?: string;
  avatar?: string | null;
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  companyId: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
  expiresAt: string;
  createdAt: string;
  message?: string;
}

export interface CreateInvitationData {
  email: string;
  role: UserRole;
  invitedBy: string;
  companyId: string;
  message?: string;
}

export interface Activity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  suspended: number;
  byRole: Record<string, number>;
  byDepartment: Record<string, number>;
  recentSignups: number;
  activeToday: number;
}

export function useUserManagement(companyId: string) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all users for a company
  const getUsers = useCallback(async (): Promise<User[]> => {
    if (!currentUser || !companyId) return [];

    setLoading(true);
    setError(null);

    try {
      const { data: users, error: usersError } = await supabase
        .from('user_companies')
        .select(`
          user_id,
          role,
          is_active,
          created_at,
          updated_at,
          users (
            id,
            email,
            first_name,
            last_name,
            avatar_url,
            phone_number,
            last_login_at,
            status
          )
        `)
        .eq('company_id', companyId);

      if (usersError) throw usersError;

      // Transform data to match User interface
      const transformedUsers = (users || [])
        .filter(uc => uc.users)
        .map(uc => {
          // Supabase returns nested objects in array format, take first element
          const user = Array.isArray(uc.users) ? uc.users[0] : uc.users;
          if (!user) return null;

          return {
          id: user.id,
          email: user.email,
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          avatar: user.avatar_url,
          role: {
            id: uc.role,
            name: getRoleName(uc.role),
            level: getRoleLevel(uc.role),
            permissions: getRolePermissions(uc.role)
          },
          department: '', // Not stored in current schema
          position: '', // Not stored in current schema
          status: uc.is_active ? 'active' : 'inactive',
          permissions: getRolePermissions(uc.role),
          createdAt: uc.created_at,
          updatedAt: uc.updated_at,
          lastLoginAt: user.last_login_at,
          companyId,
          phoneNumber: user.phone_number,
          invitedBy: null
        } as User;
        })
        .filter((u: User | null): u is User => u !== null);

      return transformedUsers as User[];
    } catch (errorMsg) {
      const errorMessage = errorMsg instanceof Error ? errorMsg.message : 'Failed to fetch users';
      setError(errorMessage);
      console.error('Error fetching users:', errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUser, companyId]);

  // Get user by ID
  const getUserById = useCallback(async (userId: string): Promise<User | null> => {
    if (!currentUser || !companyId) return null;

    setLoading(true);
    setError(null);

    try {
      const { data: userCompany, error: userError } = await supabase
        .from('user_companies')
        .select(`
          user_id,
          role,
          is_active,
          created_at,
          updated_at,
          users (
            id,
            email,
            first_name,
            last_name,
            avatar_url,
            phone_number,
            last_login_at,
            status
          )
        `)
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .single();

      if (userError) throw userError;
      if (!userCompany?.users) return null;

      // Supabase returns nested objects in array format, take first element
      const userRecord = Array.isArray(userCompany.users) ? userCompany.users[0] : userCompany.users;
      if (!userRecord) return null;

      const user: User = {
        id: userRecord.id,
        email: userRecord.email,
        firstName: userRecord.first_name || '',
        lastName: userRecord.last_name || '',
        avatar: userRecord.avatar_url,
        role: {
          id: userCompany.role,
          name: getRoleName(userCompany.role),
          level: getRoleLevel(userCompany.role),
          permissions: getRolePermissions(userCompany.role)
        },
        department: '',
        position: '',
        status: userCompany.is_active ? 'active' : 'inactive',
        permissions: getRolePermissions(userCompany.role),
        createdAt: userCompany.created_at,
        updatedAt: userCompany.updated_at,
        lastLoginAt: userRecord.last_login_at,
        companyId,
        phoneNumber: userRecord.phone_number,
        invitedBy: null
      };

      return user;
    } catch (errorMsg) {
      const errorMessage = errorMsg instanceof Error ? errorMsg.message : 'Failed to fetch user';
      setError(errorMessage);
      console.error('Error fetching user:', errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, companyId]);

  // Create invitation (can't create user directly - invite them instead)
  const createInvitation = useCallback(async (invitationData: CreateInvitationData): Promise<Invitation | null> => {
    if (!currentUser) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      // Create invitation record
      const token = generateInvitationToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: invitation, error: inviteError } = await supabase
        .from('user_invitations')
        .insert({
          email: invitationData.email,
          company_id: invitationData.companyId,
          role: invitationData.role.id,
          invited_by: invitationData.invitedBy,
          token,
          expires_at: expiresAt,
          message: invitationData.message,
          status: 'pending'
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Log activity
      await logActivity(
        currentUser.id,
        'user.invite',
        'invitations',
        invitation.id,
        { email: invitationData.email, role: invitationData.role.name }
      );

      return {
        id: invitation.id,
        email: invitation.email,
        role: invitationData.role,
        invitedBy: invitation.invited_by,
        companyId: invitation.company_id,
        status: invitation.status,
        token: invitation.token,
        expiresAt: invitation.expires_at,
        createdAt: invitation.created_at,
        message: invitation.message
      };
    } catch (errorMsg) {
      const errorMessage = errorMsg instanceof Error ? errorMsg.message : 'Failed to create invitation';
      setError(errorMessage);
      console.error('Error creating invitation:', errorMsg);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Update user
  const updateUser = useCallback(async (userId: string, updates: UpdateUserData): Promise<User | null> => {
    if (!currentUser) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      // Update user profile
      const userUpdates: any = {};
      if (updates.firstName !== undefined) userUpdates.first_name = updates.firstName;
      if (updates.lastName !== undefined) userUpdates.last_name = updates.lastName;
      if (updates.phoneNumber !== undefined) userUpdates.phone_number = updates.phoneNumber;
      if (updates.avatar !== undefined) userUpdates.avatar_url = updates.avatar;

      if (Object.keys(userUpdates).length > 0) {
        const { error: userError } = await supabase
          .from('users')
          .update(userUpdates)
          .eq('id', userId);

        if (userError) throw userError;
      }

      // Update user-company relationship if role changed
      if (updates.role) {
        const { error: roleError } = await supabase
          .from('user_companies')
          .update({ role: updates.role.id })
          .eq('user_id', userId)
          .eq('company_id', companyId);

        if (roleError) throw roleError;
      }

      // Log activity
      await logActivity(
        currentUser.id,
        'user.update',
        'users',
        userId,
        { changes: Object.keys(updates) }
      );

      // Return updated user
      return await getUserById(userId);
    } catch (errorMsg) {
      const errorMessage = errorMsg instanceof Error ? errorMsg.message : 'Failed to update user';
      setError(errorMessage);
      console.error('Error updating user:', errorMsg);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentUser, companyId, getUserById]);

  // Toggle user status
  const toggleUserStatus = useCallback(async (userId: string): Promise<User | null> => {
    if (!currentUser) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      // Get current status
      const { data: userCompany, error: fetchError } = await supabase
        .from('user_companies')
        .select('is_active')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .single();

      if (fetchError) throw fetchError;

      const newStatus = !userCompany.is_active;

      // Update status
      const { error: updateError } = await supabase
        .from('user_companies')
        .update({ is_active: newStatus })
        .eq('user_id', userId)
        .eq('company_id', companyId);

      if (updateError) throw updateError;

      // Log activity
      await logActivity(
        currentUser.id,
        'user.status_change',
        'users',
        userId,
        { newStatus: newStatus ? 'active' : 'inactive', previousStatus: newStatus ? 'inactive' : 'active' }
      );

      // Return updated user
      return await getUserById(userId);
    } catch (errorMsg) {
      const errorMessage = errorMsg instanceof Error ? errorMsg.message : 'Failed to toggle user status';
      setError(errorMessage);
      console.error('Error toggling user status:', errorMsg);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentUser, companyId, getUserById]);

  // Get invitations
  const getInvitations = useCallback(async (): Promise<Invitation[]> => {
    if (!currentUser || !companyId) return [];

    setLoading(true);
    setError(null);

    try {
      const { data: invitations, error: invitationsError } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (invitationsError) throw invitationsError;

      return invitations.map(inv => ({
        id: inv.id,
        email: inv.email,
        role: {
          id: inv.role,
          name: getRoleName(inv.role),
          level: getRoleLevel(inv.role),
          permissions: getRolePermissions(inv.role)
        },
        invitedBy: inv.invited_by,
        companyId: inv.company_id,
        status: inv.status,
        token: inv.token,
        expiresAt: inv.expires_at,
        createdAt: inv.created_at,
        message: inv.message
      }));
    } catch (errorMsg) {
      const errorMessage = errorMsg instanceof Error ? errorMsg.message : 'Failed to fetch invitations';
      setError(errorMessage);
      console.error('Error fetching invitations:', errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUser, companyId]);

  // Resend invitation
  const resendInvitation = useCallback(async (invitationId: string): Promise<Invitation | null> => {
    if (!currentUser) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: invitation, error: updateError } = await supabase
        .from('user_invitations')
        .update({
          expires_at: newExpiresAt,
          status: 'pending'
        })
        .eq('id', invitationId)
        .eq('company_id', companyId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Log activity
      await logActivity(currentUser.id, 'invitation.resend', 'invitations', invitationId);

      return {
        id: invitation.id,
        email: invitation.email,
        role: {
          id: invitation.role,
          name: getRoleName(invitation.role),
          level: getRoleLevel(invitation.role),
          permissions: getRolePermissions(invitation.role)
        },
        invitedBy: invitation.invited_by,
        companyId: invitation.company_id,
        status: invitation.status,
        token: invitation.token,
        expiresAt: invitation.expires_at,
        createdAt: invitation.created_at,
        message: invitation.message
      };
    } catch (errorMsg) {
      const errorMessage = errorMsg instanceof Error ? errorMsg.message : 'Failed to resend invitation';
      setError(errorMessage);
      console.error('Error resending invitation:', errorMsg);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentUser, companyId]);

  // Cancel invitation
  const cancelInvitation = useCallback(async (invitationId: string): Promise<void> => {
    if (!currentUser) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('user_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId)
        .eq('company_id', companyId);

      if (updateError) throw updateError;

      // Log activity
      await logActivity(currentUser.id, 'invitation.cancel', 'invitations', invitationId);
    } catch (errorMsg) {
      const errorMessage = errorMsg instanceof Error ? errorMsg.message : 'Failed to cancel invitation';
      setError(errorMessage);
      console.error('Error canceling invitation:', errorMsg);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentUser, companyId]);

  // Get user activities
  const getActivities = useCallback(async (limit: number = 50): Promise<Activity[]> => {
    if (!currentUser || !companyId) return [];

    setLoading(true);
    setError(null);

    try {
      const { data: activities, error: activitiesError } = await supabase
        .from('user_activities')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (activitiesError) throw activitiesError;

      return activities.map(activity => ({
        id: activity.id,
        userId: activity.user_id,
        action: activity.action,
        resource: activity.resource,
        resourceId: activity.resource_id,
        metadata: activity.metadata || {},
        ipAddress: activity.ip_address || '',
        userAgent: activity.user_agent || '',
        timestamp: activity.created_at
      }));
    } catch (errorMsg) {
      const errorMessage = errorMsg instanceof Error ? errorMsg.message : 'Failed to fetch activities';
      setError(errorMessage);
      console.error('Error fetching activities:', errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUser, companyId]);

  // Get user statistics
  const getUserStats = useCallback(async (): Promise<UserStats> => {
    if (!currentUser || !companyId) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        pending: 0,
        suspended: 0,
        byRole: {},
        byDepartment: {},
        recentSignups: 0,
        activeToday: 0
      };
    }

    try {
      const users = await getUsers();

      const stats: UserStats = {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        inactive: users.filter(u => u.status === 'inactive').length,
        pending: users.filter(u => u.status === 'pending').length,
        suspended: users.filter(u => u.status === 'suspended').length,
        byRole: {},
        byDepartment: {},
        recentSignups: users.filter(u => 
          new Date(u.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length,
        activeToday: users.filter(u => 
          u.lastLoginAt && new Date(u.lastLoginAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length
      };

      // Count by role
      users.forEach(user => {
        const roleName = user.role?.name || 'Unknown';
        stats.byRole[roleName] = (stats.byRole[roleName] || 0) + 1;
      });

      // Count by department
      users.forEach(user => {
        const department = user.department || 'Unknown';
        stats.byDepartment[department] = (stats.byDepartment[department] || 0) + 1;
      });

      return stats;
    } catch (errorMsg) {
      console.error('Error calculating user stats:', errorMsg);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        pending: 0,
        suspended: 0,
        byRole: {},
        byDepartment: {},
        recentSignups: 0,
        activeToday: 0
      };
    }
  }, [currentUser, companyId, getUsers]);

  // Search users
  const searchUsers = useCallback(async (query: string): Promise<User[]> => {
    if (!query.trim()) return [];

    try {
      const users = await getUsers();
      return users.filter(user => {
        const searchableText = `${user.firstName} ${user.lastName} ${user.email} ${user.department} ${user.position}`.toLowerCase();
        return searchableText.includes(query.toLowerCase());
      });
    } catch (errorMsg) {
      console.error('Error searching users:', errorMsg);
      return [];
    }
  }, [getUsers]);

  // Permission checking
  const hasPermission = useCallback((user: User, module: string, action: string): boolean => {
    if (!user || !user.permissions) return false;
    
    // Super admin has all permissions
    if (user.permissions.includes('*:*')) return true;
    
    // Check specific permission
    const requiredPermission = `${module}:${action}`;
    if (user.permissions.includes(requiredPermission)) return true;
    
    // Check module-level permission
    const modulePermission = `${module}:manage`;
    if (user.permissions.includes(modulePermission)) return true;
    
    return false;
  }, []);

  return {
    loading,
    error,
    getUsers,
    getUserById,
    updateUser,
    toggleUserStatus,
    createInvitation,
    getInvitations,
    resendInvitation,
    cancelInvitation,
    getActivities,
    getUserStats,
    searchUsers,
    hasPermission,
    refresh: getUsers,
  };
}

// Utility functions
async function logActivity(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    await supabase
      .from('user_activities')
      .insert({
        user_id: userId,
        action,
        resource,
        resource_id: resourceId,
        metadata,
        ip_address: '127.0.0.1', // Would be actual IP in production
        user_agent: navigator.userAgent
      });
  } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Failed to log activity:', error);
  }
}

function generateInvitationToken(): string {
  return `inv_${  Date.now()  }_${  Math.random().toString(36).substr(2, 16)}`;
}

function getRoleName(roleId: string): string {
  const roleNames: Record<string, string> = {
    'owner': 'Propriétaire',
    'admin': 'Administrateur',
    'manager': 'Manager',
    'accountant': 'Comptable',
    'employee': 'Employé',
    'viewer': 'Observateur'
  };
  return roleNames[roleId] || roleId;
}

function getRoleLevel(roleId: string): number {
  const roleLevels: Record<string, number> = {
    'owner': 1,
    'admin': 2,
    'manager': 3,
    'accountant': 3,
    'employee': 4,
    'viewer': 5
  };
  return roleLevels[roleId] || 5;
}

function getRolePermissions(roleId: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    'owner': ['*:*'],
    'admin': [
      'users:manage', 'accounting:manage', 'invoicing:manage', 
      'reports:manage', 'settings:manage', 'third_parties:manage'
    ],
    'manager': [
      'users:read', 'accounting:manage', 'invoicing:manage',
      'reports:read', 'third_parties:manage'
    ],
    'accountant': [
      'accounting:manage', 'reports:manage', 'third_parties:read'
    ],
    'employee': [
      'invoicing:read', 'reports:read', 'third_parties:read'
    ],
    'viewer': [
      'reports:read'
    ]
  };
  return rolePermissions[roleId] || ['reports:read'];
}