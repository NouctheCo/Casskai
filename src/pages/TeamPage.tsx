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
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { useTeam } from '@/hooks/useTeam';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  UserPlus,
  MoreVertical,
  Mail,
  Users,
  CreditCard,
  AlertCircle,
  Crown,
  Shield,
  User,
  Eye,
  Clock,
  X,
  RefreshCw
} from 'lucide-react';
import { TeamMember, InviteData } from '@/services/teamService';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function TeamPage() {
  const { t } = useTranslation();
  const { ConfirmDialog: ConfirmDialogComponent, confirm } = useConfirmDialog();
  const {
    members,
    invitations,
    modules,
    seats,
    seatPrice,
    loading,
    error,
    canInvite,
    sendInvitation,
    cancelInvitation,
    resendInvitation,
    updateMember: _updateMember,
    removeMember
  } = useTeam();

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'member' | 'viewer'>('member');
  const [inviteModules, setInviteModules] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'manager':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'member':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'manager':
        return <Users className="h-4 w-4" />;
      case 'member':
        return <User className="h-4 w-4" />;
      case 'viewer':
        return <Eye className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    setInviting(true);

    const inviteData: InviteData = {
      email: inviteEmail.trim(),
      role: inviteRole,
      allowed_modules: inviteModules
    };

    const result = await sendInvitation(inviteData);

    if (result.success) {
      setShowInviteDialog(false);
      setInviteEmail('');
      setInviteRole('member');
      setInviteModules([]);
    }

    setInviting(false);
  };

  const toggleModule = (moduleKey: string) => {
    if (inviteModules.includes(moduleKey)) {
      setInviteModules(inviteModules.filter(m => m !== moduleKey));
    } else {
      setInviteModules([...inviteModules, moduleKey]);
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    const confirmed = await confirm({
      title: t('common.confirmation', 'Confirmation'),
      description: t('team.confirm_remove', { name: member.display_name || member.email }),
      confirmText: t('common.delete', 'Supprimer'),
      cancelText: t('common.cancel', 'Annuler'),
      variant: 'destructive',
    });

    if (!confirmed) return;
    await removeMember(member.id);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>

        <ConfirmDialogComponent />
          <h1 className="text-3xl font-bold">{t('team.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('team.description')}
          </p>
        </div>
        <Button
          onClick={() => setShowInviteDialog(true)}
          disabled={!canInvite}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          {t('team.invite')}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Seats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('team.seats')}
          </CardTitle>
          <CardDescription>{t('team.seats_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">
                {seats.seats_used} / {seats.seats}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('team.seats_available', { count: seats.seats_available })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold text-blue-600">
                <CurrencyAmount amount={seatPrice} />/{t('common.month')}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('team.cost_per_additional_seat')}
              </p>
            </div>
          </div>
          {seats.seats_available === 0 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('team.no_seats_upgrade')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('team.members')} ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map(member => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <Avatar>
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback>
                      {member.display_name?.charAt(0)?.toUpperCase() || member.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{member.display_name || member.email}</p>
                      <Badge className={`${getRoleBadgeColor(member.role)} gap-1`}>
                        {getRoleIcon(member.role)}
                        {t(`team.roles.${member.role}`)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {member.email}
                    </p>
                    {member.allowed_modules && member.allowed_modules.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {member.allowed_modules.slice(0, 3).map(mod => (
                          <Badge key={mod} variant="outline" className="text-xs">
                            {modules.find(m => m.key === mod)?.name || mod}
                          </Badge>
                        ))}
                        {member.allowed_modules.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{member.allowed_modules.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {member.role !== 'owner' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleRemoveMember(member)}>
                        <X className="h-4 w-4 mr-2" />
                        {t('team.remove_member')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('team.pending_invitations')} ({invitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map(invitation => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getRoleBadgeColor(invitation.role)}>
                          {t(`team.roles.${invitation.role}`)}
                        </Badge>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('team.expires')}: {new Date(invitation.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resendInvitation(invitation.id)}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      {t('team.resend')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelInvitation(invitation.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      {t('team.cancel')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('team.invite_member')}</DialogTitle>
            <DialogDescription>
              {t('team.invite_description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('common.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">{t('team.role')}</Label>
              <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t('team.roles.admin')}</SelectItem>
                  <SelectItem value="manager">{t('team.roles.manager')}</SelectItem>
                  <SelectItem value="member">{t('team.roles.member')}</SelectItem>
                  <SelectItem value="viewer">{t('team.roles.viewer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(inviteRole === 'manager' || inviteRole === 'member') && (
              <div className="space-y-2">
                <Label>{t('team.allowed_modules')}</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  {modules.map(module => (
                    <div key={module.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={module.key}
                        checked={inviteModules.includes(module.key)}
                        onCheckedChange={() => toggleModule(module.key)}
                      />
                      <label
                        htmlFor={module.key}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {module.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Alert>
              <CreditCard className="h-4 w-4" />
              <AlertDescription>
                {t('team.cost_preview', { price: seatPrice })}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
              {inviting ? t('common.loading') : t('team.send_invitation')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

