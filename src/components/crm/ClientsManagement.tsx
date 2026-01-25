import React, { useState } from 'react';
import { Client, Contact, ClientFormData, ContactFormData, CrmFilters } from '../../types/crm.types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Phone, 
  Mail, 
  Globe, 
  MapPin,
  User,
  Building,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import { getCurrentCompanyCurrency } from '@/lib/utils';
interface ClientsManagementProps {
  clients: Client[];
  contacts?: Contact[];
  loading?: boolean;
  onCreateClient?: ((data: ClientFormData) => Promise<void>) | (() => void);
  onUpdateClient?: (id: string, data: ClientFormData) => Promise<void>;
  onDeleteClient?: (id: string) => Promise<void>;
  onCreateContact?: (data: ContactFormData) => Promise<void>;
  onFiltersChange?: (filters: CrmFilters) => void;
  filters?: CrmFilters;
}
const ClientsManagement: React.FC<ClientsManagementProps> = ({
  clients,
  contacts,
  loading: _loading,
  onCreateClient,
  onUpdateClient,
  onDeleteClient,
  onCreateContact,
  onFiltersChange,
  filters
}) => {
  const { t } = useTranslation();
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [_selectedClientForContact, setSelectedClientForContact] = useState<string>('');
  const [viewMode, setViewMode] = useState<'clients' | 'contacts'>('clients');
  const [clientFormData, setClientFormData] = useState<ClientFormData>({
    company_name: '',
    industry: '',
    size: 'medium',
    address: '',
    city: '',
    postal_code: '',
    country: 'France',
    website: '',
    notes: '',
    status: 'prospect'
  });
  const [contactFormData, setContactFormData] = React.useState<ContactFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    client_id: ''
  });
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: getCurrentCompanyCurrency()
    }).format(amount);
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };
  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-300',
      prospect: 'bg-blue-100 text-blue-800 border-blue-300',
      inactive: 'bg-gray-100 text-gray-800 border-gray-300',
      lost: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
  };
  const getSizeColor = (size: string) => {
    const colors = {
      small: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      medium: 'bg-blue-100 text-blue-800 border-blue-300',
      large: 'bg-purple-100 text-purple-800 border-purple-300'
    };
    return colors[size as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
  };
  const handleFilterChange = (key: keyof CrmFilters, value: string) => {
    onFiltersChange?.({
      ...filters,
      [key]: value || undefined
    });
  };
  const handleCreateClient = () => {
    setEditingClient(null);
    setClientFormData({
      company_name: '',
      industry: '',
      size: 'medium',
      address: '',
      city: '',
      postal_code: '',
      country: 'France',
      website: '',
      notes: '',
      status: 'prospect'
    });
    setIsClientFormOpen(true);
  };
  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setClientFormData({
      company_name: client.company_name,
      industry: client.industry || '',
      size: client.size || 'medium',
      address: client.address || '',
      city: client.city || '',
      postal_code: client.postal_code || '',
      country: client.country || 'France',
      website: client.website || '',
      notes: client.notes || '',
      status: client.status
    });
    setIsClientFormOpen(true);
  };
  const handleClientFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await onUpdateClient?.(editingClient.id, clientFormData);
      } else {
        await onCreateClient?.(clientFormData);
      }
      setIsClientFormOpen(false);
      setEditingClient(null);
    } catch (error) {
      logger.error('ClientsManagement', 'Error submitting client form:', error instanceof Error ? error.message : String(error));
    }
  };
  const handleCreateContact = (clientId?: string) => {
    setSelectedClientForContact(clientId || '');
    setContactFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      client_id: clientId || ''
    });
    setIsContactFormOpen(true);
  };
  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onCreateContact?.(contactFormData);
      setIsContactFormOpen(false);
    } catch (error) {
      logger.error('ClientsManagement', 'Error submitting contact form:', error instanceof Error ? error.message : String(error));
    }
  };
  const getClientContacts = (clientId: string) => {
    return (contacts || []).filter(contact => contact.client_id === clientId);
  };
  const hasActiveFilters = Object.values(filters || {}).some(value => value && value !== 'all');
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users className="w-6 h-6" />
            {t('crm.clientsManagement.title')}
          </h2>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'clients' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('clients')}
            >
              {t('crm.clientsManagement.clients')}
            </Button>
            <Button
              variant={viewMode === 'contacts' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('contacts')}
            >
              {t('crm.clientsManagement.contacts')}
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleCreateContact()}
          >
            <User className="w-4 h-4 mr-2" />
            {t('crm.clientsManagement.addContact')}
          </Button>
          <Button onClick={handleCreateClient}>
            <Plus className="w-4 h-4 mr-2" />
            {t('crm.clientsManagement.addClient')}
          </Button>
        </div>
      </div>
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-300" />
              <h3 className="font-medium text-gray-900 dark:text-gray-100">{t('crm.filters.title')}</h3>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFiltersChange?.({})}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
              >
                <X className="w-4 h-4" />
                {t('crm.filters.clear')}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">{t('crm.filters.search')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <Input
                  id="search"
                  placeholder={t('crm.filters.searchPlaceholder')}
                  value={filters?.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {/* Status Filter */}
            <div className="space-y-2">
              <Label>{t('crm.filters.status')}</Label>
              <Select
                value={filters?.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('crm.filters.allStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('crm.filters.allStatuses')}</SelectItem>
                  <SelectItem value="active">{t('crm.clientStatus.active')}</SelectItem>
                  <SelectItem value="prospect">{t('crm.clientStatus.prospect')}</SelectItem>
                  <SelectItem value="inactive">{t('crm.clientStatus.inactive')}</SelectItem>
                  <SelectItem value="lost">{t('crm.clientStatus.lost')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Industry Filter */}
            <div className="space-y-2">
              <Label>{t('crm.filters.industry')}</Label>
              <Select
                value={filters?.industry || 'all'}
                onValueChange={(value) => handleFilterChange('industry', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('crm.filters.allIndustries')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('crm.filters.allIndustries')}</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Energy">Energy</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Size Filter */}
            <div className="space-y-2">
              <Label>{t('crm.filters.size')}</Label>
              <Select
                value={filters?.size || 'all'}
                onValueChange={(value) => handleFilterChange('size', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('crm.filters.allSizes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('crm.filters.allSizes')}</SelectItem>
                  <SelectItem value="small">{t('crm.clientSize.small')}</SelectItem>
                  <SelectItem value="medium">{t('crm.clientSize.medium')}</SelectItem>
                  <SelectItem value="large">{t('crm.clientSize.large')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Clients Table */}
      {viewMode === 'clients' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('crm.clientsTable.company')}</TableHead>
                    <TableHead>{t('crm.clientsTable.industry')}</TableHead>
                    <TableHead>{t('crm.clientsTable.size')}</TableHead>
                    <TableHead>{t('crm.clientsTable.status')}</TableHead>
                    <TableHead>{t('crm.clientsTable.location')}</TableHead>
                    <TableHead>{t('crm.clientsTable.contacts')}</TableHead>
                    <TableHead className="text-right">{t('crm.clientsTable.revenue')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => {
                    const clientContacts = getClientContacts(client.id);
                    return (
                      <TableRow key={client.id} className="hover:bg-gray-50 dark:bg-gray-900/30">
                        <TableCell>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              <Building className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                              {client.company_name}
                            </div>
                            {client.website && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-300 mt-1">
                                <Globe className="w-3 h-3" />
                                <a href={client.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                                  {client.website}
                                </a>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-300">{client.industry || '-'}</span>
                        </TableCell>
                        <TableCell>
                          {client.size && (
                            <Badge variant="outline" className={getSizeColor(client.size)}>
                              {t(`crm.clientSize.${client.size}`)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(client.status)}>
                            {t(`crm.clientStatus.${client.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {client.city && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                              <MapPin className="w-3 h-3" />
                              {client.city}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{clientContacts.length}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCreateContact(client.id)}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-medium">
                            {formatCurrency(client.total_revenue || 0)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClient(client)}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDeleteClient?.(client.id)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Contacts Table */}
      {viewMode === 'contacts' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('crm.contactsTable.name')}</TableHead>
                    <TableHead>{t('crm.contactsTable.company')}</TableHead>
                    <TableHead>{t('crm.contactsTable.position')}</TableHead>
                    <TableHead>{t('crm.contactsTable.email')}</TableHead>
                    <TableHead>{t('crm.contactsTable.phone')}</TableHead>
                    <TableHead>{t('crm.contactsTable.created')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(contacts || []).map((contact) => {
                    const client = clients.find(c => c.id === contact.client_id);
                    return (
                      <TableRow key={contact.id} className="hover:bg-gray-50 dark:bg-gray-900/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className="font-medium">
                              {contact.first_name} {contact.last_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-300">{client?.company_name || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-300">{contact.position || '-'}</span>
                        </TableCell>
                        <TableCell>
                          {contact.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                              <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                                {contact.email}
                              </a>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">{contact.phone}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-300">{formatDate(contact.created_at)}</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Client Form Dialog */}
      <Dialog open={isClientFormOpen} onOpenChange={setIsClientFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? t('crm.clientForm.editTitle') : t('crm.clientForm.createTitle')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleClientFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">{t('crm.clientForm.companyName')} *</Label>
                <Input
                  id="company_name"
                  value={clientFormData.company_name}
                  onChange={(e) => setClientFormData({ ...clientFormData, company_name: e.target.value })}
                  placeholder={t('crm.clientForm.companyNamePlaceholder')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">{t('crm.clientForm.industry')}</Label>
                <Input
                  id="industry"
                  value={clientFormData.industry}
                  onChange={(e) => setClientFormData({...clientFormData, industry: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('crm.clientForm.size')}</Label>
                <Select
                  value={clientFormData.size}
                  onValueChange={(value: any) => setClientFormData({...clientFormData, size: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">{t('crm.clientSize.small')}</SelectItem>
                    <SelectItem value="medium">{t('crm.clientSize.medium')}</SelectItem>
                    <SelectItem value="large">{t('crm.clientSize.large')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('crm.clientForm.status')}</Label>
                <Select
                  value={clientFormData.status}
                  onValueChange={(value: any) => setClientFormData({...clientFormData, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">{t('crm.clientStatus.prospect')}</SelectItem>
                    <SelectItem value="active">{t('crm.clientStatus.active')}</SelectItem>
                    <SelectItem value="inactive">{t('crm.clientStatus.inactive')}</SelectItem>
                    <SelectItem value="lost">{t('crm.clientStatus.lost')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{t('crm.clientForm.city')}</Label>
                <Input
                  id="city"
                  value={clientFormData.city}
                  onChange={(e) => setClientFormData({...clientFormData, city: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">{t('crm.clientForm.website')}</Label>
                <Input
                  id="website"
                  type="url"
                  value={clientFormData.website}
                  onChange={(e) => setClientFormData({...clientFormData, website: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{t('crm.clientForm.address')}</Label>
              <Input
                id="address"
                value={clientFormData.address}
                onChange={(e) => setClientFormData({...clientFormData, address: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('crm.clientForm.notes')}</Label>
              <Textarea
                id="notes"
                rows={3}
                value={clientFormData.notes}
                onChange={(e) => setClientFormData({...clientFormData, notes: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsClientFormOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                {editingClient ? t('common.update') : t('common.create')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Contact Form Dialog */}
      <Dialog open={isContactFormOpen} onOpenChange={setIsContactFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('crm.contactForm.createTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleContactFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">{t('crm.contactForm.firstName')} *</Label>
                <Input
                  id="first_name"
                  value={contactFormData.first_name}
                  onChange={(e) => setContactFormData({...contactFormData, first_name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">{t('crm.contactForm.lastName')} *</Label>
                <Input
                  id="last_name"
                  value={contactFormData.last_name}
                  onChange={(e) => setContactFormData({...contactFormData, last_name: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('crm.contactForm.email')} *</Label>
              <Input
                id="email"
                type="email"
                value={contactFormData.email}
                onChange={(e) => setContactFormData({...contactFormData, email: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('crm.contactForm.phone')}</Label>
              <Input
                id="phone"
                type="tel"
                value={contactFormData.phone}
                onChange={(e) => setContactFormData({...contactFormData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">{t('crm.contactForm.position')}</Label>
              <Input
                id="position"
                value={contactFormData.position}
                onChange={(e) => setContactFormData({...contactFormData, position: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('crm.contactForm.client')}</Label>
              <Select
                value={contactFormData.client_id}
                onValueChange={(value) => setContactFormData({...contactFormData, client_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('crm.contactForm.selectClient')} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsContactFormOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                {t('common.create')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default ClientsManagement;