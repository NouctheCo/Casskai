import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { thirdPartiesService } from '@/services/thirdPartiesService';
import { ThirdPartyFormDialog } from '@/components/third-parties/ThirdPartyFormDialog';
import { useAuth } from '@/contexts/AuthContext';
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
  const { toast } = useToast();
  const { currentCompany } = useAuth();

  // Fetch clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const clientsData = await thirdPartiesService.getThirdParties(undefined, 'customer');
        setClients(clientsData || []);
        // ✅ Liste vide = comportement normal (pas d'erreur affichée)
      } catch (error) {
        console.error('Error fetching clients:', error);
        // ⚠️ Afficher l'erreur uniquement pour les vraies erreurs réseau/serveur
        toast({
          title: 'Erreur',
          description: 'Impossible de charger la liste des clients. Vérifiez votre connexion.',
          variant: 'destructive'
        });
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [toast]);

  // Callback quand un nouveau client est créé via ThirdPartyFormDialog
  const handleClientCreated = async () => {
    // Recharger la liste des clients
    try {
      const clientsData = await thirdPartiesService.getThirdParties(undefined, 'customer');
      setClients(clientsData || []);

      // Sélectionner automatiquement le dernier client créé
      if (clientsData && clientsData.length > 0) {
        const latestClient = clientsData[clientsData.length - 1];
        onChange(latestClient.id);

        if (onNewClient) {
          onNewClient(latestClient);
        }
      }
    } catch (error) {
      console.error('Error reloading clients:', error);
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
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
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

      {/* Formulaire complet de création de client */}
      <ThirdPartyFormDialog
        open={showNewClientForm}
        onClose={() => setShowNewClientForm(false)}
        onSuccess={handleClientCreated}
        companyId={currentCompany?.id || ''}
        defaultType="customer"
      />
    </div>
  );
};

export default ClientSelector;
