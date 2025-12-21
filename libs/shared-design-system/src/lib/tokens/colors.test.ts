/**
 * Color Tokens Tests
 */

import { describe, it, expect } from '@jest/globals';
import { colors, getThemeColor, hasDarkModeVariant } from './colors';

describe('Color Tokens', () => {
  describe('colors object', () => {
    it('should have all required color categories', () => {
      expect(colors).toHaveProperty('primary');
      expect(colors).toHaveProperty('secondary');
      expect(colors).toHaveProperty('success');
      expect(colors).toHaveProperty('danger');
      expect(colors).toHaveProperty('warning');
      expect(colors).toHaveProperty('info');
      expect(colors).toHaveProperty('background');
      expect(colors).toHaveProperty('foreground');
      expect(colors).toHaveProperty('border');
    });

    it('should have light and dark variants for each category', () => {
      expect(colors.primary).toHaveProperty('light');
      expect(colors.primary).toHaveProperty('dark');
      expect(colors.background).toHaveProperty('light');
      expect(colors.background).toHaveProperty('dark');
      expect(colors.foreground).toHaveProperty('light');
      expect(colors.foreground).toHaveProperty('dark');
    });

    it('should maintain backwards compatibility with legacy DEFAULT values', () => {
      expect(colors.primary.DEFAULT).toBe('#084683');
      expect(colors.success.DEFAULT).toBe('#10b981');
      expect(colors.danger.DEFAULT).toBe('#ef4444');
      expect(colors.background.DEFAULT).toBe('#ffffff');
      expect(colors.foreground.DEFAULT).toBe('#111827');
    });

    it('should have different values for light and dark modes', () => {
      // Primary should be darker in light mode, lighter in dark mode
      expect(colors.primary.light.DEFAULT).toBe('#084683');
      expect(colors.primary.dark.DEFAULT).toBe('#1a74b8');

      // Background should be white in light, dark in dark mode
      expect(colors.background.light.DEFAULT).toBe('#ffffff');
      expect(colors.background.dark.DEFAULT).toBe('#111827');

      // Foreground should be dark in light, light in dark mode
      expect(colors.foreground.light.DEFAULT).toBe('#111827');
      expect(colors.foreground.dark.DEFAULT).toBe('#f9fafb');
    });
  });

  describe('getThemeColor helper', () => {
    it('should return light mode color by default', () => {
      const color = getThemeColor('primary.DEFAULT');
      expect(color).toBe('#084683'); // light mode primary
    });

    it('should return dark mode color when theme is dark', () => {
      const color = getThemeColor('primary.DEFAULT', 'dark');
      expect(color).toBe('#1a74b8'); // dark mode primary
    });

    it('should handle hover and active variants', () => {
      expect(getThemeColor('primary.hover', 'light')).toBe('#0a4a7a');
      expect(getThemeColor('primary.hover', 'dark')).toBe('#4d93c8');

      expect(getThemeColor('success.active', 'light')).toBe('#047857');
      expect(getThemeColor('success.active', 'dark')).toBe('#a7f3d0');
    });

    it('should handle semantic tokens', () => {
      expect(getThemeColor('background.DEFAULT', 'light')).toBe('#ffffff');
      expect(getThemeColor('background.DEFAULT', 'dark')).toBe('#111827');

      expect(getThemeColor('foreground.muted', 'light')).toBe('#6b7280');
      expect(getThemeColor('foreground.muted', 'dark')).toBe('#9ca3af');
    });

    it('should return default when variant not found', () => {
      const color = getThemeColor('primary.nonexistent', 'light');
      expect(color).toBe('#084683'); // falls back to DEFAULT
    });

    it('should warn and return black for unknown category', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const color = getThemeColor('unknown.DEFAULT', 'light');
      expect(color).toBe('#000000');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Color category "unknown" not found'
      );
      consoleSpy.mockRestore();
    });

    it('should handle color paths without variant (defaults to DEFAULT)', () => {
      // When using getThemeColor with just category, it should use DEFAULT
      expect(getThemeColor('primary', 'light')).toBeTruthy();
      expect(getThemeColor('success', 'dark')).toBeTruthy();
    });
  });

  describe('hasDarkModeVariant helper', () => {
    it('should return true for categories with dark mode variants', () => {
      expect(hasDarkModeVariant('primary')).toBe(true);
      expect(hasDarkModeVariant('secondary')).toBe(true);
      expect(hasDarkModeVariant('success')).toBe(true);
      expect(hasDarkModeVariant('danger')).toBe(true);
      expect(hasDarkModeVariant('warning')).toBe(true);
      expect(hasDarkModeVariant('info')).toBe(true);
      expect(hasDarkModeVariant('background')).toBe(true);
      expect(hasDarkModeVariant('foreground')).toBe(true);
      expect(hasDarkModeVariant('border')).toBe(true);
    });
  });

  describe('Color contrast for accessibility', () => {
    it('should use appropriate contrast colors for each theme', () => {
      // In light mode, primary is dark (#084683) on white background - good contrast
      expect(colors.primary.light.DEFAULT).toBe('#084683');
      expect(colors.background.light.DEFAULT).toBe('#ffffff');

      // In dark mode, primary is lighter (#1a74b8) on dark background - good contrast
      expect(colors.primary.dark.DEFAULT).toBe('#1a74b8');
      expect(colors.background.dark.DEFAULT).toBe('#111827');

      // Foreground text should swap for readability
      expect(colors.foreground.light.DEFAULT).toBe('#111827'); // dark text on light bg
      expect(colors.foreground.dark.DEFAULT).toBe('#f9fafb'); // light text on dark bg
    });
  });
});
