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
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="h-full p-4 sm:p-6 md:p-8 lg:p-12">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
