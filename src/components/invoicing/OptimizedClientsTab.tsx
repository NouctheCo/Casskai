import React, { useState, useEffect } from 'react';

import { motion } from 'framer-motion';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Badge } from '@/components/ui/badge';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

import { Textarea } from '@/components/ui/textarea';

import { useToast } from '@/components/ui/use-toast';

import { useAuth } from '@/contexts/AuthContext';

import { unifiedThirdPartiesService } from '@/services/unifiedThirdPartiesService';

import { 

  Plus,

  Search,

  Edit,

  Trash2,

  Eye,

  Users,

  Building,

  Mail,

  Phone,

  MapPin,

  Euro,

  FileText,

  CheckCircle

} from 'lucide-react';



// Client Form Dialog Component

const ClientFormDialog = ({ open, onClose, client = null, onSave }) => {

  const { toast } = useToast();

  const [formData, setFormData] = useState({

    name: client?.name || '',

    email: client?.email || '',

    phone: client?.phone || '',

    company: client?.company || '',

    address: client?.address || '',

    city: client?.city || '',

    postalCode: client?.postalCode || '',

    country: client?.country || 'France',

    notes: client?.notes || ''

  });



  const handleSave = () => {

    if (!formData.name || !formData.email) {

      toast({

        title: "Champs requis",

        description: "Le nom et l'email sont obligatoires.",

        variant: "destructive"

      });

      return;

    }



    onSave({

      ...formData,

      id: client?.id || Date.now(),

      createdAt: client?.createdAt || new Date().toISOString(),

      invoicesCount: client?.invoicesCount || 0,

      totalAmount: client?.totalAmount || 0

    });



    toast({

      title: client ? "Client modifié" : "Client créé",

      description: "Le client a été enregistré avec succès."

    });



    onClose();

  };



  return (

    <Dialog open={open} onOpenChange={onClose}>

      <DialogContent className="max-w-2xl">

        <DialogHeader>

          <DialogTitle className="flex items-center space-x-2">

            <Users className="w-5 h-5 text-blue-500" />

            <span>{client ? 'Modifier le client' : 'Nouveau client'}</span>

          </DialogTitle>

        </DialogHeader>



        <div className="space-y-6">

          {/* Basic Information */}

          <div className="grid md:grid-cols-2 gap-4">

            <div className="space-y-2">

              <Label htmlFor="name">Nom *</Label>

              <Input

                id="name"

                placeholder="Nom du client"

                value={formData.name}

                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}

              />

            </div>

            <div className="space-y-2">

              <Label htmlFor="company">Entreprise</Label>

              <Input

                id="company"

                placeholder="Nom de l'entreprise"

                value={formData.company}

                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}

              />

            </div>

          </div>



          {/* Contact Information */}

          <div className="grid md:grid-cols-2 gap-4">

            <div className="space-y-2">

              <Label htmlFor="email">Email *</Label>

              <Input

                id="email"

                type="email"

                placeholder="client@example.com"

                value={formData.email}

                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}

              />

            </div>

            <div className="space-y-2">

              <Label htmlFor="phone">Téléphone</Label>

              <Input

                id="phone"

                placeholder="01 23 45 67 89"

                value={formData.phone}

                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}

              />

            </div>

          </div>



          {/* Address */}

          <div className="space-y-4">

            <div className="space-y-2">

              <Label htmlFor="address">Adresse</Label>

              <Input

                id="address"

                placeholder="123 Rue de la Paix"

                value={formData.address}

                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}

              />

            </div>

            <div className="grid md:grid-cols-3 gap-4">

              <div className="space-y-2">

                <Label htmlFor="city">Ville</Label>

                <Input

                  id="city"

                  placeholder="Paris"

                  value={formData.city}

                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}

                />

              </div>

              <div className="space-y-2">

                <Label htmlFor="postalCode">Code postal</Label>

                <Input

                  id="postalCode"

                  placeholder="75001"

                  value={formData.postalCode}

                  onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}

                />

              </div>

              <div className="space-y-2">

                <Label htmlFor="country">Pays</Label>

                <Input

                  id="country"

                  placeholder="France"

                  value={formData.country}

                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}

                />

              </div>

            </div>

          </div>



          {/* Notes */}

          <div className="space-y-2">

            <Label htmlFor="notes">Notes</Label>

            <Textarea

              id="notes"

              placeholder="Notes sur le client..."

              value={formData.notes}

              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}

            />

          </div>

        </div>



        <DialogFooter>

          <Button variant="outline" onClick={onClose}>

            Annuler

          </Button>

          <Button onClick={handleSave}>

            <CheckCircle className="w-4 h-4 mr-2" />

            {client ? 'Modifier' : 'Créer'}

          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>

  );

};



// Client Preview Dialog Component

