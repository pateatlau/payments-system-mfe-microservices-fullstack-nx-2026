/**
 * App Component Tests
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import App from './app';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('should display profile mfe placeholder', () => {
    render(<App />);
    expect(screen.getByText('Profile MFE')).toBeInTheDocument();
  });
});
