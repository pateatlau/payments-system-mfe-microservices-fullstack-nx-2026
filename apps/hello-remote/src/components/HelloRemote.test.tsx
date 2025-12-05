import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HelloRemote from './HelloRemote';

describe('HelloRemote', () => {
  it('renders HelloRemote component', () => {
    render(<HelloRemote />);

    expect(screen.getByText('Hello from Remote!')).toBeDefined();
  });

  it('displays Module Federation message', () => {
    render(<HelloRemote />);

    expect(
      screen.getByText(
        'This component is loaded dynamically via Module Federation.'
      )
    ).toBeDefined();
  });

  it('renders with correct styling structure', () => {
    const { container } = render(<HelloRemote />);
    const mainDiv = container.firstChild as HTMLElement;

    expect(mainDiv).toBeDefined();
    expect(mainDiv.tagName).toBe('DIV');
  });
});
