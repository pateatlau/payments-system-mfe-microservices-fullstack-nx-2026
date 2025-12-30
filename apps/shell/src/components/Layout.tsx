import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from 'shared-header-ui';
import { useAuthStore } from 'shared-auth-store';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Layout component
 *
 * Main layout wrapper for the shell application.
 * Includes the universal Header component and handles logout redirect.
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
      <Header onLogout={handleLogout} />
      <main className="flex-1 min-h-0 px-8 py-8 pb-16 overflow-y-auto bg-muted">
        {children}
      </main>
    </div>
  );
}

export default Layout;
