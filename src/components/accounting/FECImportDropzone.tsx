import React, { useState, useCallback } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { FileUp, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const FECImportDropzone = ({ onFileSelected, isProcessing }) => {
  const { t } = useLocale();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  }, []);

  const validateAndProcessFile = (file) => {
    setError(null);
    
    // Validate file type (should be .txt, .csv, or no extension for FEC files)
    if (!file.name.match(/\.(txt|csv)$/i) && file.name.indexOf('.') !== -1) {
      setError(t('fecImport.error.fileType', { defaultValue: 'Invalid file type. Please upload a .txt or .csv file, or a file without extension.' }));
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(t('fecImport.error.fileSize', { defaultValue: 'File is too large. Maximum size is 10MB.' }));
      return;
    }
    
    onFileSelected(file);
  };

  return (
    <div className="w-full">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div 
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive ? 'border-blue-600 bg-blue-600/5' : 'border-gray-300 dark:border-gray-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <FileUp className="h-16 w-16 text-gray-400 mb-4" />
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold">{t('fecImport.dropzone.clickToUpload', { defaultValue: 'Click to upload' })}</span> {t('fecImport.dropzone.orDragAndDrop', { defaultValue: 'or drag and drop' })}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('fecImport.dropzone.fileTypes', { defaultValue: 'FEC file (.txt or .csv)' })}
        </p>
        <input
          id="dropzone-file"
          type="file"
          className="hidden"
          accept=".txt,.csv"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => document.getElementById('dropzone-file').click()}
          disabled={isProcessing}
        >
          <FileText className="mr-2 h-4 w-4" />
          {t('fecImport.dropzone.selectFile', { defaultValue: 'Select FEC File' })}
        </Button>
      </div>
    </div>
  );
};

export default FECImportDropzone;