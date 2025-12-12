import { describe, it, expect } from '@jest/globals';
import { sharedTypes } from './shared-types';

describe('sharedTypes', () => {
  it('should work', () => {
    expect(sharedTypes()).toEqual('shared-types');
  });
});
