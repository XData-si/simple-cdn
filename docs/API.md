# Simple CDN API Documentation

Complete API reference for the Simple CDN service.

## Base URL

```
http://localhost:8080  # Development
https://yourdomain.com # Production
```

## Authentication

Admin endpoints require authentication via session cookies. Session cookies are HTTP-only, Secure, and have SameSite=Strict.

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your-password"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "username": "admin"
}
```

**Response 401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid credentials"
}
```

### Logout

```http
POST /api/auth/logout
```

**Response 200 OK:**
```json
{
  "success": true
}
```

### Check Session

```http
GET /api/auth/me
```

**Response 200 OK:**
```json
{
  "username": "admin"
}
```

**Response 401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "No session"
}
```

## Public Endpoints

### Serve Static File

```http
GET /cdn/{path}
```

Serves a file with optimal cache headers.

**Headers:**
- `Cache-Control: public, max-age=31536000, immutable`
- `ETag: "..."` - Content-based hash
- `Last-Modified: ...`
- `Accept-Ranges: bytes`
- `Content-Type: image/jpeg|image/png|image/svg+xml`
- `Access-Control-Allow-Origin: *` (CORS)

For SVG files, additional security headers:
- `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; img-src data:;`
- `X-Content-Type-Options: nosniff`

**Conditional Requests:**

Supports `If-None-Match` and `If-Modified-Since` headers for 304 Not Modified responses.

```http
GET /cdn/images/photo.jpg
If-None-Match: "abc123"
```

**Range Requests:**

Supports partial content requests via `Range` header.

```http
GET /cdn/video/large.mp4
Range: bytes=0-1023
```

**Response 200 OK:**
```
<file content>
```

**Response 304 Not Modified:**
```
(empty body)
```

**Response 404 Not Found:**
```
Not Found
```

### List Files

```http
GET /api/list?path={path}
```

Lists files and folders at the specified path. Path is optional (defaults to root).

**Query Parameters:**
- `path` (optional) - Directory path to list

**Example:**
```http
GET /api/list
GET /api/list?path=images/2024
```

**Response 200 OK:**
```json
{
  "path": "images/2024",
  "items": [
    {
      "name": "subfolder",
      "path": "images/2024/subfolder",
      "type": "directory",
      "lastModified": "2025-11-06T12:00:00.000Z"
    },
    {
      "name": "photo.jpg",
      "path": "images/2024/photo.jpg",
      "type": "file",
      "size": 1048576,
      "mimeType": "image/jpeg",
      "url": "http://localhost:8080/cdn/images/2024/photo.jpg",
      "thumbnailUrl": "http://localhost:8080/api/thumbnail?path=images%2F2024%2Fphoto.jpg",
      "lastModified": "2025-11-06T12:00:00.000Z",
      "etag": "\"1730901600000-1048576\""
    }
  ],
  "totalSize": 1048576,
  "totalCount": 2
}
```

### Get Thumbnail

```http
GET /api/thumbnail?path={path}
```

Returns a thumbnail for JPG/PNG images. Generates on first request, then cached.

**Query Parameters:**
- `path` (required) - File path

**Example:**
```http
GET /api/thumbnail?path=images/photo.jpg
```

**Response 200 OK:**
```
<thumbnail image data>
Content-Type: image/jpeg
Cache-Control: public, max-age=31536000
```

**Response 404 Not Found:**
```
Thumbnail not available
```

## Admin Endpoints

All admin endpoints require authentication (session cookie).

### Upload File

```http
POST /api/upload?path={path}&overwrite={true|false}
Content-Type: multipart/form-data

<form data with "file" field>
```

**Query Parameters:**
- `path` (optional) - Destination directory path
- `overwrite` (optional) - Allow overwriting existing files (default: false)

**Form Data:**
- `file` - File to upload (JPG, PNG, or SVG)

**Validation:**
- File size must not exceed `MAX_UPLOAD_SIZE` (default: 10MB)
- Only JPG, JPEG, PNG, SVG extensions allowed
- SVG files are sanitized to remove scripts

**Example:**
```bash
curl -X POST \
  -F "file=@photo.jpg" \
  -b "session_id=..." \
  "http://localhost:8080/api/upload?path=images"
```

**Response 201 Created:**
```json
{
  "success": true,
  "path": "images/photo.jpg",
  "url": "http://localhost:8080/cdn/images/photo.jpg"
}
```

**Response 400 Bad Request:**
```json
{
  "error": "Bad Request",
  "message": "Only JPG, PNG, and SVG files are allowed"
}
```

**Response 409 Conflict:**
```json
{
  "error": "Conflict",
  "message": "File already exists. Use overwrite=true to replace."
}
```

**Response 413 Payload Too Large:**
```json
{
  "error": "Payload Too Large",
  "message": "File size exceeds limit of 10485760 bytes"
}
```

### Create Directory

```http
POST /api/mkdir
Content-Type: application/json

