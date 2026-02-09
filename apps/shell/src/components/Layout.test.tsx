import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';
import { Layout } from './Layout';

// Mock the auth store
jest.mock('shared-auth-store', () => ({
  useAuthStore: jest.fn(),
}));

// Mock the Header component
jest.mock('shared-header-ui', () => ({
  Header: ({
    onLogout,
    branding,
  }: {
    onLogout?: () => void;
    branding?: string;
  }) => (
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

// Mock the SkipLink component
jest.mock('@mfe/shared-design-system', () => ({
  SkipLink: ({ targetId, children }: { targetId: string; children?: React.ReactNode }) => (
    <a href={`#${targetId}`} data-testid="skip-link">
      {children || 'Skip to main content'}
    </a>
  ),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('renders Header component', () => {
    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
      logout: jest.fn(),
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
    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
      logout: jest.fn(),
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
    const mockLogout = jest.fn();
    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
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
    const mockLogout = jest.fn();
    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
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
    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
      logout: jest.fn(),
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
    expect(layoutDiv).toHaveClass('flex', 'flex-col');

    // Check for main element with id for skip link target
    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveClass('flex-1', 'bg-muted');
    expect(mainElement).toHaveAttribute('id', 'main-content');
  });

  it('renders skip link for accessibility', () => {
    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
      logout: jest.fn(),
    });

    render(
      <MemoryRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </MemoryRouter>
    );

    // Check for skip link
    const skipLink = screen.getByTestId('skip-link');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(skipLink).toHaveTextContent('Skip to main content');
  });

  it('has main element with aria-label', () => {
    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
      logout: jest.fn(),
    });

    const { container } = render(
      <MemoryRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </MemoryRouter>
    );

    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveAttribute('aria-label', 'Main content');
  });

  it('renders Header with default branding', () => {
    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
      logout: jest.fn(),
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
