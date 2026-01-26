/**
 * Template Form Modal
 * Modal pour créer/éditer un template de document
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { hrDocumentTemplatesService } from '@/services/hrDocumentTemplatesService';
import { logger } from '@/lib/logger';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  STANDARD_VARIABLES,
  type DocumentTemplate,
  type DocumentTemplateFormData,
  type DocumentCategory,
  type TemplateVariable,
  type DocumentTemplateType
} from '@/types/hr-document-templates.types';
interface TemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  template: DocumentTemplate | null;
  companyId: string;
  isEditing: boolean;
}
export function TemplateFormModal({
  isOpen,
  onClose,
  onSubmit,
  template,
  companyId,
  isEditing
}: TemplateFormModalProps) {
  useBodyScrollLock(isOpen);
  const [formData, setFormData] = useState<DocumentTemplateFormData>({
    name: '',
    description: '',
    category: 'contract',
    template_type: 'cdi',
    content: '',
    variables: [],
    is_active: true,
    is_default: false,
    requires_signature: false,
    auto_archive: true
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        category: template.category,
        template_type: template.template_type,
        content: template.content,
        variables: template.variables,
        is_active: template.is_active,
        is_default: template.is_default,
        requires_signature: template.requires_signature,
        auto_archive: template.auto_archive
      });
    }
  }, [template]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing && template) {
        await hrDocumentTemplatesService.updateTemplate(template.id, formData);
      } else {
        await hrDocumentTemplatesService.createTemplate(companyId, formData);
      }
      onSubmit();
    } catch (error) {
      logger.error('TemplateFormModal', 'Error saving template:', error);
    } finally {
      setSaving(false);
    }
  };
  const _handleAddVariable = (variable: TemplateVariable) => {
    if (!formData.variables.find(v => v.name === variable.name)) {
      setFormData({
        ...formData,
        variables: [...formData.variables, variable]
      });
    }
  };
  const handleRemoveVariable = (variableName: string) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter(v => v.name !== variableName)
    });
  };
  const handleAddStandardVariables = () => {
    const newVariables = STANDARD_VARIABLES.filter(
      sv => !formData.variables.find(v => v.name === sv.name)
    );
    setFormData({
      ...formData,
      variables: [...formData.variables, ...newVariables]
    });
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b shrink-0 bg-white dark:bg-gray-800">
            <h2 className="text-2xl font-bold">
              {isEditing ? 'Modifier le Template' : 'Nouveau Template'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom du template *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ex: Contrat CDI Standard"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Catégorie *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as DocumentCategory })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="contract">Contrat</option>
                  <option value="amendment">Avenant</option>
                  <option value="certificate">Certificat</option>
                  <option value="notice">Notification</option>
                  <option value="letter">Courrier</option>
                  <option value="policy">Règlement</option>
                  <option value="form">Formulaire</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type de document *
              </label>
              <Input
                value={formData.template_type}
                onChange={(e) => setFormData({ ...formData, template_type: e.target.value as DocumentTemplateType })}
                required
                placeholder="Ex: cdi, cdd, stage, avenant_salaire, certificat_travail..."
              />
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                Types courants: cdi, cdd, stage, apprentissage, avenant_salaire, certificat_travail, promesse_embauche
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="Description du template..."
              />
            </div>
            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contenu HTML *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                rows={12}
                required
                placeholder="<div>Contenu du document avec {{variables}}...</div>"
              />
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                Utilisez la syntaxe {`{{variable_name}}`} pour insérer des variables
              </p>
            </div>
            {/* Variables */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Variables disponibles
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddStandardVariables}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter variables standard
                </Button>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900/30">
                {formData.variables.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-300 text-center py-4">
                    Aucune variable. Ajoutez les variables standard ou créez vos propres variables.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {formData.variables.map((variable, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{`{{${variable.name}}}`}</Badge>
                            <span className="text-sm font-medium">{variable.label}</span>
                            {variable.required && (
                              <Badge className="bg-red-100 text-red-800 text-xs">Requis</Badge>
                            )}
                          </div>
                          {variable.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">{variable.description}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveVariable(variable.name)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Template actif</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Template par défaut</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requires_signature}
                  onChange={(e) => setFormData({ ...formData, requires_signature: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Nécessite une signature</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.auto_archive}
                  onChange={(e) => setFormData({ ...formData, auto_archive: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Archivage automatique</span>
              </label>
            </div>
          </div>
        </form>
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 dark:bg-gray-900/30 shrink-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </div>
    </div>
  );
}