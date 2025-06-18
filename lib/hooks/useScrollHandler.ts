import { useCallback, useEffect, useRef, useState } from 'react';

import type { UseScrollHandlerOptions } from '@/lib/types';

/**
 * Hook to handle scrolling behavior in message timelines
 * Loads older messages and maintains scroll position + pin to the bottom
 *
 * @param options - Configuration options for the scroll handler
 * @returns Scroll handler state and methods
 */
export function useScrollHandler({
  setPinnedToBottom,
  timelineLength,
  hasNewMessages,
  scrollThreshold = 100,
  onLoadMore,
  hasPreviousPage,
}: UseScrollHandlerOptions) {
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const lastScrollPositionRef = useRef<number>(0);
  const lastScrollHeightRef = useRef<number>(0);
  const lastTimelineLengthRef = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);

  const checkIfScrolledToBottom = useCallback(() => {
    if (!messagesContainerRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 20;
  }, []);

  const saveScrollPosition = useCallback(() => {
    if (messagesContainerRef.current) {
      lastScrollPositionRef.current = messagesContainerRef.current.scrollTop;
      lastScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
      lastTimelineLengthRef.current = timelineLength;
    }
  }, [timelineLength]);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollHeight, clientHeight } = messagesContainerRef.current;
      messagesContainerRef.current.scrollTop = scrollHeight - clientHeight;
      setIsPinnedToBottom(true);
      setPinnedToBottom(true);
    }
  }, [setPinnedToBottom]);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const atTop = container.scrollTop < scrollThreshold;
    const atBottom = checkIfScrolledToBottom();

    if (atBottom !== isPinnedToBottom) {
      setIsPinnedToBottom(atBottom);
      setPinnedToBottom(atBottom);
    }

    if (atTop && !isLoadingRef.current && hasPreviousPage) {
      isLoadingRef.current = true;

      saveScrollPosition();

      onLoadMore().finally(() => {
        isLoadingRef.current = false;
      });
    }
  }, [
    checkIfScrolledToBottom,
    isPinnedToBottom,
    setPinnedToBottom,
    scrollThreshold,
    onLoadMore,
    hasPreviousPage,
    saveScrollPosition,
  ]);

  useEffect(() => {
    if (!messagesContainerRef.current || timelineLength === 0) return;

    if (lastTimelineLengthRef.current === 0) {
      lastTimelineLengthRef.current = timelineLength;
      return;
    }

    const container = messagesContainerRef.current;

    if (timelineLength > lastTimelineLengthRef.current) {
      if (timelineLength - lastTimelineLengthRef.current > 1) {
        const oldScrollHeight = lastScrollHeightRef.current;
        const oldScrollTop = lastScrollPositionRef.current;
        const newScrollHeight = container.scrollHeight;

        const heightDiff = newScrollHeight - oldScrollHeight;

        if (heightDiff > 0 && oldScrollTop < 200) {
          requestAnimationFrame(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = 50;
            }
          });
        } else if (heightDiff > 0) {
          requestAnimationFrame(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = oldScrollTop + heightDiff;
            }
          });
        }
      } else if (isPinnedToBottom) {
        requestAnimationFrame(scrollToBottom);
      }
    }

    lastScrollHeightRef.current = container.scrollHeight;
    lastTimelineLengthRef.current = timelineLength;
  }, [timelineLength, isPinnedToBottom, scrollToBottom]);

  useEffect(() => {
    if (hasNewMessages && isPinnedToBottom) {
      requestAnimationFrame(scrollToBottom);
    }
  }, [hasNewMessages, isPinnedToBottom, scrollToBottom]);

  return {
    messagesContainerRef,
    loadMoreRef,
    handleScroll,
    saveScrollPosition,
    scrollToBottom,
    isPinnedToBottom,
  };
}
