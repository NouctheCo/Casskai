import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Loader2, UserPlus, Users, Edit, Send, Info, Building, Lock } from 'lucide-react';

const UserManagementPage = () => {
  const { t } = useLocale();
  const { currentEnterpriseId, hasPermission } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const [isUserRoleDialogOpen, setIsUserRoleDialogOpen] = useState(false);

  // ✅ OPTIMISATION: Mémoriser les permissions
  const permissions = useMemo(() => ({
    canManageUsers: hasPermission('manage_company_users'),
    canManageRolesCompany: hasPermission('manage_company_roles')
  }), [hasPermission]);

  const fetchUsersAndRoles = useCallback(async () => {
    if (!currentEnterpriseId || !permissions.canManageUsers) {
      setUsers([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // ✅ CORRECTION: Améliorer la gestion d'erreur Supabase
      const { data: userCompaniesData, error: userCompaniesError } = await supabase
        .from('user_companies')
        .select(`
          user_id, 
          company_id, 
          created_at, 
          id,
          role_id,
          roles (
            id,
            name
          )
        `)
        .eq('company_id', currentEnterpriseId);
      
      if (userCompaniesError) {
        console.error('Error fetching user companies:', userCompaniesError);
        throw new Error(t('userManagement.fetchUsersError', { 
          defaultValue: 'Erreur lors du chargement des utilisateurs' 
        }));
      }

      if (!userCompaniesData || userCompaniesData.length === 0) {
        setUsers([]);
        setIsLoading(false);
        return;
      }

      // Get user IDs to fetch auth user data
      const userIds = userCompaniesData.map(uc => uc.user_id);
      
      // ✅ CORRECTION: Gestion d'erreur améliorée pour l'API admin
      try {
        const { data: adminUsersList, error: adminUsersError } = await supabase.auth.admin.listUsers();
        
        if (adminUsersError) {
          console.error("Admin API Error:", adminUsersError);
          toast({ 
            title: t('error', { defaultValue: 'Erreur' }), 
            description: t('userManagement.adminApiError', { 
              defaultValue: "Erreur d'accès à l'API admin. Vérifiez vos permissions." 
            }), 
            variant: 'destructive' 
          });
          
          // ✅ FALLBACK: Créer des utilisateurs factices si l'API admin échoue
          const fallbackUsers = userCompaniesData.map(uc => ({
            id: uc.user_id,
            user_company_id: uc.id,
            email: t('userManagement.emailNotAvailable', { defaultValue: 'Email non disponible' }),
            full_name: t('userManagement.userNotAvailable', { defaultValue: 'Utilisateur non disponible' }),
            assigned_at: uc.created_at,
            role_id: uc.roles?.id,
            role_name: uc.roles?.name || t('userManagement.noRoleAssigned', { defaultValue: 'Aucun rôle assigné' })
          }));
          
          setUsers(fallbackUsers);
          setIsLoading(false);
          return;
        }

        const allAuthUsers = adminUsersList.users;

        // Combine the data
        const combinedData = userCompaniesData.map(uc => {
          const authUser = allAuthUsers.find(u => u.id === uc.user_id);
          
          return {
            id: uc.user_id,
            user_company_id: uc.id,
            email: authUser?.email || t('userManagement.unknownEmail', {defaultValue: 'Email inconnu'}),
            full_name: authUser?.user_metadata?.full_name || 
                      authUser?.email?.split('@')[0] || 
                      t('userManagement.unknownUser', {defaultValue: 'Utilisateur inconnu'}),
            assigned_at: uc.created_at,
            role_id: uc.roles?.id,
            role_name: uc.roles?.name || t('userManagement.noRoleAssigned', { defaultValue: 'Aucun rôle assigné' })
          };
        });
        
        setUsers(combinedData);

      } catch (adminError) {
        console.error('Admin API call failed:', adminError);
        // Fallback silencieux
        setUsers([]);
      }

    } catch (error) {
      console.error('Error fetching users and roles:', error);
      toast({ 
        title: t('error', { defaultValue: 'Erreur' }), 
        description: error.message || t('userManagement.fetchUsersError', {
          defaultValue: "Échec du chargement des utilisateurs."
        }), 
        variant: 'destructive' 
      });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentEnterpriseId, toast, t, permissions.canManageUsers]);

  const fetchAllRolesForSelect = useCallback(async () => {
    if (!currentEnterpriseId || !permissions.canManageRolesCompany) {
      setAllRoles([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, description, is_system_role')
        .or(`company_id.eq.${currentEnterpriseId},is_system_role.eq.true`)
        .order('name');
      
      if (error) {
        console.error('Error fetching roles:', error);
        throw new Error(t('userManagement.fetchRolesError', {
          defaultValue: "Échec du chargement des rôles."
        }));
      }
      
      setAllRoles(data || []);
    } catch (error) {
      console.error('Error fetching all roles:', error);
      toast({ 
        title: t('error', { defaultValue: 'Erreur' }), 
        description: error.message, 
        variant: 'destructive' 
      });
      setAllRoles([]);
    }
  }, [currentEnterpriseId, toast, t, permissions.canManageRolesCompany]);

  useEffect(() => {
    if (currentEnterpriseId) {
      fetchUsersAndRoles();
      fetchAllRolesForSelect();
    } else {
      setUsers([]);
      setAllRoles([]);
      setIsLoading(false);
    }
  }, [currentEnterpriseId, fetchUsersAndRoles, fetchAllRolesForSelect]);

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!permissions.canManageUsers) {
      toast({ 
        title: t('userManagement.accessDenied', { defaultValue: 'Accès refusé' }), 
        description: t('userManagement.insufficientPermissions', { 
          defaultValue: 'Permissions insuffisantes' 
        }), 
        variant: 'destructive'
      });
      return;
    }
    if (!inviteEmail) {
      toast({ 
        title: t('error', { defaultValue: 'Erreur' }), 
        description: t('userManagement.emailRequired', {
          defaultValue: "L'email est requis pour envoyer une invitation."
        }), 
        variant: 'destructive' 
      });
      return;
    }
    setIsInviting(true);
    try {
      const { data: inviteData, error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail, {
        data: { 
          company_id_to_join_pending_confirmation: currentEnterpriseId,
        }
      });
      if (error) throw error;
      
      toast({ 
        title: t('success', { defaultValue: 'Succès' }), 
        description: t('userManagement.invitationSent', {
          defaultValue: `Invitation envoyée à ${inviteEmail}.`
        }) 
      });
      setInviteEmail('');
    } catch (error) {
      console.error('Error inviting user:', error);
      toast({ 
        title: t('error', { defaultValue: 'Erreur' }), 
        description: error.message || t('userManagement.invitationError', {
          defaultValue: "Échec de l'envoi de l'invitation."
        }), 
        variant: 'destructive' 
      });
    } finally {
      setIsInviting(false);
    }
  };
  
  const openAssignRoleDialog = useCallback((user) => {
    setSelectedUser(user);
    setSelectedRoleId(user.role_id || '');
    setIsUserRoleDialogOpen(true);
  }, []);

  const handleAssignRole = async () => {
    if (!permissions.canManageRolesCompany || !selectedUser || !selectedRoleId) {
       toast({ 
         title: t('userManagement.accessDenied', { defaultValue: 'Accès refusé' }), 
         description: t('userManagement.insufficientPermissions', { 
           defaultValue: 'Permissions insuffisantes' 
         }), 
         variant: 'destructive'
       });
       return;
    }
    setIsAssigningRole(true);
    try {
      const { error: updateError } = await supabase
        .from('user_companies')
        .update({ role_id: selectedRoleId })
        .eq('id', selectedUser.user_company_id);
      
      if (updateError) throw updateError;

      toast({ 
        title: t('success', { defaultValue: 'Succès' }), 
        description: t('userManagement.roleAssigned', { 
          defaultValue: 'Rôle assigné avec succès' 
        }) 
      });
      setIsUserRoleDialogOpen(false);
      fetchUsersAndRoles(); 
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({ 
        title: t('error', { defaultValue: 'Erreur' }), 
        description: error.message || t('userManagement.roleAssignError', {
          defaultValue: "Échec de l'assignation du rôle."
        }), 
        variant: 'destructive' 
      });
    } finally {
      setIsAssigningRole(false);
    }
  };

  // ✅ OPTIMISATION: Mémoriser les composants de chargement
  const LoadingComponent = useMemo(() => (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  ), []);

  const NoCompanyComponent = useMemo(() => (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex flex-col items-center justify-center h-full p-8 text-center"
    >
      <Building className="w-16 h-16 mb-4 text-muted-foreground" />
      <h2 className="text-2xl font-semibold mb-2">
        {t('userManagement.noCompanyTitle', { defaultValue: 'Aucune entreprise sélectionnée' })}
      </h2>
      <p className="text-muted-foreground">
        {t('userManagement.selectCompanyPrompt', {
          defaultValue: "Veuillez sélectionner une entreprise pour gérer les utilisateurs."
        })}
      </p>
    </motion.div>
  ), [t]);

  const NoPermissionComponent = useMemo(() => (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex flex-col items-center justify-center h-full p-8 text-center"
    >
      <Lock className="w-16 h-16 mb-4 text-destructive" />
      <h2 className="text-2xl font-semibold mb-2">
        {t('userManagement.accessDenied', { defaultValue: 'Accès refusé' })}
      </h2>
      <p className="text-muted-foreground">
        {t('userManagement.insufficientPermissions', { 
          defaultValue: 'Permissions insuffisantes' 
        })}
      </p>
    </motion.div>
  ), [t]);

  if (!currentEnterpriseId) {
    return NoCompanyComponent;
  }
  
  if (isLoading) {
    return LoadingComponent;
  }
  
  if (!permissions.canManageUsers && !permissions.canManageRolesCompany) {
     return NoPermissionComponent;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 md:p-8 space-y-8"
    >
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight gradient-text mb-2">
          {t('userManagement.title', {defaultValue: 'Gestion des Utilisateurs'})}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t('userManagement.description', {
            defaultValue: 'Gérez les utilisateurs, invitations et rôles au sein de votre entreprise.'
          })}
        </p>
      </header>

      {permissions.canManageUsers && (
        <Card className="shadow-lg border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <UserPlus /> {t('userManagement.inviteUserTitle', {defaultValue: 'Inviter un Nouvel Utilisateur'})}
            </CardTitle>
            <CardDescription>
              {t('userManagement.inviteUserDescription', {
                defaultValue: 'Envoyez un email d\'invitation pour ajouter un nouvel utilisateur à votre entreprise.'
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInviteUser} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-grow w-full sm:w-auto">
                <Label htmlFor="invite-email" className="sr-only">
                  {t('userManagement.emailAddress', { defaultValue: 'Adresse email' })}
                </Label>
                <Input 
                  id="invite-email" 
                  type="email" 
                  placeholder={t('userManagement.emailPlaceholder', {defaultValue: 'utilisateur@exemple.com'})} 
                  value={inviteEmail} 
                  onChange={(e) => setInviteEmail(e.target.value)} 
                  className="text-base"
                  disabled={isInviting}
                />
              </div>
              <Button 
                type="submit" 
                disabled={isInviting || !inviteEmail} 
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
              >
                {isInviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {t('userManagement.sendInvitation', {defaultValue: 'Envoyer l\'Invitation'})}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Users /> {t('userManagement.companyUsersTitle', {defaultValue: 'Utilisateurs de l\'Entreprise'})}
          </CardTitle>
          <CardDescription>
            {t('userManagement.companyUsersDescription', {
              defaultValue: 'Visualisez et gérez les utilisateurs actuellement dans votre entreprise.'
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 && !isLoading ? (
            <div className="text-center py-8">
              <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {t('userManagement.noUsersFound', {
                  defaultValue: 'Aucun utilisateur trouvé dans cette entreprise.'
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('userManagement.inviteFirstUser', {
                  defaultValue: 'Utilisez le formulaire ci-dessus pour inviter votre premier membre d\'équipe !'
                })}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('userManagement.userNameHeader', {defaultValue: 'Utilisateur'})}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('userManagement.emailAddress', { defaultValue: 'Adresse email' })}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('userManagement.assignedRole', { defaultValue: 'Rôle assigné' })}
                    </th>
                    {permissions.canManageRolesCompany && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('userManagement.actions', { defaultValue: 'Actions' })}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {user.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role_name === t('userManagement.noRoleAssigned', { defaultValue: 'Aucun rôle assigné' }) 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' 
                            : 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100'
                        }`}>
                          {user.role_name}
                        </span>
                      </td>
                      {permissions.canManageRolesCompany && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openAssignRoleDialog(user)} 
                            className="text-primary hover:text-primary/80"
                          >
                            <Edit className="mr-2 h-4 w-4" /> 
                            {t('userManagement.assignRole', { defaultValue: 'Assigner un rôle' })}
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isUserRoleDialogOpen} onOpenChange={setIsUserRoleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {t('userManagement.assignRoleToUser', { defaultValue: 'Assigner un rôle à l\'utilisateur' })} - {selectedUser?.full_name}
            </DialogTitle>
            <DialogDescription>
              {t('userManagement.selectRoleForUser', { 
                defaultValue: `Sélectionnez un nouveau rôle pour ${selectedUser?.email}.` 
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role-select" className="text-right col-span-1">
                {t('userManagement.selectRole', { defaultValue: 'Sélectionner un rôle' })}
              </Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId} disabled={isAssigningRole}>
                <SelectTrigger id="role-select" className="col-span-3">
                  <SelectValue placeholder={t('userManagement.selectRolePlaceholder', {
                    defaultValue: "Sélectionner un rôle"
                  })} />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name} {role.is_system_role ? `(${t('userManagement.systemRole', { defaultValue: 'Rôle système' })})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsUserRoleDialogOpen(false)} 
              disabled={isAssigningRole}
            >
              {t('userManagement.cancel', { defaultValue: 'Annuler' })}
            </Button>
            <Button onClick={handleAssignRole} disabled={isAssigningRole || !selectedRoleId}>
              {isAssigningRole ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('userManagement.saveChanges', { defaultValue: 'Enregistrer les modifications' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
};

export default UserManagementPage;