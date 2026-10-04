# Docker Deployment Guide

This guide explains how to run the ParamTune application using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system
- Git (to clone the repository)

## Quick Start

### Development Environment

For development with hot reloading:

```bash
# Clone the repository
git clone <repository-url>
cd paramtune

# Start development environment
docker-compose -f docker-compose.dev.yml up --build
```

This will:
- Start a Redis instance on port 6379
- Start the Vite frontend, Rust API, and Node auth sidecar on port 3000
- Enable Vite/auth hot reload; restart the app command after Rust changes

### Production Environment

For production deployment:

```bash
# Clone the repository
git clone <repository-url>
cd paramtune

# Configure required production secrets
export REDIS_PASSWORD="$(openssl rand -base64 24)"
export BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
export BETTER_AUTH_URL="http://localhost:3000"

# Start production environment
docker-compose up --build -d
```

This will:
- Start a Redis instance with persistent data storage
- Mount a persistent SQLite volume for authentication data
- Build and run the Vite frontend, Rust API, and Node auth service
- Run in detached mode (`-d` flag)

## Environment Variables

The application uses the following environment variables:

- `NODE_ENV`: Set to `development` or `production`
- `CORS_ORIGIN`: CORS allowed origin (default: `http://localhost:3000`)
- `REDIS_URL`: Redis connection string (format: `redis://host:port/db`)
- `REDIS_HOST`: Redis host (fallback if `REDIS_URL` not set)
- `REDIS_PORT`: Redis port (default: 6379)
- `REDIS_PASSWORD`: Redis password (optional)
- `REDIS_DB`: Redis database number (default: 2)
- `BETTER_AUTH_SECRET`: Secret used by better-auth for signing sessions
- `BETTER_AUTH_URL`: Public base URL for auth callbacks
- `AUTH_DB_PATH`: SQLite database path for auth data (default: `/app/data/auth.db` in Docker)
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

## Docker Compose Files

### `docker-compose.yml` (Production)
- Uses optimized multi-stage Dockerfile
- Runs production Rust server, loopback Node auth, and Vite assets
- Includes health checks
- Persistent Redis and auth database storage

### `docker-compose.dev.yml` (Development)
- Uses development Dockerfile
- Mounts source code for hot reloading
- Runs `pnpm dev` for development server
- Includes Redis for development

## Manual Docker Commands

If you prefer to use Docker commands directly:

### Build the image
```bash
docker build -t paramtune .
```

### Run with Redis
```bash
# Start Redis
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Run ParamTune
docker volume create paramtune_auth_data
docker run -d --name paramtune -p 3000:3000 \
  -v paramtune_auth_data:/app/data \
  -e REDIS_URL=redis://host.docker.internal:6379/2 \
  -e CORS_ORIGIN=http://localhost:3000 \
  -e AUTH_DB_PATH=/app/data/auth.db \
  -e BETTER_AUTH_SECRET="$(openssl rand -base64 32)" \
  -e BETTER_AUTH_URL=http://localhost:3000 \
  paramtune
```

## Volumes

- `redis_data`: Persistent storage for Redis data
- `auth_data`: Persistent storage for SQLite authentication data

## Ports

- `3000`: Rust application (auth uses an unpublished loopback port)
- `6379`: Redis server

## Troubleshooting

### Port Conflicts
If ports 3000 or 6379 are already in use, modify the `docker-compose.yml` file:

```yaml
ports:
  - "3001:3000"  # Change host port to 3001
```

### Redis Connection Issues
Ensure the Redis service is healthy before starting the application:

```bash
docker-compose ps redis
```

### Development Hot Reloading
If hot reloading isn't working in development:
1. Ensure your local files are properly mounted
2. Check that the `pnpm dev` command is running
3. Verify file permissions on the mounted volume

### Cleaning Up
To remove all containers and volumes:

```bash
docker-compose down -v
docker system prune -f
```

## Production Considerations

1. **Environment Variables**: Set appropriate values for production
2. **Resource Limits**: Consider adding resource limits to docker-compose
3. **SSL/TLS**: Configure reverse proxy (nginx/traefik) for HTTPS
4. **Monitoring**: Add health checks and monitoring
5. **Backups**: Implement Redis and auth database backup strategy

## Example Production docker-compose with Resource Limits

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - CORS_ORIGIN=https://yourdomain.com
      - REDIS_URL=redis://redis:6379/2
      - AUTH_DB_PATH=/app/data/auth.db
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - BETTER_AUTH_URL=https://yourdomain.com
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
    volumes:
      - auth_data:/app/data
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

volumes:
  redis_data:
  auth_data:
```
