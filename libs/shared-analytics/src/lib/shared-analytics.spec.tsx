import { render } from '@testing-library/react';

import SharedAnalytics from './shared-analytics';

describe('SharedAnalytics', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<SharedAnalytics />);
    expect(baseElement).toBeTruthy();
  });
});
