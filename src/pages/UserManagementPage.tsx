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

import { motion } from 'framer-motion';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { EmptyList } from '@/components/ui/EmptyState';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { Badge } from '@/components/ui/badge';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';



import { Textarea } from '@/components/ui/textarea';

import { useAuth } from '@/contexts/AuthContext';

import { useLocale } from '@/contexts/LocaleContext';

import { toastSuccess, toastCreated, toastUpdated, toastDeleted } from '@/lib/toast-helpers';

import {

  Users, UserPlus, Shield, Mail,

  Activity as ActivityIcon, Search, Edit, Trash2,

  CheckCircle, XCircle, Clock, AlertTriangle, Eye, EyeOff, Send,

  Crown, Star, User as UserIcon

} from 'lucide-react';

import { format } from 'date-fns';

import { fr } from 'date-fns/locale';

// TypeScript interfaces
interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
  level?: number;
  createdAt?: string;
  isSystemRole?: boolean;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string; // Supabase returns generic string
  role: Role;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
  companyId: string;
  invitedBy?: string;
  avatar?: string;
  department?: string;
  position?: string;
  lastLoginAt?: string;
}

interface Invitation {
  id: string;
  email: string;
  role: Role;
  status: string; // Supabase returns generic string
  createdAt: string;
  expiresAt: string;
  invitedBy: string;
}

interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details?: string;
  timestamp: string;
  ipAddress?: string;
  resource?: string;
  metadata?: Record<string, unknown>;
}

