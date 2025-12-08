/**
 * Composant Select amélioré avec recherche et création à la volée
 * Utilisable pour Fournisseurs, Clients, Catégories, etc.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, X, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  sublabel?: string;
}

interface SelectWithCreateProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  createLabel?: string;
  onCreate: (name: string) => Promise<Option | null>;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SelectWithCreate: React.FC<SelectWithCreateProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  searchPlaceholder = 'Rechercher...',
  createLabel = 'Créer',
  onCreate,
  isLoading = false,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [creatingLoading, setCreatingLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase()) ||
    option.sublabel?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(o => o.value === value);

  const handleCreate = async () => {
    if (!newItemName.trim()) return;

    setCreatingLoading(true);
    try {
      const newOption = await onCreate(newItemName.trim());
      if (newOption) {
        onChange(newOption.value);
        setIsCreating(false);
        setNewItemName('');
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Erreur création:', error);
    } finally {
      setCreatingLoading(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Champ affiché */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg text-left flex items-center justify-between transition-all
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-primary cursor-pointer'}
          ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300'}
        `}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Recherche */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            </div>
          </div>

          {/* Liste des options */}
          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-300 text-sm">
                Chargement...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-300 text-sm">
                Aucun résultat pour "{search}"
              </div>
            ) : (
              filteredOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between transition-colors
                    ${option.value === value ? 'bg-primary/10 text-primary' : ''}
                  `}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{option.label}</div>
                    {option.sublabel && (
                      <div className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">{option.sublabel}</div>
                    )}
                  </div>
                  {option.value === value && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                </button>
              ))
            )}
          </div>

          {/* Bouton créer */}
          <div className="border-t p-2">
            {isCreating ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Nom..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreate();
                    }
                    if (e.key === 'Escape') {
                      setIsCreating(false);
                      setNewItemName('');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creatingLoading || !newItemName.trim()}
                  className="px-3 py-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
                  {creatingLoading ? '...' : <Check className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setNewItemName('');
                  }}
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors dark:bg-gray-900/30"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full px-3 py-2 text-left text-primary hover:bg-primary/10 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">{createLabel}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
