'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useCallback, useState } from 'react';

import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateRequest } from '@/lib/hooks';
import { useToastFeedback } from '@/lib/hooks/useToastFeedback';

/**
 * NewRequestPage component for creating support requests
 * Uses the Layout component with proper navigation
 */
export default function NewRequestPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { mutate, isPending } = useCreateRequest();
  const { showError } = useToastFeedback();

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedSubject = subject.trim();
      const trimmedMessage = message.trim();

      if (!trimmedSubject || !trimmedMessage) {
        showError(!trimmedSubject ? 'Please enter a subject' : 'Please enter a message');
        return;
      }

      mutate(
        {
          title: trimmedSubject,
          message: trimmedMessage,
        },
        {
          onSuccess: () => {
            router.push('/requests');
          },
        }
      );
    },
    [subject, message, router, mutate, showError]
  );

  const isFormValid = subject.trim() && message.trim();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (isFormValid) {
          e.preventDefault();
          onSubmit(e as unknown as React.FormEvent);
        }
      }
    },
    [isFormValid, onSubmit]
  );

  return (
    <PageLayout
      navigation={{ title: 'New Support Request', hasBackButton: true, isAuthenticated: true }}
    >
      <ErrorBoundary logName='NewRequestForm'>
        <main className='container mx-auto max-w-2xl px-4 py-12 md:px-6 lg:px-8'>
          <Card className='shadow-md'>
            <CardHeader>
              <CardTitle className='text-2xl pb-4'>Create a New Support Request</CardTitle>
              <CardDescription>
                Describe your issue and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>

            <form onSubmit={onSubmit} aria-busy={isPending}>
              <CardContent className='space-y-6 px-6 py-4'>
                <div className='space-y-3 pt-2'>
                  <Label htmlFor='subject' className='text-sm font-medium'>
                    Subject
                  </Label>
                  <Input
                    id='subject'
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder='Brief description of your issue'
                    disabled={isPending}
                    required
                    aria-required='true'
                    className='mt-1.5'
                  />
                </div>

                <div className='space-y-3 pt-2'>
                  <Label htmlFor='message' className='text-sm font-medium'>
                    Your message
                  </Label>
                  <Textarea
                    id='message'
                    value={message}
                    onChange={(value) => setMessage(value)}
                    placeholder='Please provide details about your issue...'
                    disabled={isPending}
                    required
                    className='min-h-40 mt-1.5'
                    onKeyDown={handleKeyDown}
                    aria-required='true'
                  />
                  <p className='mt-2 text-xs text-gray-500'>
                    Press <kbd className='rounded border px-1 py-0.5 text-xs'>Ctrl</kbd> +{' '}
                    <kbd className='rounded border px-1 py-0.5 text-xs'>Enter</kbd> to submit
                  </p>
                </div>
              </CardContent>

              <CardFooter className='px-6 py-4'>
                <Button
                  type='submit'
                  disabled={isPending || !isFormValid}
                  className='w-full gap-2 bg-slate-700 hover:bg-slate-800 font-bold'
                  size='lg'
                  aria-busy={isPending}
                >
                  {isPending && <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' />}
                  Submit Request
                </Button>
              </CardFooter>
            </form>
          </Card>
        </main>
      </ErrorBoundary>
    </PageLayout>
  );
}
