import { useState } from 'react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Helper function to check if a path is active
  // Matches exact path or path as a full segment (e.g., /admin matches /admin and /admin/users, but not /admin-panel)
  const isActive = (path: string) => {
    const pathname = location.pathname;
    return (
      pathname === path ||
      (pathname.startsWith(path + '/') && pathname[path.length] === '/')
    );
  };

  // Helper function to get nav link classes
  const getNavLinkClasses = (path: string, isActiveCheck?: boolean) => {
    const active = isActiveCheck !== undefined ? isActiveCheck : isActive(path);
    return cn(
      'px-3 py-2 text-sm font-medium transition-colors rounded-md',
      active
        ? 'text-primary-foreground bg-primary-foreground/20 font-semibold'
        : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
    );
  };

  // Helper function to get mobile nav link classes
  const getMobileNavLinkClasses = (path: string, isActiveCheck?: boolean) => {
    const active = isActiveCheck !== undefined ? isActiveCheck : isActive(path);
    return cn(
      'block px-4 py-3 text-base font-medium transition-colors rounded-md',
      active
        ? 'text-primary-foreground bg-primary-foreground/20 font-semibold'
        : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
    );
  };

  return (
    <header className="sticky top-0 z-50 px-8 py-4 shadow-lg text-primary-foreground bg-primary">
      <div className="max-w-7xl mx-auto">
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
                <Link
                  to="/payments"
                  className={getNavLinkClasses('/payments')}
                >
                  Payments
                </Link>
                {hasRole(UserRole.VENDOR) && (
                  <Link
                    to="/reports"
                    className={getNavLinkClasses('/reports')}
                  >
                    Reports
                  </Link>
                )}
                {/* Profile Link - Visible to all authenticated users */}
                <Link to="/profile" className={getNavLinkClasses('/profile')}>
                  Profile
                </Link>
                {hasRole(UserRole.ADMIN) && (
                  <Link to="/admin" className={getNavLinkClasses('/admin')}>
                    Admin
                  </Link>
                )}
              </div>
            )}

            {/* Theme toggle + User Info and Logout */}
            {isAuthenticated && user ? (
              <div className="items-center hidden gap-4 md:flex">
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
              <div className="items-center hidden gap-2 md:flex">
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

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="p-2 md:hidden text-primary-foreground/70 hover:text-primary-foreground"
              aria-label="Menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
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
              )}
            </button>
          </nav>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="mt-4 md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/payments"
                    className={getMobileNavLinkClasses('/payments')}
                    onClick={closeMobileMenu}
                  >
                    Payments
                  </Link>
                  {hasRole(UserRole.VENDOR) && (
                    <Link
                      to="/reports"
                      className={getMobileNavLinkClasses('/reports')}
                      onClick={closeMobileMenu}
                    >
                      Reports
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className={getMobileNavLinkClasses('/profile')}
                    onClick={closeMobileMenu}
                  >
                    Profile
                  </Link>
                  {hasRole(UserRole.ADMIN) && (
                    <Link
                      to="/admin"
                      className={getMobileNavLinkClasses('/admin')}
                      onClick={closeMobileMenu}
                    >
                      Admin
                    </Link>
                  )}

                  {/* Mobile User Info and Logout */}
                  <div className="pt-4 mt-4 border-t border-primary-foreground/20">
                    {user && (
                      <div className="px-4 py-2 mb-2">
                        <p className="text-sm font-medium text-primary-foreground">
                          {user.name}
                        </p>
                        <p className="text-xs capitalize text-primary-foreground/80">
                          {user.role.toLowerCase()}
                        </p>
                      </div>
                    )}

                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between px-4 py-2 mb-2">
                      <span className="text-sm font-medium text-primary-foreground">
                        Theme
                      </span>
                      <ThemeToggle
                        className="text-primary-foreground hover:bg-primary-foreground/10 focus-visible:ring-primary-foreground focus-visible:ring-offset-0"
                        aria-label="Toggle theme"
                      />
                    </div>

                    <button
                      onClick={() => {
                        handleLogout();
                        closeMobileMenu();
                      }}
                      className="w-full px-4 py-3 text-base font-medium text-left transition-colors rounded-md text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/signin"
                    className={getMobileNavLinkClasses('/signin')}
                    onClick={closeMobileMenu}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className={cn(
                      'w-full px-4 py-2 text-center text-sm font-semibold rounded-md transition-colors',
                      'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                    onClick={closeMobileMenu}
                  >
                    Sign Up
                  </Link>

                  {/* Theme Toggle for unauthenticated */}
                  <div className="pt-4 mt-4 border-t border-primary-foreground/20">
                    <div className="flex items-center justify-between px-4 py-2">
                      <span className="text-sm font-medium text-primary-foreground">
                        Theme
                      </span>
                      <ThemeToggle
                        className="text-primary-foreground hover:bg-primary-foreground/10 focus-visible:ring-primary-foreground focus-visible:ring-offset-0"
                        aria-label="Toggle theme"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
