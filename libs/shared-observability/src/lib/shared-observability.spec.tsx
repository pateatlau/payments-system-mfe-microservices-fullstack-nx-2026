import { render } from '@testing-library/react';

import SharedObservability from './shared-observability';

describe('SharedObservability', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<SharedObservability />);
    expect(baseElement).toBeTruthy();
  });
});
