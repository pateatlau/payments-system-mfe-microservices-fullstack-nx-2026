/**
 * MfaRecommendation Component Tests
 *
 * Tests for the MFA recommendation page shown to new social login users.
 * Covers:
 * - Rendering of benefits and CTAs
 * - Enable MFA flow
 * - Skip for now flow
 * - Don't show again preference
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  MfaRecommendation,
  isMfaRecommendDismissed,
  setMfaRecommendDismissed,
} from './MfaRecommendation';

describe('MfaRecommendation', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('rendering', () => {
    it('should render the security shield icon', () => {
      render(<MfaRecommendation />);

      // The shield SVG should be present
      const shield = document.querySelector('svg');
      expect(shield).toBeInTheDocument();
    });

    it('should render the title', () => {
      render(<MfaRecommendation />);

      expect(screen.getByText('Secure Your Account')).toBeInTheDocument();
    });

    it('should render the description', () => {
      render(<MfaRecommendation />);

      expect(
        screen.getByText(/We recommend enabling two-factor authentication/i)
      ).toBeInTheDocument();
    });

    it('should render all benefit items', () => {
      render(<MfaRecommendation />);

      expect(screen.getByText('Protects against unauthorized access')).toBeInTheDocument();
      expect(screen.getByText('Adds an extra layer of security')).toBeInTheDocument();
      expect(screen.getByText('Required for sensitive operations')).toBeInTheDocument();
      expect(screen.getByText('Takes less than 2 minutes to set up')).toBeInTheDocument();
    });

    it('should render the Enable MFA button', () => {
      render(<MfaRecommendation />);

      expect(
        screen.getByRole('button', { name: /Enable Two-Factor Authentication/i })
      ).toBeInTheDocument();
    });

    it('should render the Skip button', () => {
      render(<MfaRecommendation />);

      expect(screen.getByRole('button', { name: /Skip for now/i })).toBeInTheDocument();
    });

    it('should render the "Don\'t show again" checkbox', () => {
      render(<MfaRecommendation />);

      expect(screen.getByLabelText(/Don't show this again/i)).toBeInTheDocument();
    });

    it('should have checkbox unchecked by default', () => {
      render(<MfaRecommendation />);

      const checkbox = screen.getByLabelText(/Don't show this again/i);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Enable MFA button', () => {
    it('should be clickable when not disabled', () => {
      render(<MfaRecommendation />);

      const enableButton = screen.getByRole('button', {
        name: /Enable Two-Factor Authentication/i,
      });

      expect(enableButton).not.toBeDisabled();
    });

    it('should have correct button text', () => {
      render(<MfaRecommendation />);

      expect(
        screen.getByRole('button', { name: /Enable Two-Factor Authentication/i })
      ).toBeInTheDocument();
    });
  });

  describe('"Don\'t show again" checkbox', () => {
    it('should toggle checked state when clicked', async () => {
      const user = userEvent.setup();
      render(<MfaRecommendation />);

      const checkbox = screen.getByLabelText(/Don't show this again/i);

      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('should have accessible label', () => {
      render(<MfaRecommendation />);

      const checkbox = screen.getByRole('checkbox', {
        name: /Don't show this again/i,
      });
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe('check icons', () => {
    it('should render check icons for each benefit', () => {
      render(<MfaRecommendation />);

      // Each benefit item should have a check icon (green-500 color)
      const checkIcons = document.querySelectorAll('.text-green-500');
      expect(checkIcons.length).toBe(4); // 4 benefits
    });
  });
});

describe('isMfaRecommendDismissed', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return false when localStorage is empty', () => {
    expect(isMfaRecommendDismissed()).toBe(false);
  });

  it('should return true when mfa_recommend_dismissed is "true"', () => {
    localStorage.setItem('mfa_recommend_dismissed', 'true');
    expect(isMfaRecommendDismissed()).toBe(true);
  });

  it('should return false when mfa_recommend_dismissed is any other value', () => {
    localStorage.setItem('mfa_recommend_dismissed', 'false');
    expect(isMfaRecommendDismissed()).toBe(false);

    localStorage.setItem('mfa_recommend_dismissed', '1');
    expect(isMfaRecommendDismissed()).toBe(false);
  });

  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage.getItem to throw
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error('localStorage error');
    };

    expect(isMfaRecommendDismissed()).toBe(false);

    // Restore
    Storage.prototype.getItem = originalGetItem;
  });
});

describe('setMfaRecommendDismissed', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should set localStorage value when dismissed is true', () => {
    setMfaRecommendDismissed(true);
    expect(localStorage.getItem('mfa_recommend_dismissed')).toBe('true');
  });

  it('should remove localStorage value when dismissed is false', () => {
    localStorage.setItem('mfa_recommend_dismissed', 'true');
    setMfaRecommendDismissed(false);
    expect(localStorage.getItem('mfa_recommend_dismissed')).toBeNull();
  });

  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage.setItem to throw
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('localStorage error');
    };

    // Should not throw
    expect(() => setMfaRecommendDismissed(true)).not.toThrow();

    // Restore
    Storage.prototype.setItem = originalSetItem;
  });
});
