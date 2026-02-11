// Type declarations for external modules without bundled types

declare module 'xlsx' {
  export const utils: {
    json_to_sheet: (data: Record<string, unknown>[]) => unknown;
    book_new: () => unknown;
    book_append_sheet: (workbook: unknown, sheet: unknown, name: string) => void;
    aoa_to_sheet: (data: unknown[][]) => unknown;
  };
  export function writeFile(workbook: unknown, filename: string): void;
  export function write(workbook: unknown, opts: Record<string, unknown>): ArrayBuffer;
}

declare module 'file-saver' {
  export function saveAs(data: Blob | string, filename?: string, opts?: Record<string, unknown>): void;
}

declare module 'react-dropzone' {
  import type { HTMLAttributes } from 'react';

  interface FileRejection {
    file: File;
    errors: Array<{ message: string; code: string }>;
  }

  interface DropzoneOptions {
    onDrop?: (acceptedFiles: File[]) => void;
    onDropRejected?: (fileRejections: FileRejection[]) => void;
    accept?: Record<string, string[]>;
    maxSize?: number;
    multiple?: boolean;
    disabled?: boolean;
  }

  interface DropzoneState {
    getRootProps: <T extends HTMLAttributes<HTMLElement>>(props?: T) => T;
    getInputProps: <T extends HTMLAttributes<HTMLInputElement>>(props?: T) => T;
    isDragActive: boolean;
    isDragAccept: boolean;
    isDragReject: boolean;
  }

  export function useDropzone(options?: DropzoneOptions): DropzoneState;
}
