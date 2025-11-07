import { loadConfig } from './config';
import { LocalStorageAdapter } from './services/storage-local';
import { ThumbnailService } from './services/thumbnail';
import { RateLimiter } from './middleware/rate-limit';
import { logger } from './utils/logger';
import { generateRequestId } from './utils/request-id';
import { getSession } from './services/auth';
import { authRoutes } from './routes/auth-routes';
import { cdnRoutes } from './routes/cdn-routes';
import { apiRoutes } from './routes/api-routes';
import type { StorageAdapter } from './types';

// Load configuration
const config = loadConfig();

// Initialize services
const storage: StorageAdapter = new LocalStorageAdapter(config.storageRoot);
const thumbnailService = new ThumbnailService(config);
const rateLimiter = new RateLimiter(config);

// Initialize route handlers
const auth = authRoutes(config);
const cdn = cdnRoutes(storage, config);
const api = apiRoutes(storage, thumbnailService, config);

// Request metrics
const metrics = {
  totalRequests: 0,
  totalErrors: 0,
  requestsByMethod: {} as Record<string, number>,
  requestsByPath: {} as Record<string, number>,
};

/**
 * Middleware: Check authentication
 */
function requireAuth(req: Request): { authenticated: boolean; session?: any } {
  const cookie = req.headers.get('Cookie');
  const sessionId = cookie?.match(/session_id=([^;]+)/)?.[1];

  if (!sessionId) {
    return { authenticated: false };
  }

  const session = getSession(sessionId);

  if (!session) {
    return { authenticated: false };
  }

  return { authenticated: true, session };
}

/**
 * Main request handler
 */
async function handleRequest(req: Request): Promise<Response> {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // Update metrics
  metrics.totalRequests++;
  metrics.requestsByMethod[method] = (metrics.requestsByMethod[method] || 0) + 1;
  metrics.requestsByPath[path] = (metrics.requestsByPath[path] || 0) + 1;

  logger.info('Request received', {
    requestId,
    method,
    path,
    userAgent: req.headers.get('User-Agent')
  });

  try {
    let response: Response;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Health check
    if (path === '/healthz') {
      return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Metrics endpoint (if enabled)
    if (path === '/metrics' && config.enableMetrics) {
      const metricsText = `
# HELP cdn_requests_total Total number of requests
# TYPE cdn_requests_total counter
cdn_requests_total ${metrics.totalRequests}

# HELP cdn_errors_total Total number of errors
# TYPE cdn_errors_total counter
cdn_errors_total ${metrics.totalErrors}

# HELP cdn_requests_by_method Requests by HTTP method
# TYPE cdn_requests_by_method counter
${Object.entries(metrics.requestsByMethod).map(([m, c]) => `cdn_requests_by_method{method="${m}"} ${c}`).join('\n')}
      `.trim();

      return new Response(metricsText, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Auth routes (public)
    if (path === '/api/auth/login' && method === 'POST') {
      response = await auth.login(req);
    } else if (path === '/api/auth/logout' && method === 'POST') {
      response = await auth.logout(req);
    } else if (path === '/api/auth/me' && method === 'GET') {
      response = await auth.me(req);
    }

    // CDN routes (public)
    else if (path.startsWith('/cdn/')) {
      const filePath = path.substring(5); // Remove '/cdn/'
      response = await cdn.serveFile(filePath, req);
    }

    // API list (public)
    else if (path === '/api/list' && method === 'GET') {
      response = await api.list(req);
    }

    // API thumbnail (public)
    else if (path === '/api/thumbnail' && method === 'GET') {
      response = await api.thumbnail(req);
    }

    // Protected API routes
    else if (path.startsWith('/api/')) {
      // Check readonly mode
      if (config.readonly && method !== 'GET') {
        return new Response(
          JSON.stringify({ error: 'Forbidden', message: 'Service is in read-only mode' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check authentication
      const authResult = requireAuth(req);

      if (!authResult.authenticated) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Rate limiting for write operations
      if (method !== 'GET') {
        const clientIp = req.headers.get('X-Forwarded-For') || req.headers.get('X-Real-IP') || 'unknown';
        const rateLimitResult = rateLimiter.check(clientIp);

        if (!rateLimitResult.allowed) {
          return new Response(
            JSON.stringify({
              error: 'Too Many Requests',
              message: 'Rate limit exceeded',
              retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
                'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              }
            }
          );
        }
      }

      // Route to appropriate handler
      if (path === '/api/upload' && method === 'POST') {
        response = await api.upload(req);
      } else if (path === '/api/mkdir' && method === 'POST') {
        response = await api.mkdir(req);
      } else if (path === '/api/move' && method === 'POST') {
        response = await api.move(req);
      } else if (path === '/api/rename' && method === 'POST') {
        response = await api.rename(req);
      } else if (path === '/api/delete' && method === 'DELETE') {
        response = await api.deleteFile(req);
      } else {
        response = new Response('Not Found', { status: 404 });
      }
    }

    // 404
    else {
      response = new Response('Not Found', { status: 404 });
    }

    // Log response
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      requestId,
      method,
      path,
      statusCode: response.status,
      duration: `${duration}ms`
    });

    // Add request ID header
    const headers = new Headers(response.headers);
    headers.set('X-Request-ID', requestId);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });

  } catch (error) {
    metrics.totalErrors++;
    const duration = Date.now() - startTime;

    logger.error('Request failed', {
      requestId,
      method,
      path,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : String(error)
    });

    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: 'An unexpected error occurred', requestId }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
        }
      }
    );
  }
}

// Start server
const server = Bun.serve({
  port: config.port,
  fetch: handleRequest,
  error(error) {
    logger.error('Server error', { error: error.message });
    return new Response('Internal Server Error', { status: 500 });
  },
});

logger.info('Server started', {
  port: config.port,
  baseUrl: config.baseUrl,
  storageType: config.storageType,
  storageRoot: config.storageRoot,
  readonly: config.readonly,
  nodeEnv: config.nodeEnv,
});

console.log(`🚀 Simple CDN server running on http://localhost:${config.port}`);