const UserManagementPage = () => {

  const { user: currentUser } = useAuth();

  const { t } = useLocale();



  // States

  const [activeTab, setActiveTab] = useState('users');

  const [users, setUsers] = useState<User[]>([]);

  const [roles, _setRoles] = useState<Role[]>([]);

  const [invitations, setInvitations] = useState<Invitation[]>([]);

  const [activities, _setActivities] = useState<Activity[]>([]);

  const [loading, _setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

  const [roleFilter, setRoleFilter] = useState('all');



  // Dialog states

  const [showUserDialog, setShowUserDialog] = useState(false);

  const [_showRoleDialog, _setShowRoleDialog] = useState(false);

  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [_selectedRole, _setSelectedRole] = useState<Role | null>(null);



  // Form states

  const [userForm, setUserForm] = useState({

    firstName: '',

    lastName: '',

    email: '',

    phoneNumber: '',

    department: '',

    position: '',

    roleId: '',

    status: 'active'

  });



  const [_roleForm, _setRoleForm] = useState({

    name: '',

    description: '',

    permissions: [],

    level: 3

  });



  const [inviteForm, setInviteForm] = useState({

    email: '',

    roleId: '',

    message: ''

  });



  // Data will come from real Supabase integration
  // TODO: Implement real user management with userService.ts



  // Filter functions

  const filteredUsers = users.filter(user => {

    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||

                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||

                         user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    const matchesRole = roleFilter === 'all' || user.role.id === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;

  });



  // Event handlers

  const handleUserSubmit = (e: React.FormEvent) => {

    e.preventDefault();

    const isEditing = !!selectedUser;



    if (isEditing) {

      setUsers(users.map(user =>

        user.id === selectedUser.id

          ? { ...user, ...userForm, updatedAt: new Date().toISOString() }

          : user

      ));

      toastUpdated('Informations de l\'utilisateur');

    } else {

      const newUser = {

        id: Date.now().toString(),

        ...userForm,

        role: roles.find(r => r.id === userForm.roleId),

        permissions: [],

        createdAt: new Date().toISOString(),

        updatedAt: new Date().toISOString(),

        companyId: 'comp-1',

        invitedBy: currentUser?.id

      };

      setUsers([...users, newUser]);

      toastCreated('L\'utilisateur');

    }



    setShowUserDialog(false);

    setSelectedUser(null);

    resetUserForm();

  };



  const handleInviteSubmit = (e: React.FormEvent) => {

    e.preventDefault();

    const newInvitation = {

      id: `inv-${  Date.now()}`,

      ...inviteForm,

      role: roles.find(r => r.id === inviteForm.roleId),

      invitedBy: currentUser?.id,

      companyId: 'comp-1',

      status: 'pending',

      token: `token-${  Date.now()}`,

      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),

      createdAt: new Date().toISOString()

    };



    setInvitations([...invitations, newInvitation]);

    toastSuccess(`Invitation envoyée à ${inviteForm.email}`);



    setShowInviteDialog(false);

    resetInviteForm();

  };



  const handleDeleteUser = () => {

    setUsers(users.filter(user => user.id !== selectedUser!.id));

    toastDeleted('L\'utilisateur');

    setShowDeleteDialog(false);

    setSelectedUser(null);

  };



  const handleToggleUserStatus = (userId: string) => {

    setUsers(users.map(user =>

      user.id === userId

        ? {

            ...user,

            status: user.status === 'active' ? 'inactive' : 'active',

            updatedAt: new Date().toISOString()

          }

        : user

    ));

  };



  const resetUserForm = () => {

    setUserForm({

      firstName: '',

      lastName: '',

      email: '',

      phoneNumber: '',

      department: '',

      position: '',

      roleId: '',

      status: 'active'

    });

  };



  const resetInviteForm = () => {

    setInviteForm({

      email: '',

      roleId: '',

      message: ''

    });

  };



  const openEditUser = (user: any) => {

    setSelectedUser(user);

    setUserForm({

      firstName: user.firstName,

      lastName: user.lastName,

      email: user.email,

      phoneNumber: user.phoneNumber || '',

      department: user.department || '',

      position: user.position || '',

      roleId: user.role.id,

      status: user.status

    });

    setShowUserDialog(true);

  };



  const openDeleteUser = (user: any) => {

    setSelectedUser(user);

    setShowDeleteDialog(true);

  };



  // Status badge component

  const StatusBadge = ({ status }) => {

    const configs = {

      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Actif' },

      inactive: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Inactif' },

      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'En attente' },

      suspended: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Suspendu' }

    };

    

    const config = configs[status] || configs.pending;

    const Icon = config.icon;

    

    return (

      <Badge className={`${config.color} flex items-center gap-1`}>

        <Icon className="h-3 w-3" />

        {config.label}

      </Badge>

    );

  };



  // Role badge component

  const RoleBadge = ({ role }) => {

    const roleIcons = {

      1: Crown,

      2: Star,

      3: UserIcon,

      4: Eye

    };

    

    const Icon = roleIcons[role.level] || UserIcon;

    const colors = {

      1: 'bg-purple-100 text-purple-800',

      2: 'bg-blue-100 text-blue-800',

      3: 'bg-green-100 text-green-800',

      4: 'bg-gray-100 text-gray-800'

    };

    

    return (

      <Badge className={`${colors[role.level]} flex items-center gap-1`}>

        <Icon className="h-3 w-3" />

        {role.name}

      </Badge>

    );

  };



  if (loading) {

    return (

      <div className="flex items-center justify-center min-h-screen">

        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>

      </div>

    );

  }



  return (

    <motion.div

      initial={{ opacity: 0, y: 20 }}

      animate={{ opacity: 1, y: 0 }}

      transition={{ duration: 0.5 }}

      className="container mx-auto p-4 md:p-8"

    >

      <div className="flex flex-col sm:flex-row justify-between items-start md:items-center mb-6">

        <div className="flex items-center gap-4">

          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 dark:text-gray-100">

            {t('userManagement.title', { defaultValue: 'Gestion des Utilisateurs' })}

          </h1>

          <Badge variant="outline" className="text-sm">

            {users.length} utilisateur{users.length > 1 ? 's' : ''}

          </Badge>

        </div>

        <div className="flex gap-2 mt-4 sm:mt-0">

          <Button onClick={() => setShowInviteDialog(true)} className="flex items-center">

            <Mail className="mr-2 h-4 w-4" />

            Inviter

          </Button>

          <Button onClick={() => {

            resetUserForm();

            setSelectedUser(null);

            setShowUserDialog(true);

          }} className="flex items-center">

            <UserPlus className="mr-2 h-4 w-4" />

            Nouveau

          </Button>

        </div>

      </div>



      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">

        <TabsList className="grid w-full grid-cols-4">

          <TabsTrigger value="users" className="flex items-center gap-2">

            <Users className="h-4 w-4" />

            Utilisateurs

          </TabsTrigger>

          <TabsTrigger value="roles" className="flex items-center gap-2">

            <Shield className="h-4 w-4" />

            Rôles

          </TabsTrigger>

          <TabsTrigger value="invitations" className="flex items-center gap-2">

            <Mail className="h-4 w-4" />

            Invitations

          </TabsTrigger>

          <TabsTrigger value="activity" className="flex items-center gap-2">

            <ActivityIcon className="h-4 w-4" />

            Activité

          </TabsTrigger>

        </TabsList>



        <TabsContent value="users" className="space-y-4">

          {/* Filters */}

          <Card>

            <CardContent className="pt-6">

              <div className="flex flex-col md:flex-row gap-4">

                <div className="flex-1">

                  <div className="relative">

                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />

                    <Input

                      placeholder="Rechercher un utilisateur..."

                      value={searchTerm}

                      onChange={(e) => setSearchTerm(e.target.value)}

                      className="pl-10"

                    />

                  </div>

                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>

                  <SelectTrigger className="w-full md:w-[180px]">

                    <SelectValue placeholder="Statut" />

                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="all">Tous les statuts</SelectItem>

                    <SelectItem value="active">Actif</SelectItem>

                    <SelectItem value="inactive">Inactif</SelectItem>

                    <SelectItem value="pending">En attente</SelectItem>

                    <SelectItem value="suspended">Suspendu</SelectItem>

                  </SelectContent>

                </Select>

                <Select value={roleFilter} onValueChange={setRoleFilter}>

                  <SelectTrigger className="w-full md:w-[180px]">

                    <SelectValue placeholder="Rôle" />

                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="all">Tous les rôles</SelectItem>

                    {roles.map(role => (

                      <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>

                    ))}

                  </SelectContent>

                </Select>

              </div>

            </CardContent>

          </Card>



          {/* Users Table */}

          <Card>

            <CardHeader>

              <CardTitle>Liste des Utilisateurs</CardTitle>

              <CardDescription>

                Gérez les utilisateurs de votre organisation

              </CardDescription>

            </CardHeader>

            <CardContent>

              <Table>

                <TableHeader>

                  <TableRow>

                    <TableHead>Utilisateur</TableHead>

                    <TableHead>Rôle</TableHead>

                    <TableHead>Département</TableHead>

                    <TableHead>Statut</TableHead>

                    <TableHead>Dernière connexion</TableHead>

                    <TableHead className="text-right">Actions</TableHead>

                  </TableRow>

                </TableHeader>

                <TableBody>

                  {filteredUsers.map((user) => (

                    <TableRow key={user.id}>

                      <TableCell className="flex items-center space-x-3">

                        <Avatar>

                          <AvatarImage src={user.avatar} />

                          <AvatarFallback>

                            {user.firstName[0]}{user.lastName[0]}

                          </AvatarFallback>

                        </Avatar>

                        <div>

                          <div className="font-medium">

                            {user.firstName} {user.lastName}

                          </div>

                          <div className="text-sm text-gray-500 dark:text-gray-300">

                            {user.email}

                          </div>

                        </div>

                      </TableCell>

                      <TableCell>

                        <RoleBadge role={user.role} />

                      </TableCell>

                      <TableCell>

                        <div>

                          <div className="font-medium">{user.department}</div>

                          <div className="text-sm text-gray-500 dark:text-gray-300">{user.position}</div>

                        </div>

                      </TableCell>

                      <TableCell>

                        <StatusBadge status={user.status} />

                      </TableCell>

                      <TableCell>

                        {user.lastLoginAt ? (

                          <div className="text-sm">

                            {format(new Date(user.lastLoginAt), 'dd/MM/yyyy HH:mm', { locale: fr })}

                          </div>

                        ) : (

                          <span className="text-gray-400 dark:text-gray-500">Jamais</span>

                        )}

                      </TableCell>

                      <TableCell className="text-right">

                        <div className="flex items-center justify-end gap-2">

                          <Button

                            variant="ghost"

                            size="sm"

                            onClick={() => handleToggleUserStatus(user.id)}

                          >

                            {user.status === 'active' ? (

                              <EyeOff className="h-4 w-4" />

                            ) : (

                              <Eye className="h-4 w-4" />

                            )}

                          </Button>

                          <Button

                            variant="ghost"

                            size="sm"

                            onClick={() => openEditUser(user)}

                          >

                            <Edit className="h-4 w-4" />

                          </Button>

                          <Button

                            variant="ghost"

                            size="sm"

                            onClick={() => openDeleteUser(user)}

                            className="text-red-600 hover:text-red-900 dark:text-red-400"

                          >

                            <Trash2 className="h-4 w-4" />

                          </Button>

                        </div>

                      </TableCell>

                    </TableRow>

                  ))}

                </TableBody>

              </Table>

              {filteredUsers.length === 0 && (

                <div className="mt-6">

                  <EmptyList

                    icon={Users}

                    title="Aucun utilisateur trouvé"

                    description="Aucun utilisateur ne correspond aux critères de recherche."

                    action={{

                      label: 'Ajouter un utilisateur',

                      onClick: () => setShowUserDialog(true)

                    }}

                  />

                </div>

              )}

            </CardContent>

          </Card>

        </TabsContent>



        <TabsContent value="roles" className="space-y-4">

          <Card>

            <CardHeader>

              <CardTitle>Rôles et Permissions</CardTitle>

              <CardDescription>

                Configurez les rôles et leurs permissions

              </CardDescription>

            </CardHeader>

            <CardContent>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                {roles.map((role) => (

                  <Card key={role.id} className="relative">

                    <CardHeader>

                      <div className="flex items-center justify-between">

                        <RoleBadge role={role} />

                        {role.isSystemRole && (

                          <Badge variant="outline" className="text-xs">

                            Système

                          </Badge>

                        )}

                      </div>

                      <CardTitle className="text-lg">{role.name}</CardTitle>

                      <CardDescription>{role.description}</CardDescription>

                    </CardHeader>

                    <CardContent>

                      <div className="text-sm text-gray-600 dark:text-gray-300">

                        <strong>Permissions:</strong>

                        <div className="mt-2 flex flex-wrap gap-1">

                          {(role.permissions ?? []).slice(0, 3).map((permission, index) => (

                            <Badge key={index} variant="secondary" className="text-xs">

                              {permission}

                            </Badge>

                          ))}

                          {(role.permissions ?? []).length > 3 && (

                            <Badge variant="secondary" className="text-xs">

                              +{(role.permissions ?? []).length - 3} autres

                            </Badge>

                          )}

                        </div>

                      </div>

                    </CardContent>

                  </Card>

                ))}

              </div>

            </CardContent>

          </Card>

        </TabsContent>



        <TabsContent value="invitations" className="space-y-4">

          <Card>

            <CardHeader>

              <CardTitle>Invitations en cours</CardTitle>

              <CardDescription>

                Suivez le statut des invitations envoyées

              </CardDescription>

            </CardHeader>

            <CardContent>

              <Table>

                <TableHeader>

                  <TableRow>

                    <TableHead>Email</TableHead>

                    <TableHead>Rôle</TableHead>

                    <TableHead>Invité par</TableHead>

                    <TableHead>Statut</TableHead>

                    <TableHead>Expire le</TableHead>

                    <TableHead className="text-right">Actions</TableHead>

                  </TableRow>

                </TableHeader>

                <TableBody>

                  {invitations.map((invitation) => {

                    const inviter = users.find(u => u.id === invitation.invitedBy);

                    return (

                      <TableRow key={invitation.id}>

                        <TableCell className="font-medium">

                          {invitation.email}

                        </TableCell>

                        <TableCell>

                          <RoleBadge role={invitation.role} />

                        </TableCell>

                        <TableCell>

                          {inviter ? `${inviter.firstName} ${inviter.lastName}` : 'Inconnu'}

                        </TableCell>

                        <TableCell>

                          <StatusBadge status={invitation.status} />

                        </TableCell>

                        <TableCell>

                          {format(new Date(invitation.expiresAt), 'dd/MM/yyyy', { locale: fr })}

                        </TableCell>

                        <TableCell className="text-right">

                          <Button variant="ghost" size="sm">

                            <Send className="h-4 w-4" />

                          </Button>

                        </TableCell>

                      </TableRow>

                    );

                  })}

                </TableBody>

              </Table>

            </CardContent>

          </Card>

        </TabsContent>



        <TabsContent value="activity" className="space-y-4">

          <Card>

            <CardHeader>

              <CardTitle>Journal d'Activité</CardTitle>

              <CardDescription>

                Suivez les actions des utilisateurs

              </CardDescription>

            </CardHeader>

            <CardContent>

              <div className="space-y-4">

                {activities.map((activity) => {

                  const user = users.find(u => u.id === activity.userId);

                  return (

                    <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg">

                      <Avatar className="h-8 w-8">

                        <AvatarImage src={user?.avatar} />

                        <AvatarFallback>

                          {user?.firstName?.[0]}{user?.lastName?.[0]}

                        </AvatarFallback>

                      </Avatar>

                      <div className="flex-1 min-w-0">

                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">

                          {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur inconnu'}

                        </div>

                        <div className="text-sm text-gray-500 dark:text-gray-300">

                          {activity.action} sur {activity.resource}

                          {activity.metadata && (

                            <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded dark:bg-gray-900/50">

                              {JSON.stringify(activity.metadata, null, 0)}

                            </span>

                          )}

                        </div>

                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">

                          {format(new Date(activity.timestamp), 'dd/MM/yyyy HH:mm', { locale: fr })}

                          {' • '}

                          {activity.ipAddress}

                        </div>

                      </div>

                    </div>

                  );

                })}

              </div>

            </CardContent>

          </Card>

        </TabsContent>

      </Tabs>



      {/* User Dialog */}

      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>

        <DialogContent className="sm:max-w-[600px]">

          <DialogHeader>

            <DialogTitle>

              {selectedUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}

            </DialogTitle>

            <DialogDescription>

              {selectedUser ? 'Modifiez les informations de l\'utilisateur' : 'Créez un nouvel utilisateur dans votre organisation'}

            </DialogDescription>

          </DialogHeader>

          <form onSubmit={handleUserSubmit} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">

              <div>

                <Label htmlFor="firstName">Prénom</Label>

                <Input

                  id="firstName"

                  value={userForm.firstName}

                  onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}

                  required

                />

              </div>

              <div>

                <Label htmlFor="lastName">Nom</Label>

                <Input

                  id="lastName"

                  value={userForm.lastName}

                  onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}

                  required

                />

              </div>

            </div>

            <div>

              <Label htmlFor="email">Email</Label>

              <Input

                id="email"

                type="email"

                value={userForm.email}

                onChange={(e) => setUserForm({...userForm, email: e.target.value})}

                required

              />

            </div>

            <div>

              <Label htmlFor="phoneNumber">Téléphone</Label>

              <Input

                id="phoneNumber"

                value={userForm.phoneNumber}

                onChange={(e) => setUserForm({...userForm, phoneNumber: e.target.value})}

              />

            </div>

            <div className="grid grid-cols-2 gap-4">

              <div>

                <Label htmlFor="department">Département</Label>

                <Input

                  id="department"

                  value={userForm.department}

                  onChange={(e) => setUserForm({...userForm, department: e.target.value})}

                />

              </div>

              <div>

                <Label htmlFor="position">Poste</Label>

                <Input

                  id="position"

                  value={userForm.position}

                  onChange={(e) => setUserForm({...userForm, position: e.target.value})}

                />

              </div>

            </div>

            <div className="grid grid-cols-2 gap-4">

              <div>

                <Label htmlFor="roleId">Rôle</Label>

                <Select value={userForm.roleId} onValueChange={(value) => setUserForm({...userForm, roleId: value})}>

                  <SelectTrigger>

                    <SelectValue placeholder="Sélectionner un rôle" />

                  </SelectTrigger>

                  <SelectContent>

                    {roles.map(role => (

                      <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>

                    ))}

                  </SelectContent>

                </Select>

              </div>

              <div>

                <Label htmlFor="status">Statut</Label>

                <Select value={userForm.status} onValueChange={(value) => setUserForm({...userForm, status: value})}>

                  <SelectTrigger>

                    <SelectValue />

                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="active">Actif</SelectItem>

                    <SelectItem value="inactive">Inactif</SelectItem>

                    <SelectItem value="pending">En attente</SelectItem>

                    <SelectItem value="suspended">Suspendu</SelectItem>

                  </SelectContent>

                </Select>

              </div>

            </div>

            <DialogFooter>

              <Button type="button" variant="outline" onClick={() => setShowUserDialog(false)}>

                Annuler

              </Button>

              <Button type="submit">

                {selectedUser ? 'Modifier' : 'Créer'}

              </Button>

            </DialogFooter>

          </form>

        </DialogContent>

      </Dialog>



      {/* Invite Dialog */}

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>

        <DialogContent className="sm:max-w-[500px]">

          <DialogHeader>

            <DialogTitle>Inviter un utilisateur</DialogTitle>

            <DialogDescription>

              Envoyez une invitation par email à un nouvel utilisateur

            </DialogDescription>

          </DialogHeader>

          <form onSubmit={handleInviteSubmit} className="space-y-4">

            <div>

              <Label htmlFor="inviteEmail">Adresse email</Label>

              <Input

                id="inviteEmail"

                type="email"

                value={inviteForm.email}

                onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}

                placeholder="utilisateur@example.com"

                required

              />

            </div>

            <div>

              <Label htmlFor="inviteRole">Rôle</Label>

              <Select value={inviteForm.roleId} onValueChange={(value) => setInviteForm({...inviteForm, roleId: value})}>

                <SelectTrigger>

                  <SelectValue placeholder="Sélectionner un rôle" />

                </SelectTrigger>

                <SelectContent>

                  {roles.map(role => (

                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>

                  ))}

                </SelectContent>

              </Select>

            </div>

            <div>

              <Label htmlFor="inviteMessage">Message personnalisé (optionnel)</Label>

              <Textarea

                id="inviteMessage"

                value={inviteForm.message}

                onChange={(e) => setInviteForm({...inviteForm, message: e.target.value})}

                placeholder="Bienvenue dans notre équipe..."

                rows={3}

              />

            </div>

            <DialogFooter>

              <Button type="button" variant="outline" onClick={() => setShowInviteDialog(false)}>

                Annuler

              </Button>

              <Button type="submit">

                <Send className="mr-2 h-4 w-4" />

                Envoyer l'invitation

              </Button>

            </DialogFooter>

          </form>

        </DialogContent>

      </Dialog>



      {/* Delete Confirmation Dialog */}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>

        <AlertDialogContent>

          <AlertDialogHeader>

            <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>

            <AlertDialogDescription>

              Êtes-vous sûr de vouloir supprimer {selectedUser?.firstName} {selectedUser?.lastName} ?

              Cette action est irréversible.

            </AlertDialogDescription>

          </AlertDialogHeader>

          <AlertDialogFooter>

            <AlertDialogCancel>Annuler</AlertDialogCancel>

            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">

              Supprimer

            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>

      </AlertDialog>

    </motion.div>

  );

};



export default UserManagementPage;
