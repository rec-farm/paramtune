# API Documentation

All API endpoints return JSON responses. CORS is controlled via the `CORS_ORIGIN` environment variable and middleware.

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://yourdomain.com/api`

## Response Format
- Success: `200 OK` with JSON data
- Created: `201 Created` for successful POST operations
- Not Found: `404 Not Found` for missing resources
- Bad Request: `400 Bad Request` for invalid input
- Server Error: `500 Internal Server Error` for unexpected errors

## Endpoints

### Platform Management

#### GET /api/schemas
Returns all platforms with their metadata.

**Response:**
```json
[
  { "name": "mobile", "versions": ["1.0.0", "1.1.0"] },
  { "name": "web", "versions": ["2.0.0"] }
]
```

#### GET /api/[platform]
Returns platform metadata including name and available versions.

**Response:**
```json
{
  "name": "mobile",
  "versions": ["1.0.0", "1.1.0", "1.2.0"]
}
```

**Error Response (404):**
```json
{
  "error": "Platform not found"
}
```

#### POST /api/[platform]
Creates or updates platform metadata.

**Request Body:**
```json
{
  "name": "mobile",
  "versions": ["1.0.0", "1.1.0"]
}
```

**Response:**
```json
{
  "ok": true
}
```

#### GET /api/[platform]/versions
Returns an array of all available versions for the platform.

**Response:**
```json
["1.0.0", "1.1.0", "1.2.0"]
```

**Error Response (404):**
```json
{
  "error": "Platform not found"
}
```

#### POST /api/[platform]/versions
Adds a new version to the platform. The platform must already exist (create
it first with `POST /api/[platform]`).

The version must be a valid semantic version. Build metadata is supported, so
`1.2.3+build.5` and `1.0.0-beta.1+exp.sha.5114f85` are both accepted. Versions
are limited to 128 characters and may contain only alphanumeric characters,
dots, hyphens, and plus signs — a value that only becomes valid semver after
trimming (e.g. `" 1.2.3 "`) is rejected rather than stored as-is.

**Request Body:**
```json
{
  "version": "1.2.3"
}
```

**Response:**
```json
{
  "ok": true
}
```

**Error Response (400):**
```json
{
  "error": "Missing \"version\" in body"
}
```

**Error Response (404):**
```json
{
  "error": "Platform not found"
}
```

### Schema Management

#### GET /api/[platform]/[version]
Returns the resolved schema for the specified platform and version.

The `[version]` path segment accepts any version the write endpoints can
create, including build metadata. In a path segment `+` is a literal, so both
`/api/ios/1.2.3+build.5` and the percent-encoded `/api/ios/1.2.3%2Bbuild.5`
resolve to the same version. Note that this does not hold in query strings,
where `+` means a space and must be sent as `%2B`.

**Response:**
```json
{
  "content": {
    "feature": {
      "enabled": true,
      "config": { "timeout": 5000 }
    }
  },
  "dependencies": ["core/1.0.0"],
  "output": {
    "feature": {
      "enabled": true,
      "config": { "timeout": 5000 }
    },
    "core": {
      "version": "1.0.0",
      "settings": { "debug": false }
    }
  }
}
```

**Error Response (404):**
```json
{
  "error": "Version not found"
}
```

#### GET /api/schemas/[...slug]
Legacy endpoint for schema access with flexible routing.

**Patterns:**
- `/api/schemas` - Returns all platforms
- `/api/schemas/[platform]` - Returns platform metadata
- `/api/schemas/[platform]/[version]` - Returns specific schema

## Schema Features

### @extends Directive
Schemas support composition using the `@extends` directive:

```json
{
  "@extends": "core/1.0.0",
  "feature": {
    "enabled": true,
    "override": "custom-value"
  }
}
```

### Dependency Resolution
- **Exact versions**: `core/1.2.3`
- **Latest**: `core/latest` or `core`
- **Ranges**: `core/^1.0.0`, `core/~1.2.0`, `core/>=1.0.0`

### Circular Dependency Detection
The system detects and prevents circular dependencies with clear error messages.
If schema A extends B and B extends A, the save will fail with a `Circular dependency detected` error.

### Schema Validation
Before saving, schemas are validated:
- Content must be a plain JSON object (not array, string, null, etc.)
- All `@extends` references must resolve to existing platform/version pairs
- Version ranges must match at least one available version
- Circular dependency chains are rejected at any depth

### Cascade Updates
When a base schema is updated, all schemas that depend on it (via `@extends`) are automatically re-processed. The cascade uses visited-set tracking to prevent infinite loops.

## Examples

### Create a Platform
```bash
curl -X POST http://localhost:3000/api/mobile \
  -H "Content-Type: application/json" \
  -d '{"name": "mobile", "versions": ["1.0.0"]}'
```

### Add a Version
```bash
curl -X POST http://localhost:3000/api/mobile/versions \
  -H "Content-Type: application/json" \
  -d '{"version": "1.2.3"}'
```

### Get Platform Info
```bash
curl http://localhost:3000/api/mobile
```

### Get Schema
```bash
curl http://localhost:3000/api/mobile/1.2.3
```

### List All Versions
```bash
curl http://localhost:3000/api/mobile/versions
```

## Error Handling

All endpoints include proper error handling with:
- Detailed error messages
- Appropriate HTTP status codes
- Server-side logging for debugging
- CORS headers for cross-origin requests

## Rate Limiting & Security

- CORS configured via `CORS_ORIGIN` environment variable
- Security headers added via middleware
- Input validation on all endpoints
- No authentication required (configure as needed)

## Caching

- All API responses include `Cache-Control: no-store` headers
- Redis provides backend caching for schema resolution
- Consider implementing CDN caching for production deployments