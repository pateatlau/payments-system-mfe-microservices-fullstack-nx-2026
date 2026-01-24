/**
 * FormField Component
 *
 * Accessible form field wrapper with proper ARIA associations.
 * Provides automatic linking between labels, inputs, descriptions, and error messages.
 *
 * WCAG Compliance:
 * - 3.3.1 Error Identification: Errors are clearly identified via aria-describedby
 * - 3.3.2 Labels or Instructions: Labels are properly associated with inputs
 * - 3.3.3 Error Suggestion: Error messages provide guidance
 * - 4.1.2 Name, Role, Value: Proper ARIA attributes for assistive technologies
 */

import * as React from 'react';
import { Label } from './Label';
import { cn } from '../utils/cn';

interface FormFieldContextValue {
  /** Unique ID for the form field input */
  id: string;
  /** ID for the error message element */
  errorId: string;
  /** ID for the description element */
  descriptionId: string;
  /** Whether the field has an error */
  hasError: boolean;
  /** Whether the field is required */
  isRequired: boolean;
  /** Combined aria-describedby value */
  ariaDescribedBy: string | undefined;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(
  null
);

/**
 * Hook to access form field context.
 * Use this in custom input components to get accessibility props.
 *
 * @example
 * function CustomInput(props) {
 *   const { id, hasError, ariaDescribedBy } = useFormField();
 *   return (
 *     <input
 *       id={id}
 *       aria-invalid={hasError}
 *       aria-describedby={ariaDescribedBy}
 *       {...props}
 *     />
 *   );
 * }
 */
export function useFormField() {
  const context = React.useContext(FormFieldContext);
  if (!context) {
    throw new Error('useFormField must be used within a FormField');
  }
  return context;
}

export interface FormFieldProps {
  /** Unique field identifier used for generating IDs */
  name: string;
  /** Field label text */
  label: string;
  /** Error message to display (enables error state when provided) */
  error?: string;
  /** Help text / description shown below the label */
  description?: string;
  /** Whether field is required */
  required?: boolean;
  /** Field input element(s) */
  children: React.ReactNode;
  /** Additional CSS classes for the wrapper */
  className?: string;
  /** Hide the label visually while keeping it accessible to screen readers */
  hideLabel?: boolean;
}

/**
 * Accessible form field wrapper with proper ARIA associations.
 *
 * Automatically handles:
 * - Label-input association via htmlFor/id
 * - Error message linking via aria-describedby
 * - Description linking via aria-describedby
 * - Required field indication (visual and aria-required)
 * - Invalid field indication (aria-invalid)
 *
 * @example
 * // Basic usage with Input
 * <FormField
 *   name="email"
 *   label="Email Address"
 *   error={errors.email?.message}
 *   required
 * >
 *   <Input type="email" {...register('email')} />
 * </FormField>
 *
 * @example
 * // With description
 * <FormField
 *   name="password"
 *   label="Password"
 *   description="Must be at least 8 characters"
 *   error={errors.password?.message}
 *   required
 * >
 *   <PasswordInput {...register('password')} />
 * </FormField>
 */
export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      name,
      label,
      error,
      description,
      required = false,
      children,
      className,
      hideLabel = false,
    },
    ref
  ) => {
    const id = `field-${name}`;
    const errorId = `${id}-error`;
    const descriptionId = `${id}-description`;
    const hasError = Boolean(error);

    // Build aria-describedby value (description first, then error)
    const ariaDescribedBy =
      [description && descriptionId, hasError && errorId]
        .filter(Boolean)
        .join(' ') || undefined;

    const contextValue: FormFieldContextValue = {
      id,
      errorId,
      descriptionId,
      hasError,
      isRequired: required,
      ariaDescribedBy,
    };

    return (
      <FormFieldContext.Provider value={contextValue}>
        <div ref={ref} className={cn('space-y-2', className)}>
          <Label
            htmlFor={id}
            className={cn(
              hasError && 'text-[rgb(var(--destructive))]',
              hideLabel && 'sr-only'
            )}
          >
            {label}
            {required && (
              <>
                <span
                  className="text-[rgb(var(--destructive))] ml-1"
                  aria-hidden="true"
                >
                  *
                </span>
                <span className="sr-only"> (required)</span>
              </>
            )}
          </Label>

          {description && (
            <p
              id={descriptionId}
              className="text-sm text-[rgb(var(--muted-foreground))]"
            >
              {description}
            </p>
          )}

          {/* Clone child to inject accessibility props */}
          {React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) {
              return child;
            }

            // Clone the child element and inject accessibility props
            return React.cloneElement(
              child as React.ReactElement<Record<string, unknown>>,
              {
                id,
                'aria-invalid': hasError || undefined,
                'aria-required': required || undefined,
                'aria-describedby': ariaDescribedBy,
              }
            );
          })}

          {hasError && (
            <p
              id={errorId}
              role="alert"
              aria-live="polite"
              className="text-sm text-[rgb(var(--destructive))]"
            >
              {error}
            </p>
          )}
        </div>
      </FormFieldContext.Provider>
    );
  }
);

FormField.displayName = 'FormField';
