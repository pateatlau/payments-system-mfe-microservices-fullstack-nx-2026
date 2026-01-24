import { renderHook } from '@testing-library/react';
import { useDocumentTitleFromRoute, DEFAULT_ROUTE_TITLES } from './useDocumentTitleFromRoute';

describe('useDocumentTitleFromRoute', () => {
  const originalTitle = document.title;

  beforeEach(() => {
    document.title = 'Original Title';
  });

  afterEach(() => {
    document.title = originalTitle;
  });

  describe('default route titles', () => {
    it('sets title for home route', () => {
      renderHook(() => useDocumentTitleFromRoute('/'));

      expect(document.title).toBe('Home | MFE Payments');
    });

    it('sets title for signin route', () => {
      renderHook(() => useDocumentTitleFromRoute('/signin'));

      expect(document.title).toBe('Sign In | MFE Payments');
    });

    it('sets title for signup route', () => {
      renderHook(() => useDocumentTitleFromRoute('/signup'));

      expect(document.title).toBe('Sign Up | MFE Payments');
    });

    it('sets title for payments route', () => {
      renderHook(() => useDocumentTitleFromRoute('/payments'));

      expect(document.title).toBe('Payments | MFE Payments');
    });

    it('sets title for payments sub-route using wildcard', () => {
      renderHook(() => useDocumentTitleFromRoute('/payments/create'));

      expect(document.title).toBe('Payments | MFE Payments');
    });

    it('sets title for admin route', () => {
      renderHook(() => useDocumentTitleFromRoute('/admin'));

      expect(document.title).toBe('Admin Dashboard | MFE Payments');
    });

    it('sets title for profile route', () => {
      renderHook(() => useDocumentTitleFromRoute('/profile'));

      expect(document.title).toBe('Profile | MFE Payments');
    });

    it('sets title for forgot-password route', () => {
      renderHook(() => useDocumentTitleFromRoute('/forgot-password'));

      expect(document.title).toBe('Forgot Password | MFE Payments');
    });
  });

  describe('route matching', () => {
    it('handles case-insensitive matching', () => {
      renderHook(() => useDocumentTitleFromRoute('/SIGNIN'));

      expect(document.title).toBe('Sign In | MFE Payments');
    });

    it('handles trailing slash', () => {
      renderHook(() => useDocumentTitleFromRoute('/payments/'));

      expect(document.title).toBe('Payments | MFE Payments');
    });

    it('formats unknown routes as title', () => {
      renderHook(() => useDocumentTitleFromRoute('/unknown-page'));

      expect(document.title).toBe('Unknown Page | MFE Payments');
    });

    it('formats nested unknown routes', () => {
      renderHook(() => useDocumentTitleFromRoute('/some/nested/page'));

      expect(document.title).toBe('Some - Nested - Page | MFE Payments');
    });

    it('filters out UUID segments from unknown routes', () => {
      renderHook(() => useDocumentTitleFromRoute('/users/123e4567-e89b-12d3-a456-426614174000'));

      expect(document.title).toBe('Users | MFE Payments');
    });

    it('filters out numeric ID segments from unknown routes', () => {
      renderHook(() => useDocumentTitleFromRoute('/orders/12345'));

      expect(document.title).toBe('Orders | MFE Payments');
    });
  });

  describe('custom options', () => {
    it('uses custom suffix', () => {
      renderHook(() =>
        useDocumentTitleFromRoute('/payments', DEFAULT_ROUTE_TITLES, {
          suffix: '| My App',
        })
      );

      expect(document.title).toBe('Payments | My App');
    });

    it('uses custom default title when path cannot be formatted', () => {
      // Pass a path that results in empty formatting (only numeric/UUID segments)
      renderHook(() =>
        useDocumentTitleFromRoute('/12345/67890', [], {
          defaultTitle: 'Default Page',
        })
      );

      expect(document.title).toBe('Default Page | MFE Payments');
    });

    it('handles empty suffix', () => {
      renderHook(() =>
        useDocumentTitleFromRoute('/payments', DEFAULT_ROUTE_TITLES, {
          suffix: '',
        })
      );

      expect(document.title).toBe('Payments');
    });
  });

  describe('custom route titles', () => {
    const customRoutes = [
      { path: '/dashboard', title: 'Dashboard' },
      { path: '/users/*', title: 'User Management' },
    ];

    it('uses custom route titles', () => {
      renderHook(() => useDocumentTitleFromRoute('/dashboard', customRoutes));

      expect(document.title).toBe('Dashboard | MFE Payments');
    });

    it('uses custom wildcard routes', () => {
      renderHook(() => useDocumentTitleFromRoute('/users/123', customRoutes));

      expect(document.title).toBe('User Management | MFE Payments');
    });
  });

  describe('updates', () => {
    it('updates title when route changes', () => {
      const { rerender } = renderHook(
        ({ path }) => useDocumentTitleFromRoute(path),
        { initialProps: { path: '/signin' } }
      );

      expect(document.title).toBe('Sign In | MFE Payments');

      rerender({ path: '/payments' });

      expect(document.title).toBe('Payments | MFE Payments');
    });

    it('returns the resolved title', () => {
      const { result } = renderHook(() => useDocumentTitleFromRoute('/payments'));

      expect(result.current).toBe('Payments');
    });
  });
});