const ClientPreviewDialog = ({ open, onClose, client }) => {

  if (!client) return null;



  return (

    <Dialog open={open} onOpenChange={onClose}>

      <DialogContent className="max-w-2xl">

        <DialogHeader>

          <DialogTitle className="flex items-center space-x-3">

            <Users className="w-5 h-5 text-blue-500" />

            <span>Profil client - {client.name}</span>

          </DialogTitle>

        </DialogHeader>



        <div className="space-y-6">

          {/* Client Header */}

          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">

            <div>

              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">Nom complet</Label>

              <p className="text-lg font-semibold">{client.name}</p>

            </div>

            <div>

              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">Entreprise</Label>

              <p className="text-base">{client.company || 'N/A'}</p>

            </div>

          </div>



          {/* Contact Information */}

          <div className="space-y-4">

            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">Informations de contact</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">

                <Mail className="w-5 h-5 text-blue-500" />

                <div>

                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">Email</Label>

                  <p className="text-base">{client.email}</p>

                </div>

              </div>



              {client.phone && (

                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">

                  <Phone className="w-5 h-5 text-green-500" />

                  <div>

                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">Téléphone</Label>

                    <p className="text-base">{client.phone}</p>

                  </div>

                </div>

              )}

            </div>

          </div>



          {/* Address Information */}

          {(client.address || client.city || client.postalCode || client.country) && (

            <div className="space-y-4">

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">Adresse</h3>

              <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">

                <MapPin className="w-5 h-5 text-red-500 mt-0.5" />

                <div>

                  {client.address && <p className="text-base">{client.address}</p>}

                  {(client.city || client.postalCode || client.country) && (

                    <p className="text-base text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">

                      {[client.postalCode, client.city].filter(Boolean).join(' ')}

                      {client.country && `, ${client.country}`}

                    </p>

                  )}

                </div>

              </div>

            </div>

          )}



          {/* Business Information */}

          <div className="space-y-4">

            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">Informations commerciales</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-center">

                <FileText className="w-6 h-6 text-blue-500 mx-auto mb-2" />

                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">Factures</Label>

                <p className="text-xl font-bold">{client.invoicesCount}</p>

              </div>



              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-center">

                <Euro className="w-6 h-6 text-green-500 mx-auto mb-2" />

                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">CA total</Label>

                <p className="text-xl font-bold">{client.totalAmount.toFixed(2)} €</p>

              </div>



              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-center">

                <Building className="w-6 h-6 text-purple-500 mx-auto mb-2" />

                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">CA moyen</Label>

                <p className="text-xl font-bold">

                  {client.invoicesCount > 0 ? (client.totalAmount / client.invoicesCount).toFixed(2) : '0.00'} €

                </p>

              </div>

            </div>

          </div>



          {/* Notes */}

          {client.notes && (

            <div className="space-y-4">

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">Notes</h3>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">

                <p className="text-base whitespace-pre-wrap">{client.notes}</p>

              </div>

            </div>

          )}



          {/* Client Timeline */}

          <div className="border-t pt-4">

            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">Historique</Label>

            <div className="mt-2 space-y-2">

              <div className="flex items-center space-x-3 text-sm">

                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>

                <span>Client créé le {new Date(client.createdAt).toLocaleDateString('fr-FR')}</span>

              </div>

              {client.invoicesCount > 0 && (

                <div className="flex items-center space-x-3 text-sm">

                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>

                  <span>{client.invoicesCount} facture{client.invoicesCount > 1 ? 's' : ''} émise{client.invoicesCount > 1 ? 's' : ''}</span>

                </div>

              )}

            </div>

          </div>

        </div>



        <DialogFooter>

          <Button variant="outline" onClick={onClose}>

            Fermer

          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>

  );

};



// Client Row Component

const ClientRow = ({ client, onEdit, onDelete, onView }) => {

  return (

    <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800/50">

      <TableCell>

        <div>

          <div className="font-medium">{client.name}</div>

          {client.company && (

            <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">{client.company}</div>

          )}

        </div>

      </TableCell>

      <TableCell>

        <div className="space-y-1">

          <div className="flex items-center space-x-2 text-sm">

            <Mail className="w-3 h-3 text-gray-400 dark:text-gray-500" />

            <span>{client.email}</span>

          </div>

          {client.phone && (

            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">

              <Phone className="w-3 h-3 text-gray-400 dark:text-gray-500" />

              <span>{client.phone}</span>

            </div>

          )}

        </div>

      </TableCell>

      <TableCell>

        {client.address && (

          <div className="flex items-center space-x-2 text-sm">

            <MapPin className="w-3 h-3 text-gray-400 dark:text-gray-500" />

            <span>{client.city}, {client.country}</span>

          </div>

        )}

      </TableCell>

      <TableCell className="text-center">

        <Badge variant="secondary">{client.invoicesCount}</Badge>

      </TableCell>

      <TableCell className="text-right font-mono">

        {client.totalAmount.toFixed(2)} €

      </TableCell>

      <TableCell>

        <div className="flex items-center space-x-2">

          <Button variant="ghost" size="sm" onClick={() => onView(client)}>

            <Eye className="w-4 h-4" />

          </Button>

          <Button variant="ghost" size="sm" onClick={() => onEdit(client)}>

            <Edit className="w-4 h-4" />

          </Button>

          <Button variant="ghost" size="sm" onClick={() => onDelete(client)}>

            <Trash2 className="w-4 h-4" />

          </Button>

        </div>

      </TableCell>

    </TableRow>

  );

};



