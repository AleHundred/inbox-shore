'use client';

import { HydrationBoundary as ReactQueryHydrationBoundary } from '@tanstack/react-query';
import type { DehydratedState } from '@tanstack/react-query';
import React from 'react';

interface HydrationBoundaryProps {
  children: React.ReactNode;
  /**
   * Dehydrated state from the server to hydrate the client cache
   */
  state: DehydratedState;
}

/**
 * Component that hydrates the React Query cache with server-fetched data
 * This enables a seamless transition between server and client rendering
 */
export function HydrationBoundary({ children, state }: HydrationBoundaryProps) {
  return <ReactQueryHydrationBoundary state={state}>{children}</ReactQueryHydrationBoundary>;
}
