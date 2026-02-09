import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from 'shared-header-ui';
import { useAuthStore } from 'shared-auth-store';
import { SkipLink } from '@mfe/shared-design-system';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Layout component
 *
 * Main layout wrapper for the shell application.
 * Includes the universal Header component and handles logout redirect.
 *
 * Accessibility features:
 * - Skip navigation link for keyboard users (WCAG 2.4.1)
 * - Proper landmark structure (header, main)
 * - Focus management for main content
 */
export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    // Redirect to sign-in page after logout
    navigate('/signin', { replace: true });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Skip link - first focusable element for keyboard users */}
      <SkipLink targetId="main-content" />

      {/* Header with navigation landmark */}
      <Header onLogout={handleLogout} />

      {/* Main content landmark */}
      <main
        id="main-content"
        className="flex-1 min-h-0 px-8 py-8 pb-16 overflow-y-auto bg-muted"
        aria-label="Main content"
      >
        {children}
      </main>
    </div>
  );
}

export default Layout;
