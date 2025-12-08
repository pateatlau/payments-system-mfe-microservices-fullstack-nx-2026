import { eventHub } from './event-hub';

describe('eventHub', () => {
  it('should work', () => {
    expect(eventHub()).toEqual('event-hub');
  });
});
