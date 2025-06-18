'use client';

import { ChevronLeft, LogOut, Menu, MessageCircle, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { forwardRef, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks';
import type { NavigationProps } from '@/lib/types';

/**
 * Navigation component for application header
 *
 * Provides responsive navigation with authentication-aware rendering.
 * Includes support for back button, mobile menu, and authentication status.
 *
 * @param props - Component props
 * @param props.hasBackButton - Whether to show a back button
 * @param props.title - Title to display in the header
 * @param props.isAuthenticated - Authentication status override
 * @param ref - React ref for the header element
 * @returns {JSX.Element} The rendered navigation component
 */
const Navigation = forwardRef<HTMLElement, NavigationProps>((props, ref) => {
  const {
    hasBackButton = false,
    title = 'Inbox Shore',
    isAuthenticated: propIsAuthenticated,
  } = props;
  const pathname = usePathname();
  const { logout, isAuthenticated: authIsAuthenticated } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const isAuthenticated =
    propIsAuthenticated !== undefined ? propIsAuthenticated : authIsAuthenticated;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !menuButtonRef.current?.contains(e.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isMobileMenuOpen]);

  return (
    <header
      ref={ref}
      className='fixed top-0 left-0 right-0 border-b border-border/10 bg-[#0a1018] backdrop-blur-md z-10'
    >
      <div className='container flex h-20 items-center justify-between px-4 md:px-6'>
        <div className='flex items-center gap-3'>
          {hasBackButton && (
            <Button
              variant='ghost'
              size='sm'
              asChild
              className='mr-2 text-foreground hover:bg-muted'
            >
              <Link href='/requests'>
                <ChevronLeft className='h-5 w-5' />
                <span className='sr-only'>Back</span>
              </Link>
            </Button>
          )}
          <h1 className='text-2xl font-semibold tracking-tighter text-accent font-sans'>{title}</h1>
        </div>

        {isClient && isAuthenticated && (
          <>
            <nav className='hidden md:flex items-center gap-3' aria-label='Main navigation'>
              {pathname !== '/requests' && (
                <Button
                  variant='ghost'
                  size='sm'
                  asChild
                  className='text-foreground hover:bg-muted'
                >
                  <Link href='/requests' className='flex items-center gap-2'>
                    <MessageCircle className='h-4 w-4' />
                    <span>Requests</span>
                  </Link>
                </Button>
              )}

              <Button variant='ghost' size='sm' asChild className='text-foreground hover:bg-muted'>
                <Link href='/request/new' className='flex items-center gap-2'>
                  <Plus className='h-4 w-4' />
                  <span>New</span>
                </Link>
              </Button>

              <Button
                variant='ghost'
                size='sm'
                onClick={() => logout()}
                className='text-foreground hover:bg-muted'
              >
                <LogOut className='mr-2 h-4 w-4' />
                <span>Logout</span>
              </Button>
            </nav>

            <div className='md:hidden flex items-center relative'>
              <Button
                ref={menuButtonRef}
                variant='ghost'
                size='sm'
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className='text-foreground hover:bg-muted'
                aria-expanded={isMobileMenuOpen}
                aria-controls='mobile-menu'
                aria-haspopup='true'
              >
                <Menu className='h-5 w-5' />
                <span className='sr-only'>Menu</span>
              </Button>

              {isMobileMenuOpen && (
                <div
                  id='mobile-menu'
                  ref={menuRef}
                  className='absolute top-16 right-0 w-48 bg-card border border-border/10 shadow-lg rounded-md py-2 z-50'
                  role='menu'
                >
                  {pathname !== '/requests' && (
                    <Link
                      href='/requests'
                      className='flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted'
                      onClick={() => setIsMobileMenuOpen(false)}
                      role='menuitem'
                    >
                      <MessageCircle className='h-4 w-4' />
                      <span>Requests</span>
                    </Link>
                  )}

                  <Link
                    href='/request/new'
                    className='flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted'
                    onClick={() => setIsMobileMenuOpen(false)}
                    role='menuitem'
                  >
                    <Plus className='h-4 w-4' />
                    <span>New</span>
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className='flex items-center gap-2 px-4 py-2 text-sm w-full text-left hover:bg-muted'
                    role='menuitem'
                  >
                    <LogOut className='h-4 w-4' />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
});

Navigation.displayName = 'Navigation';

export default Navigation;
