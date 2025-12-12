import { render } from '@testing-library/react';

import SharedSessionSync from './shared-session-sync';

describe('SharedSessionSync', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<SharedSessionSync />);
    expect(baseElement).toBeTruthy();
  });
});
