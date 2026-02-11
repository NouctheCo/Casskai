import React from 'react';
import { Toaster } from 'sonner';

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          style: {
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '8px',
          },
        }}
      />
    </>
  );
};