{
  "path": "images/2024"
}
```

**Response 201 Created:**
```json
{
  "success": true,
  "path": "images/2024"
}
```

**Response 400 Bad Request:**
```json
{
  "error": "Bad Request",
  "message": "Path required"
}
```

### Move File/Folder

```http
POST /api/move
Content-Type: application/json

{
  "src": "images/old.jpg",
  "dst": "images/2024/new.jpg"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "src": "images/old.jpg",
  "dst": "images/2024/new.jpg"
}
```

**Response 400 Bad Request:**
```json
{
  "error": "Bad Request",
  "message": "Source and destination required"
}
```

### Rename File/Folder

```http
POST /api/rename
Content-Type: application/json

{
  "path": "images/photo.jpg",
  "newName": "new-name.jpg"
}
```

Renames a file or folder in place (same directory).

**Response 200 OK:**
```json
{
  "success": true,
  "path": "images/new-name.jpg"
}
```

**Response 400 Bad Request:**
```json
{
  "error": "Bad Request",
  "message": "Path and newName required"
}
```

### Delete File/Folder

```http
DELETE /api/delete?path={path}
```

**Query Parameters:**
- `path` (required) - Path to file or directory to delete

**Example:**
```http
DELETE /api/delete?path=images/photo.jpg
```

**Response 200 OK:**
```json
{
  "success": true,
  "path": "images/photo.jpg"
}
```

**Response 400 Bad Request:**
```json
{
  "error": "Bad Request",
  "message": "Path required"
}
```

## System Endpoints

### Health Check

```http
GET /healthz
```

**Response 200 OK:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-06T12:00:00.000Z"
}
```

### Metrics

```http
GET /metrics
```

Returns Prometheus-formatted metrics (if `ENABLE_METRICS=true`).

**Response 200 OK:**
```
# HELP cdn_requests_total Total number of requests
# TYPE cdn_requests_total counter
cdn_requests_total 1234

# HELP cdn_errors_total Total number of errors
# TYPE cdn_errors_total counter
cdn_errors_total 5

# HELP cdn_requests_by_method Requests by HTTP method
# TYPE cdn_requests_by_method counter
cdn_requests_by_method{method="GET"} 1000
cdn_requests_by_method{method="POST"} 234
```

## Error Responses

All errors follow a consistent JSON format:

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "statusCode": 400,
  "requestId": "req_1730901600000_abc123"
}
```

### HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `304 Not Modified` - Cached response valid
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Read-only mode or insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., file exists)
- `413 Payload Too Large` - File too large
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Rate Limiting

Write operations (POST, DELETE) are rate-limited per IP address.

**Default limits:**
- 100 requests per 60 seconds

**Headers:**
- `X-RateLimit-Remaining` - Requests remaining in window
- `Retry-After` - Seconds until limit resets (on 429 responses)

**Response 429 Too Many Requests:**
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded",
  "retryAfter": 45
}
```

## CORS

**Public endpoints** (`/cdn/*`, `/api/list`, `/api/thumbnail`):
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, HEAD, OPTIONS`

**Admin endpoints** (`/api/*` write operations):
- CORS restricted to same origin

## Security Considerations

### Path Traversal
All paths are normalized and validated. Attempts to use `../` are rejected.

### File Type Validation
- Client-side: File extension checked
- Server-side: MIME type and extension validated
- SVG: Content sanitized to remove scripts and event handlers

### Session Security
- HTTP-only cookies (not accessible via JavaScript)
- Secure flag (HTTPS only in production)
- SameSite=Strict (CSRF protection)
- 24-hour expiry
- Auto-cleanup of expired sessions

### Content Security Policy
SVG files served with strict CSP:
```
Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; img-src data:;
```

## Examples

### Upload and Share Image

```bash
# 1. Login
curl -c cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"secret"}' \
  http://localhost:8080/api/auth/login

# 2. Upload image
curl -b cookies.txt -X POST \
  -F "file=@photo.jpg" \
  http://localhost:8080/api/upload?path=images

# Response includes public URL:
# {"success":true,"path":"images/photo.jpg","url":"http://localhost:8080/cdn/images/photo.jpg"}

# 3. Share the public URL (no auth required)
# http://localhost:8080/cdn/images/photo.jpg
```

### Organize Files

```bash
# Create folder
curl -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{"path":"images/2024"}' \
  http://localhost:8080/api/mkdir

# Move file into folder
curl -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{"src":"photo.jpg","dst":"images/2024/photo.jpg"}' \
  http://localhost:8080/api/move

# Rename file
curl -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{"path":"images/2024/photo.jpg","newName":"summer.jpg"}' \
  http://localhost:8080/api/rename
```

### List and Browse

```bash
# List root
curl http://localhost:8080/api/list

# List subfolder
curl http://localhost:8080/api/list?path=images/2024

# Get thumbnail
curl http://localhost:8080/api/thumbnail?path=images/2024/summer.jpg > thumb.jpg
```
