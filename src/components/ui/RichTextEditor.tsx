/**
 * CassKai - Rich Text Editor
 *
 * Phase 2 (P1) - Composants UI Premium
 *
 * Fonctionnalités:
 * - Éditeur WYSIWYG
 * - Toolbar complète (bold, italic, underline, strikethrough)
 * - Listes (ordered, unordered)
 * - Headings (H1, H2, H3)
 * - Links, images
 * - Code blocks
 * - Quotes
 * - Tables
 * - Undo/Redo
 * - Fullscreen mode
 * - Preview mode
 * - Export HTML/Markdown
 * - Keyboard shortcuts
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Link,
  Image as ImageIcon,
  Table,
  Undo2,
  Redo2,
  Maximize2,
  Minimize2,
  Eye,
  FileCode,
  Download,
} from 'lucide-react';
import DOMPurify from 'dompurify';

export interface RichTextEditorProps {
  /** Valeur HTML */
  value: string;
  /** Callback onChange */
  onChange: (html: string) => void;
  /** Placeholder */
  placeholder?: string;
  /** Hauteur minimale (px) */
  minHeight?: number;
  /** Hauteur maximale (px) */
  maxHeight?: number;
  /** Désactiver l'éditeur */
  disabled?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
  /** Activer mode fullscreen */
  allowFullscreen?: boolean;
  /** Activer preview */
  showPreview?: boolean;
  /** Toolbar personnalisée */
  toolbar?: ToolbarItem[];
}

type ToolbarItem =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | '|'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'ol'
  | 'ul'
  | 'quote'
  | 'code'
  | 'link'
  | 'image'
  | 'table'
  | 'undo'
  | 'redo';

const DEFAULT_TOOLBAR: ToolbarItem[] = [
  'bold',
  'italic',
  'underline',
  'strikethrough',
  '|',
  'h1',
  'h2',
  'h3',
  '|',
  'ol',
  'ul',
  '|',
  'quote',
  'code',
  'link',
  'image',
  '|',
  'undo',
  'redo',
];

/**
 * Rich Text Editor Component
 */
