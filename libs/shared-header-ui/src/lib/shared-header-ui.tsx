import { Link } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';
import { UserRole } from 'shared-types';
import { Button, buttonVariants } from '@mfe/shared-design-system';
import { cn } from '@mfe/shared-design-system';

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

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  };

  return (
    <header className="sticky top-0 z-50 text-white shadow-lg bg-primary">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Branding/Logo */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">{branding}</h1>
          </div>

          {/* Navigation and User Section */}
          <nav className="flex items-center gap-6">
            {/* Navigation Items - Only show when authenticated */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-4">
                <Link
                  to="/payments"
                  className="text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-md text-sm font-medium"
                >
                  Payments
                </Link>
                {hasRole(UserRole.VENDOR) && (
                  <Link
                    to="/reports"
                    className="text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Reports
                  </Link>
                )}
                {hasRole(UserRole.ADMIN) && (
                  <Link
                    to="/admin"
                    className="text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Admin
                  </Link>
                )}
              </div>
            )}

            {/* User Info and Logout */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                {/* User Info */}
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-slate-400 capitalize">
                    {user.role.toLowerCase()}
                  </span>
                </div>

                {/* Logout Button */}
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="text-white hover:bg-white/10 bg-white/15"
                  aria-label="Logout"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/signin"
                  className="text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className={cn(
                    buttonVariants({ variant: 'default' }),
                    'bg-primary-600 hover:bg-primary-700'
                  )}
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button - For future mobile menu implementation */}
            <button
              className="md:hidden text-slate-300 hover:text-white p-2"
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
