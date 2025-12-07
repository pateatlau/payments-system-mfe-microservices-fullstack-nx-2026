import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './app';

// Mock the pages
vi.mock('../pages/SignInPage', () => ({
  SignInPage: () => <div>SignInPage</div>,
}));

vi.mock('../pages/SignUpPage', () => ({
  SignUpPage: () => <div>SignUpPage</div>,
}));

vi.mock('../pages/PaymentsPage', () => ({
  PaymentsPage: () => <div>PaymentsPage</div>,
}));

vi.mock('../pages/HomePage', () => ({
  HomePage: () => <div>HomePage</div>,
}));

vi.mock('../routes/AppRoutes', () => ({
  AppRoutes: () => <div>AppRoutes</div>,
}));

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(baseElement).toBeTruthy();
  });

  it('should render Layout with AppRoutes', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('AppRoutes')).toBeInTheDocument();
  });
});
