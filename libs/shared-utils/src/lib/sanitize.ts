/**
 * HTML Sanitization utilities using DOMPurify
 *
 * These utilities provide XSS protection for any user-generated HTML content
 * that needs to be rendered in the application.
 *
 * @module sanitize
 */

import * as DOMPurifyLib from 'dompurify';
import type { Config, DOMPurify as DOMPurifyType } from 'dompurify';

// Handle both ESM and CommonJS module formats
// In ESM build: default export is the function
// In CommonJS (Jest): module itself is the function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createDOMPurify = (DOMPurifyLib as any).default ?? DOMPurifyLib;

// Lazy-initialized DOMPurify instances
// Using separate instances for different purposes to avoid hook interference
let _purifyWithLinkSecurity: DOMPurifyType | null = null;
let _purifyBasic: DOMPurifyType | null = null;

/**
 * Get DOMPurify instance with permanent link security hooks
 * Used by sanitizeHtml to enforce rel="noopener noreferrer" on all links
 */
function getDOMPurifyWithLinkSecurity(): DOMPurifyType {
  if (!_purifyWithLinkSecurity) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const purify = createDOMPurify(window as any) as DOMPurifyType;

    // Register hook once at initialization - permanent and thread-safe
    purify.addHook('afterSanitizeAttributes', (node: Element) => {
      if (node.tagName === 'A' && node.hasAttribute('href')) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    });

    _purifyWithLinkSecurity = purify;
  }
  return _purifyWithLinkSecurity;
}

/**
 * Get basic DOMPurify instance without hooks
 * Used by stripHtml and containsDangerousHtml
 */
function getDOMPurifyBasic(): DOMPurifyType {
  if (!_purifyBasic) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _purifyBasic = createDOMPurify(window as any) as DOMPurifyType;
  }
  return _purifyBasic;
}

export type SanitizePreset = 'strict' | 'standard' | 'rich' | 'textOnly';

/**
 * Configuration presets for different sanitization scenarios
 */
export const SANITIZE_PRESETS: Record<SanitizePreset, Config> = {
  /**
   * Strict: Only allow basic formatting tags, no links or media
   * Use for: Comments, short text fields
   */
  strict: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'span'],
    ALLOWED_ATTR: [],
  },

  /**
   * Standard: Allow common formatting including links
   * Use for: Descriptions, rich text content
   */
  standard: {
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'br',
      'p',
      'span',
      'a',
      'ul',
      'ol',
      'li',
      'blockquote',
      'code',
      'pre',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ADD_ATTR: ['target', 'rel'],
  },

  /**
   * Rich: Allow more HTML elements for rich content
   * Use for: Help articles, markdown-rendered content
   */
  rich: {
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'br',
      'p',
      'span',
      'a',
      'ul',
      'ol',
      'li',
      'blockquote',
      'code',
      'pre',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'img',
      'hr',
      'div',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'class'],
    ADD_ATTR: ['target', 'rel'],
  },

  /**
   * Text only: Strip all HTML, return plain text
   * Use for: Usernames, labels, any text-only fields
   */
  textOnly: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  },
};

/**
 * Sanitize HTML string to prevent XSS attacks
 *
 * @param dirty - The untrusted HTML string to sanitize
 * @param preset - Sanitization preset to use (default: 'standard')
 * @returns Sanitized HTML string safe for rendering
 *
 * @example
 * // Basic usage
 * const cleanHtml = sanitizeHtml('<script>alert("xss")</script><p>Hello</p>');
 * // Returns: '<p>Hello</p>'
 *
 * @example
 * // With preset
 * const strictHtml = sanitizeHtml(userInput, 'strict');
 * const richHtml = sanitizeHtml(markdownHtml, 'rich');
 *
 * @example
 * // Use with dangerouslySetInnerHTML
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userContent) }} />
 */
export function sanitizeHtml(
  dirty: string,
  preset: SanitizePreset = 'standard'
): string {
  if (!dirty) return '';

  const config = SANITIZE_PRESETS[preset];

  // Use the instance with permanent link security hooks
  return getDOMPurifyWithLinkSecurity().sanitize(dirty, config);
}

/**
 * Strip all HTML tags and return plain text
 *
 * @param dirty - The HTML string to strip
 * @returns Plain text without any HTML tags
 *
 * @example
 * const text = stripHtml('<p>Hello <b>World</b></p>');
 * // Returns: 'Hello World'
 */
export function stripHtml(dirty: string): string {
  if (!dirty) return '';
  return getDOMPurifyBasic().sanitize(dirty, SANITIZE_PRESETS.textOnly);
}

/**
 * Check if a string contains potentially dangerous HTML
 *
 * Uses strict equality comparison between original and sanitized content
 * to detect any modification by DOMPurify.
 *
 * @param html - The HTML string to check
 * @returns true if the string contains potentially dangerous content
 *
 * @example
 * containsDangerousHtml('<script>alert("xss")</script>'); // true
 * containsDangerousHtml('<p>Hello</p>'); // false
 */
export function containsDangerousHtml(html: string): boolean {
  if (!html) return false;

  // Sanitize with the most permissive preset (rich)
  const sanitized = getDOMPurifyBasic().sanitize(html, SANITIZE_PRESETS.rich);

  // Strict comparison: if sanitization changed anything, it's dangerous
  // This is more reliable than length-based heuristics
  return sanitized !== html;
}

/**
 * Sanitize a URL to prevent javascript: and data: URLs
 *
 * Handles protocol injection attacks by normalizing control characters
 * before checking protocols.
 *
 * @param url - The URL to sanitize
 * @returns Sanitized (trimmed) URL or empty string if dangerous
 *
 * @example
 * sanitizeUrl('javascript:alert("xss")'); // ''
 * sanitizeUrl('https://example.com'); // 'https://example.com'
 * sanitizeUrl('  https://example.com  '); // 'https://example.com'
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  // Trim whitespace from the URL
  const trimmed = url.trim();

  // Normalize for protocol checks: remove all ASCII control characters and whitespace
  // This prevents protocol injection via interior whitespace (e.g., "java\tscript:")
  // Using character code ranges to avoid lint warnings about control characters
  // eslint-disable-next-line no-control-regex
  const controlCharRegex = /[\u0000-\u0020\u007f-\u009f]/g;
  const normalized = trimmed.toLowerCase().replace(controlCharRegex, '');

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];

  for (const protocol of dangerousProtocols) {
    if (normalized.startsWith(protocol)) {
      return '';
    }
  }

  // Check for protocol presence using normalized string
  const hasProtocol = normalized.includes(':');

  if (hasProtocol) {
    // Check relative URLs using trimmed (original) string for accuracy
    const trimmedLower = trimmed.toLowerCase();
    const isRelative =
      trimmedLower.startsWith('/') ||
      trimmedLower.startsWith('./') ||
      trimmedLower.startsWith('../') ||
      trimmedLower.startsWith('?') ||
      trimmedLower.startsWith('#');

    // Safe protocols
    const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    const isSafe = safeProtocols.some((p) => normalized.startsWith(p));

    if (!isRelative && !isSafe) {
      return '';
    }
  }

  // Return trimmed URL (not original with whitespace)
  return trimmed;
}
