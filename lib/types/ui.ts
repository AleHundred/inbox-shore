import type { ReactNode, RefObject } from 'react';

import type { Customer, EntryNode, RequestSummary, TimelineApiResponse } from './api';

/**
 * UI component-specific types and interfaces
 */

/**
 * Button component variants
 */
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

/**
 * Button component props
 */
export interface ButtonProps extends React.ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

/**
 * Badge component variants
 */
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

/**
 * Badge component props
 */
export interface BadgeProps {
  className?: string;
  variant?: BadgeVariant;
  asChild?: boolean;
}

/**
 * Text input component props
 */
export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
  type?: string;
  className?: string;
}

/**
 * Text area component props
 */
export interface TextAreaProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  className?: string;
}

/**
 * Form field wrapper props
 */
export interface FormFieldProps {
  label?: string;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
}

/**
 * Card component props
 */
export interface CardProps extends React.ComponentProps<'div'> {
  title?: string;
  footer?: ReactNode;
}

/**
 * Error boundary props
 */
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  logName?: string;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

/**
 * Error fallback component props
 */
export interface ErrorFallbackProps {
  title: string;
  message: string;
  onRetry: () => void;
}

/**
 * Error placeholder props
 */
export interface ErrorPlaceholderProps {
  onRetry: () => void;
  isMalformedData?: boolean;
  customMessage?: string;
}

/**
 * Navigation component props
 */
export interface NavigationProps {
  hasBackButton?: boolean;
  title?: string;
  isAuthenticated?: boolean;
}

/**
 * Pagination controls props
 */
export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Request row component props
 */
export interface RequestRowProps {
  request: RequestSummary;
  customerDataMap: Record<string, Customer>;
  isActive: boolean;
  onSelect: (requestId: string) => void;
  onHover?: (requestId: string) => void;
  index: number;
}

/**
 * Request message component props
 */
export interface RequestMessageProps {
  entry: EntryNode;
  actorName: string;
  isUserMessage: boolean;
  isOptimistic: boolean;
}

/**
 * Reply component props
 */
export interface ReplyProps {
  requestId: string;
}

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'info' | 'loading';

/**
 * Toast options
 */
export interface ToastOptions {
  id?: string | number;
  duration?: number;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Keyboard navigation configuration
 */
export interface KeyboardNavigationConfig {
  itemsCount: number;
  onSelect: (index: number) => void;
  onEscape?: () => void;
  containerRef: RefObject<HTMLElement>;
  initialFocusedIndex?: number;
  wrapping?: boolean;
  vertical?: boolean;
  disabled?: boolean;
}

/**
 * Scroll handler options
 */
export interface UseScrollHandlerOptions {
  setPinnedToBottom: (isPinned: boolean) => void;
  timelineLength: number;
  hasNewMessages: boolean;
  scrollThreshold?: number;
  onLoadMore: () => Promise<TimelineApiResponse | undefined>;
  hasPreviousPage: boolean;
}

/**
 * Mutation context for React Query
 */
export interface MutationContext {
  toastId: string;
}
