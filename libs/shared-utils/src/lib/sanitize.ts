/**
 * HTML Sanitization utilities using DOMPurify
 *
 * These utilities provide XSS protection for any user-generated HTML content
 * that needs to be rendered in the application.
 *
 * @module sanitize
 */

import * as DOMPurifyModule from 'dompurify';

// Handle both ESM and CommonJS module formats
// In ESM: DOMPurify is at .default, in CommonJS it's the module itself
const DOMPurify = (
  DOMPurifyModule as unknown as { default?: typeof DOMPurifyModule }
).default ?? DOMPurifyModule;

/**
 * Configuration presets for different sanitization scenarios
 */
export const SANITIZE_PRESETS = {
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
    // Force all links to open in new tab with noopener
    FORCE_BODY: true,
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
} as const;

export type SanitizePreset = keyof typeof SANITIZE_PRESETS;

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

  // Add hook to enforce rel="noopener noreferrer" on all links
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.hasAttribute('href')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });

  const clean = DOMPurify.sanitize(dirty, config);

  // Remove the hook to avoid affecting other sanitize calls
  DOMPurify.removeHook('afterSanitizeAttributes');

  return clean;
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
  return DOMPurify.sanitize(dirty, SANITIZE_PRESETS.textOnly);
}

/**
 * Check if a string contains potentially dangerous HTML
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
  const sanitized = DOMPurify.sanitize(html, SANITIZE_PRESETS.rich);

  // If sanitization changed the content significantly, it likely contained dangerous HTML
  // Compare lengths as a quick heuristic
  const originalLength = html.length;
  const sanitizedLength = sanitized.length;

  // If more than 10% of content was removed, consider it dangerous
  return sanitizedLength < originalLength * 0.9;
}

/**
 * Sanitize a URL to prevent javascript: and data: URLs
 *
 * @param url - The URL to sanitize
 * @returns Sanitized URL or empty string if dangerous
 *
 * @example
 * sanitizeUrl('javascript:alert("xss")'); // ''
 * sanitizeUrl('https://example.com'); // 'https://example.com'
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  // Trim and lowercase for comparison
  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
  ];

  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return '';
    }
  }

  // Allow relative URLs and standard protocols
  const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
  const hasProtocol = trimmed.includes(':');

  if (hasProtocol) {
    const isRelative = trimmed.startsWith('/') || trimmed.startsWith('./');
    const isSafe = safeProtocols.some((p) => trimmed.startsWith(p));

    if (!isRelative && !isSafe) {
      return '';
    }
  }

  return url;
}
