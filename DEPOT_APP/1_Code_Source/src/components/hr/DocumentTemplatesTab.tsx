/**
 * Document Templates Management Tab
 * Gestion des templates de documents RH (contrats, avenants, certificats, etc.)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FileText, Plus, Search, Edit, Trash2, Copy, Eye,
  CheckCircle, XCircle, FileSignature, Archive, Sparkles
} from 'lucide-react';
import { hrDocumentTemplatesService } from '@/services/hrDocumentTemplatesService';
import { DOCUMENT_TYPE_LABELS, DEFAULT_HR_TEMPLATES } from '@/data/hr-document-templates-defaults';
import type { DocumentTemplate, DocumentCategory } from '@/types/hr-document-templates.types';
import { TemplateFormModal } from './TemplateFormModal';
import { TemplatePreviewModal } from './TemplatePreviewModal';

interface DocumentTemplatesTabProps {
  companyId: string;
}

export function DocumentTemplatesTab({ companyId }: DocumentTemplatesTabProps) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [companyId]);

  const loadTemplates = async () => {
    setLoading(true);
    const response = await hrDocumentTemplatesService.getTemplates(companyId);
    if (response.success && response.data) {
      setTemplates(response.data);
    }
    setLoading(false);
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setIsEditing(false);
    setShowFormModal(true);
  };

  const handleEditTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handlePreviewTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  const handleDuplicateTemplate = async (template: DocumentTemplate) => {
    const duplicateData = {
      name: `${template.name} (Copie)`,
      description: template.description,
      category: template.category,
      template_type: template.template_type,
      content: template.content,
      variables: template.variables,
      is_active: false, // Désactivé par défaut
      is_default: false,
      requires_signature: template.requires_signature,
      auto_archive: template.auto_archive
    };

    const response = await hrDocumentTemplatesService.createTemplate(companyId, duplicateData);
    if (response.success) {
      await loadTemplates();
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    // eslint-disable-next-line no-alert
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return;

    const response = await hrDocumentTemplatesService.deleteTemplate(templateId);
    if (response.success) {
      await loadTemplates();
    }
  };

  const handleToggleActive = async (template: DocumentTemplate) => {
    const response = await hrDocumentTemplatesService.updateTemplate(template.id, {
      is_active: !template.is_active
    });
    if (response.success) {
      await loadTemplates();
    }
  };

  const handleImportDefaults = async () => {
    // eslint-disable-next-line no-alert
    if (!confirm('Importer les templates par défaut ? Cela créera 5 nouveaux templates.')) return;

    for (const defaultTemplate of DEFAULT_HR_TEMPLATES) {
      await hrDocumentTemplatesService.createTemplate(companyId, defaultTemplate);
    }
    await loadTemplates();
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: templates.length,
    active: templates.filter(t => t.is_active).length,
    contracts: templates.filter(t => t.category === 'contract').length,
    certificates: templates.filter(t => t.category === 'certificate').length
  };

  const getCategoryIcon = (category: DocumentCategory) => {
    switch (category) {
      case 'contract': return <FileSignature className="w-4 h-4" />;
      case 'amendment': return <Edit className="w-4 h-4" />;
      case 'certificate': return <CheckCircle className="w-4 h-4" />;
      case 'notice': return <FileText className="w-4 h-4" />;
      case 'letter': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: DocumentCategory) => {
    switch (category) {
      case 'contract': return 'bg-blue-100 text-blue-800';
      case 'amendment': return 'bg-purple-100 text-purple-800';
      case 'certificate': return 'bg-green-100 text-green-800';
      case 'notice': return 'bg-orange-100 text-orange-800';
      case 'letter': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Chargement des templates...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Templates</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Actifs</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Contrats</p>
                <p className="text-2xl font-bold text-blue-600">{stats.contracts}</p>
              </div>
              <FileSignature className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Certificats</p>
                <p className="text-2xl font-bold text-green-600">{stats.certificates}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Templates de Documents</CardTitle>
              <CardDescription>Gérez vos templates de documents RH</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleImportDefaults} variant="outline" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Importer templates par défaut
              </Button>
              <Button onClick={handleCreateTemplate} className="gap-2">
                <Plus className="w-4 h-4" />
                Nouveau Template
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <Input
                placeholder="Rechercher un template..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">Toutes catégories</option>
              <option value="contract">Contrats</option>
              <option value="amendment">Avenants</option>
              <option value="certificate">Certificats</option>
              <option value="notice">Notifications</option>
              <option value="letter">Courriers</option>
              <option value="policy">Règlements</option>
              <option value="form">Formulaires</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getCategoryIcon(template.category)}
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {template.description || 'Pas de description'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={getCategoryColor(template.category)}>
                    {template.category}
                  </Badge>
                  <Badge variant="outline">
                    {DOCUMENT_TYPE_LABELS[template.template_type] || template.template_type}
                  </Badge>
                  {template.is_default && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Par défaut
                    </Badge>
                  )}
                  {template.requires_signature && (
                    <Badge className="bg-purple-100 text-purple-800">
                      <FileSignature className="w-3 h-3 mr-1" />
                      Signature
                    </Badge>
                  )}
                  {template.auto_archive && (
                    <Badge className="bg-gray-100 text-gray-800 dark:text-gray-100 dark:bg-gray-900/50">
                      <Archive className="w-3 h-3 mr-1" />
                      Auto-archivage
                    </Badge>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Statut:</span>
                  {template.is_active ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Actif
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      <XCircle className="w-3 h-3 mr-1" />
                      Inactif
                    </Badge>
                  )}
                </div>

                {/* Variables */}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Variables: {template.variables.length}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.slice(0, 3).map((v, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {v.name}
                      </Badge>
                    ))}
                    {template.variables.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.variables.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreviewTemplate(template)}
                    className="flex-1 gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Prévisualiser
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditTemplate(template)}
                    className="gap-1"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicateTemplate(template)}
                    className="gap-1"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(template)}
                    className="gap-1"
                  >
                    {template.is_active ? (
                      <XCircle className="w-3 h-3" />
                    ) : (
                      <CheckCircle className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="gap-1 text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Aucun template</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Commencez par créer un template ou importer les templates par défaut
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleImportDefaults} variant="outline">
                Importer templates par défaut
              </Button>
              <Button onClick={handleCreateTemplate}>
                Créer un template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {showFormModal && (
        <TemplateFormModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setSelectedTemplate(null);
          }}
          onSubmit={async () => {
            await loadTemplates();
            setShowFormModal(false);
            setSelectedTemplate(null);
          }}
          template={selectedTemplate}
          companyId={companyId}
          isEditing={isEditing}
        />
      )}

      {showPreviewModal && selectedTemplate && (
        <TemplatePreviewModal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedTemplate(null);
          }}
          template={selectedTemplate}
        />
      )}
    </>
  );
}
