import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

export function createAuthMiddleware(jwtSecret: string) {
  return async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, jwtSecret) as { sub: string; email: string };
      request.user = { id: payload.sub, email: payload.email };
    } catch {
      return reply.status(401).send({ error: 'Invalid or expired token' });
    }
  };
}
