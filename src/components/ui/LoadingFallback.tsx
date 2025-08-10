import React from 'react';

interface LoadingFallbackProps {
  message?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ message }) => {
  return (
    <div className="flex h-screen w-screen items-center justify-center flex-col">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent mb-4"></div>
      {message && (
        <p className="text-muted-foreground text-sm mt-4">{message}</p>
      )}
    </div>
  );
};

export default LoadingFallback;
