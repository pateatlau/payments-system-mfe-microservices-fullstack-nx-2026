import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './app';

// Mock components for testing
const MockSignIn = () => <div>Mock SignIn</div>;
const MockSignUp = () => <div>Mock SignUp</div>;
const MockPayments = () => <div>Mock Payments</div>;

// Mock the AppRoutes component
jest.mock('../routes/AppRoutes', () => ({
  AppRoutes: () => <div data-testid="app-routes">AppRoutes</div>,
}));

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <MemoryRouter>
        <App
          remotes={{
            SignInComponent: MockSignIn,
            SignUpComponent: MockSignUp,
            PaymentsComponent: MockPayments,
          }}
        />
      </MemoryRouter>
    );
    expect(baseElement).toBeTruthy();
  });

  it('should render Layout with AppRoutes when remotes are provided', () => {
    render(
      <MemoryRouter>
        <App
          remotes={{
            SignInComponent: MockSignIn,
            SignUpComponent: MockSignUp,
            PaymentsComponent: MockPayments,
          }}
        />
      </MemoryRouter>
    );
    expect(screen.getByTestId('app-routes')).toBeInTheDocument();
  });

  it('should render placeholder when no remotes are provided', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('app-routes-placeholder')).toBeInTheDocument();
  });
});
