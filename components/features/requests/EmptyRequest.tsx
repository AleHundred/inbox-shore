import { MessageSquarePlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Empty request component displayed when no requests are available
 *
 * @returns {JSX.Element} The rendered empty state component
 */
export default function EmptyRequest() {
  return (
    <Card className='border-border/10 bg-card p-8 text-center shadow-lg animate-fade-in'>
      <div className='mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4'>
        <MessageSquarePlus className='h-8 w-8 text-accent' />
      </div>
      <div className='space-y-4'>
        <div>
          <h2 className='text-xl font-medium text-foreground'>No Support Requests</h2>
          <p className='text-muted-foreground mt-2'>
            You don't have any support requests yet. Create a new request to get started.
          </p>
        </div>
        <Button asChild className='bg-accent hover:bg-accent/90 text-white font-medium mt-4'>
          <a href='/request/new' className='flex items-center gap-2'>
            <MessageSquarePlus className='h-4 w-4' />
            <span>Create New Support Request</span>
          </a>
        </Button>
      </div>
    </Card>
  );
}
