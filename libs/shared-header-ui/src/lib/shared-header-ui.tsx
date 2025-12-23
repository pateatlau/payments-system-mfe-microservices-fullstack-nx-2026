import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';
import { UserRole } from 'shared-types';
import {
  Button,
  ThemeToggle,
  buttonVariants,
  cn,
} from '@mfe/shared-design-system';

export interface HeaderProps {
  /**
   * Optional callback when logout is clicked
   * If not provided, uses the store's logout method
   */
  onLogout?: () => void;
  /**
   * Optional custom branding text
   * Defaults to "Payments System"
   */
  branding?: string;
}

/**
 * Universal Header component for the payments system
 * Displays branding, navigation, user info, and logout functionality
 * Uses Tailwind CSS v4 for styling
 */
export function Header({
  onLogout,
  branding = 'Payments System',
}: HeaderProps) {
  const { user, isAuthenticated, logout, hasRole } = useAuthStore();
  const location = useLocation();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  };

  // Helper function to check if a path is active
  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + '/')
    );
  };

  // Helper function to get nav link classes
  const getNavLinkClasses = (path: string) => {
    const active = isActive(path);
    return cn(
      'px-3 py-2 text-sm font-medium transition-colors rounded-md',
      active
        ? 'text-primary-foreground bg-primary-foreground/20 font-semibold'
        : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
    );
  };

  return (
    <header className="sticky top-0 z-50 text-primary-foreground shadow-lg bg-primary">
      <div className="container px-4 py-4 mx-auto">
        <div className="flex items-center justify-between">
          {/* Branding/Logo */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">{branding}</h1>
          </div>

          {/* Navigation and User Section */}
          <nav className="flex items-center gap-6">
            {/* Navigation Items - Only show when authenticated */}
            {isAuthenticated && (
              <div className="items-center hidden gap-4 md:flex">
                <Link to="/payments" className={getNavLinkClasses('/payments')}>
                  Payments
                </Link>
                {/* Profile Link - Visible to all authenticated users */}
                <Link to="/profile" className={getNavLinkClasses('/profile')}>
                  Profile
                </Link>
                {hasRole(UserRole.VENDOR) && (
                  <Link to="/reports" className={getNavLinkClasses('/reports')}>
                    Reports
                  </Link>
                )}
                {hasRole(UserRole.ADMIN) && (
                  <Link to="/admin" className={getNavLinkClasses('/admin')}>
                    Admin
                  </Link>
                )}
              </div>
            )}

            {/* Theme toggle + User Info and Logout */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                <ThemeToggle
                  className="text-primary-foreground hover:bg-primary-foreground/10 focus-visible:ring-primary-foreground focus-visible:ring-offset-0 dark:text-primary-foreground"
                  aria-label="Toggle theme"
                />

                {/* User Info */}
                <div className="flex-col items-end hidden sm:flex">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs capitalize text-primary-foreground/80">
                    {user.role.toLowerCase()}
                  </span>
                </div>

                {/* Logout Button */}
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="text-primary-foreground hover:bg-primary-foreground/10 bg-primary-foreground/15"
                  aria-label="Logout"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ThemeToggle
                  className="text-primary-foreground hover:bg-primary-foreground/10 focus-visible:ring-primary-foreground focus-visible:ring-offset-0 dark:text-primary-foreground"
                  aria-label="Toggle theme"
                />
                <Link to="/signin" className={getNavLinkClasses('/signin')}>
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className={cn(
                    buttonVariants({ variant: 'default' }),
                    isActive('/signup') && 'ring-2 ring-primary-foreground/30'
                  )}
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button - For future mobile menu implementation */}
            <button
              className="p-2 md:hidden text-primary-foreground/70 hover:text-primary-foreground"
              aria-label="Menu"
              aria-expanded="false"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
