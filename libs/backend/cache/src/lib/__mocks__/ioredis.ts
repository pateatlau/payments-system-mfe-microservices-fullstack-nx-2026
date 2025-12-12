export default jest.fn().mockImplementation(() => ({
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  sadd: jest.fn(),
  smembers: jest.fn(),
  exists: jest.fn(),
  ttl: jest.fn(),
  keys: jest.fn(),
  flushdb: jest.fn(),
  ping: jest.fn(),
  quit: jest.fn(),
  on: jest.fn(),
  pipeline: jest.fn().mockReturnValue({
    sadd: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  }),
}));
