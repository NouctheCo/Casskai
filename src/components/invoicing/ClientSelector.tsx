import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { thirdPartiesService } from '@/services/thirdPartiesService';
import type { ThirdParty } from '@/types/third-parties.types';
import { Plus, Loader2 } from 'lucide-react';

interface ClientSelectorProps {
  value: string;
  onChange: (clientId: string) => void;
  onNewClient?: (client: ThirdParty) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  value,
  onChange,
  onNewClient,
  label = 'Client',
  placeholder = 'Sélectionner un client',
  required = true
}) => {
  const [clients, setClients] = useState<ThirdParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    primary_email: '',
    primary_phone: ''
  });
  const [savingClient, setSavingClient] = useState(false);
  const { toast } = useToast();

  // Fetch clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const clientsData = await thirdPartiesService.getThirdParties('customer');
        setClients(clientsData || []);
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger la liste des clients',
          variant: 'destructive'
        });
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [toast]);

  const handleCreateNewClient = async () => {
    if (!newClientData.name || !newClientData.primary_email || !newClientData.primary_phone) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs du client',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSavingClient(true);
      const createdClient = await thirdPartiesService.createThirdParty({
        type: 'customer',
        name: newClientData.name,
        email: newClientData.primary_email,
        phone: newClientData.primary_phone,
        country: 'FR',
        payment_terms: 30
      });

      // Add to local clients list
      setClients([...clients, createdClient]);

      // Update parent if callback provided
      if (onNewClient) {
        onNewClient(createdClient);
      }

      // Auto-select the new client
      onChange(createdClient.id);

      // Reset form
      setNewClientData({
        name: '',
        primary_email: '',
        primary_phone: ''
      });
      setShowNewClientForm(false);

      toast({
        title: 'Succès',
        description: `Client ${newClientData.name} créé et sélectionné`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le client',
        variant: 'destructive'
      });
    } finally {
      setSavingClient(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="client-selector">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowNewClientForm(true)}
          className="text-blue-600 hover:text-blue-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nouveau client
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Chargement des clients...</span>
        </div>
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id="client-selector">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {clients.length === 0 ? (
              <div className="p-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                Aucun client disponible
              </div>
            ) : (
              clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{client.name}</span>
                    {client.primary_email && <span className="text-xs text-gray-500 dark:text-gray-400">{client.primary_email}</span>}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}

      {/* New Client Form Dialog */}
      <Dialog open={showNewClientForm} onOpenChange={setShowNewClientForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un nouveau client</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new-client-name">Nom du client *</Label>
              <Input
                id="new-client-name"
                value={newClientData.name}
                onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Entreprise ABC"
              />
            </div>

            <div>
              <Label htmlFor="new-client-email">Email *</Label>
              <Input
                id="new-client-email"
                type="email"
                value={newClientData.primary_email}
                onChange={(e) => setNewClientData(prev => ({ ...prev, primary_email: e.target.value }))}
                placeholder="contact@exemple.fr"
              />
            </div>

            <div>
              <Label htmlFor="new-client-phone">Téléphone *</Label>
              <Input
                id="new-client-phone"
                type="tel"
                value={newClientData.primary_phone}
                onChange={(e) => setNewClientData(prev => ({ ...prev, primary_phone: e.target.value }))}
                placeholder="+33 1 23 45 67 89"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewClientForm(false)}
              disabled={savingClient}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleCreateNewClient}
              disabled={savingClient}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {savingClient ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientSelector;
