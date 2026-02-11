import {
  sanitizeHtml,
  stripHtml,
  containsDangerousHtml,
  sanitizeUrl,
  SANITIZE_PRESETS,
} from './sanitize';

describe('sanitize utilities', () => {
  describe('sanitizeHtml', () => {
    describe('with standard preset (default)', () => {
      it('should remove script tags', () => {
        const dirty = '<script>alert("xss")</script><p>Hello</p>';
        const clean = sanitizeHtml(dirty);
        expect(clean).toBe('<p>Hello</p>');
        expect(clean).not.toContain('script');
      });

      it('should remove onclick handlers', () => {
        const dirty = '<button onclick="alert(\'xss\')">Click</button>';
        const clean = sanitizeHtml(dirty);
        expect(clean).not.toContain('onclick');
      });

      it('should remove javascript: URLs', () => {
        const dirty = '<a href="javascript:alert(\'xss\')">Click</a>';
        const clean = sanitizeHtml(dirty);
        expect(clean).not.toContain('javascript:');
      });

      it('should preserve safe HTML tags', () => {
        const dirty = '<p>Hello <strong>World</strong></p>';
        const clean = sanitizeHtml(dirty);
        expect(clean).toContain('<p>');
        expect(clean).toContain('<strong>');
      });

      it('should preserve links with safe href', () => {
        const dirty = '<a href="https://example.com">Link</a>';
        const clean = sanitizeHtml(dirty);
        expect(clean).toContain('href="https://example.com"');
      });

      it('should add target="_blank" and rel="noopener noreferrer" to links', () => {
        const dirty = '<a href="https://example.com">Link</a>';
        const clean = sanitizeHtml(dirty);
        expect(clean).toContain('target="_blank"');
        expect(clean).toContain('rel="noopener noreferrer"');
      });

      it('should return empty string for null/undefined', () => {
        expect(sanitizeHtml('')).toBe('');
        expect(sanitizeHtml(null as unknown as string)).toBe('');
        expect(sanitizeHtml(undefined as unknown as string)).toBe('');
      });
    });

    describe('with strict preset', () => {
      it('should remove links', () => {
        const dirty = '<a href="https://example.com">Link</a>';
        const clean = sanitizeHtml(dirty, 'strict');
        expect(clean).not.toContain('<a');
        expect(clean).toContain('Link');
      });

      it('should allow only basic formatting', () => {
        const dirty = '<p><b>Bold</b> <i>Italic</i> <em>Emphasis</em></p>';
        const clean = sanitizeHtml(dirty, 'strict');
        expect(clean).toContain('<b>');
        expect(clean).toContain('<i>');
        expect(clean).toContain('<em>');
      });
    });

    describe('with rich preset', () => {
      it('should allow images with src', () => {
        const dirty = '<img src="https://example.com/img.png" alt="Test">';
        const clean = sanitizeHtml(dirty, 'rich');
        expect(clean).toContain('<img');
        expect(clean).toContain('src=');
      });

      it('should allow tables', () => {
        const dirty = '<table><tr><td>Cell</td></tr></table>';
        const clean = sanitizeHtml(dirty, 'rich');
        expect(clean).toContain('<table>');
        expect(clean).toContain('<td>');
      });

      it('should allow headings', () => {
        const dirty = '<h1>Title</h1><h2>Subtitle</h2>';
        const clean = sanitizeHtml(dirty, 'rich');
        expect(clean).toContain('<h1>');
        expect(clean).toContain('<h2>');
      });
    });

    describe('with textOnly preset', () => {
      it('should strip all HTML tags', () => {
        const dirty = '<p>Hello <b>World</b></p>';
        const clean = sanitizeHtml(dirty, 'textOnly');
        expect(clean).toBe('Hello World');
        expect(clean).not.toContain('<');
      });
    });

    describe('XSS attack vectors', () => {
      const xssVectors = [
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        '<body onload=alert(1)>',
        '<iframe src="javascript:alert(1)">',
        '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>',
        '<input onfocus=alert(1) autofocus>',
        '<marquee onstart=alert(1)>',
        '<video><source onerror=alert(1)>',
        '<audio src=x onerror=alert(1)>',
        '<details open ontoggle=alert(1)>',
      ];

      xssVectors.forEach((vector, index) => {
        it(`should block XSS vector #${index + 1}`, () => {
          const clean = sanitizeHtml(vector);
          expect(clean).not.toContain('onerror');
          expect(clean).not.toContain('onload');
          expect(clean).not.toContain('onfocus');
          expect(clean).not.toContain('onstart');
          expect(clean).not.toContain('ontoggle');
          expect(clean).not.toContain('javascript:');
        });
      });
    });
  });

  describe('stripHtml', () => {
    it('should remove all HTML tags', () => {
      expect(stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World');
    });

    it('should handle nested tags', () => {
      expect(stripHtml('<div><p><span>Text</span></p></div>')).toBe('Text');
    });

    it('should handle empty input', () => {
      expect(stripHtml('')).toBe('');
    });

    it('should preserve text content', () => {
      expect(stripHtml('<script>alert("xss")</script>Safe text')).toBe(
        'Safe text'
      );
    });
  });

  describe('containsDangerousHtml', () => {
    it('should return true for script tags', () => {
      expect(containsDangerousHtml('<script>alert(1)</script>')).toBe(true);
    });

    it('should return true for event handlers', () => {
      expect(containsDangerousHtml('<img onerror="alert(1)">')).toBe(true);
    });

    it('should return false for safe HTML', () => {
      expect(containsDangerousHtml('<p>Hello World</p>')).toBe(false);
    });

    it('should return false for empty input', () => {
      expect(containsDangerousHtml('')).toBe(false);
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow https URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should allow http URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should allow relative URLs', () => {
      expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page');
      expect(sanitizeUrl('./relative')).toBe('./relative');
    });

    it('should allow mailto URLs', () => {
      expect(sanitizeUrl('mailto:test@example.com')).toBe(
        'mailto:test@example.com'
      );
    });

    it('should allow tel URLs', () => {
      expect(sanitizeUrl('tel:+1234567890')).toBe('tel:+1234567890');
    });

    it('should block javascript: URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
      expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('');
      expect(sanitizeUrl('  javascript:alert(1)')).toBe('');
    });

    it('should block data: URLs', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('should block vbscript: URLs', () => {
      expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('');
    });

    it('should block file: URLs', () => {
      expect(sanitizeUrl('file:///etc/passwd')).toBe('');
    });

    it('should return empty for empty input', () => {
      expect(sanitizeUrl('')).toBe('');
    });

    it('should block unknown protocols', () => {
      expect(sanitizeUrl('custom:something')).toBe('');
    });
  });

  describe('SANITIZE_PRESETS', () => {
    it('should have strict preset with limited tags', () => {
      expect(SANITIZE_PRESETS.strict.ALLOWED_TAGS).toContain('b');
      expect(SANITIZE_PRESETS.strict.ALLOWED_TAGS).toContain('i');
      expect(SANITIZE_PRESETS.strict.ALLOWED_TAGS).not.toContain('a');
      expect(SANITIZE_PRESETS.strict.ALLOWED_TAGS).not.toContain('img');
    });

    it('should have standard preset with links', () => {
      expect(SANITIZE_PRESETS.standard.ALLOWED_TAGS).toContain('a');
      expect(SANITIZE_PRESETS.standard.ALLOWED_ATTR).toContain('href');
    });

    it('should have rich preset with images and tables', () => {
      expect(SANITIZE_PRESETS.rich.ALLOWED_TAGS).toContain('img');
      expect(SANITIZE_PRESETS.rich.ALLOWED_TAGS).toContain('table');
      expect(SANITIZE_PRESETS.rich.ALLOWED_ATTR).toContain('src');
    });

    it('should have textOnly preset with no tags', () => {
      expect(SANITIZE_PRESETS.textOnly.ALLOWED_TAGS).toHaveLength(0);
    });
  });
});
