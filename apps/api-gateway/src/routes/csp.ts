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
 * CSP Report structure (report-uri format, kebab-case)
 */
interface CspReportLegacy {
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
 * CSP Report structure (report-to format, camelCase)
 * TODO: Full report-to support with Reporting-Endpoints header
 */
interface CspReportModern {
  documentURL?: string;
  referrer?: string;
  blockedURL?: string;
  effectiveDirective?: string;
  originalPolicy?: string;
  disposition?: 'enforce' | 'report';
  statusCode?: number;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
}

/**
 * Reporting API envelope (report-to format)
 */
interface ReportingApiEnvelope {
  age?: number;
  body?: CspReportModern;
  type?: string;
  url?: string;
  user_agent?: string;
}

/**
 * Normalized CSP report for logging (uses kebab-case keys)
 */
interface NormalizedCspReport {
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
 * Normalize CSP report from various formats to a consistent structure
 * Handles both report-uri (legacy) and report-to (modern) formats
 */
function normalizeCspReport(body: unknown): NormalizedCspReport | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const data = body as Record<string, unknown>;

  // Format 1: report-uri with csp-report wrapper
  // { "csp-report": { "document-uri": "...", ... } }
  if (data['csp-report'] && typeof data['csp-report'] === 'object') {
    return data['csp-report'] as CspReportLegacy;
  }

  // Format 2: report-to envelope with body containing camelCase keys
  // { "age": 10, "body": { "documentURL": "...", ... }, "type": "csp-violation" }
  if (data.type === 'csp-violation' && data.body && typeof data.body === 'object') {
    const envelope = data as ReportingApiEnvelope;
    const modern = envelope.body as CspReportModern;
    // Normalize camelCase to kebab-case for consistent logging
    return {
      'document-uri': modern.documentURL,
      'referrer': modern.referrer,
      'effective-directive': modern.effectiveDirective,
      'original-policy': modern.originalPolicy,
      'blocked-uri': modern.blockedURL,
      'status-code': modern.statusCode,
      'source-file': modern.sourceFile,
      'line-number': modern.lineNumber,
      'column-number': modern.columnNumber,
    };
  }

  // Format 3: Direct report-uri format without wrapper (some browsers)
  // { "document-uri": "...", "violated-directive": "...", ... }
  if (data['document-uri'] || data['violated-directive'] || data['blocked-uri']) {
    return data as CspReportLegacy;
  }

  // Format 4: Direct report-to format without envelope (edge case)
  // { "documentURL": "...", "effectiveDirective": "...", ... }
  if (data.documentURL || data.effectiveDirective || data.blockedURL) {
    const modern = data as CspReportModern;
    return {
      'document-uri': modern.documentURL,
      'referrer': modern.referrer,
      'effective-directive': modern.effectiveDirective,
      'original-policy': modern.originalPolicy,
      'blocked-uri': modern.blockedURL,
      'status-code': modern.statusCode,
      'source-file': modern.sourceFile,
      'line-number': modern.lineNumber,
      'column-number': modern.columnNumber,
    };
  }

  return null;
}

/**
 * POST /api/csp-violations
 *
 * Receives CSP violation reports from browsers.
 * Content-Type: application/csp-report or application/json
 */
router.post('/csp-violations', cspBodyParser, (req: Request, res: Response) => {
  try {
    // Extract and normalize the CSP report from various formats
    // Supports both report-uri (legacy) and report-to (modern) formats
    const report = normalizeCspReport(req.body);

    if (!report) {
      logger.warn('Empty or unrecognized CSP violation report received', {
        contentType: req.headers['content-type'],
        userAgent: req.headers['user-agent'],
        rawBody: JSON.stringify(req.body).slice(0, 500), // Truncate for logging
      });
      return res.status(400).json({ success: false, error: 'Empty or invalid report' });
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
  } catch (err) {
    // Ensure error is an Error instance for proper Sentry capture
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('Error processing CSP violation report', error, {
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
