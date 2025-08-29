import React, { useState } from 'react';
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

// Client Row Component
const ClientRow = ({ client, onEdit, onDelete, onView }) => {
  return (
    <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <TableCell>
        <div>
          <div className="font-medium">{client.name}</div>
          {client.company && (
            <div className="text-sm text-gray-500 dark:text-gray-400">{client.company}</div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="w-3 h-3 text-gray-400" />
            <span>{client.email}</span>
          </div>
          {client.phone && (
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Phone className="w-3 h-3 text-gray-400" />
              <span>{client.phone}</span>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {client.address && (
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="w-3 h-3 text-gray-400" />
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
  const [clients, setClients] = useState([
    {
      id: 1,
      name: 'Jean Dupont',
      email: 'jean.dupont@abc-corp.com',
      phone: '01 23 45 67 89',
      company: 'ABC Corporation',
      address: '123 Avenue des Champs',
      city: 'Paris',
      postalCode: '75008',
      country: 'France',
      invoicesCount: 5,
      totalAmount: 7200.00,
      createdAt: '2024-01-10'
    },
    {
      id: 2,
      name: 'Marie Martin',
      email: 'marie.martin@xyz-ent.fr',
      phone: '01 98 76 54 32',
      company: 'XYZ Entreprise',
      address: '456 Rue de la République',
      city: 'Lyon',
      postalCode: '69002',
      country: 'France',
      invoicesCount: 3,
      totalAmount: 4320.00,
      createdAt: '2024-01-15'
    },
    {
      id: 3,
      name: 'Pierre Moreau',
      email: 'p.moreau@tech-solutions.com',
      phone: '01 55 44 33 22',
      company: 'Tech Solutions',
      address: '789 Boulevard Haussmann',
      city: 'Paris',
      postalCode: '75009',
      country: 'France',
      invoicesCount: 2,
      totalAmount: 1920.00,
      createdAt: '2024-01-20'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveClient = (clientData) => {
    if (editingClient) {
      setClients(prev => prev.map(client => 
        client.id === editingClient.id ? { ...clientData, id: editingClient.id } : client
      ));
    } else {
      setClients(prev => [...prev, { ...clientData, id: Date.now() }]);
    }
    setEditingClient(null);
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setShowClientForm(true);
  };

  const handleDeleteClient = (client) => {
    setClients(prev => prev.filter(c => c.id !== client.id));
    toast({
      title: "Client supprimé",
      description: "Le client a été supprimé avec succès."
    });
  };

  const handleViewClient = (client) => {
    toast({
      title: "Détails du client",
      description: `Consultation du profil de ${client.name}`
    });
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total clients</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Clients actifs</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CA total</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CA moyen</p>
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                {filteredClients.map((client) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    onEdit={handleEditClient}
                    onDelete={handleDeleteClient}
                    onView={handleViewClient}
                  />
                ))}
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
    </div>
  );
}