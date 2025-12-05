import { describe, it, expect } from 'vitest';
import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('formats a Date object correctly', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = formatDate(date);

    expect(result).toContain('January');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('formats a timestamp number correctly', () => {
    const timestamp = new Date('2024-06-20T15:45:00Z').getTime();
    const result = formatDate(timestamp);

    expect(result).toContain('June');
    expect(result).toContain('20');
    expect(result).toContain('2024');
  });

  it('uses custom options when provided', () => {
    const date = new Date('2024-12-25T00:00:00Z');
    const result = formatDate(date, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    expect(result).toContain('Dec');
    expect(result).toContain('25');
    expect(result).toContain('2024');
  });

  it('formats with different locale options', () => {
    const date = new Date('2024-03-10T12:00:00Z');
    const result = formatDate(date, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    // Should format as MM/DD/YYYY or similar
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});
