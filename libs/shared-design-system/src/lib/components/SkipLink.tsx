/**
 * SkipLink Component
 *
 * Skip navigation link for keyboard users (WCAG 2.4.1 Bypass Blocks).
 * Hidden visually but accessible to screen readers.
 * Becomes visible on focus.
 *
 * @module @mfe/shared-design-system
 */

import * as React from 'react';
import { cn } from '../utils/cn';

export interface SkipLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Target element ID to skip to (without #) */
  targetId: string;
  /** Link text (default: "Skip to main content") */
  children?: React.ReactNode;
}

/**
 * Skip navigation link for keyboard users.
 *
 * Visually hidden by default but becomes visible when focused.
 * Allows keyboard users to bypass repetitive navigation and skip
 * directly to main content.
 *
 * @example
 * ```tsx
 * <SkipLink targetId="main-content" />
 * <Header />
 * <main id="main-content">
 *   {content}
 * </main>
 * ```
 */
const SkipLink = React.forwardRef<HTMLAnchorElement, SkipLinkProps>(
  (
    { targetId, children = 'Skip to main content', className, onClick, ...props },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();

      const target = document.getElementById(targetId);
      if (target) {
        // Make the target focusable if it isn't already
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
        }
        target.focus();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Call any additional onClick handler
      onClick?.(e);
    };

    return (
      <a
        ref={ref}
        href={`#${targetId}`}
        onClick={handleClick}
        className={cn(
          // Visually hidden by default (screen reader accessible)
          'sr-only',
          // Visible and styled on focus
          'focus:not-sr-only',
          'focus:fixed focus:top-4 focus:left-4 focus:z-[9999]',
          'focus:px-4 focus:py-2 focus:rounded-md',
          'focus:bg-[rgb(var(--primary))] focus:text-[rgb(var(--primary-foreground))]',
          'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2',
          'focus:shadow-lg',
          'transition-all duration-150',
          'text-sm font-medium',
          className
        )}
        {...props}
      >
        {children}
      </a>
    );
  }
);
SkipLink.displayName = 'SkipLink';

export { SkipLink };
