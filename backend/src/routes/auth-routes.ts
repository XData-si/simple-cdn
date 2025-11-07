import type { Config } from '../types';
import { verifyPassword, createSession, destroySession, getSession } from '../services/auth';
import { logger } from '../utils/logger';

export function authRoutes(config: Config) {
  return {
    /**
     * POST /api/auth/login
     */
    async login(req: Request): Promise<Response> {
      try {
        const body = await req.json();
        const { username, password } = body;

        if (!username || !password) {
          return new Response(
            JSON.stringify({ error: 'Bad Request', message: 'Username and password required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Verify credentials
        if (username !== config.adminUsername || !await verifyPassword(password, config.adminPasswordHash)) {
          logger.warn('Failed login attempt', { username });
          return new Response(
            JSON.stringify({ error: 'Unauthorized', message: 'Invalid credentials' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Create session
        const sessionId = createSession(username);

        // Set cookie
        const headers = new Headers({ 'Content-Type': 'application/json' });
        headers.set(
          'Set-Cookie',
          `session_id=${sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${24 * 60 * 60}`
        );

        return new Response(
          JSON.stringify({ success: true, username }),
          { status: 200, headers }
        );
      } catch (error) {
        logger.error('Login error', { error });
        return new Response(
          JSON.stringify({ error: 'Internal Server Error', message: 'Login failed' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    },

    /**
     * POST /api/auth/logout
     */
    async logout(req: Request): Promise<Response> {
      try {
        const cookie = req.headers.get('Cookie');
        const sessionId = cookie?.match(/session_id=([^;]+)/)?.[1];

        if (sessionId) {
          destroySession(sessionId);
        }

        const headers = new Headers({ 'Content-Type': 'application/json' });
        headers.set(
          'Set-Cookie',
          'session_id=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
        );

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers }
        );
      } catch (error) {
        logger.error('Logout error', { error });
        return new Response(
          JSON.stringify({ error: 'Internal Server Error', message: 'Logout failed' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    },

    /**
     * GET /api/auth/me
     */
    async me(req: Request): Promise<Response> {
      try {
        const cookie = req.headers.get('Cookie');
        const sessionId = cookie?.match(/session_id=([^;]+)/)?.[1];

        if (!sessionId) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized', message: 'No session' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const session = getSession(sessionId);

        if (!session) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized', message: 'Invalid session' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ username: session.username }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        logger.error('Auth check error', { error });
        return new Response(
          JSON.stringify({ error: 'Internal Server Error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    },
  };
}
