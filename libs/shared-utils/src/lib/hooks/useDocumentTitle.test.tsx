import { renderHook } from '@testing-library/react';
import { useDocumentTitle } from './useDocumentTitle';

describe('useDocumentTitle', () => {
  const originalTitle = document.title;

  beforeEach(() => {
    document.title = 'Original Title';
  });

  afterEach(() => {
    document.title = originalTitle;
  });

  it('sets document title with default suffix', () => {
    renderHook(() => useDocumentTitle('Dashboard'));

    expect(document.title).toBe('Dashboard | MFE Payments');
  });

  it('sets document title with custom suffix', () => {
    renderHook(() => useDocumentTitle('Profile', { suffix: '| My App' }));

    expect(document.title).toBe('Profile | My App');
  });

  it('sets document title without suffix when suffix is empty', () => {
    renderHook(() => useDocumentTitle('Custom Title', { suffix: '' }));

    expect(document.title).toBe('Custom Title');
  });

  it('uses default title when title is empty', () => {
    renderHook(() => useDocumentTitle(''));

    expect(document.title).toBe('MFE Payments');
  });

  it('updates document title when title changes', () => {
    const { rerender } = renderHook(
      ({ title }) => useDocumentTitle(title),
      { initialProps: { title: 'First Page' } }
    );

    expect(document.title).toBe('First Page | MFE Payments');

    rerender({ title: 'Second Page' });

    expect(document.title).toBe('Second Page | MFE Payments');
  });

  it('restores previous title on unmount when restoreOnUnmount is true', () => {
    const { unmount } = renderHook(
      () => useDocumentTitle('Modal', { restoreOnUnmount: true })
    );

    expect(document.title).toBe('Modal | MFE Payments');

    unmount();

    expect(document.title).toBe('Original Title');
  });

  it('does not restore title on unmount by default', () => {
    const { unmount } = renderHook(() => useDocumentTitle('Page'));

    expect(document.title).toBe('Page | MFE Payments');

    unmount();

    expect(document.title).toBe('Page | MFE Payments');
  });

  it('handles multiple rapid title changes', () => {
    const { rerender } = renderHook(
      ({ title }) => useDocumentTitle(title),
      { initialProps: { title: 'Page 1' } }
    );

    rerender({ title: 'Page 2' });
    rerender({ title: 'Page 3' });
    rerender({ title: 'Page 4' });

    expect(document.title).toBe('Page 4 | MFE Payments');
  });

  it('handles special characters in title', () => {
    renderHook(() => useDocumentTitle('Payment #123 - $500.00'));

    expect(document.title).toBe('Payment #123 - $500.00 | MFE Payments');
  });

  it('handles unicode characters in title', () => {
    renderHook(() => useDocumentTitle('भुगतान डैशबोर्ड'));

    expect(document.title).toBe('भुगतान डैशबोर्ड | MFE Payments');
  });

  it('handles long titles', () => {
    const longTitle = 'A'.repeat(100);
    renderHook(() => useDocumentTitle(longTitle));

    expect(document.title).toBe(`${longTitle} | MFE Payments`);
  });

  it('preserves suffix format when title is provided', () => {
    renderHook(() => useDocumentTitle('Home', { suffix: '- Application' }));

    expect(document.title).toBe('Home - Application');
  });
});
