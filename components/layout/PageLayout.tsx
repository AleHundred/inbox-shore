'use client';

import { type ReactNode, useEffect, useState } from 'react';

import { SUPPORT_APP_TITLE } from '@/lib/constants';
import { useAuth } from '@/lib/hooks';
import type { NavigationProps } from '@/lib/types';

import Navigation from './Navigation';

interface PageLayoutProps {
  children: ReactNode;
  navigation: Omit<NavigationProps, 'ref'>;
}

/**
 * Page layout component that provides consistent structure with navigation
 * and main content area.
 *
 * @param props - Component props
 * @param props.children - Content to be rendered in the main area
 * @param props.navigation - Props to be passed to the Navigation component
 * @returns {JSX.Element} The rendered page layout
 */
export function PageLayout({ children, navigation }: PageLayoutProps) {
  const { isAuthenticated: authState } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isAuthenticated = !isClient
    ? navigation.isAuthenticated !== undefined
      ? navigation.isAuthenticated
      : true
    : navigation.isAuthenticated !== undefined
      ? navigation.isAuthenticated
      : authState;

  return (
    <div className='flex flex-col min-h-screen'>
      <Navigation
        title={navigation.title ?? SUPPORT_APP_TITLE}
        hasBackButton={navigation.hasBackButton ?? false}
        isAuthenticated={isAuthenticated}
      />
      <main className='flex-1 pt-20'>{children}</main>
    </div>
  );
}
