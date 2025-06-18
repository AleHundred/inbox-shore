'use client';

import { Loader2, Send } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useSendReply } from '@/lib/hooks';
import { useToastFeedback } from '@/lib/hooks/useToastFeedback';

interface ReplyProps {
  requestId: string;
}

/**
 * A form component for sending replies to support requests.
 * Provides a text area for message input and handles message submission.
 * Supports keyboard shortcuts:
 * - ⌘/Ctrl + Enter to send the message
 * - Esc to clear the input
 *
 * @param props - The component props
 * @param props.requestId - The unique identifier of the request to reply to
 * @returns A form component for sending replies
 */
export function Reply({ requestId }: ReplyProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { mutate, isPending } = useSendReply();
  const { showError, showSuccess } = useToastFeedback();

  /**
   * Focus the textarea when the component mounts
   */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  /**
   * Handles form submission by sending the reply message
   *
   * @param e - The form submission event
   */
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (isSubmitting) return;

      const trimmedMessage = message.trim();
      if (!trimmedMessage) {
        showError('Please enter a message');
        return;
      }

      setIsSubmitting(true);

      try {
        await new Promise<void>((resolve, reject) => {
          mutate(
            { requestId, text: trimmedMessage },
            {
              onSuccess: () => {
                setMessage('');
                showSuccess('Reply sent successfully');
                resolve();
              },
              onError: (error) => {
                showError(`Failed to send reply: ${error.message}`);
                reject(error);
              },
              onSettled: () => {
                if (textareaRef.current) {
                  textareaRef.current.focus();
                }
              },
            }
          );
        });
      } catch (error) {
        console.error('Error in handleSubmit:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [message, requestId, mutate, showError, showSuccess, isSubmitting]
  );

  /**
   * Handles keyboard shortcuts for sending and clearing messages
   * - ⌘/Ctrl + Enter: Submit the form if message is not empty
   * - Esc: Clear the message
   *
   * @param e - The keyboard event
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (message.trim()) {
          handleSubmit(e as unknown as FormEvent);
        }
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setMessage('');
      }
    },
    [message, handleSubmit]
  );

  return (
    <form onSubmit={handleSubmit} aria-label='Reply form' className='animate-fade-in'>
      <Card className='border border-border/5 bg-card shadow-lg'>
        <CardContent className='p-3'>
          <div className='flex gap-3'>
            <Textarea
              id='reply-message'
              ref={textareaRef}
              value={message}
              onChange={(value) => setMessage(value)}
              placeholder='Type your reply...'
              disabled={isPending || isSubmitting}
              onKeyDown={handleKeyDown}
              className={`min-h-28 flex-grow text-lg resize-y bg-muted border-muted focus:border-accent focus:ring-accent/20 ${
                isSubmitting ? 'opacity-70 cursor-progress' : ''
              }`}
              aria-label='Reply message'
              aria-required='true'
              aria-describedby='reply-instructions'
            />
            <div className='flex self-stretch w-auto'>
              <Button
                type='submit'
                disabled={isPending || isSubmitting || !message.trim()}
                className={`bg-accent hover:bg-accent/90 text-white font-medium text-lg px-5 h-full w-full flex items-center justify-center ${
                  isSubmitting ? 'opacity-70 cursor-progress' : ''
                }`}
                aria-busy={isPending || isSubmitting}
                variant='default'
              >
                {isPending ? (
                  <>
                    <Loader2 className='mr-2 h-6 w-6 animate-spin' />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className='mr-2 h-6 w-6' />
                    <span>Send</span>
                  </>
                )}
              </Button>
            </div>
          </div>
          <div
            id='reply-instructions'
            className='mt-3 flex justify-between text-base text-muted-foreground'
          >
            <span className='flex items-center gap-1'>
              Press{' '}
              <kbd className='px-2 py-0.5 text-xs font-semibold border rounded-md bg-muted'>⌘</kbd>+
              <kbd className='px-2 py-0.5 text-xs font-semibold border rounded-md bg-muted'>
                Enter
              </kbd>{' '}
              to send
            </span>
            <span className='flex items-center gap-1.5'>
              Press{' '}
              <kbd className='px-2 py-0.5 text-xs font-semibold border rounded-md bg-muted'>
                Esc
              </kbd>{' '}
              to clear
            </span>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
