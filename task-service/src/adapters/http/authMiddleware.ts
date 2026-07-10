import { FastifyRequest, FastifyReply } from 'fastify';
import { TokenVerifier } from '../../ports/outbound/TokenVerifier';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

export function createAuthMiddleware(tokenVerifier: TokenVerifier) {
  return async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.slice(7);
    try {
      const payload = tokenVerifier.verify(token);
      request.user = { id: payload.sub, email: payload.email };
    } catch {
      return reply.status(401).send({ error: 'Invalid or expired token' });
    }
  };
}
