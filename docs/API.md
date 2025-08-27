# API

All responses are JSON. CORS is controlled via the `CORS_ORIGIN` env and middleware.

## Endpoints

### GET /api/[platform]
- Returns platform metadata `{ name, versions }` or 404.

### POST /api/[platform]
- Body: `{ name, versions }`
- Creates/updates platform metadata.

### GET /api/[platform]/versions
- Returns an array of version strings.

### POST /api/[platform]/versions
- Body: `{ version: "1.2.3" }`
- Appends a version to the platform.

### GET /api/[platform]/[version]
- Returns schema for the version or 404.

## Examples

Request:
```bash
curl -s http://localhost:3000/api/mobile
```

Create a version:
```bash
curl -s -X POST http://localhost:3000/api/mobile/versions \
  -H 'Content-Type: application/json' \
  -d '{"version":"1.2.3"}'
```