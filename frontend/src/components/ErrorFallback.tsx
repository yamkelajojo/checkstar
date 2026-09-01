'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorFallback({ message = 'Something went wrong', onRetry, className }: ErrorFallbackProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className ?? ''}`}>
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertTriangle className="text-red-500" size={24} />
      </div>
      <p className="text-sm font-medium text-gray-900 mb-1">{message}</p>
      <p className="text-xs text-gray-500 mb-4">Please try again or check your connection.</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      )}
    </div>
  );
}
