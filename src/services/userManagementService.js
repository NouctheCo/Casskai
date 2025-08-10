import { SYSTEM_ROLES } from '@/types/user.types';

class UserManagementService {
  constructor() {
    this.initializeLocalStorage();
  }

  initializeLocalStorage() {
    // Initialize mock data in localStorage if not exists
    if (!localStorage.getItem('casskai_users')) {
      const mockUsers = [
        {
          id: '1',
          email: 'admin@casskai.com',
          firstName: 'Marie',
          lastName: 'Dubois',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
          role: { id: 'super_admin', name: 'Super Admin', level: 1 },
          department: 'Direction',
          position: 'Directrice Générale',
          status: 'active',
          permissions: ['*:*'],
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-07-26T14:30:00Z',
          lastLoginAt: '2024-07-26T14:30:00Z',
          companyId: 'comp-1',
          phoneNumber: '+33 1 23 45 67 89',
          invitedBy: null
        },
        {
          id: '2',
          email: 'manager@casskai.com',
          firstName: 'Pierre',
          lastName: 'Martin',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
          role: { id: 'admin', name: 'Administrateur', level: 1 },
          department: 'Comptabilité',
          position: 'Chef Comptable',
          status: 'active',
          permissions: SYSTEM_ROLES.ADMIN.permissions,
          createdAt: '2024-02-01T10:00:00Z',
          updatedAt: '2024-07-25T16:45:00Z',
          lastLoginAt: '2024-07-25T16:45:00Z',
          companyId: 'comp-1',
          phoneNumber: '+33 1 23 45 67 90',
          invitedBy: '1'
        },
        {
          id: '3',
          email: 'employee@casskai.com',
          firstName: 'Sophie',
          lastName: 'Bernard',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
          role: { id: 'manager', name: 'Manager', level: 2 },
          department: 'Facturation',
          position: 'Manager Facturation',
          status: 'active',
          permissions: SYSTEM_ROLES.MANAGER.permissions,
          createdAt: '2024-03-15T11:00:00Z',
          updatedAt: '2024-07-24T09:15:00Z',
          lastLoginAt: '2024-07-24T09:15:00Z',
          companyId: 'comp-1',
          phoneNumber: '+33 1 23 45 67 91',
          invitedBy: '1'
        },
        {
          id: '4',
          email: 'employee2@casskai.com',
          firstName: 'Julien',
          lastName: 'Moreau',
          avatar: null,
          role: { id: 'employee', name: 'Employé', level: 3 },
          department: 'Ventes',
          position: 'Commercial',
          status: 'active',
          permissions: SYSTEM_ROLES.EMPLOYEE.permissions,
          createdAt: '2024-04-10T14:00:00Z',
          updatedAt: '2024-07-23T11:30:00Z',
          lastLoginAt: '2024-07-23T11:30:00Z',
          companyId: 'comp-1',
          phoneNumber: '+33 1 23 45 67 92',
          invitedBy: '2'
        },
        {
          id: '5',
          email: 'inactive@casskai.com',
          firstName: 'Jean',
          lastName: 'Dupont',
          avatar: null,
          role: { id: 'viewer', name: 'Observateur', level: 4 },
          department: 'Archives',
          position: 'Stagiaire',
          status: 'inactive',
          permissions: SYSTEM_ROLES.VIEWER.permissions,
          createdAt: '2024-06-01T08:00:00Z',
          updatedAt: '2024-07-01T12:00:00Z',
          lastLoginAt: '2024-06-15T14:20:00Z',
          companyId: 'comp-1',
          phoneNumber: '+33 1 23 45 67 93',
          invitedBy: '2'
        }
      ];
      localStorage.setItem('casskai_users', JSON.stringify(mockUsers));
    }

    if (!localStorage.getItem('casskai_roles')) {
      const mockRoles = Object.entries(SYSTEM_ROLES).map(([key, role]) => ({
        id: key.toLowerCase(),
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        level: role.level,
        isSystemRole: true,
        companyId: 'comp-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }));
      localStorage.setItem('casskai_roles', JSON.stringify(mockRoles));
    }

    if (!localStorage.getItem('casskai_invitations')) {
      const mockInvitations = [
        {
          id: 'inv-1',
          email: 'newuser@example.com',
          role: { id: 'employee', name: 'Employé' },
          invitedBy: '1',
          companyId: 'comp-1',
          status: 'pending',
          token: 'token-123',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          message: 'Bienvenue dans notre équipe !'
        },
        {
          id: 'inv-2',
          email: 'consultant@example.com',
          role: { id: 'viewer', name: 'Observateur' },
          invitedBy: '1',
          companyId: 'comp-1',
          status: 'expired',
          token: 'token-456',
          expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          message: 'Accès temporaire pour audit'
        }
      ];
      localStorage.setItem('casskai_invitations', JSON.stringify(mockInvitations));
    }

    if (!localStorage.getItem('casskai_activities')) {
      const mockActivities = [
        {
          id: 'act-1',
          userId: '1',
          action: 'user.login',
          resource: 'authentication',
          resourceId: '1',
          metadata: { method: 'email', device: 'desktop' },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'act-2',
          userId: '2',
          action: 'invoice.create',
          resource: 'invoices',
          resourceId: 'inv-123',
          metadata: { amount: 1500, client: 'Client ABC', number: 'F-2024-001' },
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'act-3',
          userId: '1',
          action: 'user.invite',
          resource: 'users',
          resourceId: 'inv-1',
          metadata: { email: 'newuser@example.com', role: 'employee' },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'act-4',
          userId: '3',
          action: 'accounting.entry.create',
          resource: 'journal_entries',
          resourceId: 'entry-456',
          metadata: { amount: 2500, journal: 'Ventes', reference: 'VT-001' },
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'act-5',
          userId: '4',
          action: 'client.create',
          resource: 'clients',
          resourceId: 'client-789',
          metadata: { name: 'Entreprise XYZ', type: 'company' },
          ipAddress: '192.168.1.103',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ];
      localStorage.setItem('casskai_activities', JSON.stringify(mockActivities));
    }
  }

  // Users CRUD operations
  async getUsers(companyId = 'comp-1') {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('casskai_users') || '[]');
        const filteredUsers = users.filter(user => user.companyId === companyId);
        resolve({ data: filteredUsers, error: null });
      }, 200);
    });
  }

  async getUserById(userId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('casskai_users') || '[]');
        const user = users.find(u => u.id === userId);
        resolve({ data: user || null, error: user ? null : { message: 'User not found' } });
      }, 150);
    });
  }

  async createUser(userData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('casskai_users') || '[]');
        const newUser = {
          id: Date.now().toString(),
          ...userData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          permissions: userData.role?.permissions || []
        };
        users.push(newUser);
        localStorage.setItem('casskai_users', JSON.stringify(users));
        this.logActivity(userData.invitedBy || 'system', 'user.create', 'users', newUser.id, {
          email: newUser.email,
          role: newUser.role?.name
        });
        resolve({ data: newUser, error: null });
      }, 300);
    });
  }

  async updateUser(userId, userData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('casskai_users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
          resolve({ data: null, error: { message: 'User not found' } });
          return;
        }
        users[userIndex] = {
          ...users[userIndex],
          ...userData,
          updatedAt: new Date().toISOString(),
          permissions: userData.role?.permissions || users[userIndex].permissions
        };
        localStorage.setItem('casskai_users', JSON.stringify(users));
        this.logActivity('system', 'user.update', 'users', userId, {
          changes: Object.keys(userData)
        });
        resolve({ data: users[userIndex], error: null });
      }, 250);
    });
  }

  async deleteUser(userId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('casskai_users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
          resolve({ data: null, error: { message: 'User not found' } });
          return;
        }
        const deletedUser = users[userIndex];
        users.splice(userIndex, 1);
        localStorage.setItem('casskai_users', JSON.stringify(users));
        this.logActivity('system', 'user.delete', 'users', userId, {
          email: deletedUser.email
        });
        resolve({ data: { success: true }, error: null });
      }, 200);
    });
  }

  async toggleUserStatus(userId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('casskai_users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
          resolve({ data: null, error: { message: 'User not found' } });
          return;
        }
        const newStatus = users[userIndex].status === 'active' ? 'inactive' : 'active';
        users[userIndex].status = newStatus;
        users[userIndex].updatedAt = new Date().toISOString();
        localStorage.setItem('casskai_users', JSON.stringify(users));
        this.logActivity('system', 'user.status_change', 'users', userId, {
          newStatus,
          previousStatus: newStatus === 'active' ? 'inactive' : 'active'
        });
        resolve({ data: users[userIndex], error: null });
      }, 200);
    });
  }

  // Roles operations
  async getRoles(companyId = 'comp-1') {
    return new Promise((resolve) => {
      setTimeout(() => {
        const roles = JSON.parse(localStorage.getItem('casskai_roles') || '[]');
        const filteredRoles = roles.filter(role => role.companyId === companyId);
        resolve({ data: filteredRoles, error: null });
      }, 150);
    });
  }

  async createRole(roleData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const roles = JSON.parse(localStorage.getItem('casskai_roles') || '[]');
        const newRole = {
          id: Date.now().toString(),
          ...roleData,
          isSystemRole: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        roles.push(newRole);
        localStorage.setItem('casskai_roles', JSON.stringify(roles));
        this.logActivity('system', 'role.create', 'roles', newRole.id, {
          name: newRole.name,
          level: newRole.level
        });
        resolve({ data: newRole, error: null });
      }, 250);
    });
  }

  // Invitations operations
  async getInvitations(companyId = 'comp-1') {
    return new Promise((resolve) => {
      setTimeout(() => {
        const invitations = JSON.parse(localStorage.getItem('casskai_invitations') || '[]');
        const filteredInvitations = invitations.filter(inv => inv.companyId === companyId);
        resolve({ data: filteredInvitations, error: null });
      }, 150);
    });
  }

  async createInvitation(invitationData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const invitations = JSON.parse(localStorage.getItem('casskai_invitations') || '[]');
        const newInvitation = {
          id: 'inv-' + Date.now(),
          ...invitationData,
          status: 'pending',
          token: 'token-' + Date.now(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        };
        invitations.push(newInvitation);
        localStorage.setItem('casskai_invitations', JSON.stringify(invitations));
        this.logActivity(invitationData.invitedBy, 'user.invite', 'invitations', newInvitation.id, {
          email: newInvitation.email,
          role: newInvitation.role?.name
        });
        resolve({ data: newInvitation, error: null });
      }, 300);
    });
  }

  async resendInvitation(invitationId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const invitations = JSON.parse(localStorage.getItem('casskai_invitations') || '[]');
        const invitationIndex = invitations.findIndex(inv => inv.id === invitationId);
        if (invitationIndex === -1) {
          resolve({ data: null, error: { message: 'Invitation not found' } });
          return;
        }
        invitations[invitationIndex].expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        invitations[invitationIndex].status = 'pending';
        localStorage.setItem('casskai_invitations', JSON.stringify(invitations));
        this.logActivity('system', 'invitation.resend', 'invitations', invitationId);
        resolve({ data: invitations[invitationIndex], error: null });
      }, 200);
    });
  }

  async cancelInvitation(invitationId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const invitations = JSON.parse(localStorage.getItem('casskai_invitations') || '[]');
        const invitationIndex = invitations.findIndex(inv => inv.id === invitationId);
        if (invitationIndex === -1) {
          resolve({ data: null, error: { message: 'Invitation not found' } });
          return;
        }
        invitations[invitationIndex].status = 'cancelled';
        localStorage.setItem('casskai_invitations', JSON.stringify(invitations));
        this.logActivity('system', 'invitation.cancel', 'invitations', invitationId);
        resolve({ data: invitations[invitationIndex], error: null });
      }, 200);
    });
  }

  // Activity log operations
  async getActivities(companyId = 'comp-1', limit = 50) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const activities = JSON.parse(localStorage.getItem('casskai_activities') || '[]');
        const filteredActivities = activities
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, limit);
        resolve({ data: filteredActivities, error: null });
      }, 150);
    });
  }

  async getUserActivities(userId, limit = 20) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const activities = JSON.parse(localStorage.getItem('casskai_activities') || '[]');
        const userActivities = activities
          .filter(activity => activity.userId === userId)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, limit);
        resolve({ data: userActivities, error: null });
      }, 150);
    });
  }

  logActivity(userId, action, resource, resourceId = null, metadata = {}) {
    const activities = JSON.parse(localStorage.getItem('casskai_activities') || '[]');
    const newActivity = {
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      userId,
      action,
      resource,
      resourceId,
      metadata,
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date().toISOString()
    };
    activities.unshift(newActivity);
    // Keep only the last 1000 activities
    if (activities.length > 1000) {
      activities.splice(1000);
    }
    localStorage.setItem('casskai_activities', JSON.stringify(activities));
  }

  // Permission checking
  hasPermission(user, module, action) {
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
  }

  // User statistics
  async getUserStats(companyId = 'comp-1') {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('casskai_users') || '[]');
        const companyUsers = users.filter(user => user.companyId === companyId);
        
        const stats = {
          total: companyUsers.length,
          active: companyUsers.filter(user => user.status === 'active').length,
          inactive: companyUsers.filter(user => user.status === 'inactive').length,
          pending: companyUsers.filter(user => user.status === 'pending').length,
          suspended: companyUsers.filter(user => user.status === 'suspended').length,
          byRole: {},
          byDepartment: {},
          recentSignups: companyUsers
            .filter(user => new Date(user.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
            .length,
          activeToday: companyUsers
            .filter(user => user.lastLoginAt && new Date(user.lastLoginAt) > new Date(Date.now() - 24 * 60 * 60 * 1000))
            .length
        };
        
        // Count by role
        companyUsers.forEach(user => {
          const roleName = user.role?.name || 'Unknown';
          stats.byRole[roleName] = (stats.byRole[roleName] || 0) + 1;
        });
        
        // Count by department
        companyUsers.forEach(user => {
          const department = user.department || 'Unknown';
          stats.byDepartment[department] = (stats.byDepartment[department] || 0) + 1;
        });
        
        resolve({ data: stats, error: null });
      }, 200);
    });
  }

  // Search users
  async searchUsers(query, companyId = 'comp-1') {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('casskai_users') || '[]');
        const companyUsers = users.filter(user => user.companyId === companyId);
        
        const searchResults = companyUsers.filter(user => {
          const searchableText = `${user.firstName} ${user.lastName} ${user.email} ${user.department} ${user.position}`.toLowerCase();
          return searchableText.includes(query.toLowerCase());
        });
        
        resolve({ data: searchResults, error: null });
      }, 150);
    });
  }
}

// Export singleton instance
export const userManagementService = new UserManagementService();
export default userManagementService;