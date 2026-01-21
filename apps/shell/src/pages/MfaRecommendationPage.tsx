import { ComponentType } from 'react';
import { RemoteErrorBoundary } from '../components/RemoteErrorBoundary';

/**
 * Props interface for the MfaRecommendation component from auth-mfe
 */
export interface MfaRecommendationComponentProps {
  /** URL to redirect to after enabling MFA or skipping */
  returnUrl?: string;
}

/**
 * Props for MfaRecommendationPage - allows dependency injection for testing
 */
export interface MfaRecommendationPageProps {
  /**
   * MfaRecommendation component to render.
   * In production, pass the lazy-loaded component from remotes.
   * In tests, pass a mock component.
   */
  MfaRecommendationComponent: ComponentType<MfaRecommendationComponentProps>;
}

/**
 * MfaRecommendationPage component
 *
 * Wrapper for MfaRecommendation component.
 * Shown to new social login users to encourage MFA adoption.
 * Uses dependency injection pattern - component must be provided via props.
 *
 * @example
 * // Production usage (in routes)
 * import { MfaRecommendationRemote } from './remotes';
 * <MfaRecommendationPage MfaRecommendationComponent={MfaRecommendationRemote} />
 *
 * @example
 * // Test usage (with mock component)
 * <MfaRecommendationPage MfaRecommendationComponent={MockMfaRecommendation} />
 */
export function MfaRecommendationPage({
  MfaRecommendationComponent,
}: MfaRecommendationPageProps) {
  return (
    <RemoteErrorBoundary componentName="MfaRecommendation">
      <div className="min-h-full flex flex-col items-center justify-center py-8">
        <MfaRecommendationComponent />
      </div>
    </RemoteErrorBoundary>
  );
}
