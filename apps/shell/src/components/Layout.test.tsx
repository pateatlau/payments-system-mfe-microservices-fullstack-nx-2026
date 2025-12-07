import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';
import { Layout } from './Layout';

// Mock the auth store
vi.mock('shared-auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock the Header component
vi.mock('shared-header-ui', () => ({
  Header: ({ onLogout, branding }: { onLogout?: () => void; branding?: string }) => (
    <header data-testid="header">
      <div>Header Component</div>
      <div>Branding: {branding || 'Payments System'}</div>
      {onLogout && (
        <button onClick={onLogout} data-testid="logout-button">
          Logout
        </button>
      )}
    </header>
  ),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('renders Header component', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </MemoryRouter>
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByText('Header Component')).toBeInTheDocument();
  });

  it('renders children in main content area', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Layout>
          <div data-testid="test-content">Test Content</div>
        </Layout>
      </MemoryRouter>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('passes onLogout callback to Header', () => {
    const mockLogout = vi.fn();
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </MemoryRouter>
    );

    const logoutButton = screen.getByTestId('logout-button');
    expect(logoutButton).toBeInTheDocument();

    // Click logout button
    logoutButton.click();

    // Verify logout was called
    expect(mockLogout).toHaveBeenCalledTimes(1);
    // Verify navigate was called with /signin
    expect(mockNavigate).toHaveBeenCalledWith('/signin', { replace: true });
  });

  it('redirects to /signin after logout', () => {
    const mockLogout = vi.fn();
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </MemoryRouter>
    );

    const logoutButton = screen.getByTestId('logout-button');
    logoutButton.click();

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/signin', { replace: true });
  });

  it('applies correct layout structure and classes', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      logout: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </MemoryRouter>
    );

    // Check for layout structure
    const layoutDiv = container.firstChild;
    expect(layoutDiv).toHaveClass('min-h-screen', 'flex', 'flex-col');

    // Check for main element
    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveClass('flex-1', 'p-8', 'bg-slate-50');
  });

  it('renders Header with default branding', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </MemoryRouter>
    );

    expect(screen.getByText('Branding: Payments System')).toBeInTheDocument();
  });
});