export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Commencez à écrire...',
  minHeight = 200,
  maxHeight,
  disabled = false,
  className,
  allowFullscreen = true,
  showPreview = true,
  toolbar = DEFAULT_TOOLBAR,
}: RichTextEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  const editorRef = useRef<HTMLDivElement>(null);

  /**
   * Initialiser l'éditeur avec le contenu
   */
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  /**
   * Executer commande document.execCommand
   */
  const executeCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    logger.debug('RichTextEditor', 'Command executed:', command);
  }, []);

  /**
   * Handlers toolbar
   */
  const handleBold = () => executeCommand('bold');
  const handleItalic = () => executeCommand('italic');
  const handleUnderline = () => executeCommand('underline');
  const handleStrikethrough = () => executeCommand('strikethrough');
  const handleH1 = () => executeCommand('formatBlock', '<h1>');
  const handleH2 = () => executeCommand('formatBlock', '<h2>');
  const handleH3 = () => executeCommand('formatBlock', '<h3>');
  const handleOrderedList = () => executeCommand('insertOrderedList');
  const handleUnorderedList = () => executeCommand('insertUnorderedList');
  const handleQuote = () => executeCommand('formatBlock', '<blockquote>');
  const handleCode = () => executeCommand('formatBlock', '<pre>');
  const handleUndo = () => executeCommand('undo');
  const handleRedo = () => executeCommand('redo');

  /**
   * Insérer lien
   */
  const handleInsertLink = useCallback(() => {
    if (!linkUrl) return;

    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);

    if (range) {
      const link = document.createElement('a');
      link.href = linkUrl;
      link.textContent = linkText || linkUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      range.deleteContents();
      range.insertNode(link);
    }

    setLinkDialogOpen(false);
    setLinkUrl('');
    setLinkText('');
    editorRef.current?.focus();
  }, [linkUrl, linkText]);

  /**
   * Insérer image
   */
  const handleInsertImage = useCallback(() => {
    if (!imageUrl) return;

    executeCommand('insertImage', imageUrl);

    setImageDialogOpen(false);
    setImageUrl('');
    setImageAlt('');
  }, [imageUrl, executeCommand]);

  /**
   * Insérer tableau
   */
  const handleInsertTable = useCallback(() => {
    const rows = prompt('Nombre de lignes:', '3');
    const cols = prompt('Nombre de colonnes:', '3');

    if (!rows || !cols) return;

    const tableHTML = `
      <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        ${Array.from({ length: parseInt(rows) })
          .map(
            (_, i) => `
          <tr>
            ${Array.from({ length: parseInt(cols) })
              .map((_, j) => `<td>${i === 0 ? `Colonne ${j + 1}` : ''}</td>`)
              .join('')}
          </tr>
        `
          )
          .join('')}
      </table>
    `;

    executeCommand('insertHTML', tableHTML);
  }, [executeCommand]);

  /**
   * Handler onChange
   */
  const handleChange = useCallback(() => {
    if (!editorRef.current) return;

    const html = editorRef.current.innerHTML;
    onChange(html);
  }, [onChange]);

  /**
   * Export HTML
   */
  const handleExportHTML = useCallback(() => {
    const blob = new Blob([value], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [value]);

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (!modifier) return;

      // Ctrl+B = Bold
      if (e.key === 'b') {
        e.preventDefault();
        handleBold();
      }
      // Ctrl+I = Italic
      else if (e.key === 'i') {
        e.preventDefault();
        handleItalic();
      }
      // Ctrl+U = Underline
      else if (e.key === 'u') {
        e.preventDefault();
        handleUnderline();
      }
      // Ctrl+K = Link
      else if (e.key === 'k') {
        e.preventDefault();
        setLinkDialogOpen(true);
      }
    };

    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('keydown', handleKeyDown as any);
      return () => editor.removeEventListener('keydown', handleKeyDown as any);
    }
    return undefined;
  }, [handleBold, handleItalic, handleUnderline]);

  /**
   * Render Toolbar Button
   */
  const renderToolbarButton = (item: ToolbarItem, index: number) => {
    if (item === '|') {
      return <Separator key={index} orientation="vertical" className="h-6" />;
    }

    const buttons: Record<string, { icon: any; label: string; onClick: () => void }> = {
      bold: { icon: Bold, label: 'Gras (Ctrl+B)', onClick: handleBold },
      italic: { icon: Italic, label: 'Italique (Ctrl+I)', onClick: handleItalic },
      underline: { icon: Underline, label: 'Souligné (Ctrl+U)', onClick: handleUnderline },
      strikethrough: {
        icon: Strikethrough,
        label: 'Barré',
        onClick: handleStrikethrough,
      },
      h1: { icon: Heading1, label: 'Titre 1', onClick: handleH1 },
      h2: { icon: Heading2, label: 'Titre 2', onClick: handleH2 },
      h3: { icon: Heading3, label: 'Titre 3', onClick: handleH3 },
      ol: { icon: ListOrdered, label: 'Liste numérotée', onClick: handleOrderedList },
      ul: { icon: List, label: 'Liste à puces', onClick: handleUnorderedList },
      quote: { icon: Quote, label: 'Citation', onClick: handleQuote },
      code: { icon: Code, label: 'Code', onClick: handleCode },
      link: { icon: Link, label: 'Lien (Ctrl+K)', onClick: () => setLinkDialogOpen(true) },
      image: { icon: ImageIcon, label: 'Image', onClick: () => setImageDialogOpen(true) },
      table: { icon: Table, label: 'Tableau', onClick: handleInsertTable },
      undo: { icon: Undo2, label: 'Annuler (Ctrl+Z)', onClick: handleUndo },
      redo: { icon: Redo2, label: 'Rétablir (Ctrl+Y)', onClick: handleRedo },
    };

    const button = buttons[item];
    if (!button) return null;

    const Icon = button.icon;

    return (
      <TooltipProvider key={index}>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={button.onClick}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <Icon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{button.label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  /**
   * Sanitize HTML pour preview
   */
  const sanitizedHTML = DOMPurify.sanitize(value);

  return (
    <>
      <div
        className={cn(
          'border rounded-lg overflow-hidden bg-white dark:bg-gray-950',
          isFullscreen && 'fixed inset-0 z-50 rounded-none',
          className
        )}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-1 flex-1 overflow-x-auto">
            {toolbar.map((item, index) => renderToolbarButton(item, index))}
          </div>

          <div className="flex items-center gap-1 ml-auto flex-shrink-0">
            {/* Preview Toggle */}
            {showPreview && (
              <Button
                variant={mode === 'preview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
                disabled={disabled}
                className="h-8 w-8 p-0"
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}

            {/* Export */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExportHTML}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exporter HTML</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Fullscreen Toggle */}
            {allowFullscreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="h-8 w-8 p-0"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Editor / Preview */}
        <div
          className={cn(
            'overflow-y-auto',
            isFullscreen ? 'h-[calc(100vh-60px)]' : '',
            !isFullscreen && minHeight && `min-h-[${minHeight}px]`,
            !isFullscreen && maxHeight && `max-h-[${maxHeight}px]`
          )}
          style={{
            minHeight: !isFullscreen && minHeight ? `${minHeight}px` : undefined,
            maxHeight: !isFullscreen && maxHeight ? `${maxHeight}px` : undefined,
          }}
        >
          {mode === 'edit' ? (
            <div
              ref={editorRef}
              contentEditable={!disabled}
              onInput={handleChange}
              className={cn(
                'p-4 outline-none prose prose-sm max-w-none',
                'dark:prose-invert',
                'prose-headings:font-bold',
                'prose-a:text-blue-600 dark:prose-a:text-blue-400',
                'prose-code:bg-gray-100 dark:prose-code:bg-gray-800',
                'prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-700',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              data-placeholder={placeholder}
              suppressContentEditableWarning
            />
          ) : (
            <div
              className="p-4 prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
            />
          )}
        </div>
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insérer un lien</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="link-text">Texte (optionnel)</Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Texte du lien"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleInsertLink}>Insérer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insérer une image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-url">URL de l'image</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <Label htmlFor="image-alt">Texte alternatif (optionnel)</Label>
              <Input
                id="image-alt"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Description de l'image"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleInsertImage}>Insérer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
