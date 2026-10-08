# API Documentation

All API endpoints return JSON responses. CORS is controlled via the `CORS_ORIGIN` environment variable and middleware.

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://yourdomain.com/api`

## Authentication

People use the dashboard session cookie, which allows reads and writes.

Services and CI jobs use a read-only **API token**, created under **Dashboard → API tokens**:

```bash
curl -H "Authorization: Bearer ptk_..." https://yourdomain.com/api/mobile/1.1.0
```

- Tokens work on `GET`/`HEAD` of `/api/schemas`, `/api/{platform}`, `/api/{platform}/versions` and `/api/{platform}/{version}`. Writes with a token return `403`; dashboard endpoints under `/api/_ui/v1` don't accept tokens.
- A token reads either every platform or a chosen list. Out-of-scope platforms return `404` and are omitted from `/api/schemas`.
- Scope limits which platforms a token can request, not what their resolved `output` contains: a scoped platform's output includes values it inherits through `@extends` from other platforms, and its `dependencies` name them.
- The plaintext is shown once at creation. Paramtune stores only its SHA-256 hash in Redis, records when it was last used, and audits creation and revocation.
- An unknown or revoked token returns `401`; a Redis outage returns `503`.

### Managing tokens (session required)

- `GET /api/_ui/v1/tokens` lists tokens: `{ id, name, platforms (null = all), hint, createdAt, createdBy, lastUsedAt? }`
- `POST /api/_ui/v1/tokens` with `{ "name": "ci", "platforms": ["ios"] }` (omit `platforms` for all) returns `201` with `{ token, record }`
- `DELETE /api/_ui/v1/tokens/{id}` revokes a token immediately

### Roles

Roles come from the OIDC claim named by `OIDC_ROLES_CLAIM` (default `groups`) at sign-in:

| Setting | Effect |
| --- | --- |
| neither group set | everyone signed in can edit and administer (the default) |
| `OIDC_EDITOR_GROUP` | only its members (and admins) can change configuration; others are view-only |
| `OIDC_ADMIN_GROUP` | only its members can delete platforms or versions and manage API tokens |

Group settings are read on every request, so setting one also narrows sessions that already exist. Forbidden requests return `403`. `GET /api/auth/get-session` includes `permissions: { write, manage }`.

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
Returns platform metadata including name, available versions, and optional `kind`.

`kind` is one of `ios`, `android`, `web`, `service`, or `custom`. It controls dashboard descriptions and icons; it does not change platform identifiers or configuration resolution. Older records may omit it and display as Custom.

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
Creates or updates platform metadata. An optional `kind` sets the platform type; omitting it preserves an existing type when updating versions. Invalid types return HTTP 400.

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

All endpoints require an authenticated Paramtune session; the `curl` commands below omit the session cookie for brevity but will receive `401 Unauthorized` without one.

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
- All endpoints require an authenticated Paramtune session or, for reads, an API token; requests without either receive `401 Unauthorized`

## Caching

- All API responses include `Cache-Control: no-store` headers
- Redis provides backend caching for schema resolution
- Consider implementing CDN caching for production deployments
### Dashboard platform creation

`POST /api/_ui/v1/platforms` accepts `{ "name": "customer-portal", "kind": "web" }`, creates a platform with no versions, and returns HTTP 201. `kind` is optional. A duplicate name returns HTTP 409. This endpoint requires an authenticated session and the same write protections as other dashboard mutations.

The dashboard guides users through platform creation, a semantic version (initial suggestion `1.0.0`), and an explicit configuration save. Loading the illustrative JSON example only edits the browser draft; it does not save or configure application behavior automatically.
