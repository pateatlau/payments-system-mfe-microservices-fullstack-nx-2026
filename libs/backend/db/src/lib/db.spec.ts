import { db } from './db';

// TODO: Fix db test configuration issues
describe.skip('db', () => {
  it('should work', () => {
    expect(db()).toEqual('db');
  });
});
