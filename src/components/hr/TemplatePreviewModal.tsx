/**
 * Template Preview Modal
 * Modal pour prévisualiser un template avec des données de test
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Eye } from 'lucide-react';
import { hrDocumentTemplatesService } from '@/services/hrDocumentTemplatesService';
import type { DocumentTemplate } from '@/types/hr-document-templates.types';
import { createSafeHTML } from '@/utils/sanitize';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: DocumentTemplate;
}

export function TemplatePreviewModal({ isOpen, onClose, template }: TemplatePreviewModalProps) {
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const handleGeneratePreview = () => {
    const html = hrDocumentTemplatesService.replaceVariables(template.content, variables);
    setPreviewHtml(html);
    setShowPreview(true);
  };

  const handleVariableChange = (varName: string, value: any) => {
    setVariables({
      ...variables,
      [varName]: value
    });
  };

  const fillSampleData = () => {
    const sampleData: Record<string, any> = {
      // Company
      company_name: 'ACME Corporation',
      company_address: '123 Rue de la Paix, 75001 Paris',
      company_siret: '123 456 789 00010',
      company_phone: '01 23 45 67 89',
      company_email: 'contact@acme.fr',

      // Employee
      employee_title: 'M.',
      employee_first_name: 'Jean',
      employee_last_name: 'DUPONT',
      employee_full_name: 'Jean DUPONT',
      employee_address: '456 Avenue des Champs, 75008 Paris',
      employee_birth_date: '1990-05-15',
      employee_birth_place: 'Paris',
      employee_social_security: '1 90 05 75 101 123 45',

      // Position
      position: 'Développeur Full Stack Senior',
      department: 'Technologies',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],

      // Compensation
      salary: '45000',
      salary_net: '35000',
      salary_period: 'annuel',

      // Work time
      work_hours_weekly: '35',
      work_schedule: 'Lundi au Vendredi, 9h-17h',

      // Dates
      current_date: new Date().toISOString().split('T')[0],
      signature_place: 'Paris',

      // Contract specific
      trial_period_months: '2',
      benefits: 'Tickets restaurant, mutuelle, RTT',
      notice_period: '1 mois',
      cdd_reason: 'Remplacement',
      contract_duration: '6 mois'
    };

    setVariables(sampleData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Prévisualisation du Template</h2>
            <p className="text-gray-600">{template.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
            {/* Variables Input */}
            <div className="p-6 border-r">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Variables</h3>
                <Button size="sm" onClick={fillSampleData} variant="outline">
                  Remplir données de test
                </Button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {template.variables.map((variable, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {variable.label}
                      {variable.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="flex items-center gap-2">
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
                        className="mt-2"
                      />
                    ) : variable.type === 'number' || variable.type === 'currency' ? (
                      <Input
                        type="number"
                        value={variables[variable.name] || ''}
                        onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                        className="mt-2"
                        step={variable.type === 'currency' ? '0.01' : '1'}
                      />
                    ) : variable.type === 'boolean' ? (
                      <select
                        value={variables[variable.name] || ''}
                        onChange={(e) => handleVariableChange(variable.name, e.target.value === 'true')}
                        className="mt-2 w-full px-3 py-2 border rounded-lg"
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
                        className="mt-2"
                        placeholder={variable.description}
                      />
                    )}
                    {variable.description && (
                      <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                    )}
                  </div>
                ))}
              </div>

              <Button
                onClick={handleGeneratePreview}
                className="w-full mt-4 gap-2"
              >
                <Eye className="w-4 h-4" />
                Générer la prévisualisation
              </Button>
            </div>

            {/* Preview */}
            <div className="p-6 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">Aperçu du Document</h3>

              {!showPreview ? (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Remplissez les variables et cliquez sur "Générer la prévisualisation"</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-lg shadow-sm border max-h-[60vh] overflow-y-auto">
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
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
