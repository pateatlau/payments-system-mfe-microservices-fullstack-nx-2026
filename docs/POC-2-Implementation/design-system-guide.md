# Design System Guide

**Status:** ✅ Complete  
**Date:** 2026-12-09  
**Task:** 5.5.1 - Technical Documentation

## Overview

The design system is built on **shadcn/ui** patterns with **Tailwind CSS v4** and provides production-ready, accessible components for all MFEs in the payments system.

**Library:** `@mfe/shared-design-system`  
**Location:** `libs/shared-design-system`

## Installation

The design system is already installed in all MFEs. Import components as needed:

```typescript
import {
  Button,
  Card,
  Input,
  Alert,
  Badge,
  Loading,
} from '@mfe/shared-design-system';
```

## Design Tokens

### Colors

The primary brand color is `#084683` with a complete 10-shade scale (50-950).

**Usage:**

```typescript
import { colors } from '@mfe/shared-design-system';

const primaryColor = colors.primary.DEFAULT; // '#084683'
const hoverColor = colors.primary.hover; // '#0a4a7a'
```

**Tailwind Classes:**

```tsx
<div className="bg-primary">...</div>
<div className="bg-primary-700">...</div>
<button className="bg-primary hover:bg-primary-600">...</button>
```

See [`design-system-colors.md`](./design-system-colors.md) for complete color documentation.

## Components

### Button

A versatile button component with multiple variants and sizes.

**Import:**

```typescript
import { Button, buttonVariants } from '@mfe/shared-design-system';
```

**Variants:**

- `default` - Primary button (default)
- `destructive` - Destructive actions (red)
- `outline` - Outlined button
- `secondary` - Secondary button
- `ghost` - Ghost button (transparent)
- `link` - Link-style button

**Sizes:**

- `default` - Default size
- `sm` - Small
- `lg` - Large
- `icon` - Icon-only button

**Examples:**

```tsx
// Primary button
<Button>Click Me</Button>

// Destructive button
<Button variant="destructive">Delete</Button>

// Outlined button
<Button variant="outline">Cancel</Button>

// Small button
<Button size="sm">Small</Button>

// Using buttonVariants for custom elements
import { buttonVariants } from '@mfe/shared-design-system';
import { Link } from 'react-router-dom';

<Link to="/signup" className={buttonVariants({ variant: 'outline' })}>
  Sign Up
</Link>
```

**Props:**

```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}
```

### Card

A flexible card component for content containers.

**Import:**

```typescript
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@mfe/shared-design-system';
```

**Example:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Payment Details</CardTitle>
    <CardDescription>View and manage payment information</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Payment content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Input

A styled input component for forms.

**Import:**

```typescript
import { Input } from '@mfe/shared-design-system';
```

**Example:**

```tsx
<Input type="email" placeholder="Enter your email" />
<Input type="password" placeholder="Enter your password" />
<Input type="number" placeholder="Amount" />
```

**Props:**

```typescript
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}
```

### Label

A styled label component for form fields.

**Import:**

```typescript
import { Label } from '@mfe/shared-design-system';
```

**Example:**

```tsx
<Label htmlFor="email">Email Address</Label>
<Input id="email" type="email" />
```

### Alert

An alert component for displaying messages.

**Import:**

```typescript
import { Alert, AlertTitle, AlertDescription } from '@mfe/shared-design-system';
```

**Variants:**

- `default` - Default alert
- `destructive` - Error/warning alert

**Example:**

```tsx
<Alert>
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>Your payment has been processed.</AlertDescription>
</Alert>

<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong. Please try again.</AlertDescription>
</Alert>
```

### Badge

A badge component for labels and status indicators.

**Import:**

```typescript
import { Badge, badgeVariants } from '@mfe/shared-design-system';
```

**Variants:**

- `default` - Default badge
- `secondary` - Secondary badge
- `destructive` - Destructive badge
- `success` - Success badge (green)
- `warning` - Warning badge (yellow)
- `outline` - Outlined badge

