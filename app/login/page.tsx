'use client';

import Login from '@/components/features/login/Login';
import { PageLayout } from '@/components/layout/PageLayout';
import { SUPPORT_APP_TITLE } from '@/lib/constants';
import { useAuth } from '@/lib/hooks/useAuth';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();

  const renderContent = () => {
    if (isLoading || isAuthenticated) {
      return (
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent' />
      );
    }

    return (
      <>
        <Login />
        <div className='mt-4 text-center'>
          <p className='text-sm text-muted-foreground'>
            Having trouble logging in?{' '}
            <a href='/simple-login' className='text-primary hover:underline'>
              Try simplified login
            </a>
          </p>
        </div>
      </>
    );
  };

  return (
    <PageLayout navigation={{ title: SUPPORT_APP_TITLE, isAuthenticated: false }}>
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
        <header className='py-6 px-4 bg-white dark:bg-gray-800 shadow-sm'>
          <div className='container mx-auto'>
            <h1 className='text-2xl font-bold text-center text-gray-800 dark:text-gray-100'>
              InboxShore Support Portal
            </h1>
          </div>
        </header>
        <div className='container mx-auto px-4'>
          <main className='min-h-[calc(100vh-8rem)] flex items-center justify-center py-8'>
            {isLoading || isAuthenticated ? (
              renderContent()
            ) : (
              <div className='w-full max-w-md'>{renderContent()}</div>
            )}
          </main>
        </div>
      </div>
    </PageLayout>
  );
}
