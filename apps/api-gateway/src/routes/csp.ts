/**
 * CSP Violation Reporting Routes
 *
 * Receives Content Security Policy violation reports from browsers.
 * Reports are logged for monitoring and analysis.
 *
 * Endpoint: POST /api/csp-violations
 *
 * CSP Report Format (report-uri):
 * {
 *   "csp-report": {
 *     "document-uri": "https://example.com/page",
 *     "referrer": "",
 *     "violated-directive": "script-src 'self'",
 *     "effective-directive": "script-src",
 *     "original-policy": "default-src 'self'; script-src 'self'",
 *     "blocked-uri": "https://evil.com/script.js",
 *     "status-code": 200
 *   }
 * }
 *
 * CSP Report Format (report-to, newer):
 * {
 *   "age": 10,
 *   "body": {
 *     "documentURL": "https://example.com/page",
 *     "referrer": "",
 *     "blockedURL": "https://evil.com/script.js",
 *     "effectiveDirective": "script-src",
 *     "originalPolicy": "...",
 *     "disposition": "enforce" | "report"
 *   },
 *   "type": "csp-violation",
 *   "url": "https://example.com/page",
 *   "user_agent": "..."
 * }
 */

import { Router, Request, Response } from 'express';
import express from 'express';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Body parser for CSP reports only
 * Applied only to this router, not globally on /api
 * This prevents breaking streaming proxy handlers that rely on req.pipe()
 */
const cspBodyParser = express.json({
  type: ['application/json', 'application/csp-report'],
  limit: '16kb', // CSP reports are small
});

/**
 * CSP Report structure (report-uri format)
 */
interface CspReport {
  'document-uri'?: string;
  'referrer'?: string;
  'violated-directive'?: string;
  'effective-directive'?: string;
  'original-policy'?: string;
  'blocked-uri'?: string;
  'status-code'?: number;
  'source-file'?: string;
  'line-number'?: number;
  'column-number'?: number;
}

/**
 * POST /api/csp-violations
 *
 * Receives CSP violation reports from browsers.
 * Content-Type: application/csp-report or application/json
 */
router.post('/csp-violations', cspBodyParser, (req: Request, res: Response) => {
  try {
    // Extract the CSP report from the request body
    // Browsers send either { "csp-report": {...} } or the report directly
    const report: CspReport = req.body?.['csp-report'] || req.body;

    if (!report || Object.keys(report).length === 0) {
      logger.warn('Empty CSP violation report received', {
        contentType: req.headers['content-type'],
        userAgent: req.headers['user-agent'],
      });
      return res.status(400).json({ success: false, error: 'Empty report' });
    }

    // Log the violation for monitoring
    logger.warn('CSP Violation Report', {
      documentUri: report['document-uri'],
      violatedDirective: report['violated-directive'],
      effectiveDirective: report['effective-directive'],
      blockedUri: report['blocked-uri'],
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
      columnNumber: report['column-number'],
      referrer: report['referrer'],
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    });

    // Return 204 No Content (standard for report endpoints)
    return res.status(204).send();
  } catch (error) {
    logger.error('Error processing CSP violation report', {
      error: error instanceof Error ? error.message : String(error),
      body: req.body,
    });
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
});

/**
 * GET /api/csp-violations
 *
 * Health check for CSP endpoint (useful for testing)
 */
router.get('/csp-violations', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'CSP violation reporting endpoint is active',
    usage: 'POST /api/csp-violations with Content-Type: application/csp-report',
  });
});

export default router;