**Example:**

```tsx
<Badge>New</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="destructive">Failed</Badge>
<Badge variant="success">Completed</Badge>
```

### Loading

A loading spinner component.

**Import:**

```typescript
import { Loading } from '@mfe/shared-design-system';
```

**Variants:**

- `default` - Default spinner
- `sm` - Small spinner
- `lg` - Large spinner

**Example:**

```tsx
<Loading />
<Loading variant="sm" />
<Loading variant="lg" />
```

### Skeleton

A skeleton loader component for loading states.

**Import:**

```typescript
import { Skeleton } from '@mfe/shared-design-system';
```

**Example:**

```tsx
<Skeleton className="h-4 w-full" />
<Skeleton className="h-8 w-32" />
```

## Utilities

### `cn` - Class Name Utility

Merge class names with conflict resolution (Tailwind-aware).

**Import:**

```typescript
import { cn } from '@mfe/shared-design-system';
```

**Example:**

```tsx
<div className={cn('base-class', condition && 'conditional-class', className)}>
  Content
</div>
```

## Best Practices

### 1. Use Design System Components

✅ **DO:** Use design system components when available

```tsx
import { Button } from '@mfe/shared-design-system';

<Button variant="default">Submit</Button>;
```

❌ **DON'T:** Create custom buttons when design system exists

```tsx
<button className="bg-blue-500 px-4 py-2 rounded">Submit</button>
```

### 2. Use Tailwind v4 Syntax

✅ **DO:** Use Tailwind v4 syntax

```tsx
<div className="bg-primary text-white">Content</div>
```

❌ **DON'T:** Use Tailwind v3 syntax

```tsx
<div className="bg-primary-700 text-white">Content</div>
```

### 3. Use Design Tokens

✅ **DO:** Use design tokens for colors

```tsx
import { colors } from '@mfe/shared-design-system';

const primaryColor = colors.primary.DEFAULT;
```

❌ **DON'T:** Hardcode colors

```tsx
const primaryColor = '#084683'; // Don't hardcode
```

### 4. Maintain Accessibility

✅ **DO:** Use accessible components with proper ARIA attributes

```tsx
<Button aria-label="Close dialog">×</Button>
```

### 5. Use Variants Appropriately

✅ **DO:** Use appropriate variants for context

```tsx
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="default">Submit</Button>
```

## Component Composition

### Form Example

```tsx
import {
  Input,
  Label,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@mfe/shared-design-system';

<Card>
  <CardHeader>
    <CardTitle>Sign In</CardTitle>
  </CardHeader>
  <CardContent>
    <form>
      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="Enter your email" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
          />
        </div>
        <Button type="submit">Sign In</Button>
      </div>
    </form>
  </CardContent>
</Card>;
```

### Status Display Example

```tsx
import {
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@mfe/shared-design-system';

<Card>
  <CardHeader>
    <CardTitle>Payment Status</CardTitle>
  </CardHeader>
  <CardContent>
    <Badge variant="success">Completed</Badge>
  </CardContent>
</Card>;
```

## Extending Components

To extend a component while maintaining design system consistency:

```tsx
import { Button, ButtonProps } from '@mfe/shared-design-system';
import { cn } from '@mfe/shared-design-system';

interface CustomButtonProps extends ButtonProps {
  customProp?: string;
}

export function CustomButton({
  className,
  customProp,
  ...props
}: CustomButtonProps) {
  return <Button className={cn('custom-styles', className)} {...props} />;
}
```

## Testing

All design system components have unit tests. See component test files:

- `libs/shared-design-system/src/lib/components/Button.test.tsx`
- `libs/shared-design-system/src/lib/components/Card.test.tsx`
- `libs/shared-design-system/src/lib/components/Input.test.tsx`

## Related Documentation

- [`design-system-colors.md`](./design-system-colors.md) - Color palette documentation
- [`project-rules-cursor.md`](./project-rules-cursor.md) - Design system rules and guidelines
