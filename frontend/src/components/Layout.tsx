import type { ReactNode } from 'react';

// components
import Sidebar from './Sidebar';

// hooks
import { usePrefetchData } from '@/hooks/usePrefetchData';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  // Prefetch all data when user is authenticated to eliminate flash on first navigation
  usePrefetchData();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Skip Navigation Links for Keyboard Users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Aller au contenu principal
      </a>
      <Sidebar />
      <main id="main-content" className="flex-1 overflow-y-auto" role="main" tabIndex={-1}>
        <div className="h-full p-4 sm:p-6 md:p-8 lg:p-12">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
