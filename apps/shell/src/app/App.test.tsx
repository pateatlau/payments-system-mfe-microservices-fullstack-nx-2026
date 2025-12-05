import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app';

describe('App', () => {
  it('renders shell app', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByText('Welcome to the Shell Application')).toBeDefined();
  });

  it('renders navigation links', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Page 2')).toBeDefined();
  });

  it('renders current date', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByText(/Current date:/)).toBeDefined();
  });
});
