import { hash, verify } from '@node-rs/argon2';
import { randomBytes } from 'crypto';
import type { Session } from '../types';
import { logger } from '../utils/logger';

// In-memory session storage (use Redis in production for scaling)
const sessions = new Map<string, Session>();

// Session expiry: 24 hours
const SESSION_EXPIRY = 24 * 60 * 60 * 1000;

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await verify(hash, password);
  } catch (error) {
    logger.error('Password verification failed', { error });
    return false;
  }
}

/**
 * Create a new session for user
 */
export function createSession(username: string): string {
  const sessionId = randomBytes(32).toString('hex');

  const session: Session = {
    id: sessionId,
    username,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };

  sessions.set(sessionId, session);

  logger.info('Session created', { username, sessionId });

  return sessionId;
}

/**
 * Get session by ID
 */
export function getSession(sessionId: string): Session | null {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  // Check if session expired
  if (Date.now() - session.lastActivity > SESSION_EXPIRY) {
    sessions.delete(sessionId);
    logger.info('Session expired', { sessionId });
    return null;
  }

  // Update last activity
  session.lastActivity = Date.now();
  sessions.set(sessionId, session);

  return session;
}

/**
 * Destroy session
 */
export function destroySession(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    sessions.delete(sessionId);
    logger.info('Session destroyed', { sessionId, username: session.username });
  }
}

/**
 * Clean up expired sessions (call periodically)
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActivity > SESSION_EXPIRY) {
      sessions.delete(id);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.info('Cleaned up expired sessions', { count: cleaned });
  }
}

// Cleanup expired sessions every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
