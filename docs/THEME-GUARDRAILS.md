# Theme Guardrails Setup Guide

This document explains how to set up and use the theme guardrails to prevent regressions in the dark mode implementation.

## What Are Theme Guardrails?

Theme guardrails are automated checks that prevent developers from introducing hardcoded color utilities (like `bg-white`, `text-slate-600`) into the codebase. Instead, they enforce the use of semantic token utilities (like `bg-background`, `text-muted-foreground`).

## Components

### 1. ESLint Rule: `no-hardcoded-colors`

**Location:** `scripts/eslint-rules/no-hardcoded-colors.js`

This custom ESLint rule detects and warns about hardcoded color utilities in JSX and string literals.

**Blocked Patterns:**

- `bg-white`, `bg-slate-*`, `bg-gray-*`, `text-slate-*`, `border-gray-*`
- `hover:bg-*`, `focus:ring-*`, `dark:bg-*` (with hardcoded colors)
- Brand colors like `bg-blue-*`, `text-red-*` (use `primary`, `secondary`, `destructive` instead)

**Allowed Patterns:**

- Semantic tokens: `bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`
- Focus/ring states: `focus:ring-ring`, `ring-offset-background`
- Brand states: `bg-primary`, `text-secondary`, `border-destructive`

**Configuration:** Integrated into `eslint.config.mjs` as `'theme-colors/no-hardcoded-colors': 'warn'`

**Running Manually:**

```bash
pnpm eslint "apps/**/*.tsx" --rule "theme-colors/no-hardcoded-colors: warn"
```

### 2. Pre-Commit Hook

**Location:** `scripts/pre-commit`

This hook automatically runs ESLint on all staged TypeScript/JavaScript files before a commit is made. It prevents commits that violate theme guardrails.

**Installation:**

```bash
chmod +x scripts/pre-commit
cp scripts/pre-commit .git/hooks/pre-commit
```

After installation, the hook will run automatically on `git commit`. If ESLint warnings are found, the commit is blocked and you must fix the issues first.

**Manual Execution:**

```bash
bash scripts/pre-commit
```

**Disabling the Hook (Not Recommended):**

```bash
git commit --no-verify
```

## Semantic Token Reference

Use these semantic tokens instead of hardcoded colors:

| Use Case          | Dark Mode                                              | Light Mode                                                 | Tailwind Class           |
| ----------------- | ------------------------------------------------------ | ---------------------------------------------------------- | ------------------------ |
| Page background   | `--background: 17 24 39` (gray-900)                    | `--background: 255 255 255` (white)                        | `bg-background`          |
| Page text         | `--foreground: 249 250 251` (gray-50)                  | `--foreground: 17 24 39` (gray-900)                        | `text-foreground`        |
| Secondary surface | `--muted: 31 41 55` (gray-800)                         | `--muted: 249 250 251` (gray-50)                           | `bg-muted`               |
| Secondary text    | `--muted-foreground: 156 163 175` (gray-400)           | `--muted-foreground: 75 85 99` (gray-700)                  | `text-muted-foreground`  |
| Borders           | `--border: 55 65 81` (gray-700)                        | `--border: 229 231 235` (gray-200)                         | `border-border`          |
| Cards             | `--card: 31 41 55` (gray-800)                          | `--card: 255 255 255` (white)                              | `bg-card`                |
| Form inputs       | `--input: 55 65 81` (gray-700)                         | `--input: 255 255 255` (white)                             | `bg-input`               |
| Focus rings       | `--ring: 59 130 246` (blue-500)                        | `--ring: 59 130 246` (blue-500)                            | `focus:ring-ring`        |
| Ring offset       | `--ring-offset-background: 17 24 39` (matches dark bg) | `--ring-offset-background: 255 255 255` (matches light bg) | `ring-offset-background` |

## Examples

### ❌ Before (Hardcoded Colors)

```tsx
<div className="bg-white text-slate-900 border-gray-200 hover:bg-slate-50">
  <p className="text-slate-600">Muted text</p>
  <input className="focus:ring-blue-500" />
</div>
```

### ✅ After (Semantic Tokens)

```tsx
<div className="bg-background text-foreground border-border hover:bg-muted">
  <p className="text-muted-foreground">Muted text</p>
  <input className="focus:ring-ring" />
</div>
```

## Troubleshooting

### ESLint Rule Not Triggering

1. Verify the rule is enabled in `eslint.config.mjs`:

   ```javascript
   'theme-colors/no-hardcoded-colors': 'warn',
   ```

2. Run ESLint manually:

   ```bash
   pnpm eslint apps/shell/src/components/Layout.tsx
   ```

3. Check that the file matches the pattern (`.ts`, `.tsx`, `.js`, `.jsx`)

### Pre-Commit Hook Not Running

1. Verify the hook is installed:

   ```bash
   ls -la .git/hooks/pre-commit
   ```

2. Verify it's executable:

   ```bash
   chmod +x .git/hooks/pre-commit
   ```

3. Test manually:
   ```bash
   bash scripts/pre-commit
   ```

### Committing Code That Violates Rules

If you need to commit code that violates the rules (e.g., in a legacy shim), use:

```bash
git commit --no-verify
```

Then document why in a comment and create an issue to address it later.

## Integration with CI/CD

To enforce these rules in your CI/CD pipeline, add to your GitHub Actions workflow:

```yaml
- name: Check theme guardrails
  run: pnpm eslint "apps/**/*.{ts,tsx}" "libs/**/*.{ts,tsx}" --rule "theme-colors/no-hardcoded-colors: error"
```

This will fail the CI build if any hardcoded colors are detected.

## Next Steps

1. Install the pre-commit hook:

   ```bash
   chmod +x scripts/pre-commit
   cp scripts/pre-commit .git/hooks/pre-commit
   ```

2. Test that it works by attempting to commit a file with hardcoded colors:

   ```bash
   echo 'bg-white' >> apps/shell/src/test.tsx
   git add apps/shell/src/test.tsx
   git commit -m "test" # Should be blocked
   ```

3. Verify the hook catches violations and provides helpful guidance.
