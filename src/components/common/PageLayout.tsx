import React from 'react';
import Navbar from '@/components/Navbar';
import { ErrorBoundary } from './ErrorBoundary';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showNavbar?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  description,
  showNavbar = true,
}) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showNavbar && <Navbar />}
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(title || description) && (
          <div className="mb-8 animate-slide-in">
            {title && (
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            )}
            {description && (
              <p className="text-muted-foreground mt-2">{description}</p>
            )}
          </div>
        )}
        
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      
      <footer className="mt-auto py-6 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground text-center">
            DashWatch — Monitoring your self-hosted infrastructure
          </p>
        </div>
      </footer>
    </div>
  );
};