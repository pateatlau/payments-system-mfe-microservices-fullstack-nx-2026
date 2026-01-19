/**
 * API Versioning Middleware
 *
 * POC-3 Phase 6.4: API Versioning
 *
 * Supports two versioning strategies:
 * 1. URL-based: /api/v1/auth/login, /api/v2/auth/login
 * 2. Header-based: Accept: application/vnd.api+json; version=1
 *
 * Features:
 * - Version extraction from URL or headers
 * - Default version fallback
 * - Version deprecation warnings
 * - Sunset headers for deprecated versions
 * - Version mismatch detection
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * API version configuration
 */
export interface ApiVersionConfig {
  // Currently supported versions
  supportedVersions: number[];
  // Default version when not specified
  defaultVersion: number;
  // Latest stable version
  latestVersion: number;
  // Deprecated versions with sunset dates
  deprecatedVersions: {
    version: number;
    sunsetDate: string; // ISO date string
    message?: string;
  }[];
  // Whether to allow unversioned requests (fallback to default)
  allowUnversioned: boolean;
}

/**
 * Default version configuration
 */
export const defaultVersionConfig: ApiVersionConfig = {
  supportedVersions: [1],
  defaultVersion: 1,
  latestVersion: 1,
  deprecatedVersions: [],
  allowUnversioned: true,
};

// Store current config
let currentConfig: ApiVersionConfig = { ...defaultVersionConfig };

/**
 * Update API version configuration
 */
export function setVersionConfig(config: Partial<ApiVersionConfig>): void {
  currentConfig = { ...currentConfig, ...config };
  logger.info('API version configuration updated', {
    supportedVersions: currentConfig.supportedVersions,
    defaultVersion: currentConfig.defaultVersion,
    latestVersion: currentConfig.latestVersion,
    deprecatedVersions: currentConfig.deprecatedVersions.length,
  });
}

/**
 * Get current API version configuration
 */
export function getVersionConfig(): ApiVersionConfig {
  return { ...currentConfig };
}

/**
 * Extended Request interface with version info
 */
export interface VersionedRequest extends Request {
  apiVersion?: number;
  apiVersionSource?: 'url' | 'header' | 'default';
}

/**
 * Extract version from Accept header
 * Supports: application/vnd.api+json; version=1
 */
function extractVersionFromHeader(acceptHeader: string | undefined): number | null {
  if (!acceptHeader) return null;

  // Match: application/vnd.api+json; version=N or application/vnd.api.vN+json
  const versionMatch = acceptHeader.match(/version=(\d+)/i);
  if (versionMatch) {
    return parseInt(versionMatch[1], 10);
  }

  // Alternative format: application/vnd.api.v1+json
  const altMatch = acceptHeader.match(/vnd\.api\.v(\d+)/i);
  if (altMatch) {
    return parseInt(altMatch[1], 10);
  }

  return null;
}

/**
 * Extract version from URL path
 * Supports: /api/v1/auth/login -> version 1
 */
function extractVersionFromUrl(path: string): { version: number | null; strippedPath: string } {
  // Match /api/v1/, /api/v2/, etc.
  const versionMatch = path.match(/^\/api\/v(\d+)(\/.*)?$/);
  if (versionMatch) {
    const version = parseInt(versionMatch[1], 10);
    // Strip version from path: /api/v1/auth/login -> /api/auth/login
    const remainingPath = versionMatch[2] || '';
    const strippedPath = `/api${remainingPath}`;
    return { version, strippedPath };
  }

  return { version: null, strippedPath: path };
}

/**
 * Check if a version is deprecated
 */
function getDeprecationInfo(
  version: number
): { deprecated: boolean; sunsetDate?: string; message?: string } {
  const deprecation = currentConfig.deprecatedVersions.find((d) => d.version === version);
  if (deprecation) {
    return {
      deprecated: true,
      sunsetDate: deprecation.sunsetDate,
      message: deprecation.message,
    };
  }
  return { deprecated: false };
}

/**
 * Add deprecation headers to response
 */
function addDeprecationHeaders(
  res: Response,
  version: number,
  sunsetDate: string,
  message?: string
): void {
  // Standard deprecation header (RFC 8594)
  res.setHeader('Deprecation', 'true');

  // Sunset header with RFC 7231 date format
  const sunset = new Date(sunsetDate);
  res.setHeader('Sunset', sunset.toUTCString());

  // Link to documentation
  res.setHeader(
    'Link',
    `</api-docs>; rel="deprecation"; type="text/html", ` +
      `</api/v${currentConfig.latestVersion}>; rel="successor-version"`
  );

  // Custom warning header
  const warningMessage =
    message ||
    `API version ${version} is deprecated and will be removed after ${sunsetDate}. ` +
      `Please migrate to version ${currentConfig.latestVersion}.`;
  res.setHeader('X-API-Deprecation-Warning', warningMessage);

  // Standard Warning header (RFC 7234)
  res.setHeader('Warning', `299 - "${warningMessage}"`);
}

