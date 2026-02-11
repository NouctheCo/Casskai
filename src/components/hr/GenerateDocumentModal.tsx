/**
 * Generate Document Modal
 * Modal pour générer un document à partir d'un template avec remplissage des variables
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Save, Eye, Send } from 'lucide-react';
import { hrDocumentTemplatesService } from '@/services/hrDocumentTemplatesService';
import type { DocumentTemplate, GenerateDocumentRequest } from '@/types/hr-document-templates.types';
import { createSafeHTML } from '@/utils/sanitize';
import { logger } from '@/lib/logger';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
type Employee = any; // Employee type not yet defined
interface GenerateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  template: DocumentTemplate;
  employees: Employee[];
  companyId: string;
}
export function GenerateDocumentModal({
  isOpen,
  onClose,
  onSubmit,
  template,
  employees,
  companyId
}: GenerateDocumentModalProps) {
  useBodyScrollLock(isOpen);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [documentName, setDocumentName] = useState('');
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSend, setAutoSend] = useState(false);
  useEffect(() => {
    // Pre-fill some variables when employee is selected
    if (selectedEmployee) {
      const employee = employees.find(e => e.id === selectedEmployee);
      if (employee) {
        setVariables({
          ...variables,
          employee_first_name: employee.first_name,
          employee_last_name: employee.last_name,
          employee_full_name: `${employee.first_name} ${employee.last_name}`,
          position: employee.position || '',
          department: employee.department || '',
          start_date: employee.hire_date || new Date().toISOString().split('T')[0],
          current_date: new Date().toISOString().split('T')[0]
        });
      }
    }
  }, [selectedEmployee, employees]);
  const handleVariableChange = (varName: string, value: any) => {
    setVariables({
      ...variables,
      [varName]: value
    });
  };
  const handlePreview = () => {
    const html = hrDocumentTemplatesService.replaceVariables(template.content, variables);
    setPreviewHtml(html);
    setShowPreview(true);
  };
  const handleGenerate = async () => {
    if (!selectedEmployee) {
      // eslint-disable-next-line no-alert
      alert('Veuillez sélectionner un employé');
      return;
    }
    // Validate required variables
    const missingRequired = template.variables
      .filter(v => v.required)
      .filter(v => !variables[v.name] || variables[v.name] === '')
      .map(v => v.label);
    if (missingRequired.length > 0) {
      // eslint-disable-next-line no-alert
      alert(`Veuillez remplir les variables requises: ${missingRequired.join(', ')}`);
      return;
    }
    setSaving(true);
    try {
      const request: GenerateDocumentRequest = {
        template_id: template.id,
        employee_id: selectedEmployee,
        document_name: documentName || undefined,
        variables_data: variables,
        auto_send: autoSend
      };
      const response = await hrDocumentTemplatesService.generateDocument(companyId, request);
      if (response.success) {
        onSubmit();
      } else {
        // eslint-disable-next-line no-alert
        alert(`Erreur: ${response.error}`);
      }
    } catch (error) {
      logger.error('GenerateDocumentModal', 'Error generating document:', error);
      // eslint-disable-next-line no-alert
      alert('Erreur lors de la génération du document');
    } finally {
      setSaving(false);
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Générer un Document</h2>
            <p className="text-gray-600 dark:text-gray-300">{template.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
            {/* Form */}
            <div className="p-6 border-r">
              <div className="space-y-4">
                {/* Employee Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Employé concerné *
                  </label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                    required
                  >
                    <option value="">Sélectionner un employé...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} - {emp.position || 'Sans poste'}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Document Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom du document (optionnel)
                  </label>
                  <Input
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="Laissez vide pour génération automatique"
                  />
                </div>
                {/* Variables */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">Variables du template</h3>
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    {template.variables.map((variable, idx) => (
                      <div key={idx}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {variable.label}
                          {variable.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {`{{${variable.name}}}`}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {variable.type}
                          </Badge>
                        </div>
                        {variable.type === 'date' ? (
                          <Input
                            type="date"
                            value={variables[variable.name] || ''}
                            onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                          />
                        ) : variable.type === 'number' || variable.type === 'currency' ? (
                          <Input
                            type="number"
                            value={variables[variable.name] || ''}
                            onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                            step={variable.type === 'currency' ? '0.01' : '1'}
                          />
                        ) : variable.type === 'boolean' ? (
                          <select
                            value={variables[variable.name] || ''}
                            onChange={(e) => handleVariableChange(variable.name, e.target.value === 'true')}
                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                          >
                            <option value="">Sélectionner...</option>
                            <option value="true">Oui</option>
                            <option value="false">Non</option>
                          </select>
                        ) : (
                          <Input
                            type="text"
                            value={variables[variable.name] || ''}
                            onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                            placeholder={variable.description}
                          />
                        )}
                        {variable.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">{variable.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Options */}
                <div className="border-t pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSend}
                      onChange={(e) => setAutoSend(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Envoyer automatiquement après génération</span>
                  </label>
                </div>
              </div>
            </div>
            {/* Preview */}
            <div className="p-6 bg-gray-50 dark:bg-gray-900/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Aperçu</h3>
                <Button size="sm" onClick={handlePreview} variant="outline" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Actualiser aperçu
                </Button>
              </div>
              {!showPreview ? (
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-300">
                  <div className="text-center">
                    <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                    <p>Cliquez sur "Actualiser aperçu" pour voir le document</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border max-h-[60vh] overflow-y-auto">
                  <div
                    dangerouslySetInnerHTML={createSafeHTML(previewHtml)}
                    className="prose prose-sm max-w-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 dark:bg-gray-900/30">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleGenerate} disabled={saving} className="gap-2">
            {autoSend ? <Send className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Génération...' : autoSend ? 'Générer et Envoyer' : 'Générer'}
          </Button>
        </div>
      </div>
    </div>
  );
}