/**
 * CSRF Token Routes
 *
 * Provides endpoints for CSRF token management:
 * - GET /api/csrf-token: Get a new CSRF token
 *
 * The frontend should:
 * 1. Call this endpoint on app initialization
 * 2. Store the token in memory (not localStorage)
 * 3. Include the token in X-CSRF-Token header on all mutations
 *
 * The token is also set in a cookie (XSRF-TOKEN) which the browser
 * will automatically send with requests. The server validates that
 * the header token matches the cookie token.
 */

import { Router, Request, Response } from 'express';
import { generateCsrfToken } from '../middleware/csrf';

const router = Router();

// Cookie settings
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * @swagger
 * /api/csrf-token:
 *   get:
 *     summary: Get CSRF token
 *     description: |
 *       Returns a CSRF token for use in subsequent requests.
 *       The token is also set in a cookie (XSRF-TOKEN).
 *
 *       **Usage:**
 *       1. Call this endpoint on app initialization
 *       2. Store the token from the response body in memory
 *       3. Include the token in `X-CSRF-Token` header on POST/PUT/DELETE/PATCH requests
 *
 *       **Security Notes:**
 *       - Token is set in cookie with SameSite=Strict
 *       - Cookie is readable by JavaScript (httpOnly=false)
 *       - Production uses Secure flag (HTTPS only)
 *     tags:
 *       - Security
 *     responses:
 *       200:
 *         description: CSRF token generated successfully
 *         headers:
 *           Set-Cookie:
 *             description: XSRF-TOKEN cookie containing the CSRF token
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: CSRF token to include in X-CSRF-Token header
 *                       example: "a1b2c3d4e5f6..."
 *                     headerName:
 *                       type: string
 *                       description: Header name to use for the token
 *                       example: "X-CSRF-Token"
 */
router.get('/csrf-token', (req: Request, res: Response) => {
  // Check if token already exists in cookie
  let token = req.cookies?.[CSRF_COOKIE_NAME];

  // Generate new token if not present
  if (!token) {
    token = generateCsrfToken();
  }

  // Set cookie with appropriate security settings
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // MUST be false so JS can read it
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    // Session cookie - expires when browser closes
    // For persistent sessions, uncomment and set maxAge
    // maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  res.json({
    success: true,
    data: {
      token,
      headerName: 'X-CSRF-Token',
    },
  });
});

export default router;
