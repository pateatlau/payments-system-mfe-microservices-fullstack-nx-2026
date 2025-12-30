import { render, screen, fireEvent } from '../test-utils';
import { QuickActions, type QuickAction } from './QuickActions';

describe('QuickActions', () => {
  const mockOnClick = jest.fn();

  const mockActions: QuickAction[] = [
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: '👥',
      onClick: mockOnClick,
    },
    {
      id: 'payments',
      title: 'Payment Reports',
      description: 'View and analyze payment data',
      icon: '💳',
      onClick: mockOnClick,
    },
    {
      id: 'disabled',
      title: 'Coming Soon',
      description: 'This feature is not yet available',
      icon: '🔒',
      onClick: mockOnClick,
      disabled: true,
    },
  ];

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('renders all action cards', () => {
    render(<QuickActions actions={mockActions} />);

    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Payment Reports')).toBeInTheDocument();
    expect(screen.getAllByText('Coming Soon').length).toBeGreaterThan(0);
  });

  it('displays action descriptions', () => {
    render(<QuickActions actions={mockActions} />);

    expect(
      screen.getByText('Manage users, roles, and permissions')
    ).toBeInTheDocument();
    expect(
      screen.getByText('View and analyze payment data')
    ).toBeInTheDocument();
  });

  it('calls onClick when action button is clicked', () => {
    render(<QuickActions actions={mockActions} />);

    const buttons = screen.getAllByText('Open →');
    fireEvent.click(buttons[0]);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick for disabled actions', () => {
    render(<QuickActions actions={mockActions} />);

    const comingSoonButton = screen.getByRole('button', { name: 'Coming Soon' });
    fireEvent.click(comingSoonButton);

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('displays disabled state correctly', () => {
    render(<QuickActions actions={mockActions} />);

    const disabledButton = screen.getByRole('button', { name: 'Coming Soon' });
    expect(disabledButton).toBeDisabled();
  });

  it('renders action icons', () => {
    const { container } = render(<QuickActions actions={mockActions} />);

    expect(container.textContent).toContain('👥');
    expect(container.textContent).toContain('💳');
    expect(container.textContent).toContain('🔒');
  });

  it('renders in responsive grid layout', () => {
    const { container } = render(<QuickActions actions={mockActions} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4');
  });
});
