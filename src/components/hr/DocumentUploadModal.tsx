import React, { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { Employee } from '@/services/hrService';
import type { DocumentType } from '@/types/hr-documents.types';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean>;
  employees: Employee[];
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  employees
}) => {
  const [formData, setFormData] = useState({
    employee_id: '',
    document_type: 'contract' as DocumentType,
    title: '',
    description: '',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    is_confidential: false,
    requires_signature: false,
    tags: '',
    notes: ''
  });

  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const documentTypes: Record<DocumentType, string> = {
    contract: 'Contrat de travail',
    amendment: 'Avenant au contrat',
    certificate: 'Certificat de travail',
    payslip: 'Fiche de paie',
    id_document: 'Pièce d\'identité',
    diploma: 'Diplôme',
    certification: 'Certification professionnelle',
    medical: 'Document médical',
    resignation: 'Lettre de démission',
    termination: 'Lettre de licenciement',
    warning: 'Avertissement',
    evaluation: 'Document d\'évaluation',
    other: 'Autre'
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employee_id) newErrors.employee_id = 'Employé requis';
    if (!formData.title.trim()) newErrors.title = 'Titre requis';
    if (!file) newErrors.file = 'Fichier requis';
    if (file && file.size > 10 * 1024 * 1024) {
      newErrors.file = 'Le fichier ne doit pas dépasser 10 MB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !file) return;

    setIsSubmitting(true);
    try {
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      const success = await onSubmit({
        ...formData,
        file,
        tags: tagsArray
      });

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error submitting document:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ajouter un Document</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors dark:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Employee */}
            <div>
              <Label htmlFor="employee_id">Employé *</Label>
              <Select
                value={formData.employee_id}
                onValueChange={value => setFormData({ ...formData, employee_id: value })}
              >
                <SelectTrigger className={errors.employee_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} - {emp.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employee_id && (
                <p className="text-sm text-red-500 mt-1">{errors.employee_id}</p>
              )}
            </div>

            {/* Document Type */}
            <div>
              <Label htmlFor="document_type">Type de document *</Label>
              <Select
                value={formData.document_type}
                onValueChange={value => setFormData({ ...formData, document_type: value as DocumentType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(documentTypes).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Contrat CDI - Janvier 2025"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du document..."
                rows={3}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issue_date">Date d'émission</Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={formData.issue_date}
                  onChange={e => setFormData({ ...formData, issue_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="expiry_date">Date d'expiration</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                />
                <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">Optionnel - pour documents temporaires</p>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <Label htmlFor="file">Fichier *</Label>
              <div className="mt-2 flex items-center justify-center w-full">
                <label
                  htmlFor="file"
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    file ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                  } ${errors.file ? 'border-red-500' : ''}`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {file ? (
                      <>
                        <FileText className="w-10 h-10 mb-3 text-green-600" />
                        <p className="mb-2 text-sm text-green-600 font-semibold">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-300">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 mb-3 text-gray-400 dark:text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-300">
                          <span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-300">PDF, DOC, DOCX, PNG, JPG (MAX. 10MB)</p>
                      </>
                    )}
                  </div>
                  <input
                    id="file"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={e => {
                      const selectedFile = e.target.files?.[0];
                      if (selectedFile) {
                        setFile(selectedFile);
                        setErrors({ ...errors, file: '' });
                      }
                    }}
                  />
                </label>
              </div>
              {errors.file && (
                <p className="text-sm text-red-500 mt-1">{errors.file}</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Séparez par des virgules: urgent, confidentiel, 2025"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_confidential"
                  checked={formData.is_confidential}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_confidential: checked as boolean })
                  }
                />
                <Label htmlFor="is_confidential" className="cursor-pointer">
                  Document confidentiel
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requires_signature"
                  checked={formData.requires_signature}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requires_signature: checked as boolean })
                  }
                />
                <Label htmlFor="requires_signature" className="cursor-pointer">
                  Nécessite une signature
                </Label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes additionnelles (optionnel)..."
                rows={2}
              />
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Le document sera stocké de manière sécurisée et accessible uniquement aux personnes autorisées.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSubmitting ? 'Upload en cours...' : 'Ajouter le document'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
