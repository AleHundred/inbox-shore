import { useCallback, useEffect, useRef, useState } from 'react';

import type { KeyboardNavigationConfig } from '../types';

/**
 * A custom hook that provides keyboard navigation functionality for a list of items.
 *
 * This hook handles arrow key navigation, home/end navigation, and selection via Enter or Space.
 * It also supports wrapping around when reaching the end of a list and vertical/horizontal navigation.
 *
 * @param {KeyboardNavigationConfig} config - Configuration options for keyboard navigation
 * @returns {Object} An object containing the current focused index and a function to set focus
 */
export function useKeyboardNavigation({
  itemsCount,
  onSelect,
  onEscape,
  containerRef,
  initialFocusedIndex = -1,
  wrapping = false,
  vertical = true,
  disabled = false,
}: KeyboardNavigationConfig) {
  const [focusedIndex, setFocusedIndex] = useState(initialFocusedIndex);
  const itemsCountRef = useRef(itemsCount);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (
        disabled ||
        itemsCount <= 0 ||
        !containerRef.current ||
        !containerRef.current.contains(document.activeElement)
      ) {
        return;
      }

      const maxIndex = itemsCount - 1;
      const nextKey = vertical ? 'ArrowDown' : 'ArrowRight';
      const prevKey = vertical ? 'ArrowUp' : 'ArrowLeft';

      switch (event.key) {
        case nextKey:
          event.preventDefault();
          setFocusedIndex((prev) => {
            if (prev >= maxIndex) {
              return wrapping ? 0 : maxIndex;
            }
            return prev + 1;
          });
          break;

        case prevKey:
          event.preventDefault();
          setFocusedIndex((prev) => {
            if (prev <= 0) {
              return wrapping ? maxIndex : 0;
            }
            return prev - 1;
          });
          break;

        case 'Home':
          event.preventDefault();
          setFocusedIndex(0);
          break;

        case 'End':
          event.preventDefault();
          setFocusedIndex(maxIndex);
          break;

        case 'Enter':
        case ' ':
          if (focusedIndex >= 0 && focusedIndex < itemsCount) {
            event.preventDefault();
            onSelect(focusedIndex);
          }
          break;

        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
      }
    },
    [itemsCount, containerRef, onSelect, onEscape, focusedIndex, wrapping, vertical, disabled]
  );

  useEffect(() => {
    if (itemsCount > 0 && itemsCountRef.current === 0 && focusedIndex === -1) {
      setFocusedIndex(0);
    }
    itemsCountRef.current = itemsCount;
  }, [itemsCount, focusedIndex]);

  useEffect(() => {
    if (focusedIndex >= itemsCount && itemsCount > 0) {
      setFocusedIndex(itemsCount - 1);
    } else if (itemsCount === 0) {
      setFocusedIndex(-1);
    }
  }, [itemsCount, focusedIndex]);

  useEffect(() => {
    if (disabled) return undefined;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, disabled]);

  /**
   * Sets focus to a specific index in the list
   *
   * @param {number} index - The index to focus (-1 means no focus)
   */
  const setFocus = useCallback(
    (index: number) => {
      if (index >= -1 && index < itemsCount) {
        setFocusedIndex(index);
      }
    },
    [itemsCount]
  );

  return {
    focusedIndex,
    setFocus,
  };
}
