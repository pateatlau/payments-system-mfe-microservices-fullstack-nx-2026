# API Versioning Policy

## Overview

The MFE Payments System API supports versioning to ensure backward compatibility while allowing the API to evolve. This document describes the versioning strategy, deprecation process, and migration guidelines.

## Versioning Strategy

The API supports two versioning methods:

### 1. URL-Based Versioning (Recommended)

Include the version in the URL path:

```
GET /api/v1/auth/login
POST /api/v1/payments
GET /api/v2/profile
```

This is the recommended approach as it:
- Makes the version explicit and visible
- Works with all HTTP clients
- Is easy to test and debug
- Can be bookmarked/shared

### 2. Header-Based Versioning

Include the version in the `Accept` header:

```http
GET /api/auth/login
Accept: application/vnd.api+json; version=1
```

Alternative format:
```http
Accept: application/vnd.api.v1+json
```

This approach is useful when:
- You need to switch versions without changing URLs
- You want to keep URLs cleaner
- You're building a client that manages versioning internally

## Version Resolution

The API resolves versions in this priority order:

1. **URL path** - `/api/v1/...` takes highest precedence
2. **Accept header** - `version=N` or `vnd.api.vN`
3. **Default** - Falls back to the configured default version

If no version is specified and unversioned requests are allowed (default behavior), the API uses the default version (currently v1).

## Current Version Support

| Version | Status | Sunset Date | Notes |
|---------|--------|-------------|-------|
| v1 | **Current** | - | Full support |

## Response Headers

Every API response includes versioning headers:

| Header | Description | Example |
|--------|-------------|---------|
| `X-API-Version` | The version used for this request | `1` |
| `X-API-Version-Source` | How the version was determined | `url`, `header`, or `default` |
| `X-API-Latest-Version` | The latest stable version | `1` |
| `X-API-Supported-Versions` | All supported versions | `1, 2` |

### Deprecation Headers (for deprecated versions)

| Header | Description |
|--------|-------------|
| `Deprecation` | `true` if using a deprecated version |
| `Sunset` | RFC 7231 formatted date when version will be removed |
| `Warning` | RFC 7234 warning with deprecation message |
| `X-API-Deprecation-Warning` | Human-readable deprecation message |
| `Link` | Links to documentation and successor version |

## Version Information Endpoint

Get current versioning information:

```http
GET /api/version
```

Response:
```json
{
  "success": true,
  "data": {
    "currentVersion": 1,
    "supportedVersions": [1],
    "defaultVersion": 1,
    "deprecatedVersions": [],
    "versioningMethods": {
      "urlBased": {
        "description": "Include version in URL path",
        "example": "/api/v1/auth/login",
        "format": "/api/v{version}/{resource}"
      },
      "headerBased": {
        "description": "Include version in Accept header",
        "example": "Accept: application/vnd.api+json; version=1",
        "alternativeFormat": "Accept: application/vnd.api.v1+json"
      }
    },
    "documentation": "/api-docs"
  }
}
```

## Deprecation Process

When a new version is released:

1. **Announcement** - New version announced with release notes
2. **Deprecation Notice** - Old version marked deprecated with sunset date (minimum 6 months)
3. **Warning Headers** - Deprecated responses include warning headers
4. **Migration Guide** - Documentation provided for migrating
5. **Sunset** - Version removed after sunset date

### Client Responsibilities

- Monitor `Deprecation` header in responses
- Plan migration when warnings appear
- Complete migration before sunset date
- Use version information endpoint to check support

## Error Responses

### Unsupported Version

```http
GET /api/v99/auth/login
HTTP/1.1 400 Bad Request
```

```json
{
  "success": false,
  "error": {
    "code": "UNSUPPORTED_API_VERSION",
    "message": "API version 99 is not supported",
    "supportedVersions": [1],
    "latestVersion": 1
  }
}
```

### Version Required (if configured)

```http
GET /api/auth/login
HTTP/1.1 400 Bad Request
```

```json
{
  "success": false,
  "error": {
    "code": "API_VERSION_REQUIRED",
    "message": "API version is required. Use URL versioning (/api/v1/...) or header versioning (Accept: application/vnd.api+json; version=1)",
    "supportedVersions": [1],
    "latestVersion": 1
  }
}
```

## Best Practices

### For API Consumers

1. **Always specify version** - Don't rely on default version
2. **Use URL versioning** - More explicit and debuggable
3. **Monitor headers** - Watch for deprecation warnings
4. **Test migrations early** - Don't wait until sunset date
5. **Pin versions in production** - Avoid unexpected changes

### For API Development

1. **Backward compatible changes** - Don't require new version:
   - Adding new endpoints
   - Adding optional fields
   - Adding new response fields
   - Bug fixes

2. **Breaking changes** - Require new version:
   - Removing endpoints
   - Removing or renaming fields
   - Changing field types
   - Changing endpoint behavior

## Configuration

API versioning is configured in `apps/api-gateway/src/routes/proxy-routes.ts`:

```typescript
setVersionConfig({
  supportedVersions: [1],        // Supported version numbers
  defaultVersion: 1,             // Version for unversioned requests
  latestVersion: 1,              // Latest stable version
  deprecatedVersions: [          // Deprecated versions with sunset dates
    // { version: 1, sunsetDate: '2027-01-01', message: 'Please migrate to v2' }
  ],
  allowUnversioned: true,        // Allow requests without version
});
```

## Examples

### cURL Examples

```bash
# URL-based versioning
curl -X POST https://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Header-based versioning
curl -X POST https://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/vnd.api+json; version=1" \
  -d '{"email": "user@example.com", "password": "password"}'

# Check version info
curl https://localhost/api/version
```

### JavaScript/TypeScript Examples

```typescript
// URL-based versioning (recommended)
const response = await fetch('/api/v1/payments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 100 }),
});

// Header-based versioning
const response = await fetch('/api/payments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.api+json; version=1',
  },
  body: JSON.stringify({ amount: 100 }),
});

// Check for deprecation warnings
const apiVersion = response.headers.get('X-API-Version');
const isDeprecated = response.headers.get('Deprecation') === 'true';
const sunsetDate = response.headers.get('Sunset');

if (isDeprecated) {
  console.warn(`API v${apiVersion} is deprecated. Sunset: ${sunsetDate}`);
}
```

## Related Documentation

- [API Gateway Architecture](../EXECUTIVE_SUMMARY.md)
- [Swagger API Documentation](https://localhost/api-docs)
- [Backend Hardening Plan](./BACKEND-HARDENING-PLAN.md)
