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

#### POST /api/[platform]/versions
Adds a new version to the platform.

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

### Schema Management

#### GET /api/[platform]/[version]
Returns the resolved schema for the specified platform and version.

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