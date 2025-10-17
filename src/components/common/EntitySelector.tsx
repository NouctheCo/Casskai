import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EntityOption {
  id: string;
  label: string;
  sublabel?: string;
  metadata?: Record<string, any>;
}

export interface EntityFormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: string | number;
}

export interface EntitySelectorProps {
  // Données
  options: EntityOption[];
  value?: string;
  onChange: (value: string) => void;

  // Configuration
  entityName: string;
  entityNamePlural?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;

  // Création à la volée
  canCreate?: boolean;
  createFormFields?: EntityFormField[];
  onCreateEntity?: (data: Record<string, any>) => Promise<{ success: boolean; id?: string; error?: string }>;

  // Style
  className?: string;
  disabled?: boolean;
}

/**
 * EntitySelector - Composant générique pour sélectionner ou créer des entités à la volée
 *
 * Ce composant permet:
 * - Sélectionner une entité depuis une liste (avec recherche)
 * - Créer une nouvelle entité directement depuis le sélecteur
 * - Éviter les redondances en centralisant les données
 *
 * Utilisable dans: Facturation, Achats, Comptabilité, CRM, Projets, RH, etc.
 */
export const EntitySelector: React.FC<EntitySelectorProps> = ({
  options,
  value,
  onChange,
  entityName,
  entityNamePlural,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  canCreate = true,
  createFormFields = [],
  onCreateEntity,
  className,
  disabled = false,
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const selectedOption = useMemo(
    () => options.find((option) => option.id === value),
    [options, value]
  );

  const handleSelect = useCallback((selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
  }, [onChange]);

  const handleCreateClick = useCallback(() => {
    // Initialiser le formulaire avec les valeurs par défaut
    const initialData: Record<string, any> = {};
    createFormFields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        initialData[field.name] = field.defaultValue;
      }
    });
    setFormData(initialData);
    setShowCreateDialog(true);
    setOpen(false);
  }, [createFormFields]);

  const handleFormChange = useCallback((fieldName: string, fieldValue: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: fieldValue }));
  }, []);

  const handleCreateSubmit = useCallback(async () => {
    if (!onCreateEntity) return;

    // Validation des champs requis
    const missingFields = createFormFields
      .filter((field) => field.required && !formData[field.name])
      .map((field) => field.label);

    if (missingFields.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Champs obligatoires manquants',
        description: `Veuillez remplir: ${missingFields.join(', ')}`,
      });
      return;
    }

    setCreating(true);
    try {
      const result = await onCreateEntity(formData);

      if (result.success && result.id) {
        toast({
          title: 'Succès',
          description: `${entityName} créé(e) avec succès`,
        });
        onChange(result.id);
        setShowCreateDialog(false);
        setFormData({});
      } else {
        throw new Error(result.error || 'Échec de la création');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : `Impossible de créer ${entityName}`,
      });
    } finally {
      setCreating(false);
    }
  }, [formData, createFormFields, onCreateEntity, onChange, entityName, toast]);

  return (
    <>
      {/* Sélecteur principal */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn('w-full justify-between', className)}
            disabled={disabled}
          >
            {selectedOption ? selectedOption.label : (placeholder || `Sélectionner ${entityName.toLowerCase()}`)}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder || `Rechercher ${entityName.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>
                {emptyMessage || `Aucun(e) ${entityName.toLowerCase()} trouvé(e)`}
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.label}
                    onSelect={() => handleSelect(option.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === option.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      {option.sublabel && (
                        <span className="text-xs text-muted-foreground">{option.sublabel}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>

              {/* Bouton "Créer nouveau" */}
              {canCreate && onCreateEntity && (
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCreateClick}
                    className="bg-primary/5 hover:bg-primary/10 border-t"
                  >
                    <PlusCircle className="mr-2 h-4 w-4 text-primary" />
                    <span className="text-primary font-medium">
                      Créer {entityName.toLowerCase()}
                    </span>
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Dialog de création */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer {entityName.toLowerCase()}</DialogTitle>
            <DialogDescription>
              {entityName} sera enregistré(e) et disponible pour une utilisation ultérieure
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {createFormFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>

                {field.type === 'select' ? (
                  <Select
                    value={formData[field.name] || ''}
                    onValueChange={(val) => handleFormChange(field.name, val)}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder={field.placeholder || `Sélectionner...`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    id={field.name}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFormChange(field.name, e.target.value)}
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) =>
                      handleFormChange(
                        field.name,
                        field.type === 'number' ? parseFloat(e.target.value) || '' : e.target.value
                      )
                    }
                  />
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={creating}
            >
              Annuler
            </Button>
            <Button onClick={handleCreateSubmit} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Créer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
