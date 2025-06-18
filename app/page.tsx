'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/hooks/useAuth';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    if (isLoading || hasRedirected) return;

    const redirect = () => {
      setHasRedirected(true);
      if (isAuthenticated) {
        router.replace('/requests');
      } else {
        router.replace('/login');
      }
    };

    const timeoutId = setTimeout(() => {
      redirect();
      setTimeout(() => setShowLoading(false), 200);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, isLoading, hasRedirected, router]);

  if (showLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background auth-transition'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent' />
      </div>
    );
  }

  return null;
}
