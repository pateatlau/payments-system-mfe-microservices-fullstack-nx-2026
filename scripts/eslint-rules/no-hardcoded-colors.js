/**
 * Custom ESLint Rule: no-hardcoded-colors
 *
 * Prevents new hardcoded Tailwind color utilities from being added.
 * These should be replaced with semantic token utilities instead.
 *
 * Examples of blocked patterns:
 *   bg-white, bg-slate-*, bg-gray-*, text-slate-*, border-gray-*
 *
 * Allowed patterns:
 *   bg-background, bg-card, bg-muted, text-foreground, text-muted-foreground,
 *   border-border, focus:ring-ring, ring-offset-background, etc.
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow hardcoded color utilities; use semantic tokens instead',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      hardcodedColor:
        'Hardcoded color utility "{{ utility }}" detected. Use semantic tokens instead (e.g., bg-background, text-foreground, border-border)',
    },
  },

  create(context) {
    // List of hardcoded color patterns to block
    const blockedPatterns = [
      // White/gray/slate utilities
      /^bg-(?:white|slate|gray|zinc)/,
      /^text-(?:white|slate|gray|zinc)/,
      /^border-(?:white|slate|gray|zinc)/,
      /^divide-(?:white|slate|gray|zinc)/,
      /^ring-(?:white|slate|gray|zinc)/,
      /^hover:bg-(?:white|slate|gray|zinc)/,
      /^hover:text-(?:white|slate|gray|zinc)/,
      /^focus:ring-(?:white|slate|gray|zinc)/,
      /^group-hover:bg-(?:white|slate|gray|zinc)/,
      /^dark:bg-(?:white|slate|gray|zinc)/,
      /^dark:text-(?:white|slate|gray|zinc)/,

      // Specific color brand utilities without opacity (should use primary, secondary, destructive, accent)
      // Allow opacity modifiers like /15, /20, /40, /50, /80 for color variants (e.g., bg-blue-500/15)
      /^(?:hover:|focus:|active:)?bg-(?:blue|red|green|yellow|orange|purple|pink|rose|amber|emerald)-[0-9]+(?!\/[0-9])/,
      /^(?:hover:|focus:|active:)?text-(?:blue|red|green|yellow|orange|purple|pink|rose|amber|emerald)-[0-9]+(?!\/[0-9])/,
      /^(?:hover:|focus:|active:)?border-(?:blue|red|green|yellow|orange|purple|pink|rose|amber|emerald)-[0-9]+(?!\/[0-9])/,
      /^(?:hover:|focus:|active:)?ring-(?:blue|red|green|yellow|orange|purple|pink|rose|amber|emerald)-[0-9]+(?!\/[0-9])/,
    ];

    return {
      JSXAttribute(node) {
        // Check className attributes in JSX
        if (
          node.name &&
          node.name.name === 'className' &&
          node.value &&
          node.value.type === 'Literal'
        ) {
          const classString = node.value.value;
          if (typeof classString === 'string') {
            const classes = classString.split(/\s+/);

            for (const className of classes) {
              // Skip colors with opacity modifiers (e.g., bg-blue-500/15)
              if (/\/\d+$/.test(className)) {
                continue;
              }

              for (const pattern of blockedPatterns) {
                if (pattern.test(className)) {
                  context.report({
                    node,
                    messageId: 'hardcodedColor',
                    data: { utility: className },
                  });
                  break;
                }
              }
            }
          }
        }
      },

      // Also check string literals that might contain class names
      Literal(node) {
        // Skip if inside className attribute (already handled above)
        if (
          node.parent &&
          node.parent.type === 'JSXAttribute' &&
          node.parent.name &&
          node.parent.name.name === 'className'
        ) {
          return;
        }

        // Check for hardcoded color utilities in other string contexts
        // e.g., clsx('bg-white', 'text-slate-600') or cn({ 'bg-gray-50': true })
        if (typeof node.value === 'string' && node.value.includes('bg-')) {
          // Only validate if it looks like class names (contains common class separators)
          if (
            node.value.includes(' ') ||
            node.value.includes('-') ||
            node.value.includes(':')
          ) {
            const classes = node.value.split(/\s+/);

            for (const className of classes) {
              // Skip colors with opacity modifiers (e.g., bg-blue-500/15)
              if (/\/\d+$/.test(className)) {
                continue;
              }

              for (const pattern of blockedPatterns) {
                if (pattern.test(className)) {
                  // Skip very long strings that are unlikely to be pure class names
                  if (node.value.length > 500) {
                    return;
                  }

                  context.report({
                    node,
                    messageId: 'hardcodedColor',
                    data: { utility: className },
                  });
                  break;
                }
              }
            }
          }
        }
      },
    };
  },
};
