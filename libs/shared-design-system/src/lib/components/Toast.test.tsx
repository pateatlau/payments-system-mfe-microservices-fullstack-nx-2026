/**
 * Toast Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { Toast, ToastContainer } from './Toast';

describe('Toast', () => {
  it('renders with message', () => {
    render(<Toast message="Test message" onDismiss={jest.fn()} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders with title and message', () => {
    render(
      <Toast title="Test title" message="Test message" onDismiss={jest.fn()} />
    );
    expect(screen.getByText('Test title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders success variant', () => {
    const { container } = render(
      <Toast variant="success" message="Success!" onDismiss={jest.fn()} />
    );
    const toast = container.firstChild as HTMLElement;
    expect(toast).toHaveClass('bg-emerald-50');
  });

  it('renders error variant', () => {
    const { container } = render(
      <Toast variant="error" message="Error!" onDismiss={jest.fn()} />
    );
    const toast = container.firstChild as HTMLElement;
    expect(toast).toHaveClass('bg-destructive');
  });

  it('renders warning variant', () => {
    const { container } = render(
      <Toast variant="warning" message="Warning!" onDismiss={jest.fn()} />
    );
    const toast = container.firstChild as HTMLElement;
    expect(toast).toHaveClass('bg-amber-50');
  });

  it('renders info variant', () => {
    const { container } = render(
      <Toast variant="info" message="Info!" onDismiss={jest.fn()} />
    );
    const toast = container.firstChild as HTMLElement;
    expect(toast).toHaveClass('bg-blue-50');
  });

  it('shows close button by default', () => {
    render(<Toast message="Test" onDismiss={jest.fn()} />);
    expect(
      screen.getByRole('button', { name: /dismiss notification/i })
    ).toBeInTheDocument();
  });

  it('hides close button when showClose is false', () => {
    render(<Toast message="Test" showClose={false} onDismiss={jest.fn()} />);
    expect(
      screen.queryByRole('button', { name: /dismiss notification/i })
    ).not.toBeInTheDocument();
  });

  it('calls onDismiss when close button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = jest.fn();
    render(<Toast message="Test" onDismiss={onDismiss} />);

    const closeButton = screen.getByRole('button', {
      name: /dismiss notification/i,
    });
    await user.click(closeButton);

    await waitFor(
      () => {
        expect(onDismiss).toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });

  it('auto-dismisses after duration', async () => {
    const onDismiss = jest.fn();
    render(<Toast message="Test" duration={1000} onDismiss={onDismiss} />);

    await waitFor(
      () => {
        expect(onDismiss).toHaveBeenCalled();
      },
      { timeout: 1500 }
    );
  });

  it('does not auto-dismiss when duration is 0', async () => {
    const onDismiss = jest.fn();
    render(<Toast message="Test" duration={0} onDismiss={onDismiss} />);

    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('has proper ARIA attributes', () => {
    render(<Toast message="Test" onDismiss={jest.fn()} />);
    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'polite');
    expect(toast).toHaveAttribute('aria-atomic', 'true');
  });
});

describe('ToastContainer', () => {
  it('renders children', () => {
    render(
      <ToastContainer>
        <Toast message="Test 1" onDismiss={jest.fn()} />
        <Toast message="Test 2" onDismiss={jest.fn()} />
      </ToastContainer>
    );
    expect(screen.getByText('Test 1')).toBeInTheDocument();
    expect(screen.getByText('Test 2')).toBeInTheDocument();
  });

  it('applies bottom-right position by default', () => {
    const { container } = render(
      <ToastContainer>
        <Toast message="Test" onDismiss={jest.fn()} />
      </ToastContainer>
    );
    const toastContainer = container.firstChild as HTMLElement;
    expect(toastContainer).toHaveClass('bottom-4', 'right-4');
  });

  it('applies top-left position', () => {
    const { container } = render(
      <ToastContainer position="top-left">
        <Toast message="Test" onDismiss={jest.fn()} />
      </ToastContainer>
    );
    const toastContainer = container.firstChild as HTMLElement;
    expect(toastContainer).toHaveClass('top-4', 'left-4');
  });

  it('applies top-center position', () => {
    const { container } = render(
      <ToastContainer position="top-center">
        <Toast message="Test" onDismiss={jest.fn()} />
      </ToastContainer>
    );
    const toastContainer = container.firstChild as HTMLElement;
    expect(toastContainer).toHaveClass('top-4', 'left-1/2');
  });

  it('has proper ARIA attributes', () => {
    const { container } = render(
      <ToastContainer>
        <Toast message="Test" onDismiss={jest.fn()} />
      </ToastContainer>
    );
    const toastContainer = container.firstChild as HTMLElement;
    expect(toastContainer).toHaveAttribute('aria-live', 'polite');
    expect(toastContainer).toHaveAttribute('aria-atomic', 'false');
  });
});