export default function OptimizedClientsTab() {

  const { toast } = useToast();

  const { currentCompany } = useAuth();

  const [clients, setClients] = useState([]);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [showClientForm, setShowClientForm] = useState(false);

  const [editingClient, setEditingClient] = useState(null);

  const [previewClient, setPreviewClient] = useState(null);



  // Charger les clients depuis Supabase

  useEffect(() => {

    if (currentCompany?.id) {

      loadClients();

    }

  }, [currentCompany]);



  const loadClients = async () => {

    try {

      setLoading(true);

      const customers = await unifiedThirdPartiesService.getCustomers(currentCompany.id);



      // Transformer pour correspondre au format attendu par l'UI

      const transformed = customers.map(customer => ({

        id: customer.id,

        name: customer.name,

        email: customer.email || '',

        phone: customer.phone || '',

        company: customer.company_name || '',

        address: customer.billing_address_line1 || '',

        city: customer.billing_city || '',

        postalCode: customer.billing_postal_code || '',

        country: customer.billing_country || 'France',

        invoicesCount: 0, // TODO: Récupérer depuis invoices

        totalAmount: 0, // TODO: Récupérer depuis invoices

        createdAt: (customer as any).created_at || new Date().toISOString()

      }));



      setClients(transformed);

    } catch (error) {

      console.error('Error loading clients:', error instanceof Error ? error.message : String(error));

      

      // Ne pas afficher d'erreur si c'est juste une base vide ou une erreur PGRST116 (pas de résultats)

      const errorMessage = error instanceof Error ? error.message : String(error);

      const isEmptyDataError = errorMessage.includes('PGRST116') || errorMessage.includes('no rows');

      

      if (!isEmptyDataError) {

        toast({

          title: 'Erreur',

          description: 'Impossible de charger les clients',

          variant: 'destructive'

        });

      }

      

      // Initialiser avec un tableau vide même en cas d'erreur

      setClients([]);

    } finally {

      setLoading(false);

    }

  };



  const filteredClients = clients.filter(client =>

    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||

    client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||

    client.email.toLowerCase().includes(searchTerm.toLowerCase())

  );



  const handleSaveClient = async (clientData) => {

    try {

      if (editingClient) {

        // Mise à jour d'un client existant

        await unifiedThirdPartiesService.updateCustomer(editingClient.id, {

          name: clientData.name,

          email: clientData.email || undefined,

          phone: clientData.phone || undefined,

          company_name: clientData.company || undefined,

          billing_address_line1: clientData.address || undefined,

          billing_city: clientData.city || undefined,

          billing_postal_code: clientData.postalCode || undefined,

          billing_country: clientData.country || 'FR'

        });

        toast({

          title: "Client modifié",

          description: "Le client a été modifié avec succès. Visible partout dans l'application!"

        });

      } else {

        // Création d'un nouveau client

        const result = await unifiedThirdPartiesService.createCustomer({

          company_id: currentCompany.id,

          name: clientData.name,

          email: clientData.email || undefined,

          phone: clientData.phone || undefined,

          company_name: clientData.company || undefined,

          billing_address_line1: clientData.address || undefined,

          billing_city: clientData.city || undefined,

          billing_postal_code: clientData.postalCode || undefined,

          billing_country: clientData.country || 'FR'

        });



        if (result.error) throw result.error;



        toast({

          title: "Client créé",

          description: "Le client a été créé avec succès. Visible partout dans l'application!"

        });

      }



      // Recharger la liste des clients

      await loadClients();

      setEditingClient(null);

    } catch (error) {

      console.error('Error saving client:', error instanceof Error ? error.message : String(error));

      toast({

        title: 'Erreur',

        description: 'Impossible de sauvegarder le client',

        variant: 'destructive'

      });

    }

  };



  const handleEditClient = (client) => {

    setEditingClient(client);

    setShowClientForm(true);

  };



  const handleDeleteClient = async (client) => {

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {

      return;

    }



    try {

      await unifiedThirdPartiesService.deleteCustomer(client.id);

      await loadClients();

      toast({

        title: "Client supprimé",

        description: "Le client a été supprimé avec succès."

      });

    } catch (error) {

      console.error('Error deleting client:', error instanceof Error ? error.message : String(error));

      toast({

        title: 'Erreur',

        description: 'Impossible de supprimer le client',

        variant: 'destructive'

      });

    }

  };



  const handleViewClient = (client) => {

    setPreviewClient(client);

  };



  const summary = {

    totalClients: clients.length,

    totalRevenue: clients.reduce((sum, client) => sum + client.totalAmount, 0),

    averageRevenue: clients.length > 0 ? clients.reduce((sum, client) => sum + client.totalAmount, 0) / clients.length : 0,

    activeClients: clients.filter(c => c.invoicesCount > 0).length

  };



  return (

    <div className="space-y-6">

      {/* Summary Cards */}

      <div className="grid gap-4 md:grid-cols-4">

        <Card>

          <CardContent className="p-4">

            <div className="flex items-center space-x-2">

              <Users className="w-5 h-5 text-blue-500" />

              <div>

                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">Total clients</p>

                <p className="text-2xl font-bold">{summary.totalClients}</p>

              </div>

            </div>

          </CardContent>

        </Card>

        

        <Card>

          <CardContent className="p-4">

            <div className="flex items-center space-x-2">

              <CheckCircle className="w-5 h-5 text-green-500" />

              <div>

                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">Clients actifs</p>

                <p className="text-2xl font-bold">{summary.activeClients}</p>

              </div>

            </div>

          </CardContent>

        </Card>

        

        <Card>

          <CardContent className="p-4">

            <div className="flex items-center space-x-2">

              <Euro className="w-5 h-5 text-purple-500" />

              <div>

                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">CA total</p>

                <p className="text-xl font-bold">{summary.totalRevenue.toFixed(2)} €</p>

              </div>

            </div>

          </CardContent>

        </Card>

        

        <Card>

          <CardContent className="p-4">

            <div className="flex items-center space-x-2">

              <Building className="w-5 h-5 text-orange-500" />

              <div>

                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">CA moyen</p>

                <p className="text-xl font-bold">{summary.averageRevenue.toFixed(2)} €</p>

              </div>

            </div>

          </CardContent>

        </Card>

      </div>



      {/* Clients Table */}

      <Card>

        <CardHeader>

          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">

            <CardTitle className="flex items-center space-x-2">

              <Users className="w-5 h-5 text-blue-500" />

              <span>Clients</span>

            </CardTitle>

            

            <div className="flex items-center space-x-2">

              <div className="relative">

                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />

                <Input

                  placeholder="Rechercher un client..."

                  value={searchTerm}

                  onChange={(e) => setSearchTerm(e.target.value)}

                  className="pl-10 w-64"

                />

              </div>

              

              <Button onClick={() => setShowClientForm(true)}>

                <Plus className="w-4 h-4 mr-2" />

                Nouveau client

              </Button>

            </div>

          </div>

        </CardHeader>

        

        <CardContent>

          <div className="rounded-md border">

            <Table>

              <TableHeader>

                <TableRow>

                  <TableHead>Nom / Entreprise</TableHead>

                  <TableHead>Contact</TableHead>

                  <TableHead>Adresse</TableHead>

                  <TableHead className="text-center">Factures</TableHead>

                  <TableHead className="text-right">CA total</TableHead>

                  <TableHead className="text-right">Actions</TableHead>

                </TableRow>

              </TableHeader>

              <TableBody>

                {loading ? (

                  <TableRow>

                    <TableCell colSpan={6} className="text-center py-8">

                      <div className="flex items-center justify-center space-x-2">

                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>

                        <span>Chargement des clients...</span>

                      </div>

                    </TableCell>

                  </TableRow>

                ) : filteredClients.length === 0 ? (

                  <TableRow>

                    <TableCell colSpan={6} className="text-center py-8">

                      <Users className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />

                      <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">

                        {searchTerm ? 'Aucun client trouvé' : 'Aucun client. Commencez par en créer un !'}

                      </p>

                    </TableCell>

                  </TableRow>

                ) : (

                  filteredClients.map((client) => (

                    <ClientRow

                      key={client.id}

                      client={client}

                      onEdit={handleEditClient}

                      onDelete={handleDeleteClient}

                      onView={handleViewClient}

                    />

                  ))

                )}

              </TableBody>

            </Table>

          </div>

        </CardContent>

      </Card>



      {/* Client Form Dialog */}

      <ClientFormDialog

        open={showClientForm}

        onClose={() => {

          setShowClientForm(false);

          setEditingClient(null);

        }}

        client={editingClient}

        onSave={handleSaveClient}

      />



      <ClientPreviewDialog

        open={!!previewClient}

        onClose={() => setPreviewClient(null)}

        client={previewClient}

      />

    </div>

  );

}
