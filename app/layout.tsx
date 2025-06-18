import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import ErrorBoundary from '@/components/ui/ErrorBoundary';

import ClientProviders from './ClientProviders';
import './globals.css';

export const metadata: Metadata = {
  title: 'InboxShore',
  description: 'InboxShore demo, a grounded support interface for human-scale conversations.',
};

/**
 * Root layout component that wraps the entire application.
 * Provides global styles, error handling, and client providers.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' className='dark'>
      <body className='bg-background text-foreground min-h-screen'>
        <ErrorBoundary logName='Root'>
          <ClientProviders>{children}</ClientProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}
