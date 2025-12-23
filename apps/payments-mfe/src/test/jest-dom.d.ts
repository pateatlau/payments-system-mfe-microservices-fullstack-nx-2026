/**
 * Type declarations for @testing-library/jest-dom matchers with Jest
 */
import '@jest/globals';

declare module '@jest/globals' {
  interface Matchers<R = void, T = {}> {
    toBeInTheDocument(): R;
    toBeVisible(): R;
    toBeEmpty(): R;
    toBeDisabled(): R;
    toBeEnabled(): R;
    toBeInvalid(): R;
    toBeRequired(): R;
    toBeValid(): R;
    toBeChecked(): R;
    toBePartiallyChecked(): R;
    toHaveAccessibleDescription(text?: string | RegExp): R;
    toHaveAccessibleName(text?: string | RegExp): R;
    toHaveAttribute(attr: string, value?: string | RegExp): R;
    toHaveClass(...classNames: string[]): R;
    toHaveFocus(): R;
    toHaveFormValues(values: Record<string, unknown>): R;
    toHaveStyle(css: Record<string, unknown> | string): R;
    toHaveTextContent(
      text: string | RegExp,
      options?: { normalizeWhitespace: boolean }
    ): R;
    toHaveValue(value?: string | string[] | number): R;
    toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): R;
    toContainElement(element: HTMLElement | null): R;
    toContainHTML(html: string): R;
    toHaveErrorMessage(text?: string | RegExp): R;
  }
}

// Also extend matchers for global jest namespace
declare global {
  namespace jest {
    interface Matchers<R = void, T = {}> {
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toBeEmpty(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeInvalid(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toBeChecked(): R;
      toBePartiallyChecked(): R;
      toHaveAccessibleDescription(text?: string | RegExp): R;
      toHaveAccessibleName(text?: string | RegExp): R;
      toHaveAttribute(attr: string, value?: string | RegExp): R;
      toHaveClass(...classNames: string[]): R;
      toHaveFocus(): R;
      toHaveFormValues(values: Record<string, unknown>): R;
      toHaveStyle(css: Record<string, unknown> | string): R;
      toHaveTextContent(
        text: string | RegExp,
        options?: { normalizeWhitespace: boolean }
      ): R;
      toHaveValue(value?: string | string[] | number): R;
      toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): R;
      toContainElement(element: HTMLElement | null): R;
      toContainHTML(html: string): R;
      toHaveErrorMessage(text?: string | RegExp): R;
    }
  }
}

export {};