/**
 * Add version headers to response
 */
function addVersionHeaders(res: Response, version: number, source: string): void {
  res.setHeader('X-API-Version', version.toString());
  res.setHeader('X-API-Version-Source', source);
  res.setHeader('X-API-Latest-Version', currentConfig.latestVersion.toString());
  res.setHeader(
    'X-API-Supported-Versions',
    currentConfig.supportedVersions.join(', ')
  );
}

/**
 * API Versioning Middleware
 *
 * Extracts API version from URL path or Accept header and adds it to the request.
 * Adds deprecation warnings for deprecated versions.
 *
 * URL versioning takes precedence over header versioning.
 */
export function apiVersionMiddleware(
  req: VersionedRequest,
  res: Response,
  next: NextFunction
): void {
  let version: number | null = null;
  let versionSource: 'url' | 'header' | 'default' = 'default';
  let modifiedPath = req.path;

  // 1. Try URL-based versioning first (takes precedence)
  const urlVersion = extractVersionFromUrl(req.path);
  if (urlVersion.version !== null) {
    version = urlVersion.version;
    versionSource = 'url';
    // Update the path to strip version prefix for downstream routing
    modifiedPath = urlVersion.strippedPath;
    req.url = modifiedPath + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
  }

  // 2. If no URL version, try header-based versioning
  if (version === null) {
    const acceptHeader = req.get('Accept');
    const headerVersion = extractVersionFromHeader(acceptHeader);
    if (headerVersion !== null) {
      version = headerVersion;
      versionSource = 'header';
    }
  }

  // 3. Fallback to default version
  if (version === null) {
    if (!currentConfig.allowUnversioned) {
      res.status(400).json({
        success: false,
        error: {
          code: 'API_VERSION_REQUIRED',
          message:
            'API version is required. Use URL versioning (/api/v1/...) or ' +
            'header versioning (Accept: application/vnd.api+json; version=1)',
          supportedVersions: currentConfig.supportedVersions,
          latestVersion: currentConfig.latestVersion,
        },
      });
      return;
    }
    version = currentConfig.defaultVersion;
    versionSource = 'default';
  }

  // 4. Validate version is supported
  if (!currentConfig.supportedVersions.includes(version)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'UNSUPPORTED_API_VERSION',
        message: `API version ${version} is not supported`,
        supportedVersions: currentConfig.supportedVersions,
        latestVersion: currentConfig.latestVersion,
      },
    });
    return;
  }

  // 5. Add version info to request
  req.apiVersion = version;
  req.apiVersionSource = versionSource;

  // 6. Add version headers to response
  addVersionHeaders(res, version, versionSource);

  // 7. Check for deprecation and add warnings
  const deprecation = getDeprecationInfo(version);
  if (deprecation.deprecated && deprecation.sunsetDate) {
    addDeprecationHeaders(res, version, deprecation.sunsetDate, deprecation.message);

    logger.warn('Deprecated API version used', {
      version,
      sunsetDate: deprecation.sunsetDate,
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  }

  // 8. Log version usage for analytics
  logger.debug('API version resolved', {
    version,
    source: versionSource,
    path: modifiedPath,
    originalPath: req.originalUrl,
  });

  next();
}

/**
 * Middleware to require specific API version
 * Use for routes that only work with certain versions
 */
export function requireVersion(
  ...allowedVersions: number[]
): (req: VersionedRequest, res: Response, next: NextFunction) => void {
  return (req: VersionedRequest, res: Response, next: NextFunction): void => {
    const version = req.apiVersion || currentConfig.defaultVersion;

    if (!allowedVersions.includes(version)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VERSION_NOT_SUPPORTED_FOR_ROUTE',
          message: `This endpoint requires API version ${allowedVersions.join(' or ')}`,
          requestedVersion: version,
          supportedVersionsForRoute: allowedVersions,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Middleware factory to handle version-specific logic
 * Routes requests to different handlers based on version
 */
export function versionedHandler(handlers: {
  [version: number]: (req: VersionedRequest, res: Response, next: NextFunction) => void;
  default?: (req: VersionedRequest, res: Response, next: NextFunction) => void;
}): (req: VersionedRequest, res: Response, next: NextFunction) => void {
  return (req: VersionedRequest, res: Response, next: NextFunction): void => {
    const version = req.apiVersion || currentConfig.defaultVersion;
    const handler = handlers[version] || handlers.default;

    if (!handler) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_HANDLER_FOR_VERSION',
          message: `No handler available for API version ${version}`,
          requestedVersion: version,
          availableVersions: Object.keys(handlers)
            .filter((k) => k !== 'default')
            .map(Number),
        },
      });
      return;
    }

    handler(req, res, next);
  };
}
